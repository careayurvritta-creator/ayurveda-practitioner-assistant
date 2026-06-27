import { parseQuery, expandQuery, type ParsedQuery } from './query.ts';
import { embed } from './embeddings.ts';
import { vectorSearch, fullTextSearch, type KnowledgeChunk } from './knowledge.ts';
import { fetchResearchArticles, type ResearchArticle } from './research.ts';

export interface RetrievalOptions {
  matchThreshold?: number;
  matchCount?: number;
  categoryFilter?: string[];
  sourceFilter?: string[];
  tokenBudget?: number;
  surface: 'chat' | 'clinical-docs' | 'treatment-protocol';
  doResearch?: boolean;
  skipSerpAPI?: boolean;
}

export interface RetrievalResult {
  chunks: KnowledgeChunk[];
  researchArticles: ResearchArticle[];
  query: ParsedQuery;
  variants: string[];
  totalTokens: number;
}

const SURFACE_CONFIGS: Record<string, { matchCount: number; tokenBudget: number; categoryBias: string[] }> = {
  chat: { matchCount: 15, tokenBudget: 8000, categoryBias: ['disease', 'herb_monograph', 'treatment', 'fundamentals'] },
  'clinical-docs': { matchCount: 20, tokenBudget: 12000, categoryBias: ['disease', 'herb_monograph', 'treatment', 'allopathy_integration', 'diagnostics'] },
  'treatment-protocol': { matchCount: 25, tokenBudget: 16000, categoryBias: ['disease', 'herb_monograph', 'treatment', 'classical_text', 'fundamentals'] },
};

function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function truncateToBudget(chunks: KnowledgeChunk[], budget: number): KnowledgeChunk[] {
  const result: KnowledgeChunk[] = [];
  let used = 0;
  for (const chunk of chunks) {
    const tokens = countTokens(chunk.content);
    if (used + tokens > budget) break;
    result.push(chunk);
    used += tokens;
  }
  return result;
}

function deduplicateChunks(chunks: KnowledgeChunk[]): KnowledgeChunk[] {
  const seen = new Set<string>();
  return chunks.filter(c => {
    const key = `${c.source}:${c.category}:${c.content.slice(0, 200)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function enforceSourceDiversity(chunks: KnowledgeChunk[], maxPerSource: number = 3): KnowledgeChunk[] {
  const counts = new Map<string, number>();
  return chunks.filter(c => {
    const n = counts.get(c.source) ?? 0;
    if (n >= maxPerSource) return false;
    counts.set(c.source, n + 1);
    return true;
  });
}

function boostByIntent(chunks: KnowledgeChunk[], intent: string, surface: string): KnowledgeChunk[] {
  const boosted = chunks.map(c => {
    let score = c.similarity;
    const cat = c.category;
    const intentBoosts: Record<string, string[]> = {
      herb: ['herb_monograph', 'drug_interaction'],
      disease: ['disease', 'classical_text'],
      treatment: ['treatment', 'classical_text'],
      diet: ['dietary_guideline', 'pathya_apathya'],
      dosha: ['fundamentals', 'diagnostics'],
      diagnosis: ['diagnostics', 'fundamentals'],
      general: [],
    };
    const preferred = intentBoosts[intent] ?? [];
    if (preferred.includes(cat)) score += 0.1;

    const surfaceBoosts: Record<string, string[]> = {
      chat: ['fundamentals', 'disease'],
      'clinical-docs': ['disease', 'herb_monograph'],
      'treatment-protocol': ['classical_text', 'disease', 'treatment'],
    };
    const surfacePreferred = surfaceBoosts[surface] ?? [];
    if (surfacePreferred.includes(cat)) score += 0.05;

    return { ...c, similarity: Math.min(score, 1.0) };
  });

  return boosted.sort((a, b) => b.similarity - a.similarity);
}

export async function retrieve(query: string, options: RetrievalOptions): Promise<RetrievalResult> {
  const config = SURFACE_CONFIGS[options.surface];
  const parsed = parseQuery(query);
  const variants = expandQuery(query, parsed.intent, parsed.entities);

  const embedding = await embed(variants[0]);

  const vectorResults = await vectorSearch(embedding.embedding, {
    matchThreshold: options.matchThreshold ?? 0.7,
    matchCount: options.matchCount ?? config.matchCount,
    categoryFilter: options.categoryFilter,
    sourceFilter: options.sourceFilter,
  });

  let keywordResults: KnowledgeChunk[] = [];
  try {
    keywordResults = await fullTextSearch(query, 10);
  } catch { /* no-op */ }

  const allChunks = [...vectorResults, ...keywordResults];
  const deduped = deduplicateChunks(allChunks);
  const boosted = boostByIntent(deduped, parsed.intent, options.surface);
  const diverse = enforceSourceDiversity(boosted, 3);
  const truncated = truncateToBudget(diverse, options.tokenBudget ?? config.tokenBudget);

  let researchArticles: ResearchArticle[] = [];
  if (options.doResearch && (options.surface === 'treatment-protocol')) {
    researchArticles = await fetchResearchArticles(parsed.primaryCondition, {
      skipSerpAPI: options.skipSerpAPI,
    });
  }

  return {
    chunks: truncated,
    researchArticles,
    query: parsed,
    variants,
    totalTokens: truncated.reduce((sum, c) => sum + countTokens(c.content), 0),
  };
}