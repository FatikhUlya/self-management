'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { todayISO } from '@/lib/utils';
import { MEAL_TYPES, ACTIVITY_LEVELS } from '@/lib/constants';

export default function HealthNutritionPage() {
  const { state, addMeal, deleteMeal } = useLifeOS();
  const { t, locale } = useI18n();
  const today = state.selectedDate || todayISO();

  // Meal form
  const [mealType, setMealType] = useLocalStorageState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('draft_health_mealType', 'Breakfast');
  const [mealFood, setMealFood] = useLocalStorageState('draft_health_mealFood', '');
  const [mealProtein, setMealProtein] = useLocalStorageState<number>('draft_health_mealProtein', 0);
  const [mealCalories, setMealCalories] = useLocalStorageState<number>('draft_health_mealCalories', 0);

  const dailyMeals = state.meals.filter((m) => m.date === today);

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
  const totalCalories = dailyMeals.reduce((s, m) => s + Number(m.calories || 0), 0);
  const totalProtein = dailyMeals.reduce((s, m) => s + Number(m.protein || 0), 0);

  // Meal Form Handler
  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealFood.trim()) return;

    await addMeal({
      date: today,
      type: mealType,
      food: mealFood,
      protein: mealProtein,
      calories: mealCalories,
    });

    setMealFood('');
    setMealProtein(0);
    setMealCalories(0);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/health">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="coffee" size={24} className="text-amber-500" />
            Nutrition & Meals
          </h1>
          <p className="text-zinc-500 text-xs">
            {locale === 'id' ? 'Catat kalori, protein, dan asupan harian.' : 'Log your daily calories, protein, and meals.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meal Tracker */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('health_meal_log')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {totalCalories} / {mealGoalCalories} kcal / {totalProtein}g protein
            </p>
          </div>

          <form onSubmit={handleMealSubmit} className="space-y-3">
            <ProgressBar
              value={totalCalories}
              max={mealGoalCalories}
              label={t('health_calorie_progress')}
              detail={`${totalCalories} / ${mealGoalCalories} kcal`}
            />

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('health_meal_type')}
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as any)}
                  className="glass-select text-xs"
                >
                  {MEAL_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1 col-span-2">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('health_food')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('health_food_placeholder')}
                  value={mealFood}
                  onChange={(e) => setMealFood(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('health_protein')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={mealProtein}
                  onChange={(e) => setMealProtein(Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('health_calories')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={mealCalories}
                  onChange={(e) => setMealCalories(Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full">
              {t('health_add_meal')}
            </Button>
          </form>
        </Surface>

        {/* Daily Logs List (Meals today) */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('health_meals_today')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {dailyMeals.length} logs saved
            </p>
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {dailyMeals.length > 0 ? (
              dailyMeals.map((meal) => (
                <div 
                  key={meal.id} 
                  className="p-3 rounded-lg bg-white/[0.005] border border-life-line flex justify-between items-center gap-4"
                >
                  <div>
                    <strong className="text-xs text-life-text block">{meal.type}: {meal.food}</strong>
                    <span className="text-[10px] text-life-muted font-black uppercase tracking-wider">
                      {meal.calories} kcal / {meal.protein}g {t('health_protein_short')}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteMeal(meal.id)}
                    className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all"
                    title={t('delete')}
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </Surface>
      </div>
    </div>
  );
}
