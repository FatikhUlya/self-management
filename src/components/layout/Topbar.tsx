'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';

export function Topbar() {
  const pathname = usePathname();
  const { state, setSelectedDate, isDbConnected } = useLifeOS();
  const { locale, setLocale, t } = useI18n();

  const [theme, setTheme] = React.useState<'dark' | 'light'>('light');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('lifeos_theme');
      if (savedTheme === 'dark') {
        setTheme('dark');
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const root = window.document.documentElement;
    if (nextTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('lifeos_theme', nextTheme);
  };

  const activeNavItem = (NAV_ITEMS as readonly any[]).find((item) => 
    item.path === pathname || (item.path !== '/' && pathname.startsWith(item.path))
  ) || NAV_ITEMS[0];

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDate(e.target.value);
    }
  };

  const toggleLanguage = () => {
    setLocale(locale === 'id' ? 'en' : 'id');
  };

  return (
    <header className="flex items-center justify-between gap-3 py-2.5 px-5 md:px-8 sticky top-0 z-30 select-none bg-background/80 backdrop-blur-md border-b border-border">
      {/* Breadcrumb / Section Header */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-6 h-6 rounded-md bg-muted/80 flex items-center justify-center text-foreground shrink-0">
          <Icon name={activeNavItem.icon} size={13} />
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold text-foreground tracking-[-0.015em] truncate">
            {t(activeNavItem.labelKey)}
          </span>
          <span className="text-muted-foreground/30 text-xs hidden sm:inline">•</span>
          <span className="text-xs text-muted-foreground hidden sm:inline font-mono tabular-nums">
            {formatDate(state.selectedDate, { locale: locale === 'id' ? 'id-ID' : 'en-US' })}
          </span>
        </div>
      </div>

      {/* Utility Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Connection Status Badge */}
        <div
          className={cn(
            "flex items-center space-x-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors",
            isDbConnected
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              : "bg-muted/60 text-muted-foreground border-border"
          )}
          title={isDbConnected ? t('settings_supabase_connected') : t('settings_supabase_disconnected')}
        >
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              isDbConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
            )}
          />
          <span className="hidden sm:inline font-mono">{isDbConnected ? 'Sync' : 'Local'}</span>
        </div>

        {/* Date Selector */}
        <label className="flex items-center space-x-1.5 px-2 py-1 rounded-md border border-border bg-card text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-2xs">
          <Icon name="calendar" size={12} className="text-muted-foreground" />
          <input
            type="date"
            value={state.selectedDate}
            onChange={handleDateChange}
            className="bg-transparent outline-none cursor-pointer text-xs font-medium text-foreground border-none p-0 focus:ring-0 font-mono tabular-nums"
          />
        </label>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center p-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-2xs"
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={13} />
        </button>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center gap-1 px-2 py-1 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted text-[11px] font-medium transition-colors font-mono shadow-2xs"
          title={t('settings_language')}
        >
          <Icon name="globe" size={12} />
          <span className="uppercase">{locale}</span>
        </button>
      </div>
    </header>
  );
}
