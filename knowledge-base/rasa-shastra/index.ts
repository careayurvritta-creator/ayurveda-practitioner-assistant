/**
 * Rasa Shastra Knowledge Module
 *
 * Rasa Shastra (रसशास्त्र) is the branch of Ayurveda dealing with minerals,
 * metals, and mercury-based medicines. It includes:
 * - Rasa Dravyas (mineral substances)
 * - Bhasma preparation (incinerated preparations)
 * - Rasa Aushadhi (mercury-based formulations)
 * - Shodhana (purification procedures)
 * - Marana (incineration procedures)
 *
 * Sources:
 * - Rasa Tarangini by Sadananda Sharma
 * - Rasa Ratna Samucchaya by Vagbhata II
 * - Rasa Prakasha Sudhakara by Yashodhara
 * - Rasaratna Samucchaya with Vidyotini commentary
 *
 * Important Safety Note:
 * - Rasa Shastra preparations require expert supervision
 * - Improper processing can cause heavy metal toxicity
 * - All bhasma must pass quality control tests (varitara, rekhapurna, etc.)
 * - Not recommended for children, pregnant women, or elderly without supervision
 */

export interface RasaDravya {
  name: string;
  transliteration: string;
  englishName: string;
  category: string;
  rasa: string;
  guna: string;
  veerya: string;
  vipaka: string;
  doshaEffect: string;
  shodhana: string;
  indications: string[];
  toxicity: string;
  processingNotes: string[];
  source: string;
  sourceVerse: string;
}

export interface Bhasma {
  name: string;
  transliteration: string;
  englishName: string;
  metal: string;
  shodhanaMethod: string;
  maranaMethod: string;
  qualityTests: string[];
  indications: string[];
  dose: string;
  anupana: string;
  contraindications: string[];
  toxicityNotes: string[];
  source: string;
  sourceVerse: string;
}

export interface RasaAushadhi {
  name: string;
  transliteration: string;
  ingredients: string[];
  preparationMethod: string;
  indications: string[];
  dose: string;
  anupana: string;
  precautions: string[];
  source: string;
  sourceVerse: string;
}

export interface ShodhanaProcedure {
  name: string;
  transliteration: string;
  substance: string;
  medium: string;
  procedure: string;
  duration: string;
  endpoint: string;
  purpose: string;
  source: string;
  sourceVerse: string;
}

