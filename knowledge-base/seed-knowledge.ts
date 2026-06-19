/**
 * Seed Knowledge Base Tables
 *
 * Reads data from src/lib/ayurknowledge/ and inserts into Supabase tables.
 * Run: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-knowledge.ts
 */

import { createClient } from '@supabase/supabase-js'
import { DISEASES } from './ayurknowledge/diseases'
import { HERBS } from './ayurknowledge/herbs'
import { TREATMENTS } from './ayurknowledge/treatments'
import { ALLOPATHY_INTEGRATION } from './ayurknowledge/allopathy'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function mapVirya(v: string): string {
  const lower = v.toLowerCase()
  if (lower.includes('ushna') || lower.includes('hot')) return 'Ushna'
  return 'Sheeta'
}

function mapVipaka(v: string): string {
  const lower = v.toLowerCase()
  if (lower.includes('aml')) return 'Amla'
  if (lower.includes('katu') || lower.includes('pungent')) return 'Katu'
  return 'Madhura'
}

async function upsertBatch(table: string, rows: Record<string, unknown>[], conflictCol: string) {
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50)
    const { error } = await supabase.from(table).upsert(batch, { onConflict: conflictCol })
    if (error) {
      console.error(`  ${table} batch ${Math.floor(i/50)+1}:`, error.message)
      for (const row of batch) {
        const { error: e2 } = await supabase.from(table).upsert(row, { onConflict: conflictCol })
        if (e2) console.error(`    ${table} row ${(row as Record<string, unknown>)[conflictCol]}:`, e2.message)
      }
    }
  }
}

async function seed() {
  console.log('Seeding knowledge base tables...\n')

  // 1. Diseases (using actual DiseaseEntry interface)
  console.log(`Seeding ${DISEASES.length} diseases...`)
  const diseaseRows = DISEASES.map(d => ({
    disease_code: d.id,
    name: d.name,
    sanskrit_name: d.sanskrit,
    category: d.category,
    modern_correlation: d.modernCorrelation || null,
    samprapti: d.samprapti || null,
    dosha_involvement: d.doshaInvolvement || [],
    clinical_features: d.clinicalFeatures || [],
    diagnostic_criteria: d.diagnosticCriteria || [],
    treatment: d.treatment || [],
    pathya: d.pathya || [],
    apathya: d.apathya || [],
    prognosis: d.prognosis || null,
  }))
  await upsertBatch('diseases', diseaseRows, 'disease_code')
  console.log('  Done.')

  // 2. Herbs (using actual Herb interface)
  console.log(`Seeding ${HERBS.length} herbs...`)
  const herbRows = HERBS.map(h => ({
    herb_code: h.id,
    name: h.name,
    botanical_name: h.botanicalName,
    family: h.family,
    sanskrit_name: h.sanskrit || null,
    rasa: h.rasa || [],
    guna: h.guna || [],
    virya: mapVirya(h.virya || 'Sheeta'),
    vipaka: mapVipaka(h.vipaka || 'Madhura'),
    prabhava: h.prabhava || null,
    dosha_karma: h.doshaKarma || {},
    indications: h.indications || [],
    contraindications: h.contraindications || [],
    part_used: h.partUsed || [],
    dosage: h.dosage || null,
    classical_formulations: {},
  }))
  await upsertBatch('herbs', herbRows, 'herb_code')
  console.log('  Done.')

  // 3. Treatments (using actual Treatment interface)
  console.log(`Seeding ${TREATMENTS.length} treatments...`)
  const treatmentRows = TREATMENTS.map(t => ({
    treatment_code: t.id,
    name: t.name,
    sanskrit_name: t.sanskrit,
    category: t.category,
    description: t.description || null,
    indications: t.indications || [],
    contraindications: t.contraindications || [],
    procedure: t.procedure || [],
    preparation: t.preparation || [],
    post_treatment: t.postTreatment || [],
    typical_duration: t.duration || null,
    frequency: null,
    classical_reference: null,
  }))
  await upsertBatch('treatments', treatmentRows, 'treatment_code')
  console.log('  Done.')

  // 4. Allopathy integrations (using actual AllopathyIntegration interface)
  console.log(`Seeding ${ALLOPATHY_INTEGRATION.length} allopathy integrations...`)
  const allopathyRows = ALLOPATHY_INTEGRATION.map(a => ({
    condition_name: a.condition,
    allopathic_drug: a.allopathyTreatment || null,
    ayurvedic_herb: a.ayurvedicCorrelation || null,
    interaction_type: 'safe',
    severity: 'low',
    description: a.integratedApproach || null,
    mechanism: a.safetyNotes ? a.safetyNotes.join('; ') : null,
    recommendation: a.integratedApproach || null,
    monitoring_parameters: a.monitoringParameters || [],
    evidence_level: 'clinical',
    source_references: [],
  }))
  await upsertBatch('allopathy_integration', allopathyRows, 'condition_name')
  console.log('  Done.')

  console.log('\nKnowledge base seeding complete!')
}

seed().catch(console.error)
