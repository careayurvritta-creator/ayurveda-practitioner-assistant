/**
 * Yoga & Pranayama Knowledge Module
 *
 * Yoga (योग) — Union of individual consciousness with universal consciousness
 * Pranayama (प्राणायाम) — Breath control for regulating prana (life force)
 *
 * Sources:
 * - Yoga Sutras of Patanjali
 * - Hatha Yoga Pradipika by Svatmarama
 * - Gheranda Samhita
 * - Ashtanga Hridaya, Sutra Sthana, Chapter 2
 * - Yoga Ratnakara
 * - Yoga Chikitsa Vigyana (yogic therapy)
 *
 * Key Concepts:
 * - Asana (posture) — physical component
 * - Pranayama (breath control) — energetic component
 * - Shatkarma (six purification techniques) — cleansing
 * - Mudra (gestures) — energy sealing
 * - Bandha (locks) — energy containment
 * - Dhyana (meditation) — mental component
 *
 * Clinical Application:
 * - Condition-specific asana prescriptions
 * - Pranayama protocols for respiratory and mental health
 * - Yoga Nidra for stress and sleep disorders
 * - Shatkarma for cleansing and preparation
 */

export interface YogaAsana {
  name: string;
  transliteration: string;
  englishName: string;
  category: string;
  difficulty: string;
  doshaEffect: string;
  indications: string[];
  contraindications: string[];
  benefits: string[];
  steps: string[];
  duration: string;
  repetitions: string;
  source: string;
  sourceVerse: string;
}

export interface PranayamaTechnique {
  name: string;
  transliteration: string;
  englishName: string;
  pattern: string;
  doshaEffect: string;
  indications: string[];
  contraindications: string[];
  benefits: string[];
  steps: string[];
  duration: string;
  rounds: string;
  source: string;
  sourceVerse: string;
}

export interface Shatkarma {
  name: string;
  transliteration: string;
  englishName: string;
  purpose: string;
  indications: string[];
  contraindications: string[];
  procedure: string;
  precautions: string[];
  source: string;
  sourceVerse: string;
}

export interface YogaProtocol {
  name: string;
  transliteration: string;
  condition: string;
  asanas: string[];
  pranayama: string[];
  duration: string;
  frequency: string;
  precautions: string[];
  source: string;
  sourceVerse: string;
}

