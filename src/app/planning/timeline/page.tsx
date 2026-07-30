'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  formatDuration,
  todayISO
} from '@/lib/utils';
import { 
  initGoogleCalendar, 
  signInGoogle, 
  restoreGoogleToken,
  fetchCalendarEvents, 
  deleteCalendarEvent,
  isGoogleCalendarConfigured,
  GoogleCalendarEvent
} from '@/lib/google-calendar';
import { useRouter } from 'next/navigation';

export default function PlanningTimelinePage() {
  const { state, togglePlan, deletePlan, addPlan } = useLifeOS();
  const { t, locale } = useI18n();
  const router = useRouter();

  const today = state.selectedDate || todayISO();
  const [planDate, setPlanDate] = useState<string>(() => addDays(today, 1));
  const [isGCalConfigured, setIsGCalConfigured] = useState(false);
  const [isGCalConnected, setIsGCalConnected] = useState(false);
  const [gcalEvents, setGcalEvents] = useState<GoogleCalendarEvent[]>([]);
  const [gcalSyncing, setGcalSyncing] = useState(false);

  const syncedRef = useRef<string>('');
  // Use a ref to read state.nextDayPlans inside useEffect without it being a dependency
  const plansRef = useRef(state.nextDayPlans);
  plansRef.current = state.nextDayPlans;

  // Helper: get dismissed GCal IDs from localStorage
  const getDismissedGCalIds = (): string[] => {
    try {
      const raw = localStorage.getItem('dismissed_gcal_ids') || '[]';
      return JSON.parse(raw) as string[];
    } catch { return []; }
  };

  // Helper: remove an ID from the dismissed list (when GCal delete succeeds)
  const removeDismissedId = (id: string) => {
    try {
      const raw = localStorage.getItem('dismissed_gcal_ids') || '[]';
      const dismissed: string[] = JSON.parse(raw);
      const updated = dismissed.filter(d => d !== id);
      localStorage.setItem('dismissed_gcal_ids', JSON.stringify(updated));
    } catch { /* ignore */ }
  };

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

            const events = await fetchCalendarEvents(planDate, planDate);
            setGcalEvents(events);

            // Read current plans via ref (avoids dependency on state)
            const currentPlans = plansRef.current;
            const dismissed = getDismissedGCalIds();

            // 1) Retry deleting previously dismissed events from GCal
            for (const dismissedId of dismissed) {
              try {
                await deleteCalendarEvent(dismissedId);
                removeDismissedId(dismissedId);
              } catch { /* still dismissed, will retry next time */ }
            }

            // 2) Remove local plans whose GCal event no longer exists
            //    (only for plans on THIS date that came from GCal)
            const fetchedEventIds = new Set(events.map(e => e.id));
            const localGCalPlansForDate = currentPlans.filter(
              p => p.googleEventId && p.date === planDate
            );
            for (const localPlan of localGCalPlansForDate) {
              if (localPlan.googleEventId && !fetchedEventIds.has(localPlan.googleEventId)) {
                await deletePlan(localPlan.id);
              }
            }

            // 3) Import new GCal events that don't exist locally yet
            //    Use googleEventId as the primary unique key
            const existingGCalIds = new Set(
              currentPlans
                .filter(p => p.googleEventId)
                .map(p => p.googleEventId)
            );

            for (const gevent of events) {
              // Skip task-type events created by our app
              if (gevent.summary?.startsWith('[Tugas]')) continue;
              // Skip events that the user previously dismissed/deleted
              if (dismissed.includes(gevent.id)) continue;
              // Skip events that already exist in our database
              if (existingGCalIds.has(gevent.id)) continue;

              const startIso = gevent.start.dateTime || gevent.start.date || '';
              const endIso = gevent.end.dateTime || gevent.end.date || '';
              
              // Extract time; for all-day events (no 'T' in string), use defaults
              const startT = startIso.includes('T') ? startIso.slice(11, 16) : '08:00';
              const endT = endIso.includes('T') ? endIso.slice(11, 16) : '09:00';

              // Also check by title+time as a fallback for plans without googleEventId
              const duplicateByContent = currentPlans.some(
                p => p.date === planDate && p.title === gevent.summary && p.startTime === startT
              );
              if (duplicateByContent) continue;

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

              // Track in set so subsequent loop iterations won't duplicate
              existingGCalIds.add(gevent.id);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planDate]);

  // Pre-load Google Calendar client
  useEffect(() => {
    if (isGoogleCalendarConfigured()) {
      initGoogleCalendar().catch((err) => console.error('[Planning] Pre-load GCal failed:', err));
    }
  }, []);

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
        // Reset syncedRef so auto-sync won't skip this date
        syncedRef.current = '';

        const events = await fetchCalendarEvents(planDate, planDate);
        setGcalEvents(events);
        
        const currentPlans = plansRef.current;
        const dismissed = getDismissedGCalIds();

        // 1) Retry deleting previously dismissed events from GCal
        for (const dismissedId of dismissed) {
          try {
            await deleteCalendarEvent(dismissedId);
            removeDismissedId(dismissedId);
          } catch { /* still dismissed, will retry next time */ }
        }

        // 2) Remove local plans whose GCal event no longer exists (date-scoped)
        const fetchedEventIds = new Set(events.map(e => e.id));
        const localGCalPlansForDate = currentPlans.filter(
          p => p.googleEventId && p.date === planDate
        );
        for (const localPlan of localGCalPlansForDate) {
          if (localPlan.googleEventId && !fetchedEventIds.has(localPlan.googleEventId)) {
            await deletePlan(localPlan.id);
          }
        }

        // 3) Import new GCal events
        const existingGCalIds = new Set(
          currentPlans
            .filter(p => p.googleEventId)
            .map(p => p.googleEventId)
        );

        for (const gevent of events) {
          if (gevent.summary?.startsWith('[Tugas]')) continue;
          if (dismissed.includes(gevent.id)) continue;
          if (existingGCalIds.has(gevent.id)) continue;

          const startIso = gevent.start.dateTime || gevent.start.date || '';
          const endIso = gevent.end.dateTime || gevent.end.date || '';
          
          const startT = startIso.includes('T') ? startIso.slice(11, 16) : '08:00';
          const endT = endIso.includes('T') ? endIso.slice(11, 16) : '09:00';

          const duplicateByContent = currentPlans.some(
            p => p.date === planDate && p.title === gevent.summary && p.startTime === startT
          );
          if (duplicateByContent) continue;

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

          existingGCalIds.add(gevent.id);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error saat sinkronisasi Google Calendar.');
    } finally {
      setGcalSyncing(false);
    }
  };

  const plans = state.nextDayPlans
    .filter((plan) => plan.date === planDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const plansForHour = (hour: number) => {
    const startMin = hour * 60;
    const endMin = startMin + 60;
    return plans.filter((plan) => {
      const m = timeToMinutes(plan.startTime);
      return m >= startMin && m < endMin;
    });
  };

  const doneCount = plans.filter((plan) => plan.status === 'done').length;
  const eventCount = plans.filter((plan) => plan.kind === 'event').length;
  const taskCount = plans.filter((plan) => plan.kind === 'task').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/planning">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="calendar" size={24} className="text-pink-500" />
            Timeline Agenda
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Lihat agenda Anda dalam tampilan 24 Jam penuh.
          </p>
        </div>
      </div>

      <Surface className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-life-line">
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="secondary"
            icon="chevronLeft"
            onClick={() => setPlanDate(addDays(planDate, -1))}
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
            onClick={() => setPlanDate(addDays(planDate, 1))}
          >
            {""}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-life-muted uppercase whitespace-nowrap">Lompat ke:</span>
            <input
              type="date"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              className="glass-input text-xs py-1.5 px-3 h-9 rounded-lg w-full sm:w-[150px]"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPlanDate(addDays(today, 1))}
          >
            {t('tomorrow')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPlanDate(today)}
          >
            {t('today')}
          </Button>
        </div>
      </Surface>

      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('planning_timeline')} (24 Jam)
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Geser ke bawah untuk melihat keseluruhan hari.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isGCalConfigured && (
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleGoogleSync} 
                disabled={gcalSyncing}
                className="gap-1.5"
              >
                <Icon name="calendar" size={12} className={gcalSyncing ? 'animate-spin' : ''} />
                {gcalSyncing ? 'Syncing...' : isGCalConnected ? 'Synced' : 'Sync GCal'}
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              icon="plus"
              onClick={() => router.push(`/planning/add?date=${planDate}`)}
            >
              Tambah Agenda
            </Button>
          </div>
        </div>

        <div className="relative border-l-2 border-white/10 ml-12 sm:ml-16 pb-8">
          {Array.from({ length: 24 }).map((_, hour) => {
            const hourPlans = plansForHour(hour);
            if (hourPlans.length === 0) {
              return (
                <div key={hour} className="relative group py-2">
                  <div className="absolute -left-12 sm:-left-16 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs font-black uppercase text-life-muted w-10 sm:w-12 text-right">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/10 border-2 border-[#121212]"></div>
                  <div className="border-b border-white/[0.02] h-full w-full opacity-50 pl-4 py-2 text-[10px] text-life-muted/30 italic group-hover:text-life-muted/60 transition-colors">
                    ...
                  </div>
                </div>
              );
            }

            return (
              <div key={hour} className="relative py-4">
                <div className="absolute -left-12 sm:-left-16 top-4 text-[10px] sm:text-xs font-black uppercase text-life-text w-10 sm:w-12 text-right">
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div className="absolute -left-[5px] top-5 w-2 h-2 rounded-full bg-life-teal border-2 border-[#121212] shadow-[0_0_8px_rgba(20,184,166,0.6)]"></div>

                <div className="pl-6 space-y-3">
                  {hourPlans.map((plan) => (
                    <div 
                      key={plan.id}
                      className={`
                        group relative rounded-xl border p-4 transition-all duration-300
                        ${plan.status === 'done' 
                          ? 'bg-white/[0.005] border-white/5 opacity-50' 
                          : plan.kind === 'event' 
                            ? 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40' 
                            : 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40'
                        }
                      `}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-black text-life-text uppercase tracking-wider">
                              {plan.startTime} — {plan.endTime}
                            </span>
                            <Badge tone={plan.kind === 'event' ? 'indigo' : 'teal'} className="text-[9px] py-0 px-1.5 uppercase font-black tracking-widest">
                              {plan.kind}
                            </Badge>
                            {plan.googleEventId && (
                              <Badge tone="gray" className="text-[9px] py-0 px-1.5 flex items-center gap-1">
                                <Icon name="calendar" size={8} /> GCal
                              </Badge>
                            )}
                          </div>
                          <h4 className={`text-base font-bold text-life-text tracking-tight ${plan.status === 'done' ? 'line-through text-life-muted' : ''}`}>
                            {plan.title}
                          </h4>
                          {(plan.area || plan.notes) && (
                            <div className="mt-2 space-y-1 text-xs text-life-muted font-medium">
                              {plan.area && (
                                <p className="flex items-center gap-1.5">
                                  <Icon name="folder" size={12} className="text-life-teal shrink-0" />
                                  {plan.area}
                                </p>
                              )}
                              {plan.notes && (
                                <p className="flex items-start gap-1.5 line-clamp-2">
                                  <Icon name="alignLeft" size={12} className="text-amber-500 mt-0.5 shrink-0" />
                                  {plan.notes}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge tone={plan.priority === 'High' ? 'rose' : plan.priority === 'Medium' ? 'amber' : 'gray'} className="text-[10px]">
                            {plan.priority}
                          </Badge>
                          <button
                            onClick={() => togglePlan(plan.id)}
                            className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all ${
                              plan.status === 'done'
                                ? 'bg-life-green/20 border-life-green text-life-green'
                                : 'bg-black/40 border-white/10 hover:border-life-green hover:text-life-green text-life-muted'
                            }`}
                            title={plan.status === 'done' ? 'Batal Selesai' : 'Tandai Selesai'}
                          >
                            <Icon name="check" size={12} />
                          </button>
                          <button
                            onClick={() => deletePlan(plan.id)}
                            className="w-7 h-7 rounded-md border border-transparent bg-black/40 hover:border-life-rose/30 hover:bg-life-rose/10 text-life-muted hover:text-life-rose transition-all flex items-center justify-center"
                            title={t('delete')}
                          >
                            <Icon name="trash" size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Surface>
    </div>
  );
}
