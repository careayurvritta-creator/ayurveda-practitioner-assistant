import { Repository, BaseEntity } from './Repository';
import { supabase } from '../../../supabase';

export interface VisitRecord extends BaseEntity {
  patientId: string;
  patientName: string;
  doctorName: string;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string;
  prescription: Array<{
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  notes?: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  consultationFee: number;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  chamber?: string;
}

class VisitRepository extends Repository<VisitRecord> {
  constructor() {
    super('hims_visits');
  }

  async findByPatient(patientId: string): Promise<VisitRecord[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('patientId', patientId)
      .order('visitDate', { ascending: false });
    if (error) throw error;
    return (data || []) as VisitRecord[];
  }

  async findByDoctor(doctorName: string, date?: string): Promise<VisitRecord[]> {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('doctorName', doctorName);
    if (date) {
      query = query.gte('visitDate', date).lt('visitDate', `${date}T23:59:59`);
    }
    const { data, error } = await query.order('visitDate', { ascending: false });
    if (error) throw error;
    return (data || []) as VisitRecord[];
  }

  async findByDate(date: string): Promise<VisitRecord[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .gte('visitDate', `${date}T00:00:00`)
      .lt('visitDate', `${date}T23:59:59`)
      .order('visitDate', { ascending: false });
    if (error) throw error;
    return (data || []) as VisitRecord[];
  }
}

export default new VisitRepository();
