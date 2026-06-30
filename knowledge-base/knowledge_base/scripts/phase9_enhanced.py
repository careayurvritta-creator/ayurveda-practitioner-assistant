"""
WHO ITA Knowledge Base - Phase 9 Enhanced: Integration & Deployment
====================================================================
Clean, production-ready implementation with:
- Proper Python FastAPI endpoints
- TypeScript React components with proper types
- Clean code organization
- Error handling
- Comprehensive documentation
"""

import json
import gzip
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
from collections import defaultdict

# Configuration
PHASE5_DIR = Path("knowledge_base/phase5_normalized")
PHASE7_DIR = Path("knowledge_base/phase7_knowledge_graph")
OUTPUT_DIR = Path("knowledge_base/phase9_integration")
API_DIR = OUTPUT_DIR / "api"
FRONTEND_DIR = OUTPUT_DIR / "frontend"
DOCS_DIR = OUTPUT_DIR / "docs"


class KnowledgeBaseLoader:
    """Load and index knowledge base for API use."""
    
    def __init__(self, kb_path: Path):
        self.kb_path = kb_path
        self.terms: Dict[str, dict] = {}
        self.search_index: Dict[str, List[str]] = defaultdict(list)
        self.chapters: Dict[str, dict] = {}
    
    def load(self) -> int:
        """Load and index knowledge base."""
        with open(self.kb_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for term in data.get('terms', []):
            term_id = term.get('term_id', '')
            if not term_id:
                continue
                
            self.terms[term_id] = term
            
            # Build search index
            for field in ['english', 'iast', 'devanagari']:
                value = term.get(field, '').lower()
                for word in value.split():
                    if len(word) >= 2:
                        self.search_index[word].append(term_id)
            
            # Track chapters
            chapter = term.get('category', {}).get('chapter', '')
            chapter_name = term.get('category', {}).get('chapter_name', '')
            if chapter and chapter not in self.chapters:
                self.chapters[chapter] = {'id': chapter, 'name': chapter_name, 'count': 0}
            if chapter:
                self.chapters[chapter]['count'] += 1
        
        return len(self.terms)
    
    def lookup(self, term_id: str) -> Optional[dict]:
        """Lookup term by ID."""
        return self.terms.get(term_id)
    
    def search(self, query: str, chapter: str = None, limit: int = 20) -> List[dict]:
        """Search terms."""
        query_lower = query.lower()
        matching_ids = set()
        
        # Search in index
        for word in query_lower.split():
            for indexed_word, term_ids in self.search_index.items():
                if word in indexed_word or indexed_word in word:
                    matching_ids.update(term_ids)
        
        # Collect and filter results
        results = []
        for term_id in matching_ids:
            term = self.terms.get(term_id)
            if not term:
                continue
            if chapter and term.get('category', {}).get('chapter') != chapter:
                continue
            results.append(term)
            if len(results) >= limit:
                break
        
        return results
    
    def autocomplete(self, prefix: str, limit: int = 10) -> List[dict]:
        """Get autocomplete suggestions."""
        prefix_lower = prefix.lower()
        results = []
        
        for term in self.terms.values():
            english = term.get('english', '').lower()
            iast = term.get('iast', '').lower()
            
            if english.startswith(prefix_lower) or iast.startswith(prefix_lower):
                results.append({
                    'term_id': term.get('term_id'),
                    'english': term.get('english'),
                    'iast': term.get('iast'),
                    'devanagari': term.get('devanagari')
                })
                if len(results) >= limit:
                    break
        
        return results


# =============================================================================
# 9.1 FASTAPI ENDPOINTS
# =============================================================================

FASTAPI_APP = '''"""
WHO ITA Knowledge Base API - FastAPI Implementation
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import json
from pathlib import Path

app = FastAPI(
    title="WHO ITA Knowledge Base API",
    description="REST API for WHO International Standard Terminologies on Ayurveda",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Term(BaseModel):
    term_id: str = Field(..., example="ITA-1.1.1")
    english: str = Field(..., example="Ayurveda")
    iast: str = Field(default="", example="āyurveda")
    devanagari: str = Field(default="", example="आयुर्वेद")
    chapter: str = Field(default="")
    chapter_name: str = Field(default="")
    domains: List[str] = Field(default=[])
    confidence: str = Field(default="")

class Chapter(BaseModel):
    id: str
    name: str
    term_count: int

class SearchResult(BaseModel):
    count: int
    results: List[Term]

class ValidationRequest(BaseModel):
    iast: str
    devanagari: str

class ValidationResult(BaseModel):
    valid: bool
    errors: List[str] = []

# Load knowledge base
KB_PATH = Path("knowledge_base/phase5_normalized/normalized_knowledge_base.json")
terms_index = {}
chapters_index = {}

@app.on_event("startup")
def load_knowledge_base():
    global terms_index, chapters_index
    with open(KB_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for term in data.get('terms', []):
        term_id = term.get('term_id', '')
        if term_id:
            terms_index[term_id] = term
            
            chapter = term.get('category', {}).get('chapter', '')
            if chapter:
                if chapter not in chapters_index:
                    chapters_index[chapter] = {
                        'id': chapter,
                        'name': term.get('category', {}).get('chapter_name', ''),
                        'term_count': 0
                    }
                chapters_index[chapter]['term_count'] += 1
    
    print(f"Loaded {len(terms_index)} terms")

@app.get("/api/v1/ita/lookup/{term_id}", response_model=Term)
def lookup_term(term_id: str):
    """Lookup a term by its WHO ITA code."""
    term = terms_index.get(term_id)
    if not term:
        raise HTTPException(status_code=404, detail=f"Term {term_id} not found")
    
    return Term(
        term_id=term.get('term_id', ''),
        english=term.get('english', ''),
        iast=term.get('iast', ''),
        devanagari=term.get('devanagari', ''),
        chapter=term.get('category', {}).get('chapter', ''),
        chapter_name=term.get('category', {}).get('chapter_name', ''),
        domains=term.get('domains', []),
        confidence=term.get('confidence', {}).get('level', '')
    )

@app.get("/api/v1/ita/search", response_model=SearchResult)
def search_terms(
    q: str = Query(..., min_length=2, description="Search query"),
    chapter: Optional[str] = Query(None, description="Filter by chapter"),
    limit: int = Query(20, ge=1, le=100, description="Max results")
):
    """Search terms by keyword."""
    query_lower = q.lower()
    results = []
    
    for term in terms_index.values():
        if len(results) >= limit:
            break
            
        # Check chapter filter
        if chapter and term.get('category', {}).get('chapter') != chapter:
            continue
        
        # Check match
        if (query_lower in term.get('english', '').lower() or
            query_lower in term.get('iast', '').lower() or
            query_lower in term.get('devanagari', '')):
            results.append(Term(
                term_id=term.get('term_id', ''),
                english=term.get('english', ''),
                iast=term.get('iast', ''),
                devanagari=term.get('devanagari', ''),
                chapter=term.get('category', {}).get('chapter', ''),
                chapter_name=term.get('category', {}).get('chapter_name', ''),
                domains=term.get('domains', []),
                confidence=term.get('confidence', {}).get('level', '')
            ))
    
    return SearchResult(count=len(results), results=results)

@app.get("/api/v1/ita/chapters", response_model=List[Chapter])
def list_chapters():
    """List all WHO ITA chapters."""
    return [Chapter(**ch) for ch in sorted(chapters_index.values(), key=lambda x: x['id'])]

@app.get("/api/v1/ita/autocomplete")
def autocomplete(
    prefix: str = Query(..., min_length=2, description="Search prefix")
):
    """Get autocomplete suggestions."""
    prefix_lower = prefix.lower()
    suggestions = []
    
    for term in terms_index.values():
        if len(suggestions) >= 10:
            break
        
        english = term.get('english', '').lower()
        iast = term.get('iast', '').lower()
        
        if english.startswith(prefix_lower) or iast.startswith(prefix_lower):
            suggestions.append({
                'term_id': term.get('term_id'),
                'english': term.get('english'),
                'iast': term.get('iast')
            })
    
    return suggestions

@app.post("/api/v1/ita/validate", response_model=ValidationResult)
def validate_term(request: ValidationRequest):
    """Validate IAST-Devanagari consistency."""
    errors = []
    
    if not request.iast:
        errors.append("IAST is required")
    if not request.devanagari:
        errors.append("Devanagari is required")
    
    # Basic length check (rough parity)
    if request.iast and request.devanagari:
        iast_len = len(request.iast.replace(' ', ''))
        deva_len = len(request.devanagari.replace(' ', ''))
        if abs(iast_len - deva_len) > iast_len * 0.5:
            errors.append("IAST and Devanagari lengths are significantly different")
    
    return ValidationResult(valid=len(errors) == 0, errors=errors)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''


# =============================================================================
# 9.2 REACT COMPONENTS (TYPESCRIPT)
# =============================================================================

REACT_HOOK = '''// hooks/useITATerms.ts
import { useState, useCallback, useEffect, useRef } from 'react';

export interface ITATerm {
  term_id: string;
  english: string;
  iast: string;
  devanagari: string;
  chapter: string;
  chapter_name: string;
  domains: string[];
  confidence: string;
}

export interface Chapter {
  id: string;
  name: string;
  term_count: number;
}

interface UseITATermsState {
  term: ITATerm | null;
  searchResults: ITATerm[];
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
}

interface UseITATermsActions {
  lookup: (termId: string) => Promise<ITATerm | null>;
  search: (query: string, chapter?: string) => Promise<ITATerm[]>;
  autocomplete: (prefix: string) => Promise<{ term_id: string; english: string; iast: string }[]>;
  loadChapters: () => Promise<Chapter[]>;
}

const API_BASE = '/api/v1/ita';

export function useITATerms(): UseITATermsState & UseITATermsActions {
  const [state, setState] = useState<UseITATermsState>({
    term: null,
    searchResults: [],
    chapters: [],
    loading: false,
    error: null,
  });

  const lookup = useCallback(async (termId: string): Promise<ITATerm | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE}/lookup/${encodeURIComponent(termId)}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Term ${termId} not found`);
        }
        throw new Error('Lookup failed');
      }
      const term = await response.json();
      setState(prev => ({ ...prev, term, loading: false }));
      return term;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lookup failed';
      setState(prev => ({ ...prev, error: message, loading: false, term: null }));
      return null;
    }
  }, []);

  const search = useCallback(async (query: string, chapter?: string): Promise<ITATerm[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const params = new URLSearchParams({ q: query });
      if (chapter) params.append('chapter', chapter);
      
      const response = await fetch(`${API_BASE}/search?${params}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setState(prev => ({ ...prev, searchResults: data.results, loading: false }));
      return data.results;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed';
      setState(prev => ({ ...prev, error: message, loading: false, searchResults: [] }));
      return [];
    }
  }, []);

  const autocomplete = useCallback(async (prefix: string) => {
    if (prefix.length < 2) return [];
    try {
      const response = await fetch(`${API_BASE}/autocomplete?prefix=${encodeURIComponent(prefix)}`);
      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }, []);

  const loadChapters = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/chapters`);
      if (!response.ok) throw new Error('Failed to load chapters');
      const chapters = await response.json();
      setState(prev => ({ ...prev, chapters }));
      return chapters;
    } catch {
      return [];
    }
  }, []);

  return { ...state, lookup, search, autocomplete, loadChapters };
}
'''

REACT_AUTOCOMPLETE = '''// components/ITAAutocomplete.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useITATerms, ITATerm } from '../hooks/useITATerms';
import './ITAAutocomplete.css';

interface ITAAutocompleteProps {
  onSelect: (term: ITATerm) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  term_id: string;
  english: string;
  iast: string;
}

export const ITAAutocomplete: React.FC<ITAAutocompleteProps> = ({
  onSelect,
  placeholder = 'Search ITA terms...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { autocomplete, lookup } = useITATerms();
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const results = await autocomplete(query);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, autocomplete]);

  const handleSelect = useCallback(async (suggestion: Suggestion) => {
    setQuery(suggestion.english);
    setIsOpen(false);
    
    // Lookup full term
    const fullTerm = await lookup(suggestion.term_id);
    if (fullTerm) {
      onSelect(fullTerm);
    }
  }, [lookup, onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={`ita-autocomplete ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className="ita-autocomplete__input"
        aria-label="Search ITA terms"
        aria-expanded={isOpen}
        aria-autocomplete="list"
      />
      
      {isOpen && suggestions.length > 0 && (
        <ul className="ita-autocomplete__dropdown" role="listbox">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.term_id}
              onClick={() => handleSelect(suggestion)}
              className={`ita-autocomplete__item ${index === selectedIndex ? 'ita-autocomplete__item--selected' : ''}`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <span className="ita-autocomplete__english">{suggestion.english}</span>
              <span className="ita-autocomplete__iast">{suggestion.iast}</span>
              <span className="ita-autocomplete__code">{suggestion.term_id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ITAAutocomplete;
'''

REACT_CSS = '''/* components/ITAAutocomplete.css */
.ita-autocomplete {
  position: relative;
  width: 100%;
}

.ita-autocomplete__input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #e1e5eb;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.ita-autocomplete__input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
}

.ita-autocomplete__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  background: #fff;
  border: 1px solid #e1e5eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.ita-autocomplete__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.ita-autocomplete__item:hover,
.ita-autocomplete__item--selected {
  background: #f0f7ff;
}

.ita-autocomplete__english {
  font-weight: 500;
  color: #2c3e50;
}

.ita-autocomplete__iast {
  font-style: italic;
  color: #e67e22;
  font-size: 14px;
}

.ita-autocomplete__code {
  font-size: 12px;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 2px 8px;
  border-radius: 4px;
}
'''


# =============================================================================
# 9.3 GEMINI SERVICE INTEGRATION
# =============================================================================

GEMINI_SERVICE = '''// services/geminiITAService.ts
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
    ).join('\\n');

    return `\\n\\nRELEVANT ITA TERMS:\\n${context}`;
  }

  /**
   * Validate ITA codes in AI response
   */
  validateResponse(response: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Extract ITA codes from response
    const codePattern = /ITA-\\d+\\.\\d+(\\.\\d+)?/g;
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
'''


# =============================================================================
# 9.5 OFFLINE BUNDLE
# =============================================================================

class OfflineBundleBuilder:
    """Build optimized offline bundle."""
    
    def build(self, terms: List[dict]) -> dict:
        """Create minimal bundle for offline use."""
        # Filter complete terms only
        complete_terms = [t for t in terms 
                        if t.get('term_id') and t.get('english')]
        
        # Minimize data
        bundle = {
            'version': '1.0.0',
            'generated': datetime.now().isoformat(),
            'terms': []
        }
        
        for term in complete_terms:
            bundle['terms'].append({
                'id': term.get('term_id', ''),
                'en': term.get('english', ''),
                'ia': term.get('iast', ''),
                'de': term.get('devanagari', ''),
                'ch': term.get('category', {}).get('chapter', ''),
            })
        
        return bundle
    
    def save(self, bundle: dict, path: Path) -> int:
        """Save bundle (both regular and compressed)."""
        # Regular JSON
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(bundle, f, ensure_ascii=False, separators=(',', ':'))
        
        # Compressed
        compressed_path = path.with_suffix('.json.gz')
        json_bytes = json.dumps(bundle, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        compressed = gzip.compress(json_bytes, compresslevel=9)
        
        with open(compressed_path, 'wb') as f:
            f.write(compressed)
        
        return len(compressed)


# =============================================================================
# MAIN ENGINE
# =============================================================================

class Phase9IntegrationEngine:
    """Phase 9 integration engine."""
    
    def __init__(self):
        self.terms: List[dict] = []
    
    def load_data(self) -> int:
        """Load knowledge base."""
        kb_path = PHASE5_DIR / "normalized_knowledge_base.json"
        with open(kb_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.terms = data.get('terms', [])
        return len(self.terms)
    
    def run(self):
        """Execute Phase 9."""
        print("=" * 70)
        print("Phase 9 Enhanced: Integration & Deployment")
        print("=" * 70)
        print(f"Started at: {datetime.now().isoformat()}")
        
        # Create directories
        for d in [OUTPUT_DIR, API_DIR, FRONTEND_DIR, DOCS_DIR]:
            d.mkdir(parents=True, exist_ok=True)
        
        # Load data
        print("\n[LOAD] Loading knowledge base...")
        term_count = self.load_data()
        print(f"  [OK] Loaded {term_count} terms")
        
        # 9.1 API
        print("\n[9.1] Generating FastAPI Application...")
        api_path = API_DIR / "main.py"
        with open(api_path, 'w', encoding='utf-8') as f:
            f.write(FASTAPI_APP)
        print(f"  [OK] FastAPI app: {api_path}")
        
        # 9.2 React Components
        print("\n[9.2] Generating React Components...")
        
        hook_path = FRONTEND_DIR / "useITATerms.ts"
        with open(hook_path, 'w', encoding='utf-8') as f:
            f.write(REACT_HOOK)
        print(f"  [OK] Hook: {hook_path}")
        
        component_path = FRONTEND_DIR / "ITAAutocomplete.tsx"
        with open(component_path, 'w', encoding='utf-8') as f:
            f.write(REACT_AUTOCOMPLETE)
        print(f"  [OK] Component: {component_path}")
        
        css_path = FRONTEND_DIR / "ITAAutocomplete.css"
        with open(css_path, 'w', encoding='utf-8') as f:
            f.write(REACT_CSS)
        print(f"  [OK] CSS: {css_path}")
        
        # 9.3 Gemini Service
        print("\n[9.3] Generating Gemini Integration...")
        gemini_path = FRONTEND_DIR / "geminiITAService.ts"
        with open(gemini_path, 'w', encoding='utf-8') as f:
            f.write(GEMINI_SERVICE)
        print(f"  [OK] Gemini service: {gemini_path}")
        
        # 9.5 Offline Bundle
        print("\n[9.5] Building Offline Bundle...")
        builder = OfflineBundleBuilder()
        bundle = builder.build(self.terms)
        bundle_path = OUTPUT_DIR / "ita_bundle.json"
        size = builder.save(bundle, bundle_path)
        print(f"  [OK] Bundle: {len(bundle['terms'])} terms, {size/1024:.1f} KB compressed")
        
        # Summary
        summary = {
            'generated_at': datetime.now().isoformat(),
            'phase': 9,
            'term_count': term_count,
            'artifacts': {
                'api': str(api_path),
                'hook': str(hook_path),
                'component': str(component_path),
                'css': str(css_path),
                'gemini': str(gemini_path),
                'bundle': str(bundle_path),
                'bundle_size_kb': round(size / 1024, 1)
            }
        }
        
        summary_path = OUTPUT_DIR / "phase9_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2)
        
        print()
        print("=" * 70)
        print("Phase 9 Enhanced Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 70)


def main():
    engine = Phase9IntegrationEngine()
    engine.run()


if __name__ == "__main__":
    main()
