'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PeriodNavigator } from '@/components/ui/PeriodNavigator';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useCollection } from '@/lib/hooks/useCollection';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { getPeriod, inRange, PeriodType, toISO } from '@/lib/period';
import { summarize } from '@/lib/periodSummary';
import { LIFE_GOAL_CATEGORIES, GoalTarget, LifeGoal } from '@/lib/lifeGoals';
import type { LifeRecord } from '@/lib/recordKinds';

const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

type Prompt = { key: string; id: string; en: string; ph: string };
const MONTH_PROMPTS: Prompt[] = [
  { key: 'wins', id: 'Pencapaian bulan ini', en: 'Wins this month', ph: 'Apa yang berhasil diselesaikan?' },
  { key: 'stop', id: 'Hentikan', en: 'Stop', ph: 'Kebiasaan atau aktivitas yang merugikan' },
  { key: 'continue', id: 'Lanjutkan', en: 'Continue', ph: 'Yang terbukti bekerja dan perlu dipertahankan' },
  { key: 'start', id: 'Mulai', en: 'Start', ph: 'Hal baru yang perlu dicoba bulan depan' },
  { key: 'focus', id: 'Fokus bulan depan', en: 'Focus next month', ph: '1–3 hal terpenting' },
];
const QUARTER_PROMPTS: Prompt[] = [
  { key: 'worked', id: 'Yang berhasil kuartal ini', en: 'What worked', ph: 'Strategi, kebiasaan, keputusan yang membuahkan hasil' },
  { key: 'notWorked', id: 'Yang tidak berhasil', en: 'What didn’t work', ph: 'Target meleset dan penyebabnya' },
  { key: 'goals', id: 'Evaluasi goals prioritas', en: 'Priority goals check', ph: 'Masih relevan? Perlu diubah, dipercepat, atau dilepas?' },
  { key: 'stop', id: 'Hentikan', en: 'Stop', ph: '' },
  { key: 'continue', id: 'Lanjutkan', en: 'Continue', ph: '' },
  { key: 'start', id: 'Mulai', en: 'Start', ph: '' },
  { key: 'focus', id: 'Fokus kuartal depan', en: 'Focus next quarter', ph: 'Tiga hasil utama yang dikejar' },
];

