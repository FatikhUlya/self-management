'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '@/components/ui/Icon';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { QuickNavGrid } from '@/components/ui/QuickNavGrid';
import { Surface } from '@/components/ui/Surface';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { todayISO, addDays, percent } from '@/lib/utils';
import { ACTIVITY_LEVELS, HABIT_AREAS } from '@/lib/constants';

export default function HealthAndHabitsHub() {
 const { state, toggleHabit, addHabit } = useLifeOS();
 const { t, locale } = useI18n();
 const today = state.selectedDate || todayISO();

 const [activeTab, setActiveTab] = useState<'health' | 'habits'>('health');

 // === Health Logic ===
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

 // === Habits Logic ===
 const [isFormOpen, setIsFormOpen] = useState(false);
 const [habitName, setHabitName] = useState('');
 const [habitArea, setHabitArea] = useState<string>(HABIT_AREAS[0]);
 const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekly'>('daily');
 const [habitTarget, setHabitTarget] = useState<number>(5);
 const [habitGoalId, setHabitGoalId] = useState<string>('');

 const getCompletionPercent = (date: string) => {
 if (!state.habits.length) return 0;
 const done = state.habits.filter((h) => 
 state.habitLogs.some((log) => log.habitId === h.id && log.date === date)
 ).length;
 return percent(done, state.habits.length);
 };

 const getHabitStreak = (habitId: string, fromDate = today) => {
 let streak = 0;
 let cursor = fromDate;
 const isDone = (hId: string, d: string) =>
 state.habitLogs.some((l) => l.habitId === hId && l.date === d);

 while (isDone(habitId, cursor)) {
 streak += 1;
 cursor = addDays(cursor, -1);
 }
 return streak;
 };

 const todayScore = getCompletionPercent(today);
 const doneToday = state.habits.filter((h) => state.habitLogs.some(l => l.habitId === h.id && l.date === today)).length;
 
 const handleHabitSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!habitName.trim()) return;

 await addHabit({
 name: habitName,
 area: habitArea,
 frequency: habitFrequency,
 targetPerWeek: habitTarget,
 goalId: habitGoalId || undefined,
 });

 setHabitName('');
 setHabitGoalId('');
 setIsFormOpen(false);
 };

 return (
 <div className="space-y-6 max-w-5xl mx-auto pb-24">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-rose-600 dark:from-red-300 dark:to-rose-500 flex items-center gap-2">
 <Icon name="activity" size={28} className="text-red-500" />
 Health & Wellness
 </h1>
 <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
 Pantau kebugaran, nutrisi, dan rutinitas habit Anda.
 </p>
 </div>
 </div>

 {/* Tabs Switcher */}
 <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-border w-full md:w-auto self-start">
 <button
 onClick={() => setActiveTab('health')}
 className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
 activeTab === 'health' 
 ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm border border-black/5' 
 : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 Kebugaran & Nutrisi
 </button>
 <button
 onClick={() => setActiveTab('habits')}
 className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
 activeTab === 'habits' 
 ? 'bg-white dark:bg-zinc-800 text-cyan-500 shadow-sm border border-black/5' 
 : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 Habits & Rutinitas
 </button>
 </div>

 {activeTab === 'health' && (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
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
 
 
 label={t('health_weight_log')}
 value={latestWeight ? `${latestWeight.weight} kg` : '—'}
 detail={latestWeight ? `TDEE: ${tdee > 0 ? tdee : '—'} kcal` : t('health_no_weight')}
 />
 <DashboardCard
 icon="apple"
 
 
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
 
 
 label={t('health_workout_log')}
 value={`${totalWorkoutMins} m`}
 detail={`${dailyWorkouts.length} ${t('health_logs_saved')} ${locale === 'id' ? 'hari ini' : 'today'}`}
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-5 rounded-xl bg-muted/20 border border-border">
 <h4 className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-3">Latihan Hari Ini</h4>
 {dailyWorkouts.length > 0 ? (
 <div className="space-y-2">
 {dailyWorkouts.map((w) => (
 <div key={w.id} className="flex justify-between items-center p-2 rounded bg-muted/30">
 <span className="text-xs font-bold text-foreground">{w.program}</span>
 <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{w.minutes}m</span>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-xs text-muted-foreground italic">Belum ada latihan hari ini.</p>
 )}
 </div>

 <div className="p-5 rounded-xl bg-muted/20 border border-border">
 <h4 className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider mb-3">Makanan Hari Ini</h4>
 {dailyMeals.length > 0 ? (
 <div className="space-y-2">
 {dailyMeals.slice(0, 3).map((m) => (
 <div key={m.id} className="flex justify-between items-center p-2 rounded bg-muted/30">
 <span className="text-xs font-bold text-foreground truncate mr-2">{m.type}: {m.food}</span>
 <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded shrink-0">{m.calories} kcal</span>
 </div>
 ))}
 {dailyMeals.length > 3 && (
 <p className="text-[10px] text-center text-muted-foreground pt-1">+{dailyMeals.length - 3} lainnya</p>
 )}
 </div>
 ) : (
 <p className="text-xs text-muted-foreground italic">Belum ada makanan dicatat hari ini.</p>
 )}
 </div>
 </div>
 </div>
 )}

 {activeTab === 'habits' && (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
 {/* Sub-page Navigation Grid */}
 <QuickNavGrid 
 items={[
 { label: 'Kalender', icon: 'calendar', iconColor: 'text-cyan-500', href: '/habits/calendar' },
 { label: 'Analisis', icon: 'barChart', iconColor: 'text-blue-500', href: '/habits/analytics' },
 { label: 'Kelola', icon: 'list', iconColor: 'text-indigo-500', href: '/habits/manage' }
 ]} 
 />

 {/* Key Metrics Dashboard */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <DashboardCard
 icon="checkCircle"
 
 
 label="Skor Hari Ini"
 value={`${todayScore}%`}
 detail={`${doneToday} dari ${state.habits.length} kebiasaan selesai`}
 >
 <div className="w-full bg-black/10 dark:bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
 <div 
 className="bg-cyan-500 h-full rounded-full transition-all" 
 style={{ width: `${todayScore}%` }}
 />
 </div>
 </DashboardCard>
 
 <DashboardCard
 icon="activity"
 
 
 label="Total Kebiasaan"
 value={state.habits.length}
 detail="Aktif dilacak saat ini"
 />
 </div>

 {/* Today's Checklist */}
 <Surface className="p-6">
 <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
 <div>
 <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
 {t('habits_checklist')} Hari Ini
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 Ceklis rutinitas harian Anda
 </p>
 </div>
 <Button 
 variant="secondary" 
 size="sm" 
 icon="plus" 
 onClick={() => setIsFormOpen(true)}
 >
 {t('habits_add_new')}
 </Button>
 </div>

 <div className="space-y-2">
 {state.habits.length > 0 ? (
 state.habits.map((habit) => {
 const isDone = state.habitLogs.some(
 (log) => log.habitId === habit.id && log.date === today
 );

 return (
 <div
 key={habit.id}
 onClick={() => toggleHabit(habit.id, today)}
 className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all duration-150 ${
 isDone
 ? 'bg-primary/10/10 border-primary/25/30 text-teal-300'
 : 'bg-muted/20 border-border hover:border-border-strong text-muted-foreground'
 }`}
 >
 <div>
 <strong className="text-sm font-bold block">{habit.name}</strong>
 <div className="flex items-center gap-2 mt-0.5">
 <p className="text-[10px] text-muted-foreground font-bold uppercase">
 Streak: {getHabitStreak(habit.id, today)} {t('days')}
 </p>
 {habit.goalId && (() => {
 const goal = state.goals.find(g => g.id === habit.goalId);
 return goal ? (
 <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
 🎯 {goal.title.slice(0, 20)}{goal.title.length > 20 ? '…' : ''}
 </span>
 ) : null;
 })()}
 </div>
 </div>

 <span className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
 isDone ? 'bg-primary border-primary text-white' : 'border-border text-transparent'
 }`}>
 <Icon name="check" size={12} />
 </span>
 </div>
 );
 })
 ) : (
 <EmptyState />
 )}
 </div>
 </Surface>

 {/* Form modal */}
 <Modal
 isOpen={isFormOpen}
 onClose={() => setIsFormOpen(false)}
 title={t('habits_new')}
 subtitle="Masukkan detail habit baru"
 >
 <form onSubmit={handleHabitSubmit} className="space-y-4">
 <div className="flex flex-col space-y-1">
 <label htmlFor="hName" className="text-xs font-bold text-muted-foreground uppercase">
 {t('habits_name')}
 </label>
 <input
 id="hName"
 type="text"
 required
 placeholder={t('habits_name_placeholder')}
 value={habitName}
 onChange={(e) => setHabitName(e.target.value)}
 className="glass-input text-sm"
 />
 </div>

 <div className="grid grid-cols-3 gap-3">
 <div className="flex flex-col space-y-1">
 <label htmlFor="hArea" className="text-xs font-bold text-muted-foreground uppercase">
 {t('area')}
 </label>
 <select
 id="hArea"
 value={habitArea}
 onChange={(e) => setHabitArea(e.target.value)}
 className="glass-select text-xs"
 >
 {HABIT_AREAS.map((a) => (
 <option key={a} value={a}>
 {a}
 </option>
 ))}
 </select>
 </div>

 <div className="flex flex-col space-y-1">
 <label htmlFor="hFreq" className="text-xs font-bold text-muted-foreground uppercase">
 {t('habits_frequency')}
 </label>
 <select
 id="hFreq"
 value={habitFrequency}
 onChange={(e) => setHabitFrequency(e.target.value as any)}
 className="glass-select text-xs"
 >
 <option value="daily">{t('habits_daily')}</option>
 <option value="weekly">{t('habits_weekly')}</option>
 </select>
 </div>

 <div className="flex flex-col space-y-1">
 <label htmlFor="hTarget" className="text-xs font-bold text-muted-foreground uppercase">
 Target/minggu
 </label>
 <input
 id="hTarget"
 type="number"
 min="1"
 max="7"
 required
 value={habitTarget}
 onChange={(e) => setHabitTarget(Number(e.target.value))}
 className="glass-input text-xs"
 />
 </div>
 </div>

 {/* Goal Linking */}
 <div className="flex flex-col space-y-1">
 <label htmlFor="hGoal" className="text-xs font-bold text-muted-foreground uppercase">
 🎯 Link ke Goal (opsional)
 </label>
 <select
 id="hGoal"
 value={habitGoalId}
 onChange={(e) => setHabitGoalId(e.target.value)}
 className="glass-select text-xs"
 >
 <option value="">— Tanpa Goal —</option>
 {state.goals.filter(g => Number(g.progress) < 100).map(g => (
 <option key={g.id} value={g.id}>{g.title}</option>
 ))}
 </select>
 <p className="text-[10px] text-muted-foreground">Habit ini akan berkontribusi pada progress goal yang dipilih</p>
 </div>

 <Button type="submit" variant="primary" icon="plus" className="w-full">
 {t('habits_add_new')}
 </Button>
 </form>
 </Modal>
 </div>
 )}
 </div>
 );
}
