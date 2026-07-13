'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LineChart } from '@/components/ui/LineChart';
import { Modal } from '@/components/ui/Modal';
import { 
  formatDate, 
  monthDays, 
  percent, 
  parseDecimalInput
} from '@/lib/utils';
import { 
  ACTIVITY_LEVELS, 
  ActivityLevelId, 
  workoutPrograms, 
  workoutProgramNames, 
  strengthPrograms, 
  allWorkoutExercises, 
  MEAL_TYPES 
} from '@/lib/constants';

interface ActiveSet {
  weight: string;
  reps: string;
  setType: 'N' | 'W' | 'D' | 'F';
  isDone: boolean;
}

interface ActiveExercise {
  name: string;
  sets: ActiveSet[];
}

interface ActiveWorkout {
  title: string;
  startTime: string;
  notes: string;
  exercises: ActiveExercise[];
}

export default function HealthPage() {
  const { 
    state, 
    updateHealthProfile, 
    saveWeightLog, 
    deleteWeightLog, 
    addMeal, 
    deleteMeal, 
    addWorkout, 
    deleteWorkout 
  } = useLifeOS();

  const { t, locale } = useI18n();

  // Profile forms
  const [height, setHeight] = useState<number | ''>(state.healthProfile.height);
  const [age, setAge] = useState<number | ''>(state.healthProfile.age);
  const [activityLevel, setActivityLevel] = useState<ActivityLevelId>(
    state.healthProfile.activityLevel as ActivityLevelId || 'moderate'
  );
  const [mealGoal, setMealGoal] = useState<number | ''>(state.healthProfile.mealGoalCalories);

  // Weight form
  const [weightValue, setWeightValue] = useLocalStorageState<string>('draft_health_weightValue', '');
  const [weightNotes, setWeightNotes] = useLocalStorageState<string>('draft_health_weightNotes', '');

  // Meal form
  const [mealType, setMealType] = useLocalStorageState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('draft_health_mealType', 'Breakfast');
  const [mealFood, setMealFood] = useLocalStorageState('draft_health_mealFood', '');
  const [mealProtein, setMealProtein] = useLocalStorageState<number>('draft_health_mealProtein', 0);
  const [mealCalories, setMealCalories] = useLocalStorageState<number>('draft_health_mealCalories', 0);

  // Active workout states (Hevy-style)
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [durationString, setDurationString] = useState('00:00');
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');

  // Quick Cardio states
  const [quickCardioType, setQuickCardioType] = useState('Lari');
  const [quickCardioMins, setQuickCardioMins] = useState('30');

  // Rest Timer states
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isRestTimerActive, setIsRestTimerActive] = useState(false);

  // Selected date helpers
  const today = state.selectedDate;
  const dailyMeals = state.meals.filter((m) => m.date === today);
  const dailyWorkouts = state.workouts.filter((w) => w.date === today);

  // Restore active workout session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lifeos_active_workout');
    if (saved) {
      try {
        setActiveWorkout(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse active workout session', e);
      }
    }
  }, []);

  // Persist active workout session to localStorage when it changes
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('lifeos_active_workout', JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem('lifeos_active_workout');
    }
  }, [activeWorkout]);

  // Live timer for active workout duration
  useEffect(() => {
    if (!activeWorkout) return;
    const interval = setInterval(() => {
      const start = new Date(activeWorkout.startTime).getTime();
      const now = new Date().getTime();
      const diffMs = Math.max(0, now - start);
      const totalSecs = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      
      const pad = (n: number) => String(n).padStart(2, '0');
      if (hrs > 0) {
        setDurationString(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
      } else {
        setDurationString(`${pad(mins)}:${pad(secs)}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Interval hook for active Rest Timer
  useEffect(() => {
    if (!isRestTimerActive || restSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRestTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRestTimerActive, restSecondsLeft]);

  // History selector
  const [historyExercise, setHistoryExercise] = useState<string>(allWorkoutExercises[0]);

  const getLatestWeight = () => {
    const logs = [...state.weightLogs].sort((a, b) => b.date.localeCompare(a.date));
    return logs[0] || null;
  };

  const calculateTdee = () => {
    const latest = getLatestWeight();
    const w = latest ? Number(latest.weight) : 0;
    const h = Number(height || state.healthProfile.height || 0);
    const a = Number(age || state.healthProfile.age || 0);
    const activity = ACTIVITY_LEVELS.find((l) => l.id === activityLevel) || ACTIVITY_LEVELS[2];
    if (!w || !h || !a) return 0;
    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    return Math.round(bmr * activity.factor);
  };

  const tdee = calculateTdee();
  const mealGoalCalories = Number(mealGoal || state.healthProfile.mealGoalCalories || tdee || 2000);
  const totalCalories = dailyMeals.reduce((s, m) => s + Number(m.calories || 0), 0);
  const totalProtein = dailyMeals.reduce((s, m) => s + Number(m.protein || 0), 0);
  const totalWorkoutMins = dailyWorkouts.reduce((s, w) => s + Number(w.minutes || 0), 0);

  // Profile Form Handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateHealthProfile({
      height: height === '' ? '' : Number(height),
      age: age === '' ? '' : Number(age),
      activityLevel,
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

  // Quick Cardio Form Handler
  const handleQuickCardioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(quickCardioMins) || 30;
    await addWorkout({
      date: today,
      type: quickCardioType,
      program: quickCardioType,
      category: 'simple',
      activity: quickCardioType,
      minutes: mins,
      notes: 'Pencatatan cepat aktivitas cardio.'
    });
    setQuickCardioMins('30');
    alert('Cardio berhasil dicatat!');
  };

  // Hevy active session helpers
  const handleAddExerciseToWorkout = (exName: string) => {
    if (!activeWorkout) return;
    const newEx: ActiveExercise = {
      name: exName,
      sets: [{ weight: '0', reps: '0', setType: 'N', isDone: false }]
    };
    setActiveWorkout({
      ...activeWorkout,
      exercises: [...activeWorkout.exercises, newEx]
    });
    setIsAddExerciseModalOpen(false);
  };

  const deleteActiveExercise = (exIdx: number) => {
    if (!activeWorkout) return;
    setActiveWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.filter((_, idx) => idx !== exIdx)
    });
  };

  const cycleSetType = (exIdx: number, setIdx: number) => {
    if (!activeWorkout) return;
    const types: ('N' | 'W' | 'D' | 'F')[] = ['N', 'W', 'D', 'F'];
    const current = activeWorkout.exercises[exIdx].sets[setIdx].setType || 'N';
    const nextIdx = (types.indexOf(current) + 1) % types.length;
    const nextType = types[nextIdx];

    const updated = activeWorkout.exercises.map((ex, eI) => {
      if (eI !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, sI) => (sI === setIdx ? { ...s, setType: nextType } : s))
      };
    });
    setActiveWorkout({ ...activeWorkout, exercises: updated });
  };

  const updateActiveSetVal = (exIdx: number, setIdx: number, field: 'weight' | 'reps', val: string) => {
    if (!activeWorkout) return;
    const updated = activeWorkout.exercises.map((ex, eI) => {
      if (eI !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, sI) => (sI === setIdx ? { ...s, [field]: val } : s))
      };
    });
    setActiveWorkout({ ...activeWorkout, exercises: updated });
  };

  const toggleActiveSetDone = (exIdx: number, setIdx: number) => {
    if (!activeWorkout) return;
    const currentStatus = activeWorkout.exercises[exIdx].sets[setIdx].isDone;
    const nextStatus = !currentStatus;

    const updated = activeWorkout.exercises.map((ex, eI) => {
      if (eI !== exIdx) return ex;
      return {
        ...ex,
        sets: ex.sets.map((s, sI) => (sI === setIdx ? { ...s, isDone: nextStatus } : s))
      };
    });
    setActiveWorkout({ ...activeWorkout, exercises: updated });

    if (nextStatus) {
      setRestSecondsLeft(90);
      setIsRestTimerActive(true);
    }
  };

  const addActiveSet = (exIdx: number) => {
    if (!activeWorkout) return;
    const lastSet = activeWorkout.exercises[exIdx].sets[activeWorkout.exercises[exIdx].sets.length - 1];
    const newSet: ActiveSet = {
      weight: lastSet ? lastSet.weight : '0',
      reps: lastSet ? lastSet.reps : '0',
      setType: 'N',
      isDone: false
    };
    const updated = activeWorkout.exercises.map((ex, eI) => {
      if (eI !== exIdx) return ex;
      return { ...ex, sets: [...ex.sets, newSet] };
    });
    setActiveWorkout({ ...activeWorkout, exercises: updated });
  };

  const deleteActiveSet = (exIdx: number, setIdx: number) => {
    if (!activeWorkout) return;
    const updated = activeWorkout.exercises.map((ex, eI) => {
      if (eI !== exIdx) return ex;
      const filtered = ex.sets.filter((_, sI) => sI !== setIdx);
      return {
        ...ex,
        sets: filtered.length > 0 ? filtered : [{ weight: '0', reps: '0', setType: 'N' as const, isDone: false }]
      };
    });
    setActiveWorkout({ ...activeWorkout, exercises: updated });
  };

  // Find previous set performance for guidance
  const getPreviousPerformance = (exName: string, setIdx: number) => {
    const completedWorkouts = state.workouts
      .filter((w) => w.category === 'strength')
      .sort((a, b) => b.date.localeCompare(a.date));

    for (const w of completedWorkouts) {
      const ex = w.exercises?.find((e) => e.name === exName);
      if (ex && ex.sets && ex.sets[setIdx]) {
        const s = ex.sets[setIdx];
        const typeStr = s.setType && s.setType !== 'N' ? ` (${s.setType})` : '';
        return `${s.weight}kg x ${s.reps}${typeStr}`;
      }
    }
    return '—';
  };

  // Finish session and save to DB
  const handleFinishActiveWorkout = async () => {
    if (!activeWorkout) return;

    const start = new Date(activeWorkout.startTime).getTime();
    const now = new Date().getTime();
    const diffMins = Math.max(1, Math.round((now - start) / 60000));

    const formattedExercises = activeWorkout.exercises.map((ex) => {
      const sets = ex.sets
        .map((s) => ({
          weight: parseDecimalInput(s.weight),
          reps: parseInt(s.reps) || 0,
          setType: s.setType
        }))
        .filter((s) => s.weight > 0 || s.reps > 0);
      return { name: ex.name, sets };
    }).filter((ex) => ex.sets.length > 0);

    if (formattedExercises.length === 0) {
      alert('Tidak ada set latihan valid yang disimpan! Pastikan berat & reps bernilai di atas 0.');
      return;
    }

    await addWorkout({
      date: today,
      type: activeWorkout.title,
      program: activeWorkout.title,
      category: 'strength',
      minutes: diffMins,
      notes: activeWorkout.notes || 'Latihan kekuatan dicatat.',
      exercises: formattedExercises
    });

    setActiveWorkout(null);
    setIsRestTimerActive(false);
    setRestSecondsLeft(0);
    alert('Latihan berhasil disimpan! Kerja bagus! 💪');
  };

  const formatRestTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
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

  const loggedWeights = state.weightLogs.filter((w) => daysInMonth.includes(w.date));
  const latestWeight = getLatestWeight();

  // Exercise history records
  const exerciseRows = state.workouts
    .filter((w) => w.category === 'strength')
    .sort((a, b) => b.date.localeCompare(a.date))
    .flatMap((w) => {
      const ex = w.exercises?.find((e) => e.name === historyExercise);
      if (!ex) return [];
      return ex.sets.map((set, setIdx) => ({
        date: w.date,
        program: w.program,
        setIndex: setIdx + 1,
        weight: set.weight,
        reps: set.reps,
        setType: set.setType || 'N',
      }));
    });

  return (
    <div className="space-y-6">
      {/* Profile & Weight Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile (TDEE) */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('health_tdee_profile')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {tdee > 0 ? `${tdee} ${t('health_tdee_estimate')}` : t('health_tdee_incomplete')}
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('health_height')}
                </label>
                <input
                  type="number"
                  placeholder="170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('health_age')}
                </label>
                <input
                  type="number"
                  placeholder="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
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
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('health_meal_goal')}
                </label>
                <input
                  type="number"
                  placeholder={t('health_auto_tdee')}
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

        {/* Weight Log */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('health_weight_log')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {latestWeight ? `${latestWeight.weight} kg (${formatDate(latestWeight.date)})` : t('health_no_weight')}
            </p>
          </div>

          <form onSubmit={handleWeightSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1 col-span-2 sm:col-span-1">
                <label className="text-xs font-bold text-life-muted uppercase">
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
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('notes')}
                </label>
                <input
                  type="text"
                  placeholder="Kondisi..."
                  value={weightNotes}
                  onChange={(e) => setWeightNotes(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full">
              {t('health_save_weight')}
            </Button>
          </form>
        </Surface>
      </div>

      {/* Meal & Workouts Logs Inputs */}
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
                  {t('health_type')}
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

        {/* Workout Log (Hevy-style Active Session) */}
        {!activeWorkout ? (
          <Surface className="p-6">
            <div className="border-b border-life-line pb-3 mb-6">
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {t('health_workout_log')}
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                {totalWorkoutMins} {t('health_workout_minutes')} {formatDate(today, { short: true })}
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => {
                  setActiveWorkout({
                    title: 'Latihan Mandiri',
                    startTime: new Date().toISOString(),
                    notes: '',
                    exercises: []
                  });
                }}
                variant="primary"
                icon="plus"
                className="w-full font-bold"
              >
                Mulai Latihan Kosong
              </Button>

              <div className="border-t border-life-line pt-4 space-y-3">
                <span className="text-[10px] text-life-muted font-black uppercase tracking-wider block">Mulai Rutinitas Program</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {STRENGTH_PROGRAMS.map((progName) => (
                    <button
                      key={progName}
                      onClick={() => {
                        const initialExercises = workoutPrograms[progName].map(name => ({
                          name,
                          sets: [
                            { weight: '0', reps: '0', setType: 'N' as const, isDone: false },
                            { weight: '0', reps: '0', setType: 'N' as const, isDone: false },
                            { weight: '0', reps: '0', setType: 'N' as const, isDone: false },
                          ]
                        }));
                        setActiveWorkout({
                          title: progName,
                          startTime: new Date().toISOString(),
                          notes: '',
                          exercises: initialExercises
                        });
                      }}
                      className="p-3 text-left rounded-xl border border-life-line bg-white/[0.01] hover:bg-white/[0.04] transition-all hover:border-life-line-strong text-xs font-bold space-y-1"
                    >
                      <span className="text-life-text block uppercase tracking-tight">{progName}</span>
                      <span className="text-[9px] text-life-muted font-bold block">{workoutPrograms[progName].length} Gerakan</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Cardio Quick Log form */}
              <div className="border-t border-life-line pt-4">
                <span className="text-[10px] text-life-muted font-black uppercase tracking-wider block mb-3">Log Cepat Cardio / Aktivitas Lain</span>
                <form onSubmit={handleQuickCardioSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={quickCardioType}
                    onChange={(e) => setQuickCardioType(e.target.value)}
                    className="glass-select text-xs py-2 px-3"
                  >
                    <option value="Lari">🏃 Lari</option>
                    <option value="Renang">🏊 Renang</option>
                    <option value="Cardio">🚴 Cardio</option>
                    <option value="Other">💪 Lainnya</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Menit"
                    required
                    value={quickCardioMins}
                    onChange={(e) => setQuickCardioMins(e.target.value)}
                    className="glass-input text-xs"
                  />
                  <Button type="submit" variant="secondary" icon="plus" size="sm">
                    Log Cepat
                  </Button>
                </form>
              </div>
            </div>
          </Surface>
        ) : (
          <Surface className="p-6 space-y-4">
            {/* Active Workout Session Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-life-line pb-4 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <input
                    type="text"
                    value={activeWorkout.title}
                    onChange={(e) => setActiveWorkout({ ...activeWorkout, title: e.target.value })}
                    className="bg-transparent border-none p-0 outline-none text-sm font-black text-life-text uppercase tracking-tight focus:ring-0 w-44"
                    placeholder="Nama Latihan"
                  />
                </div>
                <p className="text-[10px] text-life-muted font-black uppercase tracking-wider mt-1 flex items-center gap-1.5">
                  <Icon name="calendar" size={10} />
                  <span>Durasi: {durationString}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin membatalkan latihan ini? Semua progres latihan aktif akan hilang.')) {
                      setActiveWorkout(null);
                      setIsRestTimerActive(false);
                      setRestSecondsLeft(0);
                    }
                  }}
                  variant="secondary"
                  size="sm"
                  className="text-life-rose hover:bg-life-rose/10 hover:border-life-rose/30"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleFinishActiveWorkout}
                  variant="primary"
                  size="sm"
                  icon="check"
                >
                  Selesai
                </Button>
              </div>
            </div>

            {/* Active Rest Timer Bar */}
            {isRestTimerActive && restSecondsLeft > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-life-teal-soft/10 border border-life-teal/30 text-xs">
                <div className="flex items-center gap-2 font-bold text-teal-400">
                  <Icon name="zap" size={14} className="animate-bounce" />
                  <span>Rest Timer: {formatRestTime(restSecondsLeft)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRestSecondsLeft(prev => prev + 15)}
                    className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[9px] font-bold text-life-text border border-life-line"
                  >
                    +15s
                  </button>
                  <button
                    onClick={() => setRestSecondsLeft(prev => Math.max(0, prev - 15))}
                    className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[9px] font-bold text-life-text border border-life-line"
                  >
                    -15s
                  </button>
                  <button
                    onClick={() => {
                      setIsRestTimerActive(false);
                      setRestSecondsLeft(0);
                    }}
                    className="px-2 py-0.5 rounded bg-life-rose-soft/20 border border-life-rose/30 text-[9px] font-bold text-rose-300"
                  >
                    Lewati
                  </button>
                </div>
              </div>
            )}

            {/* Active Session Notes */}
            <div className="flex flex-col space-y-1">
              <textarea
                value={activeWorkout.notes}
                onChange={(e) => setActiveWorkout({ ...activeWorkout, notes: e.target.value })}
                placeholder="Catatan latihan umum (kondisi fisik, cuaca, dll)..."
                className="glass-input text-xs h-12 resize-none py-1.5 leading-relaxed"
              />
            </div>

            {/* Active Exercises List */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {activeWorkout.exercises.length > 0 ? (
                activeWorkout.exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="p-3.5 bg-white/[0.01] border border-life-line rounded-xl space-y-3 relative group">
                    <div className="flex justify-between items-center">
                      <strong className="text-xs text-life-text font-black uppercase tracking-tight">{ex.name}</strong>
                      <button
                        onClick={() => deleteActiveExercise(exIdx)}
                        className="text-life-muted hover:text-life-rose p-1 transition-colors"
                        title="Hapus Latihan"
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>

                    {/* Sets List Table */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 text-[9px] font-black text-life-muted uppercase tracking-wider text-center border-b border-white/5 pb-1 select-none">
                        <span>SET</span>
                        <span>PREVIOUS</span>
                        <span>KG</span>
                        <span>REPS</span>
                        <span>DONE</span>
                      </div>

                      {ex.sets.map((set, setIdx) => (
                        <div 
                          key={setIdx} 
                          className={`grid grid-cols-5 items-center gap-1.5 p-1 rounded-lg border text-center transition-all ${
                            set.isDone 
                              ? 'bg-life-teal-soft/10 border-life-teal/30 text-teal-200 font-bold' 
                              : 'bg-white/[0.005] border-white/5 text-life-text'
                          }`}
                        >
                          {/* Set Type / Number Button */}
                          <div>
                            <button
                              type="button"
                              onClick={() => cycleSetType(exIdx, setIdx)}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black mx-auto transition-all ${
                                set.setType === 'W' 
                                  ? 'bg-amber-500 text-white' 
                                  : set.setType === 'D' 
                                  ? 'bg-indigo-500 text-white' 
                                  : set.setType === 'F' 
                                  ? 'bg-rose-500 text-white' 
                                  : 'bg-white/[0.04] text-life-muted hover:bg-white/[0.08]'
                              }`}
                              title="Klik untuk mengubah tipe set (Normal, Warmup, Drop, Failure)"
                            >
                              {set.setType === 'N' ? setIdx + 1 : set.setType}
                            </button>
                          </div>

                          {/* Previous performance Column */}
                          <div className="text-[10px] font-bold text-life-muted tracking-tight truncate">
                            {getPreviousPerformance(ex.name, setIdx)}
                          </div>

                          {/* Weight input */}
                          <div>
                            <input
                              type="text"
                              value={set.weight}
                              onChange={(e) => updateActiveSetVal(exIdx, setIdx, 'weight', e.target.value)}
                              disabled={set.isDone}
                              placeholder="0"
                              className="bg-transparent border-none p-0 outline-none text-[11px] font-extrabold text-center w-full focus:ring-0 disabled:opacity-50"
                            />
                          </div>

                          {/* Reps input */}
                          <div>
                            <input
                              type="text"
                              value={set.reps}
                              onChange={(e) => updateActiveSetVal(exIdx, setIdx, 'reps', e.target.value)}
                              disabled={set.isDone}
                              placeholder="0"
                              className="bg-transparent border-none p-0 outline-none text-[11px] font-extrabold text-center w-full focus:ring-0 disabled:opacity-50"
                            />
                          </div>

                          {/* Done Checkmark button */}
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => toggleActiveSetDone(exIdx, setIdx)}
                              className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                set.isDone 
                                  ? 'bg-life-teal border-life-teal text-white shadow-[0_0_8px_rgba(15,118,110,0.5)]' 
                                  : 'bg-black/30 border-white/10 text-transparent hover:border-life-line-strong'
                              }`}
                            >
                              <Icon name="check" size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => deleteActiveSet(exIdx, ex.sets.length - 1)}
                        className="text-[10px] font-black uppercase text-life-rose hover:underline"
                      >
                        Hapus Set
                      </button>
                      <button
                        type="button"
                        onClick={() => addActiveSet(exIdx)}
                        className="text-[10px] font-black uppercase text-life-teal hover:underline"
                      >
                        Tambah Set
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-life-muted italic py-6 text-center">Belum ada gerakan latihan. Klik tombol di bawah.</p>
              )}
            </div>

            {/* Add Exercise Trigger Button */}
            <Button
              onClick={() => {
                setIsAddExerciseModalOpen(true);
                setExerciseSearchQuery('');
              }}
              variant="secondary"
              icon="plus"
              className="w-full text-xs font-bold"
            >
              Tambah Gerakan Latihan
            </Button>
          </Surface>
        )}
      </div>

      {/* Weight History Line Chart */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-6">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('health_weight_monthly')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
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
                className="p-3 rounded-lg bg-white/[0.005] border border-life-line flex items-center justify-between gap-4"
              >
                <div>
                  <strong className="text-xs text-life-text block">{log.weight} kg</strong>
                  <span className="text-[10px] text-life-muted font-bold">{formatDate(log.date)} • {log.notes || 'No notes'}</span>
                </div>
                <button
                  onClick={() => deleteWeightLog(log.id)}
                  className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all"
                  title={t('delete')}
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState message="Belum ada catatan berat badan bulan ini." />
            </div>
          )}
        </div>
      </Surface>

      {/* Daily Logs List (Meals / Workouts today) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Workouts History Today (Updated list styling) */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('health_workouts_today')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {dailyWorkouts.length} {t('health_logs_saved')}
            </p>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {dailyWorkouts.length > 0 ? (
              dailyWorkouts.map((w) => (
                <div 
                  key={w.id} 
                  className="p-4 rounded-xl bg-white/[0.005] border border-life-line flex flex-col gap-2 relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-xs text-life-text block font-bold">{w.program}</strong>
                      <span className="text-[10px] text-life-muted font-bold block mt-0.5">
                        {w.category === 'strength' ? 'Latihan Kekuatan' : w.activity} • {w.minutes}m
                      </span>
                    </div>
                    <button
                      onClick={() => deleteWorkout(w.id)}
                      className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all shrink-0"
                      title={t('delete')}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>

                  {w.notes && (
                    <p className="text-[10px] text-life-muted italic leading-relaxed">
                      &ldquo;{w.notes}&rdquo;
                    </p>
                  )}

                  {w.category === 'strength' && w.exercises && w.exercises.length > 0 && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-white/5">
                      {w.exercises.map((e, eIdx) => (
                        <div key={eIdx} className="text-xs space-y-1">
                          <span className="font-extrabold text-[10px] text-teal-400 block uppercase tracking-wider">{e.name}</span>
                          <div className="flex flex-wrap gap-1.5 pl-2">
                            {e.sets.map((s, sIdx) => {
                              const typeStr = s.setType && s.setType !== 'N' ? s.setType : '';
                              return (
                                <span 
                                  key={sIdx} 
                                  className="inline-flex items-center gap-1.5 text-[9px] font-black tracking-normal bg-white/[0.03] border border-life-line px-1.5 py-0.5 rounded text-life-text"
                                >
                                  {typeStr && (
                                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] text-white shrink-0 font-black ${
                                      s.setType === 'W' ? 'bg-amber-500' : s.setType === 'D' ? 'bg-indigo-500' : 'bg-rose-500'
                                    }`}>
                                      {typeStr}
                                    </span>
                                  )}
                                  <span>{s.weight}kg x {s.reps}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </Surface>
      </div>

      {/* Exercise History selector table */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('health_exercise_history')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {t('health_exercise_select')}
            </p>
          </div>

          <select
            value={historyExercise}
            onChange={(e) => setHistoryExercise(e.target.value)}
            className="glass-select text-xs py-1.5"
          >
            {allWorkoutExercises.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          {exerciseRows.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-life-line text-life-muted font-black uppercase text-[10px]">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Program</th>
                  <th className="py-2.5 px-3">Set</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3">{t('health_load')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-life-text">
                {exerciseRows.slice(0, 20).map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.005]">
                    <td className="py-2 px-3">{formatDate(row.date)}</td>
                    <td className="py-2 px-3">{row.program}</td>
                    <td className="py-2 px-3">{row.setIndex}</td>
                    <td className="py-2 px-3">
                      {row.setType === 'N' ? (
                        <span className="text-[9px] font-black uppercase text-life-muted">Normal</span>
                      ) : (
                        <Badge tone={row.setType === 'W' ? 'amber' : row.setType === 'D' ? 'indigo' : 'rose'} className="text-[8px] px-1 py-0 shrink-0">
                          {row.setType === 'W' ? 'Warmup' : row.setType === 'D' ? 'Drop' : 'Failure'}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 px-3">{row.weight} kg x {row.reps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState />
          )}
        </div>
      </Surface>

      {/* Modal Tambah Latihan (Hevy-style gerak search) */}
      <Modal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        title="Pilih Latihan"
        subtitle="Cari dan tambahkan gerakan ke dalam sesi latihan Anda"
      >
        <div className="space-y-4">
          <input
            type="text"
            className="glass-input text-xs w-full"
            placeholder="Cari gerakan (misal: Bench Press, Squat, Lat Pulldown)..."
            value={exerciseSearchQuery}
            onChange={(e) => setExerciseSearchQuery(e.target.value)}
          />

          <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
            {allWorkoutExercises
              .filter(ex => ex.toLowerCase().includes(exerciseSearchQuery.toLowerCase()))
              .map((exName) => (
                <button
                  key={exName}
                  onClick={() => handleAddExerciseToWorkout(exName)}
                  className="w-full p-2.5 text-left rounded-lg border border-life-line bg-white/[0.005] hover:bg-white/[0.04] transition-all text-xs font-bold text-life-text flex justify-between items-center"
                >
                  <span>{exName}</span>
                  <Icon name="arrowRight" size={12} className="text-life-muted" />
                </button>
              ))}
            {allWorkoutExercises.filter(ex => ex.toLowerCase().includes(exerciseSearchQuery.toLowerCase())).length === 0 && (
              <p className="text-xs text-life-muted italic text-center py-4">Gerakan tidak ditemukan.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
