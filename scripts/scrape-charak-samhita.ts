#!/usr/bin/env tsx
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'knowledge-base', 'charak-samhita');
const CACHE_DIR = resolve(OUTPUT_DIR, 'cache');
const ARTICLES_DIR = resolve(OUTPUT_DIR, 'articles');

if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
if (!existsSync(ARTICLES_DIR)) mkdirSync(ARTICLES_DIR, { recursive: true });

interface CharakChapter {
  name: string;
  url: string;
  sthana: string;
  chapterNumber: number;
}

const CHAPTERS: CharakChapter[] = [
  // Sutrasthana
  { name: 'Deergham Jeeviteeya Adhyaya', url: 'https://www.planetayurveda.com/library/sutrasthana-chapter-1-deergham-jeeviteeya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 1 },
  { name: 'Apamarga Tanduliya Adhyaya', url: 'https://www.planetayurveda.com/library/sutrasthana-chapter-2-apamarga-tanduliya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 2 },
  { name: 'Aragvadhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-3-aragvadhyaya/', sthana: 'Sutrasthana', chapterNumber: 3 },
  { name: 'Shadvirechan Shatashrityam', url: 'https://www.planetayurveda.com/library/sutrasthana-chapter-4-shadvirechan-shatashrityam/', sthana: 'Sutrasthana', chapterNumber: 4 },
  { name: 'Matrashiteeya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-5-matrashiteeya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 5 },
  { name: 'Naveganadharaniya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-7-naveganadharaniya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 7 },
  { name: 'Indriyopakramaniya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-8-indriyopakramaniya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 8 },
  { name: 'Khuddakachatushpada Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-9-khuddakachatushpada-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 9 },
  { name: 'Maha Chatuspada Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-10-maha-chatuspada-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 10 },
  { name: 'Tistraishaniya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-11-tistraishaniya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 11 },
  { name: 'Vatakalakaliya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-12-vatakalakaliya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 12 },
  { name: 'Snehadhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-13-snehadhyaya/', sthana: 'Sutrasthana', chapterNumber: 13 },
  { name: 'Swedadhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-14-swedadhyaya/', sthana: 'Sutrasthana', chapterNumber: 14 },
  { name: 'Upakalpaniya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-15-upakalpaniya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 15 },
  { name: 'Chikitsaprabhritiya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-16-chikitsaprabhritiya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 16 },
  { name: 'Kiyanta Shiraseeya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-17-kiyanta-shiraseeya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 17 },
  { name: 'Trishothiya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-18-trishothiya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 18 },
  { name: 'Ashtodariya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-19-ashtodariya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 19 },
  { name: 'Maharoga Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-20-maharoga-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 20 },
  { name: 'Ashtauninditiya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-21-ashtauninditiya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 21 },
  { name: 'Langhanabrimhaniya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-22-langhanabrimhaniya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 22 },
  { name: 'Santarpaniya Adhyaya', url: 'https://www.planetayurveda.com/library/charaka-samhita-chapter-23-santarpaniya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 23 },
  { name: 'Vidhishonitiya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-24-vidhishonitiya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 24 },
  { name: 'Atreyabhadrakapyiya Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-26-atreyabhadrakapyiya-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 26 },
  { name: 'Annapanavidhi Adhyaya', url: 'https://www.planetayurveda.com/library/charak-samhita-sutrasthana-chapter-27-annapanavidhi-adhyaya/', sthana: 'Sutrasthana', chapterNumber: 27 },
  
  // Nidana Sthana
  { name: 'Jwara Nidana', url: 'https://www.planetayurveda.com/library/nidana-sthana-chapter-1-jwara-nidana/', sthana: 'Nidana Sthana', chapterNumber: 1 },
  { name: 'Gulma Nidana', url: 'https://www.planetayurveda.com/library/nidana-sthana-chapter-3-gluma/', sthana: 'Nidana Sthana', chapterNumber: 3 },
  { name: 'Prameha Nidana', url: 'https://www.planetayurveda.com/library/nidana-sthana-chapter-4-prameha-nidana/', sthana: 'Nidana Sthana', chapterNumber: 4 },
  { name: 'Kustha Roga Nidana', url: 'https://www.planetayurveda.com/library/nidana-sthana-chapter-5-kustha-roga/', sthana: 'Nidana Sthana', chapterNumber: 5 },
  { name: 'Shosha Nidana', url: 'https://www.planetayurveda.com/library/charak-samhita-nidana-sthana-chapter-6-shosha-nidana/', sthana: 'Nidana Sthana', chapterNumber: 6 },
  { name: 'Unmada Nidana', url: 'https://www.planetayurveda.com/library/charak-samhita-nidana-sthana-chapter-7-unmada-nidana/', sthana: 'Nidana Sthana', chapterNumber: 7 },
  { name: 'Apasmara Nidana', url: 'https://www.planetayurveda.com/library/nidana-sthana-chapter-8-apasmara-nidana/', sthana: 'Nidana Sthana', chapterNumber: 8 },
];

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
    'Introduction', 'Overview', 'Description', 'Summary',
    'Sanskrit Text', 'Sloka', 'Verses', 'Shloka',
    'Commentary', 'Explanation', 'Meaning',
    'Key Points', 'Important Notes', 'Clinical Features',
    'Treatment', 'Management', 'Prognosis',
  ];

  const lines = mainContent.split('\n');
  let currentSection = 'content';
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

async function scrapeChapter(chapter: CharakChapter, index: number, total: number): Promise<any> {
  const slug = chapter.url.split('/library/')[1]?.replace(/\/$/, '') || chapter.name.toLowerCase().replace(/\s+/g, '-');
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
      html = await fetchPage(chapter.url);
      writeFileSync(cacheFile, html);
      await new Promise(r => setTimeout(r, 300));
    } catch (e: any) {
      console.error(`  [${index}/${total}] ERROR ${chapter.name}: ${e.message}`);
      return null;
    }
  }

  const { title, content, sections } = extractArticleContent(html);

  const article = {
    id: slug.replace(/\//g, '-'),
    name: title || chapter.name,
    sthana: chapter.sthana,
    chapterNumber: chapter.chapterNumber,
    url: chapter.url,
    contentLength: content.length,
    sections,
    fullContent: content.slice(0, 15000),
  };

  writeFileSync(jsonFile, JSON.stringify(article, null, 2));
  return article;
}

async function main() {
  console.log('=== Charak Samhita Chapter Scraper ===\n');

  console.log(`Chapters to scrape: ${CHAPTERS.length}\n`);

  const articles: any[] = [];
  const errors: string[] = [];
  const BATCH = 5;

  for (let i = 0; i < CHAPTERS.length; i += BATCH) {
    const batch = CHAPTERS.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((f, j) => scrapeChapter(f, i + j + 1, CHAPTERS.length))
    );
    for (const r of results) {
      if (r) articles.push(r);
      else errors.push(batch[results.indexOf(r)]?.name || 'unknown');
    }
    process.stdout.write(`  Scraped ${Math.min(i + BATCH, CHAPTERS.length)}/${CHAPTERS.length}\r`);
  }

  console.log(`\n\nScraped ${articles.length} chapters`);

  const allDataPath = resolve(OUTPUT_DIR, 'all-chapters.json');
  writeFileSync(allDataPath, JSON.stringify(articles, null, 2));
  console.log(`Wrote: ${allDataPath}`);

  const sthanaCounts: Record<string, number> = {};
  for (const a of articles) {
    sthanaCounts[a.sthana] = (sthanaCounts[a.sthana] || 0) + 1;
  }
  console.log('\nSthana breakdown:');
  for (const [sthana, count] of Object.entries(sthanaCounts)) {
    console.log(`  ${sthana}: ${count}`);
  }

  console.log(`\nAvg content length: ${Math.round(articles.reduce((s, a) => s + a.contentLength, 0) / articles.length)} chars`);
  if (errors.length > 0) console.log(`Errors: ${errors.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
