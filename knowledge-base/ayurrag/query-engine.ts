/**
 * Query Engine — Enhanced Intent Analysis & Entity Extraction
 *
 * Analyzes user queries for:
 * - Intent classification (diagnosis, treatment, herb, etc.)
 * - Entity extraction (diseases, herbs, treatments, doshas)
 * - Complexity assessment
 * - Safety warning detection
 * - Related concept extraction for query expansion
 */

import {
  AYURVEDA_KNOWLEDGE,
  getDiseaseInfo,
  getTreatmentInfo,
  getHerbInteractions,
  checkDrugInteraction,
  getAllopathyIntegration,
  getPrakritiGuidance,
  searchKnowledge
} from '../ayurknowledge'

export interface QueryAnalysis {
  intent: 'diagnosis' | 'treatment' | 'herb' | 'drug_interaction' | 'prakriti' | 'integration' | 'general' | 'procedure' | 'diet' | 'research'
  entities: string[]
  relatedConcepts: string[]
  context: string[]
  requiresSafetyWarning: boolean
  complexity: 'simple' | 'moderate' | 'complex'
  suggestedSources: string[]
}

// ─── Intent Patterns ─────────────────────────────────────────────────────────

const INTENT_PATTERNS: Record<string, string[]> = {
  diagnosis: [
    'diagnosis', 'diagnose', 'symptom', 'disease', 'what is', 'caused by',
    'treatment for', 'condition', 'suffering from', 'problem with',
    'vyadhi', 'roga', 'lakshana', 'nidana', 'samprapti',
  ],
  treatment: [
    'treatment', 'therapy', 'chikitsa', 'manage', 'cure', 'heal',
    'protocol', 'upchar', 'ilaaj', 'remedy',
    'panchakarma', 'basti', 'vamana', 'virechana', 'nasya', 'raktamokshana',
    'shodhana', 'shamana', 'rasayana', 'vajikarana',
  ],
  herb: [
    'herb', 'medicine', 'drug', 'formulation', 'churna', 'ghrita', 'taila',
    'vati', 'bhasma', 'kashaya', 'asava', 'arishta', 'avaleha',
    'dravya', 'aushadha', 'plant', 'medicinal',
  ],
  drug_interaction: [
    'interaction', 'side effect', 'combine', 'with allopathy', 'with medicine',
    'with tablet', 'with syrup', 'safe to take', 'contraindic', 'together',
    'along with', 'mixed with',
  ],
  prakriti: [
    'prakriti', 'constitution', 'body type', 'dosha', 'vata', 'pitta', 'kapha',
    'vikriti', 'agni', 'ama', 'ojas', 'srotas', 'dhatu', 'mala',
    'tridosha', 'balanced', 'imbalanced',
  ],
  integration: [
    'allopathy', 'modern medicine', 'with english medicine', 'integrate',
    'with modern', 'combine', 'ayurvedic and', 'along with modern',
  ],
  procedure: [
    'procedure', 'how to', 'process', 'steps', 'method', 'protocol',
    'perform', 'administer', 'apply', 'technique',
  ],
  diet: [
    'diet', 'food', 'pathya', 'apathya', 'ahara', 'nutrition', 'eat',
    'avoid', 'ritucharya', 'dinacharya', 'lifestyle', 'routine',
    'what to eat', 'what not to eat',
  ],
  research: [
    'research', 'study', 'trial', 'evidence', 'pubmed', 'clinical',
    'journal', 'systematic', 'meta-analysis', 'published', 'paper',
  ],
}

// ─── Entity Extraction ───────────────────────────────────────────────────────

/**
 * Extract entities from the query by matching against knowledge base.
 */
export function extractEntities(query: string): string[] {
  const entities: string[] = []
  const lowerQuery = query.toLowerCase()

  // Extract disease names
  for (const disease of AYURVEDA_KNOWLEDGE.diseases) {
    if (lowerQuery.includes(disease.name.toLowerCase()) ||
        lowerQuery.includes(disease.sanskrit.toLowerCase())) {
      entities.push(disease.name)
    }
  }

  // Extract herb names
  for (const herb of AYURVEDA_KNOWLEDGE.herbs) {
    if (lowerQuery.includes(herb.name.toLowerCase()) ||
        lowerQuery.includes(herb.sanskrit.toLowerCase())) {
      entities.push(herb.name)
    }
  }

  // Extract treatment names
  for (const treatment of AYURVEDA_KNOWLEDGE.treatments) {
    if (lowerQuery.includes(treatment.name.toLowerCase()) ||
        lowerQuery.includes(treatment.sanskrit.toLowerCase())) {
      entities.push(treatment.name)
    }
  }

  return [...new Set(entities)]
}

