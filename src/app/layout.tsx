import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';
import { ClientLayout } from '@/components/layout/ClientLayout';

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Life OS — Personal Command Center',
  description: 'Your modern personal operating system for life management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="id" 
      className={`${sansFont.variable} ${monoFont.variable}`} 
      suppressHydrationWarning
    >
      <body className="font-sans antialiased text-zinc-700 dark:text-zinc-300 selection:bg-primary/20 selection:text-primary">
        <AppProviders>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AppProviders>
      </body>
    </html>
  );
}
