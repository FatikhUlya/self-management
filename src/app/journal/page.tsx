'use client';

import React from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { QuickNavGrid } from '@/components/ui/QuickNavGrid';
import { Icon } from '@/components/ui/Icon';
import { useRouter } from 'next/navigation';
import { StreakFlame } from '@/components/ui/StreakFlame';

export default function ReviewDashboardPage() {
  const { state } = useLifeOS();
  const { t } = useI18n();
  const router = useRouter();

  const today = state.selectedDate;
  
  // Calculate streak based on daily reviews
  const getStreak = () => {
    let streak = 0;
    const addDays = (dateStr: string, days: number): string => {
      const d = new Date(`${dateStr}T00:00:00`);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };

    let cursor = today;
    while (state.reviews.some((r) => r.date === cursor && r.period === 'daily')) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  };

  const currentStreak = getStreak();
  const todayReview = state.reviews.find((r) => r.date === today && r.period === 'daily');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-600 dark:from-violet-300 dark:to-indigo-500 flex items-center gap-2">
            <Icon name="activity" size={28} className="text-indigo-500" />
            Sistem Evaluasi (Reviews)
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Refleksi terstruktur untuk daily, weekly, monthly, dan yearly.
          </p>
        </div>
      </div>

      <QuickNavGrid 
        items={[
          { label: 'Tulis Review Baru', icon: 'edit', iconColor: 'text-indigo-500', href: '/journal/write' },
          { label: 'Riwayat Review', icon: 'list', iconColor: 'text-purple-500', href: '/journal/entries' }
        ]} 
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          icon="activity"
          iconColor="text-amber-500"
          accentColor="amber-500"
          label="Streak Review Harian"
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

        {todayReview ? (
          <>
            <DashboardCard
              icon="star"
              iconColor="text-emerald-500"
              accentColor="emerald-500"
              label="Skor Hari Ini"
              value={`${todayReview.score}/5`}
              detail="Evaluasi kinerja hari ini"
            />
            <DashboardCard
              icon="checkCircle"
              iconColor="text-indigo-500"
              accentColor="indigo-500"
              label="Fokus Besok"
              value={todayReview.focus ? "Telah Diatur" : "Belum Ada"}
              detail={todayReview.focus || "Tentukan fokus Anda!"}
            />
          </>
        ) : (
          <div className="sm:col-span-2 p-6 rounded-2xl bg-white/[0.01] border border-dashed border-life-line flex flex-col items-center justify-center text-center">
            <Icon name="edit" size={32} className="text-life-muted mb-3 opacity-50" />
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider mb-1">
              Belum Menulis Review
            </h3>
            <p className="text-xs text-life-muted mb-4 max-w-xs">
              Luangkan waktu untuk melakukan evaluasi harian, mingguan, atau bulanan.
            </p>
            <button
              onClick={() => router.push('/journal/write')}
              className="px-6 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs uppercase tracking-wider hover:bg-indigo-500/30 transition-all border border-indigo-500/30"
            >
              Mulai Evaluasi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
