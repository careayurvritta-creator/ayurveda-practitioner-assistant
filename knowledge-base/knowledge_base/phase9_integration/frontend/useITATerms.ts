// hooks/useITATerms.ts
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
