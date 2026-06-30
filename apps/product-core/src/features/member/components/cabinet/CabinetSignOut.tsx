'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@kclub/ui';

import type { Locale } from '@/i18n/routing';

type CabinetSignOutProps = {
  locale: Locale;
};

export function CabinetSignOut({ locale }: CabinetSignOutProps) {
  const router = useRouter();
  const t = useTranslations('member.dashboard');
  const tCommon = useTranslations('auth.common');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/auth/logout', { method: 'POST' });
      if (!res.ok) {
        return;
      }

      router.replace(`/${locale}/sign-in`);
      router.refresh();
    } catch {
      // Sign-out errors are surfaced via TopBar elsewhere; keep sidebar minimal.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      color="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={isLoading}
      className="flex gap-1.5 px-0 py-0 text-xs tracking-wide text-muted hover:text-foreground"
    >
      <LogOut size={14} aria-hidden />
      {isLoading ? tCommon('signingOut') : t('signOut')}
    </Button>
  );
}
