'use client';
import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Button } from '@/components/ui/Button';
import { DailyPlan } from '@/lib/hooks/useLifeOSState';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

export function EveningReview({ 
  todayPlan, 
  onCloseDay 
}: { 
  todayPlan: DailyPlan; 
  onCloseDay: (plan: Partial<DailyPlan>) => void;
}) {
  const { state, addRuleComplianceLog } = useLifeOS();
  const [rating, setRating] = useState<number>(3);
  const [note, setNote] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [ruleCompliance, setRuleCompliance] = useState<Record<string, 'followed' | 'missed' | 'not_applicable'>>({});

  const mit = state.tasks.find(t => t.id === todayPlan.mitTaskId);
  
  const handleCloseDay = async () => {
    // Save rule compliance logs
    for (const ruleId of Object.keys(ruleCompliance)) {
      const status = ruleCompliance[ruleId];
      if (status !== 'not_applicable') {
        await addRuleComplianceLog({
          ruleId,
          date: todayPlan.date,
          status: status
        });
      }
    }

    onCloseDay({
      date: todayPlan.date,
      dayStatus: 'day_closed',
      distractionNotes: '',
      dailyReview: { wins: note, lessons: `Rating: ${rating}/5` }
    });
  };

  return (
    <div className="p-5 rounded-xl border border-border bg-card text-card-foreground shadow-sm relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 tracking-tight">
            <span className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Icon name="moon" size={14} />
            </span>
            Akhiri Hari (Review Malam)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Evaluasi singkat pencapaian dan refleksi hari ini.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* MIT Status */}
        {mit && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <Icon name="target" size={14} className="text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground truncate">{mit.title}</span>
            </div>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
              mit.status === 'done' 
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            )}>
              {mit.status === 'done' ? 'Selesai' : 'Belum Selesai'}
            </span>
          </div>
        )}

        {/* Rating */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rating Kepuasan Hari Ini</label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={cn(
                  "w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all text-xs",
                  rating >= star 
                    ? "bg-amber-500 text-white shadow-2xs" 
                    : "bg-muted/40 border border-border text-muted-foreground hover:border-amber-500/50 hover:text-amber-500"
                )}
              >
                <Icon name="star" size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* Single Note */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pencapaian Terbaik / Catatan</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Apa hal terbaik atau pelajaran penting hari ini?"
            className="glass-input w-full h-16 resize-none text-xs"
          />
        </div>

        {/* Rule Compliance (Collapsible) */}
        {state.selfRules.length > 0 && (
          showRules ? (
            <div className="space-y-2.5 pt-3 border-t border-border animate-in fade-in">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="shield" size={12} className="text-primary" />
                Evaluasi Prinsip Hidup
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {state.selfRules.map(rule => (
                  <div key={rule.id} className="flex flex-col gap-1 p-2 rounded-lg border border-border bg-muted/20">
                    <span className="text-xs text-foreground truncate">{rule.rule_text}</span>
                    <div className="flex bg-muted/60 border border-border rounded-md p-0.5 gap-1">
                      <button
                        onClick={() => setRuleCompliance(prev => ({ ...prev, [rule.id]: 'not_applicable' }))}
                        className={cn(
                          "flex-1 py-0.5 rounded text-[10px] font-medium uppercase transition-all",
                          ruleCompliance[rule.id] === 'not_applicable' || !ruleCompliance[rule.id]
                            ? "bg-background text-foreground shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        N/A
                      </button>
                      <button
                        onClick={() => setRuleCompliance(prev => ({ ...prev, [rule.id]: 'followed' }))}
                        className={cn(
                          "flex-1 py-0.5 rounded text-[10px] font-medium uppercase transition-all",
                          ruleCompliance[rule.id] === 'followed' 
                            ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Dipatuhi
                      </button>
                      <button
                        onClick={() => setRuleCompliance(prev => ({ ...prev, [rule.id]: 'missed' }))}
                        className={cn(
                          "flex-1 py-0.5 rounded text-[10px] font-medium uppercase transition-all",
                          ruleCompliance[rule.id] === 'missed' 
                            ? "bg-destructive text-destructive-foreground shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Terlewat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={() => setShowRules(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Icon name="chevronUp" size={13} /> Sembunyikan rules
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              onClick={() => setShowRules(true)}
              className="text-xs text-primary hover:underline transition-colors flex items-center gap-1 font-medium"
            >
              <Icon name="chevronDown" size={13} /> Evaluasi Rules (Opsional)
            </button>
          )
        )}

        <Button 
          variant="primary" 
          size="sm" 
          className="w-full"
          onClick={handleCloseDay}
          icon="checkSquare"
        >
          Selesaikan & Tutup Hari Ini
        </Button>
      </div>
    </div>
  );
}
