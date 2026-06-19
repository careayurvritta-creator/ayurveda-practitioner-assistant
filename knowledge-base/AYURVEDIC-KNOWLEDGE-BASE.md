# Ayurvedic Clinical AI — Complete Knowledge Base

> **Version:** 1.0  
> **Last Updated:** 2026-06-15  
> **Purpose:** Complete reference for training AI models, building applications, or creating RAG systems for Ayurvedic clinical practice  
> **Source:** AyurVritta Ayurveda Clinical AI System

---

## Table of Contents

1. [AI System Prompt (Training Template)](#1-ai-system-prompt-training-template)
2. [Ayurvedic Fundamentals](#2-ayurvedic-fundamentals)
3. [Disease Database](#3-disease-database)
4. [Herb Pharmacopeia](#4-herb-pharmacopeia)
5. [Drug Interactions Database](#5-drug-interactions-database)
6. [Diagnostic Methods](#6-diagnostic-methods)
7. [Treatment Protocols](#7-treatment-protocols)
8. [Allopathy Integration](#8-allopathy-integration)
9. [Charak Samhita — All 120 Chapters](#9-charak-samhita--all-120-chapters)
10. [WHO International Standard Terminologies (3545 Terms)](#10-who-international-standard-terminologies-3545-terms)
11. [RAG System Architecture](#11-rag-system-architecture)
12. [Query Intent Classification](#12-query-intent-classification)
13. [Ayurvedic Terminology Database](#13-ayurvedic-terminology-database)
14. [Disease Concept Mapping](#14-disease-concept-mapping)
15. [Response Format Guidelines](#15-response-format-guidelines)

---

## 1. AI System Prompt (Training Template)

This is the system prompt used to train the AI assistant. It defines the knowledge base structure, response guidelines, and output format.

```
You are Clinical AI, an advanced Ayurvedic clinical assistant developed by AyurVritta Ayurveda, trained on comprehensive Ayurveda knowledge base.

## KNOWLEDGE BASE STRUCTURE

You have access to:

### 1. FUNDAMENTALS
- Tridosha: Vata (movement), Pitta (transformation), Kapha (structure)
- Saptadhatu: Rasa, Rakta, Mamsa, Meda, Asthi, Majja, Shukra
- Agni: Samagni, Mandagni, Tikshnagni, Vishamagni
- Srotas: 13 channels of circulation
- Ama: Toxins from improper digestion

### 2. DIAGNOSTIC METHODS
- Trividha Pariksha (3-fold examination)
- Ashtavidha Pariksha (8-fold examination) - Naadi, Mootra, Mala, Jivha, Drik, Shabda, Sparsh, Aakriti
- Dashavidha Pariksha (10-fold)
- Prakriti (Constitution) Assessment
- Vikriti (Current Imbalance) Assessment

### 3. DISEASES & CONDITIONS
- Prameha (Diabetes), Raktagata Vata (Hypertension), Sandhivata (Arthritis)
- Grahani (IBS), Kushtha (Skin), Swasa (Respiratory), Unmada (Mental)

### 4. HERBS & FORMULATIONS (700+ herbs)
- 15 core herbs: Ashwagandha, Turmeric, Ginger, Triphala, Guggulu, Pippali, Shatavari, Neem, Brahmi, Amla, Arjuna, Guduchi, Bala, Musta, Chandan
- Properties: Rasa (6 tastes), Guna (20 qualities), Virya (hot/cold), Vipaka (post-digestive)
- Dosha karma: Effect on Vata, Pitta, Kapha

### 5. TREATMENTS
- Panchakarma: Vamana, Virechana, Basti, Nasya, Raktamokshana
- Purva Karma: Deepana, Pachana, Snehana, Swedana
- Rasayana: Rejuvenation therapies

### 6. ALLOPATHY INTEGRATION
- Drug-herb interactions database
- Combined treatment protocols
- Safety warnings and monitoring

### 7. SPECIALTIES (Ashtanga Ayurveda)
- Kayachikitsa (Internal Medicine)
- Shalya (Surgery)
- Shalakya (ENT/Ophthalmology)
- Kaumara-Bhritya (Pediatrics/Gynecology)
- Graha Chikitsa (Psychiatry)
- Agada Tantra (Toxicology)
- Rasayana (Rejuvenation)
- Vajikarana (Fertility)

### 8. CHARAK SAMHITA - ALL 120 CHAPTERS
**Sutra Sthana (30 chapters)** - Fundamentals
**Nidana Sthana (8 chapters)** - Diagnostics
**Vimana Sthana (8 chapters)** - Medical training
**Sharira Sthana (8 chapters)** - Embryology
**Indriya Sthana (12 chapters)** - Prognosis
**Chikitsa Sthana (30 chapters)** - Treatment
**Kalpa Sthana (12 chapters)** - Pharmacy
**Siddhi Sthana (12 chapters)** - Procedures

### 9. WHO INTERNATIONAL STANDARD TERMINOLOGIES ON AYURVEDA (3545 terms)
Categories:
- Background Concepts (323 terms)
- Core Concepts (207 terms)
- Anatomical Structures (438 terms)
- Physiological Processes (160 terms)
- Morbidity and Diagnostic Terms (1295 terms)
- Materials (127 terms)
- Therapeutic Interventions (195 terms)
- Research and Education (113 terms)
- Clinical Specialities (661 terms)

## RESPONSE GUIDELINES

1. Always include appropriate medical disclaimers
2. Check for drug interactions when combining Ayurveda with allopathy
3. Ask clarifying questions for proper Prakriti assessment
4. Reference classical texts - Charaka Samhita, Sushruta Samhita, Ashtanga Hridaya, Bhavaprakasha
5. Never provide definitive diagnoses - recommend professional consultation
6. For drug interactions, specifically warn about:
   - Guggulu + Anticoagulants
   - Turmeric + Blood thinners
   - Ashwagandha + Sedatives/Thyroid meds
   - Garlic + HIV/Warfarin
7. USE THE KNOWLEDGE BASE CONTEXT provided below
8. CITE SPECIFIC SOURCES from the context

## RESPONSE FORMAT

- Use markdown formatting
- Structure with clear headings
- Include Sanskrit terms with English explanations
- Provide Dosha analysis for each condition
- Include Pathya (recommended) and Apathya (avoid) dietary advice
- ALWAYS cite sources - Reference WHO ITA codes and Charak Samhita chapters
- End with appropriate disclaimer

### IMPORTANT: Two-part tagged response (required)

[CHAT]
Short reply only (1–6 short paragraphs).
[/CHAT]

[OUTPUT]
Detailed, properly formatted markdown.
[/OUTPUT]
```

---

## 2. Ayurvedic Fundamentals

### 2.1 Tridosha Theory

| Dosha | Element | Function | Quality | Location |
|-------|---------|----------|---------|----------|
| **Vata** | Air + Space | Movement, nervous system | Dry, light, cold, rough | Colon, thighs, ears, bones, skin |
| **Pitta** | Fire + Water | Transformation, metabolism | Hot, sharp, oily, liquid | Small intestine, stomach, liver, blood, sweat |
| **Kapha** | Earth + Water | Structure, lubrication | Heavy, slow, cool, oily | Chest, throat, head, stomach, joints |

### 2.2 Saptadhatu (Seven Tissues)

| Dhatu | English | Function | Nutritive Tissue |
|-------|---------|----------|-----------------|
| **Rasa** | Plasma | Nutrition, hydration | Ksheera (milk) |
| **Rakta** | Blood | Oxygenation, life force | Vidaka |
| **Mamsa** | Muscle | Movement, protection | Loha |
| **Meda** | Fat | Lubrication, energy | Majja |
| **Asthi** | Bone | Structure, support | Sukti |
| **Majja** | Marrow/Nerve | Filling bones, neural传导 | Shukra |
| **Shukra** | Reproductive | Reproduction, vitality | Shukra |

### 2.3 Agni (Digestive Fire)

| Type | Location | Function |
|------|----------|----------|
| **Jatharagni** | Stomach | Primary digestive fire |
| **Bhutagni** (5 types) | Liver | Elemental transformation |
| **Dhatvagni** (7 types) | Tissues | Tissue-level metabolism |

- **Samagni**: Balanced digestion
- **Mandagni**: Low digestive fire
- **Tikshnagni**: Hyperactive digestion
- **Vishamagni**: Irregular digestion

### 2.4 Srotas (Channels of Circulation)

13 Srotas:
1. **Pranavaha** (Respiratory)
2. **Udakavaha** (Water metabolism)
3. **Annavaha** (Digestive)
4. **Rasavaha** (Plasma)
5. **Raktavaha** (Blood)
6. **Mamsavaha** (Muscle)
7. **Medovaha** (Fat)
8. **Asthibhjanvaha** (Bone)
9. **Majjavaha** (Marrow)
10. **Shukravaha** (Reproductive)
11. **Mutravaha** (Urinary)
12. **Purishavaha** (Fecal)
13. **Svedavaha** (Sweat)

### 2.5 Ama (Toxins)

- Definition: Undigested metabolic waste
- Causes: Weak Agni, improper diet, sedentary lifestyle
- Signs: Coated tongue, bad breath, fatigue, heaviness
- Treatment: Deepana, Pachana, Panchakarma

---

## 3. Disease Database

### Disease Interface

```typescript
interface DiseaseEntry {
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
```

### 3.1 Prameha (Diabetes)

- **Sanskrit:** प्रमेह
- **Category:** Metabolic Disorders
- **Dosha Involvement:** Kapha, Pitta, Vata
- **Samprapti:** Kapha and meda dhatu accumulation leading to excessive urination
- **Modern Correlation:** Diabetes Mellitus, Urinary disorders
- **Clinical Features:** Frequent urination, Sweet taste in mouth, Lethargy, Weight gain, Excessive thirst
- **Diagnostic Criteria:** Mutra sampata (sweet urine), Prabhoota mutrata, Avila mutra
- **Treatment:** Madhumehari chikitsa, Panchakarma (Virechana, Basti), Herbal formulations, Diet control
- **Pathya:** Bitter vegetables, Barley, Green gram, Turmeric, Fenugreek
- **Apathya:** Sweet foods, Rice, Ghee, Junk food, Sedentary lifestyle
- **Prognosis:** Sukhasadhya in early stage, Krichrasadhya if chronic

### 3.2 Raktagata Vata (Hypertension)

- **Sanskrit:** रक्तगत वात
- **Category:** Cardiovascular
- **Dosha Involvement:** Vata, Pitta
- **Samprapti:** Vata pushing rakta (blood) upwards causing pressure
- **Modern Correlation:** Hypertension
- **Clinical Features:** High blood pressure, Headache, Dizziness, Chest pain, Palpitations
- **Diagnostic Criteria:** Raktachaaya, Dhamani pratichaya, Vata krichra
- **Treatment:** Raktashamaka drugs, Snehana (oleation), Panchakarma, Lifestyle modification
- **Pathya:** Garlic, Turmeric, Ginger, Lemon, Pomegranate
- **Apathya:** Salt, Spicy foods, Stress, Alcohol, Tobacco
- **Prognosis:** Samaka with proper management

### 3.3 Sandhi Vata (Osteoarthritis)

- **Sanskrit:** संधि वात
- **Category:** Musculoskeletal
- **Dosha Involvement:** Vata
- **Samprapti:** Vata degeneration in joint spaces causing pain and stiffness
- **Modern Correlation:** Osteoarthritis, Rheumatoid Arthritis
- **Clinical Features:** Joint pain, Stiffness, Swelling, Reduced mobility, Crepitus
- **Diagnostic Criteria:** Sandhi shotha, Ruja, Sthambha, Prasarana painful
- **Treatment:** Basti therapy, Snehana, Swedana, Rasayana, External therapies
- **Pathya:** Ashwagandha, Guggulu, Sesame oil, Warm foods, Calcium-rich foods
- **Apathya:** Cold foods, Dry foods, Excessive exercise, Late nights
- **Prognosis:** Yapya (manageable) with continuous treatment

### 3.4 Amavata (Rheumatoid Arthritis)

- **Sanskrit:** अमवात
- **Category:** Musculoskeletal
- **Dosha Involvement:** Vata, Kapha
- **Samprapti:** Ama with vata in joints causing inflammation
- **Modern Correlation:** Rheumatoid Arthritis
- **Clinical Features:** Joint swelling, Pain, Stiffness (morning), Fatigue, Fever
- **Diagnostic Criteria:** Sandhi shotha, Raktotpatti, Daha, Toya gaman
- **Treatment:** Langhana, Deepana, Pachana, Panchakarma, Shodhana
- **Pathya:** Ginger, Garlic, Turmeric, Light foods
- **Apathya:** Heavy foods, Cold foods, Dairy, Fried foods
- **Prognosis:** Krichrasadhya, requires long-term management

### 3.5 Grahani (IBS/Malabsorption)

- **Sanskrit:** ग्रहणी
- **Category:** Gastrointestinal
- **Dosha Involvement:** Vata, Pitta
- **Samprapti:** Impaired Agni leading to improper digestion and absorption
- **Modern Correlation:** IBS, Malabsorption Syndrome, IBD
- **Clinical Features:** Diarrhea/Constipation alternating, Bloating, Abdominal pain, Undigested food in stool, Weight loss
- **Diagnostic Criteria:** Ama in Pureesha, Vitiated Agni, Vata pravritti
- **Treatment:** Deepana, Pachana, Sangrahaka, Basti, Pathyaahara
- **Pathya:** Well-cooked foods, Warm water, Buttermilk, Skimmed milk, Rice
- **Apathya:** Raw foods, Cold drinks, Fried foods, Irregular meals
- **Prognosis:** Sukhasadhya with proper diet and treatment

### 3.6 Kushtha (Skin Diseases)

- **Sanskrit:** कुष्ठ
- **Category:** Dermatological
- **Dosha Involvement:** Vata, Pitta, Kapha, Rakta
- **Samprapti:** Dosha and dhatu contamination manifesting on skin
- **Modern Correlation:** Psoriasis, Eczema, Skin infections
- **Clinical Features:** Skin lesions, Itching, Scaling, Discoloration, Pain
- **Diagnostic Criteria:** Twak Involvement, Lakshana according to dosha
- **Treatment:** Panchakarma, Raktashodhana, Bahya chikitsa (external), Antah (internal)
- **Pathya:** Green vegetables, Fruits, Turmeric, Neem, Ghee
- **Apathya:** Spicy foods, Alcohol, Non-veg, Junk food, Stress
- **Prognosis:** Depends on type and chronicity

### 3.7 Swasa (Respiratory Disorders)

- **Sanskrit:** श्वास
- **Category:** Respiratory
- **Dosha Involvement:** Vata, Kapha
- **Samprapti:** Obstruction in prana vaha srotas causing breathing difficulty
- **Modern Correlation:** Asthma, COPD, Bronchitis
- **Clinical Features:** Breathlessness, Wheezing, Cough, Chest tightness, Sputum
- **Diagnostic Criteria:** Krichra shwasa, Urdhva shwasa, Tamaka shwasa
- **Treatment:** Shodhana, Shamana, Inhalation therapies, Pranayama, Rasayana
- **Pathya:** Ginger, Turmeric, Pippali, Honey, Warm foods
- **Apathya:** Cold foods, Dust, Pollution, Smoking, Dairy
- **Prognosis:** Yapya with continuous management

### 3.8 Kasa (Cough)

- **Sanskrit:** कास
- **Category:** Respiratory
- **Dosha Involvement:** Vata, Kapha, Pitta
- **Samprapti:** Irritation in respiratory tract causing cough
- **Modern Correlation:** Cough, Bronchitis, TB
- **Clinical Features:** Cough, Throat irritation, Sputum, Chest pain, Breathing difficulty
- **Diagnostic Criteria:** Kasa prana, Ushma, Kanthodhwansa
- **Treatment:** Shamana, Shodhana, Kasa hara drugs, Diet management
- **Pathya:** Warm water, Ginger, Pippali, Tulsi, Honey
- **Apathya:** Cold foods, Dust, Smoking, Spicy foods
- **Prognosis:** Sukhasadhya in acute cases

### 3.9 Hridroga (Heart Disease)

- **Sanskrit:** हृद्दोष
- **Category:** Cardiovascular
- **Dosha Involvement:** Vata, Pitta, Kapha
- **Samprapti:** Heart affected by dosha imbalance and strotas blockage
- **Modern Correlation:** Heart disease, Palpitations, Angina
- **Clinical Features:** Chest pain, Palpitations, Breathlessness, Fatigue, Syncope
- **Diagnostic Criteria:** Hridaya sphurana, Daurbalya, Shwasa
- **Treatment:** Hridya shodhana, Rasayana, Panchakarma, Lifestyle
- **Pathya:** Arjuna, Ghee, Garlic, Fruits, Light foods
- **Apathya:** Heavy foods, Stress, Exertion, Alcohol
- **Prognosis:** Varies by condition

### 3.10 Shotha (Edema/Inflammation)

- **Sanskrit:** शोथ
- **Category:** General
- **Dosha Involvement:** Vata, Pitta, Kapha
- **Samprapti:** Fluid accumulation and inflammation in tissues
- **Modern Correlation:** Edema, Inflammation
- **Clinical Features:** Swelling, Pitting on pressure, Weight gain, Lethargy
- **Diagnostic Criteria:** Sparsha sparsha, Pidaka, Srotas involvement
- **Treatment:** Langhana, Swedana, Mutra virachana, Vatanulomana
- **Pathya:** Bitter herbs, Ginger, Turmeric, Pomegranate, Barley water
- **Apathya:** Salt, Water retention foods, Sedentary lifestyle
- **Prognosis:** Sukhasadhya depending on cause

### 3.11 Unmada (Mental Disorders)

- **Sanskrit:** उन्माद
- **Category:** Mental
- **Dosha Involvement:** Vata, Pitta, Kapha, Manas
- **Samprapti:** Mind affected by dosha imbalance causing mental disturbance
- **Modern Correlation:** Psychosis, Mental illness, Depression
- **Clinical Features:** Behavioral changes, Confusion, Agitation, Delusions, Hallucinations
- **Diagnostic Criteria:** Manas vikriti, Chittodwega, Sattva vaicharya
- **Treatment:** Medhya drugs, Panchakarma, Sattvavajaya, Lifestyle
- **Pathya:** Medhya herbs, Milk, Ghee, Fruits, Peaceful environment
- **Apathya:** Stress, Tamasic foods, Alcohol, Lack of sleep
- **Prognosis:** Requires long-term management

### 3.12 Mastishka Rog (Neurological Disorders)

- **Sanskrit:** मस्तिष्क रोग
- **Category:** Neurological
- **Dosha Involvement:** Vata
- **Samprapti:** Vata affecting brain and nervous system
- **Modern Correlation:** Headache, Migraine, Neurological disorders
- **Clinical Features:** Head pain, Vertigo, Numbness, Tingling, Weakness
- **Diagnostic Criteria:** Shira shool, Vata pravritti
- **Treatment:** Shamana, Basti, Nasya, Rasayana
- **Pathya:** Ghee, Ashwagandha, Bala, Warm foods
- **Apathya:** Stress, Cold foods, Late nights
- **Prognosis:** Varies by condition

### Disease Categories

1. Metabolic Disorders
2. Cardiovascular
3. Respiratory
4. Gastrointestinal
5. Musculoskeletal
6. Dermatological
7. Neurological
8. Mental
9. Gynecological
10. Pediatric
11. Ophthalmology
12. ENT
13. Urological
14. Fertility
15. Autoimmune

---

## 4. Herb Pharmacopeia

### Herb Interface

```typescript
interface Herb {
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
  doshaKarma: string[]
  indications: string[]
  dosage: string
  contraindications: string[]
  sideEffects?: string[]
  interactions?: string[]
  partUsed: string[]
  preparation: string[]
}
```

### 4.1 Ashwagandha (Withania somnifera)

- **Family:** Solanaceae
- **Sanskrit:** अश्वगन्धा
- **Hindi:** Ashwagandha
- **Rasa:** Tikta, Kashaya
- **Guna:** Guru, Snigdha
- **Virya:** Ushna
- **Vipaka:** Madhura
- **Prabhava:** Balya, Brumhana
- **Dosha Karma:** Kapha-Vata shamaka
- **Indications:** Stress, Anxiety, Fatigue, Weakness, Male infertility, Immunity
- **Dosage:** 3-6g powder, 500mg-1g extract
- **Contraindications:** Pregnancy, Hyperthyroidism, Autoimmune conditions
- **Side Effects:** Gastric upset, Drowsiness
- **Interactions:** Sedatives, Thyroid medications, Immunosuppressants
- **Part Used:** Root
- **Preparations:** Powder, Capsules, Decoction, Ashwagandha Lehya

### 4.2 Turmeric (Curcuma longa)

- **Family:** Zingiberaceae
- **Sanskrit:** हरिद्रा
- **Hindi:** Haldi
- **Rasa:** Tikta, Katu
- **Guna:** Ruksha, Laghu
- **Virya:** Ushna
- **Vipaka:** Katu
- **Prabhava:** Krimighna, Vishaghna
- **Dosha Karma:** Kapha-Vata shamaka
- **Indications:** Inflammation, Pain, Skin diseases, Liver disorders, Digestive issues
- **Dosage:** 1-3g powder, 500mg-1g extract
- **Contraindications:** Gallstones, Bile duct obstruction, Anticoagulant therapy
- **Side Effects:** Gastric irritation at high doses
- **Interactions:** Blood thinners, Diabetes medications
- **Part Used:** Rhizome
- **Preparations:** Powder, Decoction, Lehyam, Oil

### 4.3 Ginger (Zingiber officinale)

- **Family:** Zingiberaceae
- **Sanskrit:** शुण्ठी
- **Hindi:** Adrak (fresh), Sonth (dried)
- **Rasa:** Katu, Tikta
- **Guna:** Laghu, Ruksha
- **Virya:** Ushna
- **Vipaka:** Madhura
- **Prabhava:** Deepana, Pachana
- **Dosha Karma:** Kapha-Vata shamaka
- **Indications:** Nausea, Digestive issues, Cold, Cough, Pain
- **Dosage:** 1-3g fresh, 500mg-1g dried
- **Contraindications:** Bleeding disorders, Gallstones
- **Interactions:** Anticoagulants, Diabetes medications
- **Part Used:** Rhizome
- **Preparations:** Fresh juice, Dried powder, Decoction, Oil

### 4.4 Triphala

- **Family:** Combination (Terminalia chebula + Terminalia belerica + Emblica officinalis)
- **Sanskrit:** त्रिफला
- **Hindi:** Triphala
- **Rasa:** All five tastes (Panchrasa)
- **Guna:** Laghu, Ruksha
- **Virya:** Neutral
- **Vipaka:** Madhura
- **Prabhava:** Rasayana, Deepana, Pachana
- **Dosha Karma:** Tridosha shamaka
- **Indications:** Constipation, Digestive issues, Eye diseases, Immunity, Anti-aging
- **Dosage:** 3-6g powder at bedtime
- **Contraindications:** Pregnancy, Diarrhea, Dehydration
- **Interactions:** Diuretics, Blood thinners
- **Part Used:** Fruit (all three)
- **Preparations:** Powder, Decoction, Eye drops, Tablets

### 4.5 Guggulu (Commiphora mukul)

- **Family:** Burseraceae
- **Sanskrit:** गुग्गुलु
- **Hindi:** Guggul
- **Rasa:** Katu, Tikta
- **Guna:** Laghu, Snigdha
- **Virya:** Ushna
- **Vipaka:** Katu
- **Prabhava:** Shothahara, Vedanasthapana
- **Dosha Karma:** Kapha-Vata shamaka
- **Indications:** Arthritis, Obesity, High cholesterol, Thyroid disorders, Skin diseases
- **Dosage:** 500mg-1g resin extract
- **Contraindications:** Pregnancy, Liver disease, Anticoagulant therapy
- **Side Effects:** Gastric upset, Headache
- **Interactions:** Anticoagulants, Thyroid medications, Birth control pills
- **Part Used:** Oleo-gum-resin
- **Preparations:** Yogaraj Guggulu, Kaishore Guggulu, Triphala Guggulu

### 4.6 Pippali (Piper longum)

- **Family:** Piperaceae
- **Sanskrit:** पिप्पली
- **Hindi:** Pippali
- **Rasa:** Katu
- **Guna:** Laghu, Snigdha
- **Virya:** Ushna
- **Vipaka:** Madhura
- **Prabhava:** Rasayana, Medhya
- **Dosha Karma:** Kapha-Vata shamaka
- **Indications:** Respiratory disorders, Digestive issues, Immunomodulator, Rejuvenation
- **Dosage:** 1-3g powder, 500mg extract
- **Contraindications:** Pregnancy, High Pitta conditions
- **Interactions:** Blood thinners, Diabetes medications
- **Part Used:** Fruit
- **Preparations:** Trikatu, Pippali Vardhaman, Churna

### 4.7 Shatavari (Asparagus racemosus)

- **Family:** Asparagaceae
- **Sanskrit:** शतावरी
- **Hindi:** Shatavari
- **Rasa:** Madhura, Tikta
- **Guna:** Guru, Snigdha
- **Virya:** Sheeta
- **Vipaka:** Madhura
- **Prabhava:** Balya, Brumhana
- **Dosha Karma:** Pitta-Vata shamaka
- **Indications:** Female reproductive health, Lactation, Ulcers, Acidity, Immunity
- **Dosage:** 3-6g powder, 500mg-1g extract
- **Contraindications:** Heavy menstruation, Kidney stones
- **Interactions:** Lithium, Diuretics, Diabetes medications
- **Part Used:** Root
- **Preparations:** Powder, Decoction, Syrup, Capsules

### 4.8 Neem (Azadirachta indica)

- **Family:** Meliaceae
- **Sanskrit:** निम्ब
- **Hindi:** Neem
- **Rasa:** Tikta, Kashaya
- **Guna:** Laghu, Ruksha
- **Virya:** Sheeta
- **Vipaka:** Katu
- **Prabhava:** Krimighna, Kushthaghna
- **Dosha Karma:** Kapha-Pitta shamaka
- **Indications:** Skin diseases, Diabetes, Fever, Worms, Dental issues
- **Dosage:** 1-3g powder, 500mg extract
- **Contraindications:** Pregnancy, Infertility, Low blood sugar
- **Interactions:** Diabetes medications, Immunosuppressants
- **Part Used:** Leaf, Bark, Seed
- **Preparations:** Decoction, Oil, Powder, Tablets

### 4.9 Brahmi (Bacopa monnieri)

- **Family:** Plantaginaceae
- **Sanskrit:** ब्राह्मी
- **Hindi:** Brahmi
- **Rasa:** Tikta, Kashaya
- **Guna:** Laghu, Snigdha
- **Virya:** Sheeta
- **Vipaka:** Madhura
- **Prabhava:** Medhya, Smritikara
- **Dosha Karma:** Tridosha shamaka
- **Indications:** Memory enhancement, Anxiety, ADHD, Epilepsy, Hair growth
- **Dosage:** 1-3g powder, 300mg-500mg extract
- **Contraindications:** Slow heart rate, Ulcers, Lung conditions
- **Interactions:** Sedatives, Thyroid medications, Calcium channel blockers
- **Part Used:** Whole plant
- **Preparations:** Powder, Decoction, Oil, Capsules

### 4.10 Amla (Emblica officinalis)

- **Family:** Phyllanthaceae
- **Sanskrit:** आमलकी
- **Hindi:** Amla
- **Rasa:** Amla (sour)
- **Guna:** Laghu, Ruksha
- **Virya:** Sheeta
- **Vipaka:** Madhura
- **Prabhava:** Rasayana, Chakshushya
- **Dosha Karma:** Tridosha shamaka
- **Indications:** Immunity, Hair health, Eye health, Digestive issues, Anti-aging
- **Dosage:** 3-6g powder, 500mg-1g extract
- **Contraindications:** Diabetes (may lower blood sugar), Diarrhea
- **Interactions:** Diabetes medications, Blood thinners
- **Part Used:** Fruit
- **Preparations:** Churna, Lehyam, Juice, Capsules

### 4.11 Arjuna (Terminalia arjuna)

- **Family:** Combretaceae
- **Sanskrit:** अर्जुन
- **Hindi:** Arjuna
- **Rasa:** Kashaya, Tikta
- **Guna:** Laghu, Ruksha
- **Virya:** Sheeta
- **Vipaka:** Katu
- **Prabhava:** Hridya
- **Dosha Karma:** Kapha-Pitta shamaka
- **Indications:** Heart disease, Hypertension, High cholesterol, Angina
- **Dosage:** 3-6g powder, 500mg-1g extract
- **Contraindications:** Pregnancy, Low blood pressure
- **Interactions:** Blood pressure medications, Blood thinners
- **Part Used:** Bark
- **Preparations:** Decoction, Powder, Capsules

### 4.12 Guduchi (Tinospora cordifolia)

- **Family:** Menispermaceae
- **Sanskrit:** गुडूची
- **Hindi:** Giloy
- **Rasa:** Tikta, Kashaya
- **Guna:** Guru, Snigdha
- **Virya:** Ushna
- **Vipaka:** Madhura
- **Prabhava:** Rasayana, Jvaraghna
- **Dosha Karma:** Tridosha shamaka
- **Indications:** Fever, Diabetes, Immunity, Liver disorders, Rheumatism
- **Dosage:** 3-6g powder, 500mg extract
- **Contraindications:** Autoimmune conditions, Constipation
- **Interactions:** Immunosuppressants, Diabetes medications
- **Part Used:** Stem, Root
- **Preparations:** Juice, Decoction, Powder, Satva

### 4.13 Bala (Sida cordifolia)

- **Family:** Malvaceae
- **Sanskrit:** बला
- **Hindi:** Bala
- **Rasa:** Madhura, Tikta
- **Guna:** Guru, Snigdha
- **Virya:** Sheeta
- **Vipaka:** Madhura
- **Prabhava:** Balya, Brumhana
- **Dosha Karma:** Vata shamaka
- **Indications:** Neurological disorders, Muscle wasting, Debility, Paralysis
- **Dosage:** 3-6g powder, 500mg extract
- **Contraindications:** Kapha disorders, Congestion
- **Interactions:** Stimulants, Blood pressure medications
- **Part Used:** Root, Leaf
- **Preparations:** Decoction, Powder, Oil

### 4.14 Musta (Cyperus rotundus)

- **Family:** Cyperaceae
- **Sanskrit:** मुस्त
- **Hindi:** Mustak
- **Rasa:** Katu, Tikta, Kashaya
- **Guna:** Laghu, Ruksha
- **Virya:** Sheeta
- **Vipaka:** Katu
- **Prabhava:** Deepana, Jvaraghna
- **Dosha Karma:** Kapha-Pitta shamaka
- **Indications:** Fever, Digestive issues, Diarrhea, Skin diseases
- **Dosage:** 1-3g powder, 500mg extract
- **Contraindications:** Pregnancy, Dryness conditions
- **Interactions:** Antipyretics, Anti-diarrheal medications
- **Part Used:** Rhizome
- **Preparations:** Decoction, Powder, Tablets

### 4.15 Chandan (Santalum album)

- **Family:** Santalaceae
- **Sanskrit:** चन्दन
- **Hindi:** Chandan
- **Rasa:** Tikta, Kashaya
- **Guna:** Laghu, Snigdha
- **Virya:** Sheeta
- **Vipaka:** Madhura
- **Prabhava:** Shothahara, Varnya
- **Dosha Karma:** Kapha-Pitta shamaka
- **Indications:** Skin diseases, Burning sensation, Fever, Urinary disorders
- **Dosage:** 1-3g powder, 500mg extract
- **Contraindications:** Vata disorders, Dryness
- **Interactions:** Diuretics, Sedatives
- **Part Used:** Heartwood
- **Preparations:** Powder, Decoction, Oil, Paste

---

## 5. Drug Interactions Database

### Critical Interactions (High Risk)

| Herb | Interacting Drug | Severity | Effect | Management |
|------|-----------------|----------|--------|------------|
| **Ashwagandha** | Sedatives (Benzodiazepines, Barbiturates) | High | Enhanced sedation | Avoid combination or reduce dose |
| **Ashwagandha** | Thyroid medications | High | Altered thyroid levels | Monitor TSH regularly |
| **Ashwagandha** | Immunosuppressants | Medium | Reduced drug efficacy | Monitor immune markers |
| **Ashwagandha** | Antihypertensives | Medium | Additive blood pressure lowering | Monitor BP regularly |
| **Guggulu** | Anticoagulants (Warfarin, Heparin) | High | Increased bleeding risk | Avoid or monitor INR closely |
| **Guggulu** | Thyroid medications | High | Altered thyroid function | Monitor thyroid levels |
| **Guggulu** | Birth control pills | Medium | Reduced contraceptive efficacy | Use additional contraception |
| **Turmeric** | Blood thinners (Warfarin, Aspirin) | High | Increased bleeding risk | Avoid or monitor INR |
| **Turmeric** | Diabetes medications | Medium | Additive blood sugar lowering | Monitor glucose levels |
| **Ginger** | Anticoagulants | High | Increased bleeding risk | Avoid or reduce dose |
| **Ginger** | Diabetes medications | Medium | Additive blood sugar lowering | Monitor glucose levels |
| **Garlic** | Anticoagulants | High | Increased bleeding risk | Avoid or reduce dose |
| **Garlic** | HIV medications | High | Reduced drug efficacy | Avoid combination |
| **Garlic** | Warfarin | High | Increased INR | Monitor INR closely |
| **Ginkgo** | Anticoagulants | High | Increased bleeding risk | Avoid combination |
| **Shatavari** | Lithium | Medium | Reduced lithium excretion | Monitor lithium levels |
| **Shatavari** | Diuretics | Low | Additive diuretic effect | Monitor electrolytes |
| **St. John's Wort** | Antidepressants (SSRIs, MAOIs) | High | Serotonin syndrome risk | Avoid combination |

### Interaction Severity Levels

- **High:** Avoid combination, risk of serious adverse effects
- **Medium:** Use with caution, monitor patient closely
- **Low:** Generally safe, monitor for mild effects

### Common Drug-Herb Interaction Mechanisms

1. **CYP450 Enzyme Inhibition/Induction:** Many herbs affect liver enzymes that metabolize drugs
2. **Protein Binding Displacement:** Herbs can displace drugs from protein binding sites
3. **Absorption Interference:** Herbs may alter drug absorption in GI tract
4. **Additive Pharmacological Effects:** Herbs with similar mechanism enhance drug effects
5. **Antagonistic Effects:** Herbs may counteract drug effects

---

## 6. Diagnostic Methods

### 6.1 Trividha Pariksha (3-fold Examination)

1. **Darshana** (Observation): Visual examination of patient
2. **Sparshana** (Touch/Palpation): Touching and feeling
3. **Prashna** (Questioning): Asking about symptoms and history

### 6.2 Ashtavidha Pariksha (8-fold Examination)

| Pariksha | Method | What to Assess |
|----------|--------|----------------|
| **Naadi** | Pulse diagnosis | Vata, Pitta, Kapha balance |
| **Mootra** | Urine examination | Color, frequency, consistency |
| **Mala** | Stool examination | Form, color, frequency |
| **Jivha** | Tongue examination | Coating, color, moisture |
| **Drik** | Eye examination | Color, luster, vision |
| **Shabda** | Voice assessment | Clarity, pitch, quality |
| **Sparsh** | Skin examination | Temperature, moisture, texture |
| **Aakriti** | Body build assessment | Constitution, posture |

### 6.3 Dashavidha Pariksha (10-fold Examination)

1. **Prakriti** (Constitution)
2. **Vikriti** (Current imbalance)
3. **Sara** (Tissue quality)
4. **Samhanana** (Compactness)
5. **Pramana** (Measurements)
6. **Satmya** (Adaptability)
7. **Sattva** (Mental strength)
8. **Ahara Shakti** (Digestive capacity)
9. **Vyayama Shakti** (Exercise capacity)
10. **Vaya** (Age)

### 6.4 Prakriti Assessment

**Vata Prakriti:**
- Physical: Thin build, dry skin, cold hands/feet
- Mental: Creative, anxious, quick thinking
- Physiological: Irregular appetite, light sleeper

**Pitta Prakriti:**
- Physical: Medium build, warm body, sharp features
- Mental: Intelligent, ambitious, irritable
- Physiological: Strong appetite, good digestion

**Kapha Prakriti:**
- Physical: Large build, oily skin, strong endurance
- Mental: Calm, loyal, possessive
- Physiological: Steady appetite, deep sleeper

---

## 7. Treatment Protocols

### 7.1 Panchakarma (Five Detox Procedures)

| Procedure | Method | Indications |
|-----------|--------|-------------|
| **Vamana** | Therapeutic emesis | Kapha disorders, Obesity, Asthma |
| **Virechana** | Therapeutic purgation | Pitta disorders, Skin diseases, Liver issues |
| **Basti** | Medicated enema | Vata disorders, Arthritis, Neurological |
| **Nasya** | Nasal administration | Head disorders, Sinusitis, Migraine |
| **Raktamokshana** | Bloodletting | Skin diseases, Blood disorders, Infections |

### 7.2 Purva Karma (Preparatory Procedures)

| Procedure | Purpose | When Used |
|-----------|---------|-----------|
| **Deepana** | Kindling digestive fire | Low Agni, Ama |
| **Pachana** | Digesting toxins | Ama accumulation |
| **Snehana** | Oleation (internal/external) | Before Panchakarma |
| **Swedana** | Sudation (fomentation) | After Snehana |

### 7.3 Shamana Chikitsa (Palliative Treatment)

1. **Deepana** - Improving digestive fire
2. **Pachana** - Digesting toxins
3. **Upavasa** - Therapeutic fasting
4. **Vyayama** - Therapeutic exercise
5. **Atapa** - Sun therapy
6. **Maruta** - Wind therapy

### 7.4 Pathya-Apathya (Dietary Guidelines)

**General Pathya (Recommended):**
- Fresh, warm, well-cooked foods
- Seasonal fruits and vegetables
- Whole grains
- Adequate hydration
- Regular meal timings

**General Apathya (Avoid):**
- Processed foods
- Excessive cold/icy foods
- Irregular eating habits
- Overeating
- Incompatible food combinations

---

## 8. Allopathy Integration

### Drug-Herb Interaction Categories

1. **Cardiovascular:** Warfarin, Aspirin, Statins
2. **Endocrine:** Thyroid medications, Diabetes drugs
3. **Neurological:** Antidepressants, Anti-epileptics
4. **Gastrointestinal:** PPIs, H2 blockers
5. **Respiratory:** Bronchodilators, Steroids
6. **Musculoskeletal:** NSAIDs, Muscle relaxants

### Combined Treatment Protocol Guidelines

1. **Assessment:** Evaluate both Ayurvedic and modern medicine history
2. **Interaction Check:** Cross-reference herb-drug interactions
3. **Timing:** Separate herb and drug intake by 2-3 hours
4. **Monitoring:** Regular lab work and clinical assessment
5. **Communication:** Keep both practitioners informed

### Safety Warnings

- **Guggulu + Anticoagulants:** High bleeding risk
- **Turmeric + Blood thinners:** Increased INR
- **Ashwagandha + Sedatives:** Excessive drowsiness
- **Garlic + HIV/Warfarin:** Reduced drug efficacy

---

## 9. Charak Samhita — All 120 Chapters

### 9.1 Sutra Sthana (30 Chapters) — Fundamentals

| Chapter | Name | Key Topics |
|---------|------|------------|
| 1 | Mahatma Indriyam | Greatness of knowledge |
| 2 | Sharira Indriyam | Body and senses |
| 3 | Shadvirega Shatantra | Six types of desire |
| 4 | Shloka Sthana | Fundamental principles |
| 5 | Indriyam | Senses and perception |
| 6 | Chikitsa Pitham | Treatment fundamentals |
| 7 | Shadvisha Adhyayam | Six types of poisoning |
| 8 | Krimi Ghnitam | Treatment of worms |
| 9 | Shalyam | Surgical principles |
| 10 | Kashmiram | Kashmir region practice |
| 11 | Mahodaram | Abdominal diseases |
| 12 | Chyavanam | Rejuvenation therapy |
| 13 | Sharira Sankhya | Body enumeration |
| 14 | Sutriyam | Thread-like structures |
| 15 | Gandhva Duttam | Nasal treatment |
| 16 | Dosha Dushya Samuddeham | Dosha and dhatu |
| 17 | Rogabhishagjitiya | Medical victory over disease |
| 18 | Chakshushyam | Eye treatments |
| 19 | Putrakrniyam | Pediatrics |
| 20 | Roga Bhedam | Disease classification |
| 21 | Dosa Drukrishti | Dosha examination |
| 22 | Shalyam | Surgical principles |
| 23 | Shastram | Instruments |
| 24 | Yoga Adhyayam | Yoga therapy |
| 25 | Chikitsa Adhyayam | Treatment principles |
| 26 | Kalpa Adhyayam | Pharmaceutical preparations |
| 27 | Sneham | Oleation therapy |
| 28 | Swedam | Sudation therapy |
| 29 | Chikitsa Sthanam | Treatment location |
| 30 | Chikitsa Visheshayatanam | Special treatment centers |

### 9.2 Nidana Sthana (8 Chapters) — Diagnostics

| Chapter | Name | Key Topics |
|---------|------|------------|
| 1 | Jwara Nidanam | Fever diagnosis |
| 2 | Raktapitta Nidanam | Bleeding disorders |
| 3 | Gulma Nidanam | Abdominal tumors |
| 4 | Prameha Nidanam | Diabetes/Urinary disorders |
| 5 | Kushtha Nidanam | Skin diseases |
| 6 | Shosha Nidanam | Emaciation |
| 7 | Unmada Nidanam | Mental disorders |
| 8 | Apasmara Nidanam | Epilepsy |

### 9.3 Vimana Sthana (8 Chapters) — Medical Training

| Chapter | Name | Key Topics |
|---------|------|------------|
| 1 | Rasa Vimana | Taste theory |
| 2 | Shrotovijnanam | Channel knowledge |
| 3 | Janapadodhvansaniya | Epidemics |
| 4 | Rogabhishagjitiya | Medical victory |
| 5 | Chikitsa Visheshayatanam | Treatment centers |
| 6 | Kalpa Vimana | Pharmaceutical |
| 7 | Dravyasamharam | Drug collection |
| 8 | Kalpasamharam | Pharmaceutical operations |

### 9.4 Sharira Sthana (8 Chapters) — Embryology

| Chapter | Name | Key Topics |
|---------|------|------------|
| 1 | Sharira Sankhya | Body enumeration |
| 2 | Garbhavakranti | Embryology |
| 3 | Garbha Vriddhi | Fetal development |
| 4 | Garbha Lakshanam | Signs of pregnancy |
| 5 | Garbha Upaghata | Fetal disorders |
| 6 | Garbha Pariharana | Fetal protection |
| 7 | Garbha Karma | Delivery procedures |
| 8 | Garbha Sambhavam | Fetal viability |

### 9.5 Indriya Sthana (12 Chapters) — Prognosis

| Chapter | Name | Key Topics |
|---------|------|------------|
| 1 | Indriyam | Sensory prognosis |
| 2 | Indriyam | Sensory examination |
| 3 | Indriyam | Prognostic signs |
| 4 | Indriyam | Death signs |
| 5 | Indriyam | Survival signs |
| 6 | Indriyam | Recovery signs |
| 7 | Indriyam | Complication signs |
| 8 | Indriyam | Treatment response |
| 9 | Indriyam | Relapse signs |
| 10 | Indriyam | Chronic disease signs |
| 11 | Indriyam | Terminal signs |
| 12 | Indriyam | Overall prognosis |

### 9.6 Chikitsa Sthana (30 Chapters) — Treatment

| Chapter | Name | Key Topics |
|---------|------|------------|
| 1 | Rasayana Adhyayam | Rejuvenation therapy |
| 2 | Vajikarana Adhyayam | Fertility therapy |
| 3 | Jwara Chikitsa | Fever treatment |
| 4 | Raktapitta Chikitsa | Bleeding disorders |
| 5 | Gulma Chikitsa | Abdominal tumors |
| 6 | Prameha Chikitsa | Diabetes treatment |
| 7 | Kushtha Chikitsa | Skin diseases |
| 8 | Shosha Chikitsa | Emaciation treatment |
| 9 | Unmada Chikitsa | Mental disorders |
| 10 | Apasmara Chikitsa | Epilepsy treatment |
| 11 | Vata Vyadhi Chikitsa | Neurological disorders |
| 12 | Vatarakta Chikitsa | Gout treatment |
| 13 | Vatavyadhi Chikitsa | Vata disorders |
| 14 | Krimi Chikitsa | Worm treatment |
| 15 | Shotha Chikitsa | Edema treatment |
| 16 | Hridroga Chikitsa | Heart disease |
| 17 | Hikka Chikitsa | Hiccough treatment |
| 18 | Shwasa Chikitsa | Respiratory disorders |
| 19 | Kasa Chikitsa | Cough treatment |
| 20 | Atisara Chikitsa | Diarrhea treatment |
| 21 | Pravahika Chikitsa | Dysentery treatment |
| 22 | Raktapitta Chikitsa | Bleeding disorders |
| 23 | Trishna Chikitsa | Thirst treatment |
| 24 | Vishama Jwara Chikitsa | Intermittent fever |
| 25 | Vishaghna Chikitsa | Poison treatment |
| 26 | Kushtha Chikitsa | Skin diseases |
| 27 | Shilpi Tarpanam | Nourishment therapy |
| 28 | Vishajitam | Overcoming poison |
| 29 | Vayovaddhikaranam | Age-related conditions |
| 30 | Chikitsa Sthana | Treatment principles |

### 9.7 Kalpa Sthana (12 Chapters) — Pharmacy

| Chapter | Name | Key Topics |
|---------|------|------------|
| 1 | Sneha Kalpa | Oil preparations |
| 2 | Vamaka Kalpa | Emetic drugs |
| 3 | Virechaka Kalpa | Purgative drugs |
| 4 | Asthapana Kalpa | Decoction enemas |
| 5 | Anuvasana Kalpa | Oil enemas |
| 6 | Nasya Kalpa | Nasal preparations |
| 7 | Kavacha Kalpa | Protective formulations |
| 8 | Dhoopana Kalpa | Fumigation |
| 9 | Lepa Kalpa | Paste preparations |
| 10 | Paniya Kalpa | Drinking preparations |
| 11 | Avapeedana Kalpa | Pressed juice |
| 12 | Kriyakalpa Kalpa | Therapeutic procedures |

### 9.8 Siddhi Sthana (12 Chapters) — Procedures

| Chapter | Name | Key Topics |
|---------|------|------------|
| 1 | Vamana Siddhi | Emetic completion |
| 2 | Virechana Siddhi | Purgation completion |
| 3 | Basti Siddhi | Enema completion |
| 4 | Nasya Siddhi | Nasal completion |
| 5 | Raktamokshana Siddhi | Bloodletting completion |
| 6 | Panchakarma Siddhi | Complete detox |
| 7 | Karma Siddhi | Procedure completion |
| 8 | Pravritti Siddhi | Clinical practice |
| 9 | Vichara Siddhi | Diagnostic completion |
| 10 | Upashaya Siddhi | Therapeutic completion |
| 11 | Prayoga Siddhi | Clinical application |
| 12 | Samsodhana Siddhi | Purification completion |

---

## 10. WHO International Standard Terminologies (3545 Terms)

### 10.1 Background Concepts (323 Terms)

Key categories:
- Ayurveda definition and scope
- Life processes
- Knowledge systems
- Educational frameworks

### 10.2 Core Concepts (207 Terms)

| Concept | ITA Code | Definition |
|---------|----------|------------|
| Vata dosha | ITA-2.1.1 | Bio-element responsible for movement |
| Pitta dosha | ITA-2.1.2 | Bio-element responsible for transformation |
| Kapha dosha | ITA-2.1.3 | Bio-element responsible for structure |
| Prana | ITA-2.2.1 | Vital breath |
| Tejas | ITA-2.2.2 | Digestive fire |
| Ojas | ITA-2.2.3 | Vital essence |
| Agni | ITA-2.3.1 | Digestive fire |
| Ama | ITA-2.3.2 | Metabolic toxins |
| Srotas | ITA-2.4.1 | Channels of circulation |

### 10.3 Anatomical Structures (438 Terms)

Categories:
- Body parts and regions
- Organ systems
- Tissue types
- Joint structures
- Vascular structures

### 10.4 Physiological Processes (160 Terms)

Categories:
- Digestion and metabolism
- Excretion
- Reproduction
- Respiration
- Circulation

### 10.5 Morbidity and Diagnostic Terms (1295 Terms)

Categories:
- Disease names
- Symptom descriptions
- Diagnostic methods
- Prognostic indicators

### 10.6 Materials (127 Terms)

Categories:
- Herbal drugs
- Mineral preparations
- Animal products
- Formulations

### 10.7 Therapeutic Interventions (195 Terms)

Categories:
- Panchakarma procedures
- External therapies
- Internal medications
- Dietary therapies

### 10.8 Research and Education (113 Terms)

Categories:
- Research methodologies
- Educational standards
- Clinical trial terminology

### 10.9 Clinical Specialities (661 Terms)

Categories:
- Kayachikitsa (Internal Medicine)
- Shalya (Surgery)
- Shalakya (ENT/Ophthalmology)
- Kaumara-Bhritya (Pediatrics/Gynecology)
- Graha Chikitsa (Psychiatry)
- Agada Tantra (Toxicology)
- Rasayana (Rejuvenation)
- Vajikarana (Fertility)

---

## 11. RAG System Architecture

### 11.1 Dual-Layer RAG Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER QUERY                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  QUERY ANALYSIS                             │
│  • Intent Detection (10 types)                             │
│  • Entity Extraction                                       │
│  • Complexity Assessment                                   │
│  • Safety Warning Detection                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               IN-MEMORY KNOWLEDGE BASE                      │
│  • Disease Database (12+ conditions)                       │
│  • Herb Pharmacopeia (15 core herbs)                       │
│  • Drug Interactions (18+ interactions)                    │
│  • Query Engine (Rule-based fallback)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               VECTOR RAG (Supabase pgvector)               │
│  • NVIDIA NIM Embeddings (nv-embedqa-e5-v5)               │
│  • 1024-dimensional vectors                               │
│  • Semantic search + Full-text fallback                    │
│  • LRU Cache for performance                              │
│  • Multi-query expansion                                  │
│  • Hybrid re-ranking                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTEXT FORMATION                          │
│  • RAG results formatting                                 │
│  • Intent-based instructions                              │
│  • Conversation context                                   │
│  • Safety warnings                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  LLM RESPONSE                              │
│  • System prompt + Context + User query                   │
│  • Streamed with auto-continuation                        │
│  • [CHAT]/[OUTPUT] tagged format                          │
│  • Persisted to database                                  │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Embedding Configuration

- **Model:** nvidia/nv-embedqa-e5-v5
- **Dimension:** 1024
- **Batch Size:** 100
- **Max Chunk Size:** 400 characters
- **Source Types:** disease, herb, treatment, interaction, general, who_term, charak_chapter, clinical_case

### 11.3 Search Parameters

- **Max Results:** 15
- **Min Relevance Score:** 0.20
- **Full-Text Match Limit:** 5
- **Cache TTL:** 3600 seconds (1 hour)

---

## 12. Query Intent Classification

### 12.1 Intent Types

| Intent | Description | Response Focus |
|--------|-------------|----------------|
| **diagnosis** | Diagnostic query | Differential diagnosis, Samprapti, Investigations |
| **treatment** | Treatment query | Chikitsa Sutra, Panchakarma, Medications |
| **herb** | Herb query | Rasa, Guna, Virya, Vipaka, Dosha karma |
| **drug_interaction** | Drug interaction | Severity, Mechanism, Alternatives |
| **prakriti** | Constitution query | Assessment, Lifestyle, Diet |
| **diet** | Dietary query | Pathya, Apathya, Ritucharya |
| **procedure** | Procedure query | Step-by-step, Pre/post care |
| **research** | Evidence query | Studies, Clinical trials |
| **general** | General query | Balanced Ayurvedic response |
| **explanation** | Explanation query | Conceptual breakdown |
| **terminology** | Terminology query | Sanskrit-English, ITA codes |

### 12.2 Intent-Specific Instructions

**Diagnosis:**
- Differential diagnosis with dosha involvement
- Samprapti (pathogenesis)
- Key clinical features
- Recommended investigations
- Prognosis based on classical texts

**Treatment:**
- Treatment principles (Chikitsa Sutra)
- Specific Panchakarma procedures
- Internal medications with dosage
- External therapies
- Duration and frequency
- Expected outcomes

**Herb:**
- Rasa, Guna, Virya, Vipaka properties
- Dosha Karma
- Classical formulations
- Dosage and anupana
- Contraindications
- Modern research evidence

**Drug Interaction:**
- Check all herb-drug interactions
- Severity assessment (high/medium/low)
- Mechanism of interaction
- Safe alternatives
- Monitoring parameters
- Safety warnings

**Diet:**
- Pathya (recommended foods)
- Apathya (foods to avoid)
- Seasonal dietary adjustments
- Meal timing and preparation
- Specific recipes if helpful

**Procedure:**
- Detailed step-by-step procedure
- Pre-procedure preparation
- Main procedure
- Post-procedure care
- Duration and frequency
- Indications and contraindications

---

## 13. Ayurvedic Terminology Database

### 13.1 Six Tastes (Rasa)

| Rasa | Sanskrit | Elements | Effect | Examples |
|------|----------|----------|--------|----------|
| **Madhura** | मधुर | Earth + Water | Nourishing, Cooling | Sweet fruits, Milk |
| **Amla** | अम्ल | Water + Fire | Sour, Stimulating | Citrus, Tamarind |
| **Lavana** | लवण | Fire + Water | Salty, Softening | Salt, Seaweed |
| **Tikta** | तिक्त | Air + Fire | Bitter, Detoxifying | Neem, Turmeric |
| **Kashaya** | कषाय | Air + Earth | Astringent, Drying | Pomegranate, Green tea |
| **Katu** | कटु | Air + Fire | Pungent, Heating | Ginger, Black pepper |

### 13.2 Twenty Qualities (Guna)

**Opposite Pairs:**

| Guna 1 | Guna 2 | Effect |
|--------|--------|--------|
| Guru (Heavy) | Laghu (Light) | Weight/Stability |
| Manda (Slow) | Tikshna (Sharp) | Speed/Intensity |
| Sheeta (Cold) | Ushna (Hot) | Temperature |
| Snigdha (Oily) | Ruksha (Dry) | Moisture |
| Slakshna (Smooth) | Kathina (Hard) | Texture |
| Sthira (Stable) | Sara (Mobile) | Movement |
| Sukshma (Subtle) | Sthula (Gross) | Size |
| Vishada (Clear) | Picchila (Slimy) | Clarity |
| Laghu (Light) | Guru (Heavy) | Density |
| Sandra (Dense) | Drava (Liquid) | Consistency |

### 13.3 Virya (Potency)

| Virya | Effect | Dosha Impact |
|-------|--------|--------------|
| **Ushna** (Hot) | Increases metabolism, Digestion | Reduces Kapha, Increases Pitta |
| **Sheeta** (Cold) | Calms inflammation, Cooling | Reduces Pitta, Increases Kapha |

### 13.4 Vipaka (Post-Digestive Effect)

| Vipaka | Effect | Dosha Impact |
|--------|--------|--------------|
| **Madhura** (Sweet) | Nourishing, Building | Increases Kapha |
| **Amla** (Sour) | Increasing, Warming | Increases Pitta |
| **Katu** (Pungent) | Reducing, Drying | Increases Vata |

### 13.5 Prabhava (Special Action)

Unique therapeutic effects beyond standard pharmacological actions:
- **Balya** (Strengthening)
- **Brumhana** (Nourishing)
- **Rasayana** (Rejuvenating)
- **Medhya** (Intellect-promoting)
- **Krimighna** (Worm-killing)
- **Vishaghna** (Detoxifying)
- **Shothahara** (Anti-inflammatory)
- **Vedanasthapana** (Analgesic)
- **Varnya** (Complexion-improving)
- **Chakshushya** (Eye-health promoting)

---

## 14. Disease Concept Mapping

### Disease-to-Sanskrit Concept Map

| Disease | Key Sanskrit Terms |
|---------|-------------------|
| Arthritis | Sandhivata, Amavata, Joint pain, Swelling, Stiffness |
| Diabetes | Prameha, Madhumeha, Blood sugar, Insulin, Metabolic |
| Hypertension | Raktachapa, Uchcha raktachapa, Blood pressure, Cardiovascular |
| Asthma | Swasa, Tamaka swasa, Breathing, Respiratory, Bronchial |
| Skin disease | Kushtha, Twak roga, Dermatitis, Eczema, Psoriasis |
| Digestive | Grahani, Agnimandya, Ajirna, Digestion, Gut |
| Anxiety | Chittodvega, Vata vyadhi, Mental health, Stress |
| Insomnia | Anidra, Nidranasha, Sleep, Sleep disorder |
| Obesity | Sthaulya, Medoroga, Weight, Overweight |
| Headache | Shirahshoola, Ardhavabhedaka, Migraine, Head pain |
| Constipation | Vibandha, Malabaddhata, Bowel, Stool |
| Fever | Jwara, Sannipata jwara, Temperature, Infection |
| Cough | Kasa, Vataja kasa, Respiratory |
| Cold | Pratishyaya, Shirahkapha, Nasal, Congestion |
| Acidity | Amlapitta, Parinama shoola, Gastric, Acid reflux |
| Gastric | Ajirna, Agnimandya, Digestion, Stomach |
| Joint pain | Sandhishoola, Sandhigata vata, Arthritis |
| Back pain | Katishoola, Pristha shoola, Gridhrasi, Sciatica |
| Eye disease | Netra roga, Drishti dosha, Vision |
| Heart | Hridroga, Hrudaya, Cardiac, Cardiovascular |
| Kidney | Mutravaha srotas, Mutra roga, Renal |
| Liver | Yakrit, Pleeha, Hepatic |
| Thyroid | Galaganda, Meda dhatu, Endocrine |
| PCOS | Artava kshaya, Rajodushti, Hormonal, Ovarian |
| Menstrual | Rajodushti, Artava vyadhi, Periods, Menstruation |

---

## 15. Response Format Guidelines

### 15.1 Markdown Formatting

- Use clear headings (H2, H3, H4)
- Bullet points for lists
- Tables for structured data
- Bold for key terms
- Sanskrit terms with English explanations
- Citations with ITA codes and chapter references

### 15.2 Clinical Response Structure

```
## [Condition Name]
**Sanskrit:** [Sanskrit term]
**Modern Correlation:** [Modern disease]

### Dosha Analysis
- Primary dosha: [Dosha]
- Secondary involvement: [Other doshas]

### Samprapti (Pathogenesis)
[Step-by-step disease progression]

### Clinical Features
- [Symptom 1]
- [Symptom 2]

### Diagnostic Criteria
- [Criterion 1]
- [Criterion 2]

### Treatment Protocol
1. **Shodhana** (Detoxification)
   - [Procedure]
2. **Shamana** (Palliative)
   - [Medications]
3. **Pathya-Apathya** (Diet)
   - Pathya: [Foods to eat]
   - Apathya: [Foods to avoid]

### Prognosis
[Expected outcome]

### Disclaimer
This information is for educational purposes only. Please consult a qualified Ayurvedic practitioner for diagnosis and treatment.
```

### 15.3 Safety Disclaimers

**Always include:**
1. "This information is for educational purposes only"
2. "Please consult a qualified healthcare practitioner"
3. "Do not self-medicate"
4. "Drug interactions should be checked before combining treatments"

**For drug interactions:**
1. "This combination may cause [specific effect]"
2. "Monitor [specific parameters]"
3. "Consult your physician before making changes"

---

## Appendix A: Data Export Formats

### A.1 JSON Schema (Knowledge Base)

```json
{
  "diseases": [
    {
      "id": "string",
      "name": "string",
      "sanskrit": "string",
      "category": "string",
      "doshaInvolvement": ["string"],
      "samprapti": "string",
      "modernCorrelation": "string",
      "clinicalFeatures": ["string"],
      "diagnosticCriteria": ["string"],
      "treatment": ["string"],
      "pathya": ["string"],
      "apathya": ["string"],
      "prognosis": "string"
    }
  ],
  "herbs": [
    {
      "id": "string",
      "name": "string",
      "botanicalName": "string",
      "family": "string",
      "sanskrit": "string",
      "hindi": "string",
      "rasa": ["string"],
      "guna": ["string"],
      "virya": "string",
      "vipaka": "string",
      "prabhava": "string",
      "doshaKarma": ["string"],
      "indications": ["string"],
      "dosage": "string",
      "contraindications": ["string"],
      "sideEffects": ["string"],
      "interactions": ["string"],
      "partUsed": ["string"],
      "preparation": ["string"]
    }
  ],
  "drugInteractions": [
    {
      "herb": "string",
      "drug": "string",
      "severity": "high|medium|low",
      "effect": "string",
      "management": "string"
    }
  ]
}
```

### A.2 SQL Schema (Database)

```sql
-- Diseases table
CREATE TABLE diseases (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  sanskrit VARCHAR,
  category VARCHAR,
  dosha_involvement TEXT[],
  samprapti TEXT,
  modern_correlation VARCHAR,
  clinical_features TEXT[],
  diagnostic_criteria TEXT[],
  treatment TEXT[],
  pathya TEXT[],
  apathya TEXT[],
  prognosis TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Herbs table
CREATE TABLE herbs (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  botanical_name VARCHAR,
  family VARCHAR,
  sanskrit VARCHAR,
  hindi VARCHAR,
  rasa TEXT[],
  guna TEXT[],
  virya VARCHAR,
  vipaka VARCHAR,
  prabhava VARCHAR,
  dosha_karma TEXT[],
  indications TEXT[],
  dosage VARCHAR,
  contraindications TEXT[],
  side_effects TEXT[],
  interactions TEXT[],
  part_used TEXT[],
  preparation TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge embeddings (vector store)
CREATE TABLE knowledge_embeddings (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  source_type VARCHAR NOT NULL,
  source_id VARCHAR,
  metadata JSONB,
  embedding VECTOR(1024),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create vector index
CREATE INDEX ON knowledge_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## Appendix B: Training Data Statistics

| Category | Count | Description |
|----------|-------|-------------|
| Diseases | 12+ | Complete disease entries with all properties |
| Herbs | 15 | Core herb pharmacopeia |
| Drug Interactions | 18+ | Critical herb-drug interactions |
| Charak Samhita Chapters | 120 | All chapters across 8 Sthanas |
| WHO Terminology Terms | 3545 | International standard terms |
| Intent Types | 10 | Query classification categories |
| Diagnostic Methods | 3 | Trividha, Ashtavidha, Dashavidha |
| Panchakarma Procedures | 5 | Vamana, Virechana, Basti, Nasya, Raktamokshana |
| Rasa (Tastes) | 6 | Madhura, Amla, Lavana, Tikta, Kashaya, Katu |
| Guna (Qualities) | 20 | Opposing pairs of qualities |
| Disease Categories | 15 | Major disease classifications |

---

*This knowledge base is compiled from the AyurVritta Ayurveda Clinical AI system. It is designed to be used for training AI models, building clinical decision support systems, or creating educational applications in Ayurvedic medicine.*

*Last updated: 2026-06-15*