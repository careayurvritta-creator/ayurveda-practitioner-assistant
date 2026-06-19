export interface DiseaseEntry {
  id: string
  name: string
  sanskrit: string
  category: string
  doshaInvolvement: string[]
  samprapti: string
  modernCorrelation: string
  clinicalFeatures: string[]
  diagnosticCriteria: string[]
  treatment: string[]
  pathya: string[]
  apathya: string[]
  prognosis: string
}

export const DISEASES: DiseaseEntry[] = [
  {
    id: 'prameha',
    name: 'Prameha',
    sanskrit: 'प्रमेह',
    category: 'Metabolic Disorders',
    doshaInvolvement: ['Kapha', 'Pitta', 'Vata'],
    samprapti: 'Kapha and meda dhatu accumulation leading to excessive urination',
    modernCorrelation: 'Diabetes Mellitus, Urinary disorders',
    clinicalFeatures: ['Frequent urination', 'Sweet taste in mouth', 'Lethargy', 'Weight gain', 'Excessive thirst'],
    diagnosticCriteria: ['Mutra sampata (sweet urine)', 'Prabhoota mutrata', 'Avila mutra'],
    treatment: ['Madhumehari chikitsa', 'Panchakarma (Virechana, Basti)', 'Herbal formulations', 'Diet control'],
    pathya: ['Bitter vegetables', 'Barley', 'Green gram', 'Turmeric', 'Fenugreek'],
    apathya: ['Sweet foods', 'Rice', 'Ghee', 'Junk food', 'Sedentary lifestyle'],
    prognosis: 'Sukhasadhya in early stage, Krichrasadhya if chronic'
  },
  {
    id: 'raktagatavata',
    name: 'Raktagata Vata',
    sanskrit: 'रक्तगत वात',
    category: 'Cardiovascular',
    doshaInvolvement: ['Vata', 'Pitta'],
    samprapti: 'Vata pushing rakta (blood) upwards causing pressure',
    modernCorrelation: 'Hypertension',
    clinicalFeatures: ['High blood pressure', 'Headache', 'Dizziness', 'Chest pain', 'Palpitations'],
    diagnosticCriteria: ['Raktachaaya', 'Dhamani pratichaya', 'Vata krichra'],
    treatment: ['Raktashamaka drugs', 'Snehana (oleation)', 'Panchakarma', 'Lifestyle modification'],
    pathya: ['Garlic', 'Turmeric', 'Ginger', 'Lemon', 'Pomegranate'],
    apathya: ['Salt', 'Spicy foods', 'Stress', 'Alcohol', 'Tobacco'],
    prognosis: 'Samaka with proper management'
  },
  {
    id: 'sandhivata',
    name: 'Sandhi Vata',
    sanskrit: 'संधि वात',
    category: 'Musculoskeletal',
    doshaInvolvement: ['Vata'],
    samprapti: 'Vata degeneration in joint spaces causing pain and stiffness',
    modernCorrelation: 'Osteoarthritis, Rheumatoid Arthritis',
    clinicalFeatures: ['Joint pain', 'Stiffness', 'Swelling', 'Reduced mobility', 'Crepitus'],
    diagnosticCriteria: ['Sandhi shotha', 'Ruja', 'Sthambha', 'Prasarana painful'],
    treatment: ['Basti therapy', 'Snehana', 'Swedana', 'Rasayana', 'External therapies'],
    pathya: ['Ashwagandha', 'Guggulu', 'Sesame oil', 'Warm foods', 'Calcium-rich foods'],
    apathya: ['Cold foods', 'Dry foods', 'Excessive exercise', 'Late nights'],
    prognosis: 'Yapya (manageable) with continuous treatment'
  },
  {
    id: 'amavata',
    name: 'Amavata',
    sanskrit: 'अमवात',
    category: 'Musculoskeletal',
    doshaInvolvement: ['Vata', 'Kapha'],
    samprapti: 'Ama with vata in joints causing inflammation',
    modernCorrelation: 'Rheumatoid Arthritis',
    clinicalFeatures: ['Joint swelling', 'Pain', 'Stiffness (morning)', 'Fatigue', 'Fever'],
    diagnosticCriteria: ['Sandhi shotha', 'Raktotpatti', 'Daha', 'Toya gaman'],
    treatment: ['Langhana', 'Deepana', 'Pachana', 'Panchakarma', 'Shodhana'],
    pathya: ['Ryu', 'Ginger', 'Garlic', 'Turmeric', 'Light foods'],
    apathya: ['Heavy foods', 'Cold foods', 'Dairy', 'Fried foods'],
    prognosis: 'Krichrasadhya, requires long-term management'
  },
  {
    id: 'grahani',
    name: 'Grahani',
    sanskrit: 'ग्रहणी',
    category: 'Gastrointestinal',
    doshaInvolvement: ['Vata', 'Pitta'],
    samprapti: 'Impaired Agni leading to improper digestion and absorption',
    modernCorrelation: 'IBS, Malabsorption Syndrome, IBD',
    clinicalFeatures: ['Diarrhea/Constipation alternating', 'Bloating', 'Abdominal pain', 'Undigested food in stool', 'Weight loss'],
    diagnosticCriteria: ['Ama in Pureesha', 'Vitiated Agni', 'Vata pravritti'],
    treatment: ['Deepana', 'Pachana', 'Sangrahaka', 'Basti', 'Pathyaahara'],
    pathya: ['Well-cooked foods', 'Warm water', 'Buttermilk', 'Skimmed milk', 'Rice'],
    apathya: ['Raw foods', 'Cold drinks', 'Fried foods', 'Irregular meals'],
    prognosis: 'Sukhasadhya with proper diet and treatment'
  },
  {
    id: 'kushhta',
    name: 'Kushhta',
    sanskrit: 'कुष्ठ',
    category: 'Dermatological',
    doshaInvolvement: ['Vata', 'Pitta', 'Kapha', 'Rakta'],
    samprapti: 'Dosha and dhatu contamination manifesting on skin',
    modernCorrelation: 'Psoriasis, Eczema, Skin infections',
    clinicalFeatures: ['Skin lesions', 'Itching', 'Scaling', 'Discoloration', 'Pain'],
    diagnosticCriteria: ['Twak Involvement', 'Lakshana according to dosha'],
    treatment: ['Panchakarma', 'Raktashodhana', 'Bahya chikitsa (external)', 'Antah (internal)'],
    pathya: ['Green vegetables', 'Fruits', 'Turmeric', 'Neem', 'Ghee'],
    apathya: ['Spicy foods', 'Alcohol', 'Non-veg', 'Junk food', 'Stress'],
    prognosis: 'Depends on type and chronicity'
  },
  {
    id: 'swasa',
    name: 'Swasa',
    sanskrit: 'श्वास',
    category: 'Respiratory',
    doshaInvolvement: ['Vata', 'Kapha'],
    samprapti: 'Obstruction in prana vaha srotas causing breathing difficulty',
    modernCorrelation: 'Asthma, COPD, Bronchitis',
    clinicalFeatures: ['Breathlessness', 'Wheezing', 'Cough', 'Chest tightness', 'Sputum'],
    diagnosticCriteria: ['Krichra shwasa', 'Urdhva shwasa', 'Tamaka shwasa'],
    treatment: ['Shodhana', 'Shamana', 'Inhalation therapies', 'Pranayama', 'Rasayana'],
    pathya: ['Ginger', 'Turmeric', 'Pippali', 'Honey', 'Warm foods'],
    apathya: ['Cold foods', 'Dust', 'Pollution', 'Smoking', 'Dairy'],
    prognosis: 'Yapya with continuous management'
  },
  {
    id: 'kasa',
    name: 'Kasa',
    sanskrit: 'कास',
    category: 'Respiratory',
    doshaInvolvement: ['Vata', 'Kapha', 'Pitta'],
    samprapti: 'Irritation in respiratory tract causing cough',
    modernCorrelation: 'Cough, Bronchitis, TB',
    clinicalFeatures: ['Cough', 'Throat irritation', 'Sputum', 'Chest pain', 'Breathing difficulty'],
    diagnosticCriteria: ['Kasa prana', 'Ushma', 'Kanthodhwansa'],
    treatment: ['Shamana', 'Shodhana', 'Kasa hara drugs', 'Diet management'],
    pathya: ['Warm water', 'Ginger', 'Pippali', 'Tulsi', 'Honey'],
    apathya: ['Cold foods', 'Dust', 'Smoking', 'Spicy foods'],
    prognosis: 'Sukhasadhya in acute cases'
  },
  {
    id: 'hridroga',
    name: 'Hridroga',
    sanskrit: 'हृद्दोष',
    category: 'Cardiovascular',
    doshaInvolvement: ['Vata', 'Pitta', 'Kapha'],
    samprapti: 'Heart affected by dosha imbalance and strotas blockage',
    modernCorrelation: 'Heart disease, Palpitations, Angina',
    clinicalFeatures: ['Chest pain', 'Palpitations', 'Breathlessness', 'Fatigue', 'Syncope'],
    diagnosticCriteria: ['Hridaya sphurana', 'Daurbalya', 'Shwasa'],
    treatment: ['Hridya shodhana', 'Rasayana', 'Panchakarma', 'Lifestyle'],
    pathya: ['Arjuna', 'Ghee', 'Garlic', 'Fruits', 'Light foods'],
    apathya: ['Heavy foods', 'Stress', 'Exertion', 'Alcohol'],
    prognosis: 'Varies by condition'
  },
  {
    id: 'shotha',
    name: 'Shotha',
    sanskrit: 'शोथ',
    category: 'General',
    doshaInvolvement: ['Vata', 'Pitta', 'Kapha'],
    samprapti: 'Fluid accumulation and inflammation in tissues',
    modernCorrelation: 'Edema, Inflammation',
    clinicalFeatures: ['Swelling', 'Pitting on pressure', 'Weight gain', 'Lethargy'],
    diagnosticCriteria: ['Sparsha sparsha', 'Pidaka', 'Srotas involvement'],
    treatment: ['Langhana', 'Swedana', 'Mutra virachana', 'Vatanulomana'],
    pathya: ['Bitter herbs', 'Ginger', 'Turmeric', 'Pomegranate', 'Barley water'],
    apathya: ['Salt', 'Water retention foods', 'Sedentary lifestyle'],
    prognosis: 'Sukhasadhya depending on cause'
  },
  {
    id: 'unmada',
    name: 'Unmada',
    sanskrit: 'उन्माद',
    category: 'Mental',
    doshaInvolvement: ['Vata', 'Pitta', 'Kapha', 'Manas'],
    samprapti: 'Mind affected by dosha imbalance causing mental disturbance',
    modernCorrelation: 'Psychosis, Mental illness, Depression',
    clinicalFeatures: ['Behavioral changes', 'Confusion', 'Agitation', 'Delusions', 'Hallucinations'],
    diagnosticCriteria: ['Manas vikriti', 'Chittodwega', 'Sattva vaicharya'],
    treatment: ['Medhya drugs', 'Panchakarma', 'Sattvavajaya', 'Lifestyle'],
    pathya: ['Medhya herbs', 'Milk', 'Ghee', 'Fruits', 'Peaceful environment'],
    apathya: ['Stress', 'Tamasic foods', 'Alcohol', 'Lack of sleep'],
    prognosis: 'Requires long-term management'
  },
  {
    id: 'mastishka',
    name: 'Mastishka Rog',
    sanskrit: 'मस्तिष्क रोग',
    category: 'Neurological',
    doshaInvolvement: ['Vata'],
    samprapti: 'Vata affecting brain and nervous system',
    modernCorrelation: 'Headache, Migraine, Neurological disorders',
    clinicalFeatures: ['Head pain', 'Vertigo', 'Numbness', 'Tingling', 'Weakness'],
    diagnosticCriteria: ['Shira shool', 'Vata pravritti'],
    treatment: ['Shamana', 'Basti', 'Nasya', 'Rasayana'],
    pathya: ['Ghee', 'Ashwagandha', 'Bala', 'Warm foods'],
    apathya: ['Stress', 'Cold foods', 'Late nights'],
    prognosis: 'Varies by condition'
  }
]

export const DISEASE_CATEGORIES = [
  'Metabolic Disorders',
  'Cardiovascular',
  'Respiratory',
  'Gastrointestinal',
  'Musculoskeletal',
  'Dermatological',
  'Neurological',
  'Mental',
  'Gynecological',
  'Pediatric',
  'Ophthalmology',
  'ENT',
  'Urological',
  'Fertility',
  'Autoimmune'
]