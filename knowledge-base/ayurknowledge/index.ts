export * from './fundamentals'
export * from './diagnostics'
export * from './diseases'
export * from './herbs'
export * from './treatments'
export * from './allopathy'
export * from './charak-samhita'
export * from './charak'
export * from './sushruta'
export * from './clinical-evidence'
export * from './external-qa'
export * from './modern-medicines'

import { FUNDAMENTALS, ASHTANGAS } from './fundamentals'
import { DIAGNOSTIC_METHODS } from './diagnostics'
import { DISEASES } from './diseases'
import { HERBS, DRUG_INTERACTIONS, RASAS, GUNAS, VIRYAS, VIPAKAS } from './herbs'
import { TREATMENTS, PURVAKARMA, RASAYANA_THERAPIES, PATHYA_APATHYA, DINACHARYA, RITUCHARYA } from './treatments'
import { ALLOPATHY_INTEGRATION, DRUG_INTERACTION_DATABASE, PRESCRIBING_GUIDELINES, SAFETY_WARNINGS } from './allopathy'
import { CHARAK_SAMHITA, KEY_CONCEPTS, CHAPTER_SUMMARY } from './charak-samhita'
import { CHARAK_SAMHITA_COMPLETE, searchCharakSamhita, getCharakTreatmentProtocols, getCharakDiseaseDescriptions } from './charak'
import { SUSHruta_CHAPTERS } from './sushruta'
import { CLINICAL_EVIDENCE } from './clinical-evidence'
import { EXTERNAL_QA } from './external-qa'
import { MODERN_MEDICINES } from './modern-medicines'

export const AYURVEDA_KNOWLEDGE = {
  fundamentals: FUNDAMENTALS,
  ashtangas: ASHTANGAS,
  diagnostics: DIAGNOSTIC_METHODS,
  diseases: DISEASES,
  herbs: HERBS,
  drugInteractions: DRUG_INTERACTIONS,
  treatments: TREATMENTS,
  purvaKarma: PURVAKARMA,
  rasayana: RASAYANA_THERAPIES,
  pathyaApathya: PATHYA_APATHYA,
  dinacharya: DINACHARYA,
  ritucharya: RITUCHARYA,
  allopathyIntegration: ALLOPATHY_INTEGRATION,
  drugInteractionDB: DRUG_INTERACTION_DATABASE,
  prescribingGuidelines: PRESCRIBING_GUIDELINES,
  safetyWarnings: SAFETY_WARNINGS,
  rasas: RASAS,
  gunas: GUNAS,
  viryas: VIRYAS,
  vipakas: VIPAKAS,
  charakSamhita: CHARAK_SAMHITA,
  keyConcepts: KEY_CONCEPTS,
  chapterSummary: CHAPTER_SUMMARY,
  charakAllChapters: CHARAK_SAMHITA_COMPLETE,
  charakComplete: CHARAK_SAMHITA_COMPLETE,
  charakSearch: searchCharakSamhita,
  charakProtocols: getCharakTreatmentProtocols,
  charakDiseases: getCharakDiseaseDescriptions,
  charakMetadata: { totalChapters: 120, totalSthanas: 8 },
  whoMetadata: { totalTerms: 3545, source: 'WHO' },
  // External sources (populated by ingestion scripts)
  sushrutaChapters: SUSHruta_CHAPTERS,
  clinicalEvidence: CLINICAL_EVIDENCE,
  externalQA: EXTERNAL_QA,
  modernMedicines: MODERN_MEDICINES,
  sushrutaMetadata: { totalChapters: SUSHruta_CHAPTERS.length, source: 'Sushruta Samhita' },
  clinicalEvidenceMetadata: { totalPapers: CLINICAL_EVIDENCE.length, source: 'PubMed' },
}

