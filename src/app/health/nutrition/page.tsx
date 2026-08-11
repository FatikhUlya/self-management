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
import { AiFoodScanner } from '@/components/ui/AiFoodScanner';
import { WeeklyNutritionAnalytics } from '@/components/health/WeeklyNutritionAnalytics';
import { todayISO, formatDate } from '@/lib/utils';
import { MEAL_TYPES, ACTIVITY_LEVELS } from '@/lib/constants';
import { calculateDailyNutrition, Gender, Goal } from '@/lib/nutritionEngine';

export default function HealthNutritionPage() {
  const { state, addMeal, deleteMeal } = useLifeOS();
  const { t, locale } = useI18n();
  const today = state.selectedDate || todayISO();

  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  // Meal form
  const [mealType, setMealType] = useLocalStorageState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('draft_health_mealType', 'Breakfast');
  const [mealFood, setMealFood] = useLocalStorageState('draft_health_mealFood', '');
  const [mealProtein, setMealProtein] = useLocalStorageState<number>('draft_health_mealProtein', 0);
  const [mealCalories, setMealCalories] = useLocalStorageState<number>('draft_health_mealCalories', 0);
  const [mealCarbs, setMealCarbs] = useLocalStorageState<number>('draft_health_mealCarbs', 0);
  const [mealFat, setMealFat] = useLocalStorageState<number>('draft_health_mealFat', 0);

  const dailyMeals = state.meals.filter((m) => m.date === today);
  const allMealsSorted = [...state.meals].sort((a, b) => b.date.localeCompare(a.date));
  const displayMeals = activeTab === 'today' ? dailyMeals : allMealsSorted;

  const getLatestWeight = () => {
    const logs = [...state.weightLogs].sort((a, b) => b.date.localeCompare(a.date));
    return logs[0] || null;
  };

  const getNutritionTargets = () => {
    const latest = getLatestWeight();
    const w = latest ? Number(latest.weight) : 0;
    const h = Number(state.healthProfile.height || 0);
    const a = Number(state.healthProfile.age || 0);
    const gender = state.healthProfile.gender as Gender || 'male';
    const goal = state.healthProfile.goal as Goal || 'maintain';
    const activity = ACTIVITY_LEVELS.find((l) => l.id === state.healthProfile.activityLevel) || ACTIVITY_LEVELS[2];
    
    if (!w || !h || !a || !gender || !goal) return null;

    return calculateDailyNutrition({
      weight_kg: w,
      height_cm: h,
      age_years: a,
      gender,
      activity_level: activity.factor,
      goal
    });
  };

  const nutrition = getNutritionTargets();
  const mealGoalCalories = Number(state.healthProfile.mealGoalCalories || nutrition?.calories || 2000);
  
  const totalCalories = dailyMeals.reduce((s, m) => s + Number(m.calories || 0), 0);
  const totalProtein = dailyMeals.reduce((s, m) => s + Number(m.protein || 0), 0);
  const totalCarbs = dailyMeals.reduce((s, m) => s + Number(m.carbs || 0), 0);
  const totalFat = dailyMeals.reduce((s, m) => s + Number(m.fat || 0), 0);

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
      carbs: mealCarbs,
      fat: mealFat,
      portion: '',
      imageUrl: '',
    });

    setMealFood('');
    setMealProtein(0);
    setMealCalories(0);
    setMealCarbs(0);
    setMealFat(0);
  };

  // AI Scan save handler
  const handleAiSave = async (data: {
    food: string;
    portion: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    imageUrl: string;
  }) => {
    await addMeal({
      date: today,
      type: mealType, // Use currently selected meal type
      food: data.food,
      protein: data.protein,
      calories: data.calories,
      carbs: data.carbs,
      fat: data.fat,
      portion: data.portion,
      imageUrl: '', // Do not save the heavy base64 image to DB
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/health">
            <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
              <Icon name="arrowLeft" size={18} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
              <Icon name="apple" size={24} className="text-amber-500" />
              Nutrition & Meals
            </h1>
            <p className="text-zinc-500 text-xs">
              {locale === 'id' ? 'Catat kalori, protein, dan asupan harian.' : 'Log your daily calories, protein, and meals.'}
            </p>
          </div>
        </div>
        {/* AI Scan Button */}
        <AiFoodScanner onSave={handleAiSave} />
      </div>

      {/* Macro Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-b from-amber-500/[0.08] to-transparent border border-amber-500/10 relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500/70">Kalori</p>
          <p className="text-lg font-black text-amber-400">
            {totalCalories} <span className="text-xs font-bold text-amber-400/50">/ {mealGoalCalories}</span>
          </p>
          <div className="absolute bottom-0 left-0 h-1 bg-amber-500/20 w-full">
            <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (totalCalories / mealGoalCalories) * 100)}%` }} />
          </div>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-b from-blue-500/[0.08] to-transparent border border-blue-500/10 relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-500/70">Karbohidrat</p>
          <p className="text-lg font-black text-blue-400">
            {totalCarbs} <span className="text-xs font-bold text-blue-400/50">{nutrition ? `/ ${nutrition.carbs_g}g` : 'g'}</span>
          </p>
          {nutrition && (
            <div className="absolute bottom-0 left-0 h-1 bg-blue-500/20 w-full">
              <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (totalCarbs / nutrition.carbs_g) * 100)}%` }} />
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-b from-rose-500/[0.08] to-transparent border border-rose-500/10 relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-500/70">Protein</p>
          <p className="text-lg font-black text-rose-400">
            {totalProtein} <span className="text-xs font-bold text-rose-400/50">{nutrition ? `/ ${nutrition.protein_g}g` : 'g'}</span>
          </p>
          {nutrition && (
            <div className="absolute bottom-0 left-0 h-1 bg-rose-500/20 w-full">
              <div className="h-full bg-rose-500" style={{ width: `${Math.min(100, (totalProtein / nutrition.protein_g) * 100)}%` }} />
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-b from-yellow-500/[0.08] to-transparent border border-yellow-500/10 relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-wider text-yellow-500/70">Lemak</p>
          <p className="text-lg font-black text-yellow-400">
            {totalFat} <span className="text-xs font-bold text-yellow-400/50">{nutrition ? `/ ${nutrition.fat_g}g` : 'g'}</span>
          </p>
          {nutrition && (
            <div className="absolute bottom-0 left-0 h-1 bg-yellow-500/20 w-full">
              <div className="h-full bg-yellow-500" style={{ width: `${Math.min(100, (totalFat / nutrition.fat_g) * 100)}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Meal Tracker */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('health_meal_log')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {totalCalories} / {mealGoalCalories} kcal
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

            <div className="grid grid-cols-4 gap-3">
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

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  Karbo
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={mealCarbs}
                  onChange={(e) => setMealCarbs(Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>

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
                  Lemak
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={mealFat}
                  onChange={(e) => setMealFat(Number(e.target.value))}
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
          <div className="border-b border-life-line pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {activeTab === 'today' ? t('health_meals_today') : locale === 'id' ? 'Riwayat Logs' : 'Logs History'}
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                {displayMeals.length} logs saved
              </p>
            </div>
            <div className="flex bg-life-bg p-1 rounded-lg border border-life-line">
              <button 
                onClick={() => setActiveTab('today')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeTab === 'today' ? 'bg-life-surface text-life-text shadow' : 'text-life-muted hover:text-life-text'}`}
              >
                {locale === 'id' ? 'Hari Ini' : 'Today'}
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-life-surface text-life-text shadow' : 'text-life-muted hover:text-life-text'}`}
              >
                {locale === 'id' ? 'Riwayat' : 'History'}
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {displayMeals.length > 0 ? (
              displayMeals.map((meal) => (
                <div 
                  key={meal.id} 
                  className="p-3 rounded-lg bg-white/[0.005] border border-life-line flex justify-between items-start gap-3"
                >
                  <div className="flex gap-3 min-w-0 flex-1">
                    {/* Thumbnail if available */}
                    {meal.imageUrl && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-life-line">
                        <img 
                          src={meal.imageUrl} 
                          alt={meal.food} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <strong className="text-xs text-life-text block truncate">
                        {activeTab === 'history' && <span className="text-amber-500 mr-1">{formatDate(meal.date, { short: true, locale })} &bull;</span>}
                        {meal.type}: {meal.food}
                      </strong>
                      {meal.portion && (
                        <span className="text-[10px] text-life-muted block">{meal.portion}</span>
                      )}
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                        <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {meal.calories} kcal
                        </span>
                        {(meal.carbs > 0) && (
                          <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            K: {meal.carbs}g
                          </span>
                        )}
                        <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          P: {meal.protein}g
                        </span>
                        {(meal.fat > 0) && (
                          <span className="text-[10px] font-black text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                            L: {meal.fat}g
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMeal(meal.id)}
                    className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all shrink-0"
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

      <WeeklyNutritionAnalytics 
        meals={state.meals} 
        targetNutrition={nutrition} 
        baseGoalCalories={mealGoalCalories}
        today={today}
        locale={locale}
      />
    </div>
  );
}
