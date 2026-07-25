'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { SELF_AWARENESS_DOMAINS } from '@/lib/constants';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

type DomainFormState = {
  rating: number;
  strengthObservation: string;
  strengthReasoning: string;
  growthObservation: string;
  growthReasoning: string;
};

export default function NewReflectionWizard() {
  const router = useRouter();
  const { saveSelfAssessment } = useLifeOS();
  
  const [step, setStep] = useState(0); // 0 = intro, 1..N = domains, N+1 = summary
  
  // Intro fields
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'custom'>('monthly');
  const [periodLabel, setPeriodLabel] = useState('');
  
  // Domain forms
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [domainResponses, setDomainResponses] = useState<Record<string, DomainFormState>>({});
  
  // Summary fields
  const [overallReflection, setOverallReflection] = useState('');
  
  const [loading, setLoading] = useState(false);

  const toggleDomain = (key: string) => {
    setSelectedDomains(prev => 
      prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
    );
  };

  const handleStart = () => {
    if (selectedDomains.length === 0) return alert('Pilih minimal 1 area evaluasi.');
    
    // Initialize state for selected domains
    const initRes: Record<string, DomainFormState> = {};
    selectedDomains.forEach(d => {
      initRes[d] = { 
        rating: 3, 
        strengthObservation: '', strengthReasoning: '', 
        growthObservation: '', growthReasoning: '' 
      };
    });
    setDomainResponses(initRes);
    
    setStep(1);
  };

  const currentDomainKey = selectedDomains[step - 1];
  const currentDomain = SELF_AWARENESS_DOMAINS.find(d => d.key === currentDomainKey);

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startD = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
      let endD = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0,10);
      
      const payloadDomains = selectedDomains.map((key, index) => ({
        domainKey: key,
        domainLabel: SELF_AWARENESS_DOMAINS.find(d => d.key === key)?.label || key,
        rating: domainResponses[key].rating,
        strengthObservation: domainResponses[key].strengthObservation,
        strengthReasoning: domainResponses[key].strengthReasoning,
        growthObservation: domainResponses[key].growthObservation,
        growthReasoning: domainResponses[key].growthReasoning,
        sortOrder: index
      }));

      await saveSelfAssessment({
        periodType,
        periodLabel: periodLabel || `Refleksi ${periodType} - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        periodStart: startD,
        periodEnd: endD,
        overallReflection,
        isDraft: false,
      }, payloadDomains);
      
      router.push('/mirror');
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/mirror">
            <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
              <Icon name="arrowLeft" size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Refleksi Diri Baru</h1>
            <p className="text-zinc-400 text-sm mt-1">Pilih periode dan area yang ingin dievaluasi.</p>
          </div>
        </div>

        <Surface className="p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
            1. Informasi Refleksi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Periode</label>
              <select 
                value={periodType} 
                onChange={e => setPeriodType(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50"
              >
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="custom">Kustom</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Label Refleksi</label>
              <input 
                type="text" 
                placeholder="Mis. Refleksi Agustus 2026"
                value={periodLabel}
                onChange={e => setPeriodLabel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50"
              />
            </div>
          </div>

          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
            2. Pilih Area Evaluasi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SELF_AWARENESS_DOMAINS.map(domain => {
              const isSelected = selectedDomains.includes(domain.key);
              return (
                <div 
                  key={domain.key}
                  onClick={() => toggleDomain(domain.key)}
                  className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${
                    isSelected 
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-300' 
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    isSelected ? 'bg-teal-500 border-teal-400 text-white' : 'border-zinc-600'
                  }`}>
                    {isSelected && <Icon name="check" size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="text-sm block truncate">{domain.label}</strong>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <Button variant="primary" onClick={handleStart} icon="arrowRight">
              Mulai Evaluasi
            </Button>
          </div>
        </Surface>
      </div>
    );
  }

  if (step > 0 && step <= selectedDomains.length && currentDomain) {
    const curRes = domainResponses[currentDomainKey];
    const updateRes = (updates: Partial<DomainFormState>) => {
      setDomainResponses(prev => ({
        ...prev,
        [currentDomainKey]: { ...prev[currentDomainKey], ...updates }
      }));
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon name={currentDomain.icon as any} size={24} className="text-teal-400" />
            Evaluasi: {currentDomain.label}
          </h1>
          <Badge tone="teal">
            Langkah {step} dari {selectedDomains.length}
          </Badge>
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <p className="text-xs text-amber-400/80 leading-relaxed font-medium">
            💡 <strong>Panduan:</strong> Pisahkan antara <em>observasi (fakta)</em> dan <em>penilaian (interpretasi)</em>. Tuliskan terlebih dahulu kejadian konkret yang Anda alami secara objektif tanpa bias mood, baru kemudian tuliskan apa yang bisa dipelajari darinya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hal yang Sudah Baik */}
          <Surface className="p-6 border-t-2 border-t-teal-500">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4">
              Hal yang Sudah Baik
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">1. Fakta/Observasi</label>
                <p className="text-[10px] text-zinc-500">Kejadian spesifik apa yang terjadi?</p>
                <textarea
                  value={curRes.strengthObservation}
                  onChange={e => updateRes({ strengthObservation: e.target.value })}
                  placeholder="Contoh: Saya berhasil memimpin rapat mingguan tanpa ada agenda yang terlewat..."
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">2. Makna/Penilaian</label>
                <p className="text-[10px] text-zinc-500">Mengapa ini hal yang baik? Apa dampaknya?</p>
                <textarea
                  value={curRes.strengthReasoning}
                  onChange={e => updateRes({ strengthReasoning: e.target.value })}
                  placeholder="Ini menunjukkan saya sudah lebih siap dan menghargai waktu anggota tim..."
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
                />
              </div>
            </div>
          </Surface>

          {/* Area untuk Dikembangkan */}
          <Surface className="p-6 border-t-2 border-t-rose-500">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4">
              Area untuk Dikembangkan
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">1. Fakta/Observasi</label>
                <p className="text-[10px] text-zinc-500">Kejadian spesifik apa yang kurang optimal?</p>
                <textarea
                  value={curRes.growthObservation}
                  onChange={e => updateRes({ growthObservation: e.target.value })}
                  placeholder="Contoh: Saat diskusi ide baru, saya memotong pembicaraan rekan dua kali..."
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">2. Pembelajaran/Tujuan</label>
                <p className="text-[10px] text-zinc-500">Apa versi yang lebih baik dari kejadian ini?</p>
                <textarea
                  value={curRes.growthReasoning}
                  onChange={e => updateRes({ growthReasoning: e.target.value })}
                  placeholder="Ke depannya, saya harus lebih sabar dan membiarkan mereka selesai bicara..."
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
                />
              </div>
            </div>
          </Surface>
        </div>

        <Surface className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                Rating Kepuasan Anda
              </h3>
              <p className="text-xs text-zinc-400">Seberapa puas Anda dengan area ini secara keseluruhan? (1-5)</p>
            </div>
            
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => updateRes({ rating })}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                    curRes.rating === rating
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        </Surface>

        <div className="flex justify-between items-center mt-6">
          <Button variant="secondary" onClick={handlePrev} icon="arrowLeft">
            Kembali
          </Button>
          <Button variant="primary" onClick={handleNext}>
            Selanjutnya <Icon name="arrowRight" size={14} className="ml-1 inline" />
          </Button>
        </div>
      </div>
    );
  }

  // Summary Step
  if (step === selectedDomains.length + 1) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-24">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Kesimpulan</h1>
        </div>

        <Surface className="p-6 space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
            Ringkasan Refleksi (Opsional)
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Dari semua evaluasi area di atas, apa benang merah atau satu kesimpulan utama (insight) yang Anda dapatkan tentang diri Anda periode ini?
          </p>
          <textarea
            value={overallReflection}
            onChange={e => setOverallReflection(e.target.value)}
            placeholder="Insight utama: Saya sudah baik dalam komunikasi tertulis, tapi masih perlu belajar meredam emosi saat diskusi langsung..."
            className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white resize-none"
          />
        </Surface>

        <div className="flex justify-between items-center mt-6">
          <Button variant="secondary" onClick={handlePrev} icon="arrowLeft" disabled={loading}>
            Kembali
          </Button>
          <Button variant="primary" onClick={handleSubmit} icon="check" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Refleksi'}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
