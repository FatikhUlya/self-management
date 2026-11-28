import type { LifeOSState } from '@/lib/hooks/useLifeOSState';
import type { GoalTarget } from '@/lib/lifeGoals';
import { inRange, periodProgress, PeriodRange } from '@/lib/period';
import type { LifeRecord } from '@/lib/recordKinds';

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Cross-module figures for one period (Reports, period reviews). */
export function summarize(s: LifeOSState, r: PeriodRange, today: string, targets: GoalTarget[], records: LifeRecord[] = []) {
  const doneSet = new Set(['done', 'completed']);
  const tasksDue = s.tasks.filter((t) => inRange(t.due, r));
  const tasksDone = tasksDue.filter((t) => doneSet.has(t.status)).length;
  const completedIn = s.tasks.filter((t) => doneSet.has(t.status) && inRange(t.completedAt, r)).length;

  const elapsed = periodProgress(r, today).elapsed;
  const habitSlots = s.habits.length * Math.max(elapsed, 0);
  const habitLogs = s.habitLogs.filter((l) => inRange(l.date, r)).length;
  const habitPct = habitSlots ? Math.min(100, (habitLogs / habitSlots) * 100) : 0;

  const journals = s.journals.filter((j) => inRange(j.date, r));
  const tx = s.transactions.filter((t) => inRange(t.date, r));
  const income = tx.filter((t) => t.type === 'income').reduce((a, t) => a + Number(t.amount || 0), 0);
  const expense = tx.filter((t) => t.type === 'expense').reduce((a, t) => a + Number(t.amount || 0), 0);

  const workouts = s.workouts.filter((w) => inRange(w.date, r));
  const meals = s.meals.filter((m) => inRange(m.date, r));
  const mealDays = new Set(meals.map((m) => m.date)).size;
  const weights = s.weightLogs.filter((w) => inRange(w.date, r)).sort((a, b) => a.date.localeCompare(b.date));
  const sleep = s.sleepLogs.filter((l) => inRange(l.date, r));
  const learnMin = s.learning.filter((l) => inRange(l.date, r)).reduce((a, l) => a + Number(l.minutes || 0), 0);
  const focusMin = s.focusSessions.filter((f) => inRange(f.startedAt, r)).reduce((a, f) => a + Number(f.actualMinutes || 0), 0);
  const tg = targets.filter((t) => inRange(t.periodStart, r));

  // Journal notebooks & daily checks (life_records)
  const recs = records.filter((x) => inRange(x.date, r));
  const daily = recs.filter((x) => x.kind === 'daily');
  const waterDays = daily.filter((x) => Number(x.data?.water) > 0);
  const prayerSlots = Math.max(elapsed, 0) * 5;
  const prayers = daily.reduce((a, x) => a + Object.values(x.data?.prayers || {}).filter(Boolean).length, 0);
  const periodReviews = recs.filter((x) => x.kind === 'period_review').length;
  const notes = recs.filter((x) => !['daily', 'period_review', 'profile'].includes(x.kind)).length;

  // Monthly budgets, scaled to the period length
  const monthlyLimit = (s.budgets || []).filter((b) => b.period === 'monthly').reduce((a, b) => a + Number(b.limitAmount || 0), 0);
  const total = periodProgress(r, today).total;
  const budget = monthlyLimit ? Math.round(monthlyLimit * (total / 30.44)) : 0;

  return {
    tasksDue: tasksDue.length, tasksDone, completedIn, habitPct, habitLogs,
    journalCount: journals.length,
    mood: avg(journals.map((j) => Number(j.mood)).filter(Boolean)),
    energy: avg(journals.map((j) => Number(j.energy)).filter(Boolean)),
    income, expense, net: income - expense,
    workoutCount: workouts.length, workoutMin: workouts.reduce((a, w) => a + Number(w.minutes || 0), 0),
    kcalPerDay: mealDays ? meals.reduce((a, m) => a + Number(m.calories || 0), 0) / mealDays : 0,
    weightDelta: weights.length > 1 ? Number(weights[weights.length - 1].weight) - Number(weights[0].weight) : null,
    sleepAvg: avg(sleep.map((l) => Number(l.durationMinutes || 0))) / 60,
    learnMin, focusMin,
    targetsTotal: tg.length, targetsDone: tg.filter((t) => t.done).length,
    reviews: s.reviews.filter((rv) => inRange(rv.date, r)).length + periodReviews,
    waterAvg: waterDays.length ? avg(waterDays.map((x) => Number(x.data.water))) : 0,
    prayerPct: prayerSlots ? Math.min(100, (prayers / prayerSlots) * 100) : 0,
    budget, budgetPct: budget ? (expense / budget) * 100 : null,
    notes,
  };
}
