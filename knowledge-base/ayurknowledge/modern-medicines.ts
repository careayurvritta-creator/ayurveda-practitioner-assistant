/**
 * Modern Medicines — Indian pharmaceutical data (1mg.com sourced)
 * Populated by `scripts/ingest-huggingface.ts`
 */

export interface ModernMedicine {
  id: string
  medicineName: string
  composition: string
  manufacturer?: string
  uses: string
  sideEffects?: string
  precautions?: string
  drugInteractions?: string
  ayurvedicAlternatives?: string[]
  therapeuticClass?: string
}

/**
 * Empty array — to be populated by `scripts/ingest-huggingface.ts`.
 * Run: `npx tsx scripts/ingest-huggingface.ts`
 */
export const MODERN_MEDICINES: ModernMedicine[] = []
