'use client';

import { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n/context';
import { LifeOSProvider, useLifeOS } from '@/lib/hooks/useLifeOSState';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingSkeleton() {
 return (
 <div className="flex min-h-screen w-full bg-background text-foreground">
 {/* Sidebar Skeleton — desktop only */}
 <aside className="hidden md:flex flex-col w-60 h-screen shrink-0 py-5 px-3 border-r border-border bg-card">
 {/* Brand */}
 <div className="flex items-center gap-2.5 px-2 mb-8">
 <Skeleton className="w-8 h-8 rounded-lg" />
 <div className="space-y-1.5">
 <Skeleton className="h-3.5 w-16 rounded" />
 <Skeleton className="h-2.5 w-20 rounded" />
 </div>
 </div>
 {/* Nav items */}
 <div className="space-y-1">
 {Array.from({ length: 10 }).map((_, i) => (
 <div key={i} className="flex items-center gap-2.5 px-2.5 py-2">
 <Skeleton className="w-4 h-4 rounded" />
 <Skeleton className="h-3 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
 </div>
 ))}
 </div>
 </aside>

 {/* Main Content Skeleton */}
 <div className="flex-1 flex flex-col min-w-0">
 {/* Topbar */}
 <header className="flex items-center justify-between py-3 px-6 border-b border-border bg-card/80">
 <div className="space-y-1.5">
 <Skeleton className="h-2.5 w-20 rounded" />
 <Skeleton className="h-5 w-36 rounded" />
 </div>
 <div className="flex items-center gap-2">
 <Skeleton className="h-7 w-16 rounded-md" />
 <Skeleton className="h-7 w-7 rounded-md" />
 <Skeleton className="h-7 w-14 rounded-md" />
 <Skeleton className="h-7 w-28 rounded-md" />
 </div>
 </header>

 {/* Page Content */}
 <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full">
 {/* Header */}
 <div className="flex items-center gap-3 mb-6">
 <Skeleton className="w-8 h-8 rounded-lg" />
 <div className="space-y-1.5">
 <Skeleton className="h-6 w-48 rounded" />
 <Skeleton className="h-3 w-64 rounded" />
 </div>
 </div>

 {/* Metric cards row */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
 {Array.from({ length: 4 }).map((_, i) => (
 <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3.5">
 <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
 <div className="flex-1 space-y-1.5">
 <Skeleton className="h-3 w-20 rounded" />
 <Skeleton className="h-6 w-12 rounded" />
 <Skeleton className="h-2.5 w-24 rounded" />
 </div>
 </div>
 ))}
 </div>

 {/* Two column widgets */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 {/* Large widget */}
 <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-4">
 <div className="flex justify-between items-center border-b border-border/80 pb-3">
 <div className="space-y-1.5">
 <Skeleton className="h-3 w-28 rounded" />
 <Skeleton className="h-2.5 w-36 rounded" />
 </div>
 <Skeleton className="h-8 w-20 rounded-md" />
 </div>
 <div className="space-y-2">
 {Array.from({ length: 4 }).map((_, i) => (
 <Skeleton key={i} className="h-10 w-full rounded-md" />
 ))}
 </div>
 </div>
 {/* Small widget */}
 <div className="rounded-xl border border-border bg-card p-6 space-y-4">
 <div className="space-y-1.5 border-b border-border/80 pb-3">
 <Skeleton className="h-3 w-24 rounded" />
 <Skeleton className="h-2.5 w-32 rounded" />
 </div>
 <div className="space-y-3">
 <Skeleton className="h-9 w-full rounded-md" />
 <div className="grid grid-cols-2 gap-2.5">
 <Skeleton className="h-9 w-full rounded-md" />
 <Skeleton className="h-9 w-full rounded-md" />
 </div>
 <Skeleton className="h-16 w-full rounded-md" />
 <Skeleton className="h-9 w-full rounded-md" />
 </div>
 </div>
 </div>
 </main>
 </div>
 </div>
 );
}

function AuthGate({ children }: { children: ReactNode }) {
 const { loading } = useLifeOS();

 if (loading) {
 return <LoadingSkeleton />;
 }

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
