import { CHARAK_SAMHITA } from './charak-samhita'

export const CHARAK_SAMHITA_COMPLETE = CHARAK_SAMHITA

export function searchCharakSamhita(query: string): string[] {
  const lowerQuery = query.toLowerCase()
  const matches: string[] = []

  // Simple search in structure
  if (CHARAK_SAMHITA.structure && CHARAK_SAMHITA.structure.sections) {
    for (const sec of CHARAK_SAMHITA.structure.sections) {
      if (sec.name.toLowerCase().includes(lowerQuery) || sec.english.toLowerCase().includes(lowerQuery)) {
        matches.push(`Section: ${sec.name} (${sec.english})`)
      }
    }
  }

  // Search in prameha
  if (JSON.stringify(CHARAK_SAMHITA.prameha).toLowerCase().includes(lowerQuery)) {
    matches.push(`Chikitsa Chapter 6 (Prameha): ${CHARAK_SAMHITA.prameha.definition}`)
  }

  // Search in vataVyadhi
  if (JSON.stringify(CHARAK_SAMHITA.vataVyadhi).toLowerCase().includes(lowerQuery)) {
    matches.push(`Chikitsa Chapter 28 (Vata Vyadhi): ${CHARAK_SAMHITA.vataVyadhi.english} - ${CHARAK_SAMHITA.vataVyadhi.definition}`)
  }

  // Search in jwara
  if (JSON.stringify(CHARAK_SAMHITA.jwara).toLowerCase().includes(lowerQuery)) {
    matches.push(`Chikitsa Chapter 3 (Jwara): ${CHARAK_SAMHITA.jwara.english}`)
  }

  return matches.length > 0 ? matches : ['No direct Charak Samhita verses matched this filter.']
}

export function getCharakTreatmentProtocols(query: string): string {
  const lowerQuery = query.toLowerCase()
  if (lowerQuery.includes('prameha') || lowerQuery.includes('diab')) {
    return `Charak Samhita Prameha Protocol: ${CHARAK_SAMHITA.prameha.treatment.categories.join(', ')}. Herbs: ${CHARAK_SAMHITA.prameha.treatment.herbs.join(', ')}`
  }
  if (lowerQuery.includes('vata') || lowerQuery.includes('neurolog') || lowerQuery.includes('joint') || lowerQuery.includes('arthr')) {
    return `Charak Samhita Vata Vyadhi Protocol: ${CHARAK_SAMHITA.vataVyadhi.treatment.line}. Formulations: ${CHARAK_SAMHITA.vataVyadhi.treatment.formulations.join(', ')}`
  }
  if (lowerQuery.includes('jwara') || lowerQuery.includes('fever')) {
    return `Charak Samhita Jwara Protocol: AmaJwara - ${CHARAK_SAMHITA.jwara.treatment.AmaJwara}, PurnaJwara - ${CHARAK_SAMHITA.jwara.treatment.PurnaJwara}`
  }
  return `Generic Charak Samhita Protocol: Focus on Agni protection and Snehana-Swedana-Shodhana based on prakriti.`
}

export function getCharakDiseaseDescriptions(query: string): string {
  const lowerQuery = query.toLowerCase()
  if (lowerQuery.includes('prameha') || lowerQuery.includes('diab')) {
    return `Prameha description from Charak Samhita: ${CHARAK_SAMHITA.prameha.definition}. It has ${CHARAK_SAMHITA.prameha.types.total} types.`
  }
  if (lowerQuery.includes('vata') || lowerQuery.includes('neurolog')) {
    return `Vata Vyadhi description from Charak Samhita: ${CHARAK_SAMHITA.vataVyadhi.definition}`
  }
  return `No specific disease match in Charak Samhita description tracker. Consult direct text lookup.`
}
