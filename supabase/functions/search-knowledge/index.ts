import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders, corsPreflightResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse(req);

  try {
    const { query, type = 'hybrid', limit = 10 } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return errorResponse(req, 'Query is required', 400);
    }

    const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get query embedding for vector search
    let queryEmbedding: number[] | null = null;
    try {
      const { data: embedData, error: embedError } = await client.functions.invoke('chat', {
        body: { action: 'embed', text: query },
      });
      if (!embedError && embedData?.embedding) {
        queryEmbedding = embedData.embedding;
      }
    } catch {
      // Embedding not available, fallback to FTS only
    }

    let results: any[] = [];

    if (type === 'vector' && queryEmbedding) {
      // Vector search only
      const { data, error } = await client.rpc('match_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
        category_filter: [],
        source_filter: [],
      });
      if (!error && data) results = data;
    } else if (type === 'fts' || !queryEmbedding) {
      // Full-text search
      const tsQuery = query
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2)
        .map(w => `${w}:*`)
        .join(' & ');

      if (tsQuery) {
        const { data, error } = await client.rpc('match_knowledge_fts', {
          query_text: query,
          match_count: limit,
        }).catch(() => ({ data: null, error: new Error('RPC not available') }));

        if (error || !data) {
          // Fallback to direct FTS
          const { data: fallbackData } = await client
            .from('knowledge_embeddings')
            .select('id, content, source, category, title, metadata')
            .textSearch('content', tsQuery, { type: 'websearch' })
            .limit(limit);

          if (fallbackData) {
            results = fallbackData.map((row: any, index: number) => ({
              ...row,
              similarity: Math.max(0.3, 0.8 - (index * 0.05)),
            }));
          }
        } else {
          results = data;
        }
      }
    } else {
      // Hybrid search (vector + FTS)
      const { data, error } = await client.rpc('match_knowledge_hybrid', {
        query_embedding: queryEmbedding,
        query_text: query,
        match_threshold: 0.7,
        match_count: limit,
        category_filter: [],
        source_filter: [],
      });
      if (!error && data) {
        results = data;
      } else {
        // Fallback to vector search
        const { data: vectorData } = await client.rpc('match_knowledge', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: limit,
          category_filter: [],
          source_filter: [],
        });
        if (vectorData) results = vectorData;
      }
    }

    return jsonResponse(req, {
      results: results.slice(0, limit),
      query,
      type,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return errorResponse(req, error.message || 'Search failed', 500);
  }
});
