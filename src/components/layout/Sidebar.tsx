'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';
import { addDays, inLastDays, cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { state, user, signOut } = useLifeOS();
  const { t, locale } = useI18n();

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

  const sectionLabels: Record<string, { id: string; en: string }> = {
    core: { id: 'Utama', en: 'Core' },
    productivity: { id: 'Produktivitas', en: 'Productivity' },
    wellness: { id: 'Kesehatan & Diri', en: 'Wellness' },
    growth: { id: 'Karier & Finansial', en: 'Growth' },
    system: { id: 'Pengaturan', en: 'System' },
  };

  // Group items by section
  const sections = ['core', 'productivity', 'wellness', 'growth', 'system'] as const;

  const email: string = user?.email || '';
  const displayName = email ? email.split('@')[0] : 'Life OS';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className="hidden md:flex flex-col w-60 h-screen sticky top-0 shrink-0 overflow-y-auto bg-card border-r border-border select-none"
      aria-label="Navigasi utama"
    >
      {/* Wordmark */}
      <div className="flex items-center gap-2 h-14 px-4 border-b border-border">
        <span
          aria-hidden="true"
          className="flex items-center justify-center w-6 h-6 rounded-md bg-foreground text-background font-mono text-[11px] font-medium"
        >
          L
        </span>
        <span className="text-[15px] font-medium text-foreground">Life OS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4" aria-label="Menu aplikasi">
        {sections.map((sectionKey) => {
          const items = (NAV_ITEMS as readonly any[]).filter(item => (item.section || 'core') === sectionKey);
          if (items.length === 0) return null;

          const label = sectionLabels[sectionKey]?.[locale === 'id' ? 'id' : 'en'] || sectionKey;

          return (
            <div key={sectionKey} className={sectionKey === 'core' ? 'pt-3' : 'pt-6'}>
              {sectionKey !== 'core' && (
                <p className="px-2 pb-2 text-xs text-muted-foreground">{label}</p>
              )}
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                  const badge = getBadgeCount(item.id);

                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 h-8 px-2 rounded-lg text-[13px] transition-colors duration-150',
                        isActive
                          ? 'bg-secondary text-foreground font-medium shadow-[inset_0_0_0_1px_hsl(var(--border))]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                      )}
                    >
                      <span className="flex w-4 justify-center shrink-0">
                        <Icon name={item.icon} size={16} />
                      </span>
                      <span className="flex-1 truncate">{t(item.labelKey)}</span>
                      {badge === 'done' ? (
                        <Icon name="check" size={14} className="text-success shrink-0"/>
                      ) : badge !== '' ? (
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground shrink-0">{badge}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Account */}
      <div className="flex items-center gap-2 h-14 px-4 border-t border-border">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-foreground text-[11px] font-medium shrink-0">
          {initial}
        </span>
        <span className="flex-1 min-w-0 text-[13px] text-foreground truncate" title={email}>{displayName}</span>
        {user && (
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Keluar"
            aria-label="Keluar"
          >
            <Icon name="logOut" size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
