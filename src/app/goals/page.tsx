'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Icon } from '@/components/ui/Icon';
import { formatDate, percent, clamp, avg } from '@/lib/utils';

export default function GoalsPage() {
  const { state, addGoal, updateGoalProgress, deleteGoal } = useLifeOS();
  const { t } = useI18n();

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [targetValue, setTargetValue] = useState<number>(100);
  const [unit, setUnit] = useState('%');
  const [targetDate, setTargetDate] = useState(state.selectedDate);

  const completedGoalsCount = state.goals.filter(g => Number(g.progress) >= 100).length;
  const activeGoalsCount = state.goals.filter(g => Number(g.progress) < 100).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Calculate initial progress based on current and target value
    // E.g., if currentValue is 75.5, target is 70, starting at 80...
    // To keep it simple, we default to 0 initial progress unless calculated.
    // Or we let the user select/adjust progress manually.
    // Let's default it to 0 as custom progress is manually incremented.
    await addGoal({
      title,
      category,
      currentValue,
      targetValue,
      unit,
      targetDate,
      progress: 0
    });

    setTitle('');
    setCategory('');
    setCurrentValue(0);
    setTargetValue(100);
    setUnit('%');
  };

  const getGoalStatusTone = (goal: any) => {
    if (goal.progress >= 100) return 'green';
    return 'teal';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Goal Creation Form */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('goals_new')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {t('goals_form_desc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="goalTitle" className="text-xs font-bold text-life-muted uppercase">
                {t('goals_goal_label')}
              </label>
              <input
                id="goalTitle"
                type="text"
                required
                placeholder={t('goals_outcome')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="currentVal" className="text-xs font-bold text-life-muted uppercase">
                  {t('goals_current_value')}
                </label>
                <input
                  id="currentVal"
                  type="number"
                  step="0.01"
                  required
                  value={currentValue}
                  onChange={(e) => setCurrentValue(Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="targetVal" className="text-xs font-bold text-life-muted uppercase">
                  {t('goals_target_value')}
                </label>
                <input
                  id="targetVal"
                  type="number"
                  step="0.01"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="unit" className="text-xs font-bold text-life-muted uppercase">
                  {t('goals_unit')}
                </label>
                <input
                  id="unit"
                  type="text"
                  required
                  placeholder={t('goals_unit_placeholder')}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label htmlFor="goalCat" className="text-xs font-bold text-life-muted uppercase">
                  {t('category')}
                </label>
                <input
                  id="goalCat"
                  type="text"
                  placeholder="Health, Career, Finance..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="targetDt" className="text-xs font-bold text-life-muted uppercase">
                  {t('goals_target_date')}
                </label>
                <input
                  id="targetDt"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full">
              {t('goals_add_btn')}
            </Button>
          </form>
        </Surface>

        {/* Right: Statistics */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('goals_stats')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {completedGoalsCount} {t('goals_completed')}
            </p>
          </div>

          <div className="flex flex-wrap justify-around items-center h-full pt-4">
            <ProgressRing
              label={t('goals_average')}
              value={Math.round(avg(state.goals.map((g) => g.progress)))}
              colorClass="text-teal-400"
              size={90}
            />
            <ProgressRing
              label={t('goals_done')}
              value={percent(completedGoalsCount, state.goals.length)}
              colorClass="text-green-400"
              size={90}
            />
            <ProgressRing
              label={t('goals_open')}
              value={percent(activeGoalsCount, state.goals.length)}
              colorClass="text-indigo-400"
              size={90}
            />
          </div>
        </Surface>
      </div>

      {/* Goals List */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('goals_list')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {t('goals_list_desc')}
          </p>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {state.goals.length > 0 ? (
            state.goals.map((goal) => (
              <div 
                key={goal.id} 
                className="p-4 rounded-xl bg-white/[0.005] border border-life-line hover:border-life-line-strong hover:bg-white/[0.01] transition-all space-y-3"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <strong className="text-sm text-life-text block tracking-tight leading-tight">{goal.title}</strong>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge tone={getGoalStatusTone(goal)}>
                        {goal.category || 'General'}
                      </Badge>
                      <span className="text-xs text-life-muted font-black uppercase tracking-wider">
                        {goal.currentValue} {goal.unit} {t('goals_current_arrow_target')} {goal.targetValue} {goal.unit}
                      </span>
                      {goal.targetDate && (
                        <span className="text-[10px] text-life-muted font-bold">
                          • Target: {formatDate(goal.targetDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => updateGoalProgress(goal.id, -5)}
                      className="w-7 h-7 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
                      title={t('minus')}
                    >
                      <Icon name="minus" size={12} />
                    </button>
                    <button
                      onClick={() => updateGoalProgress(goal.id, 5)}
                      className="w-7 h-7 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
                      title={t('add')}
                    >
                      <Icon name="plus" size={12} />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="w-7 h-7 rounded bg-white/[0.03] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all"
                      title={t('delete')}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-life-muted font-bold uppercase">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/[0.02] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${
                        goal.progress >= 100 ? 'from-life-green to-green-400' : 'from-life-teal to-teal-400'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </Surface>
    </div>
  );
}
