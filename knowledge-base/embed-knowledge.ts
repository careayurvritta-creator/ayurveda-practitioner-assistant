/**
 * Embedding Generation Script for Ayurved Knowledge Base
 *
 * Reads all knowledge from src/lib/ayurknowledge/, chunks it,
 * generates embeddings via NVIDIA NIM, and upserts into Supabase.
 *
 * Usage:
 *   npx tsx scripts/embed-knowledge.ts           # incremental (skip existing)
 *   npx tsx scripts/embed-knowledge.ts --force    # regenerate all
 *   npx tsx scripts/embed-knowledge.ts --dry-run  # show chunk counts only
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import OpenAI from 'openai'

// ─── Config ───────────────────────────────────────────────────────────────────
const EMBEDDING_MODEL = 'nvidia/nv-embedqa-e5-v5'
const EMBEDDING_DIM = 1024
const BATCH_SIZE = 20
const UPSERT_BATCH = 10
const DELAY_BETWEEN_BATCHES_MS = 1000
const MAX_CHUNK_CHARS = 400 // ~100 tokens, well under 512-token NIM limit (prevents all skips)

// ─── Types ────────────────────────────────────────────────────────────────────
interface Chunk {
  content: string
  metadata: Record<string, unknown>
  sourceTable: string
  sourceId: string
  sourceTitle: string
  contentType: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function deterministicUuid(input: string): string {
  const hash = createHash('sha256').update(input).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`, // UUID v4 marker
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-')
}

function batchItems<T>(items: T[], size: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size))
  }
  return batches
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

/**
 * Split a chunk into smaller pieces if it exceeds MAX_CHUNK_CHARS.
 * Splits on sentence boundaries to preserve semantic coherence.
 * Adds 50-character overlap between parts to prevent context loss at boundaries.
 */
const CHUNK_OVERLAP_CHARS = 50 // ~12 tokens overlap between chunks

function splitOversizedChunk(chunk: Chunk): Chunk[] {
  if (chunk.content.length <= MAX_CHUNK_CHARS) return [chunk]

  const parts: Chunk[] = []
  // Split on sentence boundaries (. or !) AND newlines (for bullet-based content)
  const sentences = chunk.content.split(/(?<=[.!])\s+|\n/)
  let currentPart = ''
  let lastPartTail = ''

  for (const sentence of sentences) {
    const candidate = currentPart ? currentPart + ' ' + sentence : sentence
    if (candidate.length > MAX_CHUNK_CHARS && currentPart.length > 0) {
      // Current part is full — flush it
      const contentWithOverlap = lastPartTail ? lastPartTail + ' ' + currentPart.trim() : currentPart.trim()
      parts.push({
        ...chunk,
        content: contentWithOverlap,
        sourceId: deterministicUuid(`${chunk.sourceId}:part${parts.length}`),
      })
      lastPartTail = currentPart.trim().slice(-CHUNK_OVERLAP_CHARS)
      currentPart = sentence
    } else if (sentence.length > MAX_CHUNK_CHARS) {
      // Single sentence/line exceeds limit — force-split by character count
      if (currentPart.trim()) {
        const contentWithOverlap = lastPartTail ? lastPartTail + ' ' + currentPart.trim() : currentPart.trim()
        parts.push({
          ...chunk,
          content: contentWithOverlap,
          sourceId: deterministicUuid(`${chunk.sourceId}:part${parts.length}`),
        })
        lastPartTail = currentPart.trim().slice(-CHUNK_OVERLAP_CHARS)
        currentPart = ''
      }
      // Split the long line into fixed-size pieces
      for (let k = 0; k < sentence.length; k += MAX_CHUNK_CHARS - CHUNK_OVERLAP_CHARS) {
        const piece = sentence.slice(k, k + MAX_CHUNK_CHARS)
        parts.push({
          ...chunk,
          content: piece,
          sourceId: deterministicUuid(`${chunk.sourceId}:part${parts.length}`),
        })
      }
    } else {
      currentPart = candidate
    }
  }

  if (currentPart.trim()) {
    const contentWithOverlap = lastPartTail ? lastPartTail + ' ' + currentPart.trim() : currentPart.trim()
    parts.push({
      ...chunk,
      content: contentWithOverlap,
      sourceId: deterministicUuid(`${chunk.sourceId}:part${parts.length}`),
    })
  }

  return parts.length > 0 ? parts : [chunk]
}

function sanitizeForJson(obj: unknown): unknown {
  if (obj === null || obj === undefined) return null
  if (typeof obj === 'string') {
    // Remove control characters except \n, \r, \t
    return obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  }
  if (Array.isArray(obj)) return obj.map(sanitizeForJson)
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        result[key] = sanitizeForJson(value)
      }
    }
    return result
  }
  return obj
}

/**
 * Validate embedding quality — check dimensions and NaN values.
 */
function validateEmbedding(embedding: number[]): boolean {
  if (!Array.isArray(embedding)) return false
  if (embedding.length !== EMBEDDING_DIM) {
    console.warn(`  Invalid embedding dimension: ${embedding.length} (expected ${EMBEDDING_DIM})`)
    return false
  }
  if (embedding.some(v => isNaN(v) || !isFinite(v))) {
    console.warn('  Embedding contains NaN or Infinity values')
    return false
  }
  return true
}

// ─── Retry wrapper ───────────────────────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string }
      // Don't retry on 400 (bad request, e.g., oversized input)
      if (err?.status === 400) throw error
      if (attempt === maxRetries - 1) throw error
      const delay = err?.status === 429
        ? baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        : baseDelay * (attempt + 1)
      console.warn(`  Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms: ${err?.message}`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw new Error('Unreachable')
}

// ─── Chunking: Charak Chapters ───────────────────────────────────────────────
interface CharakChapter {
  id: string
  sthana: string
  chapterNumber: number
  name: string
  english: string
  summary: string
  keyConcepts: string[]
  shlokas: Array<{ number: string; sanskrit?: string; translation: string; commentary?: string }>
  topics: Array<{ title: string; content: string; clinicalRelevance?: string }>
  doshaDiscussion: string[]
  treatmentProtocols?: Array<{ condition: string; treatment: string; herbs: string[]; dosage: string; duration: string; precautions: string[] }>
  treatmentPrinciples?: string[]
  dietaryGuidelines?: string[]
  diseaseDescriptions?: Array<{ name: string; sanskrit: string; etiology: string; symptoms: string[]; prognosis: string; treatment: string }>
  importantVerses?: string[]
  clinicalApplications: string[]
}

