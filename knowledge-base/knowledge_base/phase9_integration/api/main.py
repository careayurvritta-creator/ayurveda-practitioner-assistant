"""
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
