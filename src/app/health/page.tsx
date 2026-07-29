'use client';

import React from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '@/components/ui/Icon';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { QuickNavGrid } from '@/components/ui/QuickNavGrid';
import { todayISO } from '@/lib/utils';
import { ACTIVITY_LEVELS } from '@/lib/constants';

export default function HealthDashboardPage() {
  const { state } = useLifeOS();
  const { t, locale } = useI18n();
  const today = state.selectedDate || todayISO();

  // Derive metrics
  const getLatestWeight = () => {
    const logs = [...state.weightLogs].sort((a, b) => b.date.localeCompare(a.date));
    return logs[0] || null;
  };

  const calculateTdee = () => {
    const latest = getLatestWeight();
    const w = latest ? Number(latest.weight) : 0;
    const h = Number(state.healthProfile.height || 0);
    const a = Number(state.healthProfile.age || 0);
    const activity = ACTIVITY_LEVELS.find((l) => l.id === state.healthProfile.activityLevel) || ACTIVITY_LEVELS[2];
    if (!w || !h || !a) return 0;
    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    return Math.round(bmr * activity.factor);
  };

  const tdee = calculateTdee();
  const mealGoalCalories = Number(state.healthProfile.mealGoalCalories || tdee || 2000);
  
  const dailyMeals = state.meals.filter((m) => m.date === today);
  const totalCalories = dailyMeals.reduce((s, m) => s + Number(m.calories || 0), 0);
  
  const dailyWorkouts = state.workouts.filter((w) => w.date === today);
  const totalWorkoutMins = dailyWorkouts.reduce((s, w) => s + Number(w.minutes || 0), 0);

  const latestWeight = getLatestWeight();
  const caloriePercent = mealGoalCalories > 0 ? Math.min(100, Math.round((totalCalories / mealGoalCalories) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-600 dark:from-red-300 dark:to-rose-500 flex items-center gap-2">
            <Icon name="activity" size={28} className="text-red-500" />
            {t('health_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Log berat badan, kalori makanan (meal log), dan latihan fisik harian.
          </p>
        </div>
      </div>

      {/* Sub-page Navigation Grid */}
      <QuickNavGrid 
        items={[
          { label: 'Metrics', icon: 'barChart', iconColor: 'text-rose-500', href: '/health/metrics' },
          { label: 'Nutrition', icon: 'apple', iconColor: 'text-amber-500', href: '/health/nutrition' },
          { label: 'Workout', icon: 'dumbbell', iconColor: 'text-emerald-500', href: '/health/workout' }
        ]} 
      />

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          icon="activity"
          iconColor="text-rose-500"
          accentColor="rose-500"
          label={t('health_weight_log')}
          value={latestWeight ? `${latestWeight.weight} kg` : '—'}
          detail={latestWeight ? `TDEE: ${tdee > 0 ? tdee : '—'} kcal` : t('health_no_weight')}
        />
        <DashboardCard
          icon="apple"
          iconColor="text-amber-500"
          accentColor="amber-500"
          label={t('health_meal_log')}
          value={`${totalCalories} kcal`}
          detail={`Target: ${mealGoalCalories} kcal`}
        >
          <div className="w-full bg-black/10 dark:bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${caloriePercent > 100 ? 'bg-rose-500' : 'bg-amber-500'}`} 
              style={{ width: `${Math.min(100, caloriePercent)}%` }}
            />
          </div>
        </DashboardCard>
        <DashboardCard
          icon="dumbbell"
          iconColor="text-emerald-500"
          accentColor="emerald-500"
          label={t('health_workout_log')}
          value={`${totalWorkoutMins} m`}
          detail={`${dailyWorkouts.length} ${t('health_logs_saved')} ${locale === 'id' ? 'hari ini' : 'today'}`}
        />
      </div>

      {/* Quick Summary Section (e.g. latest meal or workout just for glance) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Workout Summary */}
        <div className="p-5 rounded-2xl bg-white/[0.01] border border-life-line">
          <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider mb-3">Latihan Hari Ini</h4>
          {dailyWorkouts.length > 0 ? (
            <div className="space-y-2">
              {dailyWorkouts.map((w) => (
                <div key={w.id} className="flex justify-between items-center p-2 rounded bg-white/[0.02]">
                  <span className="text-xs font-bold text-life-text">{w.program}</span>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{w.minutes}m</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-life-muted italic">Belum ada latihan hari ini.</p>
          )}
        </div>

        {/* Today's Meals Summary */}
        <div className="p-5 rounded-2xl bg-white/[0.01] border border-life-line">
          <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider mb-3">Makanan Hari Ini</h4>
          {dailyMeals.length > 0 ? (
            <div className="space-y-2">
              {dailyMeals.slice(0, 3).map((m) => (
                <div key={m.id} className="flex justify-between items-center p-2 rounded bg-white/[0.02]">
                  <span className="text-xs font-bold text-life-text truncate mr-2">{m.type}: {m.food}</span>
                  <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded shrink-0">{m.calories} kcal</span>
                </div>
              ))}
              {dailyMeals.length > 3 && (
                <p className="text-[10px] text-center text-life-muted pt-1">+{dailyMeals.length - 3} lainnya</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-life-muted italic">Belum ada makanan dicatat hari ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}
