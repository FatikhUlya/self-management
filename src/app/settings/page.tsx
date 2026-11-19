'use client';

import React, { useState } from 'react';
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
  const [copiedStatus, setCopiedStatus] = useState(false);

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `lifeos_backup_${state.selectedDate || new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyDiagnostics = () => {
    const diagnostics = {
      displayMode: state.displayMode,
      locale,
      isDbConnected,
      isGoogleCalendarConfigured: isGoogleCalendarConfigured(),
      counts: {
        tasks: state.tasks.length,
        projects: state.projects.length,
        habits: state.habits.length,
        journals: state.journals.length,
        finances: state.transactions.length,
        goals: state.objectives.length,
        rules: state.selfRules.length,
      },
      exportedAt: new Date().toISOString(),
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-500/10 text-muted-foreground border border-zinc-500/20">
              <Icon name="settings" size={22} />
            </div>
            {t('settings_title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi preferensi tampilan, bahasa sistem, status integrasi cloud, dan pencadangan data lokal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            icon="copy"
            onClick={handleCopyDiagnostics}
          >
            {copiedStatus ? 'Diagnostik Tersalin!' : 'Salin Diagnostik'}
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            icon="plus" 
            onClick={handleExportData}
          >
            {t('settings_export')} JSON
          </Button>
        </div>
      </div>

      {/* Diagnostics / Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Surface className="p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDbConnected ? 'bg-teal-500/10 text-teal-400' : 'bg-muted/40 text-muted-foreground'
          }`}>
            <Icon name="briefcase" size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Supabase DB</div>
            <div className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-teal-400 animate-pulse' : 'bg-zinc-500'}`} />
              {isDbConnected ? t('settings_supabase_connected') : t('settings_supabase_disconnected')}
            </div>
          </div>
        </Surface>

        <Surface className="p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isGoogleCalendarConfigured() ? 'bg-amber-500/10 text-amber-400' : 'bg-muted/40 text-muted-foreground'
          }`}>
            <Icon name="calendar" size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Google Calendar</div>
            <div className="text-sm font-bold text-foreground mt-0.5">
              {isGoogleCalendarConfigured() ? t('settings_google_connected') : t('settings_google_disconnected')}
            </div>
          </div>
        </Surface>

        <Surface className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon name="layout" size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Mode Tampilan</div>
            <div className="text-sm font-bold text-foreground mt-0.5 capitalize">
              {state.displayMode}
            </div>
          </div>
        </Surface>

        <Surface className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <Icon name="globe" size={20} />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Bahasa Antarmuka</div>
            <div className="text-sm font-bold text-foreground mt-0.5">
              {locale === 'id' ? 'Bahasa Indonesia' : 'English'}
            </div>
          </div>
        </Surface>
      </div>

      {/* Display Mode Selection */}
      <Surface className="p-6 space-y-4">
        <div className="border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {t('settings_display_mode')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('settings_display_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setDisplayMode('auto')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
              state.displayMode === 'auto'
                ? 'bg-primary/10 border-primary shadow-sm text-foreground'
                : 'bg-card border-border hover:border-border-strong text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${
              state.displayMode === 'auto' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground'
            }`}>
              <Icon name="layout" size={18} />
            </div>
            <div>
              <strong className="text-sm font-bold block text-foreground">{t('settings_auto')}</strong>
              <span className="text-xs leading-relaxed text-muted-foreground mt-1 block">
                {t('settings_auto_desc')}
              </span>
            </div>
          </button>

          <button
            onClick={() => setDisplayMode('desktop')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
              state.displayMode === 'desktop'
                ? 'bg-primary/10 border-primary shadow-sm text-foreground'
                : 'bg-card border-border hover:border-border-strong text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${
              state.displayMode === 'desktop' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground'
            }`}>
              <Icon name="folder" size={18} />
            </div>
            <div>
              <strong className="text-sm font-bold block text-foreground">{t('settings_desktop')}</strong>
              <span className="text-xs leading-relaxed text-muted-foreground mt-1 block">
                {t('settings_desktop_desc')}
              </span>
            </div>
          </button>

          <button
            onClick={() => setDisplayMode('mobile')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
              state.displayMode === 'mobile'
                ? 'bg-primary/10 border-primary shadow-sm text-foreground'
                : 'bg-card border-border hover:border-border-strong text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className={`p-2 rounded-lg shrink-0 ${
              state.displayMode === 'mobile' ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-muted-foreground'
            }`}>
              <Icon name="journal" size={18} />
            </div>
            <div>
              <strong className="text-sm font-bold block text-foreground">{t('settings_mobile')}</strong>
              <span className="text-xs leading-relaxed text-muted-foreground mt-1 block">
                {t('settings_mobile_desc')}
              </span>
            </div>
          </button>
        </div>
      </Surface>

      {/* Language Switcher */}
      <Surface className="p-6 space-y-4">
        <div className="border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {t('settings_language')}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('settings_language_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setLocale('id')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              locale === 'id'
                ? 'bg-primary/10 border-primary text-foreground'
                : 'bg-card border-border hover:border-border-strong text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇮🇩</span>
              <div>
                <strong className="text-sm font-bold block text-foreground">Bahasa Indonesia</strong>
                <span className="text-xs text-muted-foreground">Bahasa utama aplikasi</span>
              </div>
            </div>
            {locale === 'id' && (
              <span className="p-1 rounded-full bg-primary text-primary-foreground">
                <Icon name="check" size={14} />
              </span>
            )}
          </button>

          <button
            onClick={() => setLocale('en')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              locale === 'en'
                ? 'bg-primary/10 border-primary text-foreground'
                : 'bg-card border-border hover:border-border-strong text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇬🇧</span>
              <div>
                <strong className="text-sm font-bold block text-foreground">English</strong>
                <span className="text-xs text-muted-foreground">International locale</span>
              </div>
            </div>
            {locale === 'en' && (
              <span className="p-1 rounded-full bg-primary text-primary-foreground">
                <Icon name="check" size={14} />
              </span>
            )}
          </button>
        </div>
      </Surface>

      {/* Cloud & External Services Integration */}
      <Surface className="p-6 space-y-4">
        <div className="border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Integrasi Cloud & Layanan Eksternal
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Status modul sinkronisasi database dan kalender pihak ketiga
          </p>
        </div>

        <div className="space-y-3">
          {/* Supabase status */}
          <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5 shrink-0">
                <Icon name="briefcase" size={18} />
              </div>
              <div>
                <strong className="text-sm font-bold text-foreground block">Supabase DB Backend</strong>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sinkronisasi cloud otomatis multi-device secara real-time.
                </p>
              </div>
            </div>
            <Badge tone={isDbConnected ? 'teal' : 'gray'}>
              {isDbConnected ? 'Tersinkronisasi Cloud' : t('settings_supabase_disconnected')}
            </Badge>
          </div>

          {/* Google Calendar status */}
          <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                <Icon name="calendar" size={18} />
              </div>
              <div>
                <strong className="text-sm font-bold text-foreground block">Google Calendar API</strong>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sinkronisasi jadwal dan time block 2 arah dengan Google Calendar.
                </p>
              </div>
            </div>
            <Badge tone={isGoogleCalendarConfigured() ? 'amber' : 'gray'}>
              {isGoogleCalendarConfigured() ? t('settings_google_connected') : t('settings_google_disconnected')}
            </Badge>
          </div>
        </div>
      </Surface>

      {/* Data Administration & Statistics */}
      <Surface className="p-6 space-y-4">
        <div className="border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Manajemen Data & Cadangan
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Statistik repositori lokal dan ekspor berkas JSON lengkap
          </p>
        </div>

        {/* Database counter grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-lg bg-muted/20 border border-border">
            <span className="text-lg font-bold text-foreground block">{state.tasks.length}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Tasks</span>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 border border-border">
            <span className="text-lg font-bold text-foreground block">{state.projects.length}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Projects</span>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 border border-border">
            <span className="text-lg font-bold text-foreground block">{state.habits.length}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Habits</span>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 border border-border">
            <span className="text-lg font-bold text-foreground block">{state.journals.length}</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase">Journals</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10 p-4 rounded-xl border border-border">
          <div>
            <h4 className="text-xs font-bold text-foreground">Ekspor Salinan Cadangan (JSON)</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unduh seluruh snapshot data Life OS Anda ke dalam file JSON terenkode aman.
            </p>
          </div>
          <Button 
            variant="secondary" 
            icon="plus" 
            onClick={handleExportData}
            className="shrink-0 w-full sm:w-auto"
          >
            {t('settings_export')} JSON
          </Button>
        </div>
      </Surface>
    </div>
  );
}
