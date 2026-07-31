'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    ['link', 'image'],
    ['clean']
  ],
};

export default function LearningPathDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { state, loading, updateLearningSubject, addLearningModule, updateLearningModule, deleteLearningModule, toggleLearningModuleCompletion } = useLifeOS();
  
  const subject = state.learningSubjects?.find(s => s.id === id);
  const modules = state.learningModules?.filter(m => m.subjectId === id).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)) || [];

  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editSubjectTitle, setEditSubjectTitle] = useState('');
  const [editSubjectDesc, setEditSubjectDesc] = useState('');

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleData, setEditModuleData] = useState<any>({});
  
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleData, setNewModuleData] = useState<any>({ title: '', contentMaterial: '', contentImageUrl: '', contentVideoLink: '' });

  useEffect(() => {
    if (subject) {
      setEditSubjectTitle(subject.title);
      setEditSubjectDesc(subject.description || '');
    }
  }, [subject]);

  if (!subject && !loading) {
    return (
      <div className="text-center py-20 space-y-4">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">Topik tidak ditemukan</h1>
        <Button onClick={() => router.push('/learning')}>Kembali</Button>
      </div>
    );
  }

  const handleSaveSubject = async () => {
    if (!editSubjectTitle.trim()) return;
    await updateLearningSubject(id, { title: editSubjectTitle, description: editSubjectDesc });
    setIsEditingSubject(false);
  };

  const handleAddModule = async () => {
    if (!newModuleData.title.trim()) return;
    await addLearningModule(id, {
      title: newModuleData.title,
      contentMaterial: newModuleData.contentMaterial,
      contentImageUrl: newModuleData.contentImageUrl,
      contentVideoLink: newModuleData.contentVideoLink,
      isCompleted: false,
      orderIndex: modules.length
    });
    setNewModuleData({ title: '', contentMaterial: '', contentImageUrl: '', contentVideoLink: '' });
    setIsAddingModule(false);
  };

  const handleSaveModule = async () => {
    if (!editingModuleId || !editModuleData.title?.trim()) return;
    await updateLearningModule(editingModuleId, {
      title: editModuleData.title,
      contentMaterial: editModuleData.contentMaterial,
      contentImageUrl: editModuleData.contentImageUrl,
      contentVideoLink: editModuleData.contentVideoLink
    });
    setEditingModuleId(null);
  };

  const startEditModule = (m: any) => {
    setEditingModuleId(m.id);
    setEditModuleData(m);
  };

  const completed = modules.filter(m => m.isCompleted).length;
  const progress = modules.length === 0 ? 0 : Math.round((completed / modules.length) * 100);

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/learning" className="text-amber-500 hover:text-amber-600 font-medium flex items-center gap-1">
          <Icon name="arrowLeft" size={16} />
          Kembali
        </Link>
      </div>

      <Surface className="p-6">
        {isEditingSubject ? (
          <div className="space-y-4">
            <input 
              type="text" 
              value={editSubjectTitle} 
              onChange={e => setEditSubjectTitle(e.target.value)}
              className="w-full text-2xl font-bold bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100"
              placeholder="Judul Topik"
            />
            <textarea 
              value={editSubjectDesc}
              onChange={e => setEditSubjectDesc(e.target.value)}
              className="w-full h-24 bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100 resize-none"
              placeholder="Deskripsi Singkat"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveSubject} className="bg-amber-500 text-white hover:bg-amber-600">Simpan</Button>
              <Button variant="secondary" onClick={() => setIsEditingSubject(false)}>Batal</Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">{subject?.title}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-2">{subject?.description || 'Belum ada deskripsi.'}</p>
            </div>
            <button 
              onClick={() => setIsEditingSubject(true)}
              className="p-2 text-zinc-400 hover:text-amber-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg transition-colors"
            >
              <Icon name="edit" size={18} />
            </button>
          </div>
        )}

        <div className="mt-6">
          <div className="flex justify-between text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            <span>Progres Topik ({completed}/{modules.length} Selesai)</span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Surface>

      <div className="flex items-center justify-between mt-8 mb-4">
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <Icon name="list" size={24} className="text-amber-500" />
          Modul & Aksi
        </h2>
        <Button 
          onClick={() => setIsAddingModule(true)} 
          variant="primary" 
          icon="plus"
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          Tambah Modul
        </Button>
      </div>

      {isAddingModule && (
        <Surface className="p-4 border-l-4 border-l-amber-500 mb-6">
          <h3 className="text-lg font-bold mb-4">Tambah Modul Baru</h3>
          <div className="space-y-4">
            <input 
              type="text" 
              value={newModuleData.title} 
              onChange={e => setNewModuleData({...newModuleData, title: e.target.value})}
              className="w-full font-bold bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100"
              placeholder="Judul Modul"
            />
            <div className="bg-white/50 dark:bg-black/20 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700/50">
              <ReactQuill 
                theme="snow" 
                modules={quillModules}
                value={newModuleData.contentMaterial} 
                onChange={(value: string) => setNewModuleData({...newModuleData, contentMaterial: value})}
                placeholder="✨ Ketik atau paste materi dari Google Docs di sini..."
                className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900"
              />
            </div>
            <input 
              type="url" 
              value={newModuleData.contentVideoLink} 
              onChange={e => setNewModuleData({...newModuleData, contentVideoLink: e.target.value})}
              className="w-full bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100"
              placeholder="Link Video (Opsional)"
            />
            <input 
              type="url" 
              value={newModuleData.contentImageUrl} 
              onChange={e => setNewModuleData({...newModuleData, contentImageUrl: e.target.value})}
              className="w-full bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-100"
              placeholder="Link Gambar (Opsional)"
            />
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddModule} className="bg-amber-500 text-white hover:bg-amber-600">Simpan Modul</Button>
              <Button variant="secondary" onClick={() => setIsAddingModule(false)}>Batal</Button>
            </div>
          </div>
        </Surface>
      )}

      {modules.length === 0 && !isAddingModule ? (
        <div className="text-center py-12 bg-white/30 dark:bg-black/10 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <Icon name="book" size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">Belum ada modul untuk topik ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((module) => (
            <Surface 
              key={module.id} 
              className={`p-5 transition-all ${module.isCompleted ? 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}
            >
              {editingModuleId === module.id ? (
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={editModuleData.title} 
                    onChange={e => setEditModuleData({...editModuleData, title: e.target.value})}
                    className="w-full font-bold bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-4 py-2"
                  />
                  <div className="bg-white/50 dark:bg-black/20 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700/50">
                    <ReactQuill 
                      theme="snow" 
                      modules={quillModules}
                      value={editModuleData.contentMaterial} 
                      onChange={(value: string) => setEditModuleData({...editModuleData, contentMaterial: value})}
                      className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900"
                    />
                  </div>
                  <input 
                    type="url" 
                    value={editModuleData.contentVideoLink} 
                    onChange={e => setEditModuleData({...editModuleData, contentVideoLink: e.target.value})}
                    className="w-full bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-4 py-2"
                    placeholder="Link Video"
                  />
                  <input 
                    type="url" 
                    value={editModuleData.contentImageUrl} 
                    onChange={e => setEditModuleData({...editModuleData, contentImageUrl: e.target.value})}
                    className="w-full bg-white/50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-4 py-2"
                    placeholder="Link Gambar"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveModule} className="bg-amber-500 text-white">Simpan</Button>
                    <Button variant="secondary" onClick={() => setEditingModuleId(null)}>Batal</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <button 
                        onClick={() => toggleLearningModuleCompletion(module.id)}
                        className={`mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                          module.isCompleted 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'border-zinc-300 dark:border-zinc-600 hover:border-amber-500'
                        }`}
                      >
                        {module.isCompleted && <Icon name="check" size={14} />}
                      </button>
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${module.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-800 dark:text-zinc-100'}`}>
                          {module.title}
                        </h3>
                        {module.contentMaterial && (
                          <div 
                            className={`mt-3 prose prose-sm sm:prose-base dark:prose-invert max-w-none ${module.isCompleted ? 'opacity-60' : ''}`}
                            dangerouslySetInnerHTML={{ __html: module.contentMaterial }}
                          />
                        )}
                        
                        {(module.contentVideoLink || module.contentImageUrl) && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {module.contentVideoLink && (
                              <a 
                                href={module.contentVideoLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                              >
                                <Icon name="play" size={12} /> Nonton Video
                              </a>
                            )}
                            {module.contentImageUrl && (
                              <a 
                                href={module.contentImageUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                              >
                                <Icon name="image" size={12} /> Lihat Gambar
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button 
                        onClick={() => startEditModule(module)}
                        className="p-1.5 text-zinc-400 hover:text-amber-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-md transition-colors"
                        title="Edit Modul"
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Hapus modul ini?')) deleteLearningModule(module.id);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-500 bg-zinc-50 dark:bg-zinc-800/50 rounded-md transition-colors"
                        title="Hapus Modul"
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
