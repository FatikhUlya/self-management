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

  // Aggregate Johari Window data
  const johariData = useMemo(() => {
    if (!latestSnapshot || !latestRequest) return null;

    const responses = state.feedbackResponses.filter(r => r.requestId === latestRequest.id);
    // Enforce anonymity threshold
    if (responses.length < FEEDBACK_MIN_RESPONSES && latestRequest.privacyMode === 'anonymous') {
      return { status: 'waiting_for_responses', count: responses.length, min: FEEDBACK_MIN_RESPONSES };
    }

    const selfDomains = state.selfAssessmentDomains.filter(d => d.snapshotId === latestSnapshot.id);
    const feedbackDomains = state.feedbackResponseDomains.filter(d => 
      responses.some(r => r.id === d.responseId)
    );

    const quadrants = {
      open: [] as Array<typeof SELF_AWARENESS_DOMAINS[number]>,
      hidden: [] as Array<typeof SELF_AWARENESS_DOMAINS[number]>,
      blind: [] as Array<typeof SELF_AWARENESS_DOMAINS[number]>,
      growth: [] as Array<typeof SELF_AWARENESS_DOMAINS[number]>
    };

    SELF_AWARENESS_DOMAINS.forEach(domainDef => {
      const selfD = selfDomains.find(d => d.domainKey === domainDef.key);
      const fd = feedbackDomains.filter(d => d.domainKey === domainDef.key);
      
      if (!selfD && fd.length === 0) return;

      const selfScore = selfD ? selfD.rating : 0;
      const feedbackScore = fd.length > 0 ? fd.reduce((acc, curr) => acc + curr.rating, 0) / fd.length : 0;

      // Threshold is 4.0 out of 5 for a "Strength"
      const isSelfStrength = selfScore >= 4;
      const isOthersStrength = feedbackScore >= 4;

      if (selfScore > 0 && feedbackScore > 0) {
        if (isSelfStrength && isOthersStrength) quadrants.open.push(domainDef);
        else if (isSelfStrength && !isOthersStrength) quadrants.hidden.push(domainDef);
        else if (!isSelfStrength && isOthersStrength) quadrants.blind.push(domainDef);
        else quadrants.growth.push(domainDef);
      }
    });

    return { status: 'ready', quadrants, responseCount: responses.length };
  }, [latestSnapshot, latestRequest, state.feedbackResponses, state.selfAssessmentDomains, state.feedbackResponseDomains]);

  const activeGoals = state.growthGoals.filter(g => g.progress < 100 && g.status !== 'stopped');
  const quadrants = johariData?.status === 'ready' ? johariData.quadrants : null;

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

        {/* Right Col: Johari Window */}
        <div className="lg:col-span-2">
          <Surface className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Icon name="grid" size={16} className="text-indigo-400" />
                  Johari Window Analysis
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Perbandingan penilaian diri Anda vs. persepsi orang lain (berdasarkan data terbaru).
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {!johariData ? (
                <div className="text-center py-10">
                  <Icon name="grid" size={48} className="mx-auto text-zinc-800 mb-4" />
                  <h4 className="text-sm font-bold text-zinc-300 mb-2">Data Belum Lengkap</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Untuk melihat Johari Window, Anda harus menyelesaikan setidaknya 1 Refleksi Diri dan mendapatkan feedback dari rekan.
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <Link href="/mirror/new">
                      <Button variant="secondary" size="sm" className="text-[10px]">Isi Refleksi</Button>
                    </Link>
                    <Link href="/mirror/feedback">
                      <Button variant="secondary" size="sm" className="text-[10px]">Minta Feedback</Button>
                    </Link>
                  </div>
                </div>
              ) : johariData.status === 'waiting_for_responses' ? (
                <div className="text-center py-10">
                  <div className="inline-flex w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 items-center justify-center mb-4 border border-indigo-500/30">
                    <span className="text-xl font-bold">{johariData.count}/{johariData.min}</span>
                  </div>
                  <h4 className="text-sm font-bold text-indigo-300 mb-2">Menunggu Feedback</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Demi menjaga anonimitas, hasil akan ditampilkan setelah minimal {johariData.min} rekan mengisi form feedback Anda.
                  </p>
                </div>
              ) : johariData.status === 'ready' ? (
                <div className="grid grid-cols-2 gap-4 h-full min-h-[300px]">
                  {/* Open Arena */}
                  <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4 flex flex-col">
                    <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">
                      Open Arena (Area Terbuka)
                    </h4>
                    <p className="text-[10px] text-teal-400/70 mb-3 line-clamp-2">Kekuatan yang disadari oleh Anda dan diakui oleh rekan-rekan.</p>
                    <div className="flex-1 flex flex-wrap gap-2 content-start">
                      {quadrants?.open.map(d => (
                        <Badge key={d.key} tone="teal" className="text-[10px] py-1 px-2">{d.label}</Badge>
                      ))}
                      {quadrants?.open.length === 0 && <span className="text-xs text-zinc-500 italic">Kosong</span>}
                    </div>
                  </div>

                  {/* Blind Spot */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                      Blind Spot (Titik Buta)
                    </h4>
                    <p className="text-[10px] text-amber-400/70 mb-3 line-clamp-2">Potensi/Kekuatan yang dilihat orang lain, namun mungkin tidak Anda sadari.</p>
                    <div className="flex-1 flex flex-wrap gap-2 content-start">
                      {quadrants?.blind.map(d => (
                        <Badge key={d.key} tone="amber" className="text-[10px] py-1 px-2">{d.label}</Badge>
                      ))}
                      {quadrants?.blind.length === 0 && <span className="text-xs text-zinc-500 italic">Kosong</span>}
                    </div>
                  </div>

                  {/* Hidden Area */}
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex flex-col">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
                      Hidden Area (Area Tersembunyi)
                    </h4>
                    <p className="text-[10px] text-indigo-400/70 mb-3 line-clamp-2">Kekuatan/potensi Anda yang mungkin belum sepenuhnya terlihat oleh orang lain.</p>
                    <div className="flex-1 flex flex-wrap gap-2 content-start">
                      {quadrants?.hidden.map(d => (
                        <Badge key={d.key} tone="indigo" className="text-[10px] py-1 px-2">{d.label}</Badge>
                      ))}
                      {quadrants?.hidden.length === 0 && <span className="text-xs text-zinc-500 italic">Kosong</span>}
                    </div>
                  </div>

                  {/* Unknown / Growth */}
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex flex-col">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-3">
                      Shared Growth Area
                    </h4>
                    <p className="text-[10px] text-rose-400/70 mb-3 line-clamp-2">Area prioritas untuk ditingkatkan, baik menurut evaluasi diri maupun feedback.</p>
                    <div className="flex-1 flex flex-wrap gap-2 content-start">
                      {quadrants?.growth.map(d => (
                        <Badge key={d.key} tone="rose" className="text-[10px] py-1 px-2">{d.label}</Badge>
                      ))}
                      {quadrants?.growth.length === 0 && <span className="text-xs text-zinc-500 italic">Kosong</span>}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
