import { notFound } from 'next/navigation';

import { LegalDocument } from '@/features/legal/components/LegalDocument';
import { isLocale, Locale } from '@/i18n/routing';

import { legalDocRegistry, legalSlugs } from '../../content';

export function generateStaticParams() {
  return legalSlugs.map((slug) => ({ slug }));
}

export default async function LegalPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;

  if (!isLocale(locale)) {
    notFound();
  }

  const doc = legalDocRegistry[slug];
  if (!doc) {
    notFound();
  }

  return <LegalDocument doc={doc[locale as Locale]} />;
}
