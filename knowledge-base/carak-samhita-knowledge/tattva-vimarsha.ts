import tattvaVidhiData from '../carak-samhita/tattva-vidhi-vimarsha.json'

export interface VimarshaSection {
  title: string
  content: string
  subsections: { title: string; content: string }[]
}

export interface TattvaVimarshaEntry {
  chapterNumber: number
  sthana: string
  sthanaNumber: number
  chapterTitle: string
  tattvaVimarsha: VimarshaSection
  vidhiVimarsha: VimarshaSection
}

export const TATTVA_VIDHI_VIMARSHA: TattvaVimarshaEntry[] = tattvaVidhiData as TattvaVimarshaEntry[]

export function searchTattvaVimarsha(query: string): { entry: TattvaVimarshaEntry; matchedContent: string; relevance: number }[] {
  const q = query.toLowerCase()
  const results: { entry: TattvaVimarshaEntry; matchedContent: string; relevance: number }[] = []

  for (const entry of TATTVA_VIDHI_VIMARSHA) {
    // Search in Tattva Vimarsha
    if (entry.tattvaVimarsha.content.length > 0) {
      const tvContent = entry.tattvaVimarsha.content.toLowerCase()
      if (tvContent.includes(q)) {
        // Find the matching paragraph
        const paragraphs = entry.tattvaVimarsha.content.split('\n\n')
        for (const para of paragraphs) {
          if (para.toLowerCase().includes(q)) {
            results.push({ entry, matchedContent: para.trim(), relevance: 1.0 })
            break
          }
        }
      }
      // Also search subsections
      for (const sub of entry.tattvaVimarsha.subsections) {
        if (sub.content.toLowerCase().includes(q)) {
          results.push({ entry, matchedContent: sub.content.trim(), relevance: 0.9 })
        }
      }
    }

    // Search in Vidhi Vimarsha
    if (entry.vidhiVimarsha.content.length > 0) {
      const vhContent = entry.vidhiVimarsha.content.toLowerCase()
      if (vhContent.includes(q)) {
        const paragraphs = entry.vidhiVimarsha.content.split('\n\n')
        for (const para of paragraphs) {
          if (para.toLowerCase().includes(q)) {
            results.push({ entry, matchedContent: para.trim(), relevance: 1.0 })
            break
          }
        }
      }
      for (const sub of entry.vidhiVimarsha.subsections) {
        if (sub.content.toLowerCase().includes(q)) {
          results.push({ entry, matchedContent: sub.content.trim(), relevance: 0.9 })
        }
      }
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance)

  return results.slice(0, 10)
}

export function getChapterVimarsha(sthana: string, chapterNumber: number): TattvaVimarshaEntry | undefined {
  return TATTVA_VIDHI_VIMARSHA.find(e => e.sthana === sthana && e.chapterNumber === chapterNumber)
}

export function getAllTattvaVimarsha(): { sthana: string; chapterNumber: number; title: string; content: string; subsections: string[] }[] {
  return TATTVA_VIDHI_VIMARSHA
    .filter(e => e.tattvaVimarsha.content.length > 0)
    .map(e => ({
      sthana: e.sthana,
      chapterNumber: e.chapterNumber,
      title: e.chapterTitle,
      content: e.tattvaVimarsha.content,
      subsections: e.tattvaVimarsha.subsections.map(s => s.title)
    }))
}

export function getAllVidhiVimarsha(): { sthana: string; chapterNumber: number; title: string; content: string; subsections: string[] }[] {
  return TATTVA_VIDHI_VIMARSHA
    .filter(e => e.vidhiVimarsha.content.length > 0)
    .map(e => ({
      sthana: e.sthana,
      chapterNumber: e.chapterNumber,
      title: e.chapterTitle,
      content: e.vidhiVimarsha.content,
      subsections: e.vidhiVimarsha.subsections.map(s => s.title)
    }))
}
