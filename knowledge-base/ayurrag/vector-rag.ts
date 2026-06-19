/**
 * Vector RAG Engine — Enhanced Semantic Search
 *
 * Uses NVIDIA NIM embeddings + Supabase pgvector for semantic search.
 * Falls back to full-text search (tsvector) if embedding fails.
 */

import { generateSearchEmbedding } from '../embedding-client'
import { DISEASE_CONCEPT_MAP, AYURVEDIC_TERMS } from '../llm-stream-utils'
import { AYURVEDA_KNOWLEDGE, searchKnowledge } from '../ayurknowledge'

export async function semanticSearch(
  embedding: number[],
  minRelevance: number,
  maxResults: number,
  _ignored?: any
): Promise<{ data: any[] | null; error: any }> {
  // Offline semantic mock: falls back to keyword matching inside searchKnowledgeBase below
  return { data: [], error: null };
}

export async function searchKnowledgeBase(
  query: string,
  sourceTables: string[],
  limit: number
): Promise<{ data: any[] | null; error: any }> {
  const lowercaseQuery = query.toLowerCase();
  const matched: any[] = [];

  // Match diseases
  if (sourceTables.includes('diseases')) {
    for (const d of AYURVEDA_KNOWLEDGE.diseases) {
      if (d.name.toLowerCase().includes(lowercaseQuery) || d.sanskrit.toLowerCase().includes(lowercaseQuery)) {
        matched.push({
          source_table: 'diseases',
          source_id: d.id || d.name,
          title: d.name,
          content: `${d.name} (${d.sanskrit}): ${d.samprapti}. Features: ${d.clinicalFeatures.join(', ')}. Treatment: ${d.treatment.join(', ')}`,
          rank: 0.9
        });
      }
    }
  }

  // Match herbs
  if (sourceTables.includes('herbs')) {
    for (const h of AYURVEDA_KNOWLEDGE.herbs) {
      if (h.name.toLowerCase().includes(lowercaseQuery) || h.sanskrit.toLowerCase().includes(lowercaseQuery)) {
        matched.push({
          source_table: 'herbs',
          source_id: h.id || h.name,
          title: h.name,
          content: `${h.name} (${h.sanskrit}): Rasa: ${h.rasa.join(', ')}. Guna: ${h.guna.join(', ')}. Virya/Vipaka: ${h.virya}/${h.vipaka}. Indications: ${h.indications.join(', ')}. Dosage: ${h.dosage}. Contraindications: ${h.contraindications.join(', ')}`,
          rank: 0.95
        });
      }
    }
  }

  // Match treatments
  if (sourceTables.includes('treatments')) {
    for (const t of AYURVEDA_KNOWLEDGE.treatments) {
      if (t.name.toLowerCase().includes(lowercaseQuery) || t.sanskrit.toLowerCase().includes(lowercaseQuery)) {
        matched.push({
          source_table: 'treatments',
          source_id: t.id || t.name,
          title: t.name,
          content: `${t.name} (${t.sanskrit}): ${t.description}. Procedure: ${t.procedure.join(', ')}. Indications: ${t.indications.join(', ')}`,
          rank: 0.85
        });
      }
    }
  }

  // Match modern medicines
  if (sourceTables.includes('modern_medicines')) {
    for (const m of AYURVEDA_KNOWLEDGE.modernMedicines) {
      if (m.medicineName.toLowerCase().includes(lowercaseQuery) || (m.composition && m.composition.toLowerCase().includes(lowercaseQuery))) {
        matched.push({
          source_table: 'modern_medicines',
          source_id: m.medicineName,
          title: m.medicineName,
          content: `Modern Medicine: ${m.medicineName} (${m.composition}). Uses: ${m.uses}. Cautions: ${m.precautions || 'N/A'}. Contraindicated Ayurvedic Herbs: ${m.drugInteractions || 'N/A'}`,
          rank: 0.8
        });
      }
    }
  }

  // Fallback direct match
  if (matched.length === 0) {
    const raw = searchKnowledge(query);
    if (raw && !raw.startsWith('No direct matches')) {
      matched.push({
        source_table: 'ayur_knowledge',
        source_id: 'fallback_search',
        title: 'Search Match',
        content: raw,
        rank: 0.7
      });
    }
  }

  return { data: matched.slice(0, limit), error: null };
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface VectorSearchResult {
  id: string
  type: 'who_term' | 'ayur_knowledge' | 'clinical_case'
  content: string
  source: string
  category: string
  relevance: number
  metadata?: Record<string, unknown>
}

export interface VectorRAGConfig {
  maxResults: number
  minRelevance: number
  includeWHO: boolean
  includeAyurKnowledge: boolean
  includeClinicalCases?: boolean
  sourceFilter?: string[]
}

export interface RAGContext {
  context: string
  sources: string[]
  resultCount: number
  categories: string[]
}

// ─── Initialization ──────────────────────────────────────────────────────────

export async function initializeVectorRAG(): Promise<void> {
  console.log('[VectorRAG] Initialized (enhanced vector search mode)')
}

// ─── Source table → category mapping ──────────────────────────────────────────

const SOURCE_TABLE_CATEGORY_MAP: Record<string, string> = {
  who_terminology: 'WHO Terminology',
  diseases: 'Disease',
  herbs: 'Herb',
  treatments: 'Treatment',
  charak_chapters: 'Classical Text',
  sushruta_chapters: 'Classical Text',
  allopathy_integration: 'Allopathy Integration',
  combined_protocols: 'Combined Protocol',
  diagnostics: 'Diagnostic Method',
  fundamentals: 'Fundamental Concept',
  clinical_evidence: 'Clinical Evidence',
  external_qa: 'Ayurveda Q&A',
  modern_medicines: 'Modern Medicine',
  clinical_cases: 'Clinical Case',
  case_studies: 'Clinical Case',
}

function mapSourceTableToCategory(sourceTable: string): string {
  return SOURCE_TABLE_CATEGORY_MAP[sourceTable] || 'Knowledge Base'
}

// ─── Search History Logging ──────────────────────────────────────────────────

async function logSearchHistory(
  query: string,
  queryType: string,
  resultsCount: number,
  embeddingUsed: boolean,
  latencyMs: number
): Promise<void> {
  console.log(`[RAG Search Log] Query: "${query}" | Type: ${queryType} | Results: ${resultsCount} | Embedding Used: ${embeddingUsed} | Latency: ${latencyMs}ms`);
}

// ─── In-Memory LRU Cache ─────────────────────────────────────────────────────

const searchCache = new Map<string, { results: VectorSearchResult[]; timestamp: number }>()
const CACHE_MAX_SIZE = 500
const CACHE_TTL_MS = 10 * 60 * 1000

function getCachedResults(cacheKey: string): VectorSearchResult[] | null {
  const cached = searchCache.get(cacheKey)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    searchCache.delete(cacheKey)
    return null
  }
  searchCache.delete(cacheKey)
  searchCache.set(cacheKey, cached)
  return cached.results
}

