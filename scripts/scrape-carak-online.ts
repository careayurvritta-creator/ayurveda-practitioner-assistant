import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = 'https://www.carakasamhitaonline.com'
const OUTPUT_DIR = path.join(__dirname, '..', 'knowledge-base', 'carak-samhita')
const DELAY_MS = 250
const MAX_RETRIES = 3

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface Shloka {
  verseNumber: string
  verseNumberArabic: number
  devanagari: string
  iast: string
  hunterian: string
  english: string
  section: string
}

export interface ChapterMetadata {
  sthana: string
  sthanaNumber: number
  chapterNumber: number
  chapterTitleEnglish: string
  chapterTitleSanskrit: string
  chapterTitleDevanagari: string
  tetrad: string
  precedingChapter: string | null
  succeedingChapter: string | null
  translators: string[]
  reviewer: string
  editors: string[]
  year: number
  publisher: string
  doi: string
}

export interface ChapterSection {
  title: string
  level: number
  content: string
  subsections: ChapterSection[]
}

export interface Chapter {
  metadata: ChapterMetadata
  url: string
  abstract: string
  keywords: string[]
  introduction: string
  shlokas: Shloka[]
  sections: ChapterSection[]
  tattvaVimarsha: string
  vidhiVimarsha: string
  references: string[]
}

export interface SthanaIndex {
  name: string
  nameDevanagari: string
  number: number
  description: string
  chapters: ChapterIndex[]
}

export interface ChapterIndex {
  number: number
  title: string
  titleSanskrit: string
  titleDevanagari: string
  urlSlug: string
  fullUrl: string
  tetrad: string
}

// ── Utility Functions ───────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalizeDevanagari(text: string): string {
  // Unicode NFC normalization for Devanagari
  return text.normalize('NFC')
    .replace(/\u090D/g, '\u090D') // fix common encoding issues
    .trim()
}