export const YOGA_ASANAS: YogaAsana[] = [
  {
    name: 'अर्धमत्स्येन्द्रासन',
    transliteration: 'ardhamatsyendrasana',
    englishName: 'Half spinal twist',
    category: 'twisting',
    difficulty: 'intermediate',
    doshaEffect: 'Kapha-Vata shamana',
    indications: ['digestive disorders', 'back pain', 'constipation', 'diabetes', 'spinal flexibility'],
    contraindications: ['herniated disc', 'pregnancy', 'recent abdominal surgery'],
    benefits: ['improves digestion', 'tones abdominal organs', 'increases spinal flexibility', 'relieves back pain'],
    steps: [
      'Sit with legs extended forward',
      'Bend right knee, place foot outside left knee',
      'Place left arm outside right knee, twist spine',
      'Hold for 30-60 seconds, repeat on other side'
    ],
    duration: '30-60 seconds each side',
    repetitions: '3-5 rounds',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 1, verse 26-27',
  },
  {
    name: 'भुजंगासन',
    transliteration: 'bhujangasana',
    englishName: 'Cobra pose',
    category: 'backbend',
    difficulty: 'beginner',
    doshaEffect: 'Kapha-Pitta shamana',
    indications: ['back pain', 'respiratory disorders', 'constipation', 'fatigue', 'depression'],
    contraindications: ['pregnancy', 'herniated disc', 'ulcer', 'recent abdominal surgery'],
    benefits: ['strengthens spine', 'opens chest', 'improves breathing', 'energizes body'],
    steps: [
      'Lie prone, hands under shoulders',
      'Inhale, press hands to lift chest',
      'Keep elbows slightly bent, shoulders down',
      'Hold for 15-30 seconds, exhale down'
    ],
    duration: '15-30 seconds',
    repetitions: '5-10 rounds',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 1, verse 18-19',
  },
  {
    name: 'वज्रासन',
    transliteration: 'vajrasana',
    englishName: 'Thunderbolt pose',
    category: 'seated',
    difficulty: 'beginner',
    doshaEffect: 'Kapha-Vata shamana',
    indications: ['digestive disorders', 'obesity', 'varicose veins', 'knee problems'],
    contraindications: ['knee problems', 'ankle problems'],
    benefits: ['improves digestion', 'tones pelvic muscles', 'relieves constipation', 'calms mind'],
    steps: [
      'Kneel with feet together, knees apart',
      'Sit back on heels, spine straight',
      'Hands on thighs, eyes closed',
      'Hold for 5-15 minutes'
    ],
    duration: '5-15 minutes',
    repetitions: '1-2 rounds',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 1, verse 37',
  },
  {
    name: 'सूर्यनमस्कार',
    transliteration: 'suryanamaskar',
    englishName: 'Sun salutation',
    category: 'dynamic',
    difficulty: 'intermediate',
    doshaEffect: 'Tridosha shamana',
    indications: ['obesity', 'depression', 'fatigue', 'digestive disorders', 'respiratory disorders'],
    contraindications: ['pregnancy', 'recent surgery', 'high blood pressure', 'back injury'],
    benefits: ['full body workout', 'improves circulation', 'energizes body', 'calms mind'],
    steps: [
      'Pranamasana (prayer pose)',
      'Hasta Uttanasana (raised arms)',
      'Padahastasana (forward bend)',
      'Ashwa Sanchalanasana (equestrian)',
      'Dandasana (stick pose)',
      'Ashtanga Namaskar (salute with eight parts)',
      'Bhujangasana (cobra)',
      'Adho Mukha Svanasana (downward dog)',
      'Ashwa Sanchalanasana',
      'Padahastasana',
      'Hasta Uttanasana',
      'Pranamasana'
    ],
    duration: '1 complete round = 12 postures',
    repetitions: '6-12 rounds',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 1',
  },
  {
    name: 'शवासन',
    transliteration: 'shavasana',
    englishName: 'Corpse pose',
    category: 'relaxation',
    difficulty: 'beginner',
    doshaEffect: 'Tridosha shamaka',
    indications: ['stress', 'insomnia', 'anxiety', 'fatigue', 'hypertension'],
    contraindications: ['none'],
    benefits: ['deep relaxation', 'reduces stress', 'lowers blood pressure', 'improves sleep'],
    steps: [
      'Lie supine, legs slightly apart',
      'Arms at sides, palms facing up',
      'Close eyes, relax entire body',
      'Focus on breath, 15-30 minutes'
    ],
    duration: '15-30 minutes',
    repetitions: '1 round',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 1, verse 32',
  },
  {
    name: 'ताडासन',
    transliteration: 'tadasana',
    englishName: 'Mountain pose',
    category: 'standing',
    difficulty: 'beginner',
    doshaEffect: 'Vata shamana',
    indications: ['posture improvement', 'balance', 'height increase (children)', 'mental focus'],
    contraindications: ['low blood pressure (caution)'],
    benefits: ['improves posture', 'increases height', 'strengthens thighs/knees', 'improves balance'],
    steps: [
      'Stand with feet together, arms at sides',
      'Inhale, raise arms overhead, interlock fingers',
      'Rise on toes, stretch entire body',
      'Hold for 10-15 seconds, exhale down'
    ],
    duration: '10-15 seconds',
    repetitions: '10-15 rounds',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 1',
  },
  {
    name: 'पश्चिमोत्तानासन',
    transliteration: 'paschimottanasana',
    englishName: 'Seated forward bend',
    category: 'forward bend',
    difficulty: 'beginner',
    doshaEffect: 'Pitta-Vata shamaka',
    indications: ['digestive disorders', 'obesity', 'constipation', 'anxiety', 'insomnia'],
    contraindications: ['herniated disc', 'back injury', 'pregnancy'],
    benefits: ['calms mind', 'improves digestion', 'stretches spine', 'relieves anxiety'],
    steps: [
      'Sit with legs extended forward',
      'Inhale, raise arms overhead',
      'Exhale, bend forward from hips',
      'Hold feet or shins, breathe normally',
      'Hold for 30-60 seconds'
    ],
    duration: '30-60 seconds',
    repetitions: '5-10 rounds',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 1, verse 28-29',
  },
  {
    name: 'सर्वांगासन',
    transliteration: 'sarvangasana',
    englishName: 'Shoulder stand',
    category: 'inversion',
    difficulty: 'intermediate',
    doshaEffect: 'Kapha-Vata shamaka',
    indications: ['thyroid disorders', 'constipation', 'obesity', 'respiratory disorders', 'insomnia'],
    contraindications: ['hypertension', 'glaucoma', 'pregnancy', 'menstruation', 'neck injury'],
    benefits: ['stimulates thyroid', 'improves circulation', 'calms nervous system', 'improves digestion'],
    steps: [
      'Lie supine, lift legs to 90 degrees',
      'Support back with hands, lift hips',
      'Extend legs vertically, chin to chest',
      'Hold for 30-120 seconds'
    ],
    duration: '30-120 seconds',
    repetitions: '1-3 rounds',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 3, verse 78-80',
  },
];

