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
import { LineChart } from '@/components/ui/LineChart';
import { formatDate, monthDays, parseDecimalInput, todayISO } from '@/lib/utils';
import { ACTIVITY_LEVELS, ActivityLevelId } from '@/lib/constants';
import { calculateDailyNutrition, Gender, Goal } from '@/lib/nutritionEngine';

export default function HealthMetricsPage() {
 const { state, updateHealthProfile, saveWeightLog, deleteWeightLog } = useLifeOS();
 const { t, locale } = useI18n();
 const today = state.selectedDate || todayISO();

 // Profile forms
 const [height, setHeight] = useState<number | ''>(state.healthProfile.height);
 const [age, setAge] = useState<number | ''>(state.healthProfile.age);
 const [activityLevel, setActivityLevel] = useState<ActivityLevelId>(
 state.healthProfile.activityLevel as ActivityLevelId || 'moderate'
 );
 const [gender, setGender] = useState<Gender | ''>(state.healthProfile.gender as Gender || 'male');
 const [goal, setGoal] = useState<Goal | ''>(state.healthProfile.goal as Goal || 'maintain');
 const [mealGoal, setMealGoal] = useState<number | ''>(state.healthProfile.mealGoalCalories);

 // Weight form
 const [weightValue, setWeightValue] = useLocalStorageState<string>('draft_health_weightValue', '');
 const [weightNotes, setWeightNotes] = useLocalStorageState<string>('draft_health_weightNotes', '');

 const getLatestWeight = () => {
 const logs = [...state.weightLogs].sort((a, b) => b.date.localeCompare(a.date));
 return logs[0] || null;
 };

 const getNutritionTargets = () => {
 const latest = getLatestWeight();
 const w = latest ? Number(latest.weight) : 0;
 const h = Number(height || state.healthProfile.height || 0);
 const a = Number(age || state.healthProfile.age || 0);
 const activity = ACTIVITY_LEVELS.find((l) => l.id === activityLevel) || ACTIVITY_LEVELS[2];
 
 if (!w || !h || !a || !gender || !goal) return null;

 return calculateDailyNutrition({
 weight_kg: w,
 height_cm: h,
 age_years: a,
 gender: gender as Gender,
 activity_level: activity.factor,
 goal: goal as Goal
 });
 };

 const nutrition = getNutritionTargets();
 const tdee = nutrition?.tdee || 0;
 const recommendedCals = nutrition?.calories || 0;
 const latestWeight = getLatestWeight();

 // Profile Form Handler
 const handleProfileSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 await updateHealthProfile({
 height: height === '' ? '' : Number(height),
 age: age === '' ? '' : Number(age),
 activityLevel,
 gender: gender as 'male' | 'female',
 goal: goal as 'muscle_gain' | 'lose_weight' | 'maintain',
 mealGoalCalories: mealGoal === '' ? '' : Number(mealGoal),
 });
 };

 // Weight Form Handler
 const handleWeightSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!weightValue.trim()) return;

 const parsedWeight = parseDecimalInput(weightValue);
 await saveWeightLog(parsedWeight, weightNotes, today);
 setWeightValue('');
 setWeightNotes('');
 };

 // Weight history list for Line Chart (months)
 const daysInMonth = monthDays(today);
 const weightChartPoints = daysInMonth.map((day) => {
 const log = state.weightLogs.find((l) => l.date === day);
 return {
 label: day.slice(-2),
 value: log ? Number(log.weight) : null,
 dateStr: day,
 };
 });

 const loggedWeights = state.weightLogs
 .filter((w) => daysInMonth.includes(w.date))
 .sort((a, b) => b.date.localeCompare(a.date));

 return (
 <div className="space-y-6 max-w-5xl mx-auto">
 {/* Header */}
 <div className="page-header-title">
 <Link href="/health" className="icon-btn" aria-label="Kembali"><Icon name="arrowLeft" size={18} /></Link>
 <div>
 <h1 className="page-title">
 Body Metrics
 </h1>
 <p className="text-zinc-500 text-xs">
 {locale === 'id' ? 'Kelola profil TDEE dan catat berat badan.' : 'Manage TDEE profile and log your weight.'}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Profile (TDEE) */}
 <Surface className="p-6">
 <div className="border-b border-border pb-3 mb-4">
 <h3 className="text-sm font-medium text-foreground ">
 {t('health_tdee_profile')}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 {tdee > 0 ? `BMR: ${nutrition?.bmr} | TDEE: ${tdee} kcal` : t('health_tdee_incomplete')}
 </p>
 </div>

 <form onSubmit={handleProfileSubmit} className="space-y-3">
 <div className="grid grid-cols-2 gap-3">
 <div className="flex flex-col space-y-1">
 <label className="text-xs font-medium text-muted-foreground ">
 {t('health_height')}
 </label>
 <input
 type="number"
 placeholder="170"
 value={height}
 onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
 className="glass-input text-xs" aria-label="170"
