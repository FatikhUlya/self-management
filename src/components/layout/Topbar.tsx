'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';

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

  const btn = 'flex items-center justify-center h-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 h-14 px-4 sm:px-6 lg:px-8 bg-background border-b border-border select-none">
      <div className="flex items-center gap-2 min-w-0 text-[13px]">
        <span className="md:hidden font-medium text-foreground">Life OS</span>
        <span className="md:hidden text-muted-foreground" aria-hidden="true">/</span>
        <span className="text-foreground truncate">{t(activeNavItem.labelKey)}</span>
      </div>

      <div className="flex md:hidden items-center gap-2 shrink-0">
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
          className={cn(btn, 'w-11 h-11')}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
      </div>

      <div className="hidden md:flex items-center gap-2 shrink-0">
        <span
          className="flex items-center gap-2 px-2 text-xs text-muted-foreground"
          title={isDbConnected ? t('settings_supabase_connected') : t('settings_supabase_disconnected')}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', isDbConnected ? 'bg-success' : 'bg-muted-foreground')} />
          {isDbConnected ? 'Tersinkron' : 'Lokal'}
        </span>

        <label className={cn(btn, 'gap-2 px-2 cursor-pointer')}>
          <Icon name="calendar" size={16} />
          <input
            type="date"
            aria-label="Pilih tanggal"
            value={state.selectedDate}
            onChange={handleDateChange}
            className="bg-transparent outline-none cursor-pointer text-xs text-foreground border-none p-0 focus:ring-0 font-mono tabular-nums"
          />
        </label>

        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
          title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
          className={cn(btn, 'w-8')}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>

        <button
          onClick={toggleLanguage}
          aria-label={`Ubah bahasa, saat ini ${locale === 'id' ? 'Bahasa Indonesia' : 'English'}`}
          title={t('settings_language')}
          className={cn(btn, 'px-2 font-mono text-xs')}
        >
          {locale.toUpperCase()}
        </button>
      </div>
    </header>
  );
}
