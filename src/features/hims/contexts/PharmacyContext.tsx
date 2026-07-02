import { createContext, useContext, useCallback, useMemo } from 'react';
import type { Medicine, DispensingRecord } from '../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface PharmacyContextType {
  medicines: Medicine[];
  lowStockMedicines: Medicine[];
  dispensingRecords: DispensingRecord[];
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt'>) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  dispenseMedicine: (medicineId: string, quantity: number, patientId: string, patientName: string, visitId: string, dispensedBy: string) => DispensingRecord | null;
  getMedicine: (id: string) => Medicine | undefined;
  searchMedicines: (query: string) => Medicine[];
  getDispensingByVisit: (visitId: string) => DispensingRecord[];
}

const PharmacyContext = createContext<PharmacyContextType | null>(null);

export function PharmacyProvider({ children }: { children: React.ReactNode }) {
  const [medicines, setMedicines] = useLocalStorage<Medicine[]>('hims_medicines', []);
  const [dispensingRecords, setDispensingRecords] = useLocalStorage<DispensingRecord[]>('hims_dispensing', []);

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
    (medicineId: string, quantity: number, patientId: string, patientName: string, visitId: string, dispensedBy: string) => {
      const medicine = medicines.find((m) => m.id === medicineId);
      if (!medicine || medicine.quantity < quantity) return null;

      const record: DispensingRecord = {
        id: `disp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        patientId,
        patientName,
        visitId,
        medicineId,
        medicineName: medicine.name,
        quantityDispensed: quantity,
        unit: medicine.unit,
        dispensedBy,
        dispensedAt: new Date().toISOString(),
      };

      setMedicines((prev) =>
        prev.map((m) => (m.id === medicineId ? { ...m, quantity: Math.max(0, m.quantity - quantity) } : m))
      );
      setDispensingRecords((prev) => [record, ...prev]);
      return record;
    },
    [medicines, setMedicines, setDispensingRecords]
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

  const getDispensingByVisit = useCallback(
    (visitId: string) => dispensingRecords.filter((r) => r.visitId === visitId),
    [dispensingRecords]
  );

  return (
    <PharmacyContext.Provider
      value={{
        medicines,
        lowStockMedicines,
        dispensingRecords,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        dispenseMedicine,
        getMedicine,
        searchMedicines,
        getDispensingByVisit,
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
