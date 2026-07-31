'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';

export default function LearningModuleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const moduleId = params.moduleId as string;
  const { state, loading, toggleLearningModuleCompletion } = useLifeOS();
  
  const subject = state.learningSubjects?.find(s => s.id === id);
  const module = state.learningModules?.find(m => m.id === moduleId);

  if (!module && !loading) {
    return (
      <div className="text-center py-20 space-y-4">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">Modul tidak ditemukan</h1>
        <Link href={`/learning/paths/${id}`} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg inline-block">Kembali</Link>
      </div>
    );
  }

  if (!module) return null;

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/learning/paths/${id}`} className="text-amber-500 hover:text-amber-600 font-medium flex items-center gap-1">
          <Icon name="arrowLeft" size={16} />
          Kembali ke Topik
        </Link>
      </div>

      <div className="bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-2xl p-6 md:p-10 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-amber-900/5">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-zinc-100 dark:border-zinc-800/50">
          <button 
            onClick={() => toggleLearningModuleCompletion(module.id)}
            className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors ${
              module.isCompleted 
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'border-zinc-300 dark:border-zinc-600 hover:border-amber-500'
            }`}
          >
            {module.isCompleted && <Icon name="check" size={20} />}
          </button>
          <h1 className={`text-3xl font-bold ${module.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-900 dark:text-zinc-50'}`}>
            {module.title}
          </h1>
        </div>

        {module.contentMaterial && (
          <div className="mb-10">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <Icon name="fileText" size={20} className="text-amber-500" />
              Materi
            </h3>
            <div 
              className={`prose prose-zinc sm:prose-base dark:prose-invert max-w-none prose-a:text-amber-600 dark:prose-a:text-amber-400 quill-content-override`}
              dangerouslySetInnerHTML={{ __html: module.contentMaterial }}
            />
          </div>
        )}

        {(module.contentVideoLink || module.contentImageUrl) && (
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
              <Icon name="link" size={20} className="text-amber-500" />
              Referensi Ekstra
            </h3>
            <div className="flex flex-wrap gap-3">
              {module.contentVideoLink && (
                <a 
                  href={module.contentVideoLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 font-medium bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-red-100 dark:border-red-500/20"
                >
                  <Icon name="play" size={18} /> Tonton Video
                </a>
              )}
              {module.contentImageUrl && (
                <a 
                  href={module.contentImageUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 font-medium bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all border border-blue-100 dark:border-blue-500/20"
                >
                  <Icon name="image" size={18} /> Lihat Gambar
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
