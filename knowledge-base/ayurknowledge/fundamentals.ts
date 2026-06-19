export interface AyurvedicConcept {
  id: string
  term: string
  sanskrit: string
  definition: string
  category: string
  relatedConcepts: string[]
  modernCorrelation?: string
}

export const FUNDAMENTALS = {
  tridosha: [
    {
      id: 'vata',
      name: 'Vata',
      sanskrit: 'वात',
      definition: 'The principle of movement, responsible for all bodily functions involving motion - nervous system, circulation, respiration, elimination',
      qualities: ['Dry', 'Light', 'Cold', 'Rough', 'Subtle', 'Mobile'],
      seat: 'Colon, bones, ears, skin',
      functions: ['Movement', 'Respiration', 'Nerve impulses', 'Elimination', 'Creativity', 'Enthusiasm'],
      imbalance: ['Constipation', 'Anxiety', 'Insomnia', 'Arthritis', 'Neurological disorders'],
      prakritiDominance: 'Vata Prakriti - lean, quick-thinking, creative, prone to anxiety'
    },
    {
      id: 'pitta',
      name: 'Pitta',
      sanskrit: 'पित्त',
      definition: 'The principle of transformation, responsible for digestion, metabolism, temperature regulation, and visual perception',
      qualities: ['Hot', 'Sharp', 'Light', 'Liquid', 'Oily', 'Spreading'],
      seat: 'Stomach, liver, spleen, blood, eyes',
      functions: ['Digestion', 'Metabolism', 'Temperature', 'Vision', 'Intelligence', 'Courage'],
      imbalance: ['Ulcers', 'Inflammation', 'Skin rashes', 'Hyperacidity', 'Jaundice'],
      prakritiDominance: 'Pitta Prakriti - medium build, sharp intellect, leadership qualities, prone to anger'
    },
    {
      id: 'kapha',
      name: 'Kapha',
      sanskrit: 'कफ',
      definition: 'The principle of structure and lubrication, responsible for growth, stability, lubrication, and immune function',
      qualities: ['Heavy', 'Slow', 'Cold', 'Oily', 'Smooth', 'Dense'],
      seat: 'Chest, lungs, throat, head, joints',
      functions: ['Growth', 'Stability', 'Lubrication', 'Immunity', 'Memory', 'Patience'],
      imbalance: ['Weight gain', 'Congestion', 'Depression', 'Diabetes', 'Edema'],
      prakritiDominance: 'Kapha Prakriti - sturdy build, calm nature, good memory, prone to laziness'
    }
  ],
  
  saptadhatu: [
    { id: 'rasa', name: 'Rasa (Plasma)', function: 'Nourishment', seat: 'Heart, vessels', quality: 'Liquid' },
    { id: 'rakta', name: 'Rakta (Blood)', function: 'Oxygenation', seat: 'Liver, spleen', quality: 'Liquid, red' },
    { id: 'mamsa', name: 'Mamsa (Muscle)', function: 'Movement', seat: 'Muscles, ligaments', quality: 'Fibrous' },
    { id: 'meda', name: 'Meda (Fat)', function: 'Lubrication', seat: 'Adipose tissue', quality: 'Oily' },
    { id: 'asthi', name: 'Asthi (Bone)', function: 'Support', seat: 'Bones, teeth', quality: 'Hard' },
    { id: 'majja', name: 'Majja (Marrow)', function: 'Nourishment', seat: 'Bone marrow, nerves', quality: 'Oily' },
    { id: 'shukra', name: 'Shukra (Reproductive)', function: 'Reproduction', seat: 'Reproductive organs', quality: 'Oily, white' }
  ],
  
  agni: [
    { id: 'samagni', name: 'Samagni', description: 'Balanced digestive fire - optimal digestion', ideal: true },
    { id: 'mandagni', name: 'Mandagni', description: 'Weak digestive fire - slow digestion, bloating', causes: ['Kapha imbalance', 'Cold foods', 'Overeating'] },
    { id: 'tikshnagni', name: 'Tikshnagni', description: 'Strong digestive fire - rapid digestion, acidity', causes: ['Pitta imbalance', 'Spicy foods', 'Stress'] },
    { id: 'vishamagni', name: 'Vishamagni', description: 'Irregular digestive fire - variable digestion', causes: ['Vata imbalance', 'Anxiety', 'Irregular eating'] }
  ],
  
  srotas: [
    { id: 'prana', name: 'Prana Vaha Srotas', function: 'Respiratory system', channels: 'Nose, lungs, chest', symptoms: 'Breathing disorders, asthma' },
    { id: 'anna', name: 'Anna Vaha Srotas', function: 'Digestive system', channels: 'Stomach, intestines', symptoms: 'GI disorders, malnutrition' },
    { id: 'rasa', name: 'Rasa Vaha Srotas', function: 'Circulatory system', channels: 'Heart, vessels', symptoms: 'Circulatory disorders' },
    { id: 'mutra', name: 'Mutra Vaha Srotas', function: 'Urinary system', channels: 'Kidneys, bladder', symptoms: 'Urinary disorders' },
    { id: 'purisha', name: 'Purisha Vaha Srotas', function: 'Elimination', channels: 'Colon, rectum', symptoms: 'Constipation, diarrhea' },
    { id: 'shukra', name: 'Shukra Vaha Srotas', function: 'Reproductive system', channels: 'Gonads', symptoms: 'Fertility issues' },
    { id: 'artava', name: 'Artava Vaha Srotas', function: 'Menstrual system', channels: 'Uterus, ovaries', symptoms: 'Menstrual disorders' },
    { id: 'sweat', name: 'Sveda Vaha Srotas', function: 'Sweat glands', channels: 'Skin pores', symptoms: 'Excessive/deficient sweating' }
  ],
  
  ama: [
    { id: 'ama', definition: 'Toxic metabolic waste - undigested food particles that circulate and block channels', types: ['Ama Visha - toxins', 'Ama Bhoodi - cellular waste', 'Dhatu Ama - tissue toxins'], indicators: ['Heavy tongue', 'Bad breath', 'Low energy', 'Foggy mind', 'Body odor'] },
    { id: 'aama', definition: 'Uncooked/digested - food not properly transformed', causes: ['Weak Agni', 'Incompatible foods', 'Overeating', 'Cold foods'] },
    { id: 'rasa-aama', definition: 'Poor quality plasma - improper nutrition', results: ['Fatigue', 'Swelling', 'Tumors'] },
    { id: 'dhatu-aama', definition: 'Tissue-level toxins - improperly formed tissues', results: ['Chronic disease', 'Autoimmune conditions'] }
  ],
  
  ojas: [
    { id: 'oja', definition: 'The essence of all dhatus - ultimate vitality and immunity', quality: 'Clear, slightly yellowish', functions: ['Immunity', 'Strength', 'Fertility', 'Longevity'], depletion: ['Overexertion', 'Poor diet', 'Stress'], preservation: ['Rasayana therapy', 'Adequate rest', 'Sattvic diet'] }
  ]
}

