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
 <div className="page-header">
 <div className="page-header-title">
 <Link href="/health" className="icon-btn" aria-label="Kembali"><Icon name="arrowLeft" size={18} /></Link>
 <div>
 <h1 className="page-title">
 {locale === 'id' ? 'Nutrisi & Makanan' : 'Nutrition & Meals'}
 </h1>
 <p className="page-subtitle">
 {locale === 'id' ? 'Catat kalori, protein, dan asupan harian.' : 'Log your daily calories, protein, and meals.'}
 </p>
 </div>
 </div>
 {/* AI Scan Button */}
 <AiFoodScanner onSave={handleAiSave} />
 </div>

 {/* Macro Summary Cards (STYLE_GUIDE §4.4: one hero, the rest white) */}
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
 {[
 { label: 'Kalori', value: totalCalories, target: mealGoalCalories, unit: 'kkal', hero: true },
 { label: 'Karbohidrat', value: totalCarbs, target: nutrition?.carbs_g, unit: 'g' },
 { label: 'Protein', value: totalProtein, target: nutrition?.protein_g, unit: 'g' },
 { label: 'Lemak', value: totalFat, target: nutrition?.fat_g, unit: 'g' },
 ].map((m) => {
 const pct = m.target ? Math.min(100, (m.value / m.target) * 100) : 0;
 return (
 <Surface key={m.label} variant={m.hero ? 'hero' : 'default'} className="p-4 md:p-5 flex flex-col gap-3">
 <span className="text-[13px] text-muted-foreground">{m.label}</span>
 <p className="figure-lg text-current">
 {Math.round(m.value)}
 <span className="unit">{m.target ? `/ ${Math.round(m.target)} ${m.unit}` : m.unit}</span>
 </p>
 {m.target ? (
 <div
 className={m.hero ? 'h-1.5 rounded-full bg-white/30 overflow-hidden' : 'duo-progress-track'}
 role="progressbar" aria-label={m.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
 >
 <div className={m.hero ? 'h-full rounded-full bg-white' : 'duo-progress-fill'} style={{ width: `${pct}%` }} />
 </div>
 ) : (
 <span className="text-xs text-muted-foreground">Lengkapi profil untuk target</span>
 )}
 </Surface>
 );
 })}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
 {/* Meal Tracker */}
 <Surface className="p-4 md:p-6">
 <div className="border-b border-border pb-3 mb-4">
 <h3 className="section-title">
 {t('health_meal_log')}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
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

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
 <div className="flex flex-col space-y-1">
 <label className="text-xs font-medium text-muted-foreground ">
 {t('health_meal_type')}
 </label>
 <select
 value={mealType}
 onChange={(e) => setMealType(e.target.value as any)}
 className="glass-select"
 >
 {MEAL_TYPES.map((m) => (
 <option key={m} value={m}>
 {m}
 </option>
 ))}
 </select>
 </div>

 <div className="flex flex-col space-y-1 sm:col-span-2">
 <label className="text-xs font-medium text-muted-foreground ">
 {t('health_food')}
 </label>
 <input
 type="text"
 required
 placeholder={t('health_food_placeholder')}
 value={mealFood}
 onChange={(e) => setMealFood(e.target.value)}
 className="glass-input"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <div className="flex flex-col space-y-1">
 <label className="text-xs font-medium text-muted-foreground ">
 {t('health_calories')}
 </label>
 <input
 type="number"
 min="0"
 step="any"
 required
 value={mealCalories}
 onChange={(e) => setMealCalories(Number(e.target.value))}
 className="glass-input"
 />
 </div>

 <div className="flex flex-col space-y-1">
 <label className="text-xs font-medium text-muted-foreground ">
 Karbo
 </label>
 <input
 type="number"
 min="0"
 step="any"
 value={mealCarbs}
 onChange={(e) => setMealCarbs(Number(e.target.value))}
 className="glass-input"
 />
 </div>

 <div className="flex flex-col space-y-1">
 <label className="text-xs font-medium text-muted-foreground ">
 {t('health_protein')}
 </label>
 <input
 type="number"
 min="0"
 step="any"
 required
 value={mealProtein}
 onChange={(e) => setMealProtein(Number(e.target.value))}
 className="glass-input"
 />
 </div>

 <div className="flex flex-col space-y-1">
 <label className="text-xs font-medium text-muted-foreground ">
 Lemak
 </label>
 <input
 type="number"
 min="0"
 step="any"
 value={mealFat}
 onChange={(e) => setMealFat(Number(e.target.value))}
 className="glass-input"
 />
 </div>
 </div>

 <Button type="submit" variant="primary" icon="plus" className="w-full">
 {t('health_add_meal')}
 </Button>
 </form>
 </Surface>

 {/* Daily Logs List (Meals today) */}
 <Surface className="p-4 md:p-6">
 <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
 <div>
 <h3 className="section-title">
 {activeTab === 'today' ? t('health_meals_today') : locale === 'id' ? 'Riwayat Logs' : 'Logs History'}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 {displayMeals.length} logs saved
 </p>
 </div>
 <div role="tablist" className="seg">
 <button 
 onClick={() => setActiveTab('today')}
 role="tab" aria-selected={activeTab === 'today'} className="seg-item"
 >
 {locale === 'id' ? 'Hari Ini' : 'Today'}
 </button>
 <button 
 onClick={() => setActiveTab('history')}
 role="tab" aria-selected={activeTab === 'history'} className="seg-item"
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
 className="p-3 rounded-lg bg-muted flex justify-between items-start gap-3"
 >
 <div className="flex gap-3 min-w-0 flex-1">
 {/* Thumbnail if available */}
 {meal.imageUrl && (
 <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border">
 <img 
 src={meal.imageUrl} 
 alt={meal.food} 
 className="w-full h-full object-cover"
 />
 </div>
 )}
 <div className="min-w-0">
 <strong className="text-xs text-foreground block truncate">
 {activeTab === 'history' && <span className="text-muted-foreground mr-1">{formatDate(meal.date, { short: true, locale })} &bull;</span>}
 {meal.type}: {meal.food}
 </strong>
 {meal.portion && (
 <span className="text-xs text-muted-foreground block">{meal.portion}</span>
 )}
 <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
 <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full">
 {meal.calories} kcal
 </span>
 {(meal.carbs > 0) && (
 <span className="text-xs font-semibold text-blue-600 dark:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full">
 K: {meal.carbs}g
 </span>
 )}
 <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full">
 P: {meal.protein}g
 </span>
 {(meal.fat > 0) && (
 <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded-full">
 L: {meal.fat}g
 </span>
 )}
 </div>
 </div>
 </div>
 <button
 onClick={() => deleteMeal(meal.id)}
 className="icon-btn hover:text-destructive"
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
