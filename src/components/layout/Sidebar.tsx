'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';
import { todayISO, addDays, inLastDays } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { state } = useLifeOS();
  const { t, locale } = useI18n();

  // Helper count functions mimicking vanilla JS count calculations
  const getBadgeCount = (id: string): string | number => {
    switch (id) {
      case 'dashboard': {
        const today = state.selectedDate;
        const due = state.tasks.filter(
          (t) => t.status !== 'done' && (!t.due || t.due <= today)
        ).length;
        return due > 0 ? due : '';
      }
      case 'capture': {
        const active = state.ideas.filter((i) => i.status !== 'archived').length;
        return active > 0 ? active : '';
      }
      case 'journal': {
        const exists = state.journals.some((j) => j.date === state.selectedDate);
        return exists ? '✓' : '✎';
      }
      case 'planning': {
        const tomorrow = addDays(state.selectedDate, 1);
        const plans = state.nextDayPlans.filter((p) => p.date === tomorrow).length;
        return plans > 0 ? plans : '';
      }
      case 'projects': {
        const activeTasks = state.tasks.filter((t) => t.status !== 'done').length;
        return activeTasks > 0 ? activeTasks : '';
      }
      case 'goals': {
        const activeGoals = state.goals.filter((g) => Number(g.progress) < 100).length;
        return activeGoals > 0 ? activeGoals : '';
      }
      case 'habits': {
        const done = state.habitLogs.filter((log) => log.date === state.selectedDate).length;
        return `${done}/${Math.max(state.habits.length, 1)}`;
      }
      case 'learning': {
        // Minutes in last 7 days
        const mins = state.learning
          .filter((item) => inLastDays(item.date, 7, state.selectedDate))
          .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
        return mins > 0 ? `${mins}m` : '';
      }
      case 'health': {
        // Workout minutes in last 7 days
        const mins = state.workouts
          .filter((item) => inLastDays(item.date, 7, state.selectedDate))
          .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
        return mins > 0 ? `${mins}m` : '';
      }
      case 'work': {
        const applied = state.workApplications.filter((app) => app.status !== 'wishlist').length;
        return `${applied}/${state.workApplications.length}`;
      }
      case 'reviews': {
        return state.reviews.length > 0 ? state.reviews.length : '';
      }
      default:
        return '';
    }
  };

  return (
    <aside 
      className="hidden md:flex flex-col w-64 border-r border-life-line bg-life-bg/60 backdrop-blur-xl h-screen sticky top-0 py-6 px-4 shrink-0 overflow-y-auto"
      aria-label="Navigasi utama"
    >
      {/* Brand Header */}
      <div className="flex items-center space-x-3 px-2 mb-8 select-none">
        <div className="flex items-center justify-center w-10 h-10 border border-teal-500/30 rounded-xl bg-gradient-to-br from-teal-500/10 to-indigo-500/10 text-life-teal shadow-inner text-base font-black">
          LO
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-life-text tracking-tight uppercase">Life OS</h1>
          <p className="text-[10px] text-life-muted font-bold mt-0.5 uppercase tracking-wide">
            {locale === 'id' ? 'Pusat Kendali' : 'Command Center'}
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1" aria-label="Menu aplikasi">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          const badge = getBadgeCount(item.id);

          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-black/[0.03] dark:bg-white/[0.04] border-life-line text-life-text shadow-md'
                  : 'bg-transparent border-transparent text-life-muted hover:text-life-text hover:bg-black/[0.015] dark:hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <span className={`flex items-center justify-center p-1 rounded-md ${isActive ? 'text-life-teal bg-life-teal/10' : 'text-life-muted bg-black/[0.02] dark:bg-white/[0.02]'}`}>
                  <Icon name={item.icon} size={16} />
                </span>
                <span className="truncate">{t(item.labelKey)}</span>
              </div>
              {badge !== '' && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-black/[0.03] dark:bg-white/[0.04] text-life-muted border border-life-line">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
