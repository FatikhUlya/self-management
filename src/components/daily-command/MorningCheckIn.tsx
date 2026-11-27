'use client';
import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { DailyPlan } from '@/lib/hooks/useLifeOSState';
import { cn } from '@/lib/utils';

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
  const [showOptions, setShowOptions] = useState(false);

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
    <div className="p-5 rounded-xl border border-border bg-card text-card-foreground shadow-sm relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Icon name="sun" size={14} />
            </span>
            Mulai Hari Ini (Check-in Pagi)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Tentukan satu fokus utama (MIT) untuk memulai hari Anda.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Mandatory: MIT */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground ">
            Prioritas Utama Hari Ini (MIT)
          </label>
          <select 
            value={mitTaskId}
            onChange={(e) => setMitTaskId(e.target.value)}
            className="glass-select w-full text-xs font-medium"
          >
            <option value="">-- Pilih Tugas Utama --</option>
            {availableTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {/* Collapsible Options */}
        {showOptions ? (
          <div className="space-y-3 pt-3 border-t border-border animate-in fade-in">
            {/* Day Mode */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground ">Kondisi Fisik / Energi</label>
              <div className="flex gap-2">
                {[
                  { id: 'normal', icon: 'sun', label: 'Bugar' },
                  { id: 'low_energy', icon: 'battery', label: 'Lelah' },
                  { id: 'sick', icon: 'activity', label: 'Sakit' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDayMode(mode.id as any)}
                    className={cn(
                      "p-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1.5 flex-1 text-xs font-medium",
                      dayMode === mode.id
                        ? "bg-primary/10 border-primary/30 text-primary font-semibold shadow-2xs"
                        : "bg-muted/40 border-border text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    <Icon name={mode.icon as any} size={14} />
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary Tasks */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground ">Tugas Pendukung (Maksimal 3)</label>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {availableTasks.filter(t => t.id !== mitTaskId).map(t => {
                  const isSelected = secondaryTaskIds.includes(t.id);
                  return (
                    <div 
                      key={t.id}
                      onClick={() => toggleSecondaryTask(t.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border cursor-pointer select-none transition-colors flex items-center justify-between text-xs",
                        isSelected
                          ? "bg-primary/10 border-primary/30 text-primary font-medium"
                          : "bg-muted/30 border-border text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span className="truncate">{t.title}</span>
                      {isSelected && <Icon name="check" size={13} className="text-primary shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Intention */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground ">Intensi / Mindset Hari Ini</label>
              <input
                type="text"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="Fokus pada hal penting, jangan terdistraksi"
                className="glass-input w-full text-xs" aria-label="Fokus pada hal penting, jangan terdistraksi"
/>
            </div>
            
            <button 
              type="button" 
              onClick={() => setShowOptions(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Icon name="chevronUp" size={13} /> Sembunyikan opsi
            </button>
          </div>
        ) : (
          <button 
            type="button" 
            onClick={() => setShowOptions(true)}
            className="text-xs text-primary hover:underline transition-colors flex items-center gap-1 font-medium"
          >
            <Icon name="chevronDown" size={13} /> Opsi tambahan (Kondisi fisik, intensi, dll)
          </button>
        )}

        <Button 
          variant="primary" 
          size="sm" 
          className="w-full"
          disabled={!mitTaskId && dayMode === 'normal'}
          onClick={handleStartDay}
          icon="arrowRight"
        >
          Mulai Hari Ini
        </Button>
      </div>
    </div>
  );
}
