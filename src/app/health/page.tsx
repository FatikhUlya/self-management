'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LineChart } from '@/components/ui/LineChart';
import { 
  formatDate, 
  monthDays, 
  monthCalendarDays, 
  percent, 
  yearOptions, 
  dateInMonthYear,
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
  const [weightValue, setWeightValue] = useState<string>('');
  const [weightNotes, setWeightNotes] = useState<string>('');

  // Meal form
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  const [mealFood, setMealFood] = useState('');
  const [mealProtein, setMealProtein] = useState<number>(0);
  const [mealCalories, setMealCalories] = useState<number>(0);

  // Workout form
  const [workoutProgram, setWorkoutProgram] = useState<string>('Push A');
  const [workoutActivity, setWorkoutActivity] = useState('');
  const [workoutMinutes, setWorkoutMinutes] = useState<number>(30);
  const [workoutNotes, setWorkoutNotes] = useState('');
  
  // Sets draft state (stores: { "Bench Press": [{ weight: 60, reps: 8 }, ...] })
  const [strengthSets, setStrengthSets] = useState<Record<string, { weight: string; reps: string }[]>>({});

  // History selector
  const [historyExercise, setHistoryExercise] = useState<string>(allWorkoutExercises[0]);

  // Selected date helpers
  const today = state.selectedDate;
  const dailyMeals = state.meals.filter((m) => m.date === today);
  const dailyWorkouts = state.workouts.filter((w) => w.date === today);

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
    // Mifflin-St Jeor Equation (Male default, +5)
    const bmr = 10 * w + 6.25 * h - 5 * a + 5;
    return Math.round(bmr * activity.factor);
  };

  const tdee = calculateTdee();
  const mealGoalCalories = Number(mealGoal || state.healthProfile.mealGoalCalories || tdee || 2000);
  const totalCalories = dailyMeals.reduce((s, m) => s + Number(m.calories || 0), 0);
  const totalProtein = dailyMeals.reduce((s, m) => s + Number(m.protein || 0), 0);
  const totalWorkoutMins = dailyWorkouts.reduce((s, w) => s + Number(w.minutes || 0), 0);

  // Handlers
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateHealthProfile({
      height: height === '' ? '' : Number(height),
      age: age === '' ? '' : Number(age),
      activityLevel,
      mealGoalCalories: mealGoal === '' ? '' : Number(mealGoal),
    });
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightValue.trim()) return;

    const parsedWeight = parseDecimalInput(weightValue);
    await saveWeightLog(parsedWeight, weightNotes, today);
    setWeightValue('');
    setWeightNotes('');
  };

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

  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isStrength = strengthPrograms.includes(workoutProgram);

    if (isStrength) {
      const exercises = workoutPrograms[workoutProgram].map((exName) => {
        const setsDraft = strengthSets[exName] || [
          { weight: '0', reps: '0' },
          { weight: '0', reps: '0' },
          { weight: '0', reps: '0' },
        ];
        const sets = setsDraft
          .map((s) => ({
            weight: parseDecimalInput(s.weight),
            reps: parseInt(s.reps) || 0,
          }))
          .filter((s) => s.weight > 0 || s.reps > 0);

        return { name: exName, sets };
      }).filter((ex) => ex.sets.length > 0);

      await addWorkout({
        date: today,
        type: workoutProgram,
        program: workoutProgram,
        category: 'strength',
        minutes: workoutMinutes,
        notes: workoutNotes,
        exercises,
      });
    } else {
      await addWorkout({
        date: today,
        type: workoutProgram,
        program: workoutProgram,
        category: 'simple',
        activity: workoutActivity || workoutProgram,
        minutes: workoutMinutes,
        notes: workoutNotes,
      });
    }

    setWorkoutActivity('');
    setWorkoutNotes('');
    setStrengthSets({});
  };

  // Add/remove sets in strength logging GUI
  const handleSetCountChange = (exName: string, action: 'add' | 'remove') => {
    const current = strengthSets[exName] || [
      { weight: '0', reps: '0' },
      { weight: '0', reps: '0' },
      { weight: '0', reps: '0' },
    ];

    if (action === 'add' && current.length < 8) {
      setStrengthSets({
        ...strengthSets,
        [exName]: [...current, { weight: '0', reps: '0' }],
      });
    } else if (action === 'remove' && current.length > 1) {
      setStrengthSets({
        ...strengthSets,
        [exName]: current.slice(0, -1),
      });
    }
  };

  const handleSetValChange = (
    exName: string,
    setIdx: number,
    field: 'weight' | 'reps',
    val: string
  ) => {
    const current = strengthSets[exName] || [
      { weight: '0', reps: '0' },
      { weight: '0', reps: '0' },
      { weight: '0', reps: '0' },
    ];

    const updated = current.map((s, idx) => {
      if (idx === setIdx) {
        return { ...s, [field]: val };
      }
      return s;
    });

    setStrengthSets({
      ...strengthSets,
      [exName]: updated,
    });
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
                <label htmlFor="height" className="text-xs font-bold text-life-muted uppercase">
                  {t('health_height')}
                </label>
                <input
                  id="height"
                  type="number"
                  placeholder="170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="age" className="text-xs font-bold text-life-muted uppercase">
                  {t('health_age')}
                </label>
                <input
                  id="age"
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
                <label htmlFor="activity" className="text-xs font-bold text-life-muted uppercase">
                  {t('health_activity')}
                </label>
                <select
                  id="activity"
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
                <label htmlFor="mealGoal" className="text-xs font-bold text-life-muted uppercase">
                  {t('health_meal_goal')}
                </label>
                <input
                  id="mealGoal"
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
                <label htmlFor="weightVal" className="text-xs font-bold text-life-muted uppercase">
                  {t('health_weight_kg')}
                </label>
                <input
                  id="weightVal"
                  type="text"
                  required
                  placeholder={t('health_weight_example')}
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1 col-span-2 sm:col-span-1">
                <label htmlFor="weightNotes" className="text-xs font-bold text-life-muted uppercase">
                  {t('notes')}
                </label>
                <input
                  id="weightNotes"
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
                <label htmlFor="mType" className="text-xs font-bold text-life-muted uppercase">
                  {t('health_meal_type')}
                </label>
                <select
                  id="mType"
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
                <label htmlFor="mFood" className="text-xs font-bold text-life-muted uppercase">
                  {t('health_food')}
                </label>
                <input
                  id="mFood"
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
                <label htmlFor="mProtein" className="text-xs font-bold text-life-muted uppercase">
                  {t('health_protein')}
                </label>
                <input
                  id="mProtein"
                  type="number"
                  min="0"
                  required
                  value={mealProtein}
                  onChange={(e) => setMealProtein(Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="mCalories" className="text-xs font-bold text-life-muted uppercase">
                  {t('health_calories')}
                </label>
                <input
                  id="mCalories"
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

        {/* Workout Log & PPL routines builder */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('health_workout_log')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {totalWorkoutMins} {t('health_workout_minutes')} {formatDate(today, { short: true })}
            </p>
          </div>

          <form onSubmit={handleWorkoutSubmit} className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="wProg" className="text-xs font-bold text-life-muted uppercase">
                  {t('health_workout_program')}
                </label>
                <select
                  id="wProg"
                  value={workoutProgram}
                  onChange={(e) => setWorkoutProgram(e.target.value)}
                  className="glass-select text-xs"
                >
                  {workoutProgramNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="wMins" className="text-xs font-bold text-life-muted uppercase">
                  {t('learning_minutes')}
                </label>
                <input
                  id="wMins"
                  type="number"
                  min="1"
                  required
                  value={workoutMinutes}
                  onChange={(e) => setWorkoutMinutes(Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            {/* Render conditional inputs based on program type (strength vs simple) */}
            {strengthPrograms.includes(workoutProgram) ? (
              <div className="space-y-4 border-t border-life-line pt-3">
                <p className="text-[10px] text-life-muted font-black uppercase tracking-wider">Exercises & Sets</p>
                {workoutPrograms[workoutProgram].map((exName) => {
                  const currentSets = strengthSets[exName] || [
                    { weight: '0', reps: '0' },
                    { weight: '0', reps: '0' },
                    { weight: '0', reps: '0' },
                  ];

                  return (
                    <div 
                      key={exName} 
                      className="p-3 bg-white/[0.01] border border-life-line rounded-lg space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <strong className="text-xs text-life-text truncate mr-2">{exName}</strong>
                        <div className="flex space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSetCountChange(exName, 'remove')}
                            className="w-5 h-5 rounded bg-white/[0.03] hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all"
                            title="Hapus set"
                          >
                            <Icon name="minus" size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetCountChange(exName, 'add')}
                            className="w-5 h-5 rounded bg-white/[0.03] hover:bg-life-teal/20 text-life-muted hover:text-life-teal flex items-center justify-center transition-all"
                            title="Tambah set"
                          >
                            <Icon name="plus" size={10} />
                          </button>
                        </div>
                      </div>

                      {/* Sets list */}
                      <div className="grid grid-cols-2 gap-2">
                        {currentSets.map((set, setIdx) => (
                          <div 
                            key={setIdx} 
                            className="flex items-center space-x-1.5 bg-white/[0.01] border border-white/5 rounded p-1"
                          >
                            <span className="text-[9px] font-black text-life-muted uppercase">S{setIdx + 1}</span>
                            <input
                              type="text"
                              placeholder="kg"
                              value={set.weight}
                              onChange={(e) => handleSetValChange(exName, setIdx, 'weight', e.target.value)}
                              className="bg-transparent outline-none text-[10px] w-8 text-life-text text-center"
                            />
                            <span className="text-life-muted text-[10px]">x</span>
                            <input
                              type="text"
                              placeholder="r"
                              value={set.reps}
                              onChange={(e) => handleSetValChange(exName, setIdx, 'reps', e.target.value)}
                              className="bg-transparent outline-none text-[10px] w-6 text-life-text text-center"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col space-y-1">
                <label htmlFor="wAct" className="text-xs font-bold text-life-muted uppercase">
                  {t('health_food_placeholder')}
                </label>
                <input
                  id="wAct"
                  type="text"
                  placeholder={workoutProgram}
                  value={workoutActivity}
                  onChange={(e) => setWorkoutActivity(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            )}

            <div className="flex flex-col space-y-1">
              <label htmlFor="wNotes" className="text-xs font-bold text-life-muted uppercase">
                {t('notes')}
              </label>
              <input
                id="wNotes"
                type="text"
                placeholder="Catatan workout..."
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full">
              {t('health_add_workout')}
            </Button>
          </form>
        </Surface>
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

        {/* Weight logs lists */}
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

      {/* Daily Logs Lists (Meals / Workouts today) */}
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

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
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

        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('health_workouts_today')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {dailyWorkouts.length} {t('health_logs_saved')}
            </p>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {dailyWorkouts.length > 0 ? (
              dailyWorkouts.map((w) => (
                <div 
                  key={w.id} 
                  className="p-3 rounded-lg bg-white/[0.005] border border-life-line flex justify-between items-start gap-4"
                >
                  <div className="min-w-0">
                    <strong className="text-xs text-life-text block">{w.program}</strong>
                    <span className="text-[10px] text-life-muted font-bold block">
                      {w.category === 'strength' ? 'Routines sets' : w.activity} • {w.minutes}m
                    </span>
                    {w.category === 'strength' && w.exercises && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {w.exercises.map((e) => (
                          <Badge key={e.name} tone="teal">
                            {`${e.name} ${e.sets.length}s`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteWorkout(w.id)}
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

      {/* Exercise History selector */}
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
                  <th className="py-2.5 px-3">{t('health_load')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-life-text">
                {exerciseRows.slice(0, 20).map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.005]">
                    <td className="py-2 px-3">{formatDate(row.date)}</td>
                    <td className="py-2 px-3">{row.program}</td>
                    <td className="py-2 px-3">{row.setIndex}</td>
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
    </div>
  );
}
