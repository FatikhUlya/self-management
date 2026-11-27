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
import { DateStamp } from '@/components/ui/DateStamp';

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
 <DateStamp />
 <h1 className="text-2xl sm:text-[32px] font-medium leading-[1.15] text-foreground">
 {t('reviews_title')}
 </h1>
 <p className="text-sm leading-[1.6] text-zinc-600 dark:text-zinc-400 mt-1 max-w-prose">
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
 
 
 label="Total Evaluasi"
 value={totalReviews}
 detail="Selama Anda menggunakan aplikasi"
 />
 
 <DashboardCard
 icon="star"
 
 
 label="Rata-rata Skor"
 value={`${avgScore}/10`}
 detail="Dari semua evaluasi tersimpan"
 >
 <div className="h-12 mt-2">
 <MiniChart points={reviewChartPoints} colorClass=" " />
 </div>
 </DashboardCard>

 <DashboardCard
 icon="calendar"
 
 
 label="Evaluasi 30 Hari"
 value={thisMonthReviews}
 detail="Evaluasi dalam sebulan terakhir"
 />
 </div>

 {/* AI Reviewer Section */}
 <AiReviewer />
 
 {/* Quick Recent Overview */}
 <Surface className="p-6">
 <div className="border-b border-border pb-3 mb-4">
 <h3 className="text-sm font-medium text-foreground ">
 Evaluasi Terbaru
 </h3>
 </div>
 <div className="space-y-3">
 {state.reviews.length > 0 ? (
 state.reviews.slice(0, 3).sort((a,b) => b.date.localeCompare(a.date)).map(review => (
 <div key={review.id} className="p-3 bg-muted/20 border border-border rounded-lg flex justify-between items-center">
 <div>
 <strong className="text-xs text-foreground block">{review.date}</strong>
 <span className="text-[11px] text-muted-foreground font-medium">{review.period}</span>
 </div>
 <div className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
 {review.score}/10
 </div>
 </div>
 ))
 ) : (
 <p className="text-xs text-muted-foreground">Belum ada evaluasi tersimpan.</p>
 )}
 </div>
 </Surface>
 </div>
 );
}