function chunkCharakChapter(chapter: CharakChapter): Chunk[] {
  const chunks: Chunk[] = []
  const baseMeta = { sthana: chapter.sthana, chapter: chapter.chapterNumber, name: chapter.name }
  const sourceId = deterministicUuid(`charak_chapters:${chapter.id}:main`)
  const sourceTitle = `${chapter.sthana} Ch.${chapter.chapterNumber}: ${chapter.name}`

  // Summary
  if (chapter.summary) {
    chunks.push({
      content: `${sourceTitle}\n\n${chapter.summary}`,
      metadata: { ...baseMeta, section: 'summary' },
      sourceTable: 'charak_chapters',
      sourceId: deterministicUuid(`charak_chapters:${chapter.id}:summary`),
      sourceTitle,
      contentType: 'description',
    })
  }

  // Key concepts — batch 6 per chunk
  if (chapter.keyConcepts?.length) {
    for (const batch of batchItems(chapter.keyConcepts, 6)) {
      chunks.push({
        content: `${sourceTitle} - Key Concepts:\n${batch.map(c => `- ${c}`).join('\n')}`,
        metadata: { ...baseMeta, section: 'keyConcepts' },
        sourceTable: 'charak_chapters',
        sourceId: deterministicUuid(`charak_chapters:${chapter.id}:keyConcepts:${batch[0].slice(0, 30)}`),
        sourceTitle,
        contentType: 'concept',
      })
    }
  }

  // Shlokas — batch 2 per chunk
  if (chapter.shlokas?.length) {
    for (const batch of batchItems(chapter.shlokas, 2)) {
      const text = batch.map(s =>
        `[${s.number}] ${s.translation}${s.commentary ? ` -- ${s.commentary}` : ''}`
      ).join('\n\n')
      chunks.push({
        content: `${sourceTitle} - Verses:\n${text}`,
        metadata: { ...baseMeta, section: 'shlokas', verseNumbers: batch.map(s => s.number) },
        sourceTable: 'charak_chapters',
        sourceId: deterministicUuid(`charak_chapters:${chapter.id}:shlokas:${batch[0].number}`),
        sourceTitle,
        contentType: 'concept',
      })
    }
  }

  // Topics — 1 per chunk (they're large)
  if (chapter.topics?.length) {
    for (const topic of chapter.topics) {
      const text = `${topic.title}: ${topic.content}${topic.clinicalRelevance ? `\nClinical Relevance: ${topic.clinicalRelevance}` : ''}`
      chunks.push({
        content: `${sourceTitle} - ${text}`,
        metadata: { ...baseMeta, section: 'topics', topicTitle: topic.title },
        sourceTable: 'charak_chapters',
        sourceId: deterministicUuid(`charak_chapters:${chapter.id}:topics:${topic.title}`),
        sourceTitle,
        contentType: 'description',
      })
    }
  }

  // Treatment protocols — 1 per chunk
  if (chapter.treatmentProtocols?.length) {
    for (const protocol of chapter.treatmentProtocols) {
      chunks.push({
        content: `${sourceTitle} - Treatment Protocol:\nCondition: ${protocol.condition}\nTreatment: ${protocol.treatment}\nHerbs: ${protocol.herbs.join(', ')}\nDosage: ${protocol.dosage}\nDuration: ${protocol.duration}\nPrecautions: ${protocol.precautions.join(', ')}`,
        metadata: { ...baseMeta, section: 'treatmentProtocols', condition: protocol.condition },
        sourceTable: 'charak_chapters',
        sourceId: deterministicUuid(`charak_chapters:${chapter.id}:tp:${protocol.condition}`),
        sourceTitle,
        contentType: 'procedure',
      })
    }
  }

  // Disease descriptions — 1 per chunk
  if (chapter.diseaseDescriptions?.length) {
    for (const disease of chapter.diseaseDescriptions) {
      chunks.push({
        content: `${sourceTitle} - Disease: ${disease.name} (${disease.sanskrit})\nEtiology: ${disease.etiology}\nSymptoms: ${disease.symptoms.join(', ')}\nPrognosis: ${disease.prognosis}\nTreatment: ${disease.treatment}`,
        metadata: { ...baseMeta, section: 'diseaseDescriptions', disease: disease.name },
        sourceTable: 'charak_chapters',
        sourceId: deterministicUuid(`charak_chapters:${chapter.id}:dd:${disease.name}`),
        sourceTitle,
        contentType: 'description',
      })
    }
  }

  // Remaining string-array sections — batch 4 per chunk
  const stringSections = [
    'doshaDiscussion', 'clinicalApplications', 'treatmentPrinciples',
    'dietaryGuidelines', 'importantVerses',
  ] as const

  for (const section of stringSections) {
    const items = (chapter as unknown as Record<string, string[] | undefined>)[section]
    if (!items?.length) continue
    for (const batch of batchItems(items, 4)) {
      chunks.push({
        content: `${sourceTitle} - ${section}:\n${batch.map(i => `- ${i}`).join('\n')}`,
        metadata: { ...baseMeta, section },
        sourceTable: 'charak_chapters',
        sourceId: deterministicUuid(`charak_chapters:${chapter.id}:${section}:${batch[0].slice(0, 30)}`),
        sourceTitle,
        contentType: section === 'clinicalApplications' ? 'indication' : 'concept',
      })
    }
  }

  return chunks
}

// ─── Chunking: Other Knowledge Types ─────────────────────────────────────────

interface DiseaseEntry {
  id: string; name: string; sanskrit: string; category: string
  doshaInvolvement: string[]; samprapti: string; modernCorrelation: string
  clinicalFeatures: string[]; diagnosticCriteria: string[]
  treatment: string[]; pathya: string[]; apathya: string[]; prognosis: string
}

interface HerbEntry {
  id: string; name: string; botanicalName: string; sanskrit: string
  rasa: string[]; guna: string[]; virya: string; vipaka: string
  doshaKarma: { vata: string; pitta: string; kapha: string }
  indications: string[]; dosage: string; contraindications: string[]
  partUsed: string[]; preparation: string[]
}

interface TreatmentEntry {
  id: string; name: string; sanskrit: string; category: string
  description: string; procedure: string[]; indications: string[]
  contraindications: string[]; duration: string
}

interface DiagnosticEntry {
  id: string; name: string; sanskrit: string; description: string
  components: string[]; clinicalApplication: string[]
}

interface AllopathyEntry {
  condition: string; ayurvedicCorrelation: string; allopathyTreatment: string
  integratedApproach: string; safetyNotes: string[]; monitoringParameters: string[]
}

function chunkDisease(d: DiseaseEntry): Chunk[] {
  const prefix = `Ayurvedic Disease — ${d.name} (${d.sanskrit}):`
  const chunks: Chunk[] = []

  // Chunk 1: Definition + Pathogenesis
  chunks.push({
    content: `${prefix} Definition and Pathogenesis.\nDisease: ${d.name} (${d.sanskrit}). Category: ${d.category}.\nModern Correlation: ${d.modernCorrelation}.\nSamprapti (Pathogenesis): ${d.samprapti}.\nDosha Involvement: ${d.doshaInvolvement.join(', ')}.\nPrognosis: ${d.prognosis}.\nKey terms: ${d.name}, ${d.sanskrit}, ${d.category}, ${d.doshaInvolvement.join(', ')}.`,
    metadata: { id: d.id, category: d.category, section: 'pathogenesis' },
    sourceTable: 'diseases',
    sourceId: deterministicUuid(`diseases:${d.id}:pathogenesis`),
    sourceTitle: d.name,
    contentType: 'description',
  })

  // Chunk 2: Symptoms + Diagnosis
  chunks.push({
    content: `${prefix} Symptoms and Diagnosis.\nClinical Features: ${d.clinicalFeatures.join(', ')}.\nDiagnostic Criteria: ${d.diagnosticCriteria.join(', ')}.\nKey terms: ${d.name}, ${d.sanskrit}, symptoms, diagnosis, ${d.clinicalFeatures.slice(0, 3).join(', ')}.`,
    metadata: { id: d.id, category: d.category, section: 'symptoms' },
    sourceTable: 'diseases',
    sourceId: deterministicUuid(`diseases:${d.id}:symptoms`),
    sourceTitle: d.name,
    contentType: 'description',
  })

  // Chunk 3: Treatment + Lifestyle
  chunks.push({
    content: `${prefix} Treatment and Lifestyle.\nTreatment: ${d.treatment.join(', ')}.\nPathya (Beneficial): ${d.pathya.join(', ')}.\nApathya (Harmful): ${d.apathya.join(', ')}.\nKey terms: ${d.name}, treatment, pathya, apathya, ${d.treatment.slice(0, 3).join(', ')}.`,
    metadata: { id: d.id, category: d.category, section: 'treatment' },
    sourceTable: 'diseases',
    sourceId: deterministicUuid(`diseases:${d.id}:treatment`),
    sourceTitle: d.name,
    contentType: 'description',
  })

  return chunks
}