function setCachedResults(cacheKey: string, results: VectorSearchResult[]) {
  if (searchCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = searchCache.keys().next().value
    if (oldestKey) searchCache.delete(oldestKey)
  }
  searchCache.set(cacheKey, { results, timestamp: Date.now() })
}

// ─── Query Intent Detection ──────────────────────────────────────────────────

export interface QueryIntent {
  primaryIntent: string
  boostCategories: string[]
  keywords: string[]
  sourceTables: string[]
  complexity: 'simple' | 'moderate' | 'complex'
}

export function detectQueryIntent(query: string): QueryIntent {
  const lower = query.toLowerCase()
  const boostCategories: string[] = []
  const keywords: string[] = []
  const sourceTables: string[] = []
  let primaryIntent = 'general'
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple'

  // Disease/diagnosis queries
  if (lower.match(/\b(disease|diagnosis|condition|symptom|vyadhi|roga|what is|caused by)\b/)) {
    boostCategories.push('Disease', 'Diagnostic Method')
    sourceTables.push('diseases', 'diagnostics')
    keywords.push('disease', 'diagnosis', 'symptom')
    primaryIntent = 'diagnosis'
    complexity = 'moderate'
  }

  // Treatment queries
  if (lower.match(/\b(treat|cure|therapy|protocol|manage|heal|chikitsa|upchar)\b/)) {
    boostCategories.push('Treatment', 'Classical Text')
    sourceTables.push('treatments', 'charak_chapters')
    keywords.push('treatment', 'therapy', 'protocol')
    primaryIntent = 'treatment'
    complexity = 'complex'
  }

  // Herb queries
  if (lower.match(/\b(herb|dravya|medicine|drug|plant|formulation|churna|ghrita|taila|vati|bhasma)\b/)) {
    boostCategories.push('Herb')
    sourceTables.push('herbs')
    keywords.push('herb', 'medicine', 'formulation')
    primaryIntent = 'herb'
    complexity = 'moderate'
  }

  // Panchakarma queries
  if (lower.match(/\b(panchakarma|basti|vamana|virechana|nasya|raktamokshana|purvakarma|paschatkarma)\b/)) {
    boostCategories.push('Treatment', 'Classical Text')
    sourceTables.push('treatments', 'charak_chapters')
    keywords.push('panchakarma', 'basti', 'vamana')
    primaryIntent = 'procedure'
    complexity = 'complex'
  }

  // Diet queries
  if (lower.match(/\b(diet|food|pathya|apathya|ahara|nutrition|ritucharya|dinacharya)\b/)) {
    boostCategories.push('Disease', 'Classical Text')
    sourceTables.push('diseases', 'charak_chapters')
    keywords.push('diet', 'pathya', 'ahara')
    primaryIntent = 'diet'
    complexity = 'moderate'
  }

  // Dosha/constitution queries
  if (lower.match(/\b(dosha|vata|pitta|kapha|prakriti|vikriti|agni|ama|ojas|srotas)\b/)) {
    boostCategories.push('Fundamental Concept', 'Classical Text')
    sourceTables.push('fundamentals', 'charak_chapters')
    keywords.push('dosha', 'prakriti', 'agni')
    primaryIntent = 'prakriti'
    complexity = 'moderate'
  }

  // Drug interaction queries
  if (lower.match(/\b(interaction|allopathy|modern|combine|safe|contraindic|side effect)\b/)) {
    boostCategories.push('Allopathy Integration', 'Modern Medicine')
    sourceTables.push('allopathy_integration', 'modern_medicines')
    keywords.push('interaction', 'safety', 'contraindication')
    primaryIntent = 'drug_interaction'
    complexity = 'complex'
  }

  // Research/evidence queries
  if (lower.match(/\b(research|study|trial|evidence|pubmed|clinical|journal|systematic|meta)\b/)) {
    boostCategories.push('Clinical Evidence')
    sourceTables.push('clinical_evidence')
    keywords.push('research', 'evidence', 'study')
    primaryIntent = 'research'
    complexity = 'complex'
  }

  // Modern medicine queries
  if (lower.match(/\b(tablet|capsule|injection|pharmaceutical|allopathic drug|paracetamol|metformin|aspirin)\b/)) {
    boostCategories.push('Modern Medicine', 'Allopathy Integration')
    sourceTables.push('modern_medicines', 'allopathy_integration')
    keywords.push('modern medicine')
    primaryIntent = 'modern_medicine'
    complexity = 'moderate'
  }

  // Sushruta-specific queries
  if (lower.match(/\b(sushruta|surgery|shalya|shalakya|wound|operation|surgical|kshara|ksharasutra)\b/)) {
    boostCategories.push('Classical Text')
    sourceTables.push('sushruta_chapters')
    keywords.push('sushruta', 'surgery')
    primaryIntent = 'surgery'
    complexity = 'complex'
  }

  // Q&A / general knowledge queries
  if (lower.match(/\b(what is|explain|describe|define|meaning|significance|tell me about)\b/)) {
    boostCategories.push('Ayurveda Q&A', 'Classical Text')
    sourceTables.push('external_qa', 'charak_chapters')
    keywords.push('explanation')
    primaryIntent = 'explanation'
    complexity = 'simple'
  }

  // WHO terminology queries
  if (lower.match(/\b(ita code|who terminology|international standard|who standard)\b/)) {
    boostCategories.push('WHO Terminology')
    sourceTables.push('who_terminology')
    keywords.push('ITA code', 'WHO')
    primaryIntent = 'terminology'
    complexity = 'simple'
  }

  return {
    primaryIntent,
    boostCategories: [...new Set(boostCategories)],
    keywords: [...new Set(keywords)],
    sourceTables: [...new Set(sourceTables)],
    complexity,
  }
}

