import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useAppDispatch } from '../../../store/hooks';
import { createMedicine } from '../slices/pharmacySlice';
import { MEDICINE_CATEGORIES, MEDICINE_UNITS } from '../types';
import type { Medicine } from '../types';

interface AddMedicineModalProps {
  onClose: () => void;
}

export function AddMedicineModal({ onClose }: AddMedicineModalProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Medicine['category']>('Ayurvedic');
  const [manufacturer, setManufacturer] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('tablets');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [reorderLevel, setReorderLevel] = useState('10');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quantity || !price) return;

    await dispatch(createMedicine({
      name: name.trim(),
      category,
      manufacturer: manufacturer.trim() || undefined,
      batchNumber: batchNumber.trim() || undefined,
      expiryDate: expiryDate || undefined,
      quantity: parseInt(quantity, 10),
      unit,
      price: parseFloat(price),
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      reorderLevel: parseInt(reorderLevel, 10) || 10,
    }));
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Medicine" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Medicine Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ashwagandha Churna"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Category
            </label>
            <div className="flex gap-2">
              {MEDICINE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    category === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Manufacturer"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Batch Number"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            placeholder="Optional"
          />
          <Input
            label="Expiry Date"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Quantity *"
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Unit
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
            >
              {MEDICINE_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <Input
            label="Reorder Level"
            type="number"
            min={0}
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Selling Price (₹) *"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
          <Input
            label="Cost Price (₹)"
            type="number"
            min={0}
            step={0.01}
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || !quantity || !price} className="flex-1">
            Add Medicine
          </Button>
        </div>
      </form>
    </Modal>
  );
}
