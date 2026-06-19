export interface Herb {
  id: string
  name: string
  botanicalName: string
  family: string
  sanskrit: string
  hindi: string
  rasa: string[]
  guna: string[]
  virya: string
  vipaka: string
  prabhava?: string
  doshaKarma: { vata: string; pitta: string; kapha: string }
  indications: string[]
  dosage: string
  contraindications: string[]
  sideEffects?: string[]
  interactions?: string[]
  partUsed: string[]
  preparation: string[]
}

export const HERBS: Herb[] = [
  {
    id: 'ashwagandha',
    name: 'Ashwagandha',
    botanicalName: 'Withania somnifera',
    family: 'Solanaceae',
    sanskrit: 'अश्वगन्धा',
    hindi: 'अश्वगंधा',
    rasa: ['Tikta', 'Kashaya'],
    guna: ['Laghu', 'Snigdha'],
    virya: 'Ushna',
    vipaka: 'Madhura',
    prabhava: 'Medhya (Cognitive enhancer)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Increases in excess', kapha: 'Increases in excess' },
    indications: ['Stress', 'Anxiety', 'Fatigue', 'Arthritis', 'Insomnia', 'Low immunity', 'Muscle weakness'],
    dosage: '3-6g powder, 1-2 tsp decoction',
    contraindications: ['Pregnancy', 'Autoimmune conditions', 'Thyroid disorders'],
    interactions: ['May potentiate sedatives', 'May affect thyroid medications', 'May interact with immunosuppressants'],
    partUsed: ['Root', 'Leaf'],
    preparation: ['Churna (powder)', 'Kwath (decoction)', 'Ghrita', 'Taila']
  },
  {
    id: 'turmeric',
    name: 'Turmeric',
    botanicalName: 'Curcuma longa',
    family: 'Zingiberaceae',
    sanskrit: 'हरिद्रा',
    hindi: 'हल्दी',
    rasa: ['Tikta', 'Kashaya'],
    guna: ['Laghu', 'Snigdha'],
    virya: 'Ushna',
    vipaka: 'Madhura',
    prabhava: 'Vishaghna (Antitoxic)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Increases in excess', kapha: 'Pacifies' },
    indications: ['Inflammation', 'Arthritis', 'Digestion', 'Skin diseases', 'Wound healing', 'Detoxification', 'Liver disorders'],
    dosage: '1-3g powder',
    contraindications: ['Gallbladder obstruction', 'Bleeding disorders'],
    interactions: ['May increase bleeding risk with anticoagulants', 'May interact with antacids'],
    partUsed: ['Rhizome'],
    preparation: ['Churna', 'Kwath', 'Ghrita', 'Taila', 'Fresh juice']
  },
  {
    id: 'ginger',
    name: 'Ginger',
    botanicalName: 'Zingiber officinale',
    family: 'Zingiberaceae',
    sanskrit: 'शुण्ठी',
    hindi: 'अदरक',
    rasa: ['Katu', 'Madhura'],
    guna: ['Laghu', 'Snigdha'],
    virya: 'Ushna',
    vipaka: 'Madhura',
    prabhava: 'Deepana (Digestive stimulant)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Increases slightly', kapha: 'Pacifies' },
    indications: ['Digestion', 'Nausea', 'Cold', 'Cough', 'Pain', 'Inflammation'],
    dosage: '1-3g fresh, 0.5-1g powder',
    contraindications: ['Ulcers', 'Gallstones', 'Bleeding disorders'],
    interactions: ['May increase bleeding risk with anticoagulants', 'May affect blood pressure'],
    partUsed: ['Rhizome'],
    preparation: ['Fresh juice', 'Churna', 'Kwath', 'Shunti']
  },
  {
    id: 'triphala',
    name: 'Triphala',
    botanicalName: 'Terminalia chebula + Terminalia belerica + Emblica officinalis',
    family: 'Combretaceae',
    sanskrit: 'त्रिफला',
    hindi: 'त्रिफला',
    rasa: ['All six (except Lavana)'],
    guna: ['Laghu', 'Ruksha'],
    virya: 'Madhyama',
    vipaka: 'Madhura',
    prabhava: 'Anulomana (Gentle laxative)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Pacifies', kapha: 'Pacifies' },
    indications: ['Constipation', 'Digestion', 'Detoxification', 'Rejuvenation', 'Weight loss', 'Eye health'],
    dosage: '3-6g at bedtime',
    contraindications: ['Pregnancy', 'Severe dehydration'],
    interactions: ['May potentiate other laxatives', 'May affect drug absorption'],
    partUsed: ['Fruit'],
    preparation: ['Churna', 'Vati', 'Ghrita']
  },
  {
    id: 'guggulu',
    name: 'Guggulu',
    botanicalName: 'Commiphora mukul',
    family: 'Burseraceae',
    sanskrit: 'गुग्गुलु',
    hindi: 'गुग्गुलु',
    rasa: ['Tikta', 'Kashaya', 'Madhura'],
    guna: ['Laghu', 'Ruksha', 'Tikshna'],
    virya: 'Ushna',
    vipaka: 'Katu',
    prabhava: 'Lekhana (Scraping)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Increases in excess', kapha: 'Pacifies' },
    indications: ['Cholesterol', 'Arthritis', 'Obesity', 'Skin diseases', 'Detoxification', 'Wound healing'],
    dosage: '1-3g twice daily',
    contraindications: ['Pregnancy', 'Kidney disease', 'Thyroid disorders'],
    interactions: ['May potentiate anticoagulants', 'May affect thyroid medications', 'May affect lipid-lowering drugs'],
    partUsed: ['Gum resin'],
    preparation: ['Churna', 'Vati', 'Taila', 'Ghrita']
  },
  {
    id: 'pippali',
    name: 'Pippali',
    botanicalName: 'Piper longum',
    family: 'Piperaceae',
    sanskrit: 'पिप्पली',
    hindi: 'पीपल',
    rasa: ['Katu', 'Tikta'],
    guna: ['Laghu', 'Snigdha'],
    virya: 'Anushna (Slightly hot)',
    vipaka: 'Madhura',
    prabhava: 'Rasayana (Rejuvenating)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Increases in excess', kapha: 'Pacifies' },
    indications: ['Cough', 'Asthma', 'Digestion', 'Fever', 'Rejuvenation', 'Fertility'],
    dosage: '1-3g powder',
    contraindications: ['High fever', 'Bleeding disorders'],
    interactions: ['May affect bioavailability of other drugs'],
    partUsed: ['Fruit'],
    preparation: ['Churna', 'Kwath', 'Ghrita', 'Chyawanprash']
  },
  {
    id: 'shatavari',
    name: 'Shatavari',
    botanicalName: 'Asparagus racemosus',
    family: 'Asparagaceae',
    sanskrit: 'शतावरी',
    hindi: 'शतावरी',
    rasa: ['Madhura', 'Tikta'],
    guna: ['Guru', 'Snigdha'],
    virya: 'Sheeta (Cooling)',
    vipaka: 'Madhura',
    prabhava: 'Vrishya (Aphrodisiac)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Pacifies', kapha: 'Increases in excess' },
    indications: ['Female reproductive health', 'Lactation', 'Menopause', 'Digestion', 'Immunity', 'Stress'],
    dosage: '3-6g powder',
    contraindications: ['None significant'],
    interactions: ['May affect estrogen levels', 'May interact with diuretics (electrolyte imbalance)'],
    partUsed: ['Root'],
    preparation: ['Churna', 'Kwath', 'Ghrita', 'Asava']
  },
  {
    id: 'neem',
    name: 'Neem',
    botanicalName: 'Azadirachta indica',
    family: 'Meliaceae',
    sanskrit: 'निम्ब',
    hindi: 'नीम',
    rasa: ['Tikta', 'Kashaya'],
    guna: ['Laghu', 'Ruksha'],
    virya: 'Sheeta',
    vipaka: 'Katu',
    prabhava: 'Krimighna (Antimicrobial)',
    doshaKarma: { vata: 'Increases in excess', pitta: 'Pacifies', kapha: 'Pacifies' },
    indications: ['Skin diseases', 'Detoxification', 'Diabetes', 'Infection', 'Fever', 'Dental health'],
    dosage: '2-4g powder, 10-20ml juice',
    contraindications: ['Pregnancy', 'Kidney disease'],
    interactions: ['May potentiate diabetes medications', 'May affect liver function'],
    partUsed: ['Leaf', 'Bark', 'Seed'],
    preparation: ['Churna', 'Kwath', 'Taila', 'Ghanavati']
  },
  {
    id: 'brahmi',
    name: 'Brahmi',
    botanicalName: 'Bacopa monnieri',
    family: 'Plantaginaceae',
    sanskrit: 'ब्राह्मी',
    hindi: 'ब्राह्मी',
    rasa: ['Tikta', 'Kashaya'],
    guna: ['Laghu', 'Snigdha'],
    virya: 'Madhyama',
    vipaka: 'Madhura',
    prabhava: 'Medhya (Nervine tonic)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Pacifies', kapha: 'Increases slightly' },
    indications: ['Memory', 'Anxiety', 'ADHD', 'Stress', 'Epilepsy', 'Skin diseases'],
    dosage: '2-4g powder',
    contraindications: ['Epilepsy', 'Thyroid disorders'],
    interactions: ['May potentiate sedatives', 'May affect anticonvulsants', 'May affect thyroid medications'],
    partUsed: ['Whole plant'],
    preparation: ['Churna', 'Kwath', 'Ghrita', 'Taila']
  },
  {
    id: 'amla',
    name: 'Amla (Indian Gooseberry)',
    botanicalName: 'Emblica officinalis',
    family: 'Phyllanthaceae',
    sanskrit: 'आमलकी',
    hindi: 'आंवला',
    rasa: ['Madhura', 'Amla', 'Tikta', 'Kashaya', 'Katu'],
    guna: ['Laghu', 'Ruksha', 'Sheeta'],
    virya: 'Sheeta',
    vipaka: 'Madhura',
    prabhava: 'Rasayana (Highest Vitamin C)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Pacifies', kapha: 'Pacifies' },
    indications: ['Immunity', 'Digestion', 'Hair health', 'Skin', 'Liver', 'Vision', 'Rejuvenation'],
    dosage: '3-6g powder, 10-20ml juice',
    contraindications: ['None significant'],
    interactions: ['May enhance iron absorption', 'May affect blood sugar'],
    partUsed: ['Fruit'],
    preparation: ['Churna', 'Rasayana', 'Chyawanprash', 'Triphala']
  },
  {
    id: 'arjuna',
    name: 'Arjuna',
    botanicalName: 'Terminalia arjuna',
    family: 'Combretaceae',
    sanskrit: 'अर्जुन',
    hindi: 'अर्जुन',
    rasa: ['Kashaya', 'Madhura'],
    guna: ['Laghu', 'Ruksha'],
    virya: 'Madhyama',
    vipaka: 'Madhura',
    prabhava: 'Hridya (Cardiac tonic)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Pacifies', kapha: 'Pacifies' },
    indications: ['Heart disease', 'High blood pressure', 'Chest pain', 'Heart failure', 'Wound healing'],
    dosage: '3-6g powder, 20-40ml decoction',
    contraindications: ['None significant'],
    interactions: ['May potentiate beta-blockers', 'May potentiate anticoagulants'],
    partUsed: ['Bark'],
    preparation: ['Churna', 'Kwath', 'Arishta']
  },
  {
    id: 'guduchi',
    name: 'Guduchi (Giloy)',
    botanicalName: 'Tinospora cordifolia',
    family: 'Menispermaceae',
    sanskrit: 'गुड़ूची',
    hindi: 'गिलोय',
    rasa: ['Tikta', 'Kashaya'],
    guna: ['Guru', 'Snigdha'],
    virya: 'Ushna',
    vipaka: 'Madhura',
    prabhava: 'Rasayana (Immunity)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Pacifies', kapha: 'Pacifies' },
    indications: ['Fever', 'Immunity', 'Diabetes', 'Digestion', 'Skin diseases', 'Autoimmune'],
    dosage: '3-6g powder, 10-20ml juice',
    contraindications: ['None significant'],
    interactions: ['May affect autoimmune conditions', 'May interact with immunosuppressants'],
    partUsed: ['Stem'],
    preparation: ['Churna', 'Kwath', 'Ghrita', 'Taila']
  },
  {
    id: 'bala',
    name: 'Bala',
    botanicalName: 'Sida cordifolia',
    family: 'Malvaceae',
    sanskrit: 'बला',
    hindi: 'बला',
    rasa: ['Madhura', 'Tikta'],
    guna: ['Guru', 'Snigdha'],
    virya: 'Sheeta',
    vipaka: 'Madhura',
    prabhava: 'Vrishya (Strengthener)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Pacifies', kapha: 'Increases' },
    indications: ['Muscle weakness', 'Fatigue', 'Nervous system', 'Fertility', 'Urinary disorders'],
    dosage: '3-6g powder',
    contraindications: ['None significant'],
    interactions: ['May have CNS depressant effects'],
    partUsed: ['Root', 'Whole plant'],
    preparation: ['Churna', 'Kwath', 'Ghrita']
  },
  {
    id: 'musta',
    name: 'Musta',
    botanicalName: 'Cyperus rotundus',
    family: 'Cyperaceae',
    sanskrit: 'मुस्ता',
    hindi: 'मोठा',
    rasa: ['Tikta', 'Kashaya'],
    guna: ['Laghu', 'Ruksha'],
    virya: 'Sheeta',
    vipaka: 'Katu',
    prabhava: 'Deepana (Digestive)',
    doshaKarma: { vata: 'Pacifies', pitta: 'Pacifies', kapha: 'Pacifies' },
    indications: ['Diarrhea', 'Digestion', 'Fever', 'Menstrual disorders', 'Skin diseases'],
    dosage: '3-6g powder',
    contraindications: ['None significant'],
    interactions: ['None known'],
    partUsed: ['Tuber'],
    preparation: ['Churna', 'Kwath']
  },
  {
    id: 'chandan',
    name: 'Chandan (Sandalwood)',
    botanicalName: 'Santalum album',
    family: 'Santalaceae',
    sanskrit: 'चन्दन',
    hindi: 'चंदन',
    rasa: ['Madhura', 'Tikta'],
    guna: ['Laghu', 'Snigdha'],
    virya: 'Sheeta',
    vipaka: 'Madhura',
    prabhava: 'Pittahara (Cooling)',
    doshaKarma: { vata: 'Increases in excess', pitta: 'Pacifies', kapha: 'Increases slightly' },
    indications: ['Skin diseases', 'Fever', 'Burns', 'Inflammation', 'Anxiety'],
    dosage: '1-3g powder',
    contraindications: ['None significant'],
    interactions: ['None significant'],
    partUsed: ['Heartwood'],
    preparation: ['Churna', 'Taila', 'Ghrita', 'Paste']
  }
]

