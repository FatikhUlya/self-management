import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';
import { ClientLayout } from '@/components/layout/ClientLayout';

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
 <html lang="id" suppressHydrationWarning>
 <head>
 <link rel="preconnect" href="https://fonts.googleapis.com" />
 <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
 <link
 href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
 rel="stylesheet"
 />
 </head>
 <body className="font-sans antialiased selection:bg-primary/20 selection:text-primary">
 <AppProviders>
 <ClientLayout>
 {children}
 </ClientLayout>
 </AppProviders>
 </body>
 </html>
 );
}
