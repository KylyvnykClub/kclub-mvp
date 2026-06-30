import { ReactNode } from 'react';
import { Locale } from '@/i18n/routing';

export default async function MarketingLayout(props: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  return <>{props.children}</>;
}
