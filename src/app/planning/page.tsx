'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { 
  formatDate, 
  addDays, 
  timeToMinutes, 
  minutesToTime, 
  formatDuration,
  generateId,
  todayISO
} from '@/lib/utils';
import { 
  initGoogleCalendar, 
  signInGoogle, 
  restoreGoogleToken,
  fetchCalendarEvents, 
  isGoogleCalendarConfigured,
  GoogleCalendarEvent
} from '@/lib/google-calendar';
import { PRIORITY_OPTIONS, Priority } from '@/lib/constants';

export default function PlanningPage() {
  const { state, addPlan, togglePlan, deletePlan } = useLifeOS();
  const { t, locale } = useI18n();

  const today = state.selectedDate || todayISO();
  const [planDate, setPlanDate] = useState<string>(() => addDays(today, 1));
  const [formDate, setFormDate] = useState<string>(() => addDays(today, 1));
  const [activeTab, setActiveTab] = useState<'timeline' | 'add' | 'summary'>('timeline');

  const handleDateChange = (newDate: string) => {
    setPlanDate(newDate);
    setFormDate(newDate);
  };

  // Form states
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'task' | 'event'>('task');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');

  // Google Calendar Integration states
  const [isGCalConfigured, setIsGCalConfigured] = useState(false);
  const [isGCalConnected, setIsGCalConnected] = useState(false);
  const [gcalEvents, setGcalEvents] = useState<GoogleCalendarEvent[]>([]);
  const [gcalSyncing, setGcalSyncing] = useState(false);

  const syncedRef = useRef<string>('');

  useEffect(() => {
    const configured = isGoogleCalendarConfigured();
    setIsGCalConfigured(configured);

    if (!configured) return;
    if (syncedRef.current === planDate) return;
    syncedRef.current = planDate;

    async function autoSync() {
      try {
        const initSuccess = await initGoogleCalendar();
        if (initSuccess) {
          const tokenActive = restoreGoogleToken();
          if (tokenActive) {
            setIsGCalConnected(true);
            setGcalSyncing(true);

            // Fetch tomorrow's events
            const events = await fetchCalendarEvents(planDate, planDate);
            setGcalEvents(events);

            // Auto-import google events to plans if they don't exist yet
            const existingPlans = [...state.nextDayPlans];

            for (const gevent of events) {
              const startIso = gevent.start.dateTime || gevent.start.date || '';
              const endIso = gevent.end.dateTime || gevent.end.date || '';
              
              const startT = startIso ? startIso.slice(11, 16) : '08:00';
              const endT = endIso ? endIso.slice(11, 16) : '09:00';

              const exists = existingPlans.some(
                (p) => p.googleEventId === gevent.id || 
                       (p.date === planDate && p.title === gevent.summary && p.startTime === startT)
              );

              if (!exists) {
                // Add temp plan to local track to prevent double sync in same run loop
                existingPlans.push({
                  id: 'temp-' + gevent.id,
                  date: planDate,
                  title: gevent.summary,
                  kind: 'event',
                  startTime: startT,
                  endTime: endT,
                  priority: 'Medium',
                  area: 'Google Calendar',
                  notes: gevent.description || 'Diimpor dari Google Calendar',
                  status: 'scheduled',
                  googleEventId: gevent.id,
                  createdAt: new Date().toISOString()
                });

                await addPlan({
                  date: planDate,
                  title: gevent.summary,
                  kind: 'event',
                  startTime: startT,
                  endTime: endT,
                  priority: 'Medium',
                  area: 'Google Calendar',
                  notes: gevent.description || 'Diimpor dari Google Calendar',
                  googleEventId: gevent.id
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('[Planning] Auto sync error:', err);
      } finally {
        setGcalSyncing(false);
      }
    }

    autoSync();
  }, [planDate, isGCalConfigured, state.nextDayPlans, addPlan]);

  const cleanedUpRef = useRef(false);

  useEffect(() => {
    if (!cleanedUpRef.current && state.nextDayPlans.length > 0) {
      cleanedUpRef.current = true;
      const runCleanup = async () => {
        const groups: Record<string, typeof state.nextDayPlans> = {};
        const idsToDelete: string[] = [];
        for (const p of state.nextDayPlans) {
          const key = `${p.date}_${p.title}_${p.startTime}`;
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(p);
        }
        
        for (const key in groups) {
          const list = groups[key];
          if (list.length > 1) {
            // Sort by createdAt ascending, keep the first one
            list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
            for (let i = 1; i < list.length; i++) {
              idsToDelete.push(list[i].id);
            }
          }
        }
        
        if (idsToDelete.length > 0) {
          console.log('[Cleanup] Deleting duplicates:', idsToDelete);
          for (const id of idsToDelete) {
            await deletePlan(id);
          }
        }
      };
      runCleanup();
    }
  }, [state.nextDayPlans, deletePlan]);

  const handleGoogleSync = async () => {
    setGcalSyncing(true);
    try {
      const initSuccess = await initGoogleCalendar();
      if (!initSuccess) {
        alert('Gagal inisialisasi Google API client. Periksa setup di docs/google-calendar-setup.md.');
        setGcalSyncing(false);
        return;
      }

      const token = await signInGoogle();
      if (token) {
        setIsGCalConnected(true);
        // Fetch events for tomorrow
        const events = await fetchCalendarEvents(planDate, planDate);
        setGcalEvents(events);
        
        // Auto-import google events to plans if they don't exist yet
        const existingPlans = [...state.nextDayPlans];

        for (const gevent of events) {
          const startIso = gevent.start.dateTime || gevent.start.date || '';
          const endIso = gevent.end.dateTime || gevent.end.date || '';
          
          const startT = startIso ? startIso.slice(11, 16) : '08:00';
          const endT = endIso ? endIso.slice(11, 16) : '09:00';

          const exists = existingPlans.some(
            (p) => p.googleEventId === gevent.id ||
                   (p.date === planDate && p.title === gevent.summary && p.startTime === startT)
          );

          if (!exists) {
            existingPlans.push({
              id: 'temp-' + gevent.id,
              date: planDate,
              title: gevent.summary,
              kind: 'event',
              startTime: startT,
              endTime: endT,
              priority: 'Medium',
              area: 'Google Calendar',
              notes: gevent.description || 'Diimpor dari Google Calendar',
              status: 'scheduled',
              googleEventId: gevent.id,
              createdAt: new Date().toISOString()
            });

            await addPlan({
              date: planDate,
              title: gevent.summary,
              kind: 'event',
              startTime: startT,
              endTime: endT,
              priority: 'Medium',
              area: 'Google Calendar',
              notes: gevent.description || 'Diimpor dari Google Calendar',
              googleEventId: gevent.id
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addPlan({
      date: formDate,
      title,
      kind,
      startTime,
      endTime,
      priority,
      area,
      notes,
    });

    setTitle('');
    setArea('');
    setNotes('');
    // Auto-progress time for convenience
    setStartTime(endTime);
    const startMins = timeToMinutes(endTime);
    setEndTime(minutesToTime(startMins + 60));
    
    // Automatically switch back to timeline view on mobile after adding
    setActiveTab('timeline');
  };

  const plans = state.nextDayPlans
    .filter((plan) => plan.date === planDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const doneCount = plans.filter((plan) => plan.status === 'done').length;
  const eventCount = plans.filter((plan) => plan.kind === 'event').length;
  const taskCount = plans.filter((plan) => plan.kind === 'task').length;

  const plannedMinutes = plans.reduce((sum, plan) => {
    const duration = timeToMinutes(plan.endTime) - timeToMinutes(plan.startTime);
    return sum + Math.max(duration, 0);
  }, 0);

  // Group plans by hour for the 24h timeline
  const plansForHour = (hour: number) => {
    const startMin = hour * 60;
    const endMin = startMin + 60;
    return plans.filter((plan) => {
      const m = timeToMinutes(plan.startTime);
      return m >= startMin && m < endMin;
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation Bar */}
      <Surface className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-life-line">
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="secondary"
            icon="chevronLeft"
            onClick={() => handleDateChange(addDays(planDate, -1))}
          >
            {""}
          </Button>
          <h2 className="text-sm sm:text-lg font-bold text-life-text min-w-[140px] sm:min-w-[200px] text-center capitalize truncate">
            {formatDate(planDate, { locale })}
          </h2>
          <Button
            size="sm"
            variant="secondary"
            icon="chevronRight"
            onClick={() => handleDateChange(addDays(planDate, 1))}
          >
            {""}
          </Button>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-life-muted uppercase whitespace-nowrap">Lompat ke:</span>
            <input
              type="date"
              value={planDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="glass-input text-xs py-1.5 px-3 h-9 rounded-lg w-full sm:w-[150px]"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleDateChange(addDays(today, 1))}
          >
            Besok
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleDateChange(today)}
          >
            Hari Ini
          </Button>
        </div>
      </Surface>

      {/* Mobile Tab Navigation */}
      <div className="flex md:hidden bg-white/[0.02] p-1.5 rounded-xl border border-life-line gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold text-center transition-all ${
            activeTab === 'timeline'
              ? 'bg-life-teal text-white shadow-md'
              : 'text-life-muted hover:text-life-text'
          }`}
        >
          🕒 Timeline
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold text-center transition-all ${
            activeTab === 'add'
              ? 'bg-life-teal text-white shadow-md'
              : 'text-life-muted hover:text-life-text'
          }`}
        >
          📝 Tambah
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold text-center transition-all ${
            activeTab === 'summary'
              ? 'bg-life-teal text-white shadow-md'
              : 'text-life-muted hover:text-life-text'
          }`}
        >
          📊 Ringkasan
        </button>
      </div>

      {/* Top statistics widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <Surface className={`p-6 ${activeTab === 'add' ? 'block' : 'hidden md:block'}`}>
          <div className="border-b border-life-line pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                Planning Harian
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                Susun agenda kegiatan untuk hari yang dipilih.
              </p>
            </div>
            {isGCalConfigured && (
              <Button 
                size="sm" 
                variant="secondary" 
                icon="globe" 
                onClick={handleGoogleSync}
                disabled={gcalSyncing}
              >
                {gcalSyncing ? 'Syncing...' : (isGCalConnected ? 'Tersinkronisasi (Klik untuk Sinkronisasi Manual)' : t('planning_google_sync'))}
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col space-y-1 md:col-span-1">
                <label htmlFor="planDateInput" className="text-xs font-bold text-life-muted uppercase">
                  Tanggal Rencana
                </label>
                <input
                  id="planDateInput"
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>
              <div className="flex flex-col space-y-1 md:col-span-2">
                <label htmlFor="planTitle" className="text-xs font-bold text-life-muted uppercase">
                  {t('planning_event_task')}
                </label>
                <input
                  id="planTitle"
                  type="text"
                  required
                  placeholder={t('planning_event_placeholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="planKind" className="text-xs font-bold text-life-muted uppercase">
                  {t('planning_type')}
                </label>
                <select
                  id="planKind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as 'task' | 'event')}
                  className="glass-select text-xs"
                >
                  <option value="task">{t('planning_task')}</option>
                  <option value="event">{t('planning_event')}</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="planStart" className="text-xs font-bold text-life-muted uppercase">
                  {t('planning_start')}
                </label>
                <input
                  id="planStart"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="planEnd" className="text-xs font-bold text-life-muted uppercase">
                  {t('planning_end')}
                </label>
                <input
                  id="planEnd"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label htmlFor="planPriority" className="text-xs font-bold text-life-muted uppercase">
                  {t('priority')}
                </label>
                <select
                  id="planPriority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="glass-select text-xs"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="planArea" className="text-xs font-bold text-life-muted uppercase">
                  {t('area')}
                </label>
                <input
                  id="planArea"
                  type="text"
                  placeholder="Career, Health, Personal..."
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="planNotes" className="text-xs font-bold text-life-muted uppercase">
                {t('notes')}
              </label>
              <textarea
                id="planNotes"
                placeholder="Catatan agenda atau link meeting..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input text-xs h-16"
              />
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full">
              Tambah Rencana Harian
            </Button>
          </form>
        </Surface>

        {/* Right: Summary */}
        <Surface className={`p-6 flex flex-col justify-between ${activeTab === 'summary' ? 'block' : 'hidden lg:flex'}`}>
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              Ringkasan - {formatDate(planDate, { locale })}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {doneCount} {t('dash_of')} {plans.length} {t('planning_items_done')}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 items-center">
            <div className="bg-white/[0.01] border border-life-line rounded-xl p-4 flex flex-col items-center">
              <span className="text-[10px] text-life-muted uppercase font-bold tracking-wider">{t('planning_total')}</span>
              <strong className="text-2xl text-life-text mt-1">{plans.length}</strong>
            </div>
            <div className="bg-white/[0.01] border border-life-line rounded-xl p-4 flex flex-col items-center">
              <span className="text-[10px] text-life-muted uppercase font-bold tracking-wider">{t('planning_scheduled')}</span>
              <strong className="text-2xl text-life-text mt-1">{formatDuration(plannedMinutes)}</strong>
            </div>
            <div className="bg-white/[0.01] border border-life-line rounded-xl p-4 flex flex-col items-center">
              <span className="text-[10px] text-life-muted uppercase font-bold tracking-wider">{t('planning_task')}</span>
              <strong className="text-xl text-life-indigo font-black mt-1">{taskCount}</strong>
            </div>
            <div className="bg-white/[0.01] border border-life-line rounded-xl p-4 flex flex-col items-center">
              <span className="text-[10px] text-life-muted uppercase font-bold tracking-wider">{t('planning_event')}</span>
              <strong className="text-xl text-life-teal font-black mt-1">{eventCount}</strong>
            </div>
          </div>
        </Surface>
      </div>

      {/* Visual 24-Hour Time Blocks */}
      <Surface className={`p-6 ${activeTab === 'timeline' ? 'block' : 'hidden md:block'}`}>
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('planning_timeline_24')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {t('planning_timeline_desc')} {formatDate(planDate, { locale })}
          </p>
        </div>

        {/* 24h block visual wrapper */}
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
          {Array.from({ length: 24 }, (_, hour) => {
            const hourPlans = plansForHour(hour);
            return (
              <div 
                key={hour} 
                className="flex items-center space-x-4 border-b border-white/[0.02] py-2 px-1 hover:bg-white/[0.005] rounded transition-all"
              >
                <span className="text-[10px] font-black text-life-muted w-10 text-right">
                  {String(hour).padStart(2, '0')}:00
                </span>
                <div className="flex-1 flex flex-wrap gap-2">
                  {hourPlans.length > 0 ? (
                    hourPlans.map((plan) => (
                      <div 
                        key={plan.id}
                        onClick={() => togglePlan(plan.id)}
                        className={`text-xs p-2 rounded-lg border flex-1 min-w-[150px] cursor-pointer select-none transition-all duration-150 ${
                          plan.status === 'done'
                            ? 'bg-life-green-soft/10 border-life-green/20 line-through text-life-muted'
                            : plan.kind === 'event'
                              ? 'bg-life-teal-soft/10 border-life-teal/30 hover:border-life-teal/60 text-teal-300'
                              : 'bg-life-indigo-soft/10 border-life-indigo/30 hover:border-life-indigo/60 text-indigo-300'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <strong className="block truncate">{plan.title}</strong>
                          <Badge tone={plan.priority === 'High' ? 'rose' : plan.priority === 'Medium' ? 'amber' : 'gray'}>
                            {plan.priority}
                          </Badge>
                        </div>
                        <p className="text-[9px] text-life-muted mt-0.5">
                          ⏰ {plan.startTime} - {plan.endTime} / {plan.area || '-'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-white/5 font-semibold select-none italic">
                      {t('planning_empty_hour')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Surface>

      {/* Tomorrow Plans Simple List */}
      <Surface className={`p-6 ${activeTab === 'timeline' ? 'block' : 'hidden md:block'}`}>
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            Daftar Rencana - {formatDate(planDate, { locale })}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {t('planning_sort_time')}
          </p>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {plans.length > 0 ? (
            plans.map((plan) => (
              <div 
                key={plan.id} 
                className="p-3.5 rounded-lg bg-white/[0.01] border border-life-line flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <strong className={`text-sm text-life-text block ${plan.status === 'done' ? 'line-through opacity-50' : ''}`}>
                    {plan.title}
                  </strong>
                  <p className="text-xs text-life-muted mt-0.5">
                    ⏰ {plan.startTime} - {plan.endTime} / {plan.area || 'General'} / {plan.kind}
                  </p>
                </div>

                <div className="flex space-x-1.5 shrink-0">
                  <button
                    onClick={() => togglePlan(plan.id)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      plan.status === 'done'
                        ? 'bg-life-green border-teal-400 text-white'
                        : 'bg-white/[0.03] border-life-line hover:bg-life-teal/20 text-life-muted'
                    }`}
                    title={t('tasks_done')}
                  >
                    <Icon name="check" size={14} />
                  </button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="w-8 h-8 rounded-lg bg-white/[0.03] border border-life-line hover:bg-life-rose/20 text-life-muted flex items-center justify-center transition-all"
                    title={t('delete')}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </Surface>
    </div>
  );
}
