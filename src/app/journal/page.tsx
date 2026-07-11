'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { MOOD_EMOJIS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';

export default function JournalPage() {
  const { state, saveJournal, deleteJournal } = useLifeOS();
  const { t } = useI18n();

  const today = state.selectedDate;
  const currentJournal = state.journals.find((j) => j.date === today);

  // Form states
  const [mood, setMood] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');
  const [win, setWin] = useState('');
  const [reflection, setReflection] = useState('');
  const [nextAction, setNextAction] = useState('');

  // Sync state if today's journal exists
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
      setMood(3);
      setEnergy(3);
      setGratitude1('');
      setGratitude2('');
      setGratitude3('');
      setWin('');
      setReflection('');
      setNextAction('');
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

  // Get journals for last 7 days chronologically
  const last7DaysJournals = [...state.journals]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 120;
  const padding = 20;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  const pointsCount = last7DaysJournals.length;
  const getX = (index: number) => {
    if (pointsCount <= 1) return padding + chartWidth / 2;
    return padding + (index / (pointsCount - 1)) * chartWidth;
  };
  const getY = (value: number) => {
    const valPercent = (value - 1) / 4; // Scale 1 to 5 to 0% to 100%
    return padding + chartHeight - (valPercent * chartHeight);
  };

  const moodPoints = last7DaysJournals.map((j, i) => ({ x: getX(i), y: getY(j.mood || 3), date: j.date, val: j.mood || 3 }));
  const energyPoints = last7DaysJournals.map((j, i) => ({ x: getX(i), y: getY(j.energy || 3), date: j.date, val: j.energy || 3 }));

  const buildPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpX1 = prev.x + (p.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (p.x - prev.x) / 2;
      const cpY2 = p.y;
      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
    }, '');
  };

  const moodPath = buildPath(moodPoints);
  const energyPath = buildPath(energyPoints);

  return (
    <div className="space-y-6">
      {/* Mood & Energy Trend SVG Chart */}
      <Surface className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-life-line pb-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('journal_trend') || 'Tren Mood & Energi'}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Visualisasi emosi dan tingkat energi Anda dalam 7 entri jurnal terakhir
            </p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase text-life-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-life-teal inline-block shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              Mood
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
              Energi
            </span>
          </div>
        </div>

        {last7DaysJournals.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[500px] p-2">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
                {/* Horizontal reference lines */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const yVal = padding + (i / 4) * chartHeight;
                  return (
                    <line
                      key={i}
                      x1={padding}
                      y1={yVal}
                      x2={svgWidth - padding}
                      y2={yVal}
                      className="stroke-white/[0.03] stroke-1"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Mood path */}
                {moodPath && (
                  <path
                    d={moodPath}
                    fill="none"
                    className="stroke-life-teal stroke-[3]"
                    strokeLinecap="round"
                  />
                )}

                {/* Energy path */}
                {energyPath && (
                  <path
                    d={energyPath}
                    fill="none"
                    className="stroke-indigo-400 stroke-[3]"
                    strokeLinecap="round"
                  />
                )}

                {/* Mood circles */}
                {moodPoints.map((p, idx) => (
                  <g key={`mood-${idx}`} className="group">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      className="fill-life-bg stroke-life-teal stroke-[3] cursor-pointer hover:r-[7] transition-all duration-150"
                    />
                    <title>{`${p.date}: Mood ${p.val}/5`}</title>
                  </g>
                ))}

                {/* Energy circles */}
                {energyPoints.map((p, idx) => (
                  <g key={`energy-${idx}`} className="group">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      className="fill-life-bg stroke-indigo-400 stroke-[3] cursor-pointer hover:r-[7] transition-all duration-150"
                    />
                    <title>{`${p.date}: Energi ${p.val}/5`}</title>
                  </g>
                ))}

                {/* X-axis date labels */}
                {moodPoints.map((p, idx) => (
                  <text
                    key={`label-${idx}`}
                    x={p.x}
                    y={svgHeight - 2}
                    textAnchor="middle"
                    className="fill-life-muted font-black text-[9px] uppercase tracking-tight"
                  >
                    {p.date.slice(-5)}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-life-muted font-bold uppercase">
            Tulis jurnal hari ini untuk mulai melihat bagan perkembangan emosi Anda!
          </div>
        )}
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
                  className="p-4 rounded-xl bg-white/[0.01] border border-life-line space-y-2 relative"
                >
                  <div className="flex justify-between items-start">
                    <strong className="text-xs text-life-text">{formatDate(journal.date)}</strong>
                    <div className="flex items-center space-x-1.5">
                      <Badge tone="teal">{`Mood ${MOOD_EMOJIS[(journal.mood || 3) - 1]}`}</Badge>
                      <Badge tone="indigo">{`Energy ⚡ ${journal.energy}/5`}</Badge>
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
                      <p>
                        💡 <span className="text-life-text">{journal.gratitude_1}</span>
                      </p>
                    )}
                    {journal.win && (
                      <p>
                        🏆 <span className="text-life-text">{journal.win}</span>
                      </p>
                    )}
                    {journal.reflection && (
                      <p className="border-t border-white/5 pt-1.5 italic text-[11px] leading-relaxed">
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
    </div>
  );
}
