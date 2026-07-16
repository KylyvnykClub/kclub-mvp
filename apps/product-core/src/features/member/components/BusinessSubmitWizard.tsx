'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import { MEMBER_API_ROUTES } from '@kclub/contracts';
import { FieldError, PhoneInput, Spinner } from '@kclub/ui';

import type { Locale } from '@/i18n/routing';
import { parseAuthResponse } from '@/features/auth/utils/api';
import {
  defaultCountryForLocale,
  kclubPhonePanelClassName,
  kclubPhoneTriggerClassName,
  renderCountryFlag,
} from '@/components/ui/country-flag';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';
import type { CityTaxonomyOption, TaxonomyOption } from './BusinessPanel';

type WizardData = {
  name: string;
  categoryId: string;
  customCategoryName: string;
  representativeName: string;
  representativeEmail: string;
  representativePhone: string;
  countryId: string;
  cityId: string;
  websiteUrl: string;
  socialUrl: string;
  briefDescription: string;
  confirmAuthority: boolean;
  acceptLegal: boolean;
};

export type BusinessSubmitWizardProps = {
  locale: Locale;
  countryOptions: TaxonomyOption[];
  cityOptions: CityTaxonomyOption[];
  categoryOptions: TaxonomyOption[];
};

const TOTAL_STEPS = 4;

