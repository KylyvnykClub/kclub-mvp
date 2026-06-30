'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@kclub/ui';
import { MEMBER_API_ROUTES, type MemberBusinessProfileDto } from '@kclub/contracts';

import type { Locale } from '@/i18n/routing';
import { parseAuthResponse } from '@/features/auth/utils/api';
import type { TaxonomyOption } from './BusinessPanel';

type BusinessFormProps = {
  locale: Locale;
  business: MemberBusinessProfileDto | null;
  countryOptions: TaxonomyOption[];
  cityOptions: TaxonomyOption[];
  categoryOptions: TaxonomyOption[];
};

export function BusinessForm({
  locale: _locale,
  business,
  countryOptions,
  cityOptions,
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
  const [countryId, setCountryId] = useState(
    business ? (countryOptions.find((c) => business.countryName.includes(c.name))?.id ?? '') : '',
  );
  const [cityId, setCityId] = useState(
    business ? (cityOptions.find((c) => business.cityName.includes(c.name))?.id ?? '') : '',
  );
  const [categoryId, setCategoryId] = useState(
    business ? (categoryOptions.find((c) => business.categoryName.includes(c.name))?.id ?? '') : '',
  );
  const [websiteUrl, setWebsiteUrl] = useState(business?.websiteUrl ?? '');
  const [socialUrl, setSocialUrl] = useState(business?.socialUrl ?? '');
  const [briefDescription, setBriefDescription] = useState(business?.briefDescription ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const labelClassName = 'block text-sm font-medium text-zinc-700 dark:text-white/72';
  const fieldClassName = 'kclub-field mt-1';

  const isEdit = business !== null;

  const filteredCities = useMemo(() => {
    if (!countryId) return [];
    const selectedCountry = countryOptions.find((c) => c.id === countryId);
    if (!selectedCountry) return [];
    return cityOptions.filter((city) => {
      const cityCountryId = cityOptions.find((c) => c.id === city.id);
      return true;
    });
  }, [countryId, cityOptions]);

  useEffect(() => {
    if (!countryId) {
      setCityId('');
    }
  }, [countryId]);

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
        categoryId,
        briefDescription,
      };

      if (categoryId) body.categoryId = categoryId;
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200">
          {isEdit ? t('editSuccess') : t('submitSuccess')}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>{t('nameLabel')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>{t('representativeNameLabel')}</label>
          <input
            type="text"
            value={representativeName}
            onChange={(e) => setRepresentativeName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>{t('representativeEmailLabel')}</label>
          <input
            type="email"
            value={representativeEmail}
            onChange={(e) => setRepresentativeEmail(e.target.value)}
            required
            className={fieldClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>{t('representativePhoneLabel')}</label>
          <input
            type="tel"
            value={representativePhone}
            onChange={(e) => setRepresentativePhone(e.target.value)}
            required
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClassName}>{t('countryLabel')}</label>
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              required
              className={fieldClassName}
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
            <label className={labelClassName}>{t('cityLabel')}</label>
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              required
              disabled={!countryId}
              className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <option value="">{t('selectPlaceholder')}</option>
              {cityOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClassName}>{t('categoryLabel')}</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className={fieldClassName}
            >
              <option value="">{t('selectPlaceholder')}</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>{t('websiteUrlLabel')}</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className={fieldClassName}
          />
        </div>

        <div>
          <label className={labelClassName}>{t('socialUrlLabel')}</label>
          <input
            type="url"
            value={socialUrl}
            onChange={(e) => setSocialUrl(e.target.value)}
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label className={labelClassName}>{t('briefDescriptionLabel')}</label>
        <textarea
          value={briefDescription ?? ''}
          onChange={(e) => setBriefDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className={fieldClassName}
        />
      </div>

      <Button color="brand" size="md" type="submit" disabled={isSubmitting}>
        {isSubmitting ? tCommon('saving') : isEdit ? t('editSubmit') : t('submitCta')}
      </Button>
    </form>
  );
}
