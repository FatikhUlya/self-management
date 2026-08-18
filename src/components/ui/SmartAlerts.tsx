'use client';

import React, { useMemo } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Icon } from './Icon';
import { addDays, inLastDays } from '@/lib/utils';

interface Alert {
  id: string;
  icon: string;
  iconColor: string;
  borderColor: string;
  bgColor: string;
  title: string;
  detail: string;
  tone: 'amber' | 'rose' | 'teal' | 'indigo';
}

export function SmartAlerts() {
  const { state } = useLifeOS();
  const today = state.selectedDate;

  const alerts = useMemo(() => {
    const result: Alert[] = [];

    // 1. Budget Warning: expense > budget this month
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
        iconColor: 'text-amber-400',
        borderColor: 'border-amber-500/20',
        bgColor: 'bg-amber-500/5',
        title: `Budget ${pct >= 100 ? 'Terlampaui!' : 'Hampir Habis'}`,
        detail: `Pengeluaran bulan ini: ${pct}% dari total budget`,
        tone: 'amber',
      });
    }

    // 2. Calorie Alert: check if today's meals exceed health profile target
    const todayMeals = state.meals.filter(m => m.date === today);
    const todayCalories = todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const calorieTarget = Number(state.healthProfile?.mealGoalCalories || 0);
    if (calorieTarget > 0 && todayCalories > calorieTarget * 1.15) {
      result.push({
        id: 'calorie-warn',
        icon: 'activity',
        iconColor: 'text-rose-400',
        borderColor: 'border-rose-500/20',
        bgColor: 'bg-rose-500/5',
        title: 'Kalori Melebihi Target',
        detail: `${todayCalories} kcal dimakan vs ${Math.round(calorieTarget)} kcal target TDEE`,
        tone: 'rose',
      });
    }

    // 3. Habit Streak Breaking Warning
    state.habits.forEach(habit => {
      // Check if habit was done for 3+ consecutive days before today but NOT done today
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
          iconColor: 'text-amber-400',
          borderColor: 'border-amber-500/20',
          bgColor: 'bg-amber-500/5',
          title: `Streak "${habit.name}" Terancam!`,
          detail: `${streakBeforeToday} hari berturut — jangan putus hari ini!`,
          tone: 'amber',
        });
      }
    });

    // 4. Goal Deadline Approaching (within 7 days)
    state.goals.forEach(goal => {
      if (!goal.targetDate || Number(goal.progress) >= 100) return;
      const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0 && daysLeft <= 7) {
        result.push({
          id: `goal-dl-${goal.id}`,
          icon: 'target',
          iconColor: 'text-teal-400',
          borderColor: 'border-teal-500/20',
          bgColor: 'bg-teal-500/5',
          title: `Goal Deadline: ${daysLeft} Hari Lagi`,
          detail: `"${goal.title}" — progress ${goal.progress}%`,
          tone: 'teal',
        });
      }
    });

    // 5. Debt Due Date Warning (within 7 days)
    (state.debts || []).forEach(debt => {
      if (!debt.nextDueDate) return;
      const daysLeft = Math.ceil((new Date(debt.nextDueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= 7) {
        result.push({
          id: `debt-due-${debt.id}`,
          icon: 'alertTriangle',
          iconColor: 'text-rose-400',
          borderColor: 'border-rose-500/20',
          bgColor: 'bg-rose-500/5',
          title: `Cicilan Jatuh Tempo ${daysLeft === 0 ? 'HARI INI' : `${daysLeft} Hari Lagi`}`,
          detail: `${debt.name || 'Hutang'} — Rp ${(debt.monthlyPayment || 0).toLocaleString('id-ID')}`,
          tone: 'rose',
        });
      }
    });

    // 6. Work Application Deadline (applications with upcoming deadlines)
    (state.workApplications || []).forEach(app => {
      if (app.status === 'rejected' || app.status === 'offer') return;
      if (!app.deadline) return;
      const checkDate = app.deadline;
      if (!checkDate) return;
      const daysLeft = Math.ceil((new Date(checkDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= 3) {
        result.push({
          id: `work-dl-${app.id}`,
          icon: 'briefcase',
          iconColor: 'text-indigo-400',
          borderColor: 'border-indigo-500/20',
          bgColor: 'bg-indigo-500/5',
          title: `Deadline Lamaran ${daysLeft === 0 ? 'HARI INI' : `${daysLeft} Hari Lagi`}`,
          detail: `${app.company || ''} — ${app.role || ''}`,
          tone: 'indigo',
        });
      }
    });

    return result;
  }, [state, today]);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.slice(0, 5).map(alert => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 p-3.5 rounded-xl border ${alert.borderColor} ${alert.bgColor} transition-all duration-200 hover:scale-[1.005]`}
        >
          <div className={`shrink-0 mt-0.5 ${alert.iconColor}`}>
            <Icon name={alert.icon} size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-life-text leading-tight">{alert.title}</p>
            <p className="text-xs text-life-muted mt-0.5">{alert.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