/** Monthly review (sheet 12, stop / continue / start) and quarterly reset (sheet 03). */
export default function PeriodReviewPage() {
  const { state } = useLifeOS();
  const { locale } = useI18n();
  const id = locale === 'id';
  const lang = id ? 'id' : 'en';
  const today = toISO(new Date());
  const [type, setType] = useState<PeriodType>('month');
  const [anchor, setAnchor] = useState(state.selectedDate || today);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('type');
    if (q === 'quarter' || q === 'month') setType(q);
  }, []);

  const reviews = useCollection<LifeRecord>('life_records', { kind: 'period_review' });
  const targets = useCollection<GoalTarget>('goal_targets');
  const goals = useCollection<LifeGoal>('life_goals');

  const period = getPeriod(type, anchor, lang);
  const record = reviews.items.find((r) => r.date === period.start && r.data?.periodType === type);
  const prompts = type === 'quarter' ? QUARTER_PROMPTS : MONTH_PROMPTS;

  const [draft, setDraft] = useState<Record<string, any>>({});
  const [saved, setSaved] = useState(false);
  useEffect(() => { setDraft(record?.data || { score: 7 }); setSaved(false); }, [record?.id, period.start, type]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = useMemo(() => summarize(state, period, today, targets.items), [state, period.start, period.end, today, targets.items]); // eslint-disable-line react-hooks/exhaustive-deps

  const year = Number(period.start.slice(0, 4));
  const priorities = goals.items.filter((g) => g.priorityYear === year);
  const periodTargets = targets.items.filter((t) => t.periodType === type && t.periodStart === period.start);
  const innerTargets = targets.items.filter((t) => inRange(t.periodStart, period));

  const save = async () => {
    const data = { ...draft, periodType: type };
    if (record) await reviews.update(record.id, { data });
    else await reviews.add({ kind: 'period_review', date: period.start, title: period.label, data } as Omit<LifeRecord, 'id' | 'createdAt'>);
    setSaved(true);
  };

  const history = reviews.items
    .filter((r) => r.data?.periodType === type)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        back="/reviews"
        title={id ? 'Evaluasi Bulanan & Kuartalan' : 'Monthly & Quarterly Review'}
        subtitle={id ? 'Hentikan, lanjutkan, mulai. Tutup periode dengan keputusan, bukan hanya catatan.' : 'Stop, continue, start. Close each period with decisions.'}
        actions={<Button href="/reports" variant="secondary" icon="barChart">{id ? 'Laporan lengkap' : 'Full report'}</Button>}
      />

      <PeriodNavigator types={['month', 'quarter']} type={type} anchor={anchor} onChange={(t, a) => { setType(t); setAnchor(a); }} />

      {reviews.error === 'migration' && (
        <Surface variant="soft" className="p-4 text-sm">
          {id ? 'Jalankan supabase/migrations/025_life_records.sql agar evaluasi tersimpan ke akun.' : 'Run migration 025 to save reviews.'}
        </Surface>
      )}

      {/* Period figures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Fig label={id ? 'Tugas selesai' : 'Tasks done'} value={`${s.tasksDone}/${s.tasksDue}`} />
        <Fig label={id ? 'Konsistensi habit' : 'Habit rate'} value={`${Math.round(s.habitPct)}%`} />
        <Fig label={id ? 'Target goals' : 'Goal targets'} value={`${s.targetsDone}/${s.targetsTotal}`} />
        <Fig label={id ? 'Arus kas bersih' : 'Net cashflow'} value={rupiah(s.net)} tone={s.net < 0 ? 'neg' : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Form */}
        <Surface className="lg:col-span-7 p-4 md:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="section-title">{type === 'quarter' ? (id ? 'Quarterly reset' : 'Quarterly reset') : (id ? 'Review bulanan' : 'Monthly review')}</h2>
            {record && <span className="status bg-success/10 text-success">{id ? 'Tersimpan' : 'Saved'}</span>}
          </div>

          <fieldset>
            <legend className="label mb-2">{id ? 'Nilai periode ini' : 'Score this period'} <span className="tabular-nums text-foreground">{draft.score || 7}/10</span></legend>
            <div className="grid grid-cols-10 gap-1" role="radiogroup">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" role="radio" aria-checked={(draft.score || 7) === n}
                  className={cn('h-10 rounded-md border text-sm tabular-nums !min-h-0', (draft.score || 7) === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')}
                  onClick={() => setDraft((d) => ({ ...d, score: n }))}>{n}</button>
              ))}
            </div>
          </fieldset>

          {prompts.map((p) => (
            <label key={p.key} className="block space-y-1.5">
              <span className={cn('label', ['stop', 'continue', 'start'].includes(p.key) && 'flex items-center gap-1.5')}>
                {p.key === 'stop' && <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden />}
                {p.key === 'continue' && <span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden />}
                {p.key === 'start' && <span className="w-2 h-2 rounded-full bg-success" aria-hidden />}
                {p[lang]}
              </span>
              <textarea className="glass-input min-h-[80px] resize-y" value={draft[p.key] || ''} placeholder={id ? p.ph : ''}
                onChange={(e) => { setDraft((d) => ({ ...d, [p.key]: e.target.value })); setSaved(false); }} />
            </label>
          ))}

          <div className="flex items-center justify-end gap-3 pt-1">
            {saved && <span className="text-xs text-success flex items-center gap-1"><Icon name="check" size={12} />{id ? 'Tersimpan' : 'Saved'}</span>}
            <Button variant="primary" icon="check" onClick={save} className="w-full sm:w-auto">{record ? (id ? 'Perbarui evaluasi' : 'Update review') : (id ? 'Simpan evaluasi' : 'Save review')}</Button>
          </div>
        </Surface>

        {/* Goal context */}
        <div className="lg:col-span-5 space-y-4">
          <Surface className="p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="section-title">{id ? `Target ${type === 'quarter' ? 'kuartal' : 'bulan'} ini` : `This ${type}'s targets`}</h2>
              <Link href="/goals/annual" className="text-[13px] text-blue-600 dark:text-blue-400 hover:underline">{id ? 'Atur' : 'Edit'}</Link>
            </div>
            {priorities.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">{id ? `Belum ada goal prioritas ${year}.` : `No priority goals for ${year}.`}</p>
            ) : (
              <ul className="space-y-3">
                {priorities.map((g) => {
                  const cat = LIFE_GOAL_CATEGORIES.find((c) => c.id === g.category);
                  const own = periodTargets.filter((t) => t.lifeGoalId === g.id);
                  const inner = innerTargets.filter((t) => t.lifeGoalId === g.id);
                  return (
                    <li key={g.id} className="flex gap-3">
                      <span className="icon-tile w-9 h-9 shrink-0"><Icon name={cat?.icon || 'target'} size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{id ? cat?.label : cat?.labelEn}</p>
                        <p className="text-sm font-medium">{g.title}</p>
                        {own.map((t) => (
                          <p key={t.id} className={cn('text-[13px] flex items-center gap-1.5 mt-1', t.done ? 'text-success' : 'text-muted-foreground')}>
                            <Icon name={t.done ? 'checkCircle' : 'target'} size={12} />{t.title}
                          </p>
                        ))}
                        {inner.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 tabular-nums">{inner.filter((t) => t.done).length}/{inner.length} {id ? 'target turunan selesai' : 'sub-targets done'}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Surface>

          {history.length > 0 && (
            <Surface className="p-4 md:p-5 space-y-3">
              <h2 className="section-title">{id ? 'Evaluasi sebelumnya' : 'Earlier reviews'}</h2>
              <ul className="divide-y divide-border">
                {history.slice(0, 8).map((r) => (
                  <li key={r.id}>
                    <button type="button" className="w-full flex items-center justify-between gap-3 py-2.5 text-left hover:text-blue-600"
                      onClick={() => setAnchor(r.date!)}>
                      <span className="text-sm">{getPeriod(type, r.date!, lang).label}</span>
                      <span className="text-[13px] text-muted-foreground tabular-nums">{r.data?.score ?? '—'}/10</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Surface>
          )}
        </div>
      </div>
    </div>
  );
}

function Fig({ label, value, tone }: { label: string; value: string; tone?: 'neg' }) {
  return (
    <Surface className="p-4 md:p-5 flex flex-col gap-2">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className={cn('figure-lg text-xl md:text-2xl tabular-nums truncate', tone === 'neg' && 'text-red-600 dark:text-red-400')}>{value}</span>
    </Surface>
  );
}
