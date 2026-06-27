import charakOnlineData from '../carak-samhita/charak-samhita-online.json'
import allShlokasData from '../carak-samhita/all-shlokas.json'

export interface CharakOnlineShloka {
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

export interface CharakOnlineChapter {
  sthana: string
  sthanaNumber: number
  chapterNumber: number
  titleEnglish: string
  titleSanskrit: string
  titleDevanagari: string
  shlokaCount: number
}

export interface CharakOnlineSthana {
  number: number
  name: string
  chapterCount: number
  shlokaCount: number
}

export const CHARAK_ONLINE_SHLOKAS: CharakOnlineShloka[] = allShlokasData as CharakOnlineShloka[]
export const CHARAK_ONLINE_CHAPTERS: CharakOnlineChapter[] = charakOnlineData.chapters as unknown as CharakOnlineChapter[]
export const CHARAK_ONLINE_STHANAS: CharakOnlineSthana[] = charakOnlineData.sthanas as CharakOnlineSthana[]

export const CHARAK_ONLINE_STATS = {
  totalChapters: charakOnlineData.totalChapters,
  totalShlokas: charakOnlineData.totalShlokas,
  source: charakOnlineData.source,
  license: charakOnlineData.license,
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase())
}

export function searchCharakOnline(query: string): CharakOnlineShloka[] {
  const q = query.toLowerCase()
  return CHARAK_ONLINE_SHLOKAS.filter(
    (sh) =>
      matchesQuery(sh.devanagari, q) ||
      matchesQuery(sh.english, q) ||
      matchesQuery(sh.section, q) ||
      matchesQuery(sh.chapterTitle, q) ||
      matchesQuery(sh.chapterTitleSanskrit, q)
  )
}

export function getCharakOnlineChapter(sthanaNumber: number, chapterNumber: number): CharakOnlineShloka[] {
  return CHARAK_ONLINE_SHLOKAS.filter(
    (sh) => sh.sthanaNumber === sthanaNumber && sh.chapterNumber === chapterNumber
  )
}

export function getCharakOnlineSthana(sthanaNumber: number): CharakOnlineShloka[] {
  return CHARAK_ONLINE_SHLOKAS.filter((sh) => sh.sthanaNumber === sthanaNumber)
}

export function searchCharakOnlineByDevanagari(query: string): CharakOnlineShloka[] {
  const q = query.normalize('NFC')
  return CHARAK_ONLINE_SHLOKAS.filter((sh) => matchesQuery(sh.devanagari, q))
}

export function searchCharakOnlineByEnglish(query: string): CharakOnlineShloka[] {
  return CHARAK_ONLINE_SHLOKAS.filter((sh) => matchesQuery(sh.english, query))
}

export function getCharakOnlineVerse(sthanaNumber: number, chapterNumber: number, verseNumber: number): CharakOnlineShloka | undefined {
  return CHARAK_ONLINE_SHLOKAS.find(
    (sh) => sh.sthanaNumber === sthanaNumber && sh.chapterNumber === chapterNumber && sh.verseNumber === verseNumber
  )
}
