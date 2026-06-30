/**
 * Comprehensive Devanagari Spelling Reference for Ayurvedic Terms
 * Source: WHO International Standard Terminologies on Ayurveda (ITA)
 * 
 * This module provides:
 * 1. Correct Devanagari spellings for common Ayurvedic terms
 * 2. IAST-to-Devanagari mapping rules
 * 3. Common spelling error patterns and corrections
 * 4. Category-organized term references
 */

export interface DevanagariTerm {
  devanagari: string;
  iast: string;
  english: string;
  category: string;
  notes?: string;
}

// === CORE AYURVEDIC CONCEPTS ===
export const CORE_CONCEPTS: DevanagariTerm[] = [
  { devanagari: 'आयुर्वेदः', iast: 'āyurvedaḥ', english: 'Ayurveda', category: 'fundamental' },
  { devanagari: 'प्रकृति', iast: 'prakṛti', english: 'Constitution', category: 'fundamental' },
  { devanagari: 'विकृति', iast: 'vikṛti', english: 'Current imbalance', category: 'fundamental' },
  { devanagari: 'दोष', iast: 'doṣa', english: 'Humor/bodily energy', category: 'fundamental' },
  { devanagari: 'धातु', iast: 'dhātu', english: 'Tissue', category: 'fundamental' },
  { devanagari: 'अग्नि', iast: 'agni', english: 'Digestive fire', category: 'fundamental' },
  { devanagari: 'कोष्ठ', iast: 'koṣṭha', english: 'Bowel habit', category: 'fundamental' },
  { devanagari: 'स्रोतस्', iast: 'srotas', english: 'Channel', category: 'fundamental' },
  { devanagari: 'आम', iast: 'āma', english: 'Toxin/metabolic waste', category: 'fundamental' },
  { devanagari: 'मल', iast: 'mala', english: 'Waste products', category: 'fundamental' },
  { devanagari: 'उपद्रव', iast: 'upadrava', english: 'Complication', category: 'fundamental' },
  { devanagari: 'सम्प्राप्ति', iast: 'samprāpti', english: 'Pathogenesis', category: 'fundamental' },
  { devanagari: 'निदान', iast: 'nidāna', english: 'Etiological factors', category: 'fundamental' },
  { devanagari: 'चिकित्सा', iast: 'cikitsā', english: 'Treatment', category: 'fundamental' },
  { devanagari: 'पथ्य', iast: 'pathya', english: 'Wholesome regimen', category: 'fundamental' },
  { devanagari: 'अपथ्य', iast: 'apathya', english: 'Unwholesome regimen', category: 'fundamental' },
];

// === TRIDOSHA ===
export const TRIDOSHA: DevanagariTerm[] = [
  { devanagari: 'वात', iast: 'vāta', english: 'Vata dosha', category: 'dosha' },
  { devanagari: 'पित्त', iast: 'pitta', english: 'Pitta dosha', category: 'dosha' },
  { devanagari: 'कफ', iast: 'kapha', english: 'Kapha dosha', category: 'dosha' },
  { devanagari: 'त्रिदोष', iast: 'tridoṣa', english: 'Three doshas', category: 'dosha' },
  { devanagari: 'वातः', iast: 'vātaḥ', english: 'Vata (nominative)', category: 'dosha', notes: 'With visarga for nominative singular' },
  { devanagari: 'पित्तम', iast: 'pittam', english: 'Pitta (neuterer)', category: 'dosha' },
  { devanagari: 'श्लेष्मा', iast: 'śleṣmā', english: 'Kapha (alternative name)', category: 'dosha' },
];

