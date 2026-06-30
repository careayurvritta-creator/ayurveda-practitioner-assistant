/**
 * Kaumara Bhritya Knowledge Module
 *
 * Kaumara Bhritya (कौमारभृत्य) — Pediatrics and obstetrics branch of Ayurveda
 *
 * Sources:
 * - Kashyapa Samhita (Kaumara Bhritya) by Kashyapa
 * - Sushruta Samhita, Sharira Sthana, Chapters 2-3 (Garbha Vyakarana)
 * - Charaka Samhita, Sharira Sthana (Garbha Vyakarana)
 * - Ashtanga Hridaya, Uttar Tantra, Chapters 1-2
 * - Yogaratnakara
 *
 * Key Concepts:
 * - Garbha Sanskar (prenatal care and education)
 * - Sutika Kalpa (postpartum care)
 * - Kaumara Bhritya (pediatric care from birth to 16 years)
 * - Balopacharana (pediatric treatments)
 * - Panchakarma for children (modified)
 *
 * Age Classification:
 * - Garbha (in utero): conception to delivery
 * - Sutika (postpartum): 0-7 days (mother and child)
 * - Nagnala (newborn): 7 days - 2 months
 * - Shishu (infant): 2 months - 1 year
 * - Kaumara (childhood): 1-16 years
 */

export interface GarbhaCare {
  name: string;
  transliteration: string;
  englishName: string;
  trimester: string;
  care: string;
  diet: string[];
  activities: string[];
  restrictions: string[];
  formulations: string[];
  source: string;
  sourceVerse: string;
}

export interface SutikaCare {
  name: string;
  transliteration: string;
  englishName: string;
  period: string;
  care: string;
  formulations: string[];
  dietaryAdvice: string[];
  lifestyleAdvice: string[];
  complications: string[];
  source: string;
  sourceVerse: string;
}

export interface BalRoga {
  name: string;
  transliteration: string;
  englishName: string;
  age: string;
  symptoms: string[];
  formulations: string[];
  dose: string;
  anupana: string;
  precautions: string[];
  source: string;
  sourceVerse: string;
}

export interface Garbhasanskar {
  name: string;
  transliteration: string;
  englishName: string;
  period: string;
  practice: string;
  purpose: string;
  benefits: string[];
  source: string;
  sourceVerse: string;
}

export const GARBHA_CARE: GarbhaCare[] = [
  {
    name: 'प्रथम त्रैमासिक',
    transliteration: 'prathama trimasika',
    englishName: 'First trimester care',
    trimester: 'first (0-3 months)',
    care: 'Garbhini Paricharya — prenatal regimen including dietary guidelines, behavioral recommendations, and preventive medicines.',
    diet: ['sugarcane', 'milk', 'ghee', 'rice', 'wheat', 'amalaki', 'pomegranate', 'grapes', 'avoid spicy food'],
    activities: ['gentle walking', 'pranayama', 'meditation', 'avoid heavy work', 'adequate rest'],
    restrictions: ['avoid alcohol', 'avoid tobacco', 'avoid heavy exercise', 'avoid fasting', 'avoid sleeping during day'],
    formulations: ['sukumara kashaya', 'shatavari churna', 'dadimashtaka churna'],
    source: 'sushruta samhita',
    sourceVerse: 'sharira sthana 2.33-38',
  },
  {
    name: 'द्वितीय त्रैमासिक',
    transliteration: 'dvitiya trimasika',
    englishName: 'Second trimester care',
    trimester: 'second (3-6 months)',
    care: 'Continued prenatal care with emphasis on fetal growth and maternal health. Garbha Poshana (fetal nourishment).',
    diet: ['milk with honey', 'ghee', 'rice', 'wheat', 'green gram', 'amalaki', 'pomegranate'],
    activities: ['gentle walking', 'yoga', 'pranayama', 'music therapy', 'reading'],
    restrictions: ['avoid heavy work', 'avoid stress', 'avoid alcohol', 'avoid tobacco'],
    formulations: ['sukumara kashaya', 'shatavari churna'],
    source: 'sushruta samhita',
    sourceVerse: 'sharira sthana 2.39-42',
  },
  {
    name: 'तृतीय त्रैमासिक',
    transliteration: 'tritiya trimasika',
    englishName: 'Third trimester care',
    trimester: 'third (6-9 months)',
    care: 'Final trimester preparation for delivery. Garbha Udvartana (descent of fetus), Sutika preparation.',
    diet: ['milk', 'ghee', 'rice', 'wheat', 'avoid heavy foods'],
    activities: ['gentle walking', 'pranayama', 'meditation', 'preparation for delivery'],
    restrictions: ['avoid heavy work', 'avoid stress', 'avoid sleeping on back', 'avoid intercourse'],
    formulations: ['sukumara kashaya', 'garbha pala rasa'],
    source: 'sushruta samhita',
    sourceVerse: 'sharira sthana 2.43-45',
  },
];