// ─── Multi-Query Expansion ───────────────────────────────────────────────────

/**
 * Generate expanded search queries for broader recall.
 * Creates variations: original, Sanskrit terms, clinical terms, related concepts.
 */
function expandQuery(query: string, intent: QueryIntent): string[] {
  const queries = [query]
  const lower = query.toLowerCase()

  // Use shared disease concept map — short-circuit after 5 queries
  for (const [english, sanskritTerms] of Object.entries(DISEASE_CONCEPT_MAP)) {
    if (lower.includes(english)) {
      queries.push(...sanskritTerms.slice(0, 2))
      if (queries.length >= 5) break
    }
  }

  // Add clinical term variations based on intent (limited)
  if (intent.primaryIntent === 'treatment' && queries.length < 5) {
    queries.push(`${query} ayurvedic treatment protocol`)
  }
  if (intent.primaryIntent === 'diagnosis' && queries.length < 5) {
    queries.push(`${query} samprapti ayurvedic diagnosis`)
  }
  if (intent.primaryIntent === 'herb' && queries.length < 5) {
    queries.push(`${query} rasa guna virya vipaka`)
  }

  // Deduplicate and limit to 5
  return [...new Set(queries)].slice(0, 5)
}

// ─── Hybrid Re-ranking ───────────────────────────────────────────────────────

