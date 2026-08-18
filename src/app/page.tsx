'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Brain } from 'lucide-react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
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
import { SmartAlerts } from '@/components/ui/SmartAlerts';
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
  const [ideaTitle, setIdeaTitle] = useLocalStorageState('draft_dashboard_ideaTitle', '');
  const [ideaArea, setIdeaArea] = useLocalStorageState('draft_dashboard_ideaArea', 'Career');
  const [ideaPriority, setIdeaPriority] = useLocalStorageState<Priority>('draft_dashboard_ideaPriority', 'Medium');
  const [ideaNotes, setIdeaNotes] = useLocalStorageState('draft_dashboard_ideaNotes', '');

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-600 dark:from-teal-300 dark:to-emerald-500 flex items-center gap-2">
            <Icon name="layout" size={28} className="text-emerald-500" />
            {t(greetingKey)}, Fatikh
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            {formatDate(today, { locale: locale === 'id' ? 'id-ID' : 'en-US' })}
          </p>
        </div>
      </div>

      {/* Smart Alerts */}
      <SmartAlerts />

      {/* Grid 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon="checkSquare"
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
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all duration-150 ${isDone
                            ? 'bg-life-teal-soft/10 border-life-teal/30 text-teal-300'
                            : 'bg-white/[0.01] border-life-line hover:border-life-line-strong text-life-muted'
                          }`}
                      >
                        <span className="text-xs font-bold truncate">{habit.name}</span>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${isDone ? 'bg-life-teal border-teal-400 text-white' : 'border-life-line text-transparent'
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
                  <select
                    value={ideaArea || 'Career'}
                    onChange={(e) => setIdeaArea(e.target.value)}
                    className="glass-select text-xs"
                  >
                    <option value="Career">Career</option>
                    <option value="Finance">Finance</option>
                    <option value="Health">Health</option>
                    <option value="Learning">Learning</option>
                    <option value="Personal">Personal</option>
                    <option value="Relationship">Relationship</option>
                  </select>
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
                className={`p-3 rounded-lg border cursor-pointer select-none transition-all duration-150 ${plan.status === 'done'
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
              <EmptyState message={locale === 'id' ? 'Jurnal hari ini belum diisi.' : 'Today\'s journal has not been filled out.'} />
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

      {/* Cross-Module Intelligence & Daily Compass */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rules as Daily Compass */}
        <Surface className="p-6">
          <div className="flex justify-between items-start border-b border-life-line pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                Kompas Hari Ini
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                Prinsip dan aturan hidup (Rotasi harian)
              </p>
            </div>
            <Link href="/rules">
              <Button size="sm" icon="arrowRight">
                Rules
              </Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {(() => {
              if (state.selfRules.length === 0) return <EmptyState message="Belum ada rule." />;
              // Deterministic random based on day of year
              const dayOfYear = Math.floor((new Date(today).getTime() - new Date(today.substring(0, 4) + '-01-01').getTime()) / 86400000);
              const seed = dayOfYear;
              const ruleCount = state.selfRules.length;
              const r1 = state.selfRules[seed % ruleCount];
              const r2 = state.selfRules[(seed + 1) % ruleCount];
              const displayRules = ruleCount > 1 ? [r1, r2] : [r1];
              
              return displayRules.map((rule, idx) => (
                <div key={`${rule.id}-${idx}`} className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                  <div className="flex items-start gap-3">
                    <Icon name="compass" size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-life-text font-bold leading-snug">{rule.rule_text}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </Surface>

        {/* Cross-Module Insights */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              Life Insights
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Korelasi & Upcoming Deadlines
            </p>
          </div>

          <div className="space-y-4">
            {/* Mood-Activity Correlation */}
            {(() => {
              const workoutDays = state.workouts.map(w => w.date);
              let workoutMoodSum = 0; let workoutMoodCount = 0;
              let nonWorkoutMoodSum = 0; let nonWorkoutMoodCount = 0;
              
              state.journals.forEach(j => {
                if (workoutDays.includes(j.date)) {
                  workoutMoodSum += j.mood;
                  workoutMoodCount++;
                } else {
                  nonWorkoutMoodSum += j.mood;
                  nonWorkoutMoodCount++;
                }
              });
              
              const avgW = workoutMoodCount > 0 ? (workoutMoodSum / workoutMoodCount).toFixed(1) : '-';
              const avgNW = nonWorkoutMoodCount > 0 ? (nonWorkoutMoodSum / nonWorkoutMoodCount).toFixed(1) : '-';

              if (workoutMoodCount === 0 || nonWorkoutMoodCount === 0) return null;

              return (
                <div className="p-4 rounded-xl border border-life-line bg-white/[0.01]">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="activity" size={14} className="text-teal-400" />
                    <span className="text-xs font-black text-life-text uppercase tracking-wider">Korelasi Mood & Workout</span>
                  </div>
                  <p className="text-sm text-life-muted leading-relaxed">
                    Di hari Anda <strong className="text-teal-400">workout</strong>, mood rata-rata adalah <strong className="text-life-text">{avgW}/5</strong>. 
                    Di hari <strong className="text-life-muted">tanpa workout</strong>, mood rata-rata adalah <strong className="text-life-text">{avgNW}/5</strong>.
                  </p>
                </div>
              );
            })()}

            {/* Upcoming Aggregated Deadlines */}
            {(() => {
              const upcoming: { id: string; title: string; date: string; type: string; tone: string }[] = [];
              const target = new Date(today).getTime() + (7 * 86400000); // next 7 days

              state.goals.forEach(g => {
                if (g.targetDate && Number(g.progress) < 100 && new Date(g.targetDate).getTime() <= target && new Date(g.targetDate).getTime() >= new Date(today).getTime()) {
                  upcoming.push({ id: g.id, title: g.title, date: g.targetDate, type: 'Goal', tone: 'teal' });
                }
              });
              (state.workApplications || []).forEach(w => {
                const date = w.interviewDate || w.deadline;
                if (date && (w.status !== 'rejected' && w.status !== 'offer') && new Date(date).getTime() <= target && new Date(date).getTime() >= new Date(today).getTime()) {
                  upcoming.push({ id: w.id, title: `${w.company} - ${w.position}`, date, type: 'Kerja', tone: 'indigo' });
                }
              });

              upcoming.sort((a, b) => a.date.localeCompare(b.date));

              if (upcoming.length === 0) return (
                <div className="p-4 rounded-xl border border-life-line bg-white/[0.01]">
                  <p className="text-xs text-life-muted">Tidak ada deadline penting dalam 7 hari ke depan.</p>
                </div>
              );

              return (
                <div className="p-4 rounded-xl border border-life-line bg-white/[0.01]">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="clock" size={14} className="text-rose-400" />
                    <span className="text-xs font-black text-life-text uppercase tracking-wider">Upcoming Deadlines (7 Hari)</span>
                  </div>
                  <div className="space-y-2">
                    {upcoming.map(item => (
                      <div key={`${item.type}-${item.id}`} className="flex justify-between items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge tone={item.tone as any} className="text-[9px] shrink-0">{item.type}</Badge>
                          <span className="text-xs text-life-text truncate font-bold">{item.title}</span>
                        </div>
                        <span className="text-[10px] font-bold text-life-muted shrink-0">{formatDate(item.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </Surface>
      </div>
    </div>
  );
}
