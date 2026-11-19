'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLifeOS, LearningSession, LearningSubject, LearningModule, DictionaryEntry } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { MetricCard } from '@/components/ui/MetricCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDate, todayISO, inLastDays, safeUrl, cn } from '@/lib/utils';

const VOCAB_LANGUAGES = ['English', 'Tech Terms', 'Japanese', 'Arabic', 'Other'];

export default function LearningDashboardPage() {
  const {
    state,
    addLearningSubject,
    deleteLearningSubject,
    addLearningModule,
    deleteLearningModule,
    toggleLearningModuleCompletion,
    addLearningSession,
    deleteLearningSession,
    addDictionaryEntry,
    deleteDictionaryEntry,
  } = useLifeOS();

  const { t, locale } = useI18n();
  const router = useRouter();
  const selectedDate = state.selectedDate || todayISO();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'paths' | 'sessions' | 'dictionary'>('paths');

  // Stats Calculations
  const todayMinutes = useMemo(() => {
    return (state.learning || [])
      .filter((item) => item.date === selectedDate)
      .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  }, [state.learning, selectedDate]);

  const totalMinutes7Days = useMemo(() => {
    return (state.learning || [])
      .filter((item) => inLastDays(item.date, 7, selectedDate))
      .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  }, [state.learning, selectedDate]);

  const totalModules = state.learningModules?.length || 0;
  const completedModules = state.learningModules?.filter((m) => m.isCompleted).length || 0;
  const totalDictionaryWords = (state.dictionary || []).length;

  // DIALOG STATES
  const [isNewSubjectModalOpen, setIsNewSubjectModalOpen] = useState(false);
  const [isNewModuleModalOpen, setIsNewModuleModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [targetSubjectForModule, setTargetSubjectForModule] = useState<LearningSubject | null>(null);

  // Subject Form State
  const [subjectTitle, setSubjectTitle] = useState('');
  const [subjectDesc, setSubjectDesc] = useState('');

  // Module Form State
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleVideoLink, setModuleVideoLink] = useState('');
  const [moduleMaterial, setModuleMaterial] = useState('');

  // SESSIONS STATE
  const [sessionSearch, setSessionSearch] = useState('');
  const [quickTopic, setQuickTopic] = useState('');
  const [quickMinutes, setQuickMinutes] = useState('30');
  const [quickResource, setQuickResource] = useState('');
  const [quickLink, setQuickLink] = useState('');
  const [quickStatus, setQuickStatus] = useState<'to_learn' | 'learning' | 'completed'>('completed');

  // DICTIONARY STATE
  const [dictSearch, setDictSearch] = useState('');
  const [dictLanguageFilter, setDictLanguageFilter] = useState<string>('all');
  const [quickIndo, setQuickIndo] = useState('');
  const [quickTrans, setQuickTrans] = useState('');
  const [quickLang, setQuickLang] = useState('English');
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flashcardFlipped, setFlashcardFlipped] = useState<Record<string, boolean>>({});

  // Submit New Subject
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectTitle.trim()) return;

    await addLearningSubject(subjectTitle.trim(), subjectDesc.trim());
    setIsNewSubjectModalOpen(false);
    setSubjectTitle('');
    setSubjectDesc('');
  };

  // Submit New Module
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSubjectForModule || !moduleTitle.trim()) return;

    await addLearningModule(targetSubjectForModule.id, {
      title: moduleTitle.trim(),
      contentVideoLink: moduleVideoLink.trim(),
      contentMaterial: moduleMaterial.trim(),
      isCompleted: false,
      orderIndex: (state.learningModules?.filter((m) => m.subjectId === targetSubjectForModule.id).length || 0) + 1,
    });

    setIsNewModuleModalOpen(false);
    setTargetSubjectForModule(null);
    setModuleTitle('');
    setModuleVideoLink('');
    setModuleMaterial('');
  };

  // Quick Add Session
  const handleQuickAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(quickMinutes, 10);
    if (!quickTopic.trim() || isNaN(mins) || mins <= 0) return;

    await addLearningSession({
      date: selectedDate,
      topic: quickTopic.trim(),
      resource: quickResource.trim(),
      link: quickLink.trim(),
      status: quickStatus,
      minutes: mins,
      notes: '',
    });

    setQuickTopic('');
    setQuickResource('');
    setQuickLink('');
  };

  // Quick Add Dictionary Entry
  const handleQuickAddDictionary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickIndo.trim() || !quickTrans.trim()) return;

    await addDictionaryEntry({
      indonesian: quickIndo.trim(),
      translation: quickTrans.trim(),
      language: quickLang,
    });

    setQuickIndo('');
    setQuickTrans('');
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return (state.learning || [])
      .filter((s) => {
        if (sessionSearch.trim()) {
          const q = sessionSearch.toLowerCase();
          const matchTopic = s.topic?.toLowerCase().includes(q);
          const matchResource = s.resource?.toLowerCase().includes(q);
          const matchNotes = s.notes?.toLowerCase().includes(q);
          if (!matchTopic && !matchResource && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.learning, sessionSearch]);

  // Filtered Dictionary Entries
  const filteredDictionary = useMemo(() => {
    return (state.dictionary || [])
      .filter((entry) => {
        if (dictLanguageFilter !== 'all' && entry.language !== dictLanguageFilter) return false;
        if (dictSearch.trim()) {
          const q = dictSearch.toLowerCase();
          const matchIndo = entry.indonesian?.toLowerCase().includes(q);
          const matchTrans = entry.translation?.toLowerCase().includes(q);
          if (!matchIndo && !matchTrans) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || '0').getTime() - new Date(a.createdAt || '0').getTime());
  }, [state.dictionary, dictLanguageFilter, dictSearch]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.025em] leading-[1.15] text-foreground flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Icon name="book" size={17} />
              </span>
              Knowledge & Learning
            </h1>
            <Badge tone="amber" className="font-mono tabular-nums text-xs">
              {todayMinutes}m Hari Ini
            </Badge>
          </div>
          <p className="text-sm leading-[1.6] text-zinc-600 dark:text-zinc-400 mt-1 max-w-prose">
            Pusat manajemen pengetahuan, kurikulum belajar terarah, log sesi studi, dan bank kosakata bahasa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon="plus"
            onClick={() => setIsNewSubjectModalOpen(true)}
            className="text-xs"
          >
            Jalur Belajar Baru
          </Button>
          <Button
            variant="primary"
            icon="edit"
            onClick={() => setActiveTab('sessions')}
            className="text-xs"
          >
            Catat Sesi Belajar
          </Button>
        </div>
      </div>

      {/* Top Strategic Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="activity"
          label="Belajar Hari Ini"
          value={`${todayMinutes} Menit`}
          detail={todayMinutes >= 30 ? 'Target harian tercapai!' : 'Yuk alokasikan 30 menit'}
          glow={todayMinutes >= 30}
        />
        <MetricCard
          icon="calendar"
          label="7 Hari Terakhir"
          value={`${Math.floor(totalMinutes7Days / 60)}j ${totalMinutes7Days % 60}m`}
          detail="Total akumulasi belajar"
        />
        <MetricCard
          icon="checkCircle"
          label="Modul Diselesaikan"
          value={totalModules > 0 ? `${completedModules}/${totalModules}` : '0'}
          detail={totalModules > 0 ? `${Math.round((completedModules / totalModules) * 100)}% kurikulum tuntas` : 'Belum ada silabus'}
          glow={completedModules > 0}
        />
        <MetricCard
          icon="globe"
          label="Bank Kosakata"
          value={totalDictionaryWords}
          detail="Kata asing & istilah teknis"
        />
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-2 overflow-x-auto gap-4">
        <div className="flex p-1 bg-muted/30 rounded-xl border border-border shrink-0">
          <button
            onClick={() => setActiveTab('paths')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'paths'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="bookOpen" size={14} className={activeTab === 'paths' ? 'text-amber-500' : ''} />
            Jalur Pembelajaran & Silabus
            <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px]">
              {state.learningSubjects?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'sessions'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="activity" size={14} className={activeTab === 'sessions' ? 'text-amber-500' : ''} />
            Log Sesi & Waktu Studi
            <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px]">
              {state.learning?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'dictionary'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="globe" size={14} className={activeTab === 'dictionary' ? 'text-amber-500' : ''} />
            Kamus & Flashcards
            <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px]">
              {totalDictionaryWords}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: JALUR PEMBELAJARAN (LEARNING PATHS & MODULES) */}
      {activeTab === 'paths' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Surface className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Kurikulum & Jalur Pembelajaran Aktif
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Strukturkan materi belajar ke dalam modul-modul sistematis untuk penguasaan skill mendalam.
              </p>
            </div>
            <Button
              variant="primary"
              icon="plus"
              onClick={() => setIsNewSubjectModalOpen(true)}
              className="text-xs"
            >
              Buat Jalur Baru
            </Button>
          </Surface>

          {state.learningSubjects && state.learningSubjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {state.learningSubjects.map((subject) => {
                const modules = state.learningModules?.filter((m) => m.subjectId === subject.id) || [];
                const doneCount = modules.filter((m) => m.isCompleted).length;
                const progressPct = modules.length > 0 ? Math.round((doneCount / modules.length) * 100) : 0;

                return (
                  <Surface key={subject.id} className="p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Subject Top Bar */}
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="block text-base font-bold text-foreground">
                            {subject.title}
                          </strong>
                          {subject.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {subject.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={async () => {
                              if (confirm(`Hapus jalur belajar "${subject.title}" beserta seluruh modulnya?`)) {
                                await deleteLearningSubject(subject.id);
                              }
                            }}
                            className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                            title="Hapus Jalur"
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs font-mono">
                          <span className="text-muted-foreground">
                            Progres: {doneCount}/{modules.length} Modul
                          </span>
                          <strong className="text-amber-500 font-bold">{progressPct}%</strong>
                        </div>
                        <ProgressBar value={doneCount} max={modules.length || 1} />
                      </div>

                      {/* Modules Checklist Preview */}
                      <div className="pt-2 border-t border-border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Daftar Modul ({modules.length}):
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetSubjectForModule(subject);
                              setIsNewModuleModalOpen(true);
                            }}
                            className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            + Tambah Modul
                          </button>
                        </div>

                        {modules.length > 0 ? (
                          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                            {modules.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border text-xs group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={m.isCompleted}
                                    onChange={() => toggleLearningModuleCompletion(m.id)}
                                    className="rounded border-border text-amber-500 focus:ring-amber-500 cursor-pointer"
                                  />
                                  <span className={cn('truncate', m.isCompleted && 'line-through text-muted-foreground')}>
                                    {m.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100">
                                  {m.contentVideoLink && (
                                    <a
                                      href={safeUrl(m.contentVideoLink)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1 text-muted-foreground hover:text-foreground"
                                      title="Video Materi"
                                    >
                                      <Icon name="playCircle" size={13} />
                                    </a>
                                  )}
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Hapus modul "${m.title}"?`)) {
                                        await deleteLearningModule(m.id);
                                      }
                                    }}
                                    className="text-muted-foreground hover:text-destructive p-0.5"
                                  >
                                    <Icon name="trash" size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic py-2 text-center">
                            Belum ada modul. Klik "+ Tambah Modul" untuk menyusun silabus.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Link */}
                    <div className="pt-3 border-t border-border flex items-center justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/learning/paths/${subject.id}`)}
                        className="text-xs"
                      >
                        Buka Detail Silabus Lengkap →
                      </Button>
                    </div>
                  </Surface>
                );
              })}
            </div>
          ) : (
            <Surface className="p-8">
              <EmptyState message="Belum ada jalur pembelajaran. Buat topik pertama Anda seperti 'Belajar Next.js 15' atau 'System Design'!" />
            </Surface>
          )}
        </div>
      )}

      {/* TAB 2: LOG SESI & WAKTU BELAJAR (STUDY SESSIONS) */}
      {activeTab === 'sessions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Inline Fast Add Study Session */}
          <Surface className="p-4">
            <form onSubmit={handleQuickAddSession} className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Icon name="activity" size={13} className="text-amber-500" />
                Catat Sesi Waktu Belajar
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Topik materi (cth: Belajar Radix Dialog, Algoritma Graf)..."
                  value={quickTopic}
                  onChange={(e) => setQuickTopic(e.target.value)}
                  className="sm:col-span-5 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-amber-500 text-foreground"
                />
                <input
                  type="number"
                  placeholder="Menit..."
                  value={quickMinutes}
                  onChange={(e) => setQuickMinutes(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-amber-500 text-foreground font-mono"
                />
                <input
                  type="text"
                  placeholder="Sumber/Buku..."
                  value={quickResource}
                  onChange={(e) => setQuickResource(e.target.value)}
                  className="sm:col-span-3 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-amber-500 text-foreground"
                />
                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    variant="primary"
                    icon="plus"
                    className="w-full text-xs py-2"
                  >
                    Catat
                  </Button>
                </div>
              </div>
            </form>
          </Surface>

          {/* Search Bar */}
          <Surface className="p-4 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Icon
                name="search"
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Cari topik atau sumber materi..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-amber-500 text-foreground"
              />
            </div>
          </Surface>

          {/* Sessions Feed */}
          {filteredSessions.length > 0 ? (
            <Surface className="overflow-hidden">
              <div className="divide-y divide-border">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <Icon name="book" size={16} />
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-xs font-semibold text-foreground truncate">
                          {session.topic}
                        </strong>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                          <span>{formatDate(session.date)}</span>
                          {session.resource && (
                            <>
                              <span>•</span>
                              <span>{session.resource}</span>
                            </>
                          )}
                          {session.link && (
                            <>
                              <span>•</span>
                              <a
                                href={safeUrl(session.link)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline"
                              >
                                Tautan Materi
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge tone="amber" className="font-mono text-xs font-bold">
                        {session.minutes} Menit
                      </Badge>
                      <button
                        onClick={async () => {
                          if (confirm(`Hapus catatan sesi "${session.topic}"?`)) {
                            await deleteLearningSession(session.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                        title="Hapus Sesi"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
          ) : (
            <Surface className="p-8">
              <EmptyState message="Belum ada riwayat sesi belajar. Catat sesi studi Anda di atas!" />
            </Surface>
          )}
        </div>
      )}

      {/* TAB 3: KAMUS & FLASHCARDS (VOCABULARY) */}
      {activeTab === 'dictionary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Inline Fast Add Word */}
          <Surface className="p-4">
            <form onSubmit={handleQuickAddDictionary} className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Icon name="globe" size={13} className="text-blue-500" />
                Tambah Kosakata Baru ke Kamus
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Kata/Istilah asing (cth: Serendipity, Idempotent)..."
                  value={quickIndo}
                  onChange={(e) => setQuickIndo(e.target.value)}
                  className="sm:col-span-5 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-blue-500 text-foreground"
                />
                <input
                  type="text"
                  placeholder="Terjemahan / Arti bahasa Indonesia..."
                  value={quickTrans}
                  onChange={(e) => setQuickTrans(e.target.value)}
                  className="sm:col-span-4 px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-blue-500 text-foreground"
                />
                <select
                  value={quickLang}
                  onChange={(e) => setQuickLang(e.target.value)}
                  className="sm:col-span-2 px-2.5 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden text-foreground"
                >
                  {VOCAB_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <div className="sm:col-span-1">
                  <Button
                    type="submit"
                    variant="primary"
                    icon="plus"
                    className="w-full text-xs py-2 px-0 flex justify-center"
                  >
                    Simpan
                  </Button>
                </div>
              </div>
            </form>
          </Surface>

          {/* Filter & Flashcard Mode Toggle Bar */}
          <Surface className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Icon
                name="search"
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Cari kata atau arti..."
                value={dictSearch}
                onChange={(e) => setDictSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-blue-500 text-foreground"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={dictLanguageFilter}
                onChange={(e) => setDictLanguageFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
              >
                <option value="all">Semua Bahasa</option>
                {VOCAB_LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              <Button
                variant={isFlashcardMode ? 'primary' : 'outline'}
                size="sm"
                icon="sparkles"
                onClick={() => setIsFlashcardMode(!isFlashcardMode)}
                className="text-xs"
              >
                {isFlashcardMode ? 'Mode Daftar' : 'Mode Flashcard'}
              </Button>
            </div>
          </Surface>

          {/* Flashcard / Grid View */}
          {filteredDictionary.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredDictionary.map((entry) => {
                const isFlipped = flashcardFlipped[entry.id] ?? false;

                if (isFlashcardMode) {
                  return (
                    <Surface
                      key={entry.id}
                      onClick={() =>
                        setFlashcardFlipped((prev) => ({ ...prev, [entry.id]: !isFlipped }))
                      }
                      className="p-6 h-40 flex flex-col justify-between items-center text-center cursor-pointer hover:border-blue-500/50 transition-all select-none bg-gradient-to-br from-card to-muted/20"
                    >
                      <Badge tone="blue" className="text-[10px]">
                        {entry.language} • {isFlipped ? 'Arti' : 'Kata'}
                      </Badge>
                      <div className="space-y-1 my-auto">
                        <strong className="text-base font-bold text-foreground block">
                          {isFlipped ? entry.translation : entry.indonesian}
                        </strong>
                        <p className="text-[11px] text-muted-foreground italic">
                          (Klik untuk membalik kartu)
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {isFlipped ? `Asal: ${entry.indonesian}` : `Arti: ???`}
                      </span>
                    </Surface>
                  );
                }

                return (
                  <Surface key={entry.id} className="p-4 flex flex-col justify-between space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <strong className="text-sm font-bold text-foreground block">
                          {entry.indonesian}
                        </strong>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                          {entry.translation}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge tone="blue" className="text-[10px]">
                          {entry.language}
                        </Badge>
                        <button
                          onClick={async () => {
                            if (confirm(`Hapus kata "${entry.indonesian}"?`)) {
                              await deleteDictionaryEntry(entry.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </div>
                  </Surface>
                );
              })}
            </div>
          ) : (
            <Surface className="p-8">
              <EmptyState message="Belum ada kosakata tersimpan. Tambahkan kata baru di atas!" />
            </Surface>
          )}
        </div>
      )}

      {/* DIALOG 1: MODAL JALUR BELAJAR BARU */}
      <Dialog open={isNewSubjectModalOpen} onOpenChange={setIsNewSubjectModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateSubject}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Icon name="book" size={18} className="text-amber-500" />
                Buat Jalur Pembelajaran Baru
              </DialogTitle>
              <DialogDescription>
                Tentukan kurikulum topik atau keahlian yang ingin Anda pelajari.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Judul Topik Pembelajaran *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Full-Stack Next.js 15 & System Design"
                  value={subjectTitle}
                  onChange={(e) => setSubjectTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Deskripsi / Tujuan Belajar (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan target keahlian dan silabus umum..."
                  value={subjectDesc}
                  onChange={(e) => setSubjectDesc(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewSubjectModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Jalur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: MODAL TAMBAH MODUL KE JALUR */}
      <Dialog open={isNewModuleModalOpen} onOpenChange={setIsNewModuleModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateModule}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Icon name="plus" size={18} className="text-amber-500" />
                Tambah Modul Materi
              </DialogTitle>
              <DialogDescription>
                Tambahkan bab materi ke "{targetSubjectForModule?.title}".
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Judul Modul / Bab *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Server Actions & Mutasi Database"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Tautan Video Materi / Tutorial (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={moduleVideoLink}
                  onChange={(e) => setModuleVideoLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Catatan Ringkas Materi (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Poin penting atau ringkasan silabus modul..."
                  value={moduleMaterial}
                  onChange={(e) => setModuleMaterial(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewModuleModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Modul
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
