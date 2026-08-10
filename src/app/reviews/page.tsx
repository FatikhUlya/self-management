'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { QuickNavGrid } from '@/components/ui/QuickNavGrid';
import { Icon } from '@/components/ui/Icon';
import { MiniChart } from '@/components/ui/MiniChart';
import { AiReviewer } from '@/components/ui/AiReviewer';
import { lastSevenDays, dayName, inLastDays, avg } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ReviewsDashboardPage() {
  const { state } = useLifeOS();
  const { t, locale } = useI18n();

  const totalReviews = state.reviews.length;
  
  const avgScore = totalReviews > 0 
    ? Math.round(avg(state.reviews.map(r => r.score)) * 10) / 10 
    : 0;

  const thisMonthReviews = state.reviews.filter(r => 
    inLastDays(r.date, 30, state.selectedDate)
  ).length;

  const reviewChartPoints = lastSevenDays(state.selectedDate).map((day) => {
    const reviewsOnDay = state.reviews.filter((r) => r.date === day);
    const dayAvg = reviewsOnDay.length > 0 
      ? avg(reviewsOnDay.map(r => r.score)) 
      : 0;
    
    return {
      label: dayName(day, locale === 'id' ? 'id-ID' : 'en-US'),
      value: dayAvg,
    };
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-pink-600 dark:from-fuchsia-300 dark:to-pink-500 flex items-center gap-2">
            <Icon name="review" size={28} className="text-fuchsia-500" />
            {t('reviews_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Tinjau ulang performa kehidupan Anda dan kelola evaluasi berkala.
          </p>
        </div>
      </div>

      <QuickNavGrid 
        items={[
          { label: 'Tulis Evaluasi Baru', icon: 'edit', iconColor: 'text-fuchsia-500', href: '/reviews/write' },
          { label: 'Riwayat Evaluasi', icon: 'clock', iconColor: 'text-indigo-500', href: '/reviews/history' }
        ]} 
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          icon="review"
          iconColor="text-fuchsia-500"
          accentColor="fuchsia-500"
          label="Total Evaluasi"
          value={totalReviews}
          detail="Selama Anda menggunakan aplikasi"
        />
        
        <DashboardCard
          icon="star"
          iconColor="text-amber-500"
          accentColor="amber-500"
          label="Rata-rata Skor"
          value={`${avgScore}/10`}
          detail="Dari semua evaluasi tersimpan"
        >
          <div className="h-12 mt-2">
            <MiniChart points={reviewChartPoints} colorClass="bg-gradient-to-t from-fuchsia-500/40 to-fuchsia-500" />
          </div>
        </DashboardCard>

        <DashboardCard
          icon="calendar"
          iconColor="text-indigo-500"
          accentColor="indigo-500"
          label="Evaluasi 30 Hari"
          value={thisMonthReviews}
          detail="Evaluasi dalam sebulan terakhir"
        />
      </div>

      {/* AI Reviewer Section */}
      <AiReviewer />
      
      {/* Quick Recent Overview */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            Evaluasi Terbaru
          </h3>
        </div>
        <div className="space-y-3">
          {state.reviews.length > 0 ? (
             state.reviews.slice(0, 3).sort((a,b) => b.date.localeCompare(a.date)).map(review => (
               <div key={review.id} className="p-3 bg-white/[0.01] border border-life-line rounded-lg flex justify-between items-center">
                 <div>
                   <strong className="text-xs text-life-text block">{review.date}</strong>
                   <span className="text-[10px] text-life-muted uppercase font-bold">{review.period}</span>
                 </div>
                 <div className="text-xs font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                   {review.score}/10
                 </div>
               </div>
             ))
          ) : (
            <p className="text-xs text-life-muted">Belum ada evaluasi tersimpan.</p>
          )}
        </div>
      </Surface>
    </div>
  );
}
