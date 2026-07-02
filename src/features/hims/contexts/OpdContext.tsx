import { createContext, useContext, useCallback, useMemo } from 'react';
import type { OpdVisit, PrescriptionItem } from '../types';
import { canTransition } from '../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface OpdContextType {
  visits: OpdVisit[];
  todayVisits: OpdVisit[];
  addVisit: (visit: Omit<OpdVisit, 'id' | 'visitDate'>) => void;
  updateVisit: (id: string, updates: Partial<OpdVisit>) => void;
  updateVisitStatus: (id: string, status: OpdVisit['status']) => void;
  cancelVisit: (id: string) => void;
  getVisitsByPatient: (patientId: string) => OpdVisit[];
  getVisitsByDoctor: (doctorName: string, date?: string) => OpdVisit[];
  getVisit: (id: string) => OpdVisit | undefined;
  getVisitStats: (date?: string) => { waiting: number; inProgress: number; completed: number; cancelled: number; total: number };
}

const OpdContext = createContext<OpdContextType | null>(null);

export function OpdProvider({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useLocalStorage<OpdVisit[]>('hims_visits', []);

  const todayStr = new Date().toLocaleDateString('sv-SE');
  const todayVisits = useMemo(
    () => visits.filter((v) => v.visitDate.startsWith(todayStr)),
    [visits, todayStr]
  );

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

  const updateVisit = useCallback(
    (id: string, updates: Partial<OpdVisit>) => {
      setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    },
    [setVisits]
  );

  const updateVisitStatus = useCallback(
    (id: string, status: OpdVisit['status']) => {
      setVisits((prev) =>
        prev.map((v) => {
          if (v.id !== id) return v;
          if (!canTransition(v.status, status)) return v;
          const now = new Date().toISOString();
          const updates: Partial<OpdVisit> = { status };
          if (status === 'in-progress') updates.startedAt = now;
          if (status === 'completed') updates.completedAt = now;
          if (status === 'cancelled') updates.cancelledAt = now;
          return { ...v, ...updates };
        })
      );
    },
    [setVisits]
  );

  const cancelVisit = useCallback(
    (id: string) => {
      updateVisitStatus(id, 'cancelled');
    },
    [updateVisitStatus]
  );

  const getVisitsByPatient = useCallback(
    (patientId: string) => visits.filter((v) => v.patientId === patientId),
    [visits]
  );

  const getVisitsByDoctor = useCallback(
    (doctorName: string, date?: string) => {
      return visits.filter((v) => {
        const matchesDoctor = v.doctorName === doctorName;
        const matchesDate = date ? v.visitDate.startsWith(date) : true;
        return matchesDoctor && matchesDate;
      });
    },
    [visits]
  );

  const getVisit = useCallback(
    (id: string) => visits.find((v) => v.id === id),
    [visits]
  );

  const getVisitStats = useCallback(
    (date?: string) => {
      const filtered = date ? visits.filter((v) => v.visitDate.startsWith(date)) : visits;
      return {
        waiting: filtered.filter((v) => v.status === 'waiting').length,
        inProgress: filtered.filter((v) => v.status === 'in-progress').length,
        completed: filtered.filter((v) => v.status === 'completed').length,
        cancelled: filtered.filter((v) => v.status === 'cancelled').length,
        total: filtered.length,
      };
    },
    [visits]
  );

  return (
    <OpdContext.Provider
      value={{
        visits,
        todayVisits,
        addVisit,
        updateVisit,
        updateVisitStatus,
        cancelVisit,
        getVisitsByPatient,
        getVisitsByDoctor,
        getVisit,
        getVisitStats,
      }}
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
