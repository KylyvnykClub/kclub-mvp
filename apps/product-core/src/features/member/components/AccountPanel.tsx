'use client';

import { useTranslations } from 'next-intl';

import type { CurrentMemberProfileDto } from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import { KylyvnykClubCard } from '@/features/member/components/KylyvnykClubCard';
import {
  cabinetContentClasses,
  cabinetFieldLabelClasses,
} from '@/features/member/components/cabinet/styles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/reui/badge';

type AccountPanelProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  cardNumber?: string | null;
};

type ProfileInfoFieldProps = {
  label: string;
  value: string;
  isMultiline?: boolean;
};

function getInitials(name: string | null, phone: string): string {
  if (!name) {
    return phone.charAt(phone.length - 1).toUpperCase();
  }

  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getPlanLabel(tier: CurrentMemberProfileDto['membershipTier']): string {
  return tier === 'VIP' ? 'VIP' : 'MEMBER';
}

function ProfileInfoField({ label, value, isMultiline }: ProfileInfoFieldProps) {
  return (
    <div>
      <p className={cabinetFieldLabelClasses}>{label}</p>
      <div
        className={
          isMultiline
            ? 'min-h-24 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-foreground'
            : 'min-h-11 rounded-full border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground'
        }
      >
        {value}
      </div>
    </div>
  );
}

export function AccountPanel({ locale, profile, cardNumber }: AccountPanelProps) {
  const t = useTranslations('member.dashboard.account');
  const tCommon = useTranslations('member.common');

  const memberName = profile.displayName || profile.phone;
  const planLabel = getPlanLabel(profile.membershipTier);
  const regDate = new Date(profile.createdAt).toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const localePreference = profile.localePreference ?? locale;

  return (
    <div className={cabinetContentClasses}>
      <div className="mb-10 flex flex-col gap-8 border-b border-border pb-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-5">
          <Avatar className="border-accent/25 size-20 border bg-surface-muted">
            {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={memberName} /> : null}
            <AvatarFallback className="bg-transparent text-2xl font-semibold text-accent">
              {getInitials(profile.displayName, profile.phone)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 pt-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
              <span className="break-words text-2xl font-semibold text-foreground">
                {memberName}
              </span>
              <Badge variant="outline" size="sm">
                {planLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t('memberSince', { date: regDate })}</p>
          </div>
        </div>

        <KylyvnykClubCard
          name={memberName}
          status={cardNumber ?? `${planLabel} MEMBER`}
          idNumber={profile.id}
          className="w-full"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <ProfileInfoField label={t('displayName')} value={memberName} />
        <ProfileInfoField label={t('phone')} value={profile.phone} />
        <ProfileInfoField label={t('country')} value={profile.country || t('notSet')} />
        <ProfileInfoField label={t('city')} value={profile.city || t('notSet')} />
        <ProfileInfoField label={t('locale')} value={tCommon(`locales.${localePreference}`)} />
        <ProfileInfoField label={t('joined')} value={regDate} />
        <div className="sm:col-span-2">
          <ProfileInfoField label={t('about')} value={profile.about || t('notSet')} isMultiline />
        </div>
      </div>
    </div>
  );
}