// === SAPTADHATU (SEVEN TISSUES) ===
export const SAPTADHATU: DevanagariTerm[] = [
  { devanagari: 'रस', iast: 'rasa', english: 'Plasma/nutrient fluid', category: 'dhatu' },
  { devanagari: 'रक्त', iast: 'rakta', english: 'Blood', category: 'dhatu' },
  { devanagari: 'मांस', iast: 'māṃsa', english: 'Muscle tissue', category: 'dhatu' },
  { devanagari: 'मेद', iast: 'meda', english: 'Adipose tissue', category: 'dhatu' },
  { devanagari: 'अस्थि', iast: 'asthi', english: 'Bone tissue', category: 'dhatu' },
  { devanagari: 'मज्जा', iast: 'majjā', english: 'Bone marrow', category: 'dhatu' },
  { devanagari: 'शुक्र', iast: 'śukra', english: 'Reproductive tissue', category: 'dhatu' },
];

// === PANCHAKARMA (FIVE DETOX PROCEDURES) ===
export const PANCHAKARMA: DevanagariTerm[] = [
  { devanagari: 'पंचकर्म', iast: 'pañcakarma', english: 'Five detox procedures', category: 'treatment' },
  { devanagari: 'शोधन', iast: 'śodhana', english: 'Purification therapy', category: 'treatment' },
  { devanagari: 'शमन', iast: 'śamana', english: 'Pacification therapy', category: 'treatment' },
  { devanagari: 'रसायन', iast: 'rasāyana', english: 'Rejuvenation therapy', category: 'treatment' },
  { devanagari: 'वमन', iast: 'vamana', english: 'Therapeutic emesis', category: 'treatment' },
  { devanagari: 'विरेचन', iast: 'virecana', english: 'Therapeutic purgation', category: 'treatment' },
  { devanagari: 'बस्ति', iast: 'basti', english: 'Medicated enema', category: 'treatment' },
  { devanagari: 'नस्य', iast: 'nasya', english: 'Nasal medication', category: 'treatment' },
  { devanagari: 'रक्तमोक्षण', iast: 'raktamokṣaṇa', english: 'Bloodletting', category: 'treatment' },
  { devanagari: 'अभ्यंग', iast: 'abhyanga', english: 'Oil massage', category: 'treatment' },
  { devanagari: 'स्वेदन', iast: 'svedana', english: 'Fomentation/sweating', category: 'treatment' },
  { devanagari: 'स्नेहन', iast: 'snehana', english: 'Oleation therapy', category: 'treatment' },
  { devanagari: 'दीपन', iast: 'dīpana', english: 'Digestive stimulation', category: 'treatment' },
  { devanagari: 'पाचन', iast: 'pācana', english: 'Digestive therapy', category: 'treatment' },
  { devanagari: 'लङ्घन', iast: 'laṅghana', english: 'Lightening therapy', category: 'treatment' },
  { devanagari: 'वजीकरण', iast: 'vajīkaraṇa', english: 'Aphrodisiac therapy', category: 'treatment' },
];

// === COMMON HERBS ===
export const COMMON_HERBS: DevanagariTerm[] = [
  { devanagari: 'अश्वगंधा', iast: 'aśvagandhā', english: 'Withania somnifera', category: 'herb' },
  { devanagari: 'शतावरी', iast: 'śatāvarī', english: 'Asparagus racemosus', category: 'herb' },
  { devanagari: 'त्रिफला', iast: 'triphalā', english: 'Three fruits (Amalaki, Bibhitaki, Haritaki)', category: 'herb' },
  { devanagari: 'हरिद्रा', iast: 'haridrā', english: 'Turmeric (Curcuma longa)', category: 'herb' },
  { devanagari: 'गुग्गुलु', iast: 'guggulu', english: 'Commiphora mukul', category: 'herb' },
  { devanagari: 'ब्राह्मी', iast: 'brāhmī', english: 'Bacopa monnieri', category: 'herb' },
  { devanagari: 'निम्ब', iast: 'nimba', english: 'Neem (Azadirachta indica)', category: 'herb' },
  { devanagari: 'आमलकी', iast: 'āmalakī', english: 'Emblica officinalis', category: 'herb' },
  { devanagari: 'अर्जुन', iast: 'arjuna', english: 'Terminalia arjuna', category: 'herb' },
  { devanagari: 'गुडूची', iast: 'gudūcī', english: 'Tinospora cordifolia', category: 'herb' },
  { devanagari: 'बला', iast: 'balā', english: 'Sida cordifolia', category: 'herb' },
  { devanagari: 'मुस्त', iast: 'musta', english: 'Cyperus rotundus', category: 'herb' },
  { devanagari: 'चन्दन', iast: 'candana', english: 'Sandalwood (Santalum album)', category: 'herb' },
  { devanagari: 'पिप्पली', iast: 'pippalī', english: 'Piper longum', category: 'herb' },
  { devanagari: 'धन्वन्तरम्', iast: 'dhanvantaram', english: 'Terminalia chebula', category: 'herb' },
  { devanagari: 'विभीतक', iast: 'vibhītaka', english: 'Terminalia bellirica', category: 'herb' },
  { devanagari: 'हरीतकी', iast: 'harītakī', english: 'Terminalia chebula', category: 'herb' },
];

