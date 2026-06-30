/**
 * Bhavaprakasha Nigantu Knowledge Module
 *
 * Bhavaprakasha Nigantu (ब्हवप्रकाश निगन्टु) by Bhavamishra (16th century CE)
 * is one of the three major Nigantus (lexicons) in Ayurveda. It is organized
 * into 6 vargas (groups) covering herbs, minerals, formulations, and diseases.
 *
 * Sources:
 * - Bhavaprakasha Nigantu, Chaukhambha Bharati Academy, Varanasi
 * - Translations and commentaries by Prof. K.R. Srikantha Murthy
 * - Bhava Prakasa Nighantu, Chaukhambha Krishnadas Academy
 *
 * Key Features:
 * - 6 vargas: Guduchyadi, Haritakyadi, Mustakadi, Triphala, Eladi, Chaturbhadra
 * - 700+ formulations with dosage forms
 * - Bheshaja Kalpana (pharmaceutical preparations)
 * - Disease-specific formulations
 */

export interface BhavaHerb {
  name: string;
  transliteration: string;
  englishName: string;
  sanskritTerms: string;
  varga: string;
  rasa: string;
  guna: string;
  veerya: string;
  vipaka: string;
  doshaEffect: string;
  indications: string[];
  formulations: string[];
  dosage: string;
  precautions: string[];
  source: string;
  sourceVerse: string;
}

export interface BhavaFormulation {
  name: string;
  transliteration: string;
  ingredients: string[];
  preparationMethod: string;
  dosageForm: string;
  indications: string[];
  dose: string;
  anupana: string;
  precautions: string[];
  source: string;
  sourceVerse: string;
}

export interface BhavaDisease {
  name: string;
  transliteration: string;
  sanskritTerms: string;
  pathology: string;
  symptoms: string[];
  formulations: string[];
  dietaryAdvice: string[];
  lifestyleAdvice: string[];
  prognosis: string;
  source: string;
  sourceVerse: string;
}

export interface BhavaPreparation {
  name: string;
  transliteration: string;
  type: string;
  ingredients: string[];
  procedure: string;
  indications: string[];
  dose: string;
  precautions: string[];
  source: string;
  sourceVerse: string;
}

