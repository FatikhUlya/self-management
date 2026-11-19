'use client';

import React, { useState, useMemo } from 'react';
import { useLifeOS, WorkApplication } from '@/lib/hooks/useLifeOSState';
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
import { formatDate, todayISO, safeUrl, cn } from '@/lib/utils';
import { WORK_STATUSES, Priority, WorkStatusId } from '@/lib/constants';

const PIPELINE_ORDER: WorkStatusId[] = ['wishlist', 'applied', 'screening', 'interview', 'offer', 'rejected'];

const STAGE_CONFIG: Record<WorkStatusId, { label: string; icon: string; tone: 'amber' | 'teal' | 'indigo' | 'green' | 'rose'; desc: string }> = {
  wishlist: { label: 'Wishlist / Target', icon: 'star', tone: 'amber', desc: 'Perusahaan yang sedang diriset' },
  applied: { label: 'Terkirim (Applied)', icon: 'check', tone: 'teal', desc: 'Lamaran & CV sudah dikirim' },
  screening: { label: 'Screening / HR Call', icon: 'activity', tone: 'indigo', desc: 'Tahap seleksi berkas & profil' },
  interview: { label: 'Wawancara & Test', icon: 'briefcase', tone: 'green', desc: 'Interview user, teknis, atau tes' },
  offer: { label: 'Tawaran (Offer)', icon: 'trophy', tone: 'green', desc: 'Lolos & tahap penawaran kompensasi' },
  rejected: { label: 'Ditolak / Belum Cocok', icon: 'alertCircle', tone: 'rose', desc: 'Belum berjodoh / ditutup' },
};

