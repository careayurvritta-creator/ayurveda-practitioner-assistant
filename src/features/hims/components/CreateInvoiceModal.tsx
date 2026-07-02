import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useHimsPatients } from '../contexts/HimsPatientContext';
import { useOpd } from '../contexts/OpdContext';
import { useBilling } from '../contexts/BillingContext';

interface CreateInvoiceModalProps {
  onClose: () => void;
}

export function CreateInvoiceModal({ onClose }: CreateInvoiceModalProps) {
  const { patients } = useHimsPatients();
  const { visits } = useOpd();
  const { addInvoice } = useBilling();

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'insurance'>('cash');
  const [discount, setDiscount] = useState('0');
  const [items, setItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: 'Consultation Fee', quantity: 1, unitPrice: 500 },
  ]);

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.mrn.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountNum = parseInt(discount, 10) || 0;
  const total = subtotal - discountNum;

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === 'description' ? value : Number(value) || 0 } : item
      )
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || items.length === 0) return;

    addInvoice({
      patientId: selectedPatientId,
      patientName: selectedPatient?.name || '',
      items: items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      })),
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
    <Modal isOpen={true} onClose={onClose} title="Create Invoice" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Patient *
          </label>
          {selectedPatient ? (
            <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div>
                <span className="font-medium text-surface-900 dark:text-white">
                  {selectedPatient.name}
                </span>
                <span className="ml-2 text-xs text-surface-500">{selectedPatient.mrn}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatientId('');
                  setPatientSearch('');
                }}
                className="text-sm text-surface-500 hover:text-surface-700"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <Input
                label=""
                placeholder="Search patient..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
              {patientSearch && filteredPatients.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-surface-200 dark:border-surface-700 rounded-lg">
                  {filteredPatients.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setPatientSearch('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-800 text-sm border-b border-surface-100 dark:border-surface-800 last:border-0"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-2 text-surface-500">{p.mrn}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
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
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none"
              />
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                className="w-16 px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none text-center"
              />
              <input
                type="number"
                min={0}
                value={item.unitPrice}
                onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                className="w-24 px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            + Add item
          </button>
        </div>

        {/* Discount */}
        <Input
          label="Discount (₹)"
          type="number"
          min={0}
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
        />

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
          <Button type="submit" disabled={!selectedPatientId || items.length === 0} className="flex-1">
            Create Invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
}
