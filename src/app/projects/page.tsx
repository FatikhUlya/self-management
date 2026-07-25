'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { QuickNavGrid } from '@/components/ui/QuickNavGrid';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { percent } from '@/lib/utils';
import { PRIORITY_OPTIONS, Priority } from '@/lib/constants';

export default function ProjectsDashboardPage() {
  const { state, addProject, addTask } = useLifeOS();
  const { t, locale } = useI18n();

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Project form states
  const [projectName, setProjectName] = useLocalStorageState('draft_project_name', '');
  const [projectArea, setProjectArea] = useLocalStorageState('draft_project_area', 'Career');
  const [projectGoalId, setProjectGoalId] = useLocalStorageState('draft_project_goalId', '');

  // Task form states
  const [taskTitle, setTaskTitle] = useLocalStorageState('draft_task_title', '');
  const [taskProjectId, setTaskProjectId] = useLocalStorageState('draft_task_projectId', '');
  const [taskDue, setTaskDue] = useLocalStorageState('draft_task_due', state.selectedDate);
  const [taskPriority, setTaskPriority] = useLocalStorageState<Priority>('draft_task_priority', 'Medium');
  const [taskGoalId, setTaskGoalId] = useLocalStorageState('draft_task_goalId', '');

  const activeProjectsCount = state.projects.filter(p => p.status === 'active').length;
  const activeTasksCount = state.tasks.filter(t => t.status !== 'done').length;

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    await addProject({
      name: projectName,
      area: projectArea,
      status: 'active',
      goalId: projectGoalId || undefined
    });

    setProjectName('');
    setIsNewProjectModalOpen(false);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    await addTask({
      title: taskTitle,
      projectId: taskProjectId,
      due: taskDue,
      priority: taskPriority,
      goalId: taskGoalId || undefined
    });

    setTaskTitle('');
    setIsNewTaskModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600 dark:from-blue-300 dark:to-indigo-500 flex items-center gap-2">
            <Icon name="folder" size={28} className="text-blue-500" />
            {t('projects_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Kelola proyek, papan kanban tugas, dan produktivitas Anda.
          </p>
        </div>
      </div>

      {/* Sub-page Navigation Grid */}
      <QuickNavGrid 
        items={[
          { label: 'Tugas (Kanban)', icon: 'checkSquare', iconColor: 'text-cyan-500', href: '/projects/tasks' },
          { label: 'Kelola Proyek', icon: 'briefcase', iconColor: 'text-blue-500', href: '/projects/manage' }
        ]} 
      />

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DashboardCard
          icon="folder"
          iconColor="text-blue-500"
          accentColor="blue-500"
          label="Proyek Aktif"
          value={activeProjectsCount}
          detail={`Dari total ${state.projects.length} proyek`}
        >
          <div className="w-full bg-black/10 dark:bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all" 
              style={{ width: `${percent(activeProjectsCount, state.projects.length || 1)}%` }}
            />
          </div>
        </DashboardCard>
        
        <DashboardCard
          icon="checkSquare"
          iconColor="text-cyan-500"
          accentColor="cyan-500"
          label="Tugas Berjalan"
          value={activeTasksCount}
          detail={`Dari total ${state.tasks.length} tugas terdaftar`}
        >
           <div className="w-full bg-black/10 dark:bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-cyan-500 h-full rounded-full transition-all" 
              style={{ width: `${percent(activeTasksCount, state.tasks.length || 1)}%` }}
            />
          </div>
        </DashboardCard>
      </div>

      {/* Quick Actions Surface */}
      <Surface className="p-6">
        <div className="flex justify-between items-center border-b border-life-line pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              Aksi Cepat
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Buat tugas atau proyek baru dengan cepat.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <Button 
            variant="secondary" 
            icon="plus" 
            onClick={() => setIsNewProjectModalOpen(true)}
            className="w-full justify-start text-left bg-white/[0.01] hover:bg-white/[0.03] border-life-line p-4 h-auto"
          >
            <div className="ml-2">
              <span className="block font-bold">{locale === 'id' ? 'Proyek Baru' : 'New Project'}</span>
              <span className="text-[10px] text-life-muted font-normal mt-0.5 block">Buat ruang lingkup pekerjaan baru.</span>
            </div>
          </Button>
          
          <Button 
            variant="secondary" 
            icon="plus" 
            onClick={() => setIsNewTaskModalOpen(true)}
            className="w-full justify-start text-left bg-white/[0.01] hover:bg-white/[0.03] border-life-line p-4 h-auto"
          >
            <div className="ml-2">
              <span className="block font-bold">{locale === 'id' ? 'Tugas Baru' : 'New Task'}</span>
              <span className="text-[10px] text-life-muted font-normal mt-0.5 block">Tambah pekerjaan ke dalam backlog.</span>
            </div>
          </Button>
        </div>
      </Surface>

      {/* Modal Add Project */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title={t('projects_add')}
        subtitle={t('projects_form_desc')}
      >
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="pName" className="text-xs font-bold text-life-muted uppercase">
              {t('projects_name')}
            </label>
            <input
              id="pName"
              type="text"
              required
              placeholder={t('projects_name_placeholder')}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="glass-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="pArea" className="text-xs font-bold text-life-muted uppercase">
                {t('area')}
              </label>
              <select
                id="pArea"
                value={projectArea}
                onChange={(e) => setProjectArea(e.target.value)}
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
              <label htmlFor="pGoal" className="text-xs font-bold text-life-muted uppercase">
                Goal / Target
              </label>
              <select
                id="pGoal"
                value={projectGoalId}
                onChange={(e) => setProjectGoalId(e.target.value)}
                className="glass-select text-xs"
              >
                <option value="">-- Tanpa Target --</option>
                {state.goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" variant="primary" icon="plus" className="w-full">
            Buat Proyek
          </Button>
        </form>
      </Modal>

      {/* Modal Add Task */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title={t('tasks_add')}
        subtitle={t('tasks_form_desc')}
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="tTitle" className="text-xs font-bold text-life-muted uppercase">
              {t('tasks_title_label')}
            </label>
            <input
              id="tTitle"
              type="text"
              required
              placeholder={t('tasks_title_placeholder')}
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="glass-input text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="tProject" className="text-xs font-bold text-life-muted uppercase">
                {t('tasks_project')}
              </label>
              <select
                id="tProject"
                value={taskProjectId}
                onChange={(e) => setTaskProjectId(e.target.value)}
                className="glass-select text-xs"
              >
                <option value="">{t('tasks_inbox')}</option>
                {state.projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="tDue" className="text-xs font-bold text-life-muted uppercase">
                {t('tasks_due')}
              </label>
              <input
                id="tDue"
                type="date"
                required
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="glass-input text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="tPriority" className="text-xs font-bold text-life-muted uppercase">
                {t('priority')}
              </label>
              <select
                id="tPriority"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                className="glass-select text-xs"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="tGoal" className="text-xs font-bold text-life-muted uppercase">
                Goal / Target
              </label>
              <select
                id="tGoal"
                value={taskGoalId}
                onChange={(e) => setTaskGoalId(e.target.value)}
                className="glass-select text-xs"
              >
                <option value="">-- Tanpa Target --</option>
                {state.goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" variant="primary" icon="plus" className="w-full">
            Buat Tugas
          </Button>
        </form>
      </Modal>
    </div>
  );
}
