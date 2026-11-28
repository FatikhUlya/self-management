'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { useTheme } from '@/lib/hooks/useTheme';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { isNavActive } from './navBadges';
import { Logo } from './Sidebar';

/** Date chip with a native date picker underneath (keyboard + screen reader friendly). */
function DateChip({ compact = false }: { compact?: boolean }) {
  const { state, setSelectedDate } = useLifeOS();
  const { locale } = useI18n();
  const date = new Date(`${state.selectedDate}T00:00:00`);
  const loc = locale === 'id' ? 'id-ID' : 'en-US';
  const text = date.toLocaleDateString(loc, compact ? { day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <label className="chip relative cursor-pointer focus-within:ring-2 focus-within:ring-ring">
      <Icon name="calendar" size={15} />
      <span className="tabular-nums">{text}</span>
      <input
        type="date"
        aria-label={locale === 'id' ? 'Pilih tanggal kerja' : 'Pick working date'}
        value={state.selectedDate}
        onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full !min-h-0"
      />
    </label>
  );
}

/**
 * Desktop: transparent utility row (breadcrumb + date, sync, theme, language).
 * Mobile: app bar with logo/module title and the date chip (§3.2).
 */
export function Topbar() {
  const pathname = usePathname();
  const { isDbConnected } = useLifeOS();
  const { locale, setLocale, t } = useI18n();
  const { theme, toggle } = useTheme();

  const activeNavItem = (NAV_ITEMS as readonly any[]).find((item) => isNavActive(pathname, item.path)) || NAV_ITEMS[0];
  const isHome = pathname === '/';

  return (
    <>
      {/* Mobile app bar */}
      <header className="md:hidden sticky top-0 z-30 pt-safe bg-background/85 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 h-14 px-4">
          {isHome ? (
            <Link href="/" aria-label="Life OS, beranda"><Logo /></Link>
          ) : (
            <span className="flex items-center gap-2 min-w-0">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shrink-0">
                <Icon name={activeNavItem.icon} size={16} />
              </span>
              <span className="font-display text-[17px] font-medium text-foreground truncate">{t(activeNavItem.labelKey)}</span>
            </span>
          )}
          <DateChip compact />
        </div>
      </header>

      {/* Desktop utility row */}
      <header className="hidden md:flex sticky top-0 z-30 items-center justify-between gap-3 h-16 px-8 bg-background/80 backdrop-blur-md select-none">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 min-w-0 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">Life OS</Link>
          <Icon name="chevronRight" size={14} className="text-muted-foreground" />
          <span className="text-foreground truncate" aria-current="page">{t(activeNavItem.labelKey)}</span>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="chip pointer-events-none"
            title={isDbConnected ? t('settings_supabase_connected') : t('settings_supabase_disconnected')}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', isDbConnected ? 'bg-success' : 'bg-muted-foreground')} />
            {isDbConnected ? (locale === 'id' ? 'Tersinkron' : 'Synced') : 'Lokal'}
          </span>
          <DateChip />
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            className="icon-btn"
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
          </button>
          <button
            type="button"
            onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
            aria-label={`Ubah bahasa, saat ini ${locale === 'id' ? 'Bahasa Indonesia' : 'English'}`}
            className="icon-btn text-xs font-semibold"
          >
            {locale.toUpperCase()}
          </button>
        </div>
      </header>
    </>
  );
}
