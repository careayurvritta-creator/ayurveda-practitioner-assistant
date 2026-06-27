#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

interface Article {
  id: string;
  series: string;
  number: number;
  rawText: string;
  contentEn: string;
  contentHi: string;
  category: string;
  datePosted: string;
}

const LINE_RE = /^(\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}) - (\+?\d[\d ]*): (.*)$/;

function hasDevanagari(t: string) { return /[\u0900-\u097F]/.test(t); }
function hasLatin(t: string) { return /[a-zA-Z]{2,}/.test(t); }

function categorize(title: string): string {
  const l = title.toLowerCase();
  if (l.includes('experiential treatment')) return 'treatment_protocol';
  if (l.includes('maximum benefit')) return 'drug_knowledge';
  if (l.includes('secrets revealed')) return 'clinical_methodology';
  if (l.includes('case study')) return 'case_study';
  return 'drug_knowledge';
}

function splitHiEn(text: string): { hi: string; en: string } {
  const lines = text.split('\n');
  const dividerIdx: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^[_\-]{5,}\s*$/.test(lines[i].trim())) dividerIdx.push(i);
  }

  if (dividerIdx.length < 2) {
    return { hi: text, en: text };
  }

  const firstDiv = dividerIdx[0];
  const secondDiv = dividerIdx[1];

  if (dividerIdx.length >= 4) {
    const thirdDiv = dividerIdx[2];
    const fourthDiv = dividerIdx[3];
    const hiLines = lines.slice(firstDiv + 1, secondDiv);
    const enLines = lines.slice(thirdDiv + 1, fourthDiv);
    return {
      hi: hiLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
      en: enLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
    };
  }

  const bodyLines = lines.slice(firstDiv + 1, secondDiv);
  return {
    hi: bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    en: bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  };
}

function main() {
  const p = resolve(ROOT, 'knowledge-base', 'whatsapp-chat', "WhatsApp Chat with DR.VASISHTH'S AYURVEDA.txt");
  const raw = readFileSync(p, 'utf-8');
  const lines = raw.split('\n');

  const msgs: { date: string; phone: string; text: string }[] = [];
  let cur: any = null;
  for (const l of lines) {
    const m = LINE_RE.exec(l);
    if (m) { if (cur) msgs.push(cur); cur = { date: m[1], phone: m[2], text: m[3] }; }
    else if (cur) { cur.text += '\n' + l; }
  }
  if (cur) msgs.push(cur);

  console.log(`Messages: ${msgs.length}`);

  const seriesRe = [
    { re: /Our Lifetime Clinical Experiences-(\d+)/, name: 'Our Lifetime Clinical Experiences' },
    { re: /Secrets Revealed-(\d+)/, name: 'Secrets Revealed' },
    { re: /EXPERIENTIAL TREATMENT-(\d+)/, name: 'EXPERIENTIAL TREATMENT' },
    { re: /DO YOU GET MAXIMUM BENEFIT OF EVERY DRUG-(\d+)/, name: 'DO YOU GET MAXIMUM BENEFIT OF EVERY DRUG' },
  ];

  const rawArticles: { series: string; number: number; msgs: typeof msgs }[] = [];
  const seen = new Set<string>();

  for (const m of msgs) {
    for (const { re, name } of seriesRe) {
      const match = m.text.match(re);
      if (match) {
        const num = parseInt(match[1]);
        const key = `${name}-${num}`;
        if (!seen.has(key)) {
          seen.add(key);
          const allMsgs = msgs.filter(m2 => m2.text.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-${num}`)));
          rawArticles.push({ series: name, number: num, msgs: allMsgs });
        }
        break;
      }
    }
  }

  console.log(`Unique articles: ${rawArticles.length}`);

  const articles: Article[] = [];

  for (const { series, number, msgs: artMsgs } of rawArticles) {
    const fullText = artMsgs.map(m => m.text).join('\n\n');
    const { hi, en } = splitHiEn(fullText);
    const datePosted = artMsgs[0]?.date || '';

    articles.push({
      id: `vasishth-${series.toLowerCase().replace(/\s+/g, '-')}-${number}`,
      series,
      number,
      rawText: fullText,
      contentEn: en,
      contentHi: hi,
      category: categorize(series),
      datePosted,
    });
  }

  articles.sort((a, b) => a.series.localeCompare(b.series) || a.number - b.number);

  const byCat: Record<string, number> = {};
  let hasEn = 0, hasHi = 0;
  for (const a of articles) {
    byCat[a.category] = (byCat[a.category] || 0) + 1;
    if (a.contentEn.length > 100) hasEn++;
    if (a.contentHi.length > 100) hasHi++;
  }

  console.log('\nBy category:');
  for (const [k, v] of Object.entries(byCat)) console.log(`  ${k}: ${v}`);
  console.log(`\nWith English: ${hasEn}`);
  console.log(`With Hindi: ${hasHi}`);

  const out = resolve(ROOT, 'knowledge-base', 'whatsapp-chat', 'parsed-articles.json');
  writeFileSync(out, JSON.stringify(articles, null, 2), 'utf-8');
  console.log(`\nWrote: ${out}`);

  const sample = articles.filter(a => a.contentEn.length > 200)[0];
  if (sample) {
    console.log(`\n--- Sample: ${sample.series}-${sample.number} ---`);
    console.log('EN (first 500):', sample.contentEn.slice(0, 500));
    console.log('\nHI (first 500):', sample.contentHi.slice(0, 500));
  }
}

main();
