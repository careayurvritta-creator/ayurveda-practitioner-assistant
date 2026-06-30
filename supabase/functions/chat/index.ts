import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { userScopedClient, serviceRoleClient, authUid } from '../_shared/db.ts';
import { streamLLM, resolveModel } from '../_shared/rag/llm.ts';
import { buildPatientChatPrompt, getCurrentRitu, getISTDateTime } from '../_shared/rag/prompts.ts';
import { retrieve } from '../_shared/rag/engine.ts';
import { corsPreflightResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { collectStream } from '../_shared/stream.ts';

function buildTemporalContext(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const ritu = getCurrentRitu();
  const dateTime = getISTDateTime();
  const month = ist.getMonth() + 1;
  const hours = ist.getHours();

  const agniNote = ritu.english === 'Monsoon'
    ? 'Mandagni (weak digestion) is common during Varsha Ritu. Light, easily digestible foods recommended.'
    : ritu.english === 'Autumn'
    ? 'Tikshnagni (sharp digestion) is typical in Sharad Ritu. Bitter-pungent tastes (Tikta-Katu Rasa) are beneficial.'
    : ritu.english === 'Summer'
    ? 'Jirnagni may be affected by heat. Pitta-aggravating foods should be minimized.'
    : ritu.english === 'Spring'
    ? 'Kapha accumulation from winter is resolving. Kapha-pacifying regimen is ideal.'
    : ritu.english === 'Early Winter'
    ? 'Agni is naturally strong in Hemanta Ritu. Heavier, nourishing foods (Madhura, Amla, Lavana Rasa) are well tolerated.'
    : 'Agni may be moderate in Shishira Ritu. Warm, cooked foods are preferred.';

  const kalaNote = hours >= 6 && hours < 10
    ? 'Morning (प्रातःकाल) — Kapha time. Ideal for वमन (Vamana) procedures if indicated.'
    : hours >= 10 && hours < 14
    ? 'Midday (मध्याह्न) — Pitta time. Largest meal of the day recommended (मध्याह्न भोजन).'
    : hours >= 14 && hours < 18
    ? 'Afternoon (सायम्) — Kapha-Vata transition. Light activity preferred.'
    : hours >= 18 && hours < 22
    ? 'Evening (सायंकाल) — Vata time. Light dinner, early rest recommended.'
    : 'Night (रात्रि) — Vata time. बस्ति (Basti) procedures are most effective during Vata hours.';

  return `Date & Time: ${dateTime}
Current ऋतु (Ritu): ${ritu.devanagari} (${ritu.english}) — ${ritu.months}
Agni pattern: ${agniNote}
Kala (time-of-day) note: ${kalaNote}`;
}

async function fetchPatientContext(userClient: any, patientId: string): Promise<string | null> {
  try {
    const { data: patient, error } = await userClient
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error || !patient) return null;

    const parts: string[] = [];
    if (patient.name) parts.push(`Name: ${patient.name}`);
    if (patient.age) parts.push(`Age: ${patient.age}`);
    if (patient.gender) parts.push(`Gender: ${patient.gender}`);
    if (patient.prakriti) parts.push(`प्रकृति (Prakriti): ${patient.prakriti}`);
    if (patient.vikriti) parts.push(`विकृति (Vikriti): ${patient.vikriti}`);
    if (patient.allergies?.length) parts.push(`Allergies: ${patient.allergies.join(', ')}`);
    if (patient.current_medications?.length) parts.push(`Current Medications: ${patient.current_medications.join(', ')}`);
    if (patient.chronic_conditions?.length) parts.push(`Chronic Conditions: ${patient.chronic_conditions.join(', ')}`);
    if (patient.notes) parts.push(`Clinical Notes: ${patient.notes}`);

    return parts.length > 0 ? parts.join('\n') : null;
  } catch {
    return null;
  }
}

/**
 * Compress long conversation history by summarizing older messages.
 * Keeps the last 5 messages intact, summarizes the rest into a brief context.
 */
function compressHistory(history: Array<{ role: string; content: string }>): Array<{ role: string; content: string }> {
  if (history.length <= 6) return history;

  const older = history.slice(0, -5);
  const recent = history.slice(-5);

  const topics = older
    .filter(m => m.role === 'user')
    .map(m => m.content.slice(0, 100))
    .join('; ');

  const summary = `[Earlier conversation summary: Doctor discussed ${topics || 'various clinical topics'}]`;

  return [
    { role: 'user', content: summary },
    { role: 'assistant', content: 'Understood. Continuing from where we left off.' },
    ...recent,
  ];
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
    const { message, model, history = [], sessionId, patientId } = body;

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

    // Build temporal context (IST date/time, Ritu, Kala)
    const temporalContext = buildTemporalContext();

    // Fetch patient details if patientId provided (server-side, with user-scoped RLS)
    let patientContext: string | null = null;
    if (patientId) {
      const userClient = userScopedClient(jwt);
      patientContext = await fetchPatientContext(userClient, patientId);
    }

    // Compress long histories
    const compressedHistory = compressHistory(safeHistory);

    const retrieval = await retrieve(message, {
      surface: 'chat',
      doResearch: false,
      history: compressedHistory,
    });

    let context = retrieval.chunks.map((c, i) => `[${i + 1}] (${c.source}) ${c.content}`).join('\n\n');

    // Inject clinical pathway context if available
    if (retrieval.clinicalPathwayContext) {
      context = `${retrieval.clinicalPathwayContext}\n\nRETRIEVED KNOWLEDGE:\n${context}`;
    }

    const prompt = buildPatientChatPrompt(
      context,
      compressedHistory,
      message,
      patientContext ?? undefined,
      temporalContext,
    );

    const maxTokens = retrieval.query.complexity === 'complex' ? 12000
      : retrieval.query.complexity === 'moderate' ? 8000
      : 4000;

    const { text: fullText, errors: llmErrors } = await collectStream(
      streamLLM(model, prompt.system, [{ role: 'user', content: prompt.user }], maxTokens)
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
        temporalContext: temporalContext.slice(0, 200),
        patientContextApplied: !!patientContext,
        clinicalPathway: retrieval.query.clinicalPathway,
        isFollowUp: retrieval.query.isFollowUp,
        intent: retrieval.query.intent,
        complexity: retrieval.query.complexity,
      },
    });
  } catch (e: any) {
    console.error('chat function error:', e?.message);
    const status = e.message?.includes('not configured') ? 503 : 500;
    const msg = status === 503 ? 'AI service is not configured' : 'Internal server error';
    return errorResponse(req, msg, status);
  }
});
