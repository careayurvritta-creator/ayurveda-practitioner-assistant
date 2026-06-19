export interface Treatment {
  id: string
  name: string
  sanskrit: string
  category: string
  description: string
  procedure: string[]
  indications: string[]
  contraindications: string[]
  duration: string
  preparation: string[]
  postTreatment: string[]
}

export const TREATMENTS: Treatment[] = [
  {
    id: 'vamana',
    name: 'Therapeutic Emesis',
    sanskrit: 'वमन',
    category: 'Panchakarma - Shodhana',
    description: 'Controlled therapeutic vomiting to eliminate Kapha from stomach and respiratory tract',
    procedure: [
      'Day 1-3: Deepana-Pachana (appetite enhancement)',
      'Day 4-5: Snehana (oleation) - internal and external',
      'Day 6: Swedana (fomentation)',
      'Day 7: Vamana administration with specific herbs',
      'Post-vamana: Sampakarshana (rest), specific diet'
    ],
    indications: ['Kapha disorders', 'Asthma', 'Chronic cough', 'Sinusitis', 'Obesity', 'Skin diseases', 'Diabetes'],
    contraindications: ['Pregnancy', 'Heart disease', 'Weak patients', 'Pittaja conditions', 'Hemorrhage'],
    duration: '7-10 days',
    preparation: ['Abhyanga (oil massage)', 'Swedana (fomentation)', 'Light diet'],
    postTreatment: ['Kaphaja ahara', 'Warm water', 'Rest', 'Follow-up']
  },
  {
    id: 'virechana',
    name: 'Therapeutic Purgation',
    sanskrit: 'विरेचन',
    category: 'Panchakarma - Shodhana',
    description: 'Controlled purgation to eliminate Pitta and toxins from GI tract and liver',
    procedure: [
      'Day 1-3: Deepana-Pachana',
      'Day 4-6: Snehana (higher doses)',
      'Day 7: Swedana',
      'Day 8: Virechana medicine',
      'Post-procedure: Rejuvenation'
    ],
    indications: ['Pitta disorders', 'Skin diseases', 'Liver disorders', 'Digestive issues', 'Fever', 'Jaundice'],
    contraindications: ['Pregnancy', 'Severe weakness', 'Hemorrhoids', 'Intestinal diseases'],
    duration: '7-10 days',
    preparation: ['Snehana', 'Swedana', 'Proper diet'],
    postTreatment: ['Pittahara diet', 'Oil massage', 'Rest']
  },
  {
    id: 'basti',
    name: 'Medicated Enema',
    sanskrit: 'बस्ति',
    category: 'Panchakarma - Shodhana',
    description: 'Administration of herbal decoctions and oils through rectal route to eliminate Vata and nourish tissues',
    procedure: [
      'Pre-basti: Oil massage and fomentation',
      'Basti karma: Asthapana (decoction) and Anuvasana (oil) Basti',
      'Post-basti: Diet and rest'
    ],
    indications: ['Vata disorders', 'Arthritis', 'Neurological issues', 'Constipation', 'Fertility', 'Rejuvenation'],
    contraindications: ['Diarrhea', 'Bleeding', 'Rectal diseases', 'After meals'],
    duration: '8-30 days depending on condition',
    preparation: ['Deepana', 'Pachana', 'Abhyanga'],
    postTreatment: ['Warm diet', 'Rest', 'Follow-up']
  },
  {
    id: 'nasya',
    name: 'Nasal Therapy',
    sanskrit: 'नस्य',
    category: 'Panchakarma - Shodhana',
    description: 'Administration of medicated oils/ghee through nostrils to treat head and neck disorders',
    procedure: [
      'Preparation: Face and head massage, steam',
      'Inhalation: Medicated steam',
      'Nasya: Drops in each nostril',
      'Post: Massage, rest'
    ],
    indications: ['Headache', 'Sinusitis', 'Migraine', 'Hair loss', 'Neurological conditions', 'Mental disorders'],
    contraindications: ['Acute cold', 'Pregnancy', 'After food', 'Bleeding from nose'],
    duration: '7-14 days',
    preparation: ['Abhyanga', 'Swedana'],
    postTreatment: ['Avoid cold', 'Steam inhalation']
  },
  {
    id: 'raktamokshana',
    name: 'Bloodletting',
    sanskrit: 'रक्तमोक्षण',
    category: 'Panchakarma - Shodhana',
    description: 'Controlled removal of impure blood to treat blood-borne and skin disorders',
    procedure: [
      'Preparation: Local cleaning, assessment',
      'Method: Siravedha (venous) or Jalaukavacharana (leech)',
      'Quantity: 50-200ml based on condition',
      'Post: Dress, rest'
    ],
    indications: ['Skin diseases', 'Pitta disorders', 'Polycythemia', 'Chronic skin conditions'],
    contraindications: ['Anemia', 'Pregnancy', 'Weak patients', 'Bleeding disorders'],
    duration: 'Single or repeated sessions',
    preparation: ['Assessment of blood quality'],
    postTreatment: ['Diet control', 'Rest']
  },
  {
    id: 'abhyanga',
    name: 'Oil Massage',
    sanskrit: 'अभ्यङ्ग',
    category: 'Bahya Chikitsa (External)',
    description: 'Therapeutic massage with medicated oils to nourish tissues and calm nervous system',
    procedure: [
      'Oil selection based on dosha',
      'Direction: Heart to extremities',
      'Duration: 30-60 minutes',
      'Followed by steam or rest'
    ],
    indications: ['Vata disorders', 'Dry skin', 'Nervous system', 'Rejuvenation', 'Sleep disorders'],
    contraindications: ['Fever', 'Digestion issues', 'Obesity', 'Skin infections'],
    duration: '7-45 days or as needed',
    preparation: ['Warm oil'],
    postTreatment: ['Rest', 'Warm water bath']
  },
  {
    id: 'swedana',
    name: 'Fomentation',
    sanskrit: 'स्वेदन',
    category: 'Bahya Chikitsa (External)',
    description: 'Therapeutic sweating to open channels and relieve stiffness',
    procedure: [
      'Methods: Steam, herbal bolus, bath',
      'Duration: 10-30 minutes',
      'Followed by rest'
    ],
    indications: ['Vata-Kapha disorders', 'Stiffness', 'Pain', 'Cold conditions', 'Detoxification'],
    contraindications: ['Pitta disorders', 'Heart disease', 'Pregnancy', 'Severe weakness'],
    duration: '7-14 days',
    preparation: ['Oleation if needed'],
    postTreatment: ['Rest', 'Cool water']
  },
  {
    id: 'shirodhara',
    name: 'Oil Dripping on Forehead',
    sanskrit: 'शिरोधारा',
    category: 'Bahya Chikitsa - Relaxation',
    description: 'Continuous stream of medicated oil on forehead to calm mind and nervous system',
    procedure: [
      'Preparation: Head massage',
      'Oil stream: Continuous 30-45 minutes',
      'Post: Rest'
    ],
    indications: ['Stress', 'Anxiety', 'Insomnia', 'Headache', 'Mental disorders', 'Rejuvenation'],
    contraindications: ['Severe kapha', 'Sinusitis', 'Skin conditions on scalp'],
    duration: '7-21 days',
    preparation: ['Abhyanga'],
    postTreatment: ['Rest', 'Light diet']
  },
  {
    id: 'kati',
    name: 'Medicated Enema for Lower Back',
    sanskrit: 'कटि बस्ति',
    category: 'Local Basti',
    description: 'Localized Basti for treating lower back and hip conditions',
    procedure: [
      'Preparation: Abhyanga, Swedana',
      'Basti: Oil/decoction retention in lower back region'
    ],
    indications: ['Sciatica', 'Lower back pain', 'Hip disorders', 'Vata disorders'],
    contraindications: ['Local skin conditions'],
    duration: '7-14 days',
    preparation: ['General basti preparation'],
    postTreatment: ['Rest']
  },
  {
    id: 'uttara-basti',
    name: 'Uttara Basti',
    sanskrit: 'उत्तर बस्ति',
    category: 'Localized - Genitourinary',
    description: 'Medicated enema through urethra/vagina for genitourinary disorders',
    procedure: [
      'Procedure in sterile conditions',
      'Administer through catheter',
      'Retention as per condition'
    ],
    indications: ['Urinary disorders', 'Fertility issues', 'Gynecological conditions'],
    contraindications: ['Acute infections', 'Pregnancy'],
    duration: '5-7 days',
    preparation: ['Asthapana Basti'],
    postTreatment: ['Rest']
  },
  {
    id: 'lepa',
    name: 'Medicated Paste Application',
    sanskrit: 'लेप',
    category: 'Bahya Chikitsa - Skin',
    description: 'Application of herbal pastes for skin conditions and localized treatment',
    procedure: [
      'Preparation: Paste of herbs',
      'Application: On affected area',
      'Duration: 30 minutes to overnight'
    ],
    indications: ['Skin diseases', 'Inflammation', 'Pain', 'Swelling'],
    contraindications: ['Allergy to ingredients', 'Open wounds'],
    duration: 'As needed',
    preparation: ['Fresh paste'],
    postTreatment: ['Clean affected area']
  }
]

