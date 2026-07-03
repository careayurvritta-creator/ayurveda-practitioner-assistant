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
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  occupation?: string;
  referredBy?: string;
  prakriti?: string;
  vikriti?: string;
  agni?: string;
  koshta?: string;
  sara?: string;
  samhanana?: string;
  pramana?: { height?: string; weight?: string; chest?: string; waist?: string };
  satmya?: string;
  sattva?: string;
  aharaShakti?: string;
  vyayamaShakti?: string;
  vaya?: string;
  allergies?: string;
  pastHistory?: string;
  familyHistory?: string;
  emergencyContact?: string;
  lastVisit?: string;
}

class PatientRepository extends Repository<PatientRecord> {
  constructor() {
    super('hims_patients');
  }

  async generateUHID(): Promise<string> {
    const { count } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
    const nextNum = (count || 0) + 1;
    return `AAH${String(nextNum).padStart(4, '0')}`;
  }

  async searchByName(name: string): Promise<PatientRecord[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike('name', `%${name}%`)
      .order('created_at', { ascending: false });
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
