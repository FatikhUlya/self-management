'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { ReflectionExtras } from '@/components/daily/DailyChecks';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { MetricCard } from '@/components/ui/MetricCard';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate, todayISO, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { DateStamp } from '@/components/ui/DateStamp';

const MOOD_CONFIG = [
  { level: 1, label: 'Sangat Rendah', icon: 'mood1', tone: 'rose' as const },
  { level: 2, label: 'Kurang Baik', icon: 'mood2', tone: 'amber' as const },
  { level: 3, label: 'Cukup / Netral', icon: 'mood3', tone: 'amber' as const },
  { level: 4, label: 'Baik & Tenang', icon: 'mood4', tone: 'green' as const },
  { level: 5, label: 'Prima & Semangat', icon: 'mood5', tone: 'indigo' as const },
];

const ENERGY_CONFIG = [
  { level: 1, label: 'Habis (Exhausted)', color: 'bg-rose-500' },
  { level: 2, label: 'Rendah (Low)', color: 'bg-amber-500' },
  { level: 3, label: 'Cukup (Moderate)', color: 'bg-yellow-500' },
  { level: 4, label: 'Tinggi (High)', color: 'bg-emerald-500' },
  { level: 5, label: 'Puncak (Peak)', color: 'bg-indigo-500' },
];

const MINDFUL_PROMPTS = [
  'Apa satu momen kecil hari ini yang membuat Anda tersenyum atau merasa damai?',
  'Jika hari ini bisa Anda ulangi satu jam saja, apa yang akan Anda lakukan secara berbeda?',
  'Siapa satu orang yang tindakannya hari ini paling Anda apresiasi?',
  'Apa rintangan terbesar hari ini, dan pelajaran apa yang Anda bawa ke depan?',
  'Apa hal berani atau tindakan paling bermakna yang sudah Anda selesaikan hari ini?',
];

/**
 * Journal hub and the dedicated 'today' reflection page share this component.
 * hub: header, metrics, tabs. On mobile the reflection form is replaced by a
 * short summary + a button to /journal/today (STYLE_GUIDE §3.2).
 */
