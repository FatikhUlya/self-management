'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { SELF_AWARENESS_DOMAINS } from '@/lib/constants';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

type FeedbackRequest = {
 id: string;
 title: string;
 token: string;
 privacy_mode: 'anonymous' | 'required';
 status: 'open' | 'closed';
 domains: string[];
};

export default function PublicFeedbackPage() {
 const { token } = useParams() as { token: string };
 const { submitPublicFeedback } = useLifeOS();
 
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [request, setRequest] = useState<FeedbackRequest | null>(null);
 
 const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro');
 const [respondentName, setRespondentName] = useState('');
 
 const [domainResponses, setDomainResponses] = useState<Record<string, { rating: number; strength: string; growth: string }>>({});

 useEffect(() => {
 async function fetchRequest() {
 try {
 const { data: rows, error } = await (supabase.rpc as any)('get_public_feedback_request', { p_token: token });
 const rawData = Array.isArray(rows) ? rows[0] : rows;

 if (error || !rawData) throw new Error('Tautan tidak valid atau tidak ditemukan.');

 const data = { ...rawData, token } as FeedbackRequest;

 if (data.status !== 'open') throw new Error('Permintaan feedback ini sudah ditutup.');
 
 setRequest(data);
 
 // Initialize responses
 const initRes: Record<string, any> = {};
 data.domains.forEach((d: string) => {
 initRes[d] = { rating: 3, strength: '', growth: '' };
 });
 setDomainResponses(initRes);
 } catch (err: any) {
 setError(err.message || 'Terjadi kesalahan');
 } finally {
 setLoading(false);
 }
 }
 
 if (token) fetchRequest();
 }, [token]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!request) return;
 
 setLoading(true);
 try {
 const payload = Object.keys(domainResponses).map(domainKey => ({
 domainKey,
 rating: domainResponses[domainKey].rating,
 strengthObservation: domainResponses[domainKey].strength,
 growthObservation: domainResponses[domainKey].growth,
 }));
 
 await submitPublicFeedback(
 token, 
 request.privacy_mode === 'required' ? respondentName : null, 
 payload
 );
 
 setStep('success');
 } catch (err: any) {
 alert('Gagal mengirim feedback: ' + (err.message || 'Unknown error'));
 } finally {
 setLoading(false);
 }
 };

 if (loading && !request) {
 return (
 <div className="flex-1 flex items-center justify-center">
 <div className="animate-spin text-blue-500">
 <Icon name="loader" size={32} />
 </div>
 </div>
 );
 }

 if (error) {
 return (
 <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
 <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300 flex items-center justify-center mb-6">
 <Icon name="x" size={32} />
 </div>
 <h1 className="page-title mb-2">Tautan Tidak Valid</h1>
 <p className="text-muted-foreground text-sm leading-relaxed">{error}</p>
 </div>
 );
 }

 if (step === 'success') {
 return (
 <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
 <div className="w-16 h-16 rounded-full bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 flex items-center justify-center mb-6">
 <Icon name="check" size={32} />
 </div>
 <h1 className="page-title mb-2">Terima Kasih</h1>
 <p className="text-muted-foreground text-sm leading-relaxed">
 Feedback Anda telah tersimpan dan akan sangat membantu dalam proses pengembangan diri.
 </p>
 </div>
 );
 }

 if (step === 'intro' && request) {
 return (
 <div className="flex-1 flex items-center justify-center p-4">
 <Surface className="max-w-xl w-full p-6 md:p-8 text-center space-y-6">
 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 mb-2">
 <Icon name="lightbulb" size={32} />
 </div>
 <div>
 <h1 className="page-title mb-2">{request.title}</h1>
 <p className="text-muted-foreground text-sm leading-relaxed">
 Anda diundang untuk memberikan feedback. Feedback yang konstruktif dan berbasis fakta (bukan sekadar penilaian label) akan sangat berharga.
 </p>
 </div>
 
 <div className="well text-left">
 <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
 <Icon name="shield" size={16} className="text-blue-600 dark:text-blue-300" />
 Privasi Anda
 </h4>
 <p className="text-xs text-muted-foreground">
 {request.privacy_mode === 'anonymous' 
 ? 'Feedback ini bersifat anonim. Nama Anda tidak akan dicatat atau ditampilkan.' 
 : 'Feedback ini bersifat terbuka. Anda akan diminta untuk mencantumkan nama Anda.'}
 </p>
 </div>

 <Button 
 onClick={() => setStep('form')} 
 variant="primary" 
 className="w-full h-12 text-sm font-medium"
 >
 Mulai Isi Feedback
 </Button>
 </Surface>
 </div>
 );
 }

 return (
 <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 md:py-12">
 <div className="mb-8 text-center">
 <h1 className="page-title mb-2">{request?.title}</h1>
 <p className="text-sm text-muted-foreground">
 Fokus pada observasi konkret, hindari menggunakan label yang menghakimi.
 </p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
 {request?.privacy_mode === 'required' && (
 <Surface variant="soft" className="p-5 md:p-6">
 <h3 className="section-title mb-4">Identitas Anda</h3>
 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground ">
 Nama Lengkap
 </label>
 <input
 type="text"
 required
 value={respondentName}
 onChange={(e) => setRespondentName(e.target.value)}
 placeholder="Masukkan nama Anda"
 className="glass-input" aria-label="Masukkan nama Anda"
/>
 </div>
 </Surface>
 )}

 {request?.domains.map((domainKey) => {
 const domain = SELF_AWARENESS_DOMAINS.find(d => d.key === domainKey);
 if (!domain) return null;
 
 return (
 <Surface key={domainKey} className="p-5 md:p-6">
 <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
 <div className="icon-tile w-10 h-10">
 <Icon name={domain.icon as any} size={20} />
 </div>
 <div>
 <h3 className="section-title">{domain.label}</h3>
 </div>
 </div>

 <div className="space-y-6">
 <div className="space-y-3">
 <label className="text-xs font-medium text-muted-foreground ">
 Rating (1-5)
 </label>
 <div className="flex items-center justify-between gap-2 max-w-xs">
 {[1, 2, 3, 4, 5].map((rating) => (
 <button
 key={rating}
 type="button"
 onClick={() => setDomainResponses(prev => ({
 ...prev,
 [domainKey]: { ...prev[domainKey], rating }
 }))}
 aria-pressed={domainResponses[domainKey].rating === rating}
 aria-label={`Nilai ${rating}`}
 className={`w-11 h-11 rounded-full text-sm font-medium transition-colors ${
 domainResponses[domainKey].rating === rating
 ? 'bg-primary text-primary-foreground'
 : 'bg-card text-foreground border border-border hover:bg-muted'
 }`}
 >
 {rating}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-medium text-teal-700 dark:text-teal-300 flex items-center gap-2">
 <Icon name="arrowUp" size={12} />
 Hal yang Sudah Baik (Kekuatan)
 </label>
 <p className="text-xs text-muted-foreground mb-2">
 Apa yang menurut Anda sudah dilakukan dengan baik? Berikan contoh spesifik.
 </p>
 <textarea
 required
 value={domainResponses[domainKey].strength}
 onChange={(e) => setDomainResponses(prev => ({
 ...prev,
 [domainKey]: { ...prev[domainKey], strength: e.target.value }
 }))}
 placeholder="Contoh: Dia sangat responsif ketika ditanya mengenai progress proyek X minggu lalu"
 className="glass-input h-24 resize-none" aria-label="Contoh: Dia sangat responsif ketika ditanya mengenai progress proyek X minggu lalu"
/>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
 <Icon name="arrowRight" size={12} />
 Area untuk Dikembangkan
 </label>
 <p className="text-xs text-muted-foreground mb-2">
 Apa yang bisa ditingkatkan ke depannya? Hindari menghakimi, fokus pada observasi dan saran perbaikan.
 </p>
 <textarea
 required
 value={domainResponses[domainKey].growth}
 onChange={(e) => setDomainResponses(prev => ({
 ...prev,
 [domainKey]: { ...prev[domainKey], growth: e.target.value }
 }))}
 placeholder="Contoh: Pada saat meeting Y, akan lebih baik jika"
 className="glass-input h-24 resize-none" aria-label="Contoh: Pada saat meeting Y, akan lebih baik jika"
/>
 </div>
 </div>
 </Surface>
 );
 })}

 <Button 
 type="submit" 
 variant="primary" 
 disabled={loading}
 className="w-full h-14 text-[15px]"
 >
 {loading ? 'Mengirim...' : 'Kirim Feedback'}
 </Button>
 </form>
 </div>
 );
}
