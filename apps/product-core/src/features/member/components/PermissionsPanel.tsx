import { getTranslations } from 'next-intl/server';

import { MEMBER_CAPABILITIES, type UserContext } from '@kclub/contracts';
import { getMemberCapabilities } from '@kclub/domain';

import type { Locale } from '@/i18n/routing';
import { cabinetContentClasses } from '@/features/member/components/cabinet/styles';

type PermissionsPanelProps = {
  locale: Locale;
  userContext: UserContext;
};

const CAPABILITY_LABELS: Record<string, { label: string; description: string }> = {
  DIGITAL_CARD_READ: {
    label: 'Digital Club Card',
    description: 'View and share your digital membership card with QR code.',
  },
  DIRECTORY_READ: {
    label: 'Partner Directory',
    description: 'Browse the full KCLUB partner directory.',
  },
  VIP_UPGRADE: {
    label: 'VIP Upgrade',
    description: 'Upgrade your membership to VIP for additional features.',
  },
  VIP_SUBSCRIPTION_MANAGE: {
    label: 'VIP Subscription Management',
    description: 'Manage your active VIP subscription, billing, and renewal.',
  },
  BUSINESS_SUBMIT: {
    label: 'Business Submission',
    description: 'Submit your business profile for listing in the partner directory.',
  },
  BUSINESS_MANAGE_OWN: {
    label: 'Business Management',
    description: 'Edit and manage your submitted business profile.',
  },
  INTRODUCTIONS_SUBMIT: {
    label: 'Business Introductions',
    description: 'Request warm introductions to other partner businesses.',
  },
};

export async function PermissionsPanel({ locale: _locale, userContext }: PermissionsPanelProps) {
  await getTranslations({ locale: _locale, namespace: 'member.dashboard' });

  const activeCapabilities = getMemberCapabilities(userContext) as readonly string[];
  const allCapabilities = Object.values(MEMBER_CAPABILITIES) as string[];

  const accessLabel = userContext.hasBusiness
    ? 'Business Member'
    : userContext.isVip
      ? 'VIP'
      : 'Member';

  return (
    <div className={cabinetContentClasses}>
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Your access level: <span className="font-semibold text-foreground">{accessLabel}</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {allCapabilities.map((capability) => {
          const info = CAPABILITY_LABELS[capability];
          const isActive = activeCapabilities.includes(capability);

          return (
            <div
              key={capability}
              className={`border p-4 ${isActive ? 'border-accent/30 bg-surface-muted' : 'border-border bg-background opacity-50'}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-accent' : 'text-muted'}`}
                >
                  {isActive ? '✓' : '✗'}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {info?.label ?? capability}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{info?.description ?? ''}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