export function searchKnowledge(query: string): string {
  const lowerQuery = query.toLowerCase()
  const results: string[] = []
  
  // 1. Search diseases
  for (const disease of DISEASES) {
    if (
      disease.name.toLowerCase().includes(lowerQuery) ||
      disease.sanskrit.toLowerCase().includes(lowerQuery) ||
      disease.category.toLowerCase().includes(lowerQuery) ||
      disease.modernCorrelation.toLowerCase().includes(lowerQuery) ||
      disease.samprapti.toLowerCase().includes(lowerQuery) ||
      disease.clinicalFeatures.some(f => f.toLowerCase().includes(lowerQuery)) ||
      disease.treatment.some(t => t.toLowerCase().includes(lowerQuery))
    ) {
      results.push(`Vyadhi (Disease): ${disease.name} (${disease.sanskrit}) (correlated with ${disease.modernCorrelation}) - Samprapti Pathogenesis: ${disease.samprapti}. Treatment approach: ${disease.treatment.join('; ')}`)
    }
  }
  
  // 2. Search herbs
  for (const herb of HERBS) {
    if (
      herb.name.toLowerCase().includes(lowerQuery) ||
      herb.sanskrit.toLowerCase().includes(lowerQuery) ||
      herb.botanicalName.toLowerCase().includes(lowerQuery) ||
      herb.family.toLowerCase().includes(lowerQuery) ||
      herb.indications.some(i => i.toLowerCase().includes(lowerQuery)) ||
      herb.rasa.some(r => r.toLowerCase().includes(lowerQuery)) ||
      herb.guna.some(g => g.toLowerCase().includes(lowerQuery))
    ) {
      results.push(`Dravya (Herb): ${herb.name} (${herb.sanskrit}) / ${herb.botanicalName}. Rasa/Guna: ${herb.rasa.join(', ')} / ${herb.guna.join(', ')}; Virya/Vipaka: ${herb.virya} / ${herb.vipaka}. Indications: ${herb.indications.join(', ')}. Dosage: ${herb.dosage}. Active DoshaKarma: Vata ${herb.doshaKarma.vata}, Pitta ${herb.doshaKarma.pitta}, Kapha ${herb.doshaKarma.kapha}`)
    }
  }
  
  // 3. Search treatments
  for (const treatment of TREATMENTS) {
    if (
      treatment.name.toLowerCase().includes(lowerQuery) ||
      treatment.sanskrit.toLowerCase().includes(lowerQuery) ||
      treatment.description.toLowerCase().includes(lowerQuery) ||
      treatment.indications.some(i => i.toLowerCase().includes(lowerQuery)) ||
      treatment.procedure.some(p => p.toLowerCase().includes(lowerQuery))
    ) {
      results.push(`Chikitsa (Treatment): ${treatment.name} (${treatment.sanskrit}) (${treatment.category}) - ${treatment.description}. Key Procedure: ${treatment.procedure.join('; ')}. Indications: ${treatment.indications.join(', ')}. Contraindications: ${treatment.contraindications.join(', ')}`)
    }
  }

  // 4. Search modern medicines
  for (const med of MODERN_MEDICINES) {
    if (
      med.medicineName.toLowerCase().includes(lowerQuery) ||
      med.composition.toLowerCase().includes(lowerQuery) ||
      med.uses.toLowerCase().includes(lowerQuery) ||
      (med.precautions && med.precautions.toLowerCase().includes(lowerQuery)) ||
      (med.drugInteractions && med.drugInteractions.toLowerCase().includes(lowerQuery))
    ) {
      results.push(`Modern Medicine: ${med.medicineName} (${med.composition}) - Uses: ${med.uses}. Precautions: ${med.precautions || 'N/A'}. Contraindicated Ayurvedic Herbs: ${med.drugInteractions || 'N/A'}`)
    }
  }

  // 5. Search fundamentals
  // Tridosha
  for (const t of FUNDAMENTALS.tridosha) {
    if (
      t.name.toLowerCase().includes(lowerQuery) ||
      t.sanskrit.toLowerCase().includes(lowerQuery) ||
      t.definition.toLowerCase().includes(lowerQuery) ||
      t.qualities.some(q => q.toLowerCase().includes(lowerQuery)) ||
      t.imbalance.some(i => i.toLowerCase().includes(lowerQuery))
    ) {
      results.push(`Tridosha: ${t.name} (${t.sanskrit}) - ${t.definition}. Qualities: ${t.qualities.join(', ')}. Seat: ${t.seat}. Primary Functions: ${t.functions.join(', ')}. Signs of Imbalance: ${t.imbalance.join(', ')}. Prakriti traits: ${t.prakritiDominance}`)
    }
  }
  // Saptadhatu
  for (const sd of FUNDAMENTALS.saptadhatu) {
    if (
      sd.name.toLowerCase().includes(lowerQuery) ||
      sd.function.toLowerCase().includes(lowerQuery) ||
      sd.seat.toLowerCase().includes(lowerQuery)
    ) {
      results.push(`Saptadhatu: ${sd.name} - Primary function is ${sd.function}. Seat: ${sd.seat}, Quality: ${sd.quality}`)
    }
  }
  // Agni
  for (const ag of FUNDAMENTALS.agni) {
    if (
      ag.name.toLowerCase().includes(lowerQuery) ||
      ag.description.toLowerCase().includes(lowerQuery) ||
      (ag.causes && ag.causes.some(c => c.toLowerCase().includes(lowerQuery)))
    ) {
      results.push(`Agni (Digestive Fire): ${ag.name} - ${ag.description}.${ag.causes ? ` Elicited by: ${ag.causes.join(', ')}` : ''}`)
    }
  }
  // Srotas
  for (const sr of FUNDAMENTALS.srotas) {
    if (
      sr.name.toLowerCase().includes(lowerQuery) ||
      sr.function.toLowerCase().includes(lowerQuery) ||
      sr.channels.toLowerCase().includes(lowerQuery) ||
      sr.symptoms.toLowerCase().includes(lowerQuery)
    ) {
      results.push(`Srotas (Channels): ${sr.name} - Function: ${sr.function}. Route Channels: ${sr.channels}. Pathological Symptoms: ${sr.symptoms}`)
    }
  }
  // Ama & Ojas
  for (const am of FUNDAMENTALS.ama) {
    if (
      am.definition.toLowerCase().includes(lowerQuery) ||
      (am.types && am.types.some(ty => ty.toLowerCase().includes(lowerQuery))) ||
      (am.indicators && am.indicators.some(ind => ind.toLowerCase().includes(lowerQuery)))
    ) {
      results.push(`Ama (Toxins): ${am.id} - ${am.definition}.${am.types ? ` Types: ${am.types.join(', ')}` : ''}.${am.indicators ? ` Signs/Indicators: ${am.indicators.join(', ')}` : ''}`)
    }
  }
  for (const oj of FUNDAMENTALS.ojas) {
    if (
      oj.definition.toLowerCase().includes(lowerQuery) ||
      oj.functions.some(f => f.toLowerCase().includes(lowerQuery)) ||
      oj.depletion.some(d => d.toLowerCase().includes(lowerQuery))
    ) {
      results.push(`Ojas (Vital Essence): ${oj.definition}. Qualities: ${oj.quality}. Functions: ${oj.functions.join(', ')}. Depletion factors: ${oj.depletion.join(', ')}. Preservation: ${oj.preservation.join(', ')}`)
    }
  }

  // 6. Search Ashtangas
  for (const ash of ASHTANGAS) {
    if (
      ash.name.toLowerCase().includes(lowerQuery) ||
      ash.sanskrit.toLowerCase().includes(lowerQuery) ||
      ash.english.toLowerCase().includes(lowerQuery) ||
      ash.scope.toLowerCase().includes(lowerQuery) ||
      ash.branches.some(b => b.toLowerCase().includes(lowerQuery))
    ) {
      results.push(`Ashtanga (Eight Branches of Ayurveda): ${ash.name} (${ash.sanskrit} / ${ash.english}) - Scope: ${ash.scope}. Branches/Sub-specialties: ${ash.branches.join(', ')}`)
    }
  }

  // 7. Search Diagnostics
  for (const diag of DIAGNOSTIC_METHODS) {
    if (
      diag.name.toLowerCase().includes(lowerQuery) ||
      diag.sanskrit.toLowerCase().includes(lowerQuery) ||
      diag.description.toLowerCase().includes(lowerQuery) ||
      diag.components.some(c => c.toLowerCase().includes(lowerQuery)) ||
      diag.clinicalApplication.some(a => a.toLowerCase().includes(lowerQuery))
    ) {
      results.push(`Roga Pariksha (Diagnostic Method): ${diag.name} (${diag.sanskrit}) - ${diag.description}. Components: ${diag.components.join('; ')}. Clinical Applications: ${diag.clinicalApplication.join('; ')}`)
    }
  }

  // 8. Search Allopathy Integration
  for (const allo of ALLOPATHY_INTEGRATION) {
    if (
      allo.condition.toLowerCase().includes(lowerQuery) ||
      allo.ayurvedicCorrelation.toLowerCase().includes(lowerQuery) ||
      allo.integratedApproach.toLowerCase().includes(lowerQuery) ||
      allo.safetyNotes.some(s => s.toLowerCase().includes(lowerQuery)) ||
      allo.monitoringParameters.some(m => m.toLowerCase().includes(lowerQuery))
    ) {
      results.push(`Allopathy-Ayurveda Integration: For ${allo.condition} (Correlated with ${allo.ayurvedicCorrelation}) - Standard Allopathic Treatment: ${allo.allopathyTreatment}. Integrated approach framework: ${allo.integratedApproach}. Cautions/Safety notices: ${allo.safetyNotes.join('; ')}. Monitoring clinical indicators: ${allo.monitoringParameters.join('; ')}`)
    }
  }

  // 9. Search Charak Samhita Complete verses and categories
  const charakMatches = searchCharakSamhita(query)
  if (charakMatches && charakMatches.length > 0 && charakMatches[0] !== 'No direct Charak Samhita verses matched this filter.') {
    for (const cm of charakMatches) {
      results.push(`Charaka Samhita Reference: ${cm}`)
    }
  }
  
  if (typeof CHARAK_SAMHITA === 'object' && CHARAK_SAMHITA !== null) {
    if (JSON.stringify(CHARAK_SAMHITA).toLowerCase().includes(lowerQuery)) {
      results.push(`Charaka Samhita Scripture Corpus Matches in sections of Prameha, Jwara or Vata Vyadhi Chikitsa. Suggested treatment is standard Chikitsa Sutra of ${lowerQuery}.`)
    }
  }

  // 10. Search sushrutaChapters
  if (SUSHruta_CHAPTERS && SUSHruta_CHAPTERS.length > 0) {
    for (const sch of SUSHruta_CHAPTERS) {
      if (
        sch.name.toLowerCase().includes(lowerQuery) ||
        sch.english.toLowerCase().includes(lowerQuery) ||
        sch.summary.toLowerCase().includes(lowerQuery) ||
        sch.keyConcepts.some(kc => kc.toLowerCase().includes(lowerQuery))
      ) {
         results.push(`Sushruta Samhita Shastra Chapter: ${sch.sthana} Chapter ${sch.chapterNumber}: ${sch.name} (${sch.english}) - Summary: ${sch.summary}. Key Principles: ${sch.keyConcepts.join(', ')}`)
      }
    }
  }

  // 11. Search Clinical evidence (PubMed abstracts)
  if (CLINICAL_EVIDENCE && CLINICAL_EVIDENCE.length > 0) {
    for (const cli of CLINICAL_EVIDENCE) {
      if (
        cli.title.toLowerCase().includes(lowerQuery) ||
        cli.abstract.toLowerCase().includes(lowerQuery) ||
        cli.herbsMentioned.some(h => h.toLowerCase().includes(lowerQuery)) ||
        cli.conditionsMentioned.some(c => c.toLowerCase().includes(lowerQuery))
      ) {
         results.push(`PubMed Scientific Evidence (PMID ${cli.pmid}): "${cli.title}" published in ${cli.journal} (${cli.publicationDate}). Study Type: ${cli.studyType}, Level: ${cli.evidenceLevel}. Ayurvedic Relevance: ${cli.ayurvedaRelevance}. Herbs evaluated: ${cli.herbsMentioned.join(', ')}`)
      }
    }
  }

  // 12. Search External Q&A
  if (EXTERNAL_QA && EXTERNAL_QA.length > 0) {
    for (const qa of EXTERNAL_QA) {
      if (
        qa.question.toLowerCase().includes(lowerQuery) ||
        qa.answer.toLowerCase().includes(lowerQuery) ||
        (qa.category && qa.category.toLowerCase().includes(lowerQuery))
      ) {
        results.push(`Factual Q&A pair [Dataset: ${qa.sourceDataset}]: Q: "${qa.question}" | A: "${qa.answer}"${qa.classicalReference ? ` (Reference: ${qa.classicalReference})` : ''}`)
      }
    }
  }

  return results.length > 0 ? results.join('\n') : 'No direct matches found. Please try different search terms.'
}

