'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { percent } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

export default function ProjectsManagePage() {
  const { 
    state, 
    addProject, 
    updateProject,
    deleteProject, 
    updateProjectGoal
  } = useLifeOS();
  
  const { t, locale } = useI18n();

  const [projectName, setProjectName] = useLocalStorageState('draft_project_name', '');
  const [projectArea, setProjectArea] = useLocalStorageState('draft_project_area', 'Career');
  const [projectStatus, setProjectStatus] = useLocalStorageState<'active' | 'paused' | 'done'>('draft_project_status', 'active');
  const [projectGoalId, setProjectGoalId] = useLocalStorageState('draft_project_goalId', '');

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectArea, setEditProjectArea] = useState('');
  const [editProjectStatus, setEditProjectStatus] = useState<'active' | 'paused' | 'done'>('active');
  const [editProjectGoalId, setEditProjectGoalId] = useState('');

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/projects">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="briefcase" size={24} className="text-cyan-500" />
            Kelola Proyek
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Tambah, ubah, atau hapus daftar proyek Anda.
          </p>
        </div>
        <Button 
          variant="primary" 
          icon="plus" 
          onClick={() => setIsNewProjectModalOpen(true)}
          className="shrink-0"
        >
          {locale === 'id' ? 'Proyek Baru' : 'New Project'}
        </Button>
      </div>

      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('projects_list')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {state.projects.length} {locale === 'id' ? 'Proyek Terdaftar' : 'Projects Tracked'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
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

      {/* Modal New Project */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title={t('projects_add')}
        subtitle={t('projects_form_desc')}
      >
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="projectNameInput" className="text-xs font-bold text-life-muted uppercase">
              {t('projects_name')}
            </label>
            <input
              id="projectNameInput"
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
              <label htmlFor="projectAreaInput" className="text-xs font-bold text-life-muted uppercase">
                {t('area')}
              </label>
              <select
                id="projectAreaInput"
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
              <label htmlFor="projectStatusInput" className="text-xs font-bold text-life-muted uppercase">
                {t('status')}
              </label>
              <select
                id="projectStatusInput"
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
            <label htmlFor="projectGoalInput" className="text-xs font-bold text-life-muted uppercase">
              Hubungkan ke Target (Goal)
            </label>
            <select
              id="projectGoalInput"
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

          <Button type="submit" variant="primary" icon="plus" className="w-full">
            {t('projects_add_btn')}
          </Button>
        </form>
      </Modal>

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
    </div>
  );
}
