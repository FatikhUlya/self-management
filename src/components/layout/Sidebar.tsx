'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';
import { addDays, inLastDays, cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { state } = useLifeOS();
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

  return (
    <aside 
      className="hidden md:flex flex-col w-60 h-screen sticky top-0 py-4 px-3 shrink-0 overflow-y-auto bg-card border-r border-border select-none"
      aria-label="Navigasi utama"
    >
      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex items-center space-x-2.5 px-2 mb-5"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold tracking-tight shadow-2xs">
          LO
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs font-bold tracking-tight text-foreground">Life OS</h1>
            <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-primary/10 text-primary font-medium">v2.0</span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {locale === 'id' ? 'Executive Life OS' : 'Personal Command Center'}
          </p>
        </div>
      </motion.div>

      {/* Nav List grouped by section */}
      <nav className="flex-1 space-y-4" aria-label="Menu aplikasi">
        {sections.map((sectionKey) => {
          const items = (NAV_ITEMS as readonly any[]).filter(item => (item.section || 'core') === sectionKey);
          if (items.length === 0) return null;

          const label = sectionLabels[sectionKey]?.[locale === 'id' ? 'id' : 'en'] || sectionKey;

          return (
            <div key={sectionKey} className="space-y-0.5">
              {sectionKey !== 'core' && (
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 pt-1 pb-1">
                  {label}
                </p>
              )}
              {items.map((item) => {
                const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                const badge = getBadgeCount(item.id);

                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={cn(
                      "group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 select-none",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-2xs border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                    )}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className={cn(
                        "flex items-center justify-center transition-colors shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        <Icon name={item.icon} size={15} />
                      </span>
                      <span className="truncate">{t(item.labelKey)}</span>
                    </div>
                    {badge !== '' && (
                      <span className={cn(
                        "px-1.5 py-0.5 text-[10px] rounded font-mono tabular-nums leading-none shrink-0",
                        isActive
                          ? "bg-primary/20 text-primary font-semibold"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Profile Strip */}
      <div className="pt-3 mt-2 border-t border-border/80 px-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
            F
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate leading-tight">Fatikh</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">Solo Operator</p>
          </div>
        </div>
        <Link 
          href="/settings"
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          title="Pengaturan"
        >
          <Icon name="settings" size={13} />
        </Link>
      </div>
    </aside>
  );
}