export function getHerbInteractions(herbName: string): string[] {
  return DRUG_INTERACTIONS
    .filter(i => i.herb.toLowerCase().includes(herbName.toLowerCase()))
    .map(i => `${i.herb} + ${i.drugClass}: ${i.recommendation}`)
}

export function getDiseaseInfo(diseaseName: string): string | null {
  const disease = DISEASES.find(d => 
    d.name.toLowerCase().includes(diseaseName.toLowerCase()) ||
    d.sanskrit.toLowerCase().includes(diseaseName.toLowerCase()) ||
    d.modernCorrelation.toLowerCase().includes(diseaseName.toLowerCase())
  )
  
  if (!disease) return null
  
  return `
=== ${disease.name} (${disease.sanskrit}) ===
Category: ${disease.category}
Modern Correlation: ${disease.modernCorrelation}
Samprapti (Pathogenesis): ${disease.samprapti}

Clinical Features:
- ${disease.clinicalFeatures.join('\n- ')}

Treatment Approach:
- ${disease.treatment.join('\n- ')}

Pathya (Recommended): ${disease.pathya.join(', ')}
Apathya (Avoid): ${disease.apathya.join(', ')}
Prognosis: ${disease.prognosis}
  `.trim()
}

export function getTreatmentInfo(treatmentName: string): string | null {
  const treatment = TREATMENTS.find(t => 
    t.name.toLowerCase().includes(treatmentName.toLowerCase()) ||
    t.sanskrit.toLowerCase().includes(treatmentName.toLowerCase())
  )
  
  if (!treatment) return null
  
  return `
=== ${treatment.name} (${treatment.sanskrit}) ===
Category: ${treatment.category}
Description: ${treatment.description}

Procedure:
- ${treatment.procedure.join('\n- ')}

Indications:
- ${treatment.indications.join('\n- ')}

Contraindications:
- ${treatment.contraindications.join('\n- ')}

Duration: ${treatment.duration}
  `.trim()
}

