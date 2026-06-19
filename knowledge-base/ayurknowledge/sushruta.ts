/**
 * Sushruta Samhita — Classical surgical/anatomical Ayurvedic text
 * Mirrors CharakChapter structure with surgical-specific extensions
 */

export interface SurgicalProcedure {
  name: string
  sanskrit: string
  indication: string
  procedure: string[]
  instruments: string[]
  complications: string[]
  postOperative: string[]
}

export interface AnatomyDescription {
  structure: string
  sanskrit: string
  description: string
  clinicalSignificance: string
}

export interface SushrutaShloka {
  number: string
  sanskrit?: string
  translation: string
  commentary?: string
}

export interface SushrutaTopic {
  title: string
  content: string
  clinicalRelevance?: string
}

export interface SushrutaTreatmentProtocol {
  condition: string
  treatment: string
  herbs: string[]
  dosage: string
  duration: string
  precautions: string[]
}

export interface SushrutaChapter {
  id: string
  sthana: string
  chapterNumber: number
  name: string
  sanskrit?: string
  english: string
  summary: string
  keyConcepts: string[]
  shlokas: SushrutaShloka[]
  topics: SushrutaTopic[]
  doshaDiscussion: string[]
  treatmentProtocols?: SushrutaTreatmentProtocol[]
  treatmentPrinciples?: string[]
  dietaryGuidelines?: string[]
  diseaseDescriptions?: Array<{
    name: string
    sanskrit: string
    etiology: string
    symptoms: string[]
    prognosis: string
    treatment: string
  }>
  clinicalApplications: string[]
  // Sushruta-specific
  surgicalProcedures?: SurgicalProcedure[]
  anatomyDescriptions?: AnatomyDescription[]
}

/**
 * Empty array — to be populated by ingestion scripts or manual data entry.
 * Run `npx tsx scripts/ingest-huggingface.ts` to populate from external sources.
 */
export const SUSHruta_CHAPTERS: SushrutaChapter[] = []
