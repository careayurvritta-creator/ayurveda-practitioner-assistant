import gitaCharakData from '../gita-datasets-charak/charak-samhita.json'

export interface GitaCharakVerse {
  verse_id: string
  text: string
}

export interface GitaCharakChapter {
  chapterNumber: number
  fileName: string
  verses: GitaCharakVerse[]
}

export interface GitaCharakSthana {
  sthanaNumber: number
  name: string
  englishName: string
  description: string
  chapters: GitaCharakChapter[]
}

export interface GitaCharakSamhita {
  sthanas: GitaCharakSthana[]
  totalChapters: number
  totalVerses: number
  source: string
  license: string
}

export const GITACARAK_SAMHITA: GitaCharakSamhita = gitaCharakData as GitaCharakSamhita

export function searchGitaCharak(query: string): { sthana: string; chapterNumber: number; verseId: string; text: string }[] {
  const lowerQuery = query.toLowerCase()
  const results: { sthana: string; chapterNumber: number; verseId: string; text: string }[] = []

  for (const sthana of GITACARAK_SAMHITA.sthanas) {
    for (const chapter of sthana.chapters) {
      for (const verse of chapter.verses) {
        if (verse.text.toLowerCase().includes(lowerQuery)) {
          results.push({
            sthana: sthana.name,
            chapterNumber: chapter.chapterNumber,
            verseId: verse.verse_id,
            text: verse.text,
          })
        }
      }
    }
  }

  return results
}

export function getGitaCharakChapter(sthanaName: string, chapterNumber: number): GitaCharakChapter | undefined {
  const sthana = GITACARAK_SAMHITA.sthanas.find(
    s => s.name.toLowerCase() === sthanaName.toLowerCase() || s.englishName.toLowerCase() === sthanaName.toLowerCase()
  )
  if (!sthana) return undefined
  return sthana.chapters.find(ch => ch.chapterNumber === chapterNumber)
}

export function getGitaCharakSthana(sthanaName: string): GitaCharakSthana | undefined {
  return GITACARAK_SAMHITA.sthanas.find(
    s => s.name.toLowerCase() === sthanaName.toLowerCase() || s.englishName.toLowerCase() === sthanaName.toLowerCase()
  )
}

export function searchGitaCharakByDisease(disease: string): { sthana: string; chapterNumber: number; verseId: string; text: string }[] {
  return searchGitaCharak(disease)
}

export function getAllGitaCharakVerses(): { sthana: string; chapterNumber: number; verseId: string; text: string }[] {
  const allVerses: { sthana: string; chapterNumber: number; verseId: string; text: string }[] = []

  for (const sthana of GITACARAK_SAMHITA.sthanas) {
    for (const chapter of sthana.chapters) {
      for (const verse of chapter.verses) {
        allVerses.push({
          sthana: sthana.name,
          chapterNumber: chapter.chapterNumber,
          verseId: verse.verse_id,
          text: verse.text,
        })
      }
    }
  }

  return allVerses
}
