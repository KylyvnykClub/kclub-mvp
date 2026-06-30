import { ReactNode } from 'react';
import { redirect } from 'next/navigation';

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
    <>
      <div className="container">{props.children}</div>
    </>
  );
}
