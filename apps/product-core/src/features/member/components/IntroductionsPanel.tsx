'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactElement } from 'react';

import {
  MEMBER_API_ROUTES,
  type CurrentMemberProfileDto,
  type MemberIntroductionDto,
  type PublicBusinessListItemDto,
} from '@kclub/contracts';

import { Alert, AlertDescription } from '@/components/reui/alert';
import { Badge } from '@/components/reui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { parseAuthResponse } from '@/features/auth/utils/api';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';
import {
  cabinetContentClasses,
  cabinetGridPanelClasses,
} from '@/features/member/components/cabinet/styles';
import { IntroductionSubmitForm } from '@/features/member/components/IntroductionSubmitForm';
import type { Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const STATUS_LABEL_KEYS: Record<string, string> = {
  SUBMITTED: 'statusSubmitted',
  IN_REVIEW: 'statusInReview',
  APPROVED: 'statusApproved',
  COMPLETED: 'statusCompleted',
  REJECTED: 'statusRejected',
  CANCELED: 'statusCanceled',
};

const STATUS_BADGE_VARIANTS: Record<string, 'default' | 'outline' | 'success' | 'destructive'> = {
  SUBMITTED: 'outline',
  IN_REVIEW: 'outline',
  APPROVED: 'success',
  COMPLETED: 'success',
  REJECTED: 'destructive',
  CANCELED: 'outline',
};

const CANCELLABLE_STATUSES = new Set(['SUBMITTED', 'IN_REVIEW']);

function getStatusBadgeVariant(status: string): 'default' | 'outline' | 'success' | 'destructive' {
  return STATUS_BADGE_VARIANTS[status] ?? 'outline';
}

export function IntroductionsPanel({
  locale: _locale,
  profile: _profile,
  serverPublicBusinesses,
}: {
  locale: Locale;
  profile: CurrentMemberProfileDto;
  serverPublicBusinesses: PublicBusinessListItemDto[];
}): ReactElement {
  const t = useTranslations('member.dashboard.introductions');
  const tCommon = useTranslations('member.common');
  const [introductions, setIntroductions] = useState<MemberIntroductionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const businessOptions = serverPublicBusinesses.map((business) => ({
    id: business.id,
    name: `${business.name} — ${business.countryName}`,
  }));

  useEffect(() => {
    let isMounted = true;

    async function loadData(): Promise<void> {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(MEMBER_API_ROUTES.INTRODUCTIONS);
        const result = await parseAuthResponse<MemberIntroductionDto[]>(response);
        if (!isMounted) return;

        if (!result.success) {
          setError(tCommon('genericError'));
          return;
        }

        setIntroductions(result.data ?? []);
      } catch {
        if (isMounted) setError(tCommon('genericError'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [tCommon]);

  const handleIntroductionSubmitted = (introduction: MemberIntroductionDto): void => {
    setIntroductions((current) => [
      introduction,
      ...current.filter((item) => item.id !== introduction.id),
    ]);
  };

  const handleCancel = async (introductionId: string): Promise<void> => {
    try {
      const cancelUrl = MEMBER_API_ROUTES.INTRODUCTION_CANCEL.replace(':id', introductionId);
      const response = await fetch(cancelUrl, { method: 'POST' });
      const result = await parseAuthResponse<MemberIntroductionDto>(response);

      if (!result.success) {
        const message = result.errorCode
          ? t(`errors.${result.errorCode}`, { defaultValue: tCommon('genericError') })
          : tCommon('genericError');
        setError(message);
        return;
      }

      const introductionsResponse = await fetch(MEMBER_API_ROUTES.INTRODUCTIONS);
      const introductionsResult =
        await parseAuthResponse<MemberIntroductionDto[]>(introductionsResponse);
      if (introductionsResult.success && introductionsResult.data) {
        setIntroductions(introductionsResult.data);
      }
    } catch {
      setError(tCommon('genericError'));
    }
  };

  if (isLoading) {
    return (
      <div className={cn(cabinetContentClasses, 'space-y-10')}>
        <div className="space-y-4">
          <Skeleton className="h-7 w-48" />
          <div className="space-y-8">
            <div className="border border-border bg-background p-6 shadow-lg sm:p-8 lg:p-10">
              <Skeleton className="mb-8 h-6 w-48 border-b border-border pb-4" />
              <div className="space-y-6">
                <div>
                  <Skeleton className="mb-2 h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
            <div className="border border-border bg-background p-6 shadow-lg sm:p-8 lg:p-10">
              <Skeleton className="mb-8 h-6 w-48 border-b border-border pb-4" />
              <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-7 w-40" />
          <div className="space-y-3 border border-border bg-surface-muted p-7 sm:p-8">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(cabinetContentClasses, 'space-y-10')}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{t('submitTitle')}</h3>
        <IntroductionSubmitForm
          businessOptions={businessOptions}
          onSubmitted={handleIntroductionSubmitted}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{t('listTitle')}</h3>

        {introductions.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('emptyList')}</p>
        )}

        <div className="space-y-0.5">
          {introductions.map((introduction) => (
            <div key={introduction.id} className={cn(cabinetGridPanelClasses, 'space-y-3')}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{introduction.clientName}</span>
                    {' → '}
                    <span className="font-medium">{introduction.targetBusinessName}</span>
                  </p>
                  {introduction.clientContact && (
                    <p className="whitespace-pre-line text-xs text-muted-foreground">
                      {introduction.clientContact}
                    </p>
                  )}
                  {introduction.message && (
                    <p className="text-sm text-muted-foreground">{introduction.message}</p>
                  )}
                  {introduction.rejectionReason && (
                    <p className="text-sm text-destructive">
                      {t('rejectionReasonLabel')}: {introduction.rejectionReason}
                    </p>
                  )}
                  <p className="text-xs text-muted">
                    {new Date(introduction.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={getStatusBadgeVariant(introduction.status)}>
                    {t(STATUS_LABEL_KEYS[introduction.status] ?? introduction.status)}
                  </Badge>
                  {CANCELLABLE_STATUSES.has(introduction.status) && (
                    <CabinetButton
                      type="button"
                      tone="danger"
                      density="compact"
                      onClick={() => handleCancel(introduction.id)}
                      className="h-auto px-0 py-0 underline hover:bg-transparent"
                    >
                      {t('cancelAction')}
                    </CabinetButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