function chunkHerb(h: HerbEntry): Chunk[] {
  const prefix = `Ayurvedic Herb — ${h.name} (${h.sanskrit}):`
  const chunks: Chunk[] = []

  // Chunk 1: Identity + Properties
  chunks.push({
    content: `${prefix} Identity and Pharmacological Properties.\nHerb: ${h.name} (${h.sanskrit}). Botanical Name: ${h.botanicalName}.\nRasa (Taste): ${h.rasa.join(', ')}.\nGuna (Qualities): ${h.guna.join(', ')}.\nVirya (Potency): ${h.virya}.\nVipaka (Post-digestive): ${h.vipaka}.\nDosha Karma: Vata=${h.doshaKarma.vata}, Pitta=${h.doshaKarma.pitta}, Kapha=${h.doshaKarma.kapha}.\nPart Used: ${h.partUsed.join(', ')}.\nKey terms: ${h.name}, ${h.sanskrit}, ${h.botanicalName}, ${h.rasa.join(', ')}.`,
    metadata: { id: h.id, section: 'properties' },
    sourceTable: 'herbs',
    sourceId: deterministicUuid(`herbs:${h.id}:properties`),
    sourceTitle: h.name,
    contentType: 'description',
  })

  // Chunk 2: Clinical Uses
  chunks.push({
    content: `${prefix} Clinical Uses and Dosage.\nIndications: ${h.indications.join(', ')}.\nDosage: ${h.dosage}.\nPreparation Methods: ${h.preparation.join(', ')}.\nKey terms: ${h.name}, ${h.sanskrit}, ${h.indications.slice(0, 3).join(', ')}.`,
    metadata: { id: h.id, section: 'clinical' },
    sourceTable: 'herbs',
    sourceId: deterministicUuid(`herbs:${h.id}:clinical`),
    sourceTitle: h.name,
    contentType: 'indication',
  })

  // Chunk 3: Safety
  chunks.push({
    content: `${prefix} Safety and Contraindications.\nContraindications: ${h.contraindications.join(', ')}.\nDosha Karma: Vata=${h.doshaKarma.vata}, Pitta=${h.doshaKarma.pitta}, Kapha=${h.doshaKarma.kapha}.\nKey terms: ${h.name}, contraindications, safety, ${h.contraindications.slice(0, 2).join(', ')}.`,
    metadata: { id: h.id, section: 'safety' },
    sourceTable: 'herbs',
    sourceId: deterministicUuid(`herbs:${h.id}:safety`),
    sourceTitle: h.name,
    contentType: 'description',
  })

  return chunks
}

function chunkTreatment(t: TreatmentEntry): Chunk[] {
  const prefix = `Ayurvedic Treatment — ${t.name} (${t.sanskrit}):`
  const chunks: Chunk[] = []

  // Chunk 1: Description + Procedure
  chunks.push({
    content: `${prefix} Description and Procedure.\nTreatment: ${t.name} (${t.sanskrit}). Category: ${t.category}.\nDescription: ${t.description}.\nProcedure Steps: ${t.procedure.join('; ')}.\nDuration: ${t.duration}.\nKey terms: ${t.name}, ${t.sanskrit}, ${t.category}.`,
    metadata: { id: t.id, category: t.category, section: 'procedure' },
    sourceTable: 'treatments',
    sourceId: deterministicUuid(`treatments:${t.id}:procedure`),
    sourceTitle: t.name,
    contentType: 'procedure',
  })

  // Chunk 2: Indications + Safety
  chunks.push({
    content: `${prefix} Indications and Safety.\nIndications: ${t.indications.join(', ')}.\nContraindications: ${t.contraindications.join(', ')}.\nDuration: ${t.duration}.\nKey terms: ${t.name}, ${t.sanskrit}, ${t.indications.slice(0, 3).join(', ')}.`,
    metadata: { id: t.id, category: t.category, section: 'safety' },
    sourceTable: 'treatments',
    sourceId: deterministicUuid(`treatments:${t.id}:safety`),
    sourceTitle: t.name,
    contentType: 'procedure',
  })

  return chunks
}

function chunkDiagnostic(d: DiagnosticEntry): Chunk {
  return {
    content: `Diagnostic Method: ${d.name} (${d.sanskrit})\nDescription: ${d.description}\nComponents: ${d.components.join(', ')}\nClinical Application: ${d.clinicalApplication.join(', ')}`,
    metadata: { id: d.id },
    sourceTable: 'diagnostics',
    sourceId: deterministicUuid(`diagnostics:${d.id}`),
    sourceTitle: d.name,
    contentType: 'concept',
  }
}

function chunkAllopathy(a: AllopathyEntry): Chunk {
  return {
    content: `Condition: ${a.condition}\nAyurvedic Correlation: ${a.ayurvedicCorrelation}\nAllopathy Treatment: ${a.allopathyTreatment}\nIntegrated Approach: ${a.integratedApproach}\nSafety Notes: ${a.safetyNotes.join(', ')}\nMonitoring: ${a.monitoringParameters.join(', ')}`,
    metadata: { condition: a.condition },
    sourceTable: 'allopathy_integration',
    sourceId: deterministicUuid(`allopathy:${a.condition}`),
    sourceTitle: a.condition,
    contentType: 'procedure',
  }
}

// ─── Load Knowledge ──────────────────────────────────────────────────────────
async function loadKnowledge() {
  // Dynamic imports to work outside Next.js context
  const { CHARAK_SAMHITA_COMPLETE } = await import('./ayurknowledge/charak')
  const { DISEASES } = await import('./ayurknowledge/diseases')
  const { HERBS } = await import('./ayurknowledge/herbs')
  const { TREATMENTS } = await import('./ayurknowledge/treatments')
  const { DIAGNOSTIC_METHODS } = await import('./ayurknowledge/diagnostics')
  const { ALLOPATHY_INTEGRATION } = await import('./ayurknowledge/allopathy')
  const { FUNDAMENTALS, ASHTANGAS } = await import('./ayurknowledge/fundamentals')

  return { CHARAK_SAMHITA_COMPLETE, DISEASES, HERBS, TREATMENTS, DIAGNOSTIC_METHODS, ALLOPATHY_INTEGRATION, FUNDAMENTALS, ASHTANGAS }
}

function chunkFundamentals(fundamentals: Record<string, unknown>, ashtangas: unknown[]): Chunk[] {
  const chunks: Chunk[] = []

  // Each fundamental category as chunks
  for (const [category, items] of Object.entries(fundamentals)) {
    if (!Array.isArray(items)) continue
    for (const item of items) {
      const obj = item as Record<string, unknown>
      const name = (obj.term || obj.name || obj.type || category) as string
      const sanskrit = (obj.sanskrit || '') as string
      const definition = (obj.definition || obj.description || obj.function || '') as string
      const related = obj.relatedConcepts ? (obj.relatedConcepts as string[]).join(', ') : ''
      const modern = obj.modernCorrelation ? `\nModern Correlation: ${obj.modernCorrelation}` : ''

      chunks.push({
        content: `${category}: ${name}${sanskrit ? ` (${sanskrit})` : ''}\n${definition}${related ? `\nRelated: ${related}` : ''}${modern}`,
        metadata: { category, name },
        sourceTable: 'fundamentals',
        sourceId: deterministicUuid(`fundamentals:${category}:${name}`),
        sourceTitle: `${category}: ${name}`,
        contentType: 'concept',
      })
    }
  }

  // Ashtangas
  if (Array.isArray(ashtangas)) {
    for (const item of ashtangas) {
      const obj = item as Record<string, unknown>
      chunks.push({
        content: `Ashtanga Ayurveda: ${obj.name}${obj.sanskrit ? ` (${obj.sanskrit})` : ''}\n${obj.description || ''}\nFocus: ${((obj.focus as string[]) || []).join(', ')}`,
        metadata: { category: 'ashtanga', name: obj.name as string },
        sourceTable: 'fundamentals',
        sourceId: deterministicUuid(`fundamentals:ashtanga:${obj.name}`),
        sourceTitle: `Ashtanga: ${obj.name}`,
        contentType: 'concept',
      })
    }
  }

  return chunks
}