/>
 </div>

 <div className="flex flex-col space-y-1">
 <label className="text-xs font-medium text-muted-foreground ">
 {t('health_age')}
 </label>
 <input
 type="number"
 placeholder="25"
 value={age}
 onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
 className="glass-input text-xs" aria-label="25"
/>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="flex flex-col space-y-1">
 <label className="text-xs font-medium text-muted-foreground ">
 {t('health_activity')}
 </label>
 <select
 value={activityLevel}
 onChange={(e) => setActivityLevel(e.target.value as ActivityLevelId)}
 className="glass-select text-xs"
 >
 {ACTIVITY_LEVELS.map((lvl) => (
 <option key={lvl.id} value={lvl.id}>
 {lvl.label} ({lvl.factor}x)
 </option>
 ))}
 </select>
 </div>

 <div className="flex flex-col space-y-1">
 <label className="text-xs font-medium text-muted-foreground ">
 Gender
 </label>
 <select
 value={gender}
 onChange={(e) => setGender(e.target.value as Gender)}
 className="glass-select text-xs"
 >
 <option value="male">Male</option>
 <option value="female">Female</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="flex flex-col space-y-1">
 <label className="text-xs font-medium text-muted-foreground ">
 Goal
 </label>
 <select
 value={goal}
 onChange={(e) => setGoal(e.target.value as Goal)}
 className="glass-select text-xs"
 >
 <option value="lose_weight">Lose Weight (-500 kcal)</option>
 <option value="maintain">Maintain (+0 kcal)</option>
 <option value="muscle_gain">Muscle Gain (+350 kcal)</option>
 </select>
 </div>

 <div className="flex flex-col space-y-1">
 <label className="text-xs font-medium text-muted-foreground ">
 {t('health_meal_goal')} (Override)
 </label>
 <input
 type="number"
 placeholder={recommendedCals ? `Rec: ${recommendedCals}` : t('health_auto_tdee')}
 value={mealGoal}
 onChange={(e) => setMealGoal(e.target.value === '' ? '' : Number(e.target.value))}
 className="glass-input text-xs"
 />
 </div>
 </div>

 <Button type="submit" variant="primary" icon="check" className="w-full">
 {t('health_save_profile')}
 </Button>
 </form>
 </Surface>

 {/* Weight Log Form */}
 <Surface className="p-6">
 <div className="border-b border-border pb-3 mb-4">
 <h3 className="text-sm font-medium text-foreground ">
 {t('health_weight_log')}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 {latestWeight ? `${latestWeight.weight} kg (${formatDate(latestWeight.date)})` : t('health_no_weight')}
 </p>
 </div>

 <form onSubmit={handleWeightSubmit} className="space-y-4">
 <div className="grid grid-cols-2 gap-3">
 <div className="flex flex-col space-y-1 col-span-2 sm:col-span-1">
 <label className="text-xs font-medium text-muted-foreground ">
 {t('health_weight_kg')}
 </label>
 <input
 type="text"
 required
 placeholder={t('health_weight_example')}
 value={weightValue}
 onChange={(e) => setWeightValue(e.target.value)}
 className="glass-input text-xs"
 />
 </div>

 <div className="flex flex-col space-y-1 col-span-2 sm:col-span-1">
 <label className="text-xs font-medium text-muted-foreground ">
 {t('notes')}
 </label>
 <input
 type="text"
 placeholder="Kondisi"
 value={weightNotes}
 onChange={(e) => setWeightNotes(e.target.value)}
 className="glass-input text-xs" aria-label="Kondisi"
/>
 </div>
 </div>

 <Button type="submit" variant="primary" icon="plus" className="w-full">
 {t('health_save_weight')}
 </Button>
 </form>
 </Surface>
 </div>

 {/* Weight History Line Chart */}
 <Surface className="p-6">
 <div className="border-b border-border pb-3 mb-6">
 <h3 className="text-sm font-medium text-foreground ">
 {t('health_weight_monthly')}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 {t('health_weight_monthly_desc')}
 </p>
 </div>

 <LineChart points={weightChartPoints} title="Monthly Weight History" />

 {/* Weight logs list */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-h-[300px] overflow-y-auto pr-1">
 {loggedWeights.length > 0 ? (
 loggedWeights.map((log) => (
 <div 
 key={log.id} 
 className="p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between gap-4"
 >
 <div>
 <strong className="text-xs text-foreground block">{log.weight} kg</strong>
 <span className="text-xs text-muted-foreground font-medium">{formatDate(log.date)} • {log.notes || 'No notes'}</span>
 </div>
 <button
 onClick={() => deleteWeightLog(log.id)}
 className="icon-btn hover:text-destructive"
 title={t('delete')}
 >
 <Icon name="trash" size={12} />
 </button>
 </div>
 ))
 ) : (
 <div className="col-span-full">
 <EmptyState message={locale === 'id' ? 'Belum ada catatan berat badan bulan ini.' : 'No weight records for this month.'} />
 </div>
 )}
 </div>
 </Surface>
 </div>
 );
}
