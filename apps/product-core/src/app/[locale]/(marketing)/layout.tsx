import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { Footer } from '@/features/marketing/components/Footer';
import { TopBar } from '@/features/marketing/components/TopBar';
import { Locale } from '@/i18n/routing';

export default async function MarketingLayout(props: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={{ home: messages.home }}>
      <TopBar locale={locale} />
      <main id="content" className="relative z-10 flex-1">
        {props.children}
      </main>
      <Footer locale={locale} />
    </NextIntlClientProvider>
  );
}
