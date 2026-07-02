import { useState, useMemo } from 'react';
import { Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { usePharmacy } from '../contexts/PharmacyContext';
import { useToast } from '../../../contexts/ToastContext';
import type { OpdVisit } from '../types';
import { DOCTORS } from '../types';

interface DispenseMedicineModalProps {
  visit: OpdVisit;
  onClose: () => void;
}

export function DispenseMedicineModal({ visit, onClose }: DispenseMedicineModalProps) {
  const { medicines, dispenseMedicine, searchMedicines } = usePharmacy();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [dispensedBy, setDispensedBy] = useState(DOCTORS[0]);
  const [dispensedItems, setDispensedItems] = useState<{ medicineName: string; quantity: number; unit: string }[]>([]);

  const filteredMedicines = useMemo(() => {
    if (!searchQuery) return medicines.filter((m) => m.quantity > 0).slice(0, 10);
    return searchMedicines(searchQuery).filter((m) => m.quantity > 0).slice(0, 10);
  }, [searchQuery, medicines, searchMedicines]);

  const selectedMed = medicines.find((m) => m.id === selectedMedicine);

  const prescribedMedicines = visit.prescription.map((p) => p.medicine.toLowerCase());

  const handleDispense = () => {
    if (!selectedMedicine || !selectedMed || quantity <= 0) return;
    if (quantity > selectedMed.quantity) return;

    const record = dispenseMedicine(
      selectedMedicine,
      quantity,
      visit.patientId,
      visit.patientName,
      visit.id,
      dispensedBy
    );

    if (record) {
      setDispensedItems((prev) => [
        ...prev,
        { medicineName: record.medicineName, quantity: record.quantityDispensed, unit: record.unit },
      ]);
      setSelectedMedicine('');
      setQuantity(1);
      setSearchQuery('');
      showToast('Medicine dispensed successfully', 'success');
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Dispense Medicine" maxWidth="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-surface-500">
          {visit.patientName} — {visit.doctorName}
        </p>

        {/* Prescribed medicines hint */}
        {visit.prescription.length > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-sm">
            <p className="font-medium text-emerald-700 dark:text-emerald-400 mb-1">Prescribed:</p>
            <p className="text-emerald-600 dark:text-emerald-300">
              {visit.prescription.map((p) => p.medicine).join(', ')}
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search medicine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
          />
        </div>

        {/* Medicine list */}
        <div className="max-h-48 overflow-y-auto border border-surface-200 dark:border-surface-700 rounded-lg divide-y divide-surface-100 dark:divide-surface-700">
          {filteredMedicines.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-surface-500">
              No medicines found
            </div>
          ) : (
            filteredMedicines.map((med) => {
              const isPrescribed = prescribedMedicines.includes(med.name.toLowerCase());
              return (
                <button
                  key={med.id}
                  onClick={() => setSelectedMedicine(med.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors min-h-[44px] ${
                    selectedMedicine === med.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-surface-900 dark:text-white">
                        {med.name}
                      </span>
                      {isPrescribed && (
                        <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                          (Prescribed)
                        </span>
                      )}
                      <span className="text-xs text-surface-500 ml-2">{med.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-surface-900 dark:text-white">
                        ₹{med.price}
                      </span>
                      <span className="text-xs text-surface-500 ml-2">
                        {med.quantity} {med.unit}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Selected medicine details */}
        {selectedMed && (
          <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-surface-900 dark:text-white">{selectedMed.name}</span>
              <span className="text-sm text-surface-500">
                Stock: {selectedMed.quantity} {selectedMed.unit}
              </span>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-surface-500 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={selectedMed.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-surface-500 mb-1">Dispensed By</label>
                <select
                  value={dispensedBy}
                  onChange={(e) => setDispensedBy(e.target.value)}
                  className="w-full px-3 py-2.5 border border-surface-200 dark:border-surface-700 rounded-lg bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
                >
                  {DOCTORS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {quantity > selectedMed.quantity && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Insufficient stock. Available: {selectedMed.quantity} {selectedMed.unit}
              </p>
            )}

            <Button
              onClick={handleDispense}
              disabled={!selectedMedicine || quantity <= 0 || quantity > selectedMed.quantity}
              className="w-full"
            >
              Dispense
            </Button>
          </div>
        )}

        {/* Dispensed items */}
        {dispensedItems.length > 0 && (
          <div>
            <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Dispensed This Session:
            </p>
            <div className="space-y-1">
              {dispensedItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  {item.medicineName} — {item.quantity} {item.unit}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {dispensedItems.length > 0 ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