// ─── Chunk WHO Terminology ───────────────────────────────────────────────────
async function chunkWHO(): Promise<Chunk[]> {
  const fs = await import('fs')
  const path = await import('path')
  const whoPath = path.join(process.cwd(), 'src', 'lib', 'ayurknowledge', 'who-terminology.json')

  if (!fs.existsSync(whoPath)) {
    console.log('  WHO terminology file not found, skipping')
    return []
  }

  const raw = fs.readFileSync(whoPath, 'utf-8').replace(/^\uFEFF/, '')
  const data = JSON.parse(raw)

  // Flatten nested categories[].terms[] into a single array
  const categories: Array<{ name: string; terms: Array<Record<string, unknown>> }> = data.categories || []
  const terms: Array<{ term: string; sanskrit?: string; category: string; definition: string }> = []
  for (const cat of categories) {
    for (const t of (cat.terms || [])) {
      const english = (t.english || t.term || '') as string
      const sanskrit = (t.sanskritIAST || t.sanskritDevanagari || t.sanskrit_term || '') as string
      const definition = (t.definition || '') as string
      const category = (t.category || cat.name) as string
      if (english) {
        terms.push({ term: english, sanskrit, category, definition })
      }
    }
  }

  // Group terms by category for focused chunks
  const byCategory = new Map<string, typeof terms>()
  for (const t of terms) {
    const list = byCategory.get(t.category) || []
    list.push(t)
    byCategory.set(t.category, list)
  }

  const chunks: Chunk[] = []
  for (const [category, catTerms] of byCategory) {
    for (const batch of batchItems(catTerms, 3)) {
      const text = batch.map(t =>
        `${t.term}${t.sanskrit ? ` (${t.sanskrit})` : ''}: ${t.definition || 'No definition'}`
      ).join('\n---\n')

      chunks.push({
        content: `WHO Ayurveda Terminology — ${category}:\n${text}\nKey terms: ${batch.map(t => t.term).join(', ')}.`,
        metadata: { source: 'WHO', category, terms: batch.map(t => t.term) },
        sourceTable: 'who_terminology',
        sourceId: deterministicUuid(`who:${category}:${batch[0].term}`),
        sourceTitle: `WHO Terms: ${batch.map(t => t.term).join(', ')}`,
        contentType: 'definition',
      })
    }
  }

  return chunks
}

// ─── Chunk Sushruta Samhita ──────────────────────────────────────────────────

interface SushrutaChapterLike {
  id: string
  sthana: string
  chapterNumber: number
  name: string
  summary?: string
  keyConcepts?: string[]
  shlokas?: Array<{ number: string; translation: string; commentary?: string }>
  topics?: Array<{ title: string; content: string }>
  doshaDiscussion?: string[]
  treatmentProtocols?: Array<{ condition: string; treatment: string; herbs: string[] }>
  surgicalProcedures?: Array<{ name: string; sanskrit: string; indication: string; procedure: string[] }>
  anatomyDescriptions?: Array<{ structure: string; description: string }>
  clinicalApplications?: string[]
}

function chunkSushrutaChapter(chapter: SushrutaChapterLike): Chunk[] {
  const chunks: Chunk[] = []
  const baseMeta = { sthana: chapter.sthana, chapter: chapter.chapterNumber, name: chapter.name }
  const sourceTitle = `Sushruta Samhita ${chapter.sthana} Ch.${chapter.chapterNumber}: ${chapter.name}`

  // Summary
  if (chapter.summary) {
    chunks.push({
      content: `${sourceTitle}\n\n${chapter.summary}`,
      metadata: { ...baseMeta, section: 'summary' },
      sourceTable: 'sushruta_chapters',
      sourceId: deterministicUuid(`sushruta:${chapter.id}:summary`),
      sourceTitle,
      contentType: 'description',
    })
  }

  // Key concepts — batch 6 per chunk
  if (chapter.keyConcepts?.length) {
    for (const batch of batchItems(chapter.keyConcepts, 6)) {
      chunks.push({
        content: `${sourceTitle} - Key Concepts:\n${batch.map(c => `- ${c}`).join('\n')}`,
        metadata: { ...baseMeta, section: 'keyConcepts' },
        sourceTable: 'sushruta_chapters',
        sourceId: deterministicUuid(`sushruta:${chapter.id}:keyConcepts:${batch[0].slice(0, 30)}`),
        sourceTitle,
        contentType: 'concept',
      })
    }
  }

  // Shlokas — batch 2 per chunk
  if (chapter.shlokas?.length) {
    for (const batch of batchItems(chapter.shlokas, 2)) {
      const text = batch.map(s =>
        `[${s.number}] ${s.translation}${s.commentary ? ` -- ${s.commentary}` : ''}`
      ).join('\n\n')
      chunks.push({
        content: `${sourceTitle} - Verses:\n${text}`,
        metadata: { ...baseMeta, section: 'shlokas' },
        sourceTable: 'sushruta_chapters',
        sourceId: deterministicUuid(`sushruta:${chapter.id}:shlokas:${batch[0].number}`),
        sourceTitle,
        contentType: 'concept',
      })
    }
  }

  // Topics
  if (chapter.topics?.length) {
    for (const topic of chapter.topics) {
      chunks.push({
        content: `${sourceTitle} - ${topic.title}: ${topic.content}`,
        metadata: { ...baseMeta, section: 'topics', topicTitle: topic.title },
        sourceTable: 'sushruta_chapters',
        sourceId: deterministicUuid(`sushruta:${chapter.id}:topic:${topic.title.slice(0, 40)}`),
        sourceTitle,
        contentType: 'description',
      })
    }
  }

  // Surgical procedures (Sushruta-specific)
  if (chapter.surgicalProcedures?.length) {
    for (const proc of chapter.surgicalProcedures) {
      chunks.push({
        content: `${sourceTitle} - Surgical Procedure: ${proc.name} (${proc.sanskrit})\nIndication: ${proc.indication}\nProcedure: ${proc.procedure.join('; ')}`,
        metadata: { ...baseMeta, section: 'surgicalProcedure', procedure: proc.name },
        sourceTable: 'sushruta_chapters',
        sourceId: deterministicUuid(`sushruta:${chapter.id}:procedure:${proc.name.slice(0, 40)}`),
        sourceTitle,
        contentType: 'procedure',
      })
    }
  }

  // Anatomy descriptions (Sushruta-specific)
  if (chapter.anatomyDescriptions?.length) {
    for (const desc of chapter.anatomyDescriptions) {
      chunks.push({
        content: `${sourceTitle} - Anatomy: ${desc.structure}\n${desc.description}`,
        metadata: { ...baseMeta, section: 'anatomy', structure: desc.structure },
        sourceTable: 'sushruta_chapters',
        sourceId: deterministicUuid(`sushruta:${chapter.id}:anatomy:${desc.structure.slice(0, 40)}`),
        sourceTitle,
        contentType: 'description',
      })
    }
  }

  // Treatment protocols
  if (chapter.treatmentProtocols?.length) {
    for (const protocol of chapter.treatmentProtocols) {
      chunks.push({
        content: `${sourceTitle} - Treatment: ${protocol.condition}\n${protocol.treatment}\nHerbs: ${protocol.herbs.join(', ')}`,
        metadata: { ...baseMeta, section: 'treatmentProtocols', condition: protocol.condition },
        sourceTable: 'sushruta_chapters',
        sourceId: deterministicUuid(`sushruta:${chapter.id}:protocol:${protocol.condition.slice(0, 40)}`),
        sourceTitle,
        contentType: 'procedure',
      })
    }
  }

  // Dosha discussion — batch 4 per chunk
  if (chapter.doshaDiscussion?.length) {
    for (const batch of batchItems(chapter.doshaDiscussion, 4)) {
      chunks.push({
        content: `${sourceTitle} - Dosha Discussion:\n${batch.map(d => `- ${d}`).join('\n')}`,
        metadata: { ...baseMeta, section: 'doshaDiscussion' },
        sourceTable: 'sushruta_chapters',
        sourceId: deterministicUuid(`sushruta:${chapter.id}:dosha:${batch[0].slice(0, 30)}`),
        sourceTitle,
        contentType: 'concept',
      })
    }
  }

  // Clinical applications — batch 4 per chunk
  if (chapter.clinicalApplications?.length) {
    for (const batch of batchItems(chapter.clinicalApplications, 4)) {
      chunks.push({
        content: `${sourceTitle} - Clinical Applications:\n${batch.map(a => `- ${a}`).join('\n')}`,
        metadata: { ...baseMeta, section: 'clinicalApplications' },
        sourceTable: 'sushruta_chapters',
        sourceId: deterministicUuid(`sushruta:${chapter.id}:clinical:${batch[0].slice(0, 30)}`),
        sourceTitle,
        contentType: 'indication',
      })
    }
  }

  return chunks
}

