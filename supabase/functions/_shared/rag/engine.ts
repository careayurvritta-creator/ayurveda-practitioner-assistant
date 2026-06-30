import { parseQuery, expandQuery, CLINICAL_PATHWAYS, type ParsedQuery } from './query.ts';
import { embed } from './embeddings.ts';
import { vectorSearch, fullTextSearch, hybridSearch, type KnowledgeChunk } from './knowledge.ts';
import { fetchResearchArticles, type ResearchArticle } from './research.ts';
import { rerankChunks, type RerankerConfig } from './reranker.ts';

export interface RetrievalOptions {
  matchThreshold?: number;
  matchCount?: number;
  categoryFilter?: string[];
  sourceFilter?: string[];
  tokenBudget?: number;
  surface: 'chat' | 'clinical-docs' | 'treatment-protocol';
  doResearch?: boolean;
  skipSerpAPI?: boolean;
  enableRerank?: boolean;
  history?: Array<{ role: string; content: string }>;
}

export interface RetrievalResult {
  chunks: KnowledgeChunk[];
  researchArticles: ResearchArticle[];
  query: ParsedQuery;
  variants: string[];
  totalTokens: number;
  clinicalPathwayContext: string | null;
  retrievalMetadata: {
    vectorCount: number;
    keywordCount: number;
    afterDedup: number;
    afterRerank: boolean;
    latencyMs: number;
    hybridUsed: boolean;
  };
}

const SURFACE_CONFIGS: Record<string, { matchCount: number; tokenBudget: number; categoryBias: string[]; rerankerTopN: number }> = {
  chat: { matchCount: 15, tokenBudget: 8000, categoryBias: ['disease', 'herb_monograph', 'treatment', 'fundamentals'], rerankerTopN: 8 },
  'clinical-docs': { matchCount: 20, tokenBudget: 12000, categoryBias: ['disease', 'herb_monograph', 'treatment', 'allopathy_integration', 'diagnostics'], rerankerTopN: 12 },
  'treatment-protocol': { matchCount: 25, tokenBudget: 16000, categoryBias: ['disease', 'herb_monograph', 'treatment', 'classical_text', 'fundamentals'], rerankerTopN: 15 },
};

function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Add structured citation markers to chunks for source attribution.
 * Format: [source:category] Title
 */
function addCitationMarkers(chunks: KnowledgeChunk[]): KnowledgeChunk[] {
  return chunks.map(c => {
    const citation = `[${c.source}:${c.category}]${c.title ? ` ${c.title}` : ''}`;
    const alreadyCited = c.content.startsWith('[');
    if (alreadyCited) return c;
    return {
      ...c,
      content: `${citation}\n${c.content}`,
    };
  });
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
      herb: ['herb_monograph', 'drug_interaction', 'materia_medica'],
      disease: ['disease', 'classical_text', 'pathology'],
      treatment: ['treatment', 'classical_text', 'therapeutics'],
      diet: ['dietary_guideline', 'pathya_apathya', 'dietetics'],
      dosha: ['fundamentals', 'diagnostics', 'core_concepts'],
      diagnosis: ['diagnostics', 'fundamentals', 'pathology'],
      procedure: ['therapeutics', 'treatment', 'classical_text'],
      formulation: ['formulations', 'herb_monograph', 'classical_text'],
      general: [],
    };
    const preferred = intentBoosts[intent] ?? [];
    if (preferred.includes(cat)) score += 0.12;

    const surfaceBoosts: Record<string, string[]> = {
      chat: ['fundamentals', 'disease', 'herb_monograph'],
      'clinical-docs': ['disease', 'herb_monograph', 'diagnostics'],
      'treatment-protocol': ['classical_text', 'disease', 'treatment', 'therapeutics'],
    };
    const surfacePreferred = surfaceBoosts[surface] ?? [];
    if (surfacePreferred.includes(cat)) score += 0.05;

    return { ...c, similarity: Math.min(score, 1.0) };
  });

  return boosted.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Reciprocal Rank Fusion (RRF) — merges ranked lists from multiple retrievers.
 * score(d) = sum over retrievers: 1 / (k + rank_i(d)) where k=60 (standard).
 * Chunks appearing in both lists get boosted, resolving the vector-vs-keyword
 * precision gap. RRF outperforms score-averaging on production RAG stacks.
 */
function reciprocalRankFusion(
  vectorResults: KnowledgeChunk[],
  keywordResults: KnowledgeChunk[],
  k: number = 60
): KnowledgeChunk[] {
  const rrfScores = new Map<string, number>();

  vectorResults.forEach((chunk, index) => {
    const key = `${chunk.source}:${chunk.category}:${chunk.content.slice(0, 150)}`;
    const existing = rrfScores.get(key) ?? 0;
    rrfScores.set(key, existing + 1 / (k + index + 1));
  });

  keywordResults.forEach((chunk, index) => {
    const key = `${chunk.source}:${chunk.category}:${chunk.content.slice(0, 150)}`;
    const existing = rrfScores.get(key) ?? 0;
    rrfScores.set(key, existing + 1 / (k + index + 1));
  });

  const allChunks = new Map<string, KnowledgeChunk>();
  [...vectorResults, ...keywordResults].forEach(chunk => {
    const key = `${chunk.source}:${chunk.category}:${chunk.content.slice(0, 150)}`;
    if (!allChunks.has(key)) allChunks.set(key, chunk);
  });

  return Array.from(allChunks.entries())
    .sort((a, b) => (rrfScores.get(b[0]) ?? 0) - (rrfScores.get(a[0]) ?? 0))
    .map(([_, chunk]) => ({
      ...chunk,
      similarity: rrfScores.get(`${chunk.source}:${chunk.category}:${chunk.content.slice(0, 150)}`) ?? chunk.similarity,
    }));
}

