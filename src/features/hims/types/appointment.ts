export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  uhid: string;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'consultation' | 'follow-up' | 'therapy' | 'panchakarma' | 'emergency' | 'walk-in';
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';
  reason?: string;
  notes?: string;
  chamber?: string;
  visitId?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSchedule {
  id: string;
  doctorName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatients: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  appointmentId?: string;
}

export const DEFAULT_DOCTOR_SCHEDULE: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'> = {
  doctorName: 'Dr. Jinendradutt Sharma',
  dayOfWeek: new Date().getDay(),
  startTime: '10:00',
  endTime: '19:00',
  slotDuration: 30,
  maxPatients: 18,
  isActive: true,
};

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  'consultation': 'Consultation',
  'follow-up': 'Follow-up',
  'therapy': 'Therapy',
  'panchakarma': 'Panchakarma',
  'emergency': 'Emergency',
  'walk-in': 'Walk-in',
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  'scheduled': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'confirmed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'checked-in': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'cancelled': 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400',
  'no-show': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