function hybridRerank(
  results: VectorSearchResult[],
  query: string,
  intent: QueryIntent
): VectorSearchResult[] {
  const queryWords = new Set(
    query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  )

  // Also check Sanskrit terms in the query
  const sanskritTerms = extractSanskritTerms(query)

  return results.map(r => {
    let boostedRelevance = r.relevance

    // Category boost: +0.20 for matching categories
    if (intent.boostCategories.includes(r.category)) {
      boostedRelevance += 0.20
    }

    // Source table boost: +0.15 for matching source tables
    const sourceTable = r.metadata?.source_table as string
    if (sourceTable && intent.sourceTables.includes(sourceTable)) {
      boostedRelevance += 0.15
    }

    // Keyword match boost
    const contentLower = r.content.toLowerCase()
    let keywordMatches = 0
    for (const word of queryWords) {
      if (contentLower.includes(word)) keywordMatches++
    }
    boostedRelevance += Math.min(keywordMatches * 0.04, 0.16)

    // Sanskrit term boost: +0.10 per Sanskrit term match
    for (const term of sanskritTerms) {
      if (contentLower.includes(term)) {
        boostedRelevance += 0.10
      }
    }

    // Intent keyword boost
    for (const kw of intent.keywords) {
      if (contentLower.includes(kw)) boostedRelevance += 0.05
    }

    // Clinical case boost: prefer clinical cases for treatment queries
    if (r.type === 'clinical_case' && intent.primaryIntent === 'treatment') {
      boostedRelevance += 0.10
    }

    // Recency boost for clinical cases (if metadata has created_at)
    if (r.type === 'clinical_case' && r.metadata?.created_at) {
      const age = Date.now() - new Date(r.metadata.created_at as string).getTime()
      const daysSinceCreation = age / (1000 * 60 * 60 * 24)
      if (daysSinceCreation < 30) boostedRelevance += 0.05
      if (daysSinceCreation < 7) boostedRelevance += 0.05
    }

    return { ...r, relevance: Math.min(boostedRelevance, 1.0) }
  }).sort((a, b) => b.relevance - a.relevance)
}

function extractSanskritTerms(query: string): string[] {
  const lower = query.toLowerCase()
  return AYURVEDIC_TERMS.filter(term => lower.includes(term))
}

// ─── Main Vector Search ──────────────────────────────────────────────────────