export const DRUG_INTERACTIONS: Array<{
  herb: string
  drugClass: string
  mechanism: string
  effect: string
  severity: 'high' | 'moderate' | 'low'
  recommendation: string
}> = [
  { herb: 'Ashwagandha', drugClass: 'Sedatives/Anti-anxiety', mechanism: 'Additive CNS depression', effect: 'Increased sedation', severity: 'moderate', recommendation: 'Monitor, reduce dose if needed' },
  { herb: 'Ashwagandha', drugClass: 'Thyroid medications', mechanism: 'May increase thyroid hormone', effect: 'Thyroid overactivity', severity: 'moderate', recommendation: 'Monitor thyroid levels' },
  { herb: 'Ashwagandha', drugClass: 'Immunosuppressants', mechanism: 'May enhance immunity', effect: 'Reduced drug efficacy', severity: 'moderate', recommendation: 'Avoid or monitor closely' },
  { herb: 'Ashwagandha', drugClass: 'Hypoglycemics', mechanism: 'Additive blood sugar lowering', effect: 'Hypoglycemia', severity: 'moderate', recommendation: 'Monitor glucose, adjust doses' },
  { herb: 'Guggulu', drugClass: 'Anticoagulants (Warfarin)', mechanism: 'May increase bleeding risk', effect: 'Enhanced anticoagulation', severity: 'high', recommendation: 'Avoid combination' },
  { herb: 'Guggulu', drugClass: 'Thyroid medications', mechanism: 'May affect thyroid function', effect: 'Altered thyroid levels', severity: 'moderate', recommendation: 'Monitor thyroid function' },
  { herb: 'Guggulu', drugClass: 'Statins', mechanism: 'Additive lipid lowering', effect: 'Myopathy risk', severity: 'moderate', recommendation: 'Monitor CK levels' },
  { herb: 'Turmeric', drugClass: 'Anticoagulants', mechanism: 'Antiplatelet activity', effect: 'Increased bleeding', severity: 'moderate', recommendation: 'Avoid high doses' },
  { herb: 'Turmeric', drugClass: 'Antacids', mechanism: 'May increase stomach acid', effect: 'Reduced efficacy', severity: 'low', recommendation: 'Take at different times' },
  { herb: 'Ginger', drugClass: 'Anticoagulants', mechanism: 'Antiplatelet activity', effect: 'Increased bleeding risk', severity: 'moderate', recommendation: 'Monitor, limit dose' },
  { herb: 'Ginger', drugClass: 'Antidiabetics', mechanism: 'Additive hypoglycemia', effect: 'Low blood sugar', severity: 'moderate', recommendation: 'Monitor glucose' },
  { herb: 'Garlic', drugClass: 'Anticoagulants (Warfarin)', mechanism: 'Strong antiplatelet', effect: 'Significant bleeding risk', severity: 'high', recommendation: 'Avoid combination' },
  { herb: 'Garlic', drugClass: 'HIV Protease inhibitors', mechanism: 'May reduce drug levels', effect: 'Reduced efficacy', severity: 'moderate', recommendation: 'Avoid combination' },
  { herb: 'Garlic', drugClass: 'Oral contraceptives', mechanism: 'May affect efficacy', effect: 'Reduced contraception', severity: 'moderate', recommendation: 'Use backup' },
  { herb: 'Ginkgo', drugClass: 'Anticoagulants', mechanism: 'Strong antiplatelet', effect: 'Bleeding risk', severity: 'high', recommendation: 'Avoid combination' },
  { herb: 'Shatavari', drugClass: 'Diuretics', mechanism: 'May cause electrolyte imbalance', effect: 'Potassium loss', severity: 'moderate', recommendation: 'Monitor electrolytes' },
  { herb: 'Shatavari', drugClass: 'Digoxin', mechanism: 'May increase potassium', effect: 'Arrhythmia risk', severity: 'moderate', recommendation: 'Monitor levels' },
  { herb: 'St. Johns Wort', drugClass: 'Many drugs', mechanism: 'Cytochrome P450 induction', effect: 'Reduced drug levels', severity: 'high', recommendation: 'Avoid most combinations' }
]

