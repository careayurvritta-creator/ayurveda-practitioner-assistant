/**
 * External Q&A — Ayurveda question-answer pairs from HuggingFace datasets
 * Populated by `scripts/ingest-huggingface.ts`
 */

export interface ExternalQA {
  id: string
  sourceDataset: 'sushruta_qa' | 'ayurveda_qa'
  question: string
  answer: string
  context?: string
  category?: string
  classicalReference?: string
}

/**
 * Empty array — to be populated by `scripts/ingest-huggingface.ts`.
 * Run: `npx tsx scripts/ingest-huggingface.ts`
 */
export const EXTERNAL_QA: ExternalQA[] = []
