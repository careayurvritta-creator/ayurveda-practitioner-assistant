export type Intent = 'herb' | 'disease' | 'treatment' | 'diet' | 'dosha' | 'diagnosis' | 'procedure' | 'formulation' | 'general';

export interface ParsedQuery {
  intent: Intent;
  entities: string[];
  primaryCondition: string;
  complexity: 'simple' | 'moderate' | 'complex';
  sanskritTerms: string[];
  isFollowUp: boolean;
  rewrittenQuery: string;
  clinicalPathway: string | null;
}

export const INTENT_KEYWORDS: Record<Intent, string[]> = {
  herb: ['herb', 'plant', 'dravya', 'aushadha', 'medicine', 'tablet', 'capsule', 'churna', 'kwath', 'arista', 'asava', 'gutika', 'bhaisajya', 'kaashtha', 'vati'],
  disease: ['disease', 'vyadhi', 'disorder', 'condition', 'syndrome', 'pathology', 'illness', 'diagnosis', 'roga', 'vikara'],
  treatment: ['treatment', 'chikitsa', 'therapy', 'procedure', 'panchakarma', 'vamana', 'virechana', 'basti', 'nasya', 'raktamokshana', 'abhyanga', 'pizhichil', 'kati basti', 'greeva basti', 'janu basti', 'shodhana', 'shamana', 'upakrama'],
  diet: ['diet', 'ahara', 'pathya', 'apathya', 'food', 'eat', 'avoid', 'nutritious', 'meal', 'dinacharya', 'ritucharya'],
  dosha: ['vata', 'pitta', 'kapha', 'tridosha', 'dosha', 'vataja', 'pittaja', 'kaphaja', 'doshic', 'prakriti', 'vikriti'],
  diagnosis: ['diagnosis', 'pariksha', 'examination', 'nadi', 'pulse', 'jihva', 'tongue', 'ashtavidha', 'dashavidha', 'prakriti', 'vikriti', 'agni', 'koshta', 'darshana', 'sparshana', 'prashna'],
  procedure: ['procedure', 'karma', 'panchakarma', 'vamana', 'virechana', 'basti', 'nasya', 'raktamokshana', 'lepa', 'pana', 'dhupa', 'avapeedana', 'dhoomapana'],
  formulation: ['formulation', 'yoga', 'katha', 'kashaya', 'arishta', 'asava', 'taila', 'ghrita', 'churna', 'vati', 'guggulu', 'bhasma', 'rasa'],
  general: [],
};

