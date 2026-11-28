'use client';

import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { addDays, inLastDays } from '@/lib/utils';

export const NAV_SECTIONS = ['core', 'productivity', 'wellness', 'growth', 'system'] as const;

export const NAV_SECTION_LABELS: Record<string, { id: string; en: string }> = {
  core: { id: 'Utama', en: 'Core' },
  productivity: { id: 'Produktivitas', en: 'Productivity' },
  wellness: { id: 'Kesehatan & Diri', en: 'Wellness' },
  growth: { id: 'Karier & Finansial', en: 'Growth' },
  system: { id: 'Pengaturan', en: 'System' },
};

export function isNavActive(pathname: string | null, path: string) {
  if (!pathname) return false;
  return pathname === path || (path !== '/' && pathname.startsWith(path));
}

/** Small counters shown next to nav items (sidebar and mobile menu). */
export function useNavBadges() {
  const { state } = useLifeOS();

  return (id: string): string | number => {
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
        return exists ? 'done' : '';
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
        const mins = state.learning
          .filter((item) => inLastDays(item.date, 7, state.selectedDate))
          .reduce((sum, item) => sum + Number(item.minutes || 0), 0);
        return mins > 0 ? `${mins}m` : '';
      }
      case 'health': {
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
}
