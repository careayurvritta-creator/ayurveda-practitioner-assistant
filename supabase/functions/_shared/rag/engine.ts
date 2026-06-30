import { parseQuery, expandQuery, CLINICAL_PATHWAYS, type ParsedQuery } from './query.ts';
import { embed, embedBatch } from './embeddings.ts';
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
    variantsSearched: number;
  };
}

// Complexity-scaled configuration
const SURFACE_CONFIGS: Record<string, {
  simple: { matchCount: number; tokenBudget: number; rerankerTopN: number };
  moderate: { matchCount: number; tokenBudget: number; rerankerTopN: number };
  complex: { matchCount: number; tokenBudget: number; rerankerTopN: number };
  categoryBias: string[];
}> = {
  chat: {
    simple:  { matchCount: 10, tokenBudget: 4000,  rerankerTopN: 5 },
    moderate: { matchCount: 15, tokenBudget: 8000,  rerankerTopN: 8 },
    complex: { matchCount: 25, tokenBudget: 12000, rerankerTopN: 12 },
    categoryBias: ['disease', 'herb_monograph', 'treatment', 'fundamentals'],
  },
  'clinical-docs': {
    simple:  { matchCount: 12, tokenBudget: 6000,  rerankerTopN: 6 },
    moderate: { matchCount: 20, tokenBudget: 12000, rerankerTopN: 10 },
    complex: { matchCount: 30, tokenBudget: 16000, rerankerTopN: 14 },
    categoryBias: ['disease', 'herb_monograph', 'treatment', 'allopathy_integration', 'diagnostics'],
  },
  'treatment-protocol': {
    simple:  { matchCount: 15, tokenBudget: 8000,  rerankerTopN: 8 },
    moderate: { matchCount: 25, tokenBudget: 16000, rerankerTopN: 12 },
    complex: { matchCount: 35, tokenBudget: 20000, rerankerTopN: 15 },
    categoryBias: ['disease', 'herb_monograph', 'treatment', 'classical_text', 'fundamentals'],
  },
};

/**
 * Accuracy-aware token counting.
 * Devanagari characters consume ~1.5 tokens (complex conjuncts).
 * Latin/other characters: ~0.25 tokens per char (4 chars per token).
 */
function countTokens(text: string): number {
  const devanagariChars = (text.match(/[\u0900-\u097F]/g) || []).length;
  const otherChars = text.length - devanagariChars;
  return Math.ceil(devanagariChars * 1.5 + otherChars * 0.25);
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
 * Reciprocal Rank Fusion (RRF) — merges multiple ranked lists.
 * score(d) = sum over retrievers: 1 / (k + rank_i(d)) where k=60 (standard).
 * Used to merge results from multiple query variant searches.
 */
function reciprocalRankFusion(lists: KnowledgeChunk[][], k: number = 60): KnowledgeChunk[] {
  const rrfScores = new Map<string, number>();
  const chunkMap = new Map<string, KnowledgeChunk>();

  for (const list of lists) {
    list.forEach((chunk, index) => {
      const key = `${chunk.source}:${chunk.category}:${chunk.content.slice(0, 150)}`;
      const existing = rrfScores.get(key) ?? 0;
      rrfScores.set(key, existing + 1 / (k + index + 1));
      if (!chunkMap.has(key)) chunkMap.set(key, chunk);
    });
  }

  return Array.from(rrfScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, score]) => ({
      ...chunkMap.get(key)!,
      similarity: score,
    }));
}

/**
 * Merge two ranked lists using RRF (for vector + keyword fallback).
 */
function mergeVectorKeyword(
  vectorResults: KnowledgeChunk[],
  keywordResults: KnowledgeChunk[],
  k: number = 60
): KnowledgeChunk[] {
  return reciprocalRankFusion([vectorResults, keywordResults], k);
}

/**
 * Build a clinical pathway context block from the WHO ITA knowledge graph.
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
 * Detect if the query is about a specific disease from clinical pathways.
 */
