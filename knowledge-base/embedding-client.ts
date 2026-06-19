import OpenAI from 'openai'

export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'

export function getNvidiaApiKey(): string {
  return process.env.NVIDIA_API_KEY || "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";
}

const EMBEDDING_MODEL = 'nvidia/nv-embedqa-e5-v5'
const EMBEDDING_DIM = 1024

let client: OpenAI | null = null

function getEmbeddingClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: NVIDIA_BASE_URL,
      apiKey: getNvidiaApiKey(),
    })
  }
  return client
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getEmbeddingClient()

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: [text],
        encoding_format: 'float',
        // @ts-expect-error -- NVIDIA NIM requires input_type for asymmetric models
        input_type: 'query',
      })
      return response.data[0].embedding as number[]
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string }
      if (attempt === 2) throw error
      const delay = err?.status === 429 ? 1000 * (attempt + 1) : 500
      console.warn(`[Embedding] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, err?.message)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw new Error('Embedding generation failed after 3 attempts')
}

/** Alias for generateEmbedding -- kept for backward compatibility */
export const generateSearchEmbedding = generateEmbedding

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getEmbeddingClient()

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
        encoding_format: 'float',
        // @ts-expect-error -- NVIDIA NIM requires input_type for asymmetric models
        input_type: 'passage',
      })
      return response.data.map(d => d.embedding as number[])
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string }
      if (attempt === 2) throw error
      const delay = err?.status === 429 ? 1000 * (attempt + 1) * 2 : 1000
      console.warn(`[Embedding] Batch attempt ${attempt + 1} failed, retrying in ${delay}ms:`, err?.message)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw new Error('Batch embedding generation failed after 3 attempts')
}

export { EMBEDDING_MODEL, EMBEDDING_DIM }
