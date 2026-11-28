'use client';

import React from 'react';
import { Icon } from './Icon';
import { SegmentedTabs } from './SegmentedTabs';
import { useI18n } from '@/lib/i18n/context';
import { PERIOD_LABEL, PERIOD_TYPES, PeriodType, getPeriod, shiftPeriod, toISO } from '@/lib/period';
import { cn } from '@/lib/utils';

interface PeriodNavigatorProps {
  type: PeriodType;
  anchor: string;
  onChange: (type: PeriodType, anchor: string) => void;
  /** Limit which period types can be chosen. */
  types?: PeriodType[];
  className?: string;
}

/**
 * Day / week / month / quarter / year switcher with previous / next and a
 * jump back to the current period (docs/STYLE_GUIDE.md §4.2).
 */
export function PeriodNavigator({ type, anchor, onChange, types = PERIOD_TYPES, className }: PeriodNavigatorProps) {
  const { locale } = useI18n();
  const id = locale === 'id';
  const p = getPeriod(type, anchor, id ? 'id' : 'en');
  const today = toISO(new Date());
  const isCurrent = today >= p.start && today <= p.end;

  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-center md:justify-between', className)}>
      {types.length > 1 && (
        <SegmentedTabs
          sticky={false}
          label={id ? 'Jenis periode' : 'Period type'}
          value={type}
          onChange={(t) => onChange(t, anchor)}
          tabs={types.map((t) => ({ id: t, label: PERIOD_LABEL[t][id ? 'id' : 'en'] }))}
        />
      )}
      <div className="flex items-center gap-2">
        <button type="button" className="icon-btn" aria-label={id ? 'Periode sebelumnya' : 'Previous period'} onClick={() => onChange(type, shiftPeriod(type, anchor, -1))}>
          <Icon name="chevronLeft" size={18} />
        </button>
        <p className="flex-1 md:flex-none md:min-w-[220px] text-center font-display text-[15px] font-medium text-foreground tabular-nums" aria-live="polite">
          {p.label}
        </p>
        <button type="button" className="icon-btn" aria-label={id ? 'Periode berikutnya' : 'Next period'} onClick={() => onChange(type, shiftPeriod(type, anchor, 1))}>
          <Icon name="chevronRight" size={18} />
        </button>
        {!isCurrent && (
          <button type="button" className="chip" onClick={() => onChange(type, today)}>
            {id ? 'Sekarang' : 'Now'}
          </button>
        )}
      </div>
    </div>
  );
}
