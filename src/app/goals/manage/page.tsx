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

export default function GoalsManagePage() {
  const { state, addGoal, updateGoal, updateGoalProgress, deleteGoal, updateTaskStatus } = useLifeOS();
  const { triggerConfetti } = useConfetti();
  const { t, locale } = useI18n();

  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [expandedGoalIds, setExpandedGoalIds] = useState<Record<string, boolean>>({});

  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [title, setTitle] = useLocalStorageState('draft_goal_title', '');
  const [category, setCategory] = useLocalStorageState('draft_goal_category', 'Career');
  const [currentValue, setCurrentValue] = useLocalStorageState<number>('draft_goal_currentValue', 0);
  const [targetValue, setTargetValue] = useLocalStorageState<number>('draft_goal_targetValue', 100);
  const [unit, setUnit] = useLocalStorageState('draft_goal_unit', '%');
  const [targetDate, setTargetDate] = useLocalStorageState('draft_goal_targetDate', state.selectedDate);

  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalCategory, setEditGoalCategory] = useState('');
  const [editGoalCurrentValue, setEditGoalCurrentValue] = useState<number>(0);
  const [editGoalTargetValue, setEditGoalTargetValue] = useState<number>(100);
  const [editGoalUnit, setEditGoalUnit] = useState('%');
  const [editGoalTargetDate, setEditGoalTargetDate] = useState('');

  const getGoalTimeframe = (targetDateStr: string) => {
    if (!targetDateStr) return 'medium';
    const diffTime = new Date(targetDateStr).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 90) return 'short';
    if (diffDays <= 365) return 'medium';
    return 'long';
  };

  const timeframeLabel = (tf: string) => {
    switch (tf) {
      case 'short': return locale === 'id' ? 'Jangka Pendek (1-3 Bln)' : 'Short-Term (1-3 Mo)';
      case 'medium': return locale === 'id' ? 'Jangka Menengah (1 Thn)' : 'Medium-Term (1 Yr)';
      case 'long': return locale === 'id' ? 'Jangka Panjang (3-5 Thn)' : 'Long-Term (3-5 Yr)';
      default: return '';
    }
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
    setEditGoalCurrentValue(goal.currentValue || 0);
    setEditGoalTargetValue(goal.targetValue || 100);
    setEditGoalUnit(goal.unit || '%');
    setEditGoalTargetDate(goal.targetDate || '');
  };

  const handleSaveEditGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editGoalTitle.trim()) return;
    await updateGoal(editingGoal.id, {
      title: editGoalTitle.trim(),
      category: editGoalCategory.trim() || 'Career',
      currentValue: editGoalCurrentValue,
      targetValue: editGoalTargetValue,
      unit: editGoalUnit,
      targetDate: editGoalTargetDate
    });
    setEditingGoal(null);
  };

  const handleProgressChange = async (id: string, amount: number, currentProgress: number) => {
    const nextProgress = Math.min(100, Math.max(0, currentProgress + amount));
    if (nextProgress === 100 && currentProgress < 100) {
      triggerConfetti();
    }
    await updateGoalProgress(id, amount);
  };

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

    setTitle('');
    setCategory('Career');
    setCurrentValue(0);
    setTargetValue(100);
    setUnit('%');
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
            Kelola Goals (OKRs)
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Visualisasi target utama dan kerangka kerja OKR.
          </p>
        </div>
        <Button 
          variant="primary" 
          icon="plus" 
          onClick={() => setIsNewGoalModalOpen(true)}
          className="shrink-0"
        >
          {locale === 'id' ? 'Goal Baru' : 'New Goal'}
        </Button>
      </div>

      <Surface className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-life-line pb-3 mb-5">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-life-text uppercase tracking-wider">
              <Icon name="target" size={16} className="text-life-teal" /> Objectives & Key Results (OKRs)
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {locale === 'id' 
                ? 'Objective diambil dari Goals utama. Proyek & Tugas terkait bertindak sebagai Key Results pendukung.'
                : 'Objectives are derived from main Goals. Related Projects & Tasks act as supporting Key Results.'}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 bg-white/[0.02] border border-life-line rounded-lg select-none shrink-0 self-start sm:self-auto">
            {(['all', 'short', 'medium', 'long'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTimeframeFilter(tab)}
                className={`text-[9px] font-black uppercase py-1.5 px-3 rounded transition-all ${
                  timeframeFilter === tab
                    ? 'bg-white/[0.07] text-white shadow-sm'
                    : 'text-life-muted hover:text-life-text'
                }`}
              >
                {tab === 'all' ? 'Semua' : tab === 'short' ? 'Short' : tab === 'medium' ? 'Medium' : 'Long'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredGoals.length > 0 ? (
            filteredGoals.map((goal) => {
              const isExpanded = !!expandedGoalIds[goal.id];
              const linkedProjects = state.projects.filter((p) => p.goalId === goal.id);
              const linkedProjectIds = linkedProjects.map((p) => p.id);
              const linkedDirectTasks = state.tasks.filter((t) => t.goalId === goal.id);
              const linkedProjectTasks = state.tasks.filter((t) => t.projectId && linkedProjectIds.includes(t.projectId));
              
              const isAutoTracked = linkedDirectTasks.length > 0 || linkedProjectTasks.length > 0;
              const totalKeyResults = linkedProjects.length + linkedDirectTasks.length;

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
                        <span className="text-[10px] text-life-muted hidden sm:inline">•</span>
                        <span className="text-[10px] text-life-muted font-bold">
                          {isAutoTracked 
                            ? `${totalKeyResults} ${locale === 'id' ? 'Key Results (Otomatis)' : 'Key Results (Auto)'}`
                            : (locale === 'id' ? 'Lacak Manual' : 'Manual Tracked')
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {!isAutoTracked && (
                        <div className="flex items-center space-x-1 mr-2">
                          <button
                            onClick={() => handleProgressChange(goal.id, -5, goal.progress)}
                            className="w-6 h-6 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
                          >
                            <Icon name="minus" size={10} />
                          </button>
                          <button
                            onClick={() => handleProgressChange(goal.id, 5, goal.progress)}
                            className="w-6 h-6 rounded bg-white/[0.03] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
                          >
                            <Icon name="plus" size={10} />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => handleOpenEditGoal(goal)}
                        className="w-6 h-6 rounded bg-white/[0.03] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center transition-all mr-1"
                        title="Edit Goal"
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
                      {isAutoTracked ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1">
                            <span>Key Result / Hasil Kunci</span>
                            <span>Status / Progres</span>
                          </div>

                          {linkedProjects.map((proj) => {
                            const projTasks = state.tasks.filter((t) => t.projectId === proj.id);
                            const doneTasks = projTasks.filter((t) => t.status === 'done');
                            const completionRate = percent(doneTasks.length, projTasks.length);
                            return (
                              <div key={proj.id} className="flex justify-between items-center bg-white/[0.01] border border-life-line p-2.5 rounded-lg">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-life-text flex items-center gap-1">
                                    <Icon name="folder" size={12} className="text-blue-400 mt-0.5 shrink-0" />
                                    <span>Proyek: {proj.name}</span>
                                  </span>
                                  <span className="text-[10px] text-life-muted mt-0.5">
                                    {locale === 'id' ? 'Tugas' : 'Tasks'}: {doneTasks.length}/{projTasks.length} {locale === 'id' ? 'selesai' : 'completed'}
                                  </span>
                                </div>
                                <Badge tone={proj.status === 'done' ? 'green' : 'teal'}>
                                  {`${completionRate}%`}
                                </Badge>
                              </div>
                            );
                          })}

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
                                  <Icon name="target" size={12} className="inline mr-1 text-life-teal" /> {locale === 'id' ? 'Tugas' : 'Task'}: {t.title}
                                </span>
                              </div>
                              <Badge tone={t.status === 'done' ? 'green' : t.status === 'doing' ? 'amber' : 'gray'}>
                                {t.status}
                              </Badge>
                            </div>
                          ))}

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

      {/* Modals */}
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

      <Modal
        isOpen={Boolean(editingGoal)}
        onClose={() => setEditingGoal(null)}
        title="Edit Target / Objective"
        subtitle="Perbarui rincian, target kuantitatif, atau tenggat waktu target Anda"
      >
        {editingGoal && (
          <form onSubmit={handleSaveEditGoal} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="editGoalTitleInput" className="text-xs font-bold text-life-muted uppercase">
                {t('goals_goal_label')}
              </label>
              <input
                id="editGoalTitleInput"
                type="text"
                required
                value={editGoalTitle}
                onChange={(e) => setEditGoalTitle(e.target.value)}
                className="glass-input text-sm mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="editGoalCurrentVal" className="text-xs font-bold text-life-muted uppercase">
                  Current
                </label>
                <input
                  id="editGoalCurrentVal"
                  type="number"
                  required
                  value={editGoalCurrentValue}
                  onChange={(e) => setEditGoalCurrentValue(Number(e.target.value))}
                  className="glass-input text-xs mt-1"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="editGoalTargetVal" className="text-xs font-bold text-life-muted uppercase">
                  Target
                </label>
                <input
                  id="editGoalTargetVal"
                  type="number"
                  required
                  value={editGoalTargetValue}
                  onChange={(e) => setEditGoalTargetValue(Number(e.target.value))}
                  className="glass-input text-xs mt-1"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="editGoalUnitInput" className="text-xs font-bold text-life-muted uppercase">
                  Unit
                </label>
                <input
                  id="editGoalUnitInput"
                  type="text"
                  required
                  value={editGoalUnit}
                  onChange={(e) => setEditGoalUnit(e.target.value)}
                  className="glass-input text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="editGoalCat" className="text-xs font-bold text-life-muted uppercase">
                  {t('area')} / Kategori
                </label>
                <select
                  id="editGoalCat"
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
                <label htmlFor="editGoalTargetDt" className="text-xs font-bold text-life-muted uppercase">
                  {t('goals_target_date')}
                </label>
                <input
                  id="editGoalTargetDt"
                  type="date"
                  value={editGoalTargetDate}
                  onChange={(e) => setEditGoalTargetDate(e.target.value)}
                  className="glass-input text-xs mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <Button type="button" variant="secondary" onClick={() => setEditingGoal(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