export const PRANAYAMA_TECHNIQUES: PranayamaTechnique[] = [
  {
    name: 'नाडीशोधन प्राणायाम',
    transliteration: 'nadi shodhana pranayama',
    englishName: 'Alternate nostril breathing',
    pattern: 'alternate nostril, no retention',
    doshaEffect: 'Tridosha shamaka (especially Vata-Pitta)',
    indications: ['stress', 'anxiety', 'insomnia', 'hypertension', 'mental imbalance'],
    contraindications: ['none'],
    benefits: ['balances left-right brain', 'calms nervous system', 'improves focus', 'regulates doshas'],
    steps: [
      'Sit comfortably, spine straight',
      'Close right nostril with thumb, inhale through left',
      'Close both nostrils, retain (optional)',
      'Close left nostril, exhale through right',
      'Inhale through right, close right, exhale through left',
      'This completes 1 round'
    ],
    duration: '5-15 minutes',
    rounds: '5-15 rounds',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 7-8',
  },
  {
    name: 'कपालभाती',
    transliteration: 'kapalbhati',
    englishName: 'Skull shining breath',
    pattern: 'forceful exhalation, passive inhalation',
    doshaEffect: 'Kapha-Vata shamaka',
    indications: ['obesity', 'constipation', 'depression', 'sinusitis', 'respiratory disorders'],
    contraindications: ['pregnancy', 'hypertension', 'hernia', 'heart disease', 'ulcer'],
    benefits: ['cleanses nasal passages', 'energizes body', 'improves digestion', 'clears mind'],
    steps: [
      'Sit comfortably, spine straight',
      'Inhale deeply, then exhale forcefully through nose',
      'Pull abdomen inward during exhalation',
      'Allow passive inhalation',
      'Repeat rapidly, 20-30 pumps per round'
    ],
    duration: '3-5 minutes',
    rounds: '3-5 rounds of 20-30 pumps',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 66-67',
  },
  {
    name: 'भ्रामरी प्राणायाम',
    transliteration: 'bhramari pranayama',
    englishName: 'Bee breath',
    pattern: 'humming exhalation',
    doshaEffect: 'Tridosha shamaka (especially Pitta)',
    indications: ['anxiety', 'insomnia', 'migraine', 'hypertension', 'tinnitus'],
    contraindications: ['none'],
    benefits: ['calms mind', 'reduces anxiety', 'improves sleep', 'relieves headache'],
    steps: [
      'Sit comfortably, close ears with thumbs',
      'Place fingers over eyes, close mouth',
      'Inhale deeply through nose',
      'Exhale with humming sound (like bee)',
      'Feel vibration in head'
    ],
    duration: '5-15 minutes',
    rounds: '5-15 rounds',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 11-12',
  },
  {
    name: 'उज्जायी प्राणायाम',
    transliteration: 'ujjayi pranayama',
    englishName: 'Victorious breath (ocean breath)',
    pattern: 'constricted throat breathing',
    doshaEffect: 'Kapha-Pitta shamaka',
    indications: ['respiratory disorders', 'thyroid disorders', 'anxiety', 'insomnia'],
    contraindications: ['none'],
    benefits: ['calms nervous system', 'improves sleep', 'regulates thyroid', 'energizes body'],
    steps: [
      'Sit comfortably, close mouth',
      'Slightly constrict throat (like fogging glass)',
      'Breathe through nose with constricted throat',
      'Make soft hissing sound during inhalation',
      'Breathe slowly and deeply'
    ],
    duration: '5-15 minutes',
    rounds: '10-20 breaths per round, 3-5 rounds',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 7',
  },
  {
    name: 'भस्त्रिका प्राणायाम',
    transliteration: 'bhastrika pranayama',
    englishName: 'Bellows breath',
    pattern: 'forceful inhalation and exhalation',
    doshaEffect: 'Kapha-Vata shamaka',
    indications: ['obesity', 'depression', 'respiratory disorders', 'digestive weakness'],
    contraindications: ['pregnancy', 'hypertension', 'hernia', 'heart disease', 'ulcer', 'epilepsy'],
    benefits: ['energizes body', 'clears nasal passages', 'improves digestion', 'increases metabolism'],
    steps: [
      'Sit comfortably, spine straight',
      'Inhale and exhale forcefully through nose',
      'Make loud bellows-like sound',
      'Pump abdomen with each breath',
      'Speed up gradually'
    ],
    duration: '1-3 minutes',
    rounds: '3 rounds of 20-30 pumps',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 59-65',
  },
  {
    name: 'मृदु प्राणायाम',
    transliteration: 'mridu pranayama',
    englishName: 'Gentle breath',
    pattern: 'slow, deep, gentle breathing',
    doshaEffect: 'Tridosha shamaka',
    indications: ['stress', 'anxiety', 'hypertension', 'insomnia', 'general relaxation'],
    contraindications: ['none'],
    benefits: ['calms mind', 'reduces blood pressure', 'improves sleep', 'reduces stress'],
    steps: [
      'Sit comfortably, close eyes',
      'Breathe slowly and deeply through nose',
      'Make no sound, breathe gently',
      'Focus on smooth, even breathing',
      'Continue for 5-15 minutes'
    ],
    duration: '5-15 minutes',
    rounds: 'Continuous',
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 2',
  },
];

