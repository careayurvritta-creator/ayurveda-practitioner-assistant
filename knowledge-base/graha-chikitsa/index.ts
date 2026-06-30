/**
 * Graha Chikitsa Knowledge Module
 *
 * Graha Chikitsa (ग्रह चिकित्सा) — Psychiatry and mental health branch of Ayurveda
 *
 * Sources:
 * - Charaka Samhita, Chikitsa Sthana, Chapters 9-10
 * - Ashtanga Hridaya, Uttara Tantra, Chapters 21-22
 * - Sushruta Samhita, Sharira Sthana, Chapter 1
 *
 * Key Concepts:
 * - Unmada (psychosis/mental disorders)
 * - Apasmara (epilepsy/seizure disorders)
 * - Manas Prakriti (mental constitution)
 * - Medhya Rasayana (intellect-promoting rejuvenation)
 * - Satvavajaya (psychotherapy)
 */

export interface UnmadaType {
  name: string;
  transliteration: string;
  englishName: string;
  dosha: string;
  symptoms: string[];
  formulations: string[];
  psychotherapy: string[];
  dietaryAdvice: string[];
  lifestyleAdvice: string[];
  prognosis: string;
  source: string;
  sourceVerse: string;
}

export interface ApasmaraType {
  name: string;
  transliteration: string;
  englishName: string;
  dosha: string;
  symptoms: string[];
  formulations: string[];
  emergencyManagement: string[];
  dietaryAdvice: string[];
  lifestyleAdvice: string[];
  prognosis: string;
  source: string;
  sourceVerse: string;
}

export interface MedhyaRasayana {
  name: string;
  transliteration: string;
  englishName: string;
  ingredients: string[];
  indications: string[];
  dose: string;
  anupana: string;
  benefits: string[];
  source: string;
  sourceVerse: string;
}

export interface Satvavajaya {
  name: string;
  transliteration: string;
  englishName: string;
  technique: string;
  indications: string[];
  procedure: string;
  benefits: string[];
  source: string;
  sourceVerse: string;
}

export const UNMADA_TYPES: UnmadaType[] = [
  {
    name: 'वातज उन्माद',
    transliteration: 'vataja unmada',
    englishName: 'Vata-type psychosis',
    dosha: 'vata',
    symptoms: ['anxiety', 'insomnia', 'restlessness', 'tremors', 'hallucinations', 'incoherent behavior'],
    formulations: ['brahmi ghrita', 'jatamansi churna', 'ashwagandha churna'],
    psychotherapy: ['calm environment', 'soothing music', 'gentle massage', 'counseling'],
    dietaryAdvice: ['warm nourishing foods', 'ghee', 'milk', 'sweet fruits'],
    lifestyleAdvice: ['regular sleep', 'avoid stress', 'gentle exercise', 'meditation'],
    prognosis: 'Manageable with consistent treatment',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 9.1-5',
  },
  {
    name: 'पित्तज उन्माद',
    transliteration: 'pittaja unmada',
    englishName: 'Pitta-type psychosis',
    dosha: 'pitta',
    symptoms: ['anger', 'aggression', 'mania', 'irritability', 'red eyes', 'violent behavior'],
    formulations: ['saraswatarishta', 'brahmi ghrita', 'kamadugha rasa'],
    psychotherapy: ['cool environment', 'calming techniques', 'counseling'],
    dietaryAdvice: ['sweet cooling foods', 'bitter gourd', 'coconut water'],
    lifestyleAdvice: ['avoid heat', 'cool environment', 'pranayama', 'yoga'],
    prognosis: 'Manageable with consistent treatment',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 9.6-10',
  },
  {
    name: 'कफज उन्माद',
    transliteration: 'kaphaja unmada',
    englishName: 'Kapha-type psychosis',
    dosha: 'kapha',
    symptoms: ['depression', 'lethargy', 'obesity', 'excessive sleep', 'dullness', 'loss of motivation'],
    formulations: ['brahmi vati', 'kushmanda rasayana', 'trikatu churna'],
    psychotherapy: ['stimulating activities', 'social engagement', 'group therapy'],
    dietaryAdvice: ['light warm foods', 'spices', 'avoid heavy/greasy foods'],
    lifestyleAdvice: ['early rising', 'exercise', 'sunlight exposure', 'yoga'],
    prognosis: 'Manageable with consistent treatment',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 9.11-15',
  },
  {
    name: 'संनिपातज उन्माद',
    transliteration: 'sannipataja unmada',
    englishName: 'Combined-type psychosis',
    dosha: 'sannipata (all three doshas)',
    symptoms: ['variable symptoms', 'complex presentation', 'multiple manifestations'],
    formulations: ['mahamrityunjaya rasa', 'brahmi ghrita', 'jatamansi churna'],
    psychotherapy: ['comprehensive treatment', 'intensive care', 'family support'],
    dietaryAdvice: ['balanced diet', 'avoid extremes'],
    lifestyleAdvice: ['structured routine', 'supportive environment'],
    prognosis: 'Serious; requires intensive treatment',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 9.16-20',
  },
];

