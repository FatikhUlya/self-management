'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS, NAV_SECTION_LABELS, isNavActive, useNavBadges } from './navBadges';

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span aria-hidden="true" className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13.5 12 6.5l7 7" /><path d="M5 18l7-7 7 7" />
        </svg>
      </span>
      <span className="font-display text-[17px] font-medium tracking-[-0.01em] text-foreground">Life OS</span>
    </span>
  );
}

/** Desktop navigation (docs/STYLE_GUIDE.md §3.1). Hidden below md. */
export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useLifeOS();
  const { t, locale } = useI18n();
  const badgeFor = useNavBadges();

  const email: string = user?.email || '';
  const displayName = email ? email.split('@')[0] : 'Life OS';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className="hidden md:flex flex-col w-[248px] h-screen sticky top-0 shrink-0 overflow-y-auto no-scrollbar px-4 py-5 select-none"
      aria-label={locale === 'id' ? 'Navigasi utama' : 'Main navigation'}
    >
      <Link href="/" className="px-2 mb-6 rounded-full" aria-label="Life OS, beranda">
        <Logo />
      </Link>

      <nav className="flex-1" aria-label={locale === 'id' ? 'Menu aplikasi' : 'App menu'}>
        {NAV_SECTIONS.map((sectionKey) => {
          const items = (NAV_ITEMS as readonly any[]).filter((item) => (item.section || 'core') === sectionKey);
          if (items.length === 0) return null;
          const label = NAV_SECTION_LABELS[sectionKey]?.[locale === 'id' ? 'id' : 'en'] || sectionKey;

          return (
            <div key={sectionKey} className={sectionKey === 'core' ? '' : 'mt-5'}>
              {sectionKey !== 'core' && <p className="px-3 pb-1.5 text-xs text-muted-foreground">{label}</p>}
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const active = isNavActive(pathname, item.path);
                  const badge = badgeFor(item.id);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.path}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 h-10 px-3 rounded-full text-sm transition-colors duration-150',
                          active
                            ? 'bg-primary text-primary-foreground font-medium shadow-float'
                            : 'text-foreground/80 hover:text-foreground hover:bg-card'
                        )}
                      >
                        <Icon name={item.icon} size={17} className="shrink-0" />
                        <span className="flex-1 truncate">{t(item.labelKey)}</span>
                        {badge === 'done' ? (
                          <Icon name="check" size={14} className={cn('shrink-0', active ? 'text-primary-foreground' : 'text-success')} />
                        ) : badge !== '' ? (
                          <span
                            className={cn(
                              'inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold tabular-nums shrink-0',
                              active ? 'bg-white/20 text-primary-foreground dark:bg-black/10' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            )}
                          >
                            {badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="mt-6 flex items-center gap-2.5 p-1.5 pr-2 rounded-full bg-card shadow-card">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-sm font-medium shrink-0">
          {initial}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-foreground truncate">{displayName}</span>
          {email && <span className="block text-xs text-muted-foreground truncate" title={email}>{email}</span>}
        </span>
        {user && (
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={locale === 'id' ? 'Keluar' : 'Sign out'}
            aria-label={locale === 'id' ? 'Keluar' : 'Sign out'}
          >
            <Icon name="logOut" size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
