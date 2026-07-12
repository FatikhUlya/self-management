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
import { formatDate, percent } from '@/lib/utils';
import { PRIORITY_OPTIONS, Priority } from '@/lib/constants';

export default function ProjectsPage() {
  const { 
    state, 
    addProject, 
    deleteProject, 
    addTask, 
    updateTaskStatus, 
    deleteTask,
    updateProjectGoal,
    updateTaskGoal
  } = useLifeOS();
  
  const { t } = useI18n();

  // Project form states
  const [projectName, setProjectName] = useLocalStorageState('draft_project_name', '');
  const [projectArea, setProjectArea] = useLocalStorageState('draft_project_area', '');
  const [projectStatus, setProjectStatus] = useLocalStorageState<'active' | 'paused' | 'done'>('draft_project_status', 'active');
  const [projectGoalId, setProjectGoalId] = useLocalStorageState('draft_project_goalId', '');

  // Task form states
  const [taskTitle, setTaskTitle] = useLocalStorageState('draft_task_title', '');
  const [taskProjectId, setTaskProjectId] = useLocalStorageState('draft_task_projectId', '');
  const [taskDue, setTaskDue] = useLocalStorageState('draft_task_due', state.selectedDate);
  const [taskPriority, setTaskPriority] = useLocalStorageState<Priority>('draft_task_priority', 'Medium');
  const [taskGoalId, setTaskGoalId] = useLocalStorageState('draft_task_goalId', '');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const activeProjectsCount = state.projects.filter(p => p.status === 'active').length;
  const activeTasksCount = state.tasks.filter(t => t.status !== 'done').length;

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    await addProject({
      name: projectName,
      area: projectArea,
      status: projectStatus,
      goalId: projectGoalId || undefined
    });

    setProjectName('');
    setProjectArea('');
    setProjectStatus('active');
    setProjectGoalId('');
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
    setTaskProjectId('');
    setTaskPriority('Medium');
    setTaskGoalId('');
  };

  // Helper to render task board columns (Todo / Doing / Done)
  const renderBoardColumn = (columnStatus: 'todo' | 'doing' | 'done', title: string) => {
    const columnTasks = state.tasks
      .filter((task) => task.status === columnStatus)
      .sort((a, b) => (a.due || '').localeCompare(b.due || ''));

    return (
      <div className="flex-1 min-w-[280px] bg-white/[0.005] border border-life-line rounded-xl p-4 flex flex-col h-[400px]">
        <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/5">
          <h4 className="text-xs font-black uppercase text-life-muted tracking-wider">{title}</h4>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/[0.04] text-life-muted border border-life-line">
            {columnTasks.length}
          </span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {columnTasks.length > 0 ? (
            columnTasks.map((task) => {
              const project = state.projects.find((p) => p.id === task.projectId);
              const goal = state.goals.find((g) => g.id === task.goalId);
              const isOverdue = task.due && task.due < state.selectedDate && task.status !== 'done';
              
              return (
                <div 
                  key={task.id} 
                  className="p-3 rounded-lg bg-white/[0.01] border border-life-line hover:border-life-line-strong hover:bg-white/[0.015] transition-all duration-150 space-y-2"
                >
                  <div className="min-w-0">
                    <strong className="text-xs font-bold text-life-text block leading-tight">{task.title}</strong>
                    <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-life-muted">
                      <span>📁 {project ? project.name : 'Inbox'}</span>
                      {goal && <span className="text-teal-400 font-semibold flex items-center gap-1 mt-0.5">🎯 {goal.title}</span>}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={isOverdue ? 'rose' : task.priority === 'High' ? 'rose' : task.priority === 'Medium' ? 'amber' : 'gray'}>
                        {isOverdue ? t('tasks_overdue') : task.priority}
                      </Badge>
                      {task.due && (
                        <span className="text-[9px] text-life-muted font-bold self-center">
                          {formatDate(task.due)}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-1 shrink-0">
                      {columnStatus !== 'todo' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'todo')}
                          className="w-5 h-5 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center"
                          title="Move to Todo"
                        >
                          <Icon name="chevronLeft" size={10} />
                        </button>
                      )}
                      {columnStatus === 'todo' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'doing')}
                          className="w-5 h-5 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center"
                          title="Move to Doing"
                        >
                          <Icon name="chevronRight" size={10} />
                        </button>
                      )}
                      {columnStatus === 'doing' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'done')}
                          className="w-5 h-5 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center text-teal-400"
                          title="Complete Task"
                        >
                          <Icon name="check" size={10} />
                        </button>
                      )}
                      {columnStatus === 'done' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'doing')}
                          className="w-5 h-5 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center"
                          title="Move back to Doing"
                        >
                          <Icon name="chevronLeft" size={10} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="w-5 h-5 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center"
                        title={t('delete')}
                      >
                        <Icon name="trash" size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    );
  };

  // Helper to render task board as a compact list view
  const renderListView = () => {
    const sortedTasks = [...state.tasks].sort((a, b) => (a.due || '').localeCompare(b.due || ''));
    if (sortedTasks.length === 0) return <EmptyState />;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-life-line text-[10px] font-black text-life-muted uppercase tracking-wider">
              <th className="pb-3 pr-4">{t('tasks_title_label')}</th>
              <th className="pb-3 px-4">{t('tasks_project')}</th>
              <th className="pb-3 px-4">Target (Goal)</th>
              <th className="pb-3 px-4">{t('tasks_due')}</th>
              <th className="pb-3 px-4">{t('priority')}</th>
              <th className="pb-3 px-4">{t('status')}</th>
              <th className="pb-3 pl-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedTasks.map((task) => {
              const project = state.projects.find((p) => p.id === task.projectId);
              const isOverdue = task.due && task.due < state.selectedDate && task.status !== 'done';
              
              return (
                <tr key={task.id} className="text-xs hover:bg-white/[0.005] transition-colors">
                  <td className="py-3 pr-4 font-bold text-life-text min-w-[150px]">{task.title}</td>
                  <td className="py-3 px-4 text-life-muted font-semibold">{project ? project.name : 'Inbox'}</td>
                  <td className="py-3 px-4">
                    <select
                      value={task.goalId || ''}
                      onChange={(e) => updateTaskGoal(task.id, e.target.value || null)}
                      className="glass-select py-1 px-2 text-[10px]"
                    >
                      <option value="">-- Tanpa Target --</option>
                      {state.goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          🎯 {g.title}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={isOverdue ? 'text-life-rose font-bold' : 'text-life-muted font-bold'}>
                      {task.due ? formatDate(task.due) : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge tone={task.priority === 'High' ? 'rose' : task.priority === 'Medium' ? 'amber' : 'gray'}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                      className="glass-select py-1 px-2 text-[10px] uppercase font-black"
                    >
                      <option value="todo">{t('tasks_todo')}</option>
                      <option value="doing">{t('tasks_doing')}</option>
                      <option value="done">{t('tasks_done')}</option>
                    </select>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose inline-flex items-center justify-center transition-all"
                      title={t('delete')}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Project Creation Form */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('projects_add')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {activeProjectsCount} {t('projects_active')}
            </p>
          </div>

          <form onSubmit={handleProjectSubmit} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="projectName" className="text-xs font-bold text-life-muted uppercase">
                {t('projects_name')}
              </label>
              <input
                id="projectName"
                type="text"
                required
                placeholder="E.g. Portfolio Design, Thesis..."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="glass-input text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label htmlFor="projectArea" className="text-xs font-bold text-life-muted uppercase">
                  {t('area')}
                </label>
                <input
                  id="projectArea"
                  type="text"
                  placeholder={t('projects_area_placeholder')}
                  value={projectArea}
                  onChange={(e) => setProjectArea(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="projectStatus" className="text-xs font-bold text-life-muted uppercase">
                  {t('status')}
                </label>
                <select
                  id="projectStatus"
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value as any)}
                  className="glass-select text-xs"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="projectGoal" className="text-xs font-bold text-life-muted uppercase">
                Hubungkan ke Target (Goal)
              </label>
              <select
                id="projectGoal"
                value={projectGoalId}
                onChange={(e) => setProjectGoalId(e.target.value)}
                className="glass-select text-xs"
              >
                <option value="">-- Tanpa Target --</option>
                {state.goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    🎯 {g.title} ({g.progress}%)
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full">
              {t('projects_add_btn')}
            </Button>
          </form>
        </Surface>

        {/* Right: Task Creation Form */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('tasks_add')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {activeTasksCount} {t('tasks_open')}
            </p>
          </div>

          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="taskTitle" className="text-xs font-bold text-life-muted uppercase">
                {t('tasks_title_label')}
              </label>
              <input
                id="taskTitle"
                type="text"
                required
                placeholder={t('tasks_what_todo')}
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="glass-input text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="taskProject" className="text-xs font-bold text-life-muted uppercase">
                  {t('tasks_project')}
                </label>
                <select
                  id="taskProject"
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  className="glass-select text-xs"
                >
                  <option value="">{t('tasks_inbox')}</option>
                  {state.projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="taskDue" className="text-xs font-bold text-life-muted uppercase">
                  {t('tasks_due')}
                </label>
                <input
                  id="taskDue"
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="taskPriority" className="text-xs font-bold text-life-muted uppercase">
                  {t('priority')}
                </label>
                <select
                  id="taskPriority"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Priority)}
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
              <label htmlFor="taskGoal" className="text-xs font-bold text-life-muted uppercase">
                Hubungkan ke Target (Goal)
              </label>
              <select
                id="taskGoal"
                value={taskGoalId}
                onChange={(e) => setTaskGoalId(e.target.value)}
                className="glass-select text-xs"
              >
                <option value="">-- Tanpa Target --</option>
                {state.goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    🎯 {g.title} ({g.progress}%)
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full">
              {t('tasks_add_btn')}
            </Button>
          </form>
        </Surface>
      </div>

      {/* Kanban Board columns */}
      <Surface className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-life-line pb-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('tasks_board')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {t('tasks_board_desc')}
            </p>
          </div>

          {/* Kanban / List Toggle */}
          <div className="flex bg-white/[0.02] border border-life-line rounded-lg p-0.5 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                viewMode === 'kanban'
                  ? 'bg-life-teal text-white shadow-md'
                  : 'text-life-muted hover:text-life-text'
              }`}
            >
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                viewMode === 'list'
                  ? 'bg-life-teal text-white shadow-md'
                  : 'text-life-muted hover:text-life-text'
              }`}
            >
              Daftar
            </button>
          </div>
        </div>

        {viewMode === 'kanban' ? (
          <div className="flex flex-wrap gap-4 overflow-x-auto">
            {renderBoardColumn('todo', t('tasks_todo'))}
            {renderBoardColumn('doing', t('tasks_doing'))}
            {renderBoardColumn('done', t('tasks_done'))}
          </div>
        ) : (
          renderListView()
        )}
      </Surface>

      {/* Projects List */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('projects_list')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {t('projects_progress_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
          {state.projects.length > 0 ? (
            state.projects.map((proj) => {
              const projTasks = state.tasks.filter((t) => t.projectId === proj.id);
              const doneTasks = projTasks.filter((t) => t.status === 'done');
              const completionRate = percent(doneTasks.length, projTasks.length);

              return (
                <div 
                  key={proj.id} 
                  className="p-4 rounded-xl bg-white/[0.005] border border-life-line hover:border-life-line-strong hover:bg-white/[0.01] transition-all space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <strong className="text-sm text-life-text block tracking-tight">{proj.name}</strong>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-life-muted uppercase tracking-wider">
                          Area: {proj.area || 'Inbox'} / {projTasks.length} Tasks
                        </span>
                        <select
                          value={proj.goalId || ''}
                          onChange={(e) => updateProjectGoal(proj.id, e.target.value || null)}
                          className="glass-select py-0.5 px-1.5 text-[9px] bg-black/40 border border-white/5 text-life-muted hover:text-life-text focus:text-life-text"
                        >
                          <option value="">🎯 -- Hubungkan Goal --</option>
                          {state.goals.map((g) => (
                            <option key={g.id} value={g.id}>
                              🎯 {g.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge tone={proj.status === 'active' ? 'teal' : proj.status === 'paused' ? 'amber' : 'green'}>
                        {proj.status}
                      </Badge>
                      <button
                        onClick={() => deleteProject(proj.id)}
                        className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all"
                        title={t('delete')}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-life-muted font-bold uppercase">
                      <span>{completionRate}% {t('projects_completed')}</span>
                      <span>{doneTasks.length}/{projTasks.length}</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-life-teal to-teal-400"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
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