/**
 * Extract related concepts for query expansion.
 */
function extractRelatedConcepts(query: string, intent: string): string[] {
  const concepts: string[] = []
  const lowerQuery = query.toLowerCase()

  // Disease-specific related concepts
  const diseaseConcepts: Record<string, string[]> = {
    'arthritis': ['sandhivata', 'amavata', 'joint pain', 'swelling', 'stiffness'],
    'diabetes': ['prameha', 'madhumeha', 'blood sugar', 'insulin', 'metabolic'],
    'hypertension': ['raktachapa', 'uchcha raktachapa', 'blood pressure', 'cardiovascular'],
    'asthma': ['swasa', 'tamaka swasa', 'breathing', 'respiratory', 'bronchial'],
    'skin disease': ['kushtha', 'twak roga', 'dermatitis', 'eczema', 'psoriasis'],
    'digestive': ['grahani', 'agnimandya', 'ajirna', 'digestion', 'gut'],
    'anxiety': ['chittodvega', 'vata vyadhi', 'mental health', 'stress'],
    'insomnia': ['anidra', 'nidranasha', 'sleep', 'sleep disorder'],
    'obesity': ['sthaulya', 'medoroga', 'weight', 'overweight'],
    'headache': ['shirahshoola', 'ardhavabhedaka', 'migraine', 'head pain'],
    'constipation': ['vibandha', 'malabaddhata', 'bowel', 'stool'],
    'fever': ['jwara', 'sannipata jwara', 'temperature', 'infection'],
    'cough': ['kasa', 'vataja kasa', 'respiratory'],
    'cold': ['pratishyaya', 'shirahkapha', 'nasal', 'congestion'],
    'acidity': ['amlapitta', 'parinama shoola', 'gastric', 'acid reflux'],
    'gastric': ['ajirna', 'agnimandya', 'digestion', 'stomach'],
    'joint pain': ['sandhishoola', 'sandhigata vata', 'arthritis'],
    'back pain': ['katishoola', 'pristha shoola', 'gridhrasi', 'sciatica'],
    'eye disease': ['netra roga', 'drishti dosha', 'vision'],
    'heart': ['hridroga', 'hrudaya', 'cardiac', 'cardiovascular'],
    'kidney': ['mutravaha srotas', 'mutra roga', 'renal'],
    'liver': ['yakrit', 'pleeha', 'hepatic'],
    'thyroid': ['galaganda', 'meda dhatu', 'endocrine'],
    'pcos': ['artava kshaya', 'rajodushti', 'hormonal', 'ovarian'],
    'menstrual': ['rajodushti', 'artava vyadhi', 'periods', 'menstruation'],
  }

  for (const [condition, related] of Object.entries(diseaseConcepts)) {
    if (lowerQuery.includes(condition)) {
      concepts.push(...related)
    }
  }

  // Intent-specific concepts
  if (intent === 'treatment') {
    concepts.push('chikitsa', 'upchar', 'ilaaj', 'protocol', 'therapy')
  }
  if (intent === 'diagnosis') {
    concepts.push('samprapti', 'nidana', 'lakshana', 'vyadhi')
  }
  if (intent === 'herb') {
    concepts.push('dravya', 'aushadha', 'rasa', 'guna', 'virya', 'vipaka')
  }

  return [...new Set(concepts)]
}

// ─── Main Query Analysis ─────────────────────────────────────────────────────

