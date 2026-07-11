'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { 
  formatDate, 
  monthCalendarDays, 
  monthDays, 
  percent, 
  yearOptions, 
  dateInMonthYear,
  safeUrl,
  priorityWeight
} from '@/lib/utils';
import { WORK_STATUSES, WORK_STATUS_IDS, Priority, PRIORITY_OPTIONS } from '@/lib/constants';

export default function WorkPage() {
  const { state, addWorkApplication, updateWorkApplication, deleteWorkApplication } = useLifeOS();
  const { t, locale } = useI18n();

  // Dialog & selection states
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

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

  // Date selection states (Calendar)
  const currentSelectedDate = new Date(`${state.selectedDate}T00:00:00`);
  const [monthSel, setMonthSel] = useState(currentSelectedDate.getMonth());
  const [yearSel, setYearSel] = useState(currentSelectedDate.getFullYear());

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = Number(e.target.value);
    setMonthSel(m);
    updateSelectedMonthYear(m, yearSel);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = Number(e.target.value);
    setYearSel(y);
    updateSelectedMonthYear(monthSel, y);
  };

  const updateSelectedMonthYear = (m: number, y: number) => {
    const dateStr = dateInMonthYear(state.selectedDate, y, m);
    const input = document.getElementById('selectedDate') as HTMLInputElement;
    if (input) {
      input.value = dateStr;
      const event = new Event('change', { bubbles: true });
      input.dispatchEvent(event);
    }
  };

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

  // Stats calculation
  const total = state.workApplications.length;
  const notApplied = state.workApplications.filter((app) => app.status === 'wishlist').length;
  const appliedCount = state.workApplications.filter((app) => app.status !== 'wishlist').length;
  const activePipeline = state.workApplications.filter((app) => 
    ['applied', 'screening', 'interview'].includes(app.status)
  ).length;

  const calendarDays = monthCalendarDays(state.selectedDate);
  const getDeadlinesForDate = (date: string) => {
    return state.workApplications.filter((app) => app.deadline === date);
  };

  // Sorter for job items (nearest deadline first, then priority)
  const applicationSorter = (a: any, b: any) => {
    const aDate = a.deadline || a.appliedDate || '9999-12-31';
    const bDate = b.deadline || b.appliedDate || '9999-12-31';
    return aDate.localeCompare(bDate) || priorityWeight(b.priority) - priorityWeight(a.priority);
  };

  // Render pipeline column lane
  const renderPipelineLane = (statusId: string, titleKey: string) => {
    const laneApps = state.workApplications
      .filter((app) => app.status === statusId)
      .sort(applicationSorter);

    const statusObj = WORK_STATUSES.find((s) => s.id === statusId)!;

    return (
      <div className="flex-1 min-w-[270px] bg-white/[0.005] border border-life-line rounded-xl p-4 flex flex-col h-[400px]">
        <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/5">
          <h4 className="text-xs font-black uppercase text-life-text tracking-wider">
            {locale === 'id' ? statusObj.label : statusObj.labelEn}
          </h4>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/[0.04] text-life-muted border border-life-line">
            {laneApps.length}
          </span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {laneApps.length > 0 ? (
            laneApps.map((app) => (
              <div 
                key={app.id} 
                className="p-3.5 rounded-lg bg-white/[0.01] border border-life-line hover:border-life-line-strong hover:bg-white/[0.015] transition-all duration-150 space-y-2"
              >
                <div>
                  <strong className="text-xs font-bold text-life-text block leading-tight">{app.role}</strong>
                  <p className="text-[10px] text-life-muted mt-0.5 truncate">🏢 {app.company}</p>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-life-muted">
                  <span>Progress: {statusObj.progress}%</span>
                  <Badge tone={statusObj.tone}>{app.priority}</Badge>
                </div>

                <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-life-teal to-teal-400"
                    style={{ width: `${statusObj.progress}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                  <span className="text-[9px] text-life-muted font-bold">
                    {app.deadline ? `Due: ${formatDate(app.deadline)}` : 'No deadline'}
                  </span>
                  
                  <div className="flex space-x-1 shrink-0">
                    <button
                      onClick={() => setSelectedApplication(app)}
                      className="w-5.5 h-5.5 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center"
                      title={t('edit')}
                    >
                      <Icon name="edit" size={10} />
                    </button>
                    {app.link && (
                      <a
                        href={safeUrl(app.link)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-5.5 h-5.5 rounded bg-white/[0.02] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-text flex items-center justify-center"
                        title="Buka Link Lowongan"
                      >
                        <Icon name="arrowRight" size={10} />
                      </a>
                    )}
                    <button
                      onClick={() => deleteWorkApplication(app.id)}
                      className="w-5.5 h-5.5 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center animate-all"
                      title={t('delete')}
                    >
                      <Icon name="trash" size={10} />
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

  const months = Array.from({ length: 12 }, (_, index) => ({
    value: index,
    label: new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', { month: 'long' }).format(
      new Date(yearSel, index, 1)
    ),
  }));

  const deadlineCalendarDateItems = selectedCalendarDate ? getDeadlinesForDate(selectedCalendarDate) : [];

  return (
    <div className="space-y-6">
      {/* Deadline Calendar */}
      <Surface className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-life-line pb-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('work_deadline_calendar')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {t('work_deadline_desc')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={monthSel}
              onChange={handleMonthChange}
              className="glass-select text-xs py-1.5"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={yearSel}
              onChange={handleYearChange}
              className="glass-select text-xs py-1.5"
            >
              {yearOptions(yearSel).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 max-w-xl mx-auto">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
            <div key={day} className="text-center text-[10px] font-black text-life-muted uppercase py-1">
              {day}
            </div>
          ))}

          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="aspect-square opacity-0" />;
            const deadlines = getDeadlinesForDate(day);
            const isSelected = day === state.selectedDate;
            const hasDeadlines = deadlines.length > 0;
            const tone = hasDeadlines ? 'has-deadline' : 'tone-0';

            return (
              <button
                key={day}
                onClick={() => setSelectedCalendarDate(day)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-between p-1.5 relative border transition-all duration-150 select-none ${tone} ${
                  isSelected ? 'border-amber-500 scale-[1.05] ring-2 ring-life-amber/30 z-10' : ''
                }`}
              >
                <span className="text-[10px] font-bold self-start">{Number(day.slice(-2))}</span>
                {hasDeadlines && (
                  <strong className="text-[10px] font-black bg-life-amber text-white w-4.5 h-4.5 rounded-full flex items-center justify-center self-center shadow">
                    {deadlines.length}
                  </strong>
                )}
              </button>
            );
          })}
        </div>
      </Surface>

      {/* Grid 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 text-life-teal flex items-center justify-center">
            <Icon name="briefcase" size={18} />
          </div>
          <div>
            <span className="text-[10px] text-life-muted uppercase font-bold tracking-wider">{t('work_total')}</span>
            <strong className="block text-xl text-life-text mt-0.5">{total}</strong>
          </div>
        </div>
        <div className="glass p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 text-life-amber flex items-center justify-center">
            <Icon name="plus" size={18} />
          </div>
          <div>
            <span className="text-[10px] text-life-muted uppercase font-bold tracking-wider">{t('work_not_applied')}</span>
            <strong className="block text-xl text-life-text mt-0.5">{notApplied}</strong>
          </div>
        </div>
        <div className="glass p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 text-life-green flex items-center justify-center">
            <Icon name="check" size={18} />
          </div>
          <div>
            <span className="text-[10px] text-life-muted uppercase font-bold tracking-wider">{t('work_applied')}</span>
            <strong className="block text-xl text-life-text mt-0.5">{appliedCount}</strong>
          </div>
        </div>
        <div className="glass p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/5 text-life-indigo flex items-center justify-center">
            <Icon name="target" size={18} />
          </div>
          <div>
            <span className="text-[10px] text-life-muted uppercase font-bold tracking-wider">{t('work_pipeline')}</span>
            <strong className="block text-xl text-life-text mt-0.5">{activePipeline}</strong>
          </div>
        </div>
      </div>

      {/* Forms and Follow Up List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Creation Form */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('work_new')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {t('work_form_desc')}
            </p>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div className="grid grid-cols-3 gap-3">
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="appliedDate" className="text-xs font-bold text-life-muted uppercase">
                  {t('work_applied_date')}
                </label>
                <input
                  id="appliedDate"
                  type="date"
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  className="glass-input text-xs"
                  disabled={status === 'wishlist'}
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="source" className="text-xs font-bold text-life-muted uppercase">
                  {t('work_source')}
                </label>
                <input
                  id="source"
                  type="text"
                  placeholder={t('work_source_placeholder')}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="link" className="text-xs font-bold text-life-muted uppercase">
                {t('work_link')}
              </label>
              <input
                id="link"
                type="text"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="nextAction" className="text-xs font-bold text-life-muted uppercase">
                {t('work_next_action')}
              </label>
              <input
                id="nextAction"
                type="text"
                placeholder={t('work_next_action_placeholder')}
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="notes" className="text-xs font-bold text-life-muted uppercase">
                {t('notes')}
              </label>
              <textarea
                id="notes"
                placeholder="Catatan..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input text-xs h-16"
              />
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full">
              {t('work_add_btn')}
            </Button>
          </form>
        </Surface>

        {/* Action Items List */}
        <Surface className="p-6 flex flex-col">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('work_follow_up_nearest')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Tindakan follow-up yang mendesak
            </p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {state.workApplications.length > 0 ? (
              state.workApplications
                .filter((app) => !['offer', 'rejected'].includes(app.status))
                .slice(0, 6)
                .map((app) => {
                  const statusObj = WORK_STATUSES.find((s) => s.id === app.status)!;
                  return (
                    <article 
                      key={app.id} 
                      className="p-3.5 rounded-lg bg-white/[0.01] border border-life-line flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <strong className="text-sm text-life-text block tracking-tight leading-tight">{app.role}</strong>
                        <p className="text-xs text-life-muted mt-0.5">
                          🏢 {app.company} / Next: {app.nextAction || t('work_no_next_action')}
                        </p>
                        <div className="flex gap-2 pt-1 items-center">
                          <Badge tone={statusObj.tone}>
                            {locale === 'id' ? statusObj.label : statusObj.labelEn}
                          </Badge>
                          {app.deadline && (
                            <span className="text-[10px] text-life-muted font-bold">
                              Deadline: {formatDate(app.deadline)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="w-8 h-8 rounded-lg bg-white/[0.03] border border-life-line hover:bg-life-teal/20 hover:border-life-teal hover:text-life-teal text-life-muted flex items-center justify-center shrink-0 transition-all"
                        title={t('edit')}
                      >
                        <Icon name="edit" size={14} />
                      </button>
                    </article>
                  );
                })
            ) : (
              <EmptyState />
            )}
          </div>
        </Surface>
      </div>

      {/* Applications Pipeline Kanban Board */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('work_pipeline_board')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {t('work_pipeline_desc')}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 overflow-x-auto">
          {WORK_STATUS_IDS.map((statusId) => renderPipelineLane(statusId, statusId as any))}
        </div>
      </Surface>

      {/* Calendar date click detail modal */}
      <Modal
        isOpen={selectedCalendarDate !== null}
        onClose={() => setSelectedCalendarDate(null)}
        title={t('work_selected_date')}
        subtitle={selectedCalendarDate ? formatDate(selectedCalendarDate) : ''}
      >
        <div className="space-y-3">
          {deadlineCalendarDateItems.length > 0 ? (
            deadlineCalendarDateItems.map((app) => {
              const statusObj = WORK_STATUSES.find((s) => s.id === app.status)!;
              return (
                <div 
                  key={app.id} 
                  className="p-3.5 rounded-lg bg-white/[0.01] border border-life-line flex justify-between items-center gap-4"
                >
                  <div>
                    <strong className="text-sm text-life-text block leading-tight">{app.role}</strong>
                    <p className="text-xs text-life-muted mt-0.5">
                      🏢 {app.company} / {app.nextAction || t('work_no_next_action')}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge tone={statusObj.tone}>
                        {locale === 'id' ? statusObj.label : statusObj.labelEn}
                      </Badge>
                      <Badge tone="gray">{app.priority}</Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedApplication(app);
                      setSelectedCalendarDate(null);
                    }}
                    className="w-8 h-8 rounded-lg bg-white/[0.03] border border-life-line hover:bg-life-teal/20 text-life-muted hover:text-life-teal flex items-center justify-center shrink-0 transition-all"
                  >
                    <Icon name="edit" size={14} />
                  </button>
                </div>
              );
            })
          ) : (
            <EmptyState message={t('work_no_deadline')} />
          )}
        </div>
      </Modal>

      {/* Edit Form Modal */}
      {selectedApplication && (
        <Modal
          isOpen={selectedApplication !== null}
          onClose={() => setSelectedApplication(null)}
          title={t('work_edit')}
          subtitle={selectedApplication.company}
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('work_company')}
                </label>
                <input
                  type="text"
                  required
                  value={selectedApplication.company}
                  onChange={(e) => setSelectedApplication({ ...selectedApplication, company: e.target.value })}
                  className="glass-input text-sm"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('work_position')}
                </label>
                <input
                  type="text"
                  required
                  value={selectedApplication.role}
                  onChange={(e) => setSelectedApplication({ ...selectedApplication, role: e.target.value })}
                  className="glass-input text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('status')}
                </label>
                <select
                  value={selectedApplication.status}
                  onChange={(e) => setSelectedApplication({ ...selectedApplication, status: e.target.value })}
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
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('priority')}
                </label>
                <select
                  value={selectedApplication.priority}
                  onChange={(e) => setSelectedApplication({ ...selectedApplication, priority: e.target.value })}
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
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('work_deadline')}
                </label>
                <input
                  type="date"
                  value={selectedApplication.deadline}
                  onChange={(e) => setSelectedApplication({ ...selectedApplication, deadline: e.target.value })}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('work_applied_date')}
                </label>
                <input
                  type="date"
                  value={selectedApplication.appliedDate}
                  onChange={(e) => setSelectedApplication({ ...selectedApplication, appliedDate: e.target.value })}
                  className="glass-input text-xs"
                  disabled={selectedApplication.status === 'wishlist'}
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-life-muted uppercase">
                  {t('work_source')}
                </label>
                <input
                  type="text"
                  value={selectedApplication.source}
                  onChange={(e) => setSelectedApplication({ ...selectedApplication, source: e.target.value })}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">
                {t('work_link')}
              </label>
              <input
                type="text"
                value={selectedApplication.link}
                onChange={(e) => setSelectedApplication({ ...selectedApplication, link: e.target.value })}
                className="glass-input text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">
                {t('work_next_action')}
              </label>
              <input
                type="text"
                value={selectedApplication.nextAction}
                onChange={(e) => setSelectedApplication({ ...selectedApplication, nextAction: e.target.value })}
                className="glass-input text-xs"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-life-muted uppercase">
                {t('notes')}
              </label>
              <textarea
                value={selectedApplication.notes}
                onChange={(e) => setSelectedApplication({ ...selectedApplication, notes: e.target.value })}
                className="glass-input text-xs h-16"
              />
            </div>

            <Button type="submit" variant="primary" icon="check" className="w-full">
              {t('work_save_changes')}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