// Expanded disease-to-Sanskrit mapping (open entity matching)
export const SANSKRIT_DISEASE_MAP: Record<string, string[]> = {
  'diabetes': ['prameha', 'prameha pidika', 'madhumeha', 'kshara meha', 'tikta meha'],
  'hypertension': ['raktagata vata', 'rakta caya', 'dhamani pratichaya'],
  'arthritis': ['amavata', 'sandhi vata', 'vata shleshaka kapha', 'sandhigata vata'],
  'asthma': ['swasa', 'tamaka swasa', 'urdhva swasa', 'mahashwasa', 'chinna swasa'],
  'obesity': ['medoroga', 'sthaulya', 'atisthoulya', 'sthoulya'],
  'hypothyroidism': ['galaganda', 'gandamala', 'apabaahuka'],
  'depression': ['avasada', 'kaphaja unmada', 'manasa mandata', 'chittavISHAYA'],
  'anxiety': ['chittodwega', 'vataja unmada', 'bhaya', 'udyama'],
  'insomnia': ['nidra nasha', 'anidrata', 'vataja nidra', 'nidranash'],
  'gerd': ['amlapitta', 'parinama shula', 'udarshula', 'amlapitta amayascha'],
  'irritable bowel': ['grahani', 'purishavaha srotas', 'koshtagati', 'grahanidosa'],
  'constipation': ['vivandha', 'kostha sanga', 'vataja kostha', 'maha vibandha'],
  'rheumatoid arthritis': ['amavata', 'vata-astheya', 'amavatavyadhi'],
  'psoriasis': ['ekakushta', 'kushta', 'kitibha', 'charmadala'],
  'eczema': ['vicharchika', 'kushta', 'pama', 'sidhma kushta'],
  'uric acid': ['vata raktha', 'vatarakta', 'adhya vata'],
  'kidney stone': ['ashmari', 'mutrashmari', 'sarkara', 'ashmari mutragranthi'],
  'migraine': ['ardhavabhedaka', 'ardhashirah shoola', 'sooryavarta'],
  'back pain': ['kati shoola', 'kati gridhra', 'prishta shoola', 'kati graham'],
  'sciatica': ['gridhrasi', 'laghu ruksha gridhrasi'],
  'gout': ['vatavyadhi', 'vatarakta', 'amavata'],
  'allergic rhinitis': ['pratishyaya', 'vasaka', 'hikka shwasa'],
  'sinusitis': ['dushta pratishyaya', 'pachyaman pratishyaya'],
  'skin rash': ['twak vikara', 'kushtha', 'pitta kushtha'],
  'jaundice': ['kamala', 'pandu roga', 'amlapitta'],
  'anemia': ['pandu roga', 'pandu', 'rakta kshaya'],
  'menstrual disorder': ['artava dosha', 'yonivyapad', 'kashtartava', 'asrigdara'],
  'dysmenorrhea': ['kashtartava', 'yoni shoola', 'artava kshaya'],
  'menopause': ['rajah kshaya', 'rajomoksha kala', 'artava kshaya'],
  'infertility': ['klaibya', 'beeja dosha', 'artava dushya', 'garbhashaya vikara'],
  'headache': ['shirah shoola', 'shirah graham', 'bhrama'],
  'vertigo': ['bhrama', 'pratibhrama', 'tiryak gati'],
  'cold': ['pratishyaya', 'vasaka', 'hikka'],
  'cough': ['kasa', 'kaphaja kasa', 'vataja kasa'],
  'fever': ['jwara', 'tikta jwara', 'vataja jwara', 'pittaja jwara', 'kaphaja jwara'],
  'diarrhea': ['atisara', 'pravahika', 'grahani'],
  'dysentery': ['pravahika', 'raktaatisara', 'sharkaraatisara'],
  'indigestion': ['ajeerna', 'mandagni', 'apaki'],
  'bloating': ['adhimantha', 'tympanites', 'uddvartana'],
  'skin disease': ['kushta', 'twak vikara', 'charmadala'],
  'wound': ['vrana', 'vranashopha', 'dushta vrana'],
  'fracture': ['bhagna', 'asthibhagna', 'sandhi bhagna'],
  'muscle pain': ['mansa shosha', 'mansa gata vata'],
  'joint pain': ['sandhi shoola', 'sandhi gata vata', 'sandhi gata kapha'],
  'eye disease': ['akshi vikara', 'drishti dosha', 'abhishyanda'],
  'ear disease': ['karna roga', 'karna shoola', 'karnanada'],
  'throat disease': ['kantha roga', 'gala shoola', 'kushtha kantha'],
  'dental disease': ['danta roga', 'danta shoola', 'danta kshaya'],
  'heart disease': ['hridroga', 'hridgraha', 'hrishshoola'],
  'liver disease': ['yakrit vikara', 'yakrit pliha vikara', 'kloma vikara'],
  'spleen disease': ['pliha vikara', 'plihodara', 'pliha gulma'],
  'lung disease': ['phuphphusa vikara', 'shwasa', 'kasa'],
  'urinary disease': ['mutra vikara', 'mutragraha', 'mutrashmari'],
  'skin infection': ['kushtha', 'vidradhi', 'arbuda'],
  'boil': ['vidradhi', 'vranaka', 'puyapu'],
  'abscess': ['vidradhi', 'vranapaka', 'arbuda'],
  'cyst': ['granthi', 'arbuda', 'gulma'],
  'tumor': ['arbuda', 'gulma', 'vidradhi'],
  'cancer': ['arbuda', 'granthi', 'gulma', 'apachi'],
  'diabetes insipidus': ['prameha', 'meha', 'uditasya meha'],
  'hypotension': ['raktamanda vata', 'raktakshaya'],
  'pneumonia': ['kasa', 'shwasa', 'jwara'],
  'bronchitis': ['kasa', 'shwasa', 'tamaka swasa'],
  'tuberculosis': ['rajayakshma', 'kshaya roga', 'kshataja kshaya'],
  'epilepsy': ['apasmara', 'smriti bhramsha', 'unmada'],
  'schizophrenia': ['unmada', 'vataja unmada', 'kaphaja unmada'],
  'stroke': ['pakshaghat', 'vata vyadhi', 'ardita'],
  'paralysis': ['pakshaghat', 'vata vyadhi', 'pangu'],
  'muscular dystrophy': ['balya kshaya', 'mansa kshaya', 'dhatu kshaya'],
  'osteoporosis': ['asthi kshaya', 'asthi bhagna', 'sandhi gata vata'],
  'fibromyalgia': ['mansa vata', 'sandhi gata vata', 'mansa shosha'],
  'chronic fatigue': ['dhatu kshaya', 'mandagni', 'vata vyadhi'],
  'autoimmune': ['ama vata', 'amavata', 'vyadhi kshamatva'],
  'thyroid': ['galaganda', 'gandamala', 'apabaahuka'],
  'thyroid hyper': ['galaganda', 'vataja galaganda', 'pitta galaganda'],
  'thyroid hypo': ['galaganda', 'kaphaja galaganda', 'medo viddha'],
};

