import { ReactNode } from 'react';

import { Footer } from '@/features/marketing/components/Footer';
import { TopBar } from '@/features/marketing/components/TopBar';
import { Locale } from '@/i18n/routing';
import { getCurrentMemberProfileForPage } from '@/server/member-page';

export default async function MarketingLayout(props: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;
  let isAuthenticated = false;
  try {
    const profile = await getCurrentMemberProfileForPage();
    isAuthenticated = profile !== null;
  } catch {
    // auth check failure should not break public pages
  }

  return (
    <div className="min-h-screen bg-white text-zinc-950 dark:bg-[#121212] dark:text-white">
      <TopBar locale={locale} isAuthenticated={isAuthenticated} />
      <main id="content">{props.children}</main>
      <Footer locale={locale} />
    </div>
  );
}
