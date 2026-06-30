#!/usr/bin/env tsx
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BHAVAPRAKASHA_HERBS, BHAVAPRAKASHA_FORMULATIONS, BHAVAPRAKASHA_DISEASES, BHAVAPRAKASHA_PREPARATIONS } from '../knowledge-base/bhavaprakasha-nigantu';
import { RASA_DRAVYAS, BHASMA_PREPARATIONS, RASA_AUSHADHIS, SHODHANA_PROCEDURES } from '../knowledge-base/rasa-shastra';
import { RASAYANA_HERBS, VAJIKARANA_HERBS, RASAYANA_PROTOCOLS } from '../knowledge-base/rasayana-vajikarana';
import { YOGA_ASANAS, PRANAYAMA_TECHNIQUES, SHATKARMAS, YOGA_PROTOCOLS } from '../knowledge-base/yoga-pranayama';
import { GARBHA_CARE, SUTIKA_CARE, BAL_ROGA, GARBHASANSKAR } from '../knowledge-base/kaumara-bhritya';
import { UNMADA_TYPES, APASMARA_TYPES, MEDHYA_RASAYANAS, SATVAVAJAYA_TECHNIQUES } from '../knowledge-base/graha-chikitsa';
import { WHO_ITA_TERMS } from '../knowledge-base/who-ita-knowledge';
import { LAB_TESTS } from '../knowledge-base/lab-values';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

process.env.DOTENV_CONFIG_PATH = resolve(ROOT, '.env.local');
try { await import('dotenv/config'); } catch { /* optional */ }

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
if (!NVIDIA_API_KEY && !GEMINI_API_KEY) {
  console.error('Need NVIDIA_API_KEY or GEMINI_API_KEY in .env.local');
  process.exit(1);
}

interface ChunkInput {
  content: string;
  source: string;
  category: string;
  title: string;
  metadata: Record<string, any>;
}

/**
 * Generate a 50-100 token context summary for a chunk.
 * Prepended before embedding (Anthropic contextual retrieval pattern).
 * Reduces failed retrievals by 30-50% by giving the embedding model
 * crucial context about where this chunk fits in the larger document.
 */
function generateContextPrefix(chunk: ChunkInput): string {
  const source = chunk.source;
  const category = chunk.category;
  const title = chunk.title;

  const categoryLabels: Record<string, string> = {
    disease: 'disease monograph',
    herb_monograph: 'herb monograph',
    treatment: 'treatment protocol',
    fundamentals: 'Ayurvedic fundamental principle',
    diagnostics: 'diagnostic method',
    allopathy_integration: 'modern medicine integration',
    classical_text: 'classical Ayurvedic text',
    dietary_guideline: 'dietary guideline',
    pathya_apathya: 'dietary restriction/recommendation',
    drug_interaction: 'drug interaction warning',
    clinical_evidence: 'clinical evidence',
    treatment_procedure: 'treatment procedure',
  };

  const categoryLabel = categoryLabels[category] || category;

  const parts: string[] = [];

  parts.push(`This is a ${categoryLabel} from the ${source.replace(/-/g, ' ')} knowledge source.`);

  if (title) {
    parts.push(`It covers: ${title}.`);
  }

  const metadata = chunk.metadata;
  if (metadata?.doshaInvolvement?.length) {
    parts.push(`Related doshas: ${metadata.doshaInvolvement.join(', ')}.`);
  }
  if (metadata?.botanicalName) {
    parts.push(`Botanical name: ${metadata.botanicalName}.`);
  }
  if (metadata?.modernCorrelation) {
    parts.push(`Modern correlation: ${metadata.modernCorrelation}.`);
  }

  return parts.join(' ').slice(0, 300);
}

function contentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function sanitizeText(text: string): string {
  // Remove control chars, replace excessive whitespace, strip null bytes
  return text
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/\s{3,}/g, '  ')
    .trim();
}

function textEmbeddingInput(text: string): string {
  return sanitizeText(text).slice(0, 350);
}

/**
 * Split long text into safe segments and embed each, averaging results.
 * NVIDIA nv-embedqa-e5-v5 has ~512 token limit; Devanagari uses ~2x tokens/char.
 * Safe threshold: 300 characters per segment.
 */
async function embedSingleSafe(text: string): Promise<number[]> {
  const SAFE_LEN = 300;
  const safe = sanitizeText(text);
  if (safe.length <= SAFE_LEN) {
    const [embed] = await embedNVIDIA([safe]);
    return embed;
  }
  const mid = Math.floor(safe.length / 2);
  const [eL, eR] = await embedNVIDIA([safe.slice(0, mid).slice(0, SAFE_LEN), safe.slice(mid).slice(0, SAFE_LEN)]);
  return eL.map((v, i) => (v + eR[i]) / 2);
}

async function embedNVIDIA(texts: string[]): Promise<number[][]> {
  if (!NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY required');
  const res = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nvidia/nv-embedqa-e5-v5',
      input: texts.map(textEmbeddingInput),
      input_type: 'passage',
      encoding_format: 'float',
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`NVIDIA embed batch error ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.data.map((d: any) => d.embedding.slice(0, 1024));
}

async function embedGeminiBatch(texts: string[]): Promise<number[][]> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY required');
  const results: number[][] = [];
  for (const text of texts) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({ content: { parts: [{ text: text.slice(0, 20000) }] } }),
    });
    if (!res.ok) throw new Error(`Gemini embed error ${res.status}`);
    const data = await res.json();
    const values: number[] = data.embedding?.values ?? [];
    results.push(values.slice(0, 1024));
  }
  return results;
}

async function embedBatch(texts: string[]): Promise<(number[] | null)[]> {
  if (!NVIDIA_API_KEY && !GEMINI_API_KEY) {
    return texts.map(() => null);
  }

  const results: (number[] | null)[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    let embedded = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (NVIDIA_API_KEY) {
          const [e] = await embedNVIDIA([text]);
          results.push(e);
        } else {
          const [e] = await embedGeminiBatch([text]);
          results.push(e);
        }
        successCount++;
        embedded = true;
        break;
      } catch (err: any) {
        const delay = 2000 * (attempt + 1);
        if (attempt < 2) {
          process.stdout.write(`  Retry ${attempt + 1}/3 for chunk ${i + 1}/${texts.length} (waiting ${delay / 1000}s)...\r`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    if (!embedded) {
      // Final attempt: try with safe splitting
      try {
        const e = await embedSingleSafe(text);
        results.push(e);
        successCount++;
      } catch {
        console.error(`  ✗ Chunk ${i + 1}/${texts.length} failed all attempts (len=${text.length}). Skipping.`);
        results.push(null);
        failCount++;
      }
    }

    // Progress every 10 chunks
    if ((i + 1) % 10 === 0 || i === texts.length - 1) {
      process.stdout.write(`  Progress: ${i + 1}/${texts.length} (${successCount} ok, ${failCount} failed)\r`);
    }

    // Delay between requests (2s to avoid rate limiting)
    if (i < texts.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n  Embedding complete: ${successCount} success, ${failCount} failed out of ${texts.length}`);
  return results;
}

