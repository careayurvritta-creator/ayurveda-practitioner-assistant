import { createContext, useContext, useState, useCallback } from 'react';
import type { HimsPatient } from '../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface HimsPatientContextType {
  patients: HimsPatient[];
  selectedPatientId: string | null;
  selectedPatient: HimsPatient | undefined;
  setSelectedPatientId: (id: string | null) => void;
  addPatient: (patient: Omit<HimsPatient, 'id' | 'mrn' | 'createdAt'>) => void;
  updatePatient: (id: string, updates: Partial<HimsPatient>) => void;
  deletePatient: (id: string) => void;
  getPatient: (id: string) => HimsPatient | undefined;
  searchPatients: (query: string) => HimsPatient[];
}

const HimsPatientContext = createContext<HimsPatientContextType | null>(null);

function generateMrn(existing: HimsPatient[]): string {
  const maxNum = existing.reduce((max, p) => {
    const num = parseInt(p.mrn.replace('MRN-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `MRN-${String(maxNum + 1).padStart(5, '0')}`;
}

export function HimsPatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useLocalStorage<HimsPatient[]>('hims_patients', []);
  const [selectedPatientId, setSelectedPatientId] = useLocalStorage<string | null>('hims_selected_patient', null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const addPatient = useCallback((data: Omit<HimsPatient, 'id' | 'mrn' | 'createdAt'>) => {
    const newPatient: HimsPatient = {
      ...data,
      id: `hp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      mrn: generateMrn(patients),
      createdAt: new Date().toISOString(),
    };
    setPatients((prev) => [newPatient, ...prev]);
  }, [patients, setPatients]);

  const updatePatient = useCallback((id: string, updates: Partial<HimsPatient>) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, [setPatients]);

  const deletePatient = useCallback((id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    if (selectedPatientId === id) setSelectedPatientId(null);
  }, [setPatients, selectedPatientId, setSelectedPatientId]);

  const getPatient = useCallback((id: string) => patients.find((p) => p.id === id), [patients]);

  const searchPatients = useCallback(
    (query: string) => {
      const q = query.toLowerCase();
      return patients.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.phone.includes(q)
      );
    },
    [patients]
  );

  return (
    <HimsPatientContext.Provider
      value={{
        patients,
        selectedPatientId,
        selectedPatient,
        setSelectedPatientId,
        addPatient,
        updatePatient,
        deletePatient,
        getPatient,
        searchPatients,
      }}
    >
      {children}
    </HimsPatientContext.Provider>
  );
}

export function useHimsPatients() {
  const context = useContext(HimsPatientContext);
  if (!context) throw new Error('useHimsPatients must be used within HimsPatientProvider');
  return context;
}
