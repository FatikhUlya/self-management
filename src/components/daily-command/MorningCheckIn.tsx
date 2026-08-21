'use client';
import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { DailyPlan, Task } from '@/lib/hooks/useLifeOSState';

export function MorningCheckIn({ 
  today, 
  onStartDay 
}: { 
  today: string; 
  onStartDay: (plan: Partial<DailyPlan>) => void;
}) {
  const { state } = useLifeOS();
  
  const [dayMode, setDayMode] = useState<'normal' | 'low_energy' | 'sick' | 'emergency'>('normal');
  const [mitTaskId, setMitTaskId] = useState<string>('');
  const [secondaryTaskIds, setSecondaryTaskIds] = useState<string[]>([]);
  const [intention, setIntention] = useState('');

  // Get available tasks that are not done
  const availableTasks = state.tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');

  const toggleSecondaryTask = (taskId: string) => {
    if (secondaryTaskIds.includes(taskId)) {
      setSecondaryTaskIds(prev => prev.filter(id => id !== taskId));
    } else {
      if (secondaryTaskIds.length < 3) {
        setSecondaryTaskIds(prev => [...prev, taskId]);
      }
    }
  };

  const handleStartDay = () => {
    onStartDay({
      date: today,
      dayMode,
      mitTaskId,
      secondaryTaskIds,
      morningCheckin: { intention },
      dayStatus: 'in_progress'
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-life-text">Selamat Pagi.</h1>
        <p className="text-life-muted">Mari atur fokus hari ini sebelum memulai eksekusi.</p>
      </div>

      <Surface className="p-6 space-y-6">
        {/* Day Mode Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-life-text uppercase tracking-wider">Kondisi Hari Ini</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'normal', label: 'Normal', icon: 'sun' },
              { id: 'low_energy', label: 'Low Energy', icon: 'battery' },
              { id: 'sick', label: 'Sakit', icon: 'activity' },
              { id: 'emergency', label: 'Darurat', icon: 'alertTriangle' },
            ].map(mode => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setDayMode(mode.id as any)}
                className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-2 ${
                  dayMode === mode.id
                    ? 'bg-life-indigo-soft/10 border-life-indigo text-indigo-400'
                    : 'bg-white/[0.02] border-life-line text-life-muted hover:border-life-line-strong'
                }`}
              >
                <Icon name={mode.icon as any} size={20} />
                <span className="text-xs font-bold">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MIT Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-life-text uppercase tracking-wider flex items-center gap-2">
            <Icon name="target" size={16} className="text-rose-400" />
            Most Important Task (MIT)
          </label>
          <p className="text-xs text-life-muted">Pilih SATU tugas utama yang paling berdampak hari ini.</p>
          <select 
            value={mitTaskId}
            onChange={(e) => setMitTaskId(e.target.value)}
            className="glass-select w-full"
          >
            <option value="">-- Pilih MIT --</option>
            {availableTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {/* Secondary Tasks Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-life-text uppercase tracking-wider flex items-center gap-2">
            <Icon name="checkSquare" size={16} className="text-teal-400" />
            Secondary Tasks (Maks 3)
          </label>
          <p className="text-xs text-life-muted">Tugas pendukung jika MIT selesai.</p>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
            {availableTasks.filter(t => t.id !== mitTaskId).map(t => {
              const isSelected = secondaryTaskIds.includes(t.id);
              return (
                <div 
                  key={t.id}
                  onClick={() => toggleSecondaryTask(t.id)}
                  className={`p-3 rounded-lg border cursor-pointer select-none transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-life-teal-soft/10 border-life-teal/50 text-teal-300'
                      : 'bg-white/[0.01] border-life-line text-life-text hover:border-life-line-strong'
                  }`}
                >
                  <span className="text-sm truncate">{t.title}</span>
                  {isSelected && <Icon name="check" size={16} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Intention */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-life-text uppercase tracking-wider">Intensi Hari Ini</label>
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Apa yang ingin dicapai secara mental/emosional hari ini?"
            className="glass-input w-full h-24 resize-none"
          />
        </div>

        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
          disabled={!mitTaskId && dayMode === 'normal'}
          onClick={handleStartDay}
          icon="arrowRight"
        >
          Mulai Hari Ini
        </Button>
      </Surface>
    </div>
  );
}
