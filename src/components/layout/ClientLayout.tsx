'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickAddTransaction } from '@/components/finance/QuickAddTransaction';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // If we are on a public route, don't render the sidebar/topbar
  if (pathname?.startsWith('/f/')) {
    return <div className="min-h-screen bg-life-bg text-life-text w-full flex flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-life-bg text-life-text w-full">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Topbar */}
        <Topbar />
        
        {/* Content viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Navigation bar */}
      <MobileNav />

      {/* Global Quick Add Transaction */}
      <QuickAddTransaction />
    </div>
  );
}
