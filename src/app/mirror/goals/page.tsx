'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { SELF_AWARENESS_DOMAINS, GROWTH_GOAL_STATUSES } from '@/lib/constants';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export default function GrowthGoalsPage() {
 const { state, addGrowthGoal, updateGrowthGoal, addGrowthGoalMilestone, toggleGrowthGoalMilestone } = useLifeOS();
 
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
 
 const [domainKey, setDomainKey] = useState<string>(SELF_AWARENESS_DOMAINS[0].key);
 const [source, setSource] = useState<'self' | 'feedback' | 'mixed'>('self');
 const [currentState, setCurrentState] = useState('');
 const [targetState, setTargetState] = useState('');
 
 const [smartSpecific, setSmartSpecific] = useState('');
 const [smartMeasurable, setSmartMeasurable] = useState('');
 const [smartTimebound, setSmartTimebound] = useState('');
 
 const [loading, setLoading] = useState(false);
 
 const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

 const handleCreateGoal = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 try {
 await addGrowthGoal({
 domainKey,
 source,
 currentState,
 targetState,
 smartSpecific,
 smartMeasurable,
 smartAchievable: '',
 smartRelevant: '',
 smartTimebound,
 status: 'in_progress',
 progress: 0,
 targetDate: smartTimebound || null,
 nextCheckinDate: null
 });
 setIsModalOpen(false);
 setCurrentState('');
 setTargetState('');
 setSmartSpecific('');
 setSmartMeasurable('');
 setSmartTimebound('');
 } catch (err: any) {
 alert('Error: ' + err.message);
 } finally {
 setLoading(false);
 }
 };

 const handleAddMilestone = async (goalId: string) => {
 if (!newMilestoneTitle.trim()) return;
 try {
 const existing = state.growthGoalMilestones.filter(m => m.goalId === goalId);
 await addGrowthGoalMilestone({
 goalId,
 title: newMilestoneTitle,
 isCompleted: false,
 completedAt: null,
 sortOrder: existing.length
 });
 setNewMilestoneTitle('');
 
 // Update progress
 const all = [...existing, { goalId, isCompleted: false } as any];
 const completed = all.filter(m => m.isCompleted).length;
 const progress = Math.round((completed / all.length) * 100);
 await updateGrowthGoal(goalId, { progress });
 } catch (err: any) {
 alert('Error: ' + err.message);
 }
 };

 const handleToggleMilestone = async (milestoneId: string, goalId: string) => {
 try {
 await toggleGrowthGoalMilestone(milestoneId);
 
 // Recalculate progress
 const all = state.growthGoalMilestones.filter(m => m.goalId === goalId);
 // Wait, state hasn't updated yet, so we calculate based on inversion
 const completed = all.filter(m => m.id === milestoneId ? !m.isCompleted : m.isCompleted).length;
 const progress = Math.round((completed / all.length) * 100);
 
 await updateGrowthGoal(goalId, { progress });
 } catch (err: any) {
 alert('Error: ' + err.message);
 }
 };

 const activeGoals = state.growthGoals.filter(g => g.progress < 100 && g.status !== 'stopped');
 const completedGoals = state.growthGoals.filter(g => g.progress >= 100 || g.status === 'achieved');

 return (
 <div className="space-y-6">
 <div className="page-header">
 <div className="page-header-title">
 <Link href="/mirror" className="icon-btn" aria-label="Kembali"><Icon name="arrowLeft" size={16} /></Link>
 <div>
 <h1 className="page-title">
 Growth Goals
 </h1>
 <p className="text-muted-foreground mt-1 text-sm">
 Ubah area untuk dikembangkan menjadi target yang terukur.
 </p>
 </div>
 </div>
 <Button variant="primary" onClick={() => setIsModalOpen(true)} icon="plus">
 Buat Goal Baru
 </Button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="space-y-6">
 <Surface className="p-6">
 <h3 className="text-sm font-medium text-foreground mb-4 border-b border-border pb-2">
 Goals Aktif
 </h3>
 
 {activeGoals.length > 0 ? (
 <div className="space-y-4">
 {activeGoals.map(goal => {
 const domain = SELF_AWARENESS_DOMAINS.find(d => d.key === goal.domainKey);
 const milestones = state.growthGoalMilestones.filter(m => m.goalId === goal.id);
 const isSelected = selectedGoalId === goal.id;
 
 return (
 <div key={goal.id} className="bg-muted border border-border rounded-xl overflow-hidden">
 <div 
 className="p-4 cursor-pointer hover:bg-muted/50/5 transition-colors flex justify-between items-center"
 onClick={() => setSelectedGoalId(isSelected ? null : goal.id)}
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center">
 <Icon name={domain?.icon as any || 'target'} size={20} />
 </div>
 <div>
 <strong className="text-sm text-foreground block">{domain?.label}</strong>
 <p className="text-xs text-muted-foreground line-clamp-1">{goal.targetState}</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="text-right hidden sm:block">
 <span className="text-xs font-medium text-teal-700 dark:text-teal-300">{goal.progress}%</span>
 </div>
 <Icon name={isSelected ? "chevronDown" : "chevronRight"} size={16} className="text-zinc-500" />
 </div>
 </div>
 
 {isSelected && (
 <div className="p-4 border-t border-border bg-black/20 space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
 <span className="text-xs font-medium text-rose-700 dark:text-rose-300 ">Saat Ini</span>
 <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{goal.currentState}</p>
 </div>
 <div className="bg-teal-500/10 p-3 rounded-lg border border-teal-500/20">
 <span className="text-xs font-medium text-teal-700 dark:text-teal-300 ">Target</span>
 <p className="text-xs text-teal-700 dark:text-teal-300 mt-1">{goal.targetState}</p>
 </div>
 </div>
 
 <div className="bg-muted p-3 rounded-lg border border-border">
 <span className="text-xs font-medium text-muted-foreground ">Aksi Spesifik (SMART)</span>
 <p className="text-xs text-zinc-300 mt-1">{goal.smartSpecific}</p>
 </div>

 <div className="space-y-2">
 <h4 className="text-xs font-medium text-muted-foreground ">Milestones ({milestones.filter(m => m.isCompleted).length}/{milestones.length})</h4>
 
 {milestones.map(m => (
 <div key={m.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg border border-border">
 <input 
 type="checkbox"
 checked={m.isCompleted}
 onChange={() => handleToggleMilestone(m.id, goal.id)}
 className="w-4 h-4 rounded border-white/20 bg-black/50 text-teal-500 focus:ring-0 cursor-pointer"
 />
 <span className={`text-xs ${m.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
 {m.title}
 </span>
 </div>
 ))}
 
 <div className="flex gap-2 mt-2">
 <input 
 type="text"
 value={newMilestoneTitle}
 onChange={e => setNewMilestoneTitle(e.target.value)}
 placeholder="Tambah langkah konkret"
 className="glass-input flex-1"
 onKeyDown={e => {
 if (e.key === 'Enter') handleAddMilestone(goal.id);
 }} aria-label="Tambah langkah konkret"
/>
 <Button variant="secondary" size="sm" onClick={() => handleAddMilestone(goal.id)}>Tambah</Button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
 })}
 </div>
 ) : (
 <div className="text-center py-8 text-muted-foreground text-sm">
 Belum ada Growth Goal yang aktif.
 </div>
 )}
 </Surface>
 </div>

 <div>
 <Surface className="p-6">
 <h3 className="text-sm font-medium text-foreground mb-4 border-b border-border pb-2">
 Goals Tercapai
 </h3>
 
 {completedGoals.length > 0 ? (
 <div className="space-y-3">
 {completedGoals.map(goal => {
 const domain = SELF_AWARENESS_DOMAINS.find(d => d.key === goal.domainKey);
 return (
 <div key={goal.id} className="p-3 bg-muted border border-border rounded-lg opacity-60">
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-3">
 <Icon name={domain?.icon as any || 'target'} size={16} className="text-zinc-500" />
 <strong className="text-sm text-foreground">{domain?.label}</strong>
 </div>
 <Badge tone="green">Tercapai</Badge>
 </div>
 <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{goal.targetState}</p>
 </div>
 )
 })}
 </div>
 ) : (
 <div className="text-center py-8 text-zinc-500 text-sm ">
 Belum ada goal yang tercapai.
 </div>
 )}
 </Surface>
 </div>
 </div>

 <Modal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 title="Buat Growth Goal Baru"
 subtitle="Rumuskan target spesifik dari area yang ingin dikembangkan."
 >
 <form onSubmit={handleCreateGoal} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground ">Area Evaluasi</label>
 <select 
 value={domainKey}
 onChange={e => setDomainKey(e.target.value)}
 className="glass-input"
 >
 {SELF_AWARENESS_DOMAINS.map(d => (
 <option key={d.key} value={d.key}>{d.label}</option>
 ))}
 </select>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground ">Sumber Insight</label>
 <select 
 value={source}
 onChange={e => setSource(e.target.value as any)}
 className="glass-input"
 >
 <option value="self">Refleksi Pribadi</option>
 <option value="feedback">Feedback Orang Lain</option>
 <option value="mixed">Campuran / Johari Window</option>
 </select>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-medium text-rose-700 dark:text-rose-300 ">Kondisi Saat Ini</label>
 <textarea 
 required
 value={currentState}
 onChange={e => setCurrentState(e.target.value)}
 placeholder="Mis. Sulit memprioritaskan tugas"
 className="glass-input h-20 resize-none border-red-200 dark:border-red-900" aria-label="Mis. Sulit memprioritaskan tugas"
/>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-medium text-teal-700 dark:text-teal-300 ">Target (Versi Lebih Baik)</label>
 <textarea 
 required
 value={targetState}
 onChange={e => setTargetState(e.target.value)}
 placeholder="Mis. Bisa menyusun jadwal prioritas harian"
 className="glass-input h-20 resize-none border-green-200 dark:border-green-900" aria-label="Mis. Bisa menyusun jadwal prioritas harian"
/>
 </div>
 </div>

 <div className="space-y-2 pt-2 border-t border-border">
 <label className="text-xs font-medium text-indigo-600 dark:text-indigo-300 ">Tindakan Spesifik (SMART)</label>
 <textarea 
 required
 value={smartSpecific}
 onChange={e => setSmartSpecific(e.target.value)}
 placeholder="Apa tindakan spesifik yang akan dilakukan untuk mencapai target tersebut?"
 className="glass-input h-20 resize-none" aria-label="Apa tindakan spesifik yang akan dilakukan untuk mencapai target tersebut?"
/>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground ">Indikator Sukses</label>
 <input 
 type="text" 
 value={smartMeasurable}
 onChange={e => setSmartMeasurable(e.target.value)}
 placeholder="Cara mengukurnya"
 className="glass-input" aria-label="Cara mengukurnya"
/>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground ">Target Waktu (Deadline)</label>
 <input 
 type="date" 
 value={smartTimebound}
 onChange={e => setSmartTimebound(e.target.value)}
 className="glass-input"
 />
 </div>
 </div>

 <div className="flex justify-end gap-2 pt-4">
 <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
 <Button type="submit" variant="primary" disabled={loading}>
 {loading ? 'Menyimpan...' : 'Buat Growth Goal'}
 </Button>
 </div>
 </form>
 </Modal>
 </div>
 );
}
