'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { MOOD_EMOJIS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';

export default function JournalPage() {
  const { state, saveJournal, deleteJournal } = useLifeOS();
  const { t } = useI18n();

  const today = state.selectedDate;
  const currentJournal = state.journals.find((j) => j.date === today);
  const [viewingJournal, setViewingJournal] = useState<any | null>(null);

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
  };

  const getStreak = () => {
    let streak = 0;
    let cursor = today;
    while (state.journals.some((j) => j.date === cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  };

  // Helper date function since utils functions are not locally imported in scope
  const addDays = (dateStr: string, days: number): string => {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  // Month & Year state for trends
  const [trendMonth, setTrendMonth] = useState(() => new Date(today).getMonth());
  const [trendYear, setTrendYear] = useState(() => new Date(today).getFullYear());

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (trendMonth === 0) {
      setTrendMonth(11);
      setTrendYear(prev => prev - 1);
    } else {
      setTrendMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (trendMonth === 11) {
      setTrendMonth(0);
      setTrendYear(prev => prev + 1);
    } else {
      setTrendMonth(prev => prev + 1);
    }
  };

  const daysInMonth = getDaysInMonth(trendMonth, trendYear);
  const firstDayOfWeek = getFirstDayOfWeek(trendMonth, trendYear);
  
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-600 dark:from-violet-300 dark:to-purple-500 flex items-center gap-2">
            <Icon name="journal" size={28} className="text-purple-500" />
            {t('journal_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Refleksi harian, evaluasi mood, energi, dan pencapaian hari ini.
          </p>
        </div>
      </div>

      {/* Mood & Energy Trend Monthly Grids */}
      <Surface className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-life-line pb-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('journal_trend') || 'Tren Mood & Energi Bulanan'}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Visualisasi emosi bulanan (emoji) dan tingkat energi (petak petir tingkat kecerahan)
            </p>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrevMonth} className="px-2.5 py-1">
              <Icon name="chevron-left" size={14} />
            </Button>
            <span className="text-xs font-black uppercase text-life-text min-w-[120px] text-center">
              {monthNames[trendMonth]} {trendYear}
            </span>
            <Button variant="secondary" size="sm" onClick={handleNextMonth} className="px-2.5 py-1">
              <Icon name="chevron-right" size={14} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mood Calendar Grid */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-life-text uppercase tracking-wider">🎭 Tren Mood (Emoji)</span>
              <span className="text-[10px] text-life-muted font-semibold">Klik tanggal untuk rincian</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {dayNames.map((day) => (
                <span key={`mood-dayname-${day}`} className="text-[10px] text-life-muted font-black uppercase py-1">
                  {day}
                </span>
              ))}
              {/* Padding for first day offset */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`mood-empty-${i}`} className="aspect-square" />
              ))}
              {/* Days list */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${trendYear}-${String(trendMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const journal = state.journals.find((j) => j.date === dateStr);

                if (journal) {
                  return (
                    <div
                      key={`mood-day-${day}`}
                      onClick={() => setViewingJournal(journal)}
                      className="aspect-square flex items-center justify-center text-sm rounded bg-white/[0.04] border border-white/[0.08] hover:border-life-teal cursor-pointer transition-all relative group"
                      title={`${formatDate(dateStr)}: Mood ${journal.mood || 3}/5`}
                    >
                      <span>{MOOD_EMOJIS[(journal.mood || 3) - 1]}</span>
                      <span className="absolute bottom-0.5 right-1 text-[8px] text-white/20 font-bold leading-none">{day}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={`mood-day-empty-${day}`}
                    className="aspect-square flex items-center justify-center text-[10px] font-bold text-white/20 rounded bg-white/[0.01] border border-white/[0.03] relative"
                  >
                    <span>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Energy Calendar Grid */}
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-life-text uppercase tracking-wider">⚡ Tren Energi (Petir)</span>
              <span className="text-[10px] text-life-muted font-semibold">Semakin terang = semakin bertenaga</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {dayNames.map((day) => (
                <span key={`energy-dayname-${day}`} className="text-[10px] text-life-muted font-black uppercase py-1">
                  {day}
                </span>
              ))}
              {/* Padding for first day offset */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`energy-empty-${i}`} className="aspect-square" />
              ))}
              {/* Days list */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${trendYear}-${String(trendMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const journal = state.journals.find((j) => j.date === dateStr);

                if (journal) {
                  const energyClasses = [
                    'bg-indigo-950/20 text-indigo-400/30 border-indigo-500/10 hover:border-indigo-400',
                    'bg-indigo-900/30 text-indigo-400/50 border-indigo-500/20 hover:border-indigo-400',
                    'bg-indigo-800/40 text-indigo-400/75 border-indigo-500/30 hover:border-indigo-400',
                    'bg-indigo-700/60 text-indigo-400/95 border-indigo-500/45 hover:border-indigo-400',
                    'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.45)] hover:bg-indigo-400'
                  ];
                  const energyClass = energyClasses[(journal.energy || 3) - 1];

                  return (
                    <div
                      key={`energy-day-${day}`}
                      onClick={() => setViewingJournal(journal)}
                      className={`aspect-square flex items-center justify-center text-xs rounded border cursor-pointer transition-all relative group ${energyClass}`}
                      title={`${formatDate(dateStr)}: Energi ⚡ ${journal.energy || 3}/5`}
                    >
                      <span>⚡</span>
                      <span className="absolute bottom-0.5 right-1 text-[8px] opacity-40 font-bold leading-none">{day}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={`energy-day-empty-${day}`}
                    className="aspect-square flex items-center justify-center text-[10px] font-bold text-white/20 rounded bg-white/[0.01] border border-white/[0.03] relative"
                  >
                    <span>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Journal Entry Form */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {currentJournal ? t('journal_update') : t('journal_new')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {formatDate(today)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mood & Energy selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-life-muted uppercase block">
                  {t('journal_mood')}
                </label>
                <div className="flex justify-between items-center bg-white/[0.01] border border-life-line rounded-lg p-1.5">
                  {MOOD_EMOJIS.map((emoji, index) => {
                    const val = index + 1;
                    const isSelected = mood === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMood(val)}
                        className={`text-lg p-1.5 rounded-md transition-all ${
                          isSelected ? 'bg-life-teal text-white scale-110 shadow-md' : 'opacity-50 hover:opacity-100'
                        }`}
                        title={`Mood ${val}`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="energy" className="text-xs font-bold text-life-muted uppercase block">
                  {t('journal_energy')}
                </label>
                <select
                  id="energy"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="glass-select w-full"
                >
                  {[1, 2, 3, 4, 5].map((val) => (
                    <option key={val} value={val}>
                      ⚡ {val} / 5
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Gratitude Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-life-muted uppercase block">
                {t('journal_gratitude')} (3 Hal)
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  required
                  placeholder={t('journal_gratitude_1')}
                  value={gratitude1}
                  onChange={(e) => setGratitude1(e.target.value)}
                  className="glass-input text-xs w-full"
                />
                <input
                  type="text"
                  placeholder={t('journal_gratitude_2')}
                  value={gratitude2}
                  onChange={(e) => setGratitude2(e.target.value)}
                  className="glass-input text-xs w-full"
                />
                <input
                  type="text"
                  placeholder={t('journal_gratitude_3')}
                  value={gratitude3}
                  onChange={(e) => setGratitude3(e.target.value)}
                  className="glass-input text-xs w-full"
                />
              </div>
            </div>

            {/* Win */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="win" className="text-xs font-bold text-life-muted uppercase">
                {t('journal_win')}
              </label>
              <input
                id="win"
                type="text"
                placeholder="Pencapaian terbaik hari ini..."
                value={win}
                onChange={(e) => setWin(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            {/* Reflection */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="reflection" className="text-xs font-bold text-life-muted uppercase">
                {t('journal_reflection')}
              </label>
              <textarea
                id="reflection"
                placeholder="Apa pelajaran hari ini? Tulis refleksi panjang..."
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="glass-input text-xs h-24"
              />
            </div>

            {/* Next Action */}
            <div className="flex flex-col space-y-1">
              <label htmlFor="nextAction" className="text-xs font-bold text-life-muted uppercase">
                {t('journal_next')}
              </label>
              <input
                id="nextAction"
                type="text"
                placeholder="Fokus utama esok hari..."
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <Button type="submit" variant="primary" icon="check" className="w-full">
              {t('journal_save')}
            </Button>
          </form>
        </Surface>

        {/* Right: Timeline */}
        <Surface className="p-6 flex flex-col">
          <div className="border-b border-life-line pb-3 mb-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                {t('journal_timeline')}
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                History harian jurnal teratur
              </p>
            </div>
            <Badge tone="amber">
              {`${getStreak()} ${t('journal_streak')}`}
            </Badge>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {state.journals.length > 0 ? (
              state.journals.map((journal) => (
                <div 
                  key={journal.id} 
                  onClick={() => setViewingJournal(journal)}
                  className="p-4 rounded-xl bg-white/[0.01] border border-life-line space-y-2 relative cursor-pointer hover:border-life-line-strong hover:bg-white/[0.02] transition-all"
                >
                  <div className="flex justify-between items-start">
                    <strong className="text-xs text-life-text">{formatDate(journal.date)}</strong>
                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <Badge tone="teal">{`Mood ${MOOD_EMOJIS[(journal.mood || 3) - 1]}`}</Badge>
                      <Badge tone="indigo" className="flex items-center gap-1">
                        <Icon name="zap" size={10} />
                        <span>{`Energy ${journal.energy}/5`}</span>
                      </Badge>
                      <button
                        onClick={() => deleteJournal(journal.id)}
                        className="text-life-muted hover:text-life-rose transition-colors p-1"
                        title={t('delete')}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 font-medium pt-1 text-life-muted">
                    {journal.gratitude_1 && (
                      <p className="flex items-start gap-1.5">
                        <Icon name="lightbulb" size={12} className="text-amber-400 mt-0.5 shrink-0" />
                        <span className="text-life-text">{journal.gratitude_1}</span>
                      </p>
                    )}
                    {journal.win && (
                      <p className="flex items-start gap-1.5">
                        <Icon name="trophy" size={12} className="text-yellow-400 mt-0.5 shrink-0" />
                        <span className="text-life-text">{journal.win}</span>
                      </p>
                    )}
                    {journal.reflection && (
                      <p className="border-t border-white/5 pt-1.5 italic text-[11px] leading-relaxed truncate">
                        &ldquo;{journal.reflection}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </Surface>
      </div>

      {/* Modal Detail Jurnal */}
      <Modal
        isOpen={!!viewingJournal}
        onClose={() => setViewingJournal(null)}
        title={viewingJournal ? `Jurnal Harian — ${formatDate(viewingJournal.date)}` : ''}
        subtitle={
          viewingJournal 
            ? `Mood: ${MOOD_EMOJIS[(viewingJournal.mood || 3) - 1]} | Energi: ⚡ ${viewingJournal.energy}/5`
            : ''
        }
      >
        {viewingJournal && (
          <div className="space-y-4 text-xs leading-relaxed text-life-text">
            {/* Gratitudes */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1">
                Hal yang Disyukuri (Gratitudes)
              </h4>
              <ul className="list-disc pl-4 space-y-1 text-life-text">
                {viewingJournal.gratitude_1 && <li>{viewingJournal.gratitude_1}</li>}
                {viewingJournal.gratitude_2 && <li>{viewingJournal.gratitude_2}</li>}
                {viewingJournal.gratitude_3 && <li>{viewingJournal.gratitude_3}</li>}
                {!viewingJournal.gratitude_1 && !viewingJournal.gratitude_2 && !viewingJournal.gratitude_3 && (
                  <li className="italic text-life-muted">Tidak ada data</li>
                )}
              </ul>
            </div>

            {/* Wins */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1">
                Pencapaian Hari Ini (Daily Win)
              </h4>
              <p className="flex items-center gap-1.5 text-life-text font-semibold">
                <Icon name="trophy" size={14} className="text-yellow-400 shrink-0" />
                <span>{viewingJournal.win || <span className="italic text-life-muted">Tidak ada data</span>}</span>
              </p>
            </div>

            {/* Reflection */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1">
                Refleksi & Catatan
              </h4>
              <p className="italic text-[11px] bg-white/[0.01] border border-life-line p-3 rounded-lg leading-relaxed text-life-text">
                &ldquo;{viewingJournal.reflection || 'Tidak ada catatan refleksi untuk hari ini.'}&rdquo;
              </p>
            </div>

            {/* Next Day Plan */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1">
                Rencana Hari Esok (Next Steps)
              </h4>
              <p className="flex items-center gap-1.5 text-life-text font-semibold">
                <Icon name="arrowRight" size={14} className="text-life-teal shrink-0" />
                <span>{viewingJournal.next || <span className="italic text-life-muted">Tidak ada data</span>}</span>
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <Button variant="secondary" onClick={() => setViewingJournal(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