async function supabaseInsert(rows: any[]) {
  // Deduplicate by content_hash to avoid constraint violations
  const seen = new Set<string>();
  const uniqueRows = rows.filter(row => {
    if (seen.has(row.content_hash)) return false;
    seen.add(row.content_hash);
    return true;
  });

  const url = `${SUPABASE_URL}/rest/v1/knowledge_embeddings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(uniqueRows),
  });
  if (!res.ok) {
    const t = await res.text();
    // Duplicate key errors are non-fatal (dedup already handled most)
    if (res.status === 409) return;
    console.error('  Supabase insert error:', res.status, t.slice(0, 200));
    throw new Error('Insert failed');
  }
}

function chunkDisease(d: any): ChunkInput[] {
  const base = { source: 'diseases', category: 'disease', metadata: { id: d.id, modernCorrelation: d.modernCorrelation, doshaInvolvement: d.doshaInvolvement } };
  return [
    { ...base, content: `Disease: ${d.name} (${d.sanskrit})\nCategory: ${d.category}\nModern Correlation: ${d.modernCorrelation}\nDosha Involvement: ${(d.doshaInvolvement ?? []).join(', ')}\nSamprapti: ${d.samprapti}`, title: d.name },
    { ...base, content: `${d.name} Clinical Features:\n${(d.clinicalFeatures ?? []).map((f: string) => `- ${f}`).join('\n')}\n\nDiagnostic Criteria:\n${(d.diagnosticCriteria ?? []).map((c: string) => `- ${c}`).join('\n')}`, title: `${d.name} - Clinical Features` },
    { ...base, content: `${d.name} Treatment & Prognosis:\nTreatment: ${(d.treatment ?? []).join('; ')}\nPathya (recommended): ${(d.pathya ?? []).join(', ')}\nApathya (avoid): ${(d.apathya ?? []).join(', ')}\nPrognosis: ${d.prognosis}`, title: `${d.name} - Treatment` },
  ];
}

function chunkHerb(h: any): ChunkInput[] {
  const base = { source: 'herbs', category: 'herb_monograph', metadata: { id: h.id, botanicalName: h.botanicalName, family: h.family } };
  return [
    { ...base, content: `Herb: ${h.name} (${h.sanskrit}) / ${h.botanicalName}\nFamily: ${h.family}\nParts Used: ${(h.partUsed ?? []).join(', ')}\nRasa: ${(h.rasa ?? []).join(', ')} | Guna: ${(h.guna ?? []).join(', ')}\nVirya: ${h.virya} | Vipaka: ${h.vipaka}\nPrabhava: ${h.prabhava ?? 'N/A'}\nDosha Karma: Vata=${h.doshaKarma?.vata ?? 'N/A'}, Pitta=${h.doshaKarma?.pitta ?? 'N/A'}, Kapha=${h.doshaKarma?.kapha ?? 'N/A'}`, title: h.name },
    { ...base, content: `${h.name} Clinical Uses & Dosage:\nIndications: ${(h.indications ?? []).join(', ')}\nDosage: ${h.dosage}\nPreparations: ${(h.preparation ?? []).join(', ')}`, title: `${h.name} - Uses` },
    { ...base, content: `${h.name} Safety:\nContraindications: ${(h.contraindications ?? []).join(', ')}\nInteractions: ${(h.interactions ?? []).join('; ')}\nSide Effects: ${(h.sideEffects ?? []).join('; ')}`, title: `${h.name} - Safety` },
  ];
}

function chunkTreatment(t: any): ChunkInput[] {
  const base = { source: 'treatments', category: 'treatment', metadata: { id: t.id, category: t.category } };
  return [
    { ...base, content: `Treatment: ${t.name} (${t.sanskrit})\nCategory: ${t.category}\nDescription: ${t.description}\nDuration: ${t.duration}\n\nProcedure:\n${(t.procedure ?? []).map((p: string) => `- ${p}`).join('\n')}`, title: t.name },
    { ...base, content: `${t.name} Indications & Contraindications:\nIndications: ${(t.indications ?? []).join(', ')}\nContraindications: ${(t.contraindications ?? []).join(', ')}\nPreparation: ${(t.preparation ?? []).join('; ')}\nPost-Treatment: ${(t.postTreatment ?? []).join('; ')}`, title: `${t.name} - Indications` },
  ];
}

function chunkDiagnostics(m: any): ChunkInput[] {
  return [{
    source: 'diagnostics',
    category: 'diagnostics',
    title: m.name,
    metadata: { id: m.id },
    content: `Diagnostic Method: ${m.name} (${m.sanskrit})\nDescription: ${m.description}\nComponents:\n${(m.components ?? []).map((c: string) => `- ${c}`).join('\n')}\nClinical Application:\n${(m.clinicalApplication ?? []).map((a: string) => `- ${a}`).join('\n')}`,
  }];
}

function chunkAllopathy(a: any): ChunkInput[] {
  return [{
    source: 'allopathy',
    category: 'allopathy_integration',
    title: a.condition,
    metadata: { ayurvedicCorrelation: a.ayurvedicCorrelation },
    content: `Allopathy-Ayurveda Integration: ${a.condition}\nAyurvedic Correlation: ${a.ayurvedicCorrelation}\nAllopathy Treatment: ${a.allopathyTreatment}\nIntegrated Approach: ${a.integratedApproach}\nSafety Notes:\n${(a.safetyNotes ?? []).map((n: string) => `- ${n}`).join('\n')}\nMonitoring Parameters: ${(a.monitoringParameters ?? []).join(', ')}`,
  }];
}

function chunkFundamentalsConcepts(fundamentals: any): ChunkInput[] {
  const chunks: ChunkInput[] = [];

  for (const dosha of (fundamentals.tridosha ?? [])) {
    chunks.push({
      source: 'fundamentals',
      category: 'fundamentals',
      title: dosha.name,
      metadata: { id: dosha.id },
      content: `Tridosha: ${dosha.name} (${dosha.sanskrit})\nDefinition: ${dosha.definition}\nQualities: ${(dosha.qualities ?? []).join(', ')}\nSeat: ${dosha.seat}\nFunctions: ${(dosha.functions ?? []).join(', ')}\nImbalance Signs: ${(dosha.imbalance ?? []).join(', ')}\nPrakriti Dominance: ${dosha.prakritiDominance}`,
    });
  }

  for (const dhatu of (fundamentals.saptadhatu ?? [])) {
    chunks.push({
      source: 'fundamentals',
      category: 'fundamentals',
      title: dhatu.name,
      metadata: { id: dhatu.id },
      content: `Saptadhatu: ${dhatu.name}\nPrimary Function: ${dhatu.function}\nSeat: ${dhatu.seat}\nQuality: ${dhatu.quality}`,
    });
  }

  for (const agni of (fundamentals.agni ?? [])) {
    chunks.push({
      source: 'fundamentals',
      category: 'fundamentals',
      title: agni.name,
      metadata: { id: agni.id },
      content: `Agni: ${agni.name}\nDescription: ${agni.description}${agni.causes ? `\nCauses: ${agni.causes.join(', ')}` : ''}`,
    });
  }

  for (const srota of (fundamentals.srotas ?? [])) {
    chunks.push({
      source: 'fundamentals',
      category: 'fundamentals',
      title: srota.name,
      metadata: { id: srota.id },
      content: `Srotas: ${srota.name}\nFunction: ${srota.function}\nChannels: ${srota.channels}\nSymptoms: ${srota.symptoms}`,
    });
  }

  for (const ama of (fundamentals.ama ?? [])) {
    chunks.push({
      source: 'fundamentals',
      category: 'fundamentals',
      title: ama.id,
      metadata: { id: ama.id },
      content: `Ama: ${ama.id}\nDefinition: ${ama.definition}${ama.types ? `\nTypes: ${ama.types.join(', ')}` : ''}${ama.indicators ? `\nIndicators: ${ama.indicators.join(', ')}` : ''}`,
    });
  }

  for (const ojas of (fundamentals.ojas ?? [])) {
    chunks.push({
      source: 'fundamentals',
      category: 'fundamentals',
      title: 'Ojas',
      metadata: { id: ojas.id },
      content: `Ojas (Vital Essence): ${ojas.definition}\nQuality: ${ojas.quality}\nFunctions: ${(ojas.functions ?? []).join(', ')}\nDepletion: ${(ojas.depletion ?? []).join(', ')}\nPreservation: ${(ojas.preservation ?? []).join(', ')}`,
    });
  }

  return chunks;
}

function chunkCharakSamhita(charak: any): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  const structure = charak.structure;
  if (structure?.sections) {
    for (const section of structure.sections) {
      chunks.push({
        source: 'charak-samhita',
        category: 'classical_text',
        title: section.name,
        metadata: { sthana: section.id, chapterCount: section.chapters },
        content: `Charak Samhita - ${section.name} (${section.english})\nTotal Chapters: ${section.chapters}${section.chatushkas ? `\nChatushkas: ${section.chatushkas.join('; ')}` : ''}`,
      });
    }
  }

  for (const topic of ['prameha', 'vataVyadhi', 'jwara'] as const) {
    const data = charak[topic];
    if (!data) continue;
    chunks.push({
      source: 'charak-samhita',
      category: 'classical_text',
      title: `Charak - ${topic}`,
      metadata: { topic },
      content: `Charak Samhita - ${topic.toUpperCase()}\n${JSON.stringify(data, null, 2).slice(0, 4000)}`,
    });
  }

  return chunks;
}

/**
 * Smart chunking for classical texts with long sections.
 * Based on research from Vaidya (Charaka Samhita RAG) and Kumar Gauraw's
 * production system for ancient Hindu scriptures:
 *
 * KEY PRINCIPLE: Ancient texts are verse-based, not paragraph-based.
 * A single shloka might be 16 syllables in Sanskrit but expand to a full
 * paragraph of commentary. Standard character-count chunking splits verses
 * from their translations, destroying retrieval quality.
 *
 * Strategy:
 * 1. Parse by verse/shloka boundaries (।। or double danda markers)
 * 2. Group 3-5 verses per chunk (each chunk = complete semantic unit)
 * 3. Preserve chapter/section context as parent metadata
 * 4. Never split a verse from its translation
 */
function smartChunkClassicalText(
  source: string,
  category: string,
  baseTitle: string,
  baseMetadata: Record<string, any>,
  fullContent: string,
  sections: Record<string, string>
): ChunkInput[] {
  const chunks: ChunkInput[] = [];

  const sectionKeys = Object.keys(sections);
  if (sectionKeys.length === 0) {
    if (fullContent.trim().length > 0) {
      return chunkVerseContent(source, category, baseTitle, baseMetadata, fullContent);
    }
    return [];
  }

  for (const key of sectionKeys) {
    const sectionText = sections[key];
    if (!sectionText || sectionText.trim().length === 0) continue;

    const sectionHeader = key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    const verseChunks = chunkVerseContent(
      source,
      category,
      `${baseTitle} - ${sectionHeader}`,
      baseMetadata,
      sectionText
    );
    chunks.push(...verseChunks);
  }

  if (chunks.length === 0 && fullContent.trim().length > 0) {
    chunks.push(...chunkVerseContent(source, category, baseTitle, baseMetadata, fullContent));
  }

  return chunks;
}

/**
 * Chunk classical text content by verse boundaries.
 *
 * Detects shloka boundaries using:
 * - Double danda (।। or ||) — standard verse terminator in Sanskrit
 * - Line breaks between Devanagari and English text
 * - Numeric verse markers (1.24, 2.1 etc.)
 *
 * Groups 3-5 verses per chunk for optimal retrieval.
 * Each chunk is ~400-1200 tokens (matching embedding model sweet spot).
 */
function chunkVerseContent(
  source: string,
  category: string,
  title: string,
  metadata: Record<string, any>,
  content: string
): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  const VERSES_PER_CHUNK = 5;
  const MAX_CHUNK_CHARS = 3000;

  // Split on double danda (।।) or verse number patterns
  const versePattern = /(?:^|\n)(?=(?:\d+\.\d+|[०-९]+\s*[।।]))/;
  let verses = content.split(versePattern).filter(v => v.trim().length > 0);

  // If no verse boundaries detected, fall back to paragraph splitting
  if (verses.length <= 1) {
    verses = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  }

  // If still single block, split on semantic boundaries
  if (verses.length <= 1 && content.length > MAX_CHUNK_CHARS) {
    verses = splitOnSemanticBoundaries(content);
  }

  // Group verses into chunks of VERSES_PER_CHUNK
  let currentGroup: string[] = [];
  let currentLen = 0;

  for (const verse of verses) {
    if (currentLen + verse.length > MAX_CHUNK_CHARS && currentGroup.length > 0) {
      chunks.push(createVerseChunk(source, category, title, metadata, currentGroup));
      currentGroup = [];
      currentLen = 0;
    }
    currentGroup.push(verse);
    currentLen += verse.length;
  }

  if (currentGroup.length > 0) {
    chunks.push(createVerseChunk(source, category, title, metadata, currentGroup));
  }

  return chunks;
}

function createVerseChunk(
  source: string,
  category: string,
  title: string,
  metadata: Record<string, any>,
  verses: string[]
): ChunkInput {
  return {
    source,
    category,
    title: `${title} (${verses.length} verses)`,
    metadata,
    content: verses.join('\n').trim(),
  };
}

/**
 * Split on semantic boundaries when no verse markers are detected.
 * Tries to preserve meaningful content units.
 */
function splitOnSemanticBoundaries(content: string): string[] {
  const boundaries = [
    /\n\n/,
    /\n(?=[A-Z])/,
    /\n(?=[0-9]+\.\s)/,
    /\n/,
  ];

  for (const boundary of boundaries) {
    const parts = content.split(boundary).filter(p => p.trim().length > 50);
    if (parts.length > 1) return parts;
  }

  // Last resort: split at sentence boundaries
  return content.split(/(?<=[.!?।])\s+/).filter(p => p.trim().length > 50);
}

function chunkWithOverlap(text: string, maxLen: number, overlap: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxLen, text.length);

    // Try to break at sentence boundary
    if (end < text.length) {
      const window = text.slice(end - 100, end + 50);
      const sentenceBreak = window.search(/[.!?।]\s/);
      if (sentenceBreak !== -1) {
        end = end - 100 + sentenceBreak + 1;
      } else {
        // Fall back to word boundary
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start) end = lastSpace;
      }
    }

    chunks.push(text.slice(start, end).trim());

    // Move start forward, accounting for overlap
    if (end >= text.length) break;
    start = end - overlap;
    if (start < 0) start = 0;
  }

  return chunks;
}

function chunkVasishthArticles(articles: any[]): ChunkInput[] {
  const chunks: ChunkInput[] = [];

  for (const art of articles) {
    const base = {
      source: 'vasishth-clinical-experience',
      category: art.category,
      metadata: { id: art.id, series: art.series, number: art.number, datePosted: art.datePosted },
    };

    const enContent = (art.contentEn || '').trim();
    const hiContent = (art.contentHi || '').trim();

    if (enContent && enContent !== hiContent) {
      chunks.push({
        ...base,
        title: `${art.title} (English)`,
        content: `Series: ${art.series} #${art.number}\nLanguage: English\nDate: ${art.datePosted}\n\n${enContent}`,
      });
    }

    if (hiContent) {
      chunks.push({
        ...base,
        title: `${art.title} (Hindi)`,
        content: `Series: ${art.series} #${art.number}\nLanguage: Hindi\nDate: ${art.datePosted}\n\n${hiContent}`,
      });
    }

    if (enContent && enContent === hiContent) {
      chunks.push({
        ...base,
        title: art.title,
        content: `Series: ${art.series} #${art.number}\nDate: ${art.datePosted}\n\n${enContent}`,
      });
    }
  }

  return chunks;
}

