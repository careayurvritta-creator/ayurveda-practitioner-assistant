#!/usr/bin/env tsx
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'knowledge-base', 'ayurwiki-herbs');
const OUTPUT_FILE = resolve(OUTPUT_DIR, 'herbs.json');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const REPO_OWNER = 'hpnadig';
const REPO_NAME = 'ayurwiki';
const BRANCH = 'main';
const HERBS_PATH = 'docs/herbs';
const TREE_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${HERBS_PATH}`;
const DELAY_MS = 100;
const SAVE_EVERY = 100;

interface AyurwikiHerb {
  id: string;
  title: string;
  scientificName: string;
  commonNames: string[];
  categories: string[];
  uses: string[];
  partsUsed: string[];
  chemicalComposition: string;
  commonNamesByLanguage: Record<string, string[]>;
  habit: string;
  identification: {
    leaf?: string;
    flower?: string;
    fruit?: string;
    other?: string;
  };
  ayurvedicMedicines: string[];
  propagationMethod: string;
  cultivation: string;
  references: string[];
  medicalConditions: string[];
  sourceUrl: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url: string): Promise<string> {
  const isGitHubApi = url.includes('api.github.com');
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AyurvedaPractitionerAssistant-Scraper/1.0',
      'Accept': isGitHubApi ? 'application/vnd.github.v3+json' : 'text/plain',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function getHerbFilenames(): Promise<string[]> {
  console.log('Fetching file tree from GitHub API...');
  const treeText = await fetchText(TREE_API);
  const tree = JSON.parse(treeText);

  if (!tree.tree || !Array.isArray(tree.tree)) {
    throw new Error('Invalid tree response from GitHub API');
  }

  const herbFiles: string[] = [];
  for (const entry of tree.tree) {
    if (
      entry.type === 'blob' &&
      entry.path.startsWith(`${HERBS_PATH}/`) &&
      entry.path.endsWith('.md')
    ) {
      const filename = entry.path.replace(`${HERBS_PATH}/`, '');
      herbFiles.push(filename);
    }
  }

  console.log(`Found ${herbFiles.length} herb markdown files`);
  return herbFiles;
}

function parseFrontMatter(content: string): { frontMatter: Record<string, any>; body: string } {
  const fmRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(fmRegex);

  if (!match) {
    return { frontMatter: {}, body: content };
  }

  const yamlStr = match[1];
  const body = match[2];

  const frontMatter: Record<string, any> = {};
  let currentKey = '';
  let currentValue = '';
  let inList = false;
  let listItems: string[] = [];

  for (const line of yamlStr.split('\n')) {
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    if (line.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*:/)) {
      if (currentKey) {
        if (inList && listItems.length > 0) {
          frontMatter[currentKey] = listItems;
        } else {
          frontMatter[currentKey] = currentValue.trim();
        }
        listItems = [];
        inList = false;
      }

      const colonIdx = line.indexOf(':');
      currentKey = line.substring(0, colonIdx).trim();
      const afterColon = line.substring(colonIdx + 1).trim();

      if (afterColon === '' || afterColon === '[]') {
        inList = true;
        listItems = [];
        currentValue = '';
      } else if (afterColon.startsWith('[') && afterColon.endsWith(']')) {
        const inner = afterColon.slice(1, -1);
        frontMatter[currentKey] = inner.split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
        currentValue = '';
        inList = false;
      } else {
        currentValue = afterColon;
        inList = false;
      }
    } else if (trimmed.startsWith('- ')) {
      const item = trimmed.substring(2).trim().replace(/^["']|["']$/g, '');
      if (item) {
        listItems.push(item);
        inList = true;
      }
    } else {
      currentValue += ' ' + trimmed;
    }
  }

  if (currentKey) {
    if (inList && listItems.length > 0) {
      frontMatter[currentKey] = listItems;
    } else {
      frontMatter[currentKey] = currentValue.trim();
    }
  }

  return { frontMatter, body };
}

function extractSection(body: string, heading: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`##\\s+${escapedHeading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
  const match = body.match(regex);
  return match ? match[1].trim() : '';
}

function extractListFromSection(body: string, heading: string): string[] {
  const content = extractSection(body, heading);
  if (!content) return [];

  const items: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      items.push(trimmed.substring(2).trim());
    } else if (trimmed.match(/^\d+\.\s/)) {
      items.push(trimmed.replace(/^\d+\.\s/, '').trim());
    }
  }

  if (items.length === 0 && content) {
    const plainText = content
      .replace(/\n+/g, '\n')
      .split('\n')
      .filter((l) => l.trim())
      .join('; ');
    if (plainText) items.push(plainText);
  }

  return items;
}

