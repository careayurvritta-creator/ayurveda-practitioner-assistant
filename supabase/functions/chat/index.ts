import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { userScopedClient, authUid } from '../_shared/db.ts';
import { streamLLM, resolveModel } from '../_shared/rag/llm.ts';
import { buildPatientChatPrompt } from '../_shared/rag/prompts.ts';
import { retrieve } from '../_shared/rag/engine.ts';
import { corsPreflightResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';

async function collectStream(gen: AsyncGenerator<{ type: string; content?: string; error?: string }>): Promise<string> {
  let result = '';
  for await (const part of gen) {
    if (part.type === 'content' && part.content) result += part.content;
    if (part.type === 'error') result += `\n\n[Error: ${part.error}]`;
  }
  return result;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse(req);
  if (req.method !== 'POST') return errorResponse(req, 'Method not allowed', 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse(req, 'Authorization required', 401);

    const jwt = authHeader.replace('Bearer ', '');
    const userId = await authUid(jwt);
    if (!userId) return errorResponse(req, 'Invalid token', 401);

    const body = await req.json();
    const { message, model, history = [], sessionId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse(req, 'message is required', 400);
    }

    // Sanitize history: limit to last 20 messages to prevent prompt injection via long history
    const safeHistory = Array.isArray(history) ? history.slice(-20) : [];

    const resolved = resolveModel(model);

    const retrieval = await retrieve(message, {
      surface: 'chat',
      doResearch: false,
      matchCount: 15,
      tokenBudget: 8000,
    });

    const context = retrieval.chunks.map((c, i) => `[${i + 1}] (${c.source}) ${c.content}`).join('\n\n');

    const prompt = buildPatientChatPrompt(context, safeHistory, message);

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

    return jsonResponse(req, {
      text: fullText,
      meta: {
        mode: resolved.provider,
        model: resolved.model,
        chunksUsed: retrieval.chunks.length,
      },
    });
  } catch (e: any) {
    const status = e.message?.includes('not configured') ? 503 : 500;
    return errorResponse(req, e.message, status);
  }
});