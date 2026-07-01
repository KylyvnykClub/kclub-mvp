'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MEMBER_API_ROUTES } from '@kclub/contracts';
import { Spinner } from '@kclub/ui';

import { parseAuthResponse } from '@/features/auth/utils/api';
import { Button } from '@/components/ui/button';
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
      <Button
        onClick={handleUpgrade}
        disabled={isLoading}
        className="w-full gap-2 rounded-none border-0 bg-accent px-5 py-3.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading && <Spinner size={13} />}
        {isLoading ? t('vipUpgrading') : t('vipCta')}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
