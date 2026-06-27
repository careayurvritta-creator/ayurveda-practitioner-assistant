import https from 'https'
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
  verseNumber: number
  devanagari: string
  english: string
  section: string
}

export interface ChapterData {
  sthana: string
  sthanaNumber: number
  chapterNumber: number
  titleEnglish: string
  titleSanskrit: string
  titleDevanagari: string
  abstract: string
  keywords: string[]
  introduction: string
  shlokas: Shloka[]
  tattvaVimarsha: string
  vidhiVimarsha: string
  url: string
  doi: string
}

// ── Utility ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function cleanText(text: string): string {
  return text
    .replace(/\[\[\d+\]\]/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[edit\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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

function extractVerseNumber(text: string): number | null {
  // Match ||३|| or ||3|| or ॥३॥ or |3|
  const devMatch = text.match(/[\|॥]+([०-९]+)[\|॥]+/)
  if (devMatch) return devanagariToArabic(devMatch[1])
  const arMatch = text.match(/[\|॥]+(\d+)[\|॥]+/)
  if (arMatch) return parseInt(arMatch[1])
  return null
}

function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text)
}

function isIAST(text: string): boolean {
  return /[āīūṛṝḷḹṃḥṣśṇṭḍñĀĪŪṚṜḶḸṂḤṢŚṄṆṬḌÑ]/.test(text) && !hasDevanagari(text)
}

