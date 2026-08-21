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
import { MorningCheckIn } from '@/components/daily-command/MorningCheckIn';
import { ActiveDay } from '@/components/daily-command/ActiveDay';
import { EveningReview } from '@/components/daily-command/EveningReview';
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
    togglePlan,
    saveDailyPlan,
    updateDailyPlan
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

  const todayPlan = state.dailyPlans.find(p => p.date === today);

  if (!todayPlan || todayPlan.dayStatus === 'not_started') {
    return <MorningCheckIn today={today} onStartDay={saveDailyPlan as any} />;
  }

  if (todayPlan.dayStatus === 'in_progress') {
    return <ActiveDay todayPlan={todayPlan} onEndDay={() => updateDailyPlan(today, { dayStatus: 'day_closed' })} />;
  }

  if (todayPlan.dayStatus === 'day_closed' && !todayPlan.dailyReview) {
    return <EveningReview todayPlan={todayPlan} onCloseDay={(plan) => updateDailyPlan(today, plan)} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h1 className="text-3xl font-bold text-life-text">Hari Telah Selesai</h1>
      <p className="text-life-muted">Istirahatlah dengan tenang, besok adalah lembaran baru.</p>
    </div>
  );
}