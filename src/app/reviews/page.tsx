'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { formatDate, avg, percent, inLastDays } from '@/lib/utils';
import { REVIEW_PERIODS, ReviewPeriod } from '@/lib/constants';

export default function ReviewsPage() {
  const { state, saveReview, deleteReview } = useLifeOS();
  const { t } = useI18n();

  // Period tab state
  const [activePeriod, setActivePeriod] = useState<ReviewPeriod>('weekly');

  // Form states
  const [score, setScore] = useState<number>(7);
  const [wins, setWins] = useState('');
  const [lessons, setLessons] = useState('');
  const [challenges, setChallenges] = useState('');
  const [focus, setFocus] = useState('');
  const [evaluationNotes, setEvaluationNotes] = useState('');

  // Auto-calculated metrics based on active tab period (e.g. 7 days for weekly, 30 days for monthly)
  const getPeriodDays = (p: ReviewPeriod) => {
    switch (p) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'yearly': return 365;
    }
  };

  const calculateAggregatedMetrics = () => {
    const days = getPeriodDays(activePeriod);
    const today = state.selectedDate;

    // Tasks completed
    const periodTasks = state.tasks.filter((task) => !task.due || inLastDays(task.due, days, today));
    const completedTasksCount = periodTasks.filter((task) => task.status === 'done').length;

    // Habits completed
    const periodHabitLogs = state.habitLogs.filter((log) => inLastDays(log.date, days, today));
    const totalHabitsTarget = Math.max(state.habits.length * days, 1);

    // Journals filled count
    const periodJournals = state.journals.filter((j) => inLastDays(j.date, days, today));

    // Goals average progress
    const goalsAvgProgress = Math.round(avg(state.goals.map((g) => g.progress)));

    // Learning & Workouts total minutes
    const learnMins = state.learning
      .filter((item) => inLastDays(item.date, days, today))
      .reduce((sum, item) => sum + Number(item.minutes || 0), 0);

    const workoutMins = state.workouts
      .filter((item) => inLastDays(item.date, days, today))
      .reduce((sum, item) => sum + Number(item.minutes || 0), 0);

    return {
      days,
      tasksDone: completedTasksCount,
      tasksTotal: periodTasks.length || 1,
      habitsDone: periodHabitLogs.length,
      habitsTotal: totalHabitsTarget,
      journalsDone: periodJournals.length,
      goalsAvg: goalsAvgProgress,
      learningMinutes: learnMins,
      workoutMinutes: workoutMins,
    };
  };

  const metrics = calculateAggregatedMetrics();

  // Populate Daily Win if journal today has one
  useEffect(() => {
    const todayJournal = state.journals.find((j) => j.date === state.selectedDate);
    if (todayJournal) {
      if (todayJournal.win && !wins) setWins(todayJournal.win);
      if (todayJournal.next && !focus) setFocus(todayJournal.next);
    }
  }, [state.journals, state.selectedDate, wins, focus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveReview({
      date: state.selectedDate,
      period: activePeriod,
      score,
      wins,
      lessons,
      challenges,
      focus,
      evaluationNotes,
    });

    setWins('');
    setLessons('');
    setChallenges('');
    setFocus('');
    setEvaluationNotes('');
  };

  const periodReviews = state.reviews
    .filter((r) => r.period === activePeriod)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Forms & Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Review Form */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {t('reviews_new')}
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                {t('reviews_form_desc')}
              </p>
            </div>

            {/* Segmented Period Tabs */}
            <div className="flex bg-white/[0.02] border border-life-line rounded-lg p-0.5 select-none self-start">
              {REVIEW_PERIODS.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setActivePeriod(period)}
                  className={`text-[10px] font-black uppercase py-1.5 px-3 rounded-md transition-all ${
                    activePeriod === period
                      ? 'bg-life-teal text-white shadow-sm'
                      : 'text-life-muted hover:text-life-text'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('date')}
                </label>
                <input
                  type="date"
                  required
                  value={state.selectedDate}
                  disabled
                  className="glass-input text-xs opacity-50 cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="score" className="text-xs font-bold text-life-muted uppercase">
                  {t('reviews_score')} (1-10)
                </label>
                <select
                  id="score"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="glass-select text-xs"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                    <option key={v} value={v}>
                      ⭐ {v} / 10
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="wins" className="text-xs font-bold text-life-muted uppercase">
                {t('reviews_wins')}
              </label>
              <input
                id="wins"
                type="text"
                placeholder="Pencapaian utama..."
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="lessons" className="text-xs font-bold text-life-muted uppercase">
                  {t('reviews_lessons')}
                </label>
                <input
                  id="lessons"
                  type="text"
                  placeholder="Pelajaran berharga..."
                  value={lessons}
                  onChange={(e) => setLessons(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="challenges" className="text-xs font-bold text-life-muted uppercase">
                  {t('reviews_challenges')}
                </label>
                <input
                  id="challenges"
                  type="text"
                  placeholder="Hambatan yang dihadapi..."
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="focus" className="text-xs font-bold text-life-muted uppercase">
                {t('reviews_focus')}
              </label>
              <input
                id="focus"
                type="text"
                placeholder="Fokus utama langkah berikutnya..."
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="evalNotes" className="text-xs font-bold text-life-muted uppercase">
                {t('reviews_evaluation')}
              </label>
              <textarea
                id="evalNotes"
                placeholder="Catatan khusus evaluasi menyeluruh..."
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                className="glass-input text-xs h-16 resize-none"
              />
            </div>

            <Button type="submit" variant="primary" icon="check" className="w-full">
              {t('reviews_save')}
            </Button>
          </form>
        </Surface>

        {/* Right: Metrics Overview */}
        <Surface className="p-6 flex flex-col justify-between">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('reviews_metrics')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Statistik agregasi otomatis {metrics.days} hari terakhir
            </p>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <ProgressBar
              value={metrics.tasksDone}
              max={metrics.tasksTotal}
              label={t('reviews_tasks_done')}
              detail={`${metrics.tasksDone} / ${metrics.tasksTotal}`}
            />
            <ProgressBar
              value={metrics.habitsDone}
              max={metrics.habitsTotal}
              label={t('reviews_habits_done')}
              detail={`${metrics.habitsDone} / ${metrics.habitsTotal}`}
              colorClass="from-life-green to-green-400"
            />
            <ProgressBar
              value={metrics.journalsDone}
              max={metrics.days}
              label={t('reviews_journal_filled')}
              detail={`${metrics.journalsDone} / ${metrics.days}`}
              colorClass="from-life-amber to-amber-400"
            />
            <ProgressBar
              value={metrics.goalsAvg}
              max={100}
              label={t('reviews_goal_progress')}
              detail={`${metrics.goalsAvg}%`}
              colorClass="from-life-indigo to-indigo-400"
            />

            <div className="flex flex-wrap gap-2 pt-3">
              <Badge tone="indigo">{`${metrics.learningMinutes} ${t('reviews_learning_min')}`}</Badge>
              <Badge tone="green">{`${metrics.workoutMinutes} ${t('reviews_workout_min')}`}</Badge>
            </div>
          </div>
        </Surface>
      </div>

      {/* History Timeline */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('reviews_history')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {periodReviews.length} {t('reviews_saved')}
          </p>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {periodReviews.length > 0 ? (
            periodReviews.map((review) => (
              <div 
                key={review.id} 
                className="p-4 rounded-xl bg-white/[0.005] border border-life-line space-y-2 relative"
              >
                <div className="flex justify-between items-start">
                  <strong className="text-xs text-life-text">{formatDate(review.date)}</strong>
                  <div className="flex items-center space-x-2 shrink-0">
                    <Badge tone="teal">{review.period}</Badge>
                    <Badge tone="amber">{`Score ${review.score}/10`}</Badge>
                    <button
                      onClick={() => deleteReview(review.id)}
                      className="text-life-muted hover:text-life-rose transition-colors p-1"
                      title={t('delete')}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 font-medium pt-1 text-life-muted">
                  {review.wins && (
                    <p>
                      🏆 Wins: <span className="text-life-text">{review.wins}</span>
                    </p>
                  )}
                  {review.focus && (
                    <p>
                      🎯 Focus: <span className="text-life-text">{review.focus}</span>
                    </p>
                  )}
                  {review.evaluationNotes && (
                    <p className="border-t border-white/5 pt-1.5 italic text-[11px] leading-relaxed">
                      &ldquo;{review.evaluationNotes}&rdquo;
                    </p>
                  )}
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
