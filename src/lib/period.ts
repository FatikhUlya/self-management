/**
 * Calendar periods for long-term self management (Gregorian calendar).
 * Week = Monday–Sunday. Month ends on its last day. Quarter = Q1 Jan–Mar …
 * Year ends 31 December. All dates are local ISO strings (YYYY-MM-DD).
 */
export type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'year';

export const PERIOD_TYPES: PeriodType[] = ['day', 'week', 'month', 'quarter', 'year'];

export const PERIOD_LABEL: Record<PeriodType, { id: string; en: string }> = {
  day: { id: 'Hari', en: 'Day' },
  week: { id: 'Minggu', en: 'Week' },
  month: { id: 'Bulan', en: 'Month' },
  quarter: { id: 'Kuartal', en: 'Quarter' },
  year: { id: 'Tahun', en: 'Year' },
};

export interface PeriodRange {
  type: PeriodType;
  start: string; // inclusive
  end: string;   // inclusive
  label: string;
  short: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** Monday of the week containing `d`. */
export function weekStart(d: Date) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (r.getDay() + 6) % 7; // Mon=0 … Sun=6
  r.setDate(r.getDate() - dow);
  return r;
}

/** ISO-8601 week number. */
export function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7);
}

export const quarterOf = (d: Date) => Math.floor(d.getMonth() / 3) + 1;

export function getPeriod(type: PeriodType, anchor: string, locale: 'id' | 'en' = 'id'): PeriodRange {
  const d = fromISO(anchor);
  const loc = locale === 'id' ? 'id-ID' : 'en-US';
  const fmt = (x: Date, o: Intl.DateTimeFormatOptions) => x.toLocaleDateString(loc, o);
  let s: Date, e: Date, label: string, short: string;

  switch (type) {
    case 'day':
      s = e = d;
      label = fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      short = fmt(d, { day: 'numeric', month: 'short' });
      break;
    case 'week': {
      s = weekStart(d);
      e = new Date(s); e.setDate(s.getDate() + 6);
      const w = isoWeek(d);
      label = `${locale === 'id' ? 'Minggu ke-' : 'Week '}${w} · ${fmt(s, { day: 'numeric', month: 'short' })} – ${fmt(e, { day: 'numeric', month: 'short', year: 'numeric' })}`;
      short = `${locale === 'id' ? 'Mg' : 'W'}${w}`;
      break;
    }
    case 'month':
      s = new Date(d.getFullYear(), d.getMonth(), 1);
      e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      label = fmt(s, { month: 'long', year: 'numeric' });
      short = fmt(s, { month: 'short' });
      break;
    case 'quarter': {
      const q = quarterOf(d);
      s = new Date(d.getFullYear(), (q - 1) * 3, 1);
      e = new Date(d.getFullYear(), q * 3, 0);
      label = `Q${q} ${d.getFullYear()} · ${fmt(s, { month: 'short' })} – ${fmt(e, { month: 'short' })}`;
      short = `Q${q}`;
      break;
    }
    case 'year':
      s = new Date(d.getFullYear(), 0, 1);
      e = new Date(d.getFullYear(), 11, 31);
      label = String(d.getFullYear());
      short = String(d.getFullYear());
      break;
  }
  return { type, start: toISO(s!), end: toISO(e!), label: label!, short: short! };
}

/** Move the anchor by `step` periods. */
export function shiftPeriod(type: PeriodType, anchor: string, step: number) {
  const d = fromISO(anchor);
  switch (type) {
    case 'day': d.setDate(d.getDate() + step); break;
    case 'week': d.setDate(d.getDate() + 7 * step); break;
    case 'month': d.setDate(1); d.setMonth(d.getMonth() + step); break;
    case 'quarter': d.setDate(1); d.setMonth(d.getMonth() + 3 * step); break;
    case 'year': d.setDate(1); d.setFullYear(d.getFullYear() + step); break;
  }
  return toISO(d);
}

export const inRange = (date: string | undefined | null, r: { start: string; end: string }) =>
  !!date && date.slice(0, 10) >= r.start && date.slice(0, 10) <= r.end;

/** Days elapsed / total in a period, for "x% of the period has passed" hints. */
export function periodProgress(r: PeriodRange, today: string) {
  const total = (fromISO(r.end).getTime() - fromISO(r.start).getTime()) / 86400000 + 1;
  if (today < r.start) return { total, elapsed: 0 };
  if (today > r.end) return { total, elapsed: total };
  return { total, elapsed: (fromISO(today).getTime() - fromISO(r.start).getTime()) / 86400000 + 1 };
}

/** Child periods inside a parent (quarter → months, month → weeks starting in it, week → days). */
export function childPeriods(parent: PeriodRange, locale: 'id' | 'en' = 'id'): PeriodRange[] {
  const out: PeriodRange[] = [];
  const childType: Record<PeriodType, PeriodType | null> = { year: 'quarter', quarter: 'month', month: 'week', week: 'day', day: null };
  const t = childType[parent.type];
  if (!t) return out;
  let cur = t === 'week' ? toISO(weekStart(fromISO(parent.start))) : parent.start;
  while (cur <= parent.end) {
    const p = getPeriod(t, cur, locale);
    out.push(p);
    cur = shiftPeriod(t, p.start, 1);
  }
  return out;
}
