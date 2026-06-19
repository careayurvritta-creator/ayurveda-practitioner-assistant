// Charak Samhita - Comprehensive Classical Text Data
// Source: carakasamhitaonline.com
// License: CC BY-NC-SA 4.0

export const CHARAK_SAMHITA = {
  structure: {
    totalSthanas: 8,
    totalChapters: 30,
    sections: [
      {
        id: 'sutrasthana',
        name: 'Sutra Sthana',
        english: 'Section on Fundamental Principles',
        chapters: 30,
        chatushkas: [
          'Bheshaja Chatushka (Medicines)',
          'Swastha Chatushka (Health Preservation)',
          'Nirdesha Chatushka (Guidelines)',
          'Kalpana Chatushka (Purification)',
          'Roga Chatushka (Diseases)',
          'Yojana Chatushka (Treatment)',
          'Annapana Chatushka (Food)',
          'Sangraha (Summary)'
        ]
      },
      {
        id: 'nidanasthana',
        name: 'Nidana Sthana',
        english: 'Section on Diagnostic Principles',
        chapters: 8
      },
      {
        id: 'vimanasthana',
        name: 'Vimana Sthana',
        english: 'Section on Specific Medical Principles',
        chapters: 8
      },
      {
        id: 'sharirathana',
        name: 'Sharira Sthana',
        english: 'Section on Human Being and Genesis',
        chapters: 8
      },
      {
        id: 'indriyasthana',
        name: 'Indriya Sthana',
        english: 'Section on Sensorial Prognosis',
        chapters: 12
      },
      {
        id: 'chikitsasthana',
        name: 'Chikitsa Sthana',
        english: 'Section on Therapeutic Principles',
        chapters: 30
      },
      {
        id: 'kalpasthana',
        name: 'Kalpa Sthana',
        english: 'Section on Pharmaceutical Preparations',
        chapters: 6
      },
      {
        id: 'siddhisthana',
        name: 'Siddhi Sthana',
        english: 'Section on Therapeutic Procedures',
        chapters: 12
      }
    ]
  },
  
  prameha: {
    // From Chikitsa Sthana Chapter 6
    definition: 'Urinary disorders with increased quantity of urine with turbidity',
    correlation: 'Diabetes mellitus and various urinary disorders',
    etiology: [
      'Over-indulgence in sedentary habits',
      'Excess sleep',
      'Curds, meat soup of domesticated/aquatic animals',
      'Milk and its preparations',
      'Freshly harvested food articles',
      'Freshly prepared drinks',
      'Preparations of jaggery',
      'All kapha aggravating factors'
    ],
    doshaInvolved: ['Kapha', 'Pitta', 'Vata'],
    dushyaInvolved: ['Medas', 'Mamsa', 'Kleda', 'Rakta', 'Shukra', 'Majja', 'Ojas', 'Rasa', 'Lasika', 'Vasa', 'Ambu'],
    types: {
      kaphaja: 10,
      pittaja: 6,
      vataja: 4,
      total: 20
    },
    kaphajaTypes: [
      { name: 'Udaka Meha', description: 'Urine resembling water' },
      { name: 'Iksu Valika Meha', description: 'Urine resembling sugar cane juice' },
      { name: 'Sandra Meha', description: 'Dense urine' },
      { name: 'Sandra Prasad Meha', description: 'Low density urine with transparent upper layer' },
      { name: 'Shukla Meha', description: 'Urine having white colour' },
      { name: 'Shukra Meha', description: 'Urine containing seminal fluid' },
      { name: 'Shita Meha', description: 'Urine having cold touch' },
      { name: 'Shanaih Meha', description: 'Urine passing out slowly' },
      { name: 'Lala Meha', description: 'Urine containing slimy material like saliva' },
      { name: 'Sikata Meha', description: 'Urine containing sand like substance' }
    ],
    pittajaTypes: [
      { name: 'Kshara Meha', description: 'Urine resembling alkali solution' },
      { name: 'Kala Meha', description: 'Urine having black color' },
      { name: 'Nila Meha', description: 'Urine having indigo color' },
      { name: 'Haridra Meha', description: 'Urine having yellow color like turmeric' },
      { name: 'Manjishtha Meha', description: 'Urine having reddish color' },
      { name: 'Rakta Meha', description: 'Urine having blood in it' }
    ],
    vatajaTypes: [
      { name: 'Majja Meha', description: 'Urine mixed with majja' },
      { name: 'Oja Meha', description: 'Urine mixed with ojas' },
      { name: 'Vasa Meha', description: 'Urine mixed with muscle fat' },
      { name: 'Lasika Meha', description: 'Urine mixed with lymph' }
    ],
    premonitorySigns: [
      'Sweating',
      'Body odor',
      'Flabbiness of the body',
      'Liking for constantly lying on the bed, sitting, sleeping',
      'Easy lifestyle preference',
      'Feeling as if cardiac region is covered with extraneous material',
      'Exudation from eyes, tongue and ears',
      'Excessive growth of hair and nails',
      'Liking for cold things',
      'Dryness of throat and palate',
      'Sweet taste in the mouth',
      'Burning sensation in hands and legs',
      'Swarming of ants on the urine'
    ],
    prognosis: {
      kaphaja: 'Sadhya (Curable) - 10 types',
      pittaja: 'Yapya (Palliable) - 6 types',
      vataja: 'Asadhya (Incurable) - 4 types'
    },
    treatment: {
      categories: ['Samshodhana (Elimination)', 'Samshamana (Alleviation)', 'Nidana Parivarjana (Avoiding causative factors)'],
      patientTypes: {
        sthula: { description: 'Obese and strong', treatment: 'Samshodhana (Purification)' },
        krisha: { description: 'Emaciated and weak', treatment: 'Sambrimhana (Nourishing)' }
      },
      diet: [
        'Manthas (flour mixed with water)',
        'Kashayas (decoctions)',
        'Barley powder',
        'Yavaudana (cooked barley)',
        'Old shali rice with mudga soup',
        'Shashtika rice',
        'Bitter vegetables'
      ],
      herbs: [
        'Haritaki', 'Katphala', 'Musta', 'Lodhra',
        'Patha', 'Vidanga', 'Arjuna', 'Dhanvana',
        'Haridra', 'Daruharida', 'Tagar',
        'Khadira', 'Dhava', 'Surahva', 'Kushtha',
        'Amla', 'Guduchi', 'Chavya', 'Chitraka'
      ],
      formulations: [
        'Triphala decoction with honey',
        'Haridra with Amalaki juice',
        'Various medicated oils',
        'Madhvasava',
        'Dantyasava'
      ]
    }
  },

  vataVyadhi: {
    // From Chikitsa Sthana Chapter 28
    name: 'Vata Vyadhi Chikitsa',
    english: 'Management of diseases caused by Vata dosha',
    definition: 'Diseases particularly caused by Vata dosha, especially neurological, musculoskeletal and reticulo-endothelial systems',
    importance: 'Vata is the prime dosha - propels all functional elements in the body',
    fiveTypes: [
      { name: 'Prana', location: 'Head, chest, throat, tongue, mouth, nose', functions: 'Spitting, sneezing, eructation, respiration, deglutition' },
      { name: 'Udana', location: 'Umbilicus, chest, throat', functions: 'Vocalization, drive, energy, strength, complexion' },
      { name: 'Samana', location: 'Channels of sweat, humors, water near Agni', functions: 'Strength to digestive fire' },
      { name: 'Vyana', location: 'All over body', functions: 'Gait, flexion, extension, twinkling' },
      { name: 'Apana', location: 'Testicles, bladder, penis, thighs, inguinal, anus', functions: 'Ejaculation, micturition, defecation, menstruation, fetus delivery' }
    ],
    etiopathology: {
      dhatukshaya: 'Vata aggravated due to depletion of tissues',
      avarana: 'Vata obstructed by other doshas, dhatus, or mala'
    },
    disorders: [
      { name: 'Pakshaghata', english: 'Paralysis/Stroke' },
      { name: 'Ardita', english: 'Facial paralysis' },
      { name: 'Gridhrasi', english: 'Sciatica' },
      { name: 'Avabahuka', english: 'Frozen shoulder' },
      { name: 'Vishwachi', english: 'Cervico-brachial neuralgia' },
      { name: 'Aakshepaka', english: 'Episodic convulsions' },
      { name: 'Dandaka', english: 'Stiffness of body' },
      { name: 'Hanugraha', english: 'Lock jaw' },
      { name: 'Antarayama', english: 'Emprosthotonous' },
      { name: 'Bahirayama', english: 'Ophisthotonous' }
    ],
    generalSymptoms: [
      'Saṅkōca (contractures)',
      'Stambha (stiffness)',
      'Bheda (splitting pain)',
      'Lōmaharṣa (horripilation)',
      'Pralāpa (delirium)',
      'Khanja (limping)',
      'Pāṅgulya (paralysis)',
      'Kubjatva (hunchback)',
      'Śōṣa (atrophy)',
      'Anidratā (insomnia)'
    ],
    treatment: {
      line: 'Snehana, Swedana, then Samshodhana',
      categories: ['Brimhana (Nourishing)', 'Samshamana (Pacification)'],
      formulations: [
        'Sahachara taila',
        'Baladi taila',
        'Amritadi tailam',
        'Rasna taila',
        'Mulaka taila'
      ]
    },
    avaranaTypes: [
      'Pittavrita Vata',
      'Kaphavrita Vata',
      'Raktavrita Vata',
      'Mamsavrita Vata',
      'Medavrita Vata',
      'Asthi-Avarana',
      'Majja-Avarana',
      'Shukra-Avarana'
    ]
  },

  jwara: {
    name: 'Jwara Chikitsa',
    english: 'Management of Fever',
    types: ['Santata Jwara (Continuous)', 'Sannipatik Jwara (Intermittent)', 'Khudira Jwara (Malarial)', 'Tridoshaja Jwara'],
    treatment: {
      AmaJwara: 'Langhana (fasting), Pachana (digestion)',
      PurnaJwara: 'Snehana, Swedana, then Shodhana',
      chronic: 'Rasayana, rejuvenation'
    }
  },

  rasayana: {
    name: 'Rasayana Chikitsa',
    english: 'Rejuvenation Therapy',
    definition: 'Measures that promote physical and mental health and provide general immunity',
    benefits: [
      'Prevents and retards aging',
      'Promotes longevity',
      'Enhances immunity',
      'Strengthens tissues',
      'Improves memory and intelligence'
    ],
    types: {
      kamya: 'For specific purposes - long life, intelligence, etc.',
      nagar: 'Daily use - proper food and lifestyle',
      vairagya: 'For those who have renounced worldly life'
    }
  },

  vajikarana: {
    name: 'Vajikarana Chikitsa',
    english: 'Aphrodisiac Therapy',
    definition: 'Enhancing sexual health and healthy progeny',
    indications: [
      'Infertility',
      'Sexual weakness',
      'For healthy offspring'
    ]
  },

  agni: {
    definition: 'Digestive fire / metabolic capacity',
    types: [
      { name: 'Samagni', description: 'Balanced digestive fire - optimal digestion', ideal: true },
      { name: 'Mandagni', description: 'Weak digestive fire - slow digestion, bloating', causes: ['Kapha imbalance', 'Cold foods', 'Overeating'] },
      { name: 'Tikshnagni', description: 'Strong digestive fire - rapid digestion, acidity', causes: ['Pitta imbalance', 'Spicy foods', 'Stress'] },
      { name: 'Vishamagni', description: 'Irregular digestive fire - variable digestion', causes: ['Vata imbalance', 'Anxiety', 'Irregular eating'] }
    ],
    importance: 'All diseases originate from impaired Agni'
  },

  tridosha: {
    vata: {
      qualities: ['Dry', 'Light', 'Cold', 'Rough', 'Subtle', 'Mobile'],
      seat: 'Colon, bones, ears, skin',
      functions: ['Movement', 'Respiration', 'Nerve impulses', 'Elimination', 'Creativity']
    },
    pitta: {
      qualities: ['Hot', 'Sharp', 'Light', 'Liquid', 'Oily', 'Spreading'],
      seat: 'Stomach, liver, spleen, blood, eyes',
      functions: ['Digestion', 'Metabolism', 'Temperature', 'Vision', 'Intelligence']
    },
    kapha: {
      qualities: ['Heavy', 'Slow', 'Cold', 'Oily', 'Smooth', 'Dense'],
      seat: 'Chest, lungs, throat, head, joints',
      functions: ['Growth', 'Stability', 'Lubrication', 'Immunity', 'Memory']
    }
  },

  saptadhatu: [
    { id: 'rasa', name: 'Rasa', english: 'Plasma', function: 'Nourishment' },
    { id: 'rakta', name: 'Rakta', english: 'Blood', function: 'Oxygenation' },
    { id: 'mamsa', name: 'Mamsa', english: 'Muscle', function: 'Movement' },
    { id: 'meda', name: 'Meda', english: 'Fat', function: 'Lubrication' },
    { id: 'asthi', name: 'Asthi', english: 'Bone', function: 'Support' },
    { id: 'majja', name: 'Majja', english: 'Marrow', function: 'Nourishment' },
    { id: 'shukra', name: 'Shukra', english: 'Reproductive', function: 'Reproduction' }
  ],

  shodhana: {
    name: 'Purification Therapy',
    procedures: [
      { name: 'Vamana', english: 'Therapeutic Emesis', indications: ['Kapha disorders', 'Asthma', 'Skin diseases'] },
      { name: 'Virechana', english: 'Therapeutic Purgation', indications: ['Pitta disorders', 'Liver disorders', 'Skin diseases'] },
      { name: 'Basti', english: 'Medicated Enema', indications: ['Vata disorders', 'Neurological', 'Fertility'] },
      { name: 'Nasya', english: 'Nasal Therapy', indications: ['Head disorders', 'Sinusitis', 'Mental disorders'] },
      { name: 'Raktamokshana', english: 'Bloodletting', indications: ['Skin diseases', 'Pitta disorders'] }
    ],
    purvaKarma: [
      { name: 'Deepana', english: 'Appetite Enhancement' },
      { name: 'Pachana', english: 'Ama Digestion' },
      { name: 'Snehana', english: 'Oleation' },
      { name: 'Swedana', english: 'Fomentation' }
    ]
  },

  pathyaApathya: {
    pathya: [
      'Barley (Yava)',
      'Green gram (Mudga)',
      'Bitter vegetables',
      'Old rice',
      'Honey',
      'Ghee in moderation',
      'Turmeric',
      'Ginger'
    ],
    apathya: [
      'New grains',
      'Excessive sleep',
      'Sedentary lifestyle',
      'Curds at night',
      'Jaggery',
      'Fried foods',
      'Heavy meats'
    ]
  }
}

