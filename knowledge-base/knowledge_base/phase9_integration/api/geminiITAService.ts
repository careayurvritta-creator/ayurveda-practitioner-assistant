// services/geminiService.ts - ITA Integration

import { ITAKnowledgeBase } from './itaKnowledgeBase';

// Add to existing geminiService.ts
export class GeminiITAService {
  private itaKB: ITAKnowledgeBase;
  
  constructor() {
    this.itaKB = new ITAKnowledgeBase();
  }

  /**
   * Enhanced system prompt with ITA knowledge
   */
  getEnhancedSystemPrompt(): string {
    return `You are an expert Ayurveda AI assistant integrated with the WHO ITA Knowledge Base.

**Knowledge Base:** ${this.itaKB.getTermCount()} WHO ITA terms across 10 chapters

**Guidelines:**
1. Always cite WHO ITA codes (format: ITA-X.X.X) when referencing Ayurvedic terms
2. Provide Sanskrit in IAST transliteration and Devanagari script
3. Apply Tridosha framework (Vata, Pitta, Kapha) in assessments
4. Recommend practitioner consultation for clinical decisions

**Response Format for Terms:**
Term Name (IAST / Devanagari) - WHO ITA: X.X.X

**Chapters:**
1. Background Terminology
2. Physiology & Constitution  
3. Anatomy
4. Pathology
5. Diseases
6. Materia Medica
7. Formulations
8. Dietetics
9. Therapeutics
10. Panchakarma`;
  }

  /**
   * RAG-enhanced prompt with relevant terms
   */
  async getRAGEnhancedPrompt(userQuery: string): Promise<string> {
    const relevantTerms = await this.itaKB.searchRelevant(userQuery, 5);
    
    if (relevantTerms.length === 0) {
      return this.getEnhancedSystemPrompt();
    }

    const contextTerms = relevantTerms.map(t => 
      `- ${t.english} (${t.iast}) - WHO ITA: ${t.term_id}`
    ).join('\n');

    return `${this.getEnhancedSystemPrompt()}

**Relevant ITA Terms for this query:**
${contextTerms}`;
  }

  /**
   * Validate term in AI response
   */
  validateResponseTerms(response: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for ITA code format
    const itaCodePattern = /ITA-\d+\.\d+(\.\d+)?/g;
    const mentionedCodes = response.match(itaCodePattern) || [];
    
    for (const code of mentionedCodes) {
      if (!this.itaKB.termExists(code)) {
        issues.push(`Unknown ITA code: ${code}`);
      }
    }

    return { valid: issues.length === 0, issues };
  }
}