export function BusinessSubmitWizard({
  locale,
  countryOptions,
  cityOptions,
  categoryOptions,
}: BusinessSubmitWizardProps) {
  const t = useTranslations('member.businessOnboarding');
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    name: '',
    categoryId: '',
    customCategoryName: '',
    representativeName: '',
    representativeEmail: '',
    representativePhone: '',
    countryId: '',
    cityId: '',
    websiteUrl: '',
    socialUrl: '',
    briefDescription: '',
    confirmAuthority: false,
    acceptLegal: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labelClass =
    'block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-white/48 mb-2';
  const fieldClass = 'kclub-field w-full';

  const filteredCities = data.countryId
    ? cityOptions.filter((city) => city.countryId === data.countryId)
    : [];

  const set = <K extends keyof WizardData>(key: K, value: WizardData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const stepTitles = [t('step1Title'), t('step2Title'), t('step3Title'), t('step4Title')];
  const stepDescriptions = [
    t('step1Description'),
    t('step2Description'),
    t('step3Description'),
    t('step4Description'),
  ];

  const handleNext = (): void => {
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = (): void => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleSubmit = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const websiteUrl = normalizeUrl(data.websiteUrl);
      const socialUrl = normalizeUrl(data.socialUrl);

      const body: Record<string, unknown> = {
        name: data.name,
        representativeName: data.representativeName,
        representativeEmail: data.representativeEmail.trim(),
        representativePhone: data.representativePhone,
        countryId: data.countryId,
        cityId: data.cityId,
      };
      if (data.categoryId === '__other__') {
        body.customCategoryName = data.customCategoryName.trim();
      } else {
        body.categoryId = data.categoryId;
      }
      if (websiteUrl) body.websiteUrl = websiteUrl;
      if (socialUrl) body.socialUrl = socialUrl;
      if (data.briefDescription) body.briefDescription = data.briefDescription;

      const response = await fetch(MEMBER_API_ROUTES.BUSINESSES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await parseAuthResponse(response);

      if (!result.success) {
        setError(t('submitError'));
        return;
      }

      router.push(`/${locale}/m/dashboard?tab=business`);
      router.refresh();
    } catch {
      setError(t('submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs text-zinc-500 dark:text-white/40">
          {t('step', { current: step, total: TOTAL_STEPS })}
        </p>
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`h-px w-8 transition-colors ${
                      done ? 'bg-zinc-950 dark:bg-white' : 'bg-zinc-200 dark:bg-white/15'
                    }`}
                  />
                )}
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    done
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                      : active
                        ? 'text-zinc-950 ring-2 ring-zinc-950 dark:text-white dark:ring-white'
                        : 'bg-zinc-100 text-zinc-400 dark:bg-white/10 dark:text-white/30'
                  }`}
                >
                  {done ? <Check size={13} strokeWidth={2.5} /> : n}
                </div>
              </div>
            );
          })}
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-[0.01em] text-zinc-950 dark:text-white">
            {stepTitles[step - 1]}
          </h2>
          <p className="dark:text-white/56 mt-1 text-sm text-zinc-500">
            {stepDescriptions[step - 1]}
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label htmlFor="name" className={labelClass}>
              {t('businessName')}
            </label>
            <input
              id="name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              placeholder={t('businessNamePlaceholder')}
              value={data.name}
              onChange={(e) => set('name', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="categoryId" className={labelClass}>
              {t('category')}
            </label>
            <select
              id="categoryId"
              required
              value={data.categoryId}
              onChange={(e) => {
                set('categoryId', e.target.value);
                if (e.target.value !== '__other__') set('customCategoryName', '');
              }}
              className={fieldClass}
            >
              <option value="">{t('selectPlaceholder')}</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__other__">{t('categoryOther')}</option>
            </select>
          </div>
          {data.categoryId === '__other__' && (
            <div>
              <label htmlFor="customCategoryName" className={labelClass}>
                {t('customCategoryName')}
              </label>
              <input
                id="customCategoryName"
                type="text"
                required
                minLength={2}
                maxLength={120}
                placeholder={t('customCategoryNamePlaceholder')}
                value={data.customCategoryName}
                onChange={(e) => set('customCategoryName', e.target.value)}
                className={fieldClass}
              />
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label htmlFor="representativeName" className={labelClass}>
              {t('representativeName')}
            </label>
            <input
              id="representativeName"
              type="text"
              required
              minLength={2}
              maxLength={100}
              placeholder={t('representativeNamePlaceholder')}
              value={data.representativeName}
              onChange={(e) => set('representativeName', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="representativeEmail" className={labelClass}>
              {t('email')}
            </label>
            <input
              id="representativeEmail"
              type="email"
              required
              placeholder={t('emailPlaceholder')}
              value={data.representativeEmail}
              onChange={(e) => set('representativeEmail', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="representativePhone" className={labelClass}>
              {t('phone')}
            </label>
            <PhoneInput
              id="representativePhone"
              defaultCountry={defaultCountryForLocale(locale)}
              renderFlag={renderCountryFlag}
              required
              placeholder={t('phonePlaceholder')}
              value={data.representativePhone}
              onChange={(value) => set('representativePhone', value)}
              inputClassName={fieldClass}
              triggerClassName={kclubPhoneTriggerClassName}
              panelClassName={kclubPhonePanelClassName}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label htmlFor="countryId" className={labelClass}>
              {t('country')}
            </label>
            <select
              id="countryId"
              required
              value={data.countryId}
              onChange={(e) => {
                set('countryId', e.target.value);
                set('cityId', '');
              }}
              className={fieldClass}
            >
              <option value="">{t('selectPlaceholder')}</option>
              {countryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cityId" className={labelClass}>
              {t('city')}
            </label>
            <select
              id="cityId"
              required
              value={data.cityId}
              onChange={(e) => set('cityId', e.target.value)}
              disabled={!data.countryId}
              className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="">{t('selectPlaceholder')}</option>
              {filteredCities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="websiteUrl" className={labelClass}>
              {t('websiteUrl')}
            </label>
            <input
              id="websiteUrl"
              type="url"
              placeholder={t('websiteUrlPlaceholder')}
              value={data.websiteUrl}
              onChange={(e) => set('websiteUrl', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="socialUrl" className={labelClass}>
              {t('socialUrl')}
            </label>
            <input
              id="socialUrl"
              type="url"
              placeholder={t('socialUrlPlaceholder')}
              value={data.socialUrl}
              onChange={(e) => set('socialUrl', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="briefDescription" className={labelClass}>
              {t('briefDescription')}
            </label>
            <textarea
              id="briefDescription"
              rows={3}
              maxLength={500}
              placeholder={t('briefDescriptionPlaceholder')}
              value={data.briefDescription}
              onChange={(e) => set('briefDescription', e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="kclub-panel-soft space-y-4 p-5">
            <SummaryRow label={t('summaryBusiness')}>
              <p className="text-sm font-medium text-zinc-950 dark:text-white">{data.name}</p>
              <p className="dark:text-white/48 text-xs text-zinc-500">
                {data.categoryId === '__other__'
                  ? data.customCategoryName
                  : (categoryOptions.find((c) => c.id === data.categoryId)?.name ??
                    data.categoryId)}
              </p>
            </SummaryRow>
            <SummaryRow label={t('summaryContact')}>
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                {data.representativeName}
              </p>
              <p className="dark:text-white/48 text-xs text-zinc-500">
                {data.representativeEmail} · {data.representativePhone}
              </p>
            </SummaryRow>
            <SummaryRow label={t('summaryLocation')}>
              <p className="text-sm font-medium text-zinc-950 dark:text-white">
                {cityOptions.find((c) => c.id === data.cityId)?.name ?? '—'},{' '}
                {countryOptions.find((c) => c.id === data.countryId)?.name ?? '—'}
              </p>
              {(data.websiteUrl || data.socialUrl) && (
                <p className="dark:text-white/48 text-xs text-zinc-500">
                  {data.websiteUrl || data.socialUrl}
                </p>
              )}
            </SummaryRow>
          </div>

          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={data.confirmAuthority}
                onChange={(e) => set('confirmAuthority', e.target.checked)}
                className="kclub-checkbox mt-0.5 shrink-0"
              />
              <span className="dark:text-white/72 text-sm text-zinc-700">
                {t('confirmAuthority')}
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={data.acceptLegal}
                onChange={(e) => set('acceptLegal', e.target.checked)}
                className="kclub-checkbox mt-0.5 shrink-0"
              />
              <span className="dark:text-white/72 text-sm text-zinc-700">{t('acceptLegal')}</span>
            </label>
          </div>

          {error && <FieldError>{error}</FieldError>}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-white/10">
        <CabinetButton
          type="button"
          tone="link"
          density="compact"
          onClick={handleBack}
          disabled={step === 1 || isSubmitting}
          className="dark:text-white/48 uppercase tracking-[0.14em] text-zinc-500 hover:text-zinc-950 disabled:invisible dark:hover:text-white"
        >
          {t('back')}
        </CabinetButton>

        {step < TOTAL_STEPS ? (
          <CabinetButton
            type="button"
            onClick={handleNext}
            disabled={!canAdvance(step, data)}
            className="uppercase tracking-[0.14em]"
          >
            {t('continue')}
          </CabinetButton>
        ) : (
          <CabinetButton
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !data.confirmAuthority || !data.acceptLegal}
            iconStart={isSubmitting ? <Spinner size={13} /> : null}
            className="uppercase tracking-[0.14em]"
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </CabinetButton>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-[0.14em] text-zinc-400 dark:text-white/30">
        {label}
      </p>
      {children}
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function canAdvance(step: number, data: WizardData): boolean {
  if (step === 1) {
    if (!data.name.trim() || !data.categoryId) return false;
    if (data.categoryId === '__other__' && !data.customCategoryName.trim()) return false;
    return true;
  }
  if (step === 2) {
    return (
      !!data.representativeName.trim() &&
      EMAIL_RE.test(data.representativeEmail.trim()) &&
      !!data.representativePhone.trim()
    );
  }
  if (step === 3) {
    return !!data.countryId && !!data.cityId && !!(data.websiteUrl || data.socialUrl);
  }
  return true;
}