function extractTextFromSection(body: string, heading: string): string {
  const content = extractSection(body, heading);
  if (!content) return '';

  return content
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function extractIdentification(body: string): AyurwikiHerb['identification'] {
  const idSection = extractSection(body, 'Identification');
  if (!idSection) return {};

  const identification: AyurwikiHerb['identification'] = {};

  const leafMatch = idSection.match(/(?:Leaf|Leaves)\s*[:\-]\s*([\s\S]*?)(?=(?:Flower|Fruit|Other|##|\Z))/i);
  if (leafMatch) identification.leaf = leafMatch[1].trim().replace(/\n+/g, ' ');

  const flowerMatch = idSection.match(/Flower\s*[:\-]\s*([\s\S]*?)(?=(?:Leaf|Fruit|Other|##|\Z))/i);
  if (flowerMatch) identification.flower = flowerMatch[1].trim().replace(/\n+/g, ' ');

  const fruitMatch = idSection.match(/Fruit\s*[:\-]\s*([\s\S]*?)(?=(?:Leaf|Flower|Other|##|\Z))/i);
  if (fruitMatch) identification.fruit = fruitMatch[1].trim().replace(/\n+/g, ' ');

  const otherMatch = idSection.match(/Other\s*[:\-]\s*([\s\S]*?)(?=(?:Leaf|Flower|Fruit|##|\Z))/i);
  if (otherMatch) identification.other = otherMatch[1].trim().replace(/\n+/g, ' ');

  if (!identification.leaf && !identification.flower && !identification.fruit && !identification.other) {
    const plain = idSection
      .replace(/\n+/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]/g, '')
      .trim();
    if (plain) identification.other = plain;
  }

  return identification;
}

function extractCommonNamesByLanguage(body: string): Record<string, string[]> {
  const namesSection = extractSection(body, 'Common names') || extractSection(body, 'Common Names');
  if (!namesSection) return {};

  const result: Record<string, string[]> = {};

  const rows = namesSection.split('\n').filter((l) => l.trim() && !l.trim().startsWith('|--') && !l.trim().startsWith('| ---'));

  for (const row of rows) {
    if (!row.includes('|')) continue;

    const cells = row
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cells.length >= 2) {
      const language = cells[0].replace(/[*_`]/g, '').trim();
      const names = cells.slice(1)
        .map((c) => c.replace(/[*_`]/g, '').trim())
        .filter(Boolean);
      if (language && names.length > 0) {
        result[language] = names;
      }
    }
  }

  return result;
}

function parseHerbContent(filename: string, content: string): AyurwikiHerb {
  const { frontMatter, body } = parseFrontMatter(content);

  const id = filename.replace(/\.md$/i, '');

  const rawTitle = (frontMatter.title as string) || id.replace(/-/g, ' ');
  const title = rawTitle.replace(/^["']|["']$/g, '').trim();

  let scientificName = title;
  const dashMatch = title.match(/^([A-Z][a-z]+ [a-z]+(?:\s+[a-z]+)?)\s*[-–—]/);
  if (dashMatch) {
    scientificName = dashMatch[1].trim();
  }

  const commonNames: string[] = [];
  const dashSplit = title.split(/\s*[-–—]\s*/);
  if (dashSplit.length > 1) {
    const afterDash = dashSplit.slice(1).join(' - ').trim();
    if (afterDash) {
      const parts = afterDash.split(/[,;]\s*/);
      for (const part of parts) {
        const cleaned = part.trim();
        if (cleaned) commonNames.push(cleaned);
      }
    }
  }

  let categories: string[] = [];
  if (Array.isArray(frontMatter.categories)) {
    categories = frontMatter.categories.map((c: string) => String(c).trim());
  } else if (typeof frontMatter.categories === 'string') {
    categories = frontMatter.categories.split(',').map((c: string) => c.trim());
  } else if (Array.isArray(frontMatter.tags)) {
    categories = frontMatter.tags.map((t: string) => String(t).trim());
  }

  const uses = extractListFromSection(body, 'Uses');
  const partsUsed = extractListFromSection(body, 'Parts Used') || extractListFromSection(body, 'Part Used');
  const chemicalComposition = extractTextFromSection(body, 'Chemical Composition');
  const habit = extractTextFromSection(body, 'Habit');
  const commonNamesByLanguage = extractCommonNamesByLanguage(body);
  const identification = extractIdentification(body);
  const ayurvedicMedicines = extractListFromSection(body, 'List of Ayurvedic medicine') || extractListFromSection(body, 'Ayurvedic Medicines');
  const propagationMethod = extractTextFromSection(body, 'Mode of Propagation') || extractTextFromSection(body, 'Propagation');
  const cultivation = extractTextFromSection(body, 'How to plant/cultivate') || extractTextFromSection(body, 'Cultivation') || extractTextFromSection(body, 'How to Plant/Cultivate');
  const references = extractListFromSection(body, 'References');

  const medicalConditions: string[] = [];
  for (const cat of categories) {
    const match = cat.match(/^Ayurvedic_Herbs_known_to_be_helpful_to_treat_(.+)$/);
    if (match) {
      medicalConditions.push(match[1].replace(/_/g, ' ').trim());
    }
  }

  const sourceUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${BRANCH}/${HERBS_PATH}/${filename}`;

  return {
    id,
    title,
    scientificName,
    commonNames,
    categories,
    uses,
    partsUsed,
    chemicalComposition,
    commonNamesByLanguage,
    habit,
    identification,
    ayurvedicMedicines,
    propagationMethod,
    cultivation,
    references,
    medicalConditions,
    sourceUrl,
  };
}

function saveProgress(herbs: AyurwikiHerb[]): void {
  writeFileSync(OUTPUT_FILE, JSON.stringify(herbs, null, 2), 'utf-8');
  console.log(`  Saved ${herbs.length} herbs to ${OUTPUT_FILE}`);
}

async function main(): Promise<void> {
  console.log('=== Ayurwiki Herb Scraper ===\n');

  const filenames = await getHerbFilenames();
  const herbs: AyurwikiHerb[] = [];
  let errors = 0;

  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    const url = `${RAW_BASE}/${filename}`;

    try {
      if ((i + 1) % 25 === 0 || i === 0) {
        console.log(`[${i + 1}/${filenames.length}] Processing: ${filename}`);
      }

      const content = await fetchText(url);
      const herb = parseHerbContent(filename, content);
      herbs.push(herb);

      if ((i + 1) % SAVE_EVERY === 0) {
        saveProgress(herbs);
      }
    } catch (err: any) {
      errors++;
      console.error(`  Error processing ${filename}: ${err.message}`);
    }

    if (i < filenames.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  saveProgress(herbs);

  console.log(`\n=== Complete ===`);
  console.log(`Total herbs scraped: ${herbs.length}`);
  console.log(`Errors: ${errors}`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
