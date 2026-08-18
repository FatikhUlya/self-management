'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { QuickNavGrid } from '@/components/ui/QuickNavGrid';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { percent, todayISO, addDays } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { HABIT_AREAS } from '@/lib/constants';

export default function HabitsDashboardPage() {
  const { state, toggleHabit, addHabit } = useLifeOS();
  const { t, locale } = useI18n();
  const today = state.selectedDate || todayISO();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitArea, setHabitArea] = useState<string>(HABIT_AREAS[0]);
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [habitTarget, setHabitTarget] = useState<number>(5);
  const [habitGoalId, setHabitGoalId] = useState<string>('');

  const getCompletionPercent = (date: string) => {
    if (!state.habits.length) return 0;
    const done = state.habits.filter((h) => 
      state.habitLogs.some((log) => log.habitId === h.id && log.date === date)
    ).length;
    return percent(done, state.habits.length);
  };

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

  const todayScore = getCompletionPercent(today);
  const doneToday = state.habits.filter((h) => state.habitLogs.some(l => l.habitId === h.id && l.date === today)).length;
  
  const handleHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    await addHabit({
      name: habitName,
      area: habitArea,
      frequency: habitFrequency,
      targetPerWeek: habitTarget,
      goalId: habitGoalId || undefined,
    });

    setHabitName('');
    setHabitGoalId('');
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 dark:from-cyan-300 dark:to-blue-500 flex items-center gap-2">
            <Icon name="check" size={28} className="text-cyan-500" />
            {t('habits_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Tracking kebiasaan harian dan mingguan untuk membentuk disiplin.
          </p>
        </div>
      </div>

      {/* Sub-page Navigation Grid */}
      <QuickNavGrid 
        items={[
          { label: 'Kalender', icon: 'calendar', iconColor: 'text-cyan-500', href: '/habits/calendar' },
          { label: 'Analisis', icon: 'barChart', iconColor: 'text-blue-500', href: '/habits/analytics' },
          { label: 'Kelola', icon: 'list', iconColor: 'text-indigo-500', href: '/habits/manage' }
        ]} 
      />

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DashboardCard
          icon="checkCircle"
          iconColor="text-cyan-500"
          accentColor="cyan-500"
          label="Skor Hari Ini"
          value={`${todayScore}%`}
          detail={`${doneToday} dari ${state.habits.length} kebiasaan selesai`}
        >
          <div className="w-full bg-black/10 dark:bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-cyan-500 h-full rounded-full transition-all" 
              style={{ width: `${todayScore}%` }}
            />
          </div>
        </DashboardCard>
        
        <DashboardCard
          icon="activity"
          iconColor="text-blue-500"
          accentColor="blue-500"
          label="Total Kebiasaan"
          value={state.habits.length}
          detail="Aktif dilacak saat ini"
        />
      </div>

      {/* Today's Checklist */}
      <Surface className="p-6">
        <div className="flex justify-between items-center border-b border-life-line pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('habits_checklist')} Hari Ini
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Ceklis rutinitas harian Anda
            </p>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            icon="plus" 
            onClick={() => setIsFormOpen(true)}
          >
            {t('habits_add_new')}
          </Button>
        </div>

        <div className="space-y-2">
          {state.habits.length > 0 ? (
            state.habits.map((habit) => {
              const isDone = state.habitLogs.some(
                (log) => log.habitId === habit.id && log.date === today
              );

              return (
                <div
                  key={habit.id}
                  onClick={() => toggleHabit(habit.id, today)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-150 ${
                    isDone
                      ? 'bg-life-teal-soft/10 border-life-teal/30 text-teal-300'
                      : 'bg-white/[0.01] border-life-line hover:border-life-line-strong text-life-muted'
                  }`}
                >
                  <div>
                    <strong className="text-sm font-bold block">{habit.name}</strong>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] text-life-muted font-bold uppercase">
                        Streak: {getHabitStreak(habit.id, today)} {t('days')}
                      </p>
                      {habit.goalId && (() => {
                        const goal = state.goals.find(g => g.id === habit.goalId);
                        return goal ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            🎯 {goal.title.slice(0, 20)}{goal.title.length > 20 ? '…' : ''}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <span className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                    isDone ? 'bg-life-teal border-teal-400 text-white' : 'border-life-line text-transparent'
                  }`}>
                    <Icon name="check" size={12} />
                  </span>
                </div>
              );
            })
          ) : (
            <EmptyState />
          )}
        </div>
      </Surface>

      {/* Form modal to add new habit (quick action from dashboard) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t('habits_new')}
        subtitle="Masukkan detail habit baru"
      >
        <form onSubmit={handleHabitSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="hName" className="text-xs font-bold text-life-muted uppercase">
              {t('habits_name')}
            </label>
            <input
              id="hName"
              type="text"
              required
              placeholder={t('habits_name_placeholder')}
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="glass-input text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col space-y-1">
              <label htmlFor="hArea" className="text-xs font-bold text-life-muted uppercase">
                {t('area')}
              </label>
              <select
                id="hArea"
                value={habitArea}
                onChange={(e) => setHabitArea(e.target.value)}
                className="glass-select text-xs"
              >
                {HABIT_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="hFreq" className="text-xs font-bold text-life-muted uppercase">
                {t('habits_frequency')}
              </label>
              <select
                id="hFreq"
                value={habitFrequency}
                onChange={(e) => setHabitFrequency(e.target.value as any)}
                className="glass-select text-xs"
              >
                <option value="daily">{t('habits_daily')}</option>
                <option value="weekly">{t('habits_weekly')}</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="hTarget" className="text-xs font-bold text-life-muted uppercase">
                Target/minggu
              </label>
              <input
                id="hTarget"
                type="number"
                min="1"
                max="7"
                required
                value={habitTarget}
                onChange={(e) => setHabitTarget(Number(e.target.value))}
                className="glass-input text-xs"
              />
            </div>
          </div>

          {/* Goal Linking */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="hGoal" className="text-xs font-bold text-life-muted uppercase">
              🎯 Link ke Goal (opsional)
            </label>
            <select
              id="hGoal"
              value={habitGoalId}
              onChange={(e) => setHabitGoalId(e.target.value)}
              className="glass-select text-xs"
            >
              <option value="">— Tanpa Goal —</option>
              {state.goals.filter(g => Number(g.progress) < 100).map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
            <p className="text-[10px] text-life-muted">Habit ini akan berkontribusi pada progress goal yang dipilih</p>
          </div>

          <Button type="submit" variant="primary" icon="plus" className="w-full">
            {t('habits_add_new')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
