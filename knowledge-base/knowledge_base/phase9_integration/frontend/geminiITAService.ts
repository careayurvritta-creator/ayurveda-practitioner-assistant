// services/geminiITAService.ts
import { ITAKnowledgeBase, ITATerm } from './itaKnowledgeBase';

export class GeminiITAService {
  private kb: ITAKnowledgeBase;
  private initialized = false;

  constructor() {
    this.kb = new ITAKnowledgeBase();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.kb.load();
    this.initialized = true;
  }

  /**
   * Get enhanced system prompt with ITA knowledge
   */
  getSystemPrompt(): string {
    const termCount = this.kb.getTermCount();
    
    return `You are an expert Ayurveda AI assistant integrated with the WHO ITA Knowledge Base.

KNOWLEDGE BASE:
- Total terms: ${termCount}
- Source: WHO International Standard Terminologies on Ayurveda
- Chapters: 10 (Background, Physiology, Anatomy, Pathology, Diseases, Materia Medica, Formulations, Dietetics, Therapeutics, Panchakarma)

GUIDELINES:
1. Always cite WHO ITA codes when referencing Ayurvedic terms (format: ITA-X.X.X)
2. Provide Sanskrit in both IAST transliteration and Devanagari script
3. Apply Tridosha framework (Vata, Pitta, Kapha) in assessments
4. Recommend practitioner consultation for clinical decisions

RESPONSE FORMAT FOR TERMS:
**Term Name** (IAST / Devanagari) - WHO ITA: X.X.X

CLINICAL DISCLAIMER:
Always remind users that this is for educational purposes and recommend consulting qualified Ayurvedic practitioners.`;
  }

  /**
   * Get RAG-enhanced context for a query
   */
  async getRelevantContext(query: string, limit = 5): Promise<string> {
    await this.initialize();
    
    const terms = this.kb.search(query, limit);
    
    if (terms.length === 0) {
      return '';
    }

    const context = terms.map(t => 
      `- ${t.english} (${t.iast} / ${t.devanagari}) - WHO ITA: ${t.term_id}`
    ).join('\n');

    return `\n\nRELEVANT ITA TERMS:\n${context}`;
  }

  /**
   * Validate ITA codes in AI response
   */
  validateResponse(response: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Extract ITA codes from response
    const codePattern = /ITA-\d+\.\d+(\.\d+)?/g;
    const codes = response.match(codePattern) || [];
    
    for (const code of codes) {
      if (!this.kb.exists(code)) {
        issues.push(`Unknown ITA code: ${code}`);
      }
    }

    return { valid: issues.length === 0, issues };
  }
}

export const geminiITAService = new GeminiITAService();