export const ASHTANGAS = [
  { id: 'kayachikitsa', name: 'Kayachikitsa', sanskrit: 'कायचिकित्सा', english: 'Internal Medicine', scope: 'General medicine, heart, lungs, GI, metabolic disorders', branches: ['Hridroga (Cardiology)', 'Swasa (Pulmonology)', 'Grahani (GI)', 'Prameha (Metabolic)'] },
  { id: 'shalya', name: 'Shalya', sanskrit: 'शल्य', english: 'Surgery', scope: 'Surgical procedures, trauma, wound care', branches: ['Agni Karma (Cautery)', 'Kshara Karma (Chemical)', 'Shastra Karma (Surgical)'] },
  { id: 'shalakya', name: 'Shalakya', sanskrit: 'शलाक्य', english: 'ENT & Ophthalmology', scope: 'Diseases of head and neck', branches: ['Netra (Eye)', 'Karna (Ear)', 'Nasa (Nose)', 'Mukha (Oral)', 'Sirashira (Head)'] },
  { id: 'kaumara', name: 'Kaumara-Bhritya', sanskrit: 'कौमारभृत्य', english: 'Pediatrics & Gynecology', scope: "Children and women is health", branches: ['Balaroga (Pediatrics)', 'Prasuti (Obstetrics)', 'Stree Roga (Gynecology)'] },
  { id: 'graha', name: 'Graha Chikitsa', sanskrit: 'ग्रहचिकित्सा', english: 'Psychiatry & Bhoot Vidya', scope: 'Mental disorders, psychological conditions', branches: ['Unmada (Psychosis)', 'Apasmara (Epilepsy)', 'Mansika (Behavioral)'] },
  { id: 'agada', name: 'Agada Tantra', sanskrit: 'अगदतन्त्र', english: 'Toxicology', scope: 'Poisoning and toxicology', branches: ['Jangama (Animal toxins)', 'Sthavara (Plant/Mineral)', 'Dushi Visha (Cumulative)'] },
  { id: 'rasayana', name: 'Rasayana', sanskrit: 'रसायन', english: 'Rejuvenation', scope: 'Anti-aging, vitalization, immunity', branches: ['Kamya (General)', 'Ajasrika (Daily)', 'Nivritt (Special)'] },
  { id: 'vajikarana', name: 'Vajikarana', sanskrit: 'वाजिकरण', english: 'Fertility & Aphrodisiacs', scope: 'Reproductive health, fertility', branches: ['Shukra Kshaya', 'Vandyatva (Infertility)', 'Rasayana for reproduction'] }
]