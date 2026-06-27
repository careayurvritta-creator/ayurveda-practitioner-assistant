#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface ParsedMessage {
  date: string;
  sender: string;
  text: string;
  lineStart: number;
}

interface CaseStudyEntry {
  id: string;
  caseNumber: number;
  diseaseName: string;
  diseaseNameEn: string;
  part1: string;
  part2: string;
  sections: Record<string, string>;
  category: string;
  datePosted: string;
  sender: string;
}

interface TreatmentEntry {
  id: string;
  treatmentNumber: number;
  title: string;
  content: string;
  sections: Record<string, string>;
  datePosted: string;
  sender: string;
}

const LINE_RE = /^(\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}) - (.+?): (.*)$/;

function parseMessages(raw: string): ParsedMessage[] {
  const lines = raw.split('\n');
  const msgs: ParsedMessage[] = [];
  let cur: ParsedMessage | null = null;

  for (let i = 0; i < lines.length; i++) {
    const m = LINE_RE.exec(lines[i]);
    if (m) {
      if (cur) msgs.push(cur);
      cur = { date: m[1], sender: m[2], text: m[3], lineStart: i };
    } else if (cur) {
      cur.text += '\n' + lines[i];
    }
  }
  if (cur) msgs.push(cur);
  return msgs;
}

