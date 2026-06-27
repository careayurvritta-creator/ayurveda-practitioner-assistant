import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '..', 'planetayurveda-formulations', 'all-formulations.json');

interface PlanetAyurvedaFormulation {
  id: string;
  name: string;
  category: string;
  url: string;
  contentLength: number;
  sections: Record<string, string>;
  fullContent: string;
}

let _formulations: PlanetAyurvedaFormulation[] = [];
try {
  _formulations = JSON.parse(readFileSync(dataPath, 'utf-8'));
} catch {
  console.warn('Warning: all-formulations.json not found. Run scrape-planetayurveda-formulations.ts first.');
}

export const PLANET_AYURVEDA_FORMULATIONS = _formulations;

export const PLANET_AYURVEDA_FORMULATION_STATS = {
  totalFormulations: _formulations.length,
  categoryCounts: _formulations.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  avgSections: _formulations.length > 0
    ? Math.round(_formulations.reduce((s, f) => s + Object.keys(f.sections).length, 0) / _formulations.length)
    : 0,
  totalContentKb: Math.round(_formulations.reduce((s, f) => s + f.fullContent.length, 0) / 1024),
};
