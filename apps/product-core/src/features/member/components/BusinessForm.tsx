'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

import { MEMBER_API_ROUTES, type MemberBusinessProfileDto } from '@kclub/contracts';

import { PhoneInput } from '@kclub/ui';

import type { Locale } from '@/i18n/routing';
import { parseAuthResponse } from '@/features/auth/utils/api';
import {
  defaultCountryForLocale,
  renderCountryFlag,
  shadcnPhoneInputClassName,
  shadcnPhonePanelClassName,
  shadcnPhoneTriggerClassName,
} from '@/components/ui/country-flag';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/reui/alert';
import type { CityTaxonomyOption, TaxonomyOption } from './BusinessPanel';

type BusinessFormProps = {
  locale: Locale;
  business: MemberBusinessProfileDto | null;
  countryOptions: TaxonomyOption[];
  categoryOptions: TaxonomyOption[];
};

function FormRow({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border px-0 py-5 last:border-b-0 sm:flex-row sm:items-start sm:gap-8">
      <div className="w-full shrink-0 sm:w-44 sm:pt-2.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
          {optional && (
            <span className="ml-1.5 text-xs font-normal text-muted">(optional)</span>
          )}
        </Label>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function BusinessForm({
  locale,
  business,
  countryOptions,
  categoryOptions,
}: BusinessFormProps) {
  const t = useTranslations('member.dashboard.business');
  const tCommon = useTranslations('member.common');

  const [name, setName] = useState(business?.name ?? '');
  const [representativeName, setRepresentativeName] = useState(business?.representativeName ?? '');
  const [representativeEmail, setRepresentativeEmail] = useState(
    business?.representativeEmail ?? '',
  );
  const [representativePhone, setRepresentativePhone] = useState(
    business?.representativePhone ?? '',
  );
  const [countryId, setCountryId] = useState(business?.countryId ?? '');
  const [cityId, setCityId] = useState(business?.cityId ?? '');
  const [categoryId, setCategoryId] = useState(
    business ? (categoryOptions.find((c) => business.categoryName.includes(c.name))?.id ?? '') : '',
  );
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(business?.websiteUrl ?? '');
  const [socialUrl, setSocialUrl] = useState(business?.socialUrl ?? '');
  const [briefDescription, setBriefDescription] = useState(business?.briefDescription ?? '');
  const [cityOptions, setCityOptions] = useState<CityTaxonomyOption[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [cityLoadError, setCityLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isEdit = business !== null;

  useEffect(() => {
    if (!countryId) {
      setCityId('');
      setCityOptions([]);
      setCityLoadError(null);
      setIsLoadingCities(false);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    async function loadCities(): Promise<void> {
      setIsLoadingCities(true);
      setCityLoadError(null);
      setCityOptions([]);

      try {
        const response = await fetch(
          `${MEMBER_API_ROUTES.TAXONOMY_CITIES}?countryId=${encodeURIComponent(countryId)}`,
          { signal: controller.signal },
        );
        const result = await parseAuthResponse<CityTaxonomyOption[]>(response);

        if (!isActive) return;

        if (!result.success || !result.data) {
          setCityLoadError(t('citiesLoadError'));
          return;
        }

        setCityOptions(result.data);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return;
        }

        if (isActive) {
          setCityLoadError(t('citiesLoadError'));
        }
      } finally {
        if (isActive) {
          setIsLoadingCities(false);
        }
      }
    }

    void loadCities();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [countryId, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const url = isEdit
        ? MEMBER_API_ROUTES.BUSINESS_DETAIL.replace(':id', business!.id)
        : MEMBER_API_ROUTES.BUSINESSES;

      const method = isEdit ? 'PATCH' : 'POST';

      const body: Record<string, unknown> = {
        name,
        representativeName,
        representativeEmail,
        representativePhone,
        countryId,
        cityId,
        briefDescription,
      };

      if (categoryId === '__other__') {
        body.customCategoryName = customCategoryName.trim();
      } else if (categoryId) {
        body.categoryId = categoryId;
      }
      if (countryId) body.countryId = countryId;
      if (cityId) body.cityId = cityId;

      if (websiteUrl) body.websiteUrl = websiteUrl;
      if (socialUrl) body.socialUrl = socialUrl;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await parseAuthResponse<MemberBusinessProfileDto>(response);

      if (!result.success) {
        const msg = result.errorCode
          ? t(`errors.${result.errorCode}`, { defaultValue: tCommon('genericError') })
          : tCommon('genericError');
        setError(msg);
        return;
      }

      setSuccess(true);
    } catch {
      setError(tCommon('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          <AlertDescription>{isEdit ? t('editSuccess') : t('submitSuccess')}</AlertDescription>
        </Alert>
      )}

      <div className="divide-y-0">
        <FormRow label={t('nameLabel')} htmlFor="biz-name">
          <Input
            id="biz-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="w-full"
          />
        </FormRow>

        <FormRow label={t('categoryLabel')} htmlFor="biz-category">
          <Select
            value={categoryId}
            onValueChange={(value) => {
              setCategoryId(value ?? '');
              if (value !== '__other__') setCustomCategoryName('');
            }}
            required
          >
            <SelectTrigger id="biz-category" className="w-full">
              <SelectValue placeholder={t('selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
              <SelectItem value="__other__">{t('categoryOther')}</SelectItem>
            </SelectContent>
          </Select>
          {categoryId === '__other__' && (
            <Input
              type="text"
              required
              minLength={2}
              maxLength={120}
              placeholder={t('customCategoryNamePlaceholder')}
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              className="mt-3 w-full"
            />
          )}
        </FormRow>

        <FormRow label={t('representativeNameLabel')} htmlFor="biz-rep-name">
          <Input
            id="biz-rep-name"
            type="text"
            value={representativeName}
            onChange={(e) => setRepresentativeName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="w-full"
          />
        </FormRow>

        <FormRow label={t('representativeEmailLabel')} htmlFor="biz-rep-email">
          <Input
            id="biz-rep-email"
            type="email"
            value={representativeEmail}
            onChange={(e) => setRepresentativeEmail(e.target.value)}
            required
            className="w-full"
          />
        </FormRow>

        <FormRow label={t('representativePhoneLabel')}>
          <PhoneInput
            defaultCountry={defaultCountryForLocale(locale)}
            renderFlag={renderCountryFlag}
            value={representativePhone}
            onChange={(value) => setRepresentativePhone(value)}
            required
            inputClassName={shadcnPhoneInputClassName}
            triggerClassName={shadcnPhoneTriggerClassName}
            panelClassName={shadcnPhonePanelClassName}
          />
        </FormRow>

        <FormRow label={t('countryLabel')} htmlFor="biz-country">
          <Select
            value={countryId}
            onValueChange={(value) => {
              setCountryId(value ?? '');
              setCityId('');
            }}
            required
          >
            <SelectTrigger id="biz-country" className="w-full">
              <SelectValue placeholder={t('selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {countryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        <FormRow label={t('cityLabel')} htmlFor="biz-city">
          <Select
            value={cityId}
            onValueChange={(value) => setCityId(value ?? '')}
            disabled={!countryId || isLoadingCities}
            required
          >
            <SelectTrigger id="biz-city" className="w-full">
              <SelectValue
                placeholder={isLoadingCities ? t('citiesLoading') : t('selectPlaceholder')}
              />
            </SelectTrigger>
            <SelectContent>
              {cityOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cityLoadError && <p className="mt-2 text-xs text-destructive">{cityLoadError}</p>}
        </FormRow>

        <FormRow label={t('websiteUrlLabel')} htmlFor="biz-website" optional>
          <Input
            id="biz-website"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full"
          />
        </FormRow>

        <FormRow label={t('socialUrlLabel')} htmlFor="biz-social" optional>
          <Input
            id="biz-social"
            type="url"
            value={socialUrl}
            onChange={(e) => setSocialUrl(e.target.value)}
            className="w-full"
          />
        </FormRow>

        <FormRow label={t('briefDescriptionLabel')} htmlFor="biz-desc" optional>
          <Textarea
            id="biz-desc"
            value={briefDescription ?? ''}
            onChange={(e) => setBriefDescription(e.target.value)}
            maxLength={2000}
            rows={3}
            className="w-full"
          />
        </FormRow>
      </div>

      <div className="flex justify-end pt-6">
        <CabinetButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? tCommon('saving') : isEdit ? t('editSubmit') : t('submitCta')}
        </CabinetButton>
      </div>
    </form>
  );
}