export const RASA_DRAVYAS: RasaDravya[] = [
  {
    name: 'पारद',
    transliteration: 'parada',
    englishName: 'Mercury',
    category: 'rasa',
    rasa: 'tikta, kashaya',
    guna: 'laghu, snigdha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana',
    shodhana: 'Gandhaka shodhana (sulphur purification) — 7 times',
    indications: ['kusta', 'prameha', 'kushtha', 'unmada', 'apasmara', 'rasayana'],
    toxicity: 'HIGHLY TOXIC if not properly processed',
    processingNotes: [
      'Must be purified 7 times with gandhaka (sulphur)',
      'Each cycle: grind with gandhaka, heat in sand bath, cool, repeat',
      'Final product should be black, unctuous, and tasteless',
      'Quality test: varitara (floats on water)'
    ],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 1',
  },
  {
    name: 'गन्धक',
    transliteration: 'gandhaka',
    englishName: 'Sulphur',
    category: 'rasa',
    rasa: 'tikta, kashaya',
    guna: 'laghu, snigdha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Kapha-Vata shamana',
    shodhana: 'Gomutra shodhana (cow urine purification) — 3 times',
    indications: ['kusta', 'prameha', 'shwasa', 'kasa', 'pandu'],
    toxicity: 'TOXIC if not properly processed',
    processingNotes: [
      'Purified with cow urine 3 times',
      'Each cycle: boil in cow urine for 3 hours, wash, dry',
      'Final product should be yellow and odorless',
      'Used as base for parada shodhana'
    ],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 2',
  },
  {
    name: 'ताम्र भस्म',
    transliteration: 'tamra bhasma',
    englishName: 'Copper Bhasma',
    category: 'bhasma',
    rasa: 'tikta, kashaya',
    guna: 'laghu, snigdha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Kapha-Pitta shamana',
    shodhana: 'Gomutra shodhana — 7 times',
    indications: ['pandu', 'kamala', 'kusta', 'prameha', 'panduroga'],
    toxicity: 'MODERATE — requires proper shodhana',
    processingNotes: [
      'Shodhana with cow urine 7 times',
      'Marana in samtarpana kupi with triphala kwath',
      'Quality test: varitara, rekhapurna',
      'Color: red to dark red'
    ],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 5',
  },
  {
    name: 'लोह भस्म',
    transliteration: 'loha bhasma',
    englishName: 'Iron Bhasma',
    category: 'bhasma',
    rasa: 'tikta, kashaya',
    guna: 'guru, snigdha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Vata-Kapha shamana',
    shodhana: 'Gomutra shodhana — 7 times',
    indications: ['pandu', 'kamala', 'kusta', 'prameha', 'rasayana', 'balya'],
    toxicity: 'MODERATE — requires proper shodhana',
    processingNotes: [
      'Shodhana with cow urine 7 times',
      'Marana in sealed pots with herbal juices',
      'Quality test: varitara, rekhapurna',
      'Color: dark grey to black'
    ],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 6',
  },
  {
    name: 'स्वर्ण भस्म',
    transliteration: 'swarna bhasma',
    englishName: 'Gold Bhasma',
    category: 'bhasma',
    rasa: 'madhura, tikta',
    guna: 'guru, snigdha',
    veerya: 'sheeta',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana',
    shodhana: 'Gomutra shodhana — 7 times',
    indications: ['rasayana', 'medhya', 'balya', 'vyadhikshamatva', 'jwara', 'kasa'],
    toxicity: 'LOW if properly processed',
    processingNotes: [
      'Shodhana with cow urine 7 times',
      'Marana in sealed pots with guggulu',
      'Quality test: varitara, rekhapurna',
      'Color: reddish brown'
    ],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 7',
  },
  {
    name: 'रजत भस्म',
    transliteration: 'rajat bhasma',
    englishName: 'Silver Bhasma',
    category: 'bhasma',
    rasa: 'madhura, tikta',
    guna: 'guru, snigdha',
    veerya: 'sheeta',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana',
    shodhana: 'Gomutra shodhana — 7 times',
    indications: ['rasayana', 'medhya', 'balya', 'prameha', 'kamala'],
    toxicity: 'LOW if properly processed',
    processingNotes: [
      'Shodhana with cow urine 7 times',
      'Marana in sealed pots with guggulu',
      'Quality test: varitara, rekhapurna',
      'Color: grey to dark grey'
    ],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 8',
  },
];

