import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { userScopedClient, authUid } from '../_shared/db.ts';
import { streamLLM, resolveModel } from '../_shared/rag/llm.ts';
import { buildTreatmentProtocolPrompt } from '../_shared/rag/prompts.ts';
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
    const { diagnosis, patientSummary = '', severity = 'moderate', chronicity = 'subacute', model, saveToCases = false } = body;

    if (!diagnosis || typeof diagnosis !== 'string' || diagnosis.trim().length === 0) {
      return errorResponse(req, 'diagnosis is required', 400);
    }

    const safeDiagnosis = diagnosis.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 1000);
    const safeSummary = patientSummary.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 5000);

    const resolved = resolveModel(model);

    const retrieval = await retrieve(safeDiagnosis, {
      surface: 'treatment-protocol',
      doResearch: true,
      skipSerpAPI: !Deno.env.get('SERPAPI_KEY'),
      matchCount: 25,
      tokenBudget: 16000,
    });

    const context = retrieval.chunks.map((c, i) => `[${i + 1}] (${c.source}/${c.title ?? 'N/A'}) ${c.content}`).join('\n\n');

    const prompt = buildTreatmentProtocolPrompt(
      context, safeDiagnosis, safeSummary, severity, chronicity, retrieval.researchArticles
    );

    const fullText = await collectStream(
      streamLLM(model, prompt.system, [{ role: 'user', content: prompt.user }], 16000)
    );

    if (saveToCases && userId) {
      try {
        const db = userScopedClient(jwt);
        await db.from('clinical_cases').insert({
          diagnosis: safeDiagnosis,
          patient_summary: safeSummary,
          treatment_plan: fullText.slice(0, 10000),
          user_id: userId,
        });
      } catch { /* best-effort */ }
    }

    // Log query metrics (best-effort, service-role)
    try {
      const { serviceRoleClient } = await import('../_shared/db.ts');
      const svc = serviceRoleClient();
      await svc.rpc('log_query', {
        p_user_id: userId,
        p_surface: 'treatment-protocol',
        p_query_text: safeDiagnosis.slice(0, 2000),
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
        p_research_count: retrieval.researchArticles.length,
      });
    } catch { /* best-effort logging */ }

    return jsonResponse(req, {
      text: fullText,
      research: retrieval.researchArticles,
      meta: {
        mode: resolved.provider,
        model: resolved.model,
        researchCount: retrieval.researchArticles.length,
        chunksUsed: retrieval.chunks.length,
        totalTokens: retrieval.totalTokens,
      },
    });
  } catch (e: any) {
    const status = e.message?.includes('not configured') ? 503 : 500;
    return errorResponse(req, e.message, status);
  }
});
