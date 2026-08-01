import { getTranslations } from 'next-intl/server';

import type { BusinessIncomingIntroductionDto, CurrentMemberProfileDto } from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import { cabinetContentClasses } from '@/features/member/components/cabinet/styles';
import { getOwnBusinesses } from '@/server/services/business-service';
import { getIncomingIntroductions } from '@/server/services/introduction-service';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';
import { Badge } from '@/components/reui/badge';

const INTRO_STATUS_LABEL_KEYS: Record<string, string> = {
  SUBMITTED: 'statusSubmitted',
  IN_REVIEW: 'statusInReview',
  APPROVED: 'statusApproved',
  REJECTED: 'statusRejected',
  COMPLETED: 'statusCompleted',
  CANCELED: 'statusCanceled',
};

export async function RecommendationsPanel({
  locale,
  profile,
}: {
  locale: Locale;
  profile: CurrentMemberProfileDto;
}) {
  const t = await getTranslations({ locale, namespace: 'member.dashboard.recommendations' });

  const ownBusinesses = await getOwnBusinesses(profile.id);
  const activeBusiness = ownBusinesses.find((b) => b.status !== 'REJECTED');
  const incomingIntroductions = activeBusiness
    ? await getIncomingIntroductions(activeBusiness.id)
    : [];

  return (
    <div className={cabinetContentClasses}>
      <div className="overflow-hidden border border-border bg-surface shadow-sm">
        <div className="border-b border-border px-6 py-4 sm:px-8">
          <h3 className="text-base font-semibold text-foreground">{t('title')}</h3>
        </div>
        <div className="p-6 sm:p-8">
          {incomingIntroductions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <IncomingIntroductionsList introductions={incomingIntroductions} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

type RecommendationsTranslator = Awaited<
  ReturnType<typeof getTranslations<'member.dashboard.recommendations'>>
>;

function IncomingIntroductionsList({
  introductions,
  t,
}: {
  introductions: BusinessIncomingIntroductionDto[];
  t: RecommendationsTranslator;
}) {
  return (
    <div className="divide-y divide-border">
      {introductions.map((intro) => (
        <div key={intro.id} className="py-5 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-foreground">{intro.clientName}</p>
              <p className="text-xs text-muted-foreground">{intro.clientContact}</p>
              {intro.message && (
                <p className="text-sm leading-relaxed text-muted-foreground">{intro.message}</p>
              )}
              {intro.requesterDisplayName && (
                <p className="text-xs text-muted">
                  {t('fromLabel', { name: intro.requesterDisplayName })}
                </p>
              )}
            </div>
            <Badge variant="outline" className="shrink-0">
              {t(INTRO_STATUS_LABEL_KEYS[intro.status] ?? intro.status)}
            </Badge>
          </div>
          <IncomingIntroductionActions intro={intro} t={t} />
        </div>
      ))}
    </div>
  );
}

function IncomingIntroductionActions({
  intro,
  t,
}: {
  intro: BusinessIncomingIntroductionDto;
  t: RecommendationsTranslator;
}) {
  if (intro.status === 'APPROVED') {
    return (
      <div className="mt-3 flex gap-3">
        <form action={`/api/v1/me/business/introductions/${intro.id}/complete`} method="POST">
          <CabinetButton
            type="submit"
            tone="link"
            density="compact"
            className="h-auto px-0 py-0 text-xs text-success underline hover:bg-transparent"
          >
            {t('actionComplete')}
          </CabinetButton>
        </form>
        <form action={`/api/v1/me/business/introductions/${intro.id}/reject`} method="POST">
          <CabinetButton
            type="submit"
            tone="link"
            density="compact"
            className="h-auto px-0 py-0 text-xs text-destructive underline hover:bg-transparent"
          >
            {t('actionReject')}
          </CabinetButton>
        </form>
      </div>
    );
  }

  return null;
}
