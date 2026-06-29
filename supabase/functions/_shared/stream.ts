/**
 * Shared stream collection utility for LLM responses.
 * Collects all chunks from an async generator and returns the full text and any errors.
 */
export async function collectStream(gen: AsyncGenerator<{ type: string; content?: string; error?: string }>): Promise<{ text: string; errors: string[] }> {
  const chunks: string[] = [];
  const errors: string[] = [];

  for await (const chunk of gen) {
    if (chunk.type === 'content' && chunk.content) {
      chunks.push(chunk.content);
    } else if (chunk.type === 'error' && chunk.error) {
      errors.push(chunk.error);
    }
  }

  return { text: chunks.join(''), errors };
}