function chunkCaseStudies(cases: any[]): ChunkInput[] {
  const chunks: ChunkInput[] = [];

  for (const cs of cases) {
    const base = {
      source: 'ayur-case-study',
      category: cs.category,
      metadata: { id: cs.id, caseNumber: cs.caseNumber, diseaseName: cs.diseaseName, diseaseNameEn: cs.diseaseNameEn, datePosted: cs.datePosted },
    };

    const diseaseLabel = cs.diseaseNameEn
      ? `${cs.diseaseName} (${cs.diseaseNameEn})`
      : cs.diseaseName;

    // Part 1: Diagnosis & Examination
    const part1Sections = ['nidana', 'purvaroopam', 'lakshana', 'general_examination', 'systemic_examination', 'lab_investigations'];
    const part1Content = part1Sections
      .filter(s => cs.sections[s])
      .map(s => `${s.replace(/_/g, ' ').toUpperCase()}:\n${cs.sections[s]}`)
      .join('\n\n');

    if (part1Content.trim()) {
      chunks.push({
        ...base,
        title: `Case #${cs.caseNumber} ${diseaseLabel} - Diagnosis`,
        content: `Case Study #${cs.caseNumber}: ${diseaseLabel}\nCategory: ${cs.category}\nDate: ${cs.datePosted}\n\n${part1Content}`,
      });
    }

    // Part 2: Pathogenesis & Treatment
    const part2Sections = ['differential_diagnosis', 'samprapti', 'samanya_chikitsa', 'upashaya', 'anupashaya', 'vishesha_chikitsa'];
    const part2Content = part2Sections
      .filter(s => cs.sections[s])
      .map(s => `${s.replace(/_/g, ' ').toUpperCase()}:\n${cs.sections[s]}`)
      .join('\n\n');

    if (part2Content.trim()) {
      chunks.push({
        ...base,
        title: `Case #${cs.caseNumber} ${diseaseLabel} - Treatment`,
        content: `Case Study #${cs.caseNumber}: ${diseaseLabel}\nCategory: ${cs.category}\nDate: ${cs.datePosted}\n\n${part2Content}`,
      });
    }
  }

  return chunks;
}

function chunkCaseTreatments(treatments: any[]): ChunkInput[] {
  const chunks: ChunkInput[] = [];

  for (const tx of treatments) {
    const sectionContent = Object.entries(tx.sections as Record<string, string>)
      .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}:\n${v}`)
      .join('\n\n');

    chunks.push({
      source: 'ayur-case-study',
      category: 'treatment_procedure',
      title: `Treatment #${tx.treatmentNumber}: ${tx.title}`,
      metadata: { id: tx.id, treatmentNumber: tx.treatmentNumber, datePosted: tx.datePosted },
      content: `Treatment #${tx.treatmentNumber}: ${tx.title}\nDate: ${tx.datePosted}\n\n${sectionContent || tx.content}`,
    });
  }

  return chunks;
}

function chunkSushrutaSamhita(): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let chapters: any[] = [];
  try {
    const chaptersPath = resolve(ROOT, 'knowledge-base', 'sushruta-samhita', 'all-chapters.json');
    chapters = JSON.parse(readFileSync(chaptersPath, 'utf-8'));
  } catch {
    console.warn('  Warning: sushruta-samhita/all-chapters.json not found.');
    return [];
  }

  for (const ch of chapters) {
    const chapterChunks = smartChunkClassicalText(
      'sushruta-samhita',
      'classical_text',
      `Sushruta - ${ch.name || ch.id}`,
      { sthana: ch.sthana, chapterNumber: ch.chapterNumber, url: ch.url },
      ch.fullContent || '',
      ch.sections || {}
    );
    chunks.push(...chapterChunks);
  }

  return chunks;
}

function chunkCharakOnlineShlokas(): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let shlokas: any[] = [];
  try {
    const shlokasPath = resolve(ROOT, 'knowledge-base', 'carak-samhita', 'all-shlokas.json');
    shlokas = JSON.parse(readFileSync(shlokasPath, 'utf-8'));
  } catch {
    console.warn('  Warning: charak-samhita/all-shlokas.json not found.');
    return [];
  }

  // Group shlokas by chapter for verse-based chunking
  const byChapter = new Map<string, any[]>();
  for (const sh of shlokas) {
    const key = `${sh.sthana || 'unknown'}-${sh.chapter || 'unknown'}`;
    if (!byChapter.has(key)) byChapter.set(key, []);
    byChapter.get(key)!.push(sh);
  }

  const VERSES_PER_CHUNK = 8;
  for (const [chapterKey, chapterShlokas] of byChapter) {
    for (let i = 0; i < chapterShlokas.length; i += VERSES_PER_CHUNK) {
      const group = chapterShlokas.slice(i, i + VERSES_PER_CHUNK);
      const devanagari = group.map(s => s.devanagari || '').filter(Boolean).join('\n');
      const english = group.map(s => s.english || '').filter(Boolean).join('\n');
      const first = group[0];

      chunks.push({
        source: 'charak-online',
        category: 'classical_text',
        title: `Charak - ${first.sthana || chapterKey} Ch.${first.chapter || '?'} (Verses ${i + 1}-${i + group.length})`,
        metadata: {
          sthana: first.sthana,
          chapter: first.chapter,
          verseStart: i + 1,
          verseEnd: i + group.length,
          hasEnglishTranslation: english.length > 0,
        },
        content: [
          devanagari,
          english ? `\nEnglish Translation:\n${english}` : '',
        ].filter(Boolean).join('\n'),
      });
    }
  }

  return chunks;
}