export const PURVAKARMA = [
  { id: 'deepana', name: 'Appetite Enhancement', description: 'Medications to improve digestive fire before main treatment', duration: '3-5 days', indications: ['Poor appetite', 'Ama accumulation'] },
  { id: 'pachana', name: 'Ama Digestion', description: 'Medications to digest toxins before purification', duration: '3-5 days', indications: ['Ama', 'Indigestion'] },
  { id: 'snehana', name: 'Oleation', description: 'Internal and external administration of medicated ghee/oil', types: ['Sthanika (local)', 'Shamana (internal)'], duration: '3-7 days', indications: ['Vata disorders', 'Before Panchakarma'] },
  { id: 'swedana', name: 'Fomentation', description: 'Therapeutic sweating to open channels', types: ['Nadi (steam)', 'Pinda (bolus)', 'Avagaha (bath)'], duration: '3-7 days', indications: ['Stiffness', 'Pain', 'Before Shodhana'] }
]

export const RASAYANA_THERAPIES = [
  { id: 'pravana', name: 'Pravana (Rejuvenation)', description: 'Complete body rejuvenation after Panchakarma', duration: '21-45 days', benefits: ['Longevity', 'Youth', 'Immunity', 'Memory'] },
  { id: 'kutipraveshika', name: 'Kutipraveshika Rasayana', description: 'Indoor Rejuvenation therapy', duration: '28-48 days', benefits: ['Complete renewal', 'Tissue regeneration'] },
  { id: 'vata', name: 'Vata Rasayana', description: 'Nervous system rejuvenation', duration: '14-30 days', benefits: ['Neurological health', 'Mental clarity'] },
  { id: 'pitta', name: 'Pitta Rasayana', description: 'Digestive system rejuvenation', duration: '14-30 days', benefits: ['Liver health', 'Skin health'] },
  { id: 'kapha', name: 'Kapha Rasayana', description: 'Respiratory and immune rejuvenation', duration: '14-30 days', benefits: ['Immunity', 'Respiratory health'] }
]

