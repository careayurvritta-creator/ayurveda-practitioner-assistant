import siddhantaData from '../siddhanta-kosha/principles.json'

export interface SiddhantaPrinciple {
  name: string
  category: string
  shloka: string
  shloka_ref: string
  explanation: string
  clinical_importance: string
}

export const SIDDHANTA_PRINCIPLES: SiddhantaPrinciple[] = siddhantaData as SiddhantaPrinciple[]

export const SIDDHANTA_CATEGORIES = [...new Set(SIDDHANTA_PRINCIPLES.map(p => p.category))]

export const SIDDHANTA_STATS = {
  totalPrinciples: SIDDHANTA_PRINCIPLES.length,
  categories: SIDDHANTA_CATEGORIES,
  categoryCounts: SIDDHANTA_PRINCIPLES.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1
    return acc
  }, {} as Record<string, number>),
  source: 'Siddhanta Kosha (Amidha Ayurveda / Zenodo CC BY 4.0)',
  doi: '10.5281/zenodo.17481343'
}

export function searchSiddhantaPrinciples(query: string): SiddhantaPrinciple[] {
  const lowerQuery = query.toLowerCase()
  return SIDDHANTA_PRINCIPLES.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.category.toLowerCase().includes(lowerQuery) ||
    p.explanation.toLowerCase().includes(lowerQuery) ||
    p.clinical_importance.toLowerCase().includes(lowerQuery) ||
    p.shloka_ref.toLowerCase().includes(lowerQuery)
  )
}
