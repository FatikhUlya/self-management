'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { QuickNavGrid } from '@/components/ui/QuickNavGrid';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { 
 monthCalendarDays, 
 yearOptions, 
 dateInMonthYear,
} from '@/lib/utils';
import { WORK_STATUSES } from '@/lib/constants';

// Import learning module
import LearningDashboardPage from '@/app/learning/page';

export default function WorkAndLearningHub() {
 const { state } = useLifeOS();
 const { t, locale } = useI18n();

 const [activeTab, setActiveTab] = useState<'work' | 'learning'>('work');
 const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

 // Date selection states (Calendar)
 const currentSelectedDate = new Date(`${state.selectedDate}T00:00:00`);
 const [monthSel, setMonthSel] = useState(currentSelectedDate.getMonth());
 const [yearSel, setYearSel] = useState(currentSelectedDate.getFullYear());

 const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
 const m = Number(e.target.value);
 setMonthSel(m);
 };

 const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
 const y = Number(e.target.value);
 setYearSel(y);
 };

 // Stats calculation
 const total = state.workApplications.length;
 const notApplied = state.workApplications.filter((app) => app.status === 'wishlist').length;
 const appliedCount = state.workApplications.filter((app) => app.status !== 'wishlist').length;
 const activePipeline = state.workApplications.filter((app) => 
 ['applied', 'screening', 'interview'].includes(app.status)
 ).length;

 const getDeadlinesForDate = (date: string) => {
 return state.workApplications.filter((app) => app.deadline === date);
 };

 const months = Array.from({ length: 12 }, (_, index) => ({
 value: index,
 label: new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { month: 'long' }).format(
 new Date(yearSel, index, 1)
 ),
 }));

 const getDaysArray = (year: number, month: number) => {
 const firstDay = new Date(year, month, 1).getDay(); 
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const startingEmpty = firstDay === 0 ? 6 : firstDay - 1;
 
 const days = [];
 for(let i = 0; i < startingEmpty; i++) days.push(null);
 for(let i = 1; i <= daysInMonth; i++) {
 days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
 }
 return days;
 };
 const calendarViewDays = getDaysArray(yearSel, monthSel);

 return (
 <div className="space-y-6 max-w-5xl mx-auto pb-24">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-600 dark:from-sky-300 dark:to-blue-500 flex items-center gap-2">
 <Icon name="briefcase" size={28} className="text-sky-500" />
 Career & Learning
 </h1>
 <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
 Pantau ringkasan pencarian kerja, karir, dan progres belajar Anda.
 </p>
 </div>
 </div>

 {/* Tabs Switcher */}
 <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-border w-full md:w-auto self-start overflow-x-auto hide-scrollbar">
 <button
 onClick={() => setActiveTab('work')}
 className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${
 activeTab === 'work' 
 ? 'bg-white dark:bg-zinc-800 text-sky-500 shadow-sm border border-black/5' 
 : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 Karir & Pekerjaan
 </button>
 <button
 onClick={() => setActiveTab('learning')}
 className={`flex-1 md:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all ${
 activeTab === 'learning' 
 ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-sm border border-black/5' 
 : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 Pembelajaran & Kursus
 </button>
 </div>

 {activeTab === 'work' && (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 pt-2">
 <QuickNavGrid 
 items={[
 { label: 'Kelola Lamaran Kerja', icon: 'edit', iconColor: 'text-sky-500', href: '/work/applications' }
 ]} 
 />

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
 <DashboardCard
 icon="briefcase"
 
 
 label={t('work_total')}
 value={total}
 detail="Total data tersimpan"
 />
 <DashboardCard
 icon="plus"
 
 
 label={t('work_not_applied')}
 value={notApplied}
 detail="Wishlist / Draft"
 />
 <DashboardCard
 icon="check"
 
 
 label={t('work_applied')}
 value={appliedCount}
 detail="Sudah dikirim"
 />
 <DashboardCard
 icon="target"
 
 
 label={t('work_pipeline')}
 value={activePipeline}
 detail="Aktif diproses"
 />
 </div>

 {/* Deadline Calendar */}
 <Surface className="p-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-6">
 <div>
 <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
 {t('work_deadline_calendar')}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 {t('work_deadline_desc')}
 </p>
 </div>

 <div className="flex items-center gap-3">
 <select
 value={monthSel}
 onChange={handleMonthChange}
 className="glass-select text-xs py-1.5"
 >
 {months.map((m) => (
 <option key={m.value} value={m.value}>
 {m.label}
 </option>
 ))}
 </select>
 <select
 value={yearSel}
 onChange={handleYearChange}
 className="glass-select text-xs py-1.5"
 >
 {yearOptions(yearSel).map((y) => (
 <option key={y} value={y}>
 {y}
 </option>
 ))}
 </select>
 </div>
 </div>

 <div className="grid grid-cols-7 gap-2 max-w-xl mx-auto">
 {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
 <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground uppercase py-1">
 {day}
 </div>
 ))}

 {calendarViewDays.map((day, idx) => {
 if (!day) return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;
 const deadlines = getDeadlinesForDate(day);
 const isSelected = day === state.selectedDate;
 const hasDeadlines = deadlines.length > 0;

 return (
 <button
 key={day}
 onClick={() => setSelectedCalendarDate(day)}
 className={`aspect-square rounded-lg flex flex-col items-center justify-between p-1.5 relative border transition-all duration-150 select-none ${
 hasDeadlines ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-muted/20 border-border text-foreground'
 } ${
 isSelected ? 'border-primary/25 scale-[1.05] ring-2 ring-life-teal/30 z-10' : ''
 }`}
 >
 <span className="text-[10px] font-bold self-start">{Number(day.slice(-2))}</span>
 {hasDeadlines && (
 <strong className="text-[10px] font-semibold bg-amber-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center self-center shadow">
 {deadlines.length}
 </strong>
 )}
 </button>
 );
 })}
 </div>

 {/* Selected Date Information */}
 {selectedCalendarDate && (
 <div className="mt-6 pt-4 border-t border-border">
 <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
 <Icon name="calendar" size={14} /> Deadline: {selectedCalendarDate}
 </h4>
 {getDeadlinesForDate(selectedCalendarDate).length > 0 ? (
 <div className="space-y-2">
 {getDeadlinesForDate(selectedCalendarDate).map(app => {
 const statusObj = WORK_STATUSES.find((s) => s.id === app.status);
 return (
 <div key={app.id} className="p-3 bg-muted/30 border border-border rounded-lg flex justify-between items-center">
 <div>
 <strong className="text-sm font-bold block">{app.role}</strong>
 <span className="text-xs text-muted-foreground">{app.company}</span>
 </div>
 {statusObj && (
 <Badge tone={statusObj.tone as any} className="text-[10px] uppercase">
 {locale === 'id' ? statusObj.label : statusObj.labelEn}
 </Badge>
 )}
 </div>
 );
 })}
 </div>
 ) : (
 <div className="text-xs text-muted-foreground italic">Tidak ada deadline di tanggal ini.</div>
 )}
 </div>
 )}
 </Surface>
 </div>
 )}

 {activeTab === 'learning' && (
 <div className="animate-in fade-in slide-in-from-bottom-2 pt-2 -mt-6">
 <LearningDashboardPage />
 </div>
 )}
 </div>
 );
}
