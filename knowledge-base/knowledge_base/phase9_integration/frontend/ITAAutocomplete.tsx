// components/ITAAutocomplete.tsx
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
