import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { authUid } from '../_shared/db.ts';
import { streamLLM, resolveModel } from '../_shared/rag/llm.ts';
import { buildClinicalDocsPrompt } from '../_shared/rag/prompts.ts';
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
    const { caseData, docType = 'case_sheet', model } = body;

    if (!caseData || typeof caseData !== 'object') {
      return new Response(JSON.stringify({ error: 'caseData is required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const resolved = resolveModel(model);

    const queryParts = [
      caseData.diagnosis, caseData.chiefComplaint,
      ...(caseData.examinations ?? []),
    ].filter(Boolean).join(' ');

    const retrieval = await retrieve(queryParts || 'general ayurvedic consultation', {
      surface: 'clinical-docs',
      doResearch: false,
      matchCount: 20,
      tokenBudget: 12000,
    });

    const context = retrieval.chunks.map((c, i) => `[${i + 1}] (${c.source}/${c.title ?? 'N/A'}) ${c.content}`).join('\n\n');

    const prompt = buildClinicalDocsPrompt(context, caseData, docType);

    const fullText = await collectStream(
      streamLLM(model, prompt.system, [{ role: 'user', content: prompt.user }], 12000)
    );

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