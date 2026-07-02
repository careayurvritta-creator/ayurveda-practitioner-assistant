import { createContext, useContext, useState, useCallback } from 'react';
import type { HimsPatient, DuplicateCheckResult } from '../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface HimsPatientContextType {
  patients: HimsPatient[];
  selectedPatientId: string | null;
  selectedPatient: HimsPatient | undefined;
  setSelectedPatientId: (id: string | null) => void;
  addPatient: (patient: Omit<HimsPatient, 'id' | 'mrn' | 'createdAt'>) => HimsPatient;
  updatePatient: (id: string, updates: Partial<HimsPatient>) => void;
  deletePatient: (id: string) => void;
  getPatient: (id: string) => HimsPatient | undefined;
  searchPatients: (query: string) => HimsPatient[];
  findDuplicatePatient: (phone: string, name: string, excludeId?: string) => DuplicateCheckResult;
  updateLastVisit: (patientId: string, visitDate: string) => void;
}

const HimsPatientContext = createContext<HimsPatientContextType | null>(null);

function generateMrn(existing: HimsPatient[]): string {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const prefix = `MRN-${dateStr}-`;

  const todayMrns = existing
    .filter((p) => p.mrn.startsWith(prefix))
    .map((p) => {
      const seq = parseInt(p.mrn.replace(prefix, ''), 10);
      return isNaN(seq) ? 0 : seq;
    });

  const maxSeq = todayMrns.length > 0 ? Math.max(...todayMrns) : 0;
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export function HimsPatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useLocalStorage<HimsPatient[]>('hims_patients', []);
  const [selectedPatientId, setSelectedPatientId] = useLocalStorage<string | null>('hims_selected_patient', null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const findDuplicatePatient = useCallback(
    (phone: string, name: string, excludeId?: string): DuplicateCheckResult => {
      const normalizedPhone = phone.replace(/\D/g, '');
      const trimmedName = name.trim().toLowerCase();

      const phoneMatch = patients.find(
        (p) => p.id !== excludeId && p.phone.replace(/\D/g, '') === normalizedPhone
      );
      if (phoneMatch) {
        return { isDuplicate: true, existingPatient: phoneMatch, matchType: 'phone' };
      }

      const nameMatch = patients.find(
        (p) => p.id !== excludeId && p.name.trim().toLowerCase() === trimmedName
      );
      if (nameMatch) {
        return { isDuplicate: true, existingPatient: nameMatch, matchType: 'name' };
      }

      return { isDuplicate: false, matchType: 'none' };
    },
    [patients]
  );

  const addPatient = useCallback(
    (data: Omit<HimsPatient, 'id' | 'mrn' | 'createdAt'>): HimsPatient => {
      const newPatient: HimsPatient = {
        ...data,
        id: `hp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        mrn: generateMrn(patients),
        createdAt: new Date().toISOString(),
      };
      setPatients((prev) => [newPatient, ...prev]);
      return newPatient;
    },
    [patients, setPatients]
  );

  const updatePatient = useCallback(
    (id: string, updates: Partial<HimsPatient>) => {
      setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    },
    [setPatients]
  );

  const deletePatient = useCallback(
    (id: string) => {
      setPatients((prev) => prev.filter((p) => p.id !== id));
      if (selectedPatientId === id) setSelectedPatientId(null);
    },
    [setPatients, selectedPatientId, setSelectedPatientId]
  );

  const getPatient = useCallback(
    (id: string) => patients.find((p) => p.id === id),
    [patients]
  );

  const searchPatients = useCallback(
    (query: string) => {
      const q = query.toLowerCase().trim();
      if (q.length < 2) return [];
      return patients.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.phone.includes(q)
      );
    },
    [patients]
  );

  const updateLastVisit = useCallback(
    (patientId: string, visitDate: string) => {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId
            ? { ...p, lastVisit: visitDate > (p.lastVisit || '') ? visitDate : p.lastVisit }
            : p
        )
      );
    },
    [setPatients]
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
        findDuplicatePatient,
        updateLastVisit,
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
