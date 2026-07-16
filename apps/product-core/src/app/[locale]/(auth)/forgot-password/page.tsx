import { getTranslations } from 'next-intl/server';

import { PasswordRecoveryForm } from '@/features/auth/components/PasswordRecoveryForm';
import { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.passwordRecovery' });

  return { title: t('title'), description: t('description') };
}

export default async function PasswordRecoveryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return <PasswordRecoveryForm locale={locale} />;
}
