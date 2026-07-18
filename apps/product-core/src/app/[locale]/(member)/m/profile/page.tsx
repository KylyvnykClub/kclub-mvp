import { redirect } from 'next/navigation';

import type { Locale } from '@/i18n/routing';
import { getDashboardAliasHref } from '@/features/member/dashboard-tabs';

export default async function ProfileAliasPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(getDashboardAliasHref(locale, 'overview'));
}
