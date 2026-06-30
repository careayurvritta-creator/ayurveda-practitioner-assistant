import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ProtocolAnswers {
  prakriti: string;
  vikriti: string;
  agni: string;
  koshta: string;
  satmya: string;
  sara: string;
  pramana: string;
  [key: string]: string;
}

interface ProtocolContextType {
  currentStep: number;
  patientData: { name: string; age: string; gender: string; chiefComplaint: string };
  answers: ProtocolAnswers;
  generatedProtocol: string;
  isGenerating: boolean;
  setStep: (step: number) => void;
  updatePatientData: (data: Partial<ProtocolContextType['patientData']>) => void;
  addAnswer: (key: string, value: string) => void;
  generateProtocol: () => Promise<void>;
  reset: () => void;
}

const ProtocolContext = createContext<ProtocolContextType | null>(null);

const INITIAL_ANSWERS: ProtocolAnswers = {
  prakriti: '',
  vikriti: '',
  agni: '',
  koshta: '',
  satmya: '',
  sara: '',
  pramana: '',
};

const INITIAL_PATIENT_DATA = {
  name: '',
  age: '',
  gender: '',
  chiefComplaint: '',
};

export function ProtocolProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useLocalStorage<number>('ayurscribe_protocol_step', 1);
  const [patientData, setPatientData] = useLocalStorage('ayurscribe_protocol_patient', INITIAL_PATIENT_DATA);
  const [answers, setAnswers] = useLocalStorage<ProtocolAnswers>('ayurscribe_protocol_answers', INITIAL_ANSWERS);
  const [generatedProtocol, setGeneratedProtocol] = useLocalStorage('ayurscribe_protocol_result', '');
  const [isGenerating, setIsGenerating] = useState(false);

  const setStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, [setCurrentStep]);

  const updatePatientData = useCallback((data: Partial<typeof patientData>) => {
    setPatientData((prev) => ({ ...prev, ...data }));
  }, [setPatientData]);

  const addAnswer = useCallback((key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, [setAnswers]);

  const generateProtocol = useCallback(async () => {
    setIsGenerating(true);
    try {
      const patientSummary = `Patient: ${patientData.name}, Age: ${patientData.age}, Gender: ${patientData.gender}
Chief Complaint: ${patientData.chiefComplaint}
Clinical Assessment:
- Prakriti: ${answers.prakriti}
- Vikriti: ${answers.vikriti}
- Agni: ${answers.agni}
- Koshta: ${answers.koshta}
- Satmya: ${answers.satmya}
- Sara: ${answers.sara}
- Pramana: ${answers.pramana}`;

      const { data, error } = await supabase.functions.invoke('treatment-protocol', {
        body: {
          diagnosis: patientData.chiefComplaint,
          patientSummary,
          severity: 'moderate',
          chronicity: 'chronic',
          model: undefined,
          saveToCases: false,
        },
      });

      if (error) throw error;

      setGeneratedProtocol(data.text || data.protocol || data.choices?.[0]?.message?.content || 'Protocol generation failed.');
    } catch (err) {
      setGeneratedProtocol(`Error generating protocol: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  }, [patientData, answers, setGeneratedProtocol]);

  const reset = useCallback(() => {
    setCurrentStep(1);
    setPatientData(INITIAL_PATIENT_DATA);
    setAnswers(INITIAL_ANSWERS);
    setGeneratedProtocol('');
  }, [setCurrentStep, setPatientData, setAnswers, setGeneratedProtocol]);

  return (
    <ProtocolContext.Provider
      value={{
        currentStep,
        patientData,
        answers,
        generatedProtocol,
        isGenerating,
        setStep,
        updatePatientData,
        addAnswer,
        generateProtocol,
        reset,
      }}
    >
      {children}
    </ProtocolContext.Provider>
  );
}

export function useProtocol() {
  const context = useContext(ProtocolContext);
  if (!context) throw new Error('useProtocol must be used within ProtocolProvider');
  return context;
}
