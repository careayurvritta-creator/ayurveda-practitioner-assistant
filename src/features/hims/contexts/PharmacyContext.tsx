import { createContext, useContext, useCallback, useMemo } from 'react';
import type { Medicine } from '../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface PharmacyContextType {
  medicines: Medicine[];
  lowStockMedicines: Medicine[];
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt'>) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  dispenseMedicine: (id: string, quantity: number) => void;
  getMedicine: (id: string) => Medicine | undefined;
  searchMedicines: (query: string) => Medicine[];
}

const PharmacyContext = createContext<PharmacyContextType | null>(null);

export function PharmacyProvider({ children }: { children: React.ReactNode }) {
  const [medicines, setMedicines] = useLocalStorage<Medicine[]>('hims_medicines', []);

  const lowStockMedicines = useMemo(
    () => medicines.filter((m) => m.quantity <= m.reorderLevel),
    [medicines]
  );

  const addMedicine = useCallback(
    (data: Omit<Medicine, 'id' | 'createdAt'>) => {
      const newMedicine: Medicine = {
        ...data,
        id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      };
      setMedicines((prev) => [newMedicine, ...prev]);
    },
    [setMedicines]
  );

  const updateMedicine = useCallback(
    (id: string, updates: Partial<Medicine>) => {
      setMedicines((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    },
    [setMedicines]
  );

  const deleteMedicine = useCallback(
    (id: string) => {
      setMedicines((prev) => prev.filter((m) => m.id !== id));
    },
    [setMedicines]
  );

  const dispenseMedicine = useCallback(
    (id: string, quantity: number) => {
      setMedicines((prev) =>
        prev.map((m) => (m.id === id ? { ...m, quantity: Math.max(0, m.quantity - quantity) } : m))
      );
    },
    [setMedicines]
  );

  const getMedicine = useCallback((id: string) => medicines.find((m) => m.id === id), [medicines]);

  const searchMedicines = useCallback(
    (query: string) => {
      const q = query.toLowerCase();
      return medicines.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.manufacturer?.toLowerCase().includes(q)
      );
    },
    [medicines]
  );

  return (
    <PharmacyContext.Provider
      value={{
        medicines,
        lowStockMedicines,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        dispenseMedicine,
        getMedicine,
        searchMedicines,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
}

export function usePharmacy() {
  const context = useContext(PharmacyContext);
  if (!context) throw new Error('usePharmacy must be used within PharmacyProvider');
  return context;
}
