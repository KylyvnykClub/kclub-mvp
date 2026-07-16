import { getTranslations } from 'next-intl/server';

import type {
  BusinessIncomingIntroductionDto,
  CurrentMemberProfileDto,
  MemberBusinessProfileDto,
} from '@kclub/contracts';

import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import {
  cabinetContentClasses,
  cabinetGridPanelClasses,
} from '@/features/member/components/cabinet/styles';
import { getOwnBusinesses } from '@/server/services/business-service';
import { getIncomingIntroductions } from '@/server/services/introduction-service';
import { getDbClient, schema } from '@/server/db';
import { and, asc, eq } from 'drizzle-orm';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';
import { Badge } from '@/components/reui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { BusinessForm } from './BusinessForm';

export type TaxonomyOption = {
  id: string;
  name: string;
};

export type CityTaxonomyOption = TaxonomyOption & {
  countryId: string;
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  UNDER_REVIEW: 'underReview',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  HIDDEN: 'hidden',
};

const STATUS_BADGE_VARIANTS: Record<string, 'default' | 'outline' | 'success' | 'destructive'> = {
  UNDER_REVIEW: 'outline',
  APPROVED: 'success',
  PUBLISHED: 'success',
  REJECTED: 'destructive',
  HIDDEN: 'outline',
};

function getStatusBadgeVariant(status: string) {
  return STATUS_BADGE_VARIANTS[status] ?? 'outline';
}

export async function BusinessPanel({
  locale,
  profile,
}: {
  locale: Locale;
  profile: CurrentMemberProfileDto;
}) {
  const t = await getTranslations({ locale, namespace: 'member.dashboard.business' });
  const db = getDbClient();

  const [ownBusinesses, countries, categories] = await Promise.all([
    getOwnBusinesses(profile.id),
    db.query.countries.findMany({
      where: eq(schema.countries.is_active, true),
      orderBy: [asc(schema.countries.name)],
    }),
    db.query.categories.findMany({
      where: and(eq(schema.categories.is_active, true), eq(schema.categories.is_high_risk, false)),
      orderBy: [asc(schema.categories.name)],
    }),
  ]);

  const activeBusiness = ownBusinesses.find((b) => b.status !== 'REJECTED');
  const incomingIntroductions = activeBusiness
    ? await getIncomingIntroductions(activeBusiness.id)
    : [];

  const countryOptions: TaxonomyOption[] = countries.map((c) => ({ id: c.id, name: c.name }));
  const categoryOptions: TaxonomyOption[] = categories.map((c) => ({ id: c.id, name: c.name }));

  const rejectedBusiness = ownBusinesses.find((b) => b.status === 'REJECTED');
  const canSubmit = !activeBusiness;
  const canEditBusiness = activeBusiness && activeBusiness.status !== 'HIDDEN';
  const editBusiness = canEditBusiness ? activeBusiness : (rejectedBusiness ?? null);
  const editNeedsReapproval =
    editBusiness?.status === 'APPROVED' || editBusiness?.status === 'PUBLISHED';

  return (
    <div className={cabinetContentClasses}>
      <p className="mb-9 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {t('description')}
      </p>

      {ownBusinesses.length > 0 && (
        <div className="space-y-4">
          {ownBusinesses.map((business) => (
            <div key={business.id} className="space-y-3">
              <BusinessStatusBanner business={business} t={t} />
              <BusinessStatusCard business={business} locale={locale} />
            </div>
          ))}
        </div>
      )}

      {canSubmit && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">{t('submitTitle')}</h3>
          <BusinessForm
            locale={locale}
            business={null}
            countryOptions={countryOptions}
            categoryOptions={categoryOptions}
          />
        </div>
      )}

      {incomingIntroductions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">{t('incomingRecommendations')}</h3>
          <IncomingIntroductionsList introductions={incomingIntroductions} locale={locale} />
        </div>
      )}

      {editBusiness && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">{t('editTitle')}</h3>
          {editNeedsReapproval && (
            <Alert variant="warning">
              <AlertDescription>{t('editReapprovalWarning')}</AlertDescription>
            </Alert>
          )}
          <BusinessForm
            locale={locale}
            business={editBusiness}
            countryOptions={countryOptions}
            categoryOptions={categoryOptions}
          />
        </div>
      )}

      {!canSubmit && !editBusiness && (
        <div className={cn(cabinetGridPanelClasses, 'text-sm text-muted-foreground')}>
          {t('noEditAvailable')}
        </div>
      )}
    </div>
  );
}

