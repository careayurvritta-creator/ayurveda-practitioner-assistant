import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const INPUT_FILE = path.join(__dirname, '..', 'knowledge-base', 'carak-samhita', 'all-shlokas.json')
const OUTPUT_FILE = path.join(__dirname, '..', 'knowledge-base', 'carak-samhita', 'all-shlokas-clean.json')

interface Shloka {
  verseNumber: number
  devanagari: string
  english: string
  section: string
  sthana: string
  sthanaNumber: number
  chapterNumber: number
  chapterTitle: string
  chapterTitleSanskrit: string
}

function isHunterian(text: string): boolean {
  // Hunterian uses ASCII with ~, ^, and capital letters for transliteration
  // Examples: dIrghaM, bhagavAnAtreyaH, jIvitamanvicchanbharadvAja
  return /^[a-zA-Z~^().,\s]+$/.test(text.trim()) && /[~^]/.test(text)
}

function cleanEnglishTranslation(raw: string): string {
  if (!raw || raw.trim().length === 0) return ''

  // Split by lines or common separators
  const lines = raw.split(/\n/).map(l => l.trim()).filter(l => l.length > 0)

  let englishLines: string[] = []

  for (const line of lines) {
    // Skip Hunterian lines
    if (isHunterian(line)) continue

    // Skip lines that are purely verse numbers like ||1|| or ||१||
    if (/^[\|॥\d०-९\s]+$/.test(line)) continue

    // Skip lines that look like verse references [1-2] or [3]
    if (/^\[\d+[\-–]\d+\]$/.test(line) || /^\[\d+\]$/.test(line)) continue

    // This looks like actual English text
    englishLines.push(line)
  }

  let english = englishLines.join(' ').trim()

  // Remove trailing verse references like [1-2] or [3]
  english = english.replace(/\s*\[\d+[\-–]\d+\]\s*$/g, '')
  english = english.replace(/\s*\[\d+\]\s*$/g, '')

  // Remove leading/trailing pipes and numbers
  english = english.replace(/^\|+\d*\|*\s*/g, '')
  english = english.replace(/\s*\|+\d*\|*$/g, '')

  return english.trim()
}

function main() {
  const shlokas: Shloka[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'))

  console.log('Cleaning', shlokas.length, 'shlokas...')

  let fixed = 0
  const cleaned = shlokas.map(sh => {
    const originalEnglish = sh.english
    const cleanedEnglish = cleanEnglishTranslation(sh.english)

    if (originalEnglish !== cleanedEnglish) {
      fixed++
    }

    return {
      ...sh,
      english: cleanedEnglish
    }
  })

  // Stats
  let empty = 0, short = 0, good = 0
  for (const sh of cleaned) {
    if (!sh.english || sh.english.length === 0) empty++
    else if (sh.english.length < 10) short++
    else good++
  }

  console.log('\nBefore cleanup:')
  const origEmpty = shlokas.filter(sh => !sh.english || sh.english.length === 0).length
  console.log('  Empty:', origEmpty)
  console.log('  With content:', shlokas.length - origEmpty)

  console.log('\nAfter cleanup:')
  console.log('  Good (>10 chars):', good)
  console.log('  Short (1-10 chars):', short)
  console.log('  Empty:', empty)
  console.log('  Fixed lines:', fixed)

  // Save cleaned data
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleaned, null, 2), 'utf-8')
  console.log('\nSaved to:', OUTPUT_FILE)

  // Show samples
  console.log('\nSample cleaned translations:')
  const samples = cleaned.filter(sh => sh.english && sh.english.length > 30).slice(0, 5)
  for (const sh of samples) {
    console.log('\n[' + sh.sthana + ' Ch.' + sh.chapterNumber + ' V.' + sh.verseNumber + ']')
    console.log('  Dev:', sh.devanagari.substring(0, 60))
    console.log('  Eng:', sh.english.substring(0, 120))
  }
}

main()
