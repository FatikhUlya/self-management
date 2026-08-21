'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

export default function ReviewEntriesPage() {
  const { state, deleteReview } = useLifeOS();
  const { t, locale } = useI18n();

  const [viewingReview, setViewingReview] = useState<any | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Yakin ingin menghapus review ini?')) {
      await deleteReview(id);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/journal">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="list" size={24} className="text-indigo-500" />
            Riwayat Evaluasi (Reviews)
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Lihat riwayat review Anda dari waktu ke waktu.
          </p>
        </div>
      </div>

      <Surface className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
          {state.reviews.length > 0 ? (
            state.reviews.map((review) => (
              <div 
                key={review.id} 
                onClick={() => setViewingReview(review)}
                className="p-5 rounded-xl bg-white/[0.01] border border-life-line space-y-3 relative cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all"
              >
                <div className="flex justify-between items-start">
                  <strong className="text-sm font-bold text-life-text">{formatDate(review.date)}</strong>
                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    <Badge tone="indigo" className="flex items-center gap-1.5 px-2 py-0.5">
                      <span className="font-bold uppercase tracking-wider">{review.period}</span>
                    </Badge>
                    <Badge tone="green" className="flex items-center gap-1.5 px-2 py-0.5">
                      <Icon name="star" size={12} className="text-emerald-400" />
                      <span className="font-bold">Score: {review.score}/5</span>
                    </Badge>
                    <button
                      onClick={(e) => handleDelete(review.id, e)}
                      className="text-life-muted hover:text-life-rose transition-colors p-1"
                      title={t('delete')}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-xs space-y-2 font-medium pt-1 text-life-muted">
                  {review.wins && (
                    <p className="flex items-start gap-2">
                      <Icon name="trophy" size={14} className="text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-life-text"><span className="opacity-50">Wins:</span> {review.wins}</span>
                    </p>
                  )}
                  {review.lessons && (
                    <p className="flex items-start gap-2">
                      <Icon name="lightbulb" size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                      <span className="text-life-text"><span className="opacity-50">Lessons:</span> {review.lessons}</span>
                    </p>
                  )}
                  {review.focus && (
                    <p className="border-t border-white/5 pt-2 font-bold text-indigo-400 leading-relaxed line-clamp-1 flex gap-2">
                      <Icon name="target" size={14} className="mt-0.5 shrink-0" /> {review.focus}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState message="Belum ada riwayat review" />
            </div>
          )}
        </div>
      </Surface>

      {/* Modal Detail Review */}
      <Modal
        isOpen={!!viewingReview}
        onClose={() => setViewingReview(null)}
        title={viewingReview ? `Review ${viewingReview.period} — ${formatDate(viewingReview.date)}` : ''}
        subtitle={
          viewingReview 
            ? (
              <div className="flex items-center gap-4 mt-2 select-none">
                <div className="flex items-center gap-2">
                  <Icon name="star" size={16} className="text-emerald-400" />
                  <span className="text-xs text-life-muted font-bold uppercase tracking-wider">Score: {viewingReview.score}/5</span>
                </div>
              </div>
            )
            : ''
        }
      >
        {viewingReview && (
          <div className="space-y-5 text-xs leading-relaxed text-life-text mt-2">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1.5">
                Pencapaian (Wins)
              </h4>
              <p className="flex items-start gap-2 text-life-text font-bold bg-white/[0.02] p-3 rounded-lg">
                <Icon name="trophy" size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>{viewingReview.wins || <span className="italic text-life-muted">Tidak ada data</span>}</span>
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1.5">
                Pelajaran (Lessons)
              </h4>
              <p className="italic text-xs bg-white/[0.01] border border-life-line p-4 rounded-lg leading-relaxed font-medium">
                &ldquo;{viewingReview.lessons}&rdquo;
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1.5">
                Tantangan / Hambatan
              </h4>
              <p className="italic text-xs bg-white/[0.01] border border-life-line p-4 rounded-lg leading-relaxed font-medium text-rose-400">
                &ldquo;{viewingReview.challenges}&rdquo;
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1.5">
                Fokus Berikutnya
              </h4>
              <p className="flex items-start gap-2 text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg">
                <Icon name="target" size={16} className="shrink-0 mt-0.5" />
                <span>{viewingReview.focus || <span className="italic opacity-50">Tidak ada data</span>}</span>
              </p>
            </div>

            {viewingReview.evaluationNotes && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-life-muted tracking-wider border-b border-white/5 pb-1.5">
                  Catatan Tambahan
                </h4>
                <p className="text-life-muted">{viewingReview.evaluationNotes}</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-white/5 mt-4">
              <Button variant="secondary" onClick={() => setViewingReview(null)} className="px-6">
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
