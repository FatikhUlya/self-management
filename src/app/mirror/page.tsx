'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { SELF_AWARENESS_DOMAINS, FEEDBACK_MIN_RESPONSES } from '@/lib/constants';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { PersonalTraitEvaluation } from '@/components/mirror/PersonalTraitEvaluation';

export default function MirrorDashboard() {
  const { state } = useLifeOS();

  const latestSnapshot = useMemo(() => {
    return state.selfAssessmentSnapshots.length > 0 
      ? state.selfAssessmentSnapshots[0] 
      : null;
  }, [state.selfAssessmentSnapshots]);

  const latestRequest = useMemo(() => {
    return state.feedbackRequests.length > 0 
      ? state.feedbackRequests[0] 
      : null;
  }, [state.feedbackRequests]);

  const activeGoals = state.growthGoals.filter(g => g.progress < 100 && g.status !== 'stopped');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600 dark:from-indigo-300 dark:to-purple-500 flex items-center gap-2">
            <Icon name="lightbulb" size={28} className="text-indigo-500" />
            Self-Awareness Mirror
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Eksplorasi diri melalui refleksi pribadi dan feedback anonim dari rekan Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/mirror/new">
            <Button variant="primary" icon="plus" className="text-xs">
              Refleksi Baru
            </Button>
          </Link>
          <Link href="/mirror/feedback">
            <Button variant="secondary" icon="mail" className="text-xs">
              Minta Feedback
            </Button>
          </Link>
          <Link href="/mirror/goals">
            <Button variant="secondary" icon="target" className="text-xs">
              Growth Goals
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Latest Snapshot & Goals Snapshot */}
        <div className="lg:col-span-1 space-y-6">
          <Surface className="p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              Refleksi Terakhir
            </h3>
            {latestSnapshot ? (
              <div className="space-y-4">
                <div>
                  <Badge tone="indigo">{latestSnapshot.periodLabel}</Badge>
                  <p className="text-xs text-zinc-400 mt-2">
                    {formatDate(latestSnapshot.periodStart)} - {formatDate(latestSnapshot.periodEnd)}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase">Kesimpulan Utama</h4>
                  <p className="text-sm text-white mt-1 line-clamp-4">
                    {latestSnapshot.overallReflection || 'Tidak ada kesimpulan.'}
                  </p>
                </div>
                <Link href="/mirror/new" className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-bold mt-2">
                  Lihat / Edit Refleksi →
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <Icon name="edit" size={24} className="mx-auto text-zinc-600 mb-2" />
                <p className="text-xs text-zinc-400">Belum ada refleksi.</p>
              </div>
            )}
          </Surface>

          <Surface className="p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
              Growth Goals Aktif
            </h3>
            {activeGoals.length > 0 ? (
              <div className="space-y-3">
                {activeGoals.slice(0, 3).map(goal => {
                  const domain = SELF_AWARENESS_DOMAINS.find(d => d.key === goal.domainKey);
                  return (
                    <div key={goal.id} className="p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-white">{domain?.label}</span>
                        <span className="text-[10px] font-bold text-teal-400">{goal.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-500 rounded-full" 
                          style={{ width: `${goal.progress}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
                <Link href="/mirror/goals" className="block text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-bold mt-2 text-center">
                  Lihat Semua Goals →
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-zinc-400 mb-2">Belum ada Growth Goal aktif.</p>
                <Link href="/mirror/goals">
                  <Button variant="secondary" size="sm" className="w-full text-[10px]">Buat Goal Baru</Button>
                </Link>
              </div>
            )}
          </Surface>
        </div>

        {/* Right Col: Personal Trait Evaluation */}
        <div className="lg:col-span-2">
          <Surface className="p-6 h-[600px] flex flex-col">
            <PersonalTraitEvaluation />
          </Surface>
        </div>
      </div>
    </div>
  );
}