// Expanded herb synonyms
export const SANSKRIT_SYNONYMS: Record<string, string[]> = {
  'triphala': ['triphala', 'three fruits', 'amla bibhitaka haritaki', 'triphala churna'],
  'ashwagandha': ['ashvagandha', 'withania somnifera', 'balya', 'vayahstha', 'ashwagandha churna', 'ashwagandha vati'],
  'shatavari': ['shatavari', 'asparagus racemosus', 'stree revna', 'bala', 'shatavari churna'],
  'turmeric': ['haridra', 'curcuma longa', 'nisha', 'varnada', 'haridra churna'],
  'ghee': ['ghrita', 'ghee', 'clarified butter', 'samskara', 'ghritam'],
  'oil massage': ['abhyanga', 'oil massage', 'sneha', 'snehana', 'taila abhyanga'],
  'fenugreek': ['methi', 'trigonella foenum', 'methika', 'dipaniya', 'methi seeds'],
  'ginger': ['adrak', 'zingiber officinale', 'adrakam', 'vishwa', 'sunthi', 'shunthi'],
  'boswellia': ['salai', 'boswellia serrata', 'kunduru', 'shallaki', 'guggulu'],
  'commiphora': ['guggulu', 'commiphora mukul', 'guggul', 'mahishasha'],
  'neem': ['nimba', 'azadirachta indica', 'arishtha', 'premna', 'nimba churna'],
  'tulsi': ['tulsi', 'ocimum sanctum', 'basil', 'sacred basil', 'tulsi vati'],
  'amalaki': ['amalaki', 'emblica officinalis', 'amla', 'dhatri', 'amalaki churna'],
  'bibhitaki': ['bibhitaki', 'terminalia bellirica', 'viteda', 'vibhitaka'],
  'haritaki': ['haritaki', 'terminalia chebula', 'vijaya', 'abaya', 'haritaki churna'],
  'brahmi': ['brahmi', 'bacopa monnieri', 'jalanili', 'manjari', 'brahmi vati'],
  'guduchi': ['guduchi', 'tinospora cordifolia', 'amrita', 'madhuparni', 'guduchi satva'],
  'shilajit': ['shilajit', 'asphaltum', 'silajatu', 'shilajatu'],
  'bhringaraj': ['bhringaraj', 'eclipta alba', 'kesharaja', 'makaradhvaja'],
  'yastimadhu': ['yastimadhu', 'glycyrrhiza glabra', 'mulethi', 'madhuyashti'],
  'kutaja': ['kutaja', 'holarrhena antidysenterica', 'indrayava', 'kutaja churna'],
  'musta': ['musta', 'cyperus rotundus', 'nagarmotha', 'mustak'],
  'shatapushpa': ['shatapushpa', 'anethum sowa', 'dill', 'shatapushpadi'],
  'jeeraka': ['jeeraka', 'cuminum cyminum', 'cumin', 'jira'],
  'dhanyaka': ['dhanyaka', 'coriandrum sativum', 'coriander', 'dhania'],
  'elachi': ['elachi', 'elettaria cardamomum', 'cardamom', 'ela'],
  'laung': ['laung', 'syzygium aromaticum', 'clove', 'lavanga'],
  'dalchini': ['dalchini', 'cinnamomum zeylanicum', 'cinnamon', 'twak'],
  'ajwain': ['ajwain', 'trachyspermum ammi', 'carom seeds', 'yavani'],
  'ajmoda': ['ajmoda', 'apium graveolens', 'celery seeds', 'ajamoda'],
  'maricha': ['maricha', 'piper nigrum', 'black pepper', 'marich'],
  'pippali': ['pippali', 'piper longum', 'long pepper', 'pippali mula'],
  'chitraka': ['chitraka', 'plumbago zeylanica', 'chitrak', 'vitanga'],
  'vidanga': ['vidanga', 'embelia ribes', 'false black pepper', 'vidanga'],
  'kushtha': ['kushtha', 'skin disease', 'dermatosis'],
};