export const RASAS = [
  { name: 'Madhura (Sweet)', effect: 'nourishing, moistening, heavy', benefits: 'Vata+Pitta', excess: 'Kapha increase, obesity' },
  { name: 'Amla (Sour)', effect: 'stimulating, digestive, warming', benefits: 'Vata+Kapha', excess: 'Pitta increase, acidity' },
  { name: 'Lavana (Salt)', effect: 'moistening, laxative, penetrating', benefits: 'Vata+Kapha', excess: 'Pitta increase, edema' },
  { name: 'Tikta (Bitter)', effect: 'cleansing, cooling, light', benefits: 'Pitta+Kapha', excess: 'Vata increase, depletion' },
  { name: 'Kashaya (Astringent)', effect: 'drying, firming, contracting', benefits: 'Pitta+Kapha', excess: 'Vata increase, dryness' },
  { name: 'Katu (Pungent)', effect: 'stimulating, drying, heating', benefits: 'Vata+Kapha', excess: 'Pitta increase, inflammation' }
]

export const GUNAS = [
  'Guru (Heavy)', 'Laghu (Light)', 'Snigdha (Oily)', 'Ruksha (Dry)',
  'Sheeta (Cold)', 'Ushna (Hot)', 'Manda (Slow)', 'Tikshna (Sharp)',
  'Mrdu (Soft)', 'Kathina (Hard)', 'Sthira (Stable)', 'Sara (Mobile)',
  'Sukshma (Subtle)', 'Sthula (Gross)', 'Vishada (Clear)', 'Picchila (Slimy)'
]

export const VIRYAS = [
  { name: 'Ushna (Hot)', effect: 'Stimulates, energizes, digests', use: 'Vata, Kapha, cold conditions' },
  { name: 'Sheeta (Cold)', effect: 'Calms, soothes, preserves', use: 'Pitta, heat conditions, inflammation' }
]

export const VIPAKAS = [
  { name: 'Madhura (Sweet)', effect: 'Nourishing, building', example: 'Most sweet herbs' },
  { name: 'Katu (Pungent)', effect: 'Stimulating, cleansing', example: 'Most pungent herbs' },
  { name: 'Amla (Sour)', effect: 'Digestive, stimulating', example: 'Sour fruits' }
]