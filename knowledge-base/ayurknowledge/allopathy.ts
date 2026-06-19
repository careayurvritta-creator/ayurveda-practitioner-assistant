export interface AllopathyIntegration {
  condition: string
  ayurvedicCorrelation: string
  allopathyTreatment: string
  integratedApproach: string
  safetyNotes: string[]
  monitoringParameters: string[]
}

export const ALLOPATHY_INTEGRATION: AllopathyIntegration[] = [
  {
    condition: 'Type 2 Diabetes',
    ayurvedicCorrelation: 'Prameha / Madhumeha',
    allopathyTreatment: 'Metformin, Insulin, Sulfonylureas, SGLT2 inhibitors',
    integratedApproach: 'Ayurvedic herbs (Turmeric, Gymnema, Methi) + diet + yoga as adjunct. Monitor blood sugar closely.',
    safetyNotes: [
      'Gymnema may potentiate hypoglycemia',
      'Turmeric may enhance effect of metformin',
      'Coordinate timing of herbs and medications',
      'Start with low doses of herbs',
      'Regular blood sugar monitoring essential'
    ],
    monitoringParameters: ['Fasting glucose', 'PP glucose', 'HbA1c', 'Lipid profile']
  },
  {
    condition: 'Hypertension',
    ayurvedicCorrelation: 'Raktagata Vata',
    allopathyTreatment: 'ACE inhibitors, Beta blockers, Diuretics, Calcium channel blockers',
    integratedApproach: 'Arjuna as cardioprotective, garlic, garlic + lifestyle. Avoid Guggulu with beta blockers.',
    safetyNotes: [
      'Garlic may potentiate antihypertensives',
      'Arjuna may potentiate beta blockers',
      'Avoid Ashwagandha with sedatives',
      'Monitor blood pressure closely',
      'Reduce salt intake per Ayurveda'
    ],
    monitoringParameters: ['BP monitoring', 'ECG', 'Kidney function']
  },
  {
    condition: 'Arthritis (OA/RA)',
    ayurvedicCorrelation: 'Sandhivata / Amavata',
    allopathyTreatment: 'NSAIDs, DMARDs, Corticosteroids, Biologics',
    integratedApproach: 'Guggulu, Ashwagandha, shallaki as adjunct. Panchakarma for purification. Physical therapy.',
    safetyNotes: [
      'Guggulu may interact with DMARDs',
      'Turmeric may increase bleeding risk with NSAIDs',
      'Avoid self-medication with multiple herbs',
      'Coordinate with rheumatologist',
      'Monitor liver function'
    ],
    monitoringParameters: ['Joint pain scores', 'Inflammation markers', 'Liver function']
  },
  {
    condition: 'Hyperlipidemia',
    ayurvedicCorrelation: 'Medoroga',
    allopathyTreatment: 'Statins, Fibrates, Ezetimibe',
    integratedApproach: 'Guggulu, Arjuna, Triphala as adjunct. Diet + exercise essential.',
    safetyNotes: [
      'Guggulu may have additive effect with statins',
      'Monitor CK levels with combination',
      'Start with low doses',
      'Regular lipid profile monitoring',
      'Avoid alcohol with medications'
    ],
    monitoringParameters: ['Lipid profile', 'Liver enzymes', 'CK']
  },
  {
    condition: 'Depression/Anxiety',
    ayurvedicCorrelation: 'Mansika Dosha / Unmada',
    allopathyTreatment: 'SSRIs, SNRIs, Benzodiazepines',
    integratedApproach: 'Brahmi, Ashwagandha, meditation + counseling. Can reduce medication gradually under supervision.',
    safetyNotes: [
      'Ashwagandha may potentiate sedatives',
      'Brahmi may interact with anticonvulsants',
      'Do not stop psychiatric medications abruptly',
      'Regular psychiatric follow-up essential',
      'Monitor for serotonin syndrome'
    ],
    monitoringParameters: ['PHQ-9', 'GAD-7', 'Side effects']
  },
  {
    condition: 'Hypothyroidism',
    ayurvedicCorrelation: 'Kapha-Vata imbalance',
    allopathyTreatment: 'Levothyroxine',
    integratedApproach: 'Support thyroid with Ashwagandha, diet. Ashwagandha may potentially affect thyroid levels.',
    safetyNotes: [
      'Ashwagandha may increase thyroid hormones',
      'Take herbs 4 hours apart from levothyroxine',
      'Regular thyroid function tests',
      'Monitor for over/under treatment',
      'Avoid kapha-increasing foods'
    ],
    monitoringParameters: ['TSH', 'T3', 'T4']
  },
  {
    condition: 'Asthma/COPD',
    ayurvedicCorrelation: 'Swasa / Tamaka Shwasa',
    allopathyTreatment: 'Bronchodilators, Inhaled corticosteroids, Leukotriene modifiers',
    integratedApproach: 'Vamana, Virechana, herbs like Vasa, Pippali + inhalers. Breathing exercises.',
    safetyNotes: [
      'Avoid sedating herbs with bronchodilators',
      'Garlic may have additive effect',
      'Continue prescribed inhalers',
      'Emergency medications always available',
      'Avoid cold, dust, smoke'
    ],
    monitoringParameters: ['PEFR', 'Symptom diary', 'Exacerbation frequency']
  },
  {
    condition: 'Skin Conditions (Psoriasis/Eczema)',
    ayurvedicCorrelation: 'Kushhta',
    allopathyTreatment: 'Topical steroids, Immunosuppressants, Biologics',
    integratedApproach: 'Panchakarma + neem, turmeric externally + internal. Support liver.',
    safetyNotes: [
      'Turmeric may interact with immunosuppressants',
      'Avoid self-medication during flares',
      'Coordinate with dermatologist',
      'Monitor liver function',
      'Avoid trigger foods'
    ],
    monitoringParameters: ['PASI score', 'Side effects', 'Liver function']
  },
  {
    condition: 'Fertility (Male/Female)',
    ayurvedicCorrelation: 'Shukra Dhatu imbalance',
    allopathyTreatment: 'Clomiphene, ART, Hormonal therapies',
    integratedApproach: 'Shatavari, Ashwagandha + lifestyle. Panchakarma for detoxification.',
    safetyNotes: [
      'Shatavari may affect estrogen',
      'Ashwagandha may affect testosterone',
      'Avoid with unexplained infertility',
      'Coordinate with fertility specialist',
      '3-6 month timeline for herbs'
    ],
    monitoringParameters: ['Hormone levels', 'Pregnancy test']
  },
  {
    condition: 'Insomnia',
    ayurvedicCorrelation: 'Nidra Nasha',
    allopathyTreatment: 'Benzodiazepines, Z-drugs, Melatonin',
    integratedApproach: 'Ashwagandha, Brahmi, meditation + sleep hygiene. Reduce allopathic gradually.',
    safetyNotes: [
      'Ashwagandha may potentiate sedatives',
      'Do not combine with alcohol',
      'Short-term only for allopathic',
      'Sleep hygiene essential',
      'Regular schedule important'
    ],
    monitoringParameters: ['Sleep diary', 'Daytime sleepiness']
  },
  {
    condition: 'GERD/Acid Reflux',
    ayurvedicCorrelation: 'Amlapitta',
    allopathyTreatment: 'PPIs, H2 blockers, Antacids',
    integratedApproach: 'Avipattikar churna, lifestyle. Turmeric may help but avoid with PPIs.',
    safetyNotes: [
      'Turmeric may reduce PPIs efficacy',
      'Avoid spicy foods with medications',
      'Take medications before meals',
      'Avoid lying down after meals',
      'Weight management essential'
    ],
    monitoringParameters: ['Symptom diary', 'Endoscopy if needed']
  },
  {
    condition: 'Cancer (Adjunct)',
    ayurvedicCorrelation: 'Granthi, Arbuda',
    allopathyTreatment: 'Chemotherapy, Radiation, Surgery, Immunotherapy',
    integratedApproach: 'Supportive - Ashwagandha for immunity, Turmeric for inflammation. NOT as primary treatment.',
    safetyNotes: [
      'DO NOT replace conventional treatment',
      'Many herbs may interact with chemotherapy',
      'Consult oncologist before any herbs',
      'Ashwagandha may be contraindicated in some cancers',
      'Focus on quality of life support'
    ],
    monitoringParameters: ['As per oncologist', 'Blood counts', 'Side effects']
  }
]

