import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const parsedPath = resolve(__dirname, '..', 'whatsapp-chat', 'parsed-articles.json');

interface VasishthArticle {
  id: string;
  series: string;
  number: number;
  contentEn: string;
  contentHi: string;
  category: string;
  datePosted: string;
}

let _articles: VasishthArticle[] = [];
try {
  _articles = JSON.parse(readFileSync(parsedPath, 'utf-8'));
} catch {
  console.warn('Warning: parsed-articles.json not found. Run parse-whatsapp.ts first.');
}

export const VASISHTH_KNOWLEDGE = _articles;

export const VASISHTH_ARTICLES = _articles.map(a => ({
  id: a.id,
  title: `${a.series} #${a.number}`,
  series: a.series,
  number: a.number,
  category: a.category,
  contentEn: a.contentEn,
  contentHi: a.contentHi,
  datePosted: a.datePosted,
}));

export const VASISHTH_STATS = {
  totalArticles: _articles.length,
  seriesCounts: _articles.reduce((acc, a) => {
    acc[a.series] = (acc[a.series] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
  categoryCounts: _articles.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>),
};
