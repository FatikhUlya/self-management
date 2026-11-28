'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickAddTransaction } from '@/components/finance/QuickAddTransaction';
import { NotificationBanner } from '@/components/ui/NotificationBanner';
import { LinkSync } from '@/lib/hooks/useLinks';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Public pages (feedback form) render without app chrome.
  if (pathname?.startsWith('/f/')) {
    return <div className="min-h-screen w-full flex flex-col overflow-x-hidden">{children}</div>;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main
          id="main"
          className="flex-1 min-w-0 pb-[calc(var(--mobile-nav-h)+env(safe-area-inset-bottom))] md:pb-10"
        >
          <NotificationBanner />
          <div className="px-4 pt-2 pb-6 md:px-8 md:pt-2 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

      <MobileNav />
      <QuickAddTransaction />
      <LinkSync />
    </div>
  );
}
