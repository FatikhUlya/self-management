'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { MetricCard } from '@/components/ui/MetricCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SmartAlerts } from '@/components/ui/SmartAlerts';
import { MorningCheckIn } from '@/components/daily-command/MorningCheckIn';
import { EveningReview } from '@/components/daily-command/EveningReview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StaggerGroup, StaggerItem, fadeInUp, staggerContainer } from '@/lib/animations';
import {
  getGreetingKey,
  formatDate,
  percent,
  avg,
  addDays,
  cn,
} from '@/lib/utils';
import { PRIORITY_OPTIONS, Priority } from '@/lib/constants';

export default function Dashboard() {
  const {
    state,
    addTask,
    addIdea,
    updateTaskStatus,
    toggleHabit,
    togglePlan,
    saveDailyPlan,
    updateDailyPlan,
  } = useLifeOS();

  const { t, locale } = useI18n();

  // Dialog Controls
  const [showMorningModal, setShowMorningModal] = useState(false);
  const [showEveningModal, setShowEveningModal] = useState(false);

  // Quick Task Input State
  const [newQuickTask, setNewQuickTask] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'high' | 'done'>('all');

  // Quick Capture Form State
  const [captureTab, setCaptureTab] = useState<'idea' | 'note'>('idea');
  const [ideaTitle, setIdeaTitle] = useLocalStorageState('draft_dashboard_ideaTitle', '');
  const [ideaArea, setIdeaArea] = useLocalStorageState('draft_dashboard_ideaArea', 'Karir');
  const [ideaPriority, setIdeaPriority] = useLocalStorageState<Priority>('draft_dashboard_ideaPriority', 'Medium');
  const [ideaNotes, setIdeaNotes] = useLocalStorageState('draft_dashboard_ideaNotes', '');

  const today = state.selectedDate;
  const todayPlan = state.dailyPlans.find((p) => p.date === today);

  // Today's tasks (due or overdue, excluding done)
  const activeTodaysTasks = state.tasks
    .filter((task) => task.status !== 'done' && (!task.due || task.due <= today))
    .sort((a, b) => {
      const priorityWeight = (p: string) => ({ High: 3, P1: 3, Medium: 2, P2: 2, Low: 1, P3: 1 }[p] || 2);
      return priorityWeight(b.priority) - priorityWeight(a.priority);
    });

  const completedTodayTasks = state.tasks.filter(
    (task) => task.status === 'done' && task.completedAt?.slice(0, 10) === today
  );

  const doneTodayCount = completedTodayTasks.length;

  // Filtered task list
  const displayedTasks = (() => {
    if (taskFilter === 'done') return completedTodayTasks;
    if (taskFilter === 'high') {
      return activeTodaysTasks.filter((t) => t.priority === 'High' || t.priority === 'P1');
    }
    return activeTodaysTasks;
  })();

  // Habit metrics
  const habitsDoneCount = state.habitLogs.filter((log) => log.date === today).length;
  const habitPercent = percent(habitsDoneCount, state.habits.length);

  // Goal average
  const goalAverage = Math.round(avg(state.goals.map((g) => Number(g.progress) || 0)));

  // Journal streak count
  const journalStreak = () => {
    let streak = 0;
    let cursor = today;
    while (state.journals.some((j) => j.date === cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  };

  // Plans for today
  const todayPlans = state.nextDayPlans
    .filter((plan) => plan.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Health summary
  const dailyMeals = state.meals.filter((meal) => meal.date === today);
  const dailyCalories = dailyMeals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
  const dailyProtein = dailyMeals.reduce((sum, meal) => sum + Number(meal.protein || 0), 0);
  const dailyWorkoutMins = state.workouts
    .filter((item) => item.date === today)
    .reduce((sum, item) => sum + Number(item.minutes || 0), 0);

  // Journal details for selected date
  const selectedJournal = state.journals.find((j) => j.date === today);

  // Inline Quick Add Task Handler
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuickTask.trim()) return;

    await addTask({
      title: newQuickTask.trim(),
      priority: 'Medium',
      due: today,
      projectId: '',
    });

    setNewQuickTask('');
  };

  // Handle Quick Capture Form Submit
  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim()) return;

    await addIdea({
      title: ideaTitle,
      area: ideaArea,
      priority: ideaPriority,
      notes: ideaNotes,
    });

    // Reset Form
    setIdeaTitle('');
    setIdeaArea('Karir');
    setIdeaPriority('Medium');
    setIdeaNotes('');
  };

  const greetingKey = getGreetingKey();

  return (
    <StaggerGroup className="space-y-6 max-w-7xl mx-auto">
      {/* ═══════════════ Hero Header & Day Status ═══════════════ */}
      <StaggerItem>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.025em] leading-[1.15] text-foreground">
                {t(greetingKey)}, Fatikh!
              </h1>
              {todayPlan?.dayStatus === 'in_progress' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Hari Berjalan
                </span>
              )}
              {todayPlan?.dayStatus === 'day_closed' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                  <Icon name="check" size={10} />
                  Hari Selesai
                </span>
              )}
            </div>
            <p className="text-sm leading-[1.6] text-zinc-600 dark:text-zinc-400 mt-1 max-w-prose">
              {formatDate(today, { locale: locale === 'id' ? 'id-ID' : 'en-US' })} — Pusat kendali dan fokus eksekusi hari ini.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-2 shrink-0">
            {(!todayPlan || todayPlan.dayStatus === 'not_started') && (
              <Button
                variant="primary"
                size="sm"
                icon="sun"
                onClick={() => setShowMorningModal(true)}
                className="shadow-2xs font-semibold"
              >
                Mulai Hari Ini
              </Button>
            )}

            {todayPlan?.dayStatus === 'in_progress' && (
              <Button
                variant="secondary"
                size="sm"
                icon="moon"
                onClick={() => setShowEveningModal(true)}
                className="shadow-2xs font-semibold"
              >
                Akhiri Hari
              </Button>
            )}

            <Link href="/capture">
              <Button variant="ghost" size="sm" icon="plus" className="text-xs">
                Capture
              </Button>
            </Link>
          </div>
        </div>
      </StaggerItem>

      {/* ═══════════════ Smart Alerts Strip ═══════════════ */}
      <StaggerItem>
        <SmartAlerts />
      </StaggerItem>

      {/* ═══════════════ Executive Metric Row — 4 columns ═══════════════ */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
      >
        <motion.div variants={fadeInUp}>
          <MetricCard
            icon="checkSquare"
            label="Tugas Hari Ini"
            value={activeTodaysTasks.length}
            detail={`${doneTodayCount} selesai hari ini`}
            glow={activeTodaysTasks.length > 0}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <MetricCard
            icon="check"
            label="Habits Selesai"
            value={`${habitPercent}%`}
            detail={`${habitsDoneCount} dari ${state.habits.length} selesai`}
            glow={habitPercent >= 80}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <MetricCard
            icon="target"
            label="Kemajuan Goals"
            value={`${goalAverage}%`}
            detail={`${state.goals.length} target aktif`}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <MetricCard
            icon="zap"
            label="Konsistensi Jurnal"
            value={`${journalStreak()} hari`}
            detail={journalStreak() > 0 ? "Streak aktif" : "Belum terisi"}
            glow={journalStreak() > 2}
          />
        </motion.div>
      </motion.div>

      {/* ═══════════════ Main Command Grid (Left: Execution 7cols / Right: Context 5cols) ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ──────── Left Column: Focus & Execution Engine (7 cols) ──────── */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Today's Tasks & MIT */}
          <StaggerItem>
            <Surface className="p-5 md:p-6 space-y-4">
              {/* Header with Filter Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
                <div>
                  <h3 className="text-xs font-medium tracking-[0.02em] uppercase text-zinc-500 flex items-center gap-2">
                    <Icon name="checkSquare" size={14} className="text-primary" />
                    Tugas & Prioritas Hari Ini
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {activeTodaysTasks.length} tugas menunggu • {doneTodayCount} diselesaikan
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/60 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setTaskFilter('all')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all min-h-[40px] touch-manipulation shrink-0",
                      taskFilter === 'all'
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Semua ({activeTodaysTasks.length})
                  </button>
                  <button
                    onClick={() => setTaskFilter('high')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all min-h-[40px] touch-manipulation shrink-0",
                      taskFilter === 'high'
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Tinggi
                  </button>
                  <button
                    onClick={() => setTaskFilter('done')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all min-h-[40px] touch-manipulation shrink-0",
                      taskFilter === 'done'
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Selesai ({doneTodayCount})
                  </button>
                </div>
              </div>

              {/* Inline Quick Add Task */}
              <form onSubmit={handleQuickAddTask} className="relative">
                <input
                  type="text"
                  placeholder="+ Tambah tugas hari ini lalu tekan Enter..."
                  value={newQuickTask}
                  onChange={(e) => setNewQuickTask(e.target.value)}
                  className="glass-input text-xs pr-16 bg-muted/20 hover:bg-muted/30 focus:bg-background transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newQuickTask.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary text-primary-foreground disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  Enter ↵
                </button>
              </form>

              {/* Task Items List */}
              <div className="space-y-1.5 min-h-[140px] max-h-72 overflow-y-auto pr-1">
                {displayedTasks.length > 0 ? (
                  displayedTasks.map((task, index) => {
                    const isDone = task.status === 'done';
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.2 }}
                        className={cn(
                          "group flex items-center justify-between p-2.5 rounded-lg border transition-all select-none",
                          isDone
                            ? "bg-muted/20 border-border/50 text-muted-foreground opacity-75"
                            : "bg-muted/30 border-border/80 hover:border-border hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <button
                            type="button"
                            onClick={() => updateTaskStatus(task.id, isDone ? 'todo' : 'done')}
                            className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0",
                              isDone
                                ? "bg-primary border-primary text-primary-foreground"
                                : "bg-card border-input hover:border-primary text-transparent hover:text-primary/50"
                            )}
                            title={isDone ? "Tandai belum selesai" : "Tandai selesai"}
                          >
                            <Icon name="check" size={12} />
                          </button>
                          <div className="min-w-0">
                            <span className={cn(
                              "text-xs font-medium block truncate",
                              isDone && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {task.due && (
                                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                                  {formatDate(task.due)}
                                </span>
                              )}
                              {task.context && (
                                <span className="text-[10px] text-muted-foreground/80 truncate">
                                  • {task.context}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge 
                            tone={task.priority === 'High' || task.priority === 'P1' ? 'rose' : task.priority === 'Medium' || task.priority === 'P2' ? 'amber' : 'gray'}
                            className="text-[10px]"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <EmptyState
                    title={taskFilter === 'done' ? "Belum ada tugas selesai" : "Tidak ada tugas"}
                    description={taskFilter === 'done' ? "Selesaikan tugas dari daftar hari ini." : "Semua tugas beres atau belum ada yang dijadwalkan."}
                    compact
                  />
                )}
              </div>
            </Surface>
          </StaggerItem>

          {/* 2. Today's Habits Tracker */}
          <StaggerItem>
            <Surface className="p-5 md:p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-border/80 pb-3">
                <div>
                  <h3 className="text-xs font-medium tracking-[0.02em] uppercase text-zinc-500 flex items-center gap-2">
                    <Icon name="check" size={14} className="text-primary" />
                    Rutinitas & Habit Hari Ini
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {habitsDoneCount} dari {state.habits.length} habit selesai ({habitPercent}%)
                  </p>
                </div>
                <Link href="/habits">
                  <Button size="sm" variant="ghost" icon="arrowRight" className="text-xs">
                    Semua Habit
                  </Button>
                </Link>
              </div>

              {state.habits.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {state.habits.map((habit, index) => {
                    const isDone = state.habitLogs.some(
                      (log) => log.habitId === habit.id && log.date === today
                    );

                    return (
                      <motion.div
                        key={habit.id}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02, duration: 0.2 }}
                        onClick={() => toggleHabit(habit.id, today)}
                        className={cn(
                          "group flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all shadow-2xs",
                          isDone
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300"
                            : "bg-muted/30 border-border/80 hover:border-border hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-medium truncate block leading-tight">{habit.name}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                            {habit.area || 'Personal'}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0",
                            isDone 
                              ? "bg-primary border-primary text-primary-foreground scale-100" 
                              : "bg-card border-input text-transparent group-hover:border-primary/50 group-hover:text-primary/40"
                          )}
                        >
                          <Icon name="check" size={11} />
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="Belum ada habit"
                  description="Tambahkan rutinitas harian pertama Anda di halaman Habits."
                  compact
                />
              )}
            </Surface>
          </StaggerItem>

          {/* 3. Today's Agenda / Timeline */}
          <StaggerItem>
            <Surface className="p-5 md:p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-border/80 pb-3">
                <div>
                  <h3 className="text-xs font-medium tracking-[0.02em] uppercase text-zinc-500 flex items-center gap-2">
                    <Icon name="calendar" size={14} className="text-primary" />
                    Agenda & Timeline
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {todayPlans.length} blok aktivitas terjadwal
                  </p>
                </div>
                <Link href="/planning">
                  <Button size="sm" variant="ghost" icon="calendar" className="text-xs">
                    Buka Timeline
                  </Button>
                </Link>
              </div>

              {todayPlans.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {todayPlans.map((plan, index) => {
                    const isDone = plan.status === 'done';
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.2 }}
                        onClick={() => togglePlan(plan.id)}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer select-none transition-all shadow-2xs",
                          isDone
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300 opacity-80"
                            : "bg-muted/30 border-border/80 hover:border-border hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <div className="flex justify-between items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono tabular-nums text-muted-foreground font-medium">
                            {plan.startTime} - {plan.endTime}
                          </span>
                          <Badge tone={plan.kind === 'event' ? 'blue' : 'purple'} className="text-[9px]">
                            {plan.kind}
                          </Badge>
                        </div>
                        <strong className={cn(
                          "block text-xs font-medium truncate mt-0.5",
                          isDone && "line-through text-muted-foreground"
                        )}>
                          {plan.title}
                        </strong>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{plan.area || '-'}</p>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="Belum ada agenda"
                  description="Atur blok waktu harian Anda melalui halaman Planning."
                  compact
                />
              )}
            </Surface>
          </StaggerItem>

        </div>

        {/* ──────── Right Column: Pulse, Health & Reflection (5 cols) ──────── */}
        <div className="lg:col-span-5 space-y-6">

          {/* 1. Quick Capture Box */}
          <StaggerItem>
            <Surface className="p-5 md:p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-border/80 pb-3">
                <div>
                  <h3 className="text-xs font-medium tracking-[0.02em] uppercase text-zinc-500 flex items-center gap-2">
                    <Icon name="plus" size={14} className="text-primary" />
                    Tangkap Cepat (Capture)
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">Simpan ide atau catatan seketika</p>
                </div>
                <div className="flex gap-1 bg-muted/60 p-0.5 rounded-md border border-border/60">
                  <button
                    type="button"
                    onClick={() => setCaptureTab('idea')}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
                      captureTab === 'idea' ? "bg-card text-foreground font-semibold shadow-2xs" : "text-muted-foreground"
                    )}
                  >
                    Ide
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptureTab('note')}
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
                      captureTab === 'note' ? "bg-card text-foreground font-semibold shadow-2xs" : "text-muted-foreground"
                    )}
                  >
                    Catatan
                  </button>
                </div>
              </div>

              <form onSubmit={handleQuickCapture} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder={captureTab === 'idea' ? "Judul ide atau gagasan..." : "Catatan cepat..."}
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  className="glass-input text-xs"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={ideaArea || 'Karir'}
                    onChange={(e) => setIdeaArea(e.target.value)}
                    className="glass-select text-xs"
                  >
                    <option value="Karir">Karir</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="Kesehatan">Kesehatan</option>
                    <option value="Pembelajaran">Pembelajaran</option>
                    <option value="Personal">Personal</option>
                  </select>
                  <select
                    value={ideaPriority}
                    onChange={(e) => setIdeaPriority(e.target.value as Priority)}
                    className="glass-select text-xs"
                  >
                    {PRIORITY_OPTIONS.slice(0, 3).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  placeholder="Detail tambahan atau konteks singkat..."
                  value={ideaNotes}
                  onChange={(e) => setIdeaNotes(e.target.value)}
                  className="glass-input text-xs resize-none h-18"
                />

                <Button type="submit" variant="primary" icon="plus" size="sm" className="w-full font-semibold">
                  Simpan ke Inbox
                </Button>
              </form>
            </Surface>
          </StaggerItem>

          {/* 2. Health & Vitals */}
          <StaggerItem>
            <Surface className="p-5 md:p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-border/80 pb-3">
                <div>
                  <h3 className="text-xs font-medium tracking-[0.02em] uppercase text-zinc-500 flex items-center gap-2">
                    <Icon name="activity" size={14} className="text-primary" />
                    Kesehatan & Nutrisi
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">Ringkasan asupan dan latihan fisik</p>
                </div>
                <Link href="/health">
                  <Button size="sm" variant="ghost" icon="arrowRight" className="text-xs">
                    Health Hub
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                <ProgressBar
                  value={dailyCalories}
                  max={Number(state.healthProfile.mealGoalCalories || 2000)}
                  label="Target Kalori"
                  detail={`${dailyCalories} / ${state.healthProfile.mealGoalCalories || 2000} kcal`}
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-muted/40 border border-border/80 rounded-lg p-2.5 flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Protein</span>
                    <strong className="text-sm font-semibold text-foreground mt-0.5 font-mono tabular-nums">{dailyProtein}g</strong>
                  </div>
                  <div className="bg-muted/40 border border-border/80 rounded-lg p-2.5 flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Workout</span>
                    <strong className="text-sm font-semibold text-foreground mt-0.5 font-mono tabular-nums">{dailyWorkoutMins}m</strong>
                  </div>
                </div>
              </div>
            </Surface>
          </StaggerItem>

          {/* 3. Daily Compass (Rotating Principle) */}
          <StaggerItem>
            <Surface className="p-5 md:p-6 space-y-3">
              <div className="flex justify-between items-center border-b border-border/80 pb-2.5">
                <h3 className="text-xs font-medium tracking-[0.02em] uppercase text-zinc-500 flex items-center gap-2">
                  <Icon name="compass" size={14} className="text-primary" />
                  Kompas Hidup
                </h3>
                <Link href="/rules">
                  <Button size="sm" variant="ghost" icon="arrowRight" className="text-xs">
                    Rules
                  </Button>
                </Link>
              </div>

              {state.selfRules.length > 0 ? (
                (() => {
                  const dayOfYear = Math.floor(
                    (new Date(today).getTime() - new Date(today.substring(0, 4) + '-01-01').getTime()) / 86400000
                  );
                  const rule = state.selfRules[dayOfYear % state.selfRules.length];
                  return (
                    <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-1">
                      <p className="text-xs text-foreground font-medium italic leading-relaxed">
                        &ldquo;{rule.rule_text}&rdquo;
                      </p>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        Rotasi Prinsip #{rule.id?.slice(0, 4) || '1'}
                      </span>
                    </div>
                  );
                })()
              ) : (
                <EmptyState
                  title="Belum ada rule"
                  description="Tetapkan prinsip hidup Anda di halaman Rules."
                  compact
                />
              )}
            </Surface>
          </StaggerItem>

          {/* 4. Journal Quick Look */}
          <StaggerItem>
            <Surface className="p-5 md:p-6 space-y-3">
              <div className="flex justify-between items-center border-b border-border/80 pb-2.5">
                <div>
                  <h3 className="text-xs font-semibold text-foreground tracking-tight uppercase flex items-center gap-2">
                    <Icon name="journal" size={14} className="text-primary" />
                    Jurnal & Refleksi
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedJournal ? `Mood ${selectedJournal.mood}/5 • Energi ${selectedJournal.energy}/5` : 'Belum diisi hari ini'}
                  </p>
                </div>
                <Link href="/journal">
                  <Button size="sm" variant="ghost" icon="edit" className="text-xs">
                    {selectedJournal ? 'Buka' : 'Tulis'}
                  </Button>
                </Link>
              </div>

              {selectedJournal ? (
                <div className="space-y-2">
                  {selectedJournal.gratitude_1 && (
                    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/60">
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block">Gratitude</span>
                      <p className="text-xs text-foreground mt-0.5 leading-relaxed truncate">{selectedJournal.gratitude_1}</p>
                    </div>
                  )}
                  {selectedJournal.win && (
                    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/60">
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Daily Win</span>
                      <p className="text-xs text-foreground mt-0.5 leading-relaxed truncate">{selectedJournal.win}</p>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="Jurnal belum diisi"
                  description="Catat rasa syukur dan refleksi harian Anda."
                  compact
                />
              )}
            </Surface>
          </StaggerItem>

        </div>

      </div>

      {/* ═══════════════ Dialogs: Morning Check-in & Evening Review ═══════════════ */}
      <Dialog open={showMorningModal} onOpenChange={setShowMorningModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-border bg-card">
          <MorningCheckIn
            today={today}
            onStartDay={(plan) => {
              saveDailyPlan(plan as any);
              setShowMorningModal(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEveningModal} onOpenChange={setShowEveningModal}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-border bg-card">
          {todayPlan && (
            <EveningReview
              todayPlan={todayPlan}
              onCloseDay={(plan) => {
                updateDailyPlan(today, plan);
                setShowEveningModal(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </StaggerGroup>
  );
}
