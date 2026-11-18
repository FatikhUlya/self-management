'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickAddTransaction } from '@/components/finance/QuickAddTransaction';
import { NotificationBanner } from '@/components/ui/NotificationBanner';

export function ClientLayout({ children }: { children: React.ReactNode }) {
 const pathname = usePathname();
 
 if (pathname?.startsWith('/f/')) {
 return (
 <div className="min-h-screen w-full flex flex-col bg-background text-foreground">
 {children}
 </div>
 );
 }

 return (
 <div className="flex min-h-screen w-full relative bg-background text-foreground">
 {/* Sidebar */}
 <div className="z-10 flex">
 <Sidebar />
 </div>
 
 {/* Main Content Workspace */}
 <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 z-10 relative">
 <Topbar />
 
 <main className="flex-1 overflow-y-auto">
 <NotificationBanner />
 <div className="p-5 md:p-8 max-w-7xl mx-auto w-full">
 {children}
 </div>
 </main>
 </div>

 {/* Mobile Navigation bar */}
 <MobileNav />

 {/* Global Quick Add Transaction */}
 <QuickAddTransaction />
 </div>
 );
}
