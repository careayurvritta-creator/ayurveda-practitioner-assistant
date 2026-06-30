/**
 * Clinical Lab Values — Ayurvedic Interpretation Module
 *
 * Maps common clinical laboratory tests to Ayurvedic concepts,
 * enabling the AI to interpret lab results within Ayurvedic context.
 *
 * Categories covered:
 * - Hematology (CBC)
 * - Blood Sugar
 * - Lipid Profile
 * - Liver Function Tests (LFT)
 * - Kidney Function Tests (KFT)
 * - Thyroid Profile
 * - Iron Studies
 * - Vitamin Levels
 * - Urinalysis
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type LabCategory =
  | 'Hematology'
  | 'Blood Sugar'
  | 'Lipid Profile'
  | 'Liver Function Tests'
  | 'Kidney Function Tests'
  | 'Thyroid Profile'
  | 'Iron Studies'
  | 'Vitamin Levels'
  | 'Urinalysis';

export interface DoshaCorrelation {
  primaryDosha: string;
  secondaryDosha?: string;
  doshaEffect: string;
  sanskrit: string;
  devanagari: string;
}

export interface AyurvedicInterpretation {
  low: string;
  normal: string;
  high: string;
}

export interface LabTest {
  name: string;
  category: LabCategory;
  normalRange: string;
  unit: string;
  ayurvedicInterpretation: AyurvedicInterpretation;
  doshaCorrelation: DoshaCorrelation;
  clinicalSignificance: string;
  sanskritTerm: string;
  devanagariTerm: string;
}

export interface LabInterpretationResult {
  testName: string;
  value: number;
  normalRange: string;
  status: 'low' | 'normal' | 'high';
  ayurvedicMeaning: string;
  doshaImpact: string;
  recommendation: string;
}

export interface AyurvedicLabSummary {
  overallDoshaStatus: string;
  agniStatus: string;
  dhatuStatus: string;
  srotasStatus: string;
  primaryConcerns: string[];
  ayurvedicRecommendations: string[];
  doshaAnalysis: {
    vata: string;
    pitta: string;
    kapha: string;
  };
}

// ─── Lab Test Database ──────────────────────────────────────────────────────

export const LAB_TESTS: LabTest[] = [
  // ── HEMATOLOGY (CBC) ──────────────────────────────────────────────────────
  {
    name: 'Hemoglobin',
    category: 'Hematology',
    normalRange: '12-16',
    unit: 'g/dL',
    ayurvedicInterpretation: {
      low: 'Indicates Pandu (पाण्डु) — Anemia. Reflects Rakta dhatu kshaya (depletion of blood tissue) and Mandagni (weak digestive fire) leading to poor Rasa-Rakta dhatu formation.',
      normal: 'Balanced Rakta dhatu with adequate Agni for nutrient transformation. Indicates good Ojas (vital essence).',
      high: 'May indicate Raktapitta (रक्तपित्त) risk — excessive Pitta in Rakta dhatu. Can also suggest dehydration or Polycythemia.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      secondaryDosha: 'Vata',
      doshaEffect: 'Low Hb = Vata-Pitta imbalance (Pandu). High Hb = Pitta aggravation (Raktapitta).',
      sanskrit: 'रक्त धातु परीक्षा',
      devanagari: 'Hemoglobin',
    },
    clinicalSignificance: 'Core marker for Pandu (anemia) diagnosis. Low values correlate with Rasavaha Srotas Dushti and Mandagni.',
    sanskritTerm: 'पाण्डु',
    devanagariTerm: 'Hemoglobin',
  },
  {
    name: 'Total Leukocyte Count',
    category: 'Hematology',
    normalRange: '4000-11000',
    unit: 'cells/μL',
    ayurvedicInterpretation: {
      low: 'Indicates Vyadhikshamatva (व्याधिक्षमत्व) — low immunity. Reflects depletion of body\'s defensive Ojas and weak Agni.',
      normal: 'Balanced Vyadhikshamatva with adequate Ojas. Body has competent defensive mechanisms.',
      high: 'Indicates Ksha (क्ष) — infection/inflammation. Reflects amplified Pitta response or Kapha aggregation in immune tissue.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      secondaryDosha: 'Kapha',
      doshaEffect: 'High TLC = Pitta (inflammation) or Kapha (infection). Low TLC = Vata (depletion) or overall Ojas kshaya.',
      sanskrit: 'श्वेत रक्त कण संख्या',
      devanagari: 'WBC Count',
    },
    clinicalSignificance: 'Reflects Vyadhikshamatva (immune status). High = active immune response (infection/inflammation). Low = immunocompromised state.',
    sanskritTerm: 'व्याधिक्षमत्व',
    devanagariTerm: 'WBC Count',
  },
  {
    name: 'Neutrophils',
    category: 'Hematology',
    normalRange: '40-70',
    unit: '%',
    ayurvedicInterpretation: {
      low: 'Neutropenia — indicates Pitta Kshaya (reduced Pitta response). Susceptibility to infections. Reflects weak Agni.',
      normal: 'Balanced Pitta response in immune defense.',
      high: 'Neutrophilia — indicates Pitta aggravation with active inflammatory response. Suggests Krimi (microbial invasion) or VataVyadhi.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      doshaEffect: 'Neutrophilia = Pitta excess. Neutropenia = Pitta deficiency or Vyadhikshamatva compromise.',
      sanskrit: 'न्यूट्रोफिल परीक्षा',
      devanagari: 'Neutrophils',
    },
    clinicalSignificance: 'First-line immune defense marker. Neutrophilia indicates acute infection/inflammation (Pitta response).',
    sanskritTerm: 'पित्त प्रतिरक्षा',
    devanagariTerm: 'Neutrophils',
  },
  {
    name: 'Lymphocytes',
    category: 'Hematology',
    normalRange: '20-40',
    unit: '%',
    ayurvedicInterpretation: {
      low: 'Lymphopenia — indicates Ojas kshaya (vital essence depletion). Weak adaptive immunity.',
      normal: 'Balanced Kapha-Ojas in immune system.',
      high: 'Lymphocytosis — indicates Kapha aggregation or chronic infection. May reflect Grahi (absorptive) issues.',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      doshaEffect: 'Lymphocytosis = Kapha excess. Lymphopenia = Kapha-Ojas depletion.',
      sanskrit: 'लिम्फोसाइट परीक्षा',
      devanagari: 'Lymphocytes',
    },
    clinicalSignificance: 'Reflects chronic immune status and Kapha-Ojas balance. Important in chronic disease assessment.',
    sanskritTerm: 'ओजस् परीक्षा',
    devanagariTerm: 'Lymphocytes',
  },
  {
    name: 'Platelet Count',
    category: 'Hematology',
    normalRange: '150000-400000',
    unit: 'cells/μL',
    ayurvedicInterpretation: {
      low: 'Thrombocytopenia — indicates Raktapitta (रक्तपित्त) risk. Rakta dhatu dushti with bleeding tendencies.',
      normal: 'Balanced Rakta dhatu with proper coagulation capacity.',
      high: 'Thrombocytosis — indicates Rakta Dushti (रक्त दूषित) with tendency toward thrombosis. Pitta-Vata aggravation.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      secondaryDosha: 'Vata',
      doshaEffect: 'Low = Pitta vitiation in Rakta (Raktapitta). High = Rakta Dushti with Vata aggravation.',
      sanskrit: 'प्लेटलेट संख्या',
      devanagari: 'Platelet Count',
    },
    clinicalSignificance: 'Critical for Raktapitta assessment. Low counts = bleeding risk. High counts = thrombotic risk.',
    sanskritTerm: 'रक्तपित्त',
    devanagariTerm: 'Platelet Count',
  },
  {
    name: 'Erythrocyte Sedimentation Rate',
    category: 'Hematology',
    normalRange: '0-20',
    unit: 'mm/hr',
    ayurvedicInterpretation: {
      low: 'Generally not clinically significant. May indicate Rasa dhatu excess.',
      normal: 'Balanced inflammatory status.',
      high: 'Elevated ESR indicates Amavisha (आमविष) — toxic accumulation and Pitta aggravation. Reflects active inflammation or infection.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      secondaryDosha: 'Kapha',
      doshaEffect: 'High ESR = Pitta aggravation with Amavisha. Kapha involvement in chronic inflammation.',
      sanskrit: 'रक्त गति परीक्षा',
      devanagari: 'ESR',
    },
    clinicalSignificance: 'Non-specific inflammation marker. High values suggest Amavisha, Pitta vitiation, or chronic disease.',
    sanskritTerm: 'आमविष',
    devanagariTerm: 'ESR',
  },
  {
    name: 'RBC Count',
    category: 'Hematology',
    normalRange: '4.0-5.5',
    unit: 'million/μL',
    ayurvedicInterpretation: {
      low: 'Pandu (पाण्डु) — anemia. Rakta dhatu kshaya due to Mandagni or Rasa dhatu contamination.',
      normal: 'Balanced Rakta dhatu formation with adequate Agni.',
      high: 'Raktapitta risk or dehydration. Excess Rakta dhatu production.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      secondaryDosha: 'Vata',
      doshaEffect: 'Low = Vata-Pitta (Pandu). High = Pitta excess (Raktapitta).',
      sanskrit: 'रक्त कण संख्या',
      devanagari: 'RBC Count',
    },
    clinicalSignificance: 'Direct measure of Rakta dhatu quantity. Essential for Pandu diagnosis.',
    sanskritTerm: 'पाण्डु',
    devanagariTerm: 'RBC Count',
  },

  // ── BLOOD SUGAR ───────────────────────────────────────────────────────────
  {
    name: 'Fasting Blood Sugar',
    category: 'Blood Sugar',
    normalRange: '70-100',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'Hypoglycemia — indicates Kshaya of Rasa dhatu. Weak Agni unable to maintain metabolic balance.',
      normal: 'Balanced Agni with proper Madhura Rasa conversion. Good Prameha prevention.',
      high: 'Prameha (प्रमेह) — diabetes risk. Indicates Kapha-Medovriddhi blocking channels. Pre-diabetic if 100-125.',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      secondaryDosha: 'Pitta',
      doshaEffect: 'High = Kapha aggregation (Prameha). Low = Vata-Rasa kshaya.',
      sanskrit: 'प्रमेह परीक्षा',
      devanagari: 'FBS',
    },
    clinicalSignificance: 'Primary marker for Prameha (diabetes mellitus). Elevated levels indicate Medovriddhi and channel blockage.',
    sanskritTerm: 'प्रमेह',
    devanagariTerm: 'Fasting Blood Sugar',
  },
  {
    name: 'Post Prandial Blood Sugar',
    category: 'Blood Sugar',
    normalRange: '70-140',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'Post-meal hypoglycemia — indicates Mandagni (weak digestive fire) unable to process nutrients.',
      normal: 'Balanced Agni properly processing Ahara Rasa. Good metabolic function.',
      high: 'Prameha staging — indicates Kleda (moisture) accumulation in Rasavaha Srotas. 140-200 = impaired glucose tolerance.',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      secondaryDosha: 'Pitta',
      doshaEffect: 'High = Kapha-Vata Prameha pattern. Reflects channel obstruction.',
      sanskrit: 'भोजनोत्तर प्रमेह परीक्षा',
      devanagari: 'PPBS',
    },
    clinicalSignificance: 'Assesses post-prandial Agni function. Important for Prameha staging and Meda dhatu assessment.',
    sanskritTerm: 'प्रमेह स्थायी',
    devanagariTerm: 'PPBS',
  },
  {
    name: 'HbA1c',
    category: 'Blood Sugar',
    normalRange: '4.0-5.6',
    unit: '%',
    ayurvedicInterpretation: {
      low: 'Not typically clinically significant.',
      normal: 'Long-term Madhura Rasa balance. Good chronic metabolic health.',
      high: 'Madhumeha (मधुमेह) chronicity — indicates chronic Prameha with sustained channel damage. 5.7-6.4 = pre-diabetes, >6.5 = diabetes.',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      secondaryDosha: 'Pitta',
      doshaEffect: 'High = Chronic Kapha aggregation with Meda dhatu vitiation. Long-term Prameha.',
      sanskrit: 'मधुमेह दीर्घकालिक परीक्षा',
      devanagari: 'HbA1c',
    },
    clinicalSignificance: '3-month average of blood sugar. Critical for Madhumeha chronicity assessment and prognosis.',
    sanskritTerm: 'मधुमेह',
    devanagariTerm: 'HbA1c',
  },

  // ── LIPID PROFILE ─────────────────────────────────────────────────────────
  {
    name: 'Total Cholesterol',
    category: 'Lipid Profile',
    normalRange: '<200',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'May indicate Rasa-Rakta kshaya (tissue depletion).',
      normal: 'Balanced Meda dhatu with proper fat metabolism.',
      high: 'Medoroga (मेदोरोग) — indicates Kapha accumulation and Meda dhatu vriddhi. Channel blockage (Srotavarodha).',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      secondaryDosha: 'Vata',
      doshaEffect: 'High = Kapha accumulation (Medoroga). Vata involvement in channel blockage.',
      sanskrit: 'मेदो रोग परीक्षा',
      devanagari: 'Total Cholesterol',
    },
    clinicalSignificance: 'Primary marker for Medoroga. High values indicate Srotavarodha and Kapha aggregation.',
    sanskritTerm: 'मेदोरोग',
    devanagariTerm: 'Total Cholesterol',
  },
  {
    name: 'LDL Cholesterol',
    category: 'Lipid Profile',
    normalRange: '<100',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'Not typically concerning. May indicate Rasa dhatu insufficiency.',
      normal: 'Balanced channel patency with adequate fat transport.',
      high: 'Bad cholesterol — indicates Kapha blockage in Rasa-Rakta Vaha Srotas. Srotavarodha with Ama accumulation.',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      doshaEffect: 'High LDL = Kapha channel blockage. Major risk factor for Hridroga (heart disease).',
      sanskrit: 'रक्त वाहिनी अवरोध परीक्षा',
      devanagari: 'LDL',
    },
    clinicalSignificance: 'Key marker for channel blockage (Srotavarodha). High LDL = Kapha aggregation in vascular channels.',
    sanskritTerm: 'स्रोतोवरोध',
    devanagariTerm: 'LDL Cholesterol',
  },
  {
    name: 'HDL Cholesterol',
    category: 'Lipid Profile',
    normalRange: '>40',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'Reduced Ojas (ओजस्) — indicates depleted vital essence. Poor protective mechanisms.',
      normal: 'Good Ojas levels with protective lipid metabolism. Balanced Meda dhatu function.',
      high: 'Enhanced Ojas and channel protection. Generally beneficial for Hridaya (heart).',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      doshaEffect: 'High HDL = Good Ojas. Low HDL = Ojas kshaya with Meda dhatu dysfunction.',
      sanskrit: 'ओजस् परीक्षा',
      devanagari: 'HDL',
    },
    clinicalSignificance: 'Protective cholesterol. Reflects Ojas status and Meda dhatu quality.',
    sanskritTerm: 'ओजस्',
    devanagariTerm: 'HDL Cholesterol',
  },
  {
    name: 'Triglycerides',
    category: 'Lipid Profile',
    normalRange: '<150',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'May indicate Meda dhatu kshaya.',
      normal: 'Balanced Meda dhatu with proper fat metabolism.',
      high: 'Meda dhatu vriddhi — indicates Kapha aggregation and Medovriddhi. Srotavarodha in Medovaha Srotas.',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      doshaEffect: 'High = Kapha-Meda excess. Strong correlation with Medoroga and Sthoulya (obesity).',
      sanskrit: 'मेदो वृद्धि परीक्षा',
      devanagari: 'Triglycerides',
    },
    clinicalSignificance: 'Direct measure of Meda dhatu accumulation. High values = Medovriddhi and channel obstruction.',
    sanskritTerm: 'मेदोवृद्धि',
    devanagariTerm: 'Triglycerides',
  },
  {
    name: 'VLDL Cholesterol',
    category: 'Lipid Profile',
    normalRange: '<30',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'Not typically clinically significant.',
      normal: 'Balanced fat transport metabolism.',
      high: 'Metabolic syndrome marker — indicates Sama Agni (contaminated digestive fire) with Meda-Mansa dhatu contamination.',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      secondaryDosha: 'Pitta',
      doshaEffect: 'High = Kapha-Pitta metabolic dysfunction. Sama Agni with Ama formation.',
      sanskrit: 'साम अग्नि परीक्षा',
      devanagari: 'VLDL',
    },
    clinicalSignificance: 'Marker for metabolic syndrome. Reflects Sama Agni and Ama formation in lipid metabolism.',
    sanskritTerm: 'सामाग्नि',
    devanagariTerm: 'VLDL',
  },

  // ── LIVER FUNCTION TESTS (LFT) ───────────────────────────────────────────
  {
    name: 'SGOT (AST)',
    category: 'Liver Function Tests',
    normalRange: '5-40',
    unit: 'U/L',
    ayurvedicInterpretation: {
      low: 'Not typically clinically significant.',
      normal: 'Balanced Yakrit (यकृत) function with healthy Pitta metabolism.',
      high: 'Kamala (कमला) — indicates Yakrit vikara (liver disorder). Pitta vitiation in Yakrit Raha Srotas.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      doshaEffect: 'High SGOT = Pitta vitiation in liver. Indicates Kamala (jaundice) or Yakrit Vikara.',
      sanskrit: 'यकृत विकार परीक्षा',
      devanagari: 'SGOT/AST',
    },
    clinicalSignificance: 'Key marker for Yakrit (liver) damage. High values indicate Pitta vitiation and Kamala risk.',
    sanskritTerm: 'कमला',
    devanagariTerm: 'SGOT/AST',
  },
  {
    name: 'SGPT (ALT)',
    category: 'Liver Function Tests',
    normalRange: '7-56',
    unit: 'U/L',
    ayurvedicInterpretation: {
      low: 'Not typically clinically significant.',
      normal: 'Balanced Pitta metabolism in Yakrit.',
      high: 'Pitta vitiation — indicates active liver cell damage. Reflects Rakta-Pitta contamination.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      doshaEffect: 'High SGPT = Pitta excess in liver. More specific marker for hepatic inflammation.',
      sanskrit: 'पित्त प्रकोप परीक्षा',
      devanagari: 'SGPT/ALT',
    },
    clinicalSignificance: 'More specific marker for hepatic cell damage than SGOT. Indicates Pitta vitiation in Yakrit.',
    sanskritTerm: 'पित्त प्रकोप',
    devanagariTerm: 'SGPT/ALT',
  },
  {
    name: 'Alkaline Phosphatase',
    category: 'Liver Function Tests',
    normalRange: '44-147',
    unit: 'U/L',
    ayurvedicInterpretation: {
      low: 'May indicate Rasa dhatu kshaya.',
      normal: 'Balanced biliary function and Agni.',
      high: 'Biliary obstruction — indicates Pitta Sanga (bile stasis) or Yakrit-Pliha vikara.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      secondaryDosha: 'Kapha',
      doshaEffect: 'High = Pitta obstruction (Pitta Sanga). May indicate Kapha aggregation in biliary channels.',
      sanskrit: 'पित्त संग परीक्षा',
      devanagari: 'Alkaline Phosphatase',
    },
    clinicalSignificance: 'Marker for biliary obstruction and bone disorders. High values indicate Pitta Sanga or channel blockage.',
    sanskritTerm: 'पित्तसंग',
    devanagariTerm: 'Alkaline Phosphatase',
  },
  {
    name: 'Total Bilirubin',
    category: 'Liver Function Tests',
    normalRange: '0.1-1.2',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'Not typically clinically significant.',
      normal: 'Balanced Pitta metabolism with proper bile flow.',
      high: 'Kamala (कमला) — jaundice. Indicates Pitta vitiation in Rasa-Rakta Vaha Srotas.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      doshaEffect: 'High bilirubin = Pitta accumulation (Kamala). Classic sign of Pitta Vikara.',
      sanskrit: 'कमला परीक्षा',
      devanagari: 'Total Bilirubin',
    },
    clinicalSignificance: 'Primary marker for Kamala (jaundice). High values confirm Pitta vitiation in Rakta dhatu.',
    sanskritTerm: 'कमला',
    devanagariTerm: 'Total Bilirubin',
  },
  {
    name: 'Direct Bilirubin',
    category: 'Liver Function Tests',
    normalRange: '0.0-0.3',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'Not typically clinically significant.',
      normal: 'Balanced conjugation and excretion of Pitta (bile).',
      high: 'Obstructive jaundice — indicates Pitta Sanga (bile duct obstruction). Yakrit-Pliha Srotavarodha.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      doshaEffect: 'High direct bilirubin = Pitta obstruction. Indicates obstructive cause of Kamala.',
      sanskrit: 'पित्त निकास अवरोध परीक्षा',
      devanagari: 'Direct Bilirubin',
    },
    clinicalSignificance: 'Differentiates obstructive from non-cause of jaundice. High = Pitta Sanga.',
    sanskritTerm: 'पित्तसंग',
    devanagariTerm: 'Direct Bilirubin',
  },
  {
    name: 'Indirect Bilirubin',
    category: 'Liver Function Tests',
    normalRange: '0.1-0.9',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'Not typically clinically significant.',
      normal: 'Balanced hemoglobin breakdown and liver processing.',
      high: 'Hemolytic condition — indicates excessive Rakta dhatu destruction. Pandu with jaundice.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      secondaryDosha: 'Vata',
      doshaEffect: 'High indirect = Pitta-Vata pattern. Vata causing Rakta destruction (hemolysis).',
      sanskrit: 'रक्त क्षय परीक्षा',
      devanagari: 'Indirect Bilirubin',
    },
    clinicalSignificance: 'Indicates hemolytic conditions. High = Rakta dhatu destruction with Pitta accumulation.',
    sanskritTerm: 'पाण्डुकामला',
    devanagariTerm: 'Indirect Bilirubin',
  },
  {
    name: 'Albumin',
    category: 'Liver Function Tests',
    normalRange: '3.5-5.0',
    unit: 'g/dL',
    ayurvedicInterpretation: {
      low: 'Dhatu Kshaya (धातु क्षय) — tissue depletion. Indicates malnutrition or chronic disease with Rasavaha Srotas depletion.',
      normal: 'Balanced Rasa dhatu with adequate protein synthesis. Good Ojas status.',
      high: 'Dehydration — indicates Rasa dhatu concentration. May mask actual protein status.',
    },
    doshaCorrelation: {
      primaryDosha: 'Vata',
      secondaryDosha: 'Kapha',
      doshaEffect: 'Low = Vata-mediated Dhatu Kshaya. High = Kapha concentration (dehydration).',
      sanskrit: 'धातु क्षय परीक्षा',
      devanagari: 'Albumin',
    },
    clinicalSignificance: 'Marker for nutritional status and Rasa dhatu quality. Low = Dhatu Kshaya, chronic disease.',
    sanskritTerm: 'धातुक्षय',
    devanagariTerm: 'Albumin',
  },
  {
    name: 'Globulin',
    category: 'Liver Function Tests',
    normalRange: '2.0-3.5',
    unit: 'g/dL',
    ayurvedicInterpretation: {
      low: 'Reduced immune status — indicates Ojas kshaya.',
      normal: 'Balanced immune function with adequate Ojas.',
      high: 'Chronic inflammation or infection — indicates amplified Pitta/Kapha immune response.',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      doshaEffect: 'High = Kapha immune amplification. Low = Ojas depletion.',
      sanskrit: 'ओजस् प्रतिरक्षा परीक्षा',
      devanagari: 'Globulin',
    },
    clinicalSignificance: 'Reflects immune status and Ojas. High globulin = chronic inflammation; Low = immune compromise.',
    sanskritTerm: 'ओजस्',
    devanagariTerm: 'Globulin',
  },

  // ── KIDNEY FUNCTION TESTS (KFT) ──────────────────────────────────────────
  {
    name: 'Blood Urea Nitrogen',
    category: 'Kidney Function Tests',
    normalRange: '7-20',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'May indicate protein malnutrition or liver dysfunction.',
      normal: 'Balanced Mutra Vaha Srotas function with proper waste elimination.',
      high: 'Mutra Vaha Srotas Dushti — indicates kidney channel obstruction. Reflects Vata vitiation in urinary system.',
    },
    doshaCorrelation: {
      primaryDosha: 'Vata',
      secondaryDosha: 'Pitta',
      doshaEffect: 'High BUN = Vata vitiation in Mutra Vaha Srotas. May indicate Pitta involvement in urinary inflammation.',
      sanskrit: 'मूत्र वाह स्रोत परीक्षा',
      devanagari: 'BUN',
    },
    clinicalSignificance: 'Primary marker for Mutra Vaha Srotas function. High values indicate kidney channel dysfunction.',
    sanskritTerm: 'मूत्रवाहस्रोतस्',
    devanagariTerm: 'BUN',
  },
  {
    name: 'Serum Creatinine',
    category: 'Kidney Function Tests',
    normalRange: '0.6-1.2',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'May indicate low muscle mass or Rasavaha Srotas insufficiency.',
      normal: 'Balanced Mutra Vaha Srotas with adequate kidney filtration.',
      high: 'Vata vitiation in kidney — indicates Vata Vikara affecting renal function. Prameha complications.',
    },
    doshaCorrelation: {
      primaryDosha: 'Vata',
      doshaEffect: 'High creatinine = Vata vitiation in kidneys. Most specific marker for renal Vata.',
      sanskrit: 'वात विकार परीक्षा',
      devanagari: 'Serum Creatinine',
    },
    clinicalSignificance: 'Most specific marker for kidney function. High = Vata Vikara in Mutra Vaha Srotas.',
    sanskritTerm: 'वातविकार',
    devanagariTerm: 'Serum Creatinine',
  },
  {
    name: 'Uric Acid',
    category: 'Kidney Function Tests',
    normalRange: '3.5-7.2',
    unit: 'mg/dL',
    ayurvedicInterpretation: {
      low: 'Not typically clinically significant.',
      normal: 'Balanced Vata-Pitta metabolism in urinary system.',
      high: 'Vatarakta (वातरक्त) — gout. Indicates Vata vitiation with Rakta dhatu contamination. Sandhishoola risk.',
    },
    doshaCorrelation: {
      primaryDosha: 'Vata',
      secondaryDosha: 'Pitta',
      doshaEffect: 'High uric acid = Vata-Rakta vitiation (Vatarakta). Classic Vata Vikara pattern.',
      sanskrit: 'वातरक्त परीक्षा',
      devanagari: 'Uric Acid',
    },
    clinicalSignificance: 'Primary marker for Vatarakta (gout). High values indicate Vata-Rakta Dushti.',
    sanskritTerm: 'वातरक्त',
    devanagariTerm: 'Uric Acid',
  },
  {
    name: 'eGFR',
    category: 'Kidney Function Tests',
    normalRange: '>60',
    unit: 'mL/min/1.73m²',
    ayurvedicInterpretation: {
      low: 'Mutra Vaha Srotas Dushti — indicates progressive kidney channel damage. <60 = chronic kidney disease.',
      normal: 'Adequate Mutra Vaha Srotas filtration capacity.',
      high: 'Hyperfiltration — may indicate early Prameha with increased renal workload.',
    },
    doshaCorrelation: {
      primaryDosha: 'Vata',
      doshaEffect: 'Low eGFR = Vata-mediated kidney channel deterioration. Progressive Vata Vikara.',
      sanskrit: 'मूत्र वाह स्रोत क्षमता परीक्षा',
      devanagari: 'eGFR',
    },
    clinicalSignificance: 'Best overall marker for kidney function. Low = progressive Vata Vikara in Mutra Vaha Srotas.',
    sanskritTerm: 'मूत्रवाहस्रोतक्षमता',
    devanagariTerm: 'eGFR',
  },

  // ── THYROID PROFILE ───────────────────────────────────────────────────────
  {
    name: 'TSH',
    category: 'Thyroid Profile',
    normalRange: '0.4-4.0',
    unit: 'mIU/L',
    ayurvedicInterpretation: {
      low: 'Hyperthyroidism — indicates Pitta aggravation with increased metabolic fire. Tikshnagni (sharp digestive fire).',
      normal: 'Balanced Galaganda function with harmonious Vata-Kapha metabolism.',
      high: 'Hypothyroidism — indicates Kapha aggregation with Vata suppression. Mandagni (slow digestive fire). Galaganda.',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      secondaryDosha: 'Vata',
      doshaEffect: 'High TSH = Kapha-Vata imbalance (hypothyroid). Low TSH = Pitta excess (hyperthyroid).',
      sanskrit: 'गलगण्ड परीक्षा',
      devanagari: 'TSH',
    },
    clinicalSignificance: 'Primary marker for Galaganda (goiter/thyroid disorders). Reflects Vata-Kapha metabolic balance.',
    sanskritTerm: 'गलगण्ड',
    devanagariTerm: 'TSH',
  },
  {
    name: 'T3',
    category: 'Thyroid Profile',
    normalRange: '80-200',
    unit: 'ng/dL',
    ayurvedicInterpretation: {
      low: 'Reduced metabolic activity — indicates Mandagni with Kapha aggregation.',
      normal: 'Balanced Tejas (metabolic essence) with harmonious Agni.',
      high: 'Increased metabolic fire — indicates Tikshnagni with Pitta aggravation.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      secondaryDosha: 'Kapha',
      doshaEffect: 'Low T3 = Kapha-Mandagni. High T3 = Pitta-Tikshnagni.',
      sanskrit: 'तेजस् परीक्षा',
      devanagari: 'T3',
    },
    clinicalSignificance: 'Active thyroid hormone. Reflects Tejas (metabolic essence) and Agni status.',
    sanskritTerm: 'तेजस्',
    devanagariTerm: 'T3',
  },
  {
    name: 'T4',
    category: 'Thyroid Profile',
    normalRange: '5.0-12.0',
    unit: 'μg/dL',
    ayurvedicInterpretation: {
      low: 'Reduced thyroid储备 — indicates Dhatu Kshaya in Galaganda region.',
      normal: 'Balanced thyroid储备 with adequate metabolic reserve.',
      high: 'Excess thyroid储备 — may indicate thyroid inflammation or Pitta aggression.',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      doshaEffect: 'Low T4 = Kapha-Vata depletion. High T4 = Pitta inflammation.',
      sanskrit: 'गलगण्ड धातु परीक्षा',
      devanagari: 'T4',
    },
    clinicalSignificance: 'Thyroid储备 marker. Important for assessing chronic Galaganda status.',
    sanskritTerm: 'गलगण्ड',
    devanagariTerm: 'T4',
  },

  // ── IRON STUDIES ───────────────────────────────────────────────────────────
  {
    name: 'Serum Iron',
    category: 'Iron Studies',
    normalRange: '60-170',
    unit: 'μg/dL',
    ayurvedicInterpretation: {
      low: 'Pandu (पाण्डु) — indicates iron deficiency anemia. Rasavaha Srotas insufficiency.',
      normal: 'Balanced Rakta dhatu with adequate Rakta formation capacity.',
      high: 'Iron overload — indicates Rakta Dushti with Pitta aggravation. Hemochromatosis risk.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      secondaryDosha: 'Vata',
      doshaEffect: 'Low = Vata-Pitta (Pandu). High = Pitta excess (Rakta Dushti).',
      sanskrit: 'पाण्डु लौह परीक्षा',
      devanagari: 'Serum Iron',
    },
    clinicalSignificance: 'Direct measure for Pandu assessment. Low = iron deficiency; High = iron overload with Rakta Dushti.',
    sanskritTerm: 'पाण्डु',
    devanagariTerm: 'Serum Iron',
  },
  {
    name: 'TIBC',
    category: 'Iron Studies',
    normalRange: '250-370',
    unit: 'μg/dL',
    ayurvedicInterpretation: {
      low: 'Iron overload — indicates Rakta Dushti with excess iron storage.',
      normal: 'Balanced iron binding capacity with proper Rakta dhatu metabolism.',
      high: 'Iron deficiency — body attempting to bind more iron. Reflects Pandu with increased demand.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      doshaEffect: 'High TIBC = Pitta-mediated iron demand (Pandu). Low TIBC = iron overload.',
      sanskrit: 'लौह बंधन क्षमता परीक्षा',
      devanagari: 'TIBC',
    },
    clinicalSignificance: 'Complementary to Serum Iron. High TIBC with low iron = true deficiency (Pandu).',
    sanskritTerm: 'लौहबंधनक्षमता',
    devanagariTerm: 'TIBC',
  },
  {
    name: 'Ferritin',
    category: 'Iron Studies',
    normalRange: '12-150',
    unit: 'ng/mL',
    ayurvedicInterpretation: {
      low: 'Dhatu iron store depletion — indicates Pandu with depleted Rakta dhatu reserves.',
      normal: 'Adequate iron stores with balanced Dhatu Parinama (tissue transformation).',
      high: 'Iron overload or inflammation — indicates Rakta Dushti or chronic Pitta-mediated inflammation.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      doshaEffect: 'Low ferritin = Pandu with depleted stores. High = Rakta Dushti or inflammatory state.',
      sanskrit: 'धातु लौह भंडार परीक्षा',
      devanagari: 'Ferritin',
    },
    clinicalSignificance: 'Marker for iron stores. Low = Pandu with depleted reserves; High = overload or inflammation.',
    sanskritTerm: 'धातुलौहभण्डार',
    devanagariTerm: 'Ferritin',
  },

  // ── VITAMIN LEVELS ────────────────────────────────────────────────────────
  {
    name: 'Vitamin D',
    category: 'Vitamin Levels',
    normalRange: '30-100',
    unit: 'ng/mL',
    ayurvedicInterpretation: {
      low: 'Dhatu Kshaya (धातु क्षय) — indicates Asthi dhatu depletion. Asthi-Majja Vata with bone health compromise.',
      normal: 'Balanced Asthi dhatu with adequate Dhatu Parinama. Good bone and joint health.',
      high: 'Vitamin D toxicity — indicates Pitta excess with Dhatu Dushti. Hypercalcemia risk.',
    },
    doshaCorrelation: {
      primaryDosha: 'Vata',
      secondaryDosha: 'Pitta',
      doshaEffect: 'Low = Vata vitiation in Asthi dhatu (Asthi Vata). High = Pitta excess.',
      sanskrit: 'अस्थि धातु परीक्षा',
      devanagari: 'Vitamin D',
    },
    clinicalSignificance: 'Critical for Asthi dhatu health. Low = Asthi Vata with Sandhigata Vata risk.',
    sanskritTerm: 'अस्थिधातु',
    devanagariTerm: 'Vitamin D',
  },
  {
    name: 'Vitamin B12',
    category: 'Vitamin Levels',
    normalRange: '200-900',
    unit: 'pg/mL',
    ayurvedicInterpretation: {
      low: 'Vata Vyadhi (वातव्याधि) — indicates neurological Vata vitiation. Majja dhatu depletion.',
      normal: 'Balanced Majja dhatu with adequate nervous system nourishment.',
      high: 'Not typically clinically significant from Ayurvedic perspective.',
    },
    doshaCorrelation: {
      primaryDosha: 'Vata',
      doshaEffect: 'Low B12 = Vata vitiation in Majja dhatu. Indicates Majja Vata with neurological symptoms.',
      sanskrit: 'मज्जा धातु परीक्षा',
      devanagari: 'Vitamin B12',
    },
    clinicalSignificance: 'Marker for Majja dhatu health. Low = Vata Vyadhi with neurological compromise.',
    sanskritTerm: 'मज्जाधातु',
    devanagariTerm: 'Vitamin B12',
  },

  // ── URINALYSIS ────────────────────────────────────────────────────────────
  {
    name: 'Urine pH',
    category: 'Urinalysis',
    normalRange: '4.5-8.0',
    unit: '',
    ayurvedicInterpretation: {
      low: 'Acidic urine — indicates Pitta aggravation in Mutra Vaha Srotas.',
      normal: 'Balanced dosha status in urinary system.',
      high: 'Alkaline urine — indicates Kapha aggregation or Vata vitiation in Mutra Vaha Srotas.',
    },
    doshaCorrelation: {
      primaryDosha: 'Pitta',
      secondaryDosha: 'Kapha',
      doshaEffect: 'Low pH = Pitta excess. High pH = Kapha or Vata involvement.',
      sanskrit: 'मूत्र अम्लता परीक्षा',
      devanagari: 'Urine pH',
    },
    clinicalSignificance: 'Reflects dosha status in urinary system. pH indicates acid-base balance and dosha predominance.',
    sanskritTerm: 'मूत्राम्लता',
    devanagariTerm: 'Urine pH',
  },
  {
    name: 'Urine Specific Gravity',
    category: 'Urinalysis',
    normalRange: '1.005-1.030',
    unit: '',
    ayurvedicInterpretation: {
      low: 'Dilute urine — indicates Kshaya of Rasa dhatu or Vishamagni (irregular digestive fire).',
      normal: 'Balanced Ushna (heat) and Agni status in urinary system.',
      high: 'Concentrated urine — indicates Ushna vriddhi (excess heat) or Rasa dhatu aggregation.',
    },
    doshaCorrelation: {
      primaryDosha: 'Vata',
      secondaryDosha: 'Pitta',
      doshaEffect: 'Low SG = Vata (depletion). High SG = Pitta (concentration) or Kapha (aggregation).',
      sanskrit: 'मूत्र गाढ़ता परीक्षा',
      devanagari: 'Urine Specific Gravity',
    },
    clinicalSignificance: 'Reflects hydration status and Agni. Important for assessing Rasa dhatu and Mutra Vaha Srotas.',
    sanskritTerm: 'मूत्रगाढ़ता',
    devanagariTerm: 'Urine Specific Gravity',
  },
  {
    name: 'Urine Glucose',
    category: 'Urinalysis',
    normalRange: 'Negative',
    unit: '',
    ayurvedicInterpretation: {
      low: 'Not applicable (qualitative test).',
      normal: 'Normal — indicates balanced Prameha status with proper channel function.',
      high: 'Prameha (प्रमेह) — glycosuria. Indicates channel blockage with sugar spilling into urine. Kapha obstruction.',
    },
    doshaCorrelation: {
      primaryDosha: 'Kapha',
      doshaEffect: 'Positive glucose = Kapha channel blockage (Prameha). Indicates Srotavarodha.',
      sanskrit: 'प्रमेह मूत्र परीक्षा',
      devanagari: 'Urine Glucose',
    },
    clinicalSignificance: 'Direct marker for Prameha. Positive = channel blockage with Madhura Rasa contamination.',
    sanskritTerm: 'प्रमेह',
    devanagariTerm: 'Urine Glucose',
  },
  {
    name: 'Urine Protein',
    category: 'Urinalysis',
    normalRange: 'Negative',
    unit: '',
    ayurvedicInterpretation: {
      low: 'Not applicable (qualitative test).',
      normal: 'Normal — indicates balanced Mutra Vaha Srotas with proper filtration.',
      high: 'Mutra Vaha Srotas Dushti — indicates kidney channel damage. Proteinuria with Dhatu Kshaya.',
    },
    doshaCorrelation: {
      primaryDosha: 'Vata',
      secondaryDosha: 'Pitta',
      doshaEffect: 'Positive protein = Vata vitiation in Mutra Vaha Srotas. May indicate Pitta inflammation.',
      sanskrit: 'मूत्र वाह स्रोत परीक्षा',
      devanagari: 'Urine Protein',
    },
    clinicalSignificance: 'Marker for kidney channel damage. Positive = Mutra Vaha Srotas Dushti with Dhatu Kshaya.',
    sanskritTerm: 'मूत्रवाहस्रोतदूषित',
    devanagariTerm: 'Urine Protein',
  },
  {
    name: 'Urine Ketones',
    category: 'Urinalysis',
    normalRange: 'Negative',
    unit: '',
    ayurvedicInterpretation: {
      low: 'Not applicable (qualitative test).',
      normal: 'Normal — indicates balanced Meda dhatu metabolism.',
      high: 'Dhatu Kshaya (धातु क्षय) — indicates tissue breakdown and fat metabolism. Madhumeha or fasting state.',
    },
    doshaCorrelation: {
      primaryDosha: 'Vata',
      secondaryDosha: 'Kapha',
      doshaEffect: 'Positive ketones = Vata-mediated Dhatu Kshaya. Indicates tissue catabolism.',
      sanskrit: 'धातु क्षय मूत्र परीक्षा',
      devanagari: 'Urine Ketones',
    },
    clinicalSignificance: 'Marker for fat metabolism and Dhatu Kshaya. Positive = tissue catabolism or Madhumeha.',
    sanskritTerm: 'धातुक्षय',
    devanagariTerm: 'Urine Ketones',
  },
];

// ─── Search Function ────────────────────────────────────────────────────────

/**
 * Search lab tests by name, category, or Sanskrit term.
 */
