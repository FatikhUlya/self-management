import type { Metadata } from 'next';
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';
import { ClientLayout } from '@/components/layout/ClientLayout';

const sansFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const displayFont = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['300', '400', '500', '600'],
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--tabular-nums',
  weight: ['400', '500'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f5f8' },
    { media: '(prefers-color-scheme: dark)', color: '#070b14' },
  ],
};

export const metadata: Metadata = {
  title: 'Life OS',
  description: 'Buku kerja pribadi untuk tugas, habit, kesehatan, keuangan dan jurnal.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="id" 
      className={`${sansFont.variable} ${displayFont.variable} ${monoFont.variable}`} 
      suppressHydrationWarning
    >
      <body className="font-sans antialiased selection:bg-blue-200 selection:text-foreground">
        <AppProviders>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AppProviders>
      </body>
    </html>
  );
}
