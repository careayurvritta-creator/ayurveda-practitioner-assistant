/**
 * Sushruta Samhita — Classical surgical/anatomical Ayurvedic text
 * Data loaded from scraped Planet Ayurveda chapters + comprehensive classical knowledge
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load scraped chapter data
export interface SushrutaScrapedChapter {
  id: string;
  name: string;
  sthana: string;
  chapterNumber: number;
  url: string;
  contentLength: number;
  sections: Record<string, string>;
  fullContent: string;
}

let _scrapedChapters: SushrutaScrapedChapter[] = [];
try {
  const chaptersPath = resolve(__dirname, '..', 'sushruta-samhita', 'all-chapters.json');
  _scrapedChapters = JSON.parse(readFileSync(chaptersPath, 'utf-8'));
} catch {
  console.warn('Warning: sushruta-samhita/all-chapters.json not found. Run scrape-sushruta-samhita.ts first.');
}

export const SUSHRUTA_SCRAPED_CHAPTERS = _scrapedChapters;

export interface SurgicalProcedure {
  name: string
  sanskrit: string
  indication: string
  procedure: string[]
  instruments: string[]
  complications: string[]
  postOperative: string[]
}

export interface AnatomyDescription {
  structure: string
  sanskrit: string
  description: string
  clinicalSignificance: string
}

export interface SushrutaShloka {
  number: string
  sanskrit?: string
  translation: string
  commentary?: string
}

export interface SushrutaTopic {
  title: string
  content: string
  clinicalRelevance?: string
}

export interface SushrutaTreatmentProtocol {
  condition: string
  treatment: string
  herbs: string[]
  dosage: string
  duration: string
  precautions: string[]
}

export interface SushrutaChapter {
  id: string
  sthana: string
  chapterNumber: number
  name: string
  sanskrit?: string
  english: string
  summary: string
  keyConcepts: string[]
  shlokas: SushrutaShloka[]
  topics: SushrutaTopic[]
  doshaDiscussion: string[]
  treatmentProtocols?: SushrutaTreatmentProtocol[]
  treatmentPrinciples?: string[]
  dietaryGuidelines?: string[]
  diseaseDescriptions?: Array<{
    name: string
    sanskrit: string
    etiology: string
    symptoms: string[]
    prognosis: string
    treatment: string
  }>
  clinicalApplications: string[]
  surgicalProcedures?: SurgicalProcedure[]
  anatomyDescriptions?: AnatomyDescription[]
}

/**
 * Comprehensive Sushruta Samhita knowledge — classical surgical/anatomical text
 * Source: Sushruta Samhita (Brihat Trayi), Planet Ayurveda
 */
