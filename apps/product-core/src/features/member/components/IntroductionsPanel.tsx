'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  MEMBER_API_ROUTES,
  type CurrentMemberProfileDto,
  type MemberIntroductionDto,
  type PublicBusinessListItemDto,
} from '@kclub/contracts';

import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/routing';
import { parseAuthResponse } from '@/features/auth/utils/api';
import {
  cabinetContentClasses,
  cabinetFieldLabelClasses,
  cabinetGridPanelClasses,
} from '@/features/member/components/cabinet/styles';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/reui/badge';
import { Alert, AlertDescription } from '@/components/reui/alert';

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
const INTRODUCTION_FORM_CONTROL_CLASSES = 'rounded-none';
const INTRODUCTION_SELECT_CONTENT_CLASSES = 'rounded-none shadow-none';
const INTRODUCTION_SELECT_ITEM_CLASSES =
  'rounded-none focus:bg-transparent focus:text-popover-foreground focus:outline focus:outline-1 focus:outline-ring';

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
  const [clientPhone, setClientPhone] = useState('');
  const [clientViber, setClientViber] = useState('');
  const [clientTelegram, setClientTelegram] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const labelClassName = cabinetFieldLabelClasses;

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
        if (!introsResult.success) {
          setError(tCommon('genericError'));
          return;
        }
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
          clientContact: [
            `${t('clientPhoneLabel')}: ${clientPhone.trim()}`,
            clientViber.trim() ? `Viber: ${clientViber.trim()}` : null,
            clientTelegram.trim() ? `Telegram: ${clientTelegram.trim()}` : null,
            clientWhatsapp.trim() ? `WhatsApp: ${clientWhatsapp.trim()}` : null,
            clientEmail.trim() ? `Email: ${clientEmail.trim()}` : null,
          ]
            .filter((contact): contact is string => contact !== null)
            .join('\n'),
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
      setClientPhone('');
      setClientViber('');
      setClientTelegram('');
      setClientWhatsapp('');
      setClientEmail('');
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
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">{t('submitTitle')}</h3>

        <form onSubmit={handleSubmitIntroduction} className="space-y-4">
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {submitSuccess && (
            <Alert variant="success" data-testid="intro-submit-success">
              <AlertDescription>{t('submitSuccess')}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className={labelClassName}>{t('targetBusinessLabel')}</label>
            {availableTargets.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{t('noBusinessesAvailable')}</p>
            ) : (
              <Select
                value={selectedTargetBusinessId}
                onValueChange={(value) => setSelectedTargetBusinessId(value ?? '')}
                required
              >
                <SelectTrigger
                  data-testid="intro-target-business"
                  className={cn('w-full', INTRODUCTION_FORM_CONTROL_CLASSES)}
                >
                  <SelectValue placeholder={t('selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent className={INTRODUCTION_SELECT_CONTENT_CLASSES}>
                  {availableTargets.map((b) => (
                    <SelectItem
                      key={b.id}
                      value={b.id}
                      className={INTRODUCTION_SELECT_ITEM_CLASSES}
                    >
                      {b.name} — {b.countryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="introduction-client-name" className={labelClassName}>
                {t('clientNameLabel')}
              </label>
              <Input
                id="introduction-client-name"
                data-testid="intro-client-name"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                maxLength={200}
                className={cn('w-full', INTRODUCTION_FORM_CONTROL_CLASSES)}
              />
            </div>
            <div>
              <label htmlFor="introduction-client-phone" className={labelClassName}>
                {t('clientPhoneLabel')}
              </label>
              <Input
                id="introduction-client-phone"
                data-testid="intro-client-phone"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                required
                maxLength={32}
                placeholder={t('clientContactPlaceholder')}
                className={cn('w-full', INTRODUCTION_FORM_CONTROL_CLASSES)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="introduction-client-viber" className={labelClassName}>
                {t('clientViberLabel')}
              </label>
              <Input
                id="introduction-client-viber"
                type="text"
                value={clientViber}
                onChange={(e) => setClientViber(e.target.value)}
                maxLength={32}
                className={cn('w-full', INTRODUCTION_FORM_CONTROL_CLASSES)}
              />
            </div>
            <div>
              <label htmlFor="introduction-client-telegram" className={labelClassName}>
                {t('clientTelegramLabel')}
              </label>
              <Input
                id="introduction-client-telegram"
                type="text"
                value={clientTelegram}
                onChange={(e) => setClientTelegram(e.target.value)}
                maxLength={32}
                className={cn('w-full', INTRODUCTION_FORM_CONTROL_CLASSES)}
              />
            </div>
            <div>
              <label htmlFor="introduction-client-whatsapp" className={labelClassName}>
                {t('clientWhatsappLabel')}
              </label>
              <Input
                id="introduction-client-whatsapp"
                type="text"
                value={clientWhatsapp}
                onChange={(e) => setClientWhatsapp(e.target.value)}
                maxLength={32}
                className={cn('w-full', INTRODUCTION_FORM_CONTROL_CLASSES)}
              />
            </div>
            <div>
              <label htmlFor="introduction-client-email" className={labelClassName}>
                {t('clientEmailLabel')}
              </label>
              <Input
                id="introduction-client-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                maxLength={70}
                className={cn('w-full', INTRODUCTION_FORM_CONTROL_CLASSES)}
              />
            </div>
          </div>

          <div>
            <label className={labelClassName}>{t('messageLabel')}</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              data-testid="intro-message"
              maxLength={500}
              rows={3}
              placeholder={t('messagePlaceholder')}
              className={cn('w-full', INTRODUCTION_FORM_CONTROL_CLASSES)}
            />
          </div>

          <CabinetButton
            type="submit"
            data-testid="intro-submit"
            disabled={isSubmitting || availableTargets.length === 0}
            className={INTRODUCTION_FORM_CONTROL_CLASSES}
          >
            {isSubmitting ? tCommon('saving') : t('submitCta')}
          </CabinetButton>
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
                    <p className="text-sm text-destructive">
                      {t('rejectionReasonLabel')}: {intro.rejectionReason}
                    </p>
                  )}
                  <p className="text-xs text-muted">
                    {new Date(intro.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={getStatusBadgeVariant(intro.status)}>
                    {t(STATUS_LABEL_KEYS[intro.status] ?? intro.status)}
                  </Badge>
                  {CANCELLABLE_STATUSES.has(intro.status) && (
                    <CabinetButton
                      type="button"
                      tone="danger"
                      density="compact"
                      onClick={() => handleCancel(intro.id)}
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
