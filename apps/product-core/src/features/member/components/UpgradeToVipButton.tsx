'use client';

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MEMBER_API_ROUTES } from '@kclub/contracts';
import { getButtonClasses, Spinner } from '@kclub/ui';

import { parseAuthResponse } from '@/features/auth/utils/api';
import { Alert, AlertDescription } from '@/components/reui/alert';

type Props = {
  locale: string;
};

export function UpgradeToVipButton({ locale: _locale }: Props) {
  const t = useTranslations('member.dashboard.subscription');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(MEMBER_API_ROUTES.SUBSCRIPTION_CHECKOUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await parseAuthResponse<{ checkoutUrl: string }>(response);

      if (!result.success || !result.data?.checkoutUrl) {
        setError(t('checkoutError'));
        return;
      }

      window.location.href = result.data.checkoutUrl;
    } catch {
      setError(t('checkoutError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
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
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
