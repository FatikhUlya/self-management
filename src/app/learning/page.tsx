'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { QuickNavGrid } from '@/components/ui/QuickNavGrid';
import { Icon } from '@/components/ui/Icon';
import { MiniChart } from '@/components/ui/MiniChart';
import { lastSevenDays, dayName, inLastDays } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function LearningDashboardPage() {
  const { state } = useLifeOS();
  const { t, locale } = useI18n();
  const router = useRouter();

  const totalMinutes7Days = state.learning
    .filter((item) => inLastDays(item.date, 7, state.selectedDate))
    .reduce((sum, item) => sum + Number(item.minutes || 0), 0);

  const totalDictionaryWords = (state.dictionary || []).length;

  const chartPoints = lastSevenDays(state.selectedDate).map((day) => ({
    label: dayName(day, locale === 'id' ? 'id-ID' : 'en-US'),
    value: state.learning
      .filter((item) => item.date === day)
      .reduce((sum, item) => sum + Number(item.minutes || 0), 0),
  }));

  const todayMinutes = state.learning
    .filter((item) => item.date === state.selectedDate)
    .reduce((sum, item) => sum + Number(item.minutes || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600 dark:from-amber-300 dark:to-orange-500 flex items-center gap-2">
            <Icon name="book" size={28} className="text-amber-500" />
            {t('learning_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Pantau progres belajar, sesi materi, dan perluasan kosakata Anda.
          </p>
        </div>
      </div>

      <QuickNavGrid 
        items={[
          { label: 'Sesi Pembelajaran', icon: 'edit', iconColor: 'text-amber-500', href: '/learning/sessions' },
          { label: 'Kamus Pribadi', icon: 'globe', iconColor: 'text-blue-500', href: '/learning/dictionary' },
          { label: 'Jadwal Mingguan', icon: 'calendar', iconColor: 'text-rose-500', href: '/learning/schedule' }
        ]} 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          icon="activity"
          iconColor="text-emerald-500"
          accentColor="emerald-500"
          label="Belajar Hari Ini"
          value={`${todayMinutes} Menit`}
          detail="Terus tingkatkan kapasitas dirimu!"
        />
        
        <DashboardCard
          icon="activity"
          iconColor="text-amber-500"
          accentColor="amber-500"
          label="7 Hari Terakhir"
          value={`${totalMinutes7Days} Menit`}
          detail={t('learning_chart_desc')}
        >
          <div className="h-12 mt-2">
            <MiniChart points={chartPoints} colorClass="bg-gradient-to-t from-amber-500/40 to-amber-500" />
          </div>
        </DashboardCard>

        <DashboardCard
          icon="globe"
          iconColor="text-blue-500"
          accentColor="blue-500"
          label="Kosakata Kamus"
          value={totalDictionaryWords}
          detail="Total kata baru yang dicatat"
        />
      </div>

    </div>
  );
}
