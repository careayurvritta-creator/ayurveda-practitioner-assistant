import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const NVIDIA_EMBED_URL = 'https://integrate.api.nvidia.com/v1/embeddings';
const NVIDIA_EMBED_MODEL = 'nvidia/nv-embedqa-e5-v5';
const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

export interface EmbeddingResult {
  embedding: number[];
  provider: 'nvidia' | 'gemini';
  dimensions: number;
}

function isValidEmbedding(vec: number[]): boolean {
  return vec.every(v => Number.isFinite(v)) && vec.length > 0;
}

function truncateTo1024(vec: number[]): number[] {
  if (vec.length <= 1024) return vec;
  return vec.slice(0, 1024);
}

export async function embedNVIDIA(text: string): Promise<EmbeddingResult> {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is not configured');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const res = await fetch(NVIDIA_EMBED_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: NVIDIA_EMBED_MODEL,
      input: text,
      encoding_format: 'float',
    }),
  });
  clearTimeout(timeout);
  if (!res.ok) {
    const text2 = await res.text();
    throw new Error(`NVIDIA embed error ${res.status}: ${text2}`);
  }
  const data = await res.json();
  const raw = data.data?.[0]?.embedding;
  if (!raw || !Array.isArray(raw)) throw new Error('No embedding returned from NVIDIA');
  const embedding = isValidEmbedding(raw) ? truncateTo1024(raw) : truncateTo1024(raw.map((v: number) => isFinite(v) ? v : 0));
  return { embedding, provider: 'nvidia', dimensions: embedding.length };
}

export async function embedGemini(text: string): Promise<EmbeddingResult> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
  const url = `${GEMINI_EMBED_URL}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    signal: controller.signal,
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`Gemini embed error ${res.status}`);
  const data = await res.json();
  const values: number[] = data.embedding?.values ?? [];
  if (values.length === 0) throw new Error('No embedding from Gemini');
  return { embedding: truncateTo1024(values), provider: 'gemini', dimensions: values.length };
}

export async function embed(text: string): Promise<EmbeddingResult> {
  try {
    return await embedNVIDIA(text);
  } catch (nvidiaErr: any) {
    if (nvidiaErr.message.includes('not configured')) throw nvidiaErr;
    if (GEMINI_API_KEY) return await embedGemini(text);
    throw nvidiaErr;
  }
}

export async function embedBatch(texts: string[], onError?: (err: Error, idx: number) => void): Promise<(EmbeddingResult | null)[]> {
  const results: (EmbeddingResult | null)[] = new Array(texts.length).fill(null);
  const CONCURRENCY = 5;
  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const batch = texts.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map((text, j) => embed(text).then(r => { results[i + j] = r; return r; }))
    );
    batchResults.forEach((r, j) => {
      if (r.status === 'rejected' && onError) onError(r.reason, i + j);
    });
    if (i + CONCURRENCY < texts.length) await new Promise(r => setTimeout(r, 200));
  }
  return results;
}