export const SHATKARMAS: Shatkarma[] = [
  {
    name: 'जलनेती',
    transliteration: 'jala neti',
    englishName: 'Nasal irrigation with water',
    purpose: 'Cleanses nasal passages, removes mucus and allergens',
    indications: ['sinusitis', 'allergic rhinitis', 'nasal congestion', 'migraine', 'respiratory disorders'],
    contraindications: ['active ear infection', 'nasal polyps', 'nasal surgery'],
    procedure: 'Use neti pot with lukewarm saline solution. Tilt head, pour water through one nostril, let it flow out other nostril. Repeat on other side.',
    precautions: ['use sterile/lukewarm water', 'clean neti pot after use', 'do not swallow water'],
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 24-25',
  },
  {
    name: 'धौती',
    transliteration: 'dhauti',
    englishName: 'Cleansing of stomach',
    purpose: 'Cleanses digestive tract, removes excess mucus and toxins',
    indications: ['digestive disorders', 'obesity', 'respiratory disorders', 'skin diseases'],
    contraindications: ['ulcer', 'hernia', 'pregnancy', 'heart disease'],
    procedure: 'Swallow a long strip of cloth (vastra dhauti) or drink large quantity of water and induce vomiting (vaman dhauti).',
    precautions: ['do not force', 'use clean cloth', 'do not practice alone first time'],
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 26-27',
  },
  {
    name: 'नौली',
    transliteration: 'nauli',
    englishName: 'Abdominal churning',
    purpose: 'Strengthens abdominal muscles, improves digestion',
    indications: ['obesity', 'constipation', 'digestive weakness', 'diabetes'],
    contraindications: ['pregnancy', 'hernia', 'ulcer', 'recent surgery'],
    procedure: 'Isolate and rotate rectus abdominis muscles in circular motion. Start with madhyama nauli, then vama and dakshina.',
    precautions: ['practice on empty stomach', 'start slowly', 'do not force'],
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 30-31',
  },
  {
    name: 'बस्ती',
    transliteration: 'basti',
    englishName: 'Enema',
    purpose: 'Cleanses colon, removes accumulated vata and toxins',
    indications: ['constipation', 'vata disorders', 'obesity', 'skin diseases', 'arthritis'],
    contraindications: ['diarrhea', 'pregnancy', 'rectal prolapse'],
    procedure: 'Two types: jala basti (water enema) using rubber bulb, and sneha basti (oil enema) using medicated oil.',
    precautions: ['use lukewarm water/oil', 'do not retain for too long', 'practice under supervision first time'],
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 28-29',
  },
  {
    name: 'कपालभाती',
    transliteration: 'kapalbhati',
    englishName: 'Skull cleansing',
    purpose: 'Cleanses frontal sinuses, improves mental clarity',
    indications: ['sinusitis', 'migraine', 'mental fog', 'depression'],
    contraindications: ['hypertension', 'hernia', 'pregnancy', 'heart disease'],
    procedure: 'Forceful exhalations through nose with abdominal pumping. Not to be confused with kapalbhati pranayama (same technique, different intent).',
    precautions: ['practice on empty stomach', 'do not force', 'stop if dizzy'],
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 32-33',
  },
  {
    name: 'त्राटक',
    transliteration: 'trataka',
    englishName: 'Gazing',
    purpose: 'Strengthens eyes, improves concentration, calms mind',
    indications: ['eye strain', 'weak eyesight', 'insomnia', 'mental restlessness'],
    contraindications: ['active eye infection', 'glaucoma'],
    procedure: 'Gaze steadily at a candle flame or single point without blinking until tears flow. Then close eyes and visualize the afterimage.',
    precautions: ['do not stare at sun', 'use in dim light only', 'do not force eyes'],
    source: 'hatha yoga pradipika',
    sourceVerse: 'chapter 2, verse 34-35',
  },
];

