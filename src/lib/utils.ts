// ─── Life OS Utility Functions ───

/** Get today's date as ISO string (YYYY-MM-DD), timezone-aware */
export function todayISO(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

/** Add/subtract days from a date string */
export function addDays(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** Convert Date to ISO date string (timezone-safe) */
export function toISODate(date: Date): string {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

/** Format date for display */
export function formatDate(
  dateString: string | undefined | null,
  options: { short?: boolean; locale?: string } = {}
): string {
  if (!dateString) return '-';
  const locale = options.locale || 'id-ID';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: options.short ? undefined : 'numeric',
  }).format(new Date(`${dateString}T00:00:00`));
}

/** Get full month label */
export function monthLabel(dateString: string, locale = 'id-ID'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateString}T00:00:00`));
}

/** Get short day name */
export function dayName(dateString: string, locale = 'id-ID'): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
    new Date(`${dateString}T00:00:00`)
  );
}

/** Clamp a number between min and max */
export function clamp(value: number | string, min: number, max: number): number {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

/** Calculate percentage */
export function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

/** Average of an array of numbers */
export function avg(values: number[]): number {
  const numbers = values.map(Number).filter((n) => Number.isFinite(n));
  if (!numbers.length) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/** Format duration in minutes */
export function formatDuration(minutes: number): string {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** Convert time string to total minutes */
export function timeToMinutes(time: string | undefined): number {
  const [hour = '0', minute = '0'] = String(time || '00:00').split(':');
  return clamp(Number(hour) * 60 + Number(minute), 0, 23 * 60 + 59);
}

/** Convert total minutes to time string */
export function minutesToTime(minutes: number): string {
  const safe = clamp(minutes, 0, 23 * 60 + 59);
  const hour = Math.floor(safe / 60);
  const minute = safe % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Normalize plan end time to be after start */
export function normalizePlanEnd(startTime: string, endTime: string): string {
  const start = timeToMinutes(startTime || '08:00');
  const end = endTime ? timeToMinutes(endTime) : start + 60;
  return minutesToTime(Math.min(end > start ? end : start + 60, 23 * 60 + 59));
}

/** Get last 7 days as ISO strings */
export function lastSevenDays(fromDate?: string): string[] {
  const base = fromDate || todayISO();
  return Array.from({ length: 7 }, (_, i) => addDays(base, i - 6));
}

/** Get all days in the month of a date */
export function monthDays(dateString: string): string[] {
  const start = new Date(`${dateString.slice(0, 7)}-01T00:00:00`);
  const month = start.getMonth();
  const cursor = new Date(start);
  const days: string[] = [];
  while (cursor.getMonth() === month) {
    days.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Get calendar grid days (with leading nulls for weekday alignment) */
export function monthCalendarDays(dateString: string): (string | null)[] {
  const days = monthDays(dateString);
  if (!days.length) return [];
  const firstDay = new Date(`${days[0]}T00:00:00`).getDay();
  const leadingEmpty = (firstDay + 6) % 7;
  return [...Array(leadingEmpty).fill(null), ...days];
}

/** Get chart label indexes spread across the month */
export function monthLabelIndexes(dayCount: number): number[] {
  const last = Math.max(dayCount - 1, 0);
  return Array.from(
    new Set([0, Math.round(last / 3), Math.round((last * 2) / 3), last])
  );
}

/** Build a date from month/year keeping day clamped */
export function dateInMonthYear(
  dateString: string,
  year: number,
  monthIndex: number
): string {
  const currentDay = Number(dateString.slice(8, 10)) || 1;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(currentDay, lastDay);
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Check if a date is within the last N days */
export function inLastDays(date: string, days: number, selectedDate?: string): boolean {
  const base = selectedDate || todayISO();
  const start = addDays(base, -(days - 1));
  return date >= start && date <= base;
}

/** Parse comma-decimal input ("75,5" → 75.5) */
export function parseDecimalInput(value: string): number {
  const normalized = String(value).replace(',', '.');
  return parseFloat(normalized) || 0;
}

/** Greeting based on hour of day */
export function getGreetingKey(): 'greeting_morning' | 'greeting_afternoon' | 'greeting_evening' | 'greeting_night' {
  const hour = new Date().getHours();
  if (hour < 11) return 'greeting_morning';
  if (hour < 15) return 'greeting_afternoon';
  if (hour < 18) return 'greeting_evening';
  return 'greeting_night';
}

/** Generate a UUID */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Math.random fallback that produces a valid RFC4122 v4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Priority sort weight */
export function priorityWeight(priority: string): number {
  return { Low: 1, Medium: 2, High: 3 }[priority] || 2;
}

/** Safe URL (prefix https:// if missing) */
export function safeUrl(url: string | undefined | null): string {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, '')}`;
}

/** Year options for calendar controls */
export function yearOptions(selectedYear: number, extraYears: number[] = []): number[] {
  const currentYear = new Date().getFullYear();
  const allYears = [currentYear - 2, currentYear + 3, selectedYear, ...extraYears].filter(
    (y) => Number.isFinite(y)
  );
  const min = Math.min(...allYears);
  const max = Math.max(...allYears);
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}
