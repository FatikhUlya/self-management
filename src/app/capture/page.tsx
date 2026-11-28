'use client';

import React, { useState, useMemo } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
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
import { formatDate, cn } from '@/lib/utils';
import { PRIORITY_OPTIONS, Priority, LIFE_AREAS } from '@/lib/constants';
import { DateStamp } from '@/components/ui/DateStamp';

export default function CapturePage() {
  const { state, addIdea, archiveIdea, deleteIdea, convertIdeaToTask, convertIdeaToProject } = useLifeOS();
  const { t, locale } = useI18n();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'inbox' | 'archived'>('inbox');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Inline Fast Capture Form State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickArea, setQuickArea] = useState<string>(LIFE_AREAS[1]);
  const [quickPriority, setQuickPriority] = useState<Priority>('Medium');

  // Modal Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalArea, setModalArea] = useState<string>(LIFE_AREAS[1]);
  const [modalPriority, setModalPriority] = useState<Priority>('Medium');
  const [modalNotes, setModalNotes] = useState('');

  // Active vs Archived
  const activeIdeas = useMemo(() => {
    return state.ideas.filter((idea) => idea.status !== 'archived');
  }, [state.ideas]);

  const archivedIdeas = useMemo(() => {
    return state.ideas.filter((idea) => idea.status === 'archived');
  }, [state.ideas]);

  // Filtered Ideas based on activeTab
  const displayedIdeas = useMemo(() => {
    const list = activeTab === 'inbox' ? activeIdeas : archivedIdeas;
    return list
      .filter((idea) => {
        if (areaFilter !== 'all' && (idea.area || 'General') !== areaFilter) return false;
        if (priorityFilter !== 'all' && idea.priority !== priorityFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = idea.title.toLowerCase().includes(q);
          const matchNotes = idea.notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || '0').getTime() - new Date(a.createdAt || '0').getTime());
  }, [activeTab, activeIdeas, archivedIdeas, areaFilter, priorityFilter, searchQuery]);

  // Fast Submit Idea
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    await addIdea({
      title: quickTitle.trim(),
      area: quickArea,
      priority: quickPriority,
      notes: '',
    });

    setQuickTitle('');
  };

  // Detailed Modal Submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    await addIdea({
      title: modalTitle.trim(),
      area: modalArea,
      priority: modalPriority,
      notes: modalNotes.trim(),
    });

    setIsModalOpen(false);
    setModalTitle('');
    setModalNotes('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Page Title */}
      <div className="page-header">
        <div>
          <DateStamp />
          <div className="flex items-center gap-2 mb-1">
            <h1 className="page-title">
              Quick Capture & Idea Inbox
            </h1>
            <Badge tone="indigo" className="tabular-nums text-xs">
              {activeIdeas.length} Ide di Inbox
            </Badge>
          </div>
          <p className="page-subtitle">
            Tampung seluruh ide mentah, inspirasi mendadak, dan konversikan ke tugas atau proyek terstruktur.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon="plus"
            onClick={() => setIsModalOpen(true)}
            className="text-xs"
          >
            Ide Lengkap (Detail)
          </Button>
        </div>
      </div>

      {/* Top Strategic Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard glow
          icon="lightbulb"
          label="Ide Aktif di Inbox"
          value={activeIdeas.length}
          detail="Siap diproses atau dieksekusi"
        />
        <MetricCard
          icon="checkSquare"
          label="Konversi ke Task"
          value={state.tasks.filter((t) => t.description?.includes('Diintegrasikan dari Life OS Tasks') || t.status === 'todo').length}
          detail="Tugas terencana di backlog"
        />
        <MetricCard
          icon="folder"
          label="Total Proyek Aktif"
          value={state.projects.filter((p) => p.status === 'active').length}
          detail="Inisiatif besar berjalan"
        />
        <MetricCard
          icon="checkCircle"
          label="Ide Terarsipkan"
          value={archivedIdeas.length}
          detail="Tuntas & telah diproses"
        />
      </div>

      {/* Inline Fast Capture Bar */}
      <Surface className="p-4">
        <form onSubmit={handleQuickSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Icon
              name="lightbulb"
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500"
            />
            <input
              type="text"
              required
              placeholder="Tulis ide atau pemikiran mentah Anda lalu tekan Enter"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-muted/20 border border-border focus:outline-none focus:border-indigo-500 text-foreground" aria-label="Tulis ide atau pemikiran mentah Anda lalu tekan Enter"
/>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={quickArea}
              onChange={(e) => setQuickArea(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none"
            >
              {LIFE_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <select
              value={quickPriority}
              onChange={(e: any) => setQuickPriority(e.target.value)}
              className="px-2.5 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <Button type="submit" variant="primary" icon="plus" className="text-xs shrink-0 py-2">
              Tangkap Ide
            </Button>
          </div>
        </form>
      </Surface>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 min-w-0">
        <div role="tablist" className="seg">
          <button
            onClick={() => setActiveTab('inbox')}
            role="tab" aria-selected={activeTab === 'inbox'} className="seg-item"
          >
            <Icon name="lightbulb" size={14} className={activeTab === 'inbox' ? 'text-indigo-500' : ''} />
            Kotak Masuk Ide (Inbox)
            <span className="seg-count">
              {activeIdeas.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            role="tab" aria-selected={activeTab === 'archived'} className="seg-item"
          >
            <Icon name="checkCircle" size={14} className={activeTab === 'archived' ? 'text-indigo-500' : ''} />
            Ide Terarsipkan
            <span className="seg-count">
              {archivedIdeas.length}
            </span>
          </button>
        </div>

        {/* Search & Area Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <Icon
              name="search"
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Cari ide"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none" aria-label="Cari ide"
/>
          </div>

          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-2 py-1 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none max-w-[120px] truncate"
          >
            <option value="all">Semua Area</option>
            {LIFE_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ideas Feed Grid */}
      {displayedIdeas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          {displayedIdeas.map((idea) => {
            const isHigh = idea.priority === 'High';
            return (
              <Surface
                key={idea.id}
                className="p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-sm font-medium text-foreground leading-snug">
                      {idea.title}
                    </strong>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        tone={isHigh ? 'rose' : idea.priority === 'Medium' ? 'amber' : 'gray'}
                        className="text-xs"
                      >
                        {idea.priority}
                      </Badge>
                      <button
                        onClick={() => archiveIdea(idea.id)}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title={activeTab === 'inbox' ? 'Arsipkan Ide' : 'Aktifkan Kembali'}
                      >
                        <Icon name="check" size={13} />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Hapus ide "${idea.title}"?`)) {
                            await deleteIdea(idea.id);
                          }
                        }}
                        className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Hapus"
                      >
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>

                  {idea.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {idea.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge tone="indigo" className="text-xs py-0">
                      {idea.area || 'General'}
                    </Badge>
                    <span>•</span>
                    <span>{idea.createdAt ? formatDate(idea.createdAt.slice(0, 10)) : 'Baru saja'}</span>
                  </div>
                </div>

                {/* Pipeline Conversion Actions */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-xs font-medium text-muted-foreground ">
                    Konversi ke:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => convertIdeaToTask(idea.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs transition-colors border border-emerald-500/20"
                    >
                      <Icon name="checkSquare" size={12} />
                      Tugas (Task)
                    </button>
                    <button
                      type="button"
                      onClick={() => convertIdeaToProject(idea.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-xs transition-colors border border-blue-500/20"
                    >
                      <Icon name="folder" size={12} />
                      Proyek (Project)
                    </button>
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      ) : (
        <Surface className="p-8">
          <EmptyState
            message={
              searchQuery || areaFilter !== 'all'
                ? 'Tidak ada ide yang cocok dengan filter.'
                : activeTab === 'inbox'
                ? 'Kotak masuk ide bersih! Semua ide telah diproses atau dieksekusi.'
                : 'Belum ada ide yang diarsipkan.'
            }
          />
        </Surface>
      )}

      {/* DIALOG: MODAL TAMBAH IDE LENGKAP */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleModalSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-medium flex items-center gap-2">
                <Icon name="lightbulb" size={18} className="text-indigo-500" />
                Tambah Ide Lengkap
              </DialogTitle>
              <DialogDescription>
                Tuliskan konsep atau rencana baru untuk diproses ke sistem.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="label mb-1.5">
                  Judul Ide *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bikin fitur offline sync dengan IndexedDB"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-none focus:border-indigo-500" aria-label="Contoh: Bikin fitur offline sync dengan IndexedDB"
/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label mb-1.5">
                    Area Kehidupan
                  </label>
                  <select
                    value={modalArea}
                    onChange={(e) => setModalArea(e.target.value)}
                    className="glass-input"
                  >
                    {LIFE_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label mb-1.5">
                    Prioritas
                  </label>
                  <select
                    value={modalPriority}
                    onChange={(e: any) => setModalPriority(e.target.value)}
                    className="glass-input"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label mb-1.5">
                  Catatan / Konteks Tambahan
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan latar belakang ide, potensi manfaat, atau langkah berikutnya"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground leading-relaxed focus:outline-none resize-none" aria-label="Tuliskan latar belakang ide, potensi manfaat, atau langkah berikutnya"
/>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Ide
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
