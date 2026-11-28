'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PeriodNavigator } from '@/components/ui/PeriodNavigator';
import { useLifeOS, LifeOSState } from '@/lib/hooks/useLifeOSState';
import { useCollection } from '@/lib/hooks/useCollection';
import { useI18n } from '@/lib/i18n/context';
import { childPeriods, fromISO, getPeriod, inRange, PeriodRange, PeriodType, periodProgress, toISO } from '@/lib/period';
import type { GoalTarget } from '@/lib/lifeGoals';
import { summarize } from '@/lib/periodSummary';
import type { LifeRecord } from '@/lib/recordKinds';

const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
const daysIn = (r: PeriodRange) => Math.round((fromISO(r.end).getTime() - fromISO(r.start).getTime()) / 86400000) + 1;

/** One report for any day, week, month, quarter or year. */
export default function ReportsPage() {
  const { state } = useLifeOS();
  const { locale } = useI18n();
  const id = locale === 'id';
  const targets = useCollection<GoalTarget>('goal_targets');
  const records = useCollection<LifeRecord>('life_records');
  const today = toISO(new Date());
  const [type, setType] = useState<PeriodType>('month');
  const [anchor, setAnchor] = useState(state.selectedDate || today);

  const period = getPeriod(type, anchor, id ? 'id' : 'en');
  const prev = getPeriod(type, (() => { const d = fromISO(period.start); d.setDate(d.getDate() - 1); return toISO(d); })(), id ? 'id' : 'en');
  const cur = useMemo(() => summarize(state, period, today, targets.items, records.items), [state, period.start, period.end, today, targets.items, records.items]);
  const old = useMemo(() => summarize(state, prev, today, targets.items, records.items), [state, prev.start, prev.end, today, targets.items, records.items]);
  const children = useMemo(() => childPeriods(period, id ? 'id' : 'en').map((c) => ({ c, s: summarize(state, c, today, targets.items, records.items) })), [state, period.start, period.end, today, targets.items, records.items, id]);
  const prog = periodProgress(period, today);

  const delta = (a: number, b: number, unit = '') => {
    if (!b && !a) return null;
    const d = a - b;
    return `${d >= 0 ? '+' : ''}${Math.round(d * 10) / 10}${unit} ${id ? 'vs sebelumnya' : 'vs previous'}`;
  };

  const reviewPeriod = type === 'day' ? 'daily' : type === 'week' ? 'weekly' : type === 'month' ? 'monthly' : 'yearly';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        stamp
        title={id ? 'Laporan' : 'Reports'}
        subtitle={id ? 'Semua modul dalam satu periode. Batas kalender: Senin–Minggu, akhir bulan, akhir kuartal, 31 Desember.' : 'Every module for one period.'}
        actions={<Button href={`/reviews/write?period=${reviewPeriod}`} variant="primary" icon="edit">{id ? 'Tulis review periode ini' : 'Review this period'}</Button>}
      />

      <PeriodNavigator type={type} anchor={anchor} onChange={(t, a) => { setType(t); setAnchor(a); }} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Surface variant="hero" className="p-4 md:p-5 col-span-2 flex flex-col gap-3">
          <span className="text-[13px] text-muted-foreground">{id ? 'Tugas selesai' : 'Tasks done'}</span>
          <p className="figure-hero">{cur.tasksDone}<span className="unit">/ {cur.tasksDue}</span></p>
          <div className="h-1.5 rounded-full bg-white/30 overflow-hidden"><div className="h-full bg-white rounded-full" style={{ width: `${cur.tasksDue ? (cur.tasksDone / cur.tasksDue) * 100 : 0}%` }} /></div>
          <span className="text-xs text-muted-foreground">
            {id ? `Periode berjalan ${Math.round((prog.elapsed / prog.total) * 100)}% · ${cur.completedIn} tugas ditutup di periode ini` : `${Math.round((prog.elapsed / prog.total) * 100)}% elapsed`}
          </span>
        </Surface>
        <Stat label={id ? 'Konsistensi habit' : 'Habit consistency'} value={`${Math.round(cur.habitPct)}`} unit="%" hint={delta(cur.habitPct, old.habitPct, '%')} />
        <Stat label={id ? 'Target goals' : 'Goal targets'} value={`${cur.targetsDone}`} unit={`/ ${cur.targetsTotal}`} hint={id ? 'Dari Goals Tahunan' : 'From Annual Goals'} href="/goals/annual" />
      </div>

      {children.length > 0 && (
        <Surface className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">{id ? 'Rincian per' : 'Breakdown by'} {({ year: id ? 'kuartal' : 'quarter', quarter: id ? 'bulan' : 'month', month: id ? 'minggu' : 'week', week: id ? 'hari' : 'day', day: '' } as Record<PeriodType, string>)[type]}</h2>
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />{id ? 'Tugas selesai' : 'Tasks done'}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-200 dark:bg-blue-900" />Habit %</span>
            </span>
          </div>
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex items-end gap-3 h-48 min-w-max md:min-w-0">
              {children.map(({ c, s }) => {
                const maxT = Math.max(1, ...children.map((x) => x.s.tasksDone));
                const isNow = today >= c.start && today <= c.end;
                return (
                  <button
                    key={c.start} type="button" onClick={() => { setType(c.type); setAnchor(c.start); }}
                    className="flex-1 min-w-[44px] h-full flex flex-col items-center justify-end gap-2 group"
                    aria-label={`${c.label}: ${s.tasksDone} ${id ? 'tugas' : 'tasks'}, habit ${Math.round(s.habitPct)}%`}
                  >
                    <div className="flex items-end gap-1 h-full w-full justify-center">
                      <span className="w-3 md:w-4 rounded-full bg-blue-500 transition-[height] group-hover:opacity-80" style={{ height: `${Math.max(4, (s.tasksDone / maxT) * 100)}%` }} />
                      <span className="w-3 md:w-4 rounded-full bg-blue-200 dark:bg-blue-900 transition-[height]" style={{ height: `${Math.max(4, s.habitPct)}%` }} />
                    </div>
                    <span className={isNow ? 'text-xs font-semibold text-foreground' : 'text-xs text-muted-foreground'}>{c.short}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">{id ? 'Ketuk batang untuk masuk ke periode itu.' : 'Tap a bar to open that period.'}</p>
        </Surface>
      )}

      <section aria-label={id ? 'Ringkasan modul' : 'Module summary'} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat icon="journal" label={id ? 'Jurnal' : 'Journal'} value={`${cur.journalCount}`} unit={`/ ${Math.min(daysIn(period), prog.elapsed)} ${id ? 'hari' : 'days'}`} hint={cur.mood ? `Mood ${cur.mood.toFixed(1)} · ${id ? 'Energi' : 'Energy'} ${cur.energy.toFixed(1)}` : (id ? 'Belum ada entri' : 'No entries')} href="/journal" />
        <Stat icon="wallet" label={id ? 'Arus kas bersih' : 'Net cash flow'} value={rupiah(cur.net)} hint={`${id ? 'Masuk' : 'In'} ${rupiah(cur.income)} · ${id ? 'Keluar' : 'Out'} ${rupiah(cur.expense)}`} href="/finance" />
        <Stat icon="dumbbell" label="Workout" value={`${cur.workoutCount}`} unit={id ? 'sesi' : 'sessions'} hint={`${cur.workoutMin} ${id ? 'menit' : 'min'} · ${delta(cur.workoutCount, old.workoutCount) || ''}`} href="/health/workout" />
        <Stat icon="apple" label={id ? 'Nutrisi' : 'Nutrition'} value={`${Math.round(cur.kcalPerDay)}`} unit={id ? 'kkal/hari' : 'kcal/day'} hint={cur.weightDelta === null ? (id ? 'Berat belum tercatat 2x' : 'Weight not logged twice') : `${id ? 'Berat' : 'Weight'} ${cur.weightDelta >= 0 ? '+' : ''}${cur.weightDelta.toFixed(1)} kg`} href="/health/nutrition" />
        <Stat icon="book" label={id ? 'Belajar' : 'Learning'} value={`${cur.learnMin}`} unit={id ? 'menit' : 'min'} hint={delta(cur.learnMin, old.learnMin, 'm')} href="/learning" />
        <Stat icon="clock" label={id ? 'Fokus' : 'Focus'} value={`${cur.focusMin}`} unit={id ? 'menit' : 'min'} hint={delta(cur.focusMin, old.focusMin, 'm')} href="/focus" />
        <Stat icon="moon" label={id ? 'Tidur rata-rata' : 'Avg sleep'} value={cur.sleepAvg ? cur.sleepAvg.toFixed(1) : '—'} unit={id ? 'jam' : 'h'} hint={id ? 'Dari log tidur' : 'From sleep logs'} />
        <Stat icon="review" label="Review" value={`${cur.reviews}`} unit={id ? 'ditulis' : 'written'} hint={id ? `Evaluasi periode ini · ${cur.notes} catatan` : `Reviews · ${cur.notes} notes`} href="/reviews" />
        <Stat icon="droplet" label={id ? 'Air minum' : 'Water'} value={cur.waterAvg ? cur.waterAvg.toFixed(1) : '—'} unit={id ? 'gelas/hari' : 'glasses/day'} hint={id ? 'Target 8 gelas' : 'Goal 8 glasses'} href="/health" />
        <Stat icon="moon" label={id ? 'Ibadah 5 waktu' : 'Daily prayers'} value={`${Math.round(cur.prayerPct)}`} unit="%" hint={delta(cur.prayerPct, old.prayerPct, '%')} href="/" />
        <Stat icon="chartBar" label={id ? 'Anggaran terpakai' : 'Budget used'} value={cur.budgetPct === null ? '—' : `${Math.round(cur.budgetPct)}`} unit={cur.budgetPct === null ? undefined : '%'} hint={cur.budget ? `${rupiah(cur.expense)} / ${rupiah(cur.budget)}` : (id ? 'Atur anggaran bulanan' : 'Set a monthly budget')} href="/finance/budget" />
        <Stat icon="fileText" label={id ? 'Catatan & buku' : 'Notebooks'} value={`${cur.notes}`} unit={id ? 'entri' : 'entries'} hint={id ? 'Keputusan, rapat, bacaan, debrief…' : 'Decisions, meetings, reading…'} />
      </section>
    </div>
  );
}

function Stat({ label, value, unit, hint, icon, href }: { label: string; value: string; unit?: string; hint?: string | null; icon?: string; href?: string }) {
  const body = (
    <Surface className="p-4 md:p-5 flex flex-col gap-3 h-full glass-hover">
      <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
        {icon && <span className="icon-tile w-7 h-7"><Icon name={icon} size={14} /></span>}
        <span className="truncate flex-1">{label}</span>
        {href && <Icon name="arrowUpRight" size={14} />}
      </span>
      <p className="figure-lg text-[26px] md:text-[30px] truncate">{value}{unit && <span className="unit">{unit}</span>}</p>
      {hint && <span className="text-xs text-muted-foreground line-clamp-2">{hint}</span>}
    </Surface>
  );
  return href ? <Link href={href} className="block rounded-xl">{body}</Link> : body;
}
