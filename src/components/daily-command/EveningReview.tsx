'use client';
import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { DailyPlan } from '@/lib/hooks/useLifeOSState';
import { Icon } from '@/components/ui/Icon';

export function EveningReview({ 
  todayPlan, 
  onCloseDay 
}: { 
  todayPlan: DailyPlan; 
  onCloseDay: (plan: Partial<DailyPlan>) => void;
}) {
  const { state, addRuleComplianceLog } = useLifeOS();
  const [distractionNotes, setDistractionNotes] = useState(todayPlan.distractionNotes || '');
  const [wins, setWins] = useState('');
  const [lessons, setLessons] = useState('');
  const [ruleCompliance, setRuleCompliance] = useState<Record<string, 'followed' | 'broken' | 'not_applicable'>>({});

  const mit = state.tasks.find(t => t.id === todayPlan.mitTaskId);
  
  const handleCloseDay = async () => {
    // Save rule compliance logs
    for (const ruleId of Object.keys(ruleCompliance)) {
      const status = ruleCompliance[ruleId];
      if (status !== 'not_applicable') {
        await addRuleComplianceLog({
          ruleId,
          date: todayPlan.date,
          status: status,
          notes: ''
        });
      }
    }

    onCloseDay({
      date: todayPlan.date,
      dayStatus: 'day_closed',
      distractionNotes,
      dailyReview: { wins, lessons }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-life-text">Evening Review</h1>
        <p className="text-life-muted">Waktunya mengevaluasi eksekusi hari ini.</p>
      </div>

      <Surface className="p-6 space-y-6">
        {/* Execution Summary */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider border-b border-life-line pb-2">
            Ringkasan Eksekusi
          </h3>
          
          <div className="flex items-center justify-between p-3 rounded-lg border border-life-line bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <Icon name="target" size={20} className="text-rose-400" />
              <div>
                <p className="text-xs text-life-muted">MIT Hari Ini</p>
                <p className="text-sm font-bold text-life-text">{mit ? mit.title : 'Tidak ada MIT'}</p>
              </div>
            </div>
            {mit && (
              <span className={`text-xs font-bold px-2 py-1 rounded ${mit.status === 'done' ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {mit.status === 'done' ? 'SELESAI' : 'TIDAK SELESAI'}
              </span>
            )}
          </div>
        </div>

        {/* Distractions */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-life-text uppercase tracking-wider flex items-center gap-2">
            <Icon name="alertTriangle" size={16} className="text-amber-400" />
            Distraksi & Hambatan
          </label>
          <p className="text-xs text-life-muted">Apa yang membuat fokus terpecah hari ini?</p>
          <textarea
            value={distractionNotes}
            onChange={(e) => setDistractionNotes(e.target.value)}
            placeholder="Contoh: Terlalu banyak scroll sosmed, ada rapat dadakan..."
            className="glass-input w-full h-24 resize-none"
          />
        </div>

        {/* Reflection */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider border-b border-life-line pb-2 flex items-center gap-2">
            <Icon name="moon" size={16} className="text-indigo-400" />
            Refleksi
          </h3>
          
          <div className="space-y-3">
            <label className="text-xs font-bold text-life-muted">Wins (Pencapaian)</label>
            <textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="Apa hal baik yang terjadi hari ini?"
              className="glass-input w-full h-20 resize-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-life-muted">Lessons (Pelajaran)</label>
            <textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="Apa yang bisa diperbaiki untuk besok?"
              className="glass-input w-full h-20 resize-none"
            />
          </div>
        </div>

        {/* Rule Compliance */}
        {state.selfRules.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider border-b border-life-line pb-2 flex items-center gap-2">
              <Icon name="shield" size={16} className="text-emerald-400" />
              Evaluasi Aturan (Rules)
            </h3>
            
            <div className="space-y-2">
              {state.selfRules.map(rule => (
                <div key={rule.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-life-line bg-white/[0.01]">
                  <span className="text-sm text-life-text">{rule.rule_text}</span>
                  <div className="flex bg-white/[0.02] border border-life-line rounded-lg p-0.5 shrink-0">
                    <button
                      onClick={() => setRuleCompliance(prev => ({ ...prev, [rule.id]: 'not_applicable' }))}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        ruleCompliance[rule.id] === 'not_applicable' || !ruleCompliance[rule.id]
                          ? 'bg-zinc-500/20 text-zinc-300' : 'text-life-muted hover:text-life-text'
                      }`}
                    >
                      N/A
                    </button>
                    <button
                      onClick={() => setRuleCompliance(prev => ({ ...prev, [rule.id]: 'followed' }))}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        ruleCompliance[rule.id] === 'followed' 
                          ? 'bg-emerald-500/20 text-emerald-400' : 'text-life-muted hover:text-life-text'
                      }`}
                    >
                      Dipatuhi
                    </button>
                    <button
                      onClick={() => setRuleCompliance(prev => ({ ...prev, [rule.id]: 'broken' }))}
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        ruleCompliance[rule.id] === 'broken' 
                          ? 'bg-rose-500/20 text-rose-400' : 'text-life-muted hover:text-life-text'
                      }`}
                    >
                      Dilanggar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          variant="primary" 
          size="lg" 
          className="w-full"
          onClick={handleCloseDay}
          icon="checkSquare"
        >
          Tutup Hari Ini
        </Button>
      </Surface>
    </div>
  );
}
