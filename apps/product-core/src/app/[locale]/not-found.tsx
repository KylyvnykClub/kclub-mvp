import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button, PageState } from '@kclub/ui';
import { defaultLocale, Locale } from '@/i18n/routing';

export default async function NotFound(props: { params?: Promise<{ locale: Locale }> }) {
  const locale = props.params ? (await props.params).locale : defaultLocale;
  const t = await getTranslations({ locale, namespace: 'home' });

  return (
    <PageState
      icon={<FileQuestion aria-hidden="true" size={48} strokeWidth={1.5} />}
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
      action={
        <Link href={`/${locale}`}>
          <Button color="primary">{t('cta.button')}</Button>
        </Link>
      }
    />
  );
}