function chunkTattvaVimarsha(): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let data: any = null;
  try {
    const dataPath = resolve(ROOT, 'knowledge-base', 'carak-samhita', 'tattva-vidhi-vimarsha.json');
    const raw = JSON.parse(readFileSync(dataPath, 'utf-8'));
    data = Object.values(raw);
  } catch {
    console.warn('  Warning: carak-samhita/tattva-vidhi-vimarsha.json not found.');
    return [];
  }

  for (const entry of data) {
    const tattva = entry.tattvaVimarsha;
    const vidhi = entry.vidhiVimarsha;
    const label = `${entry.sthana || ''} Ch.${entry.chapterNumber || '?'} - ${entry.chapterTitle || ''}`;

    if (tattva?.content && tattva.content.trim().length > 0) {
      chunks.push({
        source: 'charak-tattva-vimarsha',
        category: 'fundamentals',
        title: `Tattva Vimarsha - ${label}`,
        metadata: { type: 'tattva', chapter: entry.chapterNumber, sthana: entry.sthana },
        content: `Tattva Vimarsha (Fundamental Principles):\n${label}\n\n${tattva.content}`,
      });
    }

    if (vidhi?.content && vidhi.content.trim().length > 0) {
      chunks.push({
        source: 'charak-vidhi-vimarsha',
        category: 'classical_text',
        title: `Vidhi Vimarsha - ${label}`,
        metadata: { type: 'vidhi', chapter: entry.chapterNumber, sthana: entry.sthana },
        content: `Vidhi Vimarsha (Applied Inferences):\n${label}\n\n${vidhi.content}`,
      });
    }
  }

  return chunks;
}

function chunkPlanetAyurveda(diseases: any[]): ChunkInput[] {
  const chunks: ChunkInput[] = [];

  for (const dis of diseases) {
    const base = {
      source: 'planet-ayurveda',
      category: dis.category,
      metadata: { id: dis.id, name: dis.name, url: dis.url },
    };

    const sectionKeys = Object.keys(dis.sections);
    if (sectionKeys.length === 0) {
      const content = dis.fullContent || dis.content || '';
      if (content.trim()) {
        chunks.push({
          ...base,
          title: dis.name,
          content: `Disease: ${dis.name}\nCategory: ${dis.category}\nSource: Planet Ayurveda\n\n${content}`,
        });
      }
      continue;
    }

    const contentChunks: string[][] = [];
    let currentChunk: string[] = [];
    let currentLen = 0;

    for (const key of sectionKeys) {
      const sectionText = dis.sections[key];
      if (!sectionText) continue;
      const header = `${key.replace(/_/g, ' ').toUpperCase()}:`;
      const sectionFull = `${header}\n${sectionText}`;
      if (currentLen + sectionFull.length > 3000 && currentChunk.length > 0) {
        contentChunks.push(currentChunk);
        currentChunk = [];
        currentLen = 0;
      }
      currentChunk.push(sectionFull);
      currentLen += sectionFull.length;
    }
    if (currentChunk.length > 0) contentChunks.push(currentChunk);

    for (let i = 0; i < contentChunks.length; i++) {
      chunks.push({
        ...base,
        title: contentChunks.length > 1 ? `${dis.name} (Part ${i + 1})` : dis.name,
        content: `Disease: ${dis.name}\nCategory: ${dis.category}\nSource: Planet Ayurveda\n\n${contentChunks[i].join('\n\n')}`,
      });
    }
  }

  return chunks;
}

function chunkPlanetAyurvedaHerbs(herbs: any[]): ChunkInput[] {
  const chunks: ChunkInput[] = [];

  for (const herb of herbs) {
    const base = {
      source: 'planet-ayurveda-herb',
      category: 'herb_monograph',
      metadata: { id: herb.id, name: herb.name, url: herb.url },
    };

    const sectionKeys = Object.keys(herb.sections);
    if (sectionKeys.length === 0) {
      const content = herb.fullContent || '';
      if (content.trim()) {
        chunks.push({
          ...base,
          title: herb.name,
          content: `Herb: ${herb.name}\nSource: Planet Ayurveda\n\n${content}`,
        });
      }
      continue;
    }

    const contentChunks: string[][] = [];
    let currentChunk: string[] = [];
    let currentLen = 0;

    for (const key of sectionKeys) {
      const sectionText = herb.sections[key];
      if (!sectionText) continue;
      const header = `${key.replace(/_/g, ' ').toUpperCase()}:`;
      const sectionFull = `${header}\n${sectionText}`;
      if (currentLen + sectionFull.length > 3000 && currentChunk.length > 0) {
        contentChunks.push(currentChunk);
        currentChunk = [];
        currentLen = 0;
      }
      currentChunk.push(sectionFull);
      currentLen += sectionFull.length;
    }
    if (currentChunk.length > 0) contentChunks.push(currentChunk);

    for (let i = 0; i < contentChunks.length; i++) {
      chunks.push({
        ...base,
        title: contentChunks.length > 1 ? `${herb.name} (Part ${i + 1})` : herb.name,
        content: `Herb: ${herb.name}\nSource: Planet Ayurveda\n\n${contentChunks[i].join('\n\n')}`,
      });
    }
  }

  return chunks;
}

function chunkAmidhaHerbs(): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let herbs: any[] = [];
  try {
    const herbsPath = resolve(ROOT, 'knowledge-base', 'amidha-herb-database', 'herbs.json');
    herbs = JSON.parse(readFileSync(herbsPath, 'utf-8'));
  } catch {
    console.warn('  Warning: amidha-herb-database/herbs.json not found.');
    return [];
  }

  for (const herb of herbs) {
    const name = herb.common_name || herb.name || 'Unknown';
    const botanical = herb.botanical_name || '';
    const family = herb.family || '';
    const rasa = herb.rasa || '';
    const virya = herb.virya || '';
    const vipaka = herb.vipaka || '';
    const karma = herb.karma || '';
    const indications = herb.indications || herb.therapeutic_uses || '';
    const parts = herb.part_used || '';
    const dosage = herb.dosage || '';
    const ref = herb.reference || '';

    chunks.push({
      source: 'amidha-herbs',
      category: 'herb_monograph',
      title: name,
      metadata: { botanicalName: botanical, family, source: 'Amidha Herb Database v2.0' },
      content: `Herb: ${name}\nBotanical Name: ${botanical}\nFamily: ${family}\nRasa: ${rasa}\nVirya: ${virya}\nVipaka: ${vipaka}\nKarma: ${karma}\nParts Used: ${parts}\nDosage: ${dosage}\nIndications: ${indications}\nReference: ${ref}`,
    });
  }

  return chunks;
}

function chunkBhaishajyaFormulations(): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let forms: any[] = [];
  try {
    const formsPath = resolve(ROOT, 'knowledge-base', 'bhaishajya-kalpana-kosha', 'formulations.json');
    forms = JSON.parse(readFileSync(formsPath, 'utf-8'));
  } catch {
    console.warn('  Warning: bhaishajya-kalpana-kosha/formulations.json not found.');
    return [];
  }

  for (const form of forms) {
    const name = form.name || 'Unknown';
    const type = form.type || '';
    const category = form.category || '';
    const ingredients = form.ingredients || '';
    const indication = form.indications || form.indication || '';
    const dosage = form.dosage || '';
    const method = form.method_of_preparation || form.preparation || '';
    const ref = form.reference || '';

    chunks.push({
      source: 'bhaishajya-kalpana-kosha',
      category: 'treatment',
      title: name,
      metadata: { type, category, source: 'Bhaishajya Kalpana Kosha' },
      content: `Classical Formulation: ${name}\nType: ${type}\nCategory: ${category}\nIngredients: ${ingredients}\nIndications: ${indication}\nDosage: ${dosage}\nMethod: ${method}\nReference: ${ref}`,
    });
  }

  return chunks;
}

function chunkAshtangaHridaya(): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let chapters: any[] = [];
  try {
    const dataPath = resolve(ROOT, 'knowledge-base', 'ayurknowledge', 'ashtanga-hridaya.ts');
    const content = readFileSync(dataPath, 'utf-8');
    const match = content.match(/export const ASHTANGA_CHAPTERS[^=]*=\s*(\[[\s\S]*?\]);/);
    if (match) {
      chapters = eval(match[1]);
    }
  } catch {
    console.warn('  Warning: ashtanga-hridaya.ts not found or parse failed.');
    return [];
  }

  for (const ch of chapters) {
    const topics = (ch.keyTopics || []).join(', ');
    const verses = (ch.keyVerses || []).join('\n');
    const clinical = (ch.clinicalApplications || []).join(', ');

    chunks.push({
      source: 'ashtanga-hridaya',
      category: 'classical_text',
      title: `Ashtanga Hridaya - ${ch.title || ch.sanskritTitle || 'Unknown'}`,
      metadata: { sthana: ch.sthana, chapterNumber: ch.chapterNumber, source: 'Ashtanga Hridaya (Vagbhata)' },
      content: `Ashtanga Hridaya - ${ch.sthana} Ch.${ch.chapterNumber}\nTitle: ${ch.title}\nSanskrit: ${ch.sanskritTitle}\n\n${ch.description || ''}\n\nKey Topics: ${topics}\n\nKey Verses:\n${verses}\n\nClinical Applications: ${clinical}`,
    });
  }

  return chunks;
}

