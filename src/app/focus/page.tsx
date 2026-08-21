'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
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
          startTime,
          endTime: new Date().toISOString(),
          durationMinutes: Math.floor((FOCUS_MINUTES * 60 - timeLeft) / 60),
          type: 'deep_work',
          distractionsCount: 0
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
    <div className="min-h-screen bg-life-bg text-life-text flex flex-col items-center pt-20 px-4">
      {/* Top Navigation */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-12">
        <Button variant="ghost" icon="arrowLeft" onClick={() => router.back()}>
          Kembali
        </Button>
        <div className="flex gap-2">
          <Badge tone={mode === 'focus' ? 'rose' : 'teal'} className="text-sm px-3 py-1">
            {mode === 'focus' ? 'Deep Work' : 'Break'}
          </Badge>
        </div>
      </div>

      <div className="w-full max-w-3xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Timer */}
        <Surface className="p-10 flex flex-col items-center justify-center space-y-8 aspect-square relative overflow-hidden">
          {/* subtle background glow based on mode */}
          <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${mode === 'focus' ? 'bg-rose-500' : 'bg-teal-500'}`} />
          
          <div className="relative z-10 text-center">
            <h2 className="text-8xl font-black tabular-nums tracking-tighter">
              {formatTime(timeLeft)}
            </h2>
            <p className="text-life-muted mt-4 font-medium tracking-widest uppercase">
              {mode === 'focus' ? 'Fokus Penuh' : 'Waktu Istirahat'}
            </p>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <Button 
              variant={isActive ? 'outline' : 'primary'} 
              size="lg" 
              onClick={toggleTimer}
              className="w-32"
            >
              {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button variant="ghost" size="lg" icon="rotateCcw" onClick={resetTimer} title="Reset" />
          </div>
        </Surface>

        {/* Right: Task Details */}
        <div className="space-y-6">
          {task ? (
            <Surface className="p-8 space-y-6">
              <div>
                <Badge tone="amber" className="mb-3">Task Focus</Badge>
                <h1 className="text-2xl font-bold leading-tight">{task.title}</h1>
                {task.description && (
                  <p className="text-life-muted mt-3 text-sm leading-relaxed">{task.description}</p>
                )}
              </div>

              {(task.definitionOfDone || task.expectedOutput) && (
                <div className="space-y-4 pt-4 border-t border-life-line">
                  {task.definitionOfDone && (
                    <div>
                      <h4 className="text-xs font-bold text-life-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Icon name="checkSquare" size={14} className="text-teal-400" />
                        Definition of Done
                      </h4>
                      <p className="text-sm font-medium">{task.definitionOfDone}</p>
                    </div>
                  )}
                  {task.expectedOutput && (
                    <div>
                      <h4 className="text-xs font-bold text-life-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Icon name="package" size={14} className="text-indigo-400" />
                        Expected Output
                      </h4>
                      <p className="text-sm font-medium">{task.expectedOutput}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6">
                <Button variant="primary" icon="check" size="lg" className="w-full bg-teal-500 hover:bg-teal-600 text-white border-none shadow-[0_0_20px_rgba(20,184,166,0.3)]" onClick={finishTask}>
                  Selesaikan Tugas
                </Button>
              </div>
            </Surface>
          ) : (
            <Surface className="p-8 text-center">
              <Icon name="target" size={32} className="text-life-muted mx-auto mb-4" />
              <h3 className="text-lg font-bold">Fokus Bebas</h3>
              <p className="text-life-muted mt-2 text-sm">Anda tidak memilih tugas tertentu. Fokuslah pada apa yang penting saat ini.</p>
            </Surface>
          )}
        </div>
      </div>
    </div>
  );
}
