'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { formatDate, safeUrl, priorityWeight } from '@/lib/utils';
import { WORK_STATUSES, Priority, PRIORITY_OPTIONS } from '@/lib/constants';

export default function WorkApplicationsPage() {
  const { state, addWorkApplication, updateWorkApplication, deleteWorkApplication } = useLifeOS();
  const { t, locale } = useI18n();

  // Dialog & selection states
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);

  // Form states (Create)
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<any>('wishlist');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [deadline, setDeadline] = useState(state.selectedDate);
  const [appliedDate, setAppliedDate] = useState('');
  const [source, setSource] = useState('');
  const [link, setLink] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [notes, setNotes] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    await addWorkApplication({
      company,
      role,
      status,
      priority,
      deadline,
      appliedDate: status !== 'wishlist' ? appliedDate || state.selectedDate : '',
      source,
      link,
      nextAction,
      notes
    });

    // Reset
    setCompany('');
    setRole('');
    setStatus('wishlist');
    setPriority('Medium');
    setSource('');
    setLink('');
    setNextAction('');
    setNotes('');
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;

    await updateWorkApplication(selectedApplication);
    setSelectedApplication(null);
  };

  // Sorter for job items (nearest deadline first, then priority)
  const applicationSorter = (a: any, b: any) => {
    const aDate = a.deadline || a.appliedDate || '9999-12-31';
    const bDate = b.deadline || b.appliedDate || '9999-12-31';
    return aDate.localeCompare(bDate) || priorityWeight(b.priority) - priorityWeight(a.priority);
  };

  // Render pipeline column lane
  const renderPipelineLane = (statusId: string) => {
    const laneApps = state.workApplications
      .filter((app) => app.status === statusId)
      .sort(applicationSorter);

    const statusObj = WORK_STATUSES.find((s) => s.id === statusId)!;

    return (
      <div className="flex-1 min-w-[280px] bg-white/[0.005] border border-life-line rounded-xl p-4 flex flex-col h-[500px]">
        <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/5">
          <h4 className="text-xs font-black uppercase text-life-text tracking-wider">
            {locale === 'id' ? statusObj.label : statusObj.labelEn}
          </h4>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/[0.04] text-life-muted border border-life-line">
            {laneApps.length}
          </span>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {laneApps.length > 0 ? (
            laneApps.map((app) => (
              <div 
                key={app.id} 
                className="p-4 rounded-xl bg-white/[0.01] border border-life-line hover:border-life-line-strong hover:bg-white/[0.015] transition-all duration-150 space-y-2.5 relative group"
              >
                <div>
                  <strong className="text-sm font-bold text-life-text block leading-tight">{app.role}</strong>
                  <p className="text-xs font-medium text-life-muted mt-1 truncate flex items-center gap-1.5">
                    <Icon name="briefcase" size={12} className="opacity-70" /> {app.company}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-life-muted pt-1">
                  <span>Progress: {statusObj.progress}%</span>
                  <Badge tone={statusObj.tone} className="text-[9px] uppercase tracking-wider">{app.priority}</Badge>
                </div>

                <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-life-teal to-teal-400 transition-all"
                    style={{ width: `${statusObj.progress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-[10px] text-life-muted font-bold flex items-center gap-1">
                    <Icon name="calendar" size={12} />
                    {app.deadline ? `${formatDate(app.deadline)}` : (locale === 'id' ? 'Tanpa batas waktu' : 'No deadline')}
                  </span>
                  
                  <div className="flex space-x-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setSelectedApplication(app)}
                      className="w-6 h-6 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center transition-colors"
                      title={t('edit')}
                    >
                      <Icon name="edit" size={12} />
                    </button>
                    {app.link && (
                      <a
                        href={safeUrl(app.link)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-6 h-6 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center transition-colors"
                        title="Buka Link Lowongan"
                      >
                        <Icon name="arrowRight" size={12} />
                      </a>
                    )}
                    <button
                      onClick={() => deleteWorkApplication(app.id)}
                      className="w-6 h-6 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-colors"
                      title={t('delete')}
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/work">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="briefcase" size={24} className="text-sky-500" />
            Lamaran Pekerjaan
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Lacak lamaran kerja, kelola status rekrutmen, dan siapkan tahapan wawancara.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Surface className="p-6 lg:col-span-1 h-fit">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('work_new')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {t('work_form_desc')}
            </p>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="flex flex-col space-y-1">
              <label htmlFor="company" className="text-xs font-bold text-life-muted uppercase">
                {t('work_company')}
              </label>
              <input
                id="company"
                type="text"
                required
                placeholder={t('work_company_placeholder')}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="glass-input text-sm"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="role" className="text-xs font-bold text-life-muted uppercase">
                {t('work_position')}
              </label>
              <input
                id="role"
                type="text"
                required
                placeholder={t('work_position_placeholder')}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="glass-input text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="status" className="text-xs font-bold text-life-muted uppercase">
                  {t('status')}
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="glass-select text-xs"
                >
                  {WORK_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {locale === 'id' ? s.label : s.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="priority" className="text-xs font-bold text-life-muted uppercase">
                  {t('priority')}
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
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
              <label htmlFor="deadline" className="text-xs font-bold text-life-muted uppercase">
                {t('work_deadline')}
              </label>
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="link" className="text-xs font-bold text-life-muted uppercase">
                Link Lowongan
              </label>
              <input
                id="link"
                type="url"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full justify-center mt-2">
              {t('work_add_btn')}
            </Button>
          </form>
        </Surface>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="activity" size={16} className="text-life-muted" />
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {locale === 'id' ? 'Pipeline Lamaran' : 'Application Pipeline'}
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {WORK_STATUSES.map((statusObj) => (
              <div key={statusObj.id} className="snap-center">
                {renderPipelineLane(statusObj.id)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!selectedApplication}
        onClose={() => setSelectedApplication(null)}
        title={t('edit')}
      >
        {selectedApplication && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">{t('work_company')}</label>
                <input
                  type="text"
                  required
                  value={selectedApplication.company}
                  onChange={(e) =>
                    setSelectedApplication({ ...selectedApplication, company: e.target.value })
                  }
                  className="glass-input text-sm"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">{t('work_position')}</label>
                <input
                  type="text"
                  required
                  value={selectedApplication.role}
                  onChange={(e) =>
                    setSelectedApplication({ ...selectedApplication, role: e.target.value })
                  }
                  className="glass-input text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">{t('status')}</label>
                <select
                  value={selectedApplication.status}
                  onChange={(e) =>
                    setSelectedApplication({ ...selectedApplication, status: e.target.value })
                  }
                  className="glass-select text-xs"
                >
                  {WORK_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {locale === 'id' ? s.label : s.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">{t('priority')}</label>
                <select
                  value={selectedApplication.priority}
                  onChange={(e) =>
                    setSelectedApplication({ ...selectedApplication, priority: e.target.value })
                  }
                  className="glass-select text-xs"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">{t('work_deadline')}</label>
                <input
                  type="date"
                  value={selectedApplication.deadline || ''}
                  onChange={(e) =>
                    setSelectedApplication({ ...selectedApplication, deadline: e.target.value })
                  }
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">{t('work_next_action')}</label>
              <input
                type="text"
                value={selectedApplication.nextAction || ''}
                onChange={(e) =>
                  setSelectedApplication({ ...selectedApplication, nextAction: e.target.value })
                }
                className="glass-input text-sm"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">{t('notes')}</label>
              <textarea
                value={selectedApplication.notes || ''}
                onChange={(e) =>
                  setSelectedApplication({ ...selectedApplication, notes: e.target.value })
                }
                className="glass-input text-sm h-24"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setSelectedApplication(null)}>
                {t('cancel')}
              </Button>
              <Button type="submit" variant="primary" icon="check">
                {t('save')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