export function searchLabTests(query: string): LabTest[] {
  const lowerQuery = query.toLowerCase();
  return LAB_TESTS.filter(
    (test) =>
      test.name.toLowerCase().includes(lowerQuery) ||
      test.category.toLowerCase().includes(lowerQuery) ||
      test.sanskritTerm.toLowerCase().includes(lowerQuery) ||
      test.devanagariTerm.toLowerCase().includes(lowerQuery) ||
      test.ayurvedicInterpretation.low.toLowerCase().includes(lowerQuery) ||
      test.ayurvedicInterpretation.high.toLowerCase().includes(lowerQuery)
  );
}

// ─── Individual Test Interpretation ─────────────────────────────────────────

/**
 * Interpret a single lab test value against its normal range.
 */
export function getLabInterpretation(
  testName: string,
  value: number
): LabInterpretationResult | null {
  const test = LAB_TESTS.find(
    (t) => t.name.toLowerCase() === testName.toLowerCase()
  );
  if (!test) return null;

  const range = test.normalRange.split('-').map(Number);
  const low = range[0];
  const high = range[1];

  let status: 'low' | 'normal' | 'high';
  let ayurvedicMeaning: string;

  if (value < low) {
    status = 'low';
    ayurvedicMeaning = test.ayurvedicInterpretation.low;
  } else if (value > high) {
    status = 'high';
    ayurvedicMeaning = test.ayurvedicInterpretation.high;
  } else {
    status = 'normal';
    ayurvedicMeaning = test.ayurvedicInterpretation.normal;
  }

  const doshaImpact = `${test.doshaCorrelation.primaryDosha} - ${test.doshaCorrelation.doshaEffect}`;

  const recommendation = generateRecommendation(test, status);

  return {
    testName: test.name,
    value,
    normalRange: test.normalRange,
    status,
    ayurvedicMeaning,
    doshaImpact,
    recommendation,
  };
}

