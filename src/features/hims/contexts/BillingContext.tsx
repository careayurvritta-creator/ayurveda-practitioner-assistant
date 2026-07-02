import { createContext, useContext, useCallback } from 'react';
import type { Invoice, InvoiceItem } from '../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface BillingContextType {
  invoices: Invoice[];
  todayRevenue: number;
  totalRevenue: number;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => void;
  updatePayment: (id: string, paidAmount: number, status: Invoice['paymentStatus']) => void;
  getInvoicesByPatient: (patientId: string) => Invoice[];
  getInvoice: (id: string) => Invoice | undefined;
}

const BillingContext = createContext<BillingContextType | null>(null);

function generateInvoiceNumber(existing: Invoice[]): string {
  const maxNum = existing.reduce((max, inv) => {
    const num = parseInt(inv.invoiceNumber.replace('INV-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `INV-${String(maxNum + 1).padStart(5, '0')}`;
}

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('hims_invoices', []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRevenue = invoices
    .filter((inv) => inv.createdAt.startsWith(todayStr) && inv.paymentStatus === 'paid')
    .reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalRevenue = invoices
    .filter((inv) => inv.paymentStatus === 'paid')
    .reduce((sum, inv) => sum + inv.paidAmount, 0);

  const addInvoice = useCallback(
    (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
      const newInvoice: Invoice = {
        ...data,
        id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        invoiceNumber: generateInvoiceNumber(invoices),
        createdAt: new Date().toISOString(),
      };
      setInvoices((prev) => [newInvoice, ...prev]);
    },
    [invoices, setInvoices]
  );

  const updatePayment = useCallback(
    (id: string, paidAmount: number, paymentStatus: Invoice['paymentStatus']) => {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, paidAmount, paymentStatus } : inv))
      );
    },
    [setInvoices]
  );

  const getInvoicesByPatient = useCallback(
    (patientId: string) => invoices.filter((inv) => inv.patientId === patientId),
    [invoices]
  );

  const getInvoice = useCallback((id: string) => invoices.find((inv) => inv.id === id), [invoices]);

  return (
    <BillingContext.Provider
      value={{
        invoices,
        todayRevenue,
        totalRevenue,
        addInvoice,
        updatePayment,
        getInvoicesByPatient,
        getInvoice,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) throw new Error('useBilling must be used within BillingProvider');
  return context;
}