// ─── Chunk Clinical Evidence (from Supabase) ─────────────────────────────────

interface ClinicalEvidenceRow {
  pmid: string
  title: string
  journal?: string
  publication_date?: string
  abstract?: string
  study_type?: string
  evidence_level?: string
  ayurveda_relevance?: string
  herbs_mentioned?: string[]
  conditions_mentioned?: string[]
  mesh_terms?: string[]
}

function chunkClinicalEvidence(e: ClinicalEvidenceRow): Chunk[] {
  const chunks: Chunk[] = []
  const prefix = `Clinical Evidence [PMID: ${e.pmid}]:`

  // Chunk 1: Abstract + relevance
  const abstractText = e.abstract || 'No abstract available'
  chunks.push({
    content: `${prefix} ${e.title}\nJournal: ${e.journal || 'Unknown'} (${e.publication_date || 'N/A'})\nStudy Type: ${e.study_type || 'N/A'} | Evidence Level: ${e.evidence_level || 'N/A'}\nAbstract: ${abstractText}\nAyurveda Relevance: ${e.ayurveda_relevance || 'Ayurveda research'}`,
    metadata: { pmid: e.pmid, studyType: e.study_type, evidenceLevel: e.evidence_level, section: 'abstract' },
    sourceTable: 'clinical_evidence',
    sourceId: deterministicUuid(`clinical_evidence:${e.pmid}:abstract`),
    sourceTitle: e.title,
    contentType: 'description',
  })

  // Chunk 2: Cross-references (herbs, conditions, MeSH)
  const refs = []
  if (e.herbs_mentioned?.length) refs.push(`Herbs: ${e.herbs_mentioned.join(', ')}`)
  if (e.conditions_mentioned?.length) refs.push(`Conditions: ${e.conditions_mentioned.join(', ')}`)
  if (e.mesh_terms?.length) refs.push(`MeSH Terms: ${e.mesh_terms.join(', ')}`)
  if (refs.length > 0) {
    chunks.push({
      content: `${prefix} Cross-references.\n${refs.join('\n')}`,
      metadata: { pmid: e.pmid, herbs: e.herbs_mentioned, conditions: e.conditions_mentioned, section: 'references' },
      sourceTable: 'clinical_evidence',
      sourceId: deterministicUuid(`clinical_evidence:${e.pmid}:refs`),
      sourceTitle: e.title,
      contentType: 'concept',
    })
  }

  return chunks
}

// ─── Chunk External Q&A (from Supabase) ──────────────────────────────────────

interface ExternalQARow {
  id: string
  source_dataset: string
  question: string
  answer: string
  context?: string
  category?: string
}

function chunkExternalQA(qa: ExternalQARow): Chunk {
  const prefix = qa.source_dataset === 'sushruta_qa' ? 'Sushruta Samhita Q&A' : 'Ayurveda Q&A'
  return {
    content: `${prefix}: ${qa.question}\nAnswer: ${qa.answer}${qa.context ? `\nContext: ${qa.context}` : ''}`,
    metadata: { source: qa.source_dataset, category: qa.category, section: 'qa' },
    sourceTable: 'external_qa',
    sourceId: deterministicUuid(`external_qa:${qa.source_dataset}:${qa.id}`),
    sourceTitle: qa.question.slice(0, 100),
    contentType: 'description',
  }
}

// ─── Chunk Modern Medicines (from Supabase) ──────────────────────────────────

interface ModernMedicineRow {
  id: string
  medicine_name: string
  composition: string
  uses: string
  side_effects?: string
  precautions?: string
  drug_interactions?: string
  ayurvedic_alternatives?: string[]
  therapeutic_class?: string
}

function chunkModernMedicine(med: ModernMedicineRow): Chunk[] {
  const chunks: Chunk[] = []
  const prefix = `Modern Medicine: ${med.medicine_name}`

  // Chunk 1: Uses + composition
  chunks.push({
    content: `${prefix}\nComposition: ${med.composition}\nUses: ${med.uses}\nTherapeutic Class: ${med.therapeutic_class || 'N/A'}`,
    metadata: { id: med.id, section: 'uses' },
    sourceTable: 'modern_medicines',
    sourceId: deterministicUuid(`modern_medicines:${med.id}:uses`),
    sourceTitle: med.medicine_name,
    contentType: 'indication',
  })

  // Chunk 2: Safety + Ayurvedic alternatives
  const safetyParts = []
  if (med.side_effects) safetyParts.push(`Side Effects: ${med.side_effects}`)
  if (med.precautions) safetyParts.push(`Precautions: ${med.precautions}`)
  if (med.drug_interactions) safetyParts.push(`Drug Interactions: ${med.drug_interactions}`)
  if (med.ayurvedic_alternatives?.length) safetyParts.push(`Ayurvedic Alternatives: ${med.ayurvedic_alternatives.join(', ')}`)

  if (safetyParts.length > 0) {
    chunks.push({
      content: `${prefix} Safety Profile.\n${safetyParts.join('\n')}`,
      metadata: { id: med.id, section: 'safety' },
      sourceTable: 'modern_medicines',
      sourceId: deterministicUuid(`modern_medicines:${med.id}:safety`),
      sourceTitle: med.medicine_name,
      contentType: 'description',
    })
  }

  return chunks
}

// ─── Chunk Case Studies (from local JSON) ────────────────────────────────────

interface CaseStudyData {
  caseNumber: number
  diseaseName: string
  modernName: string
  part1Sections: {
    nidanaam: string[]
    purvaroopam: string[]
    lakshanam: string[]
    systemicExam: string[]
    labInvestigations: string[]
  }
  part2Sections: {
    differentialDiagnosis: string[]
    samprapti: string
    sampraptiGhataka: string[]
    upashaya: string[]
    anupashaya: string[]
    samanyaChikitsa: string[]
    visheshaChikitsa: string[]
    surgicalManagement: string[]
  }
  references: string[]
  rawPart1: string
  rawPart2: string
}

