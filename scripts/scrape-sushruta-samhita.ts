#!/usr/bin/env tsx
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'knowledge-base', 'sushruta-samhita');
const CACHE_DIR = resolve(OUTPUT_DIR, 'cache');
const ARTICLES_DIR = resolve(OUTPUT_DIR, 'articles');

if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
if (!existsSync(ARTICLES_DIR)) mkdirSync(ARTICLES_DIR, { recursive: true });

interface SushrutaChapter {
  name: string;
  url: string;
  sthana: string;
  chapterNumber: number;
}

const CHAPTERS: SushrutaChapter[] = [
  { name: 'Vedotpati Adhyaya', url: 'https://www.planetayurveda.com/library/vedotpati-adhyaya-1st-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 1 },
  { name: 'Shishyopanayaniya Adhyaya', url: 'https://www.planetayurveda.com/library/shishyopanayaniya-adhyaya/', sthana: 'Sutra Sthana', chapterNumber: 2 },
  { name: 'Adhyayana Sampradayaniya', url: 'https://www.planetayurveda.com/library/adhyayana-sampradayaniya-3rd-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 3 },
  { name: 'Prabhashniye Adhayay', url: 'https://www.planetayurveda.com/library/prabhashniye-adhayay-4th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 4 },
  { name: 'Agropaharaniya Adhyaya', url: 'https://www.planetayurveda.com/library/agropaharaniya-adhyaya-5th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 5 },
  { name: 'Ritucharya Adhayaya', url: 'https://www.planetayurveda.com/library/ritucharya-adhayaya-6th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 6 },
  { name: 'Yantravidhi Adhyaya', url: 'https://www.planetayurveda.com/library/yantravidhi-adhyaya-7th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 7 },
  { name: 'Shastra Avacharana Adhyaya', url: 'https://www.planetayurveda.com/library/shastra-avacharana-adhyaya-8th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 8 },
  { name: 'Yogyasutriya Adhyaya', url: 'https://www.planetayurveda.com/library/yogyasutriya-adhyaya-9th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 9 },
  { name: 'Ksharapaka Vidhi Adhyaya', url: 'https://www.planetayurveda.com/library/ksharapaka-vidhi-adhyaya-11th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 11 },
  { name: 'Jaloka Avcharaniya Adhyaya', url: 'https://www.planetayurveda.com/library/jaloka-avcharaniya-adhyaya-13th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 13 },
  { name: 'Vyadhi-Samuddesheeya Adhyaya', url: 'https://www.planetayurveda.com/library/vyadhi-samuddesheeya-adhyaya-24th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 24 },
  { name: 'Ashtavidha Shastra Karmiyadhyaya', url: 'https://www.planetayurveda.com/library/ashtavidha-shastra-karmiyadhyaya-25th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 25 },
  { name: 'Pranashta Shalya Vijnaiyamadhyaya', url: 'https://www.planetayurveda.com/library/pranashta-shalya-vijnaiyamadhyaya-26th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 26 },
  { name: 'Shalyapanayaniya Adhyaya', url: 'https://www.planetayurveda.com/library/shalyapanayaniya-adhyaya-27th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 27 },
  { name: 'Viparitaaviparita Vrana Vijnanya Adhyaya', url: 'https://www.planetayurveda.com/library/viparitaaviparita-vrana-vijnanya-adhyaya-28th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 28 },
  { name: 'Viparitaviparita Swapna Nidarshaniya Adhyaya', url: 'https://www.planetayurveda.com/library/viparitaviparita-swapna-nidarshaniya-adhyaya-29th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 29 },
  { name: 'Panchendriyartha Vipratipatti Adhyaya', url: 'https://www.planetayurveda.com/library/panchendriyartha-vipratipatti-adhyaya-30th-chapter-of-sushruta-samhita/', sthana: 'Sutra Sthana', chapterNumber: 30 },
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

async function scrapeChapter(chapter: SushrutaChapter, index: number, total: number): Promise<any> {
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
  console.log('=== Sushruta Samhita Chapter Scraper ===\n');

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