function chunkSiddhantaKosha(): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let principles: any[] = [];
  try {
    const principlesPath = resolve(ROOT, 'knowledge-base', 'siddhanta-kosha', 'principles.json');
    principles = JSON.parse(readFileSync(principlesPath, 'utf-8'));
  } catch {
    console.warn('  Warning: siddhanta-kosha/principles.json not found.');
    return [];
  }

  for (const p of principles) {
    const name = p.name || p.concept || 'Unknown';
    const category = p.category || '';
    const sanskrit = p.sanskrit || '';
    const definition = p.definition || p.description || '';
    const shloka = p.shloka || '';
    const explanation = p.explanation || '';
    const modern = p.modern_relevance || p.modernCorrelation || '';

    chunks.push({
      source: 'siddhanta-kosha',
      category: 'fundamentals',
      title: name,
      metadata: { category, sanskrit, source: 'Siddhanta Kosha' },
      content: `Principle: ${name} (${sanskrit})\nCategory: ${category}\nDefinition: ${definition}\nShloka: ${shloka}\nExplanation: ${explanation}\nModern Relevance: ${modern}`,
    });
  }

  return chunks;
}

function chunkKeralaAyurveda(): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let docs: any[] = [];
  try {
    const docsPath = resolve(ROOT, 'knowledge-base', 'kerala-ayurveda', 'documents.json');
    docs = JSON.parse(readFileSync(docsPath, 'utf-8'));
  } catch {
    console.warn('  Warning: kerala-ayurveda/documents.json not found.');
    return [];
  }

  for (const doc of docs) {
    const title = doc.title || 'Unknown';
    const type = doc.type || '';
    const content = doc.content || '';

    if (!content || content.trim().length === 0) continue;

    // Chunk long documents
    const contentChunks: string[][] = [];
    let currentChunk: string[] = [];
    let currentLen = 0;
    const lines = content.split('\n');

    for (const line of lines) {
      if (currentLen + line.length > 3000 && currentChunk.length > 0) {
        contentChunks.push(currentChunk);
        currentChunk = [];
        currentLen = 0;
      }
      currentChunk.push(line);
      currentLen += line.length;
    }
    if (currentChunk.length > 0) contentChunks.push(currentChunk);

    for (let i = 0; i < contentChunks.length; i++) {
      chunks.push({
        source: 'kerala-ayurveda',
        category: doc.category || 'treatment',
        title: contentChunks.length > 1 ? `${title} (Part ${i + 1})` : title,
        metadata: { type, source: 'Kerala Ayurveda' },
        content: `Title: ${title}\nType: ${type}\n\n${contentChunks[i].join('\n')}`,
      });
    }
  }

  return chunks;
}

function chunkVedasCorpus(): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let corpus: any[] = [];
  try {
    const corpusPath = resolve(ROOT, 'knowledge-base', 'indian-vedas', 'ayurveda-corpus.json');
    corpus = JSON.parse(readFileSync(corpusPath, 'utf-8'));
  } catch {
    console.warn('  Warning: indian-vedas/ayurveda-corpus.json not found.');
    return [];
  }

  for (const entry of corpus) {
    const collection = entry.collection || '';
    const content = entry.content || '';
    const metadata = entry.metadata || '';

    if (!content || content.trim().length === 0) continue;

    // Group by collection, chunk long entries
    const contentChunks: string[][] = [];
    let currentChunk: string[] = [];
    let currentLen = 0;
    const paragraphs = content.split(/\n\s*\n/);

    for (const para of paragraphs) {
      if (currentLen + para.length > 3000 && currentChunk.length > 0) {
        contentChunks.push(currentChunk);
        currentChunk = [];
        currentLen = 0;
      }
      currentChunk.push(para);
      currentLen += para.length;
    }
    if (currentChunk.length > 0) contentChunks.push(currentChunk);

    for (let i = 0; i < contentChunks.length; i++) {
      chunks.push({
        source: 'vedas-corpus',
        category: 'classical_text',
        title: `${collection}${contentChunks.length > 1 ? ` (Part ${i + 1})` : ''}`,
        metadata: { collection, source: 'Indian Vedas Corpus' },
        content: `Collection: ${collection}\n${metadata}\n\n${contentChunks[i].join('\n\n')}`,
      });
    }
  }

  return chunks;
}

function chunkAyurwikiHerbs(): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let herbs: any[] = [];
  try {
    const herbsPath = resolve(ROOT, 'knowledge-base', 'ayurwiki-herbs', 'herbs.json');
    herbs = JSON.parse(readFileSync(herbsPath, 'utf-8'));
  } catch {
    console.warn('  Warning: ayurwiki-herbs/herbs.json not found.');
    return [];
  }

  for (const herb of herbs) {
    const title = herb.title || herb.name || 'Unknown';
    const scientificName = herb.scientificName || '';
    const commonNames = Array.isArray(herb.commonNames) ? herb.commonNames.join(', ') : (herb.commonNames || '');
    const categories = Array.isArray(herb.categories) ? herb.categories.slice(0, 5).join(', ') : (herb.categories || '');
    const uses = herb.uses || '';
    const partsUsed = herb.partsUsed || '';
    const chemicalComposition = herb.chemicalComposition || '';
    const medicalConditions = Array.isArray(herb.medicalConditions) ? herb.medicalConditions.join(', ') : (herb.medicalConditions || '');
    const habit = herb.habit || '';

    const content = [
      `Herb: ${title}\nScientific Name: ${scientificName}\nCommon Names: ${commonNames}`,
      partsUsed ? `Parts Used: ${partsUsed}` : '',
      uses ? `Uses: ${uses}` : '',
      medicalConditions ? `Medical Conditions: ${medicalConditions}` : '',
      chemicalComposition ? `Chemical Composition: ${chemicalComposition}` : '',
      habit ? `Habit: ${habit}` : '',
      categories ? `Categories: ${categories}` : '',
    ].filter(Boolean).join('\n');

    if (!content || content.trim().length < 20) continue;

    chunks.push({
      source: 'ayurwiki',
      category: 'herb_monograph',
      title,
      metadata: { scientificName, source: 'Ayurwiki Wikipedia' },
      content,
    });
  }

  return chunks;
}

function chunkGitaCharak(): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  let data: any = null;
  try {
    const dataPath = resolve(ROOT, 'knowledge-base', 'gita-datasets-charak', 'charak-samhita.json');
    data = JSON.parse(readFileSync(dataPath, 'utf-8'));
  } catch {
    console.warn('  Warning: gita-datasets-charak/charak-samhita.json not found.');
    return [];
  }

  if (!data?.sthanas) return [];

  for (const sthana of data.sthanas) {
    for (const chapter of (sthana.chapters || [])) {
      const verses = chapter.verses || [];
      if (verses.length === 0) continue;

      // Group verses into chunks of 10
      const VERSES_PER_CHUNK = 10;
      for (let i = 0; i < verses.length; i += VERSES_PER_CHUNK) {
        const group = verses.slice(i, i + VERSES_PER_CHUNK);
        const verseText = group.map((v: any) => `Verse ${v.verse_id}: ${v.text}`).join('\n');

        chunks.push({
          source: 'gita-charak',
          category: 'classical_text',
          title: `${sthana.name} - Ch.${chapter.chapterNumber} (Verses ${i + 1}-${i + group.length})`,
          metadata: {
            sthana: sthana.name,
            sthanaNumber: sthana.sthanaNumber,
            chapterNumber: chapter.chapterNumber,
            source: 'Gita/Datasets Charak Samhita',
          },
          content: `Charak Samhita - ${sthana.name} (${sthana.englishName})\nChapter ${chapter.chapterNumber}\n\n${verseText}`,
        });
      }
    }
  }

  return chunks;
}

