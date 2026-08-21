'use client';

import React, { useMemo, useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Icon } from './Icon';
import { addDays } from '@/lib/utils';

export function NotificationBanner() {
  const { state } = useLifeOS();
  const today = state.selectedDate;
  const [dismissed, setDismissed] = useState<string[]>([]);

  const urgentAlerts = useMemo(() => {
    const result: any[] = [];

    // 1. Budget Warning (Urgent only if > 100%)
    const thisMonth = today.slice(0, 7);
    const monthExpense = state.transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    const activeBudgets = state.budgets || [];
    const totalBudgetLimit = activeBudgets.reduce((sum, b) => sum + (b.limitAmount || 0), 0);
    if (totalBudgetLimit > 0 && monthExpense >= totalBudgetLimit) {
      result.push({
        id: 'budget-warn-urgent',
        icon: 'alertTriangle',
        title: 'Budget Terlampaui!',
        detail: `Pengeluaran bulan ini melebihi total budget (100%+). Segera evaluasi pengeluaran.`,
        tone: 'rose',
      });
    }

    // 2. Goal Deadline (Urgent if <= 3 days)
    state.goals.forEach(goal => {
      if (!goal.targetDate || Number(goal.progress) >= 100) return;
      const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= 3) {
        result.push({
          id: `goal-dl-urgent-${goal.id}`,
          icon: 'target',
          title: `Goal Deadline ${daysLeft === 0 ? 'Hari Ini' : `${daysLeft} Hari Lagi`}!`,
          detail: `"${goal.title}" belum tercapai (Progress: ${goal.progress}%).`,
          tone: 'amber',
        });
      }
    });

    // 3. Debt Due Date (Urgent if <= 3 days)
    (state.debts || []).forEach(debt => {
      if (!debt.nextDueDate) return;
      const daysLeft = Math.ceil((new Date(debt.nextDueDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0 && daysLeft <= 3) {
        result.push({
          id: `debt-due-urgent-${debt.id}`,
          icon: 'alertTriangle',
          title: `Cicilan ${daysLeft === 0 ? 'Jatuh Tempo Hari Ini' : `${daysLeft} Hari Lagi`}!`,
          detail: `${debt.name || 'Hutang'} — Rp ${(debt.monthlyInstallment || 0).toLocaleString('id-ID')}`,
          tone: 'rose',
        });
      }
    });

    return result.filter(alert => !dismissed.includes(alert.id));
  }, [state, today, dismissed]);

  if (urgentAlerts.length === 0) return null;

  return (
    <div className="flex flex-col space-y-2 mb-6 px-6 md:px-8 mt-6">
      {urgentAlerts.map(alert => (
        <div
          key={alert.id}
          className={`relative flex items-start sm:items-center gap-3 p-4 rounded-xl border border-${alert.tone}-500/20 bg-${alert.tone}-500/10 text-life-text`}
        >
          <div className={`shrink-0 text-${alert.tone}-400`}>
            <Icon name={alert.icon} size={20} />
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <h4 className="text-sm font-bold">{alert.title}</h4>
            <p className="text-xs text-life-muted mt-0.5">{alert.detail}</p>
          </div>
          <button
            onClick={() => setDismissed(prev => [...prev, alert.id])}
            className="absolute top-4 right-4 sm:static p-1.5 text-life-muted hover:text-life-text hover:bg-white/10 rounded-md transition-colors"
            title="Tutup peringatan"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
