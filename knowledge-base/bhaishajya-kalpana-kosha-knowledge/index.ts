import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '..', 'bhaishajya-kalpana-kosha', 'formulations.json');

export interface BhaishajyaFormulation {
  name: string;
  type: string;
  category: string;
  main_ingredients: string[];
  ingredients: string;
  reference: string;
  indications: string;
  dosage: string;
  anupana: string;
}

let _formulations: BhaishajyaFormulation[] = [];
try {
  _formulations = JSON.parse(readFileSync(dataPath, 'utf-8'));
} catch {
  console.warn('Warning: bhaishajya-kalpana-kosha formulations.json not found. Run save-amidha-data.ts first.');
}

export const BHAISHAJYA_FORMULATIONS = _formulations;

export const BHAISHAJYA_FORMULATION_STATS = {
  totalFormulations: _formulations.length,
  uniqueTypes: [...new Set(_formulations.map(f => f.type))].length,
  uniqueCategories: [...new Set(_formulations.map(f => f.category))].length,
  typeCounts: _formulations.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  categoryCounts: _formulations.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  totalContentKb: Math.round(_formulations.reduce((s, f) => s + (f.indications?.length || 0) + (f.ingredients?.length || 0), 0) / 1024),
};

export function searchBhaishajyaFormulations(query: string): BhaishajyaFormulation[] {
  const q = query.toLowerCase();
  return _formulations.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.type.toLowerCase().includes(q) ||
    f.category.toLowerCase().includes(q) ||
    f.main_ingredients.some(i => i.toLowerCase().includes(q)) ||
    f.ingredients?.toLowerCase().includes(q) ||
    f.indications?.toLowerCase().includes(q) ||
    f.reference?.toLowerCase().includes(q)
  );
}
