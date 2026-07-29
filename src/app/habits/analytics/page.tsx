'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { LineChart } from '@/components/ui/LineChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  formatDate, 
  monthLabel, 
  monthDays, 
  toISODate, 
  percent, 
  avg,
  yearOptions,
  addDays
} from '@/lib/utils';

export default function HabitsAnalyticsPage() {
  const { state } = useLifeOS();
  const { t, locale } = useI18n();
  const today = state.selectedDate;
  const todayDate = new Date(`${today}T00:00:00`);

  const [chartMonth, setChartMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeos_habits_chart_month');
      if (saved !== null) return Number(saved);
    }
    return todayDate.getMonth();
  });
  const [chartYear, setChartYear] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeos_habits_chart_year');
      if (saved !== null) return Number(saved);
    }
    return todayDate.getFullYear();
  });

  const [recapPeriod, setRecapPeriod] = useState<'30days' | 'month' | 'year'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeos_habits_recap_period');
      if (saved === '30days' || saved === 'month' || saved === 'year') return saved;
    }
    return '30days';
  });

  const [recapMonth, setRecapMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeos_habits_recap_month');
      if (saved !== null) return Number(saved);
    }
    return todayDate.getMonth();
  });
  const [recapMonthYear, setRecapMonthYear] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeos_habits_recap_month_year');
      if (saved !== null) return Number(saved);
    }
    return todayDate.getFullYear();
  });
  const [recapYear, setRecapYear] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeos_habits_recap_year');
      if (saved !== null) return Number(saved);
    }
    return todayDate.getFullYear();
  });

  const recapMonthDateStr = `${recapMonthYear}-${String(recapMonth + 1).padStart(2, '0')}-15`;
  const recapDaysInMonth = monthDays(recapMonthDateStr);

  const getCompletionPercent = (date: string) => {
    if (!state.habits.length) return 0;
    const done = state.habits.filter((h) => 
      state.habitLogs.some((log) => log.habitId === h.id && log.date === date)
    ).length;
    return percent(done, state.habits.length);
  };

  const getHabitStreak = (habitId: string, fromDate = today) => {
    let streak = 0;
    let cursor = fromDate;
    const isDone = (hId: string, d: string) =>
      state.habitLogs.some((l) => l.habitId === hId && l.date === d);

    while (isDone(habitId, cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  };

  const navigateChartMonth = (direction: 'prev' | 'next') => {
    let m = chartMonth;
    let y = chartYear;
    if (direction === 'prev') {
      if (chartMonth === 0) {
        m = 11;
        y = chartYear - 1;
      } else {
        m = chartMonth - 1;
      }
    } else {
      if (chartMonth === 11) {
        m = 0;
        y = chartYear + 1;
      } else {
        m = chartMonth + 1;
      }
    }
    setChartMonth(m);
    setChartYear(y);
    localStorage.setItem('lifeos_habits_chart_month', String(m));
    localStorage.setItem('lifeos_habits_chart_year', String(y));
  };

  const navigateRecapMonth = (direction: 'prev' | 'next') => {
    let m = recapMonth;
    let y = recapMonthYear;
    if (direction === 'prev') {
      if (recapMonth === 0) {
        m = 11;
        y = recapMonthYear - 1;
      } else {
        m = recapMonth - 1;
      }
    } else {
      if (recapMonth === 11) {
        m = 0;
        y = recapMonthYear + 1;
      } else {
        m = recapMonth + 1;
      }
    }
    setRecapMonth(m);
    setRecapMonthYear(y);
    localStorage.setItem('lifeos_habits_recap_month', String(m));
    localStorage.setItem('lifeos_habits_recap_month_year', String(y));
  };

  const chartDaysStr = `${chartYear}-${String(chartMonth + 1).padStart(2, '0')}-01`;
  const chartDays = monthDays(chartDaysStr);
  const chartPoints = chartDays.map((day) => ({
    label: day.slice(-2),
    value: getCompletionPercent(day),
    dateStr: day,
  }));

  const months = Array.from({ length: 12 }, (_, index) => ({
    value: index,
    label: new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { month: 'long' }).format(
      new Date(chartYear, index, 1)
    ),
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/habits">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="barChart" size={24} className="text-cyan-500" />
            {t('habits_analytics')}
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Analisis performa dan tingkat penyelesaian kebiasaan Anda.
          </p>
        </div>
      </div>

      <Surface className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-life-line pb-3 mb-6">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('habits_monthly_progress')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {t('habits_monthly_pct')} {monthLabel(chartDaysStr, locale === 'id' ? 'id-ID' : 'en-US')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateChartMonth('prev')}
              className="w-7 h-7 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
            >
              <Icon name="chevronLeft" size={12} />
            </button>
            <select
              value={chartMonth}
              onChange={(e) => {
                setChartMonth(Number(e.target.value));
                localStorage.setItem('lifeos_habits_chart_month', e.target.value);
              }}
              className="glass-select text-xs py-1.5"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={chartYear}
              onChange={(e) => {
                setChartYear(Number(e.target.value));
                localStorage.setItem('lifeos_habits_chart_year', e.target.value);
              }}
              className="glass-select text-xs py-1.5"
            >
              {yearOptions(chartYear).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => navigateChartMonth('next')}
              className="w-7 h-7 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
            >
              <Icon name="chevronRight" size={12} />
            </button>
          </div>
        </div>

        <LineChart 
          points={chartPoints} 
          title="Habit Monthly Completion Rate" 
          minVal={0} 
          maxVal={100} 
        />

        <div className="flex flex-wrap gap-4 mt-6">
          <Badge tone="teal">
            {`${t('habits_avg')} ${Math.round(avg(chartPoints.map((p) => p.value || 0)))}%`}
          </Badge>
          <Badge tone="green">
            {`${chartPoints.filter((p) => p.value === 100).length} ${t('habits_full_days')}`}
          </Badge>
          <Badge tone="amber">
            {`${chartPoints.filter((p) => p.value > 0 && p.value < 100).length} ${t('habits_partial_days')}`}
          </Badge>
        </div>
      </Surface>

      <Surface className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-life-line pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('habits_monthly_detail')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {recapPeriod === '30days' && t('habits_recap_30days')}
              {recapPeriod === 'month' && `${t('habits_recap_month')} - ${monthLabel(recapMonthDateStr, locale === 'id' ? 'id-ID' : 'en-US')}`}
              {recapPeriod === 'year' && `${t('habits_recap_year')} - ${recapYear}`}
            </p>
          </div>

          <div className="flex bg-white/[0.02] border border-life-line rounded-lg p-0.5 max-w-max self-start sm:self-auto select-none">
            {['30days', 'month', 'year'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setRecapPeriod(p as any);
                  localStorage.setItem('lifeos_habits_recap_period', p);
                }}
                className={`px-3 py-1 text-[10px] font-black uppercase rounded transition-all ${
                  recapPeriod === p
                    ? 'bg-life-teal text-white shadow-sm'
                    : 'text-life-muted hover:text-life-text'
                }`}
              >
                {p === '30days' ? t('habits_recap_30days') : p === 'month' ? t('habits_recap_month') : t('habits_recap_year')}
              </button>
            ))}
          </div>
        </div>

        {recapPeriod === 'month' && (
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => navigateRecapMonth('prev')}
              className="w-7 h-7 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
            >
              <Icon name="chevronLeft" size={12} />
            </button>
            <select
              value={recapMonth}
              onChange={(e) => {
                setRecapMonth(Number(e.target.value));
                localStorage.setItem('lifeos_habits_recap_month', e.target.value);
              }}
              className="glass-select text-xs py-1.5"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={recapMonthYear}
              onChange={(e) => {
                setRecapMonthYear(Number(e.target.value));
                localStorage.setItem('lifeos_habits_recap_month_year', e.target.value);
              }}
              className="glass-select text-xs py-1.5"
            >
              {yearOptions(recapMonthYear).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => navigateRecapMonth('next')}
              className="w-7 h-7 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
            >
              <Icon name="chevronRight" size={12} />
            </button>
          </div>
        )}

        {recapPeriod === 'year' && (
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                const y = recapYear - 1;
                setRecapYear(y);
                localStorage.setItem('lifeos_habits_recap_year', String(y));
              }}
              className="w-7 h-7 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
            >
              <Icon name="chevronLeft" size={12} />
            </button>
            <select
              value={recapYear}
              onChange={(e) => {
                setRecapYear(Number(e.target.value));
                localStorage.setItem('lifeos_habits_recap_year', e.target.value);
              }}
              className="glass-select text-xs py-1.5"
            >
              {yearOptions(recapYear).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const y = recapYear + 1;
                setRecapYear(y);
                localStorage.setItem('lifeos_habits_recap_year', String(y));
              }}
              className="w-7 h-7 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
            >
              <Icon name="chevronRight" size={12} />
            </button>
          </div>
        )}

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {state.habits.length > 0 ? (
            state.habits.map((habit) => {
              let logsCount = 0;
              let totalDays = 30;
              let rate = 0;
              let labelText = '';

              if (recapPeriod === '30days') {
                logsCount = Array.from({ length: 30 }).filter((_, index) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (29 - index));
                  const dayStr = toISODate(d);
                  return state.habitLogs.some((l) => l.habitId === habit.id && l.date === dayStr);
                }).length;
                totalDays = 30;
                rate = percent(logsCount, totalDays);
                labelText = `${logsCount} ${t('habits_of')} 30 ${t('days')} (${t('habits_monthly_progress')}: ${rate}%)`;
              } else if (recapPeriod === 'month') {
                logsCount = recapDaysInMonth.filter((d) =>
                  state.habitLogs.some((l) => l.habitId === habit.id && l.date === d)
                ).length;
                totalDays = recapDaysInMonth.length;
                rate = percent(logsCount, totalDays);
                labelText = `${logsCount} ${t('habits_of')} ${totalDays} ${t('days')} (${t('habits_monthly_progress')}: ${rate}%)`;
              } else {
                logsCount = state.habitLogs.filter(
                  (l) => l.habitId === habit.id && l.date.startsWith(`${recapYear}-`)
                ).length;
                const isLeap = (recapYear % 4 === 0 && recapYear % 100 !== 0) || (recapYear % 400 === 0);
                totalDays = isLeap ? 366 : 365;
                rate = percent(logsCount, totalDays);
                labelText = `${logsCount} ${t('habits_of')} ${totalDays} ${t('days')} (${t('habits_monthly_progress')}: ${rate}%)`;
              }

              return (
                <div key={habit.id} className="p-4 rounded-xl bg-white/[0.005] border border-life-line space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-sm text-life-text block tracking-tight">{habit.name}</strong>
                      <span className="text-[10px] font-black text-life-muted uppercase tracking-wider mt-1 block">
                        Area: {habit.area} / Streak: {getHabitStreak(habit.id)} {t('days')}
                      </span>
                    </div>
                    <Badge tone={rate >= 80 ? 'green' : rate >= 50 ? 'teal' : 'amber'}>
                      {`${rate}%`}
                    </Badge>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-life-line">
                    <div className="flex justify-between items-center text-[10px] text-life-muted font-bold uppercase">
                      <span>{labelText}</span>
                    </div>

                    {recapPeriod === '30days' && (
                      <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-black/20 border border-white/[0.02] max-w-max">
                        {Array.from({ length: 30 }, (_, index) => {
                          const d = new Date();
                          d.setDate(d.getDate() - (29 - index));
                          const dayStr = toISODate(d);
                          const isCompleted = state.habitLogs.some((l) => l.habitId === habit.id && l.date === dayStr);
                          return (
                            <div
                              key={dayStr}
                              title={formatDate(dayStr)}
                              className={`w-3.5 h-3.5 rounded-sm shrink-0 ${
                                isCompleted 
                                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_6px_rgba(16,185,129,0.3)] scale-[1.05]' 
                                  : 'bg-white/[0.03] border border-white/[0.02]'
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}

                    {recapPeriod === 'month' && (
                      <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-black/20 border border-white/[0.02] max-w-max">
                        {recapDaysInMonth.map((dayStr) => {
                          const isCompleted = state.habitLogs.some((l) => l.habitId === habit.id && l.date === dayStr);
                          return (
                            <div
                              key={dayStr}
                              title={formatDate(dayStr)}
                              className={`w-3.5 h-3.5 rounded-sm shrink-0 ${
                                isCompleted 
                                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_6px_rgba(16,185,129,0.3)] scale-[1.05]' 
                                  : 'bg-white/[0.03] border border-white/[0.02]'
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}

                    {recapPeriod === 'year' && (
                      <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 p-1">
                        <div className="flex flex-col gap-1 min-w-[480px]">
                          {Array.from({ length: 12 }, (_, mIdx) => {
                            const dateStr = `${recapYear}-${String(mIdx + 1).padStart(2, '0')}-01`;
                            const mDays = monthDays(dateStr);
                            const mName = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { month: 'short' }).format(new Date(recapYear, mIdx, 1));
                            return (
                              <div key={mIdx} className="flex items-center gap-2">
                                <span className="w-8 text-[9px] font-bold text-life-muted uppercase shrink-0 text-left">{mName}</span>
                                <div className="flex gap-0.5">
                                  {Array.from({ length: 31 }, (_, dIdx) => {
                                    if (dIdx >= mDays.length) return <div key={dIdx} className="w-2.5 h-2.5 rounded-sm bg-transparent opacity-0 shrink-0" />;
                                    const dayStr = mDays[dIdx];
                                    const isCompleted = state.habitLogs.some((l) => l.habitId === habit.id && l.date === dayStr);
                                    return (
                                      <div
                                        key={dayStr}
                                        title={formatDate(dayStr)}
                                        className={`w-2.5 h-2.5 rounded-sm shrink-0 ${
                                          isCompleted ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_4px_rgba(16,185,129,0.3)] scale-[1.05]' : 'bg-white/[0.03] border border-white/[0.02]'
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState />
          )}
        </div>
      </Surface>
    </div>
  );
}