const INTRO_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Новая',
  IN_REVIEW: 'На рассмотрении',
  APPROVED: 'Принята',
  REJECTED: 'Отклонена',
  COMPLETED: 'Завершена',
  CANCELED: 'Отменена',
};

function IncomingIntroductionsList({
  introductions,
  locale: _locale,
}: {
  introductions: BusinessIncomingIntroductionDto[];
  locale: Locale;
}) {
  return (
    <div className="space-y-2">
      {introductions.map((intro) => (
        <div key={intro.id} className={cn(cabinetGridPanelClasses, 'space-y-2')}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{intro.clientName}</p>
              <p className="text-xs text-muted-foreground">{intro.clientContact}</p>
              {intro.message && <p className="text-sm text-muted-foreground">{intro.message}</p>}
              {intro.requesterDisplayName && (
                <p className="text-xs text-muted">от: {intro.requesterDisplayName}</p>
              )}
            </div>
            <div className="shrink-0">
              <Badge variant="outline">{INTRO_STATUS_LABELS[intro.status] ?? intro.status}</Badge>
            </div>
          </div>
          <IncomingIntroductionActions intro={intro} />
        </div>
      ))}
    </div>
  );
}

function IncomingIntroductionActions({ intro }: { intro: BusinessIncomingIntroductionDto }) {
  if (intro.status === 'SUBMITTED') {
    return (
      <form action={`/api/v1/me/business/introductions/${intro.id}/review`} method="POST">
        <CabinetButton
          type="submit"
          tone="link"
          density="compact"
          className="h-auto px-0 py-0 text-xs text-accent underline hover:bg-transparent hover:text-accent-hover"
        >
          Рассмотреть
        </CabinetButton>
      </form>
    );
  }

  if (intro.status === 'IN_REVIEW') {
    return (
      <div className="flex gap-3">
        <form action={`/api/v1/me/business/introductions/${intro.id}/approve`} method="POST">
          <CabinetButton
            type="submit"
            tone="link"
            density="compact"
            className="h-auto px-0 py-0 text-xs text-success underline hover:bg-transparent"
          >
            Принять
          </CabinetButton>
        </form>
        <form action={`/api/v1/me/business/introductions/${intro.id}/reject`} method="POST">
          <CabinetButton
            type="submit"
            tone="link"
            density="compact"
            className="h-auto px-0 py-0 text-xs text-destructive underline hover:bg-transparent"
          >
            Отклонить
          </CabinetButton>
        </form>
      </div>
    );
  }

  return null;
}

function BusinessStatusBanner({
  business,
  t,
}: {
  business: MemberBusinessProfileDto;
  t: Awaited<ReturnType<typeof getTranslations<'member.dashboard.business'>>>;
}) {
  if (business.status === 'UNDER_REVIEW') {
    return (
      <Alert variant="warning">
        <AlertTitle>{t('statusBannerUnderReview')}</AlertTitle>
        <AlertDescription>{t('statusBannerUnderReviewSub')}</AlertDescription>
      </Alert>
    );
  }

  if (business.status === 'APPROVED') {
    return (
      <Alert variant="success">
        <AlertTitle>{t('statusBannerApproved')}</AlertTitle>
        <AlertDescription>{t('statusBannerApprovedSub')}</AlertDescription>
      </Alert>
    );
  }

  if (business.status === 'PUBLISHED') {
    return (
      <Alert variant="info">
        <AlertTitle>{t('statusBannerPublished')}</AlertTitle>
        <AlertDescription>{t('statusBannerPublishedSub')}</AlertDescription>
      </Alert>
    );
  }

  if (business.status === 'REJECTED') {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('statusBannerRejected')}</AlertTitle>
        {business.rejectionReason && (
          <AlertDescription>{business.rejectionReason}</AlertDescription>
        )}
      </Alert>
    );
  }

  if (business.status === 'HIDDEN') {
    return (
      <Alert variant="default">
        <AlertTitle>{t('statusBannerHidden')}</AlertTitle>
      </Alert>
    );
  }

  return null;
}

async function BusinessStatusCard({
  business,
  locale,
}: {
  business: MemberBusinessProfileDto;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'member.dashboard.business' });

  return (
    <div className={cn(cabinetGridPanelClasses, 'space-y-3')}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-foreground">{business.name}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {business.categoryName} &middot; {business.cityName}, {business.countryName}
          </p>
        </div>
        <Badge variant={getStatusBadgeVariant(business.status)}>
          {t(STATUS_LABEL_KEYS[business.status] ?? business.status)}
        </Badge>
      </div>
    </div>
  );
}
