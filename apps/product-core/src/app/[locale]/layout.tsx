import { ReactNode } from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import '@kclub/ui/styles/tokens.css';
import '../globals.css';

import { Toaster } from 'sonner';
import { SkipLink, cn } from '@kclub/ui';
import { Footer } from '@/features/marketing/components/Footer';
import { getSiteUrl } from '@/features/public/public-page-helpers';
import { ThemeProvider } from '@/features/marketing/components/ThemeProvider';
import { TopBar } from '@/features/marketing/components/TopBar';
import { isLocale, Locale } from '@/i18n/routing';
import { titilliumWeb } from '@/lib/fonts';
import { getCurrentMemberProfileForPage } from '@/server/member-page';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
};

export default async function LocaleLayout(props: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale = params.locale as Locale;

  const messages = await getMessages();

  let isAuthenticated = false;
  try {
    const profile = await getCurrentMemberProfileForPage();
    isAuthenticated = profile !== null;
  } catch {
    // auth check failure should not break public pages
  }

  return (
    <html lang={params.locale} suppressHydrationWarning>
      <head>
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={cn(
          titilliumWeb.variable,
          titilliumWeb.className,
          'flex min-h-screen flex-col bg-white font-sans text-zinc-950 antialiased dark:bg-[#09090b] dark:text-white',
        )}
        suppressHydrationWarning
      >
        <SkipLink />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <TopBar locale={locale} isAuthenticated={isAuthenticated} />
            <main id="content" className="relative z-10 flex-1">
              {props.children}
            </main>
            <Footer locale={locale} />
            <Toaster position="top-center" richColors closeButton />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