// === COMMON DISEASES ===
export const COMMON_DISEASES: DevanagariTerm[] = [
  { devanagari: 'ज्वर', iast: 'jvara', english: 'Fever', category: 'disease' },
  { devanagari: 'प्रमेह', iast: 'prameha', english: 'Diabetes mellitus', category: 'disease' },
  { devanagari: 'सन्धिवात', iast: 'sandhivāta', english: 'Osteoarthritis', category: 'disease' },
  { devanagari: 'आमवात', iast: 'āmavāta', english: 'Rheumatoid arthritis', category: 'disease' },
  { devanagari: 'रक्तपित्त', iast: 'raktapitta', english: 'Bleeding disorders', category: 'disease' },
  { devanagari: 'कुष्ठ', iast: 'kuṣṭha', english: 'Skin disease', category: 'disease' },
  { devanagari: 'ग्रहणी', iast: 'grahaṇī', english: 'IBS/malabsorption', category: 'disease' },
  { devanagari: 'श्वास', iast: 'śvāsa', english: 'Respiratory disorder', category: 'disease' },
  { devanagari: 'हिक्का', iast: 'hikkā', english: 'Hiccough', category: 'disease' },
  { devanagari: 'उन्माद', iast: 'unmāda', english: 'Insanity/psychosis', category: 'disease' },
  { devanagari: 'अपस्मार', iast: 'apasmāra', english: 'Epilepsy', category: 'disease' },
  { devanagari: 'पक्षघात', iast: 'pakṣaghāta', english: 'Paralysis/hemiplegia', category: 'disease' },
  { devanagari: 'ग्रीवाशूल', iast: 'grīvāśūla', english: 'Neck pain/cervical spondylosis', category: 'disease' },
  { devanagari: 'कटीशूल', iast: 'kaṭīśūla', english: 'Low back pain', category: 'disease' },
  { devanagari: 'शिरःशूल', iast: 'śiraḥśūla', english: 'Headache', category: 'disease' },
  { devanagari: 'मूत्रकृच्छ', iast: 'mūtrakṛcchra', english: 'Dysuria/urinary difficulty', category: 'disease' },
  { devanagari: 'प्रवृत्तिबन्ध', iast: 'pravṛttibandha', english: 'Constipation', category: 'disease' },
  { devanagari: 'अतिसार', iast: 'atisāra', english: 'Diarrhea', category: 'disease' },
];

