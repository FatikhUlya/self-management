'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Icon } from '@/components/ui/Icon';

export default function LearningSchedulePage() {
  const { state, updateLearningSchedule } = useLifeOS();
  const { locale } = useI18n();

  const [localSchedule, setLocalSchedule] = useState({
    mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: ''
  });
  const scheduleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with global state when it loads
  useEffect(() => {
    if (state.learningSchedule) {
      setLocalSchedule({
        mon: state.learningSchedule.mon || '',
        tue: state.learningSchedule.tue || '',
        wed: state.learningSchedule.wed || '',
        thu: state.learningSchedule.thu || '',
        fri: state.learningSchedule.fri || '',
        sat: state.learningSchedule.sat || '',
        sun: state.learningSchedule.sun || ''
      });
    }
  }, [state.learningSchedule]);

  const handleScheduleChange = (day: string, value: string) => {
    const next = { ...localSchedule, [day]: value };
    setLocalSchedule(next);
    if (scheduleTimeoutRef.current) clearTimeout(scheduleTimeoutRef.current);
    scheduleTimeoutRef.current = setTimeout(() => {
      updateLearningSchedule(next);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/learning">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="clock" size={24} className="text-amber-500" />
            Jadwal Belajar
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Atur rutinitas dan fokus topik pembelajaran Anda dalam satu minggu.
          </p>
        </div>
      </div>

      <Surface className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {[
            { key: 'mon', label: locale === 'id' ? 'Senin' : 'Mon' },
            { key: 'tue', label: locale === 'id' ? 'Selasa' : 'Tue' },
            { key: 'wed', label: locale === 'id' ? 'Rabu' : 'Wed' },
            { key: 'thu', label: locale === 'id' ? 'Kamis' : 'Thu' },
            { key: 'fri', label: locale === 'id' ? 'Jumat' : 'Fri' },
            { key: 'sat', label: locale === 'id' ? 'Sabtu' : 'Sat', isWeekend: true },
            { key: 'sun', label: locale === 'id' ? 'Minggu' : 'Sun', isWeekend: true }
          ].map((day) => (
            <div key={day.key} className={`flex flex-col space-y-2 bg-white/[0.01] p-4 rounded-xl border transition-all ${day.isWeekend ? 'border-amber-500/30 bg-amber-500/5' : 'border-life-line hover:border-life-line-strong'}`}>
              <span className={`text-xs font-black uppercase tracking-wider ${day.isWeekend ? 'text-amber-400' : 'text-life-muted'}`}>
                {day.label}
              </span>
              <textarea
                placeholder={locale === 'id' ? 'Topik/Materi...' : 'Topic/Material...'}
                value={localSchedule[day.key as keyof typeof localSchedule]}
                onChange={(e) => handleScheduleChange(day.key, e.target.value)}
                className="w-full bg-transparent text-sm text-life-text placeholder:text-zinc-600 focus:outline-none resize-none h-32 leading-relaxed"
              />
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