export const DRUG_INTERACTION_DATABASE = {
  highRisk: [
    { herb: 'St. Johns Wort', drugs: ['Warfarin', 'SSRI', 'Birth control', 'HIV meds', 'Chemotherapy'], reason: 'Strong enzyme induction' },
    { herb: 'Garlic', drugs: ['Warfarin', 'HIV protease inhibitors'], reason: 'Bleeding risk, reduced drug levels' },
    { herb: 'Ginkgo', drugs: ['Warfarin', 'Aspirin', 'Clopidogrel'], reason: 'Bleeding risk' },
    { herb: 'Kava', drugs: ['Acetaminophen', 'Sedatives'], reason: 'Liver toxicity, CNS depression' }
  ],
  moderateRisk: [
    { herb: 'Ashwagandha', drugs: ['Sedatives', 'Thyroid', 'Immunosuppressants'], reason: 'Additive effects' },
    { herb: 'Guggulu', drugs: ['Statins', 'Thyroid', 'Anticoagulants'], reason: 'Various mechanisms' },
    { herb: 'Turmeric', drugs: ['Anticoagulants', 'Antacids'], reason: 'Bleeding risk, absorption' },
    { herb: 'Ginger', drugs: ['Anticoagulants', 'Diabetes'], reason: 'Bleeding, hypoglycemia' }
  ],
  safeToCombine: [
    { herb: 'Arjuna', drugs: ['Most cardiac medications'], reason: 'Generally safe, may be beneficial' },
    { herb: 'Amla', drugs: ['Most medications'], reason: 'General tonic, may enhance absorption' },
    { herb: 'Guduchi', drugs: ['Most medications'], reason: 'Immune modulator, generally safe' },
    { herb: 'Turmeric', drugs: ['Many - with monitoring'], reason: 'Beneficial but monitor bleeding risk' }
  ]
}

