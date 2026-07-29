import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { Footer } from '@/features/marketing/components/Footer';
import { TopBar } from '@/features/marketing/components/TopBar';
import { Locale } from '@/i18n/routing';
import {
  getCurrentPagePathname,
  hasSkippedOnboarding,
  isOnboardingPath,
  requireCurrentMember,
} from '@/server/member-page';

export default async function MemberLayout(props: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;
  const pathname = await getCurrentPagePathname();
  const profile = await requireCurrentMember(locale);
  const onboardingRoute = isOnboardingPath(pathname);
  const skippedOnboarding = await hasSkippedOnboarding();

  if (!profile.onboardingComplete && !onboardingRoute && !skippedOnboarding) {
    redirect(`/${locale}/m/onboarding`);
  }

  if (profile.onboardingComplete && onboardingRoute) {
    redirect(`/${locale}/m/dashboard?tab=details`);
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider
      messages={{ auth: messages.auth, home: messages.home, member: messages.member }}
    >
      <TopBar locale={locale} isAuthenticated />
      <main id="content" className="container flex-1">
        {props.children}
      </main>
      <Footer locale={locale} />
    </NextIntlClientProvider>
  );
}
