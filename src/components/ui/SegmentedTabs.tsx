'use client';

import React, { useRef } from 'react';
import { Icon } from './Icon';
import { cn } from '@/lib/utils';

export interface SegmentedTab<T extends string> {
  id: T;
  label: React.ReactNode;
  icon?: string;
  count?: number | string;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Accessible name of the tab list. */
  label: string;
  className?: string;
  /** Stick under the mobile app bar while scrolling. */
  sticky?: boolean;
}

/**
 * Module tabs (docs/STYLE_GUIDE.md §4.2). Desktop: black-pill segmented
 * control. Mobile: the same control scrolls horizontally and sticks under the
 * app bar. Arrow keys move between tabs.
 */
export function SegmentedTabs<T extends string>({ tabs, value, onChange, label, className, sticky = true }: SegmentedTabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      className={cn(
        sticky && 'sticky top-14 md:static z-20 -mx-4 px-4 py-2 md:mx-0 md:px-0 md:py-0 bg-background/85 md:bg-transparent backdrop-blur-md md:backdrop-blur-none',
        className
      )}
    >
      <div role="tablist" aria-label={label} className="seg w-full md:w-max max-w-full">
        {tabs.map((tab, i) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className="seg-item"
            >
              {tab.icon && <Icon name={tab.icon} size={15} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== '' && (
                <span className={cn('seg-count', selected && 'bg-white/20 text-current dark:bg-black/15')}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
