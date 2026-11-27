'use client';

import React, { useState, useMemo } from 'react';
import { useLifeOS, KeyResult, Goal } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
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
import { formatDate, todayISO, cn } from '@/lib/utils';
import { DateStamp } from '@/components/ui/DateStamp';

const GOAL_CATEGORIES = [
  'Career & Work',
  'Health & Fitness',
  'Finance & Wealth',
  'Learning & Skills',
  'Personal Growth',
  'Mindfulness & Spiritual',
  'Creative & Projects',
];

const LIFE_AREAS = [
  { id: 'Career & Work', label: 'Karier & Karya', icon: 'briefcase', tone: 'indigo' as const },
  { id: 'Finance & Wealth', label: 'Keuangan & Aset', icon: 'wallet', tone: 'green' as const },
  { id: 'Health & Fitness', label: 'Kesehatan & Raga', icon: 'activity', tone: 'rose' as const },
  { id: 'Learning & Skills', label: 'Belajar & Keahlian', icon: 'book', tone: 'teal' as const },
  { id: 'Personal Growth', label: 'Karakter & Diri', icon: 'star', tone: 'amber' as const },
  { id: 'Mindfulness & Spiritual', label: 'Ketenangan & Jiwa', icon: 'sparkles', tone: 'purple' as const },
];

