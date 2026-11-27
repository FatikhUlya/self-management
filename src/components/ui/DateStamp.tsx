'use client';

import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';

/**
 * Signature detail: a dated planner tab. Shows the operating date the whole
 * app is looking at (the date picked in the top bar), once per page header.
 */
export function DateStamp() {
  const { state } = useLifeOS();
  const { locale } = useI18n();
  const date = new Date(`${state.selectedDate}T00:00:00`);
  const loc = locale === 'id' ? 'id-ID' : 'en-US';
  const weekday = date.toLocaleDateString(loc, { weekday: 'short' });
  const day = date.toLocaleDateString(loc, { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <span className="date-stamp" aria-label={`Tanggal ${day}`}>
      <span>{weekday}</span>
      <b>{day}</b>
    </span>
  );
}
