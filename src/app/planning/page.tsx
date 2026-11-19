'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  formatDate, 
  addDays, 
  todayISO, 
  timeToMinutes, 
  minutesToTime,
  formatDuration,
  percent,
  cn 
} from '@/lib/utils';
import { PRIORITY_OPTIONS, Priority } from '@/lib/constants';
import { 
  initGoogleCalendar, 
  signInGoogle, 
  restoreGoogleToken,
  fetchCalendarEvents, 
  deleteCalendarEvent,
  isGoogleCalendarConfigured,
  GoogleCalendarEvent
} from '@/lib/google-calendar';

export default function PlanningHubPage() {
  const { state, addPlan, togglePlan, deletePlan, addTask } = useLifeOS();
  const { t, locale } = useI18n();

  const today = state.selectedDate || todayISO();
  const [selectedDate, setSelectedDate] = useState<string>(today);

  // Filter state
  const [filterKind, setFilterKind] = useState<'all' | 'task' | 'event'>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Plan Form State
  const [planTitle, setPlanTitle] = useState('');
  const [planKind, setKind] = useState<'task' | 'event'>('task');
  const [planStartTime, setStartTime] = useState('08:00');
  const [planEndTime, setEndTime] = useState('09:00');
  const [planPriority, setPriority] = useState<Priority>('Medium');
  const [planArea, setArea] = useState('Karir');
  const [planNotes, setNotes] = useState('');

  // Inline Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickStart, setQuickStart] = useState('09:00');
  const [quickEnd, setQuickEnd] = useState('10:00');

  // Google Calendar Integration State
  const [isGCalConfigured, setIsGCalConfigured] = useState(false);
  const [isGCalConnected, setIsGCalConnected] = useState(false);
  const [gcalSyncing, setGcalSyncing] = useState(false);

  // Sync date selection with app state if changed
  useEffect(() => {
    if (state.selectedDate && state.selectedDate !== selectedDate) {
      setSelectedDate(state.selectedDate);
    }
  }, [state.selectedDate]);

  // Pre-load Google Calendar client
  useEffect(() => {
    if (isGoogleCalendarConfigured()) {
      setIsGCalConfigured(true);
      initGoogleCalendar().catch((err) => console.error('[Planning] Pre-load GCal failed:', err));
      const tokenActive = restoreGoogleToken();
      if (tokenActive) {
        setIsGCalConnected(true);
      }
    }
  }, []);

  // Filtered plans for the chosen date
  const datePlans = state.nextDayPlans
    .filter((plan) => plan.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const filteredPlans = datePlans.filter((p) => {
    if (filterKind === 'all') return true;
    return p.kind === filterKind;
  });

  const totalPlansCount = datePlans.length;
  const donePlansCount = datePlans.filter((p) => p.status === 'done').length;
  const eventsCount = datePlans.filter((p) => p.kind === 'event').length;
  const tasksCount = datePlans.filter((p) => p.kind === 'task').length;
  const planCompletionRate = percent(donePlansCount, totalPlansCount || 1);

  // Total scheduled duration in minutes
  const totalScheduledMinutes = datePlans.reduce((sum, p) => {
    const startM = timeToMinutes(p.startTime);
    const endM = timeToMinutes(p.endTime);
    const dur = endM > startM ? endM - startM : 60;
    return sum + dur;
  }, 0);

  // Unscheduled tasks for today (tasks due today that aren't yet planned as a block)
  const unscheduledTasks = state.tasks
    .filter((t) => t.status !== 'done' && (!t.due || t.due === selectedDate))
    .slice(0, 5);

  // Handlers
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    await addPlan({
      date: selectedDate,
      title: quickTitle.trim(),
      kind: 'task',
      startTime: quickStart,
      endTime: quickEnd,
      priority: 'Medium',
      area: 'Personal',
      notes: '',
    });

    setQuickTitle('');
    // Auto-advance time
    setQuickStart(quickEnd);
    const nextEndMins = timeToMinutes(quickEnd) + 60;
    setQuickEnd(minutesToTime(nextEndMins));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) return;

    await addPlan({
      date: selectedDate,
      title: planTitle.trim(),
      kind: planKind,
      startTime: planStartTime,
      endTime: planEndTime,
      priority: planPriority,
      area: planArea,
      notes: planNotes,
    });

    setPlanTitle('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const handleScheduleTaskDirectly = (task: any) => {
    setPlanTitle(task.title);
    setPriority(task.priority || 'Medium');
    setKind('task');
    setIsAddModalOpen(true);
  };

  const handleGoogleSync = async () => {
    setGcalSyncing(true);
    try {
      const isLoaded = typeof window !== 'undefined' && !!window.gapi?.client?.calendar && !!window.google?.accounts?.oauth2;
      if (!isLoaded) {
        const initSuccess = await initGoogleCalendar();
        if (!initSuccess) {
          alert('Gagal inisialisasi Google API client.');
          setGcalSyncing(false);
          return;
        }
      }

      const token = await signInGoogle();
      if (token) {
        setIsGCalConnected(true);
        const events = await fetchCalendarEvents(selectedDate, selectedDate);
        
        for (const gevent of events) {
          if (gevent.summary?.startsWith('[Tugas]')) continue;
          
          const startIso = gevent.start?.dateTime || gevent.start?.date || '';
          const endIso = gevent.end?.dateTime || gevent.end?.date || '';
          const startT = startIso.includes('T') ? startIso.slice(11, 16) : '08:00';
          const endT = endIso.includes('T') ? endIso.slice(11, 16) : '09:00';

          const exists = datePlans.some(p => p.googleEventId === gevent.id || (p.title === gevent.summary && p.startTime === startT));
          if (!exists) {
            await addPlan({
              date: selectedDate,
              title: gevent.summary || 'Google Calendar Event',
              kind: 'event',
              startTime: startT,
              endTime: endT,
              priority: 'Medium',
              area: 'Google Calendar',
              notes: gevent.description || '',
              googleEventId: gevent.id,
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error saat sinkronisasi Google Calendar.');
    } finally {
      setGcalSyncing(false);
    }
  };

  return (
    <StaggerGroup className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ═══════════════ Header ═══════════════ */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.025em] leading-[1.15] text-foreground flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon name="calendar" size={17} />
              </span>
              Perencanaan & Timeline (Planning)
            </h1>
            <p className="text-sm leading-[1.6] text-zinc-600 dark:text-zinc-400 mt-1 max-w-prose">
              Alokasikan waktu harian, blok agenda terstruktur, dan sinkronisasi kalender.
            </p>
          </div>

          {/* Quick Date Pills & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60">
              <button
                onClick={() => setSelectedDate(today)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                  selectedDate === today
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setSelectedDate(addDays(today, 1))}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                  selectedDate === addDays(today, 1)
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Besok
              </button>
              <label className="flex items-center px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                <Icon name="calendar" size={12} className="mr-1" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="bg-transparent border-none p-0 text-xs font-mono outline-none cursor-pointer text-foreground"
                />
              </label>
            </div>

            {isGCalConfigured && (
              <Button
                variant="outline"
                size="sm"
                icon="globe"
                onClick={handleGoogleSync}
                disabled={gcalSyncing}
                className="text-xs font-medium"
              >
                {gcalSyncing ? 'Syncing...' : isGCalConnected ? 'GCal Sync' : 'Hubungkan GCal'}
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              icon="plus"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-semibold shadow-2xs"
            >
              Tambah Agenda
            </Button>
          </div>
        </div>
      </StaggerItem>

      {/* ═══════════════ Planning Metrics ═══════════════ */}
      <StaggerItem>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <MetricCard
            icon="calendar"
            label="Total Blok Agenda"
            value={totalPlansCount}
            detail={`${eventsCount} event • ${tasksCount} tugas`}
            glow={totalPlansCount > 0}
          />
          <MetricCard
            icon="check"
            label="Agenda Selesai"
            value={donePlansCount}
            detail={`${planCompletionRate}% dari total blok`}
            glow={planCompletionRate >= 70}
          />
          <MetricCard
            icon="clock"
            label="Durasi Terjadwal"
            value={formatDuration(totalScheduledMinutes)}
            detail="Total alokasi waktu produktif"
          />
          <MetricCard
            icon="checkSquare"
            label="Tugas Backlog"
            value={unscheduledTasks.length}
            detail="Tugas hari ini siap dijadwalkan"
          />
        </div>
      </StaggerItem>

      {/* ═══════════════ 2-Column Planning Workspace ═══════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ──────── Left Column: Chronological Timeline (7 cols) ──────── */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Timeline Surface */}
          <Surface className="p-5 md:p-6 space-y-4">
            
            {/* Header & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
              <div>
                <h3 className="text-xs font-semibold text-foreground tracking-tight uppercase flex items-center gap-2">
                  <Icon name="clock" size={14} className="text-primary" />
                  Jadwal & Kronologi ({formatDate(selectedDate, { locale: locale === 'id' ? 'id-ID' : 'en-US' })})
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {totalPlansCount} sesi waktu • {donePlansCount} selesai
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border/60">
                <button
                  onClick={() => setFilterKind('all')}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all",
                    filterKind === 'all'
                      ? "bg-card text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Semua ({totalPlansCount})
                </button>
                <button
                  onClick={() => setFilterKind('task')}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all",
                    filterKind === 'task'
                      ? "bg-card text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Tugas ({tasksCount})
                </button>
                <button
                  onClick={() => setFilterKind('event')}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all",
                    filterKind === 'event'
                      ? "bg-card text-foreground font-semibold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Acara ({eventsCount})
                </button>
              </div>
            </div>

            {/* Inline Fast Add Row */}
            <form onSubmit={handleQuickAdd} className="flex items-center gap-2 bg-muted/20 p-2 rounded-lg border border-border/70">
              <input
                type="text"
                placeholder="+ Tambah agenda cepat..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="glass-input py-1 text-xs flex-1 bg-background"
              />
              <input
                type="time"
                value={quickStart}
                onChange={(e) => setQuickStart(e.target.value)}
                className="glass-input py-1 px-2 text-xs w-20 font-mono text-center bg-background"
              />
              <span className="text-xs text-muted-foreground">-</span>
              <input
                type="time"
                value={quickEnd}
                onChange={(e) => setQuickEnd(e.target.value)}
                className="glass-input py-1 px-2 text-xs w-20 font-mono text-center bg-background"
              />
              <Button type="submit" variant="primary" size="sm" disabled={!quickTitle.trim()} className="text-xs shrink-0 py-1">
                Jadwalkan
              </Button>
            </form>

            {/* Timeline Items List */}
            <div className="space-y-2 pt-1 min-h-[240px]">
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan, index) => {
                  const isDone = plan.status === 'done';
                  const startM = timeToMinutes(plan.startTime);
                  const endM = timeToMinutes(plan.endTime);
                  const duration = endM > startM ? endM - startM : 60;

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-lg border transition-all select-none shadow-2xs",
                        isDone
                          ? "bg-muted/20 border-border/50 text-muted-foreground opacity-80"
                          : "bg-muted/30 border-border/80 hover:border-border hover:bg-muted/50 text-foreground"
                      )}
                    >
                      {/* Left: Checkbox + Time Badge + Title */}
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <button
                          type="button"
                          onClick={() => togglePlan(plan.id)}
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
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-semibold text-foreground tabular-nums">
                              {plan.startTime} - {plan.endTime}
                            </span>
                            <span className="text-[10px] text-muted-foreground/70 font-mono">
                              ({formatDuration(duration)})
                            </span>
                            <Badge tone={plan.kind === 'event' ? 'blue' : 'purple'} className="text-[9px]">
                              {plan.kind}
                            </Badge>
                            {plan.googleEventId && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                                GCal
                              </span>
                            )}
                          </div>
                          
                          <strong className={cn(
                            "block text-xs font-medium text-foreground mt-0.5 truncate",
                            isDone && "line-through text-muted-foreground"
                          )}>
                            {plan.title}
                          </strong>

                          {plan.notes && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {plan.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Area Tag & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {plan.area && (
                          <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium">
                            {plan.area}
                          </span>
                        )}

                        <button
                          onClick={() => deletePlan(plan.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title="Hapus Agenda"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <EmptyState
                  title="Belum ada agenda pada tanggal ini"
                  description="Susun blok waktu produktif Anda dengan form di atas atau tombol Tambah Agenda."
                  action={{
                    label: 'Tambah Agenda',
                    onClick: () => setIsAddModalOpen(true),
                  }}
                  compact
                />
              )}
            </div>
          </Surface>

        </div>

        {/* ──────── Right Column: Task Scheduler Backlog & Time Allocation (5 cols) ──────── */}
        <div className="lg:col-span-5 space-y-6">

          {/* 1. Quick Task Scheduler Backlog */}
          <StaggerItem>
            <Surface className="p-5 md:p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-border/80 pb-3">
                <div>
                  <h3 className="text-xs font-semibold text-foreground tracking-tight uppercase flex items-center gap-2">
                    <Icon name="checkSquare" size={14} className="text-primary" />
                    Tugas Siap Dijadwalkan
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Tarik tugas aktif ke dalam timeline hari ini
                  </p>
                </div>
                <Link href="/projects">
                  <Button size="sm" variant="ghost" icon="arrowRight" className="text-xs">
                    Semua Tugas
                  </Button>
                </Link>
              </div>

              {unscheduledTasks.length > 0 ? (
                <div className="space-y-2">
                  {unscheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-medium text-foreground block truncate">{task.title}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge tone={task.priority === 'High' ? 'rose' : 'gray'} className="text-[9px]">
                            {task.priority}
                          </Badge>
                          {task.due && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {formatDate(task.due)}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleScheduleTaskDirectly(task)}
                        className="text-[11px] py-1 px-2.5 shrink-0"
                      >
                        + Jadwalkan
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Semua tugas terjadwal"
                  description="Tidak ada backlog tugas mendesak untuk tanggal ini."
                  compact
                />
              )}
            </Surface>
          </StaggerItem>

          {/* 2. Scheduled Time Allocation Breakdown */}
          <StaggerItem>
            <Surface className="p-5 md:p-6 space-y-4">
              <div className="border-b border-border/80 pb-3">
                <h3 className="text-xs font-semibold text-foreground tracking-tight uppercase flex items-center gap-2">
                  <Icon name="activity" size={14} className="text-primary" />
                  Alokasi Waktu Hari Ini
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Distribusi jam kerja berdasarkan area kehidupan
                </p>
              </div>

              <div className="space-y-3">
                <ProgressBar
                  value={totalScheduledMinutes}
                  max={480} // 8 hours typical active workday
                  label="Kapasitas Waktu Produktif (Target 8 Jam)"
                  detail={`${formatDuration(totalScheduledMinutes)} / 8 jam`}
                />

                <div className="pt-2 border-t border-border/60 space-y-2">
                  {(() => {
                    const areaMinutes: Record<string, number> = {};
                    datePlans.forEach((p) => {
                      const area = p.area || 'Lainnya';
                      const startM = timeToMinutes(p.startTime);
                      const endM = timeToMinutes(p.endTime);
                      const dur = endM > startM ? endM - startM : 60;
                      areaMinutes[area] = (areaMinutes[area] || 0) + dur;
                    });

                    const entries = Object.entries(areaMinutes);
                    if (entries.length === 0) {
                      return <p className="text-xs text-muted-foreground">Belum ada alokasi waktu tercatat.</p>;
                    }

                    return entries.map(([area, mins]) => (
                      <div key={area} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">{area}</span>
                        <span className="font-mono text-foreground font-semibold tabular-nums">{formatDuration(mins)}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </Surface>
          </StaggerItem>

        </div>

      </div>

      {/* ═══════════════ MODAL: TAMBAH AGENDA ═══════════════ */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold tracking-tight">Tambah Agenda / Blok Waktu</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Judul Agenda</label>
              <input
                type="text"
                required
                placeholder="Contoh: Sprint Review, Belajar TypeScript, Olahraga"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mulai</label>
                <input
                  type="time"
                  required
                  value={planStartTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="glass-input text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selesai</label>
                <input
                  type="time"
                  required
                  value={planEndTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="glass-input text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jenis</label>
                <select
                  value={planKind}
                  onChange={(e) => setKind(e.target.value as any)}
                  className="glass-select text-xs w-full"
                >
                  <option value="task">Tugas (Task Block)</option>
                  <option value="event">Acara (Meeting / Event)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Area</label>
                <select
                  value={planArea}
                  onChange={(e) => setArea(e.target.value)}
                  className="glass-select text-xs w-full"
                >
                  <option value="Karir">Karir</option>
                  <option value="Keuangan">Keuangan</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="Pembelajaran">Pembelajaran</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catatan Tambahan</label>
              <textarea
                placeholder="Detail agenda, link meeting, atau persiapan..."
                value={planNotes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input text-xs resize-none h-16"
              />
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-semibold">
              Simpan ke Jadwal
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </StaggerGroup>
  );
}
