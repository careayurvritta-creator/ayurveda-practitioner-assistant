import { Repository, BaseEntity } from './Repository';
import { supabase } from '../../../supabase';

export interface MedicineRecord extends BaseEntity {
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
}

export interface DispensingRecord extends BaseEntity {
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

class MedicineRepository extends Repository<MedicineRecord> {
  constructor() {
    super('hims_medicines');
  }

  async searchByName(name: string): Promise<MedicineRecord[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .ilike('name', `%${name}%`)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as MedicineRecord[];
  }

  async findByCategory(category: string): Promise<MedicineRecord[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('category', category)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as MedicineRecord[];
  }

  async findLowStock(): Promise<MedicineRecord[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    const all = (data || []) as MedicineRecord[];
    return all.filter(m => m.quantity <= m.reorderLevel);
  }

  async dispense(dispensing: Omit<DispensingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<DispensingRecord> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('hims_dispensing')
      .insert({ ...dispensing, id: crypto.randomUUID(), createdAt: now, updatedAt: now })
      .select()
      .single();
    if (error) throw error;

    const { data: medicine } = await supabase
      .from(this.tableName)
      .select('quantity')
      .eq('id', dispensing.medicineId)
      .single();

    if (medicine) {
      await supabase
        .from(this.tableName)
        .update({ quantity: Math.max(0, medicine.quantity - dispensing.quantityDispensed), updatedAt: now })
        .eq('id', dispensing.medicineId);
    }

    return data as DispensingRecord;
  }

  async getDispensingByVisit(visitId: string): Promise<DispensingRecord[]> {
    const { data, error } = await supabase
      .from('hims_dispensing')
      .select('*')
      .eq('visitId', visitId)
      .order('dispensedAt', { ascending: false });
    if (error) throw error;
    return (data || []) as DispensingRecord[];
  }
}

export default new MedicineRepository();
