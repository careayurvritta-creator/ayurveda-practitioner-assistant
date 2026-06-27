import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const p = resolve(ROOT, 'knowledge-base', 'whatsapp-chat', "WhatsApp Chat with DR.VASISHTH'S AYURVEDA.txt");
const raw = readFileSync(p, 'utf-8');
const lines = raw.split('\n');
const LINE_RE = /^(\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}) - (\+?\d[\d ]*): (.*)$/;

let msgs: any[] = [];
let cur: any = null;
for (const l of lines) {
  const m = LINE_RE.exec(l);
  if (m) { if (cur) msgs.push(cur); cur = { date: m[1], phone: m[2], text: m[3] }; }
  else if (cur) { cur.text += '\n' + l; }
}
if (cur) msgs.push(cur);

console.log('Messages:', msgs.length);

const art4 = msgs.filter(m => /Our Lifetime Clinical Experiences-4/.test(m.text));
console.log('Arts with Experiences-4:', art4.length);

if (art4[0]) {
  const text = art4[0].text;
  const artLines = text.split('\n');
  console.log('Total lines in article:', artLines.length);
  
  for (let i = 0; i < artLines.length; i++) {
    const l = artLines[i].trim();
    if (/^[_\-]{5,}/.test(l) || /^_{5,}/.test(l)) {
      console.log(`Divider at line ${i}: "${l}"`);
      console.log('  Next 3 lines:');
      for (let j = i+1; j < Math.min(i+4, artLines.length); j++) {
        console.log(`  ${j}: "${artLines[j].slice(0, 100)}"`);
      }
    }
  }
}
