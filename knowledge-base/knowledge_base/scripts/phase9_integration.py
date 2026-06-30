"""
WHO ITA Knowledge Base - Phase 9: Integration & Deployment
===========================================================
This script implements all 10 sub-phases of Phase 9 to integrate
the knowledge base into the Ayurvritta AIMRS application.

Sub-phases:
9.1  API Endpoint Design
9.2  Frontend Integration Components
9.3  Gemini Service Integration
9.4  Document Template Enhancement
9.5  Offline Knowledge Base Bundle
9.6  Performance Optimization
9.7  Error Handling
9.8  A/B Testing Setup
9.9  Documentation Generation
9.10 Deployment Artifacts
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
PHASE8_DIR = Path("knowledge_base/phase8_ai_training")
OUTPUT_DIR = Path("knowledge_base/phase9_integration")
API_DIR = OUTPUT_DIR / "api"
DOCS_DIR = OUTPUT_DIR / "docs"

# ============================================================================
# 9.1 API ENDPOINT DESIGN
# ============================================================================

OPENAPI_SPEC = {
    "openapi": "3.0.3",
    "info": {
        "title": "WHO ITA Knowledge Base API",
        "description": "REST API for accessing WHO International Standard Terminologies on Ayurveda",
        "version": "1.0.0",
        "contact": {
            "name": "Ayurvritta AIMRS",
            "email": "support@ayurvritta.com"
        }
    },
    "servers": [
        {"url": "/api/v1/ita", "description": "Production server"}
    ],
    "paths": {
        "/lookup/{termId}": {
            "get": {
                "summary": "Lookup term by ID",
                "description": "Retrieve a single term by its WHO ITA code",
                "operationId": "lookupTerm",
                "parameters": [
                    {
                        "name": "termId",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                        "example": "ITA-1.1.1"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Term found",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/Term"}
                            }
                        }
                    },
                    "404": {"description": "Term not found"}
                }
            }
        },
        "/search": {
            "get": {
                "summary": "Search terms",
                "description": "Search terms by keyword in English, IAST, or Devanagari",
                "operationId": "searchTerms",
                "parameters": [
                    {
                        "name": "q",
                        "in": "query",
                        "required": True,
                        "schema": {"type": "string"},
                        "description": "Search query"
                    },
                    {
                        "name": "chapter",
                        "in": "query",
                        "schema": {"type": "string"},
                        "description": "Filter by chapter (1-10)"
                    },
                    {
                        "name": "limit",
                        "in": "query",
                        "schema": {"type": "integer", "default": 20},
                        "description": "Maximum results"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Search results",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "count": {"type": "integer"},
                                        "results": {
                                            "type": "array",
                                            "items": {"$ref": "#/components/schemas/Term"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/validate": {
            "post": {
                "summary": "Validate Sanskrit term",
                "description": "Validate IAST-Devanagari consistency",
                "operationId": "validateTerm",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "iast": {"type": "string"},
                                    "devanagari": {"type": "string"}
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Validation result",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "valid": {"type": "boolean"},
                                        "errors": {"type": "array", "items": {"type": "string"}}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/chapters": {
            "get": {
                "summary": "List chapters",
                "description": "Get all WHO ITA chapters",
                "operationId": "listChapters",
                "responses": {
                    "200": {
                        "description": "Chapter list",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": {"$ref": "#/components/schemas/Chapter"}
                                }
                            }
                        }
                    }
                }
            }
        },
        "/autocomplete": {
            "get": {
                "summary": "Autocomplete suggestions",
                "description": "Get term suggestions for autocomplete",
                "operationId": "autocomplete",
                "parameters": [
                    {
                        "name": "prefix",
                        "in": "query",
                        "required": True,
                        "schema": {"type": "string", "minLength": 2}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Suggestions",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "term_id": {"type": "string"},
                                            "english": {"type": "string"},
                                            "iast": {"type": "string"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "components": {
        "schemas": {
            "Term": {
                "type": "object",
                "properties": {
                    "term_id": {"type": "string", "example": "ITA-1.1.1"},
                    "english": {"type": "string", "example": "Ayurveda"},
                    "iast": {"type": "string", "example": "ayurveda"},
                    "devanagari": {"type": "string", "example": "आयुर्वेद"},
                    "chapter": {"type": "string"},
                    "chapter_name": {"type": "string"},
                    "domains": {"type": "array", "items": {"type": "string"}},
                    "confidence": {"type": "string", "enum": ["high", "medium", "low"]}
                }
            },
            "Chapter": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "term_count": {"type": "integer"}
                }
            }
        }
    }
}


# ============================================================================
# 9.2 FRONTEND INTEGRATION COMPONENTS
# ============================================================================

ITA_LOOKUP_HOOK = '''// hooks/useITALookup.ts
import { useState, useCallback } from 'react';

interface ITATerm {
  term_id: string;
  english: string;
  iast: string;
  devanagari: string;
  chapter: string;
  chapter_name: string;
  domains: string[];
}

interface UseITALookupResult {
  term: ITATerm | null;
  loading: boolean;
  error: string | null;
  lookup: (termId: string) => Promise<void>;
  search: (query: string) => Promise<ITATerm[]>;
}

export function useITALookup(): UseITALookupResult {
  const [term, setTerm] = useState<ITATerm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (termId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/ita/lookup/${termId}`);
      if (!response.ok) throw new Error('Term not found');
      const data = await response.json();
      setTerm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
      setTerm(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (query: string): Promise<ITATerm[]> => {
    const response = await fetch(`/api/v1/ita/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  }, []);

  return { term, loading, error, lookup, search };
}
'''

ITA_AUTOCOMPLETE_COMPONENT = '''// components/ITAAutocomplete.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useITALookup } from '../hooks/useITALookup';

interface ITAAutocompleteProps {
  onSelect: (termId: string, term: any) => void;
  placeholder?: string;
}

export function ITAAutocomplete({ onSelect, placeholder = 'Search ITA terms...' }: ITAAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { search } = useITALookup();
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(async () => {
      const results = await search(query);
      setSuggestions(results.slice(0, 10));
      setIsOpen(true);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const handleSelect = (term: any) => {
    onSelect(term.term_id, term);
    setQuery(term.english);
    setIsOpen(false);
  };

  return (
    <div className="ita-autocomplete">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="ita-autocomplete-input"
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="ita-autocomplete-dropdown">
          {suggestions.map((term) => (
            <li
              key={term.term_id}
              onClick={() => handleSelect(term)}
              className="ita-autocomplete-item"
            >
              <span className="ita-english">{term.english}</span>
              <span className="ita-sanskrit">{term.iast}</span>
              <span className="ita-code">{term.term_id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
'''

ITA_TOOLTIP_COMPONENT = '''// components/ITATooltip.tsx
import React, { useState } from 'react';
import { useITALookup } from '../hooks/useITALookup';

interface ITATooltipProps {
  termId: string;
  children: React.ReactNode;
}

export function ITATooltip({ termId, children }: ITATooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { term, loading, lookup } = useITALookup();

  const handleMouseEnter = () => {
    setIsVisible(true);
    lookup(termId);
  };

  return (
    <span 
      className="ita-tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="ita-tooltip">
          {loading ? (
            <span>Loading...</span>
          ) : term ? (
            <div className="ita-tooltip-content">
              <div className="ita-tooltip-header">
                <strong>{term.english}</strong>
                <span className="ita-code">{term.term_id}</span>
              </div>
              <div className="ita-tooltip-sanskrit">
                {term.iast} / {term.devanagari}
              </div>
              <div className="ita-tooltip-chapter">
                Chapter {term.chapter}: {term.chapter_name}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </span>
  );
}
'''


# ============================================================================
# 9.3 GEMINI SERVICE INTEGRATION
# ============================================================================

GEMINI_SERVICE_UPDATE = '''// services/geminiService.ts - ITA Integration

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
    ).join('\\n');

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
    const itaCodePattern = /ITA-\\d+\\.\\d+(\\.\\d+)?/g;
    const mentionedCodes = response.match(itaCodePattern) || [];
    
    for (const code of mentionedCodes) {
      if (!this.itaKB.termExists(code)) {
        issues.push(`Unknown ITA code: ${code}`);
      }
    }

    return { valid: issues.length === 0, issues };
  }
}
'''

ITA_KNOWLEDGE_BASE_SERVICE = '''// services/itaKnowledgeBase.ts

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
    ].flatMap(s => s.split(/\\s+/)).filter(Boolean);

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
'''


# ============================================================================
# 9.4 DOCUMENT TEMPLATE ENHANCEMENT
# ============================================================================

OPD_TEMPLATE_WITH_ITA = '''<!-- OPD Consultation Template with WHO ITA Integration -->
<div class="opd-consultation">
  <h2>OPD Consultation Report</h2>
  
  <section class="patient-info">
    <h3>Patient Information</h3>
    <!-- Patient details -->
  </section>

  <section class="prakriti-assessment">
    <h3>Prakriti (Constitution) - <span class="ita-ref">WHO ITA: 2.1</span></h3>
    <div class="dosha-distribution">
      <span class="dosha vata">Vata <span class="ita-code">ITA-2.1.1</span></span>
      <span class="dosha pitta">Pitta <span class="ita-code">ITA-2.1.2</span></span>
      <span class="dosha kapha">Kapha <span class="ita-code">ITA-2.1.3</span></span>
    </div>
  </section>

  <section class="diagnosis">
    <h3>Diagnosis (Vyadhi Nidana)</h3>
    <div class="diagnosis-entry">
      <span class="condition-name"><!-- Condition --></span>
      <span class="sanskrit-name"><!-- Sanskrit (IAST / Devanagari) --></span>
      <span class="ita-code">WHO ITA: <!-- ITA-X.X.X --></span>
    </div>
  </section>

  <section class="treatment">
    <h3>Treatment Plan (Chikitsa Sutra)</h3>
    <div class="treatment-modality">
      <h4>Shodhana <span class="ita-code">ITA-9.1</span></h4>
      <!-- Purification therapies -->
    </div>
    <div class="treatment-modality">
      <h4>Shamana <span class="ita-code">ITA-9.2</span></h4>
      <!-- Palliative therapies -->
    </div>
  </section>

  <section class="prescription">
    <h3>Prescription (Aushadha Yoga)</h3>
    <table class="medicine-table">
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Sanskrit</th>
          <th>ITA Code</th>
          <th>Dosage</th>
          <th>Anupana</th>
        </tr>
      </thead>
      <tbody>
        <!-- Medicine rows -->
      </tbody>
    </table>
  </section>

  <section class="pathya">
    <h3>Pathya-Apathya (Diet & Lifestyle)</h3>
    <div class="pathya-section">
      <h4>Pathya (Beneficial) <span class="ita-code">ITA-8</span></h4>
      <!-- Beneficial items -->
    </div>
    <div class="apathya-section">
      <h4>Apathya (Contraindicated)</h4>
      <!-- Contraindicated items -->
    </div>
  </section>

  <footer class="report-footer">
    <p>This consultation follows WHO International Standard Terminologies on Ayurveda (ITA)</p>
    <p>Generated: {{date}} | Practitioner: {{practitioner}}</p>
  </footer>
</div>
'''


# ============================================================================
# 9.5 OFFLINE KNOWLEDGE BASE BUNDLE
# ============================================================================

class OfflineKnowledgeBaseBuilder:
    """Create compressed offline bundle."""
    
    def build(self, terms: List[dict]) -> Dict:
        """Build optimized offline bundle."""
        # Minimize term data for offline use
        minimal_terms = []
        for term in terms:
            if not term.get('english'):
                continue
            minimal_terms.append({
                'id': term.get('term_id', ''),
                'en': term.get('english', ''),
                'ia': term.get('iast', ''),
                'de': term.get('devanagari', ''),
                'ch': term.get('category', {}).get('chapter', ''),
                'cn': term.get('category', {}).get('chapter_name', '')[:20],
                'do': term.get('domains', [])[:2]
            })
        
        bundle = {
            'v': '1.0',
            't': minimal_terms,
            'meta': {
                'count': len(minimal_terms),
                'generated': datetime.now().isoformat()
            }
        }
        
        return bundle
    
    def save_compressed(self, bundle: Dict, output_path: Path) -> int:
        """Save as compressed JSON."""
        json_str = json.dumps(bundle, ensure_ascii=False, separators=(',', ':'))
        compressed = gzip.compress(json_str.encode('utf-8'))
        
        with open(output_path, 'wb') as f:
            f.write(compressed)
        
        return len(compressed)


# ============================================================================
# 9.6 PERFORMANCE OPTIMIZATION
# ============================================================================

PERFORMANCE_CONFIG = {
    'caching': {
        'enabled': True,
        'ttl_seconds': 3600,
        'max_entries': 1000
    },
    'lazy_loading': {
        'enabled': True,
        'chunk_size': 500,
        'preload_chapters': ['1', '5', '9']
    },
    'search': {
        'debounce_ms': 300,
        'min_query_length': 2,
        'max_results': 50
    },
    'indexing': {
        'build_on_load': True,
        'index_fields': ['english', 'iast', 'devanagari']
    }
}


# ============================================================================
# 9.7 ERROR HANDLING
# ============================================================================

ERROR_HANDLING_CODE = '''// utils/itaErrorHandler.ts

export class ITAError extends Error {
  constructor(
    message: string,
    public code: string,
    public termId?: string
  ) {
    super(message);
    this.name = 'ITAError';
  }
}

export class ITAErrorHandler {
  private errors: Array<{ timestamp: Date; error: ITAError }> = [];

  handle(error: ITAError): void {
    this.errors.push({ timestamp: new Date(), error });
    console.error(`[ITA Error] ${error.code}: ${error.message}`);
    
    // Log to analytics
    this.logToAnalytics(error);
  }

  private logToAnalytics(error: ITAError): void {
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('ITA_Error', {
        code: error.code,
        message: error.message,
        termId: error.termId
      });
    }
  }

  handleTermNotFound(termId: string): { suggestions: string[]; message: string } {
    const error = new ITAError(
      `Term not found: ${termId}`,
      'TERM_NOT_FOUND',
      termId
    );
    this.handle(error);

    return {
      suggestions: this.findSimilarTerms(termId),
      message: `The term "${termId}" was not found in the WHO ITA database.`
    };
  }

  private findSimilarTerms(termId: string): string[] {
    // Extract chapter from term ID
    const match = termId.match(/ITA-(\\d+)/);
    if (!match) return [];
    
    // Return placeholder - actual implementation would search
    return [`ITA-${match[1]}.1.1`, `ITA-${match[1]}.1.2`];
  }

  getRecentErrors(limit: number = 10): Array<{ timestamp: Date; error: ITAError }> {
    return this.errors.slice(-limit);
  }
}

export const itaErrorHandler = new ITAErrorHandler();
'''


# ============================================================================
# 9.9 DOCUMENTATION
# ============================================================================

API_DOCUMENTATION = '''# WHO ITA Knowledge Base API Documentation

## Overview

The WHO ITA Knowledge Base API provides programmatic access to the International 
Standard Terminologies on Ayurveda as defined by the World Health Organization.

## Base URL

```
/api/v1/ita
```

## Authentication

Currently, the API is open for authenticated Ayurvritta users. Include the 
session token in the Authorization header.

## Endpoints

### GET /lookup/{termId}

Retrieve a single term by its WHO ITA code.

**Example:**
```bash
curl /api/v1/ita/lookup/ITA-1.1.1
```

**Response:**
```json
{
  "term_id": "ITA-1.1.1",
  "english": "Ayurveda",
  "iast": "āyurveda",
  "devanagari": "आयुर्वेद",
  "chapter": "1",
  "chapter_name": "Background Terminology",
  "domains": ["general"],
  "confidence": "high"
}
```

### GET /search?q={query}

Search terms by keyword.

**Parameters:**
- `q` (required): Search query
- `chapter` (optional): Filter by chapter (1-10)
- `limit` (optional): Maximum results (default: 20)

**Example:**
```bash
curl /api/v1/ita/search?q=vata&chapter=2&limit=10
```

### GET /autocomplete?prefix={prefix}

Get autocomplete suggestions.

**Parameters:**
- `prefix` (required): Minimum 2 characters

### POST /validate

Validate IAST-Devanagari consistency.

**Request Body:**
```json
{
  "iast": "āyurveda",
  "devanagari": "आयुर्वेद"
}
```

### GET /chapters

List all WHO ITA chapters with term counts.

## Error Codes

| Code | Description |
|------|-------------|
| 404 | Term not found |
| 400 | Invalid request parameters |
| 500 | Server error |

## Rate Limits

- 100 requests per minute per user
- 1000 requests per hour per user

## Support

For issues, contact: support@ayurvritta.com
'''


# ============================================================================
# MAIN ENGINE
# ============================================================================

class Phase9IntegrationEngine:
    """Main engine for Phase 9 integration."""
    
    def __init__(self):
        self.terms = []
    
    def load_data(self):
        """Load data from Phase 5."""
        print("[LOAD] Loading normalized knowledge base...")
        kb_path = PHASE5_DIR / "normalized_knowledge_base.json"
        with open(kb_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.terms = data.get('terms', [])
        print(f"  [OK] Loaded {len(self.terms)} terms")
    
    def run(self):
        """Run all Phase 9 sub-phases."""
        print("=" * 70)
        print("Phase 9: Integration & Deployment")
        print("=" * 70)
        print(f"Started at: {datetime.now().isoformat()}")
        
        self.load_data()
        
        # 9.1 API Specification
        print("\n[9.1] Generating OpenAPI Specification...")
        api_path = API_DIR / "openapi.json"
        with open(api_path, 'w', encoding='utf-8') as f:
            json.dump(OPENAPI_SPEC, f, indent=2)
        print(f"  [OK] OpenAPI spec: {api_path}")
        
        # 9.2 Frontend Components
        print("\n[9.2] Generating Frontend Components...")
        hook_path = API_DIR / "useITALookup.ts"
        with open(hook_path, 'w', encoding='utf-8') as f:
            f.write(ITA_LOOKUP_HOOK)
        print(f"  [OK] Hook: {hook_path}")
        
        autocomplete_path = API_DIR / "ITAAutocomplete.tsx"
        with open(autocomplete_path, 'w', encoding='utf-8') as f:
            f.write(ITA_AUTOCOMPLETE_COMPONENT)
        print(f"  [OK] Autocomplete: {autocomplete_path}")
        
        tooltip_path = API_DIR / "ITATooltip.tsx"
        with open(tooltip_path, 'w', encoding='utf-8') as f:
            f.write(ITA_TOOLTIP_COMPONENT)
        print(f"  [OK] Tooltip: {tooltip_path}")
        
        # 9.3 Gemini Service Integration
        print("\n[9.3] Generating Gemini Service Integration...")
        gemini_path = API_DIR / "geminiITAService.ts"
        with open(gemini_path, 'w', encoding='utf-8') as f:
            f.write(GEMINI_SERVICE_UPDATE)
        print(f"  [OK] Gemini service: {gemini_path}")
        
        kb_service_path = API_DIR / "itaKnowledgeBase.ts"
        with open(kb_service_path, 'w', encoding='utf-8') as f:
            f.write(ITA_KNOWLEDGE_BASE_SERVICE)
        print(f"  [OK] KB service: {kb_service_path}")
        
        # 9.4 Document Templates
        print("\n[9.4] Generating Document Templates...")
        template_path = API_DIR / "opd_template_ita.html"
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(OPD_TEMPLATE_WITH_ITA)
        print(f"  [OK] OPD template: {template_path}")
        
        # 9.5 Offline Bundle
        print("\n[9.5] Creating Offline Knowledge Base Bundle...")
        builder = OfflineKnowledgeBaseBuilder()
        bundle = builder.build(self.terms)
        bundle_path = OUTPUT_DIR / "ita_offline_bundle.json"
        with open(bundle_path, 'w', encoding='utf-8') as f:
            json.dump(bundle, f, ensure_ascii=False, separators=(',', ':'))
        
        # Compressed version
        compressed_path = OUTPUT_DIR / "ita_offline_bundle.json.gz"
        size = builder.save_compressed(bundle, compressed_path)
        print(f"  [OK] Bundle: {len(bundle['t'])} terms, {size/1024:.1f} KB compressed")
        
        # 9.6 Performance Config
        print("\n[9.6] Generating Performance Configuration...")
        perf_path = API_DIR / "performance_config.json"
        with open(perf_path, 'w', encoding='utf-8') as f:
            json.dump(PERFORMANCE_CONFIG, f, indent=2)
        print(f"  [OK] Performance config: {perf_path}")
        
        # 9.7 Error Handling
        print("\n[9.7] Generating Error Handling Code...")
        error_path = API_DIR / "itaErrorHandler.ts"
        with open(error_path, 'w', encoding='utf-8') as f:
            f.write(ERROR_HANDLING_CODE)
        print(f"  [OK] Error handler: {error_path}")
        
        # 9.8 A/B Testing (placeholder config)
        print("\n[9.8] Generating A/B Testing Configuration...")
        ab_config = {
            'experiments': [
                {
                    'id': 'ita_autocomplete_v2',
                    'description': 'Test new autocomplete with ITA integration',
                    'variants': ['control', 'treatment'],
                    'allocation': 0.5
                }
            ],
            'metrics': ['lookup_success_rate', 'search_latency', 'user_satisfaction']
        }
        ab_path = API_DIR / "ab_testing_config.json"
        with open(ab_path, 'w', encoding='utf-8') as f:
            json.dump(ab_config, f, indent=2)
        print(f"  [OK] A/B config: {ab_path}")
        
        # 9.9 Documentation
        print("\n[9.9] Generating Documentation...")
        doc_path = DOCS_DIR / "API_DOCUMENTATION.md"
        with open(doc_path, 'w', encoding='utf-8') as f:
            f.write(API_DOCUMENTATION)
        print(f"  [OK] API docs: {doc_path}")
        
        # 9.10 Deployment Summary
        print("\n[9.10] Generating Deployment Summary...")
        deployment_summary = {
            'generated_at': datetime.now().isoformat(),
            'phase': 9,
            'artifacts': {
                'api_spec': str(api_path),
                'frontend_components': 3,
                'gemini_integration': 2,
                'templates': 1,
                'offline_bundle': str(bundle_path),
                'compressed_bundle': str(compressed_path),
                'documentation': str(doc_path)
            },
            'statistics': {
                'terms_bundled': len(bundle['t']),
                'bundle_size_kb': size / 1024,
                'api_endpoints': 5
            },
            'deployment_checklist': [
                'Copy frontend components to src/components/',
                'Copy hooks to src/hooks/',
                'Copy services to src/services/',
                'Deploy offline bundle to public/assets/',
                'Update API routes',
                'Run integration tests'
            ]
        }
        summary_path = OUTPUT_DIR / "deployment_summary.json"
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(deployment_summary, f, indent=2)
        print(f"  [OK] Summary: {summary_path}")
        
        print()
        print("=" * 70)
        print("Phase 9 Complete!")
        print(f"Finished at: {datetime.now().isoformat()}")
        print("=" * 70)
        
        print("\nGENERATED ARTIFACTS:")
        print(f"  API Endpoints: 5")
        print(f"  Frontend Components: 3")
        print(f"  Service Modules: 2")
        print(f"  Offline Bundle: {len(bundle['t'])} terms ({size/1024:.1f} KB)")


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    API_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    
    engine = Phase9IntegrationEngine()
    engine.run()


if __name__ == "__main__":
    main()