function generateRecommendation(test: LabTest, status: 'low' | 'normal' | 'high'): string {
  const dosha = test.doshaCorrelation.primaryDosha;
  const category = test.category;

  if (status === 'normal') {
    return `Balanced ${dosha} status. Continue maintaining current lifestyle and dietary practices.`;
  }

  if (status === 'high') {
    switch (category) {
      case 'Blood Sugar':
        return `Reduce Madhura (sweet), Guru (heavy), and Snigdha (oily) foods. Increase Tikshna (sharp) and Laghu (light) foods. Consider Prameha management protocols.`;
      case 'Lipid Profile':
        return `Follow Medoroga dietary guidelines. Reduce Guru (heavy), Snigdha (oily) foods. Increase Laghu (light), Ruksha (dry) foods. Consider Medohara formulations.`;
      case 'Liver Function Tests':
        return `Follow Kamala dietary guidelines. Reduce Amla (sour), Lavana (salty), Katu (pungent) foods. Consider Yakritpalak Rasa or Punarnava formulations.`;
      case 'Kidney Function Tests':
        return `Follow Mutra Vaha Srotas dietary guidelines. Reduce Lavana (salty), Amla (sour) foods. Consider Varunadi Kwath or Gokshuradi formulations.`;
      case 'Thyroid Profile':
        return `Assess Galaganda management. Balance Agni with Deepana-Pachana. Consider Kanchanar Guggulu for Kapha aggregation.`;
      case 'Iron Studies':
        return `Assess Rakta Dushti. Reduce Amla (sour), Lavana (salty) foods. Consider Lohasava formulations cautiously.`;
      case 'Vitamin Levels':
        return `Address Dhatu Kshaya with Rasayana therapy. Consider specific Dhatu-building formulations.`;
      case 'Urinalysis':
        return `Assess Mutra Vaha Srotas. Increase water intake. Consider channel-clearing formulations.`;
      default:
        return `Consult Ayurvedic physician for ${dosha} pacification and appropriate dietary modifications.`;
    }
  }

  // low status
  switch (category) {
    case 'Hematology':
      return `Address Pandu with Loha-based formulations. Include iron-rich foods. Consider Pandu-hara formulations.`;
    case 'Blood Sugar':
      return `Support Agni with Deepana herbs. Include Madhura Rasa foods appropriately.`;
    case 'Liver Function Tests':
      return `Support Yakrit with Yakritpalaka formulations. Nourish Rasa dhatu.`;
    case 'Kidney Function Tests':
      return `Support Mutra Vaha Srotas. Consider Gokshuradi or Punarnava formulations.`;
    case 'Thyroid Profile':
      return `Address Mandagni with Deepana-Pachana. Consider Kanchanar Guggulu for Kapha aggregation.`;
    case 'Iron Studies':
      return `Address Pandu with Loha-based formulations. Include iron-rich Pathya foods.`;
    case 'Vitamin Levels':
      return `Address Dhatu Kshaya with Rasayana therapy. Consider specific supplementation.`;
    default:
      return `Consult Ayurvedic physician for appropriate ${dosha} balancing and Dhatu nourishment.`;
  }
}

