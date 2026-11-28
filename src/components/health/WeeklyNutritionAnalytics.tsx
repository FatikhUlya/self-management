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
 <div className="bg-card/50 border border-border rounded-xl p-4 sm:p-5 mt-6">
 {/* Header */}
 <div className="flex items-center justify-between mb-5">
 <div>
 <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
 <Icon name="chartBar" size={16} className="text-muted-foreground" />
 {locale === 'id' ? 'Analitik Mingguan' : 'Weekly Analytics'}
 </h3>
 <p className="text-xs text-muted-foreground mt-1">
 {formatDate(startDateStr, { short: true, locale })} - {formatDate(endDateStr, { short: true, locale })}
 </p>
 </div>
 <div className="seg">
 <button 
 onClick={() => setWeekOffset(prev => prev - 1)}
 className="seg-item px-0 w-9 justify-center"
 >
 <Icon name="chevronLeft" size={16} />
 </button>
 <button 
 onClick={() => setWeekOffset(0)}
 className={`seg-item ${weekOffset === 0 ? 'is-active' : ''}`}
 >
 {locale === 'id' ? 'Minggu Ini' : 'This Week'}
 </button>
 <button 
 onClick={() => setWeekOffset(prev => prev + 1)}
 className="seg-item px-0 w-9 justify-center"
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
 className={`p-3 sm:px-4 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 transition-colors ${isToday ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900' : 'bg-card border-border'}`}
 >
 {/* Day Label */}
 <div className="w-24 shrink-0">
 <span className={`text-xs font-semibold block ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'}`}>
 {dayName(dateStr, locale)}
 </span>
 <span className={`text-sm font-medium ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-foreground'}`}>
 {formatDate(dateStr, { short: true, locale }).split(' ')[0]} {formatDate(dateStr, { short: true, locale }).split(' ')[1]}
 </span>
 </div>

 {/* Progress Bars */}
 <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
 {/* Calories */}
 <div className="space-y-1.5">
 <div className="flex justify-between items-end">
 <span className="text-xs font-medium text-muted-foreground">Kalori</span>
 <span className="text-xs text-foreground font-medium tabular-nums">{cals} <span className="text-muted-foreground font-normal">/ {targetCal}</span></span>
 </div>
 <div className="h-1.5 bg-muted rounded-full overflow-hidden">
 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (cals / targetCal) * 100)}%` }} />
 </div>
 </div>

 {/* Carbs */}
 <div className="space-y-1.5">
 <div className="flex justify-between items-end">
 <span className="text-xs font-medium text-muted-foreground">Karbo</span>
 <span className="text-xs text-foreground font-medium tabular-nums">{carbs}g <span className="text-muted-foreground font-normal">/ {targetCarbs}g</span></span>
 </div>
 <div className="h-1.5 bg-muted rounded-full overflow-hidden">
 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (carbs / targetCarbs) * 100)}%` }} />
 </div>
 </div>

 {/* Protein */}
 <div className="space-y-1.5">
 <div className="flex justify-between items-end">
 <span className="text-xs font-medium text-muted-foreground">Protein</span>
 <span className="text-xs text-foreground font-medium tabular-nums">{protein}g <span className="text-muted-foreground font-normal">/ {targetProtein}g</span></span>
 </div>
 <div className="h-1.5 bg-muted rounded-full overflow-hidden">
 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (protein / targetProtein) * 100)}%` }} />
 </div>
 </div>

 {/* Fat */}
 <div className="space-y-1.5">
 <div className="flex justify-between items-end">
 <span className="text-xs font-medium text-muted-foreground">Lemak</span>
 <span className="text-xs text-foreground font-medium tabular-nums">{fat}g <span className="text-muted-foreground font-normal">/ {targetFat}g</span></span>
 </div>
 <div className="h-1.5 bg-muted rounded-full overflow-hidden">
 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (fat / targetFat) * 100)}%` }} />
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
