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
