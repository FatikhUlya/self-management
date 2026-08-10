'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/utils';
import { REVIEW_PERIODS, ReviewPeriod } from '@/lib/constants';

// Helper to render simple markdown without dependencies
const renderMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    if (line.trim() === '') return <br key={i} />;
    
    // Bold text (**text**)
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const renderedLine = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="text-life-text font-black">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (line.startsWith('# ')) {
      return <h1 key={i} className="text-2xl font-bold text-life-text mt-4 mb-2">{renderedLine.slice(1)}</h1>;
    } else if (line.startsWith('## ')) {
      return <h2 key={i} className="text-xl font-bold text-life-text mt-4 mb-2">{renderedLine.slice(1)}</h2>;
    } else if (line.startsWith('### ')) {
      return <h3 key={i} className="text-lg font-bold text-life-text mt-3 mb-1">{renderedLine.slice(1)}</h3>;
    } else if (line.match(/^[0-9]+\. /)) {
      return <li key={i} className="ml-4 list-decimal my-1 text-life-muted">{renderedLine.slice(1)}</li>;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      return <li key={i} className="ml-4 list-disc my-1 text-life-muted">{renderedLine.slice(1)}</li>;
    }
    
    return <p key={i} className="my-2 text-life-muted">{renderedLine}</p>;
  });
};

export default function ReviewsHistoryPage() {
  const { state, deleteReview } = useLifeOS();
  const { t } = useI18n();

  const [activePeriod, setActivePeriod] = useState<ReviewPeriod | 'all'>('all');

  const periodReviews = state.reviews
    .filter((r) => activePeriod === 'all' || r.period === activePeriod)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/reviews">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="review" size={24} className="text-fuchsia-500" />
            Riwayat Evaluasi
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Lihat kembali hasil evaluasi Anda di masa lalu.
          </p>
        </div>
      </div>

      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              {t('reviews_history')}
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              {periodReviews.length} {t('reviews_saved')}
            </p>
          </div>

          <div className="flex bg-white/[0.02] border border-life-line rounded-lg p-0.5 select-none self-start">
            <button
              type="button"
              onClick={() => setActivePeriod('all')}
              className={`text-[10px] font-black uppercase py-1.5 px-3 rounded-md transition-all ${
                activePeriod === 'all'
                  ? 'bg-fuchsia-500 text-white shadow-sm'
                  : 'text-life-muted hover:text-life-text'
              }`}
            >
              Semua
            </button>
            {REVIEW_PERIODS.map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setActivePeriod(period)}
                className={`text-[10px] font-black uppercase py-1.5 px-3 rounded-md transition-all ${
                  activePeriod === period
                    ? 'bg-fuchsia-500 text-white shadow-sm'
                    : 'text-life-muted hover:text-life-text'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {periodReviews.length > 0 ? (
            periodReviews.map((review) => (
              <div 
                key={review.id} 
                className="p-5 rounded-xl bg-white/[0.01] border border-life-line space-y-3 relative hover:bg-white/[0.015] transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-sm text-life-text block">{formatDate(review.date)}</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge tone="teal" className="text-[10px] uppercase">{review.period}</Badge>
                      <Badge tone="amber" className="text-[10px] uppercase">{`Score ${review.score}/10`}</Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose transition-colors"
                    title={t('delete')}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>

                <div className="text-sm space-y-2 font-medium pt-2 text-life-muted">
                  {review.wins && (
                    <div className="flex items-start gap-2 bg-white/[0.02] p-3 rounded-lg">
                      <Icon name="trophy" size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 opacity-50">Pencapaian Utama</span>
                        <span className="text-life-text leading-relaxed">{review.wins}</span>
                      </div>
                    </div>
                  )}
                  {review.focus && (
                    <div className="flex items-start gap-2 bg-white/[0.02] p-3 rounded-lg">
                      <Icon name="target" size={16} className="text-life-teal mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 opacity-50">Fokus Berikutnya</span>
                        <span className="text-life-text leading-relaxed">{review.focus}</span>
                      </div>
                    </div>
                  )}
                  {(review.lessons || review.challenges) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {review.lessons && (
                        <div className="bg-white/[0.02] p-3 rounded-lg">
                          <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-50 text-indigo-400">Pelajaran</span>
                          <span className="text-xs text-life-text">{review.lessons}</span>
                        </div>
                      )}
                      {review.challenges && (
                        <div className="bg-white/[0.02] p-3 rounded-lg">
                          <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-50 text-rose-400">Hambatan</span>
                          <span className="text-xs text-life-text">{review.challenges}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {review.evaluationNotes && (
                    <div className="border-t border-white/5 pt-3 mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 opacity-50">Catatan Evaluasi</span>
                      <p className="italic text-xs leading-relaxed text-life-text">
                        &ldquo;{review.evaluationNotes}&rdquo;
                      </p>
                    </div>
                  )}
                  {review.aiSummary && (
                    <div className="border-t border-life-line border-dashed pt-4 mt-4 relative">
                      <div className="absolute -top-3 right-4 bg-[#111111] px-2 text-life-muted">
                        <Icon name="sparkles" size={16} className="text-fuchsia-500" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-2 opacity-50 text-fuchsia-400">AI Review & Insights</span>
                      <div className="prose prose-invert prose-sm max-w-none prose-p:text-life-muted prose-headings:text-life-text text-xs">
                        {renderMarkdown(review.aiSummary)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      </Surface>
    </div>
  );
}
