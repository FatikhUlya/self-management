'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLifeOS, type Habit } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { HABIT_AREAS } from '@/lib/constants';

export default function HabitsManagePage() {
  const { state, addHabit, updateHabit, deleteHabit } = useLifeOS();
  const { t, locale } = useI18n();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [habitName, setHabitName] = useState('');
  const [habitArea, setHabitArea] = useState<string>(HABIT_AREAS[0]);
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekly'>('daily');
  const [habitTarget, setHabitTarget] = useState<number>(5);

  const handleNewHabitClick = () => {
    setEditingHabit(null);
    setHabitName('');
    setHabitArea(HABIT_AREAS[0]);
    setHabitFrequency('daily');
    setHabitTarget(5);
    setIsFormOpen(true);
  };

  const handleEditHabitClick = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitArea(habit.area);
    setHabitFrequency(habit.frequency);
    setHabitTarget(habit.targetPerWeek);
    setIsFormOpen(true);
  };

  const handleHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    if (editingHabit) {
      await updateHabit({
        ...editingHabit,
        name: habitName,
        area: habitArea,
        frequency: habitFrequency,
        targetPerWeek: habitTarget,
      });
    } else {
      await addHabit({
        name: habitName,
        area: habitArea,
        frequency: habitFrequency,
        targetPerWeek: habitTarget,
      });
    }

    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <Link href="/habits">
          <button className="w-10 h-10 rounded-full bg-white/[0.02] border border-life-line flex items-center justify-center text-life-muted hover:bg-white/[0.05] transition-all">
            <Icon name="arrowLeft" size={18} />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-life-text flex items-center gap-2">
            <Icon name="list" size={24} className="text-cyan-500" />
            Kelola Kebiasaan
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Tambah, ubah, atau hapus rutinitas kebiasaan Anda.
          </p>
        </div>
        <Button 
          variant="primary" 
          icon="plus" 
          onClick={handleNewHabitClick}
          className="shrink-0"
        >
          {locale === 'id' ? 'Habit Baru' : 'New Habit'}
        </Button>
      </div>

      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-4">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            Daftar Kebiasaan
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {state.habits.length} kebiasaan aktif
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.habits.length > 0 ? (
            state.habits.map((habit) => (
              <div 
                key={habit.id}
                className="p-4 rounded-xl bg-white/[0.005] border border-life-line flex items-center justify-between group hover:border-cyan-500/30 transition-all"
              >
                <div>
                  <strong className="text-sm font-bold block text-life-text">{habit.name}</strong>
                  <div className="flex gap-2 items-center text-[10px] text-life-muted font-bold uppercase mt-1">
                    <span>{habit.area}</span>
                    <span className="w-1 h-1 rounded-full bg-life-line-strong" />
                    <span>{habit.frequency === 'daily' ? 'Harian' : 'Mingguan'} ({habit.targetPerWeek}x)</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditHabitClick(habit)}
                    className="w-8 h-8 rounded bg-white/[0.02] border border-life-line hover:bg-white/[0.07] text-life-muted hover:text-life-text flex items-center justify-center transition-all"
                    title={t('edit')}
                  >
                    <Icon name="edit" size={14} />
                  </button>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="w-8 h-8 rounded bg-white/[0.02] border border-life-line hover:bg-life-rose/20 text-life-muted hover:text-life-rose flex items-center justify-center transition-all"
                    title={t('delete')}
                  >
                    <Icon name="trash" size={14} />
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

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingHabit ? t('habits_edit_title') : t('habits_new')}
        subtitle={editingHabit ? "Ubah detail habit Anda" : "Masukkan detail habit baru"}
      >
        <form onSubmit={handleHabitSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label htmlFor="hName" className="text-xs font-bold text-life-muted uppercase">
              {t('habits_name')}
            </label>
            <input
              id="hName"
              type="text"
              required
              placeholder={t('habits_name_placeholder')}
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="glass-input text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col space-y-1">
              <label htmlFor="hArea" className="text-xs font-bold text-life-muted uppercase">
                {t('area')}
              </label>
              <select
                id="hArea"
                value={habitArea}
                onChange={(e) => setHabitArea(e.target.value)}
                className="glass-select text-xs"
              >
                {HABIT_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="hFreq" className="text-xs font-bold text-life-muted uppercase">
                {t('habits_frequency')}
              </label>
              <select
                id="hFreq"
                value={habitFrequency}
                onChange={(e) => setHabitFrequency(e.target.value as any)}
                className="glass-select text-xs"
              >
                <option value="daily">{t('habits_daily')}</option>
                <option value="weekly">{t('habits_weekly')}</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label htmlFor="hTarget" className="text-xs font-bold text-life-muted uppercase">
                Target/minggu
              </label>
              <input
                id="hTarget"
                type="number"
                min="1"
                max="7"
                required
                value={habitTarget}
                onChange={(e) => setHabitTarget(Number(e.target.value))}
                className="glass-input text-xs"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" icon={editingHabit ? "save" : "plus"} className="w-full">
            {editingHabit ? t('habits_update_btn') : t('habits_add_new')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
