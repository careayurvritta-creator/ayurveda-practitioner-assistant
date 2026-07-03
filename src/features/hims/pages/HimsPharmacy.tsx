import { useState, useEffect } from 'react';
import { Plus, Search, Pill, AlertTriangle, Download, Pencil, Trash2, Package } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConfirmationDialog } from '../../../components/ui/ConfirmationDialog';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchMedicines, deleteMedicine } from '../slices/pharmacySlice';
import { useToast } from '../../../contexts/ToastContext';
import { AddMedicineModal } from '../components/AddMedicineModal';
import { EditMedicineModal } from '../components/EditMedicineModal';
import { exportMedicines } from '../utils/export';
import { Breadcrumbs } from '../../../components/ui/Breadcrumb';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { MedicineRecord } from '../db/MedicineRepository';

export default function HimsPharmacy() {
  const dispatch = useAppDispatch();
  const { medicines, lowStockMedicines, isLoading } = useAppSelector((state) => state.hims.pharmacy);
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineRecord | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deletingMedicine, setDeletingMedicine] = useState<MedicineRecord | null>(null);

  useEffect(() => {
    dispatch(fetchMedicines());
  }, [dispatch]);

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.manufacturer?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = () => {
    if (!deletingMedicine) return;
    dispatch(deleteMedicine(deletingMedicine.id));
    showToast(`${deletingMedicine.name} deleted`, 'success');
    setDeletingMedicine(null);
  };

  const getStockStatus = (med: MedicineRecord) => {
    if (med.quantity === 0) return { label: 'Out of Stock', variant: 'danger' as const };
    if (med.quantity <= med.reorderLevel) return { label: 'Low Stock', variant: 'warning' as const };
    return { label: 'In Stock', variant: 'success' as const };
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Pharmacy' }]} />

        <PageHeader
          title="Pharmacy"
          subtitle={`${medicines.length} medicines in inventory`}
          actions={
            <>
              <Button size="sm" variant="secondary" onClick={() => exportMedicines(medicines)}>
                <Download className="w-4 h-4" /> Export
              </Button>
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4" /> Add Medicine
              </Button>
            </>
          }
        />

        {/* Low Stock Alert */}
        {lowStockMedicines.length > 0 && (
          <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {lowStockMedicines.length} medicine(s) below reorder level
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Restock soon to avoid stockouts
              </p>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 text-sm rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px]"
          >
            <option value="all">All Categories</option>
            <option value="Ayurvedic">Ayurvedic</option>
            <option value="Allopathic">Allopathic</option>
            <option value="Siddha">Siddha</option>
          </select>
        </div>

        {/* Medicine Table */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-surface-500">Loading medicines...</p>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <EmptyState
            icon={Pill}
            title={medicines.length === 0 ? 'No medicines in inventory' : 'No matching medicines'}
            description={medicines.length === 0 ? 'Add your first medicine to get started' : 'Try a different search term'}
            action={medicines.length === 0 ? (
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4" /> Add First Medicine
              </Button>
            ) : undefined}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-surface-900 rounded-xl border border-surface-200/60 dark:border-surface-800 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100 dark:border-surface-800">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500">Medicine</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500 hidden lg:table-cell">Category</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500">Stock</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500 hidden lg:table-cell">Batch</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500">Price</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-surface-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {filteredMedicines.map((med) => {
                    const stock = getStockStatus(med);
                    return (
                      <tr key={med.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-surface-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-surface-900 dark:text-white">{med.name}</p>
                              {med.manufacturer && (
                                <p className="text-xs text-surface-500">{med.manufacturer}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <span className="text-xs px-2 py-1 rounded-full bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-400 font-medium">
                            {med.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <StatusBadge label={stock.label} variant={stock.variant} dot size="sm" />
                            <span className="text-xs text-surface-500">
                              {med.quantity} {med.unit}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <div className="text-xs text-surface-500">
                            {med.batchNumber || '—'}
                            {med.expiryDate && <span className="ml-1">Exp: {med.expiryDate}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-surface-900 dark:text-white">₹{med.price}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingMedicine(med)}
                              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4 text-surface-500" />
                            </button>
                            <button
                              onClick={() => setDeletingMedicine(med)}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2">
              {filteredMedicines.map((med) => {
                const stock = getStockStatus(med);
                return (
                  <div
                    key={med.id}
                    className={`bg-white dark:bg-surface-900 rounded-xl border p-4 ${
                      med.quantity <= med.reorderLevel
                        ? 'border-amber-200 dark:border-amber-800'
                        : 'border-surface-200/60 dark:border-surface-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-sm text-surface-900 dark:text-white truncate">{med.name}</span>
                        <StatusBadge label={stock.label} variant={stock.variant} dot />
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => setEditingMedicine(med)}
                          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                          <Pencil className="w-4 h-4 text-surface-500" />
                        </button>
                        <button
                          onClick={() => setDeletingMedicine(med)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 min-w-[36px] min-h-[36px] flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-surface-500">
                      <span>{med.category} &middot; {med.quantity} {med.unit}</span>
                      <span className="font-bold text-surface-900 dark:text-white text-sm">₹{med.price}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showAdd && <AddMedicineModal onClose={() => setShowAdd(false)} />}
      {editingMedicine && (
        <EditMedicineModal medicine={editingMedicine} onClose={() => setEditingMedicine(null)} />
      )}
      <ConfirmationDialog
        isOpen={!!deletingMedicine}
        onClose={() => setDeletingMedicine(null)}
        onConfirm={handleDelete}
        title="Delete Medicine"
        message={`Are you sure you want to delete ${deletingMedicine?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
