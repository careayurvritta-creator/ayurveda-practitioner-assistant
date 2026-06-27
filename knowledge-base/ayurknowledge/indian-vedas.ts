import vedasData from '../indian-vedas/ayurveda-corpus.json'

export interface VedasCorpusRecord {
  collection: string
  metadata: string
  content: string
}

export const VEDAS_CORPUS: VedasCorpusRecord[] = vedasData as VedasCorpusRecord[]

export const VEDAS_CORPUS_STATS = {
  totalRecords: VEDAS_CORPUS.length,
  collections: [...new Set(VEDAS_CORPUS.map(r => r.collection))],
  collectionCounts: VEDAS_CORPUS.reduce((acc, r) => {
    acc[r.collection] = (acc[r.collection] || 0) + 1
    return acc
  }, {} as Record<string, number>),
  source: 'Indian Vedas and Ayurveda Corpus (HuggingFace shinigamiRaj/IndianVedasOriginal)',
  license: 'Public Domain'
}

export function searchVedasCorpus(query: string, collection?: string): VedasCorpusRecord[] {
  const lowerQuery = query.toLowerCase()
  return VEDAS_CORPUS.filter(r => {
    const matchesCollection = !collection || r.collection.toLowerCase().includes(collection.toLowerCase())
    const matchesQuery = r.content.toLowerCase().includes(lowerQuery) ||
      r.metadata.toLowerCase().includes(lowerQuery)
    return matchesCollection && matchesQuery
  })
}

export function getCharakaSamhita(): VedasCorpusRecord[] {
  return VEDAS_CORPUS.filter(r => r.collection === 'Charaka Samhita')
}

export function getSushrutaSamhita(): VedasCorpusRecord[] {
  return VEDAS_CORPUS.filter(r => r.collection === 'Sushruta Samhita')
}

export function getRasaJalaNidhi(): VedasCorpusRecord[] {
  return VEDAS_CORPUS.filter(r => r.collection === 'Rasa Jala Nidhi')
}

export function getIRJAYPapers(): VedasCorpusRecord[] {
  return VEDAS_CORPUS.filter(r => r.collection === 'IRJAY')
}
