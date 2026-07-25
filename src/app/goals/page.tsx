'use client';

import React, { useState } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { QuickNavGrid } from '@/components/ui/QuickNavGrid';
import { percent, avg } from '@/lib/utils';

export default function GoalsDashboardPage() {
  const { state } = useLifeOS();
  const { t, locale } = useI18n();

  const [vision, setVision] = useLocalStorageState(
    'lifeos_vision',
    'Menjadi seorang Lead Frontend Engineer yang tidak hanya mahir secara teknis, tetapi juga berkontribusi positif bagi komunitas open-source global.'
  );
  const [mission, setMission] = useLocalStorageState(
    'lifeos_mission',
    '1. Eksplorasi teknologi React, Next.js, & UI/UX secara mendalam setiap hari.\n2. Menyelesaikan proyek berkualitas tinggi dengan estetika visual premium.\n3. Menyelaraskan aksi harian (tugas) dengan target jangka panjang (Goals & OKRs).'
  );

  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [tempVision, setTempVision] = useState('');
  const [tempMission, setTempMission] = useState('');

  const completedGoalsCount = state.goals.filter((g) => Number(g.progress) >= 100).length;
  const activeGoalsCount = state.goals.filter((g) => Number(g.progress) < 100).length;
  const avgProgress = Math.round(avg(state.goals.map((g) => g.progress)));

  const handleOpenVisionModal = () => {
    setTempVision(vision);
    setTempMission(mission);
    setIsVisionModalOpen(true);
  };

  const handleSaveVisionMission = () => {
    setVision(tempVision);
    setMission(tempMission);
    setIsVisionModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-600 dark:from-emerald-300 dark:to-teal-500 flex items-center gap-2">
            <Icon name="target" size={28} className="text-teal-500" />
            {t('goals_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Visualisasi visi, misi, dan pencapaian target jangka panjang.
          </p>
        </div>
      </div>

      <QuickNavGrid 
        items={[
          { label: 'Kelola Goals (OKRs)', icon: 'list', iconColor: 'text-teal-500', href: '/goals/manage' }
        ]} 
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          icon="activity"
          iconColor="text-teal-500"
          accentColor="teal-500"
          label="Average Progress"
          value={`${avgProgress}%`}
          detail="Rata-rata progres semua goal"
        >
          <div className="w-full bg-black/10 dark:bg-white/5 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-teal-500 h-full rounded-full transition-all" 
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </DashboardCard>
        
        <DashboardCard
          icon="checkCircle"
          iconColor="text-green-500"
          accentColor="green-500"
          label="Selesai"
          value={completedGoalsCount}
          detail={`Dari total ${state.goals.length} target`}
        />

        <DashboardCard
          icon="target"
          iconColor="text-indigo-500"
          accentColor="indigo-500"
          label="Aktif / On Track"
          value={activeGoalsCount}
          detail="Target berjalan"
        />
      </div>

      <Surface className="p-6">
        <div className="flex justify-between items-center border-b border-life-line pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
              Kompas Hidup
            </h3>
            <p className="text-xs text-life-muted mt-0.5">
              Arah dan prinsip utama kehidupan Anda.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleOpenVisionModal}
            className="text-xs"
            icon="edit"
          >
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-life-line border-l-2 border-l-life-teal bg-gradient-to-br from-life-teal/5 to-transparent relative group">
            <Icon name="target" size={36} className="absolute right-3 top-3 opacity-10 select-none text-life-text" />
            <h3 className="text-xs font-black uppercase text-life-teal tracking-wider mb-2">Visi Pribadi (Vision)</h3>
            <p className="text-sm font-semibold italic text-life-text leading-relaxed tracking-tight">
              "{vision}"
            </p>
          </div>

          <div className="p-5 rounded-xl border border-life-line border-l-2 border-l-life-indigo bg-gradient-to-br from-life-indigo/5 to-transparent relative group">
            <Icon name="briefcase" size={36} className="absolute right-3 top-3 opacity-10 select-none text-life-text" />
            <h3 className="text-xs font-black uppercase text-life-indigo tracking-wider mb-2">Misi Pribadi (Mission)</h3>
            <div className="text-xs text-life-text leading-relaxed space-y-1.5">
              {mission.split('\n').map((m, idx) => (
                <p key={idx} className="font-medium">{m}</p>
              ))}
            </div>
          </div>
        </div>
      </Surface>

      <Modal
        isOpen={isVisionModalOpen}
        onClose={() => setIsVisionModalOpen(false)}
        title="Edit Visi & Misi Kompas"
        subtitle="Tetapkan arah jangka panjang kepribadian Anda"
      >
        <div className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="tempVisionInput" className="text-xs font-black text-life-muted uppercase">
              Visi Pribadi (Vision)
            </label>
            <textarea
              id="tempVisionInput"
              value={tempVision}
              onChange={(e) => setTempVision(e.target.value)}
              className="glass-input text-xs h-20 resize-none mt-1"
              placeholder="Tulis visi kehidupan Anda di sini..."
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="tempMissionInput" className="text-xs font-black text-life-muted uppercase">
              Misi Pribadi (Mission)
            </label>
            <textarea
              id="tempMissionInput"
              value={tempMission}
              onChange={(e) => setTempMission(e.target.value)}
              className="glass-input text-xs h-32 resize-none mt-1"
              placeholder="Tulis misi kehidupan Anda (tulis poin-poin per baris)..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <Button variant="secondary" onClick={() => setIsVisionModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSaveVisionMission}>
              Simpan Kompas
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
