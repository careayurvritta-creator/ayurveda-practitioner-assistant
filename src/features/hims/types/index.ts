export interface HimsPatient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  prakriti?: string;
  vikriti?: string;
  allergies?: string;
  emergencyContact?: string;
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
