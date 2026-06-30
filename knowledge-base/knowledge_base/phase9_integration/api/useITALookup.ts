// hooks/useITALookup.ts
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
