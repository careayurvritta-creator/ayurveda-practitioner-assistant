import { CHARAK_SAMHITA, CHARAK_SAMHITA_CHAPTERS, CharakChapter } from './charak-samhita'

export const CHARAK_SAMHITA_COMPLETE = CHARAK_SAMHITA
export const CHARAK_CHAPTERS = CHARAK_SAMHITA_CHAPTERS

export function searchCharakSamhita(query: string): string[] {
  const lowerQuery = query.toLowerCase()
  const matches: string[] = []

  for (const chapter of CHARAK_SAMHITA_CHAPTERS) {
    const nameMatch = chapter.name.toLowerCase().includes(lowerQuery)
    const contentMatch = chapter.fullContent.toLowerCase().includes(lowerQuery)
    const sectionMatch = Object.values(chapter.sections).some(s => s.toLowerCase().includes(lowerQuery))

    if (nameMatch || contentMatch || sectionMatch) {
      const preview = chapter.fullContent.slice(0, 500).replace(/\n/g, ' ').trim()
      matches.push(`${chapter.sthana} Ch.${chapter.chapterNumber} – ${chapter.name}\n${preview}`)
    }
  }

  if (CHARAK_SAMHITA.structure?.sections) {
    for (const sec of CHARAK_SAMHITA.structure.sections) {
      if (sec.name.toLowerCase().includes(lowerQuery) || sec.english.toLowerCase().includes(lowerQuery)) {
        matches.push(`Section: ${sec.name} (${sec.english}) – ${sec.chapters} chapters`)
      }
    }
  }

  const topics: [string, string][] = [
    ['prameha', `Prameha (Chikitsa 6): ${CHARAK_SAMHITA.prameha.definition}. ${CHARAK_SAMHITA.prameha.types.total} types – Kaphaja ${CHARAK_SAMHITA.prameha.types.kaphaja}, Pittaja ${CHARAK_SAMHITA.prameha.types.pittaja}, Vataja ${CHARAK_SAMHITA.prameha.types.vataja}.`],
    ['diab', `Prameha (Chikitsa 6): ${CHARAK_SAMHITA.prameha.definition}. ${CHARAK_SAMHITA.prameha.types.total} types – Kaphaja ${CHARAK_SAMHITA.prameha.types.kaphaja}, Pittaja ${CHARAK_SAMHITA.prameha.types.pittaja}, Vataja ${CHARAK_SAMHITA.prameha.types.vataja}.`],
    ['vata', `Vata Vyadhi (Chikitsa 28): ${CHARAK_SAMHITA.vataVyadhi.definition}. Disorders: ${CHARAK_SAMHITA.vataVyadhi.disorders.map(d => `${d.name} (${d.english})`).join(', ')}.`],
    ['neurolog', `Vata Vyadhi (Chikitsa 28): ${CHARAK_SAMHITA.vataVyadhi.definition}. Disorders: ${CHARAK_SAMHITA.vataVyadhi.disorders.map(d => `${d.name} (${d.english})`).join(', ')}.`],
    ['jwara', `Jwara (Chikitsa 3): ${CHARAK_SAMHITA.jwara.english}. Types: ${CHARAK_SAMHITA.jwara.types.join(', ')}.`],
    ['fever', `Jwara (Chikitsa 3): ${CHARAK_SAMHITA.jwara.english}. Types: ${CHARAK_SAMHITA.jwara.types.join(', ')}.`],
    ['rasayana', `Rasayana: ${CHARAK_SAMHITA.rasayana.definition}. Benefits: ${CHARAK_SAMHITA.rasayana.benefits.join(', ')}.`],
    ['rejuvenat', `Rasayana: ${CHARAK_SAMHITA.rasayana.definition}. Benefits: ${CHARAK_SAMHITA.rasayana.benefits.join(', ')}.`],
    ['vajikarana', `Vajikarana: ${CHARAK_SAMHITA.vajikarana.definition}. Indications: ${CHARAK_SAMHITA.vajikarana.indications.join(', ')}.`],
    ['fertility', `Vajikarana: ${CHARAK_SAMHITA.vajikarana.definition}. Indications: ${CHARAK_SAMHITA.vajikarana.indications.join(', ')}.`],
    ['agni', `Agni: ${CHARAK_SAMHITA.agni.importance}. Types: ${CHARAK_SAMHITA.agni.types.map(t => `${t.name} – ${t.description}`).join('; ')}.`],
    ['digest', `Agni: ${CHARAK_SAMHITA.agni.importance}. Types: ${CHARAK_SAMHITA.agni.types.map(t => `${t.name} – ${t.description}`).join('; ')}.`],
    ['tridosha', `Tridosha – Vata (${CHARAK_SAMHITA.tridosha.vata.qualities.join(', ')}), Pitta (${CHARAK_SAMHITA.tridosha.pitta.qualities.join(', ')}), Kapha (${CHARAK_SAMHITA.tridosha.kapha.qualities.join(', ')}).`],
    ['shodhana', `Shodhana: ${CHARAK_SAMHITA.shodhana.name}. Procedures: ${CHARAK_SAMHITA.shodhana.procedures.map(p => `${p.name} (${p.english})`).join(', ')}.`],
    ['panchakarma', `Shodhana: ${CHARAK_SAMHITA.shodhana.name}. Procedures: ${CHARAK_SAMHITA.shodhana.procedures.map(p => `${p.name} (${p.english})`).join(', ')}.`],
    ['dhatu', `Saptadhatu: ${CHARAK_SAMHITA.saptadhatu.map(d => `${d.name} (${d.english}) – ${d.function}`).join(', ')}.`],
  ]

  for (const [keyword, info] of topics) {
    if (lowerQuery.includes(keyword)) {
      matches.push(info)
    }
  }

  return matches.length > 0 ? matches : ['No direct Charak Samhita verses matched this filter.']
}