export const BHASMA_PREPARATIONS: Bhasma[] = [
  {
    name: 'गन्धक भस्म',
    transliteration: 'gandhaka bhasma',
    englishName: 'Sulphur Bhasma',
    metal: 'sulphur',
    shodhanaMethod: 'Boiled in cow urine for 3 hours, washed, dried — repeated 3 times',
    maranaMethod: 'Puttapaka (sealed pot incineration) with guggulu and honey',
    qualityTests: ['varitara (floats on water)', 'rekhapurna (fills finger creases)', 'churniyojana (easily ground)'],
    indications: ['kusta', 'prameha', 'shwasa', 'kasa', 'pandu', 'rasayana'],
    dose: '125mg - 250mg with adjuvant',
    anupana: 'honey, warm water',
    contraindications: ['pregnancy', 'children', 'pitta prakriti (caution)'],
    toxicityNotes: [
      'Must be properly shodhana (purified)',
      'Raw sulphur is highly toxic',
      'Proper processing essential for safety',
      'Quality control tests must be passed'
    ],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 2',
  },
  {
    name: 'ताम्र भस्म',
    transliteration: 'tamra bhasma',
    englishName: 'Copper Bhasma',
    metal: 'copper',
    shodhanaMethod: 'Boiled in cow urine for 3 hours, washed, dried — repeated 7 times',
    maranaMethod: 'Khalva rayaana (collyrium pot) with triphala kwath',
    qualityTests: ['varitara', 'rekhapurna', 'churniyojana'],
    indications: ['pandu', 'kamala', 'kusta', 'prameha', 'panduroga'],
    dose: '125mg - 250mg with adjuvant',
    anupana: 'honey, warm water',
    contraindications: ['pregnancy', 'children', 'pitta prakriti'],
    toxicityNotes: [
      'Copper is toxic if not properly processed',
      'Shodhana removes toxic properties',
      'Must pass quality tests before use',
      'Color should be red to dark red'
    ],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 5',
  },
  {
    name: 'लोह भस्म',
    transliteration: 'loha bhasma',
    englishName: 'Iron Bhasma',
    metal: 'iron',
    shodhanaMethod: 'Boiled in cow urine for 3 hours, washed, dried — repeated 7 times',
    maranaMethod: 'Puttapaka with triphala kwath and guggulu',
    qualityTests: ['varitara', 'rekhapurna', 'churniyojana'],
    indications: ['pandu', 'kamala', 'kusta', 'prameha', 'rasayana', 'balya'],
    dose: '125mg - 250mg with adjuvant',
    anupana: 'honey, warm water, ghee',
    contraindications: ['pregnancy', 'children', 'ama'],
    toxicityNotes: [
      'Iron is toxic if not properly processed',
      'Shodhana removes toxic properties',
      'Must pass quality tests before use',
      'Color should be dark grey to black'
    ],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 6',
  },
  {
    name: 'स्वर्ण भस्म',
    transliteration: 'swarna bhasma',
    englishName: 'Gold Bhasma',
    metal: 'gold',
    shodhanaMethod: 'Boiled in cow urine for 3 hours, washed, dried — repeated 7 times',
    maranaMethod: 'Puttapaka with guggulu and honey',
    qualityTests: ['varitara', 'rekhapurna', 'churniyojana'],
    indications: ['rasayana', 'medhya', 'balya', 'vyadhikshamatva', 'jwara', 'kasa'],
    dose: '62.5mg - 125mg with adjuvant',
    anupana: 'honey, warm water, milk',
    contraindications: ['pregnancy', 'children'],
    toxicityNotes: [
      'Gold is safe if properly processed',
      'Proper processing essential',
      'Must pass quality tests',
      'Color should be reddish brown'
    ],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 7',
  },
];

export const RASA_AUSHADHIS: RasaAushadhi[] = [
  {
    name: 'महामृत्युञ्जय रस',
    transliteration: 'mahamrityunjaya rasa',
    ingredients: ['parada (mercury)', 'gandhaka (sulphur)', 'vatsanabha (aconite)', 'tankana (borax)', 'maricha (black pepper)'],
    preparationMethod: 'Rasa shastra preparation with proper shodhana and marana of each ingredient',
    indications: ['jwara', 'unmada', 'apasmara', 'graha roga', 'vyadhikshamatva'],
    dose: '125mg - 250mg with adjuvant',
    anupana: 'honey, warm water',
    precautions: ['expert supervision required', 'not for children/pregnant', 'quality control essential'],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 15',
  },
  {
    name: 'स्वर्ण विभ्राक रस',
    transliteration: 'swarna vabhraaka rasa',
    ingredients: ['swarna bhasma (gold)', 'rajat bhasma (silver)', 'tamra bhasma (copper)', 'loha bhasma (iron)', 'gandhaka bhasma'],
    preparationMethod: 'Multiple bhasmas combined with honey and ghee',
    indications: ['rasayana', 'medhya', 'balya', 'vyadhikshamatva', 'pandu', 'prameha'],
    dose: '125mg - 250mg with adjuvant',
    anupana: 'honey, warm water, milk',
    precautions: ['expert supervision required', 'not for children/pregnant', 'quality control essential'],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 20',
  },
  {
    name: 'कामदुघा रस',
    transliteration: 'kamadugha rasa',
    ingredients: ['parada (mercury)', 'gandhaka (sulphur)', 'mukta bhasma (pearl)', 'pravala bhasma (coral)', 'shankha bhasma (conch)'],
    preparationMethod: 'Multiple bhasmas combined with honey',
    indications: ['pitta vikara', 'raktapitta', 'daha', 'trishna', 'jwara', 'udara'],
    dose: '125mg - 250mg with adjuvant',
    anupana: 'honey, cold water',
    precautions: ['expert supervision required', 'not for children/pregnant', 'quality control essential'],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 25',
  },
  {
    name: 'भूषणा वटी',
    transliteration: 'bhushana vati',
    ingredients: ['parada (mercury)', 'gandhaka (sulphur)', 'vatsanabha (aconite)', 'tankana (borax)'],
    preparationMethod: 'Rasa shastra preparation with proper shodhana',
    indications: ['kusta', 'prameha', 'pandu', 'kamala', 'shwasa', 'kasa'],
    dose: '125mg - 250mg with adjuvant',
    anupana: 'honey, warm water',
    precautions: ['expert supervision required', 'not for children/pregnant', 'quality control essential'],
    source: 'rasa tarangini',
    sourceVerse: 'taranga 30',
  },
];

