const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');

export async function callNvidia(prompt: string, model = 'moonshotai/kimi-k2.6') {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is not configured');
  }
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8192,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    throw new Error(`NVIDIA API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function callLlm(prompt: string, model?: string) {
  const effectiveModel = model ?? 'moonshotai/kimi-k2.6';
  return callNvidia(prompt, effectiveModel);
}
