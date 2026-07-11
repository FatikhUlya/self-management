import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileNav } from '@/components/layout/MobileNav';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Life OS — Personal Command Center',
  description: 'Minimalist, dark-mode ready, frictionless personal management dashboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <AppProviders>
          <div className="flex min-h-screen bg-life-bg text-life-text">
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
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