function chunkBhavaprakasha(): ChunkInput[] {
  // Chunk herbs (one per herb)
  const herbChunks = BHAVAPRAKASHA_HERBS.map(h => ({
    content: `Bhavaprakasha Nigantu - ${h.name} (${h.transliteration} / ${h.englishName})\nVarga: ${h.varga}\nRasa: ${h.rasa}, Guna: ${h.guna}, Virya: ${h.veerya}, Vipaka: ${h.vipaka}\nDosha Effect: ${h.doshaEffect}\nIndications: ${h.indications.join(', ')}\nFormulations: ${h.formulations.join(', ')}\nDose: ${h.dose}\nPrecautions: ${h.precautions.join(', ')}\nSource: ${h.source}, ${h.sourceVerse}`,
    source: 'bhavaprakasha-nigantu',
    category: 'classical_text',
    title: `${h.name} - Bhavaprakasha Nigantu`,
    metadata: {},
  }));

  // Chunk formulations
  const formChunks = BHAVAPRAKASHA_FORMULATIONS.map(f => ({
    content: `Bhavaprakasha Nigantu - Formulation: ${f.name} (${f.transliteration})\nType: ${f.dosageForm}\nIngredients: ${f.ingredients.join(', ')}\nPreparation: ${f.preparationMethod}\nIndications: ${f.indications.join(', ')}\nDose: ${f.dose}\nAnupana: ${f.anupana}\nPrecautions: ${f.precautions.join(', ')}`,
    source: 'bhavaprakasha-nigantu',
    category: 'classical_text',
    title: `${f.name} - Bhavaprakasha Formulation`,
    metadata: {},
  }));

  // Chunk diseases
  const diseaseChunks = BHAVAPRAKASHA_DISEASES.map(d => ({
    content: `Bhavaprakasha Nigantu - Disease: ${d.name} (${d.transliteration})\nSanskrit: ${d.sanskritTerms}\nPathology: ${d.pathology}\nSymptoms: ${d.symptoms.join(', ')}\nFormulations: ${d.formulations.join(', ')}\nDiet: ${d.dietaryAdvice.join(', ')}\nLifestyle: ${d.lifestyleAdvice.join(', ')}\nPrognosis: ${d.prognosis}`,
    source: 'bhavaprakasha-nigantu',
    category: 'classical_text',
    title: `${d.name} - Bhavaprakasha Disease`,
    metadata: {},
  }));

  // Chunk preparations
  const prepChunks = BHAVAPRAKASHA_PREPARATIONS.map(p => ({
    content: `Bhavaprakasha Nigantu - Preparation: ${p.name} (${p.transliteration})\nType: ${p.type}\nProcedure: ${p.procedure}\nIndications: ${p.indications.join(', ')}\nDose: ${p.dose}\nPrecautions: ${p.precautions.join(', ')}`,
    source: 'bhavaprakasha-nigantu',
    category: 'classical_text',
    title: `${p.name} - Bhavaprakasha Preparation`,
    metadata: {},
  }));

  return [...herbChunks, ...formChunks, ...diseaseChunks, ...prepChunks];
}

function chunkRasaShastra(): ChunkInput[] {
  const dravyaChunks = RASA_DRAVYAS.map(d => ({
    content: `Rasa Shastra - ${d.name} (${d.transliteration} / ${d.englishName})\nCategory: ${d.category}\nRasa: ${d.rasa}, Guna: ${d.guna}, Virya: ${d.veerya}, Vipaka: ${d.vipaka}\nDosha Effect: ${d.doshaEffect}\nShodhana: ${d.shodhana}\nIndications: ${d.indications.join(', ')}\nToxicity: ${d.toxicity}\nProcessing: ${d.processingNotes.join('; ')}`,
    source: 'rasa-shastra',
    category: 'classical_text',
    title: `${d.name} - Rasa Shastra Dravya`,
    metadata: {},
  }));

  const bhasmaChunks = BHASMA_PREPARATIONS.map(b => ({
    content: `Rasa Shastra - Bhasma: ${b.name} (${b.transliteration} / ${b.englishName})\nMetal: ${b.metal}\nShodhana: ${b.shodhanaMethod}\nMarana: ${b.maranaMethod}\nQuality Tests: ${b.qualityTests.join(', ')}\nIndications: ${b.indications.join(', ')}\nDose: ${b.dose}\nContraindications: ${b.contraindications.join(', ')}\nToxicity: ${b.toxicityNotes.join('; ')}`,
    source: 'rasa-shastra',
    category: 'classical_text',
    title: `${b.name} - Rasa Shastra Bhasma`,
    metadata: {},
  }));

  const aushadhiChunks = RASA_AUSHADHIS.map(a => ({
    content: `Rasa Shastra - Aushadhi: ${a.name} (${a.transliteration})\nIngredients: ${a.ingredients.join(', ')}\nPreparation: ${a.preparationMethod}\nIndications: ${a.indications.join(', ')}\nDose: ${a.dose}\nPrecautions: ${a.precautions.join(', ')}`,
    source: 'rasa-shastra',
    category: 'classical_text',
    title: `${a.name} - Rasa Shastra Aushadhi`,
    metadata: {},
  }));

  const shodhanaChunks = SHODHANA_PROCEDURES.map(s => ({
    content: `Rasa Shastra - Shodhana: ${s.name} (${s.transliteration})\nSubstance: ${s.substance}\nMedium: ${s.medium}\nProcedure: ${s.procedure}\nDuration: ${s.duration}\nEndpoint: ${s.endpoint}\nPurpose: ${s.purpose}`,
    source: 'rasa-shastra',
    category: 'classical_text',
    title: `${s.name} - Shodhana Procedure`,
    metadata: {},
  }));

  return [...dravyaChunks, ...bhasmaChunks, ...aushadhiChunks, ...shodhanaChunks];
}

function chunkRasayanaVajikarana(): ChunkInput[] {
  const rasayanaChunks = RASAYANA_HERBS.map(h => ({
    content: `Rasayana - ${h.name} (${h.transliteration} / ${h.englishName})\nType: ${h.type}\nRasa: ${h.rasa}, Guna: ${h.guna}, Virya: ${h.veerya}, Vipaka: ${h.vipaka}\nDosha Effect: ${h.doshaEffect}\nIndications: ${h.indications.join(', ')}\nFormulations: ${h.formulations.join(', ')}\nDose: ${h.dose}\nMechanism: ${h.mechanism}`,
    source: 'rasayana-vajikarana',
    category: 'classical_text',
    title: `${h.name} - Rasayana Herb`,
    metadata: {},
  }));

  const vajiChunks = VAJIKARANA_HERBS.map(h => ({
    content: `Vajikarana - ${h.name} (${h.transliteration} / ${h.englishName})\nRasa: ${h.rasa}, Guna: ${h.guna}, Virya: ${h.veerya}, Vipaka: ${h.vipaka}\nDosha Effect: ${h.doshaEffect}\nIndications: ${h.indications.join(', ')}\nDose: ${h.dose}\nMechanism: ${h.mechanism}`,
    source: 'rasayana-vajikarana',
    category: 'classical_text',
    title: `${h.name} - Vajikarana Herb`,
    metadata: {},
  }));

  const protocolChunks = RASAYANA_PROTOCOLS.map(p => ({
    content: `Rasayana Protocol - ${p.name} (${p.transliteration})\nType: ${p.type}\nHerbs: ${p.herbs.join(', ')}\nProcedure: ${p.procedure}\nDuration: ${p.duration}\nIndications: ${p.indications.join(', ')}\nContraindications: ${p.contraindications.join(', ')}\nBenefits: ${p.benefits.join(', ')}`,
    source: 'rasayana-vajikarana',
    category: 'classical_text',
    title: `${p.name} - Rasayana Protocol`,
    metadata: {},
  }));

  return [...rasayanaChunks, ...vajiChunks, ...protocolChunks];
}

function chunkYogaPranayama(): ChunkInput[] {
  const asanaChunks = YOGA_ASANAS.map(a => ({
    content: `Yoga Asana - ${a.name} (${a.transliteration} / ${a.englishName})\nCategory: ${a.category}, Difficulty: ${a.difficulty}\nDosha Effect: ${a.doshaEffect}\nIndications: ${a.indications.join(', ')}\nContraindications: ${a.contraindications.join(', ')}\nBenefits: ${a.benefits.join(', ')}\nSteps: ${a.steps.join('. ')}\nDuration: ${a.duration}, Repetitions: ${a.repetitions}`,
    source: 'yoga-pranayama',
    category: 'classical_text',
    title: `${a.name} - Yoga Asana`,
    metadata: {},
  }));

  const pranayamaChunks = PRANAYAMA_TECHNIQUES.map(p => ({
    content: `Pranayama - ${p.name} (${p.transliteration} / ${p.englishName})\nPattern: ${p.pattern}\nDosha Effect: ${p.doshaEffect}\nIndications: ${p.indications.join(', ')}\nContraindications: ${p.contraindications.join(', ')}\nBenefits: ${p.benefits.join(', ')}\nSteps: ${p.steps.join('. ')}\nDuration: ${p.duration}, Rounds: ${p.rounds}`,
    source: 'yoga-pranayama',
    category: 'classical_text',
    title: `${p.name} - Pranayama Technique`,
    metadata: {},
  }));

  const shatkarmaChunks = SHATKARMAS.map(s => ({
    content: `Shatkarma - ${s.name} (${s.transliteration} / ${s.englishName})\nPurpose: ${s.purpose}\nIndications: ${s.indications.join(', ')}\nContraindications: ${s.contraindications.join(', ')}\nProcedure: ${s.procedure}\nPrecautions: ${s.precautions.join(', ')}`,
    source: 'yoga-pranayama',
    category: 'classical_text',
    title: `${s.name} - Shatkarma`,
    metadata: {},
  }));

  const protocolChunks = YOGA_PROTOCOLS.map(p => ({
    content: `Yoga Protocol - ${p.name} (${p.transliteration})\nCondition: ${p.condition}\nAsanas: ${p.asanas.join(', ')}\nPranayama: ${p.pranayama.join(', ')}\nDuration: ${p.duration}, Frequency: ${p.frequency}\nPrecautions: ${p.precautions.join(', ')}`,
    source: 'yoga-pranayama',
    category: 'classical_text',
    title: `${p.name} - Yoga Protocol`,
    metadata: {},
  }));

  return [...asanaChunks, ...pranayamaChunks, ...shatkarmaChunks, ...protocolChunks];
}

