'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { MEMBER_API_ROUTES } from '@kclub/contracts';
import { Spinner } from '@kclub/ui';

import { parseAuthResponse } from '@/features/auth/utils/api';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';

type Props = {
  locale: string;
};

export function UpgradeToVipButton({ locale: _locale }: Props) {
  const t = useTranslations('member.dashboard.subscription');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(MEMBER_API_ROUTES.SUBSCRIPTION_CHECKOUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseAuthResponse<{ checkoutUrl: string }>(response);

      if (!result.success || !result.data?.checkoutUrl) {
        toast.error(t('checkoutError'));
        return;
      }

      window.location.href = result.data.checkoutUrl;
    } catch {
      toast.error(t('checkoutError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CabinetButton
      type="button"
      onClick={handleUpgrade}
      disabled={isLoading}
      fullWidth
      density="large"
      iconStart={isLoading ? <Spinner size={13} /> : null}
    >
      {isLoading ? t('vipUpgrading') : t('vipCta')}
    </CabinetButton>
  );
}