// Clinical pathway mappings — common treatment patterns
export const CLINICAL_PATHWAYS: Record<string, {
  diagnosis: string;
  dosha: string;
  treatment: string;
  herbs: string[];
  procedures: string[];
}> = {
  'amavata': {
    diagnosis: 'Rheumatoid Arthritis (Amavata)',
    dosha: 'Vata (Ama-Vata)',
    treatment: 'Ama pachana → Shamana → Shamshodhana',
    herbs: ['Guggulu', 'Guduchi', 'Shunthi', 'Pippali', 'Haridra', 'Ashwagandha'],
    procedures: ['Basti', 'Abhyanga', 'Swedana', 'Pinda Sweda'],
  },
  'prameha': {
    diagnosis: 'Diabetes Mellitus (Prameha)',
    dosha: 'Kapha (Medo-Dhatu)',
    treatment: 'Langhana → Shamana → Rasayana',
    herbs: ['Guduchi', 'Meshashringi', 'Amalaki', 'Haridra', 'Vijaysar', 'Bilva'],
    procedures: ['Virechana', 'Basti', 'Udvartana'],
  },
  'jwara': {
    diagnosis: 'Fever (Jwara)',
    dosha: 'Sannipata (Tridosha)',
    treatment: 'Langhana → Pachana → Shamana',
    herbs: ['Guduchi', 'Tinospora', 'Neem', 'Tulsi', 'Shunthi', 'Parpata'],
    procedures: ['Virechana', 'Sheetala Upanaha', 'Guduchyadi Kashayam'],
  },
  'shwasa': {
    diagnosis: 'Asthma (Shwasa)',
    dosha: 'Vata-Kapha',
    treatment: 'Snehana → Swedana → Shamana',
    herbs: ['Vasa', 'Pushkarmool', 'Kantakari', 'Shirisha', 'Haridra', 'Pippali'],
    procedures: ['Vamana', 'Nasya', 'Pizhichil'],
  },
  'kashta artava': {
    diagnosis: 'Dysmenorrhea (Kashtartava)',
    dosha: 'Vata (Vata-Kapha)',
    treatment: 'Snehana → Swedana → Shamana',
    herbs: ['Ashwagandha', 'Shatavari', 'Dashamula', 'Guduchi', 'Guggulu', 'Lodhra'],
    procedures: ['Basti', 'Pichcha Basti', 'Kati Basti', 'Uttara Basti'],
  },
  'apasmara': {
    diagnosis: 'Epilepsy (Apasmara)',
    dosha: 'Vata-Kapha',
    treatment: 'Shamana → Rasayana',
    herbs: ['Brahmi', 'Shankhpushpi', 'Vacha', 'Jatamansi', 'Tagar', 'Kushtha'],
    procedures: ['Nasya', 'Shirodhara', 'Shirolepa'],
  },
};

