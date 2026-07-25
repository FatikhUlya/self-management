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
        const { data: rawData, error } = await supabase
          .from('feedback_requests')
          .select('id, title, token, privacy_mode, status, domains')
          .eq('token', token)
          .single();
          
        if (error || !rawData) throw new Error('Tautan tidak valid atau tidak ditemukan.');
        
        const data = rawData as any as FeedbackRequest;

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
        <div className="animate-spin text-teal-500">
          <Icon name="loader" size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mb-6">
          <Icon name="x" size={32} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Tautan Tidak Valid</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">{error}</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center mb-6">
          <Icon name="check" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Terima Kasih!</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Feedback Anda telah tersimpan dan akan sangat membantu dalam proses pengembangan diri.
        </p>
      </div>
    );
  }

  if (step === 'intro' && request) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Surface className="max-w-xl w-full p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-400 mb-2">
            <Icon name="lightbulb" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{request.title}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Anda diundang untuk memberikan feedback. Feedback yang konstruktif dan berbasis fakta (bukan sekadar penilaian label) akan sangat berharga.
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Icon name="shield" size={16} className="text-teal-400" />
              Privasi Anda
            </h4>
            <p className="text-xs text-zinc-400">
              {request.privacy_mode === 'anonymous' 
                ? 'Feedback ini bersifat anonim. Nama Anda tidak akan dicatat atau ditampilkan.' 
                : 'Feedback ini bersifat terbuka. Anda akan diminta untuk mencantumkan nama Anda.'}
            </p>
          </div>

          <Button 
            onClick={() => setStep('form')} 
            variant="primary" 
            className="w-full h-12 text-sm uppercase tracking-widest font-bold"
          >
            Mulai Isi Feedback
          </Button>
        </Surface>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-4 pb-24">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-bold text-white mb-2">{request?.title}</h1>
        <p className="text-sm text-zinc-400">
          Fokus pada observasi konkret, hindari menggunakan label yang menghakimi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {request?.privacy_mode === 'required' && (
          <Surface className="p-6 border-l-4 border-l-teal-500">
            <h3 className="text-base font-bold text-white mb-4">Identitas Anda</h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                placeholder="Masukkan nama Anda..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50"
              />
            </div>
          </Surface>
        )}

        {request?.domains.map((domainKey) => {
          const domain = SELF_AWARENESS_DOMAINS.find(d => d.key === domainKey);
          if (!domain) return null;
          
          return (
            <Surface key={domainKey} className="p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-300">
                  <Icon name={domain.icon as any} size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{domain.label}</h3>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
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
                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                          domainResponses[domainKey].rating === rating
                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/5'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                    <Icon name="arrowUp" size={12} />
                    Hal yang Sudah Baik (Kekuatan)
                  </label>
                  <p className="text-xs text-zinc-500 mb-2">
                    Apa yang menurut Anda sudah dilakukan dengan baik? Berikan contoh spesifik.
                  </p>
                  <textarea
                    required
                    value={domainResponses[domainKey].strength}
                    onChange={(e) => setDomainResponses(prev => ({
                      ...prev,
                      [domainKey]: { ...prev[domainKey], strength: e.target.value }
                    }))}
                    placeholder="Contoh: Dia sangat responsif ketika ditanya mengenai progress proyek X minggu lalu..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <Icon name="arrowRight" size={12} />
                    Area untuk Dikembangkan
                  </label>
                  <p className="text-xs text-zinc-500 mb-2">
                    Apa yang bisa ditingkatkan ke depannya? Hindari menghakimi, fokus pada observasi dan saran perbaikan.
                  </p>
                  <textarea
                    required
                    value={domainResponses[domainKey].growth}
                    onChange={(e) => setDomainResponses(prev => ({
                      ...prev,
                      [domainKey]: { ...prev[domainKey], growth: e.target.value }
                    }))}
                    placeholder="Contoh: Pada saat meeting Y, akan lebih baik jika..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-amber-500/50"
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
          className="w-full h-14 text-sm uppercase tracking-widest font-bold shadow-xl shadow-teal-500/20"
        >
          {loading ? 'Mengirim...' : 'Kirim Feedback'}
        </Button>
      </form>
    </div>
  );
}
