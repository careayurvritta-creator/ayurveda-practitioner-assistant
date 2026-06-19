/**
 * Input-Based RAG Learning
 *
 * Chunks confirmed clinical cases (diagnosis, treatment, outcomes) and embeds
 * them into the knowledge_embeddings table so future RAG queries surface real
 * clinical experience alongside textbook knowledge.
 *
 * Source table: 'clinical_cases'
 * Embedding model: nvidia/nv-embedqa-e5-v5 (1024 dimensions)
 * Max chunk: 400 chars (consistent with embed-knowledge.ts)
 */

import { createHash } from 'crypto'
import { generateBatchEmbeddings } from './embedding-client'

function createServerClient(): any {
  const handler = {
    get(target: any, prop: string): any {
      if (prop === 'from') {
        const queryBuilder: any = {
          select: () => queryBuilder,
          eq: () => queryBuilder,
          order: () => queryBuilder,
          limit: () => queryBuilder,
          maybeSingle: async () => ({ data: null, error: null }),
          single: async () => ({ data: null, error: null }),
          upsert: async () => ({ data: [], error: null }),
        };
        return () => queryBuilder;
      }
      return () => ({ error: null, data: [] });
    }
  };
  return new Proxy({}, handler);
}

const MAX_CHUNK_CHARS = 400

// ─── Types ──────────────────────────────────────────────────────────────────
interface ClinicalChunk {
  content: string
  metadata: Record<string, unknown>
  sourceTable: string
  sourceId: string
  sourceTitle: string
  contentType: string
}

interface CaseRow {
  id: string
  case_number: string
  chief_complaints: unknown
  duration: string | null
  severity_score: number | null
  nadi: string | null
  mootra: string | null
  mala: string | null
  jivha: string | null
  drik: string | null
  sparsh: string | null
  shabda: string | null
  aakriti: string | null
  prakriti: string | null
  prakriti_detail: string | null
  saara: string | null
  samhanana: string | null
  satva: string | null
  ahara_shakti: string | null
  vyayama_shakti: string | null
  desha: string | null
  comorbidities: unknown
  medical_history: unknown
  allergies: string | null
  family_history: string | null
  ongoing_medications: string | null
  investigation_text: string | null
  investigation_findings: unknown
  provisional_diagnosis: string | null
  provisional_reasoning: string | null
  treatment_plan: string | null
  status: string
  completed_at: string | null
}

interface TreatmentProtocolRow {
  id: string
  protocol_number: string
  diagnosis: string | null
  prakriti: string | null
  protocol_content: string | null
}

interface CaseOutcomeRow {
  outcome_rating: number | null
  outcome_label: string | null
  doctor_notes: string | null
  clinical_observations: string | null
  what_worked: string[] | null
  what_didnt_work: string[] | null
  patient_feedback: string | null
}

interface ChiefComplaint {
  complaint: string
  duration?: string
  severity?: number
  location?: string
  onset?: string
  aggravating_factors?: string
  relieving_factors?: string
  associated_symptoms?: string[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function deterministicUuid(input: string): string {
  const hash = createHash('sha256').update(input).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-')
}

function truncate(text: string, max: number = MAX_CHUNK_CHARS): string {
  if (text.length <= max) return text
  // Cut at last sentence boundary within limit
  const cut = text.slice(0, max)
  const lastPeriod = cut.lastIndexOf('. ')
  const lastNewline = cut.lastIndexOf('\n')
  const breakAt = Math.max(lastPeriod, lastNewline)
  return breakAt > max * 0.5 ? cut.slice(0, breakAt + 1) : cut.slice(0, max - 3) + '...'
}

function parseComplaints(raw: unknown): ChiefComplaint[] {
  if (Array.isArray(raw)) return raw as ChiefComplaint[]
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return [] }
  }
  return []
}

function parseStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return [] }
  }
  return []
}