const COMPLEXITY_INDICATORS = [
  'treatment protocol', 'management plan', 'chikitsa', 'samprapti',
  'shodhana', 'rasayana', 'panchakarma', 'contraindication', 'prognosis',
  'classical reference', 'clinical trial', 'research', 'evidence',
  'differential diagnosis', 'investigation', 'examination', 'pariksha',
  'pathogenesis', 'dravyaguna', 'rasa panchaka', 'virya', 'vipaka',
];

const MODERATE_INDICATORS = [
  'what is', 'how does', 'explain', 'describe', 'difference between',
  'comparison', 'herbs for', 'treatment for', 'cause', 'symptoms',
  'dosage', 'anupana', 'pathya', 'apathya', 'diet',
];

/**
 * Detect if the query is a follow-up to a previous clinical question.
 * Follow-ups typically: reference pronouns, short queries, ask for elaboration.
 */
export function isFollowUpQuery(query: string, history: Array<{ role: string; content: string }>): boolean {
  if (history.length < 2) return false;

  const lower = query.toLowerCase().trim();
  const followUpPatterns = [
    /^(yes|no|ok|okay|got it|understood|right|correct|proceed|continue|next|more|elaborate|explain more|tell me more|what else|and|also|plus|too|what about|how about)$/i,
    /^(can you|could you|please|would you) (elaborate|explain|clarify|detail|expand|continue)/i,
    /^(more|details|specifics|examples|example|reference|source|citation)/i,
    /^(why|how|when|where|who|what exactly|what specifically)/i,
  ];

  if (followUpPatterns.some(p => p.test(lower))) return true;

  // Short queries (< 4 words) are likely follow-ups if history exists
  const words = lower.split(/\s+/);
  if (words.length <= 4 && history.length >= 2) return true;

  // Pronoun-heavy queries reference previous context
  const pronouns = ['it', 'this', 'that', 'they', 'them', 'these', 'those', 'his', 'her', 'its'];
  if (pronouns.some(p => lower.includes(p)) && history.length >= 2) return true;

  return false;
}

/**
 * Rewrite follow-up queries to be self-contained by incorporating context from history.
 */
