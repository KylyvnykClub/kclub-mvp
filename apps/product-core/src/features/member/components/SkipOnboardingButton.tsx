'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@kclub/ui';
import { MEMBER_API_ROUTES } from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';

export function SkipOnboardingButton({ locale }: { locale: Locale }) {
  const t = useTranslations('member.onboarding');
  const router = useRouter();
  const [isSkipping, setIsSkipping] = useState(false);

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await fetch(MEMBER_API_ROUTES.SKIP_ONBOARDING, { method: 'POST' });
    } finally {
      router.replace(`/${locale}/m/dashboard?tab=overview`);
      router.refresh();
    }
  };

  return (
    <Button
      type="button"
      color="outline"
      size="sm"
      onClick={handleSkip}
      disabled={isSkipping}
      data-testid="onboarding-skip"
    >
      {isSkipping ? t('skipping') : t('skip')}
      <ArrowRight aria-hidden="true" size={14} strokeWidth={1.7} />
    </Button>
  );
}