export const KEY_CONCEPTS = {
  trisutra: ['Hetu (causes)', 'Linga (signs and symptoms)', 'Aushadha (medicine)'],
  TrayodashaVidhana: '13 methods of diagnosis and treatment',
  ashthavidhaPariksha: ['Naadi (Pulse)', 'Mootra (Urine)', 'Mala (Stool)', 'Jivha (Tongue)', 'Drik (Eyes)', 'Shabda (Voice)', 'Sparsh (Skin)', 'Aakriti (Body build)'],
  agrya: '155 best entities in their category',
  shadPadartha: 'Six basic principles for direct knowledge'
}

export const CHAPTER_SUMMARY = {
  'Sutra Sthana': {
    totalChapters: 30,
    focus: 'Fundamental principles, daily regimen, disease classification, treatment principles, dietetics',
    keyChapters: [
      'Deerghanjiviteeya - Tridosha, Rasa, Six principles',
      'Matrashiteeya - Daily regimen (Dinacharya)',
      'Tasyashiteeya - Seasonal regimen (Ritucharya)',
      'Snehadhyaya - Oleation therapy',
      'Swedadhyaya - Fomentation therapy'
    ]
  },
  'Chikitsa Sthana': {
    totalChapters: 30,
    focus: 'Treatment of all diseases with detailed formulations',
    keyChapters: [
      'Rasayana - Rejuvenation',
      'Vajikarana - Fertility',
      'Jwara - Fever',
      'Prameha - Diabetes/Urinary',
      'Kushtha - Skin diseases',
      'Unmada - Mental disorders',
      'Vata Vyadhi - Neurological disorders'
    ]
  }
}