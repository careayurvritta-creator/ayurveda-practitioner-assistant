const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MINIMAX_M3_API_KEY = Deno.env.get('MINIMAX_M3_API_KEY');

export async function callGemini(prompt: string, model = 'gemini-2.5-pro') {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export async function callMinimaxM3(prompt: string, model?: string) {
  if (!MINIMAX_M3_API_KEY) {
    const error = new Error('MINIMAX_M3_API_KEY is not configured. Please set it in Supabase Edge Function secrets.');
    (error as any).status = 503;
    throw error;
  }
  const url = 'https://api.minimaxi.chat/v1/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_M3_API_KEY}`,
    },
    body: JSON.stringify({
      model: model ?? 'minimaxai/minimax-m3',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });
  if (!res.ok) {
    throw new Error(`MiniMax API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function callLlm(prompt: string, model?: string) {
  const effectiveModel = model ?? 'gemini-2.5-pro';
  if (effectiveModel.startsWith('minimaxai/')) {
    return callMinimaxM3(prompt, effectiveModel);
  }
  return callGemini(prompt, effectiveModel);
}
