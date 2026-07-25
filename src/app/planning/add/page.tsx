'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { timeToMinutes, minutesToTime, todayISO } from '@/lib/utils';
import { PRIORITY_OPTIONS, Priority } from '@/lib/constants';
import { useRouter, useSearchParams } from 'next/navigation';

function PlanningAddForm() {
  const { addPlan } = useLifeOS();
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialDate = searchParams.get('date') || todayISO();

  const [formDate, setFormDate] = useState<string>(initialDate);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'task' | 'event'>('task');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addPlan({
      date: formDate,
      title,
      kind,
      startTime,
      endTime,
      priority,
      area,
      notes,
    });

    setTitle('');
    setArea('');
    setNotes('');
    
    // Auto-progress time for convenience if user wants to add multiple
    setStartTime(endTime);
    const startMins = timeToMinutes(endTime);
    setEndTime(minutesToTime(startMins + 60));
    
    // Go back to timeline
    router.push(`/planning/timeline`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/planning/timeline">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="plus" size={24} className="text-pink-500" />
            Tambah Agenda Baru
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Susun agenda kegiatan untuk hari yang dipilih.
          </p>
        </div>
      </div>

      <Surface className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="planDate" className="text-[10px] font-black uppercase tracking-widest text-life-muted">
              Tanggal Agenda
            </label>
            <input
              id="planDate"
              type="date"
              required
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="glass-input text-sm h-11 font-bold"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="planTitle" className="text-[10px] font-black uppercase tracking-widest text-life-muted">
              {t('planning_plan_name')}
            </label>
            <input
              id="planTitle"
              type="text"
              required
              placeholder={t('planning_plan_name_placeholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input text-sm h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="planKind" className="text-[10px] font-black uppercase tracking-widest text-life-muted">
                {t('planning_type')}
              </label>
              <select
                id="planKind"
                value={kind}
                onChange={(e) => setKind(e.target.value as any)}
                className="glass-select text-sm h-11"
              >
                <option value="task">{locale === 'id' ? 'Tugas (Task)' : 'Task'}</option>
                <option value="event">{locale === 'id' ? 'Acara (Event)' : 'Event'}</option>
              </select>
            </div>
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="planPriority" className="text-[10px] font-black uppercase tracking-widest text-life-muted">
                {t('priority')}
              </label>
              <select
                id="planPriority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="glass-select text-sm h-11"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="startTime" className="text-[10px] font-black uppercase tracking-widest text-life-muted">
                {t('planning_start')}
              </label>
              <input
                id="startTime"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="glass-input text-sm h-11 font-mono text-center tracking-wider"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="endTime" className="text-[10px] font-black uppercase tracking-widest text-life-muted">
                {t('planning_end')}
              </label>
              <input
                id="endTime"
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="glass-input text-sm h-11 font-mono text-center tracking-wider"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="planArea" className="text-[10px] font-black uppercase tracking-widest text-life-muted">
              {t('area')} (Opsional)
            </label>
            <input
              id="planArea"
              type="text"
              placeholder={locale === 'id' ? "Contoh: Pekerjaan, Olahraga, Belajar..." : "E.g. Work, Fitness, Study..."}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="glass-input text-sm h-11"
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label htmlFor="planNotes" className="text-[10px] font-black uppercase tracking-widest text-life-muted">
              {t('planning_notes')}
            </label>
            <textarea
              id="planNotes"
              placeholder={locale === 'id' ? "Catatan tambahan atau deskripsi..." : "Additional notes or description..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input text-sm h-24"
            />
          </div>

          <div className="pt-4 border-t border-life-line flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()} className="px-6 h-11">
              Batal
            </Button>
            <Button type="submit" variant="primary" icon="plus" className="px-8 h-11">
              {t('planning_add_btn')}
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  );
}

export default function PlanningAddPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlanningAddForm />
    </Suspense>
  );
}
