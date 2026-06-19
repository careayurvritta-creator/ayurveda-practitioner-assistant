/**
 * Shared LLM streaming utilities — auto-continuation and stream helpers.
 */

import OpenAI from 'openai'

export async function createChatStream(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  model: string,
  options?: { max_tokens?: number; temperature?: number; top_p?: number }
) {
  const apiKey = process.env.NVIDIA_API_KEY || "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";
  const openai = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: apiKey,
  });
  return await openai.chat.completions.create({
    model,
    messages,
    stream: true,
    temperature: options?.temperature ?? 0.25,
    max_tokens: options?.max_tokens ?? 4096,
    top_p: options?.top_p,
  });
}

// Shared model constant
export const DEFAULT_MODEL = 'mistralai/mistral-large-3-675b-instruct-2512'

// Default auto-continuation limits
export const MAX_CHAT_CONTINUATIONS = 3
export const MAX_PROTOCOL_CONTINUATIONS = 4

// Shared Sanskrit/Ayurvedic terms for intent detection and context extraction
export const AYURVEDIC_TERMS = [
  'vata', 'pitta', 'kapha', 'dosha', 'dhatu', 'mala', 'srotas',
  'agni', 'ama', 'ojas', 'prakriti', 'vikriti', 'samprapti',
  'chikitsa', 'shodhana', 'shamana', 'basti', 'vamana', 'virechana',
  'nasya', 'raktamokshana', 'purvakarma', 'paschatkarma',
  'rasa', 'guna', 'virya', 'vipaka', 'prabhava',
  'pathya', 'apathya', 'dinacharya', 'ritucharya',
  'sandhivata', 'amavata', 'prameha', 'kushtha', 'swasa',
  'grahani', 'rajodushti', 'shirahshoola', 'katishoola',
] as const

// Shared disease-to-Sanskrit concept map
export const DISEASE_CONCEPT_MAP: Record<string, string[]> = {
  'arthritis': ['sandhivata', 'amavata', 'joint pain', 'swelling', 'stiffness'],
  'diabetes': ['prameha', 'madhumeha', 'blood sugar', 'insulin', 'metabolic'],
  'hypertension': ['raktachapa', 'uchcha raktachapa', 'blood pressure', 'cardiovascular'],
  'asthma': ['swasa', 'tamaka swasa', 'breathing', 'respiratory', 'bronchial'],
  'skin disease': ['kushtha', 'twak roga', 'dermatitis', 'eczema', 'psoriasis'],
  'digestive': ['grahani', 'agnimandya', 'ajirna', 'digestion', 'gut'],
  'anxiety': ['chittodvega', 'vata vyadhi', 'mental health', 'stress'],
  'insomnia': ['anidra', 'nidranasha', 'sleep', 'sleep disorder'],
  'obesity': ['sthaulya', 'medoroga', 'weight', 'overweight'],
  'headache': ['shirahshoola', 'ardhavabhedaka', 'migraine', 'head pain'],
  'constipation': ['vibandha', 'malabaddhata', 'bowel', 'stool'],
  'fever': ['jwara', 'sannipata jwara', 'temperature', 'infection'],
  'cough': ['kasa', 'vataja kasa', 'respiratory'],
  'cold': ['pratishyaya', 'shirahkapha', 'nasal', 'congestion'],
  'acidity': ['amlapitta', 'parinama shoola', 'gastric', 'acid reflux'],
  'gastric': ['ajirna', 'agnimandya', 'digestion', 'stomach'],
  'joint pain': ['sandhishoola', 'sandhigata vata', 'arthritis'],
  'back pain': ['katishoola', 'pristha shoola', 'gridhrasi', 'sciatica'],
  'eye disease': ['netra roga', 'drishti dosha', 'vision'],
  'heart': ['hridroga', 'hrudaya', 'cardiac', 'cardiovascular'],
  'kidney': ['mutravaha srotas', 'mutra roga', 'renal'],
  'liver': ['yakrit', 'pleeha', 'hepatic'],
  'thyroid': ['galaganda', 'meda dhatu', 'endocrine'],
  'pcos': ['artava kshaya', 'rajodushti', 'hormonal', 'ovarian'],
  'menstrual': ['rajodushti', 'artava vyadhi', 'periods', 'menstruation'],
} as const

// Shared intent type
export type IntentType =
  | 'diagnosis' | 'treatment' | 'herb' | 'drug_interaction'
  | 'prakriti' | 'integration' | 'general' | 'procedure'
  | 'diet' | 'research' | 'surgery' | 'explanation'
  | 'terminology' | 'modern_medicine'

