'use client';

import React, { useState, useEffect } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { QuickNavGrid } from '@/components/ui/QuickNavGrid';
import { Icon } from '@/components/ui/Icon';
import { 
  formatDate, 
  addDays, 
  timeToMinutes, 
  todayISO
} from '@/lib/utils';

export default function PlanningDashboardPage() {
  const { state } = useLifeOS();
  const { t, locale } = useI18n();

  const today = state.selectedDate || todayISO();
  const tomorrow = addDays(today, 1);

  const getPlansCountForDate = (date: string) => {
    return state.nextDayPlans.filter((plan) => plan.date === date).length;
  };

  const getDonePlansCountForDate = (date: string) => {
    return state.nextDayPlans.filter((plan) => plan.date === date && plan.status === 'done').length;
  };

  const getActivePlansCountForDate = (date: string) => {
    return state.nextDayPlans.filter((plan) => plan.date === date && plan.status !== 'done').length;
  };

  const todayPlans = getPlansCountForDate(today);
  const todayDone = getDonePlansCountForDate(today);
  const tomorrowPlans = getPlansCountForDate(tomorrow);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-pink-600 dark:from-rose-300 dark:to-pink-500 flex items-center gap-2">
            <Icon name="calendar" size={28} className="text-pink-500" />
            {t('planning_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Tinjauan agenda harian dan rencana kegiatan esok hari.
          </p>
        </div>
      </div>

      <QuickNavGrid 
        items={[
          { label: 'Timeline & Agenda 24 Jam', icon: 'clock', iconColor: 'text-pink-500', href: '/planning/timeline' },
          { label: 'Tambah Rencana Baru', icon: 'plus', iconColor: 'text-rose-500', href: '/planning/add' }
        ]} 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          icon="checkCircle"
          iconColor="text-emerald-500"
          accentColor="emerald-500"
          label="Selesai Hari Ini"
          value={todayDone}
          detail={`Dari total ${todayPlans} agenda`}
        >
          <div className="w-full bg-black/10 dark:bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all" 
              style={{ width: `${Math.min((todayDone / (todayPlans || 1)) * 100, 100)}%` }}
            />
          </div>
        </DashboardCard>

        <DashboardCard
          icon="activity"
          iconColor="text-pink-500"
          accentColor="pink-500"
          label="Sisa Agenda Hari Ini"
          value={getActivePlansCountForDate(today)}
          detail={formatDate(today, { locale })}
        />

        <DashboardCard
          icon="calendar"
          iconColor="text-indigo-500"
          accentColor="indigo-500"
          label="Agenda Besok"
          value={tomorrowPlans}
          detail={formatDate(tomorrow, { locale })}
        />
      </div>

    </div>
  );
}
