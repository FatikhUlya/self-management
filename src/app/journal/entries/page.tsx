'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

export default function JournalEntriesPage() {
  const { state, deleteJournal } = useLifeOS();
  const { t, locale } = useI18n();

  const [viewingJournal, setViewingJournal] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');

  const today = state.selectedDate;

  // Month & Year state for calendar trends
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
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/journal">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="list" size={24} className="text-purple-500" />
            Riwayat & Tren Jurnal
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Lihat riwayat jurnal harian Anda dan pantau tren bulanan.
          </p>
        </div>
      </div>

      <Surface className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-life-line pb-4 mb-6">
          <div className="flex bg-white/[0.02] border border-life-line rounded-lg p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-wider transition-all duration-150 ${
                viewMode === 'timeline'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-life-muted hover:text-life-text'
              }`}
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-[11px] font-black uppercase tracking-wider transition-all duration-150 ${
                viewMode === 'calendar'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-life-muted hover:text-life-text'
              }`}
            >
              Tren Bulanan
            </button>
          </div>

          {viewMode === 'calendar' && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handlePrevMonth} className="px-2.5 py-1">
                <Icon name="chevronLeft" size={14} />
              </Button>
              <span className="text-xs font-black uppercase text-life-text min-w-[120px] text-center">
                {monthNames[trendMonth]} {trendYear}
              </span>
              <Button variant="secondary" size="sm" onClick={handleNextMonth} className="px-2.5 py-1">
                <Icon name="chevronRight" size={14} />
              </Button>
            </div>
          )}
        </div>

        {viewMode === 'timeline' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
            {state.journals.length > 0 ? (
              state.journals.map((journal) => (
                <div 
                  key={journal.id} 
                  onClick={() => setViewingJournal(journal)}
                  className="p-5 rounded-xl bg-white/[0.01] border border-life-line space-y-3 relative cursor-pointer hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <strong className="text-sm font-bold text-life-text">{formatDate(journal.date)}</strong>
                    <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <Badge tone="purple" className="flex items-center gap-1.5 px-2 py-0.5">
                        <Icon
                          name={`mood${journal.mood || 3}`}
                          size={14}
                          className={
                            (journal.mood || 3) === 1 ? 'text-rose-400' :
                            (journal.mood || 3) === 2 ? 'text-orange-300' :
                            (journal.mood || 3) === 3 ? 'text-yellow-300' :
                            (journal.mood || 3) === 4 ? 'text-lime-300' :
                            'text-emerald-300'
                          }
                        />
                        <span className="font-bold">Mood</span>
                      </Badge>
                      <Badge tone="indigo" className="flex items-center gap-1.5 px-2 py-0.5">
                        <Icon name="zap" size={12} className="text-indigo-400" />
                        <span className="font-bold">{journal.energy}/5</span>
                      </Badge>
                      <button
                        onClick={() => deleteJournal(journal.id)}
                        className="text-life-muted hover:text-life-rose transition-colors p-1"
                        title={t('delete')}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs space-y-2 font-medium pt-1 text-life-muted">
                    {journal.gratitude_1 && (
                      <p className="flex items-start gap-2">
                        <Icon name="lightbulb" size={14} className="text-amber-400 mt-0.5 shrink-0" />
                        <span className="text-life-text">{journal.gratitude_1}</span>
                      </p>
                    )}
                    {journal.win && (
                      <p className="flex items-start gap-2">
                        <Icon name="trophy" size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                        <span className="text-life-text font-bold">{journal.win}</span>
                      </p>
                    )}
                    {journal.reflection && (
                      <p className="border-t border-white/5 pt-2 italic text-[11px] leading-relaxed line-clamp-2">
                        &ldquo;{journal.reflection}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <EmptyState />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mood Calendar Grid */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-1.5">
                  <Icon name="journal" size={14} className="text-purple-400 mt-0.5 shrink-0" />
                  <span className="text-xs font-bold text-life-text uppercase tracking-wider">{locale === 'id' ? 'Tren Mood' : 'Mood Trend'}</span>
                </div>
                <span className="text-[10px] text-life-muted font-semibold">{locale === 'id' ? 'Klik tanggal untuk rincian' : 'Click date for details'}</span>
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
                        className="aspect-square flex items-center justify-center text-sm rounded bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] hover:border-purple-500 cursor-pointer transition-all relative group"
                        title={`${formatDate(dateStr)}: Mood ${journal.mood || 3}/5`}
                      >
                        <Icon
                          name={`mood${journal.mood || 3}`}
                          size={20}
                          className={
                            (journal.mood || 3) === 1 ? 'text-rose-600 dark:text-rose-500' :
                            (journal.mood || 3) === 2 ? 'text-orange-600 dark:text-orange-400' :
                            (journal.mood || 3) === 3 ? 'text-amber-500 dark:text-yellow-400' :
                            (journal.mood || 3) === 4 ? 'text-lime-600 dark:text-lime-500' :
                            'text-emerald-600 dark:text-emerald-500'
                          }
                        />
                        <span className="absolute bottom-1 right-1.5 text-[9px] text-black/40 dark:text-white/20 font-black leading-none">{day}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`mood-day-empty-${day}`}
                      className="aspect-square flex items-center justify-center text-[11px] font-bold text-black/20 dark:text-white/20 rounded bg-black/[0.02] dark:bg-white/[0.01] border border-black/[0.05] dark:border-white/[0.03] relative"
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
                <div className="flex items-center gap-1.5">
                  <Icon name="zap" size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-xs font-bold text-life-text uppercase tracking-wider">{locale === 'id' ? 'Tren Energi' : 'Energy Trend'}</span>
                </div>
                <span className="text-[10px] text-life-muted font-semibold">{locale === 'id' ? 'Semakin terang = semakin bertenaga' : 'Brighter = more energetic'}</span>
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
                    return (
                      <div
                        key={`energy-day-${day}`}
                        onClick={() => setViewingJournal(journal)}
                        className="aspect-square flex items-center justify-center text-sm rounded bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] hover:border-amber-500 cursor-pointer transition-all relative group"
                        title={`${formatDate(dateStr)}: Energi ${journal.energy || 3}/5`}
                      >
                        <Icon
                          name="zap"
                          size={20}
                          className={
                            (journal.energy || 3) === 1 ? 'text-red-700 dark:text-red-500' :
                            (journal.energy || 3) === 2 ? 'text-orange-700 dark:text-orange-500' :
                            (journal.energy || 3) === 3 ? 'text-amber-600 dark:text-amber-500' :
                            (journal.energy || 3) === 4 ? 'text-yellow-600 dark:text-yellow-500' :
                            'text-amber-400 dark:text-yellow-300'
                          }
                        />
                        <span className="absolute bottom-1 right-1.5 text-[9px] text-black/40 dark:text-white/20 font-black leading-none">{day}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`energy-day-empty-${day}`}
                      className="aspect-square flex items-center justify-center text-[11px] font-bold text-black/20 dark:text-white/20 rounded bg-black/[0.02] dark:bg-white/[0.01] border border-black/[0.05] dark:border-white/[0.03] relative"
                    >
                      <span>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Surface>

      {/* Modal Detail Jurnal */}
      <Modal
        isOpen={!!viewingJournal}
        onClose={() => setViewingJournal(null)}
        title={viewingJournal ? `Jurnal Harian — ${formatDate(viewingJournal.date)}` : ''}
        subtitle={
          viewingJournal 
            ? (
              <div className="flex items-center gap-4 mt-2 select-none">
                <div className="flex items-center gap-2">
                  <Icon
                    name={`mood${viewingJournal.mood || 3}`}
                    size={16}
                    className={
                      (viewingJournal.mood || 3) === 1 ? 'text-rose-400' :
                      (viewingJournal.mood || 3) === 2 ? 'text-orange-300' :
                      (viewingJournal.mood || 3) === 3 ? 'text-yellow-300' :
                      (viewingJournal.mood || 3) === 4 ? 'text-lime-300' :
                      'text-emerald-300'
                    }
                  />
                  <span className="text-xs text-life-muted font-bold uppercase tracking-wider">Mood: {viewingJournal.mood || 3}/5</span>
                </div>
                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                  <Icon name="zap" size={14} className="text-indigo-400" />
                  <span className="text-xs text-life-muted font-bold uppercase tracking-wider">Energi: {viewingJournal.energy}/5</span>
                </div>
              </div>
            )
            : ''
        }
      >
        {viewingJournal && (
          <div className="space-y-5 text-xs leading-relaxed text-life-text mt-2">
            {/* Gratitudes */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1.5">
                Hal yang Disyukuri (Gratitudes)
              </h4>
              <ul className="list-disc pl-4 space-y-1.5 font-medium">
                {viewingJournal.gratitude_1 && <li>{viewingJournal.gratitude_1}</li>}
                {viewingJournal.gratitude_2 && <li>{viewingJournal.gratitude_2}</li>}
                {viewingJournal.gratitude_3 && <li>{viewingJournal.gratitude_3}</li>}
                {!viewingJournal.gratitude_1 && !viewingJournal.gratitude_2 && !viewingJournal.gratitude_3 && (
                  <li className="italic text-life-muted">Tidak ada data</li>
                )}
              </ul>
            </div>

            {/* Wins */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1.5">
                {locale === 'id' ? 'Pencapaian Hari Ini (Daily Win)' : 'Today\'s Achievement (Daily Win)'}
              </h4>
              <p className="flex items-start gap-2 text-life-text font-bold bg-white/[0.02] p-3 rounded-lg">
                <Icon name="trophy" size={16} className="text-yellow-400 shrink-0 mt-0.5" />
                <span>{viewingJournal.win || <span className="italic text-life-muted">Tidak ada data</span>}</span>
              </p>
            </div>

            {/* Reflection */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1.5">
                Refleksi & Catatan
              </h4>
              <p className="italic text-xs bg-white/[0.01] border border-life-line p-4 rounded-lg leading-relaxed font-medium">
                &ldquo;{viewingJournal.reflection || (locale === 'id' ? 'Tidak ada catatan refleksi untuk hari ini.' : 'No reflection notes for today.')}&rdquo;
              </p>
            </div>

            {/* Next Day Plan */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1.5">
                Rencana Hari Esok (Next Steps)
              </h4>
              <p className="flex items-start gap-2 text-life-text font-bold">
                <Icon name="arrowRight" size={16} className="text-life-teal shrink-0 mt-0.5" />
                <span>{viewingJournal.next || <span className="italic text-life-muted">Tidak ada data</span>}</span>
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5 mt-4">
              <Button variant="secondary" onClick={() => setViewingJournal(null)} className="px-6">
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