export function rewriteFollowUpQuery(
  query: string,
  history: Array<{ role: string; content: string }>
): string {
  if (!isFollowUpQuery(query, history)) return query;

  // Find the last user message to get context
  const lastUserMsg = history
    .filter(h => h.role === 'user')
    .pop()?.content || '';

  const lower = query.toLowerCase().trim();

  // Simple elaboration requests
  if (/^(more|details|specifics|elaborate|explain more|tell me more|what else)$/i.test(lower)) {
    return `Please provide more details and deeper analysis regarding: "${lastUserMsg}"`;
  }

  if (/^(yes|ok|okay|proceed|continue|right|correct)$/i.test(lower)) {
    return `Continue with the clinical analysis and recommendations for: "${lastUserMsg}"`;
  }

  // "What about X?" style follow-ups
  if (lower.startsWith('what about ') || lower.startsWith('how about ')) {
    return `Regarding the earlier discussion on "${lastUserMsg.slice(0, 100)}": ${query}`;
  }

  // Pronoun-heavy short queries
  const words = lower.split(/\s+/);
  if (words.length <= 4) {
    return `${query} (in the context of: ${lastUserMsg.slice(0, 150)})`;
  }

  return query;
}

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

  // Open entity matching: extract capitalized words and potential Sanskrit terms
  const sanskritPattern = /\b(vata|pitta|kapha|dosha|dhatu|agni|srotas|ama|prakriti|vikriti|chikitsa|shodhana|shamana|rasayana|panchakarma|vamana|virechana|basti|nasya|raktamokshana|abhyanga|pizhichil|shirodhara|nadi|pariksha|nidana|samprapti|dravya|rasa|guna|virya|vipaka|prabhava|anupana|pathya|apathya|dinacharya|ritucharya|vyadhi|roga|chikitsa|upakrama|karma|yoga)\b/gi;
  const matches = query.match(sanskritPattern);
  if (matches) {
    for (const m of matches) {
      const lower = m.toLowerCase();
      if (!entities.includes(lower)) entities.push(lower);
    }
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

  let score = 0;
  for (const ind of COMPLEXITY_INDICATORS) if (lower.includes(ind)) score += 2;
  for (const ind of MODERATE_INDICATORS) if (lower.includes(ind)) score += 1;

  if (score >= 3) return 'complex';
  if (score >= 1) return 'moderate';
  return 'simple';
}

export function identifyClinicalPathway(entities: string[]): string | null {
  for (const entity of entities) {
    const key = entity.toLowerCase();
    if (CLINICAL_PATHWAYS[key]) return key;
  }
  // Fuzzy match
  for (const entity of entities) {
    const key = entity.toLowerCase();
    for (const pathwayKey of Object.keys(CLINICAL_PATHWAYS)) {
      if (key.includes(pathwayKey) || pathwayKey.includes(key)) return pathwayKey;
    }
  }
  return null;
}

export function expandQuery(query: string, intent: Intent, entities: string[]): string[] {
  const variants: string[] = [query];

  if (entities.length > 0) {
    for (const e of entities.slice(0, 3)) {
      variants.push(`${query} ${e}`);
      variants.push(`${e} ayurvedic treatment`);
    }
  }

  const intentSuffixes: Record<Intent, string[]> = {
    herb: ['ayurvedic herb medicinal uses', 'herb rasayana', 'dravyaguna'],
    disease: ['ayurvedic treatment', 'chikitsa', 'samprapti pathogenesis', 'vyadhi parichaya'],
    treatment: ['procedure indication', 'panchakarma therapy', 'upakrama', 'chikitsa vidhi'],
    diet: ['pathya apathya diet', 'ahara vidhi', 'dinacharya'],
    dosha: ['tridosha balance', 'dosha karma', 'dhatu samanya vishesha'],
    diagnosis: ['pariksha diagnosis', 'nadi pariksha', 'ashtavidha pariksha'],
    procedure: ['panchakarma procedure', 'karma vidhi', 'upakrama vidhi'],
    formulation: ['classical formulation', 'yoga kriyakalpa', 'bheshaj kalpana'],
    general: ['ayurveda', 'classical text', 'sutra sthana'],
  };

  for (const suffix of intentSuffixes[intent] ?? intentSuffixes.general) {
    if (!variants.some(v => v.toLowerCase().includes(suffix))) {
      variants.push(`${query} ${suffix}`);
    }
  }

  return [...new Set(variants)].slice(0, 6);
}

export function parseQuery(query: string, history?: Array<{ role: string; content: string }>): ParsedQuery {
  const intent = classifyIntent(query);
  const entities = extractEntities(query);
  const isFollowUp = history ? isFollowUpQuery(query, history) : false;
  const rewrittenQuery = history ? rewriteFollowUpQuery(query, history) : query;
  const clinicalPathway = identifyClinicalPathway(entities);

  return {
    intent,
    entities,
    primaryCondition: extractPrimaryCondition(rewrittenQuery),
    complexity: assessComplexity(rewrittenQuery),
    sanskritTerms: entities,
    isFollowUp,
    rewrittenQuery,
    clinicalPathway,
  };
}
