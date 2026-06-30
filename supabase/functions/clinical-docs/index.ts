import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authUid, serviceRoleClient } from '../_shared/db.ts';
import { streamLLM, resolveModel } from '../_shared/rag/llm.ts';
import { buildClinicalDocsPrompt } from '../_shared/rag/prompts.ts';
import { retrieve } from '../_shared/rag/engine.ts';
import { corsPreflightResponse, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { collectStream } from '../_shared/stream.ts';

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
    if (contentLength > 512 * 1024) return errorResponse(req, 'Request body too large', 413);

    const body = await req.json();
    const { caseData, docType = 'case_sheet', model } = body;

    const allowedDocTypes = ['case_sheet', 'prescription', 'referral', 'lab_order', 'discharge_summary', 'follow_up'];
    const safeDocType = allowedDocTypes.includes(docType) ? docType : 'case_sheet';

    if (!caseData || typeof caseData !== 'object') {
      return errorResponse(req, 'caseData is required', 400);
    }

    // Validate expected fields and sanitize
    const safeCaseData: Record<string, unknown> = {};
    const allowedFields = ['diagnosis', 'chiefComplaint', 'history', 'examinations', 'investigations', 'prakriti', 'vikriti', 'age', 'gender'];
    for (const field of allowedFields) {
      if (caseData[field] !== undefined && caseData[field] !== null) {
        const val = typeof caseData[field] === 'string'
          ? caseData[field].replace(/[\x00-\x1f\x7f]/g, '').slice(0, 2000)
          : caseData[field];
        safeCaseData[field] = val;
      }
    }

    const resolved = resolveModel(model);

    const queryParts = [
      safeCaseData.diagnosis, safeCaseData.chiefComplaint,
      ...(Array.isArray(safeCaseData.examinations) ? safeCaseData.examinations : []),
    ].filter(Boolean).join(' ');

    const retrieval = await retrieve(queryParts || 'general ayurvedic consultation', {
      surface: 'clinical-docs',
      doResearch: false,
    });

    let context = retrieval.chunks.map((c, i) => `[${i + 1}] (${c.source}/${c.title ?? 'N/A'}) ${c.content}`).join('\n\n');

    if (retrieval.clinicalPathwayContext) {
      context = `${retrieval.clinicalPathwayContext}\n\nRETRIEVED KNOWLEDGE:\n${context}`;
    }

    const prompt = buildClinicalDocsPrompt(context, safeCaseData, safeDocType);

    const maxTokens = retrieval.query.complexity === 'complex' ? 16000
      : retrieval.query.complexity === 'moderate' ? 12000
      : 8000;

    const { text: fullText, errors: llmErrors } = await collectStream(
      streamLLM(model, prompt.system, [{ role: 'user', content: prompt.user }], maxTokens)
    );

    if (llmErrors.length > 0) {
      console.error('LLM stream errors:', llmErrors);
    }

    // Log query metrics (best-effort, service-role)
    try {
      const svc = serviceRoleClient();
      await svc.rpc('log_query', {
        p_user_id: userId,
        p_surface: 'clinical-docs',
        p_query_text: (safeCaseData.diagnosis || 'general').slice(0, 2000),
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
    console.error('clinical-docs error:', e?.message);
    const status = e.message?.includes('not configured') ? 503 : 500;
    const msg = status === 503 ? 'AI service is not configured' : 'Internal server error';
    return errorResponse(req, msg, status);
  }
});