export function analyzeQuery(query: string): QueryAnalysis {
  const lowerQuery = query.toLowerCase()

  // Detect intent
  let intent: QueryAnalysis['intent'] = 'general'
  let maxMatches = 0

  for (const [key, patterns] of Object.entries(INTENT_PATTERNS)) {
    const matches = patterns.filter(p => lowerQuery.includes(p)).length
    if (matches > maxMatches) {
      maxMatches = matches
      intent = key as QueryAnalysis['intent']
    }
  }

  // Extract entities
  const entities = extractEntities(query)

  // Extract related concepts
  const relatedConcepts = extractRelatedConcepts(query, intent)

  // Determine safety warning requirement
  const requiresSafetyWarning = ['drug_interaction', 'integration', 'treatment'].includes(intent) ||
    lowerQuery.includes('combine') ||
    lowerQuery.includes('together') ||
    lowerQuery.includes('along with')

  // Determine complexity
  const complexity = intent === 'general' ? 'simple' :
                    ['herb', 'prakriti', 'diet'].includes(intent) ? 'moderate' : 'complex'

  // Suggest sources based on intent
  const suggestedSources: string[] = []
  switch (intent) {
    case 'diagnosis':
      suggestedSources.push('diseases', 'diagnostics', 'clinical_cases')
      break
    case 'treatment':
      suggestedSources.push('treatments', 'charak_chapters', 'clinical_cases')
      break
    case 'herb':
      suggestedSources.push('herbs', 'allopathy_integration')
      break
    case 'drug_interaction':
      suggestedSources.push('allopathy_integration', 'modern_medicines')
      break
    case 'prakriti':
      suggestedSources.push('fundamentals', 'diagnostics')
      break
    case 'diet':
      suggestedSources.push('diseases', 'charak_chapters')
      break
    case 'research':
      suggestedSources.push('clinical_evidence')
      break
    case 'procedure':
      suggestedSources.push('treatments', 'charak_chapters', 'sushruta_chapters')
      break
  }

  return {
    intent,
    entities,
    relatedConcepts,
    context: [],
    requiresSafetyWarning,
    complexity,
    suggestedSources,
  }
}

// ─── Response Generation (Fallback) ──────────────────────────────────────────

