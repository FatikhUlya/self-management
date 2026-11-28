import React from 'react';
import { safeExternalUrl } from '@/lib/utils';

// http(s)://…, www.…, or bare domains with a path/known TLD (tokopedia.com/…)
const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|id|co\.id|net|org|io|app|dev|me|ly|gl|link|shop|store|site|xyz|ai)(?:\/[^\s<>"']*)?)/gi;

/** Renders text with every URL turned into a link that opens in a new tab. */
export function Linkify({ text, className }: { text: string | null | undefined; className?: string }) {
  const s = String(text ?? '');
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of Array.from(s.matchAll(URL_RE))) {
    let raw = m[0];
    // Leave trailing punctuation outside the link
    const trail = raw.match(/[.,;:!?)\]]+$/)?.[0] || '';
    if (trail) raw = raw.slice(0, -trail.length);
    const href = safeExternalUrl(raw);
    const start = m.index!;
    if (!href) continue;
    if (start > last) parts.push(s.slice(last, start));
    parts.push(
      <a key={start} href={href} target="_blank" rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 underline underline-offset-2 break-all hover:text-blue-700"
        onClick={(e) => e.stopPropagation()}>
        {raw}
      </a>,
    );
    last = start + raw.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return <span className={className}>{parts}</span>;
}
