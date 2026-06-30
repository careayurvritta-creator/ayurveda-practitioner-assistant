// components/ITATooltip.tsx
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