export const PATHYA_APATHYA = {
  pathya: {
    general: [
      'Freshly cooked food',
      'Warm water',
      'Seasonal fruits',
      'Green vegetables',
      'Ghee in moderation',
      'Proper meal timings',
      'Mindful eating'
    ],
    byDosha: {
      vata: ['Warm, moist, nourishing foods', 'Ghee, oily foods', 'Cooked vegetables', 'Warm drinks'],
      pitta: ['Cooling, slightly dry foods', 'Coconut water', 'Butter, cream', 'Sweet fruits'],
      kapha: ['Light, dry, warm foods', 'Honey', 'Spices', 'Light grains']
    }
  },
  apathya: {
    general: [
      'Overeating',
      'Cold foods and drinks',
      'Leftover food',
      'Processed foods',
      'Irregular meal times',
      'Eating with negative emotions',
      'Heavy foods at night'
    ],
    byDosha: {
      vata: ['Dry, cold, light foods', 'Raw vegetables', 'Carbonated drinks'],
      pitta: ['Spicy, sour, hot foods', 'Alcohol', 'Fried foods'],
      kapha: ['Heavy, oily, sweet foods', 'Dairy', 'Sedentary lifestyle']
    }
  }
}

export const DINACHARYA = [
  { time: '4-6 AM', activity: 'Brahmamuhurta - Spiritual practices', benefit: 'Mental clarity, spiritual growth' },
  { time: '6-7 AM', activity: 'Exercise, yoga, pranayama', benefit: 'Physical strength, dosha balance' },
  { time: '7-8 AM', activity: 'Abhyanga (oil massage), bath', benefit: 'Nourishment, circulation' },
  { time: '8-9 AM', activity: 'Breakfast (light)', benefit: 'Energy for day' },
  { time: '10-11 AM', activity: 'Main meal', benefit: 'Peak digestion' },
  { time: '12-1 PM', activity: 'Work/activity', benefit: 'Productivity' },
  { time: '3-4 PM', activity: 'Light snack', benefit: 'Sustained energy' },
  { time: '6-7 PM', activity: 'Evening walk, light activity', benefit: 'Digestion, circulation' },
  { time: '7-8 PM', activity: 'Dinner (light)', benefit: 'Easy digestion' },
  { time: '9-10 PM', activity: 'Relaxation, reading', benefit: 'Mental preparation for sleep' },
  { time: '10 PM', activity: 'Sleep', benefit: 'Tissue repair, memory consolidation' }
]

export const RITUCHARYA = {
  hemanta: { months: 'Nov-Feb', vata: { pathya: 'Heavy, nourishing', apathya: 'Light, dry' }, pitta: { pathya: 'Slightly warming', apathya: 'Cold, raw' }, kapha: { pathya: 'Light, dry', apathya: 'Heavy, oily' } },
  shishira: { months: 'Feb-Apr', vata: { pathya: 'Heavy', apathya: 'Dry' }, pitta: { pathya: 'Cooling', apathya: 'Heating' }, kapha: { pathya: 'Dry', apathya: 'Heavy' } },
  vasanta: { months: 'Apr-Jun', vata: { pathya: 'Nourishing', apathya: 'Dry' }, pitta: { pathya: 'Sweet, light', apathya: 'Sour, salty' }, kapha: { pathya: 'Light, dry', apathya: 'Heavy, oily' } },
  grishma: { months: 'Jun-Sep', vata: { pathya: 'Heavy, oily', apathya: 'Dry, light' }, pitta: { pathya: 'Sweet, cooling', apathya: 'Sour, salty, hot' }, kapha: { pathya: 'Light, dry', apathya: 'Heavy, oily' } },
  varsha: { months: 'Sep-Nov', vata: { pathya: 'Slightly heavy', apathya: 'Light' }, pitta: { pathya: 'Sweet', apathya: 'Sour, salty' }, kapha: { pathya: 'Light, dry', apathya: 'Heavy, oily' } }
}