import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { Locale } from '@/i18n/routing';

export default async function AuthLayout(props: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={{ auth: messages.auth }}>
      <div className="relative min-h-screen overflow-hidden bg-white text-zinc-950 dark:bg-[#09090b] dark:text-white">
        <div className="kclub-noise pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,0,48,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_30%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,0,48,0.22),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_26%)]" />

        <nav className="kclub-shell relative z-10 py-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-zinc-900 dark:text-white/40 dark:hover:text-white"
          >
            <ArrowLeft size={14} aria-hidden />
            Home
          </Link>
        </nav>

        <main
          id="content"
          className="relative z-10 flex min-h-[calc(100vh-6rem)] items-center py-10 sm:py-14"
        >
          <div className="kclub-shell w-full">{props.children}</div>
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
