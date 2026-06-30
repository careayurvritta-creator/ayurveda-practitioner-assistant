// services/itaKnowledgeBase.ts

interface ITATerm {
  term_id: string;
  english: string;
  iast: string;
  devanagari: string;
  chapter: string;
  chapter_name: string;
  domains: string[];
  confidence: string;
}

export class ITAKnowledgeBase {
  private terms: Map<string, ITATerm> = new Map();
  private searchIndex: Map<string, string[]> = new Map();
  private loaded: boolean = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    
    try {
      const response = await fetch('/assets/ita_knowledge_base.json');
      const data = await response.json();
      
      for (const term of data.terms) {
        this.terms.set(term.term_id, term);
        
        // Build search index
        this.indexTerm(term);
      }
      
      this.loaded = true;
      console.log(`ITA KB loaded: ${this.terms.size} terms`);
    } catch (error) {
      console.error('Failed to load ITA KB:', error);
    }
  }

  private indexTerm(term: ITATerm): void {
    const keywords = [
      term.english.toLowerCase(),
      term.iast.toLowerCase(),
      term.devanagari
    ].flatMap(s => s.split(/\s+/)).filter(Boolean);

    for (const kw of keywords) {
      if (!this.searchIndex.has(kw)) {
        this.searchIndex.set(kw, []);
      }
      this.searchIndex.get(kw)!.push(term.term_id);
    }
  }

  lookup(termId: string): ITATerm | undefined {
    return this.terms.get(termId);
  }

  termExists(termId: string): boolean {
    return this.terms.has(termId);
  }

  getTermCount(): number {
    return this.terms.size;
  }

  search(query: string, limit: number = 20): ITATerm[] {
    const queryLower = query.toLowerCase();
    const matchingIds = new Set<string>();

    // Exact and prefix matching
    for (const [keyword, termIds] of this.searchIndex.entries()) {
      if (keyword.includes(queryLower)) {
        termIds.forEach(id => matchingIds.add(id));
      }
    }

    const results: ITATerm[] = [];
    for (const id of matchingIds) {
      const term = this.terms.get(id);
      if (term) results.push(term);
      if (results.length >= limit) break;
    }

    return results;
  }

  async searchRelevant(query: string, limit: number = 5): Promise<ITATerm[]> {
    await this.load();
    return this.search(query, limit);
  }
}

export const itaKnowledgeBase = new ITAKnowledgeBase();