export const YOGA_PROTOCOLS: YogaProtocol[] = [
  {
    name: 'मधुमेह योग प्रोटोकॉल',
    transliteration: 'prameha yoga protocol',
    condition: 'diabetes mellitus (prameha)',
    asanas: ['ardhamatsyendrasana', 'paschimottanasana', 'bhujangasana', 'sarvangasana', 'suryanamaskar'],
    pranayama: ['kapalbhati', 'bhastrika', 'nadi shodhana'],
    duration: '45-60 minutes',
    frequency: 'daily',
    precautions: ['avoid overexertion', 'monitor blood sugar', 'stop if dizzy'],
    source: 'yoga chikitsa vigyana',
    sourceVerse: 'prameha protocol',
  },
  {
    name: 'वातव्याधि योग प्रोटोकॉल',
    transliteration: 'vata vyadhi yoga protocol',
    condition: 'vata disorders (arthritis, neurological conditions)',
    asanas: ['vajrasana', 'tadasana', 'bhujangasana', 'shavasana'],
    pranayama: ['nadi shodhana', 'bhramari', 'ujjayi'],
    duration: '30-45 minutes',
    frequency: 'daily',
    precautions: ['avoid cold environment', 'gentle movements', 'warm up properly'],
    source: 'yoga chikitsa vigyana',
    sourceVerse: 'vata protocol',
  },
  {
    name: 'अनिद्रा योग प्रोटोकॉल',
    transliteration: 'anidra yoga protocol',
    condition: 'insomnia (anidra)',
    asanas: ['shavasana', 'paschimottanasana', 'sarvangasana', 'matsyasana'],
    pranayama: ['bhramari', 'nadi shodhana', 'mridu'],
    duration: '30-45 minutes',
    frequency: 'before sleep',
    precautions: ['avoid stimulants', 'dark quiet room', 'consistent timing'],
    source: 'yoga chikitsa vigyana',
    sourceVerse: 'insomnia protocol',
  },
  {
    name: 'श्वास योग प्रोटोकॉल',
    transliteration: 'shwasa yoga protocol',
    condition: 'respiratory disorders (asthma, bronchitis)',
    asanas: ['bhujangasana', 'sarvangasana', 'suryanamaskar', 'tadasana'],
    pranayama: ['ujjayi', 'bhramari', 'nadi shodhana'],
    duration: '30-45 minutes',
    frequency: 'daily',
    precautions: ['avoid cold dust', 'warm environment', 'avoid overexertion'],
    source: 'yoga chikitsa vigyana',
    sourceVerse: 'respiratory protocol',
  },
  {
    name: 'तनाव योग प्रोटोकॉल',
    transliteration: 'tanav yoga protocol',
    condition: 'stress and anxiety',
    asanas: ['shavasana', 'paschimottanasana', 'tadasana', 'vajrasana'],
    pranayama: ['nadi shodhana', 'bhramari', 'mridu'],
    duration: '30-45 minutes',
    frequency: 'daily',
    precautions: ['avoid stimulants', 'quiet environment', 'consistent timing'],
    source: 'yoga chikitsa vigyana',
    sourceVerse: 'stress protocol',
  },
];

