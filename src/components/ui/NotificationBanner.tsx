'use client';

import React, { useMemo, useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Icon } from './Icon';

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
        title: 'Budget Terlampaui',
        detail: `Pengeluaran bulan ini melebihi total pagu yang ditetapkan.`,
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
          title: `Goal Deadline ${daysLeft === 0 ? 'Hari Ini' : `${daysLeft} Hari Lagi`}`,
          detail: `"${goal.title}" progres saat ini ${goal.progress}%.`,
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
          title: `Cicilan ${daysLeft === 0 ? 'Jatuh Tempo Hari Ini' : `${daysLeft} Hari Lagi`}`,
          detail: `${debt.name || 'Kewajiban'} — Rp ${(debt.monthlyInstallment || 0).toLocaleString('id-ID')}`,
          tone: 'rose',
        });
      }
    });

    return result.filter(alert => !dismissed.includes(alert.id));
  }, [state, today, dismissed]);

  if (urgentAlerts.length === 0) return null;

  const toneMap: Record<string, { bg: string; border: string; iconBg: string; text: string }> = {
    rose: { 
      bg: 'bg-destructive/5 dark:bg-destructive/10', 
      border: 'border-destructive/25', 
      iconBg: 'bg-destructive/15 text-destructive', 
      text: 'text-destructive' 
    },
    amber: { 
      bg: 'bg-amber-500/5 dark:bg-amber-500/10', 
      border: 'border-amber-500/25', 
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', 
      text: 'text-amber-700 dark:text-amber-300' 
    },
  };

  return (
    <div className="flex flex-col space-y-2 mb-3 px-5 md:px-8 pt-3">
      {urgentAlerts.map(alert => {
        const theme = toneMap[alert.tone] || toneMap.rose;
        return (
          <div
            key={alert.id}
            className={`relative flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg border ${theme.border} ${theme.bg} text-foreground shadow-2xs transition-all`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-6 h-6 rounded-md ${theme.iconBg} flex items-center justify-center shrink-0`}>
                <Icon name={alert.icon} size={13} />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-foreground tracking-tight shrink-0">{alert.title}:</span>
                <span className="text-xs text-muted-foreground truncate">{alert.detail}</span>
              </div>
            </div>
            <button
              onClick={() => setDismissed(prev => [...prev, alert.id])}
              className="p-1 text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors shrink-0 ml-2"
              title="Tutup peringatan"
            >
              <Icon name="x" size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