export const APASMARA_TYPES: ApasmaraType[] = [
  {
    name: 'वातज अपस्मार',
    transliteration: 'vataja apasmara',
    englishName: 'Vata-type epilepsy',
    dosha: 'vata',
    symptoms: ['sudden seizure', 'tremors', 'convulsions', 'loss of consciousness'],
    formulations: ['brahmi ghrita', 'jatamansi churna', 'ashwagandha churna'],
    emergencyManagement: ['protect head', 'clear area', 'do not restrain', 'side position'],
    dietaryAdvice: ['warm nourishing foods', 'ghee', 'regular meals'],
    lifestyleAdvice: ['regular sleep', 'avoid stress', 'avoid triggers'],
    prognosis: 'Manageable with consistent treatment',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 10.1-5',
  },
  {
    name: 'पित्तज अपस्मार',
    transliteration: 'pittaja apasmara',
    englishName: 'Pitta-type epilepsy',
    dosha: 'pitta',
    symptoms: ['seizure with fever', 'redness', 'burning sensation', 'screaming'],
    formulations: ['kamadugha rasa', 'saraswatarishta', 'brahmi ghrita'],
    emergencyManagement: ['protect head', 'cool environment', 'calm surroundings'],
    dietaryAdvice: ['cooling foods', 'bitter gourd', 'coconut water'],
    lifestyleAdvice: ['avoid heat', 'cool environment', 'pranayama'],
    prognosis: 'Manageable with consistent treatment',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 10.6-10',
  },
  {
    name: 'कफज अपस्मार',
    transliteration: 'kaphaja apasmara',
    englishName: 'Kapha-type epilepsy',
    dosha: 'kapha',
    symptoms: ['seizure with salivation', 'congestion', 'obesity', 'post-ictal drowsiness'],
    formulations: ['trikatu churna', 'kushmanda rasayana'],
    emergencyManagement: ['protect head', 'clear airway', 'side position'],
    dietaryAdvice: ['light warm foods', 'spices', 'avoid heavy/greasy'],
    lifestyleAdvice: ['early rising', 'exercise', 'sunlight exposure'],
    prognosis: 'Manageable with consistent treatment',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 10.11-15',
  },
];

export const MEDHYA_RASAYANAS: MedhyaRasayana[] = [
  {
    name: 'ब्राह्मी घृत',
    transliteration: 'brahmi ghrita',
    englishName: 'Brahmi medicated ghee',
    ingredients: ['brahmi (Bacopa monnieri)', 'ghee', 'amalaki', 'haritaki'],
    indications: ['medhya kshaya', 'smriti kshaya', 'unmada', 'apasmara', 'insomnia'],
    dose: '1-2 tsp twice daily',
    anupana: 'warm milk',
    benefits: ['enhances memory', 'improves concentration', 'calms mind'],
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.2.6',
  },
  {
    name: 'सरस्वतारिष्ट',
    transliteration: 'saraswatarishta',
    englishName: 'Saraswata fermented decoction',
    ingredients: ['brahmi', 'shankhpushpi', 'jatamansi', 'amalaki', 'ghee'],
    indications: ['unmada', 'apasmara', 'medhya kshaya', 'insomnia', 'anxiety'],
    dose: '15-20ml twice daily',
    anupana: 'warm water',
    benefits: ['enhances speech', 'improves memory', 'calms mind'],
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.2.8',
  },
  {
    name: 'कुष्मांड रसायन',
    transliteration: 'kushmanda rasayana',
    englishName: 'Kushmanda rejuvenation',
    ingredients: ['kushmanda (ash gourd)', 'amalaki', 'ghee', 'honey', 'sugar'],
    indications: ['medhya kshaya', 'tuberculosis', 'chronic fever'],
    dose: '1-2 tsp twice daily',
    anupana: 'warm milk',
    benefits: ['promotes intellect', 'boosts immunity', 'nourishes tissues'],
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.2.5',
  },
];

