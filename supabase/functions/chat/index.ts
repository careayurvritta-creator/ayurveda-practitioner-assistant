import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { userScopedClient } from '../_shared/db.ts';
import { authUid } from '../_shared/db.ts';
import { streamLLM, resolveModel } from '../_shared/rag/llm.ts';
import { buildPatientChatPrompt } from '../_shared/rag/prompts.ts';
import { retrieve } from '../_shared/rag/engine.ts';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function collectStream(gen: AsyncGenerator<{ type: string; content?: string; error?: string }>): Promise<string> {
  let result = '';
  for await (const part of gen) {
    if (part.type === 'content' && part.content) result += part.content;
    if (part.type === 'error') result += `\n\n[Error: ${part.error}]`;
  }
  return result;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const userId = authUid(jwt);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { message, model, history = [], sessionId } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'message is required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const resolved = resolveModel(model);

    const retrieval = await retrieve(message, {
      surface: 'chat',
      doResearch: false,
      matchCount: 15,
      tokenBudget: 8000,
    });

    const context = retrieval.chunks.map((c, i) => `[${i + 1}] (${c.source}) ${c.content}`).join('\n\n');

    const prompt = buildPatientChatPrompt(context, history, message);

    const fullText = await collectStream(
      streamLLM(model, prompt.system, [{ role: 'user', content: prompt.user }], 8000)
    );

    if (userId && sessionId) {
      try {
        const userClient = userScopedClient(jwt);
        await userClient.from('messages').insert([
          { session_id: sessionId, role: 'user', content: message },
          { session_id: sessionId, role: 'assistant', content: fullText, model: resolved.model },
        ]);
        await userClient.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
      } catch { /* best-effort */ }
    }

    return new Response(JSON.stringify({
      text: fullText,
      meta: {
        mode: resolved.provider,
        model: resolved.model,
        chunksUsed: retrieval.chunks.length,
      },
    }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    const status = e.message?.includes('not configured') ? 503 : 500;
    return new Response(JSON.stringify({ error: e.message }), {
      status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});