// === ANATOMY TERMS ===
export const ANATOMY_TERMS: DevanagariTerm[] = [
  { devanagari: 'मर्म', iast: 'marma', english: 'Vulnerable point', category: 'anatomy' },
  { devanagari: 'शाखामर्म', iast: 'śākhāmarma', english: 'Limb marma', category: 'anatomy' },
  { devanagari: 'बाहुमर्म', iast: 'bāhumarma', english: 'Arm marma', category: 'anatomy' },
  { devanagari: 'उदरमर्म', iast: 'udaramarma', english: 'Abdominal marma', category: 'anatomy' },
  { devanagari: 'कर्ण', iast: 'karṇa', english: 'Ear', category: 'anatomy' },
  { devanagari: 'नासिका', iast: 'nāsikā', english: 'Nose', category: 'anatomy' },
  { devanagari: 'जिह्वा', iast: 'jihvā', english: 'Tongue', category: 'anatomy' },
  { devanagari: 'दृक्', iast: 'dṛk', english: 'Eyes/vision', category: 'anatomy' },
  { devanagari: 'स्पर्श', iast: 'sparśa', english: 'Touch/skin', category: 'anatomy' },
  { devanagari: 'शब्द', iast: 'śabda', english: 'Sound/voice', category: 'anatomy' },
];

// === DIAGNOSTIC TERMS ===
export const DIAGNOSTIC_TERMS: DevanagariTerm[] = [
  { devanagari: 'नाडी', iast: 'nāḍī', english: 'Pulse', category: 'diagnostic' },
  { devanagari: 'मूत्र', iast: 'mūtra', english: 'Urine', category: 'diagnostic' },
  { devanagari: 'मल', iast: 'mala', english: 'Stool/feces', category: 'diagnostic' },
  { devanagari: 'जिह्वा', iast: 'jihvā', english: 'Tongue (for diagnosis)', category: 'diagnostic' },
  { devanagari: 'दृक्', iast: 'dṛk', english: 'Eyes (for diagnosis)', category: 'diagnostic' },
  { devanagari: 'स्पर्श', iast: 'sparśa', english: 'Touch/palpation', category: 'diagnostic' },
  { devanagari: 'शब्द', iast: 'śabda', english: 'Voice/speech', category: 'diagnostic' },
  { devanagari: 'आकृति', iast: 'ākṛti', english: 'Body build/physique', category: 'diagnostic' },
  { devanagari: 'सार', iast: 'sāra', english: 'Essence/vitality', category: 'diagnostic' },
  { devanagari: 'संहनन', iast: 'saṃhanana', english: 'Compactness', category: 'diagnostic' },
  { devanagari: 'सत्त्व', iast: 'sattva', english: 'Mental constitution', category: 'diagnostic' },
  { devanagari: 'आहारशक्ति', iast: 'āhāraśakti', english: 'Digestive capacity', category: 'diagnostic' },
  { devanagari: 'व्यायामशक्ति', iast: 'vyāyāmaśakti', english: 'Exercise capacity', category: 'diagnostic' },
  { devanagari: 'देश', iast: 'deśa', english: 'Geographic region', category: 'diagnostic' },
  { devanagari: 'काल', iast: 'kāla', english: 'Time/season', category: 'diagnostic' },
];

// === DRAVYAGUNA (PHARMACOLOGY) ===
export const DRAVYAGUNA: DevanagariTerm[] = [
  { devanagari: 'रस', iast: 'rasa', english: 'Taste', category: 'pharmacology' },
  { devanagari: 'गुण', iast: 'guṇa', english: 'Quality', category: 'pharmacology' },
  { devanagari: 'वीर्य', iast: 'vīrya', english: 'Potency', category: 'pharmacology' },
  { devanagari: 'विपाक', iast: 'vipāka', english: 'Post-digestive effect', category: 'pharmacology' },
  { devanagari: 'प्रभाव', iast: 'prabhāva', english: 'Special action', category: 'pharmacology' },
  { devanagari: 'द्रव्य', iast: 'dravya', english: 'Substance/herb', category: 'pharmacology' },
  { devanagari: 'कर्म', iast: 'karma', english: 'Action/effect', category: 'pharmacology' },
  { devanagari: 'मात्रा', iast: 'mātrā', english: 'Dosage/quantity', category: 'pharmacology' },
  { devanagari: 'अनुपान', iast: 'anupāna', english: 'Vehicle/adjuvant', category: 'pharmacology' },
  { devanagari: 'संस्कार', iast: 'saṃskāra', english: 'Processing/method', category: 'pharmacology' },
];

