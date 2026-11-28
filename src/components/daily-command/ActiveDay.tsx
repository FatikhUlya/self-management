'use client';
import React from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { DailyPlan } from '@/lib/hooks/useLifeOSState';
import Link from 'next/link';
import { ProgressBar } from '@/components/ui/ProgressBar';

export function ActiveDay({ 
 todayPlan, 
 onEndDay 
}: { 
 todayPlan: DailyPlan; 
 onEndDay: () => void;
}) {
 const { state, updateTaskStatus } = useLifeOS();

 const mit = state.tasks.find(t => t.id === todayPlan.mitTaskId);
 const secondaryTasks = state.tasks.filter(t => todayPlan.secondaryTaskIds?.includes(t.id));
 
 const allDayTasks = [mit, ...secondaryTasks].filter(Boolean) as typeof state.tasks;
 const completedTasks = allDayTasks.filter(t => t.status === 'done');
 const progressPercent = allDayTasks.length > 0 ? Math.round((completedTasks.length / allDayTasks.length) * 100) : 0;

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
 <div>
 <h1 className="text-3xl font-medium text-foreground flex items-center gap-2">
 <Icon name="sun" size={28} className="text-amber-500" />
 Eksekusi Harian
 </h1>
 <p className="text-muted-foreground mt-1">
 Fokus pada output, bukan sekadar aktivitas.
 </p>
 </div>
 <Button variant="danger" icon="moon" onClick={onEndDay}>
 Akhiri Hari
 </Button>
 </div>

 <ProgressBar 
 value={progressPercent} 
 max={100} 
 label="Progres Harian" 
 detail={`${completedTasks.length} dari ${allDayTasks.length} tugas selesai`} 
 />

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Left: Tasks */}
 <div className="space-y-6">
 {mit && (
 <Surface variant="soft" className="p-5 md:p-6">
 <div className="flex justify-between items-start mb-4">
 <Badge tone="rose">Most Important Task</Badge>
 {mit.status === 'done' && (
 <Badge tone="green">Selesai</Badge>
 )}
 </div>
 <h2 className={`text-xl font-semibold ${mit.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
 {mit.title}
 </h2>
 {mit.description && (
 <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{mit.description}</p>
 )}
 
 <div className="mt-6 flex gap-3">
 {mit.status !== 'done' ? (
 <>
 <Button variant="primary" icon="check" onClick={() => updateTaskStatus(mit.id, 'done')} className="flex-1">
 Selesaikan
 </Button>
 <Button href={`/focus?taskId=${mit.id}`} variant="secondary" icon="clock" className="flex-1 w-full">
 Fokus
 </Button>
 </>
 ) : (
 <Button variant="secondary" icon="rotateCcw" onClick={() => updateTaskStatus(mit.id, 'todo')}>
 Batal Selesai
 </Button>
 )}
 </div>
 </Surface>
 )}

 {secondaryTasks.length > 0 && (
 <Surface className="p-6">
 <h3 className="text-xs font-medium text-muted-foreground mb-4 flex items-center gap-2">
 <Icon name="checkSquare" size={16} className="text-primary" />
 Secondary Tasks
 </h3>
 <div className="space-y-2.5">
 {secondaryTasks.map(t => (
 <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
 <span className={`text-sm font-semibold ${t.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
 {t.title}
 </span>
 <button
 onClick={() => updateTaskStatus(t.id, t.status === 'done' ? 'todo' : 'done')}
 className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-colors ${
 t.status === 'done' 
 ? 'bg-primary border-primary text-primary-foreground shadow-card' 
 : 'border-border text-transparent hover:border-primary hover:text-primary bg-card'
 }`}
 >
 <Icon name="check" size={14} className="stroke-[3]" />
 </button>
 </div>
 ))}
 </div>
 </Surface>
 )}
 </div>

 {/* Right: Rules & Intention */}
 <div className="space-y-6">
 {todayPlan.morningCheckin?.intention && (
 <Surface className="p-6">
 <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
 <Icon name="compass" size={16} className="text-sky-500" />
 Intensi Hari Ini
 </h3>
 <p className="text-sm font-medium text-foreground well">
 "{todayPlan.morningCheckin.intention}"
 </p>
 </Surface>
 )}

 <Surface className="p-6">
 <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
 <Icon name="shield" size={16} className="text-amber-700 dark:text-amber-300" />
 Sistem Pengingat
 </h3>
 <p className="text-sm text-muted-foreground mb-4">
 Patuhi aturan yang sudah dibuat agar sistem berjalan lancar.
 </p>
 <div className="space-y-3">
 {state.selfRules.slice(0, 3).map(rule => (
 <div key={rule.id} className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-sm text-foreground">
 {rule.rule_text}
 </div>
 ))}
 </div>
 <Link href="/rules" className="block mt-4 text-xs text-indigo-600 dark:text-indigo-300 hover:underline">
 Lihat semua aturan &rarr;
 </Link>
 </Surface>
 </div>
 </div>
 </div>
 );
}
