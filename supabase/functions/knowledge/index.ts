/**
 * Knowledge Search — RAG-powered semantic search over the Ayurvedic KB.
 * Public endpoint for searching diseases, herbs, treatments, Charaka Samhita.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { db } from '../_shared/db.ts';
import { expandAyurvedicQuery, rankResults } from '../../../knowledge-base/rag-engine.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors(204);

  const url = new URL(req.url);
  const query = url.searchParams.get('q') || '';
  const type = url.searchParams.get('type') || ''; // 'disease' | 'herb' | 'treatment' | 'all'

  if (!query) return json({ error: 'Missing query param ?q=' }, 400);

  try {
    const expandedQuery = expandAyurvedicQuery(query);

    // 1. Vector + text search via hybrid_search
    const { data: chunks, error: ragError } = await db.rpc('hybrid_search', {
      query: expandedQuery,
      max_results: 15,
    });
    if (ragError) throw ragError;

    // 2. Optionally filter by type
    let results = chunks || [];
    if (type) {
      results = results.filter((r: any) => r.table_name === type);
    }

    // 3. Rerank
    results = rankResults(results, expandedQuery);

    return json({ query: expandedQuery, results });
  } catch (err: any) {
    return json({ error: err.message }, err.status ?? 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}

function cors(status: number) {
  return new Response(null, { status, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
