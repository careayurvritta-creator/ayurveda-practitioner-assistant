export * from './fundamentals'
export * from './diagnostics'
export * from './diseases'
export * from './herbs'
export * from './treatments'
export * from './allopathy'
export * from './charak-samhita'
export * from './charak'
export * from './sushruta'
export * from './ashtanga-hridaya'
export * from './siddhanta-kosha'
export * from './indian-vedas'
export * from './clinical-evidence'
export * from './external-qa'
export * from './modern-medicines'

import { FUNDAMENTALS, ASHTANGAS } from './fundamentals'
import { DIAGNOSTIC_METHODS } from './diagnostics'
import { DISEASES } from './diseases'
import { HERBS, DRUG_INTERACTIONS, RASAS, GUNAS, VIRYAS, VIPAKAS } from './herbs'
import { TREATMENTS, PURVAKARMA, RASAYANA_THERAPIES, PATHYA_APATHYA, DINACHARYA, RITUCHARYA } from './treatments'
import { ALLOPATHY_INTEGRATION, DRUG_INTERACTION_DATABASE, PRESCRIBING_GUIDELINES, SAFETY_WARNINGS } from './allopathy'
import { CHARAK_SAMHITA, KEY_CONCEPTS, CHAPTER_SUMMARY, CHARAK_SAMHITA_CHAPTERS } from './charak-samhita'
import { CHARAK_SAMHITA_COMPLETE, CHARAK_CHAPTERS, searchCharakSamhita, getCharakTreatmentProtocols, getCharakDiseaseDescriptions, getCharakChapterContent, getCharakChaptersBySthana, getAllCharakChapters } from './charak'
import { SUSHRUTA_CHAPTERS } from './sushruta'
import { ASHTANGA_HRIDAYA_COMPLETE, ASHTANGA_CHAPTERS, searchAshtangaHridaya } from './ashtanga-hridaya'
import { SIDDHANTA_PRINCIPLES, SIDDHANTA_STATS, searchSiddhantaPrinciples } from './siddhanta-kosha'
import { VEDAS_CORPUS, VEDAS_CORPUS_STATS, searchVedasCorpus } from './indian-vedas'
import { CLINICAL_EVIDENCE } from './clinical-evidence'
import { EXTERNAL_QA } from './external-qa'
import { MODERN_MEDICINES } from './modern-medicines'
import { VASISHTH_ARTICLES, VASISHTH_STATS } from '../vasishth-knowledge'
import { CASE_STUDIES, CASE_TREATMENTS, CASE_STUDY_STATS } from '../case-studies-knowledge'
import { PLANET_AYURVEDA_DISEASES, PLANET_AYURVEDA_STATS } from '../planetayurveda-knowledge'
import { PLANET_AYURVEDA_HERBS, PLANET_AYURVEDA_HERB_STATS } from '../planetayurveda-herbs-knowledge'
import { PLANET_AYURVEDA_FORMULATIONS, PLANET_AYURVEDA_FORMULATION_STATS } from '../planetayurveda-formulations-knowledge'
import { AMIDHA_HERBS, AMIDHA_HERB_STATS, searchAmidhaHerbs } from '../amidha-herbs-knowledge'
import { BHAISHAJYA_FORMULATIONS, BHAISHAJYA_FORMULATION_STATS, searchBhaishajyaFormulations } from '../bhaishajya-kalpana-kosha-knowledge'
import { KERALA_AYURVEDA_DOCUMENTS, KERALA_AYURVEDA_STATS, searchKeralaAyurveda } from '../kerala-ayurveda-knowledge'
import { AYURWIKI_HERBS, searchAyurwikiHerbs } from '../ayurwiki-herbs-knowledge'
import { GITACARAK_SAMHITA, searchGitaCharak } from '../gita-datasets-charak-knowledge'
import { CHARAK_ONLINE_SHLOKAS, CHARAK_ONLINE_CHAPTERS, CHARAK_ONLINE_STHANAS, CHARAK_ONLINE_STATS, searchCharakOnline, getCharakOnlineChapter, getCharakOnlineSthana } from '../carak-samhita-knowledge'
import { TATTVA_VIDHI_VIMARSHA, searchTattvaVimarsha, getChapterVimarsha, getAllTattvaVimarsha, getAllVidhiVimarsha } from '../carak-samhita-knowledge/tattva-vimarsha'
import { WHO_ITA_TERMS, WHO_ITA_STATS, WHO_ITA_CHAPTERS, searchWhoItaTerms, lookupWhoItaTerm, getWhoItaChapter, getWhoItaChapterByName, getTreatsForDisease, getDiseasesTreatedBy, getSymptomsOfDisease, getDiseasesWithSymptom, getComponentsOf, getCompoundContaining, getGraphStats, lookupGraphNode, getNodeLabel } from '../who-ita-knowledge'

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
  charakChapters: CHARAK_SAMHITA_CHAPTERS,
  charakChapterData: CHARAK_CHAPTERS,
  charakSearch: searchCharakSamhita,
  charakProtocols: getCharakTreatmentProtocols,
  charakDiseases: getCharakDiseaseDescriptions,
  charakGetChapter: getCharakChapterContent,
  charakGetBySthana: getCharakChaptersBySthana,
  charakGetAllChapters: getAllCharakChapters,
  charakMetadata: { totalChapters: CHARAK_SAMHITA_CHAPTERS.length, totalSthanas: 8, sthanaCounts: CHARAK_SAMHITA_CHAPTERS.reduce((acc, ch) => { acc[ch.sthana] = (acc[ch.sthana] || 0) + 1; return acc; }, {} as Record<string, number>) },
  whoMetadata: { totalTerms: 3545, source: 'WHO' },
  // External sources (populated by ingestion scripts)
  sushrutaChapters: SUSHRUTA_CHAPTERS,
  clinicalEvidence: CLINICAL_EVIDENCE,
  externalQA: EXTERNAL_QA,
  modernMedicines: MODERN_MEDICINES,
  vasishthArticles: VASISHTH_ARTICLES,
  vasishthStats: VASISHTH_STATS,
  sushrutaMetadata: { totalChapters: SUSHRUTA_CHAPTERS.length, source: 'Sushruta Samhita' },
  clinicalEvidenceMetadata: { totalPapers: CLINICAL_EVIDENCE.length, source: 'PubMed' },
  vasishthMetadata: { totalArticles: VASISHTH_ARTICLES.length, source: 'Dr. Vasishth WhatsApp', seriesCounts: VASISHTH_STATS.seriesCounts },
  caseStudies: CASE_STUDIES,
  caseTreatments: CASE_TREATMENTS,
  caseStudyMetadata: { totalCases: CASE_STUDIES.length, totalTreatments: CASE_TREATMENTS.length, source: '3Ayur case-studies WhatsApp', categoryCounts: CASE_STUDY_STATS.categoryCounts },
  planetAyurvedaDiseases: PLANET_AYURVEDA_DISEASES,
  planetAyurvedaMetadata: { totalDiseases: PLANET_AYURVEDA_DISEASES.length, source: 'Planet Ayurveda', categoryCounts: PLANET_AYURVEDA_STATS.categoryCounts, avgSections: PLANET_AYURVEDA_STATS.avgSections },
  planetAyurvedaHerbs: PLANET_AYURVEDA_HERBS,
  planetAyurvedaHerbMetadata: { totalHerbs: PLANET_AYURVEDA_HERBS.length, source: 'Planet Ayurveda Herbs A-Z', avgSections: PLANET_AYURVEDA_HERB_STATS.avgSections, totalContentKb: PLANET_AYURVEDA_HERB_STATS.totalContentKb },
  planetAyurvedaFormulations: PLANET_AYURVEDA_FORMULATIONS,
  planetAyurvedaFormulationMetadata: { totalFormulations: PLANET_AYURVEDA_FORMULATIONS.length, source: 'Planet Ayurveda Classical Formulations', categoryCounts: PLANET_AYURVEDA_FORMULATION_STATS.categoryCounts, avgSections: PLANET_AYURVEDA_FORMULATION_STATS.avgSections, totalContentKb: PLANET_AYURVEDA_FORMULATION_STATS.totalContentKb },
  // Amidha Herb Database (360 herbs)
  amidhaHerbs: AMIDHA_HERBS,
  amidhaHerbMetadata: { totalHerbs: AMIDHA_HERBS.length, uniqueFamilies: AMIDHA_HERB_STATS.uniqueFamilies, tridoshaHerbs: AMIDHA_HERB_STATS.tridoshaHerbs, source: 'Amidha Ayurveda Herb Database v2.0', familyCounts: AMIDHA_HERB_STATS.familyCounts, rasaCounts: AMIDHA_HERB_STATS.rasaCounts },
  // Bhaishajya Kalpana Kosha (176 classical formulations)
  bhaishajyaFormulations: BHAISHAJYA_FORMULATIONS,
  bhaishajyaFormulationMetadata: { totalFormulations: BHAISHAJYA_FORMULATIONS.length, uniqueTypes: BHAISHAJYA_FORMULATION_STATS.uniqueTypes, uniqueCategories: BHAISHAJYA_FORMULATION_STATS.uniqueCategories, source: 'Bhaishajya Kalpana Kosha (Amidha Ayurveda)', typeCounts: BHAISHAJYA_FORMULATION_STATS.typeCounts, categoryCounts: BHAISHAJYA_FORMULATION_STATS.categoryCounts },
  // Ashtanga Hridaya
  ashtangaHridaya: ASHTANGA_HRIDAYA_COMPLETE,
  ashtangaChapters: ASHTANGA_CHAPTERS,
  ashtangaSearch: searchAshtangaHridaya,
  ashtangaMetadata: { totalChapters: ASHTANGA_CHAPTERS.length, totalSthanas: 6, sthanaCounts: ASHTANGA_HRIDAYA_COMPLETE.sthanaCounts, source: 'Ashtanga Hridaya (Vagbhata)' },
  // Siddhanta Kosha (162 core Ayurvedic principles)
  siddhantaPrinciples: SIDDHANTA_PRINCIPLES,
  siddhantaStats: SIDDHANTA_STATS,
  // Kerala Ayurveda RAG (practical product/clinical info)
  keralaAyurveda: KERALA_AYURVEDA_DOCUMENTS,
  keralaAyurvedaMetadata: KERALA_AYURVEDA_STATS,
  // Indian Vedas Corpus (Charaka, Sushruta, Rasa Jala Nidhi, IRJAY)
  vedasCorpus: VEDAS_CORPUS,
  vedasCorpusMetadata: VEDAS_CORPUS_STATS,
  // Ayurwiki Herbs (2,185 herbs)
  ayurwikiHerbs: AYURWIKI_HERBS,
  ayurwikiMetadata: { totalHerbs: AYURWIKI_HERBS.length, source: 'Ayurwiki Wikipedia' },
  // Gita/Datasets Charak Samhita (7,978 verses)
  gitaCharakSamhita: GITACARAK_SAMHITA,
  gitaCharakMetadata: { totalChapters: GITACARAK_SAMHITA.totalChapters, totalVerses: GITACARAK_SAMHITA.totalVerses, source: GITACARAK_SAMHITA.source },
  // Charak Samhita Online (9,730 shlokas from carakasamhitaonline.com)
  charakOnlineShlokas: CHARAK_ONLINE_SHLOKAS,
  charakOnlineChapters: CHARAK_ONLINE_CHAPTERS,
  charakOnlineSthanas: CHARAK_ONLINE_STHANAS,
  charakOnlineMetadata: CHARAK_ONLINE_STATS,
  // WHO International Standard Terminologies on Ayurveda (3,547 terms)
  whoItaTerms: WHO_ITA_TERMS,
  whoItaChapters: WHO_ITA_CHAPTERS,
  whoItaMetadata: { totalTerms: WHO_ITA_STATS.totalTerms, source: 'WHO ITA Standard', highConfidence: WHO_ITA_STATS.highConfidence, withDevanagari: WHO_ITA_STATS.withDevanagari, chapterCounts: WHO_ITA_STATS.chapterCounts },
  whoItaSearch: searchWhoItaTerms,
  whoItaLookup: lookupWhoItaTerm,
  whoItaGetChapter: getWhoItaChapter,
  whoItaGetChapterByName: getWhoItaChapterByName,
  // Knowledge Graph functions
  graphLookupNode: lookupGraphNode,
  graphGetNodeLabel: getNodeLabel,
  graphTreatsForDisease: getTreatsForDisease,
  graphDiseasesTreatedBy: getDiseasesTreatedBy,
  graphSymptomsOfDisease: getSymptomsOfDisease,
  graphDiseasesWithSymptom: getDiseasesWithSymptom,
  graphComponentsOf: getComponentsOf,
  graphCompoundContaining: getCompoundContaining,
  graphStats: getGraphStats(),
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
  if (SUSHRUTA_CHAPTERS && SUSHRUTA_CHAPTERS.length > 0) {
    for (const sch of SUSHRUTA_CHAPTERS) {
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

  // 13. Search Dr. Vasishth clinical experiences
  if (VASISHTH_ARTICLES && VASISHTH_ARTICLES.length > 0) {
    for (const art of VASISHTH_ARTICLES) {
      if (
        art.title.toLowerCase().includes(lowerQuery) ||
        art.series.toLowerCase().includes(lowerQuery) ||
        art.contentEn.toLowerCase().includes(lowerQuery) ||
        art.contentHi.toLowerCase().includes(lowerQuery) ||
        art.category.toLowerCase().includes(lowerQuery)
      ) {
        const snippet = art.contentEn.slice(0, 300).replace(/\n/g, ' ');
        results.push(`Dr. Vasishth Clinical Experience [${art.series} #${art.number}]: ${snippet}...`)
      }
    }
  }

  // 14. Search Case Studies
  if (CASE_STUDIES && CASE_STUDIES.length > 0) {
    for (const cs of CASE_STUDIES) {
      if (
        cs.diseaseName.toLowerCase().includes(lowerQuery) ||
        cs.diseaseNameEn.toLowerCase().includes(lowerQuery) ||
        cs.category.toLowerCase().includes(lowerQuery) ||
        Object.values(cs.sections).some(s => s.toLowerCase().includes(lowerQuery))
      ) {
        const snippet = Object.values(cs.sections).join(' ').slice(0, 300).replace(/\n/g, ' ');
        results.push(`Ayur Case Study #${cs.caseNumber}: ${cs.diseaseName} (${cs.diseaseNameEn}) [${cs.category}] — ${snippet}...`)
      }
    }
  }

  // 15. Search Case Treatments
  if (CASE_TREATMENTS && CASE_TREATMENTS.length > 0) {
    for (const tx of CASE_TREATMENTS) {
      if (
        tx.title.toLowerCase().includes(lowerQuery) ||
        tx.content.toLowerCase().includes(lowerQuery)
      ) {
        const snippet = tx.content.slice(0, 300).replace(/\n/g, ' ');
        results.push(`Ayur Treatment #${tx.treatmentNumber}: ${tx.title} — ${snippet}...`)
      }
    }
  }

  // 16. Search Planet Ayurveda Diseases
  if (PLANET_AYURVEDA_DISEASES && PLANET_AYURVEDA_DISEASES.length > 0) {
    for (const dis of PLANET_AYURVEDA_DISEASES) {
      if (
        dis.name.toLowerCase().includes(lowerQuery) ||
        dis.category.toLowerCase().includes(lowerQuery) ||
        Object.values(dis.sections).some(s => s.toLowerCase().includes(lowerQuery))
      ) {
        const snippet = dis.fullContent.slice(0, 300).replace(/\n/g, ' ');
        results.push(`Planet Ayurveda - ${dis.name} [${dis.category}]: ${snippet}...`)
      }
    }
  }

  // 17. Search Planet Ayurveda Herbs
  if (PLANET_AYURVEDA_HERBS && PLANET_AYURVEDA_HERBS.length > 0) {
    for (const herb of PLANET_AYURVEDA_HERBS) {
      if (
        herb.name.toLowerCase().includes(lowerQuery) ||
        Object.values(herb.sections).some(s => s.toLowerCase().includes(lowerQuery))
      ) {
        const snippet = herb.fullContent.slice(0, 300).replace(/\n/g, ' ');
        results.push(`Planet Ayurveda Herb - ${herb.name}: ${snippet}...`)
      }
    }
  }

  // 18. Search Planet Ayurveda Classical Formulations
  if (PLANET_AYURVEDA_FORMULATIONS && PLANET_AYURVEDA_FORMULATIONS.length > 0) {
    for (const form of PLANET_AYURVEDA_FORMULATIONS) {
      if (
        form.name.toLowerCase().includes(lowerQuery) ||
        form.category.toLowerCase().includes(lowerQuery) ||
        Object.values(form.sections).some(s => s.toLowerCase().includes(lowerQuery))
      ) {
        const snippet = form.fullContent.slice(0, 300).replace(/\n/g, ' ');
        results.push(`Classical Formulation [${form.category}] - ${form.name}: ${snippet}...`)
      }
    }
  }

  // 19. Search Amidha Herb Database (360 herbs)
  const amidhaMatches = searchAmidhaHerbs(query)
  if (amidhaMatches && amidhaMatches.length > 0) {
    for (const herb of amidhaMatches.slice(0, 5)) {
      const snippet = herb.preview || `${herb.name} (${herb.botanical_name}) - ${herb.english_name}`;
      results.push(`Amidha Herb Database - ${herb.name} (${herb.botanical_name}) [${herb.family}]: ${snippet}. Rasa: ${herb.rasa.join(', ')}; Virya: ${herb.virya}; Vipaka: ${herb.vipaka}. Indications: ${herb.main_indications.join(', ')}`)
    }
  }

  // 20. Search Bhaishajya Kalpana Kosha (176 classical formulations)
  const bhaishajyaMatches = searchBhaishajyaFormulations(query)
  if (bhaishajyaMatches && bhaishajyaMatches.length > 0) {
    for (const form of bhaishajyaMatches.slice(0, 5)) {
      const snippet = form.indications || `${form.name} (${form.type}) - ${form.category}`;
      results.push(`Bhaishajya Kalpana Kosha - ${form.name} (${form.type}) [${form.category}]: ${snippet}. Ingredients: ${form.main_ingredients.join(', ')}. Reference: ${form.reference}. Dosage: ${form.dosage}. Anupana: ${form.anupana}`)
    }
  }

  // 21. Search Ashtanga Hridaya chapters
  const ashtangaMatches = searchAshtangaHridaya(query)
  if (ashtangaMatches && ashtangaMatches.length > 0) {
    for (const ch of ashtangaMatches.slice(0, 5)) {
      results.push(`Ashtanga Hridaya [${ch.sthana} Ch.${ch.chapterNumber}] - ${ch.title} (${ch.sanskritTitle}): ${ch.description}. Key Topics: ${ch.keyTopics.join(', ')}. Clinical Applications: ${ch.clinicalApplications.join(', ')}`)
    }
  }

  // 22. Search Siddhanta Kosha (162 core Ayurvedic principles)
  const siddhantaMatches = searchSiddhantaPrinciples(query)
  if (siddhantaMatches && siddhantaMatches.length > 0) {
    for (const principle of siddhantaMatches.slice(0, 5)) {
      results.push(`Siddhanta Kosha [${principle.category}] - ${principle.name}: ${principle.explanation}. Clinical Importance: ${principle.clinical_importance}. Reference: ${principle.shloka_ref}`)
    }
  }

  // 23. Search Kerala Ayurveda (products, programs, educational content)
  const keralaMatches = searchKeralaAyurveda(query)
  if (keralaMatches && keralaMatches.length > 0) {
    for (const doc of keralaMatches.slice(0, 5)) {
      const snippet = doc.content.slice(0, 300).replace(/\n/g, ' ');
      results.push(`Kerala Ayurveda [${doc.category}] - ${doc.title} (${doc.type}): ${snippet}...`)
    }
  }

  // 24. Search Indian Vedas Corpus (Charaka, Sushruta, Rasa Jala Nidhi, IRJAY)
  const vedasMatches = searchVedasCorpus(query)
  if (vedasMatches && vedasMatches.length > 0) {
    for (const record of vedasMatches.slice(0, 5)) {
      const snippet = record.content.slice(0, 300).replace(/\n/g, ' ');
      results.push(`Indian Vedas Corpus [${record.collection}] - ${record.metadata.trim()}: ${snippet}...`)
    }
  }

  // 25. Search Ayurwiki Herbs (2,185 herbs from 30+ languages)
  const ayurwikiMatches = searchAyurwikiHerbs(query)
  if (ayurwikiMatches && ayurwikiMatches.length > 0) {
    for (const herb of ayurwikiMatches.slice(0, 5)) {
      const names = herb.commonNames?.[0] ? ` (${herb.commonNames[0]})` : '';
      results.push(`Ayurwiki - ${herb.scientificName}${names} [${herb.habit || 'N/A'}]: ${herb.medicalConditions?.join(', ') || 'N/A'}. Parts Used: ${herb.partsUsed?.join(', ') || 'N/A'}. Cultivation: ${herb.cultivation || 'N/A'}`)
    }
  }

  // 26. Search Gita/Datasets Charak Samhita (7,978 verses across 8 Sthanas)
  const gitaCharakMatches = searchGitaCharak(query)
  if (gitaCharakMatches && gitaCharakMatches.length > 0) {
    for (const verse of gitaCharakMatches.slice(0, 5)) {
      results.push(`Charak Samhita [${verse.sthana} ${verse.chapterNumber}] - Verse ${verse.verseId}: ${verse.text}`)
    }
  }

  // 27. Search Charak Samhita Online (9,730 shlokas from carakasamhitaonline.com)
  const charakOnlineMatches = searchCharakOnline(query)
  if (charakOnlineMatches && charakOnlineMatches.length > 0) {
    for (const shloka of charakOnlineMatches.slice(0, 5)) {
      results.push(`Charak Samhita Online [${shloka.sthana} Ch.${shloka.chapterNumber}] - Verse ${shloka.verseNumber}: ${shloka.devanagari}`)
      if (shloka.english) {
        results.push(`  Translation: ${shloka.english}`)
      }
    }
  }

  // 28. Search Tattva & Vidhi Vimarsha (Fundamental Principles + Applied Inferences)
  const vimarshaMatches = searchTattvaVimarsha(query)
  if (vimarshaMatches && vimarshaMatches.length > 0) {
    for (const match of vimarshaMatches.slice(0, 5)) {
      results.push(`Tattva Vimarsha [${match.entry.sthana} Ch.${match.entry.chapterNumber}] - ${match.entry.chapterTitle}: ${match.matchedContent.substring(0, 300)}`)
    }
  }

  // 29. Search WHO ITA Terms (3,547 standardized terms)
  const whoItaMatches = searchWhoItaTerms(query)
  if (whoItaMatches && whoItaMatches.length > 0) {
    for (const term of whoItaMatches.slice(0, 5)) {
      const devStr = term.devanagari ? ` (${term.devanagari})` : '';
      const iastStr = term.iast ? ` [${term.iast}]` : '';
      const descStr = term.description ? ` - ${term.description}` : '';
      results.push(`WHO ITA [${term.term_id}] ${term.english}${devStr}${iastStr}${descStr} (${term.category.chapter_name}, confidence: ${term.confidence.level})`)
    }
  }

  // 30. Search Knowledge Graph - TREATS relationships
  const graphTreatsMatches = searchWhoItaTerms(query)
  for (const term of graphTreatsMatches.slice(0, 3)) {
    const diseasesTreated = getDiseasesTreatedBy(term.term_id)
    if (diseasesTreated.length > 0) {
      const diseaseNames = diseasesTreated.slice(0, 3).map(d => getNodeLabel(d.disease.id)).join(', ')
      results.push(`Treatment [${term.term_id}] ${term.english} treats: ${diseaseNames}`)
    }
  }

  // 31. Search Knowledge Graph - SYMPTOM_OF relationships
  for (const term of graphTreatsMatches.slice(0, 3)) {
    const diseasesWithSymptom = getDiseasesWithSymptom(term.term_id)
    if (diseasesWithSymptom.length > 0) {
      const diseaseNames = diseasesWithSymptom.slice(0, 3).map(d => getNodeLabel(d.disease.id)).join(', ')
      results.push(`Symptom [${term.term_id}] ${term.english} indicates: ${diseaseNames}`)
    }
  }

  // 32. Search Knowledge Graph - COMPOSED_OF relationships
  for (const term of graphTreatsMatches.slice(0, 3)) {
    const components = getComponentsOf(term.term_id)
    if (components.length > 0) {
      const componentNames = components.slice(0, 3).map(c => getNodeLabel(c.component.id)).join(', ')
      results.push(`Compound [${term.term_id}] ${term.english} contains: ${componentNames}`)
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