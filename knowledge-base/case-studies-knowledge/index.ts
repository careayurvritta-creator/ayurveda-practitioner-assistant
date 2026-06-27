import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const csPath = resolve(__dirname, '..', 'case-studies', 'parsed-case-studies.json');
const txPath = resolve(__dirname, '..', 'case-studies', 'parsed-treatments.json');

interface CaseStudy {
  id: string;
  caseNumber: number;
  diseaseName: string;
  diseaseNameEn: string;
  part1: string;
  part2: string;
  sections: Record<string, string>;
  category: string;
  datePosted: string;
  sender: string;
}

interface Treatment {
  id: string;
  treatmentNumber: number;
  title: string;
  content: string;
  sections: Record<string, string>;
  datePosted: string;
  sender: string;
}

let _caseStudies: CaseStudy[] = [];
let _treatments: Treatment[] = [];
try {
  _caseStudies = JSON.parse(readFileSync(csPath, 'utf-8'));
} catch {
  console.warn('Warning: parsed-case-studies.json not found. Run parse-case-studies.ts first.');
}
try {
  _treatments = JSON.parse(readFileSync(txPath, 'utf-8'));
} catch {
  console.warn('Warning: parsed-treatments.json not found. Run parse-case-studies.ts first.');
}

export const CASE_STUDIES = _caseStudies;
export const CASE_TREATMENTS = _treatments;

export const CASE_STUDY_STATS = {
  totalCases: _caseStudies.length,
  totalTreatments: _treatments.length,
  categoryCounts: _caseStudies.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  sectionCounts: _caseStudies.reduce((acc, c) => {
    for (const s of Object.keys(c.sections)) {
      acc[s] = (acc[s] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>),
};
