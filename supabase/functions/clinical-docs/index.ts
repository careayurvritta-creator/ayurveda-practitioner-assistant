import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authUid } from '../_shared/db.ts';
import { streamLLM, resolveModel } from '../_shared/rag/llm.ts';
import { buildClinicalDocsPrompt } from '../_shared/rag/prompts.ts';
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
    const { caseData, docType = 'case_sheet', model } = body;

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
      matchCount: 20,
      tokenBudget: 12000,
    });

    const context = retrieval.chunks.map((c, i) => `[${i + 1}] (${c.source}/${c.title ?? 'N/A'}) ${c.content}`).join('\n\n');

    const prompt = buildClinicalDocsPrompt(context, safeCaseData, docType);

    const fullText = await collectStream(
      streamLLM(model, prompt.system, [{ role: 'user', content: prompt.user }], 12000)
    );

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