export const SUTIKA_CARE: SutikaCare[] = [
  {
    name: 'सूतिका परिचर्या',
    transliteration: 'sutika paricharya',
    englishName: 'Postpartum care',
    period: '0-7 days (sutika kala)',
    care: 'Intensive postpartum care for mother and newborn. Includes dietary regulations, behavioral guidelines, and preventive treatments.',
    formulations: ['sahacharadi taila', 'phalatrikadi kashaya', 'drakshasava', 'ashwagandharishta'],
    dietaryAdvice: ['light warm foods', 'ghee', 'milk', 'rice gruel', 'avoid cold foods', 'avoid spicy foods'],
    lifestyleAdvice: ['adequate rest', 'warm environment', 'breastfeeding', 'gentle massage', 'avoid stress'],
    complications: ['puerperal fever', 'lochiorrhea', 'breast abscess', 'postpartum depression'],
    source: 'kashyapa samhita',
    sourceVerse: 'sutra sthana 3.1-10',
  },
  {
    name: 'जातकर्म',
    transliteration: 'jatakarma',
    englishName: 'Birth rituals and newborn care',
    period: 'immediately after birth',
    care: 'Newborn care including cutting the cord, cleaning, feeding, and protective rituals.',
    formulations: ['sugandhitadi taila', 'ghrita with honey'],
    dietaryAdvice: ['breast milk (within 1 hour)', 'avoid pre-lacteal feeds'],
    lifestyleAdvice: ['skin-to-skin contact', 'warm environment', 'hygienic handling'],
    complications: ['neonatal jaundice', 'infection', 'respiratory distress'],
    source: 'kashyapa samhita',
    sourceVerse: 'sutra sthana 3.11-20',
  },
];

export const BAL_ROGA: BalRoga[] = [
  {
    name: 'संसर्जन ज्वर',
    transliteration: 'samsarjana jwara',
    englishName: 'Exanthematous fever (measles-like)',
    age: '6 months - 5 years',
    symptoms: ['fever', 'rash', 'cough', 'conjunctivitis', 'kopik', 'anorexia'],
    formulations: ['sarivadyasava', 'khadirarishta', 'mahamanjishthadi kashaya'],
    dose: '2-5ml (depending on age)',
    anupana: 'warm water',
    precautions: ['isolation', 'hydration', 'light diet', 'avoid cold exposure'],
    source: 'kashyapa samhita',
    sourceVerse: 'chikitsa sthana 5.1-20',
  },
  {
    name: 'अतिसार',
    transliteration: 'atisara',
    englishName: 'Diarrhea',
    age: '6 months - 5 years',
    symptoms: ['frequent loose stools', 'dehydration', 'fever', 'anorexia', 'lethargy'],
    formulations: ['bilvadi churna', 'kutaja churna', 'bilvadi leha'],
    dose: '250mg - 1g churna (age-appropriate)',
    anupana: 'warm water, honey',
    precautions: ['oral rehydration', 'continue breastfeeding', 'avoid cow milk'],
    source: 'kashyapa samhita',
    sourceVerse: 'chikitsa sthana 5.21-40',
  },
  {
    name: 'कास',
    transliteration: 'kasa',
    englishName: 'Cough',
    age: '6 months - 5 years',
    symptoms: ['cough', 'croup', 'wheezing', 'fever', 'difficulty breathing'],
    formulations: ['kantakari avaleha', 'vasakasava', 'sitopaladi churna'],
    dose: '250mg - 1g churna (age-appropriate)',
    anupana: 'honey, warm water',
    precautions: ['avoid cold exposure', 'warm environment', 'steam inhalation'],
    source: 'kashyapa samhita',
    sourceVerse: 'chikitsa sthana 5.41-50',
  },
  {
    name: 'रक्तपित्त',
    transliteration: 'raktapitta',
    englishName: 'Bleeding disorders',
    age: 'any age',
    symptoms: ['bleeding from nose', 'bleeding from gums', 'easy bruising', 'pallor', 'fatigue'],
    formulations: ['kamadugha rasa', 'praval pishti', 'sphatika bhasma', 'lohasava'],
    dose: '125mg - 250mg (age-appropriate)',
    anupana: 'honey, warm water',
    precautions: ['avoid hot spicy foods', 'adequate rest', 'avoid injury'],
    source: 'kashyapa samhita',
    sourceVerse: 'chikitsa sthana 5.51-60',
  },
  {
    name: 'प्रमेह',
    transliteration: 'prameha',
    englishName: 'Diabetes (juvenile)',
    age: 'any age',
    symptoms: ['polyuria', 'polydipsia', 'sweet urine', 'weight loss', 'fatigue'],
    formulations: ['guduchyadi kashaya', 'shilajit', 'gokshura'],
    dose: '250mg - 1g (age-appropriate)',
    anupana: 'warm water',
    precautions: ['dietary control', 'regular monitoring', 'avoid sugar'],
    source: 'kashyapa samhita',
    sourceVerse: 'chikitsa sthana 5.61-70',
  },
];

