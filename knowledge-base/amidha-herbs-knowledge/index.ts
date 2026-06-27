import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '..', 'amidha-herb-database', 'herbs.json');

export interface AmidhaHerb {
  name: string;
  botanical_name: string;
  family: string;
  english_name: string;
  sanskrit_synonyms: string[];
  part_used: string[];
  main_indications: string[];
  image: string;
  link: string;
  preview: string;
  pacify: string[];
  aggravate: string[];
  tridosha: boolean;
  rasa: string[];
  guna: string[];
  virya: string;
  vipaka: string;
  prabhav: string[];
}

let _herbs: AmidhaHerb[] = [];
try {
  _herbs = JSON.parse(readFileSync(dataPath, 'utf-8'));
} catch {
  console.warn('Warning: amidha herbs.json not found. Run save-amidha-data.ts first.');
}

export const AMIDHA_HERBS = _herbs;

export const AMIDHA_HERB_STATS = {
  totalHerbs: _herbs.length,
  uniqueFamilies: [...new Set(_herbs.map(h => h.family))].length,
  uniqueBotanicals: [...new Set(_herbs.map(h => h.botanical_name))].length,
  tridoshaHerbs: _herbs.filter(h => h.tridosha).length,
  familyCounts: _herbs.reduce((acc, h) => {
    acc[h.family] = (acc[h.family] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  rasaCounts: _herbs.reduce((acc, h) => {
    for (const r of h.rasa) { acc[r] = (acc[r] || 0) + 1; }
    return acc;
  }, {} as Record<string, number>),
  viryaCounts: _herbs.reduce((acc, h) => {
    acc[h.virya] = (acc[h.virya] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  totalContentKb: Math.round(_herbs.reduce((s, h) => s + (h.preview?.length || 0), 0) / 1024),
};

export function searchAmidhaHerbs(query: string): AmidhaHerb[] {
  const q = query.toLowerCase();
  return _herbs.filter(h =>
    h.name.toLowerCase().includes(q) ||
    h.botanical_name.toLowerCase().includes(q) ||
    h.english_name.toLowerCase().includes(q) ||
    h.family.toLowerCase().includes(q) ||
    h.sanskrit_synonyms.some(s => s.toLowerCase().includes(q)) ||
    h.main_indications.some(i => i.toLowerCase().includes(q)) ||
    h.preview?.toLowerCase().includes(q) ||
    h.prabhav?.some(p => p.toLowerCase().includes(q))
  );
}
