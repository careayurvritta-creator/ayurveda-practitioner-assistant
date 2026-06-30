// components/ITAAutocomplete.tsx
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
