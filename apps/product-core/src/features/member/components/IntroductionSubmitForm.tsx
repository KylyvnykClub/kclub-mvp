'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactElement } from 'react';

import { MEMBER_API_ROUTES, type MemberIntroductionDto } from '@kclub/contracts';

import { Alert, AlertDescription } from '@/components/reui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseAuthResponse } from '@/features/auth/utils/api';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';

type BusinessOption = {
  id: string;
  name: string;
};

type IntroductionFormData = {
  businessId: string;
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  clientTelegram: string;
  clientViber: string;
  clientWhatsapp: string;
  message: string;
};

export type IntroductionSubmitFormProps = {
  businessOptions: BusinessOption[];
  onSubmitted?: (introduction: MemberIntroductionDto) => void;
};

const EMPTY_FORM_DATA: IntroductionFormData = {
  businessId: '',
  clientEmail: '',
  clientName: '',
  clientPhone: '',
  clientTelegram: '',
  clientViber: '',
  clientWhatsapp: '',
  message: '',
};

const FORM_CONTROL_CLASSES =
  'w-full rounded-none border-border bg-background text-foreground focus-visible:border-accent focus-visible:ring-accent';

export function IntroductionSubmitForm({
  businessOptions,
  onSubmitted,
}: IntroductionSubmitFormProps): ReactElement {
  const t = useTranslations('member.dashboard.introductions');
  const tCommon = useTranslations('member.common');
  const [data, setData] = useState<IntroductionFormData>(EMPTY_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const setField = (key: keyof IntroductionFormData, value: string): void => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const response = await fetch(MEMBER_API_ROUTES.INTRODUCTIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetBusinessId: data.businessId,
          clientName: data.clientName,
          clientContact: [
            `${t('clientPhoneLabel')}: ${data.clientPhone.trim()}`,
            data.clientViber.trim() ? `Viber: ${data.clientViber.trim()}` : null,
            data.clientTelegram.trim() ? `Telegram: ${data.clientTelegram.trim()}` : null,
            data.clientWhatsapp.trim() ? `WhatsApp: ${data.clientWhatsapp.trim()}` : null,
            data.clientEmail.trim() ? `Email: ${data.clientEmail.trim()}` : null,
          ]
            .filter((contact): contact is string => contact !== null)
            .join('\n'),
          message: data.message || null,
        }),
      });
      const result = await parseAuthResponse<MemberIntroductionDto>(response);

      if (!result.success || !result.data) {
        const message = result.errorCode
          ? t(`errors.${result.errorCode}`, { defaultValue: tCommon('genericError') })
          : tCommon('genericError');
        setSubmitError(message);
        return;
      }

      setData(EMPTY_FORM_DATA);
      setSubmitSuccess(true);
      onSubmitted?.(result.data);
    } catch {
      setSubmitError(tCommon('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {submitError && (
        <Alert variant="destructive" className="rounded-none">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {submitSuccess && (
        <Alert variant="success" className="rounded-none" data-testid="intro-submit-success">
          <AlertDescription>{t('submitSuccess')}</AlertDescription>
        </Alert>
      )}

      <div className="border border-border bg-background p-6 shadow-lg sm:p-8 lg:p-10">
        <h2 className="mb-8 border-b border-border pb-4 text-lg font-semibold uppercase tracking-widest text-accent">
          {t('clientSectionTitle')}
        </h2>

        <div className="space-y-6">
          <div>
            <label
              className="mb-2 block text-[13px] font-medium uppercase text-muted-foreground"
              htmlFor="introduction-client-name"
            >
              {t('clientNameLabel')}
            </label>
            <Input
              id="introduction-client-name"
              data-testid="intro-client-name"
              type="text"
              value={data.clientName}
              onChange={(event) => setField('clientName', event.target.value)}
              required
              maxLength={200}
              className={FORM_CONTROL_CLASSES}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <IntroductionContactField
              id="introduction-client-phone"
              label={t('clientPhoneLabel')}
              type="tel"
              value={data.clientPhone}
              onChange={(value) => setField('clientPhone', value)}
              required
              testId="intro-client-phone"
              placeholder={t('clientContactPlaceholder')}
            />
            <IntroductionContactField
              id="introduction-client-email"
              label={t('clientEmailLabel')}
              type="email"
              value={data.clientEmail}
              onChange={(value) => setField('clientEmail', value)}
            />
            <IntroductionContactField
              id="introduction-client-viber"
              label={t('clientViberLabel')}
              value={data.clientViber}
              onChange={(value) => setField('clientViber', value)}
            />
            <IntroductionContactField
              id="introduction-client-telegram"
              label={t('clientTelegramLabel')}
              value={data.clientTelegram}
              onChange={(value) => setField('clientTelegram', value)}
            />
            <IntroductionContactField
              id="introduction-client-whatsapp"
              label={t('clientWhatsappLabel')}
              value={data.clientWhatsapp}
              onChange={(value) => setField('clientWhatsapp', value)}
            />
          </div>
        </div>
      </div>

      <div className="border border-border bg-background p-6 shadow-lg sm:p-8 lg:p-10">
        <h2 className="mb-8 border-b border-border pb-4 text-lg font-semibold uppercase tracking-widest text-accent">
          {t('requestSectionTitle')}
        </h2>

        <div className="space-y-6">
          <div>
            <label
              className="mb-2 block text-[13px] font-medium uppercase text-muted-foreground"
              htmlFor="introduction-target-business"
            >
              {t('targetBusinessLabel')}
            </label>
            {businessOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noBusinessesAvailable')}</p>
            ) : (
              <div className="relative">
                <select
                  id="introduction-target-business"
                  data-testid="intro-target-business"
                  className={`${FORM_CONTROL_CLASSES} h-12 appearance-none px-4 pr-12 text-[15px]`}
                  value={data.businessId}
                  onChange={(event) => setField('businessId', event.target.value)}
                  required
                >
                  <option value="" disabled>
                    {t('selectPlaceholder')}
                  </option>
                  {businessOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-accent"
                  size={20}
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>

          <div>
            <label
              className="mb-2 block text-[13px] font-medium uppercase text-muted-foreground"
              htmlFor="introduction-message"
            >
              {t('messageLabel')}
            </label>
            <Textarea
              id="introduction-message"
              data-testid="intro-message"
              value={data.message}
              onChange={(event) => setField('message', event.target.value)}
              maxLength={500}
              rows={5}
              placeholder={t('messagePlaceholder')}
              className={FORM_CONTROL_CLASSES}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <CabinetButton
          type="submit"
          data-testid="intro-submit"
          disabled={isSubmitting || businessOptions.length === 0}
          className="rounded-none px-10 uppercase tracking-[0.2em]"
        >
          {isSubmitting ? tCommon('saving') : t('submitCta')}
        </CabinetButton>
      </div>
    </form>
  );
}

function IntroductionContactField({
  id,
  label,
  onChange,
  placeholder,
  required = false,
  testId,
  type = 'text',
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  testId?: string;
  type?: 'email' | 'tel' | 'text';
  value: string;
}): ReactElement {
  return (
    <div>
      <label
        className="mb-2 block text-[13px] font-medium uppercase text-muted-foreground"
        htmlFor={id}
      >
        {label}
      </label>
      <Input
        id={id}
        data-testid={testId}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={type === 'email' ? 70 : 32}
        placeholder={placeholder}
        className={FORM_CONTROL_CLASSES}
      />
    </div>
  );
}