function extractCaseStudyNumber(text: string): number | null {
  const patterns = [
    /CASE\s+STUDY\s+NO\s*:\s*(\d+)/i,
    /CASE\s+STUDY\s*:\s*(\d+)/i,
    /CASE\s+STUDY\s+(\d+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function extractPartNumber(text: string): number | null {
  const patterns = [
    /PART\s*NO\s*:\s*(\d+)/i,
    /PART\s*NON\s*:\s*(\d+)/i,
    /PART\s+NO\s+(\d+)/i,
    /PARTNO\s*:\s*(\d+)/i,
    /PART\s+(\d+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function extractTreatmentNumber(text: string): number | null {
  const m = text.match(/TREATMENT\s+NO\s*:\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function extractDiseaseName(part1Text: string): { sanskrit: string; english: string } {
  const lines = part1Text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('🔺')) continue;
    const clean = trimmed.replace(/^🔺+\s*/, '').trim();
    if (/^CASE\s+STUDY/i.test(clean)) continue;
    if (/^PART\s/i.test(clean)) continue;
    if (/^PARTNO/i.test(clean)) continue;

    const enMatch = clean.match(/^(.+?)\s*[\(（]\s*(.+?)\s*[\)）]\s*$/);
    if (enMatch) {
      return { sanskrit: enMatch[1].trim(), english: enMatch[2].trim() };
    }
    return { sanskrit: clean, english: '' };
  }
  return { sanskrit: 'Unknown', english: '' };
}

const SECTION_MAP: Record<string, string> = {
  'nidana': 'nidana',
  'nidanam': 'nidana',
  'nidana': 'nidana',
  'purvaroopam': 'purvaroopam',
  'purvarupam': 'purvaroopam',
  'purvarupa': 'purvaroopam',
  'poorvaroopam': 'purvaroopam',
  'laksanam': 'lakshana',
  'lakshana': 'lakshana',
  'lakshana': 'lakshana',
  'lakshanam': 'lakshana',
  'laksana': 'lakshana',
  'general examination': 'general_examination',
  'systemic examination': 'systemic_examination',
  'laboratory investigations': 'lab_investigations',
  'lab investigations': 'lab_investigations',
  'differential diagnosis': 'differential_diagnosis',
  'samprapti': 'samprapti',
  'samprapthi': 'samprapti',
  'samanya chikitsa': 'samanya_chikitsa',
  'samanya cikitsa': 'samanya_chikitsa',
  'samanya cikitisa': 'samanya_chikitsa',
  'upashaya': 'upashaya',
  'upasaya': 'upashaya',
  'anupashaya': 'anupashaya',
  'anupasaya': 'anupashaya',
  'vishesha chikitsa': 'vishesha_chikitsa',
  'visesha chikitsa': 'vishesha_chikitsa',
  'visesha cikitsa': 'vishesha_chikitsa',
  'vishesha cikitisa': 'vishesha_chikitsa',
};

function normalizeSection(name: string): string {
  const lower = name.toLowerCase().trim();
  return SECTION_MAP[lower] || lower.replace(/[^a-z0-9]+/g, '_');
}

const KNOWN_SECTIONS = [
  'nidana', 'nidanam', 'purvaroopam', 'purvarupam', 'purvarupa', 'poorvaroopam',
  'lakshana', 'lakshana', 'lakshanam', 'laksanam', 'laksana',
  'general examination', 'general examinations', 'general appearance',
  'systemic examination', 'systemic examinations', 'systemic local examination', 'systemic ocular examination',
  'general and systemic examination', 'general systemic examination',
  'general examination of sthanya kshaya',
  'laboratory investigations', 'lab investigations',
  'differential diagnosis',
  'samprapti', 'samprapthi',
  'samanya chikitsa', 'samanya cikitsa', 'samanya cikitisa',
  'upashaya', 'upasaya',
  'anupashaya', 'anupasaya',
  'vishesha chikitsa', 'visesha chikitsa', 'visesha cikitsa', 'vishesha cikitisa',
];

function extractSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = text.split('\n');
  let currentSection = '';
  const sectionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('🔺')) {
      if (currentSection) sectionLines.push(line);
      continue;
    }

    const content = trimmed.replace(/^🔺+\s*/, '').trim().toLowerCase();
    const parenIdx = content.indexOf('(');
    const colonIdx = content.indexOf(':');
    const cutIdx = parenIdx >= 0 ? parenIdx : (colonIdx >= 0 ? colonIdx : content.length);
    const sectionPart = content.slice(0, cutIdx).trim();

    const matched = KNOWN_SECTIONS.find(s => s === sectionPart);

    if (matched) {
      if (currentSection && sectionLines.length > 0) {
        sections[currentSection] = sectionLines.join('\n').trim();
      }
      currentSection = normalizeSection(matched);
      sectionLines.length = 0;
    } else if (currentSection) {
      sectionLines.push(line);
    }
  }
  if (currentSection && sectionLines.length > 0) {
    sections[currentSection] = sectionLines.join('\n').trim();
  }
  return sections;
}

function categorizeCase(diseaseName: string): string {
  const lower = diseaseName.toLowerCase();
  const categories: [string, string[]][] = [
    ['skin_disease', ['kushtha', 'psoriasis', 'eczema', 'dermatitis', 'skin', 'visarpa', 'palityam', 'white spot', 'vitiligo', 'shvitra', 'kanda']],
    ['respiratory', ['swasa', 'shwas', 'kasa', 'cough', 'asthma', ' respiratory', 'pranavaha']],
    ['digestive', ['agnimandya', 'grahani', 'apaha', 'arsha', 'piles', 'fistula', 'guda', 'parianal', 'abcess', 'malabandha', 'constipation', 'amatisara', 'atisara', 'diarrhea', 'vibandha', 'udara', 'pleeha', 'yakrit', 'liver']],
    ['neurological', ['ardita', 'facial', 'pakshaghata', 'stroke', 'gridhrasi', 'sciatica', 'katishoola', 'back pain', 'migraine', 'shirahshoola', 'headache', 'apasmara', 'epilepsy', 'unmada', 'madatyaya', 'vertigo', 'brahmi', 'brain']],
    ['musculoskeletal', ['sandhivata', 'amavata', 'arthritis', 'rheumatoid', 'osteoarthritis', 'sandhishotha', 'gout', 'asthi', 'bone', 'vatarakta', 'gouty']],
    ['metabolic', ['prameha', 'diabetes', 'madhumeha', 'sugar', 'mutrashmari', 'kidney stone', 'mutravaha', 'urinary', 'sahaaja prameha']],
    ['cardiovascular', ['hrdroga', 'heart', 'hridaya', 'raktapitta', 'bleeding', 'rakta', 'blood pressure', 'hypertension', 'raktavikara']],
    ['gynecological', ['yoni vyapat', 'yoni', 'gynec', 'stri', 'artava', 'menstrual', 'menopause', 'garbha', 'pregnancy', 'stanya', 'lactation', 'karnini', 'granthi']],
    ['pediatric', ['bala', 'pediatric', 'child', 'kashta', 'unmada graha', 'naigameshika', 'graha', 'kawal']],
    ['ent', ['karna', 'ear', 'nasa', 'nose', 'netra', 'eye', 'mukha', 'mouth', 'oral', 'danta', ' tooth', 'galaganda', 'thyroid', 'gandamala', 'tonsil', 'shanhi', 'sinus']],
    ['psychiatric', ['unmada', 'psych', 'mental', 'chittavibhram', 'madatyaya', 'alcohol']],
    ['infectious', ['jwara', 'fever', 'vishama jwara', 'malaria', 'visarpa', 'herpes', 'sotha', 'edema', 'shopha', 'infection']],
    ['autoimmune', ['amavata', 'auto', 'autoimmune', 'rheumatoid', 'vatarakta']],
    ['general', ['tridosha', 'dinacharya', 'ritucharya', 'panchakarma', 'rasayana', 'vajikarana', 'general', 'anxiety', 'stress', 'nervous weakness', 'leukoderma']],
  ];

  for (const [cat, keywords] of categories) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return 'clinical_case';
}

function main() {
  const p = resolve(ROOT, 'knowledge-base', 'case-studies', "WhatsApp Chat with 3️⃣Ayur case-studies.txt");
  const raw = readFileSync(p, 'utf-8');
  const msgs = parseMessages(raw);
  console.log(`Messages: ${msgs.length}`);

  const caseStudyMsgs: ParsedMessage[] = [];
  const treatmentMsgs: ParsedMessage[] = [];
  const skipped: string[] = [];

  for (const m of msgs) {
    if (extractCaseStudyNumber(m.text) !== null) {
      caseStudyMsgs.push(m);
    } else if (extractTreatmentNumber(m.text) !== null) {
      treatmentMsgs.push(m);
    }
  }

  console.log(`Case study messages: ${caseStudyMsgs.length}`);
  console.log(`Treatment messages: ${treatmentMsgs.length}`);

  // Group by case number + part
  const csMap = new Map<string, ParsedMessage[]>();
  for (const m of caseStudyMsgs) {
    const csNum = extractCaseStudyNumber(m.text)!;
    const partNum = extractPartNumber(m.text);
    const key = `${csNum}-${partNum ?? 0}`;
    if (!csMap.has(key)) csMap.set(key, []);
    csMap.get(key)!.push(m);
  }

  // Group treatments
  const txMap = new Map<number, ParsedMessage[]>();
  for (const m of treatmentMsgs) {
    const txNum = extractTreatmentNumber(m.text)!;
    if (!txMap.has(txNum)) txMap.set(txNum, []);
    txMap.get(txNum)!.push(m);
  }

  console.log(`Unique case study entries: ${csMap.size}`);
  console.log(`Unique treatment entries: ${txMap.size}`);

  // Merge parts into complete case studies
  const caseStudies: CaseStudyEntry[] = [];
  const seenCs = new Map<number, { part1: string; part2: string; date: string; sender: string }>();

  for (const [key, messages] of csMap) {
    const csNum = parseInt(key.split('-')[0], 10);
    const partNum = extractPartNumber(messages[0].text);

    const text = messages.map(m => m.text).join('\n');

    if (!seenCs.has(csNum)) {
      seenCs.set(csNum, { part1: '', part2: '', date: messages[0].date, sender: messages[0].sender });
    }
    const entry = seenCs.get(csNum)!;
    if (partNum === 1 || !entry.part1) {
      entry.part1 = text;
    } else {
      entry.part2 = text;
    }
    if (messages[0].date > entry.date) entry.date = messages[0].date;
  }

  for (const [csNum, entry] of seenCs) {
    const fullText = entry.part1 + '\n\n' + entry.part2;
    const { sanskrit, english } = extractDiseaseName(entry.part1 || entry.part2);
    const sections = extractSections(fullText);

    caseStudies.push({
      id: `case-study-${csNum}`,
      caseNumber: csNum,
      diseaseName: sanskrit,
      diseaseNameEn: english,
      part1: entry.part1.trim(),
      part2: entry.part2.trim(),
      sections,
      category: categorizeCase(sanskrit + ' ' + english),
      datePosted: entry.date,
      sender: entry.sender,
    });
  }

  caseStudies.sort((a, b) => a.caseNumber - b.caseNumber);

  // Parse treatments
  const treatments: TreatmentEntry[] = [];
  for (const [txNum, messages] of txMap) {
    const text = messages.map(m => m.text).join('\n');
    const sections = extractSections(text);
    const lines = text.split('\n');
    let title = `Treatment #${txNum}`;
    for (const l of lines) {
      const m = l.trim().match(/^🔺\s*TREATMENT\s+NO\s*:\s*\d+/i);
      if (m) continue;
      const clean = l.trim().replace(/^🔺+\s*/, '').trim();
      if (clean && !/^PART\s/i.test(clean) && !/^PARTNO/i.test(clean) && !/^CASE/i.test(clean)) {
        title = clean;
        break;
      }
    }

    treatments.push({
      id: `treatment-${txNum}`,
      treatmentNumber: txNum,
      title,
      content: text.trim(),
      sections,
      datePosted: messages[0].date,
      sender: messages[0].sender,
    });
  }

  treatments.sort((a, b) => a.treatmentNumber - b.treatmentNumber);

  // Stats
  const csCategories: Record<string, number> = {};
  for (const cs of caseStudies) csCategories[cs.category] = (csCategories[cs.category] || 0) + 1;

  const csSectionNames = new Set<string>();
  for (const cs of caseStudies) for (const s of Object.keys(cs.sections)) csSectionNames.add(s);

  console.log(`\nParsed ${caseStudies.length} case studies`);
  console.log(`Parsed ${treatments.length} treatments`);
  console.log(`Case study categories:`, csCategories);
  console.log(`Unique sections:`, [...csSectionNames].sort());

  // Sample
  const sample = caseStudies[0];
  console.log(`\nSample: Case #${sample.caseNumber} - ${sample.diseaseName} (${sample.diseaseNameEn})`);
  console.log(`  Sections: ${Object.keys(sample.sections).join(', ')}`);
  console.log(`  Part1 length: ${sample.part1.length}, Part2 length: ${sample.part2.length}`);

  // Write output
  const outPath = resolve(ROOT, 'knowledge-base', 'case-studies', 'parsed-case-studies.json');
  writeFileSync(outPath, JSON.stringify(caseStudies, null, 2));
  console.log(`\nWrote: ${outPath}`);

  const txOutPath = resolve(ROOT, 'knowledge-base', 'case-studies', 'parsed-treatments.json');
  writeFileSync(txOutPath, JSON.stringify(treatments, null, 2));
  console.log(`Wrote: ${txOutPath}`);
}

main();
