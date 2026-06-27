import keralaData from '../kerala-ayurveda/documents.json'

export interface KeralaAyurvedaDocument {
  id: string
  title: string
  type: string
  category: string
  content: string
  keyConcepts?: string[]
  herbs?: string[]
  indications?: string[]
  therapies?: string[]
  products?: string[]
  source: string
}

export const KERALA_AYURVEDA_DOCUMENTS: KeralaAyurvedaDocument[] = keralaData as KeralaAyurvedaDocument[]

export const KERALA_AYURVEDA_STATS = {
  totalDocuments: KERALA_AYURVEDA_DOCUMENTS.length,
  types: [...new Set(KERALA_AYURVEDA_DOCUMENTS.map(d => d.type))],
  categories: [...new Set(KERALA_AYURVEDA_DOCUMENTS.map(d => d.category))],
  typeCounts: KERALA_AYURVEDA_DOCUMENTS.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1
    return acc
  }, {} as Record<string, number>),
  source: 'Kerala Ayurveda RAG (GitHub VARUN3WARE)'
}

export function searchKeralaAyurveda(query: string): KeralaAyurvedaDocument[] {
  const lowerQuery = query.toLowerCase()
  return KERALA_AYURVEDA_DOCUMENTS.filter(d =>
    d.title.toLowerCase().includes(lowerQuery) ||
    d.category.toLowerCase().includes(lowerQuery) ||
    d.content.toLowerCase().includes(lowerQuery) ||
    (d.keyConcepts && d.keyConcepts.some(k => k.toLowerCase().includes(lowerQuery))) ||
    (d.herbs && d.herbs.some(h => h.toLowerCase().includes(lowerQuery))) ||
    (d.indications && d.indications.some(i => i.toLowerCase().includes(lowerQuery))) ||
    (d.therapies && d.therapies.some(t => t.toLowerCase().includes(lowerQuery))) ||
    (d.products && d.products.some(p => p.toLowerCase().includes(lowerQuery)))
  )
}
