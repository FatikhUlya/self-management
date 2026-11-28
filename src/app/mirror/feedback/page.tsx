'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { SELF_AWARENESS_DOMAINS } from '@/lib/constants';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export default function FeedbackManager() {
 const { state, createFeedbackRequest, closeFeedbackRequest } = useLifeOS();
 
 const [isModalOpen, setIsModalOpen] = useState(false);
 
 const [title, setTitle] = useState('');
 const [privacyMode, setPrivacyMode] = useState<'anonymous' | 'required'>('anonymous');
 const [deadline, setDeadline] = useState('');
 const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
 const [loading, setLoading] = useState(false);
 
 const [copiedToken, setCopiedToken] = useState('');

 const toggleDomain = (key: string) => {
 setSelectedDomains(prev => 
 prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
 );
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title.trim()) return alert('Judul wajib diisi');
 if (selectedDomains.length === 0) return alert('Pilih minimal 1 area evaluasi');
 
 setLoading(true);
 try {
 await createFeedbackRequest({
 title,
 privacyMode,
 deadline: deadline || null,
 domains: selectedDomains
 });
 setIsModalOpen(false);
 setTitle('');
 setSelectedDomains([]);
 } catch (err: any) {
 alert('Error: ' + err.message);
 } finally {
 setLoading(false);
 }
 };

 const handleCopy = (token: string) => {
 const url = `${window.location.origin}/f/${token}`;
 navigator.clipboard.writeText(url);
 setCopiedToken(token);
 setTimeout(() => setCopiedToken(''), 2000);
 };

 const activeRequests = state.feedbackRequests.filter(r => r.status === 'open');
 const closedRequests = state.feedbackRequests.filter(r => r.status === 'closed');

 return (
 <div className="space-y-6">
 <div className="page-header">
 <div className="page-header-title">
 <Link href="/mirror" className="icon-btn" aria-label="Kembali"><Icon name="arrowLeft" size={16} /></Link>
 <div>
 <h1 className="page-title">
 Feedback Kolega
 </h1>
 <p className="text-muted-foreground mt-1 text-sm">
 Minta umpan balik 360° dari rekan kerja, mentor, atau teman.
 </p>
 </div>
 </div>
 <Button variant="primary" onClick={() => setIsModalOpen(true)} icon="plus">
 Minta Feedback
 </Button>
 </div>

 <div className="space-y-6">
 {/* Active Requests */}
 <Surface className="p-6">
 <h3 className="text-sm font-medium text-foreground mb-4 border-b border-border pb-2">
 Permintaan Aktif
 </h3>
 
 {activeRequests.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {activeRequests.map(req => {
 const responses = state.feedbackResponses.filter(r => r.requestId === req.id);
 return (
 <div key={req.id} className="bg-muted border border-border rounded-xl p-4 flex flex-col justify-between">
 <div>
 <div className="flex justify-between items-start mb-2">
 <strong className="text-sm text-foreground">{req.title}</strong>
 <Badge tone="teal">Aktif</Badge>
 </div>
 <div className="text-xs text-muted-foreground space-y-1 mb-4">
 <p>Total Responden: {responses.length}</p>
 <p>Privasi: {req.privacyMode === 'anonymous' ? 'Anonim' : 'Terbuka'}</p>
 <p>Deadline: {req.deadline ? formatDate(req.deadline) : 'Tidak ada'}</p>
 </div>
 </div>
 <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
 <Button 
 variant="secondary" 
 size="sm" 
 className="flex-1"
 onClick={() => handleCopy(req.token)}
 icon={copiedToken === req.token ? 'check' : 'copy'}
 >
 {copiedToken === req.token ? 'Disalin' : 'Salin Tautan'}
 </Button>
 <Button 
 variant="secondary" 
 size="sm" 
 className="text-rose-700 dark:text-rose-300 hover:text-rose-300"
 onClick={() => {
 if (confirm('Tutup permintaan feedback ini?')) closeFeedbackRequest(req.id);
 }}
 >
 Tutup
 </Button>
 </div>
 </div>
 )
 })}
 </div>
 ) : (
 <div className="text-center py-6 text-muted-foreground text-sm">
 Tidak ada permintaan feedback yang aktif.
 </div>
 )}
 </Surface>

 {/* Closed Requests */}
 {closedRequests.length > 0 && (
 <Surface className="p-6">
 <h3 className="text-sm font-medium text-foreground mb-4 border-b border-border pb-2">
 Permintaan Selesai
 </h3>
 <div className="space-y-2">
 {closedRequests.map(req => {
 const responses = state.feedbackResponses.filter(r => r.requestId === req.id);
 return (
 <div key={req.id} className="flex justify-between items-center bg-muted border border-border p-3 rounded-lg opacity-60">
 <div>
 <strong className="text-sm text-foreground block">{req.title}</strong>
 <span className="text-xs text-muted-foreground">{responses.length} Responden</span>
 </div>
 <Badge tone="gray">Ditutup</Badge>
 </div>
 )
 })}
 </div>
 </Surface>
 )}
 </div>

 <Modal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 title="Buat Permintaan Feedback"
 subtitle="Buat tautan khusus yang bisa Anda bagikan ke orang lain."
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground ">Judul</label>
 <input 
 type="text" 
 required
 value={title}
 onChange={e => setTitle(e.target.value)}
 placeholder="Mis. Feedback Tengah Tahun 2026"
 className="glass-input" aria-label="Mis. Feedback Tengah Tahun 2026"
/>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground ">Privasi</label>
 <select 
 value={privacyMode}
 onChange={e => setPrivacyMode(e.target.value as any)}
 className="glass-input"
 >
 <option value="anonymous">Anonim (Responden tidak mengisi nama)</option>
 <option value="required">Terbuka (Responden mengisi nama)</option>
 </select>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground ">Deadline (Opsional)</label>
 <input 
 type="date" 
 value={deadline}
 onChange={e => setDeadline(e.target.value)}
 className="glass-input"
 />
 </div>

 <div className="space-y-2 pt-2 border-t border-border">
 <label className="text-xs font-medium text-muted-foreground ">Pilih Area Evaluasi (Pilih 1+)</label>
 <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
 {SELF_AWARENESS_DOMAINS.map(domain => {
 const isSelected = selectedDomains.includes(domain.key);
 return (
 <div 
 key={domain.key}
 onClick={() => toggleDomain(domain.key)}
 className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 text-xs transition-colors ${
 isSelected ? 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300' : 'bg-muted border-border text-muted-foreground hover:border-gray-300 dark:hover:border-gray-600'
 }`}
 >
 <div className={`w-4 h-4 rounded-sm flex items-center justify-center border ${
 isSelected ? 'bg-teal-500 border-primary text-white' : 'border-zinc-600'
 }`}>
 {isSelected && <Icon name="check" size={10} />}
 </div>
 <span className="truncate">{domain.label}</span>
 </div>
 )
 })}
 </div>
 </div>

 <div className="flex justify-end gap-2 pt-4">
 <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
 <Button type="submit" variant="primary" disabled={loading}>
 {loading ? 'Membuat...' : 'Buat Tautan'}
 </Button>
 </div>
 </form>
 </Modal>
 </div>
 );
}