/**
 * Search functions for Yoga & Pranayama knowledge
 */
export function searchYogaAsanas(query: string): YogaAsana[] {
  const q = query.toLowerCase();
  return YOGA_ASANAS.filter(a => {
    const searchText = `${a.name} ${a.transliteration} ${a.englishName} ${a.category} ${a.indications.join(' ')} ${a.benefits.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchPranayama(query: string): PranayamaTechnique[] {
  const q = query.toLowerCase();
  return PRANAYAMA_TECHNIQUES.filter(t => {
    const searchText = `${t.name} ${t.transliteration} ${t.englishName} ${t.pattern} ${t.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchShatkarmas(query: string): Shatkarma[] {
  const q = query.toLowerCase();
  return SHATKARMAS.filter(s => {
    const searchText = `${s.name} ${s.transliteration} ${s.englishName} ${s.purpose} ${s.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchYogaProtocols(query: string): YogaProtocol[] {
  const q = query.toLowerCase();
  return YOGA_PROTOCOLS.filter(p => {
    const searchText = `${p.name} ${p.transliteration} ${p.condition} ${p.asanas.join(' ')} ${p.pranayama.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchYogaPranayamaKnowledge(query: string): {
  asanas: YogaAsana[];
  pranayama: PranayamaTechnique[];
  shatkarmas: Shatkarma[];
  protocols: YogaProtocol[];
} {
  return {
    asanas: searchYogaAsanas(query),
    pranayama: searchPranayama(query),
    shatkarmas: searchShatkarmas(query),
    protocols: searchYogaProtocols(query),
  };
}
