import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = 'https://www.carakasamhitaonline.com'
const DELAY = 500

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function cleanText(text: string): string {
  return text
    .replace(/\[\[\d+\]\]/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[edit[^]]*\]/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(parseInt(code)))
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchPage(url: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'TattvaVimarshaScraper/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirect = res.headers.location
        if (redirect) {
          fetchPage(redirect.startsWith('http') ? redirect : BASE_URL + redirect)
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
}

async function fetchJSON(url: string): Promise<any> {
  const text = await fetchPage(url)
  return JSON.parse(text)
}

async function scrapeChapter(slug: string): Promise<{ html: string; resolvedTitle: string }> {
  const queryUrl = `${BASE_URL}/api.php?action=query&titles=${encodeURIComponent(slug)}&redirects&format=json`
  const queryData = await fetchJSON(queryUrl)
  const resolvedTitle = queryData.query?.redirects?.[0]?.to || queryData.query?.normalized?.[0]?.to || slug

  const url = `${BASE_URL}/api.php?action=parse&page=${encodeURIComponent(resolvedTitle)}&format=json&prop=text`
  const data = await fetchJSON(url)
  return { html: data.parse?.text?.['*'] || '', resolvedTitle }
}

interface SectionContent {
  title: string
  content: string
  subsections: { title: string; content: string }[]
}

function extractSection(html: string, startMarker: string, endMarker: string): SectionContent {
  // Use text-based matching instead of id-based
  // The TOC has these markers, so we need to find them AFTER the TOC
  // TOC ends at the first </ul> after toclevel-1
  const tocEnd = html.indexOf('</ul>', html.indexOf('toclevel-1'))
  const searchFrom = tocEnd > -1 ? tocEnd + 5 : 0

  // Find start - look for the heading span with the id AFTER the TOC
  let startIdx = -1
  // Pattern: <span id="Tattva_Vimarsha_.28Fundamental_Principles.29">
  const startPatterns = [
    'Tattva_Vimarsha_.28Fundamental_Principles.29',
    'Tattva_Vimarsha_(Fundamental_Principles)',
    'Tattva_Vimarsha'
  ]
  for (const pat of startPatterns) {
    const idx = html.indexOf(pat, searchFrom)
    if (idx > searchFrom && idx !== -1) {
      // Make sure this is an actual section heading, not a TOC link
      const before = html.substring(Math.max(0, idx - 100), idx)
      if (!before.includes('toclevel') && !before.includes('href=')) {
        startIdx = idx
        break
      }
    }
  }

  if (startIdx === -1) return { title: '', content: '', subsections: [] }

  // Find end - look for the next section heading AFTER start
  let endIdx = -1
  if (endMarker === 'Vidhi_Vimarsha') {
    // Find Vidhi_Vimarsha section heading (not TOC)
    const patterns = [
      'Vidhi_Vimarsha_.28Applied_Inferences.29',
      'Vidhi_Vimarsha_(Applied_Inferences)',
      'Vidhi_Vimarsha'
    ]
    for (const pat of patterns) {
      const idx = html.indexOf(pat, startIdx + 100)
      if (idx > startIdx + 100 && idx !== -1) {
        const before = html.substring(Math.max(0, idx - 100), idx)
        if (!before.includes('toclevel') && !before.includes('href=')) {
          endIdx = idx
          break
        }
      }
    }
    if (endIdx === -1) {
      endIdx = html.indexOf('id="References', startIdx)
    }
  } else if (endMarker === 'References') {
    endIdx = html.indexOf('id="References', startIdx)
  } else {
    endIdx = html.indexOf(endMarker, startIdx + 100)
  }

  if (endIdx === -1 || endIdx <= startIdx) {
    endIdx = Math.min(startIdx + 50000, html.length)
  }

  const sectionHtml = html.substring(startIdx, endIdx)

  // Extract title
  const titleMatch = sectionHtml.match(/<h[23][^>]*>[\s\S]*?<\/h[23]>/)
  const title = titleMatch ? cleanText(titleMatch[0].replace(/<[^>]*>/g, '')) : startMarker.replace(/_/g, ' ')

  // Extract paragraphs
  const paragraphs: string[] = []
  const pMatches = sectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)
  for (const m of pMatches) {
    let text = m[1].replace(/<[^>]+>/g, ' ')
    text = cleanText(text)
    if (text.length > 5) paragraphs.push(text)
  }

  // Extract subsections
  const subsections: { title: string; content: string }[] = []
  const subHeadings = [...sectionHtml.matchAll(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/g)]

  for (let i = 0; i < subHeadings.length; i++) {
    const subTitle = cleanText(subHeadings[i][0].replace(/<[^>]*>/g, ''))
    const subStart = subHeadings[i].index! + subHeadings[i][0].length
    const subEnd = i + 1 < subHeadings.length ? subHeadings[i + 1].index! : sectionHtml.length
    const subHtml = sectionHtml.substring(subStart, subEnd)

    const subParagraphs: string[] = []
    const subPMatches = subHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)
    for (const m of subPMatches) {
      let text = m[1].replace(/<[^>]+>/g, ' ')
      text = cleanText(text)
      if (text.length > 5) subParagraphs.push(text)
    }

    if (subParagraphs.length > 0) {
      subsections.push({ title: subTitle, content: subParagraphs.join('\n\n') })
    }
  }

  const content = paragraphs.join('\n\n')

  return { title, content, subsections }
}

