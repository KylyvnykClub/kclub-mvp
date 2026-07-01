import { ReactNode } from 'react';

import { Locale } from '@/i18n/routing';
import { requireCurrentMember } from '@/server/member-page';

export default async function DirectoryLayout(props: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;
  await requireCurrentMember(locale);

  return <>{props.children}</>;
}
