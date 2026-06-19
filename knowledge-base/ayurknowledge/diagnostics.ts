export interface DiagnosticMethod {
  id: string
  name: string
  sanskrit: string
  description: string
  components: string[]
  clinicalApplication: string[]
}

export const DIAGNOSTIC_METHODS: DiagnosticMethod[] = [
  {
    id: 'trividha',
    name: 'Three-fold Examination',
    sanskrit: 'त्रिविध परीक्षा',
    description: 'Three basic methods of examination as described in Charaka Samhita',
    components: ['Prashna (Questioning)', 'Darshana (Observation)', 'Sparsha (Palpation)'],
    clinicalApplication: ['Initial patient assessment', 'Basic history taking', 'General physical examination']
  },
  {
    id: 'ashtavidha',
    name: 'Eight-fold Examination',
    sanskrit: 'अष्टविध परीक्षा',
    description: 'Comprehensive eight-point examination system',
    components: [
      'Naadi (Pulse) - Vata (snake), Pitta (frog), Kapha (swan) movements',
      'Mootra (Urine) - color, consistency, frequency',
      'Mala (Stool) - color, consistency, odor, floating',
      'Jivha (Tongue) - coating, color, shape',
      'Drik (Eyes) - sclera, conjunctiva, vision',
      'Shabda (Voice) - clarity, strength, tone',
      'Sparsh (Skin) - temperature, texture, moisture',
      'Aakriti (Body build) - structure, proportions'
    ],
    clinicalApplication: ['Detailed constitution assessment', 'Dosha imbalance detection', 'Disease stage determination', 'Treatment planning']
  },
  {
    id: 'dashavidha',
    name: 'Ten-fold Examination',
    sanskrit: 'दशविध परीक्षा',
    description: 'Ten parameter examination for comprehensive patient assessment',
    components: [
      'Prakriti (Constitution)',
      'Vikriti (Current imbalance)',
      'Sara (Tissue quality)',
      'Samhanana (Body compactness)',
      'Pramana (Measurements)',
      'Vayah (Age)',
      'Satva (Mental strength)',
      'Satmya (Suitability)',
      'Ahara Shakti (Dietary capacity)',
      'Vyayama Shakti (Exercise capacity)'
    ],
    clinicalApplication: ['Treatment selection', 'Prognosis assessment', 'Dietary recommendations', 'Lifestyle planning']
  },
  {
    id: 'naadi',
    name: 'Pulse Diagnosis',
    sanskrit: 'नाडी परीक्षा',
    description: 'Ancient method of reading pulse to determine dosha status',
    components: [
      'Vata - Index finger, Light pressure - Fast, Irregular, Thin, Cold, Snake-like movement (sarpa gati)',
      'Pitta - Middle finger, Medium pressure - Strong, Regular, Bounding, Warm, Frog-like movement (manduka gati)',
      'Kapha - Ring finger, Heavy pressure - Slow, Regular, Deep, Cool, Swan-like movement (hans gati)'
    ],
    clinicalApplication: ['Constitution determination', 'Current dosha imbalance', 'Organ status', 'Disease prognosis']
  },
  {
    id: 'prakriti',
    name: 'Constitution Assessment',
    sanskrit: 'प्रकृति परीक्षण',
    description: 'Determining inherent body constitution based on dosha predominance',
    components: [
      'Vataja - Lean body, dry skin, cold hands/feet, irregular hunger/sleep, creative mind, anxious tendency',
      'Pittaja - Medium build, warm body, sharp hunger/thirst, good intellect, ambitious, impatient',
      'Kaphaja - Sturdy build, slow metabolism, calm demeanor, good memory, tendency toward weight gain',
      'Vata-Pittaja - Mixed characteristics, variable symptoms',
      'Pitta-Kaphaja - Mixed characteristics, moderate metabolism',
      'Vata-Kaphaja - Mixed characteristics, variable energy',
      'Sannipataja - All three balanced, rare, considered ideal'
    ],
    clinicalApplication: ['Personalized medicine selection', 'Dosage determination', 'Dietary counseling', 'Disease susceptibility prediction', 'Treatment prognosis']
  },
  {
    id: 'vikriti',
    name: 'Current Imbalance Assessment',
    sanskrit: 'विकृति परीक्षण',
    description: 'Assessment of current disease state and dosha involvement',
    components: [
      'Dosha involvement (which doshas are aggravated)',
      'Dhatu affected (which tissues are involved)',
      'Srotas blocked (which channels are compromised)',
      'Ama presence (toxicity level)',
      'Agni status (digestive fire)',
      'Strength (Bala) - high, medium, low'
    ],
    clinicalApplication: ['Disease diagnosis', 'Treatment selection', 'Severity assessment', 'Prognosis determination']
  }
]

export const SAMPRAPTI_STAGES = [
  { stage: 1, name: 'Sanchaya', description: 'Accumulation of dosha at its seat', signs: 'Initial symptoms, mild discomfort' },
  { stage: 2, name: 'Prakopa', description: 'Aggravation and increased dosha', signs: 'Clearer symptoms, discomfort increases' },
  { stage: 3, name: 'Prasara', description: 'Spread to other locations', signs: 'Symptoms spread, multiple systems involved' },
  { stage: 4, name: 'Sthana Samshraya', description: 'Localization in tissues', signs: 'Specific tissue/organ involvement' },
  { stage: 5, name: 'Vyakti', description: 'Manifestation of disease', signs: 'Full disease presentation' },
  { stage: 6, name: 'Bheda', description: 'Differentiation and chronicity', signs: 'Complications, chronic state' }
]