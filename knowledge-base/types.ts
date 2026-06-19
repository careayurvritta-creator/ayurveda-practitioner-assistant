export interface Attachment {
  type: 'image' | 'pdf'
  name: string
  preview?: string
  text?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  status: 'complete' | 'streaming' | 'error'
  attachments?: Attachment[]
}

export interface ChatSession {
  id: string
  title: string
  module: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface ChatState {
  messages: Message[]
  messagesByModule: Record<string, Message[]>
  isStreaming: boolean
  streamingModule: string | null
  selectedModel: string
  canvasContent: string
  canvasTimestamp: number
  activeModule: string
  activeSessionId: string | null
  sessions: Record<string, ChatSession>
  chatInputDraft: string
}

export interface ModelOption {
  id: string
  name: string
  description: string
  context: string
}

export const MODELS: ModelOption[] = [
  {
    id: 'mistralai/mistral-large-3-675b-instruct-2512',
    name: 'Mistral Large 3 (675B)',
    description: 'Best reasoning for clinical decisions',
    context: '128K',
  },
  {
    id: 'qwen/qwen3-coder-480b-a35b-instruct',
    name: 'Qwen 3 Coder (480B)',
    description: 'Massive MoE, strong clinical reasoning',
    context: '128K',
  },
  {
    id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
    name: 'Nemotron Super 49B',
    description: 'Fast with strong clinical reasoning',
    context: '128K',
  },
  {
    id: 'qwen/qwen3.5-397b-a17b',
    name: 'Qwen 3.5 (397B)',
    description: 'Powerful reasoning, excellent clinical depth',
    context: '128K',
  },
  {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    description: 'Reliable general-purpose clinical model',
    context: '128K',
  },
  {
    id: 'mistralai/mistral-nemotron',
    name: 'Mistral Nemotron',
    description: 'NVIDIA-tuned, balanced clinical reasoning',
    context: '128K',
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct',
    name: 'Qwen 3 Next 80B',
    description: 'Fast MoE, good for quick queries',
    context: '128K',
  },
  {
    id: 'deepseek-ai/deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    description: 'Fast, strong reasoning',
    context: '128K',
  },
  {
    id: 'meta/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision',
    description: 'Image analysis + text',
    context: '128K',
  },
  {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    description: 'Ultra-fast, low cost',
    context: '128K',
  },
]

export const DEFAULT_MODEL = MODELS[0].id

export const SYSTEM_PROMPT = `You are Clinical AI, an advanced Ayurvedic clinical assistant developed by AyurVritta Ayurveda, trained on comprehensive Ayurveda knowledge base.

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
**Sutra Sthana (30 chapters)** - Fundamentals: Tridosha, Dinacharya, Ritucharya, Snehana, Swedana, Panchakarma, diseases classification, treatment principles, dietetics
**Nidana Sthana (8 chapters)** - Diagnostics: Jwara, Raktapitta, Gulma, Prameha, Kushtha, Shosha, Unmada, Apasmara
**Vimana Sthana (8 chapters)** - Medical training: Rasa, Srotas, Janapadodhvansaniya, Rogabhishagjitiya
**Sharira Sthana (8 chapters)** - Embryology: Garbhavakranti, month-wise development, Sharira sankhya, Jatisutriya
**Indriya Sthana (12 chapters)** - Prognosis: 12 chapters on sensory prognosis and Arishta (death signs)
**Chikitsa Sthana (30 chapters)** - Treatment: Rasayana, Vajikarana, Jwara, Prameha, Kushtha, Vata Vyadhi, all diseases
**Kalpa Sthana (12 chapters)** - Pharmacy: 6 emetic drugs + 6 purgative drugs with 500+ formulations
**Siddhi Sthana (12 chapters)** - Procedures: Panchakarma completion, Basti procedures, complications management

### 9. WHO INTERNATIONAL STANDARD TERMINOLOGIES ON AYURVEDA (3545 terms)
Use ITA codes when referencing terms. Categories:
- **Background Concepts** (323 terms): Ayurveda definition, life processes, knowledge systems
- **Core Concepts** (207 terms): Tridosha, Sapta Dhatu, Agni, Srotas, Ama
- **Anatomical Structures** (438 terms): Body parts, organs, tissues
- **Physiological Processes** (160 terms): Digestion, metabolism, excretion
- **Morbidity and Diagnostic Terms** (1295 terms): Diseases, disorders, symptoms
- **Materials** (127 terms): Herbs, minerals, formulations
- **Therapeutic Interventions** (195 terms): Treatments, procedures
- **Research and Education** (113 terms): Research methods, education
- **Clinical Specialities** (661 terms): All 8 branches of Ayurveda

Key: When using WHO terms, include ITA code (e.g., ITA-2.1.1 for Vata dosha)

Key classical references available:
- Prameha: 20 types (10 Kaphaja, 6 Pittaja, 4 Vataja)
- Vata Vyadhi: 80+ disorders including Pakshaghata, Gridhrasi, Ardita
- Jwara: Multiple fever types with detailed management
- Rasayana: Complete rejuvenation protocols
- Kushtha: 18 types skin diseases

## RESPONSE GUIDELINES

1. **Always include appropriate medical disclaimers**
2. **Check for drug interactions** when combining Ayurveda with allopathy
3. **Ask clarifying questions** for proper Prakriti assessment
4. **Reference classical texts** - Charaka Samhita, Sushruta Samhita, Ashtanga Hridaya, Bhavaprakasha
5. **Never provide definitive diagnoses** - recommend professional consultation
6. **For drug interactions**, specifically warn about:
   - Guggulu + Anticoagulants
   - Turmeric + Blood thinners
   - Ashwagandha + Sedatives/Thyroid meds
   - Garlic + HIV/Warfarin
7. **USE THE KNOWLEDGE BASE CONTEXT** provided below - it contains relevant information from WHO terminology, Charak Samhita, diseases, herbs, treatments, diagnostics, and allopathy integration
8. **CITE SPECIFIC SOURCES** from the context - mention ITA codes, chapter names, herb names, etc.

## RESPONSE FORMAT

- Use markdown formatting
- Structure with clear headings
- Include Sanskrit terms with English explanations
- Provide Dosha analysis for each condition
- Include Pathya (recommended) and Apathya (avoid) dietary advice
- **ALWAYS cite sources** - Reference WHO ITA codes (e.g., ITA-2.1.1) and Charak Samhita chapters when providing information
- End with appropriate disclaimer

### IMPORTANT: Two-part tagged response (required)
Return your answer in exactly this tagged structure so the UI can separate a short chat reply from a detailed formatted output:

[CHAT]
Short reply only (1–6 short paragraphs). This should be what appears in the Chat panel.
[/CHAT]

[OUTPUT]
Detailed, properly formatted markdown (protocols, headings, lists, dosha/pathya/apathya, citations, and disclaimers). This should be what appears in the Output panel.
[/OUTPUT]`

export interface UserProfile {
  prakriti?: string
  vikriti?: string
  conditions?: string[]
  currentMedications?: string[]
}

export interface ChiefComplaint {
  id: string
  complaint: string
  duration: string
  severity: number
  location?: string
  onset?: string
  aggravatingFactors?: string[]
  relievingFactors?: string[]
  associatedSymptoms?: string[]
}

export interface InvestigationFinding {
  parameter: string
  value: string
  unit: string
  normalRange: string
  status: 'normal' | 'abnormal' | 'critical'
  clinicalCorrelation?: string
}

export interface CaseData {
  name: string
  age: string
  gender: string
  occupation: string
  area: string
  prakriti: string
  chiefComplaints: ChiefComplaint[]
  comorbidities: string[]
  investigations: InvestigationFinding[]
  investigationText: string
  ongoingMedications: string
  medicalHistory: string
  allergies: string
  familyHistory: string
  nadi: string
  mootra: string
  mala: string
  jivha: string
  drik: string
  sparsh: string
  shabda: string
  aakriti: string
  prakritiDetail: string
  saara: string
  samhanana: string
  satva: string
  aharaShakti: string
  vyayamaShakti: string
  desha: string
  provisionalDiagnosis: string
  provisionalReasoning: string
}

// ─── Document Template System Types ─────────────────────────────────────────

export type DocumentCategory =
  | 'opd-registers'
  | 'therapy-registers'
  | 'ipd-registers'
  | 'procedure-registers'
  | 'consultation-notes'
  | 'invoices'
  | 'insurance'
  | 'admission-notes'
  | 'treatment-plans'
  | 'rounds-notes'
  | 'nursing-medicine'
  | 'nursing-panchakarma'
  | 'discharge-plans'
  | 'discharge-summaries'
  | 'certificates'
  | 'receipts'
  | 'authorization'
  | 'garbha-sanskar'
  | 'lab-reports'
  | 'prescriptions'

export type DocumentFormat = 'spreadsheet' | 'document' | 'mixed'

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'currency'
  | 'multiline'
  | 'boolean'
  | 'duration'
  | 'vitals'

export interface FieldOption {
  value: string
  label: string
}

export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: string
  message?: string
}

