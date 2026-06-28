import type { KnowledgeChunk } from './knowledge.ts';

export interface RerankerConfig {
  topN?: number;
  model?: string;
}

const COHERE_API_KEY = Deno.env.get('COHERE_API_KEY');
const RERANK_MODEL = 'rerank-v3.5';

/**
 * Cross-encoder reranker using Cohere Rerank v3.5.
 * Retrieves top 50-100 candidates, reranks to top N.
 * Cross-encoders process query+document jointly, achieving
 * 10-20% precision lift over bi-encoder retrieval at ~50ms latency.
 *
 * Falls back to no-op if COHERE_API_KEY is not set.
 */
export async function rerankChunks(
  query: string,
  chunks: KnowledgeChunk[],
  config: RerankerConfig = {}
): Promise<KnowledgeChunk[]> {
  const { topN = 10, model = RERANK_MODEL } = config;

  if (!COHERE_API_KEY || chunks.length === 0) return chunks.slice(0, topN);

  const documents = chunks.map(c => {
    const prefix = `[${c.source}:${c.category}]${c.title ? ` ${c.title}` : ''}\n`;
    return prefix + c.content.slice(0, 2000);
  });

  try {
    const response = await fetch('https://api.cohere.ai/v1/rerank', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        query,
        documents,
        top_n: topN,
        rank_fields: ['text'],
        return_documents: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Cohere rerank API error:', response.status, errText);
      return chunks.slice(0, topN);
    }

    const result = await response.json();
    const results = result.results ?? [];

    return results
      .sort((a: any, b: any) => b.relevance_score - a.relevance_score)
      .map((r: any) => ({
        ...chunks[r.index],
        similarity: r.relevance_score,
      }));
  } catch (e) {
    console.error('Cohere rerank failed:', e);
    return chunks.slice(0, topN);
  }
}
