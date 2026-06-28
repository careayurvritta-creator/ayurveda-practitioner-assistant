export type Intent = 'herb' | 'disease' | 'treatment' | 'diet' | 'dosha' | 'diagnosis' | 'general';

export interface ParsedQuery {
  intent: Intent;
  entities: string[];
  primaryCondition: string;
  complexity: 'simple' | 'moderate' | 'complex';
  sanskritTerms: string[];
}

export const INTENT_KEYWORDS: Record<Intent, string[]> = {
  herb: ['herb', 'plant', 'dravya', 'aushadha', 'medicine', 'tablet', 'capsule', 'churna', 'kwath', 'arista', 'asava', 'gutika', 'bhaisajya'],
  disease: ['disease', 'vyadhi', 'disorder', 'condition', 'syndrome', 'pathology', 'illness', 'diagnosis'],
  treatment: ['treatment', 'chikitsa', 'therapy', 'procedure', 'panchakarma', 'vamana', 'virechana', 'basti', 'nasya', 'raktamokshana', 'abhyanga', 'pizhichil', 'kati basti', 'greeva basti', 'janu basti'],
  diet: ['diet', 'ahara', 'pathya', 'apathya', 'food', 'eat', 'avoid', 'nutritious', 'meal'],
  dosha: ['vata', 'pitta', 'kapha', 'tridosha', 'dosha', 'vataja', 'pittaja', 'kaphaja', 'doshic'],
  diagnosis: ['diagnosis', 'pariksha', 'examination', 'nadi', 'pulse', 'jihva', 'tongue', 'ashtavidha', 'dashavidha', 'prakriti', 'vikriti', 'agni', 'koshta'],
  general: [],
};

export const SANSKRIT_DISEASE_MAP: Record<string, string[]> = {
  'diabetes': ['prameha', 'prameha pidika', 'madhumeha', 'kshara meha', 'tikta meha'],
  'hypertension': ['raktagata vata', 'rakta caya', 'dhamani pratichaya'],
  'arthritis': ['amavata', 'sandhi vata', 'vata shleshaka kapha'],
  'asthma': ['swasa', 'tamaka swasa', 'urdhva swasa'],
  'obesity': ['medoroga', 'sthaulya', 'atisthoulya'],
  'hypothyroidism': ['galaganda', 'gandamala'],
  'depression': ['avasada', 'kaphaja unmada', 'manasa mandata'],
  'anxiety': ['chittodwega', 'vataja unmada', 'bhaya'],
  'insomnia': ['nidra nasha', 'anidrata', 'vataja nidra'],
  'gerd': ['amlapitta', 'parinama shula', 'udarshula'],
  'irritable bowel': ['grahani', 'purishavaha srotas', 'koshtagati'],
  'constipation': ['vivandha', 'kostha sanga', 'vataja kostha'],
  'rheumatoid arthritis': ['amavata', 'vata-astheya'],
  'psoriasis': ['ekakushta', 'kushta', 'kitibha'],
  'eczema': ['vicharchika', 'kushta', 'pama'],
  'uric acid': ['vata raktha', 'vatarakta', 'adhya vata'],
  'kidney stone': ['ashmari', 'mutrashmari', 'sarkara'],
};

export const SANSKRIT_SYNONYMS: Record<string, string[]> = {
  'triphala': ['triphala', 'three fruits', 'amla bibhitaka haritaki'],
  'ashwagandha': ['ashvagandha', 'withania somnifera', 'balya', 'vayahstha'],
  'shatavari': ['shatavari', 'asparagus racemosus', 'stree revna', 'bala'],
  'turmeric': ['haridra', 'curcuma longa', 'nisha', 'varnada'],
  'ghee': ['ghrita', 'ghee', 'clarified butter', 'samskara'],
  'oil massage': ['abhyanga', 'oil massage', 'sneha', 'snehana'],
  'fenugreek': ['methi', 'trigonella foenum', 'methika', 'dipaniya'],
  'ginger': ['adrak', 'zingiber officinale', 'adrakam', 'vishwa'],
  'boswellia': ['salai', 'boswellia serrata', 'kunduru', 'shallaki'],
  'commiphora': ['guggulu', 'commiphora mukul', 'guggul', 'mahishasha'],
};

export function classifyIntent(query: string): Intent {
  const lower = query.toLowerCase();
  let best: Intent = 'general';
  let bestScore = 0;
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === 'general') continue;
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = intent as Intent;
    }
  }
  return bestScore > 0 ? best : 'general';
}

export function extractEntities(query: string): string[] {
  const lower = query.toLowerCase();
  const entities: string[] = [];

  for (const [canonical, synonyms] of Object.entries(SANSKRIT_DISEASE_MAP)) {
    if (synonyms.some(s => lower.includes(s))) entities.push(canonical);
  }
  for (const [canonical, synonyms] of Object.entries(SANSKRIT_SYNONYMS)) {
    if (synonyms.some(s => lower.includes(s))) entities.push(canonical);
  }

  return [...new Set(entities)];
}

export function extractPrimaryCondition(query: string): string {
  const lower = query.toLowerCase();
  for (const [canonical, synonyms] of Object.entries(SANSKRIT_DISEASE_MAP)) {
    if (synonyms.some(s => lower.includes(s))) return canonical;
  }
  const words = query.split(/\s+/).filter(w => w.length > 4);
  return words.slice(0, 3).join(' ') || query;
}

export function assessComplexity(query: string): 'simple' | 'moderate' | 'complex' {
  const lower = query.toLowerCase();
  const complexIndicators = [
    'treatment protocol', 'management plan', 'chikitsa', 'samprapti',
    'shodhana', 'rasayana', 'panchakarma', 'contraindication', 'prognosis',
    'classical reference', 'clinical trial', 'research', 'evidence'
  ];
  const moderateIndicators = [
    'what is', 'how does', 'explain', 'describe', 'difference between',
    'comparison', 'herbs for', 'treatment for', 'cause'
  ];

  let score = 0;
  for (const ind of complexIndicators) if (lower.includes(ind)) score += 2;
  for (const ind of moderateIndicators) if (lower.includes(ind)) score += 1;

  if (score >= 3) return 'complex';
  if (score >= 1) return 'moderate';
  return 'simple';
}

export function expandQuery(query: string, intent: Intent, entities: string[]): string[] {
  const variants: string[] = [query];

  if (entities.length > 0) {
    for (const e of entities.slice(0, 2)) {
      variants.push(`${query} ${e}`);
      variants.push(`${e} ayurvedic treatment`);
    }
  }

  const intentSuffixes: Record<Intent, string[]> = {
    herb: ['ayurvedic herb medicinal uses', 'herb rasayana'],
    disease: ['ayurvedic treatment', 'chikitsa', 'samprapti pathogenesis'],
    treatment: ['procedure indication', 'panchakarma therapy'],
    diet: ['pathya apathya diet', 'ahara'],
    dosha: ['tridosha balance', 'dosha karma'],
    diagnosis: ['pariksha diagnosis', 'nadi'],
    general: ['ayurveda', 'classical text'],
  };

  for (const suffix of intentSuffixes[intent]) {
    if (!variants.some(v => v.toLowerCase().includes(suffix))) {
      variants.push(`${query} ${suffix}`);
    }
  }

  return [...new Set(variants)].slice(0, 5);
}

export function parseQuery(query: string): ParsedQuery {
  const intent = classifyIntent(query);
  const entities = extractEntities(query);
  return {
    intent,
    entities,
    primaryCondition: extractPrimaryCondition(query),
    complexity: assessComplexity(query),
    sanskritTerms: entities,
  };
}