function chunkKaumaraBhritya(): ChunkInput[] {
  const garbhaChunks = GARBHA_CARE.map(g => ({
    content: `Kaumara Bhritya - Garbha Care: ${g.name} (${g.transliteration})\nTrimester: ${g.trimester}\nCare: ${g.care}\nDiet: ${g.diet.join(', ')}\nActivities: ${g.activities.join(', ')}\nRestrictions: ${g.restrictions.join(', ')}\nFormulations: ${g.formulations.join(', ')}`,
    source: 'kaumara-bhritya',
    category: 'classical_text',
    title: `${g.name} - Garbha Care`,
    metadata: {},
  }));

  const sutikaChunks = SUTIKA_CARE.map(s => ({
    content: `Kaumara Bhritya - Sutika Care: ${s.name} (${s.transliteration})\nPeriod: ${s.period}\nCare: ${s.care}\nFormulations: ${s.formulations.join(', ')}\nDiet: ${s.dietaryAdvice.join(', ')}\nLifestyle: ${s.lifestyleAdvice.join(', ')}\nComplications: ${s.complications.join(', ')}`,
    source: 'kaumara-bhritya',
    category: 'classical_text',
    title: `${s.name} - Sutika Care`,
    metadata: {},
  }));

  const balChunks = BAL_ROGA.map(b => ({
    content: `Kaumara Bhritya - Bal Roga: ${b.name} (${b.transliteration})\nAge: ${b.age}\nSymptoms: ${b.symptoms.join(', ')}\nFormulations: ${b.formulations.join(', ')}\nDose: ${b.dose}\nPrecautions: ${b.precautions.join(', ')}`,
    source: 'kaumara-bhritya',
    category: 'classical_text',
    title: `${b.name} - Bal Roga`,
    metadata: {},
  }));

  const garbhasanskarChunks = GARBHASANSKAR.map(g => ({
    content: `Kaumara Bhritya - Garbhasanskar: ${g.name} (${g.transliteration})\nPeriod: ${g.period}\nPractice: ${g.practice}\nPurpose: ${g.purpose}\nBenefits: ${g.benefits.join(', ')}`,
    source: 'kaumara-bhritya',
    category: 'classical_text',
    title: `${g.name} - Garbhasanskar`,
    metadata: {},
  }));

  return [...garbhaChunks, ...sutikaChunks, ...balChunks, ...garbhasanskarChunks];
}

function chunkGrahaChikitsa(): ChunkInput[] {
  const unmadaChunks = UNMADA_TYPES.map(u => ({
    content: `Graha Chikitsa - Unmada: ${u.name} (${u.transliteration})\nDosha: ${u.dosha}\nSymptoms: ${u.symptoms.join(', ')}\nFormulations: ${u.formulations.join(', ')}\nPsychotherapy: ${u.psychotherapy.join(', ')}\nDiet: ${u.dietaryAdvice.join(', ')}\nLifestyle: ${u.lifestyleAdvice.join(', ')}`,
    source: 'graha-chikitsa',
    category: 'classical_text',
    title: `${u.name} - Unmada Type`,
    metadata: {},
  }));

  const apasmaraChunks = APASMARA_TYPES.map(a => ({
    content: `Graha Chikitsa - Apasmara: ${a.name} (${a.transliteration})\nDosha: ${a.dosha}\nSymptoms: ${a.symptoms.join(', ')}\nFormulations: ${a.formulations.join(', ')}\nEmergency: ${a.emergencyManagement.join(', ')}\nDiet: ${a.dietaryAdvice.join(', ')}`,
    source: 'graha-chikitsa',
    category: 'classical_text',
    title: `${a.name} - Apasmara Type`,
    metadata: {},
  }));

  const medhyaChunks = MEDHYA_RASAYANAS.map(m => ({
    content: `Graha Chikitsa - Medhya Rasayana: ${m.name} (${m.transliteration})\nIngredients: ${m.ingredients.join(', ')}\nIndications: ${m.indications.join(', ')}\nDose: ${m.dose}\nBenefits: ${m.benefits.join(', ')}`,
    source: 'graha-chikitsa',
    category: 'classical_text',
    title: `${m.name} - Medhya Rasayana`,
    metadata: {},
  }));

  const satvavajayaChunks = SATVAVAJAYA_TECHNIQUES.map(s => ({
    content: `Graha Chikitsa - Satvavajaya: ${s.name} (${s.transliteration})\nTechnique: ${s.technique}\nIndications: ${s.indications.join(', ')}\nProcedure: ${s.procedure}\nBenefits: ${s.benefits.join(', ')}`,
    source: 'graha-chikitsa',
    category: 'classical_text',
    title: `${s.name} - Satvavajaya Technique`,
    metadata: {},
  }));

  return [...unmadaChunks, ...apasmaraChunks, ...medhyaChunks, ...satvavajayaChunks];
}

function chunkWhoItaTerms(): ChunkInput[] {
  // Group by category to reduce chunk count (3,547 terms → ~50 category chunks)
  const byCategory = new Map<string, typeof WHO_ITA_TERMS>();
  for (const t of WHO_ITA_TERMS) {
    const key = `${t.category.chapter_id}|${t.category.chapter_name}`;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(t);
  }
  const chunks: ChunkInput[] = [];
  for (const [key, terms] of byCategory) {
    const [chapterId, chapterName] = key.split('|');
    const termList = terms.map(t =>
      `- ${t.english} (${t.devanagari || ''} / ${t.iast || ''}) [${t.term_id}]: ${t.description || 'N/A'}`
    ).join('\n');
    chunks.push({
      content: `WHO ITA Chapter: ${chapterName} (${chapterId})\nTerms (${terms.length}):\n${termList}`,
      source: 'who-ita',
      category: 'standardized-terminology',
      title: `${chapterName} - WHO ITA`,
      metadata: { chapterId, termCount: terms.length },
    });
  }
  return chunks;
}

function chunkLabValues(): ChunkInput[] {
  return LAB_TESTS.map(t => {
    const interp = t.ayurvedicInterpretation;
    const dosha = t.doshaCorrelation;
    return {
      content: [
        `Clinical Lab Value - ${t.name} (${t.category})`,
        `Sanskrit: ${t.sanskritTerm} (${t.devanagariTerm})`,
        `Normal Range: ${t.normalRange} ${t.unit}`,
        `Ayurvedic Interpretation:`,
        `  Low: ${interp.low}`,
        `  Normal: ${interp.normal}`,
        `  High: ${interp.high}`,
        `Dosha Correlation:`,
        `  Primary: ${dosha.primaryDosha}, Secondary: ${dosha.secondaryDosha}`,
        `  Effect: ${dosha.doshaEffect}`,
        `Clinical Significance: ${t.clinicalSignificance}`,
      ].join('\n'),
      source: 'lab-values',
      category: 'clinical-reference',
      title: `${t.name} - Lab Values`,
      metadata: { sanskritTerm: t.sanskritTerm, devanagariTerm: t.devanagariTerm },
    };
  });
}

function chunkPlanetAyurvedaFormulations(formulations: any[]): ChunkInput[] {
  const chunks: ChunkInput[] = [];

  for (const form of formulations) {
    const base = {
      source: 'planet-ayurveda-formulation',
      category: form.category,
      metadata: { id: form.id, name: form.name, url: form.url, formCategory: form.category },
    };

    const sectionKeys = Object.keys(form.sections);
    if (sectionKeys.length === 0) {
      const content = form.fullContent || '';
      if (content.trim()) {
        chunks.push({
          ...base,
          title: form.name,
          content: `Classical Formulation: ${form.name}\nCategory: ${form.category}\nSource: Planet Ayurveda\n\n${content}`,
        });
      }
      continue;
    }

    const contentChunks: string[][] = [];
    let currentChunk: string[] = [];
    let currentLen = 0;

    for (const key of sectionKeys) {
      const sectionText = form.sections[key];
      if (!sectionText) continue;
      const header = `${key.replace(/_/g, ' ').toUpperCase()}:`;
      const sectionFull = `${header}\n${sectionText}`;
      if (currentLen + sectionFull.length > 3000 && currentChunk.length > 0) {
        contentChunks.push(currentChunk);
        currentChunk = [];
        currentLen = 0;
      }
      currentChunk.push(sectionFull);
      currentLen += sectionFull.length;
    }
    if (currentChunk.length > 0) contentChunks.push(currentChunk);

    for (let i = 0; i < contentChunks.length; i++) {
      chunks.push({
        ...base,
        title: contentChunks.length > 1 ? `${form.name} (Part ${i + 1})` : form.name,
        content: `Classical Formulation: ${form.name}\nCategory: ${form.category}\nSource: Planet Ayurveda\n\n${contentChunks[i].join('\n\n')}`,
      });
    }
  }

  return chunks;
}

