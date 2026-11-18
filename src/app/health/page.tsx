'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { MetricCard } from '@/components/ui/MetricCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StaggerGroup, StaggerItem } from '@/lib/animations';
import { formatDate, todayISO, percent, cn } from '@/lib/utils';
import { ACTIVITY_LEVELS, MEAL_TYPES, WORKOUT_PROGRAM_NAMES } from '@/lib/constants';

export default function HealthPage() {
  const { 
    state, 
    addMeal, 
    deleteMeal, 
    addWorkout, 
    deleteWorkout, 
    saveWeightLog, 
    deleteWeightLog,
    updateHealthProfile 
  } = useLifeOS();
  const { t, locale } = useI18n();
  const today = state.selectedDate || todayISO();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workout' | 'metrics'>('nutrition');

  // Modals
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [isAddWorkoutModalOpen, setIsAddWorkoutModalOpen] = useState(false);
  const [isAddWeightModalOpen, setIsAddWeightModalOpen] = useState(false);

  // Form states: Meal
  const [mealFood, setMealFood] = useState('');
  const [mealCalories, setMealCalories] = useState<number>(400);
  const [mealProtein, setMealProtein] = useState<number>(25);
  const [mealCarbs, setMealCarbs] = useState<number>(45);
  const [mealFat, setMealFat] = useState<number>(12);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');
  const [mealPortion, setMealPortion] = useState('1 porsi');

  // Inline Quick Add Meal
  const [quickMealFood, setQuickMealFood] = useState('');
  const [quickMealCalories, setQuickMealCalories] = useState('450');
  const [quickMealProtein, setQuickMealProtein] = useState('25');
  const [quickMealType, setQuickMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Lunch');

  // Form states: Workout
  const [workoutProgram, setWorkoutProgram] = useState(WORKOUT_PROGRAM_NAMES[0] || 'Lari');
  const [workoutMinutes, setWorkoutMinutes] = useState<number>(45);
  const [workoutCategory, setWorkoutCategory] = useState<'strength' | 'simple'>('strength');
  const [workoutNotes, setWorkoutNotes] = useState('');

  // Form states: Weight
  const [newWeight, setNewWeight] = useState<number>(68);
  const [weightNotes, setWeightNotes] = useState('');

  // Computations
  const getLatestWeight = () => {
    const logs = [...state.weightLogs].sort((a, b) => b.date.localeCompare(a.date));
    return logs[0] || null;
  };

  const latestWeight = getLatestWeight();

  const calculateTdee = () => {
    const w = latestWeight ? Number(latestWeight.weight) : 0;
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
  const totalProtein = dailyMeals.reduce((s, m) => s + Number(m.protein || 0), 0);
  const totalCarbs = dailyMeals.reduce((s, m) => s + Number(m.carbs || 0), 0);
  const totalFat = dailyMeals.reduce((s, m) => s + Number(m.fat || 0), 0);

  const dailyWorkouts = state.workouts.filter((w) => w.date === today);
  const totalWorkoutMins = dailyWorkouts.reduce((s, w) => s + Number(w.minutes || 0), 0);

  const caloriePercent = mealGoalCalories > 0 ? Math.min(100, Math.round((totalCalories / mealGoalCalories) * 100)) : 0;

  // Handlers
  const handleQuickAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMealFood.trim()) return;

    await addMeal({
      date: today,
      type: quickMealType,
      food: quickMealFood.trim(),
      calories: Number(quickMealCalories) || 0,
      protein: Number(quickMealProtein) || 0,
      carbs: 0,
      fat: 0,
      portion: '1 porsi',
      imageUrl: '',
    });

    setQuickMealFood('');
  };

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealFood.trim()) return;

    await addMeal({
      date: today,
      type: mealType,
      food: mealFood.trim(),
      calories: Number(mealCalories) || 0,
      protein: Number(mealProtein) || 0,
      carbs: Number(mealCarbs) || 0,
      fat: Number(mealFat) || 0,
      portion: mealPortion || '1 porsi',
      imageUrl: '',
    });

    setMealFood('');
    setIsAddMealModalOpen(false);
  };

  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await addWorkout({
      date: today,
      program: workoutProgram,
      category: workoutCategory,
      type: workoutProgram,
      minutes: Number(workoutMinutes) || 30,
      notes: workoutNotes,
    });

    setWorkoutNotes('');
    setIsAddWorkoutModalOpen(false);
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    await saveWeightLog(Number(newWeight), weightNotes, today);
    setWeightNotes('');
    setIsAddWeightModalOpen(false);
  };

  return (
    <StaggerGroup className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ═══════════════ Header ═══════════════ */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Icon name="activity" size={17} />
              </span>
              Kesehatan & Vitalitas (Health)
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Pantau nutrisi harian, asupan kalori & makro, aktivitas latihan fisik, dan metrik tubuh.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon="activity"
              onClick={() => setIsAddWeightModalOpen(true)}
              className="text-xs font-medium"
            >
              Catat Berat
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon="dumbbell"
              onClick={() => setIsAddWorkoutModalOpen(true)}
              className="text-xs font-medium"
            >
              Catat Workout
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="plus"
              onClick={() => setIsAddMealModalOpen(true)}
              className="text-xs font-semibold shadow-2xs"
            >
              Catat Makanan
            </Button>
          </div>
        </div>
      </StaggerItem>

      {/* ═══════════════ Top 4-Metric Grid ═══════════════ */}
      <StaggerItem>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <MetricCard
            icon="apple"
            label="Kalori Hari Ini"
            value={`${totalCalories} kcal`}
            detail={`Target: ${mealGoalCalories} kcal (${caloriePercent}%)`}
            glow={caloriePercent >= 90 && caloriePercent <= 110}
          />
          <MetricCard
            icon="activity"
            label="Asupan Protein"
            value={`${totalProtein}g`}
            detail="Protein pembangun massa otot"
          />
          <MetricCard
            icon="dumbbell"
            label="Latihan Fisik"
            value={`${totalWorkoutMins}m`}
            detail={`${dailyWorkouts.length} sesi diselesaikan hari ini`}
            glow={totalWorkoutMins > 0}
          />
          <MetricCard
            icon="heart"
            label="Berat Badan"
            value={latestWeight ? `${latestWeight.weight} kg` : '—'}
            detail={tdee > 0 ? `Estimasi TDEE: ${tdee} kcal` : 'Belum ada data'}
          />
        </div>
      </StaggerItem>

      {/* ═══════════════ Tab Switcher ═══════════════ */}
      <StaggerItem>
        <div className="flex items-center justify-between gap-3 bg-muted/40 p-1.5 rounded-xl border border-border/80">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('nutrition')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === 'nutrition'
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon name="apple" size={13} className={activeTab === 'nutrition' ? "text-primary" : "text-muted-foreground"} />
              Nutrisi & Makanan ({dailyMeals.length})
            </button>
            <button
              onClick={() => setActiveTab('workout')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === 'workout'
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon name="dumbbell" size={13} className={activeTab === 'workout' ? "text-primary" : "text-muted-foreground"} />
              Workout & Latihan ({dailyWorkouts.length})
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === 'metrics'
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon name="activity" size={13} className={activeTab === 'metrics' ? "text-primary" : "text-muted-foreground"} />
              Metrik Tubuh & TDEE
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>{formatDate(today, { locale: locale === 'id' ? 'id-ID' : 'en-US' })}</span>
          </div>
        </div>
      </StaggerItem>

      {/* ═══════════════ TAB 1: NUTRISI & MAKANAN ═══════════════ */}
      {activeTab === 'nutrition' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Meal Log & Inline Add (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Surface className="p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div>
                  <h3 className="text-xs font-semibold text-foreground tracking-tight uppercase flex items-center gap-2">
                    <Icon name="apple" size={14} className="text-primary" />
                    Catatan Makanan Hari Ini
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {dailyMeals.length} item tercatat • {totalCalories} kcal total
                  </p>
                </div>
                <Link href="/health/nutrition">
                  <Button size="sm" variant="ghost" icon="arrowRight" className="text-xs">
                    Analisis Nutrisi
                  </Button>
                </Link>
              </div>

              {/* Inline Fast Add Meal */}
              <form onSubmit={handleQuickAddMeal} className="flex items-center gap-2 bg-muted/20 p-2 rounded-lg border border-border/70 flex-wrap sm:flex-nowrap">
                <input
                  type="text"
                  placeholder="+ Catat makanan..."
                  value={quickMealFood}
                  onChange={(e) => setQuickMealFood(e.target.value)}
                  className="glass-input py-1 text-xs flex-1 bg-background min-w-[120px]"
                />
                <input
                  type="number"
                  placeholder="kcal"
                  value={quickMealCalories}
                  onChange={(e) => setQuickMealCalories(e.target.value)}
                  className="glass-input py-1 px-2 text-xs w-20 font-mono text-center bg-background"
                />
                <input
                  type="number"
                  placeholder="protein (g)"
                  value={quickMealProtein}
                  onChange={(e) => setQuickMealProtein(e.target.value)}
                  className="glass-input py-1 px-2 text-xs w-20 font-mono text-center bg-background"
                />
                <select
                  value={quickMealType}
                  onChange={(e) => setQuickMealType(e.target.value as any)}
                  className="glass-select py-1 text-xs bg-background"
                >
                  {MEAL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <Button type="submit" variant="primary" size="sm" disabled={!quickMealFood.trim()} className="text-xs shrink-0 py-1">
                  Catat
                </Button>
              </form>

              {/* Meal List */}
              <div className="space-y-2 min-h-[220px]">
                {dailyMeals.length > 0 ? (
                  dailyMeals.map((meal, index) => (
                    <motion.div
                      key={meal.id}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                      className="group flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <Badge tone={meal.type === 'Breakfast' ? 'amber' : meal.type === 'Lunch' ? 'teal' : meal.type === 'Dinner' ? 'blue' : 'gray'}>
                          {meal.type}
                        </Badge>
                        <div className="min-w-0">
                          <strong className="text-xs font-medium text-foreground block truncate">{meal.food}</strong>
                          <span className="text-[10px] text-muted-foreground">{meal.portion || '1 porsi'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-bold text-foreground font-mono tabular-nums block">{meal.calories} kcal</span>
                          {meal.protein > 0 && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block">{meal.protein}g protein</span>
                          )}
                        </div>
                        <button
                          onClick={() => deleteMeal(meal.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all rounded"
                          title="Hapus"
                        >
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState
                    title="Belum ada makanan dicatat hari ini"
                    description="Gunakan form di atas untuk mencatat sarapan, makan siang, atau camilan Anda."
                    compact
                  />
                )}
              </div>
            </Surface>
          </div>

          {/* Right: Nutrition Targets & Macros (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Surface className="p-5 md:p-6 space-y-4">
              <div className="border-b border-border/80 pb-3">
                <h3 className="text-xs font-semibold text-foreground tracking-tight uppercase flex items-center gap-2">
                  <Icon name="activity" size={14} className="text-primary" />
                  Target Kalori & Makronutrisi
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Realisasi asupan harian terhadap pagu gizi
                </p>
              </div>

              <div className="space-y-4">
                <ProgressBar
                  value={totalCalories}
                  max={mealGoalCalories}
                  label="Target Kalori Harian"
                  detail={`${totalCalories} / ${mealGoalCalories} kcal (${caloriePercent}%)`}
                />

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60">
                  <div className="bg-muted/40 p-2.5 rounded-lg border border-border/70 text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Protein</span>
                    <strong className="text-sm font-bold text-foreground font-mono mt-0.5 block">{totalProtein}g</strong>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded-lg border border-border/70 text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Carbs</span>
                    <strong className="text-sm font-bold text-foreground font-mono mt-0.5 block">{totalCarbs}g</strong>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded-lg border border-border/70 text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Fat</span>
                    <strong className="text-sm font-bold text-foreground font-mono mt-0.5 block">{totalFat}g</strong>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed">
                  💡 <span className="font-semibold text-foreground">Tips:</span> Pertahankan rasio protein minimal 1.6g per kg berat badan untuk memelihara massa otot selama periode defisit atau maintenance.
                </div>
              </div>
            </Surface>
          </div>
        </div>
      )}

      {/* ═══════════════ TAB 2: WORKOUT & LATIHAN ═══════════════ */}
      {activeTab === 'workout' && (
        <div className="space-y-4">
          <Surface className="p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div>
                <h3 className="text-xs font-semibold text-foreground tracking-tight uppercase flex items-center gap-2">
                  <Icon name="dumbbell" size={14} className="text-primary" />
                  Sesi Latihan Hari Ini ({formatDate(today)})
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {dailyWorkouts.length} sesi • {totalWorkoutMins} menit total
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/health/workout">
                  <Button size="sm" variant="ghost" icon="arrowRight" className="text-xs">
                    Workout Detail & Sets
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="primary"
                  icon="plus"
                  onClick={() => setIsAddWorkoutModalOpen(true)}
                  className="text-xs font-semibold shadow-2xs"
                >
                  Catat Sesi
                </Button>
              </div>
            </div>

            {/* Workouts Grid */}
            {dailyWorkouts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dailyWorkouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Icon name="dumbbell" size={14} />
                          </span>
                          <strong className="text-xs font-bold text-foreground truncate">{workout.program}</strong>
                        </div>
                        <Badge tone="teal" className="text-[10px]">
                          {workout.minutes}m
                        </Badge>
                      </div>

                      {workout.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {workout.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold font-mono">
                        {workout.category}
                      </span>
                      <button
                        onClick={() => deleteWorkout(workout.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                        title="Hapus sesi"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Belum ada sesi latihan hari ini"
                description="Lakukan aktivitas fisik, angkat beban, lari, atau renang lalu catat sesi Anda."
                action={{
                  label: 'Catat Sesi Latihan',
                  onClick: () => setIsAddWorkoutModalOpen(true),
                }}
              />
            )}
          </Surface>
        </div>
      )}

      {/* ═══════════════ TAB 3: METRIK TUBUH & TDEE ═══════════════ */}
      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Weight History (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Surface className="p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div>
                  <h3 className="text-xs font-semibold text-foreground tracking-tight uppercase flex items-center gap-2">
                    <Icon name="activity" size={14} className="text-primary" />
                    Riwayat Berat Badan
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Catatan timbangan berat badan terakhir
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  icon="plus"
                  onClick={() => setIsAddWeightModalOpen(true)}
                  className="text-xs font-semibold shadow-2xs"
                >
                  Timbang Berat
                </Button>
              </div>

              {state.weightLogs.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {[...state.weightLogs]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 8)
                    .map((log) => (
                      <div key={log.id} className="py-2.5 flex items-center justify-between group text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-muted-foreground tabular-nums text-xs font-medium">
                            {formatDate(log.date)}
                          </span>
                          {log.notes && (
                            <span className="text-muted-foreground/80 truncate max-w-xs">• {log.notes}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-foreground font-bold tabular-nums">{log.weight} kg</strong>
                          <button
                            onClick={() => deleteWeightLog(log.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                            title="Hapus"
                          >
                            <Icon name="trash" size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState
                  title="Belum ada riwayat berat badan"
                  description="Catat berat badan Anda untuk melihat tren dan menghitung kebutuhan kalori."
                  action={{
                    label: 'Catat Berat Pertama',
                    onClick: () => setIsAddWeightModalOpen(true),
                  }}
                  compact
                />
              )}
            </Surface>
          </div>

          {/* Right: TDEE & Body Stats (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Surface className="p-5 md:p-6 space-y-4">
              <div className="border-b border-border/80 pb-3">
                <h3 className="text-xs font-semibold text-foreground tracking-tight uppercase flex items-center gap-2">
                  <Icon name="heart" size={14} className="text-primary" />
                  Kalkulator TDEE & Profil
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Estimasi kebutuhan kalori harian (Mifflin-St Jeor)
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/40 p-2.5 rounded-lg border border-border/70">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Tinggi Badan</span>
                    <strong className="block text-sm font-bold text-foreground font-mono mt-0.5">
                      {state.healthProfile.height ? `${state.healthProfile.height} cm` : '—'}
                    </strong>
                  </div>
                  <div className="bg-muted/40 p-2.5 rounded-lg border border-border/70">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Usia</span>
                    <strong className="block text-sm font-bold text-foreground font-mono mt-0.5">
                      {state.healthProfile.age ? `${state.healthProfile.age} th` : '—'}
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Estimasi TDEE Harian:</span>
                    <strong className="text-base font-bold text-foreground font-mono tabular-nums">{tdee} kcal</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Target Kalori Disetel:</span>
                    <strong className="text-sm font-semibold text-primary font-mono tabular-nums">{mealGoalCalories} kcal</strong>
                  </div>
                </div>

                <Link href="/health/metrics">
                  <Button variant="outline" size="sm" icon="edit" className="w-full text-xs mt-1">
                    Ubah Profil & Target Kalori
                  </Button>
                </Link>
              </div>
            </Surface>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: CATAT MAKANAN ═══════════════ */}
      <Dialog open={isAddMealModalOpen} onOpenChange={setIsAddMealModalOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold tracking-tight">Catat Makanan Baru</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleMealSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Makanan</label>
              <input
                type="text"
                required
                placeholder="Contoh: Dada ayam bakar + nasi merah"
                value={mealFood}
                onChange={(e) => setMealFood(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waktu Makan</label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as any)}
                  className="glass-select text-xs w-full"
                >
                  {MEAL_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Porsi</label>
                <input
                  type="text"
                  placeholder="1 porsi / 200g"
                  value={mealPortion}
                  onChange={(e) => setMealPortion(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kalori (kcal)</label>
                <input
                  type="number"
                  required
                  value={mealCalories}
                  onChange={(e) => setMealCalories(Number(e.target.value))}
                  className="glass-input text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Protein (g)</label>
                <input
                  type="number"
                  value={mealProtein}
                  onChange={(e) => setMealProtein(Number(e.target.value))}
                  className="glass-input text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Karbo (g)</label>
                <input
                  type="number"
                  value={mealCarbs}
                  onChange={(e) => setMealCarbs(Number(e.target.value))}
                  className="glass-input text-xs font-mono"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-semibold">
              Simpan Makanan
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MODAL: CATAT WORKOUT ═══════════════ */}
      <Dialog open={isAddWorkoutModalOpen} onOpenChange={setIsAddWorkoutModalOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold tracking-tight">Catat Sesi Latihan</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleWorkoutSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Program / Aktivitas</label>
              <select
                value={workoutProgram}
                onChange={(e) => setWorkoutProgram(e.target.value)}
                className="glass-select text-xs w-full"
              >
                {WORKOUT_PROGRAM_NAMES.map((prog) => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Durasi (Menit)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={workoutMinutes}
                  onChange={(e) => setWorkoutMinutes(Number(e.target.value))}
                  className="glass-input text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kategori</label>
                <select
                  value={workoutCategory}
                  onChange={(e) => setWorkoutCategory(e.target.value as any)}
                  className="glass-select text-xs w-full"
                >
                  <option value="strength">Beban (Strength)</option>
                  <option value="simple">Kardio / Umum</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catatan Sesi</label>
              <textarea
                placeholder="RPE, intensitas, beban tertinggi, atau sensasi otot..."
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                className="glass-input text-xs resize-none h-16"
              />
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-semibold">
              Simpan Sesi Workout
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MODAL: CATAT BERAT BADAN ═══════════════ */}
      <Dialog open={isAddWeightModalOpen} onOpenChange={setIsAddWeightModalOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold tracking-tight">Catat Timbangan Berat Badan</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleWeightSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Berat Badan (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                value={newWeight}
                onChange={(e) => setNewWeight(Number(e.target.value))}
                className="glass-input text-xs font-mono font-bold text-base"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catatan / Kondisi (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: Pagi hari sebelum sarapan"
                value={weightNotes}
                onChange={(e) => setWeightNotes(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-semibold">
              Simpan Timbangan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </StaggerGroup>
  );
}
