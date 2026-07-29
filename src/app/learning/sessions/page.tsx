'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import { LearningStatus } from '@/lib/constants';

export default function LearningSessionsPage() {
  const { 
    state, 
    addLearningSession, 
    deleteLearningSession,
    updateLearningSessionNotes
  } = useLifeOS();
  const { t, locale } = useI18n();

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
      <div className="flex-1 min-w-[300px] bg-white/[0.005] border border-life-line rounded-xl p-4 flex flex-col h-[500px]">
        <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/5">
          <h4 className="text-xs font-black uppercase text-life-muted tracking-wider">{t(titleKey as any)}</h4>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/[0.04] text-life-muted border border-life-line">
            {laneItems.length}
          </span>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {laneItems.length > 0 ? (
            laneItems.map((item) => (
              <div 
                key={item.id} 
                className="p-4 rounded-xl bg-white/[0.01] border border-life-line hover:border-life-line-strong hover:bg-white/[0.015] transition-all duration-150 space-y-3 relative group"
              >
                <div className="min-w-0">
                  <strong className="text-sm font-bold text-life-text block leading-tight tracking-tight">
                    {item.topic}
                  </strong>
                  <p className="text-xs text-life-muted mt-1.5 leading-relaxed line-clamp-2">
                    {item.notes || t('learning_no_notes')}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge tone="indigo" className="text-[10px]">{`${item.minutes}m`}</Badge>
                    <span className="text-[10px] text-life-muted font-bold">
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
                        <Icon name="arrowRight" size={14} />
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
                      <Icon name="book" size={14} />
                    </button>
                    <button
                      onClick={() => deleteLearningSession(item.id)}
                      className="text-life-muted hover:text-life-rose transition-colors p-1 opacity-0 group-hover:opacity-100"
                      title={t('delete')}
                    >
                      <Icon name="trash" size={14} />
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/learning">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="playCircle" size={24} className="text-amber-500" />
            Sesi Pembelajaran
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Catat topik yang Anda pelajari, catat dengan metode Cornell, dan kelola statusnya.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Surface className="p-6 lg:col-span-1 h-fit">
          <div className="border-b border-life-line pb-3 mb-5">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {locale === 'id' ? 'Sesi Baru' : 'New Session'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="topic" className="text-xs font-bold text-life-muted uppercase">
                {t('learning_topic')}
              </label>
              <input
                id="topic"
                type="text"
                required
                placeholder="E.g. React Hooks, UX Design..."
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
                className="glass-input text-sm"
              />
            </div>

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
                className="glass-input text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                {t('learning_notes')}
              </label>
              <textarea
                id="notes"
                placeholder={locale === 'id' ? "Catatan singkat..." : "Brief notes..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input text-sm h-20"
              />
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full justify-center mt-2">
              {t('learning_add_btn')}
            </Button>
          </form>
        </Surface>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('learning_log')} (Kanban Board)
            </h3>
            <div className="relative w-full sm:w-64">
              <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-life-muted" />
              <input 
                type="text" 
                placeholder={t('search')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input pl-9 h-9 text-xs w-full"
              />
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            <div className="snap-center min-w-[300px]">
              {renderStatusLane('to_learn', 'learning_to_learn')}
            </div>
            <div className="snap-center min-w-[300px]">
              {renderStatusLane('learning', 'learning_learning')}
            </div>
            <div className="snap-center min-w-[300px]">
              {renderStatusLane('completed', 'learning_completed')}
            </div>
          </div>
        </div>
      </div>

      {/* Cornell Notes Modal */}
      <Modal
        isOpen={isCornellModalOpen}
        onClose={() => {
          setIsCornellModalOpen(false);
          setSelectedSession(null);
        }}
        title={`Cornell Notes: ${selectedSession?.topic}`}
      >
        <form onSubmit={handleSaveCornellNotes} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cues Column */}
            <div className="md:col-span-1 space-y-1">
              <label className="text-[10px] font-black uppercase text-life-muted tracking-wider">
                {locale === 'id' ? 'Kata Kunci / Pertanyaan (Cues)' : 'Cues / Keywords'}
              </label>
              <textarea
                value={cues}
                onChange={(e) => setCues(e.target.value)}
                placeholder={locale === 'id' ? "Konsep utama, pertanyaan untuk review..." : "Main concepts, questions for review..."}
                className="glass-input text-xs h-[300px]"
              />
            </div>
            
            {/* Notes Column */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase text-life-muted tracking-wider">
                {locale === 'id' ? 'Catatan (Notes)' : 'Notes'}
              </label>
              <textarea
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder={locale === 'id' ? "Catat penjelasan materi di sini secara detail..." : "Record detailed explanations here..."}
                className="glass-input text-xs h-[300px]"
              />
            </div>
          </div>

          {/* Summary Row */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-life-muted tracking-wider">
              {locale === 'id' ? 'Ringkasan (Summary)' : 'Summary'}
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={locale === 'id' ? "Ringkas seluruh materi di atas dalam 1-2 kalimat..." : "Summarize the entire material in 1-2 sentences..."}
              className="glass-input text-xs h-24"
            />
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setIsCornellModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" icon="check">
              {t('save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
