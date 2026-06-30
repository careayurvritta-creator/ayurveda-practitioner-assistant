import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Patient } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface PatientContextType {
  patients: Patient[];
  selectedPatientId: string | null;
  selectedPatient: Patient | undefined;
  setSelectedPatientId: (id: string | null) => void;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => void;
  deletePatient: (id: string) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  loadDemoData: () => void;
  resetAllData: () => void;
}

const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useLocalStorage<Patient[]>('ayurscribe_patients', []);
  const [selectedPatientId, setSelectedPatientId] = useLocalStorage<string | null>('ayurscribe_selected_patient', null);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const addPatient = useCallback((data: Omit<Patient, 'id' | 'createdAt'>) => {
    const newPatient: Patient = {
      ...data,
      id: `patient-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    setPatients((prev) => [...prev, newPatient]);
  }, [setPatients]);

  const deletePatient = useCallback((id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    if (selectedPatientId === id) {
      setSelectedPatientId(null);
    }
  }, [setPatients, selectedPatientId, setSelectedPatientId]);

  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, [setPatients]);

  const loadDemoData = useCallback(() => {
    const demoPatients: Patient[] = [
      {
        id: 'demo-1',
        name: 'Ananth Narayanan',
        age: 45,
        gender: 'Male',
        prakriti: 'Pitta-Vata',
        vikriti: 'Pitta aggravation with Ama',
        agni: 'Tikshnagni',
        koshta: 'Vishama',
        notes: 'Hyperacidity, stress-related insomnia, working late nights',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-2',
        name: 'Dr. Meera Deshpande',
        age: 52,
        gender: 'Female',
        prakriti: 'Vata-Kapha',
        vikriti: 'Vata aggravation',
        agni: 'Mandagni',
        koshta: 'Snigdha',
        notes: 'Osteoarthritis, joint stiffness, mild hypertension',
        createdAt: new Date().toISOString(),
      },
    ];
    setPatients(demoPatients);
  }, [setPatients]);

  const resetAllData = useCallback(() => {
    setPatients([]);
    setSelectedPatientId(null);
  }, [setPatients, setSelectedPatientId]);

  return (
    <PatientContext.Provider
      value={{
        patients,
        selectedPatientId,
        selectedPatient,
        setSelectedPatientId,
        addPatient,
        deletePatient,
        updatePatient,
        loadDemoData,
        resetAllData,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context) throw new Error('usePatients must be used within PatientProvider');
  return context;
}
