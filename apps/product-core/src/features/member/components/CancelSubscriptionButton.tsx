'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { parseAuthResponse } from '@/features/auth/utils/api';

type Props = {
  subscriptionId: string;
};

export function CancelSubscriptionButton({ subscriptionId }: Props) {
  const t = useTranslations('member.dashboard.subscription');
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleCancel = async () => {
    if (!confirm(t('cancelConfirm'))) return;

    setIsPending(true);
    try {
      const res = await fetch(`/api/v1/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
      });
      const result = await parseAuthResponse(res);

      if (!result.success) {
        toast.error(t('cancelError'));
        return;
      }

      toast.success(t('cancelSuccess'));
      router.refresh();
    } catch {
      toast.error(t('cancelError'));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isPending}
      className="mt-3 w-full text-center text-xs text-muted underline-offset-2 transition hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? t('cancelPending') : t('cancelCta')}
    </button>
  );
}
