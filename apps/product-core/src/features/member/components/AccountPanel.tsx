'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Gem, Briefcase, ChevronRight, CalendarDays, MapPin, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { MEMBER_API_ROUTES } from '@kclub/contracts';
import { Spinner, cn } from '@kclub/ui';

import type { CurrentMemberProfileDto } from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import { parseAuthResponse } from '@/features/auth/utils/api';
import { KylyvnykClubCard } from '@/features/member/components/KylyvnykClubCard';
import { cabinetContentClasses } from '@/features/member/components/cabinet/styles';

type AccountPanelProps = {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  cardNumber?: string | null;
};

function getPlanLabel(tier: CurrentMemberProfileDto['membershipTier']): string {
  return tier === 'VIP' ? 'VIP' : 'MEMBER';
}

const GOLD_BG = [
  'linear-gradient(180deg,',
  '#f2dc82 0%, #dbbf4a 20%, #caa83a 40%, #b89230 70%, #9a7824 100%)',
].join(' ');

const GOLD_TEXT: React.CSSProperties = {
  color: '#2a1e08',
  textShadow: '0 1px 0 rgba(220,190,90,0.6)',
};

export function AccountPanel({ locale, profile, cardNumber }: AccountPanelProps) {
  const t = useTranslations('member.dashboard.account');
  const tSub = useTranslations('member.dashboard.subscription');
  const tCommon = useTranslations('member.common');
  const [vipLoading, setVipLoading] = useState(false);
  const isVip = profile.membershipTier === 'VIP';

  const memberName = profile.displayName || profile.phone;
  const planLabel = getPlanLabel(profile.membershipTier);
  const regDate = new Date(profile.createdAt).toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const localePreference = profile.localePreference ?? locale;
  const location = [profile.city, profile.country].filter(Boolean).join(', ');

  const handleVipCheckout = async () => {
    if (isVip) {
      return;
    }

    setVipLoading(true);
    try {
      const response = await fetch(MEMBER_API_ROUTES.SUBSCRIPTION_CHECKOUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await parseAuthResponse<{ checkoutUrl: string }>(response);
      if (!result.success || !result.data?.checkoutUrl) {
        toast.error(tSub('checkoutError'));
        return;
      }
      window.location.href = result.data.checkoutUrl;
    } catch {
      toast.error(tSub('checkoutError'));
    } finally {
      setVipLoading(false);
    }
  };

  return (
    <div className={cn(cabinetContentClasses, 'flex flex-col items-center justify-center')}>
      <div className="flex w-full justify-center">
        <KylyvnykClubCard
          name={memberName}
          status={cardNumber ?? `${planLabel} MEMBER`}
          idNumber={profile.id}
          className="w-full"
        />
      </div>

      <div className="mt-4 flex flex-col items-center space-y-2">
        <div
          className="flex w-full max-w-md items-center justify-between gap-3 rounded-lg px-4 py-2.5"
          style={{
            background: GOLD_BG,
            boxShadow: '0 1px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,245,200,0.4)',
            border: '1px solid #b89230',
          }}
        >
          <span className="flex items-center gap-2" style={GOLD_TEXT}>
            <CalendarDays size={14} strokeWidth={2.2} aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wide">{regDate}</span>
          </span>
          <span className="hidden h-4 w-px sm:block" style={{ background: 'rgba(42,30,8,0.2)' }} />
          <span className="flex items-center gap-2" style={GOLD_TEXT}>
            <MapPin size={14} strokeWidth={2.2} aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wide">
              {location || t('notSet')}
            </span>
          </span>
          <span className="hidden h-4 w-px sm:block" style={{ background: 'rgba(42,30,8,0.2)' }} />
          <span className="flex items-center gap-2" style={GOLD_TEXT}>
            <Globe size={14} strokeWidth={2.2} aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wide">
              {tCommon(`locales.${localePreference}`)}
            </span>
          </span>
        </div>

        <button
          type="button"
          data-testid="vip-upgrade-btn"
          onClick={handleVipCheckout}
          disabled={vipLoading}
          aria-disabled={isVip || vipLoading}
          aria-pressed={isVip}
          className={cn(
            'flex w-full max-w-md items-center gap-3 rounded-lg px-4 py-2.5 transition-opacity',
            isVip
              ? 'ring-2 ring-white/30'
              : 'cursor-pointer hover:opacity-90 active:opacity-80 disabled:cursor-wait disabled:opacity-70',
          )}
          style={{
            background: GOLD_BG,
            boxShadow: isVip
              ? '0 0 0 1px rgba(242,220,130,0.45), 0 4px 14px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,245,200,0.55)'
              : '0 1px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,245,200,0.4)',
            border: '1px solid #b89230',
          }}
        >
          <span className="flex size-7 shrink-0 items-center justify-center" style={GOLD_TEXT}>
            {vipLoading ? <Spinner size={14} /> : <Gem size={16} strokeWidth={2.2} />}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="flex flex-wrap items-center gap-2">
              <span className="block text-xs font-bold uppercase tracking-wide" style={GOLD_TEXT}>
                {t('vipButtonTitle')}
              </span>
              {isVip ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]"
                  style={{ ...GOLD_TEXT, background: 'rgba(255,248,216,0.35)' }}
                >
                  {tSub('currentPlanBadge')}
                </span>
              ) : null}
            </span>
            <span
              className="block text-[10px] leading-tight"
              style={{ ...GOLD_TEXT, opacity: 0.75 }}
            >
              {t('vipButtonSub')}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5" style={GOLD_TEXT}>
            {isVip ? (
              <span className="text-right">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em]">
                  {tSub('currentPlanBadge')}
                </span>
              </span>
            ) : (
              <>
                <span className="text-right">
                  <span className="block text-xs font-bold">{t('vipButtonPrice')}</span>
                  <span
                    className="block text-[9px] uppercase tracking-wider"
                    style={{ opacity: 0.7 }}
                  >
                    {t('vipButtonPeriod')}
                  </span>
                </span>
                <ChevronRight size={14} strokeWidth={2.5} />
              </>
            )}
          </span>
        </button>

        <a
          href={`/${locale}/m/business/onboarding`}
          className="flex w-full max-w-md items-center gap-3 rounded-lg px-4 py-2.5 transition-opacity hover:opacity-90 active:opacity-80"
          style={{
            background: GOLD_BG,
            boxShadow: '0 1px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,245,200,0.4)',
            border: '1px solid #b89230',
          }}
        >
          <span className="flex size-7 shrink-0 items-center justify-center" style={GOLD_TEXT}>
            <Briefcase size={16} strokeWidth={2.2} />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-xs font-bold uppercase tracking-wide" style={GOLD_TEXT}>
              {t('bizButtonTitle')}
            </span>
            <span
              className="block text-[10px] leading-tight"
              style={{ ...GOLD_TEXT, opacity: 0.75 }}
            >
              {t('bizButtonSub')}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5" style={GOLD_TEXT}>
            <span className="text-right">
              <span className="block text-xs font-bold">{t('bizButtonPrice')}</span>
              <span className="block text-[9px] uppercase tracking-wider" style={{ opacity: 0.7 }}>
                {t('bizButtonPeriod')}
              </span>
            </span>
            <ChevronRight size={14} strokeWidth={2.5} />
          </span>
        </a>
      </div>
    </div>
  );
}
