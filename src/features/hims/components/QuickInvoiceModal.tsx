import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createInvoice } from '../slices/billingSlice';
import { fetchMedicines } from '../slices/pharmacySlice';
import { useToast } from '../../../contexts/ToastContext';
import type { OpdVisit, InvoiceItem } from '../types';

interface QuickInvoiceModalProps {
  visit: OpdVisit;
  onClose: () => void;
}

export function QuickInvoiceModal({ visit, onClose }: QuickInvoiceModalProps) {
  const dispatch = useAppDispatch();
  const { medicines } = useAppSelector((s) => s.hims.pharmacy);
  const { showToast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'insurance'>('cash');
  const [discount, setDiscount] = useState('0');
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'partial'>('paid');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentReference, setPaymentReference] = useState('');
  const [cgstRate, setCgstRate] = useState('0');
  const [sgstRate, setSgstRate] = useState('0');

  useEffect(() => {
    dispatch(fetchMedicines());
  }, [dispatch]);

  const [items, setItems] = useState<InvoiceItem[]>(() => {
    const base: InvoiceItem[] = [
      {
        description: `Consultation — ${visit.doctorName}`,
        quantity: 1,
        unitPrice: visit.consultationFee,
        total: visit.consultationFee,
      },
    ];
    visit.prescription.forEach((rx) => {
      const med = medicines.find(
        (m) => m.name.toLowerCase() === rx.medicine.toLowerCase()
      );
      base.push({
        description: `${rx.medicine} (${rx.dosage} ${rx.frequency} × ${rx.duration})`,
        quantity: 1,
        unitPrice: med?.price || 0,
        total: med?.price || 0,
      });
    });
    return base;
  });

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const discountAmount = discountType === 'percent'
    ? Math.round(subtotal * (parseFloat(discount) || 0) / 100)
    : (parseInt(discount, 10) || 0);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const cgst = Math.round(taxableAmount * (parseFloat(cgstRate) || 0) / 100);
  const sgst = Math.round(taxableAmount * (parseFloat(sgstRate) || 0) / 100);
  const total = taxableAmount + cgst + sgst;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (total <= 0) {
      showToast('Invoice total must be greater than 0', 'error');
      return;
    }

    const finalPaidAmount = paymentStatus === 'paid' ? total
      : paymentStatus === 'partial' ? Math.min(parseFloat(paidAmount) || 0, total)
      : 0;

    await dispatch(createInvoice({
      patientId: visit.patientId,
      patientName: visit.patientName,
      visitId: visit.id,
      items,
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod,
      paymentStatus,
      paidAmount: finalPaidAmount,
      paymentReference: paymentReference || undefined,
    }));
    showToast('Invoice created successfully', 'success');
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Generate Invoice" maxWidth="max-w-lg">
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
                className="flex-1 px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
              />
              <input
                type="number"
                min={0}
                value={item.unitPrice}
                onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                className="w-24 px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none text-right min-h-[44px]"
                placeholder="₹0"
              />
            </div>
          ))}
        </div>

        {/* Discount */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap">
            Discount
          </label>
          <input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-20 px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none text-right min-h-[40px]"
          />
          <button
            type="button"
            onClick={() => setDiscountType(discountType === 'fixed' ? 'percent' : 'fixed')}
            className="px-2 py-2 text-xs rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 min-h-[40px]"
          >
            {discountType === 'fixed' ? '₹' : '%'}
          </button>
        </div>

        {/* GST */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs text-surface-500 mb-1">CGST %</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={cgstRate}
              onChange={(e) => setCgstRate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none text-right min-h-[40px]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-surface-500 mb-1">SGST %</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={sgstRate}
              onChange={(e) => setSgstRate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none text-right min-h-[40px]"
            />
          </div>
        </div>

        {/* Total */}
        <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-surface-500">Subtotal</span>
            <span className="text-surface-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">Discount</span>
              <span className="text-red-500">-₹{discountAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          {(cgst > 0 || sgst > 0) && (
            <>
              {cgst > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">CGST ({cgstRate}%)</span>
                  <span className="text-surface-900 dark:text-white">₹{cgst.toLocaleString('en-IN')}</span>
                </div>
              )}
              {sgst > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">SGST ({sgstRate}%)</span>
                  <span className="text-surface-900 dark:text-white">₹{sgst.toLocaleString('en-IN')}</span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between items-center pt-1 border-t border-surface-200 dark:border-surface-700">
            <span className="font-medium text-surface-900 dark:text-white">Total</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment Status */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Payment Status
          </label>
          <div className="flex gap-2">
            {(['paid', 'partial', 'pending'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setPaymentStatus(status);
                  if (status === 'paid') setPaidAmount(String(total));
                  else if (status === 'partial') setPaidAmount('');
                  else setPaidAmount('0');
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors min-h-[44px] ${
                  paymentStatus === status
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Paid Amount (for partial) */}
        {paymentStatus === 'partial' && (
          <Input
            label="Amount Paid (₹)"
            type="number"
            min={0}
            max={total}
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            placeholder="0"
          />
        )}

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

        {/* Payment Reference (for card/UPI) */}
        {(paymentMethod === 'card' || paymentMethod === 'upi') && (
          <Input
            label="Payment Reference"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Transaction ID or reference"
          />
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={total <= 0}>
            Create Invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
}
