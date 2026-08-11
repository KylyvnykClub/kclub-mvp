import { getTranslations } from 'next-intl/server';

import type {
  BusinessIncomingIntroductionDto,
  CurrentMemberProfileDto,
  PublicBusinessListItemDto,
} from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import { cabinetContentClasses } from '@/features/member/components/cabinet/styles';
import { getOwnBusinesses } from '@/server/services/business-service';
import { getIncomingIntroductions } from '@/server/services/introduction-service';
import Link from 'next/link';
import { Badge } from '@/components/reui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IntroductionsPanel } from './IntroductionsPanel';

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
  serverPublicBusinesses,
}: {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  serverPublicBusinesses: PublicBusinessListItemDto[];
}) {
  const t = await getTranslations({ locale, namespace: 'member.dashboard.recommendations' });

  const ownBusinesses = await getOwnBusinesses(profile.id);
  const activeBusiness = ownBusinesses.find((b) => b.status !== 'REJECTED');
  const incomingIntroductions = activeBusiness
    ? await getIncomingIntroductions(activeBusiness.id)
    : [];

  return (
    <div className={cabinetContentClasses}>
      <Tabs defaultValue="incoming" className="gap-6">
        <TabsList variant="line" aria-label={t('title')}>
          <TabsTrigger value="incoming">{t('incomingTab')}</TabsTrigger>
          <TabsTrigger value="outgoing">{t('outgoingTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="incoming">
          <div className="overflow-hidden border border-border bg-surface shadow-sm">
            <div className="border-b border-border px-6 py-4 sm:px-8">
              <h3 className="text-base font-semibold text-foreground">{t('title')}</h3>
            </div>
            <div className="p-6 sm:p-8">
              {incomingIntroductions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('empty')}</p>
              ) : (
                <IncomingIntroductionsList
                  introductions={incomingIntroductions}
                  t={t}
                  locale={locale}
                />
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="outgoing">
          <IntroductionsPanel
            locale={locale}
            profile={profile}
            serverPublicBusinesses={serverPublicBusinesses}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type RecommendationsTranslator = Awaited<
  ReturnType<typeof getTranslations<'member.dashboard.recommendations'>>
>;

function IncomingIntroductionsList({
  introductions,
  t,
  locale,
}: {
  introductions: BusinessIncomingIntroductionDto[];
  t: RecommendationsTranslator;
  locale: Locale;
}) {
  return (
    <div className="divide-y divide-border">
      {introductions.map((intro) => {
        const theme = t('inboxSubject', { client: intro.clientName });
        const sender = intro.requesterDisplayName || t('unknownSender');
        const time = new Date(intro.createdAt).toLocaleDateString(locale, {
          month: 'short',
          day: 'numeric',
          timeZone: 'Europe/Kyiv',
        });
        const isUnread = intro.status === 'APPROVED';

        return (
          <Link
            key={intro.id}
            href={`/${locale}/m/recommendations/${intro.id}`}
            className="group block py-4 transition-colors hover:bg-surface-muted sm:px-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                {/* Status dot for unread/actionable */}
                <div className="flex w-2 shrink-0 justify-center">
                  {isUnread && <span className="size-2 rounded-full bg-accent" />}
                </div>

                <div className="min-w-0">
                  <p
                    className={`truncate text-sm ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}
                  >
                    {sender}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{theme}</p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-xs text-muted-foreground">{time}</span>
                <div className="mt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {t(INTRO_STATUS_LABEL_KEYS[intro.status] ?? intro.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
