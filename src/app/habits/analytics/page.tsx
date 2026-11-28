'use client';

import React, { useMemo, useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { PageHeader } from '@/components/layout/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/Badge';
import { LineChart } from '@/components/ui/LineChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { PeriodNavigator } from '@/components/ui/PeriodNavigator';
import { formatDate, percent, avg, addDays } from '@/lib/utils';
import { fromISO, getPeriod, PeriodType, shiftPeriod, toISO } from '@/lib/period';

const daysOf = (start: string, end: string) => {
  const out: string[] = [];
  for (const d = fromISO(start); toISO(d) <= end; d.setDate(d.getDate() + 1)) out.push(toISO(d));
  return out;
};

/** Habit completion for any week, month, quarter or year (same navigator as Reports). */
export default function HabitsAnalyticsPage() {
  const { state } = useLifeOS();
  const { t, locale } = useI18n();
  const lang = locale === 'id' ? 'id' : 'en';
  const today = toISO(new Date());
  const [type, setType] = useState<PeriodType>('month');
  const [anchor, setAnchor] = useState(state.selectedDate || today);
  const period = getPeriod(type, anchor, lang);

  const logSet = useMemo(() => new Set(state.habitLogs.map((l) => `${l.habitId}|${l.date}`)), [state.habitLogs]);
  const done = (hId: string, d: string) => logSet.has(`${hId}|${d}`);
  const dayPct = (d: string) => (state.habits.length ? percent(state.habits.filter((h) => done(h.id, d)).length, state.habits.length) : 0);

  const days = useMemo(() => daysOf(period.start, period.end), [period.start, period.end]);
  const elapsed = days.filter((d) => d <= today);
  const daily = days.length <= 31;

  const months = useMemo(() => {
    if (days.length <= 31) return [];
    const out = [];
    for (let cur = period.start; cur <= period.end; cur = shiftPeriod('month', cur, 1)) out.push(getPeriod('month', cur, lang));
    return out;
  }, [days.length, period.start, period.end, lang]);

  const points = daily
    ? days.map((d) => ({ label: type === 'week' ? fromISO(d).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' }) : d.slice(-2), value: d <= today ? dayPct(d) : 0, dateStr: d }))
    : months.map((c) => {
      const ds = daysOf(c.start, c.end).filter((d) => d <= today);
      return { label: c.short, value: ds.length ? Math.round(avg(ds.map(dayPct))) : 0, dateStr: c.start };
    });
  const elapsedPcts = elapsed.map(dayPct);

  const streak = (hId: string) => {
    let n = 0, cur = today;
    while (done(hId, cur)) { n += 1; cur = addDays(cur, -1); }
    return n;
  };


  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader back="/habits" title={t('habits_analytics')} subtitle={lang === 'id' ? 'Tingkat penyelesaian kebiasaan per minggu, bulan, kuartal, atau tahun.' : 'Habit completion by week, month, quarter or year.'} />

      <PeriodNavigator types={['week', 'month', 'quarter', 'year']} type={type} anchor={anchor} onChange={(ty, a) => { setType(ty); setAnchor(a); }} />

      <Surface className="p-4 md:p-6">
        <div className="mb-4">
          <h2 className="section-title">{t('habits_monthly_progress')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {daily ? (lang === 'id' ? 'Persentase habit selesai per hari' : 'Daily completion') : (lang === 'id' ? 'Rata-rata harian per bulan' : 'Average daily completion per month')} · {period.label}
          </p>
        </div>
        <LineChart points={points} title="Habit completion rate" minVal={0} maxVal={100} />
        <div className="flex flex-wrap gap-2 mt-5">
          <Badge tone="teal">{`${t('habits_avg')} ${Math.round(avg(elapsedPcts))}%`}</Badge>
          <Badge tone="green">{`${elapsedPcts.filter((p) => p === 100).length} ${t('habits_full_days')}`}</Badge>
          <Badge tone="amber">{`${elapsedPcts.filter((p) => p > 0 && p < 100).length} ${t('habits_partial_days')}`}</Badge>
        </div>
      </Surface>

      <Surface className="p-4 md:p-6">
        <div className="mb-4">
          <h2 className="section-title">{t('habits_monthly_detail')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{period.label} · {elapsed.length} {t('days')} {lang === 'id' ? 'berjalan' : 'elapsed'}</p>
        </div>

        {state.habits.length === 0 ? <EmptyState /> : (
          <ul className="space-y-3">
            {state.habits.map((h) => {
              const count = elapsed.filter((d) => done(h.id, d)).length;
              const rate = percent(count, Math.max(elapsed.length, 1));
              return (
                <li key={h.id} className="well space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{h.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {h.area} · Streak {streak(h.id)} {t('days')} · {count} {t('habits_of')} {elapsed.length} {t('days')}
                      </p>
                    </div>
                    <Badge tone={rate >= 80 ? 'green' : rate >= 50 ? 'teal' : 'amber'}>{`${rate}%`}</Badge>
                  </div>
                  {daily ? (
                    <div className="flex flex-wrap gap-1">
                      {days.map((d) => <Dot key={d} d={d} on={done(h.id, d)} future={d > today} />)}
                    </div>
                  ) : (
                    <div className="overflow-x-auto no-scrollbar">
                      <div className="flex flex-col gap-1 min-w-[420px]">
                        {months.map((m) => (
                          <div key={m.start} className="flex items-center gap-2">
                            <span className="w-9 text-xs text-muted-foreground shrink-0">{m.short}</span>
                            <div className="flex gap-0.5">
                              {daysOf(m.start, m.end).map((d) => <Dot key={d} d={d} on={done(h.id, d)} future={d > today} small />)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Surface>
    </div>
  );
}

function Dot({ d, on, future, small }: { d: string; on: boolean; future: boolean; small?: boolean }) {
  return (
    <span
      title={formatDate(d)}
      className={`${small ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} rounded-sm shrink-0 ${on ? 'bg-emerald-500' : future ? 'bg-transparent border border-dashed border-gray-300 dark:border-gray-600' : 'bg-card border border-gray-300 dark:border-gray-600'}`}
    />
  );
}
