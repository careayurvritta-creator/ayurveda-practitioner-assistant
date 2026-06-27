import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '..', 'planetayurveda-herbs', 'all-herbs.json');

interface PlanetAyurvedaHerb {
  id: string;
  name: string;
  url: string;
  contentLength: number;
  sections: Record<string, string>;
  fullContent: string;
}

let _herbs: PlanetAyurvedaHerb[] = [];
try {
  _herbs = JSON.parse(readFileSync(dataPath, 'utf-8'));
} catch {
  console.warn('Warning: all-herbs.json not found. Run scrape-planetayurveda-herbs.ts first.');
}

export const PLANET_AYURVEDA_HERBS = _herbs;

export const PLANET_AYURVEDA_HERB_STATS = {
  totalHerbs: _herbs.length,
  avgSections: _herbs.length > 0
    ? Math.round(_herbs.reduce((s, h) => s + Object.keys(h.sections).length, 0) / _herbs.length)
    : 0,
  totalContentKb: Math.round(_herbs.reduce((s, h) => s + h.fullContent.length, 0) / 1024),
};
