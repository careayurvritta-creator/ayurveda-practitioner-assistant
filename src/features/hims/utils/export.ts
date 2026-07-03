import type { PatientRecord } from '../db/PatientRepository';
import type { InvoiceRecord } from '../db/InvoiceRepository';
import type { MedicineRecord } from '../db/MedicineRepository';

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCSV(rows: string[][], headers: string[], filename: string): void {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportPatients(patients: PatientRecord[]): void {
  const headers = ['MRN', 'Name', 'Age', 'Gender', 'Phone', 'Email', 'Blood Group', 'Prakriti', 'Vikriti', 'Last Visit', 'Created At'];
  const rows = patients.map(p => [
    p.mrn,
    p.name,
    String(p.age),
    p.gender,
    p.phone,
    p.email || '',
    p.bloodGroup || '',
    p.prakriti || '',
    p.vikriti || '',
    p.lastVisit || '',
    p.createdAt,
  ]);
  downloadCSV(rows, headers, 'patients');
}

export function exportInvoices(invoices: InvoiceRecord[]): void {
  const headers = ['Invoice #', 'Patient', 'Items', 'Subtotal', 'Discount', 'Total', 'Paid Amount', 'Status', 'Method', 'Date'];
  const rows = invoices.map(inv => [
    inv.invoiceNumber,
    inv.patientName,
    String(inv.items.length),
    String(inv.subtotal),
    String(inv.discount),
    String(inv.total),
    String(inv.paidAmount),
    inv.paymentStatus,
    inv.paymentMethod,
    inv.createdAt,
  ]);
  downloadCSV(rows, headers, 'invoices');
}

export function exportMedicines(medicines: MedicineRecord[]): void {
  const headers = ['Name', 'Category', 'Manufacturer', 'Batch #', 'Expiry', 'Quantity', 'Unit', 'Price', 'Cost Price', 'Reorder Level'];
  const rows = medicines.map(m => [
    m.name,
    m.category,
    m.manufacturer || '',
    m.batchNumber || '',
    m.expiryDate || '',
    String(m.quantity),
    m.unit,
    String(m.price),
    String(m.costPrice || ''),
    String(m.reorderLevel),
  ]);
  downloadCSV(rows, headers, 'medicines');
}