export const PRESCRIBING_GUIDELINES = {
  beforeCombining: [
    'Consult qualified Ayurvedic practitioner',
    'Disclose all medications to both practitioners',
    'Start with single herb at low dose',
    'Monitor for side effects',
    'Keep 2-3 hour gap between herbs and medications',
    'Regular follow-up'
  ],
  contraindications: [
    'Pregnancy - avoid most herbs',
    'Breastfeeding - limited herbs safe',
    'Kidney/liver disease - avoid many herbs',
    'Autoimmune conditions - avoid immune-stimulating herbs',
    'Surgery - stop herbs 2 weeks before'
  ],
  generalPrinciples: [
    'Prakriti-based prescription',
    'Start low, go slow',
    'Quality matters - use reputed brands',
    'Seasonal considerations',
    'Pathya (diet) as important as medicine',
    'Duration: Acute 1-2 weeks, Chronic 1-3 months'
  ]
}

export const SAFETY_WARNINGS = {
  scheduleE1: [
    'Bhallataka (Semecarpus anacardium) - toxic, requires processing',
    'Vatsanabha (Aconitum ferox) - toxic, must be purified',
    'Gunja (Abrus precatorius) - toxic, careful dosing',
    'Kupilu (Strychnos nux-vomica) - toxic, processed only'
  ],
  heavyMetals: [
    'Rasaushadha (herbo-mineral) must be from trusted sources',
    'Shodhita (purified) vs. Ashodhita (unpurified)',
    'Test for heavy metals if uncertain',
    'Not for long-term use',
    'Avoid in pregnancy and children'
  ],
  qualityConcerns: [
    'Adulteration common in commercial products',
    'Source from GMP-certified manufacturers',
    'Check for FSSAI/AYUSH certification',
    'Avoid products with unclear labeling',
    'When in doubt, use raw herbs'
  ]
}