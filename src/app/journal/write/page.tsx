'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ReviewWritePage() {
  const { state, saveReview } = useLifeOS();
  const { t, locale } = useI18n();
  const router = useRouter();

  const today = state.selectedDate;

  // Form states
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [score, setScore] = useState<number>(3);
  const [wins, setWins] = useState('');
  const [lessons, setLessons] = useState('');
  const [challenges, setChallenges] = useState('');
  const [focus, setFocus] = useState('');
  const [evaluationNotes, setEvaluationNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveReview({
      date: today,
      period,
      score,
      wins,
      lessons,
      challenges,
      focus,
      evaluationNotes
    });
    
    router.push('/journal');
  };

  const getQuestionPlaceholders = () => {
    if (period === 'weekly') {
      return {
        wins: "Apa 20% aktivitas yang memberi 80% hasil minggu ini?",
        lessons: "Pelajaran terbesar minggu ini?",
        challenges: "Apa yang menghambat kemajuan saya?",
        focus: "Prioritas utama untuk minggu depan?",
      };
    } else if (period === 'monthly') {
      return {
        wins: "Pencapaian paling signifikan bulan ini?",
        lessons: "Sistem atau kebiasaan apa yang perlu diperbaiki?",
        challenges: "Target yang tidak tercapai dan alasannya?",
        focus: "Fokus utama untuk bulan depan?",
      };
    } else if (period === 'yearly') {
      return {
        wins: "Highlight dan pencapaian terbaik tahun ini?",
        lessons: "Pelajaran hidup terpenting tahun ini?",
        challenges: "Tantangan terbesar yang berhasil dilalui?",
        focus: "Visi dan tujuan besar untuk tahun depan?",
      };
    }
    // daily
    return {
      wins: "Apa pencapaian (win) hari ini?",
      lessons: "Pelajaran yang didapat hari ini?",
      challenges: "Apa distraksi atau hambatan hari ini?",
      focus: "Satu hal penting untuk besok?",
    };
  };

  const placeholders = getQuestionPlaceholders();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/journal">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="activity" size={24} className="text-indigo-500" />
            Tulis Evaluasi (Review)
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            {formatDate(today)}
          </p>
        </div>
      </div>

      <Surface className="p-6">
        <div className="border-b border-life-line pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              Formulir Review
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Evaluasi kinerja dan rencanakan langkah selanjutnya.
            </p>
          </div>
          <div className="flex gap-2 bg-white/[0.02] border border-life-line rounded-lg p-1">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                  period === p
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-life-muted hover:text-life-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-life-muted uppercase block">
              Skor Kinerja ({period})
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setScore(val)}
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                    score === val 
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 font-bold' 
                      : 'bg-white/[0.02] border-life-line text-life-muted hover:border-life-line-strong'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-life-muted uppercase block">
                Pencapaian (Wins)
              </label>
              <textarea
                required
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder={placeholders.wins}
                className="glass-input text-sm resize-none h-24"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-life-muted uppercase block">
                Pelajaran (Lessons)
              </label>
              <textarea
                required
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder={placeholders.lessons}
                className="glass-input text-sm resize-none h-24"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-life-muted uppercase block">
                Tantangan / Hambatan
              </label>
              <textarea
                required
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder={placeholders.challenges}
                className="glass-input text-sm resize-none h-24"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-life-muted uppercase block">
                Fokus Berikutnya
              </label>
              <textarea
                required
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder={placeholders.focus}
                className="glass-input text-sm resize-none h-24"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-life-muted uppercase block">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              value={evaluationNotes}
              onChange={(e) => setEvaluationNotes(e.target.value)}
              placeholder="Insight tambahan..."
              className="glass-input text-sm resize-none h-20"
            />
          </div>

          <Button type="submit" variant="primary" icon="check" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700">
            Simpan Evaluasi
          </Button>
        </form>
      </Surface>
    </div>
  );
}
