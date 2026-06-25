import { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { Footer } from '@/features/marketing/components/Footer';
import { TopBar } from '@/features/marketing/components/TopBar';
import { Locale } from '@/i18n/routing';
import {
  getCurrentPagePathname,
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

  if (!profile.onboardingComplete && !onboardingRoute) {
    redirect(`/${locale}/m/onboarding`);
  }

  if (profile.onboardingComplete && onboardingRoute) {
    redirect(`/${locale}/m/dashboard?tab=details`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-950 dark:bg-[#09090b] dark:text-white">
      <div className="kclub-noise pointer-events-none fixed inset-0 opacity-30" />
      <TopBar locale={locale} isAuthenticated />

      <main id="content" className="relative z-10 flex-1">
        <div className="container">{props.children}</div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
