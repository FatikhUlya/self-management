'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { DailyPlan } from '@/lib/hooks/useLifeOSState';

const FOCUS_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;

export default function FocusModePage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const taskId = searchParams?.get('taskId');
 const { state, updateTaskStatus, saveFocusSession } = useLifeOS();
 
 const task = state.tasks.find(t => t.id === taskId);
 
 const [mode, setMode] = useState<'focus' | 'break'>('focus');
 const [timeLeft, setTimeLeft] = useState(FOCUS_MINUTES * 60);
 const [isActive, setIsActive] = useState(false);
 const [startTime, setStartTime] = useState<string | null>(null);

 useEffect(() => {
 let interval: NodeJS.Timeout;
 if (isActive && timeLeft > 0) {
 interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
 } else if (timeLeft === 0 && isActive) {
 handleTimerComplete();
 }
 return () => clearInterval(interval);
 }, [isActive, timeLeft]);

 const handleTimerComplete = () => {
 setIsActive(false);
 
 // Save session if we were in focus mode
 if (mode === 'focus' && startTime) {
 saveFocusSession({
 taskId: task?.id || undefined,
 startedAt: startTime,
 endedAt: new Date().toISOString(),
 plannedMinutes: FOCUS_MINUTES,
 actualMinutes: FOCUS_MINUTES,
 completed: true,
 });
 }

 // Toggle mode
 if (mode === 'focus') {
 setMode('break');
 setTimeLeft(SHORT_BREAK_MINUTES * 60);
 alert('Focus session complete! Take a break.');
 } else {
 setMode('focus');
 setTimeLeft(FOCUS_MINUTES * 60);
 alert('Break complete! Ready to focus?');
 }
 };

 const toggleTimer = () => {
 if (!isActive && !startTime && mode === 'focus') {
 setStartTime(new Date().toISOString());
 }
 setIsActive(!isActive);
 };

 const resetTimer = () => {
 setIsActive(false);
 setStartTime(null);
 setTimeLeft(mode === 'focus' ? FOCUS_MINUTES * 60 : SHORT_BREAK_MINUTES * 60);
 };

 const finishTask = () => {
 if (task) {
 updateTaskStatus(task.id, 'done');
 if (mode === 'focus' && startTime) {
 saveFocusSession({
 taskId: task.id,
 startedAt: startTime,
 endedAt: new Date().toISOString(),
 plannedMinutes: FOCUS_MINUTES,
 actualMinutes: Math.floor((FOCUS_MINUTES * 60 - timeLeft) / 60),
 completed: true,
 });
 }
 router.push('/');
 }
 };

 const formatTime = (seconds: number) => {
 const m = Math.floor(seconds / 60).toString().padStart(2, '0');
 const s = (seconds % 60).toString().padStart(2, '0');
 return `${m}:${s}`;
 };

 return (
 <div className="space-y-6 max-w-5xl mx-auto">
 <PageHeader
 back="/"
 title="Mode Fokus"
 subtitle="Satu tugas, satu sesi. Tutup yang lain."
 actions={
 <Badge tone={mode === 'focus' ? 'rose' : 'teal'}>
 {mode === 'focus' ? 'Deep Work' : 'Istirahat'}
 </Badge>
 }
 />

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 items-start">
 {/* Left: Timer */}
 <Surface variant={mode === 'focus' ? 'hero' : 'soft'} className="p-8 md:p-10 flex flex-col items-center justify-center space-y-8 aspect-square">
 {/* subtle background glow based on mode */}
 
 <div className="relative z-10 text-center">
 <h2 className="font-display font-light text-[72px] leading-none md:text-8xl tabular-nums tracking-[-0.04em] text-current">
 {formatTime(timeLeft)}
 </h2>
 <p className="mt-4 font-medium opacity-80">
 {mode === 'focus' ? 'Fokus Penuh' : 'Waktu Istirahat'}
 </p>
 </div>
 
 <div className="flex items-center gap-4 relative z-10">
 <Button 
 variant={isActive ? 'secondary' : 'primary'} 
 size="lg" 
 onClick={toggleTimer}
 className="w-32"
 >
 {isActive ? 'Pause' : 'Start'}
 </Button>
 <Button variant="secondary" size="lg" icon="rotateCcw" onClick={resetTimer} title="Reset" />
 </div>
 </Surface>

 {/* Right: Task Details */}
 <div className="space-y-6">
 {task ? (
 <Surface className="p-6 md:p-8 space-y-6">
 <div>
 <Badge tone="amber" className="mb-3">Task Focus</Badge>
 <h2 className="font-display text-2xl font-normal leading-tight">{task.title}</h2>
 {task.description && (
 <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{task.description}</p>
 )}
 </div>

 {(task.definitionOfDone || task.expectedOutput) && (
 <div className="space-y-4 pt-4 border-t border-border">
 {task.definitionOfDone && (
 <div>
 <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
 <Icon name="checkSquare" size={14} className="text-teal-700 dark:text-teal-300" />
 Definition of Done
 </h4>
 <p className="text-sm font-medium">{task.definitionOfDone}</p>
 </div>
 )}
 {task.expectedOutput && (
 <div>
 <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
 <Icon name="package" size={14} className="text-indigo-600 dark:text-indigo-300" />
 Expected Output
 </h4>
 <p className="text-sm font-medium">{task.expectedOutput}</p>
 </div>
 )}
 </div>
 )}

 <div className="pt-6">
 <Button variant="primary" icon="check" size="lg" className="w-full" onClick={finishTask}>
 Selesaikan Tugas
 </Button>
 </div>
 </Surface>
 ) : (
 <Surface className="p-8 text-center">
 <Icon name="target" size={32} className="text-muted-foreground mx-auto mb-4" />
 <h3 className="text-lg font-medium">Fokus Bebas</h3>
 <p className="text-muted-foreground mt-2 text-sm">Anda tidak memilih tugas tertentu. Fokuslah pada apa yang penting saat ini.</p>
 </Surface>
 )}
 </div>
 </div>
 </div>
 );
}
