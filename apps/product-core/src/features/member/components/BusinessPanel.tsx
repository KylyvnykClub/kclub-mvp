import { getTranslations } from 'next-intl/server';

import type {
  CategoryLevel,
  CurrentMemberProfileDto,
  MemberBusinessProfileDto,
} from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import { cabinetContentClasses } from '@/features/member/components/cabinet/styles';
import { getOwnBusinesses } from '@/server/services/business-service';
import { getDbClient, schema } from '@/server/db';
import { and, asc, eq, inArray, or } from 'drizzle-orm';
import { Badge } from '@/components/reui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { BusinessForm } from './BusinessForm';
import { PlacementCheckoutButton } from './PlacementCheckoutButton';
import { IntroductionSubmitForm } from './IntroductionSubmitForm';

export type TaxonomyOption = {
  id: string;
  name: string;
};

export type CityTaxonomyOption = TaxonomyOption & {
  countryId: string;
};

export type CategoryTaxonomyOption = TaxonomyOption & {
  parentId: string | null;
  level: CategoryLevel;
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  UNDER_REVIEW: 'underReview',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  HIDDEN: 'hidden',
};

const STATUS_BADGE_VARIANTS: Record<
  string,
  'default' | 'outline' | 'success' | 'destructive' | 'warning-light'
> = {
  UNDER_REVIEW: 'warning-light',
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
      where: and(
        eq(schema.categories.is_active, true),
        eq(schema.categories.is_high_risk, false),
        or(eq(schema.categories.level, 'SUBCATEGORY'), eq(schema.categories.is_custom, true)),
      ),
      orderBy: [asc(schema.categories.name)],
    }),
  ]);

  const activeBusiness = ownBusinesses.find((b) => b.status !== 'REJECTED');
  const businessIds = ownBusinesses.map((b) => b.id);
  const paidPlacements = businessIds.length
    ? await db.query.subscriptions.findMany({
        where: and(
          inArray(schema.subscriptions.business_profile_id, businessIds),
          eq(schema.subscriptions.kind, 'BUSINESS_PLACEMENT'),
          eq(schema.subscriptions.status, 'ACTIVE'),
        ),
        columns: { business_profile_id: true },
      })
    : [];
  const paidBusinessIds = new Set(paidPlacements.map((s) => s.business_profile_id));

  const countryOptions: TaxonomyOption[] = countries.map((c) => ({ id: c.id, name: c.name }));
  const categoryOptions: TaxonomyOption[] = categories.map((c) => ({ id: c.id, name: c.name }));

  const allPublishedBusinesses = await db.query.businessProfiles.findMany({
    where: eq(schema.businessProfiles.status, 'PUBLISHED'),
    columns: { id: true, name: true },
    orderBy: [asc(schema.businessProfiles.name)],
  });
  const businessOptions = allPublishedBusinesses.map((b) => ({ id: b.id, name: b.name }));

  const rejectedBusiness = ownBusinesses.find((b) => b.status === 'REJECTED');
  const canSubmit = !activeBusiness;
  const canEditBusiness = activeBusiness && activeBusiness.status !== 'HIDDEN';
  const editBusiness = canEditBusiness ? activeBusiness : (rejectedBusiness ?? null);
  const editNeedsReapproval =
    editBusiness?.status === 'APPROVED' || editBusiness?.status === 'PUBLISHED';

  return (
    <div className={cabinetContentClasses}>
      <div className="space-y-8">
        {ownBusinesses.length > 0 && (
          <FrontCard>
            <FrontCardHeader title={t('statusSectionTitle')} />
            <div className="divide-y divide-border">
              {ownBusinesses.map((business) => (
                <div key={business.id} className="space-y-4 p-6 sm:p-8">
                  <BusinessStatusBanner
                    business={business}
                    placementPaid={paidBusinessIds.has(business.id)}
                    t={t}
                  />
                  <BusinessStatusCard business={business} locale={locale} />
                </div>
              ))}
            </div>
          </FrontCard>
        )}

        {canSubmit && (
          <FrontCard>
            <FrontCardHeader title={t('submitTitle')} />
            <div className="p-6 sm:p-8">
              <BusinessForm
                locale={locale}
                business={null}
                countryOptions={countryOptions}
                categoryOptions={categoryOptions}
              />
            </div>
          </FrontCard>
        )}

        {editBusiness && (
          <FrontCard>
            <FrontCardHeader title={t('editTitle')} />
            <div className="p-6 sm:p-8">
              {editNeedsReapproval && (
                <Alert variant="warning" className="mb-6 rounded-none">
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
          </FrontCard>
        )}

        {!canSubmit && !editBusiness && (
          <FrontCard>
            <div className="p-6 text-sm text-muted-foreground sm:p-8">{t('noEditAvailable')}</div>
          </FrontCard>
        )}

        {ownBusinesses.length > 0 && (
          <div className="pt-8">
            <div className="mb-8">
              <h2 className="mb-4 text-[24px] font-semibold uppercase tracking-[0.2em] text-accent">
                Recommend a Client
              </h2>
              <p className="max-w-xl text-[15px] text-muted-foreground">
                Discreetly introduce a prospective client to our exclusive network. Submissions are
                reviewed with the utmost confidentiality.
              </p>
            </div>
            <IntroductionSubmitForm businessOptions={businessOptions} />
          </div>
        )}
      </div>
    </div>
  );
}

function FrontCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden border border-border bg-surface shadow-sm">{children}</div>
  );
}

function FrontCardHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-border px-6 py-4 sm:px-8">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function BusinessStatusBanner({
  business,
  placementPaid,
  t,
}: {
  business: MemberBusinessProfileDto;
  placementPaid: boolean;
  t: Awaited<ReturnType<typeof getTranslations<'member.dashboard.business'>>>;
}) {
  if (business.status === 'UNDER_REVIEW') {
    return (
      <Alert variant="warning" className="rounded-none">
        <AlertTitle>{t('statusBannerUnderReview')}</AlertTitle>
        <AlertDescription>{t('statusBannerUnderReviewSub')}</AlertDescription>
      </Alert>
    );
  }

  if (business.status === 'APPROVED') {
    if (placementPaid) {
      return (
        <Alert variant="info" className="rounded-none">
          <AlertTitle>{t('statusBannerPaid')}</AlertTitle>
          <AlertDescription>{t('statusBannerPaidSub')}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="border-success/30 bg-success/5 border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h4 className="text-base font-semibold text-foreground">{t('statusBannerApproved')}</h4>
            <p className="text-sm text-muted-foreground">{t('statusBannerApprovedSub')}</p>
          </div>
          <div className="shrink-0">
            <PlacementCheckoutButton businessId={business.id} />
          </div>
        </div>
      </div>
    );
  }

  if (business.status === 'PUBLISHED') {
    return (
      <Alert variant="info" className="rounded-none">
        <AlertTitle>{t('statusBannerPublished')}</AlertTitle>
        <AlertDescription>{t('statusBannerPublishedSub')}</AlertDescription>
      </Alert>
    );
  }

  if (business.status === 'REJECTED') {
    return (
      <Alert variant="destructive" className="rounded-none">
        <AlertTitle>{t('statusBannerRejected')}</AlertTitle>
        {business.rejectionReason && (
          <AlertDescription>{business.rejectionReason}</AlertDescription>
        )}
      </Alert>
    );
  }

  if (business.status === 'HIDDEN') {
    return (
      <Alert variant="default" className="rounded-none">
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
    <div className="flex items-center justify-between gap-4 border border-border bg-surface-muted p-5">
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-foreground">{business.name}</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {business.categoryName} &middot; {business.cityName}, {business.countryName}
        </p>
      </div>
      <Badge variant={getStatusBadgeVariant(business.status)} size="xs" className="shrink-0">
        {t(STATUS_LABEL_KEYS[business.status] ?? business.status)}
      </Badge>
    </div>
  );
}