export default function GoalsDashboardPage() {
  const { state, addGoal, updateGoal, deleteGoal, updateTaskStatus } = useLifeOS();
  const { t, locale } = useI18n();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'okrs' | 'compass' | 'archive'>('okrs');

  // Vision & Mission Persistent State
  const [vision, setVision] = useLocalStorageState(
    'lifeos_vision',
    'Menjadi seorang Solo Operator & Lead Engineer kelas dunia yang membangun sistem bernilai tinggi, menjaga kesehatan prima, dan mandiri secara finansial.'
  );
  const [mission, setMission] = useLocalStorageState(
    'lifeos_mission',
    '1. Menguasai teknologi modern dan arsitektur produk perangkat lunak setiap hari.\n2. Menjaga disiplin raga, nutrisi terukur, dan ketenangan batin.\n3. Menyelaraskan tindakan harian terkecil dengan target strategis jangka panjang.'
  );

  // Filters for OKRs
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Expanded cards state
  const [expandedKrs, setExpandedKrs] = useState<Record<string, boolean>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Dialog States
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Vision Modal Form State
  const [tempVision, setTempVision] = useState('');
  const [tempMission, setTempMission] = useState('');

  // Goal Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState(GOAL_CATEGORIES[0]);
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);

  // Top Metrics Calculation
  const goals = useMemo(() => state?.goals || [], [state?.goals]);
  const tasks = useMemo(() => state?.tasks || [], [state?.tasks]);
  const projects = useMemo(() => state?.projects || [], [state?.projects]);

  const totalGoals = goals.length;
  const completedGoals = useMemo(() => goals.filter((g) => (g?.progress || 0) >= 100), [goals]);
  const activeGoals = useMemo(() => goals.filter((g) => (g?.progress || 0) < 100), [goals]);

  const avgProgress = useMemo(() => {
    if (totalGoals === 0) return 0;
    const sum = goals.reduce((acc, g) => acc + (g?.progress || 0), 0);
    return Math.round(sum / totalGoals);
  }, [goals, totalGoals]);

  const linkedTasksCount = useMemo(() => {
    return tasks.filter((t) => t?.goalId).length;
  }, [tasks]);

  // Helper for Timeframe
  const getGoalTimeframe = (targetDateStr: string | undefined | null) => {
    if (!targetDateStr) return 'medium';
    try {
      const d = targetDateStr.includes('T') ? new Date(targetDateStr) : new Date(`${targetDateStr}T00:00:00`);
      if (isNaN(d.getTime())) return 'medium';
      const diffTime = d.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 90) return 'short';
      if (diffDays <= 365) return 'medium';
      return 'long';
    } catch {
      return 'medium';
    }
  };

  // Helper for Status
  const getGoalStatus = (goal: Goal) => {
    const progress = goal?.progress || 0;
    if (progress >= 100) return { label: 'Selesai', tone: 'green' as const };
    if (goal?.targetDate) {
      try {
        const d = goal.targetDate.includes('T') ? new Date(goal.targetDate) : new Date(`${goal.targetDate}T00:00:00`);
        if (!isNaN(d.getTime())) {
          const diffTime = d.getTime() - new Date().getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 15 && progress < 50) {
            return { label: 'At Risk', tone: 'rose' as const };
          }
        }
      } catch {}
    }
    return { label: 'On Track', tone: 'teal' as const };
  };

  // Helper for KR Progress Calculation
  const calculateKrProgress = (krs: KeyResult[]) => {
    if (!krs || krs.length === 0) return 0;
    const total = krs.reduce((acc, kr) => {
      const target = Number(kr?.targetValue) || 0;
      const current = Number(kr?.currentValue) || 0;
      if (target <= 0) return acc;
      return acc + Math.min(1, Math.max(0, current / target));
    }, 0);
    return Math.min(100, Math.round((total / krs.length) * 100));
  };

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    return goals
      .filter((goal) => {
        if (!goal) return false;
        const progress = goal.progress || 0;
        if (statusFilter === 'active' && progress >= 100) return false;
        if (statusFilter === 'completed' && progress < 100) return false;
        if (timeframeFilter !== 'all' && getGoalTimeframe(goal.targetDate) !== timeframeFilter) return false;
        if (categoryFilter !== 'all' && goal.category !== categoryFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = goal.title?.toLowerCase().includes(q) || false;
          const matchCat = goal.category?.toLowerCase().includes(q) || false;
          const matchKrs = Array.isArray(goal.keyResults) && goal.keyResults.some((kr) => kr?.title?.toLowerCase().includes(q));
          if (!matchTitle && !matchCat && !matchKrs) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aProg = a?.progress || 0;
        const bProg = b?.progress || 0;
        if (aProg >= 100 && bProg < 100) return 1;
        if (aProg < 100 && bProg >= 100) return -1;
        if (!a?.targetDate) return 1;
        if (!b?.targetDate) return -1;
        try {
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        } catch {
          return 0;
        }
      });
  }, [goals, statusFilter, timeframeFilter, categoryFilter, searchQuery]);

  // Open Vision Modal
  const handleOpenVisionModal = () => {
    setTempVision(vision);
    setTempMission(mission);
    setIsVisionModalOpen(true);
  };

  const handleSaveVisionMission = (e: React.FormEvent) => {
    e.preventDefault();
    setVision(tempVision);
    setMission(tempMission);
    setIsVisionModalOpen(false);
  };

  // Add Key Result Row in Form
  const handleAddKeyResultRow = () => {
    setKeyResults((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        title: '',
        currentValue: 0,
        targetValue: 10,
        unit: 'Poin',
      },
    ]);
  };

  const handleUpdateKeyResultRow = (index: number, field: keyof KeyResult, val: any) => {
    setKeyResults((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleRemoveKeyResultRow = (index: number) => {
    setKeyResults((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit New Goal
  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const validKrs = keyResults.filter((kr) => kr.title.trim());
    const calculated = validKrs.length > 0 ? calculateKrProgress(validKrs) : 0;

    await addGoal({
      title: goalTitle.trim(),
      category: goalCategory,
      targetDate: goalTargetDate,
      keyResults: validKrs,
      progress: calculated,
      currentValue: 0,
      targetValue: 100,
      unit: '%',
    });

    setIsNewGoalModalOpen(false);
    setGoalTitle('');
    setGoalTargetDate('');
    setKeyResults([]);
  };

  // Open Edit Goal Modal
  const handleOpenEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalCategory(goal.category || GOAL_CATEGORIES[0]);
    setGoalTargetDate(goal.targetDate || '');
    setKeyResults(goal.keyResults ? [...goal.keyResults] : []);
  };

  // Save Edited Goal
  const handleSaveEditedGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !goalTitle.trim()) return;

    const validKrs = keyResults.filter((kr) => kr.title.trim());
    const calculated = validKrs.length > 0 ? calculateKrProgress(validKrs) : editingGoal.progress;

    await updateGoal(editingGoal.id, {
      title: goalTitle.trim(),
      category: goalCategory,
      targetDate: goalTargetDate,
      keyResults: validKrs,
      progress: calculated,
    });

    setEditingGoal(null);
    setGoalTitle('');
    setGoalTargetDate('');
    setKeyResults([]);
  };

  // Quick Inline Adjust Key Result Value
  const handleQuickAdjustKr = async (goal: Goal, krId: string, delta: number) => {
    if (!goal.keyResults) return;
    const updatedKrs = goal.keyResults.map((kr) => {
      if (kr.id === krId) {
        const nextVal = Math.max(0, kr.currentValue + delta);
        return { ...kr, currentValue: nextVal };
      }
      return kr;
    });

    const newProgress = calculateKrProgress(updatedKrs);
    await updateGoal(goal.id, {
      keyResults: updatedKrs,
      progress: newProgress,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Header & Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <DateStamp />
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-[32px] font-medium leading-[1.15] text-foreground">
              Goals & Strategic OKRs
            </h1>
            <Badge tone="teal" className="font-mono tabular-nums text-xs">
              {activeGoals.length} Target Aktif
            </Badge>
          </div>
          <p className="text-sm leading-[1.6] text-zinc-600 dark:text-zinc-400 mt-1 max-w-prose">
            Penyelarasan visi hidup, target strategis (Objectives), dan hasil kunci terukur (Key Results).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon="star"
            onClick={handleOpenVisionModal}
            className="text-xs"
          >
            Edit Kompas Hidup
          </Button>
          <Button
            variant="primary"
            icon="plus"
            onClick={() => {
              setGoalTitle('');
              setGoalTargetDate('');
              setKeyResults([]);
              setIsNewGoalModalOpen(true);
            }}
            className="text-xs"
          >
            Target Baru (New OKR)
          </Button>
        </div>
      </div>

      {/* Top Strategic Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="activity"
          label="Rata-rata Progres"
          value={`${avgProgress}%`}
          detail={`${activeGoals.length} target berjalan`}
          glow={avgProgress >= 50}
        />
        <MetricCard
          icon="checkCircle"
          label="Target Selesai"
          value={completedGoals.length}
          detail={`Dari total ${totalGoals} target`}
          glow={completedGoals.length > 0}
        />
        <MetricCard
          icon="target"
          label="Target On Track"
          value={activeGoals.filter((g) => getGoalStatus(g).tone === 'teal').length}
          detail="Target berjalan sesuai jadwal"
        />
        <MetricCard
          icon="briefcase"
          label="Koneksi Tugas"
          value={linkedTasksCount}
          detail="Tugas terikat ke target"
        />
      </div>

      {/* Modern Segmented Navigation Tabs (Swipe-friendly) */}
      <div className="flex items-center justify-between border-b border-border pb-2 overflow-x-auto no-scrollbar gap-4 px-1">
        <div className="flex p-1 bg-muted/30 rounded-xl border border-border shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('okrs')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[44px] touch-manipulation',
              activeTab === 'okrs'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="target" size={14} className={activeTab === 'okrs' ? 'text-teal-500' : ''} />
            Papan Target & OKR
            <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[11px]">
              {state.goals.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('compass')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[44px] touch-manipulation',
              activeTab === 'compass'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="star" size={14} className={activeTab === 'compass' ? 'text-teal-500' : ''} />
            Kompas & Visi Misi
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors min-h-[44px] touch-manipulation',
              activeTab === 'archive'
                ? 'bg-background text-foreground shadow-xs border border-border/80'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon name="trophy" size={14} className={activeTab === 'archive' ? 'text-teal-500' : ''} />
            Pencapaian (Milestones)
            <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[11px]">
              {completedGoals.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: PAPAN TARGET & OKR */}
      {activeTab === 'okrs' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Search & Filter Bar */}
          <Surface className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Icon
                name="search"
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Cari target atau key result"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-muted/20 border border-border focus:outline-hidden focus:border-teal-500 text-foreground" aria-label="Cari target atau key result"
/>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              {/* Timeframe Filter */}
              <div className="flex p-0.5 bg-muted/30 rounded-lg border border-border shrink-0">
                {(['all', 'short', 'medium', 'long'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframeFilter(tf)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-md font-medium transition-colors capitalize',
                      timeframeFilter === tf
                        ? 'bg-background text-foreground font-medium shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tf === 'all'
                      ? 'Semua Waktu'
                      : tf === 'short'
                      ? '≤ 3 Bln'
                      : tf === 'medium'
                      ? '3-12 Bln'
                      : '> 1 Thn'}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-muted/20 border border-border text-foreground shrink-0 focus:outline-hidden"
              >
                <option value="all">Semua Status</option>
                <option value="active">Berjalan</option>
                <option value="completed">Selesai</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-muted/20 border border-border text-foreground shrink-0 focus:outline-hidden max-w-[140px] truncate"
              >
                <option value="all">Semua Kategori</option>
                {GOAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </Surface>

          {/* Goals Feed */}
          {filteredGoals.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredGoals.map((goal) => {
                const status = getGoalStatus(goal);
                const hasKrs = Array.isArray(goal.keyResults) && goal.keyResults.length > 0;
                const isKrsExpanded = expandedKrs[goal.id] ?? true;
                const linkedTasks = tasks.filter((t) => t?.goalId === goal.id);
                const isTasksExpanded = expandedTasks[goal.id] ?? false;
                const linkedProjects = projects.filter((p) => p?.goalId === goal.id);

                return (
                  <Surface key={goal.id} className="p-5 space-y-4">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge tone={status.tone} className="text-[11px] font-medium ">
                          {status.label}
                        </Badge>
                        <Badge tone="gray" className="text-[11px]">
                          {goal.category || 'General'}
                        </Badge>
                        {goal.targetDate && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Icon name="calendar" size={12} />
                            Target: {formatDate(goal.targetDate)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          icon="edit"
                          onClick={() => handleOpenEditGoal(goal)}
                          className="text-xs h-7 px-2"
                        >
                          Edit
                        </Button>
                        <button
                          onClick={async () => {
                            if (confirm(`Hapus target "${goal.title}"?`)) {
                              await deleteGoal(goal.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                          title="Hapus Goal"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Objective Title & Overall Progress */}
                    <div className="space-y-2">
                      <h3 className="text-base font-medium text-foreground">
                        {goal.title}
                      </h3>

                      <div className="space-y-1">
                        <div className="flex justify-between items-baseline text-xs font-mono">
                          <span className="text-muted-foreground">Kemajuan Keseluruhan</span>
                          <strong className="text-teal-500 font-medium">{goal.progress}%</strong>
                        </div>
                        <ProgressBar value={goal.progress} max={100} />
                      </div>
                    </div>

                    {/* Key Results Accordion */}
                    {hasKrs && (
                      <div className="pt-2 border-t border-border space-y-2">
                        <div
                          className="flex items-center justify-between cursor-pointer select-none py-1"
                          onClick={() =>
                            setExpandedKrs((prev) => ({ ...prev, [goal.id]: !isKrsExpanded }))
                          }
                        >
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Icon name="target" size={13} className="text-teal-500" />
                            Key Results ({goal.keyResults?.length})
                          </span>
                          <Icon
                            name={isKrsExpanded ? 'chevronLeft' : 'chevronRight'}
                            size={14}
                            className={cn('text-muted-foreground transition-transform', isKrsExpanded && '-rotate-90')}
                          />
                        </div>

                        {isKrsExpanded && (
                          <div className="space-y-2 pl-1">
                            {goal.keyResults?.map((kr) => {
                              const targetVal = Number(kr?.targetValue) || 0;
                              const currentVal = Number(kr?.currentValue) || 0;
                              const krPct = targetVal > 0 ? Math.min(100, Math.max(0, Math.round((currentVal / targetVal) * 100))) : 0;
                              return (
                                <div
                                  key={kr.id}
                                  className="p-3 rounded-lg bg-muted/20 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-foreground truncate">
                                        {kr.title}
                                      </span>
                                      <span className="text-[11px] font-mono text-muted-foreground">
                                        ({krPct}%)
                                      </span>
                                    </div>
                                    <div className="w-full max-w-xs">
                                      <div className="w-full bg-muted/40 rounded-full h-1 overflow-hidden">
                                        <div
                                          className="bg-teal-500 h-full rounded-full transition-colors"
                                          style={{ width: `${krPct}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="font-mono text-xs font-medium text-foreground">
                                      {kr.currentValue} / {kr.targetValue} {kr.unit}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleQuickAdjustKr(goal, kr.id, -1)}
                                        className="w-6 h-6 rounded-md bg-muted/40 hover:bg-muted text-foreground flex items-center justify-center font-medium"
                                        title="Kurangi 1"
                                      >
                                        -
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleQuickAdjustKr(goal, kr.id, 1)}
                                        className="w-6 h-6 rounded-md bg-teal-500/20 hover:bg-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center font-medium"
                                        title="Tambah 1"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Linked Tasks & Projects Footer Strip */}
                    <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {linkedProjects.length > 0 && (
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Icon name="folder" size={13} className="text-teal-500" />
                            {linkedProjects.length} Proyek Terikat
                          </span>
                        )}
                        {linkedTasks.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedTasks((prev) => ({ ...prev, [goal.id]: !isTasksExpanded }))
                            }
                            className="flex items-center gap-1 font-medium text-foreground hover:underline"
                          >
                            <Icon name="checkCircle" size={13} className="text-emerald-500" />
                            {linkedTasks.filter((t) => t.status === 'done').length}/{linkedTasks.length} Tugas Terikat
                            <span className="text-[11px] text-primary">({isTasksExpanded ? 'Tutup' : 'Lihat'})</span>
                          </button>
                        )}
                      </div>

                      <span className="text-[11px]">
                        Dibuat: {formatDate(goal.createdAt)}
                      </span>
                    </div>

                    {/* Expandable Linked Tasks Checklist */}
                    {isTasksExpanded && linkedTasks.length > 0 && (
                      <div className="p-3 rounded-lg bg-muted/10 border border-dashed border-border space-y-2 mt-2">
                        <span className="text-[11px] font-medium text-muted-foreground block">
                          Daftar Tugas Eksekusi:
                        </span>
                        <div className="space-y-1.5">
                          {linkedTasks.map((task) => {
                            const isDone = task.status === 'done';
                            return (
                              <div
                                key={task.id}
                                className="flex items-center justify-between p-2 rounded-md bg-background border border-border text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isDone}
                                    onChange={() =>
                                      updateTaskStatus(task.id, isDone ? 'todo' : 'done')
                                    }
                                    className="rounded border-border text-teal-600 focus:ring-teal-500 cursor-pointer"
                                  />
                                  <span className={cn('font-medium', isDone && 'line-through text-muted-foreground')}>
                                    {task.title}
                                  </span>
                                </div>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {task.due ? formatDate(task.due) : 'No due'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Surface>
                );
              })}
            </div>
          ) : (
            <Surface className="p-8">
              <EmptyState
                message={
                  searchQuery || timeframeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all'
                    ? 'Tidak ada target yang sesuai dengan filter.'
                    : 'Belum ada target OKR yang dibuat. Tekan tombol "Target Baru" di atas'
                }
              />
            </Surface>
          )}
        </div>
      )}

      {/* TAB 2: KOMPAS HIDUP & VISI MISI */}
      {activeTab === 'compass' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Vision & Mission Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vision Card */}
            <Surface className="p-6 relative overflow-hidden border-l-4 border-l-teal-500 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-teal-500 flex items-center gap-1.5">
                    <Icon name="target" size={14} /> Visi Pribadi (Vision)
                  </span>
                  <button
                    onClick={handleOpenVisionModal}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Icon name="edit" size={12} /> Edit
                  </button>
                </div>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  "{vision}"
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border">
                Kompas arah jangka panjang yang menjadi fondasi seluruh keputusan Anda.
              </p>
            </Surface>

            {/* Mission Card */}
            <Surface className="p-6 relative overflow-hidden border-l-4 border-l-indigo-500 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-indigo-500 flex items-center gap-1.5">
                    <Icon name="briefcase" size={14} /> Misi & Prinsip Aksi (Mission)
                  </span>
                  <button
                    onClick={handleOpenVisionModal}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Icon name="edit" size={12} /> Edit
                  </button>
                </div>
                <div className="text-xs text-foreground leading-relaxed space-y-1.5 font-medium">
                  {mission.split('\n').map((m, idx) => (
                    <p key={idx}>{m}</p>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border">
                Pedoman tindakan berulang untuk merealisasikan visi hidup Anda setiap hari.
              </p>
            </Surface>
          </div>

          {/* Life Dimensions Wheel / Pillars */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Icon name="sparkles" size={14} className="text-muted-foreground" />
                Pilar Keseimbangan Hidup (Life Dimensions)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {LIFE_AREAS.map((area) => {
                const areaGoals = goals.filter((g) => g?.category === area.id);
                const areaProjects = projects.filter((p) => p?.area === area.id || p?.name?.includes(area.label));

                return (
                  <Surface key={area.id} className="p-4 flex flex-col justify-between space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Icon name={area.icon} size={15} />
                        </div>
                        <strong className="text-xs font-medium text-foreground">
                          {area.label}
                        </strong>
                      </div>
                      <Badge tone={area.tone} className="text-[11px]">
                        {areaGoals.length} Goals
                      </Badge>
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-1">
                      <p>
                        Target Aktif:{' '}
                        <span className="font-semibold text-foreground">
                          {areaGoals.filter((g) => g.progress < 100).length} target
                        </span>
                      </p>
                      <p>
                        Target Selesai:{' '}
                        <span className="font-semibold text-emerald-500">
                          {areaGoals.filter((g) => g.progress >= 100).length} selesai
                        </span>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      icon="plus"
                      onClick={() => {
                        setGoalTitle('');
                        setGoalCategory(area.id);
                        setGoalTargetDate('');
                        setKeyResults([]);
                        setIsNewGoalModalOpen(true);
                      }}
                      className="text-xs w-full py-1 h-auto"
                    >
                      + Tambah Goal di Area Ini
                    </Button>
                  </Surface>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PENCAPAIAN & ARSIP */}
      {activeTab === 'archive' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <Surface className="p-4 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground">
                Hall of Fame & Target Selesai
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daftar seluruh tujuan hidup dan OKR yang telah berhasil Anda tuntaskan 100%.
              </p>
            </div>
            <Badge tone="green" className="text-xs font-mono font-medium">
              {completedGoals.length} Target Berhasil
            </Badge>
          </Surface>

          {completedGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedGoals.map((goal) => (
                <Surface key={goal.id} className="p-5 space-y-3 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between">
                    <Badge tone="green" className="text-[11px] flex items-center gap-1 font-medium">
                      <Icon name="trophy" size={12} /> Selesai 100%
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {goal.targetDate ? formatDate(goal.targetDate) : 'Target tercapai'}
                    </span>
                  </div>

                  <h4 className="text-sm font-medium text-foreground">
                    {goal.title}
                  </h4>

                  <span className="px-2 py-0.5 rounded bg-muted/40 border border-border text-[11px] text-muted-foreground inline-block">
                    {goal.category}
                  </span>

                  {goal.keyResults && goal.keyResults.length > 0 && (
                    <div className="space-y-1 text-xs pt-1 border-t border-border">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Hasil Kunci:
                      </span>
                      {goal.keyResults.map((kr) => (
                        <p key={kr.id} className="text-muted-foreground flex items-center gap-1.5">
                          <Icon name="check" size={12} className="text-emerald-500" />
                          <span>{kr.title}</span> ({kr.currentValue}/{kr.targetValue} {kr.unit})
                        </p>
                      ))}
                    </div>
                  )}
                </Surface>
              ))}
            </div>
          ) : (
            <Surface className="p-8">
              <EmptyState message="Belum ada target yang mencapai 100%. Terus fokus eksekusi key results harian Anda" />
            </Surface>
          )}
        </div>
      )}

      {/* MODAL 1: NEW / EDIT GOAL (OKR) */}
      <Dialog
        open={isNewGoalModalOpen || !!editingGoal}
        onOpenChange={(open) => {
          if (!open) {
            setIsNewGoalModalOpen(false);
            setEditingGoal(null);
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <form onSubmit={editingGoal ? handleSaveEditedGoal : handleSubmitGoal}>
            <DialogHeader>
              <DialogTitle className="text-lg font-medium flex items-center gap-2">
                <Icon name="target" size={18} className="text-teal-500" />
                {editingGoal ? 'Edit Target (OKR)' : 'Buat Target Baru (New OKR)'}
              </DialogTitle>
              <DialogDescription>
                Tentukan sasaran strategis (Objective) beserta hasil kunci terukur (Key Results).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Judul Sasaran (Objective)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Menjadi Lead Frontend Engineer & Rilis 3 Aplikasi SaaS"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden focus:border-teal-500" aria-label="Contoh: Menjadi Lead Frontend Engineer & Rilis 3 Aplikasi SaaS"
/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Kategori / Area Hidup
                  </label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                  >
                    {GOAL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Target Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-muted/20 border border-border text-foreground focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Key Results Section */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <Icon name="checkCircle" size={13} className="text-teal-500" />
                    Key Results Terukur (KRs)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddKeyResultRow}
                    className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    + Tambah KR
                  </button>
                </div>

                <div className="space-y-2">
                  {keyResults.map((kr, idx) => (
                    <div
                      key={kr.id || idx}
                      className="p-2.5 rounded-lg bg-muted/20 border border-border space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Judul Key Result"
                          value={kr.title}
                          onChange={(e) =>
                            handleUpdateKeyResultRow(idx, 'title', e.target.value)
                          }
                          className="flex-1 px-2.5 py-1.5 text-xs rounded-md bg-background border border-border text-foreground focus:outline-hidden" aria-label="Judul Key Result"
/>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyResultRow(idx)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[11px] text-muted-foreground block mb-0.5">
                            Nilai Awal
                          </span>
                          <input
                            type="number"
                            value={kr.currentValue}
                            onChange={(e) =>
                              handleUpdateKeyResultRow(
                                idx,
                                'currentValue',
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-2 py-1 text-xs rounded bg-background border border-border text-foreground font-mono focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-muted-foreground block mb-0.5">
                            Target Akhir
                          </span>
                          <input
                            type="number"
                            value={kr.targetValue}
                            onChange={(e) =>
                              handleUpdateKeyResultRow(
                                idx,
                                'targetValue',
                                Number(e.target.value)
                              )
                            }
                            className="w-full px-2 py-1 text-xs rounded bg-background border border-border text-foreground font-mono focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-muted-foreground block mb-0.5">
                            Satuan (Unit)
                          </span>
                          <input
                            type="text"
                            placeholder="cth: Proyek, %, Buku"
                            value={kr.unit}
                            onChange={(e) =>
                              handleUpdateKeyResultRow(idx, 'unit', e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs rounded bg-background border border-border text-foreground focus:outline-hidden" aria-label="cth: Proyek, %, Buku"
/>
                        </div>
                      </div>
                    </div>
                  ))}

                  {keyResults.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2 text-center ">
                      Belum ada Key Result. Klik "+ Tambah KR" untuk membuat target terukur.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewGoalModalOpen(false);
                  setEditingGoal(null);
                }}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary">
                {editingGoal ? 'Perbarui Target' : 'Simpan Target'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EDIT VISI & MISI KOMPAS */}
      <Dialog open={isVisionModalOpen} onOpenChange={setIsVisionModalOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSaveVisionMission}>
            <DialogHeader>
              <DialogTitle className="text-lg font-medium flex items-center gap-2">
                <Icon name="star" size={18} className="text-teal-500" />
                Edit Kompas Hidup (Visi & Misi)
              </DialogTitle>
              <DialogDescription>
                Tuliskan arah hidup dan prinsip dasar yang memandu keseharian Anda.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Visi Pribadi (Vision)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Siapa diri Anda dan dampak apa yang ingin Anda ciptakan?"
                  value={tempVision}
                  onChange={(e) => setTempVision(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground leading-relaxed focus:outline-hidden focus:border-teal-500 resize-none" aria-label="Siapa diri Anda dan dampak apa yang ingin Anda ciptakan?"
/>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Misi & Prinsip Kerja (Mission - tulis per baris)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Pilar tindakan yang Anda lakukan untuk mencapai visi tersebut"
                  value={tempMission}
                  onChange={(e) => setTempMission(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg bg-muted/20 border border-border text-foreground leading-relaxed focus:outline-hidden focus:border-teal-500 resize-none" aria-label="Pilar tindakan yang Anda lakukan untuk mencapai visi tersebut"
/>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVisionModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Kompas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
