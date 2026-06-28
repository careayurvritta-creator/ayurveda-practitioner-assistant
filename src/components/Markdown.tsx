import React from 'react';

/**
 * Sanitize HTML special characters to prevent XSS attacks.
 * Escapes &, <, >, ", ' to their HTML entity equivalents.
 */
function sanitizeHtml(input: string): string {
  if (!input) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return input.replace(/[&<>"']/g, m => map[m]);
}

// Helper types for parsed Markdown block representation
export type Block =
  | { type: 'code'; codeText: string; language?: string }
  | { type: 'table'; rows: string[][] }
  | { type: 'list'; items: { text: string; indent: number; num?: string }[]; ordered: boolean }
  | { type: 'blockquote'; textLines: string[] }
  | { type: 'header'; level: number; text: string }
  | { type: 'hr' }
  | { type: 'paragraph'; text: string };

interface Token {
  type: 'text' | 'bold' | 'italic' | 'code' | 'citation';
  content: string;
}

// Helper to parse inline styles recursively and return a list of React nodes
export const parseInlineStyles = (text: string): React.ReactNode[] => {
  if (!text) return [];
  
  const safeText = sanitizeHtml(text);
  let tokens: Token[] = [{ type: 'text', content: safeText }];
  
  // Helper to split text tokens safely by a regex and map them to custom parsed tokens
  const splitAndMap = (
    currentTokens: Token[],
    regex: RegExp,
    matchedType: 'bold' | 'italic' | 'code' | 'citation'
  ): Token[] => {
    const nextTokens: Token[] = [];
    for (const t of currentTokens) {
      if (t.type !== 'text') {
        nextTokens.push(t);
        continue;
      }
      
      const parts = t.content.split(regex);
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i % 2 === 1) {
          nextTokens.push({ type: matchedType, content: part });
        } else if (part) {
          nextTokens.push({ type: 'text', content: part });
        }
      }
    }
    return nextTokens;
  };

  // 1. Extract inline code blocks: `code`
  tokens = splitAndMap(tokens, /`([^`]+)`/g, 'code');
  
  // 2. Extract bold: **bold** and __bold__
  tokens = splitAndMap(tokens, /\*\*([^*]+)\*\*/g, 'bold');
  tokens = splitAndMap(tokens, /__([^_]+)__/g, 'bold');

  // 3. Extract italic: *italic* and _italic_
  tokens = splitAndMap(tokens, /\*([^*]+)\*/g, 'italic');
  tokens = splitAndMap(tokens, /_([^_]+)_/g, 'italic');

  // 4. Extract Ayurvedic classical scripture citations (e.g., CS.Su.1.10, AH.Ni.3.4, etc.)
  // Match letters.letters.digits.digits or wrapped in brackets
  tokens = splitAndMap(
    tokens,
    /(\b[A-Za-z]{2,5}\.[A-Za-z]{2,5}\.\d+(?:\.\d+)?\b)/g,
    'citation'
  );

  return tokens.map((token, index) => {
    const key = `token-${index}`;
    switch (token.type) {
      case 'bold':
        return <strong key={key} className="font-bold text-stone-900">{token.content}</strong>;
      case 'italic':
        return <em key={key} className="italic text-stone-850">{token.content}</em>;
      case 'code':
        return (
          <code key={key} className="font-mono bg-stone-100 text-stone-800 border border-stone-200/50 px-1 py-0.5 rounded text-[10px] select-all">
            {token.content}
          </code>
        );
      case 'citation':
        return (
          <span key={key} className="font-mono bg-amber-50 text-amber-800 border border-amber-200/50 px-1 py-0.5 rounded text-[9px] font-semibold inline-block mx-0.5 shadow-3xs select-none">
            📒 {token.content}
          </span>
        );
      case 'text':
      default:
        return <React.Fragment key={key}>{token.content}</React.Fragment>;
    }
  });
};

export interface MarkdownProps {
  content: string;
}

// Check if a table row consists solely of formatting dashes/separators
const isSeparatorRow = (row: string[]): boolean => {
  return row.every(cell => cell.trim().match(/^-+$/) || cell.trim() === '');
};

export const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const finalBlocks: Block[] = [];
  
  // State machine variables
  type ActiveBlock = 
    | { type: 'code'; lines: string[]; language: string }
    | { type: 'table'; rows: string[][] }
    | { type: 'list'; items: { text: string; indent: number; num?: string }[]; ordered: boolean }
    | { type: 'blockquote'; lines: string[] }
    | { type: 'paragraph'; lines: string[] }
    | null;

  let activeBlock: ActiveBlock = null;

  const flushActiveBlock = () => {
    if (!activeBlock) return;
    
    if (activeBlock.type === 'code') {
      finalBlocks.push({
        type: 'code',
        codeText: activeBlock.lines.join('\n'),
        language: activeBlock.language
      });
    } else if (activeBlock.type === 'table') {
      finalBlocks.push({
        type: 'table',
        rows: activeBlock.rows
      });
    } else if (activeBlock.type === 'list') {
      finalBlocks.push({
        type: 'list',
        items: activeBlock.items,
        ordered: activeBlock.ordered
      });
    } else if (activeBlock.type === 'blockquote') {
      finalBlocks.push({
        type: 'blockquote',
        textLines: activeBlock.lines
      });
    } else if (activeBlock.type === 'paragraph') {
      finalBlocks.push({
        type: 'paragraph',
        text: activeBlock.lines.join('\n')
      });
    }
    
    activeBlock = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 1. Inside continuous code blocks
    if (activeBlock && activeBlock.type === 'code') {
      if (line.trim().startsWith('```')) {
        flushActiveBlock();
      } else {
        activeBlock.lines.push(line);
      }
      continue;
    }
    
    // Starting a code block
    if (line.trim().startsWith('```')) {
      flushActiveBlock();
      const lang = line.trim().substring(3).trim();
      activeBlock = { type: 'code', lines: [], language: lang };
      continue;
    }
    
    // 2. Horizontal Rule Check
    if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
      flushActiveBlock();
      finalBlocks.push({ type: 'hr' });
      continue;
    }
    
    // 3. Header check (support # to ######)
    const headerMatch = line.match(/^(\#{1,6})\s+(.*)$/);
    if (headerMatch) {
      flushActiveBlock();
      finalBlocks.push({
        type: 'header',
        level: headerMatch[1].length,
        text: headerMatch[2].trim()
      });
      continue;
    }
    
    // 4. Blockquotes: starting with ">"
    if (line.trim().startsWith('>')) {
      const rawQuoteText = line.trim().substring(1);
      const textPart = rawQuoteText.startsWith(' ') ? rawQuoteText.substring(1) : rawQuoteText;
      
      if (activeBlock && activeBlock.type === 'blockquote') {
        activeBlock.lines.push(textPart);
      } else {
        flushActiveBlock();
        activeBlock = { type: 'blockquote', lines: [textPart] };
      }
      continue;
    }
    
    // 5. Lists (consecutive ordered/unordered list items)
    // Bullet format: leading whitespace followed by dash, asterisk, or plus and then space
    const bulletMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
    // Numbered format: leading whitespace followed by digit, dot, and space
    const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    
    if (bulletMatch) {
      const spaces = bulletMatch[1];
      const indent = Math.floor(spaces.length / 2);
      const content = bulletMatch[3];
      
      if (activeBlock && activeBlock.type === 'list' && !activeBlock.ordered) {
        activeBlock.items.push({ text: content, indent });
      } else {
        flushActiveBlock();
        activeBlock = {
          type: 'list',
          items: [{ text: content, indent }],
          ordered: false
        };
      }
      continue;
    }
    
    if (numberedMatch) {
      const spaces = numberedMatch[1];
      const indent = Math.floor(spaces.length / 2);
      const num = numberedMatch[2];
      const content = numberedMatch[3];
      
      if (activeBlock && activeBlock.type === 'list' && activeBlock.ordered) {
        activeBlock.items.push({ text: content, indent, num });
      } else {
        flushActiveBlock();
        activeBlock = {
          type: 'list',
          items: [{ text: content, indent, num }],
          ordered: true
        };
      }
      continue;
    }
    
    // 6. Tables (any line containing separator pipes)
    if (line.includes('|')) {
      const cells = line.split('|').map(c => c.trim());
      const firstCellEmpty = line.startsWith('|') || cells[0] === '';
      const lastCellEmpty = line.endsWith('|') || cells[cells.length - 1] === '';
      
      const cleanCells = cells.slice(
        firstCellEmpty ? 1 : 0,
        lastCellEmpty ? cells.length - 1 : cells.length
      );
      
      if (activeBlock && activeBlock.type === 'table') {
        activeBlock.rows.push(cleanCells);
      } else {
        flushActiveBlock();
        activeBlock = {
          type: 'table',
          rows: [cleanCells]
        };
      }
      continue;
    }
    
    // Blank Line / Page Break trigger
    if (line.trim() === '') {
      flushActiveBlock();
      continue;
    }
    
    // 7. Standard Paragraph accumulation
    if (activeBlock && activeBlock.type === 'paragraph') {
      activeBlock.lines.push(line);
    } else {
      flushActiveBlock();
      activeBlock = {
        type: 'paragraph',
        lines: [line]
      };
    }
  }

  // Final flush of active parsing block
  flushActiveBlock();

  // Render the finalized list of structured blocks
  const elements = finalBlocks.map((block, idx) => {
    switch (block.type) {
      case 'code':
        return (
          <div key={`code-${idx}`} className="my-3 overflow-hidden rounded-lg border border-stone-200 shadow-3xs">
            <div className="bg-stone-50 px-3 py-1 flex items-center justify-between text-[10px] text-stone-500 font-mono border-b border-stone-200 select-none">
              <span>🖥️ {block.language ? block.language.toUpperCase() : 'CODE SNIPPET'}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(block.codeText)}
                className="hover:text-emerald-800 hover:font-semibold transition font-sans cursor-pointer flex items-center gap-1 active:scale-95"
                title="Copy contents to clipboard"
              >
                Copy Code
              </button>
            </div>
            <pre className="bg-stone-900 text-stone-100 p-3.5 font-mono text-[10.5px] leading-relaxed overflow-x-auto select-all">
              <code>{block.codeText}</code>
            </pre>
          </div>
        );

      case 'table': {
        const rows = block.rows;
        let hasHeader = false;
        let headers: string[] = [];
        let dataRows: string[][] = [];
        
        const sepIdx = rows.findIndex(row => isSeparatorRow(row));
        if (sepIdx !== -1) {
          hasHeader = true;
          headers = rows[0];
          dataRows = rows.slice(sepIdx + 1);
        } else {
          dataRows = rows;
        }

        return (
          <div key={`table-${idx}`} className="my-3.5 overflow-x-auto border border-stone-200 rounded-lg shadow-4xs">
            <table className="min-w-full divide-y divide-stone-200">
              {hasHeader && (
                <thead className="bg-stone-50/80">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-3.5 py-2 text-left text-[10px] font-bold text-stone-600 uppercase tracking-wider font-sans border-r border-stone-200 last:border-r-0 bg-stone-50">
                        {parseInlineStyles(h.trim())}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="bg-white divide-y divide-stone-150">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-stone-50/40' : ''}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-stone-700 border-r border-stone-150 last:border-r-0 font-sans text-[10.5px] leading-relaxed">
                        {parseInlineStyles(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'list':
        return (
          <div key={`list-${idx}`} className="my-2 space-y-1">
            {block.items.map((item, liIdx) => (
              <div 
                key={`li-${liIdx}`} 
                className="flex items-start space-x-2 my-1 text-left list-none"
                style={{ paddingLeft: `${item.indent * 14}px` }}
              >
                {block.ordered ? (
                  <span className="text-emerald-800 font-bold font-mono text-[9.5px] shrink-0 mt-0.5 min-w-[14px] text-right">
                    {item.num ? `${item.num}.` : '•'}
                  </span>
                ) : (
                  <span className="text-emerald-700 shrink-0 text-xs mt-0.5">•</span>
                )}
                <span className="text-stone-700 leading-relaxed text-[11px] font-sans">
                  {parseInlineStyles(item.text)}
                </span>
              </div>
            ))}
          </div>
        );

      case 'blockquote':
        return (
          <blockquote key={`bq-${idx}`} className="border-l-3 border-amber-600 pl-3.5 py-1.5 italic bg-amber-50/40 text-stone-850 my-3 rounded-r text-[11px] leading-relaxed shadow-4xs">
            {block.textLines.map((line, lIdx) => (
              <div key={lIdx}>{parseInlineStyles(line)}</div>
            ))}
          </blockquote>
        );

      case 'header': {
        const level = block.level;
        if (level === 1) {
          return (
            <h1 key={`h-${idx}`} className="text-base font-extrabold text-emerald-950 tracking-tight mt-6 mb-3 border-b border-emerald-800/20 pb-1.5 flex items-center">
              {parseInlineStyles(block.text)}
            </h1>
          );
        } else if (level === 2) {
          return (
            <h2 key={`h-${idx}`} className="text-sm font-bold text-stone-900 tracking-tight mt-5 mb-2.5 flex items-center">
              <span className="w-1.5 h-3 bg-emerald-700 rounded-xs mr-2 inline-block" />
              {parseInlineStyles(block.text)}
            </h2>
          );
        } else if (level === 3) {
          return (
            <h3 key={`h-${idx}`} className="text-xs font-bold uppercase text-emerald-900 tracking-wider mt-4 mb-2 border-b border-stone-200/60 pb-1 flex items-center">
              <span className="bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded mr-1.5 text-[8.5px] font-mono border border-emerald-100/70">§</span>
              {parseInlineStyles(block.text)}
            </h3>
          );
        } else if (level === 4) {
          return (
            <h4 key={`h-${idx}`} className="text-[11.5px] font-semibold text-stone-850 mt-3.5 mb-2 flex items-center pl-1.5 border-l-2 border-stone-300">
              {parseInlineStyles(block.text)}
            </h4>
          );
        } else {
          return (
            <h5 key={`h-${idx}`} className="text-[11px] font-semibold text-stone-700 italic mt-3 mb-1.5">
              {parseInlineStyles(block.text)}
            </h5>
          );
        }
      }

      case 'hr':
        return <hr key={`hr-${idx}`} className="my-4 border-t border-stone-200" />;

      case 'paragraph': {
        const text = block.text;
        
        // Emulation flag styling refinement: detect "*(Synthesized via Gemini in ... Emulation Mode)*"
        const isEmulationBadge = text.trim().startsWith('*(') && text.trim().endsWith(')*') && text.includes('Emulation Mode');
        if (isEmulationBadge) {
          const cleanLabel = text.trim().slice(2, -2);
          return (
            <div key={`param-${idx}`} className="mt-3.5 bg-emerald-50/55 border border-emerald-100/60 rounded-md px-2.5 py-1 text-[9px] text-emerald-800 font-mono tracking-wide flex items-center justify-between shadow-4xs transition hover:bg-emerald-50/85 select-none font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                <span>MiniMax M3 Clinical Protocol</span>
              </span>
              <span className="font-semibold">{cleanLabel.toUpperCase()}</span>
            </div>
          );
        }

        const isSystemAlert = text.includes('[System Alert - Network/Key Issue]') || text.includes('Could not communicate with clinical endpoint');
        if (isSystemAlert) {
          return (
            <p key={`param-${idx}`} className="text-[11px] leading-relaxed font-sans mt-2 mb-2 text-stone-800 bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl font-medium shadow-3xs text-left">
              {parseInlineStyles(text)}
            </p>
          );
        }

        return (
          <p key={`param-${idx}`} className="text-[11px] leading-relaxed font-sans mt-1.5 mb-1.5 text-stone-700 text-left">
            {parseInlineStyles(text)}
          </p>
        );
      }

      default:
        return null;
    }
  });

  return <div className="space-y-1 block text-left font-sans">{elements}</div>;
};
