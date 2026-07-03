import { Repository, BaseEntity } from './Repository';
import { supabase } from '../../../supabase';

export interface InvoiceRecord extends BaseEntity {
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  visitId?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'insurance';
  paymentStatus: 'paid' | 'pending' | 'partial';
  paidAmount: number;
  paymentReference?: string;
}

class InvoiceRepository extends Repository<InvoiceRecord> {
  constructor() {
    super('hims_invoices');
  }

  async generateInvoiceNumber(): Promise<string> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    const nextNum = (count || 0) + 1;
    return `INV-${String(nextNum).padStart(5, '0')}`;
  }

  async findByVisit(visitId: string): Promise<InvoiceRecord | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('visitId', visitId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as InvoiceRecord | null;
  }

  async findByPatient(patientId: string): Promise<InvoiceRecord[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('patientId', patientId)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return (data || []) as InvoiceRecord[];
  }
}

export default new InvoiceRepository();
