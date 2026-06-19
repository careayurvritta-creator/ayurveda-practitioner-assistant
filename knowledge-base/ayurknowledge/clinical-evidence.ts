/**
 * Clinical Evidence — PubMed research papers and Ayurveda clinical trials
 * Populated by `scripts/ingest-pubmed.ts`
 */

export interface ClinicalEvidence {
  pmid: string
  title: string
  authors: string[]
  journal: string
  publicationDate: string
  abstract: string
  doi?: string
  meshTerms: string[]
  studyType: string       // 'clinical_trial', 'review', 'case_report', 'meta_analysis', 'systematic_review'
  evidenceLevel: string   // 'systematic_review', 'rct', 'cohort', 'case_control', 'case_series', 'expert_opinion'
  ayurvedaRelevance: string
  herbsMentioned: string[]
  conditionsMentioned: string[]
}

/**
 * Empty array — to be populated by `scripts/ingest-pubmed.ts`.
 * Run: `npx tsx scripts/ingest-pubmed.ts`
 */
export const CLINICAL_EVIDENCE: ClinicalEvidence[] = []
