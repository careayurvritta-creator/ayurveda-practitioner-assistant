#!/usr/bin/env tsx
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

function textEmbeddingInput(text: string): { text: string } {
  return { text: text.slice(0, 20000) };
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text: text.slice(0, 20000) }] } }),
    });
    if (!res.ok) throw new Error(`Gemini embed error ${res.status}`);
    const data = await res.json();
    const values: number[] = data.embedding?.values ?? [];
    results.push(values.slice(0, 1024));
  }
  return results;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (NVIDIA_API_KEY) {
    const batchSize = 20;
    const allEmbeds: number[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const embeddings = await embedNVIDIA(batch);
      allEmbeds.push(...embeddings);
      if (i + batchSize < texts.length) await new Promise(r => setTimeout(r, 200));
    }
    return allEmbeds;
  }
  return embedGeminiBatch(texts);
}

async function supabaseInsert(rows: any[]) {
  const url = `${SUPABASE_URL}/rest/v1/knowledge_embeddings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error('  Supabase insert error:', res.status, t.slice(0, 300));
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
    const shlokasPath = resolve(ROOT, 'knowledge-base', 'charak-samhita', 'all-shlokas.json');
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
    const dataPath = resolve(ROOT, 'knowledge-base', 'charak-samhita', 'tattva-vidhi-vimarsha.json');
    data = JSON.parse(readFileSync(dataPath, 'utf-8'));
  } catch {
    console.warn('  Warning: charak-samhita/tattva-vidhi-vimarsha.json not found.');
    return [];
  }

  const tattva = data.tattvaVimarsha || [];
  const vidhi = data.vidhiVimarsha || [];

  for (const section of tattva) {
    if (!section.content || section.content.trim().length === 0) continue;
    chunks.push({
      source: 'charak-tattva-vimarsha',
      category: 'fundamentals',
      title: `Tattva Vimarsha - ${section.chapterName || section.chapter || 'Unknown'}`,
      metadata: { type: 'tattva', chapter: section.chapter, sthana: section.sthana },
      content: `Tattva Vimarsha (Fundamental Principles):\n${section.chapterName || ''}\n\n${section.content}`,
    });
  }

  for (const section of vidhi) {
    if (!section.content || section.content.trim().length === 0) continue;
    chunks.push({
      source: 'charak-vidhi-vimarsha',
      category: 'classical_text',
      title: `Vidhi Vimarsha - ${section.chapterName || section.chapter || 'Unknown'}`,
      metadata: { type: 'vidhi', chapter: section.chapter, sthana: section.sthana },
      content: `Vidhi Vimarsha (Applied Inferences):\n${section.chapterName || ''}\n\n${section.content}`,
    });
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
  console.log('=== AyurScribe Knowledge Ingestion ===\n');

  const knowledgeBasePath = resolve(ROOT, 'knowledge-base', 'ayurknowledge');

  const mod = await import(`file:///${knowledgeBasePath.replace(/\\/g, '/')}/index.ts`);
  const AYURVEDA_KNOWLEDGE = mod.AYURVEDA_KNOWLEDGE;

  const allChunks: ChunkInput[] = [];

  console.log('Chunking diseases...');
  for (const d of (AYURVEDA_KNOWLEDGE.diseases ?? [])) allChunks.push(...chunkDisease(d));
  console.log(`  → ${allChunks.length} chunks from diseases`);

  console.log('Chunking herbs...');
  for (const h of (AYURVEDA_KNOWLEDGE.herbs ?? [])) allChunks.push(...chunkHerb(h));
  console.log(`  → ${allChunks.length} total chunks`);

  console.log('Chunking treatments...');
  for (const t of (AYURVEDA_KNOWLEDGE.treatments ?? [])) allChunks.push(...chunkTreatment(t));
  console.log(`  → ${allChunks.length} total chunks`);

  console.log('Chunking diagnostics...');
  for (const m of (AYURVEDA_KNOWLEDGE.diagnostics ?? [])) allChunks.push(...chunkDiagnostics(m));
  console.log(`  → ${allChunks.length} total chunks`);

  console.log('Chunking allopathy integration...');
  for (const a of (AYURVEDA_KNOWLEDGE.allopathyIntegration ?? [])) allChunks.push(...chunkAllopathy(a));
  console.log(`  → ${allChunks.length} total chunks`);

  console.log('Chunking fundamentals...');
  allChunks.push(...chunkFundamentalsConcepts(AYURVEDA_KNOWLEDGE.fundamentals));
  console.log(`  → ${allChunks.length} total chunks`);

  console.log('Chunking Charak Samhita...');
  allChunks.push(...chunkCharakSamhita(AYURVEDA_KNOWLEDGE.charakSamhita));
  console.log(`  → ${allChunks.length} total chunks`);

  console.log('Chunking Sushruta Samhita (verse-based)...');
  const sushrutaChunks = chunkSushrutaSamhita();
  allChunks.push(...sushrutaChunks);
  console.log(`  → ${allChunks.length} total chunks (${sushrutaChunks.length} from Sushruta)`);

  console.log('Chunking Charak Online shlokas (verse-based)...');
  const charakOnlineChunks = chunkCharakOnlineShlokas();
  allChunks.push(...charakOnlineChunks);
  console.log(`  → ${allChunks.length} total chunks (${charakOnlineChunks.length} from Charak Online)`);

  console.log('Chunking Tattva Vimarsha...');
  const tattvaChunks = chunkTattvaVimarsha();
  allChunks.push(...tattvaChunks);
  console.log(`  → ${allChunks.length} total chunks (${tattvaChunks.length} from Tattva/Vidhi Vimarsha)`);

  console.log('Chunking Dr. Vasishth clinical experiences...');
  const vasishthChunks = chunkVasishthArticles(AYURVEDA_KNOWLEDGE.vasishthArticles ?? []);
  allChunks.push(...vasishthChunks);
  console.log(`  → ${allChunks.length} total chunks (${vasishthChunks.length} from vasishth)`);

  console.log('Chunking Ayur case studies...');
  const csChunks = chunkCaseStudies(AYURVEDA_KNOWLEDGE.caseStudies ?? []);
  allChunks.push(...csChunks);
  console.log(`  → ${allChunks.length} total chunks (${csChunks.length} from case studies)`);

  console.log('Chunking case study treatments...');
  const txChunks = chunkCaseTreatments(AYURVEDA_KNOWLEDGE.caseTreatments ?? []);
  allChunks.push(...txChunks);
  console.log(`  → ${allChunks.length} total chunks (${txChunks.length} from treatments)`);

  console.log('Chunking Planet Ayurveda diseases...');
  const paChunks = chunkPlanetAyurveda(AYURVEDA_KNOWLEDGE.planetAyurvedaDiseases ?? []);
  allChunks.push(...paChunks);
  console.log(`  → ${allChunks.length} total chunks (${paChunks.length} from Planet Ayurveda)`);

  console.log('Chunking Planet Ayurveda herbs...');
  const paHerbChunks = chunkPlanetAyurvedaHerbs(AYURVEDA_KNOWLEDGE.planetAyurvedaHerbs ?? []);
  allChunks.push(...paHerbChunks);
  console.log(`  → ${allChunks.length} total chunks (${paHerbChunks.length} from Planet Ayurveda herbs)`);

  console.log('Chunking Planet Ayurveda classical formulations...');
  const paFormChunks = chunkPlanetAyurvedaFormulations(AYURVEDA_KNOWLEDGE.planetAyurvedaFormulations ?? []);
  allChunks.push(...paFormChunks);
  console.log(`  → ${allChunks.length} total chunks (${paFormChunks.length} from Planet Ayurveda formulations)`);

  const totalTexts = allChunks.map(c => {
    const prefix = generateContextPrefix(c);
    return `${prefix}\n\n${c.content}`;
  });
  console.log(`\nTotal chunks: ${allChunks.length}`);
  console.log(`Embedding with ${NVIDIA_API_KEY ? 'NVIDIA' : 'Gemini'} (with contextual prefixes)...`);

  const embeddings = await embedBatch(totalTexts);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  const BATCH_SIZE = 50;
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const embedBatch = embeddings.slice(i, i + BATCH_SIZE);

    const rows = batch.map((chunk, j) => ({
      content: chunk.content,
      embedding: JSON.stringify(embedBatch[j]),
      source: chunk.source,
      category: chunk.category,
      title: chunk.title,
      metadata: JSON.stringify(chunk.metadata),
      content_hash: contentHash(chunk.content),
    }));

    try {
      await supabaseInsert(rows);
      inserted += rows.length;
      process.stdout.write(`  Upserted ${inserted}/${allChunks.length}\r`);
    } catch {
      errors += rows.length;
    }

    if (i + BATCH_SIZE < allChunks.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`  Chunks embedded: ${allChunks.length}`);
  console.log(`  Upserted: ${inserted}`);
  console.log(`  Errors: ${errors}`);
  console.log(`Done.`);
}

main().catch(e => { console.error(e); process.exit(1); });