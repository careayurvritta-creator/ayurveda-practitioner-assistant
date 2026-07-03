/**
 * Rasayana & Vajikarana Knowledge Module
 *
 * Rasayana (रसायन) — Rejuvenation therapy for longevity, immunity, and vitality
 * Vajikarana (वाजीकरण) — Virilization therapy for reproductive health and vitality
 *
 * Sources:
 * - Charaka Samhita, Chikitsa Sthana, Chapters 1-2 (Rasayana), Chapter 2 (Vajikarana)
 * - Ashtanga Hridaya, Uttar Tantra, Chapters 38-39
 * - Vajikarana Adhyaya by Vagbhata
 * - Kayakalpa Prakarana by various authors
 *
 * Key Concepts:
 * - Kutipraveshika Rasayana (indoor rejuvenation in specially constructed hut)
 * - Vatatapika Rasayana (outdoor rejuvenation, manageable in daily life)
 * - Ahara Rasayana (dietary rejuvenation)
 * - Vihara Rasayana (behavioral rejuvenation)
 * - Aushadha Rasayana (medicinal rejuvenation)
 */

export interface RasayanaHerb {
  name: string;
  transliteration: string;
  englishName: string;
  type: string;
  rasa: string;
  guna: string;
  veerya: string;
  vipaka: string;
  doshaEffect: string;
  indications: string[];
  formulations: string[];
  dose: string;
  anupana: string;
  precautions: string[];
  mechanism: string;
  source: string;
  sourceVerse: string;
}

export interface VajikaranaHerb {
  name: string;
  transliteration: string;
  englishName: string;
  rasa: string;
  guna: string;
  veerya: string;
  vipaka: string;
  doshaEffect: string;
  indications: string[];
  formulations: string[];
  dose: string;
  anupana: string;
  precautions: string[];
  mechanism: string;
  source: string;
  sourceVerse: string;
}

export interface RasayanaProtocol {
  name: string;
  transliteration: string;
  type: string;
  herbs: string[];
  procedure: string;
  duration: string;
  indications: string[];
  contraindications: string[];
  benefits: string[];
  source: string;
  sourceVerse: string;
}

