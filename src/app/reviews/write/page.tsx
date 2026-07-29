'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { avg, inLastDays } from '@/lib/utils';
import { REVIEW_PERIODS, ReviewPeriod } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export default function ReviewsWritePage() {
  const { state, saveReview } = useLifeOS();
  const { t, locale } = useI18n();
  const router = useRouter();

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

    // Finance Cashflow in the period
    const periodTransactions = state.transactions.filter((t) => inLastDays(t.date, days, today));
    const periodIncome = periodTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const periodExpense = periodTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const periodCashflow = periodIncome - periodExpense;

    // Cornell Notes in the period
    const periodSessions = state.learning.filter((item) => inLastDays(item.date, days, today));
    const completedCornellNotesCount = periodSessions.filter((s) => s.notesCues || s.notesNotes || s.notesSummary).length;

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
      cashflow: periodCashflow,
      sessionsCount: periodSessions.length,
      cornellNotesCount: completedCornellNotesCount,
    };
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
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
    
    router.push('/reviews/history');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/reviews">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="review" size={24} className="text-fuchsia-500" />
            Tulis Evaluasi
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Evaluasi progres harian, mingguan, atau bulanan Anda di satu tempat.
          </p>
        </div>
      </div>

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

            <Button type="submit" variant="primary" icon="check" className="w-full justify-center">
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
              <Badge tone="indigo" className="flex items-center gap-1">
                <Icon name="book" size={10} />
                <span>{`${metrics.learningMinutes} ${t('reviews_learning_min')}`}</span>
              </Badge>
              <Badge tone="green" className="flex items-center gap-1">
                <Icon name="activity" size={10} />
                <span>{`${metrics.workoutMinutes} ${t('reviews_workout_min')}`}</span>
              </Badge>
              <Badge tone="amber" className="flex items-center gap-1">
                <Icon name="book" size={10} />
                <span>{`Cornell Notes: ${metrics.cornellNotesCount}/${metrics.sessionsCount}`}</span>
              </Badge>
              <Badge tone={metrics.cashflow >= 0 ? 'teal' : 'rose'} className="flex items-center gap-1">
                <Icon name="wallet" size={10} />
                <span>{`Cashflow: ${metrics.cashflow >= 0 ? '+' : ''}${formatCurrency(metrics.cashflow)}`}</span>
              </Badge>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