export function JournalWorkspace({ variant = 'hub' }: { variant?: 'hub' | 'today' }) {
  const router = useRouter();
  const { state, saveJournal, deleteJournal, saveReview, deleteReview } = useLifeOS();
  const { t, locale } = useI18n();

  const selectedDate = state.selectedDate || todayISO();
  const isToday = selectedDate === todayISO();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'today' | 'archive' | 'reviews'>('today');

  // Search & Filter for Archive
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<number | 'all'>('all');

  // Filter for Reviews
  const [reviewPeriodFilter, setReviewPeriodFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');

  // Dialog States
  const [viewingJournal, setViewingJournal] = useState<any | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Journal Form State for Selected Date
  const currentJournal = useMemo(() => {
    return state.journals.find((j) => j.date === selectedDate);
  }, [state.journals, selectedDate]);

  const [mood, setMood] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(4);
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');
  const [win, setWin] = useState('');
  const [reflection, setReflection] = useState('');
  const [nextAction, setNextAction] = useState('');

  // Sync form state when selected date or currentJournal changes
  useEffect(() => {
    if (currentJournal) {
      setMood(currentJournal.mood || 4);
      setEnergy(currentJournal.energy || 4);
      setGratitude1(currentJournal.gratitude_1 || '');
      setGratitude2(currentJournal.gratitude_2 || '');
      setGratitude3(currentJournal.gratitude_3 || '');
      setWin(currentJournal.win || '');
      setReflection(currentJournal.reflection || '');
      setNextAction(currentJournal.next || '');
    } else {
      setMood(4);
      setEnergy(4);
      setGratitude1('');
      setGratitude2('');
      setGratitude3('');
      setWin('');
      setReflection('');
      setNextAction('');
    }
    setSaveSuccess(false);
  }, [currentJournal, selectedDate]);

  // Yesterday's journal for continuity
  const yesterdayDate = useMemo(() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, [selectedDate]);

  const yesterdayJournal = useMemo(() => {
    return state.journals.find((j) => j.date === yesterdayDate);
  }, [state.journals, yesterdayDate]);

  // Mindful prompt for today
  const dailyPrompt = useMemo(() => {
    const dayNum = Number(selectedDate.replace(/-/g, '')) || 0;
    return MINDFUL_PROMPTS[dayNum % MINDFUL_PROMPTS.length];
  }, [selectedDate]);

  // Calculate Streak
  const streak = useMemo(() => {
    let count = 0;
    const addDays = (dateStr: string, days: number): string => {
      const d = new Date(`${dateStr}T00:00:00`);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };

    let cursor = selectedDate;
    while (
      state.journals.some((j) => j.date === cursor) ||
      state.reviews.some((r) => r.date === cursor && r.period === 'daily')
    ) {
      count += 1;
      cursor = addDays(cursor, -1);
    }
    return count;
  }, [state.journals, state.reviews, selectedDate]);

  // 7-day averages
  const recent7Journals = useMemo(() => {
    const past7 = [];
    const d = new Date(`${selectedDate}T00:00:00`);
    for (let i = 0; i < 7; i++) {
      const dateStr = d.toISOString().slice(0, 10);
      const match = state.journals.find((j) => j.date === dateStr);
      if (match) past7.push(match);
      d.setDate(d.getDate() - 1);
    }
    return past7;
  }, [state.journals, selectedDate]);

  const avgMood = useMemo(() => {
    if (recent7Journals.length === 0) return 0;
    const sum = recent7Journals.reduce((acc, curr) => acc + (curr.mood || 0), 0);
    return (sum / recent7Journals.length).toFixed(1);
  }, [recent7Journals]);

  const avgEnergy = useMemo(() => {
    if (recent7Journals.length === 0) return 0;
    const sum = recent7Journals.reduce((acc, curr) => acc + (curr.energy || 0), 0);
    return (sum / recent7Journals.length).toFixed(1);
  }, [recent7Journals]);

  // Save Journal Handler
  const handleSaveJournal = async (e: React.FormEvent) => {
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
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    // Dedicated page: go back to the hub summary after saving.
    if (variant === 'today') setTimeout(() => router.push('/journal'), 700);
  };

  // Archive filtered journals
  const filteredJournals = useMemo(() => {
    return state.journals
      .filter((j) => {
        if (moodFilter !== 'all' && j.mood !== moodFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchWin = j.win?.toLowerCase().includes(q);
          const matchReflection = j.reflection?.toLowerCase().includes(q);
          const matchNext = j.next?.toLowerCase().includes(q);
          const matchGratitude =
            j.gratitude_1?.toLowerCase().includes(q) ||
            j.gratitude_2?.toLowerCase().includes(q) ||
            j.gratitude_3?.toLowerCase().includes(q);
          if (!matchWin && !matchReflection && !matchNext && !matchGratitude) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.journals, moodFilter, searchQuery]);

  // Periodic reviews list
  const filteredReviews = useMemo(() => {
    return state.reviews
      .filter((r) => {
        if (reviewPeriodFilter !== 'all' && r.period !== reviewPeriodFilter) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.reviews, reviewPeriodFilter]);

  // Review Form State
  const [reviewPeriod, setReviewPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [reviewScore, setReviewScore] = useState<number>(4);
  const [reviewWins, setReviewWins] = useState('');
  const [reviewLessons, setReviewLessons] = useState('');
  const [reviewChallenges, setReviewChallenges] = useState('');
  const [reviewFocus, setReviewFocus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveReview({
      date: selectedDate,
      period: reviewPeriod,
      score: reviewScore,
      wins: reviewWins,
      lessons: reviewLessons,
      challenges: reviewChallenges,
      focus: reviewFocus,
      evaluationNotes: reviewNotes,
    });
    setIsReviewModalOpen(false);
    setReviewWins('');
    setReviewLessons('');
    setReviewChallenges('');
    setReviewFocus('');
    setReviewNotes('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {variant === 'hub' ? (
        <>
      {/* Header & Page Title */}
      <div className="page-header">
        <div>
          <DateStamp />
          <div className="flex items-center gap-2 mb-1">
            <h1 className="page-title">
              Journal & Reflection
            </h1>
            <Badge tone="indigo" className="tabular-nums text-xs">
              {formatDate(selectedDate)}
            </Badge>
          </div>
          <p className="page-subtitle">
            Ruang kejernihan mental, refleksi rasa syukur, dan evaluasi berkala untuk pertumbuhan pribadi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon="star"
            onClick={() => setIsReviewModalOpen(true)}
            className="text-xs"
          >
            Tulis Evaluasi Berkala
          </Button>
        </div>
      </div>

      {/* Top Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 [&>*:nth-child(n+3)]:hidden md:[&>*:nth-child(n+3)]:block">
        <MetricCard glow
          icon="zap"
          label="Streak Refleksi"
          value={`${streak} Hari`}
          detail={streak > 0 ? 'Konsistensi terjaga' : 'Mulai entri hari ini'}
        />
        <MetricCard
          icon="star"
          label="Mood 7 Hari"
          value={avgMood !== 0 ? `${avgMood}/5` : '-'}
          detail={Number(avgMood) >= 4 ? 'Kondisi mental positif' : 'Perhatikan istirahat Anda'}
        />
        <MetricCard
          icon="activity"
          label="Energi 7 Hari"
          value={avgEnergy !== 0 ? `${avgEnergy}/5` : '-'}
          detail={Number(avgEnergy) >= 4 ? 'Energi sangat prima' : 'Atur ritme kerja Anda'}
        />
        <MetricCard
          icon="book"
          label="Total Jurnal"
          value={state.journals.length}
          detail={`${state.reviews.length} evaluasi berkala`}
        />
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 min-w-0">
        <div role="tablist" className="seg">
          <button
            onClick={() => setActiveTab('today')}
            role="tab" aria-selected={activeTab === 'today'} className="seg-item"
          >
            <Icon name="edit" size={14} className={activeTab === 'today' ? 'text-indigo-500' : ''} />
            Refleksi Hari Ini
            {currentJournal && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            role="tab" aria-selected={activeTab === 'archive'} className="seg-item"
          >
            <Icon name="bookOpen" size={14} className={activeTab === 'archive' ? 'text-indigo-500' : ''} />
            Riwayat & Arsip Jurnal
            <span className="seg-count">
              {state.journals.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            role="tab" aria-selected={activeTab === 'reviews'} className="seg-item"
          >
            <Icon name="review" size={14} className={activeTab === 'reviews' ? 'text-indigo-500' : ''} />
            Evaluasi Berkala (Reviews)
            <span className="seg-count">
              {state.reviews.length}
            </span>
          </button>
        </div>
      </div>

        </>
      ) : (
        <PageHeader back="/journal" title="Refleksi Hari Ini" subtitle={formatDate(selectedDate)} />
      )}

      {variant === 'hub' && activeTab === 'today' && (
        <Surface className="md:hidden p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Refleksi hari ini</h2>
            <span className={currentJournal ? 'status bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' : 'status bg-muted text-muted-foreground'}>
              {currentJournal ? 'Sudah diisi' : 'Belum diisi'}
            </span>
          </div>
          {currentJournal ? (
            <dl className="grid grid-cols-2 gap-3">
              <div className="well"><dt className="text-xs text-muted-foreground">Mood</dt><dd className="figure-lg text-2xl">{currentJournal.mood}<span className="unit">/ 5</span></dd></div>
              <div className="well"><dt className="text-xs text-muted-foreground">Energi</dt><dd className="figure-lg text-2xl">{currentJournal.energy}<span className="unit">/ 5</span></dd></div>
              {currentJournal.gratitude_1 && (
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Disyukuri</dt><dd className="text-sm mt-0.5 line-clamp-2">{currentJournal.gratitude_1}</dd></div>
              )}
            </dl>
          ) : (
            <p className="text-[13px] text-muted-foreground">{dailyPrompt}</p>
          )}
          <Button href="/journal/today" variant="primary" icon="edit" className="w-full h-12">
            {currentJournal ? 'Lihat & ubah refleksi' : 'Tulis refleksi hari ini'}
          </Button>
        </Surface>
      )}

      {/* TAB 1: REFLEKSI HARI INI */}
      {(variant === 'today' || activeTab === 'today') && (
        <div className={(variant === 'hub' ? 'hidden md:grid' : 'grid') + ' grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6'}>
          {/* Main Reflection Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <Surface className="p-6">
              <form onSubmit={handleSaveJournal} className="space-y-6">
                {/* Status Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {isToday ? 'Refleksi Hari Ini' : `Refleksi Tanggal: ${selectedDate}`}
                    </span>
                    {currentJournal ? (
                      <Badge tone="green" className="text-xs py-0 px-2">
                        Tersimpan
                      </Badge>
                    ) : (
                      <Badge tone="gray" className="text-xs py-0 px-2">
                        Belum Diisi
                      </Badge>
                    )}
                  </div>
                  {saveSuccess && (
                    <span className="text-xs font-medium text-emerald-500 flex items-center gap-1 ">
                      <Icon name="checkCircle" size={14} /> Refleksi berhasil disimpan!
                    </span>
                  )}
                </div>

                {/* Mood & Energy Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mood Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Mood / Suasana Hati</span>
                      <span className="font-normal lowercase text-xs text-foreground">
                        {MOOD_CONFIG.find((m) => m.level === mood)?.label}
                      </span>
                    </label>
                    <div className="grid grid-cols-5 gap-1.5 bg-muted/20 p-1.5 rounded-xl border border-border">
                      {MOOD_CONFIG.map((m) => {
                        const active = mood === m.level;
                        return (
                          <button
                            key={m.level}
                            type="button"
                            onClick={() => setMood(m.level)}
                            className={cn(
                              'flex flex-col items-center justify-center py-2.5 rounded-lg text-xs transition-colors min-h-[44px]',
                              active
                                ? 'bg-background shadow-card text-foreground font-medium border border-border ring-1 ring-primary/20'
                                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                            )}
                          >
                            <Icon name={m.icon} size={20} className="mb-1" />
                            <span className="text-xs tabular-nums">{m.level}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Energy Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Level Energi</span>
                      <span className="font-normal lowercase text-xs text-foreground">
                        {ENERGY_CONFIG.find((e) => e.level === energy)?.label}
                      </span>
                    </label>
                    <div className="grid grid-cols-5 gap-1.5 bg-muted/20 p-1.5 rounded-xl border border-border">
                      {ENERGY_CONFIG.map((e) => {
                        const active = energy === e.level;
                        return (
                          <button
                            key={e.level}
                            type="button"
                            onClick={() => setEnergy(e.level)}
                            className={cn(
                              'flex flex-col items-center justify-center py-2.5 rounded-lg text-xs transition-colors min-h-[44px]',
                              active
                                ? 'bg-background shadow-card text-foreground font-medium border border-border ring-1 ring-primary/20'
                                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                            )}
                          >
                            <div className="flex items-center gap-0.5 mb-1 h-3">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <span
                                  key={idx}
                                  className={cn(
                                    'w-1 h-2 rounded-xs',
                                    idx < e.level ? e.color : 'bg-muted/40'
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-xs tabular-nums">{e.level}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3 Gratitudes Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Icon name="star" size={13} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      3 Hal yang Disyukuri Hari Ini (Gratitude)
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs tabular-nums font-medium text-muted-foreground/60">
                        1.
                      </span>
                      <input
                        type="text"
                        value={gratitude1}
                        onChange={(e) => setGratitude1(e.target.value)}
                        placeholder="Hal sederhana yang membuat hari Anda lebih baik"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-foreground" aria-label="Hal sederhana yang membuat hari Anda lebih baik"
/>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs tabular-nums font-medium text-muted-foreground/60">
                        2.
                      </span>
                      <input
                        type="text"
                        value={gratitude2}
                        onChange={(e) => setGratitude2(e.target.value)}
                        placeholder="Seseorang atau interaksi berharga hari ini"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-foreground" aria-label="Seseorang atau interaksi berharga hari ini"
/>
                    </div>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs tabular-nums font-medium text-muted-foreground/60">
                        3.
                      </span>
                      <input
                        type="text"
                        value={gratitude3}
                        onChange={(e) => setGratitude3(e.target.value)}
                        placeholder="Peluang atau berkat tersembunyi"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-foreground" aria-label="Peluang atau berkat tersembunyi"
/>
                    </div>
                  </div>
                </div>

                {/* Daily Win */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Icon name="trophy" size={13} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      Kemenangan Hari Ini (Daily Win)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={win}
                    onChange={(e) => setWin(e.target.value)}
                    placeholder="Apa pencapaian atau satu hal terbaik yang berhasil Anda selesaikan?"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-foreground" aria-label="Apa pencapaian atau satu hal terbaik yang berhasil Anda selesaikan?"
/>
                </div>

                {/* Deep Reflection */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                        <Icon name="penTool" size={13} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        Refleksi & Catatan Bebas
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Tuliskan pikiran, perasaan, atau pelajaran penting hari ini secara leluasa"
                    className="w-full p-3 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-foreground resize-y leading-relaxed" aria-label="Tuliskan pikiran, perasaan, atau pelajaran penting hari ini secara leluasa"
/>
                </div>

                {/* Next Action */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <Icon name="target" size={13} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      Satu Fokus Utama Esok Hari (Next Priority)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    placeholder="Satu hal paling esensial yang ingin Anda capai besok"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-foreground" aria-label="Satu hal paling esensial yang ingin Anda capai besok"
/>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    icon="check"
                    className="px-6"
                  >
                    {currentJournal ? 'Perbarui Refleksi' : 'Simpan Refleksi'}
                  </Button>
                </div>
              </form>
            </Surface>
          </div>

          {/* Side Mindful Panel (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Daily Prompt Card */}
            <Surface className="p-5 border-l-4 border-l-indigo-500">
              <div className="flex items-center gap-2 text-indigo-500 mb-2">
                <Icon name="sparkles" size={16} />
                <span className="text-xs font-medium ">
                  Pertanyaan Reflektif Hari Ini
                </span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                "{dailyPrompt}"
              </p>
              <p className="text-xs text-muted-foreground mt-3 font-medium">
                Gunakan pertanyaan ini untuk memicu kejernihan pikiran dalam jurnal Anda.
              </p>
            </Surface>

            {/* Energy & stress (sheets 10 + 14) */}
            <Surface className="p-5 space-y-3">
              <h2 className="section-title">Energi & stres</h2>
              <ReflectionExtras date={selectedDate} />
            </Surface>

            {/* Yesterday's Recap Card */}
            <Surface className="p-5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Icon name="clock" size={13} />
                  Kilas Balik Kemarin
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {yesterdayDate}
                </span>
              </div>

              {yesterdayJournal ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge tone="indigo" className="text-xs">
                      Mood: {yesterdayJournal.mood}/5
                    </Badge>
                    <Badge tone="green" className="text-xs">
                      Energi: {yesterdayJournal.energy}/5
                    </Badge>
                  </div>
                  {yesterdayJournal.win && (
                    <div className="text-xs">
                      <span className="text-xs font-medium text-muted-foreground block">
                        Win Kemarin:
                      </span>
                      <p className="text-foreground font-medium mt-0.5 line-clamp-2">
                        {yesterdayJournal.win}
                      </p>
                    </div>
                  )}
                  {yesterdayJournal.next && (
                    <div className="text-xs bg-muted/20 p-2.5 rounded-lg border border-border">
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300 block">
                        Fokus yang Direncanakan:
                      </span>
                      <p className="text-foreground font-medium mt-0.5">
                        {yesterdayJournal.next}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Tidak ada catatan refleksi pada hari kemarin.
                  </p>
                </div>
              )}
            </Surface>

            {/* Quick Tips */}
            <Surface className="p-5 bg-muted/10">
              <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                <Icon name="lightbulb" size={14} className="text-amber-500" />
                Manfaat Menulis Jurnal
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Menurunkan beban kognitif dan overthinking sebelum tidur.</li>
                <li>Membangun rasa syukur yang terbukti meningkatkan kebahagiaan harian.</li>
                <li>Menciptakan rekam jejak pertumbuhan pola pikir jangka panjang.</li>
              </ul>
            </Surface>
          </div>
        </div>
      )}

      {/* TAB 2: ARSIP & RIWAYAT JURNAL */}
      {variant === 'hub' && activeTab === 'archive' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search & Filter Bar */}
          <Surface className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Icon
                name="search"
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Cari win, rasa syukur, atau refleksi"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-indigo-500 text-foreground" aria-label="Cari win, rasa syukur, atau refleksi"
/>
            </div>

            {/* Mood Filter Pill */}
            <div role="tablist" className="seg">
              <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">
                Filter Mood:
              </span>
              <button
                onClick={() => setMoodFilter('all')}
                role="tab" aria-selected={moodFilter === 'all'} className="seg-item"
              >
                Semua
              </button>
              {MOOD_CONFIG.map((m) => (
                <button
                  key={m.level}
                  onClick={() => setMoodFilter(m.level)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-xs rounded-lg font-medium transition-colors shrink-0',
                    moodFilter === m.level
                      ? 'bg-foreground text-background font-medium'
                      : 'text-muted-foreground hover:bg-muted/30'
                  )}
                >
                  <Icon name={m.icon} size={16} />
                  <span>{m.level}</span>
                </button>
              ))}
            </div>
          </Surface>

          {/* Entries Feed */}
          {filteredJournals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJournals.map((entry) => {
                const moodObj = MOOD_CONFIG.find((m) => m.level === entry.mood);
                const hasGratitudes =
                  entry.gratitude_1 || entry.gratitude_2 || entry.gratitude_3;

                return (
                  <Surface
                    key={entry.id}
                    className="p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors cursor-pointer group"
                    onClick={() => setViewingJournal(entry)}
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-medium text-foreground">
                            {formatDate(entry.date)}
                          </strong>
                          {entry.date === todayISO() && (
                            <Badge tone="indigo" className="text-xs py-0">
                              Hari Ini
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Badge tone={moodObj?.tone || 'gray'} className="text-xs flex items-center gap-1">
                            {moodObj && <Icon name={moodObj.icon} size={14} />}
                            <span>Mood {entry.mood}/5</span>
                          </Badge>
                          <Badge tone="indigo" className="text-xs">
                            Energi {entry.energy}/5
                          </Badge>
                          <button
                            onClick={async () => {
                              if (confirm('Hapus entri jurnal ini?')) {
                                await deleteJournal(entry.id);
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                            title="Hapus Jurnal"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Daily Win Banner */}
                      {entry.win && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs flex items-start gap-2">
                          <Icon name="trophy" size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-medium text-emerald-500 block">
                              Daily Win
                            </span>
                            <p className="text-foreground font-medium line-clamp-1">{entry.win}</p>
                          </div>
                        </div>
                      )}

                      {/* Gratitude Chips */}
                      {hasGratitudes && (
                        <div className="space-y-1 text-xs">
                          <span className="text-xs font-semibold text-muted-foreground block">
                            Gratitude
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.gratitude_1 && (
                              <span className="px-2 py-0.5 rounded-md bg-muted/30 border border-border text-xs text-foreground truncate max-w-[200px]">
                                1. {entry.gratitude_1}
                              </span>
                            )}
                            {entry.gratitude_2 && (
                              <span className="px-2 py-0.5 rounded-md bg-muted/30 border border-border text-xs text-foreground truncate max-w-[200px]">
                                2. {entry.gratitude_2}
                              </span>
                            )}
                            {entry.gratitude_3 && (
                              <span className="px-2 py-0.5 rounded-md bg-muted/30 border border-border text-xs text-foreground truncate max-w-[200px]">
                                3. {entry.gratitude_3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Reflection Excerpt */}
                      {entry.reflection && (
                        <div className="text-xs text-muted-foreground line-clamp-3 pt-1 leading-relaxed">
                          {entry.reflection}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-border mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="target" size={12} className="text-purple-500" />
                        Next: {entry.next || 'Tidak ada target'}
                      </span>
                      <span className="text-primary font-semibold group-hover:underline">
                        Lihat Selengkapnya →
                      </span>
                    </div>
                  </Surface>
                );
              })}
            </div>
          ) : (
            <Surface className="p-8">
              <EmptyState
                message={
                  searchQuery || moodFilter !== 'all'
                    ? 'Tidak ada jurnal yang sesuai dengan kriteria filter.'
                    : 'Belum ada entri jurnal yang tersimpan. Mulai tulis refleksi pertama Anda'
                }
              />
            </Surface>
          )}
        </div>
      )}

      {/* TAB 3: EVALUASI BERKALA (REVIEWS) */}
      {variant === 'hub' && activeTab === 'reviews' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Action & Filter Bar */}
          <Surface className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">
                Periode:
              </span>
              {(['all', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setReviewPeriodFilter(period)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-lg font-medium transition-colors capitalize shrink-0',
                    reviewPeriodFilter === period
                      ? 'bg-foreground text-background font-medium'
                      : 'text-muted-foreground hover:bg-muted/30'
                  )}
                >
                  {period === 'all' ? 'Semua' : period}
                </button>
              ))}
            </div>

            <Button
              variant="primary"
              icon="plus"
              onClick={() => setIsReviewModalOpen(true)}
              className="text-xs w-full sm:w-auto"
            >
              Tulis Review Baru
            </Button>
          </Surface>

          {/* Reviews List */}
          {filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.map((r) => (
                <Surface key={r.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-medium text-foreground">
                        {formatDate(r.date)}
                      </strong>
                      <Badge tone="indigo" className="text-xs font-medium ">
                        {r.period}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="green" className="flex items-center gap-1 text-xs">
                        <Icon name="star" size={12} className="text-emerald-500" />
                        <span className="font-medium">{r.score}/5</span>
                      </Badge>
                      <button
                        onClick={async () => {
                          if (confirm('Hapus evaluasi ini?')) {
                            await deleteReview(r.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                        title="Hapus Review"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {r.wins && (
                      <div className="flex items-start gap-2">
                        <Icon name="trophy" size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">Wins: </span>
                          <span className="text-muted-foreground">{r.wins}</span>
                        </div>
                      </div>
                    )}
                    {r.lessons && (
                      <div className="flex items-start gap-2">
                        <Icon name="lightbulb" size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">Pelajaran: </span>
                          <span className="text-muted-foreground">{r.lessons}</span>
                        </div>
                      </div>
                    )}
                    {r.challenges && (
                      <div className="flex items-start gap-2">
                        <Icon name="alertCircle" size={14} className="text-rose-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">Tantangan: </span>
                          <span className="text-muted-foreground">{r.challenges}</span>
                        </div>
                      </div>
                    )}
                    {r.focus && (
                      <div className="flex items-start gap-2 pt-2 border-t border-border">
                        <Icon name="target" size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium text-indigo-500">Fokus Berikutnya: </span>
                          <span className="text-foreground font-medium">{r.focus}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Surface>
              ))}
            </div>
          ) : (
            <Surface className="p-8">
              <EmptyState message="Belum ada riwayat evaluasi berkala. Tekan 'Tulis Review Baru' untuk memulai." />
            </Surface>
          )}
        </div>
      )}

      {/* DETAIL JOURNAL MODAL */}
      <Dialog open={!!viewingJournal} onOpenChange={(open) => !open && setViewingJournal(null)}>
        <DialogContent className="max-w-xl">
          {viewingJournal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <DialogTitle className="text-lg font-medium">
                    Jurnal: {formatDate(viewingJournal.date)}
                  </DialogTitle>
                </div>
                <DialogDescription>
                  Entri refleksi lengkap dari hari tersebut.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2 text-xs">
                {/* Mood & Energy */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Mood:</span>
                    <strong className="text-foreground text-sm">
                      Mood {viewingJournal.mood}/5
                    </strong>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Energi:</span>
                    <strong className="text-foreground text-sm">
                      Energi {viewingJournal.energy}/5
                    </strong>
                  </div>
                </div>

                {/* Gratitudes */}
                <div className="space-y-1.5">
                  <h4 className="font-medium text-foreground text-xs flex items-center gap-1">
                    <Icon name="star" size={13} className="text-amber-500" /> 3 Hal yang Disyukuri
                  </h4>
                  <div className="space-y-1 pl-2">
                    <p className="text-muted-foreground">1. {viewingJournal.gratitude_1 || '-'}</p>
                    <p className="text-muted-foreground">2. {viewingJournal.gratitude_2 || '-'}</p>
                    <p className="text-muted-foreground">3. {viewingJournal.gratitude_3 || '-'}</p>
                  </div>
                </div>

                {/* Win */}
                {viewingJournal.win && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <h4 className="font-medium text-emerald-500 text-xs mb-1 flex items-center gap-1">
                      <Icon name="trophy" size={13} /> Kemenangan Hari Ini
                    </h4>
                    <p className="text-foreground font-medium">{viewingJournal.win}</p>
                  </div>
                )}

                {/* Reflection */}
                {viewingJournal.reflection && (
                  <div className="space-y-1">
                    <h4 className="font-medium text-foreground text-xs">
                      Refleksi & Catatan
                    </h4>
                    <div className="p-3 rounded-lg bg-muted/20 border border-border text-foreground leading-relaxed whitespace-pre-wrap">
                      {viewingJournal.reflection}
                    </div>
                  </div>
                )}

                {/* Next */}
                {viewingJournal.next && (
                  <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <h4 className="font-medium text-indigo-500 text-xs mb-1 flex items-center gap-1">
                      <Icon name="target" size={13} /> Target / Langkah Esok Hari
                    </h4>
                    <p className="text-foreground font-medium">{viewingJournal.next}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewingJournal(null)}>
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* NEW REVIEW MODAL */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={handleSaveReview}>
            <DialogHeader>
              <DialogTitle className="text-lg font-medium flex items-center gap-2">
                <Icon name="review" size={18} className="text-indigo-500" />
                Tulis Evaluasi Berkala
              </DialogTitle>
              <DialogDescription>
                Tinjau kemajuan, tantangan, dan tentukan prioritas fokus berikutnya.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* Period & Score */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5">
                    Periode Evaluasi
                  </label>
                  <select
                    value={reviewPeriod}
                    onChange={(e: any) => setReviewPeriod(e.target.value)}
                    className="glass-input"
                  >
                    <option value="daily">Harian (Daily)</option>
                    <option value="weekly">Mingguan (Weekly)</option>
                    <option value="monthly">Bulanan (Monthly)</option>
                    <option value="yearly">Tahunan (Yearly)</option>
                  </select>
                </div>

                <div>
                  <label className="label mb-1.5">
                    Skor Kinerja (1-5)
                  </label>
                  <select
                    value={reviewScore}
                    onChange={(e) => setReviewScore(Number(e.target.value))}
                    className="glass-input"
                  >
                    <option value={5}>5 - Sangat Luar Biasa (Superb)</option>
                    <option value={4}>4 - Baik / Produktif (Good)</option>
                    <option value={3}>3 - Cukup / Standar (Average)</option>
                    <option value={2}>2 - Kurang Memuaskan (Needs Work)</option>
                    <option value={1}>1 - Sangat Rendah (Poor)</option>
                  </select>
                </div>
              </div>

              {/* Wins */}
              <div>
                <label className="label mb-1.5">
                  Pencapaian Utama (Wins)
                </label>
                <textarea
                  rows={2}
                  value={reviewWins}
                  onChange={(e) => setReviewWins(e.target.value)}
                  placeholder="Apa pencapaian atau 20% tindakan yang menghasilkan 80% dampak?"
                  className="w-full p-2.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none" aria-label="Apa pencapaian atau 20% tindakan yang menghasilkan 80% dampak?"
/>
              </div>

              {/* Lessons */}
              <div>
                <label className="label mb-1.5">
                  Pelajaran Terbesar (Lessons Learned)
                </label>
                <textarea
                  rows={2}
                  value={reviewLessons}
                  onChange={(e) => setReviewLessons(e.target.value)}
                  placeholder="Pelajaran atau insight apa yang Anda dapatkan?"
                  className="w-full p-2.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none" aria-label="Pelajaran atau insight apa yang Anda dapatkan?"
/>
              </div>

              {/* Challenges */}
              <div>
                <label className="label mb-1.5">
                  Hambatan / Distraksi (Challenges)
                </label>
                <textarea
                  rows={2}
                  value={reviewChallenges}
                  onChange={(e) => setReviewChallenges(e.target.value)}
                  placeholder="Apa yang menghambat kemajuan atau menguras energi Anda?"
                  className="w-full p-2.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none" aria-label="Apa yang menghambat kemajuan atau menguras energi Anda?"
/>
              </div>

              {/* Focus */}
              <div>
                <label className="label mb-1.5">
                  Fokus Utama Periode Selanjutnya (Next Focus)
                </label>
                <input
                  type="text"
                  value={reviewFocus}
                  onChange={(e) => setReviewFocus(e.target.value)}
                  placeholder="Satu atau dua prioritas utama untuk periode berikutnya"
                  className="glass-input" aria-label="Satu atau dua prioritas utama untuk periode berikutnya"
/>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReviewModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Evaluasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
