'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Icon } from '@/components/ui/Icon';

export default function LearningSchedulePage() {
 const { state, updateLearningSchedule } = useLifeOS();
 const { locale } = useI18n();

 const [localSchedule, setLocalSchedule] = useState({
 mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: ''
 });
 const scheduleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

 // Sync with global state when it loads
 useEffect(() => {
 if (state.learningSchedule) {
 setLocalSchedule({
 mon: state.learningSchedule.mon || '',
 tue: state.learningSchedule.tue || '',
 wed: state.learningSchedule.wed || '',
 thu: state.learningSchedule.thu || '',
 fri: state.learningSchedule.fri || '',
 sat: state.learningSchedule.sat || '',
 sun: state.learningSchedule.sun || ''
 });
 }
 }, [state.learningSchedule]);

 const handleScheduleChange = (day: string, value: string) => {
 const next = { ...localSchedule, [day]: value };
 setLocalSchedule(next);
 if (scheduleTimeoutRef.current) clearTimeout(scheduleTimeoutRef.current);
 scheduleTimeoutRef.current = setTimeout(() => {
 updateLearningSchedule(next);
 }, 1000);
 };

 return (
 <div className="space-y-6 max-w-4xl mx-auto">
 <div className="page-header-title">
 <Link href="/learning" className="icon-btn" aria-label="Kembali"><Icon name="arrowLeft" size={18} /></Link>
 <div className="flex-1">
 <h1 className="page-title">
 Jadwal Belajar
 </h1>
 <p className="page-subtitle">
 Atur rutinitas dan fokus topik pembelajaran Anda dalam satu minggu.
 </p>
 </div>
 </div>

 <Surface className="p-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
 {[
 { key: 'mon', label: locale === 'id' ? 'Senin' : 'Mon' },
 { key: 'tue', label: locale === 'id' ? 'Selasa' : 'Tue' },
 { key: 'wed', label: locale === 'id' ? 'Rabu' : 'Wed' },
 { key: 'thu', label: locale === 'id' ? 'Kamis' : 'Thu' },
 { key: 'fri', label: locale === 'id' ? 'Jumat' : 'Fri' },
 { key: 'sat', label: locale === 'id' ? 'Sabtu' : 'Sat', isWeekend: true },
 { key: 'sun', label: locale === 'id' ? 'Minggu' : 'Sun', isWeekend: true }
 ].map((day) => (
 <div key={day.key} className={`flex flex-col space-y-2 bg-muted/20 p-4 rounded-xl border transition-colors ${day.isWeekend ? 'border-amber-500/30 bg-amber-500/5' : 'border-border hover:border-border-strong'}`}>
 <span className={`text-xs font-semibold ${day.isWeekend ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'}`}>
 {day.label}
 </span>
 <textarea
 placeholder={locale === 'id' ? 'Topik/Materi...' : 'Topic/Material...'}
 value={localSchedule[day.key as keyof typeof localSchedule]}
 onChange={(e) => handleScheduleChange(day.key, e.target.value)}
 className="w-full bg-transparent text-sm text-foreground placeholder:text-zinc-600 focus:outline-none resize-none h-32 leading-relaxed"
 />
 </div>
 ))}
 </div>
 </Surface>
 </div>
 );
}