function findPathwayMatch(query: string, entities: string[]): string | null {
  const lower = query.toLowerCase();

  for (const entity of entities) {
    const key = entity.toLowerCase();
    if (CLINICAL_PATHWAYS[key]) return key;
  }

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

  // Complexity-scaled retrieval parameters
  const complexityConfig = config[parsed.complexity] ?? config.moderate;
  const matchCount = options.matchCount ?? complexityConfig.matchCount;
  const tokenBudget = options.tokenBudget ?? complexityConfig.tokenBudget;
  const rerankerTopN = options.enableRerank !== false ? complexityConfig.rerankerTopN : matchCount;

  // Category filter: use surface categoryBias as actual retrieval filter
  const categoryFilter = options.categoryFilter ?? config.categoryBias;

  // === MULTI-QUERY RETRIEVAL ===
  // Embed all variants (up to 3 for latency — primary + 2 best alternatives)
  const variantsToEmbed = variants.slice(0, 3);
  let embeddings: (EmbeddingResult | null)[];

  try {
    embeddings = await embedBatch(variantsToEmbed, 'query');
  } catch {
    // Fallback to single embedding
    const single = await embed(variantsToEmbed[0], 'query');
    embeddings = [single];
  }

  // Collect results from all variants
  const allVariantResults: KnowledgeChunk[][] = [];
  let totalVectorCount = 0;
  let totalKeywordCount = 0;
  let hybridUsed = false;

  for (let i = 0; i < embeddings.length; i++) {
    const emb = embeddings[i];
    if (!emb) continue;

    const variantQuery = variantsToEmbed[i];

    // Try hybrid search (now with proper RRF in SQL)
    try {
      const hybridResults = await hybridSearch(emb.embedding, variantQuery, {
        matchThreshold: options.matchThreshold ?? 0.7,
        matchCount,
        categoryFilter,
        sourceFilter: options.sourceFilter,
      });

      if (hybridResults.length > 0) {
        allVariantResults.push(hybridResults);
        totalVectorCount += hybridResults.length;
        hybridUsed = true;
        continue;
      }
    } catch {
      // Fall back to separate vector + keyword search
    }

    // Fallback: separate vector + keyword
    const [vectorResults, keywordResults] = await Promise.all([
      vectorSearch(emb.embedding, {
        matchThreshold: options.matchThreshold ?? 0.7,
        matchCount,
        categoryFilter,
        sourceFilter: options.sourceFilter,
      }),
      fullTextSearch(variantQuery, 10).catch(() => []),
    ]);

    allVariantResults.push(vectorResults);
    totalVectorCount += vectorResults.length;
    totalKeywordCount += keywordResults.length;

    if (keywordResults.length > 0) {
      allVariantResults.push(keywordResults);
    }
  }

  // Merge all variant results using multi-list RRF
  const fused = allVariantResults.length > 1
    ? reciprocalRankFusion(allVariantResults)
    : allVariantResults[0] ?? [];

  const deduped = deduplicateChunks(fused);
  const boosted = boostByIntent(deduped, parsed.intent, options.surface);

  let reranked = false;
  let finalChunks = boosted;
  if (options.enableRerank !== false) {
    try {
      finalChunks = await rerankChunks(effectiveQuery, boosted, {
        topN: rerankerTopN,
      });
      reranked = true;
    } catch (e) {
      console.warn('Reranker failed, falling back to RRF-sorted results:', e);
    }
  }

  const diverse = enforceSourceDiversity(finalChunks, 3);
  const cited = addCitationMarkers(diverse);
  const truncated = truncateToBudget(cited, tokenBudget);

  // Build clinical pathway context if a known disease is detected
  let clinicalPathwayContext: string | null = null;
  const pathwayKey = parsed.clinicalPathway ?? findPathwayMatch(effectiveQuery, parsed.entities);
  if (pathwayKey) {
    clinicalPathwayContext = buildClinicalPathwayContext(pathwayKey);
  }

  let researchArticles: ResearchArticle[] = [];
  if (options.doResearch && (options.surface === 'treatment-protocol' || (options.surface === 'chat' && parsed.complexity === 'complex'))) {
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
      vectorCount: totalVectorCount,
      keywordCount: totalKeywordCount,
      afterDedup: deduped.length,
      afterRerank: reranked,
      latencyMs: Date.now() - startTime,
      hybridUsed,
      variantsSearched: embeddings.filter(Boolean).length,
    },
  };
}
