'use client';

import { useTranslations } from 'next-intl';

export function InboxPanel() {
  const t = useTranslations('member.dashboard.inboxPanel');

  return (
    <div className="grid min-h-[480px] overflow-hidden rounded-xl border border-border bg-surface-muted lg:grid-cols-[340px_1fr]">
      {/* Message list */}
      <div className="border-b border-border lg:border-b-0 lg:border-r">
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      </div>

      {/* Message content */}
      <div className="flex flex-col items-center justify-center px-7 py-10">
        <p className="text-sm text-muted-foreground">{t('selectMessage')}</p>
      </div>
    </div>
  );
}
