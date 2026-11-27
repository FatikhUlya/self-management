'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
 formatDate, 
 monthCalendarDays, 
 percent, 
 yearOptions,
 addDays
} from '@/lib/utils';

export default function HabitsCalendarPage() {
 const { state, toggleHabit } = useLifeOS();
 const { t, locale } = useI18n();
 const today = state.selectedDate;

 const todayDate = new Date(`${today}T00:00:00`);
 const [calMonth, setCalMonth] = useState(() => {
 if (typeof window !== 'undefined') {
 const saved = localStorage.getItem('lifeos_habits_cal_month');
 if (saved !== null) return Number(saved);
 }
 return todayDate.getMonth();
 });
 const [calYear, setCalYear] = useState(() => {
 if (typeof window !== 'undefined') {
 const saved = localStorage.getItem('lifeos_habits_cal_year');
 if (saved !== null) return Number(saved);
 }
 return todayDate.getFullYear();
 });

 const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

 const calDateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-15`;
 const calendarDays = monthCalendarDays(calDateStr);

 const navigateCalendarMonth = (direction: 'prev' | 'next') => {
 let m = calMonth;
 let y = calYear;
 if (direction === 'prev') {
 if (calMonth === 0) {
 m = 11;
 y = calYear - 1;
 } else {
 m = calMonth - 1;
 }
 } else {
 if (calMonth === 11) {
 m = 0;
 y = calYear + 1;
 } else {
 m = calMonth + 1;
 }
 }
 setCalMonth(m);
 setCalYear(y);
 localStorage.setItem('lifeos_habits_cal_month', String(m));
 localStorage.setItem('lifeos_habits_cal_year', String(y));
 };

 const getCompletionPercent = (date: string) => {
 if (!state.habits.length) return 0;
 const done = state.habits.filter((h) => 
 state.habitLogs.some((log) => log.habitId === h.id && log.date === date)
 ).length;
 return percent(done, state.habits.length);
 };

 const getCompletionTone = (pct: number) => {
 if (pct <= 0) return 'tone-0';
 if (pct <= 25) return 'tone-25';
 if (pct <= 50) return 'tone-50';
 if (pct <= 75) return 'tone-75';
 return 'tone-100';
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

 const months = Array.from({ length: 12 }, (_, index) => ({
 value: index,
 label: new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { month: 'long' }).format(
 new Date(calYear, index, 1)
 ),
 }));

 return (
 <div className="space-y-6 max-w-5xl mx-auto pb-24">
 {/* Header */}
 <div className="flex items-center gap-3">
 <Link href="/habits">
 <button className="w-10 h-10 rounded-full bg-muted/30 border border-border flex items-center justify-center text-muted-foreground hover:bg-muted/50/[0.05] transition-colors">
 <Icon name="arrowLeft" size={18} />
 </button>
 </Link>
 <div>
 <h1 className="text-2xl sm:text-[32px] font-medium leading-[1.15] text-foreground">
 {t('habits_calendar')}
 </h1>
 <p className="text-zinc-500 text-xs mt-1">
 Klik pada tanggal untuk menandai kebiasaan Anda.
 </p>
 </div>
 </div>

 <Surface className="p-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-6">
 <div>
 <h3 className="text-sm font-medium text-foreground ">
 {t('habits_calendar')}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 {state.habits.length} {t('habits_active')} / {t('habits_click_date')}
 </p>
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => navigateCalendarMonth('prev')}
 className="w-7 h-7 rounded bg-muted/30 border border-border hover:bg-muted/50/[0.07] text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
 title={locale === 'id' ? 'Bulan Sebelumnya' : 'Previous Month'}
 >
 <Icon name="chevronLeft" size={12} />
 </button>

 <select
 value={calMonth}
 onChange={(e) => {
 setCalMonth(Number(e.target.value));
 localStorage.setItem('lifeos_habits_cal_month', e.target.value);
 }}
 className="glass-select text-xs py-1.5"
 >
 {months.map((m) => (
 <option key={m.value} value={m.value}>
 {m.label}
 </option>
 ))}
 </select>
 <select
 value={calYear}
 onChange={(e) => {
 setCalYear(Number(e.target.value));
 localStorage.setItem('lifeos_habits_cal_year', e.target.value);
 }}
 className="glass-select text-xs py-1.5"
 >
 {yearOptions(calYear).map((y) => (
 <option key={y} value={y}>
 {y}
 </option>
 ))}
 </select>

 <button
 type="button"
 onClick={() => navigateCalendarMonth('next')}
 className="w-7 h-7 rounded bg-muted/30 border border-border hover:bg-muted/50/[0.07] text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
 title={locale === 'id' ? 'Bulan Berikutnya' : 'Next Month'}
 >
 <Icon name="chevronRight" size={12} />
 </button>
 </div>
 </div>

 {/* Heatmap Grid */}
 <div className="grid grid-cols-7 gap-2 max-w-xl mx-auto">
 {/* Weekday headers */}
 {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
 <div key={day} className="text-center text-[11px] font-semibold text-muted-foreground py-1">
 {day}
 </div>
 ))}

 {/* Days */}
 {calendarDays.map((day, idx) => {
 if (!day) return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;
 const pct = getCompletionPercent(day);
 const isToday = day === today;
 const tone = getCompletionTone(pct);

 return (
 <button
 key={day}
 onClick={() => setSelectedCalendarDate(day)}
 className={`aspect-square rounded-lg flex flex-col items-center justify-between p-1.5 relative border transition-colors duration-150 select-none ${tone} ${
 isToday ? 'border-primary ring-2 ring-life-teal/30 z-10' : ''
 }`}
 title={`${formatDate(day)}: ${pct}% habit done`}
 >
 <span className="text-[11px] font-medium self-start">{Number(day.slice(-2))}</span>
 <strong className="text-xs font-semibold">{pct}%</strong>
 </button>
 );
 })}
 </div>

 {/* Legend */}
 <div className="flex justify-center items-center gap-4 mt-6 text-[11px] font-semibold text-muted-foreground ">
 <span className="flex items-center gap-1.5">
 <i className="w-3.5 h-3.5 rounded bg-muted/30 border border-border inline-block" /> 0%
 </span>
 <span className="flex items-center gap-1.5">
 <i className="w-3.5 h-3.5 rounded bg-primary/10/30 border border-primary/25/30 inline-block" /> 1-25%
 </span>
 <span className="flex items-center gap-1.5">
 <i className="w-3.5 h-3.5 rounded bg-primary/10/60 border border-primary/25/50 inline-block" /> 26-50%
 </span>
 <span className="flex items-center gap-1.5">
 <i className="w-3.5 h-3.5 rounded bg-primary/60 border border-primary/25/70 inline-block" /> 51-75%
 </span>
 <span className="flex items-center gap-1.5">
 <i className="w-3.5 h-3.5 rounded bg-primary border border-primary/30 inline-block " /> 76-100%
 </span>
 </div>
 </Surface>

 <Modal
 isOpen={selectedCalendarDate !== null}
 onClose={() => setSelectedCalendarDate(null)}
 title={t('habits_checklist')}
 subtitle={selectedCalendarDate ? formatDate(selectedCalendarDate) : ''}
 >
 {selectedCalendarDate && (
 <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
 {state.habits.length > 0 ? (
 state.habits.map((habit) => {
 const isDone = state.habitLogs.some(
 (log) => log.habitId === habit.id && log.date === selectedCalendarDate
 );

 return (
 <div
 key={habit.id}
 onClick={() => toggleHabit(habit.id, selectedCalendarDate)}
 className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-colors duration-150 ${
 isDone
 ? 'bg-primary/10/10 border-primary/25/30 text-teal-300'
 : 'bg-muted/20 border-border hover:border-border-strong text-muted-foreground'
 }`}
 >
 <div>
 <strong className="text-sm font-medium block">{habit.name}</strong>
 <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
 Area: {habit.area} / Streak: {getHabitStreak(habit.id, selectedCalendarDate)} {t('days')}
 </p>
 </div>

 <span className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
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
 )}
 </Modal>
 </div>
 );
}
