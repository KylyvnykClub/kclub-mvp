import { getTranslations } from 'next-intl/server';
import { asc, and, eq } from 'drizzle-orm';
import { Globe, MapPin, Tag, Calendar } from 'lucide-react';

import type { CurrentMemberProfileDto, MemberBusinessProfileDto } from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import { getDbClient, schema } from '@/server/db';
import { getOwnBusinesses } from '@/server/services/business-service';
import { Badge } from '@/components/reui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/reui/alert';
import { BusinessForm } from '@/features/member/components/BusinessForm';
import { PlacementCheckoutButton } from '@/features/member/components/PlacementCheckoutButton';

import type { TaxonomyOption } from '@/features/member/components/BusinessPanel';

const STATUS_BADGE_VARIANTS: Record<string, 'default' | 'outline' | 'success' | 'destructive'> = {
  UNDER_REVIEW: 'outline',
  APPROVED: 'success',
  PUBLISHED: 'success',
  REJECTED: 'destructive',
  HIDDEN: 'outline',
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  UNDER_REVIEW: 'underReview',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  HIDDEN: 'hidden',
};

export async function BusinessProfilePanel({
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
  const rejectedBusiness = ownBusinesses.find((b) => b.status === 'REJECTED');
  const canSubmit = !activeBusiness;
  const canEditBusiness = activeBusiness && activeBusiness.status !== 'HIDDEN';
  const editBusiness = canEditBusiness ? activeBusiness : (rejectedBusiness ?? null);
  const editNeedsReapproval =
    editBusiness?.status === 'APPROVED' || editBusiness?.status === 'PUBLISHED';

  const countryOptions: TaxonomyOption[] = countries.map((c) => ({ id: c.id, name: c.name }));
  const categoryOptions: TaxonomyOption[] = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="flex flex-col gap-6">
      {/* Status banners */}
      {ownBusinesses.map((business) => (
        <BusinessStatusSection key={business.id} business={business} locale={locale} t={t} />
      ))}

      {/* Business summary card */}
      {activeBusiness && <BusinessSummaryCard business={activeBusiness} t={t} />}

      <div className="rounded-xl border border-border bg-surface-muted p-6">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-foreground">
            {canSubmit ? t('submitTitle') : t('companyDetails')}
          </h3>
          {!canSubmit && (
            <p className="mt-1 text-sm text-muted-foreground">{t('companyDetailsDescription')}</p>
          )}
        </div>

        <BusinessForm
          locale={locale}
          business={editBusiness ?? null}
          countryOptions={countryOptions}
          categoryOptions={categoryOptions}
        />

        {editNeedsReapproval && (
          <p className="mt-5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            {t('editReapprovalWarning')}
          </p>
        )}
      </div>

      {/* Verification documents */}
      <div className="rounded-xl border border-border bg-surface-muted p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">{t('verificationDocuments')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('verificationDocumentsDescription')}
          </p>
        </div>
        <div className="flex flex-col">
          {activeBusiness && (
            <>
              <DocRow
                name={t('docBusinessRegistration')}
                status={t('docPendingReview')}
                variant="outline"
              />
              <DocRow
                name={t('docRepresentativeId')}
                status={t('docPendingReview')}
                variant="outline"
              />
            </>
          )}
          {!activeBusiness && (
            <p className="py-3 text-sm text-muted-foreground">{t('docNoBusinessMessage')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BusinessSummaryCard({
  business,
  t,
}: {
  business: MemberBusinessProfileDto;
  t: Awaited<ReturnType<typeof getTranslations<'member.dashboard.business'>>>;
}) {
  const statusKey = STATUS_LABEL_KEYS[business.status] ?? 'underReview';
  const badgeVariant = STATUS_BADGE_VARIANTS[business.status] ?? 'outline';

  return (
    <div className="rounded-xl border border-border bg-surface-muted p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{business.name}</h3>
          <div className="mt-1">
            <Badge variant={badgeVariant}>{t(statusKey as any)}</Badge>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryField
          icon={<Tag className="size-4 text-muted-foreground" />}
          label={t('categoryLabel2')}
          value={business.categoryName}
        />
        <SummaryField
          icon={<MapPin className="size-4 text-muted-foreground" />}
          label={t('locationLabel')}
          value={`${business.cityName}, ${business.countryName}`}
        />
        {business.websiteUrl && (
          <SummaryField
            icon={<Globe className="size-4 text-muted-foreground" />}
            label={t('websiteLabel')}
            value={business.websiteUrl}
          />
        )}
        <SummaryField
          icon={<Calendar className="size-4 text-muted-foreground" />}
          label={t('registeredLabel')}
          value={new Date(business.createdAt).toLocaleDateString()}
        />
      </div>
    </div>
  );
}

function SummaryField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DocRow({
  name,
  status,
  variant,
}: {
  name: string;
  status: string;
  variant: 'outline' | 'success' | 'destructive';
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border py-3">
      <span className="text-sm text-foreground">{name}</span>
      <Badge variant={variant}>{status}</Badge>
    </div>
  );
}

async function BusinessStatusSection({
  business,
  locale,
  t,
}: {
  business: MemberBusinessProfileDto;
  locale: Locale;
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
    const hasPendingInvoice =
      business.invoiceAmountCents != null && business.invoiceStatus === 'PENDING';

    return (
      <Alert variant="success">
        <AlertTitle>{t('statusBannerApproved')}</AlertTitle>
        <AlertDescription>{t('statusBannerApprovedSub')}</AlertDescription>
        {hasPendingInvoice && (
          <div className="col-start-2 mt-5 w-full border-t border-border pt-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  {t('invoiceTitle')}
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  ${(business.invoiceAmountCents! / 100).toFixed(2)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </div>
              <PlacementCheckoutButton businessId={business.id} locale={locale} />
            </div>
          </div>
        )}
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
