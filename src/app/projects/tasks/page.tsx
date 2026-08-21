'use client';

import React, { useState, useEffect } from 'react';
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
import { formatDate } from '@/lib/utils';
import { PRIORITY_OPTIONS, Priority } from '@/lib/constants';
import { isGoogleCalendarConfigured, initGoogleCalendar, restoreGoogleToken, fetchCalendarEvents, signInGoogle } from '@/lib/google-calendar';
import { Modal } from '@/components/ui/Modal';

export default function ProjectTasksPage() {
  const { 
    state, 
    addTask, 
    updateTask,
    updateTaskStatus, 
    deleteTask,
    updateTaskGoal
  } = useLifeOS();
  
  const { triggerConfetti } = useConfetti();
  
  const { t, locale } = useI18n();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Task form states
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useLocalStorageState('draft_task_title', '');
  const [taskProjectId, setTaskProjectId] = useLocalStorageState('draft_task_projectId', '');
  const [taskDue, setTaskDue] = useLocalStorageState('draft_task_due', state.selectedDate);
  const [taskPriority, setTaskPriority] = useLocalStorageState<Priority>('draft_task_priority', 'Medium');
  const [taskGoalId, setTaskGoalId] = useLocalStorageState('draft_task_goalId', '');
  const [taskDescription, setTaskDescription] = useLocalStorageState('draft_task_desc', '');
  const [taskDoD, setTaskDoD] = useLocalStorageState('draft_task_dod', '');
  const [taskExpectedOutput, setTaskExpectedOutput] = useLocalStorageState('draft_task_output', '');
  const [taskEstimatedMins, setTaskEstimatedMins] = useLocalStorageState('draft_task_mins', '30');
  const [taskEnergy, setTaskEnergy] = useLocalStorageState('draft_task_energy', 'Medium');
  const [taskContext, setTaskContext] = useLocalStorageState('draft_task_context', 'Deep Work');
  const [taskWorkCategory, setTaskWorkCategory] = useLocalStorageState('draft_task_category', 'Feature');

  // Edit Task Modal state
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskProjectId, setEditTaskProjectId] = useState('');
  const [editTaskDue, setEditTaskDue] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState<Priority>('Medium');
  const [editTaskGoalId, setEditTaskGoalId] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState<'todo' | 'doing' | 'done'>('todo');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskDoD, setEditTaskDoD] = useState('');
  const [editTaskExpectedOutput, setEditTaskExpectedOutput] = useState('');
  const [editTaskEstimatedMins, setEditTaskEstimatedMins] = useState('30');
  const [editTaskEnergy, setEditTaskEnergy] = useState<any>('Medium');
  const [editTaskContext, setEditTaskContext] = useState<any>('Deep Work');
  const [editTaskWorkCategory, setEditTaskWorkCategory] = useState<any>('Feature');

  const [isGCalConfigured, setIsGCalConfigured] = useState(false);
  const [isGCalConnected, setIsGCalConnected] = useState(false);
  const [gcalSyncing, setGcalSyncing] = useState(false);
  const syncedRef = React.useRef(false);

  useEffect(() => {
    const configured = isGoogleCalendarConfigured();
    setIsGCalConfigured(configured);

    if (!configured) return;
    
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

  const handleOpenEditTask = (task: any) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskProjectId(task.projectId || '');
    setEditTaskDue(task.due || '');
    setEditTaskPriority(task.priority || 'Medium');
    setEditTaskGoalId(task.goalId || '');
    setEditTaskStatus(task.status);
    setEditTaskDescription(task.description || '');
    setEditTaskDoD(task.definitionOfDone || '');
    setEditTaskExpectedOutput(task.expectedOutput || '');
    setEditTaskEstimatedMins(task.estimatedMinutes?.toString() || '30');
    setEditTaskEnergy(task.energyRequirement || 'Medium');
    setEditTaskContext(task.context || 'Deep Work');
    setEditTaskWorkCategory(task.workCategory || 'Feature');
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
      description: editTaskDescription,
      definitionOfDone: editTaskDoD,
      expectedOutput: editTaskExpectedOutput,
      estimatedMinutes: parseInt(editTaskEstimatedMins) || undefined,
      energyRequirement: editTaskEnergy,
      context: editTaskContext,
      workCategory: editTaskWorkCategory
    });
    setEditingTask(null);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    await addTask({
      title: taskTitle,
      projectId: taskProjectId,
      due: taskDue,
      priority: taskPriority,
      goalId: taskGoalId || undefined,
      description: taskDescription,
      definitionOfDone: taskDoD,
      expectedOutput: taskExpectedOutput,
      estimatedMinutes: parseInt(taskEstimatedMins) || undefined,
      energyRequirement: taskEnergy as any,
      context: taskContext as any,
      workCategory: taskWorkCategory as any
    });

    setTaskTitle('');
    setTaskDescription('');
    setTaskDoD('');
    setTaskExpectedOutput('');
    setTaskEstimatedMins('30');
    setTaskProjectId('');
    setTaskDue(state.selectedDate);
    setTaskPriority('Medium');
    setTaskGoalId('');
    setIsNewTaskModalOpen(false);
  };

  const handleStatusChange = async (id: string, status: 'todo' | 'doing' | 'done') => {
    if (status === 'done') {
      triggerConfetti();
    }
    await updateTaskStatus(id, status);
  };

  const renderBoardColumn = (columnStatus: 'todo' | 'doing' | 'done', title: string) => {
    const columnTasks = state.tasks
      .filter((task) => task.status === columnStatus)
      .sort((a, b) => (a.due || '').localeCompare(b.due || ''));

    return (
      <div className="flex-1 min-w-[280px] bg-white/[0.005] border border-life-line rounded-xl p-4 flex flex-col h-[500px]">
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
                          onClick={() => handleStatusChange(task.id, 'todo')}
                          className="w-5 h-5 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center"
                          title="Move to Todo"
                        >
                          <Icon name="chevronLeft" size={10} />
                        </button>
                      )}
                      {columnStatus === 'todo' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'doing')}
                          className="w-5 h-5 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center"
                          title="Move to Doing"
                        >
                          <Icon name="chevronRight" size={10} />
                        </button>
                      )}
                      {columnStatus === 'doing' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'done')}
                          className="w-5 h-5 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center text-teal-400"
                          title="Complete Task"
                        >
                          <Icon name="check" size={10} />
                        </button>
                      )}
                      {columnStatus === 'done' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'doing')}
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
                      onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
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
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/projects">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="checkSquare" size={24} className="text-cyan-500" />
            Kelola Tugas (Tasks)
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Lihat semua tugas Anda dalam Kanban Board atau List.
          </p>
        </div>
        <Button 
          variant="primary" 
          icon="plus" 
          onClick={() => setIsNewTaskModalOpen(true)}
          className="shrink-0"
        >
          {locale === 'id' ? 'Tugas Baru' : 'New Task'}
        </Button>
      </div>

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

      {/* Modal Add Task */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title={t('tasks_add')}
        subtitle={t('tasks_form_desc')}
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="taskTitleInput" className="text-xs font-bold text-life-muted uppercase">
              {t('tasks_title_label')}
            </label>
            <input
              id="taskTitleInput"
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
              <label htmlFor="taskProjectInput" className="text-xs font-bold text-life-muted uppercase">
                {t('tasks_project')}
              </label>
              <select
                id="taskProjectInput"
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
              <label htmlFor="taskDueInput" className="text-xs font-bold text-life-muted uppercase">
                {t('tasks_due')}
              </label>
              <input
                id="taskDueInput"
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
              <label htmlFor="taskPriorityInput" className="text-xs font-bold text-life-muted uppercase">
                {t('priority')}
              </label>
              <select
                id="taskPriorityInput"
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
              <label htmlFor="taskGoalInput" className="text-xs font-bold text-life-muted uppercase">
                Hubungkan ke Target (Goal)
              </label>
              <select
                id="taskGoalInput"
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
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-life-muted uppercase">Deskripsi</label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="glass-input text-xs resize-none h-16"
              placeholder="Deskripsi tugas..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Definition of Done</label>
              <textarea
                value={taskDoD}
                onChange={(e) => setTaskDoD(e.target.value)}
                className="glass-input text-xs resize-none h-16"
                placeholder="Kapan tugas ini dianggap selesai?"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Expected Output</label>
              <textarea
                value={taskExpectedOutput}
                onChange={(e) => setTaskExpectedOutput(e.target.value)}
                className="glass-input text-xs resize-none h-16"
                placeholder="Apa hasil dari tugas ini?"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Estimasi (Menit)</label>
              <input
                type="number"
                value={taskEstimatedMins}
                onChange={(e) => setTaskEstimatedMins(e.target.value)}
                className="glass-input text-xs"
                placeholder="30"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Energi</label>
              <select value={taskEnergy} onChange={(e) => setTaskEnergy(e.target.value)} className="glass-select text-xs">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Konteks</label>
              <select value={taskContext} onChange={(e) => setTaskContext(e.target.value)} className="glass-select text-xs">
                <option value="Deep Work">Deep Work</option>
                <option value="Shallow Work">Shallow Work</option>
                <option value="Meetings">Meetings</option>
                <option value="Learning">Learning</option>
                <option value="Errands">Errands</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Kategori</label>
              <select value={taskWorkCategory} onChange={(e) => setTaskWorkCategory(e.target.value)} className="glass-select text-xs">
                <option value="Feature">Feature</option>
                <option value="Bugfix">Bugfix</option>
                <option value="Refactor">Refactor</option>
                <option value="Chore">Chore</option>
                <option value="Research">Research</option>
              </select>
            </div>
          </div>

          <Button type="submit" variant="primary" icon="plus" className="w-full">
            {t('tasks_add_btn')}
          </Button>
        </form>
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
                  <option value="todo">Todo</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="editTaskPriorityInput" className="text-xs font-bold text-life-muted uppercase">
                  {t('priority')}
                </label>
                <select
                  id="editTaskPriorityInput"
                  value={editTaskPriority}
                  onChange={(e) => setEditTaskPriority(e.target.value as any)}
                  className="glass-select text-xs"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="editTaskDueInput" className="text-xs font-bold text-life-muted uppercase">
                  {t('tasks_due')}
                </label>
                <input
                  id="editTaskDueInput"
                  type="date"
                  required
                  value={editTaskDue}
                  onChange={(e) => setEditTaskDue(e.target.value)}
                  className="glass-input text-xs"
                />
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

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-life-muted uppercase">Deskripsi</label>
            <textarea
              value={editTaskDescription}
              onChange={(e) => setEditTaskDescription(e.target.value)}
              className="glass-input text-xs resize-none h-16"
              placeholder="Deskripsi tugas..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Definition of Done</label>
              <textarea
                value={editTaskDoD}
                onChange={(e) => setEditTaskDoD(e.target.value)}
                className="glass-input text-xs resize-none h-16"
                placeholder="Kapan tugas ini dianggap selesai?"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Expected Output</label>
              <textarea
                value={editTaskExpectedOutput}
                onChange={(e) => setEditTaskExpectedOutput(e.target.value)}
                className="glass-input text-xs resize-none h-16"
                placeholder="Apa hasil dari tugas ini?"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Estimasi (Menit)</label>
              <input
                type="number"
                value={editTaskEstimatedMins}
                onChange={(e) => setEditTaskEstimatedMins(e.target.value)}
                className="glass-input text-xs"
                placeholder="30"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Energi</label>
              <select value={editTaskEnergy} onChange={(e) => setEditTaskEnergy(e.target.value)} className="glass-select text-xs">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Konteks</label>
              <select value={editTaskContext} onChange={(e) => setEditTaskContext(e.target.value)} className="glass-select text-xs">
                <option value="Deep Work">Deep Work</option>
                <option value="Shallow Work">Shallow Work</option>
                <option value="Meetings">Meetings</option>
                <option value="Learning">Learning</option>
                <option value="Errands">Errands</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">Kategori</label>
              <select value={editTaskWorkCategory} onChange={(e) => setEditTaskWorkCategory(e.target.value)} className="glass-select text-xs">
                <option value="Feature">Feature</option>
                <option value="Bugfix">Bugfix</option>
                <option value="Refactor">Refactor</option>
                <option value="Chore">Chore</option>
                <option value="Research">Research</option>
              </select>
            </div>
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
    </div>
  );
}