export const SATVAVAJAYA_TECHNIQUES: Satvavajaya[] = [
  {
    name: 'ज्ञान चिकित्सा',
    transliteration: 'jnana chikitsa',
    englishName: 'Knowledge therapy',
    technique: 'Providing knowledge about disease, causes, and treatments to reduce fear and anxiety.',
    indications: ['anxiety', 'fear', 'health anxiety'],
    procedure: 'Patient education about condition, management, and prognosis.',
    benefits: ['reduces anxiety', 'improves compliance', 'empowers patient'],
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 11.20-22',
  },
  {
    name: 'विपरीत चिकित्सा',
    transliteration: 'viparita chikitsa',
    englishName: 'Contrary therapy',
    technique: 'Using opposite qualities to counter the disease.',
    indications: ['dosa imbalance', 'mental disorders'],
    procedure: 'Identify dosha, apply opposite qualities through diet, lifestyle, and medicine.',
    benefits: ['restores dosha balance', 'addresses root cause'],
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 11.23-25',
  },
  {
    name: 'दैव व्यपाश्रय',
    transliteration: 'daiva vyapashraya',
    englishName: 'Spiritual therapy',
    technique: 'Using mantras, rituals, and spiritual practices for mental and emotional issues.',
    indications: ['unmada', 'apasmara', 'psychosomatic disorders'],
    procedure: 'Chanting mantras, performing rituals, spiritual counseling.',
    benefits: ['calms mind', 'provides hope', 'addresses spiritual needs'],
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 11.26-28',
  },
  {
    name: 'युक्ति व्यपाश्रय',
    transliteration: 'yukti vyapashraya',
    englishName: 'Rational therapy',
    technique: 'Evidence-based approach with diet, lifestyle, and medicine.',
    indications: ['all mental and physical disorders'],
    procedure: 'Dietary modifications, lifestyle changes, medicines based on dosha analysis.',
    benefits: ['evidence-based', 'systematic approach', 'proven effectiveness'],
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 11.29-30',
  },
];

export function searchUnmada(query: string): UnmadaType[] {
  const q = query.toLowerCase();
  return UNMADA_TYPES.filter(u => {
    const text = `${u.name} ${u.transliteration} ${u.dosha} ${u.symptoms.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(w => text.includes(w));
  });
}

export function searchApasmara(query: string): ApasmaraType[] {
  const q = query.toLowerCase();
  return APASMARA_TYPES.filter(a => {
    const text = `${a.name} ${a.transliteration} ${a.dosha} ${a.symptoms.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(w => text.includes(w));
  });
}

export function searchMedhyaRasayana(query: string): MedhyaRasayana[] {
  const q = query.toLowerCase();
  return MEDHYA_RASAYANAS.filter(m => {
    const text = `${m.name} ${m.transliteration} ${m.ingredients.join(' ')} ${m.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(w => text.includes(w));
  });
}

export function searchSatvavajaya(query: string): Satvavajaya[] {
  const q = query.toLowerCase();
  return SATVAVAJAYA_TECHNIQUES.filter(s => {
    const text = `${s.name} ${s.transliteration} ${s.technique} ${s.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(w => text.includes(w));
  });
}

export function searchGrahaChikitsaKnowledge(query: string): {
  unmada: UnmadaType[];
  apasmara: ApasmaraType[];
  medhyaRasayanas: MedhyaRasayana[];
  satvavajaya: Satvavajaya[];
} {
  return {
    unmada: searchUnmada(query),
    apasmara: searchApasmara(query),
    medhyaRasayanas: searchMedhyaRasayana(query),
    satvavajaya: searchSatvavajaya(query),
  };
}
