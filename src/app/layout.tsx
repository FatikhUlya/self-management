import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';
import { ClientLayout } from '@/components/layout/ClientLayout';

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
          <ClientLayout>
            {children}
          </ClientLayout>
        </AppProviders>
      </body>
    </html>
  );
}
