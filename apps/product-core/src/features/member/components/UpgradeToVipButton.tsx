'use client';

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { MEMBER_API_ROUTES } from '@kclub/contracts';
import { getButtonClasses, Spinner } from '@kclub/ui';

import { parseAuthResponse } from '@/features/auth/utils/api';

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
    <button
      onClick={handleUpgrade}
      disabled={isLoading}
      className={getButtonClasses({
        color: 'brand',
        size: 'md',
        fullWidth: true,
        className: 'flex h-14 shrink-0 disabled:cursor-not-allowed disabled:opacity-60',
      })}
    >
      {isLoading ? <Spinner size={13} /> : null}
      {isLoading ? t('vipUpgrading') : t('vipCta')}
      {!isLoading ? <ArrowUpRight aria-hidden="true" size={18} /> : null}
    </button>
  );
}
