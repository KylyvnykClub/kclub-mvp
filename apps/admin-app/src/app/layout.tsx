import '@kclub/ui/styles/tokens.css';
import './globals.css';

import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { AppProviders } from '@/components/app-providers';
import { Geist } from 'next/font/google';
import { SkipLink } from '@kclub/ui';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'KCLUB Admin',
  description: 'Staff dashboard for KCLUB',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn('font-sans', geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SkipLink />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