/**
 * Build a clinical pathway context block from the WHO ITA knowledge graph.
 * This provides structured treatment patterns, herb lists, and procedures
 * for known diseases.
 */
function buildClinicalPathwayContext(pathwayKey: string): string | null {
  const pathway = CLINICAL_PATHWAYS[pathwayKey];
  if (!pathway) return null;

  const lines: string[] = [
    `CLINICAL PATHWAY for ${pathway.diagnosis}:`,
    `- Dominant Dosha: ${pathway.dosha}`,
    `- Treatment Strategy: ${pathway.treatment}`,
    `- Key Herbs: ${pathway.herbs.join(', ')}`,
    `- Relevant Procedures: ${pathway.procedures.join(', ')}`,
  ];

  return lines.join('\n');
}

/**
 * Detect if the query is about a specific disease from clinical pathways
 * and inject pathway context into the retrieval.
 */
function findPathwayMatch(query: string, entities: string[]): string | null {
  const lower = query.toLowerCase();

  // Direct match on entities
  for (const entity of entities) {
    const key = entity.toLowerCase();
    if (CLINICAL_PATHWAYS[key]) return key;
  }

  // Fuzzy match on query text
  for (const pathwayKey of Object.keys(CLINICAL_PATHWAYS)) {
    if (lower.includes(pathwayKey)) return pathwayKey;
  }

  return null;
}

export async function retrieve(query: string, options: RetrievalOptions): Promise<RetrievalResult> {
  const startTime = Date.now();
  const config = SURFACE_CONFIGS[options.surface];

  // Parse query with follow-up detection and rewriting
  const parsed = parseQuery(query, options.history);
  const effectiveQuery = parsed.rewrittenQuery;
  const variants = expandQuery(effectiveQuery, parsed.intent, parsed.entities);

  // Try hybrid search first, fall back to vector + keyword
  const embedding = await embed(variants[0], 'query');
  let vectorResults: KnowledgeChunk[] = [];
  let keywordResults: KnowledgeChunk[] = [];
  let hybridUsed = false;

  try {
    // Use hybrid search when available — combines vector similarity + FTS
    const hybridResults = await hybridSearch(embedding.embedding, effectiveQuery, {
      matchThreshold: options.matchThreshold ?? 0.7,
      matchCount: options.matchCount ?? config.matchCount,
      categoryFilter: options.categoryFilter,
      sourceFilter: options.sourceFilter,
    });

    if (hybridResults.length > 0) {
      vectorResults = hybridResults;
      keywordResults = [];
      hybridUsed = true;
    }
  } catch {
    // Fall back to separate vector + keyword search
  }

  if (!hybridUsed) {
    [vectorResults, keywordResults] = await Promise.all([
      vectorSearch(embedding.embedding, {
        matchThreshold: options.matchThreshold ?? 0.7,
        matchCount: options.matchCount ?? config.matchCount,
        categoryFilter: options.categoryFilter,
        sourceFilter: options.sourceFilter,
      }),
      fullTextSearch(effectiveQuery, 10).catch(() => []),
    ]);
  }

  const fused = hybridUsed
    ? vectorResults
    : reciprocalRankFusion(vectorResults, keywordResults);

  const deduped = deduplicateChunks(fused);
  const boosted = boostByIntent(deduped, parsed.intent, options.surface);

  let reranked = false;
  let finalChunks = boosted;
  if (options.enableRerank !== false) {
    try {
      finalChunks = await rerankChunks(effectiveQuery, boosted, {
        topN: config.rerankerTopN,
      });
      reranked = true;
    } catch (e) {
      console.warn('Reranker failed, falling back to RRF-sorted results:', e);
    }
  }

  const diverse = enforceSourceDiversity(finalChunks, 3);
  const cited = addCitationMarkers(diverse);
  const truncated = truncateToBudget(cited, options.tokenBudget ?? config.tokenBudget);

  // Build clinical pathway context if a known disease is detected
  let clinicalPathwayContext: string | null = null;
  const pathwayKey = parsed.clinicalPathway ?? findPathwayMatch(effectiveQuery, parsed.entities);
  if (pathwayKey) {
    clinicalPathwayContext = buildClinicalPathwayContext(pathwayKey);
  }

  let researchArticles: ResearchArticle[] = [];
  if (options.doResearch && (options.surface === 'treatment-protocol')) {
    try {
      researchArticles = await fetchResearchArticles(parsed.primaryCondition, {
        skipSerpAPI: options.skipSerpAPI,
      });
    } catch (e) {
      console.warn('Research fetch failed, continuing without research:', e);
    }
  }

  return {
    chunks: truncated,
    researchArticles,
    query: parsed,
    variants,
    totalTokens: truncated.reduce((sum, c) => sum + countTokens(c.content), 0),
    clinicalPathwayContext,
    retrievalMetadata: {
      vectorCount: vectorResults.length,
      keywordCount: keywordResults.length,
      afterDedup: deduped.length,
      afterRerank: reranked,
      latencyMs: Date.now() - startTime,
      hybridUsed,
    },
  };
}
