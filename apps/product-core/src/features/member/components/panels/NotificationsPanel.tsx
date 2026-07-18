'use client';

import { useTranslations } from 'next-intl';

export function NotificationsPanel() {
  const t = useTranslations('member.dashboard.notificationsPanel');

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-muted">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="text-sm text-muted-foreground">{t('noUnread')}</p>
        <button
          type="button"
          className="text-sm text-accent transition-colors hover:text-accent/80"
        >
          {t('markAllRead')}
        </button>
      </div>
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      </div>
    </div>
  );
}
