import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useBilling } from '../contexts/BillingContext';
import type { OpdVisit, InvoiceItem } from '../types';

interface QuickInvoiceModalProps {
  visit: OpdVisit;
  onClose: () => void;
}

export function QuickInvoiceModal({ visit, onClose }: QuickInvoiceModalProps) {
  const { addInvoice } = useBilling();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'insurance'>('cash');
  const [discount, setDiscount] = useState('0');

  // Auto-populate items from visit
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    const base: InvoiceItem[] = [
      {
        description: `Consultation — ${visit.doctorName}`,
        quantity: 1,
        unitPrice: visit.consultationFee,
        total: visit.consultationFee,
      },
    ];
    // Add prescribed medicines as line items
    visit.prescription.forEach((rx) => {
      base.push({
        description: `${rx.medicine} (${rx.dosage} ${rx.frequency} × ${rx.duration})`,
        quantity: 1,
        unitPrice: 0,
        total: 0,
      });
    });
    return base;
  });

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountNum = parseInt(discount, 10) || 0;
  const total = subtotal - discountNum;

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: field === 'description' ? value : Number(value) || 0 };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addInvoice({
      patientId: visit.patientId,
      patientName: visit.patientName,
      visitId: visit.id,
      items,
      subtotal,
      discount: discountNum,
      total,
      paymentMethod,
      paymentStatus: 'paid',
      paidAmount: total,
    });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Generate Invoice from Visit" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Visit Info */}
        <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-surface-500">Patient</span>
            <span className="font-medium text-surface-900 dark:text-white">{visit.patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-500">Doctor</span>
            <span className="text-surface-900 dark:text-white">{visit.doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-500">Complaint</span>
            <span className="text-surface-900 dark:text-white">{visit.chiefComplaint}</span>
          </div>
          {visit.diagnosis && (
            <div className="flex justify-between">
              <span className="text-surface-500">Diagnosis</span>
              <span className="text-surface-900 dark:text-white">{visit.diagnosis}</span>
            </div>
          )}
        </div>

        {/* Invoice Items */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Invoice Items
          </label>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none"
              />
              <input
                type="number"
                min={0}
                value={item.unitPrice}
                onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                className="w-24 px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none text-right"
                placeholder="₹0"
              />
            </div>
          ))}
        </div>

        {/* Discount */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap">
            Discount (₹)
          </label>
          <input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-24 px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none text-right"
          />
        </div>

        {/* Total */}
        <div className="flex justify-between items-center p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
          <span className="font-medium text-surface-900 dark:text-white">Total</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            ₹{total.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Payment Method */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Payment Method
          </label>
          <div className="flex gap-2">
            {(['cash', 'card', 'upi', 'insurance'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors min-h-[44px] ${
                  paymentMethod === method
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Create Invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
}
