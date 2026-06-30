const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Fallback models if primary fails
const FALLBACK_MODELS: Record<string, string> = {
  'moonshotai/kimi-k2.6': 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
  'nvidia/llama-3.3-nemotron-super-49b-v1.5': 'nvidia/llama-3.1-nemotron-70b-instruct',
};

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

/**
 * Delay helper for retry logic with exponential backoff.
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function* streamNVIDIA(
  model: string,
  system: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  attempt: number = 0
): AsyncGenerator<StreamPart> {
  if (!NVIDIA_API_KEY) {
    yield { type: 'error', error: 'NVIDIA_API_KEY is not configured' };
    return;
  }

  const apiMessages: Array<{ role: string; content: string }> = [];
  if (system) apiMessages.push({ role: 'system', content: system });
  for (const m of messages) {
    apiMessages.push({ role: m.role, content: m.content });
  }

  // Adaptive temperature: 0.5 for more natural responses (was 0.3)
  // top_p: 0.9 for diverse but coherent responses
  // frequency_penalty: 0.1 to reduce repetition
  // presence_penalty: 0.1 to encourage new topics
  const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      max_tokens: maxTokens,
      temperature: 0.5,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
      stream: true,
    }),
  });

  // Retry on transient errors (429, 502, 503, 504)
  if (!res.ok && [429, 502, 503, 504].includes(res.status) && attempt < 2) {
    const retryAfter = res.headers.get('retry-after');
    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 2000;
    console.warn(`NVIDIA ${res.status} — retrying in ${waitMs}ms (attempt ${attempt + 1}/3)`);
    await delay(waitMs);
    yield* streamNVIDIA(model, system, messages, maxTokens, attempt + 1);
    return;
  }

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
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.5,
        topP: 0.9,
      },
    }),
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
  const defaultModel = 'moonshotai/kimi-k2.6';
  const effective = requested ?? defaultModel;

  // Kimi models via NVIDIA NIM
  if (effective.startsWith('moonshotai/') || effective.startsWith('kimi')) {
    if (!NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY is not configured. Set it in Supabase Edge Function secrets.');
    const modelName = effective.startsWith('moonshotai/') ? effective : `moonshotai/${effective}`;
    return { provider: 'nvidia', model: modelName };
  }

  // NVIDIA Nemotron models
  if (effective.startsWith('nvidia/')) {
    if (!NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY is not configured. Set it in Supabase Edge Function secrets.');
    return { provider: 'nvidia', model: effective };
  }

  // Gemini models (kept as fallback)
  if (effective.startsWith('gemini/')) {
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured. Set it in Supabase Edge Function secrets.');
    return { provider: 'gemini', model: effective.replace('gemini/', '') };
  }

  // Reject MiniMax
  if (effective.startsWith('minimaxai/')) {
    throw new Error('MiniMax models are no longer supported. Use moonshotai/kimi-k2.6 or nvidia/llama-3.3-nemotron-super-49b-v1.5.');
  }

  // For any other model name (no prefix), default to Kimi K2.6 via NVIDIA
  if (!NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY is not configured. Set it in Supabase Edge Function secrets.');
  return { provider: 'nvidia', model: `moonshotai/${effective}` };
}

/**
 * Get a fallback model for the given model if the primary fails.
 */
function getFallbackModel(model: string): string | undefined {
  return FALLBACK_MODELS[model];
}

export async function* streamLLM(
  model: string | undefined,
  system: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number
): AsyncGenerator<StreamPart> {
  const resolved = resolveModel(model);

  // Try primary model first
  let hasError = false;
  let errorContent = '';

  if (resolved.provider === 'gemini') {
    yield* streamGemini(resolved.model, system, messages, maxTokens);
  } else {
    const gen = streamNVIDIA(resolved.model, system, messages, maxTokens);
    for await (const part of gen) {
      if (part.type === 'error') {
        hasError = true;
        errorContent = part.error || 'Unknown error';
      }
      yield part;
      if (part.type === 'done' || part.type === 'error') break;
    }
  }

  // If we got an error and have a fallback model, try it
  if (hasError && resolved.provider === 'nvidia') {
    const fallback = getFallbackModel(resolved.model);
    if (fallback) {
      console.warn(`Primary model ${resolved.model} failed (${errorContent}), trying fallback: ${fallback}`);
      yield* streamNVIDIA(fallback, system, messages, maxTokens);
    }
  }
}
