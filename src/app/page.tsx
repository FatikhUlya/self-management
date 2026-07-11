'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { MetricCard } from '@/components/ui/MetricCard';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MiniChart } from '@/components/ui/MiniChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  getGreetingKey, 
  formatDate, 
  percent, 
  avg, 
  addDays, 
  dayName, 
  inLastDays, 
  lastSevenDays 
} from '@/lib/utils';
import { PRIORITY_OPTIONS, Priority } from '@/lib/constants';

export default function Dashboard() {
  const { 
    state, 
    addIdea, 
    updateTaskStatus, 
    toggleHabit, 
    togglePlan 
  } = useLifeOS();
  
  const { t, locale } = useI18n();

  // Quick Capture Form State
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaArea, setIdeaArea] = useState('');
  const [ideaPriority, setIdeaPriority] = useState<Priority>('Medium');
  const [ideaNotes, setIdeaNotes] = useState('');

  // Local helper functions
  const today = state.selectedDate;
  const tomorrow = addDays(today, 1);

  // Journal details for selected date
  const selectedJournal = state.journals.find(j => j.date === today);

  // Today's tasks (due or overdue)
  const todaysTasks = state.tasks
    .filter((task) => task.status !== 'done' && (!task.due || task.due <= today))
    .sort((a, b) => {
      const priorityWeight = (p: string) => ({ Low: 1, Medium: 2, High: 3 }[p] || 2);
      return priorityWeight(b.priority) - priorityWeight(a.priority);
    });

  const doneTodayCount = state.tasks.filter(
    (task) => task.status === 'done' && task.completedAt?.slice(0, 10) === today
  ).length;

  const goalAverage = Math.round(avg(state.goals.map((g) => Number(g.progress) || 0)));

  // Habit completion calculation
  const habitsDoneCount = state.habitLogs.filter((log) => log.date === today).length;
  const habitPercent = percent(habitsDoneCount, state.habits.length);

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

  // Activity score calculator for 7-day chart
  const activityScore = (date: string) => {
    const completedTasks = state.tasks.filter(
      (task) => task.status === 'done' && task.completedAt?.slice(0, 10) === date
    ).length * 20;
    const habitScore = state.habitLogs.filter((log) => log.date === date).length * 15;
    const learningScore = state.learning
      .filter((item) => item.date === date)
      .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    const workoutScore = state.workouts
      .filter((item) => item.date === date)
      .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    return completedTasks + habitScore + learningScore + workoutScore;
  };

  const chartPoints = lastSevenDays(today).map((day) => ({
    label: dayName(day, locale === 'id' ? 'id-ID' : 'en-US'),
    value: activityScore(day),
  }));

  // Health summary
  const dailyMeals = state.meals.filter((meal) => meal.date === today);
  const dailyCalories = dailyMeals.reduce((sum, meal) => sum + Number(meal.calories || 0), 0);
  const dailyProtein = dailyMeals.reduce((sum, meal) => sum + Number(meal.protein || 0), 0);
  const dailyWorkoutMins = state.workouts
    .filter((item) => item.date === today)
    .reduce((sum, item) => sum + Number(item.minutes || 0), 0);

  // Handle Quick Capture Form Submit
  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim()) return;

    await addIdea({
      title: ideaTitle,
      area: ideaArea,
      priority: ideaPriority,
      notes: ideaNotes
    });

    // Reset Form
    setIdeaTitle('');
    setIdeaArea('');
    setIdeaPriority('Medium');
    setIdeaNotes('');
  };

  const greetingKey = getGreetingKey();

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-life-teal-soft/10 via-transparent to-transparent p-5 border-l-4 border-life-teal rounded-r-xl bg-white/[0.01]">
        <div>
          <h3 className="text-2xl font-black text-life-text tracking-tight">
            {t(greetingKey)}, Guest
          </h3>
          <p className="text-xs text-life-muted font-medium mt-1 uppercase tracking-wider">
            {formatDate(today, { locale: locale === 'id' ? 'id-ID' : 'en-US' })}
          </p>
        </div>
      </div>

      {/* Grid 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon="layout"
          label={t('dash_tasks_today')}
          value={todaysTasks.length}
          detail={`${doneTodayCount} ${t('dash_completed_today')}`}
          glow={todaysTasks.length > 0}
        />
        <MetricCard
          icon="check"
          label={t('dash_habit_done')}
          value={`${habitPercent}%`}
          detail={`${habitsDoneCount} ${t('dash_of')} ${state.habits.length}`}
          glow={habitPercent >= 80}
        />
        <MetricCard
          icon="target"
          label={t('dash_goal_avg')}
          value={`${goalAverage}%`}
          detail={`${state.goals.length} ${t('dash_active_goals')}`}
        />
        <MetricCard
          icon="journal"
          label={t('dash_journal_streak')}
          value={journalStreak()}
          detail={t('dash_consecutive_days')}
          glow={journalStreak() > 2}
        />
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Widget: Today Command Center */}
        <Surface className="p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-life-line pb-3">
            <div>
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {t('dash_command_center')}
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                {formatDate(today, { locale: locale === 'id' ? 'id-ID' : 'en-US' })}
              </p>
            </div>
            <Link href="/projects">
              <Button size="sm" icon="arrowRight">
                Tasks
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {/* Priorities */}
            <div>
              <h4 className="text-xs font-bold text-life-muted uppercase tracking-wider mb-2">
                {t('priority')} High / Medium
              </h4>
              {todaysTasks.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {todaysTasks.slice(0, 5).map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.01] border border-life-line hover:border-life-line-strong transition-all duration-150"
                    >
                      <div className="min-w-0">
                        <strong className="text-xs text-life-text block truncate">{task.title}</strong>
                        <p className="text-[10px] text-life-muted mt-0.5">
                          {task.due ? formatDate(task.due) : 'No due'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge tone={task.priority === 'High' ? 'rose' : 'amber'}>
                          {task.priority}
                        </Badge>
                        <button
                          onClick={() => updateTaskStatus(task.id, 'done')}
                          className="w-6 h-6 rounded-md bg-white/[0.03] border border-life-line hover:bg-life-teal/20 hover:border-life-teal text-transparent hover:text-life-teal flex items-center justify-center transition-all duration-150"
                          title={t('tasks_done')}
                        >
                          <Icon name="check" size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>

            {/* Habits Today */}
            <div>
              <h4 className="text-xs font-bold text-life-muted uppercase tracking-wider mb-2">
                {t('nav_habits')}
              </h4>
              {state.habits.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {state.habits.map((habit) => {
                    const isDone = state.habitLogs.some(
                      (log) => log.habitId === habit.id && log.date === today
                    );
                    return (
                      <div 
                        key={habit.id}
                        onClick={() => toggleHabit(habit.id, today)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all duration-150 ${
                          isDone 
                            ? 'bg-life-teal-soft/10 border-life-teal/30 text-teal-300' 
                            : 'bg-white/[0.01] border-life-line hover:border-life-line-strong text-life-muted'
                        }`}
                      >
                        <span className="text-xs font-bold truncate">{habit.name}</span>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isDone ? 'bg-life-teal border-teal-400 text-white' : 'border-life-line text-transparent'
                        }`}>
                          <Icon name="check" size={10} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </Surface>

        {/* Right Widget: Quick Capture Form */}
        <Surface className="p-6 flex flex-col justify-between">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('dash_quick_capture')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">{t('dash_capture_desc')}</p>
          </div>

          <form onSubmit={handleQuickCapture} className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-col space-y-1">
                <input
                  type="text"
                  required
                  placeholder={t('capture_write_idea')}
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <input
                    type="text"
                    placeholder={t('capture_area_placeholder')}
                    value={ideaArea}
                    onChange={(e) => setIdeaArea(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <select
                    value={ideaPriority}
                    onChange={(e) => setIdeaPriority(e.target.value as Priority)}
                    className="glass-select text-xs"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <textarea
                  placeholder={t('capture_notes_placeholder')}
                  value={ideaNotes}
                  onChange={(e) => setIdeaNotes(e.target.value)}
                  className="glass-input text-xs resize-none h-16"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full mt-3">
              {t('capture_btn')}
            </Button>
          </form>
        </Surface>
      </div>

      {/* Middle Grid: Today's Agenda */}
      <Surface className="p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-life-line pb-3">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('dash_agenda_today') || 'Agenda Hari Ini'}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {formatDate(today, { locale: locale === 'id' ? 'id-ID' : 'en-US' })} / {todayPlans.length} {t('dash_agenda_arranged')}
            </p>
          </div>
          <Link href="/planning">
            <Button size="sm" icon="calendar">
              {t('dash_open_planning')}
            </Button>
          </Link>
        </div>

        {todayPlans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {todayPlans.slice(0, 4).map((plan) => (
              <div 
                key={plan.id}
                onClick={() => togglePlan(plan.id)}
                className={`p-3 rounded-lg border cursor-pointer select-none transition-all duration-150 ${
                  plan.status === 'done'
                    ? 'bg-life-green-soft/10 border-life-green/30 text-green-300'
                    : plan.kind === 'event'
                      ? 'bg-life-teal-soft/5 border-life-teal/30 hover:border-life-teal/60 text-life-text'
                      : 'bg-life-indigo-soft/5 border-life-indigo/30 hover:border-life-indigo/60 text-life-text'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-life-muted">
                    {plan.startTime} - {plan.endTime}
                  </span>
                  <Badge tone={plan.kind === 'event' ? 'teal' : 'indigo'}>
                    {plan.kind}
                  </Badge>
                </div>
                <strong className="block text-xs text-life-text mt-1 truncate">{plan.title}</strong>
                <p className="text-[10px] text-life-muted truncate mt-0.5">{plan.area || '-'}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </Surface>

      {/* Snapshot and 7 Days Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Snapshot */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-6">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('dash_progress_snapshot')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {t('dash_summary_until')} {formatDate(today)}
            </p>
          </div>

          <div className="flex flex-wrap justify-around items-center gap-6">
            <ProgressRing
              label="Tasks"
              value={percent(
                state.tasks.filter((t) => t.status === 'done').length,
                state.tasks.length
              )}
              colorClass="text-teal-400"
            />
            <ProgressRing
              label="Habits"
              value={habitPercent}
              colorClass="text-green-400"
            />
            <ProgressRing
              label="Goals"
              value={goalAverage}
              colorClass="text-indigo-400"
            />
            <ProgressRing
              label="Energy"
              value={selectedJournal ? Number(selectedJournal.energy) * 20 : 0}
              colorClass="text-amber-400"
            />
          </div>
        </Surface>

        {/* 7 Days Chart */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-6">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('dash_last_7_days')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {state.learning.filter((l) => inLastDays(l.date, 7, today)).reduce((s, i) => s + Number(i.minutes || 0), 0)} {t('dash_learn_minutes')}, {state.workouts.filter((w) => inLastDays(w.date, 7, today)).reduce((s, i) => s + Number(i.minutes || 0), 0)} {t('dash_workout_minutes')}.
            </p>
          </div>

          <MiniChart points={chartPoints} />
        </Surface>
      </div>

      {/* Journal and Health Snapshots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Journal Widget */}
        <Surface className="p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start border-b border-life-line pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {t('dash_journal_today')}
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                {selectedJournal ? `Mood ${selectedJournal.mood}/5 / Energy ${selectedJournal.energy}/5` : 'No entry'}
              </p>
            </div>
            <Link href="/journal">
              <Button size="sm" icon="edit">
                {selectedJournal ? t('edit') : t('add')}
              </Button>
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {selectedJournal ? (
              <div className="space-y-3">
                {selectedJournal.gratitude_1 && (
                  <div>
                    <Badge tone="teal">Gratitude</Badge>
                    <p className="text-xs text-life-text mt-1 leading-relaxed font-medium">
                      1. {selectedJournal.gratitude_1}
                    </p>
                  </div>
                )}
                {selectedJournal.win && (
                  <div>
                    <Badge tone="green">Daily Win</Badge>
                    <p className="text-xs text-life-text mt-1 leading-relaxed font-medium">
                      {selectedJournal.win}
                    </p>
                  </div>
                )}
                {selectedJournal.next && (
                  <div>
                    <Badge tone="amber">Next Action</Badge>
                    <p className="text-xs text-life-text mt-1 leading-relaxed font-medium">
                      {selectedJournal.next}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="Jurnal hari ini belum diisi." />
            )}
          </div>
        </Surface>

        {/* Health Widget */}
        <Surface className="p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start border-b border-life-line pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {t('dash_health_today')}
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                {dailyMeals.length} {t('dash_meal')}, {dailyWorkoutMins} {t('minutes_short')} workout
              </p>
            </div>
            <Link href="/health">
              <Button size="sm" icon="arrowRight">
                Health
              </Button>
            </Link>
          </div>

          <div className="flex-1 space-y-4">
            <ProgressBar
              value={dailyCalories}
              max={Number(state.healthProfile.mealGoalCalories || 2000)}
              label={t('health_calorie_progress')}
              detail={`${dailyCalories} / ${state.healthProfile.mealGoalCalories || 2000} kcal`}
            />

            <div className="flex items-center justify-start gap-4">
              <div className="bg-white/[0.01] border border-life-line rounded-lg p-2.5 flex-1 flex flex-col items-center">
                <span className="text-[10px] text-life-muted uppercase font-bold tracking-wider">Protein</span>
                <strong className="text-sm text-life-text mt-0.5">{dailyProtein}g</strong>
              </div>
              <div className="bg-white/[0.01] border border-life-line rounded-lg p-2.5 flex-1 flex flex-col items-center">
                <span className="text-[10px] text-life-muted uppercase font-bold tracking-wider">Workout</span>
                <strong className="text-sm text-life-text mt-0.5">{dailyWorkoutMins}m</strong>
              </div>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
