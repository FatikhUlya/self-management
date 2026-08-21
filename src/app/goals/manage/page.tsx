'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useConfetti } from '@/providers/ConfettiProvider';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { percent } from '@/lib/utils';
import { KeyResult } from '@/lib/hooks/useLifeOSState';

export default function GoalsManagePage() {
  const { state, addGoal, updateGoal, deleteGoal, updateTaskStatus } = useLifeOS();
  const { triggerConfetti } = useConfetti();
  const { t, locale } = useI18n();

  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<string, boolean>>({});

  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [title, setTitle] = useLocalStorageState('draft_goal_title', '');
  const [category, setCategory] = useLocalStorageState('draft_goal_category', 'Career');
  const [targetDate, setTargetDate] = useLocalStorageState('draft_goal_targetDate', state.selectedDate);
  const [keyResults, setKeyResults] = useLocalStorageState<KeyResult[]>('draft_goal_krs', []);

  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalCategory, setEditGoalCategory] = useState('');
  const [editGoalTargetDate, setEditGoalTargetDate] = useState('');
  const [editGoalKeyResults, setEditGoalKeyResults] = useState<KeyResult[]>([]);

  const getGoalTimeframe = (targetDateStr: string) => {
    if (!targetDateStr) return 'medium';
    const diffTime = new Date(targetDateStr).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 90) return 'short';
    if (diffDays <= 365) return 'medium';
    return 'long';
  };

  const filteredGoals = useMemo(() => {
    return state.goals.filter((goal) => {
      if (timeframeFilter === 'all') return true;
      return getGoalTimeframe(goal.targetDate) === timeframeFilter;
    });
  }, [state.goals, timeframeFilter]);

  const handleOpenEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setEditGoalTitle(goal.title);
    setEditGoalCategory(goal.category || 'Career');
    setEditGoalTargetDate(goal.targetDate || '');
    setEditGoalKeyResults(goal.keyResults || []);
  };

  const calculateProgress = (krs: KeyResult[]) => {
    if (krs.length === 0) return 0;
    const total = krs.reduce((acc, kr) => {
      if (kr.targetValue === 0) return acc;
      return acc + (kr.currentValue / kr.targetValue);
    }, 0);
    return Math.round((total / krs.length) * 100);
  };

  const handleSaveEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editGoalTitle.trim()) return;
    
    const progress = calculateProgress(editGoalKeyResults);
    
    await updateGoal(editingGoal.id, {
      title: editGoalTitle.trim(),
      category: editGoalCategory.trim() || 'Career',
      targetDate: editGoalTargetDate,
      keyResults: editGoalKeyResults,
      progress
    });
    
    if (progress >= 100 && editingGoal.progress < 100) triggerConfetti();
    setEditingGoal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addGoal({
      title,
      category: category.trim() || 'General',
      targetDate,
      keyResults,
      progress: calculateProgress(keyResults),
      currentValue: 0,
      targetValue: 100,
      unit: '%'
    });

    setTitle('');
    setCategory('Career');
    setKeyResults([]);
    setIsNewGoalModalOpen(false);
  };

  const getGoalStatus = (goal: any) => {
    if (goal.progress >= 100) return { label: 'Completed', tone: 'green' };
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/goals">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="target" size={24} className="text-cyan-500" />
            Kelola OKRs
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Objectives and Key Results framework
          </p>
        </div>
        <Button 
          variant="primary" 
          icon="plus" 
          onClick={() => setIsNewGoalModalOpen(true)}
          className="shrink-0"
        >
          {locale === 'id' ? 'Objective Baru' : 'New Objective'}
        </Button>
      </div>

      <Surface className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-life-line pb-3 mb-5">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-life-text uppercase tracking-wider">
              <Icon name="target" size={16} className="text-life-teal" /> Objectives
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Setiap Objective diukur melalui beberapa Key Results.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {filteredGoals.length > 0 ? (
            filteredGoals.map((goal) => {
              const isExpanded = !!expandedGoalIds[goal.id];
              return (
                <div
                  key={goal.id}
                  className="border border-life-line rounded-xl bg-white/[0.005] hover:border-life-line-strong overflow-hidden transition-all duration-150"
                >
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
                        <div className="w-24 bg-white/[0.02] h-1.5 rounded-full overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${
                              goal.progress >= 100 ? 'from-life-green to-green-400' : 'from-life-teal to-teal-400'
                            }`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-life-muted">{goal.progress}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditGoal(goal)}
                        className="w-6 h-6 rounded bg-white/[0.03] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center transition-all mr-1"
                        title="Edit OKR"
                      >
                        <Icon name="edit" size={10} />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="w-6 h-6 rounded bg-white/[0.03] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all mr-2"
                        title={t('delete')}
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

                  {isExpanded && (
                    <div className="p-4 border-t border-life-line bg-black/20 space-y-4 text-xs">
                      {goal.keyResults && goal.keyResults.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1">
                            <span>Key Result</span>
                            <span>Progress</span>
                          </div>

                          {goal.keyResults.map((kr: KeyResult) => {
                            const krProgress = Math.min(100, Math.round((kr.currentValue / (kr.targetValue || 1)) * 100));
                            return (
                              <div key={kr.id} className="flex flex-col space-y-2 bg-white/[0.01] border border-life-line p-3 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-life-text text-sm flex items-center gap-2">
                                    <Icon name="checkCircle" size={14} className="text-emerald-400" />
                                    {kr.title}
                                  </span>
                                  <span className="text-xs font-bold text-life-muted bg-white/[0.02] px-2 py-1 rounded">
                                    {kr.currentValue} / {kr.targetValue} {kr.unit}
                                  </span>
                                </div>
                                <div className="w-full bg-white/[0.02] h-1.5 rounded-full overflow-hidden mt-2">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                                    style={{ width: `${krProgress}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-2 text-center text-life-muted text-xs">
                          Belum ada Key Results yang diatur.
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

      {/* Modal Edit Goal */}
      <Modal
        isOpen={Boolean(editingGoal)}
        onClose={() => setEditingGoal(null)}
        title="Edit Objective & Key Results"
        subtitle="Perbarui rincian Objective dan atur progres Key Results"
      >
        {editingGoal && (
          <form onSubmit={handleSaveEditGoal} className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  Objective Title
                </label>
                <input
                  type="text"
                  required
                  value={editGoalTitle}
                  onChange={(e) => setEditGoalTitle(e.target.value)}
                  className="glass-input text-sm mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-bold text-life-muted uppercase">
                    Kategori
                  </label>
                  <select
                    value={editGoalCategory}
                    onChange={(e) => setEditGoalCategory(e.target.value)}
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
                  <label className="text-xs font-bold text-life-muted uppercase">
                    Tenggat Waktu
                  </label>
                  <input
                    type="date"
                    value={editGoalTargetDate}
                    onChange={(e) => setEditGoalTargetDate(e.target.value)}
                    className="glass-input text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-life-line">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-life-text uppercase tracking-wider">Key Results</h4>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  icon="plus" 
                  onClick={() => setEditGoalKeyResults([...editGoalKeyResults, { id: Date.now().toString(), title: '', currentValue: 0, targetValue: 100, unit: '%' }])}
                >
                  Tambah KR
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {editGoalKeyResults.map((kr, idx) => (
                  <div key={kr.id} className="p-3 bg-white/[0.01] border border-life-line rounded-lg space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <input 
                        type="text" 
                        value={kr.title} 
                        onChange={(e) => {
                          const newKrs = [...editGoalKeyResults];
                          newKrs[idx].title = e.target.value;
                          setEditGoalKeyResults(newKrs);
                        }} 
                        placeholder="Key Result Title..." 
                        className="glass-input text-xs flex-1" 
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const newKrs = [...editGoalKeyResults];
                          newKrs.splice(idx, 1);
                          setEditGoalKeyResults(newKrs);
                        }}
                        className="text-life-muted hover:text-red-400 p-1"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[9px] font-bold text-life-muted uppercase">Current</label>
                        <input 
                          type="number" 
                          value={kr.currentValue} 
                          onChange={(e) => {
                            const newKrs = [...editGoalKeyResults];
                            newKrs[idx].currentValue = Number(e.target.value);
                            setEditGoalKeyResults(newKrs);
                          }} 
                          className="glass-input text-xs" 
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[9px] font-bold text-life-muted uppercase">Target</label>
                        <input 
                          type="number" 
                          value={kr.targetValue} 
                          onChange={(e) => {
                            const newKrs = [...editGoalKeyResults];
                            newKrs[idx].targetValue = Number(e.target.value);
                            setEditGoalKeyResults(newKrs);
                          }} 
                          className="glass-input text-xs" 
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[9px] font-bold text-life-muted uppercase">Unit</label>
                        <input 
                          type="text" 
                          value={kr.unit} 
                          onChange={(e) => {
                            const newKrs = [...editGoalKeyResults];
                            newKrs[idx].unit = e.target.value;
                            setEditGoalKeyResults(newKrs);
                          }} 
                          className="glass-input text-xs" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {editGoalKeyResults.length === 0 && (
                  <p className="text-xs text-life-muted text-center py-4">Belum ada Key Results.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
              <Button type="button" variant="secondary" onClick={() => setEditingGoal(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan OKR
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal New Goal */}
      <Modal
        isOpen={isNewGoalModalOpen}
        onClose={() => setIsNewGoalModalOpen(false)}
        title="Buat Objective Baru"
        subtitle="Tetapkan Objective utama Anda"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-life-muted uppercase">
              Objective Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input text-sm mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">
                Kategori
              </label>
              <select
                value={category}
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
              <label className="text-xs font-bold text-life-muted uppercase">
                Tenggat Waktu
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="glass-input text-xs mt-1"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
            <Button type="button" variant="secondary" onClick={() => setIsNewGoalModalOpen(false)}>
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
