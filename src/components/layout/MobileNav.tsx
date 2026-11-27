'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { slideUp } from '@/lib/animations';

export function MobileNav() {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const mainBarItems = [
    NAV_ITEMS.find((item) => item.id === 'dashboard'),
    NAV_ITEMS.find((item) => item.id === 'projects'),
    NAV_ITEMS.find((item) => item.id === 'planning'),
    NAV_ITEMS.find((item) => item.id === 'finance'),
  ].filter(Boolean) as (typeof NAV_ITEMS)[number][];

  const sectionLabels: Record<string, { id: string; en: string }> = {
    core: { id: 'Utama', en: 'Core' },
    productivity: { id: 'Produktivitas', en: 'Productivity' },
    wellness: { id: 'Kesehatan & Diri', en: 'Wellness' },
    growth: { id: 'Karier & Finansial', en: 'Growth' },
    system: { id: 'Pengaturan', en: 'System' },
  };

  const sections = ['core', 'productivity', 'wellness', 'growth', 'system'] as const;

  return (
    <>
      {/* ═══════════════ Thumb Zone Bottom Navigation ═══════════════ */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-2 bg-card/95 backdrop-blur-md border-t border-border h-16 pb-safe shadow-lg select-none"
        aria-label="Navigasi bawah mobile"
      >
        {mainBarItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.id}
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] py-1 text-xs font-medium transition-colors touch-manipulation',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-zinc-500 hover:text-foreground active:text-primary'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'text-zinc-500'
                )}
              >
                <Icon name={item.icon} size={18} />
              </div>
              <span className="text-[11px] tracking-tight mt-0.5 truncate max-w-[64px]">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}

        {/* More Menu Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Tutup Menu Navigasi' : 'Buka Semua Menu Fitur'}
          aria-expanded={isOpen}
          aria-controls="mobile-drawer-sheet"
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] py-1 text-xs font-medium transition-colors touch-manipulation',
            isOpen
              ? 'text-primary font-semibold'
              : 'text-zinc-500 hover:text-foreground active:text-primary'
          )}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isOpen ? 'bg-primary/10 text-primary' : 'text-zinc-500'
            )}
          >
            <Icon name={isOpen ? 'x' : 'menu'} size={18} />
          </div>
          <span className="text-[11px] tracking-tight mt-0.5">
            {isOpen ? 'Tutup' : 'Lainnya'}
          </span>
        </button>
      </nav>

      {/* ═══════════════ Slide-Up Bottom Sheet / Drawer ═══════════════ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsOpen(false)}
            />

            {/* Bottom Sheet Panel */}
            <motion.div
              id="mobile-drawer-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-drawer-title"
              key="mobile-sheet"
              variants={slideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pb-24 pt-3.5 max-h-[85vh] overflow-y-auto bg-card border-t border-border shadow-2xl space-y-5"
            >
              {/* Grab Handle */}
              <div className="w-12 h-1.5 rounded-full mx-auto bg-zinc-300 dark:bg-zinc-700 shrink-0" />

              <div className="text-center">
                <h3 id="mobile-drawer-title" className="text-sm font-semibold tracking-[-0.015em] text-foreground">
                  Semua Fitur Life OS
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Navigasi cepat ke seluruh modul operasional
                </p>
              </div>

              {/* Grouped Modules */}
              <div className="space-y-4">
                {sections.map((sectionKey) => {
                  const items = (NAV_ITEMS as readonly any[]).filter(
                    (item) => (item.section || 'core') === sectionKey
                  );
                  if (items.length === 0) return null;

                  const label = sectionLabels[sectionKey]?.[locale === 'id' ? 'id' : 'en'] || sectionKey;

                  return (
                    <div key={sectionKey} className="space-y-2">
                      <span className="text-[11px] font-medium text-zinc-500 block px-1">
                        {label}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {items.map((item) => {
                          const isActive =
                            pathname === item.path ||
                            (item.path !== '/' && pathname.startsWith(item.path));

                          return (
                            <Link
                              key={item.id}
                              href={item.path}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-xl border transition-colors min-h-[48px] touch-manipulation active:scale-[0.98]',
                                isActive
                                  ? 'bg-primary/10 border-primary/25 text-primary font-semibold shadow-xs'
                                  : 'bg-muted/30 border-border text-foreground hover:bg-muted/60'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                )}
                              >
                                <Icon name={item.icon} size={16} />
                              </div>
                              <span className="text-xs font-medium truncate">
                                {t(item.labelKey)}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
