'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  MEMBER_API_ROUTES,
  type CurrentMemberProfileDto,
  type MemberIntroductionDto,
  type PublicBusinessListItemDto,
} from '@kclub/contracts';
import { Badge, Skeleton, cn, Button } from '@kclub/ui';

import type { Locale } from '@/i18n/routing';
import { parseAuthResponse } from '@/features/auth/utils/api';
import { cabinetContentClasses, cabinetFieldLabelClasses, cabinetGridPanelClasses } from '@/features/member/components/cabinet/styles';

const STATUS_LABEL_KEYS: Record<string, string> = {
  SUBMITTED: 'statusSubmitted',
  IN_REVIEW: 'statusInReview',
  APPROVED: 'statusApproved',
  COMPLETED: 'statusCompleted',
  REJECTED: 'statusRejected',
  CANCELED: 'statusCanceled',
};

const STATUS_BADGE_VARIANTS: Record<string, 'default' | 'outline' | 'success'> = {
  SUBMITTED: 'outline',
  IN_REVIEW: 'outline',
  APPROVED: 'success',
  COMPLETED: 'success',
  REJECTED: 'default',
  CANCELED: 'outline',
};

const CANCELLABLE_STATUSES = new Set(['SUBMITTED', 'IN_REVIEW']);

function getStatusBadgeVariant(status: string) {
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
}) {
  const t = useTranslations('member.dashboard.introductions');
  const tCommon = useTranslations('member.common');

  const [introductions, setIntroductions] = useState<MemberIntroductionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTargetBusinessId, setSelectedTargetBusinessId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const labelClassName = cabinetFieldLabelClasses;
  const fieldClassName = 'kclub-field mt-2 w-full';

  const availableTargets = serverPublicBusinesses;

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const introsRes = await fetch(MEMBER_API_ROUTES.INTRODUCTIONS);
        const introsResult = await parseAuthResponse<MemberIntroductionDto[]>(introsRes);
        if (!isMounted) return;
        if (!introsResult.success) { setError(tCommon('genericError')); return; }
        setIntroductions(introsResult.data ?? []);
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
  }, []);

  async function handleSubmitIntroduction(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch(MEMBER_API_ROUTES.INTRODUCTIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetBusinessId: selectedTargetBusinessId,
          clientName,
          clientContact,
          message: message || null,
        }),
      });

      const result = await parseAuthResponse<MemberIntroductionDto>(response);

      if (!result.success) {
        const msg = result.errorCode
          ? t(`errors.${result.errorCode}`, { defaultValue: tCommon('genericError') })
          : tCommon('genericError');
        setSubmitError(msg);
        return;
      }

      setSubmitSuccess(true);
      setClientName('');
      setClientContact('');
      setMessage('');
      setSelectedTargetBusinessId('');

      const introsRes = await fetch(MEMBER_API_ROUTES.INTRODUCTIONS);
      const introsResult = await parseAuthResponse<MemberIntroductionDto[]>(introsRes);
      if (introsResult.success && introsResult.data) {
        setIntroductions(introsResult.data);
      }
    } catch {
      setSubmitError(tCommon('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(introductionId: string) {
    try {
      const cancelUrl = MEMBER_API_ROUTES.INTRODUCTION_CANCEL.replace(':id', introductionId);
      const response = await fetch(cancelUrl, { method: 'POST' });
      const result = await parseAuthResponse<MemberIntroductionDto>(response);

      if (!result.success) {
        const msg = result.errorCode
          ? t(`errors.${result.errorCode}`, { defaultValue: tCommon('genericError') })
          : tCommon('genericError');
        setError(msg);
        return;
      }

      const introsRes = await fetch(MEMBER_API_ROUTES.INTRODUCTIONS);
      const introsResult = await parseAuthResponse<MemberIntroductionDto[]>(introsRes);
      if (introsResult.success && introsResult.data) {
        setIntroductions(introsResult.data);
      }
    } catch {
      setError(tCommon('genericError'));
    }
  }

  if (isLoading) {
    return (
      <div className={cn(cabinetContentClasses, 'space-y-6')}>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className={cabinetContentClasses}>
      <p className="mb-9 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t('description')}</p>

      {error && (
        <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{t('submitTitle')}</h3>

        <form onSubmit={handleSubmitIntroduction} className="space-y-4">
          {submitError && (
            <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200">
              {t('submitSuccess')}
            </div>
          )}

          <div>
            <label className={labelClassName}>{t('targetBusinessLabel')}</label>
            <select
              value={selectedTargetBusinessId}
              onChange={(e) => setSelectedTargetBusinessId(e.target.value)}
              required
              className={fieldClassName}
            >
              <option value="">{t('selectPlaceholder')}</option>
              {availableTargets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.countryName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName}>{t('clientNameLabel')}</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                maxLength={200}
                className={fieldClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>{t('clientContactLabel')}</label>
              <input
                type="text"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                required
                maxLength={255}
                placeholder={t('clientContactPlaceholder')}
                className={fieldClassName}
              />
            </div>
          </div>

          <div>
            <label className={labelClassName}>{t('messageLabel')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t('messagePlaceholder')}
              className={fieldClassName}
            />
          </div>

          <Button color="brand" size="md" type="submit" disabled={isSubmitting}>
            {isSubmitting ? tCommon('saving') : t('submitCta')}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{t('listTitle')}</h3>

        {introductions.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('emptyList')}</p>
        )}

        <div className="space-y-0.5">
          {introductions.map((intro) => (
            <div key={intro.id} className={cn(cabinetGridPanelClasses, 'space-y-3')}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{intro.clientName}</span>
                    {' → '}
                    <span className="font-medium">{intro.targetBusinessName}</span>
                  </p>
                  {intro.clientContact && (
                    <p className="text-xs text-muted-foreground">{intro.clientContact}</p>
                  )}
                  {intro.message && (
                    <p className="text-sm text-muted-foreground">{intro.message}</p>
                  )}
                  {intro.rejectionReason && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {t('rejectionReasonLabel')}: {intro.rejectionReason}
                    </p>
                  )}
                  <p className="text-xs text-muted">{new Date(intro.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={getStatusBadgeVariant(intro.status)}>
                    {t(STATUS_LABEL_KEYS[intro.status] ?? intro.status)}
                  </Badge>
                  {CANCELLABLE_STATUSES.has(intro.status) && (
                    <button
                      type="button"
                      onClick={() => handleCancel(intro.id)}
                      className="text-xs text-red-600 underline hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {t('cancelAction')}
                    </button>
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
