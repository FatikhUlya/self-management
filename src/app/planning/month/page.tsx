'use client';

import React, { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Icon } from '@/components/ui/Icon';
import { PeriodNavigator } from '@/components/ui/PeriodNavigator';
import { useLifeOS, Task } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { fromISO, getPeriod, PeriodType, toISO, weekStart } from '@/lib/period';

const isDone = (t: Task) => t.status === 'done' || t.status === 'completed';

/**
 * Monthly planner (journal sheet 05). Anything written on a date becomes a
 * task due that day, so it shows up in Today on the dashboard.
 */
export default function MonthlyPlannerPage() {
  const { state, addTask, updateTaskStatus, deleteTask, setSelectedDate } = useLifeOS();
  const { locale } = useI18n();
  const id = locale === 'id';
  const today = toISO(new Date());
  const [anchor, setAnchor] = useState(state.selectedDate || today);
  const [picked, setPicked] = useState(state.selectedDate || today);
  const [view, setView] = useState<'month' | 'week'>('month');

  const month = getPeriod(view, anchor, id ? 'id' : 'en');
  const days = useMemo(() => {
    const out: string[] = [];
    const s = weekStart(fromISO(month.start));
    const end = fromISO(month.end);
    const e = new Date(end); e.setDate(end.getDate() + ((7 - ((end.getDay() + 6) % 7) - 1)));
    for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) out.push(toISO(d));
    return out;
  }, [month.start, month.end]);

  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    state.tasks.forEach((t) => {
      if (!t.due) return;
      const k = t.due.slice(0, 10);
      if (k < days[0] || k > days[days.length - 1]) return;
      (m.get(k) || m.set(k, []).get(k)!).push(t);
    });
    return m;
  }, [state.tasks, days]);

  const monthTasks = state.tasks.filter((t) => t.due && t.due.slice(0, 10) >= month.start && t.due.slice(0, 10) <= month.end);
  const doneCount = monthTasks.filter(isDone).length;
  const weekdays = id ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const add = (date: string, title: string) => addTask({ title, due: date, priority: 'Medium', projectId: '' });
  const toggle = (t: Task) => updateTaskStatus(t.id, isDone(t) ? 'todo' : 'done');

  const onMonth = (t: PeriodType, a: string) => {
    const v = t === 'week' ? 'week' : 'month';
    setView(v);
    setAnchor(a);
    const m = getPeriod(v, a);
    setPicked(today >= m.start && today <= m.end ? today : m.start);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <PageHeader
        back="/planning"
        title={view === 'week' ? (id ? 'Planner Mingguan' : 'Weekly Planner') : (id ? 'Planner Bulanan' : 'Monthly Planner')}
        subtitle={id ? 'Tulis langsung di tanggalnya. Semua otomatis jadi tugas hari itu.' : 'Write on the date. Everything becomes that day’s task.'}
        actions={<span className="chip pointer-events-none tabular-nums">{doneCount}/{monthTasks.length} {id ? 'selesai' : 'done'}</span>}
      />

      <PeriodNavigator types={['month', 'week']} type={view} anchor={anchor} onChange={onMonth} />

      {/* ── Desktop: paper-like month grid ── */}
      <Surface className="hidden md:block overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-border">
          {weekdays.map((w) => (
            <div key={w} className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-center">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const inMonth = d >= month.start && d <= month.end;
            const list = byDay.get(d) || [];
            const isToday = d === today;
            return (
              <div
                key={d}
                className={cn('group border-b', view === 'week' ? 'min-h-[360px]' : 'min-h-[148px]', ' border-r border-border p-2 flex flex-col gap-1 [&:nth-child(7n)]:border-r-0',
                  !inMonth && 'bg-muted/40')}
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    title={id ? 'Jadikan tanggal kerja' : 'Set as working date'}
                    className={cn('w-7 h-7 rounded-full text-[13px] tabular-nums flex items-center justify-center',
                      isToday ? 'bg-blue-500 text-white' : inMonth ? 'text-foreground hover:bg-muted' : 'text-muted-foreground')}
                  >
                    {fromISO(d).getDate()}
                  </button>
                  {list.length > 0 && <span className="text-xs text-muted-foreground tabular-nums">{list.filter(isDone).length}/{list.length}</span>}
                </div>
                <ul className="space-y-0.5 flex-1">
                  {list.map((t) => (
                    <TaskRow key={t.id} t={t} onToggle={toggle} onDelete={() => deleteTask(t.id)} compact locale={id ? 'id' : 'en'} />
                  ))}
                </ul>
                <CellInput date={d} onAdd={add} locale={id ? 'id' : 'en'} />
              </div>
            );
          })}
        </div>
      </Surface>

      {/* ── Mobile: compact calendar + selected day list ── */}
      <div className="md:hidden space-y-4">
        <Surface className="p-3">
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((w) => <span key={w} className="text-xs text-muted-foreground py-1">{w}</span>)}
            {days.map((d) => {
              const inMonth = d >= month.start && d <= month.end;
              const list = byDay.get(d) || [];
              const open = list.filter((t) => !isDone(t)).length;
              const sel = d === picked;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setPicked(d)}
                  aria-pressed={sel}
                  aria-label={`${fromISO(d).toLocaleDateString(id ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long' })}, ${list.length} ${id ? 'catatan' : 'items'}`}
                  className={cn('relative h-11 rounded-full text-sm tabular-nums flex flex-col items-center justify-center !min-h-0',
                    sel ? 'bg-primary text-primary-foreground' : d === today ? 'text-blue-600 font-semibold' : inMonth ? 'text-foreground' : 'text-muted-foreground/60')}
                >
                  {fromISO(d).getDate()}
                  {list.length > 0 && (
                    <span className={cn('absolute bottom-1 w-1 h-1 rounded-full', open ? (sel ? 'bg-primary-foreground' : 'bg-blue-500') : 'bg-success')} />
                  )}
                </button>
              );
            })}
          </div>
        </Surface>

        <Surface className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="section-title capitalize">
              {fromISO(picked).toLocaleDateString(id ? 'id-ID' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {picked !== state.selectedDate && (
              <button type="button" className="chip" onClick={() => setSelectedDate(picked)}>{id ? 'Buka di Beranda' : 'Open in Home'}</button>
            )}
          </div>
          <ul className="divide-y divide-border">
            {(byDay.get(picked) || []).map((t) => (
              <TaskRow key={t.id} t={t} onToggle={toggle} onDelete={() => deleteTask(t.id)} locale={id ? 'id' : 'en'} />
            ))}
          </ul>
          {(byDay.get(picked) || []).length === 0 && (
            <p className="text-[13px] text-muted-foreground">{id ? 'Belum ada catatan untuk tanggal ini.' : 'Nothing planned for this date.'}</p>
          )}
          <CellInput date={picked} onAdd={add} locale={id ? 'id' : 'en'} large />
        </Surface>
      </div>
    </div>
  );
}

