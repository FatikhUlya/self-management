'use client';

import React from 'react';
import { useLifeOS } from '@/lib/hooks/useLifeOSState';
import { useI18n } from '@/lib/i18n/context';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { isGoogleCalendarConfigured } from '@/lib/google-calendar';

export default function SettingsPage() {
  const { 
    state, 
    setDisplayMode, 
    isDbConnected
  } = useLifeOS();
  const { locale, setLocale, t } = useI18n();

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lifeos_backup_${state.selectedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-400 to-slate-600 dark:from-zinc-300 dark:to-slate-500 flex items-center gap-2">
            <Icon name="settings" size={28} className="text-zinc-500" />
            {t('settings_title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
            Konfigurasi tampilan aplikasi, koneksi Supabase, Google Calendar, dan ekspor/impor data.
          </p>
        </div>
      </div>

      {/* Display Mode Selection */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-6">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('settings_display_mode')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {t('settings_display_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setDisplayMode('auto')}
            className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
              state.displayMode === 'auto'
                ? 'bg-life-teal-soft/10 border-life-teal text-life-text'
                : 'bg-white/[0.01] border-life-line hover:border-life-line-strong text-life-muted hover:text-life-text'
            }`}
          >
            <Icon name="layout" size={20} className="mt-0.5 shrink-0" />
            <div>
              <strong className="text-sm font-bold block">{t('settings_auto')}</strong>
              <span className="text-[10px] leading-normal font-medium mt-1 block">
                {t('settings_auto_desc')}
              </span>
            </div>
          </button>

          <button
            onClick={() => setDisplayMode('desktop')}
            className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
              state.displayMode === 'desktop'
                ? 'bg-life-teal-soft/10 border-life-teal text-life-text'
                : 'bg-white/[0.01] border-life-line hover:border-life-line-strong text-life-muted hover:text-life-text'
            }`}
          >
            <Icon name="folder" size={20} className="mt-0.5 shrink-0" />
            <div>
              <strong className="text-sm font-bold block">{t('settings_desktop')}</strong>
              <span className="text-[10px] leading-normal font-medium mt-1 block">
                {t('settings_desktop_desc')}
              </span>
            </div>
          </button>

          <button
            onClick={() => setDisplayMode('mobile')}
            className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
              state.displayMode === 'mobile'
                ? 'bg-life-teal-soft/10 border-life-teal text-life-text'
                : 'bg-white/[0.01] border-life-line hover:border-life-line-strong text-life-muted hover:text-life-text'
            }`}
          >
            <Icon name="journal" size={20} className="mt-0.5 shrink-0" />
            <div>
              <strong className="text-sm font-bold block">{t('settings_mobile')}</strong>
              <span className="text-[10px] leading-normal font-medium mt-1 block">
                {t('settings_mobile_desc')}
              </span>
            </div>
          </button>
        </div>
      </Surface>

      {/* Language Switcher */}
      <Surface className="p-6">
        <div className="border-b border-life-line pb-3 mb-6">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            {t('settings_language')}
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            {t('settings_language_desc')}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setLocale('id')}
            className={`flex-1 py-3 px-4 rounded-xl border text-center font-bold text-sm transition-all ${
              locale === 'id'
                ? 'bg-life-teal-soft/10 border-life-teal text-teal-300'
                : 'bg-white/[0.01] border-life-line hover:bg-white/[0.03] text-life-muted hover:text-life-text'
            }`}
          >
            🇮🇩 Bahasa Indonesia
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`flex-1 py-3 px-4 rounded-xl border text-center font-bold text-sm transition-all ${
              locale === 'en'
                ? 'bg-life-teal-soft/10 border-life-teal text-teal-300'
                : 'bg-white/[0.01] border-life-line hover:bg-white/[0.03] text-life-muted hover:text-life-text'
            }`}
          >
            🇬🇧 English
          </button>
        </div>
      </Surface>

      {/* Connection Status Panel */}
      <Surface className="p-6 space-y-4">
        <div className="border-b border-life-line pb-3">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            Koneksi Database & Integrasi
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            Status modul sinkronisasi eksternal
          </p>
        </div>

        <div className="space-y-3">
          {/* Supabase status */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.01] border border-life-line">
            <div className="flex items-center space-x-3">
              <Icon name="briefcase" size={18} className="text-life-teal" />
              <div>
                <strong className="text-xs text-life-text block">Supabase DB Backend</strong>
                <span className="text-[10px] text-life-muted">Sinkronisasi otomatis real-time</span>
              </div>
            </div>
            <Badge tone={isDbConnected ? 'teal' : 'gray'}>
              {isDbConnected ? 'Tersinkronisasi' : t('settings_supabase_disconnected')}
            </Badge>
          </div>

          {/* Google Calendar status */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-white/[0.01] border border-life-line">
            <div className="flex items-center space-x-3">
              <Icon name="calendar" size={18} className="text-life-amber" />
              <div>
                <strong className="text-xs text-life-text block">Google Calendar API</strong>
                <span className="text-[10px] text-life-muted">Sinkronisasi jadwal 2 arah</span>
              </div>
            </div>
            <Badge tone={isGoogleCalendarConfigured() ? 'amber' : 'gray'}>
              {isGoogleCalendarConfigured() ? t('settings_google_connected') : t('settings_google_disconnected')}
            </Badge>
          </div>
        </div>
      </Surface>

      {/* Data Administration */}
      <Surface className="p-6 space-y-4">
        <div className="border-b border-life-line pb-3">
          <h3 className="text-sm font-bold text-life-text uppercase tracking-wider">
            Cadangan Data
          </h3>
          <p className="text-xs text-life-muted mt-0.5">
            Unduh salinan cadangan seluruh data kamu
          </p>
        </div>

        <div className="flex gap-4">
          <Button 
            className="flex-1" 
            variant="secondary" 
            icon="plus" 
            onClick={handleExportData}
          >
            {t('settings_export')} JSON
          </Button>
        </div>
      </Surface>
    </div>
  );
}
