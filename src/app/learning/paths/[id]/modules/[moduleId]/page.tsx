'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { safeExternalUrl } from '@/lib/utils';

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
 <h1 className="page-title">Modul tidak ditemukan</h1>
 <Link href={`/learning/paths/${id}`} className="btn-secondary">Kembali</Link>
 </div>
 );
 }

 if (!module) return null;

 return (
 <div className="max-w-4xl mx-auto space-y-6">
 <Link href={`/learning/paths/${id}`} className="chip">
 <Icon name="arrowLeft" size={16} />
 {subject?.title || 'Kembali ke Topik'}
 </Link>

 <div className="glass p-5 md:p-10">
 <div className="flex items-start gap-4 mb-8 pb-6 border-b border-border">
 <button 
 onClick={() => toggleLearningModuleCompletion(module.id)}
 aria-pressed={module.isCompleted}
 aria-label={module.isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
 className={`shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors ${
 module.isCompleted 
 ? 'bg-success border-success text-white' 
 : 'border-border hover:border-blue-500'
 }`}
 >
 {module.isCompleted && <Icon name="check" size={20} />}
 </button>
 <h1 className={`page-title ${module.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
 {module.title}
 </h1>
 </div>

 {module.contentMaterial && (
 <div className="mb-10">
 <h3 className="section-title mb-4 flex items-center gap-2">
 <Icon name="fileText" size={20} className="text-blue-500" />
 Materi
 </h3>
 <div 
 className={`prose prose-zinc sm:prose-base dark:prose-invert max-w-none prose-a:text-blue-600 dark:prose-a:text-blue-400 quill-content-override`}
 dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(module.contentMaterial) }}
 />
 </div>
 )}

 {(module.contentVideoLink || module.contentImageUrl) && (
 <div className="pt-6 border-t border-border">
 <h3 className="section-title mb-4 flex items-center gap-2">
 <Icon name="link" size={20} className="text-blue-500" />
 Referensi Ekstra
 </h3>
 <div className="flex flex-wrap gap-3">
 {safeExternalUrl(module.contentVideoLink) && (
 <a 
 href={safeExternalUrl(module.contentVideoLink)} 
 target="_blank" 
 rel="noopener noreferrer"
 className="btn-secondary"
 >
 <Icon name="play" size={18} /> Tonton Video
 </a>
 )}
 {safeExternalUrl(module.contentImageUrl) && (
 <a 
 href={safeExternalUrl(module.contentImageUrl)} 
 target="_blank" 
 rel="noopener noreferrer"
 className="btn-secondary"
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
