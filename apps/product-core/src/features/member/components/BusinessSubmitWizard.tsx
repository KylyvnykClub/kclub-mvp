'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Check,
  User,
  Mail,
  Globe,
  Building2,
  Briefcase,
  Tag,
  AlignLeft,
  Percent,
  ArrowRight,
  ChevronDown,
  MapPin,
  Building,
} from 'lucide-react';

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

import type { CategoryTaxonomyOption, CityTaxonomyOption, TaxonomyOption } from './BusinessPanel';

type WizardData = {
  name: string;
  sphereId: string;
  categoryGroupId: string;
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
  memberDiscountPercent: string;
  confirmAuthority: boolean;
  acceptLegal: boolean;
};

export type BusinessSubmitWizardProps = {
  locale: Locale;
  countryOptions: TaxonomyOption[];
  cityOptions?: CityTaxonomyOption[];
  categoryOptions: CategoryTaxonomyOption[];
  memberPhone?: string;
};

const TOTAL_STEPS = 4;

export function BusinessSubmitWizard({
  locale,
  countryOptions,
  cityOptions: initialCityOptions = [],
  categoryOptions,
  memberPhone = '',
}: BusinessSubmitWizardProps) {
  const t = useTranslations('member.businessOnboarding');

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    name: '',
    sphereId: '',
    categoryGroupId: '',
    categoryId: '',
    customCategoryName: '',
    representativeName: '',
    representativeEmail: '',
    representativePhone: memberPhone,
    countryId: '',
    cityId: '',
    websiteUrl: '',
    socialUrl: '',
    briefDescription: '',
    memberDiscountPercent: '',
    confirmAuthority: false,
    acceptLegal: false,
  });
  const [cityOptions, setCityOptions] = useState<CityTaxonomyOption[]>(initialCityOptions);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [cityLoadError, setCityLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labelClass =
    'mb-2 block text-[13px] font-medium uppercase tracking-[0.2em] text-muted-foreground';
  const fieldClass =
    'w-full border border-border bg-background py-3 pl-12 pr-4 text-[15px] text-foreground transition-colors placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
  const fieldClassNoIcon =
    'w-full border border-border bg-background py-3 px-4 text-[15px] text-foreground transition-colors placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
  const selectClass =
    'w-full appearance-none border border-border bg-background py-3 pl-12 pr-10 text-[15px] text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed';

  const filteredCities = data.countryId
    ? cityOptions.filter((city) => city.countryId === data.countryId)
    : [];
  const sphereOptions = categoryOptions.filter((category) => category.level === 'BLOCK');
  const categoryGroupOptions = data.sphereId
    ? categoryOptions.filter(
        (category) => category.level === 'CATEGORY' && category.parentId === data.sphereId,
      )
    : [];
  const activityOptions = data.categoryGroupId
    ? categoryOptions.filter(
        (category) =>
          category.level === 'SUBCATEGORY' && category.parentId === data.categoryGroupId,
      )
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

  useEffect(() => {
    if (!data.countryId) {
      setCityOptions([]);
      setCityLoadError(null);
      setIsLoadingCities(false);
      return;
    }

    const controller = new AbortController();

    async function loadCities(): Promise<void> {
      setIsLoadingCities(true);
      setCityLoadError(null);

      try {
        const response = await fetch(
          `${MEMBER_API_ROUTES.TAXONOMY_CITIES}?countryId=${encodeURIComponent(data.countryId)}`,
          { signal: controller.signal },
        );
        const result = await parseAuthResponse<CityTaxonomyOption[]>(response);

        if (!result.success || !result.data) {
          setCityOptions([]);
          setCityLoadError(t('citiesLoadError'));
          return;
        }

        setCityOptions(result.data);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return;
        }

        setCityOptions([]);
        setCityLoadError(t('citiesLoadError'));
      } finally {
        setIsLoadingCities(false);
      }
    }

    void loadCities();

    return () => {
      controller.abort();
    };
  }, [data.countryId, t]);

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
      if (data.memberDiscountPercent) {
        body.memberDiscountPercent = Number(data.memberDiscountPercent);
      }

      const response = await fetch(
        `${MEMBER_API_ROUTES.BUSINESS_RESERVE_REVIEW}?locale=${encodeURIComponent(locale)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );

      const result = await parseAuthResponse<{ checkoutUrl: string }>(response);

      if (!result.success || !result.data?.checkoutUrl) {
        setError(t('submitError'));
        return;
      }

      window.location.href = result.data.checkoutUrl;
    } catch {
      setError(t('submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="business-onboarding-wizard">
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} className="flex items-center gap-4">
                {i > 0 && (
                  <div
                    className={`h-px w-6 transition-colors sm:w-8 ${
                      done ? 'bg-accent/50' : 'bg-border'
                    }`}
                  />
                )}
                <div
                  className={`flex h-8 w-8 items-center justify-center border text-[13px] font-medium transition-colors ${
                    done
                      ? 'border-border bg-surface-muted text-muted-foreground'
                      : active
                        ? 'border-accent bg-background text-accent shadow-[0_0_10px_rgba(var(--color-accent),0.2)]'
                        : 'border-border bg-background text-muted-foreground opacity-50'
                  }`}
                >
                  {done ? <Check size={14} strokeWidth={2.5} /> : n}
                </div>
              </div>
            );
          })}
        </div>
        <div className="md:text-right">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
            {t('step', { current: step, total: TOTAL_STEPS })}
          </span>
          <h2 className="text-2xl font-semibold tracking-wide text-foreground md:text-[28px]">
            {stepTitles[step - 1]}
          </h2>
        </div>
      </div>
      <p className="mb-10 max-w-lg text-[15px] text-muted-foreground">
        {stepDescriptions[step - 1]}
      </p>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label htmlFor="name" className={labelClass}>
              {t('businessName')}
              <RequiredMark />
            </label>
            <div className="relative">
              <Building2
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <input
                id="name"
                data-testid="business-wizard-name"
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
          </div>
          <div>
            <label htmlFor="sphereId" className={labelClass}>
              {t('sphere')}
              <RequiredMark />
            </label>
            <div className="relative">
              <Globe
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <select
                id="sphereId"
                data-testid="business-wizard-sphere"
                required
                value={data.sphereId}
                onChange={(e) => {
                  const nextSphereId = e.target.value;
                  setData((prev) => ({
                    ...prev,
                    sphereId: nextSphereId,
                    categoryGroupId: '',
                    categoryId: '',
                    customCategoryName: '',
                  }));
                }}
                className={selectClass}
              >
                <option value="">{t('selectPlaceholder')}</option>
                {sphereOptions.map((sphere) => (
                  <option key={sphere.id} value={sphere.id}>
                    {sphere.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
            </div>
          </div>

          {data.sphereId && (
            <div>
              <label htmlFor="categoryGroupId" className={labelClass}>
                {t('category')}
                <RequiredMark />
              </label>
              <div className="relative">
                <Tag
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <select
                  id="categoryGroupId"
                  data-testid="business-wizard-category-group"
                  required
                  value={data.categoryGroupId}
                  onChange={(e) => {
                    const nextCategoryGroupId = e.target.value;
                    setData((prev) => ({
                      ...prev,
                      categoryGroupId: nextCategoryGroupId,
                      categoryId: '',
                      customCategoryName: '',
                    }));
                  }}
                  className={selectClass}
                >
                  <option value="">{t('selectPlaceholder')}</option>
                  {categoryGroupOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
              </div>
            </div>
          )}

          {data.sphereId && data.categoryGroupId && (
            <div>
              <label htmlFor="categoryId" className={labelClass}>
                {t('activityType')}
                <RequiredMark />
              </label>
              <div className="relative">
                <Briefcase
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <select
                  id="categoryId"
                  data-testid="business-wizard-category"
                  required
                  value={data.categoryId}
                  onChange={(e) => {
                    set('categoryId', e.target.value);
                    if (e.target.value !== '__other__') set('customCategoryName', '');
                  }}
                  className={selectClass}
                >
                  <option value="">{t('selectPlaceholder')}</option>
                  {activityOptions.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name}
                    </option>
                  ))}
                  <option value="__other__">{t('activityTypeOther')}</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
              </div>
            </div>
          )}

          {data.categoryId === '__other__' && (
            <div>
              <label htmlFor="customCategoryName" className={labelClass}>
                {t('customActivityTypeName')}
                <RequiredMark />
              </label>
              <input
                id="customCategoryName"
                type="text"
                required
                minLength={2}
                maxLength={120}
                placeholder={t('customActivityTypeNamePlaceholder')}
                value={data.customCategoryName}
                onChange={(e) => set('customCategoryName', e.target.value)}
                className={fieldClassNoIcon}
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
              <RequiredMark />
            </label>
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <input
                id="representativeName"
                data-testid="business-wizard-representative-name"
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
          </div>
          <div>
            <label htmlFor="representativeEmail" className={labelClass}>
              {t('email')}
              <RequiredMark />
            </label>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <input
                id="representativeEmail"
                data-testid="business-wizard-representative-email"
                type="email"
                required
                placeholder={t('emailPlaceholder')}
                value={data.representativeEmail}
                onChange={(e) => set('representativeEmail', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="representativePhone" className={labelClass}>
              {t('phone')}
              <RequiredMark />
            </label>
            <PhoneInput
              id="representativePhone"
              defaultCountry={defaultCountryForLocale(locale)}
              renderFlag={renderCountryFlag}
              required
              placeholder={t('phonePlaceholder')}
              value={data.representativePhone}
              onChange={(value) => set('representativePhone', value)}
              inputClassName={fieldClassNoIcon}
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
              <RequiredMark />
            </label>
            <div className="relative">
              <Globe
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <select
                id="countryId"
                data-testid="business-wizard-country"
                required
                value={data.countryId}
                onChange={(e) => {
                  set('countryId', e.target.value);
                  set('cityId', '');
                }}
                className={selectClass}
              >
                <option value="">{t('selectPlaceholder')}</option>
                {countryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
            </div>
          </div>
          <div>
            <label htmlFor="cityId" className={labelClass}>
              {t('city')}
              <RequiredMark />
            </label>
            <div className="relative">
              <MapPin
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <select
                id="cityId"
                data-testid="business-wizard-city"
                required
                value={data.cityId}
                onChange={(e) => set('cityId', e.target.value)}
                disabled={!data.countryId || isLoadingCities}
                className={selectClass}
              >
                <option value="">
                  {isLoadingCities ? t('citiesLoading') : t('selectPlaceholder')}
                </option>
                {filteredCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
            </div>
            {cityLoadError && <FieldError>{cityLoadError}</FieldError>}
          </div>
          <div>
            <label htmlFor="websiteUrl" className={labelClass}>
              {t('websiteUrl')}
            </label>
            <div className="relative">
              <Globe
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <input
                id="websiteUrl"
                data-testid="business-wizard-website"
                type="url"
                placeholder={t('websiteUrlPlaceholder')}
                value={data.websiteUrl}
                onChange={(e) => set('websiteUrl', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="socialUrl" className={labelClass}>
              {t('socialUrl')}
            </label>
            <div className="relative">
              <Building
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <input
                id="socialUrl"
                type="url"
                placeholder={t('socialUrlPlaceholder')}
                value={data.socialUrl}
                onChange={(e) => set('socialUrl', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="briefDescription" className={labelClass}>
              {t('briefDescription')}
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 text-muted-foreground" size={20} />
              <textarea
                id="briefDescription"
                rows={3}
                maxLength={2000}
                placeholder={t('briefDescriptionPlaceholder')}
                value={data.briefDescription}
                onChange={(e) => set('briefDescription', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="memberDiscountPercent" className={labelClass}>
              {t('memberDiscount')}
            </label>
            <div className="relative">
              <Percent
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={20}
              />
              <input
                id="memberDiscountPercent"
                type="number"
                min={1}
                max={100}
                placeholder={t('memberDiscountPlaceholder')}
                value={data.memberDiscountPercent}
                onChange={(e) => set('memberDiscountPercent', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-4 border border-border bg-background p-6">
            <SummaryRow label={t('summaryBusiness')}>
              <p className="text-sm font-medium text-foreground">{data.name}</p>
              <p className="text-xs text-muted-foreground">
                {data.categoryId === '__other__'
                  ? data.customCategoryName
                  : (categoryOptions.find((c) => c.id === data.categoryId)?.name ??
                    data.categoryId)}
              </p>
            </SummaryRow>
            <SummaryRow label={t('summaryContact')}>
              <p className="text-sm font-medium text-foreground">{data.representativeName}</p>
              <p className="text-xs text-muted-foreground">
                {data.representativeEmail} · {data.representativePhone}
              </p>
            </SummaryRow>
            <SummaryRow label={t('summaryLocation')}>
              <p className="text-sm font-medium text-foreground">
                {cityOptions.find((c) => c.id === data.cityId)?.name ?? '—'},{' '}
                {countryOptions.find((c) => c.id === data.countryId)?.name ?? '—'}
              </p>
              {(data.websiteUrl || data.socialUrl) && (
                <p className="text-xs text-muted-foreground">{data.websiteUrl || data.socialUrl}</p>
              )}
            </SummaryRow>
            {data.memberDiscountPercent && (
              <SummaryRow label={t('summaryDiscount')}>
                <p className="text-sm font-medium text-foreground">{data.memberDiscountPercent}%</p>
              </SummaryRow>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <label className="group flex cursor-pointer items-start gap-4">
              <div className="relative mt-0.5 flex items-center justify-center">
                <input
                  data-testid="business-wizard-confirm-authority"
                  type="checkbox"
                  checked={data.confirmAuthority}
                  onChange={(e) => set('confirmAuthority', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="group-hover:border-accent/50 flex h-5 w-5 items-center justify-center border border-border bg-background transition-colors peer-checked:border-accent peer-checked:bg-accent">
                  <Check
                    className="opacity-0 transition-opacity peer-checked:opacity-100"
                    size={14}
                    strokeWidth={3}
                    color="#0A0908"
                  />
                </div>
              </div>
              <span className="text-[15px] text-muted-foreground transition-colors group-hover:text-foreground">
                {t('confirmAuthority')}
              </span>
            </label>
            <label className="group flex cursor-pointer items-start gap-4">
              <div className="relative mt-0.5 flex items-center justify-center">
                <input
                  data-testid="business-wizard-accept-legal"
                  type="checkbox"
                  checked={data.acceptLegal}
                  onChange={(e) => set('acceptLegal', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="group-hover:border-accent/50 flex h-5 w-5 items-center justify-center border border-border bg-background transition-colors peer-checked:border-accent peer-checked:bg-accent">
                  <Check
                    className="opacity-0 transition-opacity peer-checked:opacity-100"
                    size={14}
                    strokeWidth={3}
                    color="#0A0908"
                  />
                </div>
              </div>
              <span className="text-[15px] text-muted-foreground transition-colors group-hover:text-foreground">
                {t('acceptLegal')}
              </span>
            </label>
          </div>

          {error && <FieldError>{error}</FieldError>}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-border pt-8">
        <button
          data-testid="business-wizard-back"
          type="button"
          onClick={handleBack}
          disabled={step === 1 || isSubmitting}
          className="text-[13px] font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-accent disabled:invisible"
        >
          {t('back')}
        </button>

        {step < TOTAL_STEPS ? (
          <button
            data-testid="business-wizard-continue"
            type="button"
            onClick={handleNext}
            disabled={!canAdvance(step, data)}
            className="hover:bg-accent/90 flex items-center gap-2 bg-accent px-8 py-4 text-[13px] font-medium uppercase tracking-[0.2em] text-zinc-950 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('continue')}
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            data-testid="business-wizard-submit"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !data.confirmAuthority || !data.acceptLegal}
            className="hover:bg-accent/90 flex items-center gap-2 bg-accent px-8 py-4 text-[13px] font-medium uppercase tracking-[0.2em] text-zinc-950 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? <Spinner size={18} /> : null}
            {isSubmitting ? t('submitting') : t('submit')}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[13px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function RequiredMark() {
  return <span className="ml-1 text-accent">*</span>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function canAdvance(step: number, data: WizardData): boolean {
  if (step === 1) {
    if (!data.name.trim() || !data.sphereId || !data.categoryGroupId || !data.categoryId) {
      return false;
    }
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
    return !!data.countryId && !!data.cityId;
  }
  return true;
}
