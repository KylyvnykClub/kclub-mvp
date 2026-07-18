'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlignLeft,
  Building2,
  Folder,
  Globe,
  Link2,
  Mail,
  MapPin,
  Phone,
  Tags,
  UserRound,
} from 'lucide-react';

import { MEMBER_API_ROUTES, type MemberBusinessProfileDto } from '@kclub/contracts';

import { PhoneInput } from '@kclub/ui';

import { cn } from '@/lib/utils';
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

type BusinessFormFieldProps = {
  icon: ReactNode;
  children: ReactNode;
};

const TEXTAREA_CHARACTERS_PER_ROW = 74;

function getBriefDescriptionRows(value: string): number {
  const rows = value.split('\n').reduce((sum, line) => {
    return sum + Math.max(1, Math.ceil(line.length / TEXTAREA_CHARACTERS_PER_ROW));
  }, 0);

  return Math.min(Math.max(rows, 5), 32);
}

function BusinessFormField({ icon, children }: BusinessFormFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-7 flex size-4 shrink-0 items-center justify-center text-muted-foreground">
        {icon}
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
  const briefDescriptionRows = getBriefDescriptionRows(briefDescription ?? '');

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
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <div className="space-y-5">
        <BusinessFormField icon={<Building2 size={16} aria-hidden />}>
          <Label>{t('nameLabel')}</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="mt-1 w-full rounded-none"
          />
        </BusinessFormField>

        <BusinessFormField icon={<UserRound size={16} aria-hidden />}>
          <Label>{t('representativeNameLabel')}</Label>
          <Input
            type="text"
            value={representativeName}
            onChange={(e) => setRepresentativeName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="mt-1 w-full rounded-none"
          />
        </BusinessFormField>

        <BusinessFormField icon={<Mail size={16} aria-hidden />}>
          <Label>{t('representativeEmailLabel')}</Label>
          <Input
            type="email"
            value={representativeEmail}
            onChange={(e) => setRepresentativeEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-none"
          />
        </BusinessFormField>

        <BusinessFormField icon={<Phone size={16} aria-hidden />}>
          <Label>{t('representativePhoneLabel')}</Label>
          <PhoneInput
            defaultCountry={defaultCountryForLocale(locale)}
            renderFlag={renderCountryFlag}
            value={representativePhone}
            onChange={(value) => setRepresentativePhone(value)}
            required
            wrapperClassName="mt-1"
            inputClassName={cn(shadcnPhoneInputClassName, 'rounded-none')}
            triggerClassName={cn(shadcnPhoneTriggerClassName, 'rounded-none')}
            panelClassName={shadcnPhonePanelClassName}
          />
        </BusinessFormField>

        <BusinessFormField icon={<Globe size={16} aria-hidden />}>
          <Label>{t('countryLabel')}</Label>
          <Select
            value={countryId}
            onValueChange={(value) => {
              setCountryId(value ?? '');
              setCityId('');
            }}
            required
          >
            <SelectTrigger className="mt-1 w-full rounded-none">
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
        </BusinessFormField>

        <BusinessFormField icon={<MapPin size={16} aria-hidden />}>
          <Label>{t('cityLabel')}</Label>
          <Select
            value={cityId}
            onValueChange={(value) => setCityId(value ?? '')}
            disabled={!countryId || isLoadingCities}
            required
          >
            <SelectTrigger className="mt-1 w-full rounded-none">
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
        </BusinessFormField>

        <BusinessFormField icon={<Tags size={16} aria-hidden />}>
          <Label>{t('categoryLabel')}</Label>
          <Select
            value={categoryId}
            onValueChange={(value) => {
              setCategoryId(value ?? '');
              if (value !== '__other__') setCustomCategoryName('');
            }}
            required
          >
            <SelectTrigger className="mt-1 w-full rounded-none">
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
            <div className="mt-2">
              <Label>{t('customCategoryName')}</Label>
              <Input
                type="text"
                required
                minLength={2}
                maxLength={120}
                placeholder={t('customCategoryNamePlaceholder')}
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                className="mt-1 w-full rounded-none"
              />
            </div>
          )}
        </BusinessFormField>

        <BusinessFormField icon={<Link2 size={16} aria-hidden />}>
          <Label>{t('websiteUrlLabel')}</Label>
          <Input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="mt-1 w-full rounded-none"
          />
        </BusinessFormField>

        <BusinessFormField icon={<Folder size={16} aria-hidden />}>
          <Label>{t('socialUrlLabel')}</Label>
          <Input
            type="url"
            value={socialUrl}
            onChange={(e) => setSocialUrl(e.target.value)}
            className="mt-1 w-full rounded-none"
          />
        </BusinessFormField>

        <BusinessFormField icon={<AlignLeft size={16} aria-hidden />}>
          <Label>{t('briefDescriptionLabel')}</Label>
          <Textarea
            value={briefDescription ?? ''}
            onChange={(e) => setBriefDescription(e.target.value)}
            maxLength={2000}
            rows={briefDescriptionRows}
            className="mt-1 w-full resize-none overflow-hidden rounded-none"
          />
        </BusinessFormField>
      </div>

      <CabinetButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? tCommon('saving') : isEdit ? t('editSubmit') : t('submitCta')}
      </CabinetButton>
    </form>
  );
}