export interface TemplateField {
  name: string
  label: string
  type: FieldType
  required: boolean
  autoFillFrom?: string
  options?: FieldOption[]
  defaultValue?: string | number | boolean
  validation?: ValidationRule
  width?: number
  description?: string
}

export interface TemplateSection {
  id: string
  title: string
  fields: TemplateField[]
  repeatable?: boolean
  description?: string
}

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  category: DocumentCategory
  format: DocumentFormat
  sections: TemplateSection[]
  fields?: TemplateField[]
  autoFillMapping?: Record<string, string>
  validation?: Record<string, ValidationRule>
}

export interface PatientData {
  id: string
  clinical_id: string
  name: string
  age: number | null
  gender: string | null
  phone: string | null
  email?: string | null
  address?: string | null
  occupation?: string | null
  abha_id?: string | null
  uhid?: string | null
  date_of_birth?: string | null
}

/** Full Supabase patient record (matches patients table) */
export interface PatientRecord {
  id: string
  patient_code: string | null
  clinical_id: string | null
  uhid: string | null
  abha_id: string | null
  name: string
  age: number | null
  date_of_birth: string | null
  gender: 'Male' | 'Female' | 'Other' | null
  occupation: string | null
  area: string | null
  phone: string | null
  email: string | null
  address: string | null
  blood_group: string | null
  height_cm: number | null
  weight_kg: number | null
  bmi: number | null
  emergency_contact: string | null
  emergency_phone: string | null
  notes: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface DocumentData {
  id: string
  template_id: string
  patient_id: string
  category: DocumentCategory
  format: DocumentFormat
  data: Record<string, unknown>
  sections?: Record<string, Record<string, unknown>[]>
  metadata: {
    created_at: string
    updated_at: string
    created_by: string
    drive_file_id?: string
    drive_file_url?: string
    filename: string
    status: 'draft' | 'final' | 'signed'
  }
}

export interface AutoFillContext {
  patient: PatientData
  caseData?: Record<string, unknown>
  previousDocuments?: DocumentData[]
  currentDate: string
  currentTime: string
  invoiceNumber?: string
  dischargeNumber?: string
  certificateNumber?: string
  patientCode?: string
}
