import React from 'react';

interface MarkdownProps {
  content: string;
}

function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let match = false;

    // Bold
    const boldMatch = remaining.match(/^(.+?)\*\*(.+?)\*\*/);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{sanitizeHtml(boldMatch[1])}</span>);
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      match = true;
    }

    // Italic
    if (!match) {
      const italicMatch = remaining.match(/^(.+?)\*(.+?)\*/);
      if (italicMatch) {
        if (italicMatch[1]) parts.push(<span key={key++}>{sanitizeHtml(italicMatch[1])}</span>);
        parts.push(<em key={key++}>{italicMatch[2]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        match = true;
      }
    }

    // Inline code
    if (!match) {
      const codeMatch = remaining.match(/^(.+?)`(.+?)`/);
      if (codeMatch) {
        if (codeMatch[1]) parts.push(<span key={key++}>{sanitizeHtml(codeMatch[1])}</span>);
        parts.push(
          <code key={key++} className="px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-primary-600 text-sm font-mono">
            {sanitizeHtml(codeMatch[2])}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        match = true;
      }
    }

    if (!match) {
      parts.push(<span key={key++}>{sanitizeHtml(remaining)}</span>);
      break;
    }
  }

  return parts;
}

function parseBlocks(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <div key={key++} className="my-3 rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700">
          {lang && (
            <div className="px-4 py-1.5 bg-surface-100 dark:bg-surface-800 text-xs text-surface-500 font-mono">
              {lang}
            </div>
          )}
          <pre className="p-4 bg-surface-50 dark:bg-surface-900 overflow-x-auto">
            <code className="text-sm font-mono text-surface-800 dark:text-surface-200">
              {codeLines.join('\n')}
            </code>
          </pre>
        </div>
      );
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,5})\s+(.+)/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const sizeClasses = ['text-xl', 'text-lg', 'text-base', 'text-sm', 'text-sm'];
      const className = `font-bold text-surface-900 dark:text-white mt-4 mb-2 ${sizeClasses[level - 1]}`;
      const content = parseInline(headerMatch[2]);
      if (level === 1) blocks.push(<h1 key={key++} className={className}>{content}</h1>);
      else if (level === 2) blocks.push(<h2 key={key++} className={className}>{content}</h2>);
      else if (level === 3) blocks.push(<h3 key={key++} className={className}>{content}</h3>);
      else if (level === 4) blocks.push(<h4 key={key++} className={className}>{content}</h4>);
      else blocks.push(<h5 key={key++} className={className}>{content}</h5>);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(<hr key={key++} className="my-4 border-surface-200 dark:border-surface-700" />);
      i++;
      continue;
    }

    // Unordered list
    if (/^[\s]*[-*+]\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[\s]*[-*+]\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[\s]*[-*+]\s/, ''));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-2 space-y-1 list-disc list-inside text-surface-700 dark:text-surface-300">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm">{parseInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^[\s]*\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[\s]*\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[\s]*\d+\.\s/, ''));
        i++;
      }
      blocks.push(
        <ol key={key++} className="my-2 space-y-1 list-decimal list-inside text-surface-700 dark:text-surface-300">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm">{parseInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      blocks.push(
        <blockquote
          key={key++}
          className="my-2 pl-4 border-l-[3px] border-primary-400 text-surface-600 dark:text-surface-400 italic text-sm"
        >
          {parseInline(line.slice(1).trim())}
        </blockquote>
      );
      i++;
      continue;
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1])) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0].split('|').map((c) => c.trim()).filter(Boolean);
      const rows = tableLines.slice(2).map((r) => r.split('|').map((c) => c.trim()).filter(Boolean));
      blocks.push(
        <div key={key++} className="my-3 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-surface-100 dark:bg-surface-800">
                {headers.map((h, idx) => (
                  <th key={idx} className="px-3 py-2 text-left font-medium text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-700">
                    {parseInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="even:bg-surface-50 dark:even:bg-surface-800/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-700">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    const paragraphLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('>') && !/^[\s]*[-*+]\s/.test(lines[i]) && !/^[\s]*\d+\.\s/.test(lines[i])) {
      paragraphLines.push(lines[i]);
      i++;
    }
    if (paragraphLines.length > 0) {
      blocks.push(
        <p key={key++} className="my-2 text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
          {parseInline(paragraphLines.join(' '))}
        </p>
      );
    }
  }

  return blocks;
}

export function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {parseBlocks(content)}
    </div>
  );
}