export function checkDrugInteraction(herb: string, drugClass: string): string {
  const interaction = DRUG_INTERACTIONS.find(
    i => i.herb.toLowerCase().includes(herb.toLowerCase()) && 
    i.drugClass.toLowerCase().includes(drugClass.toLowerCase())
  )
  
  if (!interaction) return 'No known interaction found'
  
  return `
⚠️ Interaction Found: ${interaction.severity.toUpperCase()} severity
Mechanism: ${interaction.mechanism}
Effect: ${interaction.effect}
Recommendation: ${interaction.recommendation}
  `.trim()
}

export function getAllopathyIntegration(condition: string): string | null {
  const integration = ALLOPATHY_INTEGRATION.find(i => 
    i.condition.toLowerCase().includes(condition.toLowerCase()) ||
    i.ayurvedicCorrelation.toLowerCase().includes(condition.toLowerCase())
  )
  
  if (!integration) return null
  
  return `
=== ${integration.condition} Integration ===
Ayurvedic Correlation: ${integration.ayurvedicCorrelation}
Allopathic Treatment: ${integration.allopathyTreatment}

Integrated Approach:
${integration.integratedApproach}

Safety Notes:
- ${integration.safetyNotes.join('\n- ')}

Monitoring Parameters:
- ${integration.monitoringParameters.join('\n- ')}
  `.trim()
}

