import { getTranslations } from 'next-intl/server';

import { Surface, textMuted } from '@kclub/ui';

import type { Locale } from '@/i18n/routing';
import { requireCurrentMember } from '@/server/member-page';
import { OnboardingForm } from '@/features/member/components/OnboardingForm';
import { SkipOnboardingButton } from '@/features/member/components/SkipOnboardingButton';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'member.onboarding' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function OnboardingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const profile = await requireCurrentMember(locale);
  const t = await getTranslations({ locale, namespace: 'member.onboarding' });

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Surface className="kclub-panel max-w-none rounded-none px-6 py-8 shadow-none ring-0 sm:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="kclub-section-label">{t('eyebrow')}</p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white">
              {t('title')}
            </h1>
            <p className={`mt-3 ${textMuted}`}>{t('description')}</p>
          </div>
          <SkipOnboardingButton locale={locale} />
        </div>
        <OnboardingForm locale={locale} profile={profile} />
      </Surface>
    </div>
  );
}
