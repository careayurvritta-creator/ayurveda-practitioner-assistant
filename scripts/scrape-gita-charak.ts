#!/usr/bin/env tsx
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'knowledge-base', 'gita-datasets-charak');
const OUTPUT_FILE = resolve(OUTPUT_DIR, 'charak-samhita.json');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

interface GitaCharakVerse {
  verse_id: string;
  text: string;
}

interface GitaCharakChapter {
  chapterNumber: number;
  fileName: string;
  verses: GitaCharakVerse[];
}

interface GitaCharakSthana {
  sthanaNumber: number;
  name: string;
  englishName: string;
  description: string;
  chapters: GitaCharakChapter[];
}

interface GitaCharakSamhita {
  sthanas: GitaCharakSthana[];
  totalChapters: number;
  totalVerses: number;
  source: string;
  license: string;
}

const STHANAS: Array<{
  sthanaNumber: number;
  dirName: string;
  name: string;
  englishName: string;
  description: string;
}> = [
  { sthanaNumber: 1, dirName: '1.Sutrasthana (Sutra Sthana) — General Principles', name: 'Sutrasthana', englishName: 'Sutra Sthana', description: 'General Principles' },
  { sthanaNumber: 2, dirName: '2.Nidanasthana (Nidana Sthana) — Section on Pathology', name: 'Nidanasthana', englishName: 'Nidana Sthana', description: 'Section on Pathology' },
  { sthanaNumber: 3, dirName: '3.Vimanasthana (Vimana Sthana) — Section on Measure', name: 'Vimanasthana', englishName: 'Vimana Sthana', description: 'Section on Measure' },
  { sthanaNumber: 4, dirName: '4.Sharirasthana (Sharira Sthana) — Section on Human Embodiment', name: 'Sharirasthana', englishName: 'Sharira Sthana', description: 'Section on Human Embodiment' },
  { sthanaNumber: 5, dirName: '5.Indriyasthana (Indriya Sthana) — Section on Sensorial Prognosis', name: 'Indriyasthana', englishName: 'Indriya Sthana', description: 'Section on Sensorial Prognosis' },
  { sthanaNumber: 6, dirName: '6.Cikitsasthana (Cikitsa Sthana) — Section on Therapeutics', name: 'Cikitsasthana', englishName: 'Cikitsa Sthana', description: 'Section on Therapeutics' },
  { sthanaNumber: 7, dirName: '7.Kalpasthana (Kalpa Sthana) — Section on Pharmaceutics', name: 'Kalpasthana', englishName: 'Kalpa Sthana', description: 'Section on Pharmaceutics' },
  { sthanaNumber: 8, dirName: '8.Siddhisthana (Siddhi Sthana) — Section on Successful Treatment', name: 'Siddhisthana', englishName: 'Siddhi Sthana', description: 'Section on Successful Treatment' },
];

const REPO_BASE = 'https://api.github.com/repos/gita/Datasets/contents/Ayurveda/charak-samhita';
const RAW_BASE = 'https://raw.githubusercontent.com/gita/Datasets/main/Ayurveda/charak-samhita';

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AyurPractitionerAssistant/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        if (location) {
          httpsGet(location).then(resolve).catch(reject);
          return;
        }
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.status} for ${url}`));
          return;
        }
        resolve(data);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function extractChapterNumber(fileName: string): number {
  const match = fileName.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

async function listDirContents(dirName: string): Promise<Array<{ name: string; path: string; type: string }>> {
  const encoded = encodeURIComponent(dirName);
  const url = `${REPO_BASE}/${encoded}`;
  console.log(`  Listing: ${dirName}`);
  const raw = await httpsGet(url);
  const items = JSON.parse(raw);
  return items.filter((item: any) => item.type === 'file' && item.name.endsWith('.json'));
}

async function downloadChapterFile(sthanaDir: string, fileName: string): Promise<GitaCharakVerse[]> {
  const encodedSthana = encodeURIComponent(sthanaDir);
  const encodedFile = encodeURIComponent(fileName);
  const url = `${RAW_BASE}/${encodedSthana}/${encodedFile}`;
  const raw = await httpsGet(url);
  return JSON.parse(raw);
}

async function processSthana(sthana: typeof STHANAS[number]): Promise<GitaCharakSthana> {
  console.log(`\n[${sthana.sthanaNumber}/8] ${sthana.name} (${sthana.englishName})`);

  let files: Array<{ name: string; path: string; type: string }>;
  try {
    files = await listDirContents(sthana.dirName);
  } catch (e: any) {
    console.error(`  ERROR listing directory: ${e.message}`);
    return {
      sthanaNumber: sthana.sthanaNumber,
      name: sthana.name,
      englishName: sthana.englishName,
      description: sthana.description,
      chapters: [],
    };
  }

  console.log(`  Found ${files.length} chapter files`);
  const chapters: GitaCharakChapter[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const verses = await downloadChapterFile(sthana.dirName, file.name);
      chapters.push({
        chapterNumber: extractChapterNumber(file.name),
        fileName: file.name,
        verses,
      });
      process.stdout.write(`    [${i + 1}/${files.length}] ${file.name} (${verses.length} verses)\n`);
    } catch (e: any) {
      console.error(`    ERROR ${file.name}: ${e.message}`);
    }
    if (i < files.length - 1) await sleep(100);
  }

  chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  return {
    sthanaNumber: sthana.sthanaNumber,
    name: sthana.name,
    englishName: sthana.englishName,
    description: sthana.description,
    chapters,
  };
}

async function main() {
  console.log('=== Gita/Datasets Charak Samhita Scraper ===\n');

  const sthanas: GitaCharakSthana[] = [];

  for (const sthana of STHANAS) {
    const result = await processSthana(sthana);
    sthanas.push(result);
    await sleep(100);
  }

  let totalChapters = 0;
  let totalVerses = 0;
  for (const s of sthanas) {
    totalChapters += s.chapters.length;
    for (const c of s.chapters) {
      totalVerses += c.verses.length;
    }
  }

  const output: GitaCharakSamhita = {
    sthanas,
    totalChapters,
    totalVerses,
    source: 'https://github.com/gita/Datasets/tree/main/Ayurveda/charak-samhita',
    license: 'See repository LICENSE',
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n\nWrote: ${OUTPUT_FILE}`);
  console.log(`Total Sthanas: ${sthanas.length}`);
  console.log(`Total Chapters: ${totalChapters}`);
  console.log(`Total Verses: ${totalVerses}`);

  console.log('\nSthana breakdown:');
  for (const s of sthanas) {
    const verseCount = s.chapters.reduce((sum, c) => sum + c.verses.length, 0);
    console.log(`  ${s.englishName}: ${s.chapters.length} chapters, ${verseCount} verses`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
