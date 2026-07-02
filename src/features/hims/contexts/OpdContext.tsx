import { createContext, useContext, useCallback } from 'react';
import type { OpdVisit, PrescriptionItem } from '../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface OpdContextType {
  visits: OpdVisit[];
  todayVisits: OpdVisit[];
  addVisit: (visit: Omit<OpdVisit, 'id' | 'visitDate'>) => void;
  updateVisitStatus: (id: string, status: OpdVisit['status']) => void;
  getVisitsByPatient: (patientId: string) => OpdVisit[];
  getVisit: (id: string) => OpdVisit | undefined;
}

const OpdContext = createContext<OpdContextType | null>(null);

export function OpdProvider({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useLocalStorage<OpdVisit[]>('hims_visits', []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.visitDate.startsWith(todayStr));

  const addVisit = useCallback(
    (data: Omit<OpdVisit, 'id' | 'visitDate'>) => {
      const newVisit: OpdVisit = {
        ...data,
        id: `ov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        visitDate: new Date().toISOString(),
      };
      setVisits((prev) => [newVisit, ...prev]);
    },
    [setVisits]
  );

  const updateVisitStatus = useCallback(
    (id: string, status: OpdVisit['status']) => {
      setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
    },
    [setVisits]
  );

  const getVisitsByPatient = useCallback(
    (patientId: string) => visits.filter((v) => v.patientId === patientId),
    [visits]
  );

  const getVisit = useCallback((id: string) => visits.find((v) => v.id === id), [visits]);

  return (
    <OpdContext.Provider
      value={{ visits, todayVisits, addVisit, updateVisitStatus, getVisitsByPatient, getVisit }}
    >
      {children}
    </OpdContext.Provider>
  );
}

export function useOpd() {
  const context = useContext(OpdContext);
  if (!context) throw new Error('useOpd must be used within OpdProvider');
  return context;
}
