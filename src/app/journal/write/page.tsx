'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function JournalWritePage() {
  const { state, saveJournal } = useLifeOS();
  const { t, locale } = useI18n();
  const router = useRouter();

  const today = state.selectedDate;
  const currentJournal = state.journals.find((j) => j.date === today);

  // Helper to load draft safely
  const getDraftOrValue = (key: string, fallback: any) => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch {
          return saved;
        }
      }
    }
    return fallback;
  };

  // Form states
  const [mood, setMood] = useLocalStorageState<number>(`draft_journal_mood_${today}`, 3);
  const [energy, setEnergy] = useLocalStorageState<number>(`draft_journal_energy_${today}`, 3);
  const [gratitude1, setGratitude1] = useLocalStorageState(`draft_journal_gratitude1_${today}`, '');
  const [gratitude2, setGratitude2] = useLocalStorageState(`draft_journal_gratitude2_${today}`, '');
  const [gratitude3, setGratitude3] = useLocalStorageState(`draft_journal_gratitude3_${today}`, '');
  const [win, setWin] = useLocalStorageState(`draft_journal_win_${today}`, '');
  const [reflection, setReflection] = useLocalStorageState(`draft_journal_reflection_${today}`, '');
  const [nextAction, setNextAction] = useLocalStorageState(`draft_journal_nextAction_${today}`, '');

  // Sync state if today's journal exists or load drafts
  useEffect(() => {
    if (currentJournal) {
      setMood(currentJournal.mood || 3);
      setEnergy(currentJournal.energy || 3);
      setGratitude1(currentJournal.gratitude_1 || '');
      setGratitude2(currentJournal.gratitude_2 || '');
      setGratitude3(currentJournal.gratitude_3 || '');
      setWin(currentJournal.win || '');
      setReflection(currentJournal.reflection || '');
      setNextAction(currentJournal.next || '');
    } else {
      setMood(getDraftOrValue(`draft_journal_mood_${today}`, 3));
      setEnergy(getDraftOrValue(`draft_journal_energy_${today}`, 3));
      setGratitude1(getDraftOrValue(`draft_journal_gratitude1_${today}`, ''));
      setGratitude2(getDraftOrValue(`draft_journal_gratitude2_${today}`, ''));
      setGratitude3(getDraftOrValue(`draft_journal_gratitude3_${today}`, ''));
      setWin(getDraftOrValue(`draft_journal_win_${today}`, ''));
      setReflection(getDraftOrValue(`draft_journal_reflection_${today}`, ''));
      setNextAction(getDraftOrValue(`draft_journal_nextAction_${today}`, ''));
    }
  }, [currentJournal, today]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveJournal({
      mood,
      energy,
      gratitude_1: gratitude1,
      gratitude_2: gratitude2,
      gratitude_3: gratitude3,
      win,
      reflection,
      next: nextAction,
    });
    
    // Cleanup drafts after saving
    localStorage.removeItem(`draft_journal_mood_${today}`);
    localStorage.removeItem(`draft_journal_energy_${today}`);
    localStorage.removeItem(`draft_journal_gratitude1_${today}`);
    localStorage.removeItem(`draft_journal_gratitude2_${today}`);
    localStorage.removeItem(`draft_journal_gratitude3_${today}`);
    localStorage.removeItem(`draft_journal_win_${today}`);
    localStorage.removeItem(`draft_journal_reflection_${today}`);
    localStorage.removeItem(`draft_journal_nextAction_${today}`);

    router.push('/journal/entries');
  };

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
            <Icon name="edit" size={24} className="text-purple-500" />
            Tulis Jurnal
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            {formatDate(today)}
          </p>
        </div>
      </div>

      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-6">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {currentJournal ? t('journal_update') : t('journal_new')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            Evaluasi mood, energi, dan pencapaian hari ini.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood & Energy selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="mood" className="text-xs font-bold text-life-muted uppercase block">
                {t('journal_mood')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <Icon
                    name={`mood${mood}`}
                    size={20}
                    className={
                      mood === 1 ? 'text-rose-500' :
                      mood === 2 ? 'text-orange-400' :
                      mood === 3 ? 'text-yellow-400' :
                      mood === 4 ? 'text-lime-500' :
                      'text-emerald-500'
                    }
                  />
                </div>
                <select
                  id="mood"
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="glass-select w-full pl-10 h-12 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((val) => {
                    const moodLabels = locale === 'id' 
                      ? ['Sangat Buruk', 'Buruk', 'Biasa', 'Senang', 'Sangat Senang']
                      : ['Very Bad', 'Bad', 'Neutral', 'Good', 'Very Good'];
                    return (
                      <option key={val} value={val}>
                        {moodLabels[val - 1]} ({val}/5)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="energy" className="text-xs font-bold text-life-muted uppercase block">
                {t('journal_energy')}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  <Icon
                    name="zap"
                    size={20}
                    className={
                      energy === 1 ? 'text-red-500' :
                      energy === 2 ? 'text-orange-500' :
                      energy === 3 ? 'text-amber-500' :
                      energy === 4 ? 'text-yellow-500' :
                      'text-yellow-300'
                    }
                  />
                </div>
                <select
                  id="energy"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="glass-select w-full pl-10 h-12 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((val) => (
                    <option key={val} value={val}>
                      Energi {val} / 5
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-life-line border-dashed" />

          {/* Gratitude Section */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-life-muted uppercase block">
              {t('journal_gratitude')} (3 Hal)
            </label>
            <div className="space-y-3">
              <input
                type="text"
                required
                placeholder={t('journal_gratitude_1')}
                value={gratitude1}
                onChange={(e) => setGratitude1(e.target.value)}
                className="glass-input text-sm w-full h-11"
              />
              <input
                type="text"
                placeholder={t('journal_gratitude_2')}
                value={gratitude2}
                onChange={(e) => setGratitude2(e.target.value)}
                className="glass-input text-sm w-full h-11"
              />
              <input
                type="text"
                placeholder={t('journal_gratitude_3')}
                value={gratitude3}
                onChange={(e) => setGratitude3(e.target.value)}
                className="glass-input text-sm w-full h-11"
              />
            </div>
          </div>

          <hr className="border-life-line border-dashed" />

          {/* Win */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="win" className="text-xs font-bold text-life-muted uppercase">
              {t('journal_win')}
            </label>
            <input
              id="win"
              type="text"
              placeholder={locale === 'id' ? "Pencapaian terbaik hari ini..." : "Best achievement today..."}
              value={win}
              onChange={(e) => setWin(e.target.value)}
              className="glass-input text-sm h-11"
            />
          </div>

          {/* Reflection */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="reflection" className="text-xs font-bold text-life-muted uppercase">
              {t('journal_reflection')}
            </label>
            <textarea
              id="reflection"
              placeholder={locale === 'id' ? "Apa pelajaran hari ini? Tulis refleksi panjang..." : "What's the lesson today? Write a long reflection..."}
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="glass-input text-sm h-32"
            />
          </div>

          {/* Next Action */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="nextAction" className="text-xs font-bold text-life-muted uppercase">
              {t('journal_next')}
            </label>
            <input
              id="nextAction"
              type="text"
              placeholder="Fokus utama esok hari..."
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="glass-input text-sm h-11"
            />
          </div>

          <div className="pt-4 border-t border-life-line flex justify-end">
            <Button type="submit" variant="primary" icon="check" className="px-8 py-2">
              {t('journal_save')}
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  );
}
