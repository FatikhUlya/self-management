'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Icon } from '../ui/Icon';
import { NAV_ITEMS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

export function Topbar() {
  const pathname = usePathname();
  const { state, setSelectedDate, isDbConnected } = useLifeOS();
  const { locale, setLocale, t } = useI18n();

  // Find active navigation item based on path
  const activeNavItem = NAV_ITEMS.find((item) => item.path === pathname) || NAV_ITEMS[0];

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDate(e.target.value);
    }
  };

  const toggleLanguage = () => {
    setLocale(locale === 'id' ? 'en' : 'id');
  };

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-life-line bg-[#0a0e17]/40 backdrop-blur-md py-4 px-6 sticky top-0 z-30 select-none">
      <div>
        <p className="text-[10px] text-life-muted font-black uppercase tracking-widest">
          {t(activeNavItem.labelKey)}
        </p>
        <h2 className="text-xl font-black text-life-text mt-0.5 tracking-tight">
          {t(`nav_${activeNavItem.id}` as any)} {t('app_name')}
        </h2>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {/* Supabase Connection Status Badge */}
        <div 
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${
            isDbConnected 
              ? 'bg-life-teal-soft/10 border-life-teal/30 text-teal-300' 
              : 'bg-white/[0.02] border-life-line text-life-muted'
          }`}
          title={isDbConnected ? t('settings_supabase_connected') : t('settings_supabase_disconnected')}
        >
          <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-teal-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className="hidden lg:inline">{isDbConnected ? 'Cloud' : 'Local'}</span>
        </div>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-life-line text-life-muted hover:text-life-text active:scale-[0.98] transition-all duration-200"
          title={t('settings_language')}
        >
          <Icon name="globe" size={16} />
          <span className="text-xs font-black uppercase ml-1.5">{locale}</span>
        </button>

        {/* Date Selector */}
        <label className="flex items-center space-x-2 border border-life-line bg-white/[0.02] hover:bg-white/[0.04] rounded-lg px-2.5 py-1 text-xs font-semibold text-life-muted transition-all duration-200">
          <Icon name="calendar" size={14} className="text-life-muted" />
          <input
            type="date"
            value={state.selectedDate}
            onChange={handleDateChange}
            className="bg-transparent text-life-text outline-none cursor-pointer text-xs font-bold border-none p-0 focus:ring-0"
          />
        </label>
      </div>
    </header>
  );
}