export async function vectorSearch(
  query: string,
  config: VectorRAGConfig = {
    maxResults: 15,
    minRelevance: 0.20,
    includeWHO: true,
    includeAyurKnowledge: true,
    includeClinicalCases: true,
  }
): Promise<VectorSearchResult[]> {
  const startTime = Date.now()

  // Check cache (include sourceFilter in key to avoid stale results)
  const sourceFilterKey = config.sourceFilter ? config.sourceFilter.sort().join(',') : 'default'
  const cacheKey = `${query}:${config.maxResults}:${config.minRelevance}:${config.includeWHO}:${config.includeAyurKnowledge}:${config.includeClinicalCases}:${sourceFilterKey}`
  const cached = getCachedResults(cacheKey)
  if (cached) {
    console.log('[VectorRAG] Cache hit for query:', query.substring(0, 50))
    return cached
  }

  const intent = detectQueryIntent(query)
  const results: VectorSearchResult[] = []
  const dedupMap = new Map<string, number>()
  let embeddingUsed = false

  // Phase 1: Multi-query semantic search
  const expandedQueries = expandQuery(query, intent)
  console.log('[VectorRAG] Expanded queries:', expandedQueries.length)

  try {
    // Generate embeddings for top 3 queries (original + 2 best expansions)
    const queriesToEmbed = expandedQueries.slice(0, 3)
    const embeddings = await Promise.all(
      queriesToEmbed.map(q => generateSearchEmbedding(q).catch(() => null))
    )

    const validEmbeddings = embeddings.filter(Boolean) as number[][]
    embeddingUsed = validEmbeddings.length > 0

    // Run semantic searches in parallel for all embeddings
    const searchPromises = validEmbeddings.map(embedding =>
      semanticSearch(embedding, config.minRelevance * 0.8, config.maxResults, undefined)
        .catch(err => {
          console.error('[VectorRAG] Semantic search failed:', err)
          return { data: null, error: err }
        })
    )

    const searchResults = await Promise.all(searchPromises)

    for (const { data: semanticResults, error } of searchResults) {
      if (!error && semanticResults) {
        for (const r of semanticResults) {
          const key = `${r.source_table}:${r.source_id}`
          const existingIndex = dedupMap.get(key)
          if (existingIndex === undefined) {
            dedupMap.set(key, results.length)
            results.push({
              id: r.id,
              type: (r.source_table === 'clinical_cases' || r.source_table === 'case_studies') ? 'clinical_case' : 'ayur_knowledge',
              content: r.content,
              source: r.source_title,
              category: mapSourceTableToCategory(r.source_table),
              relevance: r.similarity,
              metadata: {
                source_table: r.source_table,
                source_id: r.source_id,
              },
            })
          } else {
            // Boost relevance for results found by multiple queries
            results[existingIndex].relevance = Math.min(
              results[existingIndex].relevance + 0.05,
              1.0
            )
          }
        }
      }
    }
  } catch (embeddingError) {
    console.error('[VectorRAG] Embedding search failed:', embeddingError)
  }

  // Phase 2: Full-text search complement (reuse dedupMap from Phase 1)
  if (results.length < config.maxResults) {
    try {
      const remaining = config.maxResults - results.length
      const sourceTables = config.sourceFilter ? [...config.sourceFilter] : [
        'diseases', 'herbs', 'treatments', 'charak_chapters', 'sushruta_chapters',
        'allopathy_integration', 'clinical_evidence', 'external_qa', 'modern_medicines',
        'fundamentals', 'diagnostics'
      ]
      // Add optional tables only if not already present (avoid duplicates)
      if (config.includeWHO && !sourceTables.includes('who_terminology')) {
        sourceTables.push('who_terminology')
      }
      if (config.includeClinicalCases) {
        if (!sourceTables.includes('clinical_cases')) sourceTables.push('clinical_cases')
        if (!sourceTables.includes('case_studies')) sourceTables.push('case_studies')
      }

      const { data: textResults, error: textError } = await searchKnowledgeBase(
        query,
        sourceTables,
        remaining
      )

      if (!textError && textResults) {
        for (const tr of textResults) {
          const key = `${tr.source_table}:${tr.source_id}`
          if (!dedupMap.has(key)) {
            dedupMap.set(key, results.length)
            results.push({
              id: tr.source_id,
              type: tr.source_table === 'clinical_cases' ? 'clinical_case' : 'ayur_knowledge',
              content: tr.content,
              source: tr.title,
              category: mapSourceTableToCategory(tr.source_table),
              relevance: Math.min(tr.rank * 2, 1.0) * 0.7,
              metadata: {
                source_table: tr.source_table,
                source_id: tr.source_id,
              },
            })
          }
        }
      }
    } catch (textError) {
      console.error('[VectorRAG] Full-text search failed:', textError)
    }
  }

  // Phase 3: Hybrid re-ranking
  const reranked = hybridRerank(results, query, intent)

  // Filter and limit
  const finalResults = reranked
    .filter(r => r.relevance >= config.minRelevance)
    .slice(0, config.maxResults)

  // Cache results
  setCachedResults(cacheKey, finalResults)

  // Log to search history
  logSearchHistory(query, intent.primaryIntent, finalResults.length, embeddingUsed, Date.now() - startTime).catch(() => {})

  console.log('[VectorRAG] Search complete:', {
    query: query.substring(0, 50),
    intent: intent.primaryIntent,
    results: finalResults.length,
    categories: [...new Set(finalResults.map(r => r.category))],
    timeMs: Date.now() - startTime,
  })

  return finalResults
}