function chunkCaseStudy(cs: CaseStudyData): Chunk[] {
  const chunks: Chunk[] = []
  const title = cs.modernName
    ? `${cs.diseaseName} (${cs.modernName})`
    : cs.diseaseName
  const prefix = `Ayurvedic Case Study #${cs.caseNumber} — ${title}`
  const baseMeta = { caseNumber: cs.caseNumber, disease: cs.diseaseName }

  // Chunk 1: Overview + pathogenesis summary
  const overviewParts = [`${prefix}.`]
  if (cs.part2Sections.samprapti) overviewParts.push(`Pathogenesis: ${cs.part2Sections.samprapti}`)
  chunks.push({
    content: overviewParts.join('\n'),
    metadata: { ...baseMeta, section: 'overview' },
    sourceTable: 'case_studies',
    sourceId: deterministicUuid(`case_studies:${cs.caseNumber}:overview`),
    sourceTitle: title,
    contentType: 'description',
  })

  // Chunk 2: Etiology
  if (cs.part1Sections.nidanaam.length > 0) {
    chunks.push({
      content: `${prefix} — Etiology (Nidanam).\n${cs.part1Sections.nidanaam.map(i => `- ${i}`).join('\n')}`,
      metadata: { ...baseMeta, section: 'etiology' },
      sourceTable: 'case_studies',
      sourceId: deterministicUuid(`case_studies:${cs.caseNumber}:etiology`),
      sourceTitle: title,
      contentType: 'description',
    })
  }

  // Chunk 3: Symptoms (purvaroopam + lakshanam)
  const symptomParts: string[] = []
  if (cs.part1Sections.purvaroopam.length > 0) {
    symptomParts.push(`Prodromal Symptoms:\n${cs.part1Sections.purvaroopam.map(i => `- ${i}`).join('\n')}`)
  }
  if (cs.part1Sections.lakshanam.length > 0) {
    symptomParts.push(`Clinical Features:\n${cs.part1Sections.lakshanam.map(i => `- ${i}`).join('\n')}`)
  }
  if (symptomParts.length > 0) {
    chunks.push({
      content: `${prefix} — Symptoms.\n${symptomParts.join('\n\n')}`,
      metadata: { ...baseMeta, section: 'symptoms' },
      sourceTable: 'case_studies',
      sourceId: deterministicUuid(`case_studies:${cs.caseNumber}:symptoms`),
      sourceTitle: title,
      contentType: 'description',
    })
  }

  // Chunk 4: Differential Diagnosis
  if (cs.part2Sections.differentialDiagnosis.length > 0) {
    chunks.push({
      content: `${prefix} — Differential Diagnosis.\n${cs.part2Sections.differentialDiagnosis.map(i => `- ${i}`).join('\n')}`,
      metadata: { ...baseMeta, section: 'differentialDiagnosis' },
      sourceTable: 'case_studies',
      sourceId: deterministicUuid(`case_studies:${cs.caseNumber}:diffdx`),
      sourceTitle: title,
      contentType: 'description',
    })
  }

  // Chunk 5: Pathogenesis (samprapti + ghatakas)
  const pathParts: string[] = []
  if (cs.part2Sections.samprapti) pathParts.push(cs.part2Sections.samprapti)
  if (cs.part2Sections.sampraptiGhataka.length > 0) {
    pathParts.push(`Samprapti Ghataka:\n${cs.part2Sections.sampraptiGhataka.map(i => `- ${i}`).join('\n')}`)
  }
  if (pathParts.length > 0) {
    chunks.push({
      content: `${prefix} — Pathogenesis (Samprapti).\n${pathParts.join('\n\n')}`,
      metadata: { ...baseMeta, section: 'pathogenesis' },
      sourceTable: 'case_studies',
      sourceId: deterministicUuid(`case_studies:${cs.caseNumber}:pathogenesis`),
      sourceTitle: title,
      contentType: 'description',
    })
  }

  // Chunk 6: Treatment (samanya + vishesha + surgical)
  const txParts: string[] = []
  if (cs.part2Sections.samanyaChikitsa.length > 0) {
    txParts.push(`General Treatment (Samanya Chikitsa):\n${cs.part2Sections.samanyaChikitsa.map(i => `- ${i}`).join('\n')}`)
  }
  if (cs.part2Sections.visheshaChikitsa.length > 0) {
    txParts.push(`Specific Treatment (Vishesha Chikitsa):\n${cs.part2Sections.visheshaChikitsa.map(i => `- ${i}`).join('\n')}`)
  }
  if (cs.part2Sections.surgicalManagement.length > 0) {
    txParts.push(`Surgical Management:\n${cs.part2Sections.surgicalManagement.map(i => `- ${i}`).join('\n')}`)
  }
  if (txParts.length > 0) {
    chunks.push({
      content: `${prefix} — Treatment.\n${txParts.join('\n\n')}`,
      metadata: { ...baseMeta, section: 'treatment' },
      sourceTable: 'case_studies',
      sourceId: deterministicUuid(`case_studies:${cs.caseNumber}:treatment`),
      sourceTitle: title,
      contentType: 'procedure',
    })
  }

  // Chunk 7: Aggravating/Relieving factors
  const factorParts: string[] = []
  if (cs.part2Sections.upashaya.length > 0) {
    factorParts.push(`Relieving Factors (Upashaya):\n${cs.part2Sections.upashaya.map(i => `- ${i}`).join('\n')}`)
  }
  if (cs.part2Sections.anupashaya.length > 0) {
    factorParts.push(`Aggravating Factors (Anupashaya):\n${cs.part2Sections.anupashaya.map(i => `- ${i}`).join('\n')}`)
  }
  if (factorParts.length > 0) {
    chunks.push({
      content: `${prefix} — Relieving and Aggravating Factors.\n${factorParts.join('\n\n')}`,
      metadata: { ...baseMeta, section: 'factors' },
      sourceTable: 'case_studies',
      sourceId: deterministicUuid(`case_studies:${cs.caseNumber}:factors`),
      sourceTitle: title,
      contentType: 'concept',
    })
  }

  // Chunk 8: References
  if (cs.references.length > 0) {
    chunks.push({
      content: `${prefix} — Classical References.\n${cs.references.map(r => `- ${r}`).join('\n')}`,
      metadata: { ...baseMeta, section: 'references' },
      sourceTable: 'case_studies',
      sourceId: deterministicUuid(`case_studies:${cs.caseNumber}:references`),
      sourceTitle: title,
      contentType: 'concept',
    })
  }

  // Chunk 9-10: Full raw text (for comprehensive RAG retrieval)
  if (cs.rawPart1) {
    chunks.push({
      content: `${prefix} — Full Part 1 (Etiology, Symptoms, Examination, Investigations).\n${cs.rawPart1}`,
      metadata: { ...baseMeta, section: 'rawPart1' },
      sourceTable: 'case_studies',
      sourceId: deterministicUuid(`case_studies:${cs.caseNumber}:rawPart1`),
      sourceTitle: title,
      contentType: 'description',
    })
  }
  if (cs.rawPart2) {
    chunks.push({
      content: `${prefix} — Full Part 2 (Diagnosis, Pathogenesis, Treatment).\n${cs.rawPart2}`,
      metadata: { ...baseMeta, section: 'rawPart2' },
      sourceTable: 'case_studies',
      sourceId: deterministicUuid(`case_studies:${cs.caseNumber}:rawPart2`),
      sourceTitle: title,
      contentType: 'description',
    })
  }

  return chunks
}