export const SUSHRUTA_SAMHITA = {
  structure: {
    totalSthanas: 6,
    totalChapters: 120,
    sections: [
      { id: 'sutrasthana', name: 'Sutra Sthana', english: 'Fundamental Principles', chapters: 46 },
      { id: 'nidanasthana', name: 'Nidana Sthana', english: 'Pathological Diagnosis', chapters: 16 },
      { id: 'sharirasthana', name: 'Sharira Sthana', english: 'Human Anatomy & Embryology', chapters: 20 },
      { id: 'chikitsasthana', name: 'Chikitsa Sthana', english: 'Therapeutic Principles', chapters: 20 },
      { id: 'kalpasthana', name: 'Kalpa Sthana', english: 'Pharmaceutical Preparations', chapters: 12 },
      { id: 'uttaratantra', name: 'Uttara Tantra', english: 'Supplementary Sections', chapters: 6 }
    ]
  },

  shalya: {
    name: 'Shalya Tantra',
    english: 'Surgical Science',
    definition: 'The branch of Ayurveda dealing with surgical procedures, removal of foreign bodies, and management of injuries',
    importance: 'Sushruta is considered the Father of Surgery — described 300+ surgical procedures and 120 surgical instruments',
    instruments: [
      { name: 'Shastris', english: 'Sharp instruments', types: ['Scalpels (Kartari)', 'Scissors (Nakhastra)', 'Needles (Sootri)'] },
      { name: 'Yantras', english: 'Blunt instruments', types: ['Forceps (Shringa)', 'Probes (Pratishedha)', 'Elevators (Nadidanta)'] },
      { name: 'Kshara', english: 'Alkali preparations', types: ['Yavakshara', 'Sauvarchala', 'Vatsanabha'] },
      { name: 'Agni', english: 'Cautery instruments', types: ['Panchaloha', 'Iron', 'Silver'] }
    ],
    majorProcedures: [
      'Kshara Karma (Alkaline cauterization)',
      'Agni Karma (Thermal cauterization)',
      'Raktamokshana (Bloodletting)',
      'Bhutavidya (Management of malignant tumors)',
      'Vranabhedana (Wound management)',
      'Sandhana (Union/binding of fractured bones)',
      'Bhedana (Incision/drainage)',
      'Pachana (Suppuration/ripening)',
      'Vrana Prakarana (Wound classification and treatment)',
      'Shastrakarma (Use of surgical instruments)',
      'Jalaukavacharana (Leech therapy)',
      'Pracchana (Scarification)'
    ]
  },

  anatomy: {
    name: 'Sharira Rachana',
    english: 'Human Anatomy',
    definitions: [
      { concept: 'Purusha', english: 'Human body — composed of 5 Mahabhutas, 3 Doshas, 7 Dhatus, 3 Malas' },
      { concept: 'Garbha', english: 'Embryology — formation of fetus from union of Shukra and Artava' },
      { concept: 'Marma', english: 'Vital points — 107 vital points in the body for surgical consideration' },
      { concept: 'Siragata', english: 'Blood vessel system — arteries, veins, capillaries' },
      { concept: 'Nadigata', english: 'Nervous system — nerve pathways and their distributions' }
    ],
    marmaVitalPoints: [
      { name: 'Adhipati Marma', location: 'Crown of head', injury: 'Death or loss of consciousness' },
      { name: 'Manya Marma', location: 'Neck (anterior)', injury: 'Difficulty swallowing, speech loss' },
      { name: 'Kantya Marma', location: 'Throat', injury: 'Loss of voice, respiratory distress' },
      { name: 'Apanga Marma', location: 'Outer corner of eye', injury: 'Blindness' },
      { name: 'Shankha Marma', location: 'Temple', injury: 'Unconsciousness, death' },
      { name: 'Bhrikuti Marma', location: 'Eyebrow region', injury: 'Facial paralysis' },
      { name: 'Hridaya Marma', location: 'Heart region', injury: 'Cardiac arrest, death' },
      { name: 'Stana Mulam', location: 'Nipple region', injury: 'Breast disorders, cardiac issues' },
      { name: 'Nabhi Marma', location: 'Umbilicus', injury: 'Intestinal damage, death' },
      { name: 'Kati Marma', location: 'Lower back/pelvis', injury: 'Paralysis, infertility' },
      { name: 'Janu Marma', location: 'Knee joint', injury: 'Loss of mobility' },
      { name: 'Indravasti Marma', location: 'Inner thigh', injury: 'Urinary disorders, death' }
    ]
  },

  chikitsa: {
    name: 'Sushruta Chikitsa',
    english: 'Therapeutic Principles',
    principles: [
      'Shodhana (Purification) — Panchakarma procedures',
      'Shamana (Pacification) — Internal medications',
      'Bahya Chikitsa (External therapy) — Lepa, Parisheka, Avagaha',
      'Shastra Karma (Surgical intervention)',
      'Kshara Karma (Alkaline therapy)',
      'Agni Karma (Cautery therapy)'
    ],
    treatmentProtocols: [
      {
        condition: 'Vrana (Wounds)',
        stages: ['Ama (Unripe)', 'Pachyamana (Ripening)', 'Pakva (Ripe)'],
        treatment: 'According to stage — Pachana, Shastra Karma, wound dressing',
        herbs: ['Yashtimadhu', 'Madhuyashti', 'Haridra', 'Nimba']
      },
      {
        condition: 'Bhagandara (Fistula-in-ano)',
        stages: ['Sotovija', 'Parisravi', 'Puyapravrutta'],
        treatment: 'Kshara Karma, Agni Karma, Surgical excision',
        herbs: ['Triphala', 'Haridra', 'Khadira']
      },
      {
        condition: 'Arsha (Hemorrhoids)',
        stages: ['Vataja', 'Pittaja', 'Kaphaja', 'Sannipataja'],
        treatment: 'Kshara Karma, Agni Karma, Surgical removal (Kshara Sutra)',
        herbs: ['Aragvadha', 'Haridra', 'Nimba', 'Triphala']
      },
      {
        condition: 'Galaganda (Goiter)',
        stages: ['Medoja', 'Kaphaja', 'Raktaja'],
        treatment: 'Shastrakarma (Surgical excision), Kshara',
        herbs: ['Kanchanara', 'Guggulu', 'Varuna']
      },
      {
        condition: 'Nadi Vrana (Sinus tract)',
        stages: ['Sushka', 'Sravi', 'Vriddhi'],
        treatment: 'Pachana, Shastra Karma, wound packing',
        herbs: ['Haridra', 'Yashtimadhu', 'Guggulu']
      }
    ]
  },

  doshaDiscussion: [
    'Sushruta emphasizes the role of Doshas in surgical conditions',
    'Vata causes pain, stiffness, and neurological complications',
    'Pitta causes inflammation, suppuration, and bleeding',
    'Kapha causes swelling, obstruction, and cyst formation',
    'Sannipataja (all three doshas) — most severe surgical conditions'
  ],

  keyConcepts: [
    'Vedotpati — Origin of Ayurveda and its eight branches',
    'Shishyopanayaniya — Student initiation and ethical training',
    'Yantravidhi — Classification of surgical instruments',
    'Shastra Avacharana — Rules for using surgical instruments',
    'Kshara Karma — Alkaline cauterization technique',
    'Jalaukavacharana — Leech therapy application',
    'Vranaprakarana — Comprehensive wound management',
    'Marma Vidya — Knowledge of vital points for surgical safety',
    'Raktamokshana — Bloodletting techniques',
    'Sandhana Karma — Fracture management and bone setting'
  ]
}