// ─── Chunking ───────────────────────────────────────────────────────────────
function chunkClinicalCase(
  caseRow: CaseRow,
  complaints: ChiefComplaint[],
  protocol: TreatmentProtocolRow | null,
  outcome: CaseOutcomeRow | null
): ClinicalChunk[] {
  const chunks: ClinicalChunk[] = []
  const prefix = `Clinical Case ${caseRow.case_number}`
  const baseMeta = { caseNumber: caseRow.case_number, status: caseRow.status }
  const srcId = (section: string) => deterministicUuid(`clinical_cases:${caseRow.id}:${section}`)

  // Chunk 1: Overview
  const overviewParts = [`${prefix}.`]
  if (caseRow.prakriti) overviewParts.push(`Prakriti: ${caseRow.prakriti}`)
  if (caseRow.provisional_diagnosis) overviewParts.push(`Diagnosis: ${caseRow.provisional_diagnosis}`)
  if (complaints.length > 0) {
    const complaintSummary = complaints.map(c => c.complaint).join(', ')
    overviewParts.push(`Chief Complaints: ${complaintSummary}`)
  }
  if (caseRow.duration) overviewParts.push(`Duration: ${caseRow.duration}`)
  if (caseRow.comorbidities) {
    const comorbs = parseStringArray(caseRow.comorbidities)
    if (comorbs.length > 0) overviewParts.push(`Comorbidities: ${comorbs.join(', ')}`)
  }
  chunks.push({
    content: truncate(overviewParts.join('\n')),
    metadata: { ...baseMeta, section: 'overview' },
    sourceTable: 'clinical_cases',
    sourceId: srcId('overview'),
    sourceTitle: `Case ${caseRow.case_number} — ${caseRow.provisional_diagnosis || 'Clinical Case'}`,
    contentType: 'description',
  })

  // Chunk 2: Symptoms (detailed complaints)
  if (complaints.length > 0) {
    const symptomParts = complaints.map(c => {
      let s = `- ${c.complaint}`
      if (c.duration) s += ` (${c.duration})`
      if (c.severity) s += ` severity: ${c.severity}/10`
      if (c.location) s += ` location: ${c.location}`
      if (c.aggravating_factors) s += ` aggravating: ${c.aggravating_factors}`
      if (c.relieving_factors) s += ` relieving: ${c.relieving_factors}`
      return s
    })
    chunks.push({
      content: truncate(`${prefix} — Symptoms.\n${symptomParts.join('\n')}`),
      metadata: { ...baseMeta, section: 'symptoms' },
      sourceTable: 'clinical_cases',
      sourceId: srcId('symptoms'),
      sourceTitle: `Case ${caseRow.case_number} — ${caseRow.provisional_diagnosis || 'Symptoms'}`,
      contentType: 'description',
    })
  }

  // Chunk 3: Examination (Ashtavidha Pariksha)
  const examParts: string[] = []
  if (caseRow.nadi) examParts.push(`Nadi: ${caseRow.nadi}`)
  if (caseRow.mootra) examParts.push(`Mootra: ${caseRow.mootra}`)
  if (caseRow.mala) examParts.push(`Mala: ${caseRow.mala}`)
  if (caseRow.jivha) examParts.push(`Jivha: ${caseRow.jivha}`)
  if (caseRow.drik) examParts.push(`Drik: ${caseRow.drik}`)
  if (caseRow.sparsh) examParts.push(`Sparsh: ${caseRow.sparsh}`)
  if (caseRow.shabda) examParts.push(`Shabda: ${caseRow.shabda}`)
  if (caseRow.aakriti) examParts.push(`Aakriti: ${caseRow.aakriti}`)
  if (caseRow.satva) examParts.push(`Satva: ${caseRow.satva}`)
  if (caseRow.ahara_shakti) examParts.push(`Ahara Shakti: ${caseRow.ahara_shakti}`)
  if (caseRow.vyayama_shakti) examParts.push(`Vyayama Shakti: ${caseRow.vyayama_shakti}`)
  if (examParts.length > 0) {
    chunks.push({
      content: truncate(`${prefix} — Ashtavidha Pariksha.\n${examParts.join('\n')}`),
      metadata: { ...baseMeta, section: 'examination' },
      sourceTable: 'clinical_cases',
      sourceId: srcId('examination'),
      sourceTitle: `Case ${caseRow.case_number} — Examination`,
      contentType: 'description',
    })
  }

  // Chunk 4: Diagnosis + reasoning
  if (caseRow.provisional_diagnosis) {
    const dxParts = [`Diagnosis: ${caseRow.provisional_diagnosis}`]
    if (caseRow.provisional_reasoning) dxParts.push(`Reasoning: ${caseRow.provisional_reasoning}`)
    chunks.push({
      content: truncate(`${prefix} — Diagnosis.\n${dxParts.join('\n')}`),
      metadata: { ...baseMeta, section: 'diagnosis' },
      sourceTable: 'clinical_cases',
      sourceId: srcId('diagnosis'),
      sourceTitle: `Case ${caseRow.case_number} — ${caseRow.provisional_diagnosis}`,
      contentType: 'description',
    })
  }

  // Chunk 5: Treatment plan
  if (caseRow.treatment_plan && caseRow.treatment_plan.length > 50) {
    chunks.push({
      content: truncate(`${prefix} — Treatment Plan.\n${caseRow.treatment_plan}`),
      metadata: { ...baseMeta, section: 'treatment' },
      sourceTable: 'clinical_cases',
      sourceId: srcId('treatment'),
      sourceTitle: `Case ${caseRow.case_number} — Treatment`,
      contentType: 'procedure',
    })
  }

  // Chunk 6: Protocol (if exists, take first 400 chars)
  if (protocol?.protocol_content) {
    chunks.push({
      content: truncate(`${prefix} — Treatment Protocol (${protocol.protocol_number}).\n${protocol.protocol_content}`),
      metadata: { ...baseMeta, section: 'protocol', protocolNumber: protocol.protocol_number },
      sourceTable: 'clinical_cases',
      sourceId: srcId('protocol'),
      sourceTitle: `Case ${caseRow.case_number} — Protocol`,
      contentType: 'procedure',
    })
  }

  // Chunk 7: Outcome (if completed)
  if (outcome) {
    const outcomeParts: string[] = []
    if (outcome.outcome_label) outcomeParts.push(`Outcome: ${outcome.outcome_label}`)
    if (outcome.outcome_rating) outcomeParts.push(`Rating: ${outcome.outcome_rating}/5`)
    if (outcome.doctor_notes) outcomeParts.push(`Doctor Notes: ${outcome.doctor_notes}`)
    if (outcome.what_worked?.length) outcomeParts.push(`What Worked: ${outcome.what_worked.join(', ')}`)
    if (outcome.what_didnt_work?.length) outcomeParts.push(`What Didn't Work: ${outcome.what_didnt_work.join(', ')}`)
    if (outcome.patient_feedback) outcomeParts.push(`Patient Feedback: ${outcome.patient_feedback}`)
    if (outcomeParts.length > 0) {
      chunks.push({
        content: truncate(`${prefix} — Outcome.\n${outcomeParts.join('\n')}`),
        metadata: { ...baseMeta, section: 'outcome', outcomeLabel: outcome.outcome_label },
        sourceTable: 'clinical_cases',
        sourceId: srcId('outcome'),
        sourceTitle: `Case ${caseRow.case_number} — Outcome`,
        contentType: 'description',
      })
    }
  }

  return chunks
}

