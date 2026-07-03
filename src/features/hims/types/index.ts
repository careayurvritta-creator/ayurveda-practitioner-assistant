export interface HimsPatient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  prakriti?: string;
  vikriti?: string;
  allergies?: string;
  emergencyContact?: string;
  lastVisit?: string;
  createdAt: string;
}

export interface PrescriptionItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface OpdVisit {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string;
  prescription: PrescriptionItem[];
  notes?: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  consultationFee: number;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  chamber?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  visitId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'insurance';
  paymentStatus: 'paid' | 'pending' | 'partial';
  paidAmount: number;
  paymentReference?: string;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  category: 'Ayurvedic' | 'Allopathic' | 'Siddha';
  manufacturer?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unit: string;
  price: number;
  costPrice?: number;
  reorderLevel: number;
  createdAt: string;
}

export const DOCTORS = [
  'Dr. Jinendradutt Sharma',
];

export const MEDICINE_CATEGORIES = ['Ayurvedic', 'Allopathic', 'Siddha'] as const;

export const MEDICINE_UNITS = ['tablets', 'bottles', 'grams', 'ml', 'packets'] as const;

export interface DispensingRecord {
  id: string;
  patientId: string;
  patientName: string;
  visitId: string;
  medicineId: string;
  medicineName: string;
  quantityDispensed: number;
  unit: string;
  dispensedBy: string;
  dispensedAt: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingPatient?: HimsPatient;
  matchType: 'phone' | 'name' | 'none';
}

export const PRAKRITI_TYPES = [
  'Vata',
  'Pitta',
  'Kapha',
  'Vata-Pitta',
  'Pitta-Kapha',
  'Vata-Kapha',
  'Tridosha',
] as const;

export const AGNI_TYPES = [
  'Sama',
  'Manda',
  'Tikshna',
  'Vishama',
] as const;

export const KOSHTA_TYPES = [
  'Regular',
  'Loose',
  'Constipated',
  'Mixed',
] as const;

export const APPOINTMENT_TYPES = [
  'consultation',
  'follow-up',
  'therapy',
  'panchakarma',
  'emergency',
  'walk-in',
] as const;

export const APPOINTMENT_STATUS = [
  'scheduled',
  'confirmed',
  'checked-in',
  'completed',
  'cancelled',
  'no-show',
] as const;

export const GENDERS = ['Male', 'Female', 'Other'] as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  'waiting': ['in-progress', 'cancelled'],
  'in-progress': ['completed', 'cancelled'],
  'completed': [],
  'cancelled': [],
};

export function canTransition(from: string, to: string): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── OPD Consultation Form (Ashtvidha & Dashvidha Pariksha) ──────────────────

export interface AshtvidhaPariksha {
  nadi: string;       // Pulse — Vata/Pitta/Kapha characteristics
  mala: string;       // Stool — consistency, frequency, color
  mutra: string;      // Urine — color, frequency, burning
  jihwa: string;      // Tongue — coating, color, cracks
  shabda: string;     // Voice — strength, tone
  sparsha: string;    // Skin — touch, temperature, moisture
  drika: string;      // Eyes — color, vision, discharge
  akruti: string;     // Body built — frame, symmetry
}

export interface DashvidhaPariksha {
  prakriti: string;        // Constitutional type
  vikriti: string;         // Current imbalance
  sara: string;            // Excellence of dhatu (tissues)
  samhanana: string;       // Compactness of body
  pramana: string;         // Body measurement (medium/large/small)
  satmya: string;          // Adaptability
  vaya: string;            // Age
  aharaShakti: string;     // Digestive power
  vyayamaShakti: string;   // Exercise capacity
  sattva: string;          // Mental strength
}

export interface NidanPanchak {
  nidana: string;          // Etiological factors
  purvarupa: string;       // Premonitory symptoms
  rupa: string;            // Cardinal symptoms
  samprapti: string;       // Pathogenesis
  upashaya: string;        // Confirmatory tests
}

export interface ConsultationFormData {
  id: string;
  patientId: string;
  patientName: string;
  visitId: string;
  doctorName: string;
  date: string;

  chiefComplaints: Array<{
    sanskritTerm: string;
    englishTerm: string;
    duration: string;
    remarks: string;
  }>;

  pastHistory: string;
  vitals: {
    bp: string;
    pulse: string;
    temperature: string;
    weight: string;
    height: string;
    respRate: string;
    spo2: string;
  };

  ashtvidhaPariksha: AshtvidhaPariksha;
  dashvidhaPariksha: DashvidhaPariksha;
  nidanPanchak: NidanPanchak;

  provisionalDiagnosis: string;
  investigations: string;
  prescription: PrescriptionItem[];
  notes: string;
  createdAt: string;
}

// ─── IPD Case Paper ──────────────────────────────────────────────────────────

export interface IpdCasePaper {
  id: string;
  patientId: string;
  patientName: string;
  uhid: string;
  ipdNumber: string;
  doctorName: string;
  admissionDate: string;
  dischargeDate?: string;
  chiefComplaint: string;
  diagnosis: string;
  pastHistory: string;
  allergies: string;
  vitals: {
    bp: string;
    pulse: string;
    temperature: string;
    weight: string;
    height: string;
    respRate: string;
    spo2: string;
  };
  treatmentPlan: string;
  status: 'active' | 'discharged' | 'referred' | 'critical';
  createdAt: string;
}

// ─── Therapy Session / Register ───────────────────────────────────────────────

export interface TherapySession {
  id: string;
  patientId: string;
  patientName: string;
  ipdNumber?: string;
  therapyName: string;
  therapyCategory: 'Abhyanga & Massage' | 'Swedana/Fomentation' | 'Panchakarma' | 'Nasya/Karna Purana' | 'Netra Chikitsa' | 'Oral/General' | 'Package Therapies';
  doctorName: string;
  therapistName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // minutes
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  cost: number;
  createdAt: string;
}

// ─── Treatment Plan ───────────────────────────────────────────────────────────

export interface TreatmentPlan {
  id: string;
  patientId: string;
  patientName: string;
  ipdNumber?: string;
  doctorName: string;
  diagnosis: string;
  treatmentType: 'Shodhana' | 'Shamana' | 'Rasayana' | 'Satvavajaya' | 'Daiva Vyapashraya';
  therapySessions: string[];
  medications: PrescriptionItem[];
  dietRecommendations: string;
  lifestyleAdvice: string;
  followUpDate?: string;
  status: 'planned' | 'active' | 'completed' | 'on-hold';
  notes: string;
  createdAt: string;
}

export const THERAPY_CATEGORIES = [
  'Abhyanga & Massage',
  'Swedana/Fomentation',
  'Panchakarma',
  'Nasya/Karna Purana',
  'Netra Chikitsa',
  'Oral/General',
  'Package Therapies',
] as const;

export const TREATMENT_TYPES = [
  'Shodhana',
  'Shamana',
  'Rasayana',
  'Satvavajaya',
  'Daiva Vyapashraya',
] as const;

export const THERAPY_STATUS = ['scheduled', 'in-progress', 'completed', 'cancelled'] as const;
export const TREATMENT_PLAN_STATUS = ['planned', 'active', 'completed', 'on-hold'] as const;
export const IPD_STATUS = ['active', 'discharged', 'referred', 'critical'] as const;