// ── Chapter Definitions ─────────────────────────────────────────────────────

const CHAPTERS: { sthana: number; sthanaName: string; num: number; title: string; slug: string }[] = [
  // Sutra Sthana (30)
  { sthana: 1, sthanaName: 'Sutra', num: 1, title: 'Deerghanjiviteeya', slug: 'Deerghanjiviteeya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 2, title: 'Apamarga Tanduliya', slug: 'Apamarga_Tanduliya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 3, title: 'Aragvadhiya', slug: 'Aragvadhiya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 4, title: 'Shadvirechanashatashritiya', slug: 'Shadvirechanashatashritiya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 5, title: 'Matrashiteeya', slug: 'Matrashiteeya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 6, title: 'Tasyashiteeya', slug: 'Tasyashiteeya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 7, title: 'Naveganadharaniya', slug: 'Naveganadharaniya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 8, title: 'Indriyopakramaniya', slug: 'Indriyopakramaniya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 9, title: 'Khuddakachatushpada', slug: 'Khuddakachatushpada_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 10, title: 'Mahachatushpada', slug: 'Mahachatushpada_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 11, title: 'Tistraishaniya', slug: 'Tistraishaniya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 12, title: 'Vatakalakaliya', slug: 'Vatakalakaliya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 13, title: 'Sneha Adhyaya', slug: 'Sneha_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 14, title: 'Sweda Adhyaya', slug: 'Sweda_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 15, title: 'Upakalpaniya', slug: 'Upakalpaniya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 16, title: 'Chikitsaprabhritiya', slug: 'Chikitsaprabhritiya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 17, title: 'Kiyanta Shiraseeya', slug: 'Kiyanta_Shiraseeya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 18, title: 'Trishothiya', slug: 'Trishothiya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 19, title: 'Ashtodariya', slug: 'Ashtodariya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 20, title: 'Maharoga', slug: 'Maharoga_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 21, title: 'Ashtauninditiya', slug: 'Ashtauninditiya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 22, title: 'Langhanabrimhaniya', slug: 'Langhanabrimhaniya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 23, title: 'Santarpaniya', slug: 'Santarpaniya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 24, title: 'Vidhishonitiya', slug: 'Vidhishonitiya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 25, title: 'Yajjah Purushiya', slug: 'Yajjah_Purushiya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 26, title: 'Atreyabhadrakapyiya', slug: 'Atreyabhadrakapyiya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 27, title: 'Annapanavidhi', slug: 'Annapanavidhi_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 28, title: 'Vividhashitapitiya', slug: 'Vividhashitapitiya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 29, title: 'Dashapranayataneeya', slug: 'Dashapranayataneeya_Adhyaya' },
  { sthana: 1, sthanaName: 'Sutra', num: 30, title: 'Arthedashmahamooliya', slug: 'Arthedashmahamooliya_Adhyaya' },
  // Nidana Sthana (8)
  { sthana: 2, sthanaName: 'Nidana', num: 1, title: 'Jwara Nidana', slug: 'Jwara_Nidana_Adhyaya' },
  { sthana: 2, sthanaName: 'Nidana', num: 2, title: 'Raktapitta Nidana', slug: 'Raktapitta_Nidana_Adhyaya' },
  { sthana: 2, sthanaName: 'Nidana', num: 3, title: 'Gulma Nidana', slug: 'Gulma_Nidana_Adhyaya' },
  { sthana: 2, sthanaName: 'Nidana', num: 4, title: 'Prameha Nidana', slug: 'Prameha_Nidana_Adhyaya' },
  { sthana: 2, sthanaName: 'Nidana', num: 5, title: 'Kushtha Nidana', slug: 'Kushtha_Nidana_Adhyaya' },
  { sthana: 2, sthanaName: 'Nidana', num: 6, title: 'Shosha Nidana', slug: 'Shosha_Nidana_Adhyaya' },
  { sthana: 2, sthanaName: 'Nidana', num: 7, title: 'Unmada Nidana', slug: 'Unmada_Nidana_Adhyaya' },
  { sthana: 2, sthanaName: 'Nidana', num: 8, title: 'Apasmara Nidana', slug: 'Apasmara_Nidana_Adhyaya' },
  // Vimana Sthana (8)
  { sthana: 3, sthanaName: 'Vimana', num: 1, title: 'Rasa Vimana', slug: 'Rasa_Vimana_Adhyaya' },
  { sthana: 3, sthanaName: 'Vimana', num: 2, title: 'Trividhakukshiya Vimana', slug: 'Trividhakukshiya_Vimana_Adhyaya' },
  { sthana: 3, sthanaName: 'Vimana', num: 3, title: 'Janapadodhvansaniya Vimana', slug: 'Janapadodhvansaniya_Vimana_Adhyaya' },
  { sthana: 3, sthanaName: 'Vimana', num: 4, title: 'Trividha Roga Vishesha Vijnaniya Vimana', slug: 'Trividha_Roga_Vishesha_Vijnaniya_Vimana' },
  { sthana: 3, sthanaName: 'Vimana', num: 5, title: 'Sroto Vimana', slug: 'Sroto_Vimana_Adhyaya' },
  { sthana: 3, sthanaName: 'Vimana', num: 6, title: 'Roganika Vimana', slug: 'Roganika_Vimana_Adhyaya' },
  { sthana: 3, sthanaName: 'Vimana', num: 7, title: 'Vyadhita Rupiya Vimana', slug: 'Vyadhita_Rupiya_Vimana_Adhyaya' },
  { sthana: 3, sthanaName: 'Vimana', num: 8, title: 'Rogabhishagjitiya Vimana', slug: 'Rogabhishagjitiya_Vimana_Adhyaya' },
  // Sharira Sthana (8)
  { sthana: 4, sthanaName: 'Sharira', num: 1, title: 'Katidhapurusha Sharira', slug: 'Katidhapurusha_Sharira_Adhyaya' },
  { sthana: 4, sthanaName: 'Sharira', num: 2, title: 'Atulyagotriya Sharira', slug: 'Atulyagotriya_Sharira_Adhyaya' },
  { sthana: 4, sthanaName: 'Sharira', num: 3, title: 'Khuddika Garbhavakranti Sharira', slug: 'Khuddika_Garbhavakranti_Sharira' },
  { sthana: 4, sthanaName: 'Sharira', num: 4, title: 'Mahatigarbhavakranti Sharira', slug: 'Mahatigarbhavakranti_Sharira' },
  { sthana: 4, sthanaName: 'Sharira', num: 5, title: 'Purusha Vichaya Sharira', slug: 'Purusha_Vichaya_Sharira_Adhyaya' },
  { sthana: 4, sthanaName: 'Sharira', num: 6, title: 'Sharira Vichaya Sharira', slug: 'Sharira_Vichaya_Sharira_Adhyaya' },
  { sthana: 4, sthanaName: 'Sharira', num: 7, title: 'Sharira Sankhya Sharira', slug: 'Sharira_Sankhya_Sharira_Adhyaya' },
  { sthana: 4, sthanaName: 'Sharira', num: 8, title: 'Jatisutriya Sharira', slug: 'Jatisutriya_Sharira_Adhyaya' },
  // Indriya Sthana (12)
  { sthana: 5, sthanaName: 'Indriya', num: 1, title: 'Varnasvariyam Indriyam', slug: 'Varnasvariyam_Indriyam_Adhyaya' },
  { sthana: 5, sthanaName: 'Indriya', num: 2, title: 'Pushpitakam Indriyam', slug: 'Pushpitakam_Indriyam_Adhyaya' },
  { sthana: 5, sthanaName: 'Indriya', num: 3, title: 'Parimarshaneeyam Indriyam', slug: 'Parimarshaneeyam_Indriyam_Adhyaya' },
  { sthana: 5, sthanaName: 'Indriya', num: 4, title: 'Indriyaneekam Indriyam', slug: 'Indriyaneekam_Indriyam_Adhyaya' },
  { sthana: 5, sthanaName: 'Indriya', num: 5, title: 'Purvarupeeyam Indriyam', slug: 'Purvarupeeyam_Indriyam_Adhyaya' },
  { sthana: 5, sthanaName: 'Indriya', num: 6, title: 'Katamanisharireeyam Indriyam', slug: 'Katamanisharireeyam_Indriyam_Adhyaya' },
  { sthana: 5, sthanaName: 'Indriya', num: 7, title: 'Pannarupiyam Indriyam', slug: 'Pannarupiyam_Indriyam_Adhyaya' },
  { sthana: 5, sthanaName: 'Indriya', num: 8, title: 'Avakshiraseeyam Indriyam', slug: 'Avakshiraseeyam_Indriyam_Adhyaya' },
  { sthana: 5, sthanaName: 'Indriya', num: 9, title: 'Yasyashyavanimittiyam Indriyam', slug: 'Yasyashyavanimittiyam_Indriyam' },
  { sthana: 5, sthanaName: 'Indriya', num: 10, title: 'Sadyomaraneeyam Indriyam', slug: 'Sadyomaraneeyam_Indriyam_Adhyaya' },
  { sthana: 5, sthanaName: 'Indriya', num: 11, title: 'Anujyotiyam Indriyam', slug: 'Anujyotiyam_Indriyam_Adhyaya' },
  { sthana: 5, sthanaName: 'Indriya', num: 12, title: 'Gomayachurniyam Indriyam', slug: 'Gomayachurniyam_Indriyam_Adhyaya' },
  // Chikitsa Sthana (30)
  { sthana: 6, sthanaName: 'Chikitsa', num: 1, title: 'Rasayana Adhyaya', slug: 'Rasayana_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 2, title: 'Vajikarana Adhyaya', slug: 'Vajikarana_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 3, title: 'Jwara Chikitsa', slug: 'Jwara_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 4, title: 'Raktapitta Chikitsa', slug: 'Raktapitta_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 5, title: 'Gulma Chikitsa', slug: 'Gulma_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 6, title: 'Prameha Chikitsa', slug: 'Prameha_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 7, title: 'Kushtha Chikitsa', slug: 'Kushtha_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 8, title: 'Rajayakshma Chikitsa', slug: 'Rajayakshma_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 9, title: 'Unmada Chikitsa', slug: 'Unmada_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 10, title: 'Apasmara Chikitsa', slug: 'Apasmara_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 11, title: 'Kshatakshina Chikitsa', slug: 'Kshatakshina_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 12, title: 'Shvayathu Chikitsa', slug: 'Shvayathu_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 13, title: 'Udara Chikitsa', slug: 'Udara_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 14, title: 'Arsha Chikitsa', slug: 'Arsha_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 15, title: 'Grahani Chikitsa', slug: 'Grahani_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 16, title: 'Pandu Chikitsa', slug: 'Pandu_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 17, title: 'Hikka Shwasa Chikitsa', slug: 'Hikka_Shwasa_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 18, title: 'Kasa Chikitsa', slug: 'Kasa_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 19, title: 'Atisara Chikitsa', slug: 'Atisara_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 20, title: 'Chhardi Chikitsa', slug: 'Chhardi_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 21, title: 'Visarpa Chikitsa', slug: 'Visarpa_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 22, title: 'Trishna Chikitsa', slug: 'Trishna_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 23, title: 'Visha Chikitsa', slug: 'Visha_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 24, title: 'Madatyaya Chikitsa', slug: 'Madatyaya_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 25, title: 'Dwivraniya Chikitsa', slug: 'Dwivraniya_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 26, title: 'Trimarmiya Chikitsa', slug: 'Trimarmiya_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 27, title: 'Urustambha Chikitsa', slug: 'Urustambha_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 28, title: 'Vatavyadhi Chikitsa', slug: 'Vatavyadhi_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 29, title: 'Vatarakta Chikitsa', slug: 'Vatarakta_Chikitsa_Adhyaya' },
  { sthana: 6, sthanaName: 'Chikitsa', num: 30, title: 'Yonivyapat Chikitsa', slug: 'Yonivyapat_Chikitsa_Adhyaya' },
  // Kalpa Sthana (12)
  { sthana: 7, sthanaName: 'Kalpa', num: 1, title: 'Madana Kalpa', slug: 'Madana_Kalpa_Adhyaya' },
  { sthana: 7, sthanaName: 'Kalpa', num: 2, title: 'Jimutaka Kalpa', slug: 'Jimutaka_Kalpa_Adhyaya' },
  { sthana: 7, sthanaName: 'Kalpa', num: 3, title: 'Ikshvaku Kalpa', slug: 'Ikshvaku_Kalpa_Adhyaya' },
  { sthana: 7, sthanaName: 'Kalpa', num: 4, title: 'Dhamargava Kalpa', slug: 'Dhamargava_Kalpa_Adhyaya' },
  { sthana: 7, sthanaName: 'Kalpa', num: 5, title: 'Vatsaka Kalpa', slug: 'Vatsaka_Kalpa_Adhyaya' },
  { sthana: 7, sthanaName: 'Kalpa', num: 6, title: 'Kritavedhana Kalpa', slug: 'Kritavedhana_Kalpa_Adhyaya' },
  { sthana: 7, sthanaName: 'Kalpa', num: 7, title: 'Shyamatrivrita Kalpa', slug: 'Shyamatrivrita_Kalpa_Adhyaya' },
  { sthana: 7, sthanaName: 'Kalpa', num: 8, title: 'Chaturangula Kalpa', slug: 'Chaturangula_Kalpa_Adhyaya' },
  { sthana: 7, sthanaName: 'Kalpa', num: 9, title: 'Tilvaka Kalpa', slug: 'Tilvaka_Kalpa_Adhyaya' },
  { sthana: 7, sthanaName: 'Kalpa', num: 10, title: 'Sudha Kalpa', slug: 'Sudha_Kalpa_Adhyaya' },
  { sthana: 7, sthanaName: 'Kalpa', num: 11, title: 'Saptalashankhini Kalpa', slug: 'Saptalashankhini_Kalpa' },
  { sthana: 7, sthanaName: 'Kalpa', num: 12, title: 'Dantidravanti Kalpa', slug: 'Dantidravanti_Kalpa_Adhyaya' },
  // Siddhi Sthana (12)
  { sthana: 8, sthanaName: 'Siddhi', num: 1, title: 'Kalpana Siddhi', slug: 'Kalpana_Siddhi_Adhyaya' },
  { sthana: 8, sthanaName: 'Siddhi', num: 2, title: 'Panchakarmiya Siddhi', slug: 'Panchakarmiya_Siddhi_Adhyaya' },
  { sthana: 8, sthanaName: 'Siddhi', num: 3, title: 'Bastisutriyam Siddhi', slug: 'Bastisutriyam_Siddhi_Adhyaya' },
  { sthana: 8, sthanaName: 'Siddhi', num: 4, title: 'Snehavyapat Siddhi', slug: 'Snehavyapat_Siddhi_Adhyaya' },
  { sthana: 8, sthanaName: 'Siddhi', num: 5, title: 'Netrabastivyapat Siddhi', slug: 'Netrabastivyapat_Siddhi' },
  { sthana: 8, sthanaName: 'Siddhi', num: 6, title: 'Vamana Virechana Vyapat Siddhi', slug: 'Vamana_Virechana_Vyapat_Siddhi' },
  { sthana: 8, sthanaName: 'Siddhi', num: 7, title: 'Bastivyapat Siddhi', slug: 'Bastivyapat_Siddhi_Adhyaya' },
  { sthana: 8, sthanaName: 'Siddhi', num: 8, title: 'Prasrita Yogiyam Siddhi', slug: 'Prasrita_Yogiyam_Siddhi' },
  { sthana: 8, sthanaName: 'Siddhi', num: 9, title: 'Trimarmiya Siddhi', slug: 'Trimarmiya_Siddhi_Adhyaya' },
  { sthana: 8, sthanaName: 'Siddhi', num: 10, title: 'Basti Siddhi', slug: 'Basti_Siddhi_Adhyaya' },
  { sthana: 8, sthanaName: 'Siddhi', num: 11, title: 'Phalamatra Siddhi', slug: 'Phalamatra_Siddhi_Adhyaya' },
  { sthana: 8, sthanaName: 'Siddhi', num: 12, title: 'Uttar Basti Siddhi', slug: 'Uttar_Basti_Siddhi_Adhyaya' },
]

