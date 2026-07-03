import { useState } from 'react';
import { Plus, Search, Pill, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { usePharmacy } from '../contexts/PharmacyContext';
import { useToast } from '../../../contexts/ToastContext';
import { AddMedicineModal } from '../components/AddMedicineModal';
import type { Medicine } from '../types';

export default function HimsPharmacy() {
  const { medicines, lowStockMedicines, deleteMedicine } = usePharmacy();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null);

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.manufacturer?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm border-b border-surface-200 dark:border-surface-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-surface-900 dark:text-white">
            Pharmacy
            <span className="ml-2 text-sm font-normal text-surface-500">
              ({medicines.length} items)
            </span>
          </h1>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" />
            Add Medicine
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Low Stock Alert */}
          {lowStockMedicines.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm text-amber-700 dark:text-amber-400">
                {lowStockMedicines.length} medicine(s) below reorder level
              </span>
            </div>
          )}

          {/* Search + Filter */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
            >
              <option value="all">All</option>
              <option value="Ayurvedic">Ayurvedic</option>
              <option value="Allopathic">Allopathic</option>
              <option value="Siddha">Siddha</option>
            </select>
          </div>

          {/* Medicine List */}
          {filteredMedicines.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              <Pill className="w-12 h-12 mx-auto mb-3 text-surface-300" />
              <p className="text-lg mb-2">
                {medicines.length === 0 ? 'No medicines in inventory' : 'No matching medicines'}
              </p>
              {medicines.length === 0 && (
                <Button size="sm" onClick={() => setShowAdd(true)}>
                  Add First Medicine
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMedicines.map((med) => (
                <div
                  key={med.id}
                  className={`bg-white dark:bg-surface-800 rounded-lg border p-4 ${
                    med.quantity <= med.reorderLevel
                      ? 'border-amber-300 dark:border-amber-700'
                      : 'border-surface-200 dark:border-surface-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-surface-900 dark:text-white">
                          {med.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400">
                          {med.category}
                        </span>
                      </div>
                      <div className="text-sm text-surface-500">
                        {med.manufacturer && `${med.manufacturer} · `}
                        Qty: <span className={med.quantity <= med.reorderLevel ? 'text-amber-600 font-medium' : ''}>{med.quantity} {med.unit}</span>
                      </div>
                      {med.batchNumber && (
                        <div className="text-xs text-surface-400 mt-0.5">
                          Batch: {med.batchNumber}
                          {med.expiryDate && ` · Exp: ${med.expiryDate}`}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-surface-900 dark:text-white">
                        ₹{med.price}
                      </div>
                      <button
                        onClick={() => setDeletingMedicine(med)}
                        className="text-xs text-red-500 hover:text-red-700 mt-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddMedicineModal onClose={() => setShowAdd(false)} />}

      <ConfirmationDialog
        isOpen={!!deletingMedicine}
        onClose={() => setDeletingMedicine(null)}
        onConfirm={() => {
          if (deletingMedicine) {
            deleteMedicine(deletingMedicine.id);
            showToast(`${deletingMedicine.name} deleted`, 'success');
            setDeletingMedicine(null);
          }
        }}
        title="Delete Medicine"
        message={`Are you sure you want to delete ${deletingMedicine?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