export const SHODHANA_PROCEDURES: ShodhanaProcedure[] = [
  {
    name: 'गोमूत्र शोधन',
    transliteration: 'gomutra shodhana',
    substance: 'metals and minerals',
    medium: 'cow urine (gomutra)',
    procedure: 'Substance boiled in cow urine for 3 hours, washed, dried. Repeated 7 times.',
    duration: '3 hours × 7 cycles = 21 hours total',
    endpoint: 'Substance becomes soft, loses metallic lustre',
    purpose: 'Removes toxic properties, makes substance safe for internal use',
    source: 'rasa tarangini',
    sourceVerse: 'taranga 1',
  },
  {
    name: 'गन्धक शोधन',
    transliteration: 'gandhaka shodhana',
    substance: 'mercury (parada)',
    medium: 'sulphur (gandhaka)',
    procedure: 'Mercury ground with sulphur, heated in sand bath, cooled. Repeated 7 times.',
    duration: '1 hour × 7 cycles = 7 hours total',
    endpoint: 'Mercury becomes black, unctuous, and tasteless',
    purpose: 'Purifies mercury, removes toxic properties',
    source: 'rasa tarangini',
    sourceVerse: 'taranga 2',
  },
  {
    name: 'गोघृत शोधन',
    transliteration: 'goghrita shodhana',
    substance: 'guggulu and other resins',
    medium: 'cow ghee (goghrita)',
    procedure: 'Substance boiled in cow ghee for 3 hours, washed, dried.',
    duration: '3 hours',
    endpoint: 'Substance becomes soft and loses resinous smell',
    purpose: 'Removes impurities, makes substance safe',
    source: 'rasa tarangini',
    sourceVerse: 'taranga 3',
  },
];

/**
 * Search functions for Rasa Shastra knowledge
 */
export function searchRasaDravyas(query: string): RasaDravya[] {
  const q = query.toLowerCase();
  return RASA_DRAVYAS.filter(d => {
    const searchText = `${d.name} ${d.transliteration} ${d.englishName} ${d.category} ${d.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchBhasmas(query: string): Bhasma[] {
  const q = query.toLowerCase();
  return BHASMA_PREPARATIONS.filter(b => {
    const searchText = `${b.name} ${b.transliteration} ${b.englishName} ${b.metal} ${b.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchRasaAushadhis(query: string): RasaAushadhi[] {
  const q = query.toLowerCase();
  return RASA_AUSHADHIS.filter(a => {
    const searchText = `${a.name} ${a.transliteration} ${a.ingredients.join(' ')} ${a.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchShodhana(query: string): ShodhanaProcedure[] {
  const q = query.toLowerCase();
  return SHODHANA_PROCEDURES.filter(s => {
    const searchText = `${s.name} ${s.transliteration} ${s.substance} ${s.medium} ${s.purpose}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchRasaShastraKnowledge(query: string): {
  dravyas: RasaDravya[];
  bhasmas: Bhasma[];
  aushadhis: RasaAushadhi[];
  shodhanas: ShodhanaProcedure[];
} {
  return {
    dravyas: searchRasaDravyas(query),
    bhasmas: searchBhasmas(query),
    aushadhis: searchRasaAushadhis(query),
    shodhanas: searchShodhana(query),
  };
}