function cleanText(text: string): string {
  return text
    .replace(/\[\[\d+\]\]/g, '') // remove footnote references like [[1]]
    .replace(/\[edit\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractVerseNumber(text: string): { number: string; arabic: number } | null {
  // Match Devanagari verse numbers: ॥१॥ or ||1|| or ।।१।।
  const devMatch = text.match(/॥+([०१२३४५६७८९]+)॥/)
  if (devMatch) {
    const devNum = devMatch[1]
    const arabic = devanagariToArabic(devNum)
    return { number: devNum, arabic }
  }
  // Match Arabic verse numbers: ||1|| or ॥१॥
  const arMatch = text.match(/\|+\s*(\d+)\s*\|+/)
  if (arMatch) {
    return { number: arMatch[1], arabic: parseInt(arMatch[1]) }
  }
  return null
}

function devanagariToArabic(dev: string): number {
  const map: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  }
  let result = ''
  for (const ch of dev) {
    result += map[ch] || ch
  }
  return parseInt(result) || 0
}

// ── HTTP Client ─────────────────────────────────────────────────────────────

async function fetchPage(url: string, retries = MAX_RETRIES): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const content = await new Promise<string>((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http
        protocol.get(url, { headers: { 'User-Agent': 'CharakSamhitaScraper/1.0' } }, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            const redirect = res.headers.location
            if (redirect) {
              fetchPage(redirect.startsWith('http') ? redirect : BASE_URL + redirect, retries)
                .then(resolve).catch(reject)
              return
            }
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`))
            return
          }
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => resolve(data))
          res.on('error', reject)
        }).on('error', reject)
      })
      return content
    } catch (err) {
      if (attempt === retries) throw err
      await sleep(1000 * attempt)
    }
  }
  throw new Error('Max retries exceeded')
}

async function fetchJSON(url: string): Promise<any> {
  const text = await fetchPage(url)
  return JSON.parse(text)
}

// ── MediaWiki API Parser ────────────────────────────────────────────────────

async function fetchWikiPageHTML(title: string): Promise<string> {
  const url = `${BASE_URL}/api.php?action=parse&page=${encodeURIComponent(title)}&format=json&prop=text`
  const data = await fetchJSON(url)
  return data.parse?.text?.['*'] || ''
}

async function fetchWikiPageWikitext(title: string): Promise<string> {
  const url = `${BASE_URL}/api.php?action=parse&page=${encodeURIComponent(title)}&format=json&prop=wikitext`
  const data = await fetchJSON(url)
  return data.parse?.text?.['*'] || ''
}

// ── Content Extraction ──────────────────────────────────────────────────────

function extractMetadataFromHTML(html: string, sthanaName: string, sthanaNum: number, chNum: number): ChapterMetadata {
  // Extract from the metadata table in the page
  const extractField = (label: string): string => {
    const regex = new RegExp(`${label}[^<]*</th>\\s*<td[^>]*>([^<]+)`, 'i')
    const match = html.match(regex)
    return match ? cleanText(match[1]) : ''
  }

  const doiMatch = html.match(/doi\.org\/([^\s<"]+)/)
  const yearMatch = html.match(/Year of publication[^<]*<[^>]*>(\d{4})/)

  return {
    sthana: sthanaName,
    sthanaNumber: sthanaNum,
    chapterNumber: chNum,
    chapterTitleEnglish: '',
    chapterTitleSanskrit: '',
    chapterTitleDevanagari: '',
    tetrad: extractField('Tetrad'),
    precedingChapter: extractField('Preceding Chapter') || null,
    succeedingChapter: extractField('Succeeding Chapter') || null,
    translators: extractField('Translators').split(',').map(s => s.trim()).filter(Boolean),
    reviewer: extractField('Reviewer'),
    editors: extractField('Editors').split(',').map(s => s.trim()).filter(Boolean),
    year: yearMatch ? parseInt(yearMatch[1]) : 2020,
    publisher: 'Charak Samhita Research, Training and Skill Development Centre',
    doi: doiMatch ? doiMatch[1] : ''
  }
}

function extractAbstract(html: string): { abstract: string; keywords: string[] } {
  const abstractMatch = html.match(/Abstract<\/strong>\s*<\/p>\s*([\s\S]*?)(?=<p[^>]*>\s*<strong[^>]*>\s*Keywords|<h[23]|<strong>\s*Keywords)/i)
  const abstract = abstractMatch ? cleanText(abstractMatch[1].replace(/<[^>]+>/g, '')) : ''

  const keywordsMatch = html.match(/Keywords<\/strong>\s*:\s*([\s\S]*?)(?=<\/p>|<h[23])/i)
  const keywordsStr = keywordsMatch ? cleanText(keywordsMatch[1].replace(/<[^>]+>/g, '')) : ''
  const keywords = keywordsStr.split(/[,;]/).map(k => k.trim()).filter(Boolean)

  return { abstract, keywords }
}

function extractShlokas(html: string, sectionName: string): Shloka[] {
  const shlokas: Shloka[] = []

  // The content has interleaved Devanagari, IAST, Hunterian, and English
  // Pattern: Devanagari verse → IAST transliteration → Hunterian → English translation
  // We need to extract blocks of content between section headers

  // Split by paragraph breaks and look for verse patterns
  const lines = html.split(/\n/)

  let currentDevanagari = ''
  let currentIAST = ''
  let currentHunterian = ''
  let currentEnglish = ''
  let verseNum = 0

  for (const line of lines) {
    const text = line.replace(/<[^>]+>/g, '').trim()
    if (!text) continue

    // Check if this is a Devanagari line (contains Devanagari characters)
    const hasDevanagari = /[\u0900-\u097F]/.test(text)
    // Check if this is an IAST line (contains macrons/diacritics)
    const hasIAST = /[āīūṛṝḷḹṃḥṣśṇṭḍñ]/.test(text) && !hasDevanagari
    // Check if this is Hunterian (ASCII romanization)
    const hasHunterian = /[A-Z][a-z]+[~]/.test(text) || (/[A-Z]/.test(text) && /[~^]/.test(text) && !hasDevanagari && !hasIAST)

    if (hasDevanagari) {
      // Extract verse number from this line
      const vn = extractVerseNumber(text)
      if (vn) {
        // If we already have a verse in progress, save it
        if (currentDevanagari && verseNum > 0) {
          shlokas.push({
            verseNumber: verseNum.toString(),
            verseNumberArabic: verseNum,
            devanagari: normalizeDevanagari(currentDevanagari),
            iast: currentIAST,
            hunterian: currentHunterian,
            english: currentEnglish,
            section: sectionName
          })
        }
        verseNum = vn.arabic
        currentDevanagari = text
        currentIAST = ''
        currentHunterian = ''
        currentEnglish = ''
      } else if (verseNum > 0) {
        currentDevanagari += ' ' + text
      }
    } else if (hasIAST && verseNum > 0) {
      currentIAST += ' ' + text
    } else if (hasHunterian && verseNum > 0) {
      currentHunterian += ' ' + text
    } else if (verseNum > 0 && text.length > 10 && !hasDevanagari) {
      // Likely English translation
      currentEnglish += ' ' + text
    }
  }

  // Push last verse
  if (currentDevanagari && verseNum > 0) {
    shlokas.push({
      verseNumber: verseNum.toString(),
      verseNumberArabic: verseNum,
      devanagari: normalizeDevanagari(currentDevanagari),
      iast: currentIAST,
      hunterian: currentHunterian,
      english: currentEnglish,
      section: sectionName
    })
  }

  return shlokas
}

function extractSections(html: string): ChapterSection[] {
  const sections: ChapterSection[] = []
  // Extract h2 and h3 sections
  const sectionRegex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi
  let match
  while ((match = sectionRegex.exec(html)) !== null) {
    const level = parseInt(match[1])
    const title = cleanText(match[2].replace(/<[^>]+>/g, ''))
    sections.push({ title, level, content: '', subsections: [] })
  }
  return sections
}

function extractTattvaVimarsha(html: string): string {
  const match = html.match(/Tattva\s+Vimarsha[\s\S]*?<\/h[23]>([\s\S]*?)(?=<h[23]|$)/i)
  return match ? cleanText(match[1].replace(/<[^>]+>/g, '')) : ''
}

function extractVidhiVimarsha(html: string): string {
  const match = html.match(/Vidhi\s+Vimarsha[\s\S]*?<\/h[23]>([\s\S]*?)(?=<h[23]|$)/i)
  return match ? cleanText(match[1].replace(/<[^>]+>/g, '')) : ''
}

function extractIntroduction(html: string): string {
  const match = html.match(/Introduction[\s\S]*?<\/h[23]>([\s\S]*?)(?=Sanskrit\s+text|Tattva\s+Vimarsha|<h[2])/i)
  return match ? cleanText(match[1].replace(/<[^>]+>/g, '')) : ''
}

function extractReferences(html: string): string[] {
  const refs: string[] = []
  const refSection = html.match(/References[\s\S]*?<\/h[23]>([\s\S]*?)(?=<h[23]|$)/i)
  if (refSection) {
    const refMatches = refSection[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)
    for (const rm of refMatches) {
      refs.push(cleanText(rm[1].replace(/<[^>]+>/g, '')))
    }
  }
  return refs
}

// ── Main Scraping Logic ─────────────────────────────────────────────────────

const STHANAS: SthanaIndex[] = [
  { name: 'Sutra Sthana', nameDevanagari: 'सूत्रस्थानम्', number: 1, description: 'Section on fundamental principles', chapters: [] },
  { name: 'Nidana Sthana', nameDevanagari: 'निदानस्थानम्', number: 2, description: 'Section on diagnostic principles', chapters: [] },
  { name: 'Vimana Sthana', nameDevanagari: 'विमानस्थानम्', number: 3, description: 'Section on specific medical principles', chapters: [] },
  { name: 'Sharira Sthana', nameDevanagari: 'शरीरस्थानम्', number: 4, description: 'Section on human being and genesis', chapters: [] },
  { name: 'Indriya Sthana', nameDevanagari: 'इन्द्रियस्थानम्', number: 5, description: 'Section on sensorial prognosis', chapters: [] },
  { name: 'Chikitsa Sthana', nameDevanagari: 'चिकित्सास्थानम्', number: 6, description: 'Section on therapeutic principles', chapters: [] },
  { name: 'Kalpa Sthana', nameDevanagari: 'कल्पस्थानम्', number: 7, description: 'Section on pharmaceutical preparations', chapters: [] },
  { name: 'Siddhi Sthana', nameDevanagari: 'सिद्धिस्थानम्', number: 8, description: 'Section on therapeutic procedures', chapters: [] },
]

// All 120 chapters with their URL slugs (from carakasamhitaonline.com)
const ALL_CHAPTERS: { sthana: number; number: number; title: string; titleSanskrit: string; slug: string; tetrad: string }[] = [
  // Sutra Sthana (30 chapters)
  { sthana: 1, number: 1, title: 'Longevity', titleSanskrit: 'Deerghanjiviteeya Adhyaya', slug: 'Deerghanjiviteeya_Adhyaya', tetrad: 'Bheshaja Chatushka' },
  { sthana: 1, number: 2, title: 'Dehusked Seeds of Apamarga and other medicines', titleSanskrit: 'Apamarga Tanduliya Adhyaya', slug: 'Apamarga_Tanduliya_Adhyaya', tetrad: 'Bheshaja Chatushka' },
  { sthana: 1, number: 3, title: 'Aragvadha (Cassia) and other medicines', titleSanskrit: 'Aragvadhiya Adhyaya', slug: 'Aragvadhiya_Adhyaya', tetrad: 'Bheshaja Chatushka' },
  { sthana: 1, number: 4, title: 'The Resources of Six Hundred Evacuatives', titleSanskrit: 'Shadvirechanashatashritiya Adhyaya', slug: 'Shadvirechanashatashritiya_Adhyaya', tetrad: 'Bheshaja Chatushka' },
  { sthana: 1, number: 5, title: 'The proper quantity of food and daily regimen', titleSanskrit: 'Matrashiteeya Adhyaya', slug: 'Matrashiteeya_Adhyaya', tetrad: 'Swastha Chatushka' },
  { sthana: 1, number: 6, title: 'Seasonal regimen of diet and lifestyle', titleSanskrit: 'Tasyashiteeya Adhyaya', slug: 'Tasyashiteeya_Adhyaya', tetrad: 'Swastha Chatushka' },
  { sthana: 1, number: 7, title: 'Non-suppressible and suppressible natural urges', titleSanskrit: 'Naveganadharaniya Adhyaya', slug: 'Naveganadharaniya_Adhyaya', tetrad: 'Swastha Chatushka' },
  { sthana: 1, number: 8, title: 'The Disciplinary Protocol for Sense and Motor Organs', titleSanskrit: 'Indriyopakramaniya Adhyaya', slug: 'Indriyopakramaniya_Adhyaya', tetrad: 'Swastha Chatushka' },
  { sthana: 1, number: 9, title: 'The four fundamental components of Healthcare', titleSanskrit: 'Khuddakachatushpada Adhyaya', slug: 'Khuddakachatushpada_Adhyaya', tetrad: 'Nirdesha Chatushka' },
  { sthana: 1, number: 10, title: 'The four important components of Therapeutics', titleSanskrit: 'Mahachatushpada Adhyaya', slug: 'Mahachatushpada_Adhyaya', tetrad: 'Nirdesha Chatushka' },
  { sthana: 1, number: 11, title: 'The Three Desires of Life and important triads', titleSanskrit: 'Tistraishaniya Adhyaya', slug: 'Tistraishaniya_Adhyaya', tetrad: 'Nirdesha Chatushka' },
  { sthana: 1, number: 12, title: 'The merits and demerits of Vata', titleSanskrit: 'Vatakalakaliya Adhyaya', slug: 'Vatakalakaliya_Adhyaya', tetrad: 'Nirdesha Chatushka' },
  { sthana: 1, number: 13, title: 'Oleation therapies', titleSanskrit: 'Sneha Adhyaya', slug: 'Sneha_Adhyaya', tetrad: 'Kalpana Chatushka' },
  { sthana: 1, number: 14, title: 'Sudation Therapies', titleSanskrit: 'Sweda Adhyaya', slug: 'Sweda_Adhyaya', tetrad: 'Kalpana Chatushka' },
  { sthana: 1, number: 15, title: 'Guidelines for Hospital Management and Purification Treatment', titleSanskrit: 'Upakalpaniya Adhyaya', slug: 'Upakalpaniya_Adhyaya', tetrad: 'Kalpana Chatushka' },
  { sthana: 1, number: 16, title: 'Assessment and care in Panchakarma therapies', titleSanskrit: 'Chikitsaprabhritiya Adhyaya', slug: 'Chikitsaprabhritiya_Adhyaya', tetrad: 'Kalpana Chatushka' },
  { sthana: 1, number: 17, title: 'Diseases of three vital organs including Head', titleSanskrit: 'Kiyanta Shiraseeya Adhyaya', slug: 'Kiyanta_Shiraseeya_Adhyaya', tetrad: 'Roga Chatushka' },
  { sthana: 1, number: 18, title: 'Three Types of Swellings and other conditions', titleSanskrit: 'Trishothiya Adhyaya', slug: 'Trishothiya_Adhyaya', tetrad: 'Roga Chatushka' },
  { sthana: 1, number: 19, title: 'Numerical Classification of Diseases', titleSanskrit: 'Ashtodariya Adhyaya', slug: 'Ashtodariya_Adhyaya', tetrad: 'Roga Chatushka' },
  { sthana: 1, number: 20, title: 'Dosha specific classification of diseases', titleSanskrit: 'Maharoga Adhyaya', slug: 'Maharoga_Adhyaya', tetrad: 'Roga Chatushka' },
  { sthana: 1, number: 21, title: 'Eight Undesirable Physical Constitutions', titleSanskrit: 'Ashtauninditiya Adhyaya', slug: 'Ashtauninditiya_Adhyaya', tetrad: 'Yojana Chatushka' },
  { sthana: 1, number: 22, title: 'Reduction and nourishing therapies', titleSanskrit: 'Langhanabrimhaniya Adhyaya', slug: 'Langhanabrimhaniya_Adhyaya', tetrad: 'Yojana Chatushka' },
  { sthana: 1, number: 23, title: 'Over-nutrition, under-nutrition and its disorders', titleSanskrit: 'Santarpaniya Adhyaya', slug: 'Santarpaniya_Adhyaya', tetrad: 'Yojana Chatushka' },
  { sthana: 1, number: 24, title: 'Characteristics of Shonita (Blood), its vitiation and disorders', titleSanskrit: 'Vidhishonitiya Adhyaya', slug: 'Vidhishonitiya_Adhyaya', tetrad: 'Yojana Chatushka' },
  { sthana: 1, number: 25, title: 'Origin of Human Beings and the best things for life', titleSanskrit: 'Yajjah Purushiya Adhyaya', slug: 'Yajjah_Purushiya_Adhyaya', tetrad: 'Annapana Chatushka' },
  { sthana: 1, number: 26, title: 'Pharmacological principles of wholesome and unwholesome diet', titleSanskrit: 'Atreyabhadrakapyiya Adhyaya', slug: 'Atreyabhadrakapyiya_Adhyaya', tetrad: 'Annapana Chatushka' },
  { sthana: 1, number: 27, title: 'Classification and Regimen of food and beverages', titleSanskrit: 'Annapanavidhi Adhyaya', slug: 'Annapanavidhi_Adhyaya', tetrad: 'Annapana Chatushka' },
  { sthana: 1, number: 28, title: 'Sequential effects of food and beverages', titleSanskrit: 'Vividhashitapitiya Adhyaya', slug: 'Vividhashitapitiya_Adhyaya', tetrad: 'Annapana Chatushka' },
  { sthana: 1, number: 29, title: 'The Ten Seats of Life Forces', titleSanskrit: 'Dashapranayataneeya Adhyaya', slug: 'Dashapranayataneeya_Adhyaya', tetrad: 'Sangrahadvaya' },
  { sthana: 1, number: 30, title: 'The Ten great vessels arising from Heart', titleSanskrit: 'Arthedashmahamooliya Adhyaya', slug: 'Arthedashmahamooliya_Adhyaya', tetrad: 'Sangrahadvaya' },
  // Nidana Sthana (8 chapters)
  { sthana: 2, number: 1, title: 'Fundamental Principles of Diagnosis and Jwara', titleSanskrit: 'Jwara Nidana Adhyaya', slug: 'Jwara_Nidana_Adhyaya', tetrad: '' },
  { sthana: 2, number: 2, title: 'Diagnosis of Bleeding Disorders', titleSanskrit: 'Raktapitta Nidana Adhyaya', slug: 'Raktapitta_Nidana_Adhyaya', tetrad: '' },
  { sthana: 2, number: 3, title: 'Diagnosis of Abdominal lumps', titleSanskrit: 'Gulma Nidana Adhyaya', slug: 'Gulma_Nidana_Adhyaya', tetrad: '' },
  { sthana: 2, number: 4, title: 'Diagnosis of Obstinate Urinary Disorders', titleSanskrit: 'Prameha Nidana Adhyaya', slug: 'Prameha_Nidana_Adhyaya', tetrad: '' },
  { sthana: 2, number: 5, title: 'Diagnosis of Skin diseases', titleSanskrit: 'Kushtha Nidana Adhyaya', slug: 'Kushtha_Nidana_Adhyaya', tetrad: '' },
  { sthana: 2, number: 6, title: 'Diagnosis of Progressive wasting disease', titleSanskrit: 'Shosha Nidana Adhyaya', slug: 'Shosha_Nidana_Adhyaya', tetrad: '' },
  { sthana: 2, number: 7, title: 'Diagnosis of psychosis disorders', titleSanskrit: 'Unmada Nidana Adhyaya', slug: 'Unmada_Nidana_Adhyaya', tetrad: '' },
  { sthana: 2, number: 8, title: 'Diagnosis of seizure disorders', titleSanskrit: 'Apasmara Nidana Adhyaya', slug: 'Apasmara_Nidana_Adhyaya', tetrad: '' },
  // Vimana Sthana (8 chapters)
  { sthana: 3, number: 1, title: 'Taste-based factors for measurement of diseases and drugs', titleSanskrit: 'Rasa Vimana Adhyaya', slug: 'Rasa_Vimana_Adhyaya', tetrad: '' },
  { sthana: 3, number: 2, title: 'Three parts of abdomen and principles of diet', titleSanskrit: 'Trividhakukshiya Vimana Adhyaya', slug: 'Trividhakukshiya_Vimana_Adhyaya', tetrad: '' },
  { sthana: 3, number: 3, title: 'Determination of destruction of communities', titleSanskrit: 'Janapadodhvansaniya Vimana Adhyaya', slug: 'Janapadodhvansaniya_Vimana_Adhyaya', tetrad: '' },
  { sthana: 3, number: 4, title: 'Three methods for knowledge of disease', titleSanskrit: 'Trividha Roga Vishesha Vijnaniya Vimana Adhyaya', slug: 'Trividha_Roga_Vishesha_Vijnaniya_Vimana_Adhyaya', tetrad: '' },
  { sthana: 3, number: 5, title: 'Specific features of channels of transport', titleSanskrit: 'Sroto Vimana Adhyaya', slug: 'Sroto_Vimana_Adhyaya', tetrad: '' },
  { sthana: 3, number: 6, title: 'Classification of Diseases', titleSanskrit: 'Roganika Vimana Adhyaya', slug: 'Roganika_Vimana_Adhyaya', tetrad: '' },
  { sthana: 3, number: 7, title: 'Types of patients and organisms', titleSanskrit: 'Vyadhita Rupiya Vimana Adhyaya', slug: 'Vyadhita_Rupiya_Vimana_Adhyaya', tetrad: '' },
  { sthana: 3, number: 8, title: 'Methods of conquering debate and disease', titleSanskrit: 'Rogabhishagjitiya Vimana Adhyaya', slug: 'Rogabhishagjitiya_Vimana_Adhyaya', tetrad: '' },
  // Sharira Sthana (8 chapters)
  { sthana: 4, number: 1, title: 'Knowledge of holistic human being', titleSanskrit: 'Katidhapurusha Sharira Adhyaya', slug: 'Katidhapurusha_Sharira_Adhyaya', tetrad: '' },
  { sthana: 4, number: 2, title: 'Different clans and aspects of Human Birth', titleSanskrit: 'Atulyagotriya Sharira Adhyaya', slug: 'Atulyagotriya_Sharira_Adhyaya', tetrad: '' },
  { sthana: 4, number: 3, title: 'Factors responsible for Embryogenesis', titleSanskrit: 'Khuddika Garbhavakranti Sharira Adhyaya', slug: 'Khuddika_Garbhavakranti_Sharira_Adhyaya', tetrad: '' },
  { sthana: 4, number: 4, title: 'Detail description on embryonic development', titleSanskrit: 'Mahatigarbhavakranti Sharira Adhyaya', slug: 'Mahatigarbhavakranti_Sharira_Adhyaya', tetrad: '' },
  { sthana: 4, number: 5, title: 'Detailed Study of holistic human being', titleSanskrit: 'Purusha Vichaya Sharira Adhyaya', slug: 'Purusha_Vichaya_Sharira_Adhyaya', tetrad: '' },
  { sthana: 4, number: 6, title: 'Analytical study of the Human body', titleSanskrit: 'Sharira Vichaya Sharira Adhyaya', slug: 'Sharira_Vichaya_Sharira_Adhyaya', tetrad: '' },
  { sthana: 4, number: 7, title: 'Numerological account of human body', titleSanskrit: 'Sharira Sankhya Sharira Adhyaya', slug: 'Sharira_Sankhya_Sharira_Adhyaya', tetrad: '' },
  { sthana: 4, number: 8, title: 'Obstetrics, Maternal Health and Neonatal Care', titleSanskrit: 'Jatisutriya Sharira Adhyaya', slug: 'Jatisutriya_Sharira_Adhyaya', tetrad: '' },
  // Indriya Sthana (12 chapters)
  { sthana: 5, number: 1, title: 'Fatal signs in complexion and voice', titleSanskrit: 'Varnasvariyam Indriyam Adhyaya', slug: 'Varnasvariyam_Indriyam_Adhyaya', tetrad: '' },
  { sthana: 5, number: 2, title: 'Fatal signs of Tactile and Olfactory perception', titleSanskrit: 'Pushpitakam Indriyam Adhyaya', slug: 'Pushpitakam_Indriyam_Adhyaya', tetrad: '' },
  { sthana: 5, number: 3, title: 'Palpable signs of Imminent Death', titleSanskrit: 'Parimarshaneeyam Indriyam Adhyaya', slug: 'Parimarshaneeyam_Indriyam_Adhyaya', tetrad: '' },
  { sthana: 5, number: 4, title: 'Fatal signs in five sense organs', titleSanskrit: 'Indriyaneekam Indriyam Adhyaya', slug: 'Indriyaneekam_Indriyam_Adhyaya', tetrad: '' },
  { sthana: 5, number: 5, title: 'Predicting prognosis by prodromal symptoms', titleSanskrit: 'Purvarupeeyam Indriyam Adhyaya', slug: 'Purvarupeeyam_Indriyam_Adhyaya', tetrad: '' },
  { sthana: 5, number: 6, title: 'Specific fatal clinical features', titleSanskrit: 'Katamanisharireeyam Indriyam Adhyaya', slug: 'Katamanisharireeyam_Indriyam_Adhyaya', tetrad: '' },
  { sthana: 5, number: 7, title: 'Fatal signs in shadows, complexion, and luster', titleSanskrit: 'Pannarupiyam Indriyam Adhyaya', slug: 'Pannarupiyam_Indriyam_Adhyaya', tetrad: '' },
  { sthana: 5, number: 8, title: 'Fatal signs like inverted shadow', titleSanskrit: 'Avakshiraseeyam Indriyam Adhyaya', slug: 'Avakshiraseeyam_Indriyam_Adhyaya', tetrad: '' },
  { sthana: 5, number: 9, title: 'Signs for Palliative Care among Patients approaching Death', titleSanskrit: 'Yasyashyavanimittiyam Indriyam Adhyaya', slug: 'Yasyashyavanimittiyam_Indriyam_Adhyaya', tetrad: '' },
  { sthana: 5, number: 10, title: 'Signs of instant death', titleSanskrit: 'Sadyomaraneeyam Indriyam Adhyaya', slug: 'Sadyomaraneeyam_Indriyam_Adhyaya', tetrad: '' },
  { sthana: 5, number: 11, title: 'Signs of death from diminution of Agni', titleSanskrit: 'Anujyotiyam Indriyam Adhyaya', slug: 'Anujyotiyam_Indriyam_Adhyaya', tetrad: '' },
  { sthana: 5, number: 12, title: 'Auspicious and Inauspicious Characteristics of the messenger', titleSanskrit: 'Gomayachurniyam Indriyam Adhyaya', slug: 'Gomayachurniyam_Indriyam_Adhyaya', tetrad: '' },
  // Chikitsa Sthana (30 chapters)
  { sthana: 6, number: 1, title: 'Rejuvenation therapy', titleSanskrit: 'Rasayana Adhyaya', slug: 'Rasayana_Adhyaya', tetrad: '' },
  { sthana: 6, number: 2, title: 'Aphrodisiac therapy', titleSanskrit: 'Vajikarana Adhyaya', slug: 'Vajikarana_Adhyaya', tetrad: '' },
  { sthana: 6, number: 3, title: 'Management of Jwara', titleSanskrit: 'Jwara Chikitsa Adhyaya', slug: 'Jwara_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 4, title: 'Management of Raktapitta', titleSanskrit: 'Raktapitta Chikitsa Adhyaya', slug: 'Raktapitta_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 5, title: 'Management of Gulma', titleSanskrit: 'Gulma Chikitsa Adhyaya', slug: 'Gulma_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 6, title: 'Management of Prameha', titleSanskrit: 'Prameha Chikitsa Adhyaya', slug: 'Prameha_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 7, title: 'Management of Kushtha', titleSanskrit: 'Kushtha Chikitsa Adhyaya', slug: 'Kushtha_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 8, title: 'Management of Rajayakshma', titleSanskrit: 'Rajayakshma Chikitsa Adhyaya', slug: 'Rajayakshma_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 9, title: 'Management of Unmada', titleSanskrit: 'Unmada Chikitsa Adhyaya', slug: 'Unmada_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 10, title: 'Management of Apasmara', titleSanskrit: 'Apasmara Chikitsa Adhyaya', slug: 'Apasmara_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 11, title: 'Management of Kshata-kshina', titleSanskrit: 'Kshatakshina Chikitsa Adhyaya', slug: 'Kshatakshina_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 12, title: 'Management of Shvayathu', titleSanskrit: 'Shvayathu Chikitsa Adhyaya', slug: 'Shvayathu_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 13, title: 'Management of Udara', titleSanskrit: 'Udara Chikitsa Adhyaya', slug: 'Udara_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 14, title: 'Management of Arsha', titleSanskrit: 'Arsha Chikitsa Adhyaya', slug: 'Arsha_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 15, title: 'Management of Grahani', titleSanskrit: 'Grahani Chikitsa Adhyaya', slug: 'Grahani_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 16, title: 'Management of Pandu', titleSanskrit: 'Pandu Chikitsa Adhyaya', slug: 'Pandu_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 17, title: 'Management of Hikka and Shwasa', titleSanskrit: 'Hikka Shwasa Chikitsa Adhyaya', slug: 'Hikka_Shwasa_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 18, title: 'Management of Kasa', titleSanskrit: 'Kasa Chikitsa Adhyaya', slug: 'Kasa_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 19, title: 'Management of Atisara', titleSanskrit: 'Atisara Chikitsa Adhyaya', slug: 'Atisara_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 20, title: 'Management of Chhardi', titleSanskrit: 'Chhardi Chikitsa Adhyaya', slug: 'Chhardi_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 21, title: 'Management of Visarpa', titleSanskrit: 'Visarpa Chikitsa Adhyaya', slug: 'Visarpa_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 22, title: 'Management of Trishna', titleSanskrit: 'Trishna Chikitsa Adhyaya', slug: 'Trishna_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 23, title: 'Management of Visha', titleSanskrit: 'Visha Chikitsa Adhyaya', slug: 'Visha_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 24, title: 'Management of Madatyaya', titleSanskrit: 'Madatyaya Chikitsa Adhyaya', slug: 'Madatyaya_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 25, title: 'Management of two types of Vrana', titleSanskrit: 'Dwivraniya Chikitsa Adhyaya', slug: 'Dwivraniya_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 26, title: 'Management of Trimarma', titleSanskrit: 'Trimarmiya Chikitsa Adhyaya', slug: 'Trimarmiya_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 27, title: 'Management of Urustambha', titleSanskrit: 'Urustambha Chikitsa Adhyaya', slug: 'Urustambha_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 28, title: 'Management of Vatavyadhi', titleSanskrit: 'Vatavyadhi Chikitsa Adhyaya', slug: 'Vatavyadhi_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 29, title: 'Management of Vatarakta', titleSanskrit: 'Vatarakta Chikitsa Adhyaya', slug: 'Vatarakta_Chikitsa_Adhyaya', tetrad: '' },
  { sthana: 6, number: 30, title: 'Management of Yonivyapat', titleSanskrit: 'Yonivyapat Chikitsa Adhyaya', slug: 'Yonivyapat_Chikitsa_Adhyaya', tetrad: '' },
  // Kalpa Sthana (12 chapters)
  { sthana: 7, number: 1, title: 'Pharmaceutical preparations of Madanaphala', titleSanskrit: 'Madana Kalpa Adhyaya', slug: 'Madana_Kalpa_Adhyaya', tetrad: '' },
  { sthana: 7, number: 2, title: 'Pharmaceutical preparations of Jimutaka', titleSanskrit: 'Jimutaka Kalpa Adhyaya', slug: 'Jimutaka_Kalpa_Adhyaya', tetrad: '' },
  { sthana: 7, number: 3, title: 'Pharmaceutical preparations of Ikshvaku', titleSanskrit: 'Ikshvaku Kalpa Adhyaya', slug: 'Ikshvaku_Kalpa_Adhyaya', tetrad: '' },
  { sthana: 7, number: 4, title: 'Pharmaceutical preparations of Dhamargava', titleSanskrit: 'Dhamargava Kalpa Adhyaya', slug: 'Dhamargava_Kalpa_Adhyaya', tetrad: '' },
  { sthana: 7, number: 5, title: 'Pharmaceutical preparations of Vatsaka', titleSanskrit: 'Vatsaka Kalpa Adhyaya', slug: 'Vatsaka_Kalpa_Adhyaya', tetrad: '' },
  { sthana: 7, number: 6, title: 'Pharmaceutical preparations of Kritavedhana', titleSanskrit: 'Kritavedhana Kalpa Adhyaya', slug: 'Kritavedhana_Kalpa_Adhyaya', tetrad: '' },
  { sthana: 7, number: 7, title: 'Pharmaceutical preparations of Shyama Trivrita', titleSanskrit: 'Shyamatrivrita Kalpa Adhyaya', slug: 'Shyamatrivrita_Kalpa_Adhyaya', tetrad: '' },
  { sthana: 7, number: 8, title: 'Pharmaceutical preparations of Chaturangula', titleSanskrit: 'Chaturangula Kalpa Adhyaya', slug: 'Chaturangula_Kalpa_Adhyaya', tetrad: '' },
  { sthana: 7, number: 9, title: 'Pharmaceutical preparations of Tilvaka', titleSanskrit: 'Tilvaka Kalpa Adhyaya', slug: 'Tilvaka_Kalpa_Adhyaya', tetrad: '' },
  { sthana: 7, number: 10, title: 'Pharmaceutical preparations of Sudha', titleSanskrit: 'Sudha Kalpa Adhyaya', slug: 'Sudha_Kalpa_Adhyaya', tetrad: '' },
  { sthana: 7, number: 11, title: 'Pharmaceutical preparations of Saptala and Shankhini', titleSanskrit: 'Saptalashankhini Kalpa Adhyaya', slug: 'Saptalashankhini_Kalpa_Adhyaya', tetrad: '' },
  { sthana: 7, number: 12, title: 'Pharmaceutical preparations of Danti and Dravanti', titleSanskrit: 'Dantidravanti Kalpa Adhyaya', slug: 'Dantidravanti_Kalpa_Adhyaya', tetrad: '' },
  // Siddhi Sthana (12 chapters)
  { sthana: 8, number: 1, title: 'Standard administration of purification procedures', titleSanskrit: 'Kalpana Siddhi Adhyaya', slug: 'Kalpana_Siddhi_Adhyaya', tetrad: '' },
  { sthana: 8, number: 2, title: 'Successful administration of Panchakarma therapies', titleSanskrit: 'Panchakarmiya Siddhi Adhyaya', slug: 'Panchakarmiya_Siddhi_Adhyaya', tetrad: '' },
  { sthana: 8, number: 3, title: 'Standard practices of Basti', titleSanskrit: 'Bastisutriyam Siddhi Adhyaya', slug: 'Bastisutriyam_Siddhi_Adhyaya', tetrad: '' },
  { sthana: 8, number: 4, title: 'Complications of unctuous enema', titleSanskrit: 'Snehavyapat Siddhi Adhyaya', slug: 'Snehavyapat_Siddhi_Adhyaya', tetrad: '' },
  { sthana: 8, number: 5, title: 'Management of complications due to enema nozzle', titleSanskrit: 'Netrabastivyapat Siddhi Adhyaya', slug: 'Netrabastivyapat_Siddhi_Adhyaya', tetrad: '' },
  { sthana: 8, number: 6, title: 'Management of complications of emesis and purgation', titleSanskrit: 'Vamana Virechana Vyapat Siddhi Adhyaya', slug: 'Vamana_Virechana_Vyapat_Siddhi_Adhyaya', tetrad: '' },
  { sthana: 8, number: 7, title: 'Management of complications of therapeutic enema', titleSanskrit: 'Bastivyapat Siddhi Adhyaya', slug: 'Bastivyapat_Siddhi_Adhyaya', tetrad: '' },
  { sthana: 8, number: 8, title: 'Standardized therapeutic enema formulations', titleSanskrit: 'Prasrita Yogiyam Siddhi Adhyaya', slug: 'Prasrita_Yogiyam_Siddhi_Adhyaya', tetrad: '' },
  { sthana: 8, number: 9, title: 'Management of diseases of three vital organs', titleSanskrit: 'Trimarmiya Siddhi Adhyaya', slug: 'Trimarmiya_Siddhi_Adhyaya', tetrad: '' },
  { sthana: 8, number: 10, title: 'Successful administration of therapeutic enema', titleSanskrit: 'Basti Siddhi Adhyaya', slug: 'Basti_Siddhi_Adhyaya', tetrad: '' },
  { sthana: 8, number: 11, title: 'Utility of medicinal fruits in therapeutic enema', titleSanskrit: 'Phalamatra Siddhi Adhyaya', slug: 'Phalamatra_Siddhi_Adhyaya', tetrad: '' },
  { sthana: 8, number: 12, title: 'Standard administration of best effective therapeutic enema', titleSanskrit: 'Uttar Basti Siddhi Adhyaya', slug: 'Uttar_Basti_Siddhi_Adhyaya', tetrad: '' },
]

// ── Scraping Functions ──────────────────────────────────────────────────────

async function scrapeChapterIndex(): Promise<ChapterIndex[]> {
  console.log('=== Scraping Chapter Index ===')
  const chapters: ChapterIndex[] = []

  for (const ch of ALL_CHAPTERS) {
    const sthana = STHANAS.find(s => s.number === ch.sthana)
    chapters.push({
      number: ch.number,
      title: ch.title,
      titleSanskrit: ch.titleSanskrit,
      titleDevanagari: '', // Will be filled when scraping chapter
      urlSlug: ch.slug,
      fullUrl: `${BASE_URL}/index.php?title=${ch.slug}`,
      tetrad: ch.tetrad
    })
  }

  console.log(`Found ${chapters.length} chapters across ${STHANAS.length} Sthanas`)
  return chapters
}

async function scrapeChapter(chapterIndex: ChapterIndex, sthanaNum: number): Promise<Chapter | null> {
  const url = `${BASE_URL}/index.php?title=${chapterIndex.urlSlug}`
  console.log(`  Scraping: ${chapterIndex.urlSlug}...`)

  try {
    const html = await fetchPage(url)
    await sleep(DELAY_MS)

    const metadata = extractMetadataFromHTML(html, STHANAS[sthanaNum - 1].name, sthanaNum, chapterIndex.number)
    metadata.chapterTitleEnglish = chapterIndex.title
    metadata.chapterTitleSanskrit = chapterIndex.titleSanskrit

    // Extract title Devanagari from page
    const titleDevMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
    if (titleDevMatch) {
      metadata.chapterTitleDevanagari = normalizeDevanagari(titleDevMatch[1].replace(/<[^>]+>/g, '').trim())
    }

    const { abstract, keywords } = extractAbstract(html)
    const introduction = extractIntroduction(html)
    const shlokas = extractShlokas(html, chapterIndex.title)
    const sections = extractSections(html)
    const tattvaVimarsha = extractTattvaVimarsha(html)
    const vidhiVimarsha = extractVidhiVimarsha(html)
    const references = extractReferences(html)

    console.log(`    Found ${shlokas.length} shlokas, ${sections.length} sections`)

    return {
      metadata,
      url,
      abstract,
      keywords,
      introduction,
      shlokas,
      sections,
      tattvaVimarsha,
      vidhiVimarsha,
      references
    }
  } catch (err) {
    console.error(`    ERROR scraping ${chapterIndex.urlSlug}: ${(err as Error).message}`)
    return null
  }
}

async function scrapeAllChapters(): Promise<Chapter[]> {
  const allChapters: Chapter[] = []
  const chaptersIndex = await scrapeChapterIndex()

  // Create checkpoint file
  const checkpointFile = path.join(OUTPUT_DIR, '_checkpoint.json')
  let startIdx = 0
  if (fs.existsSync(checkpointFile)) {
    const checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf-8'))
    startIdx = checkpoint.lastCompleted + 1
    console.log(`Resuming from index ${startIdx}`)
  }

  for (let i = startIdx; i < chaptersIndex.length; i++) {
    const ch = chaptersIndex[i]
    const sthanaNum = ALL_CHAPTERS[i].sthana

    console.log(`\n[${i + 1}/${chaptersIndex.length}] Sthana ${sthanaNum}, Chapter ${ch.number}: ${ch.titleSanskrit}`)

    const chapter = await scrapeChapter(ch, sthanaNum)
    if (chapter) {
      allChapters.push(chapter)

      // Save individual chapter
      const sthanaDir = path.join(OUTPUT_DIR, STHANAS[sthanaNum - 1].name.toLowerCase().replace(/\s+/g, '-'))
      fs.mkdirSync(sthanaDir, { recursive: true })
      const chFile = path.join(sthanaDir, `chapter-${ch.number.toString().padStart(3, '0')}.json`)
      fs.writeFileSync(chFile, JSON.stringify(chapter, null, 2), 'utf-8')

      // Update checkpoint
      fs.writeFileSync(checkpointFile, JSON.stringify({ lastCompleted: i, totalChapters: chaptersIndex.length }))
    }
  }

  return allChapters
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║  Charak Samhita Online - Comprehensive Scraper           ║')
  console.log('║  Source: carakasamhitaonline.com                         ║')
  console.log('║  License: CC BY-NC-SA 4.0                                ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('')

  // Step 1: Create output directories
  for (const sthana of STHANAS) {
    const dir = path.join(OUTPUT_DIR, sthana.name.toLowerCase().replace(/\s+/g, '-'))
    fs.mkdirSync(dir, { recursive: true })
  }

  // Step 2: Scrape all chapters
  const allChapters = await scrapeAllChapters()

  // Step 3: Save combined data
  const combinedOutput = {
    source: 'carakasamhitaonline.com',
    license: 'CC BY-NC-SA 4.0',
    totalChapters: allChapters.length,
    totalShlokas: allChapters.reduce((sum, ch) => sum + ch.shlokas.length, 0),
    sthanas: STHANAS.map(s => ({
      ...s,
      chapterCount: allChapters.filter(ch => ch.metadata.sthanaNumber === s.number).length,
      shlokaCount: allChapters.filter(ch => ch.metadata.sthanaNumber === s.number).reduce((sum, ch) => sum + ch.shlokas.length, 0)
    })),
    chapters: allChapters.map(ch => ({
      sthana: ch.metadata.sthana,
      sthanaNumber: ch.metadata.sthanaNumber,
      chapterNumber: ch.metadata.chapterNumber,
      title: ch.metadata.chapterTitleEnglish,
      titleSanskrit: ch.metadata.chapterTitleSanskrit,
      shlokaCount: ch.shlokas.length,
      url: ch.url
    }))
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'charak-samhita-online.json'), JSON.stringify(combinedOutput, null, 2), 'utf-8')

  // Step 4: Save all shlokas in flat format for search
  const allShlokas: any[] = []
  for (const ch of allChapters) {
    for (const shloka of ch.shlokas) {
      allShlokas.push({
        ...shloka,
        sthana: ch.metadata.sthana,
        sthanaNumber: ch.metadata.sthanaNumber,
        chapterNumber: ch.metadata.chapterNumber,
        chapterTitle: ch.metadata.chapterTitleEnglish,
        chapterTitleSanskrit: ch.metadata.chapterTitleSanskrit,
      })
    }
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'all-shlokas.json'), JSON.stringify(allShlokas, null, 2), 'utf-8')

  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║  SCRAPING COMPLETE                                        ║')
  console.log(`║  Total Chapters: ${allChapters.length.toString().padStart(3)}                                   ║`)
  console.log(`║  Total Shlokas: ${allShlokas.length.toString().padStart(5)}                                 ║`)
  console.log('╚════════════════════════════════════════════════════════════╝')
}

main().catch(console.error)
