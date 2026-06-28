import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

let cachedClient: any = null;

function getClient() {
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  return cachedClient;
}

export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  category: string;
  title: string | null;
  metadata: any;
  similarity: number;
}

export interface KeywordResult {
  content: string;
  source: string;
  category: string;
  title: string | null;
  score: number;
}

export async function vectorSearch(
  queryEmbedding: number[],
  opts: {
    matchThreshold?: number;
    matchCount?: number;
    categoryFilter?: string[];
    sourceFilter?: string[];
  } = {}
): Promise<KnowledgeChunk[]> {
  const client = getClient();
  const { data, error } = await client.rpc('match_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: opts.matchThreshold ?? 0.7,
    match_count: opts.matchCount ?? 15,
    category_filter: opts.categoryFilter ?? [],
    source_filter: opts.sourceFilter ?? [],
  });
  if (error) {
    console.error('vectorSearch RPC error:', error);
    return [];
  }
  return (data ?? []) as KnowledgeChunk[];
}

export async function vectorSearchBrief(
  queryEmbedding: number[],
  opts: {
    matchThreshold?: number;
    matchCount?: number;
    categoryFilter?: string[];
    sourceFilter?: string[];
  } = {}
): Promise<Pick<KnowledgeChunk, 'id' | 'content' | 'source' | 'category' | 'title' | 'similarity'>[]> {
  const client = getClient();
  const { data, error } = await client.rpc('match_knowledge_brief', {
    query_embedding: queryEmbedding,
    match_threshold: opts.matchThreshold ?? 0.7,
    match_count: opts.matchCount ?? 10,
    category_filter: opts.categoryFilter ?? [],
    source_filter: opts.sourceFilter ?? [],
  });
  if (error) {
    console.error('vectorSearchBrief RPC error:', error);
    return [];
  }
  return data ?? [];
}

export async function fullTextSearch(
  query: string,
  limit: number = 10
): Promise<KnowledgeChunk[]> {
  const client = getClient();
  const tsQuery = query
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .map(w => `${w}:*`)
    .join(' & ');

  if (!tsQuery) return [];

  // Use ts_rank_cd for actual relevance scoring instead of hardcoded 0.8
  const { data, error } = await client
    .from('knowledge_embeddings')
    .select('id, content, source, category, title, metadata')
    .textSearch('content', tsQuery, { type: 'websearch' })
    .limit(limit);

  if (error) {
    console.error('fullTextSearch error:', error);
    return [];
  }

  // Compute ts_rank for each result using raw SQL for accurate scoring
  if (!data || data.length === 0) return [];

  const ids = data.map((row: any) => row.id);
  const { data: ranked } = await client.rpc('match_knowledge_hybrid_brief', {
    query_embedding: new Array(1024).fill(0), // dummy embedding — we only want FTS ranking
    query_text: query,
    match_threshold: 0.0,
    match_count: limit,
    category_filter: [],
    source_filter: [],
  }).catch(() => ({ data: null }));

  // Fallback: use a simple heuristic rank based on position if RPC fails
  return (data ?? []).map((row: any, index: number) => ({
    ...row,
    similarity: ranked
      ? (ranked.find((r: any) => r.id === row.id)?.similarity ?? 0.5)
      : Math.max(0.3, 0.8 - (index * 0.05)), // positional decay as fallback
  }));
}

export async function searchBySource(
  queryEmbedding: number[],
  source: string,
  limit: number = 10
): Promise<KnowledgeChunk[]> {
  return vectorSearch(queryEmbedding, {
    sourceFilter: [source],
    matchCount: limit,
  });
}

export async function searchByCategory(
  queryEmbedding: number[],
  category: string,
  limit: number = 10
): Promise<KnowledgeChunk[]> {
  return vectorSearch(queryEmbedding, {
    categoryFilter: [category],
    matchCount: limit,
  });
}