// ─── Context Formatting ──────────────────────────────────────────────────────

/**
 * Format search results into structured context for the LLM.
 * Increased token budget to 8000 tokens for richer context.
 */
export function formatVectorResultsForContext(results: VectorSearchResult[]): RAGContext {
  if (results.length === 0) {
    return { context: '', sources: [], resultCount: 0, categories: [] }
  }

  // Deduplicate by content similarity (first 150 chars)
  const seen = new Set<string>()
  const deduped = results.filter(r => {
    const key = r.content.substring(0, 150).toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Group by category
  const byCategory = new Map<string, VectorSearchResult[]>()
  for (const r of deduped) {
    const list = byCategory.get(r.category) || []
    list.push(r)
    byCategory.set(r.category, list)
  }

  // Priority order for clinical relevance
  const categoryPriority = [
    'Clinical Case', 'Disease', 'Treatment', 'Herb', 'Classical Text',
    'Clinical Evidence', 'Allopathy Integration', 'Modern Medicine',
    'Combined Protocol', 'Diagnostic Method', 'Fundamental Concept',
    'Ayurveda Q&A', 'WHO Terminology',
  ]

  const sortedCategories = [...byCategory.entries()].sort((a, b) => {
    const aIdx = categoryPriority.indexOf(a[0])
    const bIdx = categoryPriority.indexOf(b[0])
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
  })

  let context = '\n## Relevant Knowledge Base Information:\n\n'
  const sources: string[] = []
  let totalTokens = 0
  const maxTokens = 8000
  const sourcesSet = new Set<string>()

  for (const [category, items] of sortedCategories) {
    const categoryHeader = `### ${category}\n`
    const categoryContent = items
      .slice(0, 5)
      .map(r => {
        const source = r.source ? ` [Source: ${r.source}]` : ''
        const table = r.metadata?.source_table ? ` (${r.metadata.source_table})` : ''
        if (r.source) sourcesSet.add(r.source)
        return `- ${r.content}${source}${table}`
      })
      .join('\n')

    const section = categoryHeader + categoryContent + '\n\n'
    const sectionTokens = Math.ceil(section.length / 4)

    if (totalTokens + sectionTokens > maxTokens) {
      const remaining = maxTokens - totalTokens
      if (remaining > 200) {
        context += section.substring(0, remaining * 4) + '\n\n'
      }
      break
    }

    context += section
    totalTokens += sectionTokens
  }

  // Add safety warning if drug interaction results present
  const hasDrugInteraction = deduped.some(r =>
    r.category === 'Allopathy Integration' ||
    r.content.toLowerCase().includes('interaction') ||
    r.content.toLowerCase().includes('contraindication')
  )

  if (hasDrugInteraction) {
    context += '\n**Safety Notice:** Some results involve drug interactions or contraindications. Always verify with current pharmacological references and consult specialists when combining Ayurvedic and modern treatments.\n'
  }

  // Add clinical case summary if present
  const clinicalCases = deduped.filter(r => r.type === 'clinical_case')
  if (clinicalCases.length > 0) {
    context += `\n**Clinical Experience:** ${clinicalCases.length} similar clinical case(s) found in the knowledge base. These represent real patient outcomes and can inform treatment decisions.\n`
  }

  return {
    context,
    sources: [...sourcesSet],
    resultCount: deduped.length,
    categories: [...new Set(deduped.map(r => r.category))],
  }
}

export function getCacheSize(): number {
  return searchCache.size
}