export const RASAYANA_HERBS: RasayanaHerb[] = [
  {
    name: 'अश्वगन्धा',
    transliteration: 'ashwagandha',
    englishName: 'Withania somnifera',
    type: 'vatatapika rasayana',
    rasa: 'tikta, kashaya, madhura',
    guna: 'guru, snigdha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Vata-Kapha shamana',
    indications: ['vata vyadhi', 'kamala', 'pandu', 'prameha', 'shukra kshaya', 'balya', 'rasayana', 'medhya'],
    formulations: ['ashwagandha churna', 'ashwagandha leha', 'ashwagandharishta', 'chyawanprash'],
    dose: '3-6g churna, 10-20ml kwath',
    anupana: 'milk, ghee, warm water',
    precautions: ['pregnancy', 'autoimmune conditions', 'thyroid disorders (monitor)'],
    mechanism: 'Adaptogenic — normalizes cortisol, improves stress response, enhances protein synthesis, promotes tissue repair',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.1.8',
  },
  {
    name: 'शिलाजित',
    transliteration: 'shilajit',
    englishName: 'Asphaltum (mineral pitch)',
    type: 'vatatapika rasayana',
    rasa: 'tikta, kashaya, sour',
    guna: 'laghu, snigdha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana',
    indications: ['prameha', 'pandu', 'kamala', 'vata vyadhi', 'shukra kshaya', 'balya', 'rasayana', 'medhya'],
    formulations: ['shilajit churna', 'shilajit vati', 'shilajit satva'],
    dose: '500mg - 2g churna',
    anupana: 'milk, warm water',
    precautions: ['gout (purine content)', 'kidney stones', 'pregnancy'],
    mechanism: 'Contains fulvic acid and 80+ minerals — enhances mitochondrial function, improves ATP production, anti-inflammatory',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.1.10',
  },
  {
    name: 'ब्राह्मी',
    transliteration: 'brahmi',
    englishName: 'Bacopa monnieri',
    type: 'medhya rasayana',
    rasa: 'tikta, kashaya, madhura',
    guna: 'laghu, snigdha',
    veerya: 'sheeta',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana (especially Pitta-Vata)',
    indications: ['medhya kshaya', 'smriti kshaya', 'unmada', 'apasmara', 'vata vyadhi', 'rasayana'],
    formulations: ['brahmi churna', 'brahmi ghrita', 'brahmi vati', 'medhya rasayana'],
    dose: '2-4g churna, 10-20ml kwath',
    anupana: 'milk, ghee',
    precautions: ['bradycardia (caution)', 'thyroid disorders (monitor)', 'pregnancy'],
    mechanism: 'Neuroprotective — enhances acetylcholine synthesis, improves dendritic branching, promotes neurogenesis',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.1.11',
  },
  {
    name: 'अमलकी',
    transliteration: 'amalaki',
    englishName: 'Emblica officinalis',
    type: 'rasayana',
    rasa: 'tikta, kashaya, sour',
    guna: 'laghu, ruksha',
    veerya: 'sheeta',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana (especially Pitta)',
    indications: ['pandu', 'prameha', 'raktapitta', 'daha', 'trishna', 'rasayana', 'kamala'],
    formulations: ['amalaki churna', 'triphala', 'amalaki rasayana', 'dhatri avaleha', 'chyawanprash'],
    dose: '3-6g churna, 10-20ml kwath',
    anupana: 'milk, warm water',
    precautions: ['constipation (excess)', 'diabetes (monitor blood sugar)'],
    mechanism: 'Richest natural source of vitamin C — powerful antioxidant, enhances immunity, promotes collagen synthesis',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.1.9',
  },
  {
    name: 'गिलोय',
    transliteration: 'giloy',
    englishName: 'Tinospora cordifolia',
    type: 'rasayana',
    rasa: 'tikta, kashaya',
    guna: 'laghu, snigdha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana',
    indications: ['jwara', 'prameha', 'kamala', 'pandu', 'rasayana', 'vyadhikshamatva'],
    formulations: ['giloy satva', 'guduchyadi kashaya', 'amritarishta', 'giloy ghanvati'],
    dosage: '500mg - 2g churna, 10-20ml kashaya',
    anupana: 'warm water, honey',
    precautions: ['autoimmune conditions', 'pregnancy (caution)'],
    mechanism: 'Immunomodulatory — enhances macrophage activity, increases CD4 count, promotes antibody production',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.1.8',
  },
  {
    name: 'शतावरी',
    transliteration: 'shatavari',
    englishName: 'Asparagus racemosus',
    type: 'rasayana',
    rasa: 'tikta, madhura',
    guna: 'guru, snigdha',
    veerya: 'sheeta',
    vipaka: 'madhura',
    doshaEffect: 'Pitta-Vata shamana',
    indications: ['artava kshaya', 'stanya janana', 'shukra kshaya', 'amavata', 'raktapitta', 'daha', 'rasayana'],
    formulations: ['shatavari churna', 'shatavari ghrita', 'shatavari kalpa'],
    dose: '3-6g churna, 10-20ml kwath',
    anupana: 'milk, warm water',
    precautions: ['excess kapha', 'kidney stones (oxalate)', 'estrogen-sensitive conditions'],
    mechanism: 'Demulcent and adaptogenic — coats mucous membranes, promotes tissue repair, balances hormones',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.1.10',
  },
];

export const VAJIKARANA_HERBS: VajikaranaHerb[] = [
  {
    name: 'कौन्च बीज',
    transliteration: 'kaunch beej',
    englishName: 'Mucuna pruriens',
    rasa: 'tikta, madhura',
    guna: 'laghu, snigdha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Vata-Kapha shamana',
    indications: ['shukra kshaya', 'klaibya', 'dhatu kshaya', 'vata vyadhi', 'prameha'],
    formulations: ['kaunch beej churna', 'kaunch beej vati', 'vrihani vati'],
    dose: '3-6g churna',
    anupana: 'milk, warm water',
    precautions: ['parkinson medication interaction', 'hypertension (caution)'],
    mechanism: 'L-DOPA precursor — enhances dopamine, improves sperm quality and motility, tonic for reproductive system',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 2.1.5',
  },
  {
    name: 'शिलाजित',
    transliteration: 'shilajit',
    englishName: 'Asphaltum (mineral pitch)',
    rasa: 'tikta, kashaya, sour',
    guna: 'laghu, snigdha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana',
    indications: ['shukra kshaya', 'klaibya', 'prameha', 'pandu', 'vata vyadhi'],
    formulations: ['shilajit churna', 'shilajit vati', 'shilajit satva'],
    dose: '500mg - 2g churna',
    anupana: 'milk, warm water',
    precautions: ['gout (purine content)', 'kidney stones', 'pregnancy'],
    mechanism: 'Contains fulvic acid — enhances mitochondrial function, improves ATP production, promotes spermatogenesis',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 2.1.7',
  },
  {
    name: 'अश्वगन्धा',
    transliteration: 'ashwagandha',
    englishName: 'Withania somnifera',
    rasa: 'tikta, kashaya, madhura',
    guna: 'guru, snigdha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Vata-Kapha shamana',
    indications: ['shukra kshaya', 'klaibya', 'vata vyadhi', 'balya', 'rasayana'],
    formulations: ['ashwagandha churna', 'ashwagandha leha', 'ashwagandharishta'],
    dose: '3-6g churna',
    anupana: 'milk, ghee',
    precautions: ['pregnancy', 'autoimmune conditions'],
    mechanism: 'Adaptogenic — normalizes cortisol, improves testosterone levels, enhances sperm quality',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 2.1.5',
  },
  {
    name: 'गोक्षुर',
    transliteration: 'gokshura',
    englishName: 'Tribulus terrestris',
    rasa: 'madhura',
    guna: 'laghu, snigdha',
    veerya: 'sheeta',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana',
    indications: ['mutra krichra', 'shukra kshaya', 'klaibya', 'prameha', 'vata vyadhi'],
    formulations: ['gokshura churna', 'gokshuradi kwaath', 'gokshuradi guggulu'],
    dose: '3-6g churna, 10-20ml kwath',
    anupana: 'milk, warm water',
    precautions: ['prostate conditions (consult physician)', 'hormone-sensitive conditions'],
    mechanism: 'Diuretic and tonic — improves urinary function, enhances sperm production, supports prostate health',
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 2.1.6',
  },
];

