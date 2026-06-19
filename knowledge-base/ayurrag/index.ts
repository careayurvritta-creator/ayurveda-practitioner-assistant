export * from './query-engine'

export interface AyurRagConfig {
  includeSafetyWarnings: boolean
  maxContextLength: number
  enableHybridSearch: boolean
  enableMultiQueryExpansion: boolean
  enableClinicalCaseSearch: boolean
  fallbackToWebSearch: boolean
}

export const DEFAULT_RAG_CONFIG: AyurRagConfig = {
  includeSafetyWarnings: true,
  maxContextLength: 8000,
  enableHybridSearch: true,
  enableMultiQueryExpansion: true,
  enableClinicalCaseSearch: true,
  fallbackToWebSearch: true,
}

export interface SearchResult {
  content: string
  source: string
  relevance: number
  category?: string
}

export function rankResults(results: SearchResult[]): SearchResult[] {
  return results.sort((a, b) => b.relevance - a.relevance)
}

export function truncateContext(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength - 100) + '... [truncated]'
}
