'use client';

import React, { useMemo } from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { inLastDays } from '@/lib/utils';
import { Icon } from './Icon';

export function LifeAura() {
  const { state } = useLifeOS();
  const today = state.selectedDate;

  // Calculate Energies
  const { vitality, wealth, wisdom, charisma, intelligence } = useMemo(() => {
    let vitality = 0;
    let wealth = 0;
    let wisdom = 0;
    let charisma = 0;
    let intelligence = 0;

    // Health (Vitality)
    const recentWorkouts = state.workouts.filter(w => inLastDays(w.date, 7, today));
    vitality += recentWorkouts.length * 15;
    const recentMeals = state.meals.filter(m => inLastDays(m.date, 7, today));
    vitality += recentMeals.length * 5;

    // Finance (Wealth)
    const recentTx = state.transactions.filter(t => inLastDays(t.date, 7, today));
    wealth += recentTx.length * 10;

    // Work/Career (Intelligence)
    const recentWorkApps = (state.workApplications || []).filter(w => inLastDays(w.appliedDate || '', 7, today));
    intelligence += recentWorkApps.length * 20;

    // Tasks (Wisdom, Charisma, Intelligence)
    const recentTasks = state.tasks.filter(t => t.status === 'done' && t.completedAt && inLastDays(t.completedAt.split('T')[0], 7, today));
    recentTasks.forEach(t => {
      // Find the project area
      const project = state.projects.find(p => p.id === t.projectId);
      const area = project?.area || '';
      
      if (area === 'Karir') intelligence += 15;
      else if (area === 'Keuangan') wealth += 15;
      else if (area === 'Kesehatan') vitality += 15;
      else if (area === 'Pembelajaran' || area === 'Personal' || area === 'Agama') wisdom += 15;
      else if (area === 'Sosial & Keluarga') charisma += 15;
      else wisdom += 5; // default
    });

    // Habits
    const recentHabitLogs = state.habitLogs.filter(h => inLastDays(h.date, 7, today));
    recentHabitLogs.forEach(log => {
      const habit = state.habits.find(h => h.id === log.habitId);
      if (habit) {
        if (habit.category === 'Kesehatan') vitality += 10;
        else if (habit.category === 'Keuangan') wealth += 10;
        else if (habit.category === 'Karir') intelligence += 10;
        else if (habit.category === 'Sosial & Keluarga') charisma += 10;
        else wisdom += 10;
      }
    });

    // Normalize (ensure min values so aura is always somewhat visible)
    const cap = (val: number) => Math.min(Math.max(val, 20), 100);
    
    return {
      vitality: cap(vitality),
      wealth: cap(wealth),
      wisdom: cap(wisdom),
      charisma: cap(charisma),
      intelligence: cap(intelligence)
    };
  }, [state, today]);

  // Generate a dynamic gradient based on the dominant energies
  // Vitality = Rose (Health)
  // Wealth = Emerald (Finance)
  // Wisdom = Indigo (Learning)
  // Charisma = Amber (Social)
  // Intelligence = Teal (Career)
  
  const gradientStyle = {
    background: `radial-gradient(circle at 30% 30%, 
      rgba(244, 63, 94, ${vitality / 100}) 0%, 
      rgba(16, 185, 129, ${wealth / 100}) 25%, 
      rgba(99, 102, 241, ${wisdom / 100}) 50%, 
      rgba(245, 158, 11, ${charisma / 100}) 75%, 
      rgba(20, 184, 166, ${intelligence / 100}) 100%)`
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-6 rounded-2xl border border-life-line bg-white/[0.005] overflow-hidden group">
      {/* Background ambient glow */}
      <div 
        className="absolute w-[150%] h-[150%] opacity-20 blur-3xl animate-pulse"
        style={gradientStyle}
      />
      
      {/* The Core Orb */}
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden transition-transform duration-700 group-hover:scale-105">
        <div 
          className="absolute inset-0 animate-[spin_10s_linear_infinite]"
          style={{
            background: `conic-gradient(
              from 0deg,
              rgba(244, 63, 94, ${vitality / 100}),
              rgba(16, 185, 129, ${wealth / 100}),
              rgba(99, 102, 241, ${wisdom / 100}),
              rgba(245, 158, 11, ${charisma / 100}),
              rgba(20, 184, 166, ${intelligence / 100}),
              rgba(244, 63, 94, ${vitality / 100})
            )`
          }}
        />
        <div className="absolute inset-1 rounded-full bg-[#0a0c10] blur-[2px] opacity-80" />
        <div className="relative z-10 flex flex-col items-center">
          <Icon name="sun" size={24} className="text-white/80 drop-shadow-md animate-[pulse_3s_ease-in-out_infinite]" />
        </div>
      </div>

      <div className="relative z-10 mt-6 text-center">
        <h3 className="text-sm font-black text-life-text uppercase tracking-[0.2em]">Life Aura</h3>
        <p className="text-[10px] text-life-muted font-medium tracking-wide mt-1">Energi 7 Hari Terakhir</p>
      </div>

      {/* Mini Stats Row */}
      <div className="relative z-10 flex gap-4 mt-4 bg-[#0a0c10]/80 px-4 py-2 rounded-full border border-white/5">
        <div className="flex flex-col items-center" title="Vitality (Kesehatan)">
          <div className="w-2 h-2 rounded-full bg-rose-500 mb-1" style={{ opacity: vitality / 100 }} />
          <span className="text-[8px] font-bold text-life-muted">VIT</span>
        </div>
        <div className="flex flex-col items-center" title="Wealth (Keuangan)">
          <div className="w-2 h-2 rounded-full bg-emerald-500 mb-1" style={{ opacity: wealth / 100 }} />
          <span className="text-[8px] font-bold text-life-muted">WLTH</span>
        </div>
        <div className="flex flex-col items-center" title="Wisdom (Personal)">
          <div className="w-2 h-2 rounded-full bg-indigo-500 mb-1" style={{ opacity: wisdom / 100 }} />
          <span className="text-[8px] font-bold text-life-muted">WIS</span>
        </div>
        <div className="flex flex-col items-center" title="Charisma (Sosial)">
          <div className="w-2 h-2 rounded-full bg-amber-500 mb-1" style={{ opacity: charisma / 100 }} />
          <span className="text-[8px] font-bold text-life-muted">CHA</span>
        </div>
        <div className="flex flex-col items-center" title="Intelligence (Karir)">
          <div className="w-2 h-2 rounded-full bg-teal-500 mb-1" style={{ opacity: intelligence / 100 }} />
          <span className="text-[8px] font-bold text-life-muted">INT</span>
        </div>
      </div>
    </div>
  );
}
