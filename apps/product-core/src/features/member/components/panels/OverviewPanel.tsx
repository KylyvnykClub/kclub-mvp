'use client';

import { useTranslations } from 'next-intl';

import type {
  CurrentMemberProfileDto,
  MemberBusinessProfileDto,
} from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import type { ImplementedMemberDashboardTab } from '@/features/member/dashboard-tabs';
import { KylyvnykClubCard } from '@/features/member/components/KylyvnykClubCard';
import { Badge } from '@/components/reui/badge';

type OverviewPanelProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  business: MemberBusinessProfileDto | null;
  cardNumber: string | null;
  introductionCount: number;
  onNavigate: (tab: ImplementedMemberDashboardTab) => void;
};

function StatCell({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface-muted px-5 py-5">
      <div
        className={`font-mono text-2xl font-semibold ${accent ? 'text-accent' : 'text-foreground'}`}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function QuickActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-surface-muted/80"
    >
      {label}
    </button>
  );
}

function ProfileInfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <div className="min-h-11 border-b border-border py-2.5 text-sm text-foreground">
        {value}
      </div>
    </div>
  );
}

function computeProfileCompleteness(
  profile: CurrentMemberProfileDto,
  business: MemberBusinessProfileDto | null,
): number {
  let filled = 0;
  let total = 0;

  const profileFields = [
    profile.displayName,
    profile.email,
    profile.country,
    profile.city,
    profile.about,
    profile.avatarUrl,
  ];
  total += profileFields.length;
  filled += profileFields.filter(Boolean).length;

  if (business) {
    const bizFields = [
      business.name,
      business.categoryName,
      business.countryName,
      business.cityName,
      business.websiteUrl,
      business.briefDescription,
      business.representativeName,
      business.representativeEmail,
    ];
    total += bizFields.length;
    filled += bizFields.filter(Boolean).length;
  }

  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

export function OverviewPanel({
  locale,
  profile,
  business,
  cardNumber,
  introductionCount,
  onNavigate,
}: OverviewPanelProps) {
  const t = useTranslations('member.dashboard.overview');
  const tAccount = useTranslations('member.dashboard.account');

  const memberName = profile.displayName || profile.phone;
  const planLabel = profile.membershipTier === 'VIP' ? 'VIP' : 'MEMBER';
  const completeness = computeProfileCompleteness(profile, business);
  const isVerified = business?.status === 'PUBLISHED' || business?.status === 'APPROVED';
  const regDate = new Date(profile.createdAt).toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border lg:grid-cols-4">
        <StatCell value={`${completeness}%`} label={t('profileStatus')} accent />
        <StatCell
          value={business ? 1 : 0}
          label={t('activeOffers')}
        />
        <StatCell value={introductionCount} label={t('openIntroductions')} />
        <StatCell value={planLabel} label={t('plan')} />
      </div>

      {/* Club card + Quick actions */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Verification + Card */}
        <div className="space-y-5 rounded-xl border border-border bg-surface-muted p-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('verificationStatus')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isVerified ? t('verifiedDescription') : t('pendingDescription')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {isVerified && <Badge variant="success">Verified</Badge>}
              {profile.membershipTier === 'VIP' && (
                <Badge variant="outline">VIP Partner</Badge>
              )}
            </div>
          </div>
          <KylyvnykClubCard
            name={memberName}
            status={cardNumber ?? `${planLabel} MEMBER`}
            idNumber={profile.id}
            className="w-full"
          />
        </div>

        {/* Quick actions */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-muted p-6">
          <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {t('quickActions')}
          </p>
          <div className="flex flex-col gap-2">
            <QuickActionButton
              label={t('actionUpdateProfile')}
              onClick={() => onNavigate('profile')}
            />
            <QuickActionButton
              label={t('actionViewInvoices')}
              onClick={() => onNavigate('billing')}
            />
            <QuickActionButton
              label={t('actionCheckInbox')}
              onClick={() => onNavigate('inbox')}
            />
          </div>
        </div>
      </div>

      {/* Member info */}
      <div className="rounded-xl border border-border bg-surface-muted p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">{t('memberInfo')}</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <ProfileInfoField label={tAccount('displayName')} value={memberName} />
          <ProfileInfoField label={tAccount('phone')} value={profile.phone} />
          <ProfileInfoField
            label={tAccount('country')}
            value={profile.country || t('notSet')}
          />
          <ProfileInfoField
            label={tAccount('city')}
            value={profile.city || t('notSet')}
          />
          <ProfileInfoField label={t('memberSince')} value={regDate} />
          <ProfileInfoField label={t('planLabel')} value={planLabel} />
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-surface-muted p-6">
        <h3 className="mb-2 text-sm font-semibold text-foreground">{t('recentActivity')}</h3>
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-4 border-t border-border py-3">
            <div>
              <p className="text-sm text-foreground">{t('activityProfileCreated')}</p>
              <p className="mt-0.5 text-xs text-muted">{regDate}</p>
            </div>
          </div>
          {business && (
            <div className="flex items-center justify-between gap-4 border-t border-border py-3">
              <div>
                <p className="text-sm text-foreground">
                  {t('activityBusinessSubmitted', { name: business.name })}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {business.createdAt
                    ? new Date(business.createdAt).toLocaleDateString(locale, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : ''}
                </p>
              </div>
              <Badge variant={business.status === 'PUBLISHED' ? 'success' : 'outline'}>
                {business.status}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
