#!/usr/bin/env tsx
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(ROOT, 'knowledge-base', 'planetayurveda');
const CACHE_DIR = resolve(OUTPUT_DIR, 'cache');

if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

const INDEX_URL = 'https://www.planetayurveda.com/diseases-a-to-z/';

interface DiseaseEntry {
  name: string;
  url: string;
  letter: string;
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

function extractDiseaseLinks(html: string): DiseaseEntry[] {
  const entries: DiseaseEntry[] = [];
  const seen = new Set<string>();

  const linkRe = /<a[^>]+href="(https:\/\/www\.planetayurveda\.com\/library\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) !== null) {
    const url = m[1];
    const name = m[2].trim();
    if (seen.has(url)) continue;
    seen.add(url);
    const letter = name[0]?.toUpperCase() || '?';
    entries.push({ name, url, letter });
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
    html.match(/<div[^>]+class="[^"]*blog-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

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
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201c')
    .replace(/&#8221;/g, '\u201d')
    .replace(/&#\d+;/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const sections: Record<string, string> = {};
  const sectionHeaders = ['Causes', 'Symptoms', 'Ayurvedic Concept', 'Ayurvedic Understanding',
    'Treatment', 'Herbal Remedies', 'Diet and Lifestyle', 'Diet', 'Lifestyle',
    'Complications', 'Diagnosis', 'Pathology', 'Risk Factors', 'Prevention',
    'Prognosis', 'Reference', 'Research', 'Overview', 'Introduction',
    'What is', 'Types', 'Signs', 'Risk', 'Management', 'Home Remedies',
    'Yoga', 'Panchakarma', 'Samprapti', 'Chikitsa', 'Nidana', 'Lakshana'];

  const lines = mainContent.split('\n');
  let currentSection = 'overview';
  const sectionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { sectionLines.push(''); continue; }

    const isHeader = sectionHeaders.some(h =>
      trimmed.toLowerCase().startsWith(h.toLowerCase()) ||
      trimmed.toLowerCase().includes(h.toLowerCase())
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

function categorizeDisease(name: string): string {
  const lower = name.toLowerCase();
  const cats: [string, string[]][] = [
    ['cardiovascular', ['heart', 'cardiac', 'cardio', 'hypertension', 'blood pressure', 'angina', 'arrhythm', 'atherosclerosis', 'cholesterol', 'coronary', 'stroke', 'varicose']],
    ['respiratory', ['asthma', 'bronchitis', 'copd', 'pulmonary', 'respiratory', 'pneumonia', 'sinusitis', 'tonsillitis', 'common cold', 'flu', 'cough']],
    ['digestive', ['gastric', 'gastritis', 'acid', 'reflux', 'ibs', 'crohn', 'colitis', 'constipation', 'diarrhea', 'indigestion', 'dyspepsia', 'hernia', 'liver', 'hepatitis', 'gallstone', 'pancreatitis', 'ulcer', 'ascites', 'cirrhosis', 'fatty liver']],
    ['neurological', ['neuro', 'brain', 'epilepsy', 'seizure', 'migraine', 'headache', 'parkinson', 'alzheimer', 'dementia', 'stroke', 'palsy', 'neuralgia', 'sciatica', 'ms', 'multiple sclerosis', 'vertigo', 'dizziness', 'autism', 'cerebral']],
    ['musculoskeletal', ['arthritis', 'joint', 'bone', 'osteoporosis', 'osteopenia', 'osteoma', 'spondylosis', 'ankylosing', 'gout', 'fibromyalgia', 'frozen shoulder', 'back pain', 'disc', 'carpal', 'fracture']],
    ['skin_dermatology', ['skin', 'eczema', 'psoriasis', 'dermatitis', 'acne', 'rosacea', 'vitiligo', 'leucoderma', 'fungal', 'ringworm', 'herpes', 'urticaria', 'pimple', 'hair loss', 'alopecia', 'baldness', 'dandruff']],
    ['endocrine_metabolic', ['diabetes', 'thyroid', 'obesity', 'weight', 'metabolic', 'adrenal', 'cushing', 'insipidus', 'gout', 'cholesterol', 'lipid']],
    ['renal_urological', ['kidney', 'renal', 'urinary', 'uti', 'bladder', 'nephrotic', 'stones', 'calculi', 'prostate', 'cystitis']],
    ['gynecological', ['female', 'women', 'menstrual', 'menopause', 'endometriosis', 'fibroid', 'ovarian', 'pms', 'pcod', 'pcos', 'infertility', 'leucorrhea', 'amenorrhea', 'menorrhagia', 'pid', 'vaginosis']],
    ['male_reproductive', ['male', 'infertility', 'sperm', 'erectile', 'premature ejaculation', 'prostat', 'peyronie', 'oligozoospermia']],
    ['infectious', ['infection', 'fever', 'malaria', 'dengue', 'typhoid', 'cholera', 'hepatitis', 'hiv', 'aids', 'syphilis', 'gonorrhea', 'chickenpox', 'monkeypox', 'rabies', 'fungal', 'bacterial', 'viral']],
    ['autoimmune', ['autoimmune', 'lupus', 'scleroderma', 'vasculitis', 'crohn', 'ulcerative colitis', 'rheumatoid', 'psoriatic', 'sjogren', 'sarcoidosis']],
    ['psychiatric', ['anxiety', 'depression', 'bipolar', 'schizophrenia', 'psychosis', 'ocd', 'ptsd', 'insomnia', 'stress', 'mood', 'eating disorder', 'anorexia', 'autism']],
    ['ophthalmology', ['eye', 'glaucoma', 'cataract', 'retinitis', 'macular', 'conjunctivitis', 'myopia']],
    ['ent', ['ear', 'nose', 'throat', 'hearing', 'tinnitus', 'vertigo', 'sinus', 'tonsil', 'adenoid']],
    ['hematological', ['anemia', 'blood', 'leukemia', 'lymphoma', 'sickle', 'thalassemia', 'purpura', 'polycythemia', 'eosinophilia', 'itp']],
    ['pediatric', ['child', 'pediatric', 'juvenile', 'bedwetting', 'down syndrome', 'cerebral palsy', 'autism']],
    ['oncology', ['cancer', 'tumor', 'carcinoma', 'sarcoma', 'leukemia', 'lymphoma', 'melanoma']],
  ];

  for (const [cat, keywords] of cats) {
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return 'general';
}

async function scrapeArticle(entry: DiseaseEntry, index: number, total: number): Promise<any> {
  const cacheFile = resolve(CACHE_DIR, `${entry.url.split('/library/')[1]?.replace(/\/$/, '') || 'unknown'}.html`);
  const jsonFile = resolve(OUTPUT_DIR, 'articles', `${entry.url.split('/library/')[1]?.replace(/\/$/, '').replace(/\//g, '_') || 'unknown'}.json`);

  if (existsSync(jsonFile)) {
    try { return JSON.parse(readFileSync(jsonFile, 'utf-8')); } catch {}
  }

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
  const category = categorizeDisease(entry.name);

  const article = {
    id: entry.url.split('/library/')[1]?.replace(/\/$/, '').replace(/\//g, '-') || entry.name.toLowerCase().replace(/\s+/g, '-'),
    name: title || entry.name,
    url: entry.url,
    category,
    contentLength: content.length,
    sections,
    fullContent: content.slice(0, 8000),
  };

  const outDir = resolve(OUTPUT_DIR, 'articles');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(jsonFile, JSON.stringify(article, null, 2));

  return article;
}

async function main() {
  console.log('=== Planet Ayurveda Disease Scraper ===\n');

  console.log('Fetching index page...');
  const indexHtml = await fetchPage(INDEX_URL);
  writeFileSync(resolve(OUTPUT_DIR, 'index.html'), indexHtml);

  const diseases = extractDiseaseLinks(indexHtml);
  console.log(`Found ${diseases.length} disease article links\n`);

  const articles: any[] = [];
  const BATCH = 10;

  for (let i = 0; i < diseases.length; i += BATCH) {
    const batch = diseases.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((d, j) => scrapeArticle(d, i + j + 1, diseases.length))
    );
    for (const r of results) if (r) articles.push(r);
    process.stdout.write(`  Scraped ${Math.min(i + BATCH, diseases.length)}/${diseases.length}\r`);
  }

  console.log(`\n\nScraped ${articles.length} articles`);

  const allDataPath = resolve(OUTPUT_DIR, 'all-diseases.json');
  writeFileSync(allDataPath, JSON.stringify(articles, null, 2));
  console.log(`Wrote: ${allDataPath}`);

  const cats: Record<string, number> = {};
  for (const a of articles) cats[a.category] = (cats[a.category] || 0) + 1;
  console.log('\nCategories:', cats);

  const withSections = articles.filter(a => Object.keys(a.sections).length >= 3);
  console.log(`Articles with 3+ sections: ${withSections.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });
