import React, { useState, useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { toISODate, addDays, formatDate, dayName } from '@/lib/utils';
import { Meal } from '@/lib/hooks/useLifeOSState';

interface NutritionTarget {
  calories: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
}

interface WeeklyNutritionAnalyticsProps {
  meals: Meal[];
  targetNutrition: NutritionTarget | null;
  baseGoalCalories: number;
  today: string;
  locale?: string;
}

export function WeeklyNutritionAnalytics({ 
  meals, 
  targetNutrition, 
  baseGoalCalories,
  today,
  locale = 'id' 
}: WeeklyNutritionAnalyticsProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const { startDateStr, endDateStr, weekDays } = useMemo(() => {
    const current = new Date(`${today}T00:00:00`);
    const day = current.getDay();
    // Monday as start of week
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(current.setDate(diff));
    
    // Apply week offset
    startOfWeek.setDate(startOfWeek.getDate() + weekOffset * 7);
    const startStr = toISODate(startOfWeek);
    
    const days = Array.from({ length: 7 }, (_, i) => addDays(startStr, i));
    return {
      startDateStr: days[0],
      endDateStr: days[6],
      weekDays: days
    };
  }, [today, weekOffset]);

  const targetCal = targetNutrition?.calories || baseGoalCalories;
  const targetCarbs = targetNutrition?.carbs_g || 300;
  const targetProtein = targetNutrition?.protein_g || 150;
  const targetFat = targetNutrition?.fat_g || 80;

  return (
    <div className="bg-life-surface/50 border border-life-line rounded-2xl p-4 sm:p-5 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-life-text flex items-center gap-2">
            <Icon name="chartBar" size={16} className="text-violet-400" />
            {locale === 'id' ? 'Analitik Mingguan' : 'Weekly Analytics'}
          </h3>
          <p className="text-xs text-life-muted mt-1">
            {formatDate(startDateStr, { short: true, locale })} - {formatDate(endDateStr, { short: true, locale })}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-1 border border-white/5">
          <button 
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="w-8 h-8 flex items-center justify-center rounded text-life-muted hover:text-life-text hover:bg-white/5 transition-all"
          >
            <Icon name="chevronLeft" size={16} />
          </button>
          <button 
            onClick={() => setWeekOffset(0)}
            className={`px-3 text-xs font-bold transition-all ${weekOffset === 0 ? 'text-violet-400' : 'text-life-muted hover:text-life-text'}`}
          >
            {locale === 'id' ? 'Minggu Ini' : 'This Week'}
          </button>
          <button 
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="w-8 h-8 flex items-center justify-center rounded text-life-muted hover:text-life-text hover:bg-white/5 transition-all"
            disabled={weekOffset >= 0}
            style={{ opacity: weekOffset >= 0 ? 0.3 : 1 }}
          >
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="space-y-3">
        {weekDays.map(dateStr => {
          const dayMeals = meals.filter(m => m.date === dateStr);
          const cals = dayMeals.reduce((s, m) => s + Number(m.calories || 0), 0);
          const carbs = dayMeals.reduce((s, m) => s + Number(m.carbs || 0), 0);
          const protein = dayMeals.reduce((s, m) => s + Number(m.protein || 0), 0);
          const fat = dayMeals.reduce((s, m) => s + Number(m.fat || 0), 0);
          
          const isToday = dateStr === today;
          
          return (
            <div 
              key={dateStr}
              className={`p-3 sm:px-4 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 transition-all ${isToday ? 'bg-violet-500/10 border-violet-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
            >
              {/* Day Label */}
              <div className="w-24 shrink-0">
                <span className={`text-[10px] font-black uppercase tracking-wider block ${isToday ? 'text-violet-400' : 'text-life-muted'}`}>
                  {dayName(dateStr, locale)}
                </span>
                <span className={`text-sm font-bold ${isToday ? 'text-violet-200' : 'text-life-text'}`}>
                  {formatDate(dateStr, { short: true, locale }).split(' ')[0]} {formatDate(dateStr, { short: true, locale }).split(' ')[1]}
                </span>
              </div>

              {/* Progress Bars */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Calories */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500/70">Kalori</span>
                    <span className="text-[10px] text-amber-400 font-bold">{cals} <span className="text-amber-400/50 font-normal">/ {targetCal}</span></span>
                  </div>
                  <div className="h-1.5 bg-amber-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (cals / targetCal) * 100)}%` }} />
                  </div>
                </div>

                {/* Carbs */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-blue-500/70">Karbo</span>
                    <span className="text-[10px] text-blue-400 font-bold">{carbs}g <span className="text-blue-400/50 font-normal">/ {targetCarbs}g</span></span>
                  </div>
                  <div className="h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (carbs / targetCarbs) * 100)}%` }} />
                  </div>
                </div>

                {/* Protein */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500/70">Protein</span>
                    <span className="text-[10px] text-rose-400 font-bold">{protein}g <span className="text-rose-400/50 font-normal">/ {targetProtein}g</span></span>
                  </div>
                  <div className="h-1.5 bg-rose-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (protein / targetProtein) * 100)}%` }} />
                  </div>
                </div>

                {/* Fat */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-500/70">Lemak</span>
                    <span className="text-[10px] text-yellow-400 font-bold">{fat}g <span className="text-yellow-400/50 font-normal">/ {targetFat}g</span></span>
                  </div>
                  <div className="h-1.5 bg-yellow-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${Math.min(100, (fat / targetFat) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
