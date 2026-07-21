'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { MEMBER_API_ROUTES } from '@kclub/contracts';
import { Spinner } from '@kclub/ui';

import { parseAuthResponse } from '@/features/auth/utils/api';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';

type Props = {
  businessId: string;
};

export function PlacementCheckoutButton({ businessId }: Props) {
  const t = useTranslations('member.dashboard.business');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      const url = MEMBER_API_ROUTES.BUSINESS_CHECKOUT_PLACEMENT.replace(':id', businessId);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseAuthResponse<{ checkoutUrl: string }>(response);

      if (!result.success || !result.data?.checkoutUrl) {
        toast.error(t('placementCheckoutError'));
        return;
      }

      window.location.href = result.data.checkoutUrl;
    } catch {
      toast.error(t('placementCheckoutError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CabinetButton
      type="button"
      onClick={handleCheckout}
      disabled={isLoading}
      density="large"
      iconStart={isLoading ? <Spinner size={13} /> : null}
    >
      {isLoading ? t('placementCheckoutLoading') : t('placementCheckoutCta')}
    </CabinetButton>
  );
}
