'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/utils';
import { PRIORITY_OPTIONS, Priority } from '@/lib/constants';

export default function CapturePage() {
  const { state, addIdea, archiveIdea, deleteIdea } = useLifeOS();
  const { t } = useI18n();

  // Form states
  const [title, setTitle] = useState('');
  const [area, setArea] = useState('Career');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [notes, setNotes] = useState('');

  const activeIdeas = state.ideas.filter((idea) => idea.status !== 'archived');
  const archivedIdeas = state.ideas.filter((idea) => idea.status === 'archived');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addIdea({ title, area, priority, notes });
    setTitle('');
    setArea('Career');
    setPriority('Medium');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-600 dark:from-indigo-300 dark:to-blue-500 flex items-center gap-2">
            <Icon name="lightbulb" size={28} className="text-indigo-500" />
            {t('capture_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            {t('capture_idea_desc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('capture_inbox')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {activeIdeas.length} {t('capture_active_ideas')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="title" className="text-xs font-bold text-life-muted uppercase">
                {t('capture_btn')}
              </label>
              <input
                id="title"
                type="text"
                required
                placeholder={t('capture_write_idea')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass-input text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label htmlFor="area" className="text-xs font-bold text-life-muted uppercase">
                  {t('area')}
                </label>
                <select
                  id="area"
                  value={area || 'Career'}
                  onChange={(e) => setArea(e.target.value)}
                  className="glass-select text-xs"
                >
                  <option value="Career">Career</option>
                  <option value="Finance">Finance</option>
                  <option value="Health">Health</option>
                  <option value="Learning">Learning</option>
                  <option value="Personal">Personal</option>
                  <option value="Relationship">Relationship</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="priority" className="text-xs font-bold text-life-muted uppercase">
                  {t('priority')}
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="glass-select text-xs"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="notes" className="text-xs font-bold text-life-muted uppercase">
                {t('notes')}
              </label>
              <textarea
                id="notes"
                placeholder={t('capture_notes_placeholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input text-xs h-24"
              />
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full">
              {t('capture_btn')}
            </Button>
          </form>
        </Surface>

        {/* Right: Active Ideas List */}
        <Surface className="p-6 flex flex-col">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('capture_idea_list')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {t('capture_idea_desc')}
            </p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-1">
            {activeIdeas.length > 0 ? (
              activeIdeas.map((idea) => (
                <article 
                  key={idea.id} 
                  className="p-3.5 rounded-lg bg-white/[0.01] border border-life-line hover:border-life-line-strong hover:bg-white/[0.02] transition-all duration-150 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <strong className="text-sm text-life-text block tracking-tight leading-tight">{idea.title}</strong>
                    <p className="text-xs text-life-muted">
                      {idea.notes || t('capture_no_notes')}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge tone="teal">{idea.area || 'Inbox'}</Badge>
                      <Badge tone={idea.priority === 'High' ? 'rose' : idea.priority === 'Medium' ? 'amber' : 'gray'}>
                        {idea.priority}
                      </Badge>
                      <span className="text-[10px] text-life-muted font-bold self-center">
                        {formatDate(idea.createdAt?.slice(0, 10))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => archiveIdea(idea.id)}
                      className="w-8 h-8 rounded-lg bg-white/[0.03] border border-life-line hover:bg-life-teal/20 hover:border-life-teal hover:text-life-teal text-life-muted flex items-center justify-center transition-all"
                      title={t('capture_archive')}
                    >
                      <Icon name="check" size={14} />
                    </button>
                    <button
                      onClick={() => deleteIdea(idea.id)}
                      className="w-8 h-8 rounded-lg bg-white/[0.03] border border-life-line hover:bg-life-rose/20 hover:border-life-rose hover:text-life-rose text-life-muted flex items-center justify-center transition-all"
                      title={t('delete')}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </Surface>
      </div>

      {/* Archive Section */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('capture_archive')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {archivedIdeas.length} {t('capture_processed')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
          {archivedIdeas.length > 0 ? (
            archivedIdeas.map((idea) => (
              <div 
                key={idea.id} 
                className="p-3 rounded-lg bg-white/[0.005] border border-life-line flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <strong className="text-xs text-life-muted line-through block truncate">{idea.title}</strong>
                  <p className="text-[10px] text-life-muted truncate mt-0.5">{idea.area || 'Inbox'}</p>
                </div>
                <div className="flex space-x-1.5 shrink-0">
                  <button
                    onClick={() => archiveIdea(idea.id)}
                    className="w-7 h-7 rounded-md bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted flex items-center justify-center transition-all"
                    title="Aktifkan kembali"
                  >
                    <Icon name="edit" size={12} />
                  </button>
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    className="w-7 h-7 rounded-md bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted flex items-center justify-center transition-all"
                    title={t('delete')}
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState />
            </div>
          )}
        </div>
      </Surface>
    </div>
  );
}