export function generateAyurvedaResponse(query: string, userContext?: { prakriti?: string; conditions?: string[] }): string {
  const analysis = analyzeQuery(query)
  let response = ''

  switch (analysis.intent) {
    case 'diagnosis': {
      const diseaseInfo = analysis.entities.length > 0
        ? getDiseaseInfo(analysis.entities[0])
        : null
      response = diseaseInfo || searchKnowledge(query)
      break
    }

    case 'treatment': {
      const treatmentInfo = analysis.entities.length > 0
        ? getTreatmentInfo(analysis.entities[0])
        : null
      response = treatmentInfo || searchKnowledge(query)
      break
    }

    case 'herb':
      response = searchKnowledge(query)
      break

    case 'drug_interaction': {
      const herbName = analysis.entities[0] || extractDrugFromQuery(query)
      const drugClass = extractDrugClassFromQuery(query)
      response = checkDrugInteraction(herbName, drugClass)
      break
    }

    case 'prakriti':
      if (analysis.entities.length > 0) {
        response = getPrakritiGuidance(analysis.entities[0])
      } else if (userContext?.prakriti) {
        response = getPrakritiGuidance(userContext.prakriti)
      } else {
        response = explainPrakriti(query)
      }
      break

    case 'integration': {
      const condition = analysis.entities.length > 0
        ? analysis.entities[0]
        : extractConditionFromQuery(query)
      const integration = getAllopathyIntegration(condition)
      response = integration || searchKnowledge(query)
      break
    }

    case 'procedure':
      response = explainProcedure(query)
      break

    case 'diet':
      response = generateDietResponse(query, userContext)
      break

    case 'research':
      response = 'For research queries, please use the Treatment Protocol feature which integrates PubMed research, clinical evidence, and classical text references.'
      break

    default:
      response = generateGeneralResponse(query, userContext)
  }

  if (analysis.requiresSafetyWarning) {
    response += SAFETY_WARNING
  }

  return response
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function extractDrugFromQuery(query: string): string {
  const drugs = ['ashwagandha', 'turmeric', 'ginger', 'garlic', 'guggulu', 'triphala', 'shatavari', 'guduchi', 'brahmi', 'amla', 'arjuna', 'neem', 'pippali']
  for (const drug of drugs) {
    if (query.toLowerCase().includes(drug)) return drug
  }
  return ''
}

function extractDrugClassFromQuery(query: string): string {
  const classes: [string, string][] = [
    ['aspirin', 'Anticoagulants'],
    ['warfarin', 'Anticoagulants'],
    ['metformin', 'Hypoglycemics'],
    ['insulin', 'Hypoglycemics'],
    ['thyroid', 'Thyroid medications'],
    ['sedative', 'Sedatives'],
    ['antidepressant', 'Antidepressants'],
    ['statins', 'Statins'],
    ['blood pressure', 'Antihypertensives'],
    ['antibiotic', 'Antibiotics'],
  ]

  for (const [keyword, className] of classes) {
    if (query.toLowerCase().includes(keyword)) return className
  }

  return 'Allopathic medication'
}

function extractConditionFromQuery(query: string): string {
  const conditions = ['diabetes', 'hypertension', 'arthritis', 'depression', 'anxiety', 'asthma', 'thyroid', 'cancer', 'fertility', 'insomnia']
  for (const cond of conditions) {
    if (query.toLowerCase().includes(cond)) return cond
  }
  return query
}

function explainPrakriti(query: string): string {
  return `
Prakriti (Constitution) Assessment:

Your inherent constitution (Prakriti) is determined at conception and remains unchanged throughout life. It influences:
- Your physical body structure
- Your mental tendencies
- Your disease susceptibility
- Your treatment response

Three Main Types:
1. Vata - Movement, creativity, quick learning
2. Pitta - Transformation, intelligence, leadership
3. Kapha - Structure, stability, good memory

Most people are dual types (e.g., Vata-Pitta).

To determine your Prakriti, I need to assess:
- Physical characteristics (body build, skin, hair)
- Physiological patterns (digestion, sleep, energy)
- Psychological traits (mindset, emotions, memory)

Would you like me to guide you through a Prakriti assessment questionnaire?

Alternatively, if you already know your Prakriti, I can provide personalized recommendations.
  `.trim()
}

function explainProcedure(query: string): string {
  const lower = query.toLowerCase()

  if (lower.includes('panchakarma')) {
    return `
Panchakarma (5 Purifying Therapies):

Panchakarma is the cornerstone of Ayurvedic treatment. It involves:

1. Vamana (Therapeutic Emesis) - Eliminates Kapha
2. Virechana (Purgation) - Eliminates Pitta
3. Basti (Medicated Enema) - Eliminates Vata
4. Nasya (Nasal Therapy) - Cleans head region
5. Raktamokshana (Bloodletting) - Purifies blood

Process:
1. Purva Karma (Preparation) - Oilation & fomentation
2. Pradhana Karma (Main treatment)
3. Paschat Karma (After-care - diet & lifestyle)

Duration: 7-21 days for each therapy
Must be done under qualified supervision

Would you like details on a specific therapy?
    `.trim()
  }

  return 'Please specify which Ayurvedic procedure or therapy you want to learn about.'
}

function generateDietResponse(query: string, userContext?: { prakriti?: string; conditions?: string[] }): string {
  const lower = query.toLowerCase()

  if (userContext?.prakriti) {
    return getPrakritiGuidance(userContext.prakriti)
  }

  if (lower.includes('vata')) {
    return `
Vata-Pacifying Diet:

FAVOR:
- Warm, cooked, moist foods
- Sweet, sour, salty tastes
- Root vegetables, squash, zucchini
- Warm grains: rice, wheat, oats
- Healthy oils: ghee, sesame, olive
- Warm milk, cream, butter
- Nuts and seeds (soaked)
- Spices: ginger, cumin, cinnamon, cardamom

AVOID:
- Raw vegetables, salads
- Cold foods and drinks
- Bitter, astringent, pungent tastes
- Dry, light foods
- Crackers, chips, popcorn
- Caffeine, alcohol
- Irregular meal times

EATING HABITS:
- Eat at regular times
- Eat in a calm environment
- Chew food thoroughly
- Avoid eating when anxious or rushed
    `.trim()
  }

  if (lower.includes('pitta')) {
    return `
Pitta-Pacifying Diet:

FAVOR:
- Cool, refreshing foods
- Sweet, bitter, astringent tastes
- Leafy greens, cucumber, zucchini
- Sweet fruits: grapes, melon, pear
- Cooling spices: coriander, fennel, mint
- Coconut oil, ghee
- Milk, butter, ghee
- Rice, wheat, oats

AVOID:
- Hot, spicy foods
- Sour, pungent, salty tastes
- Tomatoes, vinegar, citrus
- Hot peppers, garlic, onion
- Red meat, seafood
- Alcohol, coffee
- Fried foods

EATING HABITS:
- Eat at regular times
- Avoid eating when angry
- Eat in a peaceful environment
- Don't skip meals
    `.trim()
  }

  if (lower.includes('kapha')) {
    return `
Kapha-Pacifying Diet:

FAVOR:
- Light, warm, dry foods
- Pungent, bitter, astringent tastes
- Leafy greens, broccoli, cauliflower
- Light fruits: apples, pears, berries
- Spices: ginger, black pepper, turmeric
- Honey (raw)
- Legumes, light grains
- Minimal oil

AVOID:
- Heavy, oily, cold foods
- Sweet, sour, salty tastes
- Dairy (except buttermilk)
- Wheat, rice (excess)
- Nuts (excess)
- Sugar, sweets
- Cold drinks

EATING HABITS:
- Eat only when hungry
- Don't snack between meals
- Exercise before eating
- Eat largest meal at lunch
    `.trim()
  }

  return `
General Ayurvedic Diet Principles:

1. Eat fresh, seasonal, local foods
2. Eat at regular times
3. Don't skip meals
4. Eat in a calm environment
5. Chew food thoroughly
6. Don't eat when emotional
7. Drink warm water throughout the day
8. Avoid incompatible food combinations

Would you like specific dietary recommendations for your Prakriti (body type)?
  `.trim()
}

function generateGeneralResponse(query: string, userContext?: { prakriti?: string; conditions?: string[] }): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('dosha') || lowerQuery.includes('tridosha')) {
    return `
Tridosha - Three Fundamental Principles:

1. VATA (Air + Space) - Movement
   Qualities: Dry, light, cold, rough
   Functions: Circulation, nerve impulses, elimination
   Imbalance: Anxiety, constipation, arthritis

2. PITTA (Fire + Water) - Transformation
   Qualities: Hot, sharp, oily
   Functions: Digestion, metabolism, vision
   Imbalance: Ulcers, inflammation, anger

3. KAPHA (Earth + Water) - Structure
   Qualities: Heavy, slow, cold, oily
   Functions: Growth, immunity, lubrication
   Imbalance: Weight gain, congestion, depression

Balance of all three is essential for health.
    `.trim()
  }

  if (lowerQuery.includes('agni')) {
    return `
Agni (Digestive Fire):

Agni is the digestive capacity that determines:
- How well you digest food
- How efficiently you absorb nutrients
- Your immunity and vitality

Types of Agni:
1. Samagni (Balanced) - Ideal
2. Mandagni (Weak) - Slow digestion
3. Tikshnagni (Strong) - Rapid digestion
4. Vishamagni (Irregular) - Variable

Strengthen Agni through:
- Warm cooked foods
- Proper meal timing
- Avoiding overeating
- Herbs: Ginger, Pippali, Triphala

Would you like a specific Agni assessment?
    `.trim()
  }

  if (lowerQuery.includes('ama')) {
    return `
Ama (Toxicity):

Ama is undigested metabolic waste that accumulates when Agni is weak. It clogs channels (srotas) and creates disease.

Signs of Ama:
- Heaviness, lethargy
- Foggy mind
- Coated tongue
- Bad breath
- Low digestion
- Skin issues

Eliminate Ama through:
- Light fasting or kitchari diet
- Ginger, cinnamon, cardamom
- Adequate hydration
- Exercise
- Panchakarma

Would you like ama reduction recommendations?
    `.trim()
  }

  if (lowerQuery.includes('diagnos') || lowerQuery.includes('examination') || lowerQuery.includes('pariksha')) {
    return `
Ayurvedic Diagnostic Methods:

Ashtavidha Pariksha (8-fold examination):
1. Naadi (Pulse) - Vata, Pitta, Kapha characteristics
2. Mootra (Urine) - Color, consistency
3. Mala (Stool) - Digestion indicator
4. Jivha (Tongue) - Coating, color
5. Drik (Eyes) - Health indicator
6. Shabda (Voice) - Body state
7. Sparsh (Skin) - Temperature, texture
8. Aakriti (Body build) - Constitution

Trividha Pariksha:
- Prashna (Questioning)
- Darshana (Observation)
- Sparsha (Palpation)

Would you like me to explain any specific diagnostic method?
    `.trim()
  }

  return `
Welcome to Clinical AI - Your Ayurvedic Assistant!

I can help you with:

DISEASES
- Ayurvedic diagnosis and correlation with modern conditions
- Treatment approaches and prognosis

HERBS & MEDICATIONS
- Herb information and indications
- Drug interactions (herb-herb, herb-allopathy)

TREATMENTS
- Panchakarma procedures
- Detoxification protocols
- Rejuvenation therapies

ALLOPATHY INTEGRATION
- Combining Ayurveda with modern medicine
- Safety warnings and monitoring

YOUR CONSTITUTION
- Prakriti (body type) assessment
- Personalized recommendations

What would you like to know more about?
  `.trim()
}

const SAFETY_WARNING = `

---
IMPORTANT SAFETY NOTICE:
This information is for educational purposes only. Please consult qualified Ayurvedic and modern medicine practitioners before combining treatments. Individual responses may vary. Not a substitute for professional medical advice.
`.trim()

export function formatResponseForDisplay(response: string): string {
  let formatted = response
  formatted = formatted.replace(/=== /g, '## ').replace(/ ===/g, '')
  formatted = formatted.replace(/^- /gm, '- ')
  return formatted
}
