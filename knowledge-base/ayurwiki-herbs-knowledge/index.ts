import ayurwikiData from '../ayurwiki-herbs/herbs.json';

export interface AyurwikiHerb {
  id: string;
  title: string;
  scientificName: string;
  commonNames: string[];
  categories: string[];
  uses: string[];
  partsUsed: string[];
  chemicalComposition: string;
  commonNamesByLanguage: Record<string, string[]>;
  habit: string;
  identification: {
    other?: string;
  };
  ayurvedicMedicines: string[];
  propagationMethod: string;
  cultivation: string;
  references: string[];
  medicalConditions: string[];
  sourceUrl: string;
}

export const AYURWIKI_HERBS: AyurwikiHerb[] = ayurwikiData as AyurwikiHerb[];

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function searchAyurwikiHerbs(query: string): AyurwikiHerb[] {
  const q = query.toLowerCase();
  return AYURWIKI_HERBS.filter(
    (herb) =>
      matchesQuery(herb.scientificName, q) ||
      herb.commonNames.some((name) => matchesQuery(name, q)) ||
      herb.uses.some((use) => matchesQuery(use, q)) ||
      herb.medicalConditions.some((condition) => matchesQuery(condition, q)) ||
      herb.categories.some((category) => matchesQuery(category, q)) ||
      herb.ayurvedicMedicines.some((medicine) => matchesQuery(medicine, q))
  );
}

export function getAyurwikiHerbById(id: string): AyurwikiHerb | undefined {
  return AYURWIKI_HERBS.find((herb) => herb.id === id);
}

export function getAyurwikiHerbsByCategory(category: string): AyurwikiHerb[] {
  const q = category.toLowerCase();
  return AYURWIKI_HERBS.filter((herb) =>
    herb.categories.some((cat) => matchesQuery(cat, q))
  );
}

export function getAyurwikiHerbsByCondition(condition: string): AyurwikiHerb[] {
  const q = condition.toLowerCase();
  return AYURWIKI_HERBS.filter((herb) =>
    herb.medicalConditions.some((med) => matchesQuery(med, q))
  );
}
