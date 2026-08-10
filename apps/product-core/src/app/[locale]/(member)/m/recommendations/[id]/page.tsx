import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import type { Locale } from '@/i18n/routing';
import { getIncomingIntroductions } from '@/server/services/introduction-service';
import { getOwnBusinesses } from '@/server/services/business-service';
import { requireCurrentMember } from '@/server/member-page';
import { cabinetContentClasses } from '@/features/member/components/cabinet/styles';
import { Badge } from '@/components/reui/badge';
import { IntroductionActionButtons } from '@/features/member/components/IntroductionActionButtons';

const INTRO_STATUS_LABEL_KEYS: Record<string, string> = {
  SUBMITTED: 'statusSubmitted',
  IN_REVIEW: 'statusInReview',
  APPROVED: 'statusApproved',
  REJECTED: 'statusRejected',
  COMPLETED: 'statusCompleted',
  CANCELED: 'statusCanceled',
};

export default async function RecommendationDetailPage(props: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const params = await props.params;
  const { locale, id } = params;
  const t = await getTranslations({ locale, namespace: 'member.dashboard.recommendations' });

  const profile = await requireCurrentMember(locale);
  const ownBusinesses = await getOwnBusinesses(profile.id);
  const activeBusiness = ownBusinesses.find((b) => b.status !== 'REJECTED');

  if (!activeBusiness) {
    notFound();
  }

  const incomingIntroductions = await getIncomingIntroductions(activeBusiness.id);
  const intro = incomingIntroductions.find((i) => i.id === id);

  if (!intro) {
    notFound();
  }

  const sender = intro.requesterDisplayName || t('unknownSender');
  const time = new Date(intro.createdAt).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/${locale}/m/dashboard?tab=recommendations`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          &larr; {t('backToInbox', { fallback: 'Back to recommendations' })}
        </Link>
      </div>

      <div className={cabinetContentClasses}>
        <div className="overflow-hidden border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                {t('inboxSubject', { client: intro.clientName })}
              </h3>
              <Badge variant="outline">
                {t(INTRO_STATUS_LABEL_KEYS[intro.status] ?? intro.status)}
              </Badge>
            </div>
          </div>
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col gap-1 border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  <span className="font-semibold text-foreground">{t('fromLabel', { name: '' })} </span>
                  {intro.requesterBusinessSlug ? (
                    <Link
                      href={`/${locale}/directory/${intro.requesterBusinessSlug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {sender}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{sender}</span>
                  )}
                </p>
                <span className="text-xs text-muted-foreground">{time}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">{t('clientInfoLabel', { fallback: 'Client Information' })}</h4>
                <p className="mt-1 text-sm text-foreground">{intro.clientName}</p>
                <p className="text-sm text-muted-foreground">{intro.clientContact}</p>
              </div>

              {intro.message && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{t('messageLabel', { fallback: 'Message' })}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {intro.message}
                  </p>
                </div>
              )}
            </div>

            {intro.status === 'APPROVED' && (
              <IntroductionActionButtons
                introductionId={intro.id}
                labelComplete={t('actionComplete')}
                labelReject={t('actionReject')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
