'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickAddTransaction } from '@/components/finance/QuickAddTransaction';
import { SerendipityOverlay } from '@/components/ui/SerendipityOverlay';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // If we are on a public route, don't render the sidebar/topbar
  if (pathname?.startsWith('/f/')) {
    return <div className="min-h-screen bg-life-bg text-life-text w-full flex flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-life-bg text-life-text w-full relative">
      {/* Ambient Biome Glow */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-1000 z-0 opacity-40 mix-blend-screen"
        style={{
          background: pathname?.startsWith('/finance') ? 'radial-gradient(circle at 50% -20%, rgba(16,185,129,0.25) 0%, transparent 70%)' :
                      pathname?.startsWith('/health') ? 'radial-gradient(circle at 50% -20%, rgba(244,63,94,0.25) 0%, transparent 70%)' :
                      pathname?.startsWith('/learning') ? 'radial-gradient(circle at 50% -20%, rgba(99,102,241,0.25) 0%, transparent 70%)' :
                      pathname?.startsWith('/projects') ? 'radial-gradient(circle at 50% -20%, rgba(6,182,212,0.25) 0%, transparent 70%)' :
                      pathname?.startsWith('/journal') ? 'radial-gradient(circle at 50% -20%, rgba(139,92,246,0.25) 0%, transparent 70%)' :
                      pathname?.startsWith('/habits') ? 'radial-gradient(circle at 50% -20%, rgba(20,184,166,0.25) 0%, transparent 70%)' :
                      'radial-gradient(circle at 50% -20%, rgba(255,255,255,0.02) 0%, transparent 70%)'
        }}
      />

      {/* Sidebar */}
      <div className="z-10 flex">
        <Sidebar />
      </div>
      
      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 z-10 relative">
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

      {/* Gamification Popups */}
      <SerendipityOverlay />
    </div>
  );
}
