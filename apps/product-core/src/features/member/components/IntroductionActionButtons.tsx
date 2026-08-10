'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';

export function IntroductionActionButtons({
  introductionId,
  labelComplete,
  labelReject,
}: {
  introductionId: string;
  labelComplete: string;
  labelReject: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: 'complete' | 'reject') => {
    setLoading(action);
    try {
      const res = await fetch(`/api/v1/me/business/introductions/${introductionId}/${action}`, {
        method: 'POST',
      });
      if (!res.ok) {
        console.error('Failed to update introduction status');
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-8 flex items-center gap-4 pt-4 border-t border-border">
      <CabinetButton
        type="button"
        tone="primary"
        disabled={loading !== null}
        onClick={() => handleAction('complete')}
      >
        {loading === 'complete' ? '...' : labelComplete}
      </CabinetButton>
      <CabinetButton
        type="button"
        tone="danger"
        disabled={loading !== null}
        onClick={() => handleAction('reject')}
      >
        {loading === 'reject' ? '...' : labelReject}
      </CabinetButton>
    </div>
  );
}
