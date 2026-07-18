'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { MEMBER_API_ROUTES, buildApiRoute } from '@kclub/contracts';
import { Spinner } from '@kclub/ui';

import { parseAuthResponse } from '@/features/auth/utils/api';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';

type Props = {
  businessId: string;
  locale: string;
};

export function PlacementCheckoutButton({ businessId, locale }: Props) {
  const t = useTranslations('member.dashboard.business');
  const [isLoading, setIsLoading] = useState(false);

  const handlePay = async () => {
    setIsLoading(true);

    try {
      const url =
        buildApiRoute(MEMBER_API_ROUTES.BUSINESS_CHECKOUT_PLACEMENT, { id: businessId }) +
        `?locale=${locale}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseAuthResponse<{ checkoutUrl: string }>(response);

      if (!result.success || !result.data?.checkoutUrl) {
        toast.error(t('invoiceCheckoutError'));
        return;
      }

      window.location.href = result.data.checkoutUrl;
    } catch {
      toast.error(t('invoiceCheckoutError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CabinetButton
      type="button"
      onClick={handlePay}
      disabled={isLoading}
      density="large"
      className="w-full sm:w-auto sm:min-w-36"
      iconStart={isLoading ? <Spinner size={13} /> : null}
    >
      {isLoading ? t('invoicePaying') : t('invoicePayCta')}
    </CabinetButton>
  );
}