// ─── Embedding + Upsert ─────────────────────────────────────────────────────
async function upsertCaseEmbeddings(chunks: ClinicalChunk[]): Promise<number> {
  if (chunks.length === 0) return 0

  const texts = chunks.map(c => c.content)
  const embeddings = await generateBatchEmbeddings(texts)

  const supabase = createServerClient()
  let upserted = 0

  for (let i = 0; i < chunks.length; i += 10) {
    const batchChunks = chunks.slice(i, i + 10)
    const batchEmbeddings = embeddings.slice(i, i + 10)

    const rows = batchChunks.map((chunk, j) => ({
      id: deterministicUuid(`emb:${chunk.sourceTable}:${chunk.sourceId}:${chunk.metadata.section || 'main'}`),
      source_table: chunk.sourceTable,
      source_id: chunk.sourceId,
      source_title: chunk.sourceTitle,
      content_type: chunk.contentType,
      content: chunk.content,
      content_hash: createHash('md5').update(chunk.content).digest('hex'),
      metadata: chunk.metadata,
      embedding: batchEmbeddings[j] ? `[${batchEmbeddings[j].join(',')}]` : null,
    }))

    const { error } = await supabase
      .from('knowledge_embeddings')
      .upsert(rows, { onConflict: 'id' })

    if (error) {
      console.error('[InputLearning] Upsert batch failed:', error.message)
      // Retry individually
      for (const row of rows) {
        const { error: singleErr } = await supabase
          .from('knowledge_embeddings')
          .upsert([row], { onConflict: 'id' })
        if (singleErr) {
          console.error(`[InputLearning] Individual upsert failed for ${row.id}:`, singleErr.message)
        } else {
          upserted++
        }
      }
    } else {
      upserted += batchChunks.length
    }
  }

  return upserted
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Embed a clinical case into the knowledge base.
 * Fetches full case data from Supabase, chunks it, generates embeddings,
 * and upserts to knowledge_embeddings with source_table='clinical_cases'.
 *
 * Safe to call fire-and-forget — errors are logged, never thrown.
 */
export async function embedCaseToKnowledge(caseId: string): Promise<void> {
  try {
    const supabase = createServerClient()

    // Fetch case
    const { data: caseRow, error: caseErr } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single()

    if (caseErr || !caseRow) {
      console.warn('[InputLearning] Case not found:', caseId, caseErr?.message)
      return
    }

    // Fetch related data in parallel
    const [protocolRes, outcomeRes] = await Promise.all([
      supabase.from('treatment_protocols')
        .select('id, protocol_number, diagnosis, prakriti, protocol_content')
        .eq('patient_name', caseRow.case_number)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('case_outcomes')
        .select('outcome_rating, outcome_label, doctor_notes, clinical_observations, what_worked, what_didnt_work, patient_feedback')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const complaints = parseComplaints(caseRow.chief_complaints)
    const protocol = protocolRes.data as TreatmentProtocolRow | null
    const outcome = outcomeRes.data as CaseOutcomeRow | null

    const chunks = chunkClinicalCase(caseRow as CaseRow, complaints, protocol, outcome)
    if (chunks.length === 0) {
      console.warn('[InputLearning] No chunks generated for case:', caseId)
      return
    }

    const upserted = await upsertCaseEmbeddings(chunks)
    console.log(`[InputLearning] Embedded case ${caseRow.case_number}: ${upserted} chunks upserted`)
  } catch (error) {
    // Never throw — this is fire-and-forget
    console.error('[InputLearning] embedCaseToKnowledge failed:', error)
  }
}

/**
 * Re-embed a case with updated outcome/learning data.
 * Called when a case is completed or doctor provides feedback.
 * Replaces existing embeddings for this case with enriched versions.
 */
export async function reembedCaseWithOutcome(
  caseId: string,
  outcome: {
    what_worked?: string[]
    what_didnt_work?: string[]
    outcome_notes?: string
    outcome_label?: string
    outcome_rating?: number
    corrected_diagnosis?: string
    correction_reason?: string
  }
): Promise<void> {
  try {
    const supabase = createServerClient()

    const { data: caseRow, error: caseErr } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single()

    if (caseErr || !caseRow) {
      console.warn('[InputLearning] Case not found for re-embed:', caseId)
      return
    }

    const complaints = parseComplaints(caseRow.chief_complaints)

    // If diagnosis was corrected, override for chunking
    const enrichedCase = { ...caseRow } as CaseRow
    if (outcome.corrected_diagnosis) {
      enrichedCase.provisional_diagnosis = outcome.corrected_diagnosis
      enrichedCase.provisional_reasoning = outcome.correction_reason
        ? `${caseRow.provisional_reasoning || ''} [Corrected: ${outcome.correction_reason}]`
        : caseRow.provisional_reasoning
    }

    const outcomeData: CaseOutcomeRow = {
      outcome_rating: outcome.outcome_rating || null,
      outcome_label: outcome.outcome_label || null,
      doctor_notes: outcome.outcome_notes || null,
      clinical_observations: null,
      what_worked: outcome.what_worked || null,
      what_didnt_work: outcome.what_didnt_work || null,
      patient_feedback: null,
    }

    const chunks = chunkClinicalCase(enrichedCase, complaints, null, outcomeData)
    if (chunks.length === 0) return

    const upserted = await upsertCaseEmbeddings(chunks)
    console.log(`[InputLearning] Re-embedded case ${caseRow.case_number} with outcome: ${upserted} chunks`)
  } catch (error) {
    console.error('[InputLearning] reembedCaseWithOutcome failed:', error)
  }
}

/**
 * Embed a treatment protocol into the knowledge base.
 * Used when a protocol is generated via the treatment-protocol API.
 */
export async function embedTreatmentProtocol(
  protocolNumber: string,
  protocolContent: string,
  diagnosis: string | null,
  prakriti: string | null
): Promise<void> {
  try {
    if (!protocolContent || protocolContent.length < 50) return

    const supabase = createServerClient()
    const prefix = `Treatment Protocol ${protocolNumber}`
    const baseMeta = { protocolNumber, diagnosis: diagnosis || 'unknown' }

    // Split protocol into chunks of ≤400 chars
    const chunks: ClinicalChunk[] = []
    const sentences = protocolContent.split(/(?<=[.!?\n])\s+/)
    let currentChunk = ''
    let chunkIndex = 0

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > MAX_CHUNK_CHARS - 20) {
        if (currentChunk.length > 30) {
          chunks.push({
            content: truncate(`${prefix}.\n${currentChunk.trim()}`),
            metadata: { ...baseMeta, section: `protocol-part-${chunkIndex}` },
            sourceTable: 'clinical_cases',
            sourceId: deterministicUuid(`clinical_cases:${protocolNumber}:protocol-${chunkIndex}`),
            sourceTitle: `${prefix} — ${diagnosis || 'Treatment Protocol'}`,
            contentType: 'procedure',
          })
          chunkIndex++
        }
        currentChunk = sentence
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence
      }
    }
    if (currentChunk.trim().length > 30) {
      chunks.push({
        content: truncate(`${prefix}.\n${currentChunk.trim()}`),
        metadata: { ...baseMeta, section: `protocol-part-${chunkIndex}` },
        sourceTable: 'clinical_cases',
        sourceId: deterministicUuid(`clinical_cases:${protocolNumber}:protocol-${chunkIndex}`),
        sourceTitle: `${prefix} — ${diagnosis || 'Treatment Protocol'}`,
        contentType: 'procedure',
      })
    }

    // Add prakriti context chunk if available
    if (prakriti && diagnosis) {
      chunks.push({
        content: truncate(`${prefix} — Patient Context.\nPrakriti: ${prakriti}. Diagnosis: ${diagnosis}.`),
        metadata: { ...baseMeta, section: 'context' },
        sourceTable: 'clinical_cases',
        sourceId: deterministicUuid(`clinical_cases:${protocolNumber}:context`),
        sourceTitle: `${prefix} — Patient Context`,
        contentType: 'description',
      })
    }

    if (chunks.length === 0) return

    const upserted = await upsertCaseEmbeddings(chunks)
    console.log(`[InputLearning] Embedded protocol ${protocolNumber}: ${upserted} chunks`)
  } catch (error) {
    console.error('[InputLearning] embedTreatmentProtocol failed:', error)
  }
}
