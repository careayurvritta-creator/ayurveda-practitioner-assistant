import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, corsPreflightResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { authUid, serviceRoleClient } from '../_shared/db.ts';
import { embed } from '../_shared/rag/embeddings.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse(req);
  if (req.method !== 'POST') return errorResponse(req, 'Method not allowed', 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse(req, 'Authorization required', 401);

    const jwt = authHeader.replace('Bearer ', '');
    const userId = await authUid(jwt);
    if (!userId) return errorResponse(req, 'Invalid token', 401);

    const { query, type = 'hybrid', limit = 10, categoryFilter = [], sourceFilter = [] } = await req.json();

    const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 50);

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return errorResponse(req, 'Query is required', 400);
    }

    const client = serviceRoleClient();

    // Get query embedding directly via shared embed() — no circular dependency
    let queryEmbedding: number[] | null = null;
    try {
      const embeddingResult = await embed(query, 'query');
      queryEmbedding = embeddingResult.embedding;
    } catch {
      // Embedding not available, fallback to FTS only
    }

    let results: any[] = [];

    if (type === 'vector' && queryEmbedding) {
      const { data, error } = await client.rpc('match_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: safeLimit * 2,
        category_filter: categoryFilter,
        source_filter: sourceFilter,
      });
      if (!error && data) results = data;
    } else if (type === 'fts' || !queryEmbedding) {
      const { data, error } = await client.rpc('match_knowledge_fts', {
        query_text: query,
        match_count: safeLimit * 2,
      }).catch(() => ({ data: null, error: new Error('RPC not available') }));

      if (error || !data) {
        const tsQuery = query
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 2)
          .map(w => `${w}:*`)
          .join(' & ');

        if (tsQuery) {
          const { data: fallbackData } = await client
            .from('knowledge_embeddings')
            .select('id, content, source, category, title, metadata')
            .textSearch('content', tsQuery, { type: 'websearch' })
            .limit(safeLimit * 2);

          if (fallbackData) {
            results = fallbackData.map((row: any, index: number) => ({
              ...row,
              similarity: Math.max(0.3, 0.8 - (index * 0.05)),
            }));
          }
        }
      } else {
        results = data;
      }
    } else {
      // Hybrid search — now with proper RRF in SQL
      const { data, error } = await client.rpc('match_knowledge_hybrid', {
        query_embedding: queryEmbedding,
        query_text: query,
        match_threshold: 0.7,
        match_count: safeLimit * 2,
        category_filter: categoryFilter,
        source_filter: sourceFilter,
      });
      if (!error && data) {
        results = data;
      } else {
        // Fallback to vector search
        const { data: vectorData } = await client.rpc('match_knowledge', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: safeLimit * 2,
          category_filter: categoryFilter,
          source_filter: sourceFilter,
        });
        if (vectorData) results = vectorData;
      }
    }

    // Deduplicate results
    const seen = new Set<string>();
    const deduped = results.filter((r: any) => {
      const key = `${r.source}:${r.category}:${r.content?.slice(0, 150)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return jsonResponse(req, {
      results: deduped.slice(0, safeLimit),
      query,
      type,
      count: Math.min(deduped.length, safeLimit),
    });
  } catch (error) {
    console.error('Search error:', error);
    return errorResponse(req, error.message || 'Search failed', 500);
  }
});