async function main() {
  console.log('=== AyurScribe Knowledge Ingestion (v2) ===\n');

  // ── Step 1: Fetch existing sources from DB ──
  console.log('Fetching existing sources from DB (paginated)...');
  const existingSources = new Set<string>();
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/knowledge_embeddings?select=source&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) { console.warn(`  Failed at offset ${offset}`); break; }
    const rows = await res.json();
    if (rows.length === 0) break;
    for (const r of rows) existingSources.add(r.source);
    offset += PAGE;
    if (rows.length < PAGE) break;
  }
  console.log(`  Found ${existingSources.size} existing sources: ${[...existingSources].sort().join(', ')}\n`);

  const knowledgeBasePath = resolve(ROOT, 'knowledge-base', 'ayurknowledge');
  const mod = await import(`file:///${knowledgeBasePath.replace(/\\/g, '/')}/index.ts`);
  const AYURVEDA_KNOWLEDGE = mod.AYURVEDA_KNOWLEDGE;

  // ── Step 2: Chunk sources NOT already in DB ──
  const allChunks: ChunkInput[] = [];

  const shouldSkip = (source: string) => {
    if (existingSources.has(source)) {
      console.log(`  ⏭ Skipping ${source} (already in DB)`);
      return true;
    }
    return false;
  };

  if (!shouldSkip('diseases')) {
    console.log('Chunking diseases...');
    for (const d of (AYURVEDA_KNOWLEDGE.diseases ?? [])) allChunks.push(...chunkDisease(d));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('herbs')) {
    console.log('Chunking herbs...');
    for (const h of (AYURVEDA_KNOWLEDGE.herbs ?? [])) allChunks.push(...chunkHerb(h));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('treatments')) {
    console.log('Chunking treatments...');
    for (const t of (AYURVEDA_KNOWLEDGE.treatments ?? [])) allChunks.push(...chunkTreatment(t));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('diagnostics')) {
    console.log('Chunking diagnostics...');
    for (const m of (AYURVEDA_KNOWLEDGE.diagnostics ?? [])) allChunks.push(...chunkDiagnostics(m));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('allopathy')) {
    console.log('Chunking allopathy integration...');
    for (const a of (AYURVEDA_KNOWLEDGE.allopathyIntegration ?? [])) allChunks.push(...chunkAllopathy(a));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('fundamentals')) {
    console.log('Chunking fundamentals...');
    allChunks.push(...chunkFundamentalsConcepts(AYURVEDA_KNOWLEDGE.fundamentals));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('charak-samhita')) {
    console.log('Chunking Charak Samhita...');
    allChunks.push(...chunkCharakSamhita(AYURVEDA_KNOWLEDGE.charakSamhita));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('sushruta-samhita')) {
    console.log('Chunking Sushruta Samhita...');
    allChunks.push(...chunkSushrutaSamhita());
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('charak-online')) {
    console.log('Chunking Charak Online shlokas...');
    allChunks.push(...chunkCharakOnlineShlokas());
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('charak-tattva-vimarsha') && !shouldSkip('charak-vidhi-vimarsha')) {
    console.log('Chunking Tattva Vimarsha...');
    allChunks.push(...chunkTattvaVimarsha());
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('vasishth-clinical-experience')) {
    console.log('Chunking Dr. Vasishth clinical experiences...');
    allChunks.push(...chunkVasishthArticles(AYURVEDA_KNOWLEDGE.vasishthArticles ?? []));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('ayur-case-study')) {
    console.log('Chunking Ayur case studies...');
    allChunks.push(...chunkCaseStudies(AYURVEDA_KNOWLEDGE.caseStudies ?? []));
    console.log(`  → ${allChunks.length} chunks`);
    console.log('Chunking case study treatments...');
    allChunks.push(...chunkCaseTreatments(AYURVEDA_KNOWLEDGE.caseTreatments ?? []));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('planet-ayurveda')) {
    console.log('Chunking Planet Ayurveda diseases...');
    allChunks.push(...chunkPlanetAyurveda(AYURVEDA_KNOWLEDGE.planetAyurvedaDiseases ?? []));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('planet-ayurveda-herb')) {
    console.log('Chunking Planet Ayurveda herbs...');
    allChunks.push(...chunkPlanetAyurvedaHerbs(AYURVEDA_KNOWLEDGE.planetAyurvedaHerbs ?? []));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('planet-ayurveda-formulation')) {
    console.log('Chunking Planet Ayurveda classical formulations...');
    allChunks.push(...chunkPlanetAyurvedaFormulations(AYURVEDA_KNOWLEDGE.planetAyurvedaFormulations ?? []));
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('amidha-herbs')) {
    console.log('Chunking Amidha Herb Database...');
    allChunks.push(...chunkAmidhaHerbs());
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('bhaishajya-kalpana-kosha')) {
    console.log('Chunking Bhaishajya Kalpana Kosha...');
    allChunks.push(...chunkBhaishajyaFormulations());
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('ashtanga-hridaya')) {
    console.log('Chunking Ashtanga Hridaya...');
    allChunks.push(...chunkAshtangaHridaya());
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('siddhanta-kosha')) {
    console.log('Chunking Siddhanta Kosha...');
    allChunks.push(...chunkSiddhantaKosha());
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('kerala-ayurveda')) {
    console.log('Chunking Kerala Ayurveda...');
    allChunks.push(...chunkKeralaAyurveda());
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('vedas-corpus')) {
    console.log('Chunking Indian Vedas Corpus...');
    allChunks.push(...chunkVedasCorpus());
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('ayurwiki')) {
    console.log('Chunking Ayurwiki Herbs...');
    allChunks.push(...chunkAyurwikiHerbs());
    console.log(`  → ${allChunks.length} chunks`);
  }

  if (!shouldSkip('gita-charak')) {
    console.log('Chunking Gita/Datasets Charak Samhita...');
    allChunks.push(...chunkGitaCharak());
    console.log(`  → ${allChunks.length} chunks`);
  }

  // ── NEW sources (always embed) ──
  console.log('Chunking Bhavaprakasha Nigantu...');
  allChunks.push(...chunkBhavaprakasha());
  console.log(`  → ${allChunks.length} chunks`);

  console.log('Chunking Rasa Shastra...');
  allChunks.push(...chunkRasaShastra());
  console.log(`  → ${allChunks.length} chunks`);

  console.log('Chunking Rasayana & Vajikarana...');
  allChunks.push(...chunkRasayanaVajikarana());
  console.log(`  → ${allChunks.length} chunks`);

  console.log('Chunking Yoga & Pranayama...');
  allChunks.push(...chunkYogaPranayama());
  console.log(`  → ${allChunks.length} chunks`);

  console.log('Chunking Kaumara Bhritya...');
  allChunks.push(...chunkKaumaraBhritya());
  console.log(`  → ${allChunks.length} chunks`);

  console.log('Chunking Graha Chikitsa...');
  allChunks.push(...chunkGrahaChikitsa());
  console.log(`  → ${allChunks.length} chunks`);

  console.log('Chunking WHO ITA Terms (grouped by category)...');
  allChunks.push(...chunkWhoItaTerms());
  console.log(`  → ${allChunks.length} chunks`);

  console.log('Chunking Lab Values...');
  allChunks.push(...chunkLabValues());
  console.log(`  → ${allChunks.length} chunks`);

  // ── Step 3: All remaining chunks are new ──
  console.log(`\n${allChunks.length} new chunks to embed`);

  if (allChunks.length === 0) {
    console.log('Nothing new to embed. Done.');
    return;
  }

  // ── Step 4: Embed with conservative batching ──
  const totalTexts = allChunks.map(c => {
    const prefix = generateContextPrefix(c);
    return `${prefix}\n\n${c.content}`;
  });
  console.log(`\nEmbedding ${totalTexts.length} new chunks (batch size 2, 1.5s delay)...`);

  const embeddings = await embedBatch(totalTexts);

  // Filter out chunks where embedding failed (null)
  const validIndices: number[] = [];
  for (let i = 0; i < allChunks.length; i++) {
    if (embeddings[i] !== null && embeddings[i] !== undefined) {
      validIndices.push(i);
    }
  }
  if (validIndices.length < allChunks.length) {
    console.warn(`  ⚠ ${allChunks.length - validIndices.length} chunks had failed embeddings and will be skipped.`);
  }

  // ── Step 5: Insert into Supabase ──
  let inserted = 0;
  let errors = 0;

  const INSERT_BATCH = 20;
  for (let i = 0; i < validIndices.length; i += INSERT_BATCH) {
    const batchIndices = validIndices.slice(i, i + INSERT_BATCH);
    const batch = batchIndices.map(idx => allChunks[idx]);

    const rows = batch.map((chunk, j) => ({
      content: chunk.content,
      embedding: JSON.stringify(embeddings[batchIndices[j]]),
      source: chunk.source,
      category: chunk.category,
      title: chunk.title,
      metadata: JSON.stringify(chunk.metadata),
      content_hash: contentHash(chunk.content),
    }));

    try {
      await supabaseInsert(rows);
      inserted += rows.length;
      process.stdout.write(`  Upserted ${inserted}/${validIndices.length}\r`);
    } catch {
      errors += rows.length;
    }

    if (i + INSERT_BATCH < validIndices.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`  New chunks embedded: ${validIndices.length}`);
  console.log(`  Failed embeddings: ${allChunks.length - validIndices.length}`);
  console.log(`  Upserted: ${inserted}`);
  console.log(`  Insert errors: ${errors}`);
  console.log(`Done.`);
}

main().catch(e => { console.error(e); process.exit(1); });