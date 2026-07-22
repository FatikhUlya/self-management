'use client';

import React, { useState, useEffect } from 'react';
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
import { isGoogleCalendarConfigured, initGoogleCalendar, restoreGoogleToken, fetchCalendarEvents, signInGoogle } from '@/lib/google-calendar';
import { Modal } from '@/components/ui/Modal';


export default function ProjectsPage() {
  const { 
    state, 
    addProject, 
    updateProject,
    deleteProject, 
    addTask, 
    updateTask,
    updateTaskStatus, 
    deleteTask,
    updateProjectGoal,
    updateTaskGoal
  } = useLifeOS();
  
  const { t } = useI18n();

  // Project form states
  const [projectName, setProjectName] = useLocalStorageState('draft_project_name', '');
  const [projectArea, setProjectArea] = useLocalStorageState('draft_project_area', 'Career');
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

  // New Project & Task Modal states
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Edit Project Modal state
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectArea, setEditProjectArea] = useState('');
  const [editProjectStatus, setEditProjectStatus] = useState<'active' | 'paused' | 'done'>('active');
  const [editProjectGoalId, setEditProjectGoalId] = useState('');

  // Edit Task Modal state
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskProjectId, setEditTaskProjectId] = useState('');
  const [editTaskDue, setEditTaskDue] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<Priority>('Medium');
  const [editTaskGoalId, setEditTaskGoalId] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState<'todo' | 'doing' | 'done'>('todo');

  const handleOpenEditProject = (proj: any) => {
    setEditingProject(proj);
    setEditProjectName(proj.name);
    setEditProjectArea(proj.area || 'Career');
    setEditProjectStatus(proj.status);
    setEditProjectGoalId(proj.goalId || '');
  };

  const handleSaveEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editProjectName.trim()) return;
    await updateProject(editingProject.id, {
      name: editProjectName.trim(),
      area: editProjectArea,
      status: editProjectStatus,
      goalId: editProjectGoalId || ''
    });
    setEditingProject(null);
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
      status: editTaskStatus
    });
    setEditingTask(null);
  };

  const [isGCalConfigured, setIsGCalConfigured] = useState(false);
  const [isGCalConnected, setIsGCalConnected] = useState(false);
  const [gcalSyncing, setGcalSyncing] = useState(false);
  const syncedRef = React.useRef(false);

  useEffect(() => {
    const configured = isGoogleCalendarConfigured();
    setIsGCalConfigured(configured);

    if (!configured) return;
    
    // Also pre-load GCal
    initGoogleCalendar().catch((err) => console.error('[Projects] Pre-load GCal failed:', err));

    if (syncedRef.current) return;
    syncedRef.current = true;

    async function autoSync() {
      try {
        const initSuccess = await initGoogleCalendar();
        if (initSuccess) {
          const tokenActive = restoreGoogleToken();
          if (tokenActive) {
            setIsGCalConnected(true);
            setGcalSyncing(true);

            // Fetch events for next 30 days to sync tasks
            const startD = new Date(state.selectedDate);
            const endD = new Date(startD);
            endD.setDate(endD.getDate() + 30);
            const startIso = startD.toISOString().split('T')[0];
            const endIso = endD.toISOString().split('T')[0];

            const events = await fetchCalendarEvents(startIso, endIso);
            const existingTasks = [...state.tasks];
            
            // 1. Delete local tasks that were deleted from Google Calendar
            const fetchedEventIds = new Set(events.map(e => e.id));
            const localTasksInWindow = existingTasks.filter(t => t.googleEventId && t.due && t.due >= startIso && t.due <= endIso);
            for (const t of localTasksInWindow) {
              if (t.googleEventId && !fetchedEventIds.has(t.googleEventId)) {
                console.log('[Projects] Task deleted externally:', t.title);
                await deleteTask(t.id);
              }
            }

            // 2. Import [Tugas] events from Google Calendar
            for (const gevent of events) {
              if (!gevent.summary?.startsWith('[Tugas]')) continue;
              
              const cleanTitle = gevent.summary.replace('[Tugas]', '').trim();
              const dateIso = gevent.start.dateTime || gevent.start.date || '';
              const due = dateIso ? dateIso.slice(0, 10) : state.selectedDate;
              
              const exists = existingTasks.some(t => t.googleEventId === gevent.id || (t.title === cleanTitle && t.due === due));
              if (!exists) {
                existingTasks.push({
                   id: 'temp-' + gevent.id,
                   title: cleanTitle,
                   due: due,
                   status: 'todo',
                   priority: 'Medium',
                   googleEventId: gevent.id,
                   projectId: '',
                   createdAt: new Date().toISOString(),
                   completedAt: ''
                });
                
                await addTask({
                  title: cleanTitle,
                  due: due,
                  priority: 'Medium',
                  googleEventId: gevent.id,
                  projectId: ''
                });
              }
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setGcalSyncing(false);
      }
    }

    autoSync();
  }, [state.selectedDate, state.tasks, addTask, deleteTask]);

  const handleGoogleSync = async () => {
    setGcalSyncing(true);
    try {
      const isLoaded = typeof window !== 'undefined' && !!window.gapi?.client?.calendar && !!window.google?.accounts?.oauth2;
      if (!isLoaded) {
        const initSuccess = await initGoogleCalendar();
        if (!initSuccess) {
          alert('Gagal inisialisasi Google API client.');
          setGcalSyncing(false);
          return;
        }
      }

      const token = await signInGoogle();
      if (token) {
        setIsGCalConnected(true);
        const startD = new Date(state.selectedDate);
        const endD = new Date(startD);
        endD.setDate(endD.getDate() + 30);
        const startIso = startD.toISOString().split('T')[0];
        const endIso = endD.toISOString().split('T')[0];

        const events = await fetchCalendarEvents(startIso, endIso);
        const existingTasks = [...state.tasks];
        
        const fetchedEventIds = new Set(events.map(e => e.id));
        const localTasksInWindow = existingTasks.filter(t => t.googleEventId && t.due && t.due >= startIso && t.due <= endIso);
        for (const t of localTasksInWindow) {
          if (t.googleEventId && !fetchedEventIds.has(t.googleEventId)) {
            console.log('[Projects] Task deleted externally:', t.title);
            await deleteTask(t.id);
          }
        }

        for (const gevent of events) {
          if (!gevent.summary?.startsWith('[Tugas]')) continue;
          
          const cleanTitle = gevent.summary.replace('[Tugas]', '').trim();
          const dateIso = gevent.start.dateTime || gevent.start.date || '';
          const due = dateIso ? dateIso.slice(0, 10) : state.selectedDate;
          
          const exists = existingTasks.some(t => t.googleEventId === gevent.id || (t.title === cleanTitle && t.due === due));
          if (!exists) {
            existingTasks.push({
               id: 'temp-' + gevent.id,
               title: cleanTitle,
               due: due,
               status: 'todo',
               priority: 'Medium',
               googleEventId: gevent.id,
               projectId: '',
               createdAt: new Date().toISOString(),
               completedAt: ''
            });
            
            await addTask({
              title: cleanTitle,
              due: due,
              priority: 'Medium',
              googleEventId: gevent.id,
              projectId: ''
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error saat sinkronisasi Google Calendar.');
    } finally {
      setGcalSyncing(false);
    }
  };

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
    setTaskProjectId('');
    setTaskDue(state.selectedDate);
    setTaskPriority('Medium');
    setTaskGoalId('');
    setIsNewTaskModalOpen(false);
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
                      <span className="flex items-center gap-1">
                        <Icon name="folder" size={10} className="text-blue-400 mt-0.5 shrink-0" />
                        <span>{project ? project.name : 'Inbox'}</span>
                      </span>
                      {goal && (
                        <span className="text-teal-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Icon name="target" size={10} className="text-teal-400 mt-0.5 shrink-0" />
                          <span>{goal.title}</span>
                        </span>
                      )}
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
                        onClick={() => handleOpenEditTask(task)}
                        className="w-5 h-5 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center"
                        title="Edit Task"
                      >
                        <Icon name="edit" size={10} />
                      </button>
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
                          {g.title}
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
                  <td className="py-3 pl-4 text-right flex items-center justify-end space-x-1.5">
                    <button
                      onClick={() => handleOpenEditTask(task)}
                      className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text inline-flex items-center justify-center transition-all"
                      title="Edit"
                    >
                      <Icon name="edit" size={12} />
                    </button>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-life-text flex items-center gap-2 tracking-tight">
            <Icon name="folder" size={28} className="text-blue-500" />
            {t('projects_title')}
          </h1>
          <p className="text-life-muted mt-1 text-sm font-medium">
            Kelola project, task, board kanban, dan timeline kerja Anda.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon="plus"
            onClick={() => setIsNewProjectModalOpen(true)}
            className="text-xs py-2 px-3"
          >
            {t('projects_add')}
          </Button>
          <Button
            variant="primary"
            icon="plus"
            onClick={() => setIsNewTaskModalOpen(true)}
            className="text-xs py-2 px-3"
          >
            {t('tasks_add')}
          </Button>
        </div>
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

          {/* Kanban / List Toggle & GCal Sync */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {isGCalConfigured && (
              <button
                onClick={handleGoogleSync}
                disabled={gcalSyncing}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/[0.02] hover:bg-life-teal/20 text-life-muted hover:text-life-text border border-life-line rounded-lg transition-all"
                title="Sinkronisasi dengan Google Calendar"
              >
                <Icon name="calendar" size={12} className={gcalSyncing ? 'animate-spin' : ''} />
                <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                  {gcalSyncing ? 'Syncing...' : isGCalConnected ? 'Synced' : 'Sync GCal'}
                </span>
              </button>
            )}

            <div className="flex bg-white/[0.02] border border-life-line rounded-lg p-0.5 shrink-0">
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
                          <option value="">-- Hubungkan Goal --</option>
                          {state.goals.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.title}
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
                        onClick={() => handleOpenEditProject(proj)}
                        className="w-7 h-7 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center transition-all"
                        title="Edit Project"
                      >
                        <Icon name="edit" size={12} />
                      </button>
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

      {/* Modal Edit Project */}
      <Modal
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        title="Edit Proyek"
        subtitle="Perbarui nama, area, status, atau target proyek Anda"
      >
        {editingProject && (
          <form onSubmit={handleSaveEditProject} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="editProjectNameInput" className="text-xs font-bold text-life-muted uppercase">
                {t('projects_name')}
              </label>
              <input
                id="editProjectNameInput"
                type="text"
                required
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                className="glass-input text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label htmlFor="editProjectAreaInput" className="text-xs font-bold text-life-muted uppercase">
                  {t('area')}
                </label>
                <select
                  id="editProjectAreaInput"
                  value={editProjectArea}
                  onChange={(e) => setEditProjectArea(e.target.value)}
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
                <label htmlFor="editProjectStatusInput" className="text-xs font-bold text-life-muted uppercase">
                  {t('status')}
                </label>
                <select
                  id="editProjectStatusInput"
                  value={editProjectStatus}
                  onChange={(e) => setEditProjectStatus(e.target.value as any)}
                  className="glass-select text-xs"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="editProjectGoalInput" className="text-xs font-bold text-life-muted uppercase">
                Hubungkan ke Target (Goal)
              </label>
              <select
                id="editProjectGoalInput"
                value={editProjectGoalId}
                onChange={(e) => setEditProjectGoalId(e.target.value)}
                className="glass-select text-xs"
              >
                <option value="">-- Tanpa Target --</option>
                {state.goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.progress}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <Button type="button" variant="secondary" onClick={() => setEditingProject(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Edit Task */}
      <Modal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title="Edit Tugas"
        subtitle="Perbarui rincian, tenggat waktu, atau prioritas tugas Anda"
      >
        {editingTask && (
          <form onSubmit={handleSaveEditTask} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="editTaskTitleInput" className="text-xs font-bold text-life-muted uppercase">
                {t('tasks_title_label')}
              </label>
              <input
                id="editTaskTitleInput"
                type="text"
                required
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                className="glass-input text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="editTaskProjectInput" className="text-xs font-bold text-life-muted uppercase">
                  {t('tasks_project')}
                </label>
                <select
                  id="editTaskProjectInput"
                  value={editTaskProjectId}
                  onChange={(e) => setEditTaskProjectId(e.target.value)}
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
                <label htmlFor="editTaskStatusInput" className="text-xs font-bold text-life-muted uppercase">
                  {t('status')}
                </label>
                <select
                  id="editTaskStatusInput"
                  value={editTaskStatus}
                  onChange={(e) => setEditTaskStatus(e.target.value as any)}
                  className="glass-select text-xs"
                >
                  <option value="todo">{t('tasks_todo')}</option>
                  <option value="doing">{t('tasks_doing')}</option>
                  <option value="done">{t('tasks_done')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="editTaskDueInput" className="text-xs font-bold text-life-muted uppercase">
                  {t('tasks_due')}
                </label>
                <input
                  id="editTaskDueInput"
                  type="date"
                  value={editTaskDue}
                  onChange={(e) => setEditTaskDue(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="editTaskPriorityInput" className="text-xs font-bold text-life-muted uppercase">
                  {t('priority')}
                </label>
                <select
                  id="editTaskPriorityInput"
                  value={editTaskPriority}
                  onChange={(e) => setEditTaskPriority(e.target.value as Priority)}
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
              <label htmlFor="editTaskGoalInput" className="text-xs font-bold text-life-muted uppercase">
                Hubungkan ke Target (Goal)
              </label>
              <select
                id="editTaskGoalInput"
                value={editTaskGoalId}
                onChange={(e) => setEditTaskGoalId(e.target.value)}
                className="glass-select text-xs"
              >
                <option value="">-- Tanpa Target --</option>
                {state.goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.progress}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <Button type="button" variant="secondary" onClick={() => setEditingTask(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>
      {/* Modal Tambah Project Baru */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title={t('projects_add')}
        subtitle={`${activeProjectsCount} ${t('projects_active')}`}
      >
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="modalProjectName" className="text-xs font-bold text-life-muted uppercase">
              {t('projects_name')}
            </label>
            <input
              id="modalProjectName"
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
              <label htmlFor="modalProjectArea" className="text-xs font-bold text-life-muted uppercase">
                {t('area')}
              </label>
              <select
                id="modalProjectArea"
                value={projectArea || 'Career'}
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
              <label htmlFor="modalProjectStatus" className="text-xs font-bold text-life-muted uppercase">
                {t('status')}
              </label>
              <select
                id="modalProjectStatus"
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
            <label htmlFor="modalProjectGoal" className="text-xs font-bold text-life-muted uppercase">
              Hubungkan ke Target (Goal)
            </label>
            <select
              id="modalProjectGoal"
              value={projectGoalId}
              onChange={(e) => setProjectGoalId(e.target.value)}
              className="glass-select text-xs"
            >
              <option value="">-- Tanpa Target --</option>
              {state.goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.progress}%)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <Button type="button" variant="secondary" onClick={() => setIsNewProjectModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon="plus">
              {t('projects_add_btn')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Task Baru */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title={t('tasks_add')}
        subtitle={`${activeTasksCount} ${t('tasks_open')}`}
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="modalTaskTitle" className="text-xs font-bold text-life-muted uppercase">
              {t('tasks_title_label')}
            </label>
            <input
              id="modalTaskTitle"
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
              <label htmlFor="modalTaskProject" className="text-xs font-bold text-life-muted uppercase">
                {t('tasks_project')}
              </label>
              <select
                id="modalTaskProject"
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
              <label htmlFor="modalTaskDue" className="text-xs font-bold text-life-muted uppercase">
                {t('tasks_due')}
              </label>
              <input
                id="modalTaskDue"
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="modalTaskPriority" className="text-xs font-bold text-life-muted uppercase">
                {t('priority')}
              </label>
              <select
                id="modalTaskPriority"
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
            <label htmlFor="modalTaskGoal" className="text-xs font-bold text-life-muted uppercase">
              Hubungkan ke Target (Goal)
            </label>
            <select
              id="modalTaskGoal"
              value={taskGoalId}
              onChange={(e) => setTaskGoalId(e.target.value)}
              className="glass-select text-xs"
            >
              <option value="">-- Tanpa Target --</option>
              {state.goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.progress}%)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <Button type="button" variant="secondary" onClick={() => setIsNewTaskModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon="plus">
              {t('tasks_add_btn')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
