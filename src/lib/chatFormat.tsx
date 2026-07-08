import React from 'react';

export function parseInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return <code key={i} className="px-1 rounded font-mono text-[11px] bg-black/10">{part.slice(1, -1)}</code>;
    return part;
  });
}

export function MsgContent({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (!listItems.length) return;
    nodes.push(
      listType === 'ol'
        ? <ol key={nodes.length} className="list-decimal pl-4 space-y-0.5 my-1">{[...listItems]}</ol>
        : <ul key={nodes.length} className="list-disc pl-4 space-y-0.5 my-1">{[...listItems]}</ul>
    );
    listItems = [];
    listType = null;
  };

  for (const line of text.split('\n')) {
    const ul = line.match(/^[ \t]*[-*]\s+(.*)/);
    const ol = line.match(/^[ \t]*\d+\.\s+(.*)/);
    if (ul) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(<li key={listItems.length}>{parseInline(ul[1])}</li>);
    } else if (ol) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(<li key={listItems.length}>{parseInline(ol[1])}</li>);
    } else {
      flushList();
      if (line.trim()) nodes.push(<p key={nodes.length}>{parseInline(line)}</p>);
    }
  }
  flushList();

  return <div className="space-y-1">{nodes}</div>;
}