async function chunkCaseStudiesFromJson(): Promise<Chunk[]> {
  const fs = await import('fs')
  const path = await import('path')
  const jsonPath = path.join(process.cwd(), 'src', 'lib', 'ayurknowledge', 'case-studies.json')

  if (!fs.existsSync(jsonPath)) {
    console.log('  Case studies JSON not found, skipping')
    return []
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8').replace(/^\uFEFF/, '')
  const cases: CaseStudyData[] = JSON.parse(raw)
  console.log(`  Loaded ${cases.length} case studies from JSON`)

  const chunks: Chunk[] = []
  for (const cs of cases) {
    chunks.push(...chunkCaseStudy(cs))
  }
  return chunks
}

// ─── Load External Sources from Supabase ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadSupabaseSources(supabase: any) {
  const [sushrutaResult, clinicalResult, qaResult, medicineResult] = await Promise.all([
    supabase.from('sushruta_chapters').select('*').limit(5000),
    supabase.from('clinical_evidence').select('*').limit(10000),
    supabase.from('external_qa').select('*').limit(20000),
    supabase.from('modern_medicines').select('*').limit(20000),
  ])

  return {
    sushrutaChapters: sushrutaResult.data || [],
    clinicalEvidence: clinicalResult.data || [],
    externalQA: qaResult.data || [],
    modernMedicines: medicineResult.data || [],
  }
}

// ─── Embedding Generation ────────────────────────────────────────────────────
async function generateEmbeddings(openai: OpenAI, texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = []
  let skipped = 0

  function sanitizeForEmbedding(text: string): string {
    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
      .replace(/\uFFFD/g, '') // replacement char
      .replace(/[\u0900-\u097F]/g, '') // Devanagari script (NIM may not support)
      .replace(/[^\x20-\x7E\u00C0-\u024F\u2018-\u201F\u2013\u2014]/g, '') // keep ASCII + Latin Extended + common punctuation
      .replace(/\s+/g, ' ') // collapse whitespace after removal
      .trim()
  }

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE).map(sanitizeForEmbedding)
    try {
      const response = await withRetry(() =>
        openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: batch,
          encoding_format: 'float',
          // @ts-expect-error -- NVIDIA NIM requires input_type for asymmetric models
          input_type: 'passage',
        })
      )

      for (const item of response.data) {
        const emb = item.embedding as number[]
        if (!validateEmbedding(emb)) {
          console.warn(`  Invalid embedding at index ${i + response.data.indexOf(item)}, skipping`)
          allEmbeddings.push(null as unknown as number[])
        } else {
          allEmbeddings.push(emb)
        }
      }
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string }
      if (err?.status === 400 && batch.length > 1) {
        // Batch failed, try individual texts to skip oversized ones
        console.warn(`\n  Batch at offset ${i} failed (oversized input), trying individually...`)
        for (const text of batch) {
          const sanitized = sanitizeForEmbedding(text)
          // Try progressively shorter versions before giving up
          const truncations = [sanitized.length, 300, 200, 100]
          let embedded = false
          for (const maxLen of truncations) {
            const truncated = maxLen < sanitized.length ? sanitized.slice(0, maxLen) : sanitized
            if (!truncated.trim()) break
            try {
              const resp = await openai.embeddings.create({
                model: EMBEDDING_MODEL,
                input: [truncated],
                encoding_format: 'float',
                // @ts-expect-error -- NVIDIA NIM requires input_type for asymmetric models
                input_type: 'passage',
              })
              const emb = resp.data[0].embedding as number[]
              if (validateEmbedding(emb)) {
                allEmbeddings.push(emb)
                if (maxLen < sanitized.length) {
                  console.warn(`  Truncated chunk (${text.length}→${maxLen} chars) to embed successfully`)
                }
                embedded = true
                break
              }
            } catch { /* try next shorter */ }
          }
          if (!embedded) {
            console.warn(`  Skipped unembeddable chunk (${text.length} chars)`)
            allEmbeddings.push(null as unknown as number[])
            skipped++
          }
        }
      } else {
        throw error
      }
    }

    process.stdout.write(`  Embedded ${Math.min(i + BATCH_SIZE, texts.length)}/${texts.length}${skipped > 0 ? ` (${skipped} skipped)` : ''}\r`)

    if (i + BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES_MS))
    }
  }

  console.log()
  if (skipped > 0) console.log(`  Skipped ${skipped} oversized chunks (zero vectors used)`)
  return allEmbeddings
}

