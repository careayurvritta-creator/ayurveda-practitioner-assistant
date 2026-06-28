import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { userScopedClient, authUid } from '../_shared/db.ts';
import { streamLLM, resolveModel } from '../_shared/rag/llm.ts';
import { buildPatientChatPrompt } from '../_shared/rag/prompts.ts';
import { retrieve } from '../_shared/rag/engine.ts';
import { corsPreflightResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';

async function collectStream(gen: AsyncGenerator<{ type: string; content?: string; error?: string }>): Promise<{ text: string; errors: string[] }> {
  let result = '';
  const errors: string[] = [];
  for await (const part of gen) {
    if (part.type === 'content' && part.content) result += part.content;
    if (part.type === 'error' && part.error) errors.push(part.error);
  }
  return { text: result, errors };
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

    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > 256 * 1024) return errorResponse(req, 'Request body too large', 413);

    const body = await req.json();
    const { message, model, history = [], sessionId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse(req, 'message is required', 400);
    }

    if (message.length > 4000) {
      return errorResponse(req, 'message exceeds 4000 character limit', 400);
    }

    // Sanitize history: limit to last 20 messages, strip control chars, enforce role/content shape
    const safeHistory = Array.isArray(history)
      ? history.slice(-20).map((h: any) => ({
          role: h?.role === 'assistant' ? 'assistant' : 'user',
          content: typeof h?.content === 'string'
            ? h.content.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 4000)
            : '',
        })).filter((h: any) => h.content.length > 0)
      : [];

    const resolved = resolveModel(model);

    const retrieval = await retrieve(message, {
      surface: 'chat',
      doResearch: false,
      matchCount: 15,
      tokenBudget: 8000,
    });

    const context = retrieval.chunks.map((c, i) => `[${i + 1}] (${c.source}) ${c.content}`).join('\n\n');

    const prompt = buildPatientChatPrompt(context, safeHistory, message);

    const { text: fullText, errors: llmErrors } = await collectStream(
      streamLLM(model, prompt.system, [{ role: 'user', content: prompt.user }], 8000)
    );

    if (llmErrors.length > 0) {
      console.error('LLM stream errors:', llmErrors);
    }

    if (userId && sessionId) {
      try {
        const userClient = userScopedClient(jwt);
        await userClient.from('messages').insert([
          { session_id: sessionId, role: 'user', content: message },
          { session_id: sessionId, role: 'assistant', content: fullText, model: resolved.model },
        ]);
        await userClient.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId).eq('owner_id', userId);
      } catch { /* best-effort */ }
    }

    // Log query metrics (best-effort, service-role)
    try {
      const { serviceRoleClient } = await import('../_shared/db.ts');
      const svc = serviceRoleClient();
      await svc.rpc('log_query', {
        p_user_id: userId,
        p_surface: 'chat',
        p_query_text: message.slice(0, 2000),
        p_intent: retrieval.query.intent,
        p_entities: retrieval.query.entities,
        p_vector_count: retrieval.retrievalMetadata.vectorCount,
        p_keyword_count: retrieval.retrievalMetadata.keywordCount,
        p_after_dedup: retrieval.retrievalMetadata.afterDedup,
        p_after_rerank: retrieval.retrievalMetadata.afterRerank,
        p_chunks_used: retrieval.chunks.length,
        p_total_tokens: retrieval.totalTokens,
        p_latency_ms: retrieval.retrievalMetadata.latencyMs,
        p_model_used: resolved.model,
        p_model_provider: resolved.provider,
        p_research_count: 0,
      });
    } catch { /* best-effort logging */ }

    return jsonResponse(req, {
      text: fullText,
      meta: {
        mode: resolved.provider,
        model: resolved.model,
        chunksUsed: retrieval.chunks.length,
      },
    });
  } catch (e: any) {
    console.error('chat function error:', e?.message);
    const status = e.message?.includes('not configured') ? 503 : 500;
    const msg = status === 503 ? 'AI service is not configured' : 'Internal server error';
    return errorResponse(req, msg, status);
  }
});