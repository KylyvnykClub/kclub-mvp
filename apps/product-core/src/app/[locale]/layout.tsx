import { ReactNode } from 'react';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

import '@kclub/ui/styles/tokens.css';
import '../globals.css';

import { SkipLink, cn } from '@kclub/ui';
import { ThemeProvider } from '@/features/marketing/components/ThemeProvider';
import { isLocale } from '@/i18n/routing';
import { titilliumWeb } from '@/lib/fonts';

export default async function LocaleLayout(props: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  const messages = await getMessages();

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
          'min-h-screen bg-white font-sans text-zinc-900 antialiased dark:bg-[#121212] dark:text-white',
        )}
        suppressHydrationWarning
      >
        <SkipLink />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>{props.children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