// ─── Supabase Upsert ─────────────────────────────────────────────────────────
async function upsertChunks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  chunks: Chunk[],
  embeddings: number[][]
): Promise<number> {
  let upserted = 0
  let nullEmbeddings = 0

  for (let i = 0; i < chunks.length; i += UPSERT_BATCH) {
    const batchChunks = chunks.slice(i, i + UPSERT_BATCH)
    const batchEmbeddings = embeddings.slice(i, i + UPSERT_BATCH)

    const rows: Array<{
      id: string; source_table: string; source_id: string; source_title: string;
      content_type: string; content: string; content_hash: string;
      metadata: Record<string, unknown>; embedding: string | null
    }> = []
    for (let j = 0; j < batchChunks.length; j++) {
      if (!batchEmbeddings[j]) {
        nullEmbeddings++
      }
      rows.push({
        id: deterministicUuid(`emb:${batchChunks[j].sourceTable}:${batchChunks[j].sourceId}:${batchChunks[j].metadata.section || 'main'}`),
        source_table: batchChunks[j].sourceTable,
        source_id: batchChunks[j].sourceId,
        source_title: batchChunks[j].sourceTitle,
        content_type: batchChunks[j].contentType,
        content: batchChunks[j].content,
        content_hash: createHash('md5').update(batchChunks[j].content).digest('hex'),
        metadata: sanitizeForJson(batchChunks[j].metadata) as Record<string, unknown>,
        embedding: batchEmbeddings[j] ? `[${batchEmbeddings[j].join(',')}]` : null,
      })
    }

    // Deduplicate by id within batch to avoid ON CONFLICT error
    const seen = new Set<string>()
    const dedupedRows: typeof rows = []
    for (const r of rows) {
      if (!seen.has(r.id)) {
        seen.add(r.id)
        dedupedRows.push(r)
      }
    }

    const { error } = await supabase
      .from('knowledge_embeddings')
      .upsert(dedupedRows, { onConflict: 'id' })

    if (error) {
      console.error(`  Upsert batch ${Math.floor(i / UPSERT_BATCH)} failed: ${error.message}`)
      // Retry once
      await new Promise(r => setTimeout(r, 2000))
      const { error: retryError } = await supabase
        .from('knowledge_embeddings')
        .upsert(dedupedRows, { onConflict: 'id' })
      if (retryError) {
        console.error(`  Retry failed, upserting individually...`)
        let individualFailed = 0
        for (const row of dedupedRows) {
          const { error: singleError } = await supabase
            .from('knowledge_embeddings')
            .upsert([row], { onConflict: 'id' })
          if (singleError) {
            console.error(`    Individual upsert failed for ${row.id}: ${singleError.message}`)
            individualFailed++
          }
        }
        if (individualFailed > 0) {
          console.error(`    ${individualFailed}/${dedupedRows.length} individual rows failed`)
        }
      }
    }

    upserted += dedupedRows.length
    process.stdout.write(`  Upserted ${upserted}/${chunks.length}\r`)
  }

  console.log()
  if (nullEmbeddings > 0) {
    console.warn(`  ${nullEmbeddings} chunks stored without embedding (vector search unavailable, full-text only)`)
  }
  return upserted
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const force = process.argv.includes('--force')
  const dryRun = process.argv.includes('--dry-run')

  // Validate env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const nvidiaKey = process.env.NVIDIA_API_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  if (!nvidiaKey && !dryRun) {
    console.error('Missing NVIDIA_API_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  console.log('Loading knowledge base...')
  const knowledge = await loadKnowledge()

  // Build all chunks
  console.log('Chunking Charak Samhita chapters...')
  const charakChunks: Chunk[] = []
  const charakChapters: any[] = []
  const complete = knowledge.CHARAK_SAMHITA_COMPLETE as any
  if (complete) {
    if (complete.prameha) charakChapters.push({ ...complete.prameha, id: 'prameha', name: 'Prameha', sthana: 'Chikitsa Sthana', chapterNumber: 6 })
    if (complete.vataVyadhi) charakChapters.push({ ...complete.vataVyadhi, id: 'vatavyadhi', name: 'Vata Vyadhi', sthana: 'Chikitsa Sthana', chapterNumber: 28 })
    if (complete.jwara) charakChapters.push({ ...complete.jwara, id: 'jwara', name: 'Jwara', sthana: 'Chikitsa Sthana', chapterNumber: 3 })
  }
  for (const chapter of charakChapters) {
    charakChunks.push(...chunkCharakChapter(chapter as unknown as CharakChapter))
  }
  console.log(`  ${charakChunks.length} chunks from ${charakChapters.length} chapters`)

  console.log('Chunking diseases...')
  const diseaseChunks = knowledge.DISEASES.flatMap(chunkDisease)
  console.log(`  ${diseaseChunks.length} chunks`)

  console.log('Chunking herbs...')
  const herbChunks = knowledge.HERBS.flatMap(chunkHerb)
  console.log(`  ${herbChunks.length} chunks`)

  console.log('Chunking treatments...')
  const treatmentChunks = knowledge.TREATMENTS.flatMap(chunkTreatment)
  console.log(`  ${treatmentChunks.length} chunks`)

  console.log('Chunking diagnostics...')
  const diagnosticChunks = knowledge.DIAGNOSTIC_METHODS.map(chunkDiagnostic)
  console.log(`  ${diagnosticChunks.length} chunks`)

  console.log('Chunking allopathy integrations...')
  const allopathyChunks = knowledge.ALLOPATHY_INTEGRATION.map(chunkAllopathy)
  console.log(`  ${allopathyChunks.length} chunks`)

  console.log('Chunking fundamentals...')
  const fundamentalChunks = chunkFundamentals(
    knowledge.FUNDAMENTALS as unknown as Record<string, unknown>,
    knowledge.ASHTANGAS as unknown as unknown[]
  )
  console.log(`  ${fundamentalChunks.length} chunks`)

  console.log('Chunking WHO terminology...')
  const whoChunks = await chunkWHO()
  console.log(`  ${whoChunks.length} chunks`)

  console.log('Chunking case studies...')
  const caseStudyChunks = await chunkCaseStudiesFromJson()
  console.log(`  ${caseStudyChunks.length} chunks`)

  // ── External sources (from Supabase tables, populated by ingestion scripts) ──
  console.log('Loading external sources from Supabase...')
  const externalSources = await loadSupabaseSources(supabase)

  console.log('Chunking Sushruta chapters...')
  const sushrutaChunks: Chunk[] = []
  for (const chapter of externalSources.sushrutaChapters) {
    sushrutaChunks.push(...chunkSushrutaChapter(chapter))
  }
  console.log(`  ${sushrutaChunks.length} chunks from ${externalSources.sushrutaChapters.length} chapters`)

  console.log('Chunking clinical evidence...')
  const clinicalChunks = externalSources.clinicalEvidence.flatMap(chunkClinicalEvidence)
  console.log(`  ${clinicalChunks.length} chunks from ${externalSources.clinicalEvidence.length} papers`)

  console.log('Chunking external Q&A...')
  const qaChunks = externalSources.externalQA.map(chunkExternalQA)
  console.log(`  ${qaChunks.length} chunks from ${externalSources.externalQA.length} Q&A pairs`)

  console.log('Chunking modern medicines...')
  const medicineChunks = externalSources.modernMedicines.flatMap(chunkModernMedicine)
  console.log(`  ${medicineChunks.length} chunks from ${externalSources.modernMedicines.length} medicines`)

  const allChunks = [
    ...charakChunks,
    ...diseaseChunks,
    ...herbChunks,
    ...treatmentChunks,
    ...diagnosticChunks,
    ...allopathyChunks,
    ...fundamentalChunks,
    ...whoChunks,
    ...caseStudyChunks,
    ...sushrutaChunks,
    ...clinicalChunks,
    ...qaChunks,
    ...medicineChunks,
  ]

  // Split oversized chunks to stay within 512-token limit
  const sizedChunks = allChunks.flatMap(splitOversizedChunk)
  const splitCount = sizedChunks.length - allChunks.length
  if (splitCount > 0) {
    console.log(`  Split ${splitCount} oversized chunks into smaller pieces`)
  }

  console.log(`\nTotal chunks: ${sizedChunks.length}`)

  if (dryRun) {
    console.log('\n[DRY RUN] Chunk breakdown:')
    console.log(`  Charak chapters: ${charakChunks.length}`)
    console.log(`  Diseases: ${diseaseChunks.length}`)
    console.log(`  Herbs: ${herbChunks.length}`)
    console.log(`  Treatments: ${treatmentChunks.length}`)
    console.log(`  Diagnostics: ${diagnosticChunks.length}`)
    console.log(`  Allopathy: ${allopathyChunks.length}`)
    console.log(`  Fundamentals: ${fundamentalChunks.length}`)
    console.log(`  WHO terms: ${whoChunks.length}`)
    console.log(`  Case studies: ${caseStudyChunks.length}`)
    console.log(`  Sushruta chapters: ${sushrutaChunks.length}`)
    console.log(`  Clinical evidence: ${clinicalChunks.length}`)
    console.log(`  External Q&A: ${qaChunks.length}`)
    console.log(`  Modern medicines: ${medicineChunks.length}`)
    console.log(`  After splitting: ${sizedChunks.length}`)
    return
  }

  // Filter to only new chunks
  let chunksToEmbed = sizedChunks
  if (!force) {
    console.log('Checking existing embeddings...')
    const { data: existing } = await supabase
      .from('knowledge_embeddings')
      .select('source_table, source_id, metadata, content_hash')

    const existingKeys = new Map<string, string>() // key -> content_hash
    for (const row of existing || []) {
      const section = (row.metadata as Record<string, unknown>)?.section || 'main'
      const key = `${row.source_table}:${row.source_id}:${section}`
      existingKeys.set(key, row.content_hash || '')
    }

    chunksToEmbed = sizedChunks.filter(c => {
      const section = (c.metadata as Record<string, unknown>)?.section || 'main'
      const key = `${c.sourceTable}:${c.sourceId}:${section}`
      const existingHash = existingKeys.get(key)
      if (!existingHash) return true // New chunk
      // Re-embed if content changed
      const currentHash = createHash('md5').update(c.content).digest('hex')
      return existingHash !== currentHash
    })

    console.log(`Skipping ${sizedChunks.length - chunksToEmbed.length} existing embeddings`)
  }

  if (chunksToEmbed.length === 0) {
    console.log('All embeddings up to date.')
    return
  }

  console.log(`\nGenerating embeddings for ${chunksToEmbed.length} chunks...`)
  const openai = new OpenAI({ apiKey: nvidiaKey, baseURL: 'https://integrate.api.nvidia.com/v1' })
  const texts = chunksToEmbed.map(c => c.content)
  const embeddings = await generateEmbeddings(openai, texts)

  console.log('\nUpserting to Supabase...')
  const upserted = await upsertChunks(supabase, chunksToEmbed, embeddings)

  console.log(`\nDone! ${upserted} embeddings generated and stored.`)

  // Verify
  const { count } = await supabase
    .from('knowledge_embeddings')
    .select('*', { count: 'exact', head: true })

  console.log(`Total embeddings in database: ${count}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
