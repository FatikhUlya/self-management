'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { MiniChart } from '@/components/ui/MiniChart';
import { formatDate, lastSevenDays, dayName, inLastDays } from '@/lib/utils';
import { LEARNING_STATUSES, LearningStatus } from '@/lib/constants';

export default function LearningPage() {
  const { state, addLearningSession, deleteLearningSession } = useLifeOS();
  const { t, locale } = useI18n();

  // Form states
  const [topic, setTopic] = useState('');
  const [resource, setResource] = useState('');
  const [link, setLink] = useState('');
  const [status, setStatus] = useState<LearningStatus>('learning');
  const [date, setDate] = useState(state.selectedDate);
  const [minutes, setMinutes] = useState<number>(30);
  const [notes, setNotes] = useState('');

  const totalMinutes7Days = state.learning
    .filter((item) => inLastDays(item.date, 7, state.selectedDate))
    .reduce((sum, item) => sum + Number(item.minutes || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    await addLearningSession({
      date,
      topic,
      resource,
      link,
      status,
      minutes,
      notes,
    });

    setTopic('');
    setResource('');
    setLink('');
    setNotes('');
  };

  // Grouping learning logs by status (To Learn, Learning, Completed)
  const renderStatusLane = (laneStatus: LearningStatus, titleKey: string) => {
    const laneItems = state.learning
      .filter((item) => item.status === laneStatus)
      .sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="flex-1 min-w-[260px] bg-white/[0.005] border border-life-line rounded-xl p-4 flex flex-col h-[400px]">
        <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/5">
          <h4 className="text-xs font-black uppercase text-life-muted tracking-wider">{t(titleKey as any)}</h4>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/[0.04] text-life-muted border border-life-line">
            {laneItems.length}
          </span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {laneItems.length > 0 ? (
            laneItems.map((item) => (
              <div 
                key={item.id} 
                className="p-3.5 rounded-lg bg-white/[0.01] border border-life-line hover:border-life-line-strong hover:bg-white/[0.015] transition-all duration-150 space-y-2 relative"
              >
                <div className="min-w-0">
                  <strong className="text-xs font-bold text-life-text block leading-tight tracking-tight">
                    {item.topic}
                  </strong>
                  <p className="text-[10px] text-life-muted mt-1 leading-normal">
                    {item.notes || t('learning_no_notes')}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div className="flex flex-wrap gap-1 items-center">
                    <Badge tone="indigo">{`${item.minutes}m`}</Badge>
                    <span className="text-[9px] text-life-muted font-bold">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <div className="flex space-x-1.5 items-center">
                    {item.link && (
                      <a 
                        href={item.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-life-muted hover:text-life-teal transition-colors p-1"
                        title="Buka resource link"
                      >
                        <Icon name="arrowRight" size={12} />
                      </a>
                    )}
                    <button
                      onClick={() => deleteLearningSession(item.id)}
                      className="text-life-muted hover:text-life-rose transition-colors p-1"
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

  // Learning Chart: minutes studied per day in the last 7 days
  const chartPoints = lastSevenDays(state.selectedDate).map((day) => ({
    label: dayName(day, locale === 'id' ? 'id-ID' : 'en-US'),
    value: state.learning
      .filter((item) => item.date === day)
      .reduce((sum, item) => sum + Number(item.minutes || 0), 0),
  }));

  return (
    <div className="space-y-6">
      {/* Forms & Chart Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Study Session Form */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('learning_session')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {totalMinutes7Days} {t('learning_in_7_days')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="topic" className="text-xs font-bold text-life-muted uppercase">
                  {t('learning_topic')}
                </label>
                <input
                  id="topic"
                  type="text"
                  required
                  placeholder="E.g. Figma components, D5 Render, QGIS..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="resource" className="text-xs font-bold text-life-muted uppercase">
                  {t('learning_resource')}
                </label>
                <input
                  id="resource"
                  type="text"
                  placeholder={t('learning_resource_placeholder')}
                  value={resource}
                  onChange={(e) => setResource(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col space-y-1">
                <label htmlFor="link" className="text-xs font-bold text-life-muted uppercase">
                  {t('learning_link')}
                </label>
                <input
                  id="link"
                  type="url"
                  placeholder={t('learning_link_placeholder')}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="status" className="text-xs font-bold text-life-muted uppercase">
                  {t('learning_status')}
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LearningStatus)}
                  className="glass-select text-xs"
                >
                  <option value="to_learn">{t('learning_to_learn')}</option>
                  <option value="learning">{t('learning_learning')}</option>
                  <option value="completed">{t('learning_completed')}</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="minutes" className="text-xs font-bold text-life-muted uppercase">
                  {t('learning_minutes')}
                </label>
                <input
                  id="minutes"
                  type="number"
                  min="1"
                  required
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label htmlFor="date" className="text-xs font-bold text-life-muted uppercase">
                  {t('learning_date')}
                </label>
                <input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label htmlFor="notes" className="text-xs font-bold text-life-muted uppercase">
                  {t('notes')}
                </label>
                <input
                  id="notes"
                  type="text"
                  placeholder="Catatan ringkas pelajaran..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" icon="plus" className="w-full">
              {t('learning_add_btn')}
            </Button>
          </form>
        </Surface>

        {/* Right: Learning Chart */}
        <Surface className="p-6">
          <div className="border-b border-life-line pb-3 mb-4">
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('learning_chart')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">{t('learning_chart_desc')}</p>
          </div>

          <MiniChart points={chartPoints} colorClass="bg-gradient-to-t from-life-indigo/40 to-life-indigo" />
        </Surface>
      </div>

      {/* Learning Status Kanban Board */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            Daftar Target Belajar & Progres
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            Eksplorasi software arsitektur (D5 Render, Figma, QGIS, dll)
          </p>
        </div>

        <div className="flex flex-wrap gap-4 overflow-x-auto">
          {renderStatusLane('to_learn', 'learning_to_learn')}
          {renderStatusLane('learning', 'learning_learning')}
          {renderStatusLane('completed', 'learning_completed')}
        </div>
      </Surface>
    </div>
  );
}