export default function CareerAndWorkPage() {
  const { state, addWorkApplication, updateWorkApplication, deleteWorkApplication } = useLifeOS();
  const { t, locale } = useI18n();

  const selectedDate = state.selectedDate || todayISO();

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'kanban' | 'list' | 'calendar'>('kanban');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Dialog States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<WorkApplication | null>(null);
  const [viewingApp, setViewingApp] = useState<WorkApplication | null>(null);

  // Form Fields
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<WorkStatusId>('wishlist');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [deadline, setDeadline] = useState(selectedDate);
  const [appliedDate, setAppliedDate] = useState('');
  const [source, setSource] = useState('LinkedIn');
  const [link, setLink] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [notes, setNotes] = useState('');

  // Calendar Navigation State
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [activeCalDate, setActiveCalDate] = useState<string | null>(selectedDate);

  // Stats Calculations
  const totalApps = state.workApplications.length;
  const wishlistCount = state.workApplications.filter((a) => a.status === 'wishlist').length;
  const activePipelineCount = state.workApplications.filter((a) =>
    ['applied', 'screening', 'interview'].includes(a.status)
  ).length;
  const offersCount = state.workApplications.filter((a) => a.status === 'offer').length;

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return state.workApplications
      .filter((app) => {
        if (statusFilter !== 'all' && app.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && app.priority !== priorityFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCompany = app.company?.toLowerCase().includes(q);
          const matchRole = app.role?.toLowerCase().includes(q);
          const matchNotes = app.notes?.toLowerCase().includes(q);
          const matchSource = app.source?.toLowerCase().includes(q);
          if (!matchCompany && !matchRole && !matchNotes && !matchSource) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = a.deadline || a.appliedDate || '9999-12-31';
        const dateB = b.deadline || b.appliedDate || '9999-12-31';
        return dateA.localeCompare(dateB);
      });
  }, [state.workApplications, statusFilter, priorityFilter, searchQuery]);

  // Open Create Modal
  const handleOpenCreateModal = (defaultStatus?: WorkStatusId) => {
    setEditingApp(null);
    setCompany('');
    setRole('');
    setStatus(defaultStatus || 'wishlist');
    setPriority('Medium');
    setDeadline('');
    setAppliedDate(defaultStatus && defaultStatus !== 'wishlist' ? selectedDate : '');
    setSource('LinkedIn');
    setLink('');
    setNextAction('');
    setNotes('');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (app: WorkApplication) => {
    setEditingApp(app);
    setCompany(app.company);
    setRole(app.role);
    setStatus(app.status);
    setPriority(app.priority);
    setDeadline(app.deadline || '');
    setAppliedDate(app.appliedDate || '');
    setSource(app.source || 'LinkedIn');
    setLink(app.link || '');
    setNextAction(app.nextAction || '');
    setNotes(app.notes || '');
    setIsFormModalOpen(true);
  };

  // Submit Application Form (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    if (editingApp) {
      await updateWorkApplication({
        ...editingApp,
        company: company.trim(),
        role: role.trim(),
        status,
        priority,
        deadline,
        appliedDate: status !== 'wishlist' ? appliedDate || selectedDate : '',
        source: source.trim(),
        link: link.trim(),
        nextAction: nextAction.trim(),
        notes: notes.trim(),
      });
    } else {
      await addWorkApplication({
        company: company.trim(),
        role: role.trim(),
        status,
        priority,
        deadline,
        appliedDate: status !== 'wishlist' ? appliedDate || selectedDate : '',
        source: source.trim(),
        link: link.trim(),
        nextAction: nextAction.trim(),
        notes: notes.trim(),
      });
    }

    setIsFormModalOpen(false);
    setEditingApp(null);
  };

  // Move Application Stage (Left / Right Chevron)
  const handleMoveStage = async (app: WorkApplication, direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = PIPELINE_ORDER.indexOf(app.status);
    if (currentIndex === -1) return;

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= PIPELINE_ORDER.length) return;

    const nextStatus = PIPELINE_ORDER[newIndex];
    await updateWorkApplication({
      ...app,
      status: nextStatus,
      appliedDate: nextStatus !== 'wishlist' && !app.appliedDate ? selectedDate : app.appliedDate,
    });
  };

  // Calendar Day Generator
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const startingEmpty = firstDay === 0 ? 6 : firstDay - 1; // Monday start

    const days: (string | null)[] = [];
    for (let i = 0; i < startingEmpty; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(`${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
    }
    return days;
  }, [calYear, calMonth]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.025em] leading-[1.15] text-foreground flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                <Icon name="briefcase" size={17} />
              </span>
              Career & Job Pipeline
            </h1>
            <Badge tone="blue" className="font-mono tabular-nums text-xs">
              {activePipelineCount} Proses Aktif
            </Badge>
          </div>
          <p className="text-sm leading-[1.6] text-zinc-600 dark:text-zinc-400 mt-1 max-w-prose">
            Pantau pipeline lamaran kerja, persiapan wawancara, negosiasi tawaran (offer), dan rekruter.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            icon="plus"
            onClick={() => handleOpenCreateModal()}
            className="text-xs"
          >
            Tambah Lamaran
          </Button>
        </div>
      </div>

      {/* Top Strategic Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="briefcase"
          label="Total Lamaran"
          value={totalApps}
          detail={`${wishlistCount} dalam target riset`}
        />
        <MetricCard
          icon="activity"
          label="Proses Aktif"
          value={activePipelineCount}
          detail="Screening & Wawancara"
          glow={activePipelineCount > 0}
        />
        <MetricCard
          icon="trophy"
          label="Tawaran (Offers)"
          value={offersCount}
          detail={offersCount > 0 ? 'Selamat! Tahap penawaran' : 'Terus kirim lamaran'}
          glow={offersCount > 0}
        />
        <MetricCard
          icon="checkCircle"
          label="Rasio Terkirim"
          value={totalApps > 0 ? `${Math.round(((totalApps - wishlistCount) / totalApps) * 100)}%` : '0%'}
          detail={`${totalApps - wishlistCount} lamaran telah dikirim`}
        />
      </div>

      {/* Modern Segmented Navigation Tabs (Swipe-friendly) */}
      <div className="flex items-center justify-between border-b border-border pb-2 overflow-x-auto no-scrollbar gap-4 px-1">
        <div className="flex p-1 bg-muted/30 rounded-xl border border-border shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('kanban')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] touch-manipulation',
              activeTab === 'kanban'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="layout" size={14} className={activeTab === 'kanban' ? 'text-sky-500' : ''} />
            Papan Pipeline (Kanban)
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] touch-manipulation',
              activeTab === 'list'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="list" size={14} className={activeTab === 'list' ? 'text-sky-500' : ''} />
            Daftar Lamaran ({filteredApplications.length})
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] touch-manipulation',
              activeTab === 'calendar'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="calendar" size={14} className={activeTab === 'calendar' ? 'text-sky-500' : ''} />
            Jadwal Deadline & Interview
          </button>
        </div>
      </div>

      {/* TAB 1: PAPAN PIPELINE (KANBAN BOARD) */}
      {activeTab === 'kanban' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Quick Filter Bar */}
          <Surface className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Icon
                name="search"
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Cari perusahaan atau posisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-sky-500 text-foreground"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
              >
                <option value="all">Semua Prioritas</option>
                <option value="High">Tinggi (High)</option>
                <option value="Medium">Menengah (Medium)</option>
                <option value="Low">Rendah (Low)</option>
              </select>
            </div>
          </Surface>

          {/* Kanban Columns Overflow Row */}
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start">
            {PIPELINE_ORDER.map((stageId) => {
              const stage = STAGE_CONFIG[stageId];
              const appsInStage = filteredApplications.filter((a) => a.status === stageId);
              const stageIdx = PIPELINE_ORDER.indexOf(stageId);

              return (
                <div
                  key={stageId}
                  className="w-72 shrink-0 flex flex-col rounded-xl bg-muted/20 border border-border max-h-[750px] overflow-hidden"
                >
                  {/* Lane Header */}
                  <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge tone={stage.tone} className="text-[10px] uppercase font-bold py-0.5">
                        {stage.label}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground font-bold">
                        {appsInStage.length}
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenCreateModal(stageId)}
                      className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
                      title={`Tambah ke ${stage.label}`}
                    >
                      <Icon name="plus" size={13} />
                    </button>
                  </div>

                  {/* Cards Lane */}
                  <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                    {appsInStage.length > 0 ? (
                      appsInStage.map((app) => {
                        const isHigh = app.priority === 'High';
                        return (
                          <div
                            key={app.id}
                            onClick={() => setViewingApp(app)}
                            className="p-3 rounded-lg bg-card border border-border hover:border-sky-500/40 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                          >
                            {/* Card Top */}
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <strong className="block text-xs font-bold text-foreground group-hover:text-sky-500 transition-colors">
                                  {app.company}
                                </strong>
                                <span className="text-[11px] text-muted-foreground font-medium block">
                                  {app.role}
                                </span>
                              </div>
                              <Badge
                                tone={isHigh ? 'rose' : 'gray'}
                                className="text-[9px] py-0 px-1 font-semibold shrink-0"
                              >
                                {app.priority}
                              </Badge>
                            </div>

                            {/* Source & Deadline */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                              {app.source && (
                                <span className="px-1.5 py-0.2 rounded bg-muted/40 border border-border">
                                  {app.source}
                                </span>
                              )}
                              {app.deadline && (
                                <span className="flex items-center gap-1">
                                  <Icon name="calendar" size={10} />
                                  {formatDate(app.deadline)}
                                </span>
                              )}
                            </div>

                            {/* Next Action */}
                            {app.nextAction && (
                              <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium truncate pt-1 border-t border-border">
                                ➔ {app.nextAction}
                              </p>
                            )}

                            {/* Card Quick Shift Chevrons & Actions */}
                            <div
                              className="pt-2 border-t border-border flex items-center justify-between text-muted-foreground text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center gap-1">
                                {stageIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleMoveStage(app, 'prev', e)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                    title="Pindah ke tahap sebelumnya"
                                  >
                                    <Icon name="chevronLeft" size={13} />
                                  </button>
                                )}
                                {stageIdx < PIPELINE_ORDER.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleMoveStage(app, 'next', e)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                    title="Pindah ke tahap berikutnya"
                                  >
                                    <Icon name="chevronRight" size={13} />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {app.link && (
                                  <a
                                    href={safeUrl(app.link)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                    title="Buka Link Lowongan"
                                  >
                                    <Icon name="globe" size={12} />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(app)}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  title="Edit"
                                >
                                  <Icon name="edit" size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`Hapus lamaran di ${app.company}?`)) {
                                      await deleteWorkApplication(app.id);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  title="Hapus"
                                >
                                  <Icon name="trash" size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-[11px] text-muted-foreground italic">
                          Kosong
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TAMPILAN TABEL / LIST */}
      {activeTab === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter Bar */}
          <Surface className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Icon
                name="search"
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Cari perusahaan, posisi, atau catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-sky-500 text-foreground"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
              >
                <option value="all">Semua Status</option>
                {PIPELINE_ORDER.map((id) => (
                  <option key={id} value={id}>
                    {STAGE_CONFIG[id].label}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
              >
                <option value="all">Semua Prioritas</option>
                <option value="High">Tinggi (High)</option>
                <option value="Medium">Menengah (Medium)</option>
                <option value="Low">Rendah (Low)</option>
              </select>
            </div>
          </Surface>

          {/* Applications List (Mobile Stacked Card List & Desktop Table) */}
          {filteredApplications.length > 0 ? (
            <>
              {/* Mobile Stacked Card List (Thumb-friendly) */}
              <div className="block md:hidden space-y-3">
                {filteredApplications.map((app) => {
                  const stage = STAGE_CONFIG[app.status];
                  return (
                    <Surface
                      key={app.id}
                      onClick={() => setViewingApp(app)}
                      className="p-4 space-y-3 cursor-pointer active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="block text-sm font-semibold text-foreground">
                            {app.company}
                          </strong>
                          <span className="text-xs text-zinc-500">{app.role}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge tone={stage.tone} className="text-[10px]">
                            {stage.label}
                          </Badge>
                          <Badge
                            tone={app.priority === 'High' ? 'rose' : 'gray'}
                            className="text-[10px]"
                          >
                            {app.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-border">
                        <div>
                          <span className="text-[10px] uppercase font-medium text-zinc-500 block">Deadline</span>
                          <span className="text-foreground font-mono tabular-nums">
                            {app.deadline ? formatDate(app.deadline) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-medium text-zinc-500 block">Sumber</span>
                          <span className="text-foreground truncate block">{app.source || '-'}</span>
                        </div>
                      </div>

                      {app.nextAction && (
                        <div className="text-xs text-foreground bg-muted/30 p-2.5 rounded-lg border border-border">
                          <span className="font-semibold text-primary block text-[10px] uppercase">Aksi Berikutnya:</span>
                          <p className="mt-0.5 line-clamp-2">{app.nextAction}</p>
                        </div>
                      )}

                      {/* Mobile Actions Toolbar (44x44px touch targets) */}
                      <div
                        className="flex items-center justify-between pt-1 gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleMoveStage(app, 'prev', e)}
                            disabled={PIPELINE_ORDER.indexOf(app.status) === 0}
                            title="Mundurkan Tahap"
                            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
                          >
                            <Icon name="chevronLeft" size={16} />
                          </button>
                          <button
                            onClick={(e) => handleMoveStage(app, 'next', e)}
                            disabled={PIPELINE_ORDER.indexOf(app.status) === PIPELINE_ORDER.length - 1}
                            title="Majukan Tahap"
                            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
                          >
                            <Icon name="chevronRight" size={16} />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {app.link && (
                            <a
                              href={safeUrl(app.link)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                            >
                              <Icon name="globe" size={16} />
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(app)}
                            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                          >
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Hapus lamaran di ${app.company}?`)) {
                                await deleteWorkApplication(app.id);
                              }
                            }}
                            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-border bg-card text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </div>
                    </Surface>
                  );
                })}
              </div>

              {/* Desktop Table Surface */}
              <Surface className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                      <th className="p-3">Perusahaan & Posisi</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Prioritas</th>
                      <th className="p-3">Deadline</th>
                      <th className="p-3">Sumber</th>
                      <th className="p-3">Aksi Berikutnya</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredApplications.map((app) => {
                      const stage = STAGE_CONFIG[app.status];
                      return (
                        <tr
                          key={app.id}
                          onClick={() => setViewingApp(app)}
                          className="hover:bg-muted/10 cursor-pointer transition-colors"
                        >
                          <td className="p-3">
                            <strong className="block text-foreground font-semibold">
                              {app.company}
                            </strong>
                            <span className="text-muted-foreground text-[11px]">
                              {app.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <Badge tone={stage.tone} className="text-[10px]">
                              {stage.label}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              tone={app.priority === 'High' ? 'rose' : 'gray'}
                              className="text-[10px]"
                            >
                              {app.priority}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground font-mono">
                            {app.deadline ? formatDate(app.deadline) : '-'}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {app.source || '-'}
                          </td>
                          <td className="p-3 text-foreground font-medium max-w-[200px] truncate">
                            {app.nextAction || '-'}
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              {app.link && (
                                <a
                                  href={safeUrl(app.link)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                >
                                  <Icon name="globe" size={13} />
                                </a>
                              )}
                              <button
                                onClick={() => handleOpenEditModal(app)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <Icon name="edit" size={13} />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Hapus lamaran di ${app.company}?`)) {
                                    await deleteWorkApplication(app.id);
                                  }
                                }}
                                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <Icon name="trash" size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Surface>
            </>
          ) : (
            <Surface className="p-8">
              <EmptyState message="Tidak ada data lamaran kerja yang cocok dengan filter." />
            </Surface>
          )}
        </div>
      )}

      {/* TAB 3: KALENDER DEADLINE & INTERVIEW */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Calendar Grid (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <Surface className="p-5">
              {/* Month Selector Bar */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    {monthNames[calMonth]} {calYear}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalMonth(11);
                        setCalYear((y) => y - 1);
                      } else {
                        setCalMonth((m) => m - 1);
                      }
                    }}
                  >
                    <Icon name="chevronLeft" size={13} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setCalMonth(now.getMonth());
                      setCalYear(now.getFullYear());
                      setActiveCalDate(todayISO());
                    }}
                  >
                    Hari Ini
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalMonth(0);
                        setCalYear((y) => y + 1);
                      } else {
                        setCalMonth((m) => m + 1);
                      }
                    }}
                  >
                    <Icon name="chevronRight" size={13} />
                  </Button>
                </div>
              </div>

              {/* Day Headers (Sen - Min) */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground uppercase pb-2">
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span>Sab</span>
                <span>Min</span>
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((dayStr, idx) => {
                  if (!dayStr) {
                    return <div key={`empty-${idx}`} className="h-16 rounded-lg bg-muted/5" />;
                  }

                  const dayNum = Number(dayStr.slice(8, 10));
                  const isTodayDay = dayStr === todayISO();
                  const isSelected = dayStr === activeCalDate;
                  const matchingApps = state.workApplications.filter(
                    (a) => a.deadline === dayStr || a.appliedDate === dayStr
                  );

                  return (
                    <div
                      key={dayStr}
                      onClick={() => setActiveCalDate(dayStr)}
                      className={cn(
                        'h-16 p-1 rounded-lg border text-xs flex flex-col justify-between transition-all cursor-pointer',
                        isSelected
                          ? 'border-sky-500 bg-sky-500/10'
                          : 'border-border/60 hover:bg-muted/20',
                        isTodayDay && 'ring-1 ring-primary'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-[11px] font-mono font-bold leading-none',
                            isTodayDay ? 'text-primary' : 'text-foreground'
                          )}
                        >
                          {dayNum}
                        </span>
                        {matchingApps.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        )}
                      </div>

                      {matchingApps.length > 0 && (
                        <div className="space-y-0.5">
                          {matchingApps.slice(0, 1).map((app) => (
                            <div
                              key={app.id}
                              className="text-[9px] font-semibold truncate px-1 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-300"
                            >
                              {app.company}
                            </div>
                          ))}
                          {matchingApps.length > 1 && (
                            <span className="text-[8px] text-muted-foreground block text-right font-mono">
                              +{matchingApps.length - 1} lagi
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Surface>
          </div>

          {/* Day Detail Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Surface className="p-5">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Icon name="calendar" size={13} className="text-sky-500" />
                  Jadwal Tanggal
                </span>
                <span className="text-xs font-mono font-bold text-foreground">
                  {activeCalDate ? formatDate(activeCalDate) : '-'}
                </span>
              </div>

              {activeCalDate ? (
                (() => {
                  const dayApps = state.workApplications.filter(
                    (a) => a.deadline === activeCalDate || a.appliedDate === activeCalDate
                  );
                  return dayApps.length > 0 ? (
                    <div className="space-y-2.5">
                      {dayApps.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => setViewingApp(app)}
                          className="p-3 rounded-lg bg-muted/20 border border-border hover:border-sky-500/40 cursor-pointer transition-all space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-xs font-bold text-foreground">
                              {app.company}
                            </strong>
                            <Badge tone={STAGE_CONFIG[app.status].tone} className="text-[9px]">
                              {STAGE_CONFIG[app.status].label}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{app.role}</p>
                          {app.nextAction && (
                            <p className="text-[11px] text-sky-500 font-medium">
                              ➔ {app.nextAction}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Tidak ada deadline atau jadwal interview pada tanggal ini.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        icon="plus"
                        onClick={() => {
                          handleOpenCreateModal();
                          setDeadline(activeCalDate);
                        }}
                        className="text-xs"
                      >
                        + Jadwalkan di Tanggal Ini
                      </Button>
                    </div>
                  );
                })()
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Pilih tanggal pada kalender untuk melihat rincian jadwal.
                </p>
              )}
            </Surface>
          </div>
        </div>
      )}

      {/* DIALOG 1: FORM MODAL (CREATE / EDIT APPLICATION) */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmitForm}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Icon name="briefcase" size={18} className="text-sky-500" />
                {editingApp ? 'Edit Data Lamaran' : 'Tambah Lamaran Kerja Baru'}
              </DialogTitle>
              <DialogDescription>
                Rincian lowongan kerja, status rekrutmen, dan catatan rekruter.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Nama Perusahaan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Google, GoTo, Vercel"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Posisi / Role *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Senior Frontend Engineer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Tahap Rekrutmen
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                  >
                    {PIPELINE_ORDER.map((id) => (
                      <option key={id} value={id}>
                        {STAGE_CONFIG[id].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Prioritas Minat
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                  >
                    <option value="High">Tinggi (High Priority)</option>
                    <option value="Medium">Menengah (Medium)</option>
                    <option value="Low">Rendah (Low)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Batas Waktu (Deadline)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                    Sumber Informasi
                  </label>
                  <input
                    type="text"
                    placeholder="LinkedIn, Glints, Referal..."
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Link URL Lowongan
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/jobs/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Tindakan Selanjutnya (Next Action)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kirim email follow-up portofolio ke Recruiter"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                  Catatan Tambahan / Gaji / Info Recruiter
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan gaji, profil interviewer, link resume khusus..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground leading-relaxed focus:outline-hidden resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                {editingApp ? 'Perbarui Lamaran' : 'Simpan Lamaran'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: DETAIL VIEW MODAL */}
      <Dialog open={!!viewingApp} onOpenChange={(open) => !open && setViewingApp(null)}>
        <DialogContent className="max-w-md">
          {viewingApp && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <DialogTitle className="text-lg font-bold">
                    {viewingApp.company}
                  </DialogTitle>
                </div>
                <DialogDescription>
                  {viewingApp.role}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge tone={STAGE_CONFIG[viewingApp.status].tone} className="text-xs font-bold">
                    {STAGE_CONFIG[viewingApp.status].label}
                  </Badge>
                  <Badge tone={viewingApp.priority === 'High' ? 'rose' : 'gray'}>
                    Prioritas {viewingApp.priority}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-1.5 text-muted-foreground">
                  {viewingApp.source && (
                    <p>
                      <strong className="text-foreground">Sumber:</strong> {viewingApp.source}
                    </p>
                  )}
                  {viewingApp.deadline && (
                    <p>
                      <strong className="text-foreground">Deadline:</strong> {formatDate(viewingApp.deadline)}
                    </p>
                  )}
                  {viewingApp.appliedDate && (
                    <p>
                      <strong className="text-foreground">Tanggal Kirim:</strong> {formatDate(viewingApp.appliedDate)}
                    </p>
                  )}
                  {viewingApp.link && (
                    <p className="truncate">
                      <strong className="text-foreground">Link Lowongan: </strong>
                      <a
                        href={safeUrl(viewingApp.link)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {viewingApp.link}
                      </a>
                    </p>
                  )}
                </div>

                {viewingApp.nextAction && (
                  <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
                    <span className="text-[10px] uppercase font-bold text-sky-500 block">
                      Aksi Selanjutnya:
                    </span>
                    <p className="text-foreground font-medium mt-0.5">
                      {viewingApp.nextAction}
                    </p>
                  </div>
                )}

                {viewingApp.notes && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                      Catatan:
                    </span>
                    <p className="p-3 rounded-lg bg-muted/20 border border-border text-foreground leading-relaxed whitespace-pre-wrap">
                      {viewingApp.notes}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                <Button
                  variant="outline"
                  icon="edit"
                  onClick={() => {
                    const toEdit = viewingApp;
                    setViewingApp(null);
                    handleOpenEditModal(toEdit);
                  }}
                  className="text-xs"
                >
                  Edit Lamaran
                </Button>
                <Button variant="primary" onClick={() => setViewingApp(null)}>
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
