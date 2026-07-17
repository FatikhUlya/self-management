'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { MiniChart } from '@/components/ui/MiniChart';
import { Modal } from '@/components/ui/Modal';
import { formatDate, lastSevenDays, dayName, inLastDays } from '@/lib/utils';
import { LEARNING_STATUSES, LearningStatus } from '@/lib/constants';

export default function LearningPage() {
  const { 
    state, 
    addLearningSession, 
    deleteLearningSession,
    updateLearningSessionNotes,
    addDictionaryEntry,
    deleteDictionaryEntry 
  } = useLifeOS();
  const { t, locale } = useI18n();

  // Tab state
  const [activeTab, setActiveTab] = useState<'session' | 'dictionary'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeos_learning_tab');
      if (saved === 'session' || saved === 'dictionary') return saved;
    }
    return 'session';
  });

  const handleTabChange = (tab: 'session' | 'dictionary') => {
    setActiveTab(tab);
    localStorage.setItem('lifeos_learning_tab', tab);
  };

  // Study Session Form states
  const [topic, setTopic] = useLocalStorageState('draft_learning_topic', '');
  const [resource, setResource] = useLocalStorageState('draft_learning_resource', '');
  const [link, setLink] = useLocalStorageState('draft_learning_link', '');
  const [status, setStatus] = useLocalStorageState<LearningStatus>('draft_learning_status', 'learning');
  const [date, setDate] = useLocalStorageState('draft_learning_date', state.selectedDate);
  const [minutes, setMinutes] = useLocalStorageState<number>('draft_learning_minutes', 30);
  const [notes, setNotes] = useLocalStorageState('draft_learning_notes', '');

  // Cornell Notes Modal states
  const [isCornellModalOpen, setIsCornellModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [cues, setCues] = useLocalStorageState(
    selectedSession ? `draft_cornell_cues_${selectedSession.id}` : 'draft_cornell_cues_temp', 
    ''
  );
  const [notesContent, setNotesContent] = useLocalStorageState(
    selectedSession ? `draft_cornell_notes_${selectedSession.id}` : 'draft_cornell_notes_temp', 
    ''
  );
  const [summary, setSummary] = useLocalStorageState(
    selectedSession ? `draft_cornell_summary_${selectedSession.id}` : 'draft_cornell_summary_temp', 
    ''
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Dictionary states
  const [indonesianWord, setIndonesianWord] = useLocalStorageState('draft_dict_indonesian', '');
  const [translatedWord, setTranslatedWord] = useLocalStorageState('draft_dict_translated', '');
  const [vocabLanguage, setVocabLanguage] = useLocalStorageState('draft_dict_language', 'English');
  const [customLanguage, setCustomLanguage] = useLocalStorageState('draft_dict_customLanguage', '');
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [selectedFilterLang, setSelectedFilterLang] = useState<string | null>(null);
  const [vocabFlipDirection, setVocabFlipDirection] = useState<'indo-target' | 'target-indo'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeos_dictionary_flip');
      if (saved === 'indo-target' || saved === 'target-indo') return saved;
    }
    return 'indo-target';
  });

  const handleFlipDirectionToggle = () => {
    const next = vocabFlipDirection === 'indo-target' ? 'target-indo' : 'indo-target';
    setVocabFlipDirection(next);
    localStorage.setItem('lifeos_dictionary_flip', next);
  };

  const handleOpenCornellNotes = (session: any) => {
    setSelectedSession(session);
    setCues(session.notesCues || '');
    setNotesContent(session.notesNotes || '');
    setSummary(session.notesSummary || '');
    setIsCornellModalOpen(true);
  };

  const handleSaveCornellNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    await updateLearningSessionNotes(selectedSession.id, cues, notesContent, summary);
    setIsCornellModalOpen(false);
    setSelectedSession(null);
  };

  const [exportLanguageFilter, setExportLanguageFilter] = useState<string>('all');

  // Sorted dictionary entries
  const sortedDictionary = React.useMemo(() => {
    return [...(state.dictionary || [])].sort((a, b) => {
      if (vocabFlipDirection === 'indo-target') {
        return a.indonesian.localeCompare(b.indonesian, locale === 'id' ? 'id-ID' : 'en-US');
      } else {
        return a.translation.localeCompare(b.translation, locale === 'id' ? 'id-ID' : 'en-US');
      }
    });
  }, [state.dictionary, vocabFlipDirection, locale]);

  const totalMinutes7Days = state.learning
    .filter((item) => inLastDays(item.date, 7, state.selectedDate))
    .reduce((sum, item) => sum + Number(item.minutes || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    await addLearningSession({
      date,
      topic,
      resource,
      link,
      status,
      minutes,
      notes,
    });

    setTopic('');
    setResource('');
    setLink('');
    setNotes('');
  };

  const handleDictionarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indonesianWord.trim() || !translatedWord.trim()) return;

    const language = vocabLanguage === 'Other' ? (customLanguage.trim() || 'Other') : vocabLanguage;

    await addDictionaryEntry({
      indonesian: indonesianWord.trim(),
      translation: translatedWord.trim(),
      language: language,
    });

    setIndonesianWord('');
    setTranslatedWord('');
    setCustomLanguage('');
  };

  // Grouping learning logs by status (To Learn, Learning, Completed)
  const renderStatusLane = (laneStatus: LearningStatus, titleKey: string) => {
    const laneItems = state.learning
      .filter((item) => item.status === laneStatus)
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          item.topic.toLowerCase().includes(query) ||
          item.notes.toLowerCase().includes(query) ||
          (item.notesCues && item.notesCues.toLowerCase().includes(query)) ||
          (item.notesNotes && item.notesNotes.toLowerCase().includes(query)) ||
          (item.notesSummary && item.notesSummary.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="flex-1 min-w-[260px] bg-white/[0.005] border border-life-line rounded-xl p-4 flex flex-col h-[400px]">
        <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/5">
          <h4 className="text-xs font-black uppercase text-life-muted tracking-wider">{t(titleKey as any)}</h4>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/[0.04] text-life-muted border border-life-line">
            {laneItems.length}
          </span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {laneItems.length > 0 ? (
            laneItems.map((item) => (
              <div 
                key={item.id} 
                className="p-3.5 rounded-lg bg-white/[0.01] border border-life-line hover:border-life-line-strong hover:bg-white/[0.015] transition-all duration-150 space-y-2 relative"
              >
                <div className="min-w-0">
                  <strong className="text-xs font-bold text-life-text block leading-tight tracking-tight">
                    {item.topic}
                  </strong>
                  <p className="text-[10px] text-life-muted mt-1 leading-normal">
                    {item.notes || t('learning_no_notes')}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="flex flex-wrap gap-1 items-center">
                    <Badge tone="indigo">{`${item.minutes}m`}</Badge>
                    <span className="text-[9px] text-life-muted font-bold">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <div className="flex space-x-1.5 items-center">
                    {item.link && (
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-life-muted hover:text-life-teal transition-colors p-1"
                        title="Buka resource link"
                      >
                        <Icon name="arrowRight" size={12} />
                      </a>
                    )}
                    <button
                      onClick={() => handleOpenCornellNotes(item)}
                      className={`p-1 transition-colors ${
                        item.notesNotes || item.notesCues || item.notesSummary
                          ? 'text-teal-400 hover:text-teal-300'
                          : 'text-life-muted hover:text-life-text'
                      }`}
                      title="Buka Catatan Cornell"
                    >
                      <Icon name="book" size={12} />
                    </button>
                    <button
                      onClick={() => deleteLearningSession(item.id)}
                      className="text-life-muted hover:text-life-rose transition-colors p-1"
                      title={t('delete')}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    );
  };

  // Learning Chart: minutes studied per day in the last 7 days
  const chartPoints = lastSevenDays(state.selectedDate).map((day) => ({
    label: dayName(day, locale === 'id' ? 'id-ID' : 'en-US'),
    value: state.learning
      .filter((item) => item.date === day)
      .reduce((sum, item) => sum + Number(item.minutes || 0), 0),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600 dark:from-amber-300 dark:to-orange-500 flex items-center gap-2">
            <Icon name="book" size={28} className="text-amber-500" />
            {t('learning_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Catat sesi pembelajaran, minutes of learning, dan riwayat kamus kosakata.
          </p>
        </div>
      </div>

      {/* Forms & Chart Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Study Session Form / Dictionary Tab */}
        <Surface className="p-6">
          <div className="flex justify-between items-center border-b border-life-line pb-3 mb-4">
            <div className="flex gap-4 select-none">
              <button
                type="button"
                onClick={() => handleTabChange('session')}
                className={`text-sm font-bold uppercase tracking-wider border-b-2 pb-1.5 transition-all ${
                  activeTab === 'session'
                    ? 'border-life-teal text-life-text'
                    : 'border-transparent text-life-muted hover:text-life-text'
                }`}
              >
                {t('learning_session')}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('dictionary')}
                className={`text-sm font-bold uppercase tracking-wider border-b-2 pb-1.5 transition-all ${
                  activeTab === 'dictionary'
                    ? 'border-life-teal text-life-text'
                    : 'border-transparent text-life-muted hover:text-life-text'
                }`}
              >
                {t('dictionary_title')}
              </button>
            </div>
            {activeTab === 'session' ? (
              <p className="text-xs text-life-muted">
                {totalMinutes7Days} {t('learning_in_7_days')}
              </p>
            ) : (
              <p className="text-xs text-life-muted">
                {(state.dictionary || []).length} {locale === 'id' ? 'kosa kata' : 'words'}
              </p>
            )}
          </div>

          {activeTab === 'session' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="topic" className="text-xs font-bold text-life-muted uppercase">
                    {t('learning_topic')}
                  </label>
                  <input
                    id="topic"
                    type="text"
                    required
                    placeholder="E.g. Figma components, D5 Render, QGIS..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="resource" className="text-xs font-bold text-life-muted uppercase">
                    {t('learning_resource')}
                  </label>
                  <input
                    id="resource"
                    type="text"
                    placeholder={t('learning_resource_placeholder')}
                    value={resource}
                    onChange={(e) => setResource(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="link" className="text-xs font-bold text-life-muted uppercase">
                    {t('learning_link')}
                  </label>
                  <input
                    id="link"
                    type="url"
                    placeholder={t('learning_link_placeholder')}
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="status" className="text-xs font-bold text-life-muted uppercase">
                    {t('learning_status')}
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LearningStatus)}
                    className="glass-select text-xs"
                  >
                    <option value="to_learn">{t('learning_to_learn')}</option>
                    <option value="learning">{t('learning_learning')}</option>
                    <option value="completed">{t('learning_completed')}</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="minutes" className="text-xs font-bold text-life-muted uppercase">
                    {t('learning_minutes')}
                  </label>
                  <input
                    id="minutes"
                    type="number"
                    min="1"
                    required
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="date" className="text-xs font-bold text-life-muted uppercase">
                    {t('learning_date')}
                  </label>
                  <input
                    id="date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label htmlFor="notes" className="text-xs font-bold text-life-muted uppercase">
                    {t('notes')}
                  </label>
                  <input
                    id="notes"
                    type="text"
                    placeholder="Catatan ringkas pelajaran..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" icon="plus" className="w-full">
                {t('learning_add_btn')}
              </Button>
            </form>
          )}

          {activeTab === 'dictionary' && (
            <div className="space-y-4">
              <form onSubmit={handleDictionarySubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="indoWord" className="text-xs font-bold text-life-muted uppercase">
                      {t('dictionary_indo')}
                    </label>
                    <input
                      id="indoWord"
                      type="text"
                      required
                      placeholder="Contoh: Selamat pagi, Kopi, Kucing..."
                      value={indonesianWord}
                      onChange={(e) => setIndonesianWord(e.target.value)}
                      className="glass-input text-sm"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label htmlFor="targetWord" className="text-xs font-bold text-life-muted uppercase">
                      {t('dictionary_target')}
                    </label>
                    <input
                      id="targetWord"
                      type="text"
                      required
                      placeholder="Contoh: Good morning, Coffee, Cat..."
                      value={translatedWord}
                      onChange={(e) => setTranslatedWord(e.target.value)}
                      className="glass-input text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="flex flex-col space-y-1">
                    <label htmlFor="vocabLang" className="text-xs font-bold text-life-muted uppercase">
                      {t('dictionary_lang')}
                    </label>
                    <select
                      id="vocabLang"
                      value={vocabLanguage}
                      onChange={(e) => setVocabLanguage(e.target.value)}
                      className="glass-select text-xs"
                    >
                      <option value="English">English</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Mandarin">Mandarin</option>
                      <option value="Arabic">Arabic</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Korean">Korean</option>
                      <option value="Other">Lainnya (Tulis Sendiri)</option>
                    </select>
                  </div>

                  {vocabLanguage === 'Other' && (
                    <div className="flex flex-col space-y-1">
                      <label htmlFor="customLang" className="text-xs font-bold text-life-muted uppercase">
                        Bahasa Kustom
                      </label>
                      <input
                        id="customLang"
                        type="text"
                        required
                        placeholder="Nama Bahasa..."
                        value={customLanguage}
                        onChange={(e) => setCustomLanguage(e.target.value)}
                        className="glass-input text-xs"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" className="flex-1 text-xs py-2">
                      {t('dictionary_add_btn')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs py-2"
                      onClick={() => setIsSummaryOpen(true)}
                    >
                      {t('dictionary_summary_btn')}
                    </Button>
                  </div>
                </div>
              </form>

              {/* Added Vocabulary List */}
              <div className="border-t border-life-line pt-3 mt-4">
                <div className="flex justify-between items-center mb-2.5">
                  <h4 className="text-xs font-black uppercase text-life-muted tracking-wider">
                    {locale === 'id' ? 'Daftar Kosa Kata' : 'Vocabulary List'}
                  </h4>
                  <button
                    type="button"
                    onClick={handleFlipDirectionToggle}
                    className="text-[10px] font-black uppercase bg-white/[0.03] border border-life-line hover:bg-white/[0.07] px-2 py-0.5 rounded transition-all flex items-center gap-1.5 select-none"
                  >
                    <Icon name="review" size={10} />
                    {vocabFlipDirection === 'indo-target' ? 'Indo ➔ Asing' : 'Asing ➔ Indo'}
                  </button>
                </div>
                <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                  {sortedDictionary.length > 0 ? (
                    sortedDictionary.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-2 rounded bg-white/[0.01] border border-life-line text-xs"
                      >
                        <div className="min-w-0">
                          {vocabFlipDirection === 'indo-target' ? (
                            <>
                              <span className="font-bold text-life-text">{entry.indonesian}</span>
                              <span className="text-life-muted mx-1.5">➔</span>
                              <span className="text-teal-400 font-bold">{entry.translation}</span>
                            </>
                          ) : (
                            <>
                              <span className="font-bold text-teal-400">{entry.translation}</span>
                              <span className="text-life-muted mx-1.5">➔</span>
                              <span className="font-bold text-life-text">{entry.indonesian}</span>
                            </>
                          )}
                          <Badge tone="teal" className="ml-2 py-0 px-1 text-[8px]">
                            {entry.language}
                          </Badge>
                        </div>
                        <button
                          onClick={() => deleteDictionaryEntry(entry.id)}
                          className="text-life-muted hover:text-life-rose transition-colors p-1"
                          title={t('delete')}
                        >
                          <Icon name="trash" size={10} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-life-muted italic text-center py-2">
                      {t('no_data')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Surface>

        {/* Right: Learning Chart */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('learning_chart')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">{t('learning_chart_desc')}</p>
          </div>

          <MiniChart points={chartPoints} colorClass="bg-gradient-to-t from-life-indigo/40 to-life-indigo" />
        </Surface>
      </div>

      {/* Learning Status Kanban Board */}
      <Surface className="p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-life-line pb-3 mb-4 gap-3">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              Daftar Target Belajar & Progres
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Eksplorasi software arsitektur (D5 Render, Figma, QGIS, dll)
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari topik atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-8 text-xs w-full py-1.5"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-life-muted text-[10px]">
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-life-muted hover:text-life-text text-xs p-1"
                title="Hapus pencarian"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 overflow-x-auto">
          {renderStatusLane('to_learn', 'learning_to_learn')}
          {renderStatusLane('learning', 'learning_learning')}
          {renderStatusLane('completed', 'learning_completed')}
        </div>
      </Surface>

      {/* Dictionary Language Summary & NotebookLM Export Modal */}
      <Modal
        isOpen={isSummaryOpen}
        onClose={() => {
          setIsSummaryOpen(false);
          setCopiedNotification(false);
        }}
        title={t('dictionary_summary_title')}
        subtitle={locale === 'id' ? 'Ekspor data kosa kata Anda untuk NotebookLM' : 'Export vocabulary list to NotebookLM'}
      >
        <div className="space-y-4">
          {/* Classification Summary */}
          <div className="bg-white/[0.01] border border-life-line rounded-xl p-3.5 space-y-2">
            <h4 className="text-xs font-black uppercase text-life-muted tracking-wider">
              {locale === 'id' ? 'Klasifikasi Bahasa' : 'Language Breakdown'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(
                (state.dictionary || []).reduce((acc, entry) => {
                  const lang = entry.language || 'English';
                  acc[lang] = (acc[lang] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([lang, count]) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedFilterLang(lang)}
                  className="transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                  title={locale === 'id' ? `Lihat daftar kata bahasa ${lang}` : `View ${lang} word list`}
                >
                  <Badge tone="indigo">
                    {`${lang}: ${count} ${locale === 'id' ? 'kata' : 'words'}`}
                  </Badge>
                </button>
              ))}
              {(state.dictionary || []).length === 0 && (
                <p className="text-xs text-life-muted italic">{t('no_data')}</p>
              )}
            </div>
          </div>

          {/* Export Box */}
          {(() => {
            const existingLanguages = Array.from(
              new Set((state.dictionary || []).map((e) => e.language || 'English'))
            );
            const filteredExportEntries = (state.dictionary || []).filter(
              (e) => exportLanguageFilter === 'all' || e.language === exportLanguageFilter
            );
            const rawExportText = filteredExportEntries.length > 0
              ? `Kamus Pribadi (My Dictionary) - Ekspor NotebookLM\n` +
                `Filter: ${
                  exportLanguageFilter === 'all'
                    ? (locale === 'id' ? 'Semua Bahasa' : 'All Languages')
                    : exportLanguageFilter
                }\n` +
                `Format: Bahasa Indonesia => Bahasa Asing (Klasifikasi)\n\n` +
                filteredExportEntries
                  .map((e, i) => `${i + 1}. ${e.indonesian} => ${e.translation} (${e.language})`)
                  .join('\n')
              : (locale === 'id' ? 'Kamus masih kosong.' : 'Dictionary is empty.');

            return (
              <>
                <div className="flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-life-muted uppercase">
                      Data Raw untuk NotebookLM
                    </label>
                    <select
                      value={exportLanguageFilter}
                      onChange={(e) => setExportLanguageFilter(e.target.value)}
                      className="glass-select text-[10px] py-0.5 px-1.5 max-w-max bg-black/40 border border-white/10 rounded"
                    >
                      <option value="all">{locale === 'id' ? 'Semua Bahasa' : 'All Languages'}</option>
                      {existingLanguages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    readOnly
                    value={rawExportText}
                    rows={6}
                    className="glass-input text-xs font-mono p-2.5 resize-none bg-black/25 select-all"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={async () => {
                      await navigator.clipboard.writeText(rawExportText);
                      setCopiedNotification(true);
                      setTimeout(() => setCopiedNotification(false), 2000);
                    }}
                    variant="primary"
                    className={`flex-1 text-xs transition-all duration-300 ${
                      copiedNotification ? 'from-emerald-500 to-teal-600' : ''
                    }`}
                    disabled={filteredExportEntries.length === 0}
                  >
                    {copiedNotification ? t('dictionary_copied') : t('dictionary_notebooklm_btn')}
                  </Button>

                  <a
                    href="https://notebooklm.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-text hover:text-white rounded-lg transition-all"
                  >
                    <Icon name="globe" size={12} />
                    {t('dictionary_notebooklm_link')}
                  </a>
                </div>
              </>
            );
          })()}

          <p className="text-[10px] text-life-muted leading-relaxed">
            {locale === 'id'
              ? '* NotebookLM Tips: Salin data di atas, lalu buka Google NotebookLM dan tempelkan sebagai source (sumber catatan baru). NotebookLM akan bisa mengolah daftar kosa kata tersebut menjadi kuis interaktif maupun flashcard secara otomatis.'
              : '* NotebookLM Tips: Copy the data above, then open Google NotebookLM and paste it as a new source notes. NotebookLM can then process the vocabulary list to automatically generate interactive quizzes or flashcards.'}
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={selectedFilterLang !== null}
        onClose={() => setSelectedFilterLang(null)}
        title={`${locale === 'id' ? 'Daftar Kosa Kata' : 'Vocabulary List'} - ${selectedFilterLang}`}
        subtitle={locale === 'id' ? `Menampilkan semua kosa kata dalam bahasa ${selectedFilterLang}` : `Showing all words classified as ${selectedFilterLang}`}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/[0.01] border border-life-line rounded-lg p-2">
            <span className="text-[10px] text-life-muted font-bold uppercase tracking-wider">
              {locale === 'id' ? 'Format & Urutan:' : 'Format & Sort:'}
            </span>
            <button
              type="button"
              onClick={handleFlipDirectionToggle}
              className="text-[10px] font-black uppercase bg-white/[0.03] border border-life-line hover:bg-white/[0.07] px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 select-none text-life-text"
            >
              <Icon name="review" size={10} />
              {vocabFlipDirection === 'indo-target' ? 'Indo ➔ Asing' : 'Asing ➔ Indo'}
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {selectedFilterLang &&
              sortedDictionary
                .filter((entry) => entry.language === selectedFilterLang)
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-life-line text-xs"
                  >
                    <div className="min-w-0">
                      {vocabFlipDirection === 'indo-target' ? (
                        <>
                          <span className="font-bold text-life-text">{entry.indonesian}</span>
                          <span className="text-life-muted mx-1.5">➔</span>
                          <span className="text-teal-400 font-bold">{entry.translation}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-teal-400">{entry.translation}</span>
                          <span className="text-life-muted mx-1.5">➔</span>
                          <span className="font-bold text-life-text">{entry.indonesian}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => deleteDictionaryEntry(entry.id)}
                      className="text-life-muted hover:text-life-rose transition-colors p-1"
                      title={t('delete')}
                    >
                      <Icon name="trash" size={10} />
                    </button>
                  </div>
                ))}
          </div>
        </div>
      </Modal>

      {/* Cornell Notes Modal */}
      <Modal
        isOpen={isCornellModalOpen}
        onClose={() => {
          setIsCornellModalOpen(false);
          setSelectedSession(null);
        }}
        title={`Catatan Cornell: ${selectedSession?.topic || ''}`}
        subtitle="Metode Cornell: Hubungkan Pertanyaan (Cues), Catatan Detail (Notes), dan Rangkuman Akhir (Summary)."
        size="lg"
      >
        <form onSubmit={handleSaveCornellNotes} className="space-y-4">
          {/* Top side-by-side block */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Column: Cues/Questions (30%) */}
            <div className="flex flex-col space-y-1 md:col-span-1 border-r border-white/5 pr-0 md:pr-4">
              <label htmlFor="cornellCues" className="text-xs font-black text-teal-400 uppercase tracking-wider">
                Cues / Pertanyaan
              </label>
              <p className="text-[9px] text-life-muted">Tulis kata kunci, pertanyaan kunci, atau penanda di sini.</p>
              <textarea
                id="cornellCues"
                value={cues}
                onChange={(e) => setCues(e.target.value)}
                placeholder="Misal:&#10;- Apa itu REST API?&#10;- Ciri utama OOP...&#10;- Poin penting slide 3"
                className="glass-input text-xs resize-none h-[280px] mt-1"
              />
            </div>

            {/* Right Column: Detailed Notes (70%) */}
            <div className="flex flex-col space-y-1 md:col-span-2">
              <label htmlFor="cornellNotes" className="text-xs font-black text-indigo-400 uppercase tracking-wider">
                Notes / Catatan Detail
              </label>
              <p className="text-[9px] text-life-muted">Tulis rangkuman rinci, poin-poin penting, atau contoh kode di sini.</p>
              <textarea
                id="cornellNotes"
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder="Tulis detail materi yang dipelajari di sini secara lengkap..."
                className="glass-input text-xs resize-none h-[280px] mt-1"
              />
            </div>
          </div>

          {/* Bottom portion: Summary (Full width) */}
          <div className="flex flex-col space-y-1 pt-3 border-t border-white/5">
            <label htmlFor="cornellSummary" className="text-xs font-black text-amber-500 uppercase tracking-wider font-semibold">
              Summary / Rangkuman
            </label>
            <p className="text-[9px] text-life-muted">Kesimpulan singkat sesi belajar ini dalam 2-3 kalimat.</p>
            <textarea
              id="cornellSummary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Tulis kesimpulan keseluruhan dari sesi belajar ini..."
              className="glass-input text-xs resize-none h-[80px] mt-1"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/5 bg-white/[0.01] -mx-6 -mb-6 p-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCornellModalOpen(false);
                setSelectedSession(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Catatan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
