'use client';

import React, { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { PeriodNavigator } from '@/components/ui/PeriodNavigator';
import { useCollection } from '@/lib/hooks/useCollection';
import { useGoalTargetLinks } from '@/lib/hooks/useLinks';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { getPeriod, periodProgress, PeriodType, toISO, fromISO } from '@/lib/period';
import {
  GOAL_SUGGESTIONS, GoalTarget, LIFE_GOAL_CATEGORIES, LifeGoal, LifeGoalCategory, MIN_GOALS_PER_CATEGORY, TargetPeriod,
} from '@/lib/lifeGoals';

const PARENT: Record<TargetPeriod, TargetPeriod | 'year'> = { quarter: 'year', month: 'quarter', week: 'month', day: 'week' };

export default function AnnualGoalsPage() {
  const { state } = useLifeOS();
  const { locale } = useI18n();
  const id = locale === 'id';
  const goals = useCollection<LifeGoal>('life_goals');
  const targets = useCollection<GoalTarget>('goal_targets');
  const links = useGoalTargetLinks(targets);

  const today = state.selectedDate || toISO(new Date());
  const [year, setYear] = useState(fromISO(today).getFullYear());
  const [tab, setTab] = useState<'cascade' | 'library'>('cascade');
  const [ptype, setPtype] = useState<PeriodType>('week');
  const [anchor, setAnchor] = useState(today);
  const [cat, setCat] = useState<LifeGoalCategory>('finance');

  const priorities = useMemo(() => {
    const m = new Map<LifeGoalCategory, LifeGoal>();
    goals.items.filter((g) => g.priorityYear === year).forEach((g) => m.set(g.category, g));
    return m;
  }, [goals.items, year]);

  const yearRange = getPeriod('year', `${year}-01-01`, id ? 'id' : 'en');
  const yp = periodProgress(yearRange, today);
  const pickedCount = priorities.size;
  const todayTargets = targets.items.filter((t) => t.periodType === 'day' && t.periodStart === today);
  const todayDone = todayTargets.filter((t) => t.done).length;

  const migrationMissing = goals.error === 'migration' || targets.error === 'migration';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        back="/goals"
        title={id ? 'Goals Tahunan' : 'Annual Goals'}
        subtitle={id
          ? 'Delapan area hidup, satu prioritas per area tiap tahun, diturunkan ke kuartal, bulan, minggu, dan hari.'
          : 'Eight life areas, one priority each per year, broken down to quarter, month, week, and day.'}
        actions={
          <PeriodNavigator
            types={['year']}
            type="year"
            anchor={`${year}-06-01`}
            onChange={(_, a) => setYear(fromISO(a).getFullYear())}
          />
        }
      />

      {migrationMissing && (
        <Surface variant="soft" className="p-4 text-sm">
          {id
            ? 'Tabel Goals Tahunan belum ada di Supabase. Jalankan supabase/migrations/024_life_journal.sql di SQL Editor.'
            : 'Annual goal tables are missing. Run supabase/migrations/024_life_journal.sql in the SQL Editor.'}
        </Surface>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Surface variant="hero" className="p-4 md:p-5 col-span-2 lg:col-span-2 flex flex-col gap-3">
          <span className="text-[13px] text-muted-foreground">{id ? `Tahun ${year} berjalan` : `${year} elapsed`}</span>
          <p className="figure-hero">{Math.round((yp.elapsed / yp.total) * 100)}<span className="unit">%</span></p>
          <div className="h-1.5 rounded-full bg-white/30 overflow-hidden"><div className="h-full bg-white rounded-full" style={{ width: `${(yp.elapsed / yp.total) * 100}%` }} /></div>
          <span className="text-xs text-muted-foreground">{id ? `Tutup buku 31 Desember ${year}` : `Closes 31 December ${year}`}</span>
        </Surface>
        <Surface className="p-4 md:p-5 flex flex-col gap-3">
          <span className="text-[13px] text-muted-foreground">{id ? 'Prioritas dipilih' : 'Priorities picked'}</span>
          <p className="figure-lg">{pickedCount}<span className="unit">/ 8</span></p>
          <span className="text-xs text-muted-foreground">{id ? 'Satu per area' : 'One per area'}</span>
        </Surface>
        <Surface className="p-4 md:p-5 flex flex-col gap-3">
          <span className="text-[13px] text-muted-foreground">{id ? 'Target hari ini' : 'Today’s targets'}</span>
          <p className="figure-lg">{todayDone}<span className="unit">/ {todayTargets.length}</span></p>
          <span className="text-xs text-muted-foreground">{id ? 'Turunan harian' : 'Daily breakdown'}</span>
        </Surface>
      </div>

      <SegmentedTabs
        label={id ? 'Tampilan goals' : 'Goal views'}
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'cascade', label: id ? 'Target Berjenjang' : 'Cascading Targets', icon: 'target' },
          { id: 'library', label: id ? 'Pustaka Goal' : 'Goal Library', icon: 'list', count: goals.items.length },
        ]}
      />

      {tab === 'cascade' ? (
        <CascadeBoard
          year={year} priorities={priorities} targets={targets} ptype={ptype} anchor={anchor}
          onPeriod={(t, a) => { setPtype(t); setAnchor(a); }}
          onPick={(c) => { setCat(c); setTab('library'); }}
          onMakeTask={links.makeTask}
          onToggle={links.toggle}
          taskOf={links.taskOf}
          locale={id ? 'id' : 'en'}
        />
      ) : (
        <Library goals={goals} year={year} cat={cat} setCat={setCat} priorities={priorities} locale={id ? 'id' : 'en'} />
      )}
    </div>
  );
}

