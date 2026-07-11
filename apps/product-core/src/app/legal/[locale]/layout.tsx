import { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import '@kclub/ui/styles/tokens.css';
import '../../globals.css';

import { ThemeProvider } from '@/features/marketing/components/ThemeProvider';
import { isLocale, Locale } from '@/i18n/routing';
import { titilliumWeb } from '@/lib/fonts';

export default async function LegalLayout(props: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale = params.locale as Locale;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${titilliumWeb.variable} ${titilliumWeb.className} min-h-screen bg-white font-sans text-zinc-950 antialiased dark:bg-[#09090b] dark:text-white`}
        suppressHydrationWarning
      >
        <ThemeProvider>{props.children}</ThemeProvider>
      </body>
    </html>
  );
}