/**
 * Comprehensive Sushruta chapters with detailed knowledge
 */
export const SUSHRUTA_CHAPTERS: SushrutaChapter[] = [
  {
    id: 'sushruta-sutra-1',
    sthana: 'Sutra Sthana',
    chapterNumber: 1,
    name: 'Vedotpati Adhyaya',
    sanskrit: 'वेदोत्पत्ति अध्याय',
    english: 'Origin of Ayurveda',
    summary: 'Origin of Ayurveda from Lord Brahma, division into 8 branches, importance of Shalya Tantra (Surgery). Describes the definition of Ayurveda, purpose of medical science, and the training of surgical students.',
    keyConcepts: [
      'Ayurveda is a part of Atharva Veda',
      'Eight branches of Ayurveda',
      'Lord Brahma as the originator',
      'Shalya Tantra as the foremost branch',
      'Purpose: maintaining health of healthy and treating sick'
    ],
    shlokas: [
      {
        number: '1.1',
        sanskrit: 'अथातो धन्वन्तरिः कृपया प्रत्यागच्छन् स्वांशेन व्यक्तो भूत्वा भैषज्यविधिमुपदेक्ष्यते',
        translation: 'Now therefore, Dhanvantari, having returned through compassion, manifesting as a part of himself, will explain the science of medicine',
        commentary: 'This is the opening verse establishing the divine origin of Ayurveda through Dhanvantari'
      },
      {
        number: '1.2',
        sanskrit: 'समस्तशास्त्रोपदेशेष्वविवादः समन्त्रकः',
        translation: 'In all teachings of science, there should be no dispute and it should be recited with proper mantras',
        commentary: 'Emphasizes the importance of proper recitation and reverence for medical knowledge'
      }
    ],
    topics: [
      {
        title: 'Origin of Ayurveda',
        content: 'Ayurveda originated from Lord Brahma, who had one lakh verses in one thousand chapters. Due to short human lifespan, it was divided into eight branches for easier learning.',
        clinicalRelevance: 'Understanding the philosophical foundation of Ayurveda helps practitioners approach treatment with proper mindset'
      },
      {
        title: 'Eight Branches',
        content: 'Shalya Tantra (Surgery), Shalakya Tantra (ENT and Eye), Kaya Chikitsa (Internal Medicine), Kaumarabhritya (Pediatrics), Agada Tantra (Toxicology), Bhootavidya (Psychiatry), Rasayana (Rejuvenation), Vajikarana (Aphrodisiac)',
        clinicalRelevance: 'Each branch addresses specific body systems and disease categories'
      }
    ],
    doshaDiscussion: ['Ayurveda is based on the balance of three doshas', 'Disease occurs when doshas are vitiated beyond normal limits'],
    treatmentPrinciples: ['Treatment should address root cause (Nidana)', 'Both preventive and curative approaches are emphasized'],
    clinicalApplications: ['Foundation for all Ayurvedic practice', 'Ethical guidelines for practitioners']
  },
  {
    id: 'sushruta-sutra-2',
    sthana: 'Sutra Sthana',
    chapterNumber: 2,
    name: 'Shishyopanayaniya Adhyaya',
    sanskrit: 'शिष्योपनयनीय अध्याय',
    english: 'Student Initiation Ceremony',
    summary: 'Qualities of medical students, initiation ceremony, ethical conduct of teachers and students, rules for practicing medicine.',
    keyConcepts: [
      'Student selection criteria',
      'Initiation ceremony rituals',
      'Teacher-student relationship',
      'Ethical conduct in medical practice',
      'Qualities of a good physician'
    ],
    shlokas: [
      {
        number: '2.1',
        translation: 'The student should be a Brahmin, Kshatriya, or Vaishya with good character, memory, and intellect',
        commentary: 'Establishes the qualifications required for medical training'
      }
    ],
    topics: [
      {
        title: 'Student Qualities',
        content: 'The student should possess good character, humble nature, sharp intellect, good memory, and be free from diseases. They should be from noble families and have dedication to service.',
        clinicalRelevance: 'Proper training ensures competent and ethical practitioners'
      },
      {
        title: 'Teacher Qualities',
        content: 'The teacher should be learned, experienced, compassionate, and capable of imparting knowledge clearly. They should be free from anger, greed, and ego.',
        clinicalRelevance: 'Quality of teaching directly impacts quality of future practitioners'
      }
    ],
    doshaDiscussion: [],
    treatmentPrinciples: ['Ethical practice is the foundation of medical treatment'],
    clinicalApplications: ['Establishes professional standards for Ayurvedic practitioners']
  },
  {
    id: 'sushruta-sutra-6',
    sthana: 'Sutra Sthana',
    chapterNumber: 6,
    name: 'Ritucharya Adhyaya',
    sanskrit: 'ऋतुचर्य अध्याय',
    english: 'Seasonal Regimen',
    summary: 'Description of six seasons, their characteristics, dietary and lifestyle recommendations for each season to maintain health.',
    keyConcepts: [
      'Six seasons (Ritus) and their qualities',
      'Seasonal dietary guidelines',
      'Seasonal lifestyle recommendations',
      'Prevention of seasonal diseases',
      'Adaptation to environmental changes'
    ],
    shlokas: [
      {
        number: '6.1',
        translation: 'The wise physician should know the qualities of each season and prescribe regimen accordingly',
        commentary: 'Emphasizes the importance of seasonal adaptation for health maintenance'
      }
    ],
    topics: [
      {
        title: 'Six Seasons',
        content: 'Shishira (Winter), Vasanta (Spring), Grishma (Summer), Varsha (Monsoon), Sharad (Autumn), Hemanta (Late Winter). Each season has specific qualities affecting doshas.',
        clinicalRelevance: 'Seasonal regimen is fundamental to disease prevention in Ayurveda'
      },
      {
        title: 'Seasonal Diet',
        content: 'Each season requires specific dietary adjustments — heavier foods in winter, lighter foods in summer, specific tastes to balance seasonal dosha aggravation.',
        clinicalRelevance: 'Proper seasonal diet prevents dosha imbalance and disease'
      }
    ],
    doshaDiscussion: [
      'Vata aggravates in Varsha (monsoon) and Sharad (autumn)',
      'Pitta aggravates in Grishma (summer) and Sharad (autumn)',
      'Kapha aggravates in Vasanta (spring) and Hemanta (late winter)'
    ],
    dietaryGuidelines: [
      'Heavy, nourishing foods in winter (Hemanta, Shishira)',
      'Light, dry foods in summer (Grishma)',
      'Bitter and astringent tastes in monsoon (Varsha)',
      'Sweet, bitter tastes in autumn (Sharad)'
    ],
    treatmentPrinciples: ['Seasonal adaptation prevents disease', 'Treatment should consider seasonal factors'],
    clinicalApplications: ['Seasonal regimen is a cornerstone of preventive Ayurveda']
  },
  {
    id: 'sushruta-sutra-7',
    sthana: 'Sutra Sthana',
    chapterNumber: 7,
    name: 'Yantravidhi Adhyaya',
    sanskrit: 'यन्त्रविधि अध्याय',
    english: 'Classification of Surgical Instruments',
    summary: 'Detailed classification of surgical instruments (Yantras), their types, uses, and manufacturing principles.',
    keyConcepts: [
      'Types of Yantras (instruments)',
      'Manufacturing principles',
      'Maintenance and sterilization',
      'Proper use techniques',
      'Instrument selection for procedures'
    ],
    shlokas: [
      {
        number: '7.1',
        translation: 'Surgical instruments should be made of good quality metal, properly sharpened, and well-maintained',
        commentary: 'Quality of instruments directly impacts surgical outcomes'
      }
    ],
    topics: [
      {
        title: 'Types of Yantras',
        content: 'Musha Yantra (Crab-forceps), Shanku Yantra (Probe), Nalika Yantra (Cannula), Putra Yantra (Bolus-holder), among others.',
        clinicalRelevance: 'Each instrument is designed for specific surgical tasks'
      }
    ],
    doshaDiscussion: [],
    treatmentPrinciples: ['Proper instrument selection ensures surgical success', 'Instrument quality affects healing'],
    clinicalApplications: ['Foundation for surgical practice in Ayurveda']
  },
  {
    id: 'sushruta-sutra-8',
    sthana: 'Sutra Sthana',
    chapterNumber: 8,
    name: 'Shastra Avacharana Adhyaya',
    sanskrit: 'शस्त्र आचरण अध्याय',
    english: 'Rules for Using Surgical Instruments',
    summary: 'Principles of using surgical instruments, indications for incision, principles of wound management.',
    keyConcepts: [
      'Indications for surgical intervention',
      'Incision principles',
      'Contraindications for surgery',
      'Post-operative care',
      'Wound healing stages'
    ],
    shlokas: [
      {
        number: '8.1',
        translation: 'Incision should be made in the direction of skin lines, avoiding vital points',
        commentary: 'Proper incision technique prevents complications'
      }
    ],
    topics: [
      {
        title: 'Incision Principles',
        content: 'Incisions should follow skin lines, avoid vital points (Marma), be of appropriate size, and made with proper instruments.',
        clinicalRelevance: 'Proper incision technique is crucial for wound healing'
      }
    ],
    doshaDiscussion: ['Surgical decisions should consider dosha status of patient'],
    treatmentPrinciples: ['Surgery is indicated when medical treatment fails', 'Proper patient selection is key'],
    clinicalApplications: ['Guidelines for surgical decision-making']
  },
  {
    id: 'sushruta-sutra-9',
    sthana: 'Sutra Sthana',
    chapterNumber: 9,
    name: 'Yogyasutriya Adhyaya',
    sanskrit: 'योग्यसूत्रीय अध्याय',
    english: 'Proper Use of Bandages and Sutures',
    summary: 'Techniques of bandaging, suturing, and wound dressing principles.',
    keyConcepts: [
      'Bandaging techniques',
      'Suturing methods',
      'Wound dressing principles',
      'Post-operative wound care',
      'Complications of improper bandaging'
    ],
    shlokas: [
      {
        number: '9.1',
        translation: 'Bandages should be clean, soft, and applied with proper tension',
        commentary: 'Improper bandaging can cause complications'
      }
    ],
    topics: [
      {
        title: 'Bandaging Techniques',
        content: 'Different types of bandages for different body parts — head, trunk, extremities. Proper tension, material selection, and application technique.',
        clinicalRelevance: 'Proper bandaging supports wound healing and prevents complications'
      }
    ],
    doshaDiscussion: [],
    treatmentPrinciples: ['Wound care is essential for proper healing', 'Prevention of complications through proper technique'],
    clinicalApplications: ['Practical surgical skills for wound management']
  },
  {
    id: 'sushruta-sutra-11',
    sthana: 'Sutra Sthana',
    chapterNumber: 11,
    name: 'Ksharapaka Vidhi Adhyaya',
    sanskrit: 'क्षारपाक विधि अध्याय',
    english: 'Alkaline Preparation and Application',
    summary: 'Preparation of Kshara (alkaline preparations), their types, applications, and therapeutic uses.',
    keyConcepts: [
      'Types of Kshara',
      'Preparation methods',
      'Therapeutic applications',
      'Kshara Karma procedure',
      'Contraindications'
    ],
    shlokas: [
      {
        number: '11.1',
        translation: 'Kshara should be prepared from specific plants and applied according to the condition',
        commentary: 'Kshara Karma is a major surgical procedure in Ayurveda'
      }
    ],
    topics: [
      {
        title: 'Types of Kshara',
        content: 'Yavakshara (barley alkali), Sauvarchala (rock salt alkali), Vatsanabha (aconite-based). Each has specific therapeutic properties.',
        clinicalRelevance: 'Kshara is used for cauterization, wound healing, and surgical procedures'
      }
    ],
    doshaDiscussion: ['Kshara is primarily used for Kapha conditions', 'Can be used for Pitta conditions when properly prepared'],
    treatmentPrinciples: ['Kshara Karma is indicated for growths, fistulae, hemorrhoids'],
    clinicalApplications: ['Major surgical technique still used in modern Ayurvedic surgery']
  },
  {
    id: 'sushruta-sutra-13',
    sthana: 'Sutra Sthana',
    chapterNumber: 13,
    name: 'Jalaukavacharaniya Adhyaya',
    sanskrit: 'जलौकावचरणीय अध्याय',
    english: 'Leech Therapy',
    summary: 'Detailed description of leech therapy (Jalaukavacharana), types of leeches, indications, contraindications, and procedure.',
    keyConcepts: [
      'Types of leeches (good and bad)',
      'Indications for leech therapy',
      'Contraindications',
      'Procedure details',
      'Post-leech care'
    ],
    shlokas: [
      {
        number: '13.1',
        translation: 'Leeches that are black with brown stripes, smell like lotus, and move gracefully are best for therapy',
        commentary: 'Selection of proper leech is crucial for therapeutic success'
      }
    ],
    topics: [
      {
        title: 'Leech Selection',
        content: 'Good leeches: black, smell of lotus, move gracefully, have triangular mouth. Bad leeches: foul-smelling, sluggish, with round mouth.',
        clinicalRelevance: 'Proper leech selection ensures therapeutic efficacy'
      },
      {
        title: 'Indications',
        content: 'Skin diseases, blood disorders, localized pain, inflammation, varicose veins, non-healing wounds.',
        clinicalRelevance: 'Leech therapy is effective for Pitta and Rakta conditions'
      },
      {
        title: 'Procedure',
        content: 'Apply leech to affected area, allow it to engorge with blood, remove by applying turmeric or mustard. Clean wound and bandage.',
        clinicalRelevance: 'Proper technique prevents complications'
      }
    ],
    doshaDiscussion: [
      'Leech therapy is primarily for Pitta and Rakta (blood) disorders',
      'Contraindicated in Vata and Kapha dominant conditions',
      'Best applied during Grishma (summer) and Sharad (autumn) seasons'
    ],
    treatmentPrinciples: ['Bloodletting removes vitiated Pitta and Rakta', 'Leech saliva has anti-inflammatory properties'],
    clinicalApplications: ['Still widely used in modern Ayurvedic practice for skin diseases and blood disorders']
  },
  {
    id: 'sushruta-sutra-24',
    sthana: 'Sutra Sthana',
    chapterNumber: 24,
    name: 'Vyadhi Samuddesheeya Adhyaya',
    sanskrit: 'व्याधि समुद्देशीय अध्याय',
    english: 'Classification of Diseases',
    summary: 'Comprehensive classification of diseases, their causes, and general treatment principles.',
    keyConcepts: [
      'Disease classification system',
      'Causes of diseases',
      'General treatment approach',
      'Prognosis determination',
      'Patient assessment'
    ],
    shlokas: [
      {
        number: '24.1',
        translation: 'Diseases are classified according to their cause, site, and dosha involvement',
        commentary: 'Systematic classification aids in proper diagnosis and treatment'
      }
    ],
    topics: [
      {
        title: 'Disease Classification',
        content: 'Diseases classified by: Nidana (cause), Dosha involved, Dhatu affected, Srotas affected, and clinical presentation.',
        clinicalRelevance: 'Proper classification guides treatment selection'
      }
    ],
    doshaDiscussion: ['All diseases involve dosha vitiation', 'Treatment must address the specific dosha imbalance'],
    treatmentPrinciples: ['Treat the cause, not just symptoms', 'Consider the whole patient, not just the disease'],
    clinicalApplications: ['Framework for diagnosis and treatment planning']
  },
  {
    id: 'sushruta-sutra-25',
    sthana: 'Sutra Sthana',
    chapterNumber: 25,
    name: 'Ashtavidha Shastra Karma Adhyaya',
    sanskrit: 'अष्टविध शस्त्र कर्म अध्याय',
    english: 'Eight Types of Surgical Procedures',
    summary: 'Description of eight major surgical procedures — Bhedana, Chhedana, Vyadhana, Aachchhedana, Ksharanam, Agnikarma, Bheshajam, and Yantra karma.',
    keyConcepts: [
      'Eight surgical procedures',
      'Indications for each',
      'Techniques and principles',
      'Post-operative care',
      'Complications and management'
    ],
    shlokas: [
      {
        number: '25.1',
        translation: 'The eight types of surgical procedures are Bhedana (puncturing), Chhedana (excising), Vyadhana (puncturing), Aachchhedana (incising), Ksharanam (cauterizing), Agnikarma (burning), Bheshajam (medicating), and Yantra karma (using instruments)',
        commentary: 'These form the foundation of Ayurvedic surgical practice'
      }
    ],
    topics: [
      {
        title: 'Eight Surgical Procedures',
        content: 'Bhedana (puncturing abscesses), Chhedana (excising growths), Vyadhana (puncturing for drainage), Aachchhedana (making incisions), Ksharanam (alkaline cauterization), Agnikarma (thermal cauterization), Bheshajam (medication), Yantra karma (instrument use).',
        clinicalRelevance: 'These procedures cover the range of surgical interventions'
      }
    ],
    doshaDiscussion: ['Surgical procedures are selected based on dosha involvement'],
    treatmentPrinciples: ['Surgery is the last resort after medical treatment fails', 'Proper patient selection is crucial'],
    clinicalApplications: ['Core surgical techniques of Ayurveda']
  },
  {
    id: 'sushruta-sutra-26',
    sthana: 'Sutra Sthana',
    chapterNumber: 26,
    name: 'Pranashta Shalya Vijnaniya Adhyaya',
    sanskrit: 'प्रानश्त शल्य विज्ञानीय अध्याय',
    english: 'Extraction of Embedded Foreign Bodies',
    summary: 'Techniques for removing embedded foreign bodies like arrows, weapons, and other objects.',
    keyConcepts: [
      'Types of foreign bodies',
      'Extraction techniques',
      'Instruments for removal',
      'Complications of retained foreign bodies',
      'Post-extraction care'
    ],
    shlokas: [
      {
        number: '26.1',
        translation: 'Foreign bodies should be removed carefully using appropriate instruments, considering their shape and location',
        commentary: 'Improper removal can cause more damage than the original injury'
      }
    ],
    topics: [
      {
        title: 'Extraction Techniques',
        content: 'Use of forceps, probes, and specialized instruments. Careful extraction along the path of entry. Avoiding damage to surrounding tissues.',
        clinicalRelevance: 'Emergency surgical skill for trauma management'
      }
    ],
    doshaDiscussion: ['Trauma can cause Vata aggravation', 'Infection risk requires Pitta consideration'],
    treatmentPrinciples: ['Remove foreign body as soon as possible', 'Prevent infection and promote healing'],
    clinicalApplications: ['Essential trauma surgical skills']
  },
  {
    id: 'sushruta-sutra-27',
    sthana: 'Sutra Sthana',
    chapterNumber: 27,
    name: 'Shalyapanayaniya Adhyaya',
    sanskrit: 'शल्यपनयनीय अध्याय',
    english: 'Removal of Weapon Fragments',
    summary: 'Specialized techniques for removing broken weapon fragments and arrowheads.',
    keyConcepts: [
      'Detection of hidden fragments',
      'Specialized extraction tools',
      'Preventing fragment migration',
      'Wound management after extraction'
    ],
    shlokas: [
      {
        number: '27.1',
        translation: 'When a weapon fragment is broken inside the body, it should be located and removed carefully',
        commentary: 'Hidden fragments can cause chronic problems if not properly removed'
      }
    ],
    topics: [
      {
        title: 'Fragment Detection',
        content: 'Use of probes, palpation, and observation to locate fragments. Consider the direction of entry and potential migration.',
        clinicalRelevance: 'Proper detection prevents repeated surgeries'
      }
    ],
    doshaDiscussion: [],
    treatmentPrinciples: ['Complete removal is essential', 'Prevent complications through careful technique'],
    clinicalApplications: ['Specialized trauma surgery techniques']
  },
  {
    id: 'sushruta-sutra-28',
    sthana: 'Sutra Sthana',
    chapterNumber: 28,
    name: 'Viparita Aviparita Vrana Vijnaniya Adhyaya',
    sanskrit: 'विपरीताविपरीत व्रण विज्ञानीय अध्याय',
    english: 'Proper and Improper Wound Management',
    summary: 'Comparison of proper and improper wound management, complications of wrong treatment.',
    keyConcepts: [
      'Proper wound assessment',
      'Stages of wound healing',
      'Complications of improper treatment',
      'Wound dressing techniques',
      'Factors affecting healing'
    ],
    shlokas: [
      {
        number: '28.1',
        translation: 'A wound treated properly at the right time heals well; a wound treated improperly leads to complications',
        commentary: 'The importance of proper wound management cannot be overstated'
      }
    ],
    topics: [
      {
        title: 'Wound Stages',
        content: 'Ama (unripe), Pachyamana (ripening), Pakva (ripe). Treatment varies according to stage.',
        clinicalRelevance: 'Stage-appropriate treatment is essential for healing'
      }
    ],
    doshaDiscussion: ['Wound healing is affected by dosha status', 'Vata delays healing, Pitta causes inflammation, Kapha causes suppuration'],
    treatmentPrinciples: ['Assess wound stage before treatment', 'Use stage-appropriate medications and techniques'],
    clinicalApplications: ['Foundation for wound care in Ayurveda']
  },
  {
    id: 'sushruta-sutra-29',
    sthana: 'Sutra Sthana',
    chapterNumber: 29,
    name: 'Viparita Swapna Nidarshaniya Adhyaya',
    sanskrit: 'विपरीत स्वप्न निदर्शनीय अध्याय',
    english: 'Dreams and Prognostication',
    summary: 'Significance of dreams in diagnosis and prognosis, interpretation of various dream types.',
    keyConcepts: [
      'Dreams as diagnostic indicators',
      'Types of prophetic dreams',
      'Dream interpretation for prognosis',
      'Dosha-related dreams'
    ],
    shlokas: [
      {
        number: '29.1',
        translation: 'Dreams can indicate the state of doshas and predict the course of disease',
        commentary: 'Dreams provide insight into the psychological and physiological state'
      }
    ],
    topics: [
      {
        title: 'Dream Interpretation',
        content: 'Dreams of water indicate Kapha, fire indicates Pitta, wind indicates Vata. Dreams of flying, void indicate Vata. Dreams of water, swimming indicate Kapha.',
        clinicalRelevance: 'Dreams can provide additional diagnostic information'
      }
    ],
    doshaDiscussion: ['Dreams reflect dosha state', 'Vata dreams: flying, void, darkness, running', 'Pitta dreams: fire, sun, lightning, anger', 'Kapha dreams: water, clouds, sweetness, stability'],
    clinicalApplications: ['Unique diagnostic tool in Ayurveda']
  },
  {
    id: 'sushruta-sutra-30',
    sthana: 'Sutra Sthana',
    chapterNumber: 30,
    name: 'Panchendriyartha Vipratipatti Adhyaya',
    sanskrit: 'पञ्चेन्द्रियार्थ विप्रतिपत्ति अध्याय',
    english: 'Disorders of Sense Organs',
    summary: 'Comprehensive description of sense organ disorders, their causes, and treatments.',
    keyConcepts: [
      'Eye disorders and treatment',
      'Ear disorders and treatment',
      'Nose disorders and treatment',
      'Tongue disorders and treatment',
      'Skin disorders and treatment'
    ],
    shlokas: [
      {
        number: '30.1',
        translation: 'The five sense organs are the windows to the mind; their disorders affect the whole being',
        commentary: 'Sense organ health is integral to overall well-being'
      }
    ],
    topics: [
      {
        title: 'Eye Disorders',
        content: 'Types of eye diseases, their causes (dosha-related), symptoms, and treatments including surgical interventions.',
        clinicalRelevance: 'Shalakya Tantra (ENT and Eye) is a major surgical specialty'
      },
      {
        title: 'Ear Disorders',
        content: 'Types of ear diseases, causes, symptoms, and treatments including procedures for ear disorders.',
        clinicalRelevance: 'Ear surgery is one of the contributions of Sushruta'
      }
    ],
    doshaDiscussion: [
      'Eye disorders are primarily Pitta-related',
      'Ear disorders involve Vata and Kapha',
      'Nose disorders involve Kapha and Vata',
      'Tongue disorders involve Pitta and Kapha',
      'Skin disorders involve all three doshas'
    ],
    clinicalApplications: ['Foundation for ENT and ophthalmic practice in Ayurveda']
  }
]

