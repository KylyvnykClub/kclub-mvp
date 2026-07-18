import { redirect } from 'next/navigation';

import type { Locale } from '@/i18n/routing';

export default async function CheckoutCancelPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/m/dashboard?tab=billing`);
}
