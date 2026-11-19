'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { SELF_AWARENESS_DOMAINS, GROWTH_GOAL_STATUSES, FEEDBACK_MIN_RESPONSES } from '@/lib/constants';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { PersonalTraitEvaluation } from '@/components/mirror/PersonalTraitEvaluation';

type MirrorTab = 'traits' | 'snapshots' | 'feedback' | 'goals';

export default function MirrorDashboard() {
  const { 
    state, 
    toggleGrowthGoalMilestone,
    closeFeedbackRequest 
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<MirrorTab>('traits');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [goalFilter, setGoalFilter] = useState<'all' | 'in_progress' | 'achieved'>('all');
  const [traitCount, setTraitCount] = useState<number>(0);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('personal_traits_evaluation');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTraitCount(parsed.length);
        }
      }
    } catch {}
  }, []);

  const latestSnapshot = useMemo(() => {
    return state.selfAssessmentSnapshots.length > 0 
      ? state.selfAssessmentSnapshots[0] 
      : null;
  }, [state.selfAssessmentSnapshots]);

  const latestSnapshotDomains = useMemo(() => {
    if (!latestSnapshot) return [];
    return state.selfAssessmentDomains.filter(d => d.snapshotId === latestSnapshot.id);
  }, [latestSnapshot, state.selfAssessmentDomains]);

  const activeGoals = useMemo(() => {
    return state.growthGoals.filter(g => g.progress < 100 && g.status !== 'stopped');
  }, [state.growthGoals]);

  const filteredGoals = useMemo(() => {
    if (goalFilter === 'all') return state.growthGoals;
    return state.growthGoals.filter(g => g.status === goalFilter);
  }, [state.growthGoals, goalFilter]);

  const activeFeedbackRequests = useMemo(() => {
    return state.feedbackRequests.filter(r => r.status === 'open');
  }, [state.feedbackRequests]);

  const handleCopy = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/f/${token}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const avgGoalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.025em] leading-[1.15] text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Icon name="lightbulb" size={22} />
            </div>
            Self-Awareness Mirror
          </h1>
          <p className="text-sm leading-[1.6] text-zinc-600 dark:text-zinc-400 mt-1 max-w-prose">
            Eksplorasi diri melalui evaluasi sifat, refleksi berkala, feedback rekan 360°, dan target pertumbuhan karakter.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/mirror/new">
            <Button variant="primary" icon="plus" size="sm">
              Refleksi Baru
            </Button>
          </Link>
          <Link href="/mirror/feedback">
            <Button variant="secondary" icon="mail" size="sm">
              Minta Feedback
            </Button>
          </Link>
          <Link href="/mirror/goals">
            <Button variant="secondary" icon="target" size="sm">
              Kelola Goals
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Surface className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Icon name="star" size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Sifat Dipetakan</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {traitCount}
            </div>
          </div>
        </Surface>

        <Surface className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Icon name="journal" size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Snapshot Refleksi</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {state.selfAssessmentSnapshots.length}
            </div>
          </div>
        </Surface>

        <Surface className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Icon name="mail" size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Feedback Terkumpul</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {state.feedbackResponses?.length || 0}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                ({activeFeedbackRequests.length} aktif)
              </span>
            </div>
          </div>
        </Surface>

        <Surface className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
            <Icon name="target" size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Growth Goals</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {activeGoals.length}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                (avg {avgGoalProgress}%)
              </span>
            </div>
          </div>
        </Surface>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-border gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('traits')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'traits'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="star" size={16} />
          Evaluasi Sifat & Blindspots
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'snapshots'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="journal" size={16} />
          Snapshot Diri ({state.selfAssessmentSnapshots.length})
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'feedback'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="mail" size={16} />
          Feedback Rekan ({state.feedbackRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('goals')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'goals'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="target" size={16} />
          Target Pertumbuhan ({state.growthGoals.length})
        </button>
      </div>

      {/* TAB CONTENT: TRAITS EVALUATION */}
      {activeTab === 'traits' && (
        <Surface className="p-6">
          <PersonalTraitEvaluation />
        </Surface>
      )}

      {/* TAB CONTENT: SNAPSHOTS */}
      {activeTab === 'snapshots' && (
        <div className="space-y-6">
          {latestSnapshot ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Latest snapshot highlight */}
              <Surface className="p-6 lg:col-span-2 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-foreground">
                        {latestSnapshot.periodLabel}
                      </span>
                      <Badge tone="indigo">{latestSnapshot.periodType}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(latestSnapshot.periodStart)} — {formatDate(latestSnapshot.periodEnd)}
                    </p>
                  </div>
                  <Link href="/mirror/new">
                    <Button variant="secondary" size="sm" icon="edit">
                      Edit / Baru
                    </Button>
                  </Link>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Kesimpulan & Refleksi Utama
                  </h4>
                  <div className="p-4 rounded-xl bg-muted/20 border border-border text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {latestSnapshot.overallReflection || 'Belum ada catatan refleksi umum.'}
                  </div>
                </div>

                {/* Domain evaluation cards */}
                {latestSnapshotDomains.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                      Nilai Domain Terpilih ({latestSnapshotDomains.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {latestSnapshotDomains.map(d => {
                        const domainDef = SELF_AWARENESS_DOMAINS.find(item => item.key === d.domainKey);
                        return (
                          <div key={d.id} className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">
                                {domainDef?.label || d.domainLabel}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {d.rating} / 5
                              </span>
                            </div>
                            {d.strengthObservation && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                <span className="text-teal-400 font-medium">Kekuatan:</span> {d.strengthObservation}
                              </p>
                            )}
                            {d.growthObservation && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                <span className="text-amber-400 font-medium">Area Tumbuh:</span> {d.growthObservation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Surface>

              {/* Snapshot History Sidebar */}
              <Surface className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Riwayat Refleksi
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {state.selfAssessmentSnapshots.length} snapshot
                  </span>
                </div>

                <div className="space-y-3">
                  {state.selfAssessmentSnapshots.map(snap => (
                    <div 
                      key={snap.id}
                      className="p-3 rounded-xl border border-border bg-muted/20 hover:border-border-strong transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{snap.periodLabel}</span>
                        <span className="text-[10px] text-muted-foreground">{snap.periodType}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {snap.overallReflection || 'Tidak ada catatan kesimpulan.'}
                      </p>
                      <div className="text-[10px] text-muted-foreground mt-2">
                        {formatDate(snap.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          ) : (
            <Surface className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <Icon name="journal" size={24} />
              </div>
              <h3 className="text-base font-bold text-foreground">Belum Ada Snapshot Refleksi Diri</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Lakukan refleksi berkala mingguan atau bulanan untuk menilai pertumbuhan domain kepemimpinan, komunikasi, dan kesehatan mental Anda.
              </p>
              <div className="pt-2">
                <Link href="/mirror/new">
                  <Button variant="primary" icon="plus" size="sm">
                    Mulai Refleksi Pertama
                  </Button>
                </Link>
              </div>
            </Surface>
          )}
        </div>
      )}

      {/* TAB CONTENT: FEEDBACK REKAN */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Permintaan Feedback 360°</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bagikan tautan anonim kepada rekan atau mentor untuk mendapatkan penilaian yang jujur.
              </p>
            </div>
            <Link href="/mirror/feedback">
              <Button variant="primary" icon="plus" size="sm">
                Buat Permintaan Baru
              </Button>
            </Link>
          </div>

          {state.feedbackRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.feedbackRequests.map(req => {
                const responses = state.feedbackResponses.filter(r => r.requestId === req.id);
                const isCopied = copiedToken === req.token;

                return (
                  <Surface key={req.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{req.title}</h4>
                          <Badge tone={req.status === 'open' ? 'teal' : 'gray'}>
                            {req.status === 'open' ? 'Aktif' : 'Ditutup'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Mode: <span className="font-medium text-foreground">{req.privacyMode}</span>
                          {req.deadline && ` • Batas: ${formatDate(req.deadline)}`}
                        </p>
                      </div>

                      {req.status === 'open' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => closeFeedbackRequest(req.id)}
                          className="text-xs text-muted-foreground hover:text-rose-400"
                        >
                          Tutup
                        </Button>
                      )}
                    </div>

                    {/* Domain tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {req.domains.map(domKey => {
                        const dom = SELF_AWARENESS_DOMAINS.find(d => d.key === domKey);
                        return (
                          <span 
                            key={domKey} 
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/40 text-muted-foreground border border-border"
                          >
                            {dom?.label || domKey}
                          </span>
                        );
                      })}
                    </div>

                    {/* Shareable Link row */}
                    {req.status === 'open' && (
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-muted-foreground truncate">
                          /f/{req.token}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon="copy"
                          onClick={() => handleCopy(req.token)}
                          className="shrink-0 text-xs"
                        >
                          {isCopied ? 'Tersalin!' : 'Salin Link'}
                        </Button>
                      </div>
                    )}

                    {/* Responses status */}
                    <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                      <span>{responses.length} respons masuk</span>
                      {responses.length < FEEDBACK_MIN_RESPONSES && (
                        <span className="text-amber-400 text-[11px]">
                          Min. {FEEDBACK_MIN_RESPONSES} untuk sintesis AI
                        </span>
                      )}
                    </div>
                  </Surface>
                );
              })}
            </div>
          ) : (
            <Surface className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                <Icon name="mail" size={24} />
              </div>
              <h3 className="text-base font-bold text-foreground">Belum Ada Permintaan Feedback</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Buat formulir feedback dan bagikan link rahasia kepada rekan kerja atau teman Anda untuk mendengar perspektif objektif.
              </p>
              <div className="pt-2">
                <Link href="/mirror/feedback">
                  <Button variant="primary" icon="plus" size="sm">
                    Buat Permintaan Sekarang
                  </Button>
                </Link>
              </div>
            </Surface>
          )}
        </div>
      )}

      {/* TAB CONTENT: GROWTH GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 bg-muted/20 border border-border rounded-xl">
              <button
                onClick={() => setGoalFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  goalFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Semua ({state.growthGoals.length})
              </button>
              <button
                onClick={() => setGoalFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  goalFilter === 'in_progress'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Berjalan ({activeGoals.length})
              </button>
              <button
                onClick={() => setGoalFilter('achieved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  goalFilter === 'achieved'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tercapai ({state.growthGoals.filter(g => g.status === 'achieved').length})
              </button>
            </div>

            <Link href="/mirror/goals">
              <Button variant="primary" icon="plus" size="sm">
                Buat Goal Baru
              </Button>
            </Link>
          </div>

          {filteredGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGoals.map(goal => {
                const domain = SELF_AWARENESS_DOMAINS.find(d => d.key === goal.domainKey);
                const statusMeta = GROWTH_GOAL_STATUSES.find(s => s.id === goal.status);
                const milestones = state.growthGoalMilestones.filter(m => m.goalId === goal.id);

                return (
                  <Surface key={goal.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {domain?.label || 'General Growth'}
                          </span>
                          <Badge tone={statusMeta?.tone || 'gray'}>
                            {statusMeta?.label || goal.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sumber: <span className="font-medium capitalize text-foreground">{goal.source}</span>
                          {goal.targetDate && ` • Target: ${formatDate(goal.targetDate)}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {goal.progress}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>

                    {/* States */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-muted/20 border border-border">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block">Kondisi Sekarang</span>
                        <p className="text-foreground mt-0.5 line-clamp-2">{goal.currentState}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-teal-500/5 border border-teal-500/20">
                        <span className="text-[10px] text-teal-400 font-bold uppercase block">Kondisi Target</span>
                        <p className="text-foreground mt-0.5 line-clamp-2">{goal.targetState}</p>
                      </div>
                    </div>

                    {/* SMART details */}
                    {goal.smartSpecific && (
                      <div className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3 py-0.5">
                        <span className="font-semibold text-foreground">Tindakan Spesifik:</span> {goal.smartSpecific}
                      </div>
                    )}

                    {/* Milestones checklist */}
                    {milestones.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Milestones ({milestones.filter(m => m.isCompleted).length}/{milestones.length})
                        </span>
                        <div className="space-y-1">
                          {milestones.map(m => (
                            <button
                              key={m.id}
                              onClick={() => toggleGrowthGoalMilestone(m.id)}
                              className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/30 text-left transition-colors"
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                m.isCompleted
                                  ? 'bg-teal-500 border-teal-500 text-white'
                                  : 'border-border bg-card'
                              }`}>
                                {m.isCompleted && <Icon name="check" size={12} />}
                              </div>
                              <span className={`text-xs ${
                                m.isCompleted
                                  ? 'line-through text-muted-foreground'
                                  : 'text-foreground'
                              }`}>
                                {m.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </Surface>
                );
              })}
            </div>
          ) : (
            <Surface className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto">
                <Icon name="target" size={24} />
              </div>
              <h3 className="text-base font-bold text-foreground">Belum Ada Target Pertumbuhan</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Buat SMART Growth Goal berdasarkan evaluasi sifat atau feedback rekan untuk memandu progres Anda.
              </p>
              <div className="pt-2">
                <Link href="/mirror/goals">
                  <Button variant="primary" icon="plus" size="sm">
                    Buat Goal Baru
                  </Button>
                </Link>
              </div>
            </Surface>
          )}
        </div>
      )}
    </div>
  );
}