export const BHAVAPRAKASHA_HERBS: BhavaHerb[] = [
  // Guduchyadi Varga (गुडूच्यादि वर्ग) - Immunomodulatory herbs
  {
    name: 'गिलोय',
    transliteration: 'giloya',
    englishName: 'Tinospora cordifolia',
    sanskritTerms: 'amrita, madhuparni',
    varga: 'guduchyadi',
    rasa: 'tikta, kashaya',
    guna: 'laghu, snigdha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Kapha-Vata shamana, tridosha shamana',
    indications: ['jwara', 'prameha', 'kamala', 'pandu', 'rasayana', 'vyadhikshamatva', 'daha', 'trishna'],
    formulations: ['giloy satva', 'guduchyadi kashaya', 'amritarishta', 'giloy ghanvati'],
    dosage: '500mg - 2g churna, 10-20ml kashaya',
    precautions: ['autoimmune conditions', 'pregnancy (caution)', 'immunosuppressant interaction'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'guduchyadi varga 1',
  },
  {
    name: 'त्रिफला',
    transliteration: 'triphala',
    englishName: 'Three fruits (Amalaki + Bibhitaki + Haritaki)',
    sanskritTerms: 'triphala',
    varga: 'triphala',
    rasa: 'pancha rasa (all five tastes)',
    guna: 'laghu, ruksha',
    veerya: 'neutral',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana (especially Kapha-Vata)',
    indications: ['vibandha', 'arsha', 'prameha', 'tvak roga', 'netra roga', 'rasayana', 'medhya', 'krimi'],
    formulations: ['triphala churna', 'triphala guggulu', 'triphala ghrita', 'triphala kwath'],
    dosage: '3-6g churna, 12-24g kwath',
    precautions: ['diarrhea', 'pregnancy (caution)', 'dehydration'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'triphala varga',
  },
  {
    name: 'हरीतकी',
    transliteration: 'haritaki',
    englishName: 'Terminalia chebula',
    sanskritTerms: 'abhaya, pathya, putsna',
    varga: 'haritakyadi',
    rasa: 'pancha rasa',
    guna: 'laghu, ruksha',
    veerya: 'ushna',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana (especially Vata)',
    indications: ['vibandha', 'shwasa', 'kasa', 'arsha', 'grahani', 'kamala', 'pandu', 'prameha'],
    formulations: ['haritaki churna', 'triphala', 'abhayarishta', 'haritaki guggulu'],
    dosage: '2-6g churna, 10-20ml kwath',
    precautions: ['pregnancy', 'dehydration', 'diarrhea'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'haritakyadi varga 1',
  },
  {
    name: 'विभीतकी',
    transliteration: 'bibhitaki',
    englishName: 'Terminalia bellirica',
    sanskritTerms: 'vibhitaka, aksha',
    varga: 'triphala',
    rasa: 'kashaya',
    guna: 'laghu, ruksha',
    veerya: 'neutral',
    vipaka: 'madhura',
    doshaEffect: 'Kapha-Vata shamana',
    indications: ['kasa', 'shwasa', 'netra roga', 'tvak roga', 'keshya', 'danta roga'],
    formulations: ['triphala', 'vibhitaki churna', 'akshadi ghrita'],
    dosage: '2-6g churna',
    precautions: ['pregnancy (caution)', 'dryness'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'triphala varga',
  },
  {
    name: 'आमलकी',
    transliteration: 'amalaki',
    englishName: 'Emblica officinalis',
    sanskritTerms: 'amalaki, dhatri, vayasthapana',
    varga: 'triphala',
    rasa: 'tikta, kashaya, sour',
    guna: 'laghu, ruksha',
    veerya: 'sheeta',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana (especially Pitta)',
    indications: ['pandu', 'prameha', 'raktapitta', 'daha', 'trishna', 'rasayana', 'kamala', 'vishama jwara'],
    formulations: ['amalaki churna', 'triphala', 'amalaki rasayana', 'dhatri avaleha'],
    dosage: '3-6g churna, 10-20ml kwath',
    precautions: ['constipation (excess)', 'diabetes (monitor blood sugar)'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'triphala varga',
  },
  // Eladi Varga (एलादि वर्ग) - Aromatic and carminative herbs
  {
    name: 'एलाची',
    transliteration: 'elachi',
    englishName: 'Cardamom',
    sanskritTerms: 'ela, upakunchika',
    varga: 'eladi',
    rasa: 'katu, madhura',
    guna: 'laghu, snigdha',
    veerya: 'sheeta',
    vipaka: 'madhura',
    doshaEffect: 'Kapha-Vata shamana, Pitta shamaka',
    indications: ['hikka', 'shwasa', 'kasa', 'mukhashosh', 'tikta rasajnana', 'aruchi'],
    formulations: ['eladi churna', 'eladi kwaath', 'eladi vati'],
    dosage: '1-3g churna',
    precautions: ['kidney stones (oxalate)', 'pregnancy (normal amounts)'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'eladi varga',
  },
  {
    name: 'दारचिनी',
    transliteration: 'darchini',
    englishName: 'Cinnamon',
    sanskritTerms: 'tvak, dalchini',
    varga: 'eladi',
    rasa: 'katu, tikta',
    guna: 'laghu, snigdha',
    veerya: 'ushna',
    vipaka: 'katu',
    doshaEffect: 'Kapha-Vata shamana, Pitta vishamakara',
    indications: ['prameha', 'medoroga', 'shwasa', 'kasa', 'agnimandya', 'adhmaana'],
    formulations: ['twak churna', 'trikatu', 'dashamula'],
    dosage: '1-3g churna',
    precautions: ['liver disease (excess)', 'pregnancy (large doses)'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'eladi varga',
  },
  // Chaturbhadra Varga (चतुर्भद्र वर्ग) - Four auspicious herbs
  {
    name: 'शतावरी',
    transliteration: 'shatavari',
    englishName: 'Asparagus racemosus',
    sanskritTerms: 'shatavari, varahi',
    varga: 'chaturbhadra',
    rasa: 'tikta, madhura',
    guna: 'guru, snigdha',
    veerya: 'sheeta',
    vipaka: 'madhura',
    doshaEffect: 'Pitta-Vata shamana',
    indications: ['artava kshaya', 'stanya janana', 'shukra kshaya', 'amavata', 'raktapitta', 'daha', 'trishna', 'rasayana'],
    formulations: ['shatavari churna', 'shatavari ghrita', 'shatavari kalpa', 'shatavaryadi ghrita'],
    dosage: '3-6g churna, 10-20ml kwath',
    precautions: ['excess kapha', 'kidney stones (oxalate)', 'estrogen-sensitive conditions'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'chaturbhadra varga',
  },
  {
    name: 'बला',
    transliteration: 'bala',
    englishName: 'Sida cordifolia',
    sanskritTerms: 'bala, svayamgupta',
    varga: 'chaturbhadra',
    rasa: 'madhura, tikta',
    guna: 'guru, snigdha',
    veerya: 'sheeta',
    vipaka: 'madhura',
    doshaEffect: 'Vata shamana',
    indications: ['vata vyadhi', 'kamala', 'pandu', 'prameha', 'shukra kshaya', 'balya', 'rasayana'],
    formulations: ['bala churna', 'bala kwaath', 'balashwagandhadi taila'],
    dosage: '3-6g churna, 10-20ml kwath',
    precautions: ['constipation', 'ama (undigested food)'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'chaturbhadra varga',
  },
  // Mustakadi Varga (मुस्तकादि वर्ग) - Digestive and carminative herbs
  {
    name: 'मुस्ता',
    transliteration: 'musta',
    englishName: 'Cyperus rotundus',
    sanskritTerms: 'musta, nagarmotha',
    varga: 'mustakadi',
    rasa: 'kashaya, tikta',
    guna: 'laghu, ruksha',
    veerya: 'sheeta',
    vipaka: 'katu',
    doshaEffect: 'Kapha-Pitta shamana',
    indications: ['jwara', 'atisara', 'grahani', 'pitta vikara', 'trishna', 'daha', 'prameha'],
    formulations: ['musta churna', 'mustadi kwaath', 'mustadi kvath'],
    dosage: '2-4g churna, 10-20ml kwath',
    precautions: ['vata aggravation', 'constipation'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'mustakadi varga',
  },
  {
    name: 'धन्या',
    transliteration: 'dhaniya',
    englishName: 'Coriandrum sativum',
    sanskritTerms: 'dhanyaka, kustumburu',
    varga: 'mustakadi',
    rasa: 'madhura, tikta',
    guna: 'laghu, snigdha',
    veerya: 'sheeta',
    vipaka: 'madhura',
    doshaEffect: 'Tridosha shamana',
    indications: ['agnimandya', 'adhmaana', 'shwasa', 'kasa', 'raktapitta', 'daha', 'trishna'],
    formulations: ['dhaniya churna', 'dhanyaka kwaath', 'triphala'],
    dosage: '2-6g churna, 10-20ml kwath',
    precautions: ['kidney stones (oxalate)', 'allergy (rare)'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'mustakadi varga',
  },
];

export const BHAVAPRAKASHA_FORMULATIONS: BhavaFormulation[] = [
  {
    name: 'त्रिफला चूर्ण',
    transliteration: 'triphala churna',
    ingredients: ['amalaki (Emblica officinalis)', 'bibhitaki (Terminalia bellirica)', 'haritaki (Terminalia chebula)'],
    preparationMethod: 'Equal parts of three fruits, dried and powdered',
    dosageForm: 'churna (powder)',
    indications: ['vibandha', 'arsha', 'prameha', 'tvak roga', 'netra roga', 'rasayana'],
    dose: '3-6g twice daily',
    anupana: 'warm water, honey, or ghee',
    precautions: ['diarrhea', 'pregnancy (caution)'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'triphala varga',
  },
  {
    name: 'गिलोय सत्व',
    transliteration: 'giloy satva',
    ingredients: ['giloya (Tinospora cordifolia) stem extract'],
    preparationMethod: 'Aqueous extraction, evaporation to paste consistency',
    dosageForm: 'satva (aqueous extract)',
    indications: ['jwara', 'prameha', 'kamala', 'pandu', 'vyadhikshamatva'],
    dose: '500mg - 2g twice daily',
    anupana: 'warm water, honey',
    precautions: ['autoimmune conditions', 'pregnancy (caution)'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'guduchyadi varga',
  },
  {
    name: 'त्रिफला गुग्गुलु',
    transliteration: 'triphala guggulu',
    ingredients: ['triphala churna', 'guggulu (Commiphora mukul)'],
    preparationMethod: 'Tribhuvankirti ras preparation with guggulu base',
    dosageForm: 'vati (tablet)',
    indications: ['amavata', 'sandhigata vata', 'obesity', 'constipation'],
    dose: '2 tablets twice daily',
    anupana: 'warm water',
    precautions: ['gastric irritation', 'pregnancy'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'triphala varga',
  },
  {
    name: 'अभयारिष्ट',
    transliteration: 'abhayarishta',
    ingredients: ['haritaki (Terminalia chebula)', 'jaggery', 'yeast'],
    preparationMethod: 'Fermentation (40 days) of haritaki decoction with jaggery',
    dosageForm: 'arishta (fermented decoction)',
    indications: ['vibandha', 'arsha', 'grahani', 'kamala', 'prameha'],
    dose: '15-20ml twice daily after meals',
    anupana: 'warm water',
    precautions: ['pregnancy', 'liver disease', 'diabetes (sugar content)'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'haritakyadi varga',
  },
  {
    name: 'एलादि चूर्ण',
    transliteration: 'eladi churna',
    ingredients: ['elachi (cardamom)', 'lavanga (clove)', 'twak (cinnamon)', 'marich (black pepper)', 'pippali (long pepper)'],
    preparationMethod: 'All ingredients dried and powdered',
    dosageForm: 'churna (powder)',
    indications: ['hikka', 'shwasa', 'kasa', 'mukhashosh', 'aruchi'],
    dose: '1-3g twice daily',
    anupana: 'honey, warm water',
    precautions: ['pitta aggravation (excess)'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'eladi varga',
  },
  {
    name: 'शतावरी चूर्ण',
    transliteration: 'shatavari churna',
    ingredients: ['shatavari (Asparagus racemosus) root'],
    preparationMethod: 'Root dried and powdered',
    dosageForm: 'churna (powder)',
    indications: ['artava kshaya', 'stanya janana', 'shukra kshaya', 'rasayana'],
    dose: '3-6g twice daily',
    anupana: 'milk, warm water',
    precautions: ['excess kapha', 'kidney stones'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'chaturbhadra varga',
  },
];

export const BHAVAPRAKASHA_DISEASES: BhavaDisease[] = [
  {
    name: 'प्रमेह',
    transliteration: 'prameha',
    sanskritTerms: 'prameha, madhumeha, kshaudrameha',
    pathology: 'Metabolic disorder characterized by excessive urination and sweet taste of urine, classified into 20 types (10 kapha, 7 pitta, 3 vata)',
    symptoms: ['polyuria', 'polydipsia', 'sweet urine', 'obesity', 'fatigue', 'skin infections', 'delayed wound healing'],
    formulations: ['triphala', 'guduchyadi kwaath', 'shilajit', 'gokshura', 'varuna'],
    dietaryAdvice: ['barley', 'wheat', 'green gram', 'bitter gourd', 'avoid sugar', 'avoid rice'],
    lifestyleAdvice: ['regular exercise', 'walking', 'avoid sleeping during day', 'yoga', 'pranayama'],
    prognosis: 'Chronic but manageable with lifestyle modifications',
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'prameha chikitsa',
  },
  {
    name: 'ज्वर',
    transliteration: 'jwara',
    sanskritTerms: 'jwara, vataj jwara, pittaj jwara, kaphaj jwara, sannipataja jwara',
    pathology: 'Fever classified by dosha involvement — vataj (irregular), pittaj (burning), kaphaj (with kapha symptoms), sannipataja (all three doshas)',
    symptoms: ['fever', 'body ache', 'headache', 'thirst', 'fatigue', 'loss of appetite'],
    formulations: ['giloy satva', 'triphala', 'mustadi kwaath', 'sudarshan', 'amritarishta'],
    dietaryAdvice: ['light food', 'rice gruel', 'mudga yusha', 'fasting if needed'],
    lifestyleAdvice: ['rest', 'sleep', 'avoid cold exposure', 'warm environment'],
    prognosis: 'Generally good with proper treatment; sannipataja jwara is serious',
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'jwara chikitsa',
  },
  {
    name: 'पाण्डु',
    transliteration: 'pandu',
    sanskritTerms: 'pandu, pandu roga, kamala, halimaka',
    pathology: 'Anemia-like condition with pallor, caused by vitiated pitta and kapha affecting liver and blood',
    symptoms: ['pallor', 'fatigue', 'weakness', 'edema', 'indigestion', 'aversion to food', 'yellowish complexion'],
    formulations: ['triphala', 'kamala ghrita', 'drakshasava', 'amalaki rasayana', 'lohasava'],
    dietaryAdvice: ['iron-rich foods', 'pomegranate', 'dates', 'jaggery', 'green leafy vegetables'],
    lifestyleAdvice: ['moderate exercise', 'sun exposure', 'regular meals', 'avoid daytime sleeping'],
    prognosis: 'Good with proper treatment; chronic if untreated',
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'pandu chikitsa',
  },
  {
    name: 'श्वास',
    transliteration: 'shwasa',
    sanskritTerms: 'shwasa, tamaka shwasa, urdhwaga shwasa',
    pathology: 'Respiratory disorder with difficulty in breathing — tamaka (downward obstruction) is more common',
    symptoms: ['dyspnea', 'wheezing', 'cough', 'chest tightness', 'difficulty breathing at night'],
    formulations: ['dashamula', 'triphala', 'eladi churna', 'kantakari avaleha', 'vasakasava'],
    dietaryAdvice: ['avoid cold foods', 'avoid dairy', 'avoid sour foods', 'warm foods', 'honey'],
    lifestyleAdvice: ['avoid dust', 'avoid smoking', 'pranayama', 'yoga', 'warm environment'],
    prognosis: 'Chronic condition; manageable with consistent treatment',
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'shwasa chikitsa',
  },
  {
    name: 'मधुमेह',
    transliteration: 'madhumeha',
    sanskritTerms: 'madhumeha, prameha',
    pathology: 'Type 2 diabetes mellitus — sweet urine with excessive urination, caused by kapha accumulation in胰腺',
    symptoms: ['polyuria', 'polydipsia', 'sweet urine', 'weight loss', 'fatigue', 'neuropathy', 'skin infections'],
    formulations: ['shilajit', 'gokshura', 'guduchyadi kwaath', 'triphala', 'meshashringi'],
    dietaryAdvice: ['barley', 'wheat', 'bitter gourd', 'fenugreek', 'avoid sugar', 'avoid rice'],
    lifestyleAdvice: ['regular exercise', 'walking', 'yoga', 'weight management'],
    prognosis: 'Chronic but manageable; complications preventable with good control',
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'prameha chikitsa',
  },
  {
    name: 'विसर्प',
    transliteration: 'visarpa',
    sanskritTerms: 'visarpa, udarda',
    pathology: 'Herpes-like skin condition with spreading erythematous lesions, caused by vitiated pitta and rakta',
    symptoms: ['painful blisters', 'burning sensation', 'itching', 'fever', 'lymphadenopathy'],
    formulations: ['kaishore guggulu', 'triphala', 'manjistha', 'khadira', 'haridra'],
    dietaryAdvice: ['bitter foods', 'bitter gourd', 'neem', 'avoid sour', 'avoid fermented'],
    lifestyleAdvice: ['hygiene', 'avoid stress', 'rest', 'avoid sunlight on lesions'],
    prognosis: 'Acute episodes manageable; may recur',
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'visarpa chikitsa',
  },
];

export const BHAVAPRAKASHA_PREPARATIONS: BhavaPreparation[] = [
  {
    name: 'चूर्ण',
    transliteration: 'churna',
    type: 'powder preparation',
    ingredients: ['herbs dried at room temperature or shade-dried'],
    procedure: 'Herbs dried, coarsely powdered, then fine powdered through 80-mesh sieve. Stored in airtight containers.',
    indications: ['general use', 'easy administration', 'digestive disorders'],
    dose: '1-6g depending on herb',
    precautions: ['moisture protection', 'check expiry', 'proper storage'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'bheshaja kalpana',
  },
  {
    name: 'वटी',
    transliteration: 'vati',
    type: 'tablet preparation',
    ingredients: ['churna mixed with binding agents like honey or jaggery'],
    procedure: 'Churna mixed with suitable binding agent, rolled into pills, dried, and stored.',
    indications: ['convenient dosing', 'longer shelf life', 'portability'],
    dose: '1-2 tablets twice daily',
    precautions: ['check binding', 'avoid moisture'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'bheshaja kalpana',
  },
  {
    name: 'अवलेह',
    transliteration: 'avaleha',
    type: 'electuary preparation',
    ingredients: ['herbs in decoction + honey + sugar'],
    procedure: 'Decoction reduced to 1/4, sugar added, cooked to leha consistency, cooled, honey added.',
    indications: ['kasa', 'shwasa', 'respiratory conditions', 'children'],
    dose: '1-2 tsp twice daily',
    precautions: ['honey should not be heated', 'store in glass container'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'bheshaja kalpana',
  },
  {
    name: 'आसव',
    transliteration: 'asava',
    type: 'fermented preparation',
    ingredients: ['herbs in decoction + dhataki pushpa (flower) + jaggery'],
    procedure: 'Decoction cooled, mixed with dhataki pushpa and jaggery, fermented for 15-30 days.',
    indications: ['long shelf life', 'better absorption', 'general tonic'],
    dose: '15-20ml after meals',
    precautions: ['avoid in pregnancy', 'avoid in liver disease', 'avoid in alcoholism'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'bheshaja kalpana',
  },
  {
    name: 'अरिष्ट',
    transliteration: 'arishta',
    type: 'fermented decoction',
    ingredients: ['herbs in decoction + dhataki pushpa + jaggery'],
    procedure: 'Similar to asava but with longer fermentation (40-60 days) and additional herbs.',
    indications: ['chronic conditions', 'deeper action', 'longer shelf life'],
    dose: '15-20ml after meals',
    precautions: ['avoid in pregnancy', 'avoid in liver disease', 'avoid in alcoholism'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'bheshaja kalpana',
  },
  {
    name: 'घृत',
    transliteration: 'ghrita',
    type: 'medicated ghee',
    ingredients: ['ghee + herbs in decoction and paste form'],
    procedure: 'Ghee prepared with herbs through sneha paka method (128 hours for maha paka).',
    indications: ['pitta conditions', 'neurological conditions', 'eye diseases', 'rasayana'],
    dose: '1-2 tsp twice daily',
    precautions: ['obesity', 'high cholesterol', 'diabetes (moderate)'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'bheshaja kalpana',
  },
  {
    name: 'तैल',
    transliteration: 'taila',
    type: 'medicated oil',
    ingredients: ['oil + herbs in decoction and paste form'],
    procedure: 'Oil prepared with herbs through sneha paka method, filtered and stored.',
    indications: ['external use', 'massage', 'skin conditions', 'neurological conditions'],
    dose: 'For external use',
    precautions: ['check for rancidity', 'patch test for skin allergy'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'bheshaja kalpana',
  },
  {
    name: 'क्वाथ',
    transliteration: 'kwaath',
    type: 'decoction',
    ingredients: ['herbs boiled in water'],
    procedure: 'Herbs boiled in water until reduced to 1/4, filtered. Fresh preparation preferred.',
    indications: ['acute conditions', 'general use', 'easy administration'],
    dose: '10-20ml twice daily',
    precautions: ['fresh preparation preferred', 'reheat gently if stored'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'bheshaja kalpana',
  },
  {
    name: 'भस्म',
    transliteration: 'bhasma',
    type: 'incinerated preparation',
    ingredients: ['metals/minerals processed through shodhana and marana'],
    procedure: 'Shodhana (purification) through repeated heating and quenching in herbal juices, followed by marana (incineration) in sealed pots.',
    indications: ['mineral medicines', 'quick absorption', 'specific therapeutic actions'],
    dose: '125mg - 250mg with adjuvant',
    precautions: ['must be properly processed', 'expert supervision required', 'not for children/pregnant'],
    source: 'bhavaprakasha nigantu',
    sourceVerse: 'bheshaja kalpana',
  },
];

/**
 * Search functions for Bhavaprakasha Nigantu knowledge
 */
export function searchBhavaHerbs(query: string): BhavaHerb[] {
  const q = query.toLowerCase();
  return BHAVAPRAKASHA_HERBS.filter(herb => {
    const searchText = `${herb.name} ${herb.transliteration} ${herb.englishName} ${herb.varga} ${herb.rasa} ${herb.indications.join(' ')} ${herb.formulations.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchBhavaFormulations(query: string): BhavaFormulation[] {
  const q = query.toLowerCase();
  return BHAVAPRAKASHA_FORMULATIONS.filter(f => {
    const searchText = `${f.name} ${f.transliteration} ${f.ingredients.join(' ')} ${f.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchBhavaDiseases(query: string): BhavaDisease[] {
  const q = query.toLowerCase();
  return BHAVAPRAKASHA_DISEASES.filter(d => {
    const searchText = `${d.name} ${d.transliteration} ${d.pathology} ${d.symptoms.join(' ')} ${d.formulations.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchBhavaPreparations(query: string): BhavaPreparation[] {
  const q = query.toLowerCase();
  return BHAVAPRAKASHA_PREPARATIONS.filter(p => {
    const searchText = `${p.name} ${p.transliteration} ${p.type} ${p.indications.join(' ')}`.toLowerCase();
    return q.split(/\s+/).some(word => searchText.includes(word));
  });
}

export function searchBhavaKnowledge(query: string): {
  herbs: BhavaHerb[];
  formulations: BhavaFormulation[];
  diseases: BhavaDisease[];
  preparations: BhavaPreparation[];
} {
  return {
    herbs: searchBhavaHerbs(query),
    formulations: searchBhavaFormulations(query),
    diseases: searchBhavaDiseases(query),
    preparations: searchBhavaPreparations(query),
  };
}