function isHunterian(text: string): boolean {
  // Hunterian uses capital letters and ~ for anusvara, ^ for aspirates
  // Examples: dIrghaM, sharaNyam, bhagavAnAtreyaH
  const cleaned = text.replace(/[\s\d\[\]|,.;:!?()\-'"]/g, '')
  return cleaned.length > 0 && /^[a-zA-Z~^]+$/.test(cleaned) && /[~^]/.test(text) && !hasDevanagari(text) && !isIAST(text)
}

// ── HTTP Client ─────────────────────────────────────────────────────────────

async function fetchPage(url: string, retries = MAX_RETRIES): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await new Promise<string>((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'CharakSamhitaScraper/1.0' } }, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            const redirect = res.headers.location
            if (redirect) {
              fetchPage(redirect.startsWith('http') ? redirect : BASE_URL + redirect, retries)
                .then(resolve).catch(reject)
              return
            }
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`))
            return
          }
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => resolve(data))
          res.on('error', reject)
        }).on('error', reject)
      })
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

// ── Chapter Parser ──────────────────────────────────────────────────────────

async function scrapeChapter(slug: string): Promise<{ html: string; resolvedTitle: string }> {
  // First resolve redirects
  const queryUrl = `${BASE_URL}/api.php?action=query&titles=${encodeURIComponent(slug)}&redirects&format=json`
  const queryData = await fetchJSON(queryUrl)
  const resolvedTitle = queryData.query?.redirects?.[0]?.to || queryData.query?.normalized?.[0]?.to || slug

  // Then parse the resolved title
  const url = `${BASE_URL}/api.php?action=parse&page=${encodeURIComponent(resolvedTitle)}&format=json&prop=text`
  const data = await fetchJSON(url)
  return { html: data.parse?.text?.['*'] || '', resolvedTitle }
}

function extractShlokasFromHTML(html: string, sectionName: string): Shloka[] {
  // Strategy: The HTML structure is:
  // <div class="mw-collapsible mw-collapsed">
  //   <p>Devanagari verse...</p>
  //   <div class="mw-collapsible-content">
  //     <p>IAST transliteration...</p>
  //     <p>Hunterian transliteration...</p>
  //   </div>
  // </div>
  // <p>English translation...</p>
  //
  // We need to:
  // 1. Extract Devanagari from outside mw-collapsible-content but inside mw-collapsible
  // 2. Extract English from the <p> tag AFTER the closing </div></div>

  const shlokas: Shloka[] = []
  let verseCounter = 0

  // Split HTML into segments: each collapsible block + the following English paragraph
  // Pattern: find each mw-collapsible block and the paragraph after it
  const blockRegex = /<div class="mw-collapsible mw-collapsed">([\s\S]*?)<\/div><\/div>\s*(?:<p>([\s\S]*?)<\/p>)?/g

  let match: RegExpExecArray | null
  while ((match = blockRegex.exec(html)) !== null) {
    const collapsibleContent = match[1]
    const englishHtml = match[2] || ''

    // Extract Devanagari from the collapsible (first <p> tags before mw-collapsible-content)
    const devaLines: string[] = []
    const pTags = collapsibleContent.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || []
    for (const pTag of pTags) {
      const text = pTag.replace(/<[^>]*>/g, '').trim()
      if (/[\u0900-\u097F]/.test(text)) {
        devaLines.push(text)
      }
    }

    if (devaLines.length === 0) continue

    // Clean English translation - remove HTML tags, footnote links, etc.
    let english = englishHtml
      .replace(/<[^>]*>/g, '')
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(parseInt(code)))
      .replace(/\[\d+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    const vn = extractVerseNumber(devaLines.join(' ')) || ++verseCounter

    shlokas.push({
      verseNumber: vn,
      devanagari: devaLines.join(' ').normalize('NFC'),
      english: english,
      section: sectionName
    })
  }

  return shlokas
}

function extractSection(html: string, heading: string): string {
  const regex = new RegExp(heading + '[\\s\\S]*?</h[23]>([\\s\\S]*?)(?=<h[23]|$)', 'i')
  const match = html.match(regex)
  if (!match) return ''
  // Extract text from paragraphs in this section
  const pMatches = [...match[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
  return pMatches.map(m => cleanText(m[1].replace(/<[^>]+>/g, ''))).filter(p => p.length > 0).join('\n\n')
}

// ── Chapter Definitions ─────────────────────────────────────────────────────

const CHAPTERS: { sthana: number; num: number; title: string; titleSk: string; slug: string }[] = [
  // Sutra Sthana (30)
  { sthana: 1, num: 1, title: 'Longevity', titleSk: 'Deerghanjiviteeya Adhyaya', slug: 'Deerghanjiviteeya_Adhyaya' },
  { sthana: 1, num: 2, title: 'Dehusked Seeds of Apamarga', titleSk: 'Apamarga Tanduliya Adhyaya', slug: 'Apamarga_Tanduliya_Adhyaya' },
  { sthana: 1, num: 3, title: 'Aragvadha and other medicines', titleSk: 'Aragvadhiya Adhyaya', slug: 'Aragvadhiya_Adhyaya' },
  { sthana: 1, num: 4, title: 'Six Hundred Evacuatives', titleSk: 'Shadvirechanashatashritiya Adhyaya', slug: 'Shadvirechanashatashritiya_Adhyaya' },
  { sthana: 1, num: 5, title: 'Proper quantity of food', titleSk: 'Matrashiteeya Adhyaya', slug: 'Matrashiteeya_Adhyaya' },
  { sthana: 1, num: 6, title: 'Seasonal regimen of diet', titleSk: 'Tasyashiteeya Adhyaya', slug: 'Tasyashiteeya_Adhyaya' },
  { sthana: 1, num: 7, title: 'Suppressible and non-suppressible urges', titleSk: 'Naveganadharaniya Adhyaya', slug: 'Naveganadharaniya_Adhyaya' },
  { sthana: 1, num: 8, title: 'Disciplinary Protocol for Sense Organs', titleSk: 'Indriyopakramaniya Adhyaya', slug: 'Indriyopakramaniya_Adhyaya' },
  { sthana: 1, num: 9, title: 'Four fundamental components of Healthcare', titleSk: 'Khuddakachatushpada Adhyaya', slug: 'Khuddakachatushpada_Adhyaya' },
  { sthana: 1, num: 10, title: 'Four important components of Therapeutics', titleSk: 'Mahachatushpada Adhyaya', slug: 'Mahachatushpada_Adhyaya' },
  { sthana: 1, num: 11, title: 'Three Desires of Life', titleSk: 'Tistraishaniya Adhyaya', slug: 'Tistraishaniya_Adhyaya' },
  { sthana: 1, num: 12, title: 'Merits and demerits of Vata', titleSk: 'Vatakalakaliya Adhyaya', slug: 'Vatakalakaliya_Adhyaya' },
  { sthana: 1, num: 13, title: 'Oleation therapies', titleSk: 'Sneha Adhyaya', slug: 'Sneha_Adhyaya' },
  { sthana: 1, num: 14, title: 'Sudation Therapies', titleSk: 'Sweda Adhyaya', slug: 'Sweda_Adhyaya' },
  { sthana: 1, num: 15, title: 'Hospital Management and Purification', titleSk: 'Upakalpaniya Adhyaya', slug: 'Upakalpaniya_Adhyaya' },
  { sthana: 1, num: 16, title: 'Assessment in Panchakarma', titleSk: 'Chikitsaprabhritiya Adhyaya', slug: 'Chikitsaprabhritiya_Adhyaya' },
  { sthana: 1, num: 17, title: 'Diseases of three vital organs', titleSk: 'Kiyanta Shiraseeya Adhyaya', slug: 'Kiyanta_Shiraseeya_Adhyaya' },
  { sthana: 1, num: 18, title: 'Three Types of Swellings', titleSk: 'Trishothiya Adhyaya', slug: 'Trishothiya_Adhyaya' },
  { sthana: 1, num: 19, title: 'Numerical Classification of Diseases', titleSk: 'Ashtodariya Adhyaya', slug: 'Ashtodariya_Adhyaya' },
  { sthana: 1, num: 20, title: 'Dosha specific classification', titleSk: 'Maharoga Adhyaya', slug: 'Maharoga_Adhyaya' },
  { sthana: 1, num: 21, title: 'Eight Undesirable Constitutions', titleSk: 'Ashtauninditiya Adhyaya', slug: 'Ashtauninditiya_Adhyaya' },
  { sthana: 1, num: 22, title: 'Reduction and nourishing therapies', titleSk: 'Langhanabrimhaniya Adhyaya', slug: 'Langhanabrimhaniya_Adhyaya' },
  { sthana: 1, num: 23, title: 'Over-nutrition and under-nutrition', titleSk: 'Santarpaniya Adhyaya', slug: 'Santarpaniya_Adhyaya' },
  { sthana: 1, num: 24, title: 'Characteristics of Blood', titleSk: 'Vidhishonitiya Adhyaya', slug: 'Vidhishonitiya_Adhyaya' },
  { sthana: 1, num: 25, title: 'Origin of Human Beings', titleSk: 'Yajjah Purushiya Adhyaya', slug: 'Yajjah_Purushiya_Adhyaya' },
  { sthana: 1, num: 26, title: 'Pharmacological principles of diet', titleSk: 'Atreyabhadrakapyiya Adhyaya', slug: 'Atreyabhadrakapyiya_Adhyaya' },
  { sthana: 1, num: 27, title: 'Classification of food and beverages', titleSk: 'Annapanavidhi Adhyaya', slug: 'Annapanavidhi_Adhyaya' },
  { sthana: 1, num: 28, title: 'Sequential effects of food', titleSk: 'Vividhashitapitiya Adhyaya', slug: 'Vividhashitapitiya_Adhyaya' },
  { sthana: 1, num: 29, title: 'Ten Seats of Life Forces', titleSk: 'Dashapranayataneeya Adhyaya', slug: 'Dashapranayataneeya_Adhyaya' },
  { sthana: 1, num: 30, title: 'Ten great vessels from Heart', titleSk: 'Arthedashmahamooliya Adhyaya', slug: 'Arthedashmahamooliya_Adhyaya' },
  // Nidana Sthana (8)
  { sthana: 2, num: 1, title: 'Fever diagnosis', titleSk: 'Jwara Nidana Adhyaya', slug: 'Jwara_Nidana_Adhyaya' },
  { sthana: 2, num: 2, title: 'Bleeding Disorders', titleSk: 'Raktapitta Nidana Adhyaya', slug: 'Raktapitta_Nidana_Adhyaya' },
  { sthana: 2, num: 3, title: 'Abdominal lumps', titleSk: 'Gulma Nidana Adhyaya', slug: 'Gulma_Nidana_Adhyaya' },
  { sthana: 2, num: 4, title: 'Urinary Disorders', titleSk: 'Prameha Nidana Adhyaya', slug: 'Prameha_Nidana_Adhyaya' },
  { sthana: 2, num: 5, title: 'Skin diseases', titleSk: 'Kushtha Nidana Adhyaya', slug: 'Kushtha_Nidana_Adhyaya' },
  { sthana: 2, num: 6, title: 'Wasting disease', titleSk: 'Shosha Nidana Adhyaya', slug: 'Shosha_Nidana_Adhyaya' },
  { sthana: 2, num: 7, title: 'Psychosis', titleSk: 'Unmada Nidana Adhyaya', slug: 'Unmada_Nidana_Adhyaya' },
  { sthana: 2, num: 8, title: 'Seizure disorders', titleSk: 'Apasmara Nidana Adhyaya', slug: 'Apasmara_Nidana_Adhyaya' },
  // Vimana Sthana (8)
  { sthana: 3, num: 1, title: 'Taste-based factors', titleSk: 'Rasa Vimana Adhyaya', slug: 'Rasa_Vimana_Adhyaya' },
  { sthana: 3, num: 2, title: 'Three parts of abdomen', titleSk: 'Trividhakukshiya Vimana Adhyaya', slug: 'Trividhakukshiya_Vimana_Adhyaya' },
  { sthana: 3, num: 3, title: 'Destruction of communities', titleSk: 'Janapadodhvansaniya Vimana Adhyaya', slug: 'Janapadodhvansaniya_Vimana_Adhyaya' },
  { sthana: 3, num: 4, title: 'Three methods for disease knowledge', titleSk: 'Trividha Roga Vishesha Vijnaniya Vimana', slug: 'Trividha_Roga_Vishesha_Vijnaniya_Vimana_Adhyaya' },
  { sthana: 3, num: 5, title: 'Channels of transport', titleSk: 'Sroto Vimana Adhyaya', slug: 'Sroto_Vimana_Adhyaya' },
  { sthana: 3, num: 6, title: 'Classification of Diseases', titleSk: 'Roganika Vimana Adhyaya', slug: 'Roganika_Vimana_Adhyaya' },
  { sthana: 3, num: 7, title: 'Types of patients', titleSk: 'Vyadhita Rupiya Vimana Adhyaya', slug: 'Vyadhita_Rupiya_Vimana_Adhyaya' },
  { sthana: 3, num: 8, title: 'Conquering debate and disease', titleSk: 'Rogabhishagjitiya Vimana Adhyaya', slug: 'Rogabhishagjitiya_Vimana_Adhyaya' },
  // Sharira Sthana (8)
  { sthana: 4, num: 1, title: 'Holistic human being', titleSk: 'Katidhapurusha Sharira Adhyaya', slug: 'Katidhapurusha_Sharira_Adhyaya' },
  { sthana: 4, num: 2, title: 'Clans and human birth', titleSk: 'Atulyagotriya Sharira Adhyaya', slug: 'Atulyagotriya_Sharira_Adhyaya' },
  { sthana: 4, num: 3, title: 'Embryogenesis factors', titleSk: 'Khuddika Garbhavakranti Sharira', slug: 'Khuddika_Garbhavakranti_Sharira_Adhyaya' },
  { sthana: 4, num: 4, title: 'Embryonic development', titleSk: 'Mahatigarbhavakranti Sharira', slug: 'Mahatigarbhavakranti_Sharira_Adhyaya' },
  { sthana: 4, num: 5, title: 'Study of human being', titleSk: 'Purusha Vichaya Sharira Adhyaya', slug: 'Purusha_Vichaya_Sharira_Adhyaya' },
  { sthana: 4, num: 6, title: 'Analytical study of body', titleSk: 'Sharira Vichaya Sharira Adhyaya', slug: 'Sharira_Vichaya_Sharira_Adhyaya' },
  { sthana: 4, num: 7, title: 'Numerological account', titleSk: 'Sharira Sankhya Sharira Adhyaya', slug: 'Sharira_Sankhya_Sharira_Adhyaya' },
  { sthana: 4, num: 8, title: 'Obstetrics and neonatal care', titleSk: 'Jatisutriya Sharira Adhyaya', slug: 'Jatisutriya_Sharira_Adhyaya' },
  // Indriya Sthana (12)
  { sthana: 5, num: 1, title: 'Fatal signs in complexion/voice', titleSk: 'Varnasvariyam Indriyam Adhyaya', slug: 'Varnasvariyam_Indriyam_Adhyaya' },
  { sthana: 5, num: 2, title: 'Tactile and olfactory fatal signs', titleSk: 'Pushpitakam Indriyam Adhyaya', slug: 'Pushpitakam_Indriyam_Adhyaya' },
  { sthana: 5, num: 3, title: 'Palpable signs of death', titleSk: 'Parimarshaneeyam Indriyam Adhyaya', slug: 'Parimarshaneeyam_Indriyam_Adhyaya' },
  { sthana: 5, num: 4, title: 'Fatal signs in five senses', titleSk: 'Indriyaneekam Indriyam Adhyaya', slug: 'Indriyaneekam_Indriyam_Adhyaya' },
  { sthana: 5, num: 5, title: 'Prodromal symptoms prognosis', titleSk: 'Purvarupeeyam Indriyam Adhyaya', slug: 'Purvarupeeyam_Indriyam_Adhyaya' },
  { sthana: 5, num: 6, title: 'Fatal clinical features', titleSk: 'Katamanisharireeyam Indriyam Adhyaya', slug: 'Katamanisharireeyam_Indriyam_Adhyaya' },
  { sthana: 5, num: 7, title: 'Shadows and luster signs', titleSk: 'Pannarupiyam Indriyam Adhyaya', slug: 'Pannarupiyam_Indriyam_Adhyaya' },
  { sthana: 5, num: 8, title: 'Inverted shadow signs', titleSk: 'Avakshiraseeyam Indriyam Adhyaya', slug: 'Avakshiraseeyam_Indriyam_Adhyaya' },
  { sthana: 5, num: 9, title: 'Palliative care signs', titleSk: 'Yasyashyavanimittiyam Indriyam', slug: 'Yasyashyavanimittiyam_Indriyam_Adhyaya' },
  { sthana: 5, num: 10, title: 'Signs of instant death', titleSk: 'Sadyomaraneeyam Indriyam Adhyaya', slug: 'Sadyomaraneeyam_Indriyam_Adhyaya' },
  { sthana: 5, num: 11, title: 'Death from diminished Agni', titleSk: 'Anujyotiyam Indriyam Adhyaya', slug: 'Anujyotiyam_Indriyam_Adhyaya' },
  { sthana: 5, num: 12, title: 'Messenger characteristics', titleSk: 'Gomayachurniyam Indriyam Adhyaya', slug: 'Gomayachurniyam_Indriyam_Adhyaya' },
  // Chikitsa Sthana (30)
  { sthana: 6, num: 1, title: 'Rejuvenation therapy', titleSk: 'Rasayana Adhyaya', slug: 'Rasayana_Adhyaya' },
  { sthana: 6, num: 2, title: 'Aphrodisiac therapy', titleSk: 'Vajikarana Adhyaya', slug: 'Vajikarana_Adhyaya' },
  { sthana: 6, num: 3, title: 'Fever treatment', titleSk: 'Jwara Chikitsa Adhyaya', slug: 'Jwara_Chikitsa_Adhyaya' },
  { sthana: 6, num: 4, title: 'Bleeding disorders treatment', titleSk: 'Raktapitta Chikitsa Adhyaya', slug: 'Raktapitta_Chikitsa_Adhyaya' },
  { sthana: 6, num: 5, title: 'Abdominal lumps treatment', titleSk: 'Gulma Chikitsa Adhyaya', slug: 'Gulma_Chikitsa_Adhyaya' },
  { sthana: 6, num: 6, title: 'Diabetes treatment', titleSk: 'Prameha Chikitsa Adhyaya', slug: 'Prameha_Chikitsa_Adhyaya' },
  { sthana: 6, num: 7, title: 'Skin diseases treatment', titleSk: 'Kushtha Chikitsa Adhyaya', slug: 'Kushtha_Chikitsa_Adhyaya' },
  { sthana: 6, num: 8, title: 'Wasting diseases treatment', titleSk: 'Rajayakshma Chikitsa Adhyaya', slug: 'Rajayakshma_Chikitsa_Adhyaya' },
  { sthana: 6, num: 9, title: 'Psychosis treatment', titleSk: 'Unmada Chikitsa Adhyaya', slug: 'Unmada_Chikitsa_Adhyaya' },
  { sthana: 6, num: 10, title: 'Seizure disorders treatment', titleSk: 'Apasmara Chikitsa Adhyaya', slug: 'Apasmara_Chikitsa_Adhyaya' },
  { sthana: 6, num: 11, title: 'Emaciation treatment', titleSk: 'Kshatakshina Chikitsa Adhyaya', slug: 'Kshatakshina_Chikitsa_Adhyaya' },
  { sthana: 6, num: 12, title: 'Swellings treatment', titleSk: 'Shvayathu Chikitsa Adhyaya', slug: 'Shvayathu_Chikitsa_Adhyaya' },
  { sthana: 6, num: 13, title: 'Abdominal enlargement', titleSk: 'Udara Chikitsa Adhyaya', slug: 'Udara_Chikitsa_Adhyaya' },
  { sthana: 6, num: 14, title: 'Hemorrhoids', titleSk: 'Arsha Chikitsa Adhyaya', slug: 'Arsha_Chikitsa_Adhyaya' },
  { sthana: 6, num: 15, title: 'Digestive disorders', titleSk: 'Grahani Chikitsa Adhyaya', slug: 'Grahani_Chikitsa_Adhyaya' },
  { sthana: 6, num: 16, title: 'Anemia', titleSk: 'Pandu Chikitsa Adhyaya', slug: 'Pandu_Chikitsa_Adhyaya' },
  { sthana: 6, num: 17, title: 'Hiccups and Dyspnea', titleSk: 'Hikka Shwasa Chikitsa Adhyaya', slug: 'Hikka_Shwasa_Chikitsa_Adhyaya' },
  { sthana: 6, num: 18, title: 'Cough', titleSk: 'Kasa Chikitsa Adhyaya', slug: 'Kasa_Chikitsa_Adhyaya' },
  { sthana: 6, num: 19, title: 'Diarrhea', titleSk: 'Atisara Chikitsa Adhyaya', slug: 'Atisara_Chikitsa_Adhyaya' },
  { sthana: 6, num: 20, title: 'Vomiting', titleSk: 'Chhardi Chikitsa Adhyaya', slug: 'Chhardi_Chikitsa_Adhyaya' },
  { sthana: 6, num: 21, title: 'Erysipelas', titleSk: 'Visarpa Chikitsa Adhyaya', slug: 'Visarpa_Chikitsa_Adhyaya' },
  { sthana: 6, num: 22, title: 'Morbid thirst', titleSk: 'Trishna Chikitsa Adhyaya', slug: 'Trishna_Chikitsa_Adhyaya' },
  { sthana: 6, num: 23, title: 'Poisoning', titleSk: 'Visha Chikitsa Adhyaya', slug: 'Visha_Chikitsa_Adhyaya' },
  { sthana: 6, num: 24, title: 'Intoxication', titleSk: 'Madatyaya Chikitsa Adhyaya', slug: 'Madatyaya_Chikitsa_Adhyaya' },
  { sthana: 6, num: 25, title: 'Ulcers', titleSk: 'Dwivraniya Chikitsa Adhyaya', slug: 'Dwivraniya_Chikitsa_Adhyaya' },
  { sthana: 6, num: 26, title: 'Three vital organs', titleSk: 'Trimarmiya Chikitsa Adhyaya', slug: 'Trimarmiya_Chikitsa_Adhyaya' },
  { sthana: 6, num: 27, title: 'Thigh and hip diseases', titleSk: 'Urustambha Chikitsa Adhyaya', slug: 'Urustambha_Chikitsa_Adhyaya' },
  { sthana: 6, num: 28, title: 'Vata diseases', titleSk: 'Vatavyadhi Chikitsa Adhyaya', slug: 'Vatavyadhi_Chikitsa_Adhyaya' },
  { sthana: 6, num: 29, title: 'Vata-Rakta disorders', titleSk: 'Vatarakta Chikitsa Adhyaya', slug: 'Vatarakta_Chikitsa_Adhyaya' },
  { sthana: 6, num: 30, title: 'Genital tract disorders', titleSk: 'Yonivyapat Chikitsa Adhyaya', slug: 'Yonivyapat_Chikitsa_Adhyaya' },
  // Kalpa Sthana (12)
  { sthana: 7, num: 1, title: 'Madanaphala preparations', titleSk: 'Madana Kalpa Adhyaya', slug: 'Madana_Kalpa_Adhyaya' },
  { sthana: 7, num: 2, title: 'Jimutaka preparations', titleSk: 'Jimutaka Kalpa Adhyaya', slug: 'Jimutaka_Kalpa_Adhyaya' },
  { sthana: 7, num: 3, title: 'Ikshvaku preparations', titleSk: 'Ikshvaku Kalpa Adhyaya', slug: 'Ikshvaku_Kalpa_Adhyaya' },
  { sthana: 7, num: 4, title: 'Dhamargava preparations', titleSk: 'Dhamargava Kalpa Adhyaya', slug: 'Dhamargava_Kalpa_Adhyaya' },
  { sthana: 7, num: 5, title: 'Vatsaka preparations', titleSk: 'Vatsaka Kalpa Adhyaya', slug: 'Vatsaka_Kalpa_Adhyaya' },
  { sthana: 7, num: 6, title: 'Kritavedhana preparations', titleSk: 'Kritavedhana Kalpa Adhyaya', slug: 'Kritavedhana_Kalpa_Adhyaya' },
  { sthana: 7, num: 7, title: 'Shyama Trivrita preparations', titleSk: 'Shyamatrivrita Kalpa Adhyaya', slug: 'Shyamatrivrita_Kalpa_Adhyaya' },
  { sthana: 7, num: 8, title: 'Chaturangula preparations', titleSk: 'Chaturangula Kalpa Adhyaya', slug: 'Chaturangula_Kalpa_Adhyaya' },
  { sthana: 7, num: 9, title: 'Tilvaka preparations', titleSk: 'Tilvaka Kalpa Adhyaya', slug: 'Tilvaka_Kalpa_Adhyaya' },
  { sthana: 7, num: 10, title: 'Sudha preparations', titleSk: 'Sudha Kalpa Adhyaya', slug: 'Sudha_Kalpa_Adhyaya' },
  { sthana: 7, num: 11, title: 'Saptala and Shankhini', titleSk: 'Saptalashankhini Kalpa', slug: 'Saptalashankhini_Kalpa_Adhyaya' },
  { sthana: 7, num: 12, title: 'Danti and Dravanti', titleSk: 'Dantidravanti Kalpa Adhyaya', slug: 'Dantidravanti_Kalpa_Adhyaya' },
  // Siddhi Sthana (12)
  { sthana: 8, num: 1, title: 'Purification procedures', titleSk: 'Kalpana Siddhi Adhyaya', slug: 'Kalpana_Siddhi_Adhyaya' },
  { sthana: 8, num: 2, title: 'Panchakarma therapies', titleSk: 'Panchakarmiya Siddhi Adhyaya', slug: 'Panchakarmiya_Siddhi_Adhyaya' },
  { sthana: 8, num: 3, title: 'Basti practices', titleSk: 'Bastisutriyam Siddhi Adhyaya', slug: 'Bastisutriyam_Siddhi_Adhyaya' },
  { sthana: 8, num: 4, title: 'Unctuous enema complications', titleSk: 'Snehavyapat Siddhi Adhyaya', slug: 'Snehavyapat_Siddhi_Adhyaya' },
  { sthana: 8, num: 5, title: 'Enema nozzle complications', titleSk: 'Netrabastivyapat Siddhi', slug: 'Netrabastivyapat_Siddhi_Adhyaya' },
  { sthana: 8, num: 6, title: 'Emesis/purgation complications', titleSk: 'Vamana Virechana Vyapat', slug: 'Vamana_Virechana_Vyapat_Siddhi_Adhyaya' },
  { sthana: 8, num: 7, title: 'Enema complications', titleSk: 'Bastivyapat Siddhi Adhyaya', slug: 'Bastivyapat_Siddhi_Adhyaya' },
  { sthana: 8, num: 8, title: 'Enema formulations', titleSk: 'Prasrita Yogiyam Siddhi', slug: 'Prasrita_Yogiyam_Siddhi_Adhyaya' },
  { sthana: 8, num: 9, title: 'Three vital organs treatment', titleSk: 'Trimarmiya Siddhi Adhyaya', slug: 'Trimarmiya_Siddhi_Adhyaya' },
  { sthana: 8, num: 10, title: 'Therapeutic enema success', titleSk: 'Basti Siddhi Adhyaya', slug: 'Basti_Siddhi_Adhyaya' },
  { sthana: 8, num: 11, title: 'Medicinal fruits in enema', titleSk: 'Phalamatra Siddhi Adhyaya', slug: 'Phalamatra_Siddhi_Adhyaya' },
  { sthana: 8, num: 12, title: 'Best therapeutic enema', titleSk: 'Uttar Basti Siddhi Adhyaya', slug: 'Uttar_Basti_Siddhi_Adhyaya' },
]

const STHANA_NAMES = [
  '', 'Sutra Sthana', 'Nidana Sthana', 'Vimana Sthana', 'Sharira Sthana',
  'Indriya Sthana', 'Chikitsa Sthana', 'Kalpa Sthana', 'Siddhi Sthana'
]

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║  Charak Samhita Online - Comprehensive Scraper v2        ║')
  console.log('║  Source: carakasamhitaonline.com                         ║')
  console.log('║  License: CC BY-NC-SA 4.0                                ║')
  console.log('║  Extracting: Devanagari shlokas + English translations   ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  // Create output dirs
  for (let i = 1; i <= 8; i++) {
    fs.mkdirSync(path.join(OUTPUT_DIR, STHANA_NAMES[i].toLowerCase().replace(/\s+/g, '-')), { recursive: true })
  }

  const allChapters: ChapterData[] = []
  const allShlokas: any[] = []

  for (let idx = 0; idx < CHAPTERS.length; idx++) {
    const ch = CHAPTERS[idx]
    const sthanaName = STHANA_NAMES[ch.sthana]
    console.log(`[${idx + 1}/${CHAPTERS.length}] ${sthanaName} Ch.${ch.num}: ${ch.titleSk}...`)

    try {
      const { html, resolvedTitle } = await scrapeChapter(ch.slug)
      await sleep(DELAY_MS)

      // Extract shlokas
      const shlokas = extractShlokasFromHTML(html, ch.title)

      // Extract abstract
      const abstractMatch = html.match(/Abstract<\/strong>[\s\S]*?<\/p>\s*([\s\S]*?)(?=Keywords|<h[23])/i)
      const abstract = abstractMatch ? cleanText(abstractMatch[1].replace(/<[^>]+>/g, '')) : ''

      // Extract keywords
      const kwMatch = html.match(/Keywords<\/strong>\s*:\s*([\s\S]*?)(?=<\/p>|<h[23])/i)
      const keywords = kwMatch ? cleanText(kwMatch[1].replace(/<[^>]+>/g, '')).split(/[,;]/).map(k => k.trim()).filter(Boolean) : []

      // Extract DOI
      const doiMatch = html.match(/doi\.org\/([^\s<"]+)/)
      const doi = doiMatch ? doiMatch[1] : ''

      // Extract title Devanagari from heading
      const titleDevMatch = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/)
      let titleDev = ''
      if (titleDevMatch) {
        const raw = titleDevMatch[0].replace(/<[^>]+>/g, '').trim()
        if (hasDevanagari(raw)) titleDev = raw.normalize('NFC')
      }

      const chapterData: ChapterData = {
        sthana: sthanaName,
        sthanaNumber: ch.sthana,
        chapterNumber: ch.num,
        titleEnglish: ch.title,
        titleSanskrit: ch.titleSk,
        titleDevanagari: titleDev,
        abstract,
        keywords,
        introduction: '',
        shlokas,
        tattvaVimarsha: extractSection(html, 'Tattva Vimarsha'),
        vidhiVimarsha: extractSection(html, 'Vidhi Vimarsha'),
        url: `${BASE_URL}/index.php?title=${ch.slug}`,
        doi
      }

      allChapters.push(chapterData)

      // Add shlokas to flat array for search
      for (const sh of shlokas) {
        allShlokas.push({
          ...sh,
          sthana: sthanaName,
          sthanaNumber: ch.sthana,
          chapterNumber: ch.num,
          chapterTitle: ch.title,
          chapterTitleSanskrit: ch.titleSk,
        })
      }

      // Save individual chapter
      const sthanaDir = path.join(OUTPUT_DIR, sthanaName.toLowerCase().replace(/\s+/g, '-'))
      fs.writeFileSync(
        path.join(sthanaDir, `chapter-${ch.num.toString().padStart(2, '0')}.json`),
        JSON.stringify(chapterData, null, 2),
        'utf-8'
      )

      console.log(`  -> ${shlokas.length} shlokas found`)

    } catch (err) {
      console.error(`  ERROR: ${(err as Error).message}`)
    }
  }

  // Save combined index
  const index = {
    source: 'carakasamhitaonline.com',
    license: 'CC BY-NC-SA 4.0',
    scrapedAt: new Date().toISOString(),
    totalChapters: allChapters.length,
    totalShlokas: allShlokas.length,
    sthanas: Array.from({ length: 8 }, (_, i) => {
      const num = i + 1
      const chs = allChapters.filter(ch => ch.sthanaNumber === num)
      return {
        number: num,
        name: STHANA_NAMES[num],
        chapterCount: chs.length,
        shlokaCount: chs.reduce((s, ch) => s + ch.shlokas.length, 0)
      }
    }),
    chapters: allChapters.map(ch => ({
      sthana: ch.sthana,
      sthanaNumber: ch.sthanaNumber,
      chapterNumber: ch.chapterNumber,
      title: ch.titleEnglish,
      titleSanskrit: ch.titleSanskrit,
      shlokaCount: ch.shlokas.length,
    }))
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'charak-samhita-online.json'), JSON.stringify(index, null, 2), 'utf-8')
  fs.writeFileSync(path.join(OUTPUT_DIR, 'all-shlokas.json'), JSON.stringify(allShlokas, null, 2), 'utf-8')

  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║  SCRAPING COMPLETE                                        ║')
  console.log(`║  Total Chapters: ${allChapters.length.toString().padStart(3)}                                   ║`)
  console.log(`║  Total Shlokas: ${allShlokas.length.toString().padStart(5)}                                 ║`)
  console.log('╚════════════════════════════════════════════════════════════╝')
}

main().catch(console.error)
