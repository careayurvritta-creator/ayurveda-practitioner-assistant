export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  email?: string;
  phone?: string;
  prakriti: string;
  vikriti: string;
  agni?: string;
  koshta?: string;
  lifestyle?: string;
  season?: string;
  notes?: string;
  createdAt: string;
}

export interface Protocol {
  id: string;
  patientId: string;
  title: string;
  chiefComplaint: string;
  generatedText: string;
  createdAt: string;
}

export interface KnowledgeDoc {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  status: 'indexed' | 'processing';
}
