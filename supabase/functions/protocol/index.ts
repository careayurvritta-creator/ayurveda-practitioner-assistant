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
    const { prompt, model = 'minimaxai/minimax-m3', patientContext, includeResearch = false } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400, headers: CORS });
    }

    // --- Auth check: require doctor role ---
    const authHeader = req.headers.get('Authorization');
    const supabaseUser = authHeader ? await getUserFromToken(authHeader) : null;
    if (!supabaseUser) {
      return new Response(JSON.stringify({ error: 'Authentication required. Please log in.' }), { status: 401, headers: CORS });
    }

    // --- RAG: search knowledge base ---
    const { data: kbResults } = await db.rpc('search_knowledge', { query: prompt, source_table: 'all', match_count: 5 });
    const kbContext = (kbResults || []).map((c: any) => c.content).join('\n\n') || 'No relevant knowledge found.';

    // --- Optional: live research search ---
    let researchContext = '';
    if (includeResearch) {
      const { data: researchResults } = await db.rpc('search_research_articles', { query: prompt, match_count: 3 });
      researchContext = (researchResults || []).length
        ? 'LIVE RESEARCH:\\n' + (researchResults || []).map((r: any) => `${r.title}: ${r.abstract}`).join('\\n')
        : '';
   兼ts

    // --- Optional: learn from prior treatment plans ---
    const { data: priorPlans } = await db.rpc('search_treatment_plans', { query: prompt, match_count: 3 });
    const priorContext = (priorPlans || []).length
      ? 'PRIOR SIMILAR CASES (anonymized, with consent):\\n' + (priorPlans || []).map((p: any) => p.protocol_summary).join('\\n')
      : '';

    // --- Build protocol generation prompt ---
    const fullPrompt = buildProtocolPrompt(prompt, patientContext, kbContext, researchContext, priorContext);
    const reply = await callLlm(fullPrompt, model);

    return new Response(JSON.stringify({ reply, model, mode: model?.startsWith('minimaxai/') ? 'minimax' : 'gemini' }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const status = err.status ?? 500;
    return new Response(JSON.stringify({ error: err.message }), { status, headers: CORS });
  }
});

async function getUserFromToken(authHeader: string) {
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await db.auth.getUser(token);
    return user;
  } catch { return null; }
}

function buildProtocolPrompt(patientQuery: string, patientContext: string, kb: string, research: string, prior: string) {
  return `You are an expert Ayurvedic Vaidya with deep knowledge of classical texts (Charaka, Sushruta, Ashtanga Hridaya) and modern clinical practice. Generate a detailed, evidence-based treatment protocol.

PATIENT CONTEXT:
${patientContext || 'Not provided'}

KNOWLEDGE BASE CONTEXT:
${kb}
${research}
${prior}

PATIENT QUERY:
${patientQuery}

Generate a comprehensive treatment protocol including:
1. Diagnosis (Roga with sanskrit terminology)
2. Dosha involvement and Samprapti
3. Shodhana (purification) recommendations
4. Shamana (palliative) - herbs, diet, lifestyle
5. Ahara (dietary) recommendations - pathya/apathya
6. Vihar (lifestyle) modifications
7. Yoga/Pranayama recommendations
8. Prognosis and follow-up
9. Safety warnings and contraindications
10. When to refer to allopathic care

Format the protocol clearly with headings and bullet points.`;
}