// === IAST-TO-DEVANAGARI MAPPING RULES ===
export const IAST_DEVANAGARI_MAP = {
  // Vowels
  vowels: {
    'a': 'अ', 'ā': 'आ', 'i': 'इ', 'ī': 'ई',
    'u': 'उ', 'ū': 'ऊ', 'ṛ': 'ऋ', 'ṝ': 'ॠ',
    'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
  },
  // Consonants
  consonants: {
    'ka': 'क', 'kha': 'ख', 'ga': 'ग', 'gha': 'घ', 'ṅa': 'ङ',
    'ca': 'च', 'cha': 'छ', 'ja': 'ज', 'jha': 'झ', 'ña': 'ञ',
    'ṭa': 'ट', 'ṭha': 'ठ', 'ḍa': 'ड', 'ḍha': 'ढ', 'ṇa': 'ण',
    'ta': 'त', 'tha': 'थ', 'da': 'द', 'dha': 'ध', 'na': 'न',
    'pa': 'प', 'pha': 'फ', 'ba': 'ब', 'bha': 'भ', 'ma': 'म',
    'ya': 'य', 'ra': 'र', 'la': 'ल', 'va': 'व',
    'śa': 'श', 'ṣa': 'ष', 'sa': 'स', 'ha': 'ह',
  },
  // Signs
  signs: {
    'ṃ': 'ं', 'ḥ': 'ः', 'ṁ': 'ं',
  },
  // Matras (vowel marks)
  matras: {
    'ā': 'ा', 'i': 'ि', 'ī': 'ी',
    'u': 'ु', 'ū': 'ू', 'ṛ': 'ृ',
    'e': 'े', 'ai': 'ै', 'o': 'ो', 'au': 'ौ',
  },
};

// === COMMON SPELLING ERRORS AND CORRECTIONS ===
export const SPELLING_CORRECTIONS: Array<{ wrong: string; correct: string; pattern: string }> = [
  // Missing final ा matra
  { wrong: 'चिकित्स', correct: 'चिकित्सा', pattern: 'Missing final ा matra' },
  { wrong: 'बालचिकित्स', correct: 'बालचिकित्सा', pattern: 'Missing final ा matra' },
  { wrong: 'विद्य', correct: 'विद्या', pattern: 'Missing final ा matra' },
  
  // Missing visarga ः
  { wrong: 'पक्ष', correct: 'पक्षः', pattern: 'Missing visarga for nominative singular' },
  { wrong: 'जल्प', correct: 'जल्पः', pattern: 'Missing visarga for nominative singular' },
  { wrong: 'एकान्त', correct: 'एकान्तः', pattern: 'Missing visarga for nominative singular' },
  
  // Short vowel for long
  { wrong: 'अनमतः', correct: 'अनुमतः', pattern: 'Short vowel अ for long उ' },
  { wrong: 'अनयोगः', correct: 'अनुयोगः', pattern: 'Short vowel अ for long उ' },
  { wrong: 'सिद्धन्त', correct: 'सिद्धान्तः', pattern: 'Short vowel अ for long आ' },
  
  // Missing anusvara ं
  { wrong: 'सशयः', correct: 'संशयः', pattern: 'Missing anusvara' },
  { wrong: 'समच्चयः', correct: 'समुच्चयः', pattern: 'Missing anusvara' },
  
  // Wrong vowel entirely
  { wrong: 'सखायः', correct: 'सुखायुः', pattern: 'Wrong vowel substitution' },
  { wrong: 'दःखायः', correct: 'दुःखायुः', pattern: 'Wrong vowel substitution' },
  
  // Missing conjunct halant
  { wrong: 'विद्य', correct: 'विद्या', pattern: 'Missing halant for conjunct' },
  
  // Corrupted consonant cluster
  { wrong: 'तरिसत्यर्दः', correct: 'त्रिसूत्रायुर्वेदः', pattern: 'Major consonant cluster corruption' },
  { wrong: 'अष्टङ्गयर्दः', correct: 'अष्टांगायुर्वेदः', pattern: 'Major consonant cluster corruption' },
];

// === DEVANAGARI VALIDATION RULES ===
export const DEVANAGARI_VALIDATION = {
  // Valid Unicode range for Devanagari
  validRange: { start: 0x0900, end: 0x097F },
  
  // Valid characters
  validChars: [
    'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ॠ', 'ए', 'ऐ', 'ओ', 'औ',
    'क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ',
    'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न',
    'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व',
    'श', 'ष', 'स', 'ह',
    'ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'ॄ', 'े', 'ै', 'ो', 'ौ',
    'ं', 'ः', 'ँ', '्',
  ],
  
  // Common invalid patterns
  invalidPatterns: [
    { pattern: /[a-zA-Z]/, description: 'Latin characters in Devanagari field' },
    { pattern: /[0-9]/, description: 'ASCII digits in Devanagari field' },
    { pattern: /[;,.]/, description: 'Latin punctuation in Devanagari field' },
  ],
};

// === HELPER FUNCTIONS ===

/**
 * Look up a term by Devanagari, IAST, or English
 */
export function lookupDevanagariTerm(query: string): DevanagariTerm | undefined {
  const allTerms = [
    ...CORE_CONCEPTS,
    ...TRIDOSHA,
    ...SAPTADHATU,
    ...PANCHAKARMA,
    ...COMMON_HERBS,
    ...COMMON_DISEASES,
    ...ANATOMY_TERMS,
    ...DIAGNOSTIC_TERMS,
    ...DRAVYAGUNA,
  ];
  
  const q = query.toLowerCase();
  return allTerms.find(t =>
    t.devanagari === query ||
    t.iast.toLowerCase() === q ||
    t.english.toLowerCase() === q
  );
}

/**
 * Get all terms in a category
 */
export function getTermsByCategory(category: string): DevanagariTerm[] {
  const allTerms = [
    ...CORE_CONCEPTS,
    ...TRIDOSHA,
    ...SAPTADHATU,
    ...PANCHAKARMA,
    ...COMMON_HERBS,
    ...COMMON_DISEASES,
    ...ANATOMY_TERMS,
    ...DIAGNOSTIC_TERMS,
    ...DRAVYAGUNA,
  ];
  
  return allTerms.filter(t => t.category === category);
}

/**
 * Search terms by partial match
 */
export function searchDevanagariTerms(query: string): DevanagariTerm[] {
  const allTerms = [
    ...CORE_CONCEPTS,
    ...TRIDOSHA,
    ...SAPTADHATU,
    ...PANCHAKARMA,
    ...COMMON_HERBS,
    ...COMMON_DISEASES,
    ...ANATOMY_TERMS,
    ...DIAGNOSTIC_TERMS,
    ...DRAVYAGUNA,
  ];
  
  const q = query.toLowerCase();
  return allTerms.filter(t =>
    t.devanagari.includes(query) ||
    t.iast.toLowerCase().includes(q) ||
    t.english.toLowerCase().includes(q)
  );
}

/**
 * Get spelling correction for a term
 */
export function getSpellingCorrection(wrong: string): string | undefined {
  const correction = SPELLING_CORRECTIONS.find(c => c.wrong === wrong);
  return correction?.correct;
}

/**
 * Validate Devanagari text
 */
export function validateDevanagari(text: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const { pattern, description } of DEVANAGARI_VALIDATION.invalidPatterns) {
    if (pattern.test(text)) {
      errors.push(description);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
