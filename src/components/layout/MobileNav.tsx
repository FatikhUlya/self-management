'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  // Bottom bar primary 4 items
  const mainBarItems = [
    NAV_ITEMS.find(item => item.id === 'dashboard')!,
    NAV_ITEMS.find(item => item.id === 'capture')!,
    NAV_ITEMS.find(item => item.id === 'journal')!,
    NAV_ITEMS.find(item => item.id === 'habits')!,
  ].filter(Boolean);

  return (
    <>
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-life-bg/90 backdrop-blur-xl border-t border-life-line flex justify-around items-center py-2 px-1 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
        aria-label="Navigasi bawah mobile"
      >
        {mainBarItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-extrabold uppercase transition-all duration-200 ${
                isActive 
                  ? 'text-life-teal' 
                  : 'text-life-muted hover:text-life-text'
              }`}
            >
              <Icon 
                name={item.icon} 
                size={18} 
                className={isActive ? 'text-life-teal' : 'text-life-muted'} 
              />
              <span className="mt-1 tracking-wider text-[8px]">{t(item.labelKey)}</span>
            </Link>
          );
        })}

        {/* More Menu Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-extrabold uppercase transition-all duration-200 ${
            isOpen ? 'text-life-teal' : 'text-life-muted hover:text-life-text'
          }`}
        >
          <Icon 
            name={isOpen ? 'x' : 'menu'} 
            size={18} 
            className={`transition-all duration-300 ${isOpen ? 'rotate-90 text-life-teal' : 'text-life-muted'}`} 
          />
          <span className="mt-1 tracking-wider text-[8px]">{isOpen ? 'Tutup' : 'Lainnya'}</span>
        </button>
      </nav>

      {/* Bottom Sheet Backdrop */}
      <div 
        className={`md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Bottom Sheet Panel (Swipe-up/Slide-up Menu) */}
      <div 
        className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-life-bg/95 backdrop-blur-xl border-t border-white/[0.08] rounded-t-3xl px-6 pb-20 pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.7)] transform transition-transform duration-300 ease-out max-h-[75vh] overflow-y-auto ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Grab Handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <h3 className="text-xs font-black text-life-muted uppercase tracking-widest text-center mb-6">
          Semua Fitur Life OS
        </h3>

        {/* Grid of all 12 items */}
        <div className="grid grid-cols-3 gap-y-5 gap-x-4 pb-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex flex-col items-center p-3.5 rounded-xl border transition-all duration-200 active:scale-95 ${
                  isActive 
                    ? 'bg-life-teal-soft/10 border-life-teal/40 text-life-teal' 
                    : 'bg-white/[0.01] border-white/[0.03] text-life-muted hover:text-life-text hover:border-white/[0.08]'
                }`}
              >
                <Icon 
                  name={item.icon} 
                  size={20} 
                  className={isActive ? 'text-life-teal' : 'text-life-muted'} 
                />
                <span className="mt-2 text-[9px] font-bold text-center tracking-wide">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
