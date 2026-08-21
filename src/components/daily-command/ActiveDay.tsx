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
          <h1 className="text-3xl font-bold text-life-text flex items-center gap-2">
            <Icon name="sun" size={28} className="text-amber-500" />
            Eksekusi Harian
          </h1>
          <p className="text-life-muted mt-1">
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
            <Surface className="p-6 border-l-4 border-l-rose-500">
              <div className="flex justify-between items-start mb-4">
                <Badge tone="rose">Most Important Task</Badge>
                {mit.status === 'done' && (
                  <Badge tone="green">Selesai</Badge>
                )}
              </div>
              <h2 className={`text-xl font-bold ${mit.status === 'done' ? 'line-through text-life-muted' : 'text-life-text'}`}>
                {mit.title}
              </h2>
              {mit.description && (
                <p className="text-sm text-life-muted mt-2">{mit.description}</p>
              )}
              
              <div className="mt-6 flex gap-3">
                {mit.status !== 'done' ? (
                  <>
                    <Button variant="primary" icon="check" onClick={() => updateTaskStatus(mit.id, 'done')} className="flex-1">
                      Selesaikan
                    </Button>
                    <Link href={`/focus?taskId=${mit.id}`} className="flex-1">
                      <Button variant="outline" icon="clock" className="w-full">
                        Fokus
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Button variant="outline" icon="rotateCcw" onClick={() => updateTaskStatus(mit.id, 'todo')}>
                    Batal Selesai
                  </Button>
                )}
              </div>
            </Surface>
          )}

          {secondaryTasks.length > 0 && (
            <Surface className="p-6">
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider mb-4 flex items-center gap-2">
                <Icon name="checkSquare" size={16} className="text-teal-400" />
                Secondary Tasks
              </h3>
              <div className="space-y-3">
                {secondaryTasks.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-life-line bg-white/[0.01]">
                    <span className={`text-sm ${t.status === 'done' ? 'line-through text-life-muted' : 'text-life-text'}`}>
                      {t.title}
                    </span>
                    <button
                      onClick={() => updateTaskStatus(t.id, t.status === 'done' ? 'todo' : 'done')}
                      className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${
                        t.status === 'done' 
                          ? 'bg-life-teal border-life-teal text-white' 
                          : 'border-life-line text-transparent hover:border-life-teal hover:text-life-teal'
                      }`}
                    >
                      <Icon name="check" size={12} />
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
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider mb-2 flex items-center gap-2">
                <Icon name="compass" size={16} className="text-indigo-400" />
                Intensi Hari Ini
              </h3>
              <p className="text-sm text-life-text italic bg-indigo-500/5 p-4 rounded-lg border border-indigo-500/10">
                "{todayPlan.morningCheckin.intention}"
              </p>
            </Surface>
          )}

          <Surface className="p-6">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider mb-4 flex items-center gap-2">
              <Icon name="shield" size={16} className="text-amber-400" />
              Sistem Pengingat
            </h3>
            <p className="text-sm text-life-muted mb-4">
              Patuhi aturan yang sudah dibuat agar sistem berjalan lancar.
            </p>
            <div className="space-y-3">
              {state.selfRules.slice(0, 3).map(rule => (
                <div key={rule.id} className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-sm text-life-text">
                  {rule.rule_text}
                </div>
              ))}
            </div>
            <Link href="/rules" className="block mt-4 text-xs text-indigo-400 hover:underline">
              Lihat semua aturan &rarr;
            </Link>
          </Surface>
        </div>
      </div>
    </div>
  );
}