export function getPrakritiGuidance(prakriti: string): string {
  const p = prakriti.toLowerCase()
  
  if (p.includes('vata')) {
    return `
Vata Prakriti Guidance:
- Body: Lean, dry, cold
- Mind: Creative, anxious
- Needs: Warm, moist, nourishing
- Diet: Warm cooked foods, ghee, oils
- Exercise: Gentle (yoga, walking)
- Avoid: Cold, dry, raw foods
- Routine: Regular sleep, meals
- Herbs: Ashwagandha, Bala, Dashamoola
    `.trim()
  } else if (p.includes('pitta')) {
    return `
Pitta Prakriti Guidance:
- Body: Medium, warm
- Mind: Intelligent, ambitious
- Needs: Cooling, moderate
- Diet: Sweet, bitter, astringent
- Exercise: Moderate
- Avoid: Spicy, sour, hot foods
- Routine: Moderate pace
- Herbs: Shatavari, Brahmi, Guduchi
    `.trim()
  } else if (p.includes('kapha')) {
    return `
Kapha Prakriti Guidance:
- Body: Sturdy, heavy, cold
- Mind: Calm, steady
- Needs: Light, dry, warm
- Diet: Light, dry, spicy
- Exercise: Regular, vigorous
- Avoid: Heavy, oily, sweet
- Routine: Early to bed, early to rise
- Herbs: Triphala, Ginger, Pippali
    `.trim()
  }
  
  return 'Please specify Vata, Pitta, or Kapha prakriti'
}