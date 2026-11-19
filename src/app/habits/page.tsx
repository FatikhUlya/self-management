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
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.025em] leading-[1.15] text-foreground flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Icon name="check" size={17} />
              </span>
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
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all min-h-[44px] touch-manipulation",
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
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all min-h-[44px] touch-manipulation",
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
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all min-h-[44px] touch-manipulation",
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
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Area:</span>
                <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                  <button
                    onClick={() => setSelectedArea('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
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
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap",
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
                  placeholder="+ Tambah habit cepat... [Enter]"
                  value={quickHabitName}
                  onChange={(e) => setQuickHabitName(e.target.value)}
                  className="glass-input py-1.5 pr-14 text-xs bg-muted/20 hover:bg-muted/30 focus:bg-background transition-colors"
                />
                <button
                  type="submit"
                  disabled={!quickHabitName.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary text-primary-foreground disabled:opacity-30 transition-all"
                >
                  Enter ↵
                </button>
              </form>
            </div>

            {/* Matrix View */}
            {filteredHabits.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-[640px] divide-y divide-border/60">
                  {/* Table Header: Days of the week */}
                  <div className="flex items-center justify-between pb-2 text-[11px] font-medium text-muted-foreground">
                    <span className="w-2/5">Nama Kebiasaan & Streak</span>
                    <div className="w-3/5 flex items-center justify-around">
                      {sevenDays.map((d) => {
                        const isCurrentDay = d === today;
                        return (
                          <div
                            key={d}
                            className={cn(
                              "flex flex-col items-center justify-center w-10 py-1 rounded-md transition-colors",
                              isCurrentDay && "bg-primary/10 text-primary font-bold border border-primary/20"
                            )}
                          >
                            <span className="text-[10px] uppercase">{dayName(d, 'id-ID')}</span>
                            <span className="text-xs font-mono">{d.slice(8, 10)}</span>
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
                        className="py-3 flex items-center justify-between group hover:bg-muted/20 rounded-lg px-1 transition-colors select-none"
                      >
                        {/* Habit Title & Metadata */}
                        <div className="w-2/5 pr-4 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs font-semibold text-foreground truncate block">
                              {habit.name}
                            </strong>
                            {streak > 0 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                🔥 {streak}h
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                            <span>{habit.area || 'Personal'}</span>
                            {goal && <span>• 🎯 {goal.title.slice(0, 16)}</span>}
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
                                className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                  isDone
                                    ? "bg-primary border border-primary text-primary-foreground shadow-2xs scale-100"
                                    : "bg-muted/40 border border-border/80 hover:border-primary/50 text-transparent hover:text-muted-foreground/40",
                                  isCurrentDay && !isDone && "ring-1 ring-primary/40 border-primary/50"
                                )}
                                title={`${habit.name} — ${formatDate(dateStr)}: ${isDone ? 'Selesai' : 'Belum'}`}
                              >
                                <Icon name="check" size={13} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
                <h3 className="text-sm font-bold tracking-tight text-foreground font-mono">
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
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
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
                <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground uppercase py-1">
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
                  return 'bg-primary text-primary-foreground border-primary font-bold';
                })();

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    className={cn(
                      "h-14 p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all hover:scale-[1.02] shadow-2xs",
                      toneClass,
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    <span className="text-[11px] font-mono leading-none">{dayNumber}</span>
                    {pct > 0 && (
                      <span className="text-[9px] font-mono text-right font-semibold">{pct}%</span>
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
                    className="p-5 flex flex-col justify-between space-y-4 hover:shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Icon name="check" size={15} />
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-foreground tracking-tight truncate leading-tight">
                              {habit.name}
                            </h3>
                            <span className="text-[10px] text-muted-foreground block truncate">{habit.area || 'Personal'}</span>
                          </div>
                        </div>

                        <Badge tone="teal" className="text-[10px]">
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
                        <span className="font-mono font-bold text-foreground">🔥 {streak} hari</span>
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Habit</label>
              <input
                type="text"
                required
                placeholder="Contoh: Membaca 20 halaman, Workout 30m, Meditasi"
                value={habitName}
                onChange={(e) => setHabitName(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Area</label>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frekuensi</label>
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kaitkan ke Goal (Opsional)</label>
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Habit</label>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Area</label>
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
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target/mg</label>
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
                      "p-3 rounded-lg border cursor-pointer select-none transition-all flex items-center justify-between text-xs",
                      isDone
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-semibold"
                        : "bg-muted/30 border-border text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>{habit.name}</span>
                    <span className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center border transition-all",
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
