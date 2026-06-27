#!/usr/bin/env tsx
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'knowledge-base', 'planetayurveda-formulations');
const CACHE_DIR = resolve(OUTPUT_DIR, 'cache');
const ARTICLES_DIR = resolve(OUTPUT_DIR, 'articles');

if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
if (!existsSync(ARTICLES_DIR)) mkdirSync(ARTICLES_DIR, { recursive: true });

const CATEGORY_URLS: Record<string, string> = {
  gutika: 'https://www.planetayurveda.com/gutika/',
  guggulu: 'https://www.planetayurveda.com/guggulu/',
  kashaya: 'https://www.planetayurveda.com/kashaya/',
  pak: 'https://www.planetayurveda.com/pak/',
  rasa: 'https://www.planetayurveda.com/rasa/',
  taila: 'https://www.planetayurveda.com/taila/',
  ark: 'https://www.planetayurveda.com/ark/',
  asava: 'https://www.planetayurveda.com/asava/',
  avaleha: 'https://www.planetayurveda.com/avaleha/',
  bhasma: 'https://www.planetayurveda.com/bhasma/',
  choorna: 'https://www.planetayurveda.com/choorna/',
  ghrita: 'https://www.planetayurveda.com/ghrita/',
};

interface FormulationEntry {
  name: string;
  url: string;
  category: string;
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractFormulationLinks(html: string, category: string): FormulationEntry[] {
  const entries: FormulationEntry[] = [];
  const seen = new Set<string>();
  const linkRe = /<a[^>]+href="(https:\/\/www\.planetayurveda\.com\/library\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null) {
    const url = m[1];
    const name = m[2].trim();
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({ name, url, category });
  }
  return entries;
}

function extractArticleContent(html: string): { title: string; content: string; sections: Record<string, string> } {
  let title = '';
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (titleMatch) title = titleMatch[1].replace(/<[^>]+>/g, '').trim();

  let mainContent = '';

  const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    html.match(/<div[^>]+class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<div[^>]+class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<div[^>]+class="[^"]*blog-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<div[^>]+class="[^"]*page-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (contentMatch) mainContent = contentMatch[1];
  else {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) mainContent = bodyMatch[1];
  }

  mainContent = mainContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201c')
    .replace(/&#8221;/g, '\u201d')
    .replace(/&#\d+;/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const sections: Record<string, string> = {};
  const sectionHeaders = [
    'Ingredients', 'Composition', 'Key Ingredients', 'Herbal Ingredients',
    'Properties', 'Pharmacological Action', 'Ayurvedic Properties',
    'Rasa', 'Guna', 'Veerya', 'Vipaka', 'Dosha Karma',
    'Dose', 'Dosage', 'Recommended Dosage', 'How to Use', 'Direction for Use',
    'Uses', 'Medicinal Uses', 'Health Benefits', 'Therapeutic Uses',
    'Indications', 'Action', 'Effect',
    'Side Effects', 'Precautions', 'Contraindications', 'Safety',
    'Classical Reference', 'Reference', 'Classical Formulation',
    'Charak Samhita', 'Sushruta Samhita', 'Ashtanga Hridaya',
    'Bhavaprakasha', 'Sharangadhara', 'Kasyapa Samhita',
    'Shelf Life', 'Storage', 'Packaging',
    'Description', 'Introduction', 'Overview',
    'Mode of Action', 'Mechanism of Action',
    'Research', 'Scientific Evidence',
    'Presentation', 'Available In',
  ];

  const lines = mainContent.split('\n');
  let currentSection = 'overview';
  const sectionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { sectionLines.push(''); continue; }

    const isHeader = sectionHeaders.some(h =>
      trimmed.toLowerCase().startsWith(h.toLowerCase()) ||
      trimmed.toLowerCase() === h.toLowerCase()
    ) && trimmed.length < 80 && /^[A-Z]/.test(trimmed);

    if (isHeader) {
      if (currentSection && sectionLines.length > 0) {
        sections[currentSection] = sectionLines.join('\n').trim();
      }
      currentSection = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
      sectionLines.length = 0;
    } else {
      sectionLines.push(line);
    }
  }
  if (currentSection && sectionLines.length > 0) {
    sections[currentSection] = sectionLines.join('\n').trim();
  }

  return { title, content: mainContent, sections };
}

