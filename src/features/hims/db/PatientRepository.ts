import { Repository, BaseEntity } from './Repository';
import { supabase } from '../../../supabase';

export interface PatientRecord extends BaseEntity {
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
  lastVisit?: string;
}

class PatientRepository extends Repository<PatientRecord> {
  constructor() {
    super('hims_patients');
  }

  async searchByName(name: string): Promise<PatientRecord[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike('name', `%${name}%`)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return (data || []) as PatientRecord[];
  }

  async findByPhone(phone: string): Promise<PatientRecord | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('phone', phone)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as PatientRecord | null;
  }

  async findByMRN(mrn: string): Promise<PatientRecord | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('mrn', mrn)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as PatientRecord | null;
  }
}

export default new PatientRepository();