/**
 * Search Sushruta Samhita chapters
 */
export function searchSushruta(query: string): string[] {
  const lowerQuery = query.toLowerCase()
  const matches: string[] = []

  // Search scraped chapters
  for (const chapter of _scrapedChapters) {
    const nameMatch = chapter.name.toLowerCase().includes(lowerQuery)
    const contentMatch = chapter.fullContent.toLowerCase().includes(lowerQuery)
    const sectionMatch = Object.values(chapter.sections).some(s => s.toLowerCase().includes(lowerQuery))

    if (nameMatch || contentMatch || sectionMatch) {
      const preview = chapter.fullContent.slice(0, 500).replace(/\n/g, ' ').trim()
      matches.push(`${chapter.sthana} Ch.${chapter.chapterNumber} – ${chapter.name}\n${preview}`)
    }
  }

  // Search structured chapters
  for (const chapter of SUSHRUTA_CHAPTERS) {
    const nameMatch = chapter.name.toLowerCase().includes(lowerQuery) ||
      (chapter.english && chapter.english.toLowerCase().includes(lowerQuery))
    const summaryMatch = chapter.summary.toLowerCase().includes(lowerQuery)
    const conceptMatch = chapter.keyConcepts.some(kc => kc.toLowerCase().includes(lowerQuery))

    if (nameMatch || summaryMatch || conceptMatch) {
      matches.push(`${chapter.sthana} Ch.${chapter.chapterNumber} – ${chapter.name} (${chapter.english}): ${chapter.summary}`)
    }
  }

  // Search surgical procedures
  if (SUSHRUTA_SAMHITA.shalya) {
    for (const proc of SUSHRUTA_SAMHITA.shalya.majorProcedures) {
      if (proc.toLowerCase().includes(lowerQuery)) {
        matches.push(`Surgical Procedure: ${proc}`)
      }
    }
  }

  // Search marma points
  if (SUSHRUTA_SAMHITA.anatomy) {
    for (const marma of SUSHRUTA_SAMHITA.anatomy.marmaVitalPoints) {
      if (marma.name.toLowerCase().includes(lowerQuery) ||
        marma.location.toLowerCase().includes(lowerQuery) ||
        marma.injury.toLowerCase().includes(lowerQuery)) {
        matches.push(`Marma Point: ${marma.name} — Location: ${marma.location}. Injury: ${marma.injury}`)
      }
    }
  }

  return matches.length > 0 ? matches : ['No direct Sushruta Samhita verses matched this filter.']
}
