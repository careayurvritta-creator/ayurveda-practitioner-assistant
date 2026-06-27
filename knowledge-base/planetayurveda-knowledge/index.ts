import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '..', 'planetayurveda', 'all-diseases.json');

interface PlanetAyurvedaDisease {
  id: string;
  name: string;
  url: string;
  category: string;
  contentLength: number;
  sections: Record<string, string>;
  fullContent: string;
}

let _diseases: PlanetAyurvedaDisease[] = [];
try {
  _diseases = JSON.parse(readFileSync(dataPath, 'utf-8'));
} catch {
  console.warn('Warning: all-diseases.json not found. Run scrape-planetayurveda.ts first.');
}

export const PLANET_AYURVEDA_DISEASES = _diseases;

export const PLANET_AYURVEDA_STATS = {
  totalDiseases: _diseases.length,
  categoryCounts: _diseases.reduce((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  avgSections: _diseases.length > 0
    ? Math.round(_diseases.reduce((s, d) => s + Object.keys(d.sections).length, 0) / _diseases.length)
    : 0,
  totalContentKb: Math.round(_diseases.reduce((s, d) => s + d.fullContent.length, 0) / 1024),
};
