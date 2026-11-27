'use client';

import React, { useMemo, useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Icon } from './Icon';
import { addDays, cn } from '@/lib/utils';

interface Alert {
  id: string;
  icon: string;
  title: string;
  detail: string;
  tone: 'amber' | 'rose' | 'teal' | 'indigo';
}

export function SmartAlerts() {
  const { state } = useLifeOS();
  const today = state.selectedDate;
  const [isExpanded, setIsExpanded] = useState(false);

  const alerts = useMemo(() => {
    const result: Alert[] = [];

    // 1. Budget Warning
    const thisMonth = today.slice(0, 7);
    const monthExpense = state.transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    const activeBudgets = state.budgets || [];
    const totalBudgetLimit = activeBudgets.reduce((sum, b) => sum + (b.limitAmount || 0), 0);
    if (totalBudgetLimit > 0 && monthExpense > totalBudgetLimit * 0.9) {
      const pct = Math.round((monthExpense / totalBudgetLimit) * 100);
      result.push({
        id: 'budget-warn',
        icon: 'wallet',
        title: `Budget ${pct >= 100 ? 'Terlampaui' : 'Mendekati Batas'}`,
        detail: `Pengeluaran bulan ini mencapai ${pct}% dari pagu`,
        tone: 'amber',
      });
    }

    // 2. Calorie Alert
    const todayMeals = state.meals.filter(m => m.date === today);
    const todayCalories = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const calorieTarget = Number(state.healthProfile?.mealGoalCalories || 0);
    if (calorieTarget > 0 && todayCalories > calorieTarget * 1.15) {
      result.push({
        id: 'calorie-warn',
        icon: 'activity',
        title: 'Asupan Kalori di Atas Target',
        detail: `${todayCalories} kcal terkonsumsi (target ${Math.round(calorieTarget)} kcal)`,
        tone: 'rose',
      });
    }

    // 3. Habit Streak Breaking Warning
    state.habits.forEach(habit => {
      const isDoneToday = state.habitLogs.some(l => l.habitId === habit.id && l.date === today);
      if (isDoneToday) return;

      let streakBeforeToday = 0;
      let cursor = addDays(today, -1);
      while (state.habitLogs.some(l => l.habitId === habit.id && l.date === cursor)) {
        streakBeforeToday++;
        cursor = addDays(cursor, -1);
      }

      if (streakBeforeToday >= 3) {
        result.push({
          id: `habit-streak-${habit.id}`,
          icon: 'zap',
          title: `Pertahankan Streak "${habit.name}"`,
          detail: `${streakBeforeToday} hari beruntun selesai — selesaikan hari ini`,
          tone: 'amber',
        });
      }
    });

    // 4. Goal Deadline Approaching
    state.goals.forEach(goal => {
      if (!goal.targetDate || Number(goal.progress) >= 100) return;
      const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0 && daysLeft <= 7) {
        result.push({
          id: `goal-dl-${goal.id}`,
          icon: 'target',
          title: `Tenggat Goal: ${daysLeft} hari lagi`,
          detail: `"${goal.title}" — progres saat ini ${goal.progress}%`,
          tone: 'teal',
        });
      }
    });

    return result;
  }, [state, today]);

  if (alerts.length === 0) return null;

  const toneConfig: Record<string, { container: string; icon: string }> = {
    amber: {
      container: 'border-amber-500/25 bg-amber-500/5 text-amber-900 dark:text-amber-200',
      icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    rose: {
      container: 'border-red-500/25 bg-red-500/5 text-red-900 dark:text-red-200',
      icon: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
    teal: {
      container: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200',
      icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    indigo: {
      container: 'border-indigo-500/25 bg-indigo-500/5 text-indigo-900 dark:text-indigo-200',
      icon: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
        <span className="flex items-center gap-1.5 font-semibold text-foreground text-[11px] ">
          <Icon name="bell" size={13} className="text-amber-500" />
          Pemberitahuan Cerdas ({alerts.length})
        </span>
        {alerts.length > 2 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] text-primary hover:underline font-medium"
          >
            {isExpanded ? 'Ringkas' : `Lihat Semua (${alerts.length})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(isExpanded ? alerts : alerts.slice(0, 2)).map(alert => {
          const config = toneConfig[alert.tone] || toneConfig.amber;
          return (
            <div
              key={alert.id}
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-lg border transition-colors text-xs shadow-2xs",
                config.container
              )}
            >
              <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", config.icon)}>
                <Icon name={alert.icon} size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground tracking-tight truncate leading-tight">{alert.title}</p>
                <p className="text-muted-foreground mt-0.5 truncate text-[11px]">{alert.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
