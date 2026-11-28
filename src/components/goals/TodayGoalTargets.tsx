'use client';

import React from 'react';
import Link from 'next/link';
import { Surface } from '@/components/ui/Surface';
import { Icon } from '@/components/ui/Icon';
import { useCollection } from '@/lib/hooks/useCollection';
import { useGoalTargetLinks } from '@/lib/hooks/useLinks';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { getPeriod } from '@/lib/period';
import { GoalTarget, LIFE_GOAL_CATEGORIES, LifeGoal } from '@/lib/lifeGoals';

/** Today's and this week's annual-goal targets, on the dashboard. */
export function TodayGoalTargets({ date }: { date: string }) {
  const { locale } = useI18n();
  const id = locale === 'id';
  const goals = useCollection<LifeGoal>('life_goals');
  const targets = useCollection<GoalTarget>('goal_targets');
  const links = useGoalTargetLinks(targets);
  const week = getPeriod('week', date);
  const rows = targets.items.filter(
    (t) => (t.periodType === 'day' && t.periodStart === date) || (t.periodType === 'week' && t.periodStart === week.start)
  );
  if (!goals.items.some((g) => g.priorityYear)) return null;

  const goalOf = (t: GoalTarget) => goals.items.find((g) => g.id === t.lifeGoalId);
  return (
    <Surface className="p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2"><Icon name="target" size={16} />{id ? 'Target goals' : 'Goal targets'}</h2>
        <Link href="/goals/annual" className="chip h-8 text-xs">{id ? 'Atur' : 'Plan'}<Icon name="arrowRight" size={13} /></Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          {id ? 'Belum ada target untuk hari ini atau minggu ini.' : 'No targets for today or this week yet.'}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((t) => {
            const g = goalOf(t);
            const cat = LIFE_GOAL_CATEGORIES.find((c) => c.id === g?.category);
            return (
              <li key={t.id} className="flex items-center gap-3 py-2">
                <button
                  type="button" onClick={() => links.toggle(t)} aria-pressed={t.done}
                  aria-label={`${t.done ? (id ? 'Batal selesai' : 'Undo') : (id ? 'Selesai' : 'Done')}: ${t.title}`}
                  className={cn('w-6 h-6 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    t.done ? 'bg-primary border-primary text-primary-foreground' : 'border-border hover:border-blue-500')}
                >
                  {t.done && <Icon name="check" size={12} />}
                </button>
                <span className="flex-1 min-w-0">
                  <span className={cn('block text-sm', t.done && 'line-through text-muted-foreground')}>{t.title}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {t.periodType === 'day' ? (id ? 'Hari ini' : 'Today') : (id ? 'Minggu ini' : 'This week')} · {cat ? (id ? cat.label : cat.labelEn) : ''}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Surface>
  );
}
