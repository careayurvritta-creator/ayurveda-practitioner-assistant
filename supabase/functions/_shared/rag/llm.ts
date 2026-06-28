const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export type LLMProvider = 'nvidia' | 'gemini';

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
}

export interface StreamPart {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
}

function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function countMessagesTokens(messages: Array<{ role: string; content: string }>): number {
  return messages.reduce((sum, m) => sum + countTokens(m.content) + 4, 0);
}

export async function* streamNVIDIA(
  model: string,
  system: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number
): AsyncGenerator<StreamPart> {
  if (!NVIDIA_API_KEY) {
    yield { type: 'error', error: 'NVIDIA_API_KEY is not configured' };
    return;
  }

  const prompt = messages.map(m => `<|${m.role}|>\n${m.content}`).join('\n');
  const fullPrompt = system ? `<|system|>\n${system}\n${prompt}<|user|>\n` : `${prompt}<|user|>\n`;

  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: maxTokens,
      temperature: 0.3,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    yield { type: 'error', error: `NVIDIA error ${res.status}: ${err}` };
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') { yield { type: 'done' }; return; }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield { type: 'content', content };
          } catch { /* skip */ }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  yield { type: 'done' };
}

export async function* streamGemini(
  model: string,
  system: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number
): AsyncGenerator<StreamPart> {
  if (!GEMINI_API_KEY) {
    yield { type: 'error', error: 'GEMINI_API_KEY is not configured' };
    return;
  }

  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  if (system) {
    contents.unshift({ role: 'user', parts: [{ text: system }] });
  }

  const url = `${GEMINI_BASE_URL}/models/${model}:streamGenerateContent?alt=sse`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 } }),
  });

  if (!res.ok) {
    const err = await res.text();
    yield { type: 'error', error: `Gemini error ${res.status}: ${err}` };
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) yield { type: 'content', content };
          } catch { /* skip */ }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  yield { type: 'done' };
}

export function resolveModel(requested?: string): { provider: LLMProvider; model: string } {
  const defaultModel = 'nvidia/llama-3.1-nemotron-70b-instruct';
  const effective = requested ?? defaultModel;

  if (effective.startsWith('nvidia/')) {
    if (!NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY is not configured. Set it in Supabase Edge Function secrets.');
    return { provider: 'nvidia', model: effective };
  }
  if (effective.startsWith('gemini/')) {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured. Set it in Supabase Edge Function secrets.');
    return { provider: 'gemini', model: effective.replace('gemini/', '') };
  }
  if (effective.startsWith('minimaxai/')) {
    throw new Error('MiniMax models are no longer supported. Use nvidia/llama-3.1-nemotron-70b-instruct or gemini/gemini-2.0-flash.');
  }

  if (!NVIDIA_API_KEY && !GEMINI_API_KEY) throw new Error('No LLM provider configured. Set NVIDIA_API_KEY or GEMINI_API_KEY.');
  if (NVIDIA_API_KEY) return { provider: 'nvidia', model: effective || 'nvidia/llama-3.1-nemotron-70b-instruct' };
  return { provider: 'gemini', model: effective.replace('gemini/', '') || 'gemini-2.0-flash' };
}

export async function* streamLLM(
  model: string | undefined,
  system: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number
): AsyncGenerator<StreamPart> {
  const resolved = resolveModel(model);

  if (resolved.provider === 'nvidia') {
    yield* streamNVIDIA(resolved.model, system, messages, maxTokens);
  } else {
    yield* streamGemini(resolved.model, system, messages, maxTokens);
  }
}