/* ───────────────────────────── Cascade board ───────────────────────────── */

function CascadeBoard({
  year, priorities, targets, ptype, anchor, onPeriod, onPick, onMakeTask, onToggle, taskOf, locale,
}: {
  year: number;
  priorities: Map<LifeGoalCategory, LifeGoal>;
  targets: ReturnType<typeof useCollection<GoalTarget>>;
  ptype: PeriodType;
  anchor: string;
  onPeriod: (t: PeriodType, a: string) => void;
  onPick: (c: LifeGoalCategory) => void;
  onMakeTask: (t: GoalTarget) => void;
  onToggle: (t: GoalTarget) => void;
  taskOf: (t: GoalTarget) => unknown;
  locale: 'id' | 'en';
}) {
  const id = locale === 'id';
  const type = (ptype === 'year' ? 'quarter' : ptype) as TargetPeriod;
  const period = getPeriod(type, anchor, locale);
  const parentType = PARENT[type];
  const parent = parentType === 'year' ? null : getPeriod(parentType, anchor, locale);
  const outOfYear = fromISO(period.start).getFullYear() !== year && fromISO(period.end).getFullYear() !== year;

  return (
    <div className="space-y-4">
      <PeriodNavigator types={['quarter', 'month', 'week', 'day']} type={type} anchor={anchor} onChange={onPeriod} />
      {outOfYear && (
        <p className="text-[13px] text-muted-foreground">
          {id ? `Periode ini di luar tahun ${year}. Prioritas yang tampil tetap milik ${year}.` : `This period is outside ${year}.`}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        {LIFE_GOAL_CATEGORIES.map((c) => {
          const goal = priorities.get(c.id);
          const list = goal ? targets.items.filter((t) => t.lifeGoalId === goal.id && t.periodType === type && t.periodStart === period.start) : [];
          const parentList = goal && parent ? targets.items.filter((t) => t.lifeGoalId === goal.id && t.periodType === parentType && t.periodStart === parent.start) : [];
          return (
            <Surface key={c.id} className="p-4 md:p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="icon-tile w-9 h-9"><Icon name={c.icon} size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-muted-foreground">{id ? c.label : c.labelEn}</p>
                  {goal ? (
                    <p className="section-title leading-snug">{goal.title}</p>
                  ) : (
                    <button type="button" onClick={() => onPick(c.id)} className="text-sm text-ink hover:underline">
                      {id ? 'Pilih prioritas tahun ini →' : 'Pick this year’s priority →'}
                    </button>
                  )}
                </div>
                {list.length > 0 && (
                  <span className="status bg-muted text-muted-foreground">{list.filter((t) => t.done).length}/{list.length}</span>
                )}
              </div>

              {goal && (
                <>
                  {parentList.length > 0 && (
                    <div className="well py-2.5">
                      <p className="text-xs text-muted-foreground mb-1">
                        {id ? 'Target ' : ''}{getPeriod(parentType as PeriodType, anchor, locale).short}{id ? '' : ' target'}
                      </p>
                      <ul className="space-y-0.5">
                        {parentList.map((t) => (
                          <li key={t.id} className={cn('text-[13px]', t.done && 'line-through text-muted-foreground')}>{t.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <TargetList
                    items={list}
                    onToggle={onToggle}
                    taskOf={taskOf}
                    onRemove={(t) => targets.remove(t.id)}
                    onMakeTask={type === 'day' ? onMakeTask : undefined}
                    locale={locale}
                  />
                  <AddInline
                    placeholder={id ? `Target ${period.short} untuk goal ini…` : `${period.short} target…`}
                    onAdd={(title) => targets.add({ lifeGoalId: goal.id, periodType: type, periodStart: period.start, title, done: false })}
                    label={id ? `Tambah target ${c.label}` : `Add ${c.labelEn} target`}
                  />
                </>
              )}
            </Surface>
          );
        })}
      </div>
    </div>
  );
}

function TargetList({ items, onToggle, onRemove, onMakeTask, taskOf, locale }: {
  items: GoalTarget[]; onToggle: (t: GoalTarget) => void; onRemove: (t: GoalTarget) => void;
  onMakeTask?: (t: GoalTarget) => void; taskOf: (t: GoalTarget) => unknown; locale: 'id' | 'en';
}) {
  const id = locale === 'id';
  if (!items.length) return null;
  return (
    <ul className="divide-y divide-border">
      {items.map((t) => (
        <li key={t.id} className="group flex items-center gap-3 py-2">
          <button
            type="button" onClick={() => onToggle(t)} aria-pressed={t.done}
            aria-label={t.done ? (id ? 'Tandai belum selesai' : 'Mark not done') : (id ? 'Tandai selesai' : 'Mark done')}
            className={cn('w-6 h-6 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
              t.done ? 'bg-primary border-primary text-primary-foreground' : 'border-border hover:border-blue-500')}
          >
            {t.done && <Icon name="check" size={12} />}
          </button>
          <span className={cn('flex-1 text-sm', t.done && 'line-through text-muted-foreground')}>{t.title}</span>
          {onMakeTask && taskOf(t) ? (
            <span className="status bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" title={id ? 'Tersinkron dengan tugas' : 'Synced with a task'}>
              <Icon name="link" size={11} />{id ? 'Tugas' : 'Task'}
            </span>
          ) : onMakeTask && (
            <button type="button" className="chip h-8 px-2.5 text-xs md:opacity-0 md:group-hover:opacity-100 focus:opacity-100" onClick={() => onMakeTask(t)}>
              <Icon name="checkSquare" size={13} />{id ? 'Jadikan tugas' : 'Make task'}
            </button>
          )}
          <button type="button" className="icon-btn hover:text-destructive md:opacity-0 md:group-hover:opacity-100 focus:opacity-100" aria-label={id ? 'Hapus target' : 'Delete target'} onClick={() => onRemove(t)}>
            <Icon name="trash" size={15} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function AddInline({ placeholder, onAdd, label }: { placeholder: string; onAdd: (v: string) => void; label: string }) {
  const [v, setV] = useState('');
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onAdd(v.trim()); setV(''); } }}
    >
      <input className="glass-input flex-1" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} aria-label={label} />
      <button type="submit" className="icon-btn bg-primary text-primary-foreground border-primary hover:bg-primary" aria-label={label} disabled={!v.trim()}>
        <Icon name="plus" size={16} />
      </button>
    </form>
  );
}

/* ───────────────────────────── Library ───────────────────────────── */

function Library({ goals, year, cat, setCat, priorities, locale }: {
  goals: ReturnType<typeof useCollection<LifeGoal>>;
  year: number; cat: LifeGoalCategory; setCat: (c: LifeGoalCategory) => void;
  priorities: Map<LifeGoalCategory, LifeGoal>; locale: 'id' | 'en';
}) {
  const id = locale === 'id';
  const [showIdeas, setShowIdeas] = useState(false);
  const meta = LIFE_GOAL_CATEGORIES.find((c) => c.id === cat)!;
  const list = goals.items.filter((g) => g.category === cat).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  const priority = priorities.get(cat);
  const titles = new Set(list.map((g) => g.title.toLowerCase()));
  const ideas = GOAL_SUGGESTIONS[cat].filter((s) => !titles.has(s.toLowerCase()));

  const setPriority = async (g: LifeGoal) => {
    if (priority && priority.id !== g.id) await goals.update(priority.id, { priorityYear: null, status: 'idea' });
    await goals.update(g.id, priority?.id === g.id ? { priorityYear: null, status: 'idea' } : { priorityYear: year, status: 'active' });
  };

  const add = (title: string) => goals.add({ category: cat, title, notes: '', priorityYear: null, why: '', successMetric: '', status: 'idea' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 md:gap-5">
      {/* Category picker: chips on mobile, list on desktop */}
      <nav aria-label={id ? 'Area goal' : 'Goal areas'} className="-mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto no-scrollbar">
        <ul className="flex lg:flex-col gap-2 w-max lg:w-auto">
          {LIFE_GOAL_CATEGORIES.map((c) => {
            const n = goals.items.filter((g) => g.category === c.id).length;
            const active = c.id === cat;
            return (
              <li key={c.id}>
                <button
                  type="button" onClick={() => setCat(c.id)} aria-pressed={active}
                  className={cn('w-full flex items-center gap-3 rounded-full lg:rounded-xl px-3 h-11 lg:h-auto lg:py-3 text-left text-sm transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground shadow-card hover:bg-muted')}
                >
                  <Icon name={c.icon} size={16} className="shrink-0" />
                  <span className="flex-1 whitespace-nowrap lg:whitespace-normal">{id ? c.label : c.labelEn}</span>
                  <span className={cn('text-xs tabular-nums', active ? 'opacity-80' : 'text-muted-foreground')}>{n}/{MIN_GOALS_PER_CATEGORY}</span>
                  {priorities.has(c.id) && <Icon name="star" size={13} className={active ? '' : 'text-amber-500'} />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <Surface className="p-4 md:p-6 space-y-5 min-w-0">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h2 className="section-title text-lg">{id ? meta.label : meta.labelEn}</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {id
                ? `Kumpulkan minimal ${MIN_GOALS_PER_CATEGORY} goal, lalu pilih 1 sebagai prioritas ${year}.`
                : `Collect at least ${MIN_GOALS_PER_CATEGORY} goals, then pick 1 as the ${year} priority.`}
            </p>
          </div>
          <Button variant="secondary" size="sm" icon="lightbulb" onClick={() => setShowIdeas((s) => !s)} aria-expanded={showIdeas}>
            {showIdeas ? (id ? 'Tutup contoh' : 'Hide ideas') : (id ? `Contoh goal (${ideas.length})` : `Ideas (${ideas.length})`)}
          </Button>
        </div>

        <div className="duo-progress-track" role="progressbar" aria-label={id ? 'Jumlah goal di pustaka' : 'Goals in library'} aria-valuemin={0} aria-valuemax={MIN_GOALS_PER_CATEGORY} aria-valuenow={list.length}>
          <div className="duo-progress-fill" style={{ width: `${Math.min(100, (list.length / MIN_GOALS_PER_CATEGORY) * 100)}%` }} />
        </div>

        {priority && (
          <div className="card-ink p-4 flex items-start gap-3">
            <Icon name="star" size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{id ? `Prioritas ${year}` : `${year} priority`}</p>
              <p className="font-display text-base font-medium">{priority.title}</p>
            </div>
          </div>
        )}

        <AddInline placeholder={id ? 'Tulis goal baru lalu Enter' : 'Write a new goal, press Enter'} onAdd={add} label={id ? 'Tambah goal' : 'Add goal'} />

        {showIdeas && ideas.length > 0 && (
          <div className="well space-y-2">
            <p className="text-xs text-muted-foreground">{id ? 'Ketuk untuk menambahkan ke pustaka. Ubah sesuai dirimu.' : 'Tap to add to your library.'}</p>
            <div className="flex flex-wrap gap-2">
              {ideas.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => add(s)}>
                  <Icon name="plus" size={13} />{s}
                </button>
              ))}
            </div>
          </div>
        )}

        {list.length === 0 ? (
          <EmptyState compact title={id ? 'Pustaka masih kosong' : 'Library is empty'} description={id ? 'Tulis goal sendiri atau ambil dari contoh.' : 'Write your own or start from ideas.'} />
        ) : (
          <ol className="divide-y divide-border">
            {list.map((g, i) => {
              const isP = priority?.id === g.id;
              const takenElsewhere = g.priorityYear !== null && g.priorityYear !== year;
              return (
                <li key={g.id} className="group flex items-center gap-3 py-2.5">
                  <span className="w-6 text-xs text-muted-foreground tabular-nums shrink-0">{i + 1}</span>
                  <span className={cn('flex-1 text-sm', g.status === 'achieved' && 'line-through text-muted-foreground')}>
                    {g.title}
                    {takenElsewhere && <span className="ml-2 status bg-muted text-muted-foreground">{id ? 'Prioritas' : 'Priority'} {g.priorityYear}</span>}
                  </span>
                  <button
                    type="button" onClick={() => setPriority(g)} aria-pressed={isP}
                    className={cn('chip h-8 px-3 text-xs', isP && 'is-active')}
                  >
                    <Icon name="star" size={13} />{isP ? (id ? 'Prioritas' : 'Priority') : (id ? 'Jadikan prioritas' : 'Set priority')}
                  </button>
                  <button
                    type="button" className="icon-btn md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                    aria-label={g.status === 'achieved' ? (id ? 'Batal tercapai' : 'Unmark achieved') : (id ? 'Tandai tercapai' : 'Mark achieved')}
                    onClick={() => goals.update(g.id, { status: g.status === 'achieved' ? (g.priorityYear ? 'active' : 'idea') : 'achieved' })}
                  >
                    <Icon name="checkCircle" size={15} />
                  </button>
                  <button type="button" className="icon-btn hover:text-destructive md:opacity-0 md:group-hover:opacity-100 focus:opacity-100" aria-label={id ? 'Hapus goal' : 'Delete goal'} onClick={() => goals.remove(g.id)}>
                    <Icon name="trash" size={15} />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </Surface>
    </div>
  );
}
