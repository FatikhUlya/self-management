'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { MetricCard } from '@/components/ui/MetricCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StaggerGroup, StaggerItem } from '@/lib/animations';
import { percent, formatDate, cn } from '@/lib/utils';
import { PRIORITY_OPTIONS, Priority } from '@/lib/constants';

export default function ProjectsDashboardPage() {
  const { 
    state, 
    addProject, 
    updateProject,
    deleteProject,
    addTask, 
    updateTask,
    updateTaskStatus, 
    deleteTask 
  } = useLifeOS();
  const { t, locale } = useI18n();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  // Quick Task Input
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // New Project Form
  const [projectName, setProjectName] = useLocalStorageState('draft_project_name', '');
  const [projectArea, setProjectArea] = useLocalStorageState('draft_project_area', 'Karir');
  const [projectGoalId, setProjectGoalId] = useLocalStorageState('draft_project_goalId', '');

  // Edit Project Form
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectArea, setEditProjectArea] = useState('Karir');
  const [editProjectStatus, setEditProjectStatus] = useState<'active' | 'paused' | 'done'>('active');
  const [editProjectGoalId, setEditProjectGoalId] = useState('');

  // New Task Form
  const [taskTitle, setTaskTitle] = useLocalStorageState('draft_task_title', '');
  const [taskProjectId, setTaskProjectId] = useLocalStorageState('draft_task_projectId', '');
  const [taskDue, setTaskDue] = useLocalStorageState('draft_task_due', state.selectedDate);
  const [taskPriority, setTaskPriority] = useLocalStorageState<Priority>('draft_task_priority', 'Medium');
  const [taskGoalId, setTaskGoalId] = useLocalStorageState('draft_task_goalId', '');
  const [taskContext, setTaskContext] = useLocalStorageState('draft_task_context', 'Deep Work');

  // Edit Task Form
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskProjectId, setEditTaskProjectId] = useState('');
  const [editTaskDue, setEditTaskDue] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<Priority>('Medium');
  const [editTaskGoalId, setEditTaskGoalId] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState<'todo' | 'doing' | 'done'>('todo');

  // Key Metrics
  const activeProjects = state.projects.filter(p => p.status === 'active');
  const totalTasks = state.tasks.length;
  const activeTasks = state.tasks.filter(t => t.status !== 'done');
  const completedTasks = state.tasks.filter(t => t.status === 'done');
  const completionRate = percent(completedTasks.length, totalTasks || 1);

  // Filtered Tasks
  const filteredTasks = state.tasks.filter(t => {
    if (selectedProjectId !== 'all') {
      if (selectedProjectId === 'inbox') {
        if (t.projectId) return false;
      } else if (t.projectId !== selectedProjectId) {
        return false;
      }
    }
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
      return false;
    }
    if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Handlers
  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    await addTask({
      title: quickTaskTitle.trim(),
      projectId: selectedProjectId !== 'all' && selectedProjectId !== 'inbox' ? selectedProjectId : '',
      due: state.selectedDate,
      priority: 'Medium',
    });

    setQuickTaskTitle('');
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    await addProject({
      name: projectName.trim(),
      area: projectArea,
      status: 'active',
      goalId: projectGoalId || undefined,
    });

    setProjectName('');
    setIsNewProjectModalOpen(false);
  };

  const handleSaveEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editProjectName.trim()) return;

    await updateProject(editingProject.id, {
      name: editProjectName.trim(),
      area: editProjectArea,
      status: editProjectStatus,
      goalId: editProjectGoalId || '',
    });

    setEditingProject(null);
  };

  const handleOpenEditProject = (proj: any) => {
    setEditingProject(proj);
    setEditProjectName(proj.name);
    setEditProjectArea(proj.area || 'Karir');
    setEditProjectStatus(proj.status);
    setEditProjectGoalId(proj.goalId || '');
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    await addTask({
      title: taskTitle.trim(),
      projectId: taskProjectId,
      due: taskDue,
      priority: taskPriority,
      goalId: taskGoalId || undefined,
      context: taskContext,
    });

    setTaskTitle('');
    setIsNewTaskModalOpen(false);
  };

  const handleOpenEditTask = (task: any) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskProjectId(task.projectId || '');
    setEditTaskDue(task.due || '');
    setEditTaskPriority(task.priority || 'Medium');
    setEditTaskGoalId(task.goalId || '');
    setEditTaskStatus(task.status);
  };

  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTaskTitle.trim()) return;

    await updateTask(editingTask.id, {
      title: editTaskTitle.trim(),
      projectId: editTaskProjectId,
      due: editTaskDue,
      priority: editTaskPriority,
      goalId: editTaskGoalId || '',
      status: editTaskStatus,
    });

    setEditingTask(null);
  };

  return (
    <StaggerGroup className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ═══════════════ Header ═══════════════ */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.025em] leading-[1.15] text-foreground flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon name="checkSquare" size={17} />
              </span>
              Proyek & Tugas
            </h1>
            <p className="text-sm leading-[1.6] text-zinc-600 dark:text-zinc-400 mt-1 max-w-prose">
              Pusat manajemen ruang lingkup kerja, papan tugas, dan penyelesaian sasaran.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon="plus"
              onClick={() => setIsNewProjectModalOpen(true)}
              className="text-xs font-semibold shadow-2xs"
            >
              Proyek Baru
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="plus"
              onClick={() => setIsNewTaskModalOpen(true)}
              className="text-xs font-semibold shadow-2xs"
            >
              Tugas Baru
            </Button>
          </div>
        </div>
      </StaggerItem>

      {/* ═══════════════ Metrics Row ═══════════════ */}
      <StaggerItem>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <MetricCard
            icon="folder"
            label="Proyek Aktif"
            value={activeProjects.length}
            detail={`${state.projects.length} total proyek`}
            glow={activeProjects.length > 0}
          />
          <MetricCard
            icon="checkSquare"
            label="Tugas Berjalan"
            value={activeTasks.length}
            detail={`${activeTasks.filter(t => t.priority === 'High' || t.priority === 'P1').length} prioritas tinggi`}
          />
          <MetricCard
            icon="check"
            label="Tugas Selesai"
            value={completedTasks.length}
            detail={`${completionRate}% tingkat penyelesaian`}
            glow={completionRate >= 70}
          />
          <MetricCard
            icon="target"
            label="Keterikatan Goal"
            value={state.tasks.filter(t => t.goalId).length}
            detail="Tugas terhubung ke sasaran"
          />
        </div>
      </StaggerItem>

      {/* ═══════════════ Main Hub Tabs (Tugas vs Proyek) ═══════════════ */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-1.5 rounded-xl border border-border/80">
          {/* Main Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('tasks')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === 'tasks'
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon name="checkSquare" size={13} className={activeTab === 'tasks' ? "text-primary" : "text-muted-foreground"} />
              Papan Tugas ({filteredTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeTab === 'projects'
                  ? "bg-card text-foreground font-semibold shadow-2xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon name="folder" size={13} className={activeTab === 'projects' ? "text-primary" : "text-muted-foreground"} />
              Daftar Proyek ({state.projects.length})
            </button>
          </div>

          {/* Sub Navigation Shortcut */}
          <div className="flex items-center gap-2">
            {activeTab === 'tasks' && (
              <div className="flex items-center bg-card border border-border/80 rounded-lg p-0.5 shadow-2xs">
                <button
                  onClick={() => setTaskViewMode('kanban')}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5",
                    taskViewMode === 'kanban'
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Tampilan Kanban"
                >
                  <Icon name="layout" size={12} />
                  Kanban
                </button>
                <button
                  onClick={() => setTaskViewMode('list')}
                  className={cn(
                    "px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5",
                    taskViewMode === 'list'
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Tampilan List"
                >
                  <Icon name="journal" size={12} />
                  Daftar
                </button>
              </div>
            )}
          </div>
        </div>
      </StaggerItem>

      {/* ═══════════════ TAB 1: PAPAN TUGAS (KANBAN & LIST) ═══════════════ */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Filter Bar & Quick Add Task */}
          <Surface className="p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                {/* Search */}
                <div className="relative w-full sm:w-48">
                  <Icon name="search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari tugas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass-input pl-8 py-1.5 text-xs w-full"
                  />
                </div>

                {/* Project Filter */}
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="glass-select py-1.5 text-xs font-medium"
                >
                  <option value="all">Semua Proyek</option>
                  <option value="inbox">Inbox (Tanpa Proyek)</option>
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {/* Priority Filter */}
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="glass-select py-1.5 text-xs font-medium"
                >
                  <option value="all">Semua Prioritas</option>
                  <option value="High">Tinggi (High)</option>
                  <option value="Medium">Sedang (Medium)</option>
                  <option value="Low">Rendah (Low)</option>
                </select>
              </div>

              {/* Inline Quick Add Form */}
              <form onSubmit={handleQuickAddTask} className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="+ Tambah tugas cepat lalu tekan Enter..."
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  className="glass-input py-1.5 pr-14 text-xs bg-muted/20 hover:bg-muted/30 focus:bg-background transition-colors"
                />
                <button
                  type="submit"
                  disabled={!quickTaskTitle.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-semibold bg-primary text-primary-foreground disabled:opacity-30 transition-all"
                >
                  Enter ↵
                </button>
              </form>
            </div>
          </Surface>

          {/* Kanban Board View */}
          {taskViewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {(['todo', 'doing', 'done'] as const).map((columnStatus) => {
                const columnTitle = {
                  todo: 'To Do (Menunggu)',
                  doing: 'In Progress (Sedang Dikerjakan)',
                  done: 'Done (Selesai)',
                }[columnStatus];

                const columnTasks = filteredTasks
                  .filter((t) => t.status === columnStatus)
                  .sort((a, b) => (a.due || '').localeCompare(b.due || ''));

                const columnBorder = {
                  todo: 'border-border/80',
                  doing: 'border-amber-500/30',
                  done: 'border-emerald-500/30',
                }[columnStatus];

                return (
                  <div
                    key={columnStatus}
                    className={cn(
                      "flex flex-col bg-card/60 backdrop-blur-xs rounded-xl border p-3.5 shadow-2xs min-h-[480px]",
                      columnBorder
                    )}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-border/80">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          columnStatus === 'todo' ? "bg-muted-foreground" : columnStatus === 'doing' ? "bg-amber-500" : "bg-emerald-500"
                        )} />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                          {columnTitle}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-semibold bg-muted text-muted-foreground border border-border">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Task Cards */}
                    <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                      {columnTasks.length > 0 ? (
                        columnTasks.map((task, index) => {
                          const project = state.projects.find((p) => p.id === task.projectId);
                          const isOverdue = task.due && task.due < state.selectedDate && task.status !== 'done';

                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02, duration: 0.2 }}
                              className="group p-3 rounded-lg bg-card border border-border/80 hover:border-border hover:shadow-xs transition-all space-y-2 select-none"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={cn(
                                  "text-xs font-medium text-foreground block leading-tight",
                                  task.status === 'done' && "line-through text-muted-foreground"
                                )}>
                                  {task.title}
                                </span>
                                <button
                                  onClick={() => handleOpenEditTask(task)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground rounded transition-opacity"
                                  title="Edit tugas"
                                >
                                  <Icon name="edit" size={11} />
                                </button>
                              </div>

                              {/* Project & Goal Tags */}
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                                  <Icon name="folder" size={10} className="text-primary" />
                                  {project ? project.name : 'Inbox'}
                                </span>
                                {task.context && (
                                  <span className="text-muted-foreground/70">• {task.context}</span>
                                )}
                              </div>

                              {/* Footer: Priority + Date + Actions */}
                              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                                <div className="flex items-center gap-1.5">
                                  <Badge
                                    tone={
                                      isOverdue
                                        ? 'rose'
                                        : task.priority === 'High' || task.priority === 'P1'
                                        ? 'rose'
                                        : task.priority === 'Medium' || task.priority === 'P2'
                                        ? 'amber'
                                        : 'gray'
                                    }
                                    className="text-[9px]"
                                  >
                                    {isOverdue ? 'Overdue' : task.priority}
                                  </Badge>
                                  {task.due && (
                                    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                                      {formatDate(task.due)}
                                    </span>
                                  )}
                                </div>

                                {/* Quick Move Chevrons */}
                                <div className="flex items-center gap-1">
                                  {columnStatus !== 'todo' && (
                                    <button
                                      onClick={() => updateTaskStatus(task.id, columnStatus === 'done' ? 'doing' : 'todo')}
                                      className="p-1 rounded bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                      title="Kembalikan status"
                                    >
                                      <Icon name="chevronLeft" size={11} />
                                    </button>
                                  )}
                                  {columnStatus !== 'done' && (
                                    <button
                                      onClick={() => updateTaskStatus(task.id, columnStatus === 'todo' ? 'doing' : 'done')}
                                      className="p-1 rounded bg-muted/40 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                                      title="Lanjut status"
                                    >
                                      <Icon name="chevronRight" size={11} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-center p-3">
                          <p className="text-xs text-muted-foreground/70 font-medium">Tidak ada tugas</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {taskViewMode === 'list' && (
            <Surface className="p-4 md:p-6 space-y-2">
              {filteredTasks.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {filteredTasks.map((task) => {
                    const isDone = task.status === 'done';
                    const project = state.projects.find((p) => p.id === task.projectId);
                    return (
                      <div
                        key={task.id}
                        className="py-3 flex items-center justify-between gap-3 group select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <button
                            type="button"
                            onClick={() => updateTaskStatus(task.id, isDone ? 'todo' : 'done')}
                            className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0",
                              isDone
                                ? "bg-primary border-primary text-primary-foreground"
                                : "bg-card border-input hover:border-primary text-transparent hover:text-primary/50"
                            )}
                          >
                            <Icon name="check" size={12} />
                          </button>
                          <div className="min-w-0">
                            <span className={cn(
                              "text-xs font-medium block truncate",
                              isDone && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                              <span>{project ? project.name : 'Inbox'}</span>
                              {task.due && <span>• {formatDate(task.due)}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            tone={task.priority === 'High' ? 'rose' : task.priority === 'Medium' ? 'amber' : 'gray'}
                            className="text-[10px]"
                          >
                            {task.priority}
                          </Badge>
                          <button
                            onClick={() => handleOpenEditTask(task)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          >
                            <Icon name="edit" size={13} />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="Tidak ada tugas"
                  description="Coba ubah filter atau tambahkan tugas baru."
                />
              )}
            </Surface>
          )}
        </div>
      )}

      {/* ═══════════════ TAB 2: DAFTAR PROYEK ═══════════════ */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {state.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.projects.map((proj) => {
                const projTasks = state.tasks.filter((t) => t.projectId === proj.id);
                const doneCount = projTasks.filter((t) => t.status === 'done').length;
                const projProgress = percent(doneCount, projTasks.length || 1);
                const goal = state.goals.find((g) => g.id === proj.goalId);

                return (
                  <Surface
                    key={proj.id}
                    className="p-5 flex flex-col justify-between space-y-4 hover:shadow-xs transition-all"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon name="folder" size={15} />
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-foreground tracking-tight truncate leading-tight">
                              {proj.name}
                            </h3>
                            <span className="text-[10px] text-muted-foreground block truncate">{proj.area || 'Karir'}</span>
                          </div>
                        </div>

                        <Badge tone={proj.status === 'active' ? 'teal' : proj.status === 'done' ? 'green' : 'amber'}>
                          {proj.status === 'active' ? 'Aktif' : proj.status === 'done' ? 'Selesai' : 'Dijeda'}
                        </Badge>
                      </div>

                      {/* Goal Link */}
                      {goal && (
                        <div className="mt-3 p-2 rounded-lg bg-muted/30 border border-border/60 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Icon name="target" size={12} className="text-primary shrink-0" />
                          <span className="truncate">{goal.title}</span>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                          <span>Progress ({doneCount}/{projTasks.length} tugas)</span>
                          <span className="font-mono tabular-nums">{projProgress}%</span>
                        </div>
                        <ProgressBar value={doneCount} max={projTasks.length || 1} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                      <button
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setActiveTab('tasks');
                        }}
                        className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px]"
                      >
                        Buka Tugas Papan →
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditProject(proj)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          title="Edit Proyek"
                        >
                          <Icon name="edit" size={13} />
                        </button>
                        <button
                          onClick={() => deleteProject(proj.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Hapus Proyek"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </div>
                  </Surface>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Belum ada proyek"
              description="Buat proyek baru untuk mengelompokkan tugas dan sasaran kerja Anda."
              action={{
                label: 'Buat Proyek Baru',
                onClick: () => setIsNewProjectModalOpen(true),
              }}
            />
          )}
        </div>
      )}

      {/* ═══════════════ MODAL: PROYEK BARU ═══════════════ */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold tracking-tight">Buat Proyek Baru</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleProjectSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Proyek</label>
              <input
                type="text"
                required
                placeholder="Contoh: Life OS v2 Redesign, Skripsi, dll"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Area</label>
                <select
                  value={projectArea}
                  onChange={(e) => setProjectArea(e.target.value)}
                  className="glass-select text-xs w-full"
                >
                  <option value="Karir">Karir</option>
                  <option value="Keuangan">Keuangan</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="Pembelajaran">Pembelajaran</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kaitkan ke Goal</label>
                <select
                  value={projectGoalId}
                  onChange={(e) => setProjectGoalId(e.target.value)}
                  className="glass-select text-xs w-full"
                >
                  <option value="">-- Tanpa Goal --</option>
                  {state.goals.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-semibold">
              Simpan Proyek
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MODAL: EDIT PROYEK ═══════════════ */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold tracking-tight">Edit Proyek</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEditProject} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Proyek</label>
              <input
                type="text"
                required
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <select
                  value={editProjectStatus}
                  onChange={(e) => setEditProjectStatus(e.target.value as any)}
                  className="glass-select text-xs w-full"
                >
                  <option value="active">Aktif</option>
                  <option value="paused">Dijeda</option>
                  <option value="done">Selesai</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Area</label>
                <select
                  value={editProjectArea}
                  onChange={(e) => setEditProjectArea(e.target.value)}
                  className="glass-select text-xs w-full"
                >
                  <option value="Karir">Karir</option>
                  <option value="Keuangan">Keuangan</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="Pembelajaran">Pembelajaran</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-semibold">
              Simpan Perubahan
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MODAL: TUGAS BARU ═══════════════ */}
      <Dialog open={isNewTaskModalOpen} onOpenChange={setIsNewTaskModalOpen}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold tracking-tight">Tambah Tugas Baru</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleTaskSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Judul Tugas</label>
              <input
                type="text"
                required
                placeholder="Apa yang perlu diselesaikan?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proyek</label>
                <select
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  className="glass-select text-xs w-full"
                >
                  <option value="">Inbox (Tanpa Proyek)</option>
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jatuh Tempo</label>
                <input
                  type="date"
                  required
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="glass-input text-xs font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prioritas</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as any)}
                  className="glass-select text-xs w-full"
                >
                  {PRIORITY_OPTIONS.slice(0, 3).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Konteks Kerja</label>
                <select
                  value={taskContext}
                  onChange={(e) => setTaskContext(e.target.value)}
                  className="glass-select text-xs w-full"
                >
                  <option value="Deep Work">Deep Work</option>
                  <option value="Shallow">Shallow</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-semibold">
              Buat Tugas
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MODAL: EDIT TUGAS ═══════════════ */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold tracking-tight">Edit Tugas</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEditTask} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Judul Tugas</label>
              <input
                type="text"
                required
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                <select
                  value={editTaskStatus}
                  onChange={(e) => setEditTaskStatus(e.target.value as any)}
                  className="glass-select text-xs w-full"
                >
                  <option value="todo">To Do</option>
                  <option value="doing">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prioritas</label>
                <select
                  value={editTaskPriority}
                  onChange={(e) => setEditTaskPriority(e.target.value as any)}
                  className="glass-select text-xs w-full"
                >
                  {PRIORITY_OPTIONS.slice(0, 3).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proyek</label>
                <select
                  value={editTaskProjectId}
                  onChange={(e) => setEditTaskProjectId(e.target.value)}
                  className="glass-select text-xs w-full"
                >
                  <option value="">Inbox (Tanpa Proyek)</option>
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jatuh Tempo</label>
                <input
                  type="date"
                  value={editTaskDue}
                  onChange={(e) => setEditTaskDue(e.target.value)}
                  className="glass-input text-xs font-mono tabular-nums"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="sm" className="w-full mt-2 font-semibold">
              Simpan Perubahan
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </StaggerGroup>
  );
}