// ── Main ────────────────────────────────────────────────────────────────────

interface TattvaVimarshaResult {
  chapterNumber: number
  sthana: string
  sthanaNumber: number
  chapterTitle: string
  tattvaVimarsha: SectionContent
  vidhiVimarsha: SectionContent
}

async function main() {
  const allResults: TattvaVimarshaResult[] = []
  const failed: string[] = []

  console.log('='.repeat(60))
  console.log('  Charak Samhita - Tattva & Vidhi Vimarsha Scraper')
  console.log('  Source: carakasamhitaonline.com (CC BY-NC-SA 4.0)')
  console.log('  Extracting: Tattva Vimarsha + Vidhi Vimarsha')
  console.log('='.repeat(60))

  for (let i = 0; i < CHAPTERS.length; i++) {
    const ch = CHAPTERS[i]
    const label = `[${i + 1}/${CHAPTERS.length}] ${ch.sthanaName} Sthana Ch.${ch.num}: ${ch.title}`

    try {
      process.stdout.write(`${label}...`)
      const { html } = await scrapeChapter(ch.slug)

      const tattvaVimarsha = extractSection(html, 'Tattva_Vimarsha', 'Vidhi_Vimarsha')
      const vidhiVimarsha = extractSection(html, 'Vidhi_Vimarsha', 'References')

      allResults.push({
        chapterNumber: ch.num,
        sthana: ch.sthanaName,
        sthanaNumber: ch.sthana,
        chapterTitle: ch.title,
        tattvaVimarsha,
        vidhiVimarsha
      })

      const tvLen = tattvaVimarsha.content.length
      const vhLen = vidhiVimarsha.content.length
      console.log(` TV:${tvLen}ch VH:${vhLen}ch ${tattvaVimarsha.subsections.length}+${vidhiVimarsha.subsections.length} subsections`)
    } catch (err: any) {
      console.log(` FAILED: ${err.message}`)
      failed.push(`${ch.sthanaName} Ch.${ch.num}: ${err.message}`)
    }

    await sleep(DELAY)
  }

  // Save results
  const outDir = path.join(__dirname, '..', 'knowledge-base', 'carak-samhita')
  const outFile = path.join(outDir, 'tattva-vidhi-vimarsha.json')
  fs.writeFileSync(outFile, JSON.stringify(allResults, null, 2), 'utf-8')

  // Summary
  const tvTotal = allResults.filter(r => r.tattvaVimarsha.content.length > 0).length
  const vhTotal = allResults.filter(r => r.vidhiVimarsha.content.length > 0).length
  const tvChars = allResults.reduce((s, r) => s + r.tattvaVimarsha.content.length, 0)
  const vhChars = allResults.reduce((s, r) => s + r.vidhiVimarsha.content.length, 0)
  const tvSubs = allResults.reduce((s, r) => s + r.tattvaVimarsha.subsections.length, 0)
  const vhSubs = allResults.reduce((s, r) => s + r.vidhiVimarsha.subsections.length, 0)

  console.log('\n' + '='.repeat(60))
  console.log('  SCRAPING COMPLETE')
  console.log(`  Total Chapters: ${CHAPTERS.length}`)
  console.log(`  Tattva Vimarsha: ${tvTotal} chapters, ${tvChars} chars, ${tvSubs} subsections`)
  console.log(`  Vidhi Vimarsha: ${vhTotal} chapters, ${vhChars} chars, ${vhSubs} subsections`)
  if (failed.length > 0) {
    console.log(`  Failed: ${failed.length}`)
    for (const f of failed) console.log(`    - ${f}`)
  }
  console.log('='.repeat(60))
}

main().catch(console.error)