async function scrapeFormulation(entry: FormulationEntry, index: number, total: number): Promise<any> {
  const slug = entry.url.split('/library/')[1]?.replace(/\/$/, '') || entry.name.toLowerCase().replace(/\s+/g, '-');
  const jsonFile = resolve(ARTICLES_DIR, `${slug.replace(/\//g, '_')}.json`);
  if (existsSync(jsonFile)) {
    try { return JSON.parse(readFileSync(jsonFile, 'utf-8')); } catch {}
  }

  const cacheFile = resolve(CACHE_DIR, `${slug}.html`);
  let html: string;
  if (existsSync(cacheFile)) {
    html = readFileSync(cacheFile, 'utf-8');
  } else {
    try {
      html = await fetchPage(entry.url);
      writeFileSync(cacheFile, html);
      await new Promise(r => setTimeout(r, 300));
    } catch (e: any) {
      console.error(`  [${index}/${total}] ERROR ${entry.name}: ${e.message}`);
      return null;
    }
  }

  const { title, content, sections } = extractArticleContent(html);

  const article = {
    id: slug.replace(/\//g, '-'),
    name: title || entry.name,
    category: entry.category,
    url: entry.url,
    contentLength: content.length,
    sections,
    fullContent: content.slice(0, 10000),
  };

  writeFileSync(jsonFile, JSON.stringify(article, null, 2));
  return article;
}

async function main() {
  console.log('=== Planet Ayurveda Classical Formulations Scraper ===\n');

  const allFormulations: FormulationEntry[] = [];

  for (const [catName, catUrl] of Object.entries(CATEGORY_URLS)) {
    process.stdout.write(`Fetching ${catName} index...`);
    const cacheFile = resolve(CACHE_DIR, `index_${catName}.html`);
    let html: string;
    if (existsSync(cacheFile)) {
      html = readFileSync(cacheFile, 'utf-8');
    } else {
      html = await fetchPage(catUrl);
      writeFileSync(cacheFile, html);
      await new Promise(r => setTimeout(r, 300));
    }
    const entries = extractFormulationLinks(html, catName);
    console.log(` ${entries.length} formulations`);
    allFormulations.push(...entries);
  }

  console.log(`\nTotal formulations to scrape: ${allFormulations.length}\n`);

  const articles: any[] = [];
  const errors: string[] = [];
  const BATCH = 10;

  for (let i = 0; i < allFormulations.length; i += BATCH) {
    const batch = allFormulations.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((f, j) => scrapeFormulation(f, i + j + 1, allFormulations.length))
    );
    for (const r of results) {
      if (r) articles.push(r);
      else errors.push(batch[results.indexOf(r)]?.name || 'unknown');
    }
    process.stdout.write(`  Scraped ${Math.min(i + BATCH, allFormulations.length)}/${allFormulations.length}\r`);
  }

  console.log(`\n\nScraped ${articles.length} formulation articles`);

  const allDataPath = resolve(OUTPUT_DIR, 'all-formulations.json');
  writeFileSync(allDataPath, JSON.stringify(articles, null, 2));
  console.log(`Wrote: ${allDataPath}`);

  const catCounts: Record<string, number> = {};
  for (const a of articles) {
    catCounts[a.category] = (catCounts[a.category] || 0) + 1;
  }
  console.log('\nCategory breakdown:');
  for (const [cat, count] of Object.entries(catCounts)) {
    console.log(`  ${cat}: ${count}`);
  }

  const withSections = articles.filter(a => Object.keys(a.sections).length >= 3);
  console.log(`\nArticles with 3+ sections: ${withSections.length}`);
  console.log(`Avg content length: ${Math.round(articles.reduce((s, a) => s + a.contentLength, 0) / articles.length)} chars`);
  if (errors.length > 0) console.log(`Errors: ${errors.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