function TaskRow({ t, onToggle, onDelete, compact, locale }: { t: Task; onToggle: (t: Task) => void; onDelete: () => void; compact?: boolean; locale: 'id' | 'en' }) {
  const done = isDone(t);
  const id = locale === 'id';
  return (
    <li className={cn('group/row flex items-start gap-2', compact ? 'py-0.5' : 'py-2.5')}>
      <button
        type="button" onClick={() => onToggle(t)} aria-pressed={done}
        aria-label={`${done ? (id ? 'Batal selesai' : 'Undo') : (id ? 'Selesai' : 'Done')}: ${t.title}`}
        className={cn('shrink-0 rounded-md border flex items-center justify-center transition-colors !min-h-0',
          compact ? 'w-4 h-4 mt-0.5' : 'w-6 h-6', done ? 'bg-primary border-primary text-primary-foreground' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500')}
      >
        {done && <Icon name="check" size={compact ? 10 : 14} />}
      </button>
      <span className={cn('flex-1 min-w-0 break-words', compact ? 'text-[13px] leading-snug' : 'text-[15px]', done && 'line-through text-muted-foreground')}>
        {t.title}
      </span>
      <button
        type="button" onClick={onDelete} aria-label={`${id ? 'Hapus' : 'Delete'}: ${t.title}`}
        className={cn('shrink-0 text-muted-foreground hover:text-destructive !min-h-0', compact ? 'opacity-0 group-hover/row:opacity-100 focus:opacity-100' : 'icon-btn')}
      >
        <Icon name="x" size={compact ? 12 : 16} />
      </button>
    </li>
  );
}

function CellInput({ date, onAdd, locale, large }: { date: string; onAdd: (date: string, title: string) => void; locale: 'id' | 'en'; large?: boolean }) {
  const [v, setV] = useState('');
  const id = locale === 'id';
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onAdd(date, v.trim()); setV(''); } }} className={cn(large && 'flex gap-2')}>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        aria-label={`${id ? 'Tambah tugas untuk' : 'Add task for'} ${date}`}
        placeholder={large ? (id ? 'Tulis yang perlu dikerjakan…' : 'What needs doing…') : (id ? '+ Tambah' : '+ Add')}
        className={cn(large
          ? 'glass-input flex-1'
          : 'w-full bg-transparent text-[13px] px-1 py-0.5 rounded-md border border-transparent placeholder:text-muted-foreground/70 focus:border-input focus:bg-card focus:outline-none !min-h-0')}
      />
      {large && (
        <button type="submit" disabled={!v.trim()} className="icon-btn bg-primary text-primary-foreground border-primary hover:bg-primary" aria-label={id ? 'Tambah' : 'Add'}>
          <Icon name="plus" size={18} />
        </button>
      )}
    </form>
  );
}
