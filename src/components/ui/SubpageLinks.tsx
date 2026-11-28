import React from 'react';
import Link from 'next/link';
import { Icon } from './Icon';
import { cn } from '@/lib/utils';

export interface SubpageLink {
  href: string;
  icon: string;
  title: string;
  /** One short line: what you do there, or a live figure. */
  detail?: string;
}

/**
 * Large, labelled entry points to a module's sub pages (STYLE_GUIDE §4.15).
 * Default: horizontal scroll of tiles on mobile, a row of cards on desktop.
 * `stacked`: a full-width list on mobile (the mobile hub menu), grid on desktop.
 */
export function SubpageLinks({ links, className, label, stacked, columns }: {
  links: SubpageLink[]; className?: string; label: string; stacked?: boolean; columns?: number;
}) {
  const cols = columns || links.length;
  return (
    <nav aria-label={label} className={cn(!stacked && '-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto no-scrollbar', className)}>
      <ul
        className={cn(stacked ? 'grid grid-cols-1 gap-2 md:gap-4 md:[grid-template-columns:var(--cols)]' : 'flex md:grid gap-3 md:gap-4 w-max md:w-auto md:[grid-template-columns:var(--cols)]')}
        style={{ ['--cols' as string]: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {links.map((l) => (
          <li key={l.href} className={cn(!stacked && 'w-[220px] md:w-auto')}>
            <Link href={l.href} className={cn('glass glass-hover flex items-center gap-3 h-full rounded-xl', stacked ? 'p-3.5 md:p-4' : 'p-4')}>
              <span className="icon-tile w-10 h-10 shrink-0"><Icon name={l.icon} size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{l.title}</span>
                {l.detail && <span className="block text-xs text-muted-foreground truncate mt-0.5">{l.detail}</span>}
              </span>
              <Icon name={stacked ? 'chevronRight' : 'arrowUpRight'} size={16} className="text-muted-foreground shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