// ─── Overall Ayurvedic Lab Summary ──────────────────────────────────────────

/**
 * Generate overall Ayurvedic assessment from multiple lab results.
 */
export function getAyurvedicLabSummary(
  labResults: { test: string; value: number }[]
): AyurvedicLabSummary {
  const interpretations = labResults
    .map((r) => getLabInterpretation(r.test, r.value))
    .filter((i): i is LabInterpretationResult => i !== null);

  if (interpretations.length === 0) {
    return {
      overallDoshaStatus: 'No matching lab tests found for interpretation.',
      agniStatus: 'Unable to assess — no matching tests.',
      dhatuStatus: 'Unable to assess — no matching tests.',
      srotasStatus: 'Unable to assess — no matching tests.',
      primaryConcerns: [],
      ayurvedicRecommendations: ['Please provide valid lab test names for Ayurvedic interpretation.'],
      doshaAnalysis: {
        vata: 'No data',
        pitta: 'No data',
        kapha: 'No data',
      },
    };
  }

  const highTests = interpretations.filter((i) => i.status === 'high');
  const lowTests = interpretations.filter((i) => i.status === 'low');
  const normalTests = interpretations.filter((i) => i.status === 'normal');

  // Count dosha involvement
  let vataCount = 0;
  let pittaCount = 0;
  let kaphaCount = 0;

  interpretations.forEach((interp) => {
    const test = LAB_TESTS.find((t) => t.name === interp.testName);
    if (test) {
      if (test.doshaCorrelation.primaryDosha === 'Vata') vataCount++;
      if (test.doshaCorrelation.primaryDosha === 'Pitta') pittaCount++;
      if (test.doshaCorrelation.primaryDosha === 'Kapha') kaphaCount++;
      if (test.doshaCorrelation.secondaryDosha === 'Vata') vataCount += 0.5;
      if (test.doshaCorrelation.secondaryDosha === 'Pitta') pittaCount += 0.5;
      if (test.doshaCorrelation.secondaryDosha === 'Kapha') kaphaCount += 0.5;
    }
  });

  const total = vataCount + pittaCount + kaphaCount;
  const vataPercent = total > 0 ? Math.round((vataCount / total) * 100) : 0;
  const pittaPercent = total > 0 ? Math.round((pittaCount / total) * 100) : 0;
  const kaphaPercent = total > 0 ? Math.round((kaphaCount / total) * 100) : 0;

  // Determine dominant dosha
  let dominantDosha = 'Vata';
  if (pittaPercent > vataPercent && pittaPercent > kaphaPercent) dominantDosha = 'Pitta';
  if (kaphaPercent > vataPercent && kaphaPercent > pittaPercent) dominantDosha = 'Kapha';

  // Generate primary concerns
  const primaryConcerns: string[] = [];
  highTests.forEach((h) => {
    const test = LAB_TESTS.find((t) => t.name === h.testName);
    if (test) {
      primaryConcerns.push(`${h.testName} elevated — ${test.sanskritTerm}`);
    }
  });
  lowTests.forEach((l) => {
    const test = LAB_TESTS.find((t) => t.name === l.testName);
    if (test) {
      primaryConcerns.push(`${l.testName} low — ${test.sanskritTerm}`);
    }
  });

  // Agni status
  let agniStatus = 'Balanced (Samagni)';
  const hasHighSugar = highTests.some((h) =>
    ['Fasting Blood Sugar', 'Post Prandial Blood Sugar', 'HbA1c'].includes(h.testName)
  );
  const hasLowSugar = lowTests.some((l) =>
    ['Fasting Blood Sugar', 'Post Prandial Blood Sugar'].includes(l.testName)
  );
  if (hasHighSugar) agniStatus = 'Mandagni (weak digestive fire) with Kleda accumulation';
  if (hasLowSugar) agniStatus = 'Vishamagni (irregular digestive fire)';

  // Dhatu status
  let dhatuStatus = 'Balanced';
  const hasLowHb = lowTests.some((l) =>
    ['Hemoglobin', 'RBC Count'].includes(l.testName)
  );
  const hasHighLipids = highTests.some((h) =>
    ['Total Cholesterol', 'LDL Cholesterol', 'Triglycerides'].includes(h.testName)
  );
  const hasLowVitamins = lowTests.some((l) =>
    ['Vitamin D', 'Vitamin B12'].includes(l.testName)
  );

  if (hasLowHb) dhatuStatus = 'Rakta dhatu Kshaya (blood tissue depletion)';
  if (hasHighLipids) dhatuStatus = 'Meda dhatu Vriddhi (fat tissue accumulation)';
  if (hasLowVitamins) dhatuStatus = 'Asthi-Majja dhatu Kshaya (bone-nerve tissue depletion)';

  // Srotas status
  let srotasStatus = 'Balanced';
  const hasKidneyIssues = highTests.some((h) =>
    ['Serum Creatinine', 'Blood Urea Nitrogen', 'eGFR'].includes(h.testName) ||
    (h.testName === 'eGFR' && h.status === 'low')
  );
  const hasLiverIssues = highTests.some((h) =>
    ['SGOT (AST)', 'SGPT (ALT)', 'Total Bilirubin'].includes(h.testName)
  );
  if (hasKidneyIssues) srotasStatus = 'Mutra Vaha Srotas Dushti (urinary channel impairment)';
  if (hasLiverIssues) srotasStatus = 'Yakrit-Pliha Srotas Dushti (hepatic channel impairment)';

  // Generate recommendations
  const recommendations: string[] = [];

  if (highTests.some((h) => h.testName.includes('Sugar') || h.testName === 'HbA1c')) {
    recommendations.push('Follow Prameha dietary guidelines: Reduce Madhura, Guru foods; increase Tikshna, Laghu foods.');
  }
  if (highTests.some((h) => ['Total Cholesterol', 'LDL Cholesterol', 'Triglycerides'].includes(h.testName))) {
    recommendations.push('Follow Medoroga dietary guidelines: Reduce Snigdha, Guru foods; increase Ruksha, Laghu foods.');
  }
  if (highTests.some((h) => ['SGOT (AST)', 'SGPT (ALT)', 'Total Bilirubin'].includes(h.testName))) {
    recommendations.push('Follow Kamala dietary guidelines: Reduce Amla, Lavana, Katu foods; support Yakrit health.');
  }
  if (highTests.some((h) => ['Serum Creatinine', 'Blood Urea Nitrogen'].includes(h.testName))) {
    recommendations.push('Support Mutra Vaha Srotas: Increase water intake; consider Varunadi or Gokshuradi formulations.');
  }
  if (lowTests.some((l) => ['Hemoglobin', 'RBC Count'].includes(l.testName))) {
    recommendations.push('Address Pandu with Loha-based formulations; include iron-rich foods.');
  }
  if (lowTests.some((l) => ['Vitamin D', 'Vitamin B12'].includes(l.testName))) {
    recommendations.push('Address Dhatu Kshaya with Rasayana therapy and appropriate supplementation.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain balanced lifestyle with appropriate Pathya-Apathya following seasonal regimen.');
  }

  return {
    overallDoshaStatus: `Predominant ${dominantDosha} involvement (${vataPercent}% Vata, ${pittaPercent}% Pitta, ${kaphaPercent}% Kapha). ${normalTests.length} tests normal, ${highTests.length} elevated, ${lowTests.length} reduced.`,
    agniStatus,
    dhatuStatus,
    srotasStatus,
    primaryConcerns,
    ayurvedicRecommendations: recommendations,
    doshaAnalysis: {
      vata: `${vataPercent}% — ${vataCount > pittaCount && vataCount > kaphaCount ? 'Dominant' : 'Secondary'} involvement`,
      pitta: `${pittaPercent}% — ${pittaCount > vataCount && pittaCount > kaphaCount ? 'Dominant' : 'Secondary'} involvement`,
      kapha: `${kaphaPercent}% — ${kaphaCount > vataCount && kaphaCount > pittaCount ? 'Dominant' : 'Secondary'} involvement`,
    },
  };
}

// ─── Utility: Get all tests in a category ───────────────────────────────────

export function getTestsByCategory(category: LabCategory): LabTest[] {
  return LAB_TESTS.filter((test) => test.category === category);
}

// ─── Utility: Get all categories ────────────────────────────────────────────

export function getLabCategories(): LabCategory[] {
  const categories = new Set(LAB_TESTS.map((test) => test.category));
  return Array.from(categories) as LabCategory[];
}

// ─── Summary Stats ──────────────────────────────────────────────────────────

export const LAB_VALUES_STATS = {
  totalTests: LAB_TESTS.length,
  categories: getLabCategories().length,
  testsByCategory: getLabCategories().reduce(
    (acc, cat) => {
      acc[cat] = getTestsByCategory(cat).length;
      return acc;
    },
    {} as Record<string, number>
  ),
} as const;
