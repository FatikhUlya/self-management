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
  const { state, addLearningSubject, deleteLearningSubject } = useLifeOS();
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

      {/* Learning Paths Section */}
      <div className="pt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <Icon name="map" size={24} className="text-amber-500" />
            Jalur Pembelajaran
          </h2>
          <button 
            onClick={() => {
              const title = prompt('Masukkan topik belajar baru (contoh: Belajar React):');
              if (title) addLearningSubject(title);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors"
          >
            <Icon name="plus" size={16} />
            Topik Baru
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(!state.learningSubjects || state.learningSubjects.length === 0) && (
            <p className="text-zinc-500 dark:text-zinc-400 col-span-2 text-center py-8">
              Belum ada jalur pembelajaran. Tambahkan topik baru untuk memulai!
            </p>
          )}
          {state.learningSubjects?.map(subject => {
            const modules = state.learningModules?.filter(m => m.subjectId === subject.id) || [];
            const completed = modules.filter(m => m.isCompleted).length;
            const progress = modules.length === 0 ? 0 : Math.round((completed / modules.length) * 100);

            return (
              <Surface 
                key={subject.id}
                className="p-4 cursor-pointer hover:border-amber-500/30 transition-all group"
                onClick={() => router.push(`/learning/paths/${subject.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-200 group-hover:text-amber-500 transition-colors">
                    {subject.title}
                  </h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Hapus topik ini beserta seluruh modulnya?')) {
                        deleteLearningSubject(subject.id);
                      }
                    }}
                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Hapus Topik"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
                {subject.description && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">
                    {subject.description}
                  </p>
                )}
                
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <span>Progres ({completed}/{modules.length})</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      </div>

    </div>
  );
}
