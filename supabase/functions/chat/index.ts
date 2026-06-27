import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { callLlm } from '../_shared/llm.ts';
import { db } from '../_shared/db.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const { message, model = 'gemini-2.5-pro', history = [] } = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400, headers: CORS });
    }

    // --- RAG: search knowledge base ---
    const { data: chunks } = await db.rpc('match_knowledge_chunks', { query: message, match_count: 5 });
    const context = (chunks || []).map((c: any) => c.content).join('\n\n') || 'No relevant knowledge found.';

    // --- Build prompt with safety guardrails ---
    const prompt = buildPatientChatPrompt(message, context, history);
    const reply = await callLlm(prompt, model);

    return new Response(JSON.stringify({ reply, model, mode: model?.startsWith('minimaxai/') ? 'minimax' : 'gemini' }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.status ?? 500;
    return new Response(JSON.stringify({ error: err.message }), { status, headers: CORS });
  }
});

function buildPatientChatPrompt(message: string, context: string, history: any[]) {
  return `You are an Ayurvedic health information assistant. You are NOT a doctor. You do NOT diagnose or prescribe.

SAFETY RULES:
- Never diagnose medical conditions or tell someone they have a specific disease.
- Never recommend specific medications, dosages, or treatments without a doctor's supervision.
- Always advise consulting a qualified Ayurvedic practitioner or allopathic doctor.
- Be respectful, culturally sensitive, and supportive.

KNOWLEDGE CONTEXT:
${context}

CONVERSATION HISTORY:
${history.map(h => `${h.role}: ${h.content}`).join('\n')}

Patient: ${message}
Assistant:`;
}