// Intent focus instructions for dynamic system prompts
export const INTENT_FOCUS_INSTRUCTIONS: Partial<Record<IntentType, string>> = {
  diagnosis: `
FOCUS: This is a diagnostic query. Provide:
- Differential diagnosis with dosha involvement
- Samprapti (pathogenesis) if available
- Key clinical features to look for
- Recommended investigations (both Ayurvedic and modern)
- Prognosis based on classical texts
`,
  treatment: `
FOCUS: This is a treatment query. Provide:
- Treatment principles (Chikitsa Sutra)
- Specific Panchakarma procedures if applicable
- Internal medications with dosage and anupana
- External therapies
- Duration and frequency
- Expected outcomes
- Precautions and contraindications
`,
  herb: `
FOCUS: This is a herb query. Provide:
- Rasa, Guna, Virya, Vipaka properties
- Dosha Karma (effect on each dosha)
- Classical formulations containing this herb
- Dosage and anupana (vehicle)
- Contraindications and drug interactions
- Modern research evidence if available
`,
  drug_interaction: `
FOCUS: This involves drug interactions. CRITICAL:
- Check all herb-drug interactions
- Specify severity (high/medium/low)
- Provide mechanism of interaction
- Suggest safe alternatives if contraindicated
- Recommend monitoring parameters
- ALWAYS include safety warnings
`,
  prakriti: `
FOCUS: This is a constitution/prakriti query. Provide:
- Detailed prakriti characteristics
- Physical, mental, and behavioral traits
- Dietary recommendations (pathya/apathya)
- Lifestyle guidelines (dinacharya/ritucharya)
- Exercise and yoga recommendations
- Seasonal adjustments
`,
  diet: `
FOCUS: This is a dietary query. Provide:
- Pathya (recommended foods) with rationale
- Apathya (foods to avoid) with reasoning
- Seasonal dietary adjustments (Ritucharya)
- Meal timing and preparation methods
- Specific recipes if helpful
- Foods that balance the relevant dosha
`,
  procedure: `
FOCUS: This is a procedure/therapy query. Provide:
- Detailed step-by-step procedure
- Pre-procedure preparation (Poorvakarma)
- Main procedure (Pradhana Karma)
- Post-procedure care (Paschat Karma)
- Duration and frequency
- Indications and contraindications
- Expected outcomes
`,
  research: `
FOCUS: This is a research/evidence query. Provide:
- Summary of relevant studies
- Evidence quality assessment
- Clinical trial results if available
- Limitations of current evidence
- Areas needing more research
- Practical clinical implications
`,
}

// ─── Stream Result Type ──────────────────────────────────────────────────────

export interface StreamResult {
  content: string
  finishReason: string | null
}

// ─── Stream a Single LLM Call ────────────────────────────────────────────────

export async function streamLLMResponse(
  messages: Array<{ role: string; content: string }>,
  model: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  existingContent: string = '',
  options?: { max_tokens?: number; temperature?: number; top_p?: number }
): Promise<StreamResult> {
  let stream: AsyncIterable<any>
  try {
    stream = await createChatStream(messages as any, model, options)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[LLM] Failed to create stream:', msg)
    throw err
  }

  let content = existingContent
  let finishReason: string | null = null

  let chunkCount = 0
  for await (const chunk of stream) {
    try {
      chunkCount++
      const data = JSON.stringify(chunk)

      // Check for error in stream chunk
      const chunkAny = chunk as any
      if (chunkAny?.error) {
        console.error('[LLM] Stream error in chunk:', JSON.stringify(chunkAny.error))
        // Send error event to client
        const errorEvent = JSON.stringify({
          type: 'error',
          message: chunkAny.error.message || chunkAny.error || 'Unknown stream error',
        })
        controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`))
        break
      }

      const delta = chunk.choices?.[0]?.delta as Record<string, string> | undefined
      const chunkContent = delta?.content || delta?.reasoning_content || ''
      if (chunkContent) content += chunkContent

      const choice = chunk.choices?.[0] as unknown as Record<string, unknown> | undefined
      if (choice?.finish_reason) {
        finishReason = choice.finish_reason as string
      }
      controller.enqueue(encoder.encode(`data: ${data}\n\n`))
    } catch (chunkError) {
      console.error('[LLM] Chunk processing error:', chunkError)
    }
  }
  if (chunkCount === 0) {
    console.warn('[LLM] Stream returned 0 chunks — possible API key or model issue')
  }

  return { content, finishReason }
}

// ─── Stream with Auto-Continuation ───────────────────────────────────────────

export async function streamWithAutoContinuation(
  initialMessages: Array<{ role: string; content: string }>,
  model: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  maxContinuations: number,
  continuationPrompt: string = 'Continue from where you left off. Do not repeat what you already wrote. Continue seamlessly.',
  options?: { max_tokens?: number; temperature?: number; top_p?: number }
): Promise<{ content: string; continuationCount: number }> {
  let result = await streamLLMResponse(initialMessages, model, controller, encoder, '', options)
  let assistantContent = result.content
  let continuationCount = 0

  while (
    result.finishReason === 'length' &&
    continuationCount < maxContinuations
  ) {
    continuationCount++
    console.log(`[LLM] Auto-continuing (${continuationCount}/${maxContinuations}), length: ${assistantContent.length}`)

    // Send continuation marker
    const continueEvent = JSON.stringify({
      type: 'continuation',
      attempt: continuationCount,
      totalLength: assistantContent.length,
    })
    controller.enqueue(encoder.encode(`data: ${continueEvent}\n\n`))

    // Build continuation messages — send only last portion to avoid token overflow
    const tailContent = assistantContent.length > 4000
      ? assistantContent.slice(-4000)
      : assistantContent

    const continueMessages = [
      ...initialMessages,
      { role: 'assistant' as const, content: tailContent },
      { role: 'user' as const, content: continuationPrompt },
    ]

    result = await streamLLMResponse(continueMessages, model, controller, encoder, assistantContent, options)
    assistantContent = result.content
  }

  return { content: assistantContent, continuationCount }
}
