'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { MetricCard } from '@/components/ui/MetricCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StaggerGroup, StaggerItem } from '@/lib/animations';
import { 
  percent, 
  todayISO, 
  addDays, 
  lastSevenDays, 
  dayName, 
  formatDate,
  monthCalendarDays,
  cn 
} from '@/lib/utils';
import { HABIT_AREAS } from '@/lib/constants';
import { DateStamp } from '@/components/ui/DateStamp';

export default function HabitsDashboardPage() {
  const { state, toggleHabit, addHabit, updateHabit, deleteHabit } = useLifeOS();
  const { t, locale } = useI18n();
  const today = state.selectedDate || todayISO();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'matrix' | 'calendar' | 'manage'>('matrix');

  // Filter
  const [selectedArea, setSelectedArea] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Form states (Add)
  const [habitName, setHabitName] = useState('');
  const [habitArea, setHabitArea] = useState<string>(HABIT_AREAS[0]);
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [habitTarget, setHabitTarget] = useState<number>(5);
  const [habitGoalId, setHabitGoalId] = useState<string>('');

  // Form states (Edit)
  const [editName, setEditName] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editFrequency, setEditFrequency] = useState<'daily' | 'weekly'>('daily');
  const [editTarget, setEditTarget] = useState<number>(5);
  const [editGoalId, setEditGoalId] = useState<string>('');

  // Quick Add
  const [quickHabitName, setQuickHabitName] = useState('');

  // Calendar State
  const todayDate = new Date(`${today}T00:00:00`);
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const [calYear, setCalYear] = useState(todayDate.getFullYear());

  const calDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-15`;
  const calendarDays = monthCalendarDays(calDateStr);

  const navigateMonth = (dir: 'prev' | 'next') => {
    let m = calMonth;
    let y = calYear;
    if (dir === 'prev') {
      if (calMonth === 0) { m = 11; y -= 1; }
      else { m -= 1; }
    } else {
      if (calMonth === 11) { m = 0; y += 1; }
      else { m += 1; }
    }
    setCalMonth(m);
    setCalYear(y);
  };

  // 7 Days Range
  const sevenDays = lastSevenDays(today);

  // Streak Calculator
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

  // Completion percentage for a given date
  const getCompletionPercent = (date: string) => {
    if (!state.habits.length) return 0;
    const done = state.habits.filter((h) => 
      state.habitLogs.some((log) => log.habitId === h.id && log.date === date)
    ).length;
    return percent(done, state.habits.length);
  };

  const todayScore = getCompletionPercent(today);
  const doneTodayCount = state.habits.filter((h) => state.habitLogs.some(l => l.habitId === h.id && l.date === today)).length;

  // Max streak among all habits
  const maxStreak = state.habits.reduce((max, h) => {
    const s = getHabitStreak(h.id, today);
    return s > max ? s : max;
  }, 0);

  // 7-day average score
  const sevenDayAvg = Math.round(
    sevenDays.reduce((sum, d) => sum + getCompletionPercent(d), 0) / 7
  );

  // Filtered habits
  const filteredHabits = state.habits.filter((h) => {
    if (selectedArea !== 'all' && h.area !== selectedArea) return false;
    return true;
  });

  // Handlers
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickHabitName.trim()) return;

    await addHabit({
      name: quickHabitName.trim(),
      area: selectedArea !== 'all' ? selectedArea : 'Personal',
      frequency: 'daily',
      targetPerWeek: 7,
    });

    setQuickHabitName('');
  };

  const handleHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    await addHabit({
      name: habitName.trim(),
      area: habitArea,
      frequency: habitFrequency,
      targetPerWeek: habitTarget,
      goalId: habitGoalId || undefined,
    });

    setHabitName('');
    setHabitGoalId('');
    setIsAddModalOpen(false);
  };

  const handleOpenEdit = (h: any) => {
    setEditingHabit(h);
    setEditName(h.name);
    setEditArea(h.area || 'Personal');
    setEditFrequency(h.frequency || 'daily');
    setEditTarget(h.targetPerWeek || 5);
    setEditGoalId(h.goalId || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !editName.trim()) return;

    await updateHabit({
      ...editingHabit,
      name: editName.trim(),
      area: editArea,
      frequency: editFrequency,
      targetPerWeek: editTarget,
      goalId: editGoalId || undefined,
    });

    setEditingHabit(null);
  };

  return (
    <StaggerGroup className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ═══════════════ Header ═══════════════ */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <DateStamp />
            <h1 className="text-2xl sm:text-[32px] font-medium leading-[1.15] text-foreground">
              Habits & Rutinitas
            </h1>
            <p className="text-sm leading-[1.6] text-zinc-600 dark:text-zinc-400 mt-1 max-w-prose">
              Bangun disiplin harian melalui pelacakan konsistensi, streak, dan evaluasi bulanan.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon="plus"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-semibold shadow-2xs"
            >
              Habit Baru
            </Button>
          </div>
        </div>
      </StaggerItem>

      {/* ═══════════════ Metrics Row ═══════════════ */}
      <StaggerItem>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <MetricCard
            icon="check"
            label="Skor Hari Ini"
            value={`${todayScore}%`}
            detail={`${doneTodayCount} dari ${state.habits.length} kebiasaan selesai`}
            glow={todayScore >= 80}
          />
          <MetricCard
            icon="zap"
            label="Streak Tertinggi"
            value={`${maxStreak} hari`}
            detail={maxStreak > 0 ? "Momentum aktif terjaga" : "Mulai bangun streak hari ini"}
            glow={maxStreak >= 3}
          />
          <MetricCard
            icon="activity"
            label="Konsistensi 7 Hari"
            value={`${sevenDayAvg}%`}
            detail="Rata-rata penyelesaian sepekan"
          />
          <MetricCard
            icon="target"
            label="Habit Aktif"
            value={state.habits.length}
            detail={`${state.habits.filter(h => h.goalId).length} terhubung ke sasaran`}
          />
        </div>
      </StaggerItem>

      {/* ═══════════════ Tab Switcher (Swipe-friendly) ═══════════════ */}
      <StaggerItem>
        <div className="flex items-center justify-between gap-3 bg-muted/40 p-1.5 rounded-xl border border-border/80 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('matrix')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors min-h-[44px] touch-manipulation",
                activeTab === 'matrix'
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon name="checkSquare" size={13} className={activeTab === 'matrix' ? "text-primary" : "text-muted-foreground"} />
              Matriks 7 Hari ({state.habits.length})
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors min-h-[44px] touch-manipulation",
                activeTab === 'calendar'
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon name="calendar" size={13} className={activeTab === 'calendar' ? "text-primary" : "text-muted-foreground"} />
              Kalender & Heatmap
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors min-h-[44px] touch-manipulation",
                activeTab === 'manage'
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon name="settings" size={13} className={activeTab === 'manage' ? "text-primary" : "text-muted-foreground"} />
              Kelola Habit
            </button>
          </div>
        </div>
      </StaggerItem>

      {/* ═══════════════ TAB 1: 7-DAY MATRIX (MOST FREQUENTLY USED) ═══════════════ */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <Surface className="p-4 md:p-6 space-y-4">
            {/* Filter & Quick Add Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/80 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-foreground ">Area:</span>
                <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                  <button
                    onClick={() => setSelectedArea('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                      selectedArea === 'all'
                        ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    Semua
                  </button>
                  {HABIT_AREAS.map((area) => (
                    <button
                      key={area}
                      onClick={() => setSelectedArea(area)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap",
                        selectedArea === area
                          ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fast Inline Habit Input */}
              <form onSubmit={handleQuickAdd} className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Tambah habit cepat"
                  value={quickHabitName}
                  onChange={(e) => setQuickHabitName(e.target.value)}
                  className="glass-input py-1.5 pr-14 text-xs bg-muted/20 hover:bg-muted/30 focus:bg-background transition-colors" aria-label="Tambah habit cepat"
/>
                <button
                  type="submit"
                  disabled={!quickHabitName.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary text-primary-foreground disabled:opacity-30 transition-colors"
                >
                  Enter ↵
                </button>
              </form>
            </div>

            {/* Matrix View (Mobile Stacked Cards & Desktop 7-Day Matrix) */}
            {filteredHabits.length > 0 ? (
              <>
                {/* Mobile Stacked Habit Cards (Thumb-friendly) */}
                <div className="block md:hidden space-y-2.5">
                  {filteredHabits.map((habit) => {
                    const streak = getHabitStreak(habit.id, today);
                    const isDoneToday = state.habitLogs.some(
                      (log) => log.habitId === habit.id && log.date === today
                    );
                    const goal = state.goals.find((g) => g.id === habit.goalId);

                    return (
                      <div
                        key={habit.id}
                        className={cn(
                          "p-3.5 rounded-xl border transition-colors space-y-3",
                          isDoneToday
                            ? "bg-emerald-500/10 border-emerald-500/25 text-foreground"
                            : "bg-muted/30 border-border text-foreground"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <strong className="text-sm font-semibold text-foreground block">
                                {habit.name}
                              </strong>
                              {streak > 0 && (
                                <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                                  {streak} hari beruntun
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                              <span>{habit.area || 'Personal'}</span>
                              {goal && <span>· {goal.title.slice(0, 24)}</span>}
                            </div>
                          </div>

                          {/* Quick 1-tap Today Complete Toggle (44x44px touch target) */}
                          <button
                            type="button"
                            onClick={() => toggleHabit(habit.id, today)}
                            className={cn(
                              "min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border transition-colors active:scale-95 touch-manipulation",
                              isDoneToday
                                ? "bg-primary border-primary text-primary-foreground shadow-xs"
                                : "bg-card border-input text-zinc-600 dark:text-zinc-400 hover:border-primary/50"
                            )}
                          >
                            <Icon name="check" size={16} />
                            <span>{isDoneToday ? 'Selesai' : 'Centang'}</span>
                          </button>
                        </div>

                        {/* 7-Day Mini Dots strip */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/60">
                          <span className="text-[11px] font-medium text-zinc-500">7 Hari Terakhir</span>
                          <div className="flex items-center gap-1.5">
                            {sevenDays.map((d) => {
                              const done = state.habitLogs.some(
                                (l) => l.habitId === habit.id && l.date === d
                              );
                              const isCur = d === today;
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => toggleHabit(habit.id, d)}
                                  className={cn(
                                    "w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-mono font-medium transition-colors active:scale-90 touch-manipulation",
                                    done
                                      ? "bg-primary text-primary-foreground font-medium"
                                      : "bg-muted text-zinc-400 border border-border/80",
                                    isCur && !done && "border-primary/50 ring-1 ring-primary/30"
                                  )}
                                  title={`${dayName(d, 'id-ID')} (${d.slice(8, 10)}): ${done ? 'Selesai' : 'Belum'}`}
                                >
                                  {d.slice(8, 10)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop 7-Day Matrix */}
                <div className="hidden md:block overflow-x-auto">
                  <div className="min-w-[640px] divide-y divide-border border-y border-border">
                    {/* Table Header: Days of the week */}
                    <div className="flex items-center justify-between h-12 text-xs text-muted-foreground">
                      <span className="w-2/5">Kebiasaan</span>
                      <div className="w-3/5 flex items-center justify-around">
                        {sevenDays.map((d) => {
                          const isCurrentDay = d === today;
                          return (
                            <div
                              key={d}
                              className={cn(
                                "flex flex-col items-center justify-center w-10 h-12 gap-0.5",
                                isCurrentDay && "text-ink font-medium bg-ink/5 shadow-[inset_0_-2px_0_hsl(var(--ink))]"
                              )}
                            >
                              <span className="text-[11px]">{dayName(d, 'id-ID')}</span>
                              <span className="text-xs font-mono tabular-nums">{d.slice(8, 10)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Habit Rows */}
                    {filteredHabits.map((habit) => {
                      const streak = getHabitStreak(habit.id, today);
                      const isCore = habit.isCore;
                      const goal = state.goals.find((g) => g.id === habit.goalId);

                      return (
                        <div
                          key={habit.id}
                          className="h-14 flex items-center justify-between group hover:bg-secondary/50 transition-colors select-none"
                        >
                          {/* Habit Title & Metadata */}
                          <div className="w-2/5 pr-4 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <strong className="text-[13px] font-medium text-foreground truncate block">
                                {habit.name}
                              </strong>
                              {streak > 0 && (
                                <span className="text-[11px] font-mono tabular-nums text-muted-foreground shrink-0">
                                  {streak} hari beruntun
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                              <span>{habit.area || 'Personal'}</span>
                              {goal && <span>· {goal.title.slice(0, 24)}</span>}
                            </div>
                          </div>

                          {/* 7 Interactive Day Bubbles */}
                          <div className="w-3/5 flex items-center justify-around">
                            {sevenDays.map((dateStr) => {
                              const isDone = state.habitLogs.some(
                                (log) => log.habitId === habit.id && log.date === dateStr
                              );
                              const isCurrentDay = dateStr === today;

                              return (
                                <button
                                  key={dateStr}
                                  type="button"
                                  onClick={() => toggleHabit(habit.id, dateStr)}
                                  aria-pressed={isDone}
                                  aria-label={`${habit.name}, ${formatDate(dateStr)}: ${isDone ? 'selesai' : 'belum'}`}
                                  className={cn(
                                    "w-10 h-14 flex items-center justify-center transition-colors",
                                    isCurrentDay && "bg-ink/5"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "w-6 h-6 rounded-[5px] flex items-center justify-center transition-colors",
                                      isDone
                                        ? "text-ink"
                                        : "border border-border text-transparent group-hover:border-[var(--life-line-strong)] hover:!border-ink/50"
                                    )}
                                  >
                                    <Icon name="check" size={18} strokeWidth={2} />
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="Tidak ada habit"
                description="Tambahkan rutinitas pertama Anda untuk mulai tracking konsistensi."
                action={{
                  label: 'Buat Habit Baru',
                  onClick: () => setIsAddModalOpen(true),
                }}
              />
            )}
          </Surface>
        </div>
      )}

      {/* ═══════════════ TAB 2: BULANAN & HEATMAP KALENDER ═══════════════ */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <Surface className="p-5 md:p-6 space-y-4">
            {/* Month Header Switcher */}
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="chevronLeft" size={14} />
                </button>
                <h3 className="text-sm font-medium tracking-tight text-foreground font-mono">
                  {new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date(calYear, calMonth, 1))}
                </h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="chevronRight" size={14} />
                </button>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>Kurang</span>
                <span className="w-3 h-3 rounded bg-muted border border-border" />
                <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800" />
                <span className="w-3 h-3 rounded bg-emerald-300 dark:bg-emerald-700/60 border border-emerald-400" />
                <span className="w-3 h-3 rounded bg-primary border border-primary" />
                <span>Konsisten</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                <div key={day} className="text-center text-[11px] font-semibold text-muted-foreground py-1">
                  {day}
                </div>
              ))}

              {calendarDays.map((dateStr, index) => {
                if (!dateStr) {
                  return <div key={`empty-${index}`} className="h-14 rounded-lg bg-muted/10 border border-transparent" />;
                }

                const dayNumber = Number(dateStr.slice(8, 10));
                const pct = getCompletionPercent(dateStr);
                const isSelected = dateStr === today;

                const toneClass = (() => {
                  if (pct <= 0) return 'bg-muted/40 border-border/80 text-muted-foreground';
                  if (pct <= 25) return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border-emerald-200 dark:border-emerald-900';
                  if (pct <= 50) return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 border-emerald-300';
                  if (pct <= 75) return 'bg-emerald-300 dark:bg-emerald-800/60 text-emerald-950 border-emerald-400';
                  return 'bg-primary text-primary-foreground border-primary font-medium';
                })();

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    className={cn(
                      "h-14 p-1.5 rounded-lg border text-left flex flex-col justify-between transition-colors shadow-2xs",
                      toneClass,
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    <span className="text-[11px] font-mono leading-none">{dayNumber}</span>
                    {pct > 0 && (
                      <span className="text-[11px] font-mono text-right font-semibold">{pct}%</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Surface>
        </div>
      )}

      {/* ═══════════════ TAB 3: KELOLA HABIT (CRUD) ═══════════════ */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {state.habits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.habits.map((habit) => {
                const streak = getHabitStreak(habit.id, today);
                const goal = state.goals.find((g) => g.id === habit.goalId);

                return (
                  <Surface
                    key={habit.id}
                    className="p-5 flex flex-col justify-between space-y-4 hover:shadow-xs transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Icon name="check" size={15} />
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-xs font-medium text-foreground tracking-tight truncate leading-tight">
                              {habit.name}
                            </h3>
                            <span className="text-[11px] text-muted-foreground block truncate">{habit.area || 'Personal'}</span>
                          </div>
                        </div>

                        <Badge tone="teal" className="text-[11px]">
                          {habit.frequency === 'daily' ? 'Harian' : `${habit.targetPerWeek}x / mg`}
                        </Badge>
                      </div>

                      {goal && (
                        <div className="mt-3 p-2 rounded-lg bg-muted/30 border border-border/60 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Icon name="target" size={12} className="text-primary shrink-0" />
                          <span className="truncate">{goal.title}</span>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>Streak Aktif</span>
                        <span className="font-mono font-medium text-foreground">{streak} hari beruntun</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1 pt-3 border-t border-border/60">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="edit"
                        onClick={() => handleOpenEdit(habit)}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="trash"
                        onClick={() => deleteHabit(habit.id)}
                        className="text-xs text-destructive hover:bg-destructive/10"
                      >
                        Hapus
                      </Button>
                    </div>
                  </Surface>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Belum ada habit"
              description="Tambahkan rutinitas pertama Anda untuk mulai membentuk kebiasaan."
              action={{
                label: 'Tambah Habit Baru',
                onClick: () => setIsAddModalOpen(true),
              }}
            />
          )}
        </div>
      )}

      {/* ═══════════════ MODAL: HABIT BARU ═══════════════ */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold tracking-tight">Tambah Habit Baru</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleHabitSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ">Nama Habit</label>
              <input
                type="text"
                required
                placeholder="Contoh: Membaca 20 halaman, Workout 30m, Meditasi"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                className="glass-input text-xs" aria-label="Contoh: Membaca 20 halaman, Workout 30m, Meditasi"
/>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ">Area</label>
                <select
                  value={habitArea}
                  onChange={(e) => setHabitArea(e.target.value)}
                  className="glass-select text-xs w-full"
                >
                  {HABIT_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ">Frekuensi</label>
                <select
                  value={habitFrequency}
                  onChange={(e) => setHabitFrequency(e.target.value as any)}
                  className="glass-select text-xs w-full"
                >
                  <option value="daily">Setiap Hari</option>
                  <option value="weekly">Mingguan</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ">Kaitkan ke Goal (Opsional)</label>
              <select
                value={habitGoalId}
                onChange={(e) => setHabitGoalId(e.target.value)}
                className="glass-select text-xs w-full"
              >
                <option value="">-- Tanpa Goal --</option>
                {state.goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-semibold">
              Simpan Habit
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MODAL: EDIT HABIT ═══════════════ */}
      <Dialog open={!!editingHabit} onOpenChange={(open) => !open && setEditingHabit(null)}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold tracking-tight">Edit Habit</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ">Nama Habit</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ">Area</label>
                <select
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="glass-select text-xs w-full"
                >
                  {HABIT_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground ">Target/mg</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={editTarget}
                  onChange={(e) => setEditTarget(Number(e.target.value))}
                  className="glass-input text-xs font-mono"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-semibold">
              Simpan Perubahan
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MODAL: DETAIL TANGGAL KALENDER ═══════════════ */}
      <Dialog open={!!selectedCalendarDate} onOpenChange={(open) => !open && setSelectedCalendarDate(null)}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold tracking-tight">
              Habit Tanggal {selectedCalendarDate && formatDate(selectedCalendarDate)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-2">
            {selectedCalendarDate && (
              state.habits.map((habit) => {
                const isDone = state.habitLogs.some(
                  (l) => l.habitId === habit.id && l.date === selectedCalendarDate
                );

                return (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id, selectedCalendarDate)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer select-none transition-colors flex items-center justify-between text-xs",
                      isDone
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-semibold"
                        : "bg-muted/30 border-border text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>{habit.name}</span>
                    <span className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center border transition-colors",
                      isDone ? "bg-primary border-primary text-primary-foreground" : "border-input text-transparent"
                    )}>
                      <Icon name="check" size={11} />
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </StaggerGroup>
  );
}
