'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n/context';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useTheme } from '@/lib/hooks/useTheme';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { NAV_SECTIONS, NAV_SECTION_LABELS, isNavActive, useNavBadges } from './navBadges';

const BAR_IDS = ['dashboard', 'planning', 'projects', 'finance'] as const;

/**
 * Mobile navigation (docs/STYLE_GUIDE.md §3.2): floating pill bar in the
 * thumb zone with the four most used modules + Menu. Menu opens a full sheet
 * with every module as a labelled tile, plus theme, language and sign out.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();
  const { user, signOut } = useLifeOS();
  const { theme, toggle } = useTheme();
  const badgeFor = useNavBadges();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const id = locale === 'id';

  const barItems = BAR_IDS.map((bid) => NAV_ITEMS.find((i) => i.id === bid)).filter(Boolean) as (typeof NAV_ITEMS)[number][];
  const inBar = barItems.some((i) => isNavActive(pathname, i.path));

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Escape, scroll lock, focus in and back out
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab' && sheetRef.current) {
        const f = sheetRef.current.querySelectorAll<HTMLElement>('a,button');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    setTimeout(() => sheetRef.current?.querySelector<HTMLElement>('button')?.focus(), 50);
    const trigger = triggerRef.current;
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-safe pointer-events-none"
        aria-label={id ? 'Navigasi bawah' : 'Bottom navigation'}
      >
        <ul className="pointer-events-auto mx-auto max-w-md flex items-center justify-between gap-1 p-1.5 mb-1 rounded-full bg-card/95 backdrop-blur-md shadow-float border border-border/60">
          {barItems.map((item) => {
            const active = isNavActive(pathname, item.path);
            return (
              <li key={item.id} className={cn(active ? 'flex-[1.6]' : 'flex-1')}>
                <Link
                  href={item.path}
                  aria-current={active ? 'page' : undefined}
                  aria-label={t(item.labelKey)}
                  className={cn(
                    'flex items-center justify-center gap-2 h-12 rounded-full text-sm font-medium transition-colors touch-manipulation',
                    active ? 'bg-primary text-primary-foreground px-4' : 'text-muted-foreground active:bg-muted'
                  )}
                >
                  <Icon name={item.icon} size={20} />
                  {active && <span className="truncate">{t(item.labelKey)}</span>}
                </Link>
              </li>
            );
          })}
          <li className={cn(!inBar ? 'flex-[1.6]' : 'flex-1')}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="mobile-menu-sheet"
              aria-label={id ? 'Semua menu' : 'All menus'}
              className={cn(
                'w-full flex items-center justify-center gap-2 h-12 rounded-full text-sm font-medium transition-colors touch-manipulation',
                !inBar ? 'bg-primary text-primary-foreground px-4' : 'text-muted-foreground active:bg-muted'
              )}
            >
              <Icon name="menu" size={20} />
              {!inBar && <span>Menu</span>}
            </button>
          </li>
        </ul>
      </nav>

      <AnimatePresence>
        {open && (
          <div className="md:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={sheetRef}
              id="mobile-menu-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-menu-title"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => { if (info.offset.y > 120) setOpen(false); }}
              className="absolute inset-x-0 bottom-0 max-h-[92vh] flex flex-col rounded-t-3xl bg-background shadow-sheet"
            >
              <div className="pt-2.5 pb-1 shrink-0 cursor-grab" aria-hidden="true">
                <div className="w-10 h-1.5 rounded-full mx-auto bg-gray-300 dark:bg-gray-700" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3 shrink-0">
                <h2 id="mobile-menu-title" className="font-display text-xl font-medium">Menu</h2>
                <button type="button" onClick={() => setOpen(false)} className="icon-btn" aria-label={id ? 'Tutup menu' : 'Close menu'}>
                  <Icon name="x" size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-5">
                {NAV_SECTIONS.map((sectionKey) => {
                  const items = (NAV_ITEMS as readonly any[]).filter((item) => (item.section || 'core') === sectionKey);
                  if (!items.length) return null;
                  return (
                    <section key={sectionKey} aria-label={NAV_SECTION_LABELS[sectionKey][id ? 'id' : 'en']}>
                      <h3 className="text-[13px] font-medium text-muted-foreground mb-2 px-1">
                        {NAV_SECTION_LABELS[sectionKey][id ? 'id' : 'en']}
                      </h3>
                      <ul className="grid grid-cols-3 gap-2">
                        {items.map((item) => {
                          const active = isNavActive(pathname, item.path);
                          const badge = badgeFor(item.id);
                          return (
                            <li key={item.id}>
                              <Link
                                href={item.path}
                                aria-current={active ? 'page' : undefined}
                                className={cn(
                                  'relative flex flex-col items-start justify-between gap-3 h-[92px] p-3 rounded-xl text-[13px] font-medium touch-manipulation active:scale-[0.98] transition-transform',
                                  active ? 'bg-primary text-primary-foreground shadow-float' : 'bg-card text-foreground shadow-card'
                                )}
                              >
                                <span className={cn('flex items-center justify-center w-9 h-9 rounded-full', active ? 'bg-white/15 dark:bg-black/10' : 'bg-muted')}>
                                  <Icon name={item.icon} size={18} />
                                </span>
                                <span className="leading-tight line-clamp-2">{t(item.labelKey)}</span>
                                {badge !== '' && badge !== 'done' && (
                                  <span className="absolute top-2.5 right-2.5 h-5 px-1.5 rounded-full text-xs font-semibold tabular-nums bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center">
                                    {badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}

                <section aria-label={id ? 'Preferensi' : 'Preferences'} className="rounded-xl bg-card shadow-card divide-y divide-border">
                  <button type="button" onClick={toggle} className="w-full flex items-center gap-3 h-14 px-4 text-sm text-left">
                    <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
                    <span className="flex-1">{id ? 'Tampilan' : 'Appearance'}</span>
                    <span className="text-muted-foreground">{theme === 'dark' ? (id ? 'Gelap' : 'Dark') : (id ? 'Terang' : 'Light')}</span>
                  </button>
                  <button type="button" onClick={() => setLocale(id ? 'en' : 'id')} className="w-full flex items-center gap-3 h-14 px-4 text-sm text-left">
                    <Icon name="globe" size={18} />
                    <span className="flex-1">{id ? 'Bahasa' : 'Language'}</span>
                    <span className="text-muted-foreground">{id ? 'Indonesia' : 'English'}</span>
                  </button>
                  {user && (
                    <button type="button" onClick={() => signOut()} className="w-full flex items-center gap-3 h-14 px-4 text-sm text-left text-destructive">
                      <Icon name="logOut" size={18} />
                      <span className="flex-1">{id ? 'Keluar' : 'Sign out'}</span>
                      <span className="text-muted-foreground truncate max-w-[45%]">{user.email}</span>
                    </button>
                  )}
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
