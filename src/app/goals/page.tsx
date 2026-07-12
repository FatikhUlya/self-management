'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { formatDate, percent, clamp, avg } from '@/lib/utils';

// Physics item type for Easter Egg
interface PhysicsCard {
  id: string;
  title: string;
  progress: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  angle: number;
  va: number; // angular velocity
  category: string;
}

export default function GoalsPage() {
  const { state, addGoal, updateGoalProgress, deleteGoal, updateTaskStatus } = useLifeOS();
  const { t, locale } = useI18n();

  // Tab filter time-based
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');

  // Accordion expanded objectives
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<string, boolean>>({});

  // Vision & Mission states (localStorage)
  const [vision, setVision] = useLocalStorageState(
    'lifeos_vision',
    'Menjadi seorang Lead Frontend Engineer yang tidak hanya mahir secara teknis, tetapi juga berkontribusi positif bagi komunitas open-source global.'
  );
  const [mission, setMission] = useLocalStorageState(
    'lifeos_mission',
    '1. Eksplorasi teknologi React, Next.js, & UI/UX secara mendalam setiap hari.\n2. Menyelesaikan proyek berkualitas tinggi dengan estetika visual premium.\n3. Menyelaraskan aksi harian (tugas) dengan target jangka panjang (Goals & OKRs).'
  );

  // Edit modals state
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [tempVision, setTempVision] = useState('');
  const [tempMission, setTempMission] = useState('');

  // Goal Creation Form states
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [title, setTitle] = useLocalStorageState('draft_goal_title', '');
  const [category, setCategory] = useLocalStorageState('draft_goal_category', 'Career');
  const [currentValue, setCurrentValue] = useLocalStorageState<number>('draft_goal_currentValue', 0);
  const [targetValue, setTargetValue] = useLocalStorageState<number>('draft_goal_targetValue', 100);
  const [unit, setUnit] = useLocalStorageState('draft_goal_unit', '%');
  const [targetDate, setTargetDate] = useLocalStorageState('draft_goal_targetDate', state.selectedDate);

  // Physics Easter Egg States
  const [isGravityReleased, setIsGravityReleased] = useState(false);
  const [physicsCards, setPhysicsCards] = useState<PhysicsCard[]>([]);
  const dragInfo = useRef<{ cardId: string | null; offsetX: number; offsetY: number }>({
    cardId: null,
    offsetX: 0,
    offsetY: 0,
  });
  const mousePos = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const animationFrameRef = useRef<number | null>(null);

  // Dynamic calculations for overall stats
  const completedGoalsCount = state.goals.filter((g) => Number(g.progress) >= 100).length;
  const activeGoalsCount = state.goals.filter((g) => Number(g.progress) < 100).length;

  // Calculate timeframe dynamically from date
  const getGoalTimeframe = (targetDateStr: string) => {
    if (!targetDateStr) return 'medium';
    const diffTime = new Date(targetDateStr).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 90) return 'short'; // <= 3 months
    if (diffDays <= 365) return 'medium'; // <= 1 year
    return 'long'; // > 1 year
  };

  const timeframeLabel = (tf: string) => {
    switch (tf) {
      case 'short': return locale === 'id' ? 'Jangka Pendek (1-3 Bln)' : 'Short-Term (1-3 Mo)';
      case 'medium': return locale === 'id' ? 'Jangka Menengah (1 Thn)' : 'Medium-Term (1 Yr)';
      case 'long': return locale === 'id' ? 'Jangka Panjang (3-5 Thn)' : 'Long-Term (3-5 Yr)';
      default: return '';
    }
  };

  // Filtered goals
  const filteredGoals = useMemo(() => {
    return state.goals.filter((goal) => {
      if (timeframeFilter === 'all') return true;
      return getGoalTimeframe(goal.targetDate) === timeframeFilter;
    });
  }, [state.goals, timeframeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addGoal({
      title,
      category: category.trim() || 'General',
      currentValue,
      targetValue,
      unit,
      targetDate,
      progress: 0,
    });

    // Reset fields
    setTitle('');
    setCategory('');
    setCurrentValue(0);
    setTargetValue(100);
    setUnit('%');
    setIsNewGoalModalOpen(false);
  };

  const getGoalStatus = (goal: any) => {
    if (goal.progress >= 100) return { label: 'Completed', tone: 'green' };
    
    // Check if at risk (due date is close <= 15 days, progress < 50%)
    if (goal.targetDate) {
      const diffTime = new Date(goal.targetDate).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0 && diffDays <= 15 && goal.progress < 50) {
        return { label: 'At Risk', tone: 'rose' };
      }
    }
    return { label: 'On Track', tone: 'teal' };
  };

  const toggleAccordion = (id: string) => {
    setExpandedGoalIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenVisionModal = () => {
    setTempVision(vision);
    setTempMission(mission);
    setIsVisionModalOpen(true);
  };

  const handleSaveVisionMission = () => {
    setVision(tempVision);
    setMission(tempMission);
    setIsVisionModalOpen(false);
  };

  // ── Physics Easter Egg Logic ──
  const startGravityRelease = () => {
    if (isGravityReleased) {
      // Restore gravity
      setIsGravityReleased(false);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setPhysicsCards([]);
      return;
    }

    // Gather elements with '.gravity-card' class
    const elements = document.querySelectorAll('.gravity-card');
    const cards: PhysicsCard[] = [];

    elements.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const goalId = el.getAttribute('data-goal-id') || `physics-${index}`;
      const titleText = el.getAttribute('data-goal-title') || 'Goal';
      const progressVal = Number(el.getAttribute('data-goal-progress') || '0');
      const catText = el.getAttribute('data-goal-cat') || 'General';

      cards.push({
        id: goalId,
        title: titleText,
        progress: progressVal,
        x: rect.left,
        y: rect.top,
        vx: (Math.random() - 0.5) * 8, // Initial sideways push
        vy: -Math.random() * 5 - 2, // Slight upward push
        width: rect.width,
        height: rect.height,
        angle: 0,
        va: (Math.random() - 0.5) * 0.1,
        category: catText,
      });
    });

    setPhysicsCards(cards);
    setIsGravityReleased(true);
  };

  // Main physics loop
  useEffect(() => {
    if (!isGravityReleased || physicsCards.length === 0) return;

    const gravity = 0.5;
    const bounce = 0.55;
    const friction = 0.98;

    const updatePhysics = () => {
      setPhysicsCards((prev) => {
        return prev.map((card) => {
          // If this card is currently dragged
          if (dragInfo.current.cardId === card.id) {
            const dragVx = mousePos.current.x - mousePos.current.px;
            const dragVy = mousePos.current.y - mousePos.current.py;
            return {
              ...card,
              x: mousePos.current.x - dragInfo.current.offsetX,
              y: mousePos.current.y - dragInfo.current.offsetY,
              vx: dragVx,
              vy: dragVy,
              angle: card.angle + dragVx * 0.02,
              va: dragVx * 0.01,
            };
          }

          // Apply physics
          let vy = card.vy + gravity;
          let vx = card.vx * friction;
          let x = card.x + vx;
          let y = card.y + vy;
          let va = card.va * friction;
          let angle = card.angle + va;

          const screenHeight = window.innerHeight;
          const screenWidth = window.innerWidth;

          // Bottom boundary collision (bounces)
          if (y + card.height > screenHeight - 20) {
            y = screenHeight - 20 - card.height;
            vy = -vy * bounce;
            vx *= 0.8; // Ground friction
            va *= 0.7; // Spin dampening
          }

          // Left wall collision
          if (x < 10) {
            x = 10;
            vx = -vx * bounce;
            va *= 0.8;
          }

          // Right wall collision
          if (x + card.width > screenWidth - 10) {
            x = screenWidth - 10 - card.width;
            vx = -vx * bounce;
            va *= 0.8;
          }

          return {
            ...card,
            x,
            y,
            vx,
            vy,
            angle,
            va,
          };
        });
      });

      // Update mouse previous positions
      mousePos.current.px = mousePos.current.x;
      mousePos.current.py = mousePos.current.y;

      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isGravityReleased, physicsCards.length]);

  // Mouse handlers for dragging physics cards
  const handleMouseDown = (e: React.MouseEvent, card: PhysicsCard) => {
    e.preventDefault();
    dragInfo.current = {
      cardId: card.id,
      offsetX: e.clientX - card.x,
      offsetY: e.clientY - card.y,
    };
    mousePos.current = {
      x: e.clientX,
      y: e.clientY,
      px: e.clientX,
      py: e.clientY,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    mousePos.current.x = e.clientX;
    mousePos.current.y = e.clientY;
  };

  const handleMouseUp = () => {
    dragInfo.current = { cardId: null, offsetX: 0, offsetY: 0 };
  };

  useEffect(() => {
    if (isGravityReleased) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isGravityReleased]);

  return (
    <div className="space-y-6 relative min-h-[80vh]">
      {/* ── 1. HEADER & IDENTITY ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-life-line pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-life-text uppercase tracking-tight flex items-center gap-2">
            🧭 Fatikh's Compass
          </h1>
          <p className="text-xs text-life-muted mt-1">
            Visualisasi target utama, kerangka kerja OKR, dan sinkronisasi tindakan harian.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleOpenVisionModal}
            className="text-xs py-1.5 px-3 bg-white/[0.02] border-life-line flex items-center gap-1.5"
          >
            <Icon name="edit" size={12} />
            Edit Kompas
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsNewGoalModalOpen(true)}
            className="text-xs py-1.5 px-3"
            icon="plus"
          >
            Objective Baru
          </Button>
        </div>
      </div>

      {/* Vision & Mission Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Surface className="p-5 border-l-2 border-l-life-teal bg-gradient-to-br from-life-teal/5 to-transparent relative group">
          <div className="absolute right-3 top-3 text-[30px] opacity-10 select-none">🎯</div>
          <h3 className="text-xs font-black uppercase text-life-teal tracking-wider mb-2">Visi Pribadi (Vision)</h3>
          <p className="text-sm font-semibold italic text-life-text leading-relaxed tracking-tight">
            "{vision}"
          </p>
        </Surface>

        <Surface className="p-5 border-l-2 border-l-life-indigo bg-gradient-to-br from-life-indigo/5 to-transparent relative group">
          <div className="absolute right-3 top-3 text-[30px] opacity-10 select-none">🚀</div>
          <h3 className="text-xs font-black uppercase text-life-indigo tracking-wider mb-2">Misi Pribadi (Mission)</h3>
          <div className="text-xs text-life-text leading-relaxed space-y-1.5">
            {mission.split('\n').map((m, idx) => (
              <p key={idx} className="font-medium">{m}</p>
            ))}
          </div>
        </Surface>
      </div>

      {/* ── 2. SUMMARY COUNTERS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Surface className="p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-life-muted tracking-wider block">Average Progress</span>
            <span className="text-2xl font-black text-life-text mt-1 block">
              {Math.round(avg(state.goals.map((g) => g.progress)))}%
            </span>
          </div>
          <ProgressRing
            label=""
            value={Math.round(avg(state.goals.map((g) => g.progress)))}
            colorClass="text-life-teal"
            size={55}
          />
        </Surface>

        <Surface className="p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-life-muted tracking-wider block">Completed Goals</span>
            <span className="text-2xl font-black text-green-400 mt-1 block">
              {completedGoalsCount} <span className="text-xs text-life-muted">/ {state.goals.length}</span>
            </span>
          </div>
          <ProgressRing
            label=""
            value={percent(completedGoalsCount, state.goals.length)}
            colorClass="text-green-400"
            size={55}
          />
        </Surface>

        <Surface className="p-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-life-muted tracking-wider block">Active Objectives</span>
            <span className="text-2xl font-black text-life-indigo mt-1 block">
              {activeGoalsCount} <span className="text-xs text-life-muted">on track</span>
            </span>
          </div>
          <ProgressRing
            label=""
            value={percent(activeGoalsCount, state.goals.length)}
            colorClass="text-life-indigo"
            size={55}
          />
        </Surface>
      </div>

      {/* ── 3. TIME-BASED GOALS & OKR SECTION ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Column: Time-Based Goal Tracker (1/3 width) */}
        <div className="xl:col-span-1 space-y-4">
          <Surface className="p-5">
            <div className="flex justify-between items-center border-b border-life-line pb-3 mb-4">
              <h3 className="text-xs font-black uppercase text-life-text tracking-wider">
                ⏳ Goal Tracker
              </h3>
              <p className="text-[10px] text-life-muted font-bold">Time-Based</p>
            </div>

            {/* Timeframe Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-white/[0.02] border border-life-line rounded-lg mb-4 select-none">
              {(['all', 'short', 'medium', 'long'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTimeframeFilter(tab)}
                  className={`text-[9px] font-black uppercase py-1.5 rounded transition-all ${
                    timeframeFilter === tab
                      ? 'bg-white/[0.07] text-white shadow-sm'
                      : 'text-life-muted hover:text-life-text'
                  }`}
                >
                  {tab === 'all' ? 'Semua' : tab === 'short' ? 'Short' : tab === 'medium' ? 'Medium' : 'Long'}
                </button>
              ))}
            </div>

            {/* Goals cards under filtered tab */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredGoals.length > 0 ? (
                filteredGoals.map((goal) => {
                  const status = getGoalStatus(goal);
                  const tf = getGoalTimeframe(goal.targetDate);
                  return (
                    <div
                      key={goal.id}
                      className="p-3 rounded-lg bg-white/[0.01] border border-life-line hover:border-life-line-strong transition-all space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-life-text line-clamp-2">{goal.title}</span>
                        <Badge tone={status.tone as any} className="text-[8px] py-0 px-1.5 shrink-0">
                          {status.label}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] text-life-muted font-bold">
                        <span>{timeframeLabel(tf)}</span>
                        <span>{goal.progress}%</span>
                      </div>

                      <div className="h-1 w-full bg-white/[0.02] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${
                            goal.progress >= 100 ? 'from-life-green to-green-400' : 'from-life-teal to-teal-400'
                          }`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-life-muted italic text-center py-6">Tidak ada target waktu ini.</p>
              )}
            </div>
          </Surface>
        </div>

        {/* Right Columns: OKRs Expandable Accordion (2/3 width) */}
        <div className={`xl:col-span-2 space-y-4 ${isGravityReleased ? 'opacity-0 pointer-events-none' : 'opacity-100 transition-opacity duration-300'}`}>
          <Surface className="p-6">
            <div className="border-b border-life-line pb-3 mb-5">
              <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
                🎯 Objectives & Key Results (OKRs)
              </h3>
              <p className="text-xs text-life-muted mt-0.5">
                Objective diambil dari Goals utama. Proyek & Tugas terkait bertindak sebagai Key Results pendukung.
              </p>
            </div>

            <div className="space-y-3">
              {state.goals.length > 0 ? (
                state.goals.map((goal) => {
                  const isExpanded = !!expandedGoalIds[goal.id];
                  
                  // Query linked items
                  const linkedProjects = state.projects.filter((p) => p.goalId === goal.id);
                  const linkedProjectIds = linkedProjects.map((p) => p.id);
                  const linkedDirectTasks = state.tasks.filter((t) => t.goalId === goal.id);
                  const linkedProjectTasks = state.tasks.filter((t) => t.projectId && linkedProjectIds.includes(t.projectId));
                  
                  const isAutoTracked = linkedDirectTasks.length > 0 || linkedProjectTasks.length > 0;
                  const totalKeyResults = linkedProjects.length + linkedDirectTasks.length;

                  return (
                    <div
                      key={goal.id}
                      data-goal-id={goal.id}
                      data-goal-title={goal.title}
                      data-goal-progress={goal.progress}
                      data-goal-cat={goal.category}
                      className="gravity-card border border-life-line rounded-xl bg-white/[0.005] hover:border-life-line-strong overflow-hidden transition-all duration-150"
                    >
                      {/* Accordion Trigger/Header */}
                      <div
                        onClick={() => toggleAccordion(goal.id)}
                        className="p-4 flex justify-between items-center cursor-pointer select-none bg-white/[0.003] hover:bg-white/[0.008] transition-colors"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-sm text-life-text tracking-tight font-bold leading-tight block truncate">
                              {goal.title}
                            </strong>
                            <Badge tone={getGoalStatus(goal).tone as any} className="text-[9px] py-0 px-1 shrink-0">
                              {goal.category || 'General'}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Small progress bar inline */}
                            <div className="w-24 bg-white/[0.02] h-1.5 rounded-full overflow-hidden shrink-0">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${
                                  goal.progress >= 100 ? 'from-life-green to-green-400' : 'from-life-teal to-teal-400'
                                }`}
                                style={{ width: `${goal.progress}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-life-muted">{goal.progress}%</span>
                            
                            <span className="text-[10px] text-life-muted hidden sm:inline">•</span>
                            
                            <span className="text-[10px] text-life-muted font-bold">
                              {isAutoTracked 
                                ? `🎯 ${totalKeyResults} Key Results (Auto)`
                                : `⚙️ Manual Tracked`
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!isAutoTracked && (
                            <div className="flex items-center space-x-1 mr-2">
                              <button
                                onClick={() => updateGoalProgress(goal.id, -5)}
                                className="w-6 h-6 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
                                title="Kurangi Progres"
                              >
                                <Icon name="minus" size={10} />
                              </button>
                              <button
                                onClick={() => updateGoalProgress(goal.id, 5)}
                                className="w-6 h-6 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
                                title="Tambah Progres"
                              >
                                <Icon name="plus" size={10} />
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => deleteGoal(goal.id)}
                            className="w-6 h-6 rounded bg-white/[0.03] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all mr-2"
                            title="Hapus"
                          >
                            <Icon name="trash" size={10} />
                          </button>
                          <button
                            onClick={() => toggleAccordion(goal.id)}
                            className="text-life-muted hover:text-life-text p-1 transition-transform duration-200"
                            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                          >
                            <Icon name="chevronRight" size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Accordion Expandable Content */}
                      {isExpanded && (
                        <div className="p-4 border-t border-life-line bg-black/20 space-y-4 text-xs">
                          {isAutoTracked ? (
                            <div className="space-y-3">
                              {/* Headers of Key Results */}
                              <div className="flex justify-between items-center text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1">
                                <span>🎯 Key Result / Hasil Kunci</span>
                                <span>Status / Progres</span>
                              </div>

                              {/* 1. Linked Projects */}
                              {linkedProjects.map((proj) => {
                                const projTasks = state.tasks.filter((t) => t.projectId === proj.id);
                                const doneTasks = projTasks.filter((t) => t.status === 'done');
                                const completionRate = percent(doneTasks.length, projTasks.length);
                                return (
                                  <div key={proj.id} className="flex justify-between items-center bg-white/[0.01] border border-life-line p-2.5 rounded-lg">
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-life-text">📁 Proyek: {proj.name}</span>
                                      <span className="text-[10px] text-life-muted mt-0.5">Tugas: {doneTasks.length}/{projTasks.length} selesai</span>
                                    </div>
                                    <Badge tone={proj.status === 'done' ? 'green' : 'teal'}>
                                      {`${completionRate}%`}
                                    </Badge>
                                  </div>
                                );
                              })}

                              {/* 2. Linked Direct Tasks */}
                              {linkedDirectTasks.map((t) => (
                                <div key={t.id} className="flex justify-between items-center bg-white/[0.01] border border-life-line p-2.5 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={t.status === 'done'}
                                      onChange={() => updateTaskStatus(t.id, t.status === 'done' ? 'todo' : 'done')}
                                      className="rounded bg-black/40 border-white/10 text-life-teal focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                                    />
                                    <span className={`font-semibold text-life-text ${t.status === 'done' ? 'line-through text-life-muted' : ''}`}>
                                      🎯 Tugas: {t.title}
                                    </span>
                                  </div>
                                  <Badge tone={t.status === 'done' ? 'green' : t.status === 'doing' ? 'amber' : 'gray'}>
                                    {t.status}
                                  </Badge>
                                </div>
                              ))}

                              {/* 3. Linked Project Tasks (Connection to Daily Tasks View) */}
                              {linkedProjectTasks.length > 0 && (
                                <div className="pt-2">
                                  <span className="text-[10px] font-black uppercase text-life-muted tracking-wider block mb-1.5">
                                    Tindakan Harian Proyek (Daily Actions):
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                                    {linkedProjectTasks.map((t) => (
                                      <div key={t.id} className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5 text-[11px]">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <input
                                            type="checkbox"
                                            checked={t.status === 'done'}
                                            onChange={() => updateTaskStatus(t.id, t.status === 'done' ? 'todo' : 'done')}
                                            className="rounded bg-black/40 border-white/10 text-life-teal focus:ring-0 focus:ring-offset-0 cursor-pointer w-3 h-3 shrink-0"
                                          />
                                          <span className={`truncate text-life-text ${t.status === 'done' ? 'line-through text-life-muted' : ''}`}>
                                            {t.title}
                                          </span>
                                        </div>
                                        <Badge tone={t.status === 'done' ? 'green' : t.status === 'doing' ? 'amber' : 'gray'} className="text-[8px] py-0 px-1 shrink-0">
                                          {t.status}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="py-2 text-center bg-white/[0.01] border border-dashed border-life-line rounded-lg text-life-muted">
                              <p className="font-medium">Belajar & Hubungkan Key Result!</p>
                              <p className="text-[10px] text-life-muted/80 mt-1 max-w-xs mx-auto">
                                Hubungkan proyek atau tugas harian ke target ini di halaman Proyek untuk melacak progres secara otomatis.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <EmptyState />
              )}
            </div>
          </Surface>
        </div>
      </div>

      {/* ── 4. PHYSICS CANVAS OVERLAY (Easter Egg) ── */}
      {isGravityReleased && (
        <div className="fixed inset-0 z-40 pointer-events-auto bg-black/40 backdrop-blur-[1px] select-none">
          {/* Top banner info */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 border border-white/10 px-4 py-2 rounded-full text-xs font-bold text-teal-400 flex items-center gap-2 animate-bounce">
            <span>🌌 Antigravity Mode: Seret dan lempar kartu Objective Anda!</span>
            <Button
              variant="primary"
              onClick={startGravityRelease}
              className="text-[10px] py-1 px-2.5 bg-teal-500/20 border-teal-500/40 text-teal-300 rounded-full shrink-0"
            >
              Restore Gravity
            </Button>
          </div>

          {/* Render physics cards */}
          {physicsCards.map((card) => (
            <div
              key={card.id}
              onMouseDown={(e) => handleMouseDown(e, card)}
              className="absolute bg-gray-900 border border-white/10 rounded-xl p-4 shadow-2xl cursor-grab active:cursor-grabbing text-xs select-none pointer-events-auto"
              style={{
                left: 0,
                top: 0,
                width: card.width,
                height: card.height,
                transform: `translate3d(${card.x}px, ${card.y}px, 0px) rotate(${card.angle}rad)`,
                transformOrigin: 'center center',
              }}
            >
              <div className="flex justify-between items-start gap-3">
                <span className="font-bold text-life-text truncate block max-w-[80%]">{card.title}</span>
                <Badge tone={card.progress >= 100 ? 'green' : 'teal'} className="text-[8px] py-0 px-1 shrink-0">
                  {card.category}
                </Badge>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[9px] text-life-muted font-bold uppercase">
                  <span>Progres</span>
                  <span>{card.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      card.progress >= 100 ? 'from-life-green to-green-400' : 'from-life-teal to-teal-400'
                    }`}
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 5. RELEASE GRAVITY DISCREET BUTTON ── */}
      <div className="flex justify-center pt-8">
        <button
          type="button"
          onClick={startGravityRelease}
          className="text-[10px] font-black uppercase text-life-muted hover:text-teal-400 tracking-widest bg-white/[0.01] hover:bg-white/[0.04] border border-life-line px-3 py-1.5 rounded-full transition-all duration-300 select-none shadow-sm flex items-center gap-1.5"
        >
          🌌 {isGravityReleased ? 'Restore Gravity' : 'Release Gravity'}
        </button>
      </div>

      {/* ── 6. MODALS SECTION ── */}
      {/* Modal Edit Vision & Mission */}
      <Modal
        isOpen={isVisionModalOpen}
        onClose={() => setIsVisionModalOpen(false)}
        title="Edit Visi & Misi Kompas"
        subtitle="Tetapkan arah jangka panjang kepribadian Anda"
      >
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="tempVisionInput" className="text-xs font-black text-life-muted uppercase">
              Visi Pribadi (Vision)
            </label>
            <textarea
              id="tempVisionInput"
              value={tempVision}
              onChange={(e) => setTempVision(e.target.value)}
              className="glass-input text-xs h-20 resize-none mt-1"
              placeholder="Tulis visi kehidupan Anda di sini..."
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="tempMissionInput" className="text-xs font-black text-life-muted uppercase">
              Misi Pribadi (Mission)
            </label>
            <textarea
              id="tempMissionInput"
              value={tempMission}
              onChange={(e) => setTempMission(e.target.value)}
              className="glass-input text-xs h-32 resize-none mt-1"
              placeholder="Tulis misi kehidupan Anda (tulis poin-poin per baris)..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <Button variant="secondary" onClick={() => setIsVisionModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveVisionMission}>
              Simpan Kompas
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Objective (Goal) Baru */}
      <Modal
        isOpen={isNewGoalModalOpen}
        onClose={() => setIsNewGoalModalOpen(false)}
        title={t('goals_new')}
        subtitle={t('goals_form_desc')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="modalGoalTitle" className="text-xs font-bold text-life-muted uppercase">
              {t('goals_goal_label')}
            </label>
            <input
              id="modalGoalTitle"
              type="text"
              required
              placeholder={t('goals_outcome')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input text-sm mt-1"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col space-y-1">
              <label htmlFor="modalCurrentVal" className="text-xs font-bold text-life-muted uppercase">
                {t('goals_current_value')}
              </label>
              <input
                id="modalCurrentVal"
                type="number"
                step="0.01"
                required
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                className="glass-input text-xs mt-1"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="modalTargetVal" className="text-xs font-bold text-life-muted uppercase">
                {t('goals_target_value')}
              </label>
              <input
                id="modalTargetVal"
                type="number"
                step="0.01"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="glass-input text-xs mt-1"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="modalUnit" className="text-xs font-bold text-life-muted uppercase">
                {t('goals_unit')}
              </label>
              <input
                id="modalUnit"
                type="text"
                required
                placeholder={t('goals_unit_placeholder')}
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="glass-input text-xs mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="modalGoalCat" className="text-xs font-bold text-life-muted uppercase">
                {t('category')}
              </label>
              <select
                id="modalGoalCat"
                value={category || 'Career'}
                onChange={(e) => setCategory(e.target.value)}
                className="glass-select text-xs mt-1"
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
              <label htmlFor="modalTargetDt" className="text-xs font-bold text-life-muted uppercase">
                {t('goals_target_date')}
              </label>
              <input
                id="modalTargetDt"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="glass-input text-xs mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <Button variant="secondary" onClick={() => setIsNewGoalModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Buat Objective
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