export function getCharakTreatmentProtocols(query: string): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('prameha') || lowerQuery.includes('diab')) {
    const p = CHARAK_SAMHITA.prameha
    return `Charak Samhita Prameha Protocol:
Categories: ${p.treatment.categories.join(', ')}
Patient Types: Sthula (${p.treatment.patientTypes.sthula.treatment}), Krisha (${p.treatment.patientTypes.krisha.treatment})
Diet: ${p.treatment.diet.join(', ')}
Herbs: ${p.treatment.herbs.join(', ')}
Formulations: ${p.treatment.formulations.join(', ')}
Prognosis: Kaphaja (${p.prognosis.kaphaja}), Pittaja (${p.prognosis.pittaja}), Vataja (${p.prognosis.vataja})`
  }

  if (lowerQuery.includes('vata') || lowerQuery.includes('neurolog') || lowerQuery.includes('joint') || lowerQuery.includes('arthr')) {
    const v = CHARAK_SAMHITA.vataVyadhi
    return `Charak Samhita Vata Vyadhi Protocol:
Line: ${v.treatment.line}
Categories: ${v.treatment.categories.join(', ')}
Formulations: ${v.treatment.formulations.join(', ')}
Avarana Types: ${v.avaranaTypes.join(', ')}
Disorders: ${v.disorders.map(d => `${d.name} (${d.english})`).join(', ')}`
  }

  if (lowerQuery.includes('jwara') || lowerQuery.includes('fever')) {
    const j = CHARAK_SAMHITA.jwara
    return `Charak Samhita Jwara Protocol:
Types: ${j.types.join(', ')}
AmaJwara: ${j.treatment.AmaJwara}
PurnaJwara: ${j.treatment.PurnaJwara}
Chronic: ${j.treatment.chronic}`
  }

  if (lowerQuery.includes('skin') || lowerQuery.includes('kushtha')) {
    return `Charak Samhita Kushtha Protocol: Found in Chikitsa Sthana. Line of treatment includes Shodhana (Vamana, Virechana), Basti, and local applications. Herbs: Khadira, Haridra, Daruharidra, Manjistha, Guduchi.`
  }

  if (lowerQuery.includes('unmad') || lowerQuery.includes('mental') || lowerQuery.includes('psych')) {
    return `Charak Samhita Unmada Protocol: Found in Chikitsa Sthana. Treatment includes Snehana, Swedana, Vamana, Nasya, Basti. Herbs: Brahmi, Shankhpushpi, Jatamansi, Vacha. Formulations: Mahapaishachika Ghrita, Brahmi Ghrita.`
  }

  if (lowerQuery.includes('apasmara') || lowerQuery.includes('epilep') || lowerQuery.includes('seizure')) {
    return `Charak Samhita Apasmara Protocol: Found in Chikitsa Sthana. Treatment includes Shamana and Shodhana. Herbs: Vacha, Musta, Pippali, Haritaki. Formulations: Vachadi Taila, Panchagavya Ghrita.`
  }

  if (lowerQuery.includes('rasayana') || lowerQuery.includes('rejuvenat') || lowerQuery.includes('immun')) {
    const r = CHARAK_SAMHITA.rasayana
    return `Charak Samhita Rasayana Protocol:
Definition: ${r.definition}
Benefits: ${r.benefits.join(', ')}
Types: Kamya (${r.types.kamya}), Nagar (${r.types.nagar}), Vairagya (${r.types.vairagya})`
  }

  return `Generic Charak Samhita Protocol: Focus on Agni protection, Snehana-Swedana-Shodhana based on prakriti. Consult chapters for specific disease protocols.`
}

