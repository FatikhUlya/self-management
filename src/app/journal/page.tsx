'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { QuickNavGrid } from '@/components/ui/QuickNavGrid';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';

import { StreakFlame } from '@/components/ui/StreakFlame';

export default function JournalDashboardPage() {
  const { state } = useLifeOS();
  const { t, locale } = useI18n();
  const router = useRouter();

  const today = state.selectedDate;
  const currentJournal = state.journals.find((j) => j.date === today);

  const addDays = (dateStr: string, days: number): string => {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const getStreak = () => {
    let streak = 0;
    let cursor = today;
    while (state.journals.some((j) => j.date === cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  };

  const currentStreak = getStreak();
  const hasJournalToday = !!currentJournal;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-600 dark:from-violet-300 dark:to-purple-500 flex items-center gap-2">
            <Icon name="journal" size={28} className="text-purple-500" />
            {t('journal_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Refleksi harian, evaluasi mood, energi, dan pencapaian hari ini.
          </p>
        </div>
      </div>

      <QuickNavGrid 
        items={[
          { label: 'Tulis Jurnal Hari Ini', icon: 'edit', iconColor: 'text-purple-500', href: '/journal/write' },
          { label: 'Riwayat & Tren', icon: 'list', iconColor: 'text-indigo-500', href: '/journal/entries' }
        ]} 
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          icon="activity"
          iconColor="text-amber-500"
          accentColor="amber-500"
          label="Streak Menulis Jurnal"
          value={<StreakFlame streakCount={currentStreak} />}
          detail="Terus pertahankan konsistensi!"
        >
          <div className="w-full bg-black/10 dark:bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all" 
              style={{ width: `${Math.min((currentStreak / 30) * 100, 100)}%` }}
            />
          </div>
        </DashboardCard>

        {hasJournalToday ? (
          <>
            <DashboardCard
              icon={`mood${currentJournal?.mood || 3}`}
              iconColor="text-emerald-500"
              accentColor="emerald-500"
              label="Mood Hari Ini"
              value={`${currentJournal?.mood || 3}/5`}
              detail="Evaluasi perasaan Anda hari ini"
            />
            <DashboardCard
              icon="zap"
              iconColor="text-indigo-500"
              accentColor="indigo-500"
              label="Energi Hari Ini"
              value={`${currentJournal?.energy || 3}/5`}
              detail="Tingkat energi harian Anda"
            />
          </>
        ) : (
          <div className="sm:col-span-2 p-6 rounded-2xl bg-white/[0.01] border border-dashed border-life-line flex flex-col items-center justify-center text-center">
            <Icon name="edit" size={32} className="text-life-muted mb-3 opacity-50" />
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider mb-1">
              Belum Menulis Jurnal
            </h3>
            <p className="text-xs text-life-muted mb-4 max-w-xs">
              Luangkan waktu sejenak untuk merefleksikan hari Anda, mencatat hal yang disyukuri, dan menyusun rencana esok hari.
            </p>
            <button
              onClick={() => router.push('/journal/write')}
              className="px-6 py-2 rounded-lg bg-life-purple/20 text-purple-400 font-bold text-xs uppercase tracking-wider hover:bg-life-purple/30 transition-all border border-life-purple/30"
            >
              Mulai Menulis Jurnal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