export const RASAYANA_PROTOCOLS: RasayanaProtocol[] = [
  {
    name: 'कुटीप्रवेशिक रसायन',
    transliteration: 'kutipraveshika rasayana',
    type: 'intensive indoor rejuvenation',
    herbs: ['amalaki', 'ghrita', 'medicated milk preparations'],
    procedure: 'Patient enters specially constructed hut (kuti) with thatched roof. Receives daily snehapana, virechana, and rasayana herbs. Follows strict regimen of diet and behavior.',
    duration: '1 month to 1 year',
    indications: ['severe dhatu kshaya', 'geriatric rejuvenation', 'post-illness recovery', 'chronic debility'],
    contraindications: ['active infections', 'pregnancy', 'children', 'acute diseases'],
    benefits: ['deep tissue rejuvenation', 'enhanced immunity', 'improved longevity', 'mental clarity'],
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.1.8',
  },
  {
    name: 'वातातपिक रसायन',
    transliteration: 'vatatapika rasayana',
    type: 'outdoor rejuvenation',
    herbs: ['ashwagandha', 'shatavari', 'amalaki', 'giloy', 'brahmi'],
    procedure: 'Patient continues normal daily activities while taking rasayana herbs. No special enclosure needed.',
    duration: '1 to 3 months',
    indications: ['mild dhatu kshaya', 'preventive rejuvenation', 'daily health maintenance'],
    contraindications: ['active infections', 'pregnancy'],
    benefits: ['general vitality', 'improved energy', 'better immunity', 'stress management'],
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.1.8',
  },
  {
    name: 'च्यवनप्राश रसायन',
    transliteration: 'chyawanprash rasayana',
    type: 'classical rasayana formulation',
    herbs: ['amalaki', 'pippali', 'ginger', 'cardamom', 'cinnamon', 'ghee', 'honey'],
    procedure: 'Complex preparation involving multiple stages of herb processing with ghee and honey base.',
    duration: '1 to 3 months',
    indications: ['general rejuvenation', 'respiratory health', 'immunity', 'anti-aging'],
    contraindications: ['diabetes (sugar content)', 'obesity'],
    benefits: ['enhanced immunity', 'respiratory health', 'skin vitality', 'improved digestion'],
    source: 'charaka samhita',
    sourceVerse: 'chikitsa sthana 1.1.8',
  },
];

/**
 * Search functions for Rasayana & Vajikarana knowledge
 */
export function searchRasayanaHerbs(query: string): RasayanaHerb[] {
  const q = query.toLowerCase();
  return RASAYANA_HERBS.filter(h => {
    const searchText = `${h.name} ${h.transliteration} ${h.englishName} ${h.type} ${h.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchVajikaranaHerbs(query: string): VajikaranaHerb[] {
  const q = query.toLowerCase();
  return VAJIKARANA_HERBS.filter(h => {
    const searchText = `${h.name} ${h.transliteration} ${h.englishName} ${h.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchRasayanaProtocols(query: string): RasayanaProtocol[] {
  const q = query.toLowerCase();
  return RASAYANA_PROTOCOLS.filter(p => {
    const searchText = `${p.name} ${p.transliteration} ${p.type} ${p.herbs.join(' ')} ${p.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchRasayanaVajikaranaKnowledge(query: string): {
  rasayanaHerbs: RasayanaHerb[];
  vajikaranaHerbs: VajikaranaHerb[];
  protocols: RasayanaProtocol[];
} {
  return {
    rasayanaHerbs: searchRasayanaHerbs(query),
    vajikaranaHerbs: searchVajikaranaHerbs(query),
    protocols: searchRasayanaProtocols(query),
  };
}
