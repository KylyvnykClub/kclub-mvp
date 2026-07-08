'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
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
import type { TaxonomyOption } from './BusinessPanel';

type BusinessFormProps = {
  locale: Locale;
  business: MemberBusinessProfileDto | null;
  countryOptions: TaxonomyOption[];
  cityOptions: TaxonomyOption[];
  categoryOptions: TaxonomyOption[];
};

export function BusinessForm({
  locale,
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
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertDescription>{isEdit ? t('editSuccess') : t('submitSuccess')}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t('nameLabel')}</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="mt-1 w-full"
          />
        </div>

        <div>
          <Label>{t('representativeNameLabel')}</Label>
          <Input
            type="text"
            value={representativeName}
            onChange={(e) => setRepresentativeName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="mt-1 w-full"
          />
        </div>

        <div>
          <Label>{t('representativeEmailLabel')}</Label>
          <Input
            type="email"
            value={representativeEmail}
            onChange={(e) => setRepresentativeEmail(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </div>

        <div>
          <Label>{t('representativePhoneLabel')}</Label>
          <PhoneInput
            defaultCountry={defaultCountryForLocale(locale)}
            renderFlag={renderCountryFlag}
            value={representativePhone}
            onChange={(value) => setRepresentativePhone(value)}
            required
            wrapperClassName="mt-1"
            inputClassName={shadcnPhoneInputClassName}
            triggerClassName={shadcnPhoneTriggerClassName}
            panelClassName={shadcnPhonePanelClassName}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>{t('countryLabel')}</Label>
          <Select value={countryId} onValueChange={(value) => setCountryId(value ?? '')} required>
            <SelectTrigger className="mt-1 w-full">
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
        </div>

        <div>
          <Label>{t('cityLabel')}</Label>
          <Select
            value={cityId}
            onValueChange={(value) => setCityId(value ?? '')}
            disabled={!countryId}
            required
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder={t('selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {cityOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t('categoryLabel')}</Label>
          <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? '')} required>
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder={t('selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>{t('websiteUrlLabel')}</Label>
          <Input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="mt-1 w-full"
          />
        </div>

        <div>
          <Label>{t('socialUrlLabel')}</Label>
          <Input
            type="url"
            value={socialUrl}
            onChange={(e) => setSocialUrl(e.target.value)}
            className="mt-1 w-full"
          />
        </div>
      </div>

      <div>
        <Label>{t('briefDescriptionLabel')}</Label>
        <Textarea
          value={briefDescription ?? ''}
          onChange={(e) => setBriefDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className="mt-1 w-full"
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? tCommon('saving') : isEdit ? t('editSubmit') : t('submitCta')}
      </Button>
    </form>
  );
}