export const GARBHASANSKAR: Garbhasanskar[] = [
  {
    name: 'संस्कार विधि',
    transliteration: 'samskar vidhi',
    englishName: 'Prenatal education and practice',
    period: 'throughout pregnancy',
    practice: 'Reading scriptures, listening to music, chanting mantras, maintaining positive thoughts, dietary purity.',
    purpose: 'Imparts positive samskaras (mental impressions) on the fetus, promoting physical and mental development.',
    benefits: ['mental development', 'emotional stability', 'spiritual growth', 'positive personality'],
    source: 'charaka samhita',
    sourceVerse: 'sharira sthana 4.26-30',
  },
  {
    name: 'गर्भिणी परिचर्या',
    transliteration: 'garbhini paricharya',
    englishName: 'Prenatal regimen',
    period: 'throughout pregnancy',
    practice: 'Dietary regulations, behavioral guidelines, preventive medicines, prenatal yoga and pranayama.',
    purpose: 'Ensures healthy pregnancy, normal delivery, and healthy child.',
    benefits: ['normal delivery', 'healthy child', 'maternal health', 'prevention of complications'],
    source: 'sushruta samhita',
    sourceVerse: 'sharira sthana 2.33-45',
  },
  {
    name: 'प्रसव काल',
    transliteration: 'prasava kal',
    englishName: 'Delivery care',
    period: 'during delivery',
    practice: 'Normal delivery with proper aseptic techniques, assisted delivery if needed, immediate newborn care.',
    purpose: 'Safe delivery of mother and child.',
    benefits: ['normal delivery', 'minimal intervention', 'immediate bonding', 'early breastfeeding'],
    source: 'kashyapa samhita',
    sourceVerse: 'sutra sthana 3.11-20',
  },
];

/**
 * Search functions for Kaumara Bhritya knowledge
 */
export function searchGarbhaCare(query: string): GarbhaCare[] {
  const q = query.toLowerCase();
  return GARBHA_CARE.filter(c => {
    const searchText = `${c.name} ${c.transliteration} ${c.englishName} ${c.trimester} ${c.diet.join(' ')} ${c.formulations.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchSutikaCare(query: string): SutikaCare[] {
  const q = query.toLowerCase();
  return SUTIKA_CARE.filter(c => {
    const searchText = `${c.name} ${c.transliteration} ${c.englishName} ${c.period} ${c.formulations.join(' ')} ${c.complications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchBalRoga(query: string): BalRoga[] {
  const q = query.toLowerCase();
  return BAL_ROGA.filter(d => {
    const searchText = `${d.name} ${d.transliteration} ${d.englishName} ${d.symptoms.join(' ')} ${d.formulations.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchGarbhasanskar(query: string): Garbhasanskar[] {
  const q = query.toLowerCase();
  return GARBHASANSKAR.filter(g => {
    const searchText = `${g.name} ${g.transliteration} ${g.englishName} ${g.period} ${g.practice} ${g.purpose}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchKaumaraBhrityaKnowledge(query: string): {
  garbhaCare: GarbhaCare[];
  sutikaCare: SutikaCare[];
  balRoga: BalRoga[];
  garbhasanskar: Garbhasanskar[];
} {
  return {
    garbhaCare: searchGarbhaCare(query),
    sutikaCare: searchSutikaCare(query),
    balRoga: searchBalRoga(query),
    garbhasanskar: searchGarbhasanskar(query),
  };
}
