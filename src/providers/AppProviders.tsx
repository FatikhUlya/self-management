'use client';

import { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n/context';
import { LifeOSProvider, useLifeOS } from '@/lib/hooks/useLifeOSState';

function AuthGate({ children }: { children: ReactNode }) {
  const { loading } = useLifeOS();

  // Show loading screen while silent auth & data loading is resolved
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#0a0a0f] text-white/30 font-black text-[10px] uppercase tracking-widest">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-white/10">
            <span className="text-2xl animate-pulse">🧠</span>
          </div>
          <p className="animate-pulse">Loading Life OS...</p>
        </div>
      </div>
    );
  }

  // User is authenticated (or Supabase not configured = local mode) → show app
  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <LifeOSProvider>
        <AuthGate>
          {children}
        </AuthGate>
      </LifeOSProvider>
    </I18nProvider>
  );
}
