'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { formatDate } from '@/lib/utils';
import { PRIORITY_OPTIONS, Priority, LIFE_AREAS } from '@/lib/constants';

export default function CapturePage() {
 const { state, addIdea, archiveIdea, deleteIdea, convertIdeaToTask, convertIdeaToProject } = useLifeOS();
 const { t } = useI18n();

 // Form states
 const [title, setTitle] = useState('');
 const [area, setArea] = useState<string>(LIFE_AREAS[1]);
 const [priority, setPriority] = useState<Priority>('Medium');
 const [notes, setNotes] = useState('');

 const activeIdeas = state.ideas.filter((idea) => idea.status !== 'archived');
 const archivedIdeas = state.ideas.filter((idea) => idea.status === 'archived');

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title.trim()) return;

 await addIdea({ title, area, priority, notes });
 setTitle('');
 setArea(LIFE_AREAS[1]);
 setPriority('Medium');
 setNotes('');
 };

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-600 dark:from-indigo-300 dark:to-blue-500 flex items-center gap-2">
 <Icon name="lightbulb" size={28} className="text-indigo-500" />
 {t('capture_title')}
 </h1>
 <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
 {t('capture_idea_desc')}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Left: Input Form */}
 <Surface className="p-6">
 <div className="border-b border-border pb-3 mb-4">
 <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
 {t('capture_inbox')}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 {activeIdeas.length} {t('capture_active_ideas')}
 </p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="relative">
 <input
 id="title"
 type="text"
 required
 placeholder="Ketik ide / pikiran di sini lalu tekan Enter..."
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 className="w-full bg-white/5 dark:bg-black/20 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder-life-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all pr-12"
 />
 <button 
 type="submit" 
 className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-md transition-colors"
 title="Simpan Ide"
 >
 <Icon name="plus" size={18} />
 </button>
 </div>

 <details className="group">
 <summary className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-center gap-1 select-none">
 <Icon name="chevronDown" size={14} className="group-open:rotate-180 transition-transform" />
 Detail Tambahan (Opsional)
 </summary>
 <div className="mt-3 pt-3 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2">
 <div className="grid grid-cols-2 gap-4">
 <div className="flex flex-col space-y-1">
 <label htmlFor="area" className="text-xs font-bold text-muted-foreground uppercase">
 {t('area')}
 </label>
 <select
 id="area"
 value={area}
 onChange={(e) => setArea(e.target.value)}
 className="glass-select text-xs"
 >
 {LIFE_AREAS.map((a) => (
 <option key={a} value={a}>{a}</option>
 ))}
 </select>
 </div>

 <div className="flex flex-col space-y-1">
 <label htmlFor="priority" className="text-xs font-bold text-muted-foreground uppercase">
 {t('priority')}
 </label>
 <select
 id="priority"
 value={priority}
 onChange={(e) => setPriority(e.target.value as Priority)}
 className="glass-select text-xs"
 >
 {PRIORITY_OPTIONS.map((opt) => (
 <option key={opt} value={opt}>
 {opt}
 </option>
 ))}
 </select>
 </div>
 </div>

 <div className="flex flex-col space-y-1">
 <label htmlFor="notes" className="text-xs font-bold text-muted-foreground uppercase">
 {t('notes')}
 </label>
 <textarea
 id="notes"
 placeholder={t('capture_notes_placeholder')}
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="glass-input text-xs h-20"
 />
 </div>
 </div>
 </details>
 </form>
 </Surface>

 {/* Right: Active Ideas List */}
 <Surface className="p-6 flex flex-col">
 <div className="border-b border-border pb-3 mb-4">
 <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
 {t('capture_idea_list')}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 {t('capture_idea_desc')}
 </p>
 </div>

 <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-1">
 {activeIdeas.length > 0 ? (
 activeIdeas.map((idea) => (
 <article 
 key={idea.id} 
 className="p-3.5 rounded-lg bg-muted/20 border border-border hover:border-border-strong hover:bg-muted/50/[0.02] transition-all duration-150"
 >
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0 space-y-1 flex-1">
 <strong className="text-sm text-foreground block tracking-tight leading-tight">{idea.title}</strong>
 <p className="text-xs text-muted-foreground">
 {idea.notes || t('capture_no_notes')}
 </p>
 <div className="flex flex-wrap gap-2 pt-1">
 <Badge tone="teal">{idea.area || 'Inbox'}</Badge>
 <Badge tone={idea.priority === 'High' ? 'rose' : idea.priority === 'Medium' ? 'amber' : 'gray'}>
 {idea.priority}
 </Badge>
 <span className="text-[10px] text-muted-foreground font-bold self-center">
 {formatDate(idea.createdAt?.slice(0, 10))}
 </span>
 </div>
 </div>

 <div className="flex items-center space-x-1.5 shrink-0">
 <button
 onClick={() => archiveIdea(idea.id)}
 className="w-8 h-8 rounded-lg bg-muted/30 border border-border hover:bg-primary/20 hover:border-primary/25 hover:text-primary text-muted-foreground flex items-center justify-center transition-all"
 title={t('capture_archive')}
 >
 <Icon name="check" size={14} />
 </button>
 <button
 onClick={() => deleteIdea(idea.id)}
 className="w-8 h-8 rounded-lg bg-muted/30 border border-border hover:bg-destructive/10 hover:border-destructive/25 hover:text-destructive text-muted-foreground flex items-center justify-center transition-all"
 title={t('delete')}
 >
 <Icon name="trash" size={14} />
 </button>
 </div>
 </div>

 {/* ─── Convert-to-Action Pipeline ─── */}
 <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
 <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-auto">Konversi →</span>
 <button
 onClick={() => convertIdeaToTask(idea.id)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
 >
 <Icon name="checkSquare" size={12} />
 Task
 </button>
 <button
 onClick={() => convertIdeaToProject(idea.id)}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all"
 >
 <Icon name="folder" size={12} />
 Project
 </button>
 </div>
 </article>
 ))
 ) : (
 <EmptyState />
 )}
 </div>
 </Surface>
 </div>

 {/* Archive Section */}
 <Surface className="p-6">
 <div className="border-b border-border pb-3 mb-4">
 <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
 {t('capture_archive')}
 </h3>
 <p className="text-xs text-muted-foreground mt-0.5">
 {archivedIdeas.length} {t('capture_processed')}
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
 {archivedIdeas.length > 0 ? (
 archivedIdeas.map((idea) => (
 <div 
 key={idea.id} 
 className="p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between gap-4"
 >
 <div className="min-w-0">
 <strong className="text-xs text-muted-foreground line-through block truncate">{idea.title}</strong>
 <p className="text-[10px] text-muted-foreground truncate mt-0.5">{idea.area || 'Inbox'}</p>
 </div>
 <div className="flex space-x-1.5 shrink-0">
 <button
 onClick={() => archiveIdea(idea.id)}
 className="w-7 h-7 rounded-md bg-muted/30 border border-border hover:bg-primary/20 text-muted-foreground flex items-center justify-center transition-all"
 title="Aktifkan kembali"
 >
 <Icon name="edit" size={12} />
 </button>
 <button
 onClick={() => deleteIdea(idea.id)}
 className="w-7 h-7 rounded-md bg-muted/30 border border-border hover:bg-destructive/10 text-muted-foreground flex items-center justify-center transition-all"
 title={t('delete')}
 >
 <Icon name="trash" size={12} />
 </button>
 </div>
 </div>
 ))
 ) : (
 <div className="col-span-full">
 <EmptyState />
 </div>
 )}
 </div>
 </Surface>
 </div>
 );
}
