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
  'Dr. Rajesh Sharma',
  'Dr. Priya Verma',
  'Dr. Amit Patel',
  'Dr. Sunita Gupta',
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