export function getCharakDiseaseDescriptions(query: string): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('prameha') || lowerQuery.includes('diab')) {
    const p = CHARAK_SAMHITA.prameha
    return `Prameha (Charak Samhita Chikitsa 6):
Definition: ${p.definition}
Correlation: ${p.correlation}
Etiology: ${p.etiology.join('; ')}
Dosha: ${p.doshaInvolved.join(', ')}
Dushya: ${p.dushyaInvolved.join(', ')}
Total Types: ${p.types.total}
Premonitory Signs: ${p.premonitorySigns.join(', ')}`
  }

  if (lowerQuery.includes('vata') || lowerQuery.includes('neurolog')) {
    const v = CHARAK_SAMHITA.vataVyadhi
    return `Vata Vyadhi (Charak Samhita Chikitsa 28):
Definition: ${v.definition}
Importance: ${v.importance}
Five Types: ${v.fiveTypes.map(t => `${t.name} (${t.location})`).join(', ')}
Etiopathology: Dhatukshaya (${v.etiopathology.dhatukshaya}), Avarana (${v.etiopathology.avarana})
General Symptoms: ${v.generalSymptoms.join(', ')}
Disorders: ${v.disorders.map(d => `${d.name} (${d.english})`).join(', ')}`
  }

  if (lowerQuery.includes('jwara') || lowerQuery.includes('fever')) {
    const j = CHARAK_SAMHITA.jwara
    return `Jwara (Charak Samhita Chikitsa 3):
Types: ${j.types.join(', ')}
Treatment: AmaJwara (${j.treatment.AmaJwara}), PurnaJwara (${j.treatment.PurnaJwara}), Chronic (${j.treatment.chronic})`
  }

  if (lowerQuery.includes('kushtha') || lowerQuery.includes('skin')) {
    return `Kushtha (Charak Samhita): Skin diseases described in Chikitsa Sthana. Includes 18 types – 7 Kshudra Kushtha, 11 Maha Kushtha. Treatment involves Shodhana (Vamana, Virechana), Basti, and external applications. Key herbs: Khadira, Haridra, Manjistha, Guduchi, Neem.`
  }

  if (lowerQuery.includes('unmad') || lowerQuery.includes('mental')) {
    return `Unmada (Charak Samhita): Psychiatric disorders described in Chikitsa Sthana. Types: Vataja, Pittaja, Kaphaja, Sannipataja. Treatment includes Snehana, Swedana, Vamana, Nasya, Basti. Key herbs: Brahmi, Shankhpushpi, Jatamansi, Vacha.`
  }

  if (lowerQuery.includes('apasmara') || lowerQuery.includes('epilep')) {
    return `Apasmara (Charak Samhita): Epilepsy/seizure disorders described in Chikitsa Sthana. Types: Vataja, Pittaja, Kaphaja, Kshataja, Doshaja. Treatment includes Shamana and Shodhana. Key herbs: Vacha, Musta, Pippali, Haritaki.`
  }

  return `No specific disease match in Charak Samhita description tracker. Available topics: Prameha, Vata Vyadhi, Jwara, Kushtha, Unmada, Apasmara. Use searchCharakSamhita() for full text search.`
}

export function getCharakChapterContent(sthana: string, chapterNumber: number): CharakChapter | undefined {
  return CHARAK_SAMHITA_CHAPTERS.find(ch => ch.sthana === sthana && ch.chapterNumber === chapterNumber)
}

export function getCharakChaptersBySthana(sthana: string): CharakChapter[] {
  return CHARAK_SAMHITA_CHAPTERS.filter(ch => ch.sthana === sthana)
}

export function getAllCharakChapters(): CharakChapter[] {
  return CHARAK_SAMHITA_CHAPTERS
}
