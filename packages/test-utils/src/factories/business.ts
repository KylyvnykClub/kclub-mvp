import type {
  AdminBusinessDetailDto,
  AdminBusinessOwnerSummaryDto,
  BusinessStatus,
} from '@kclub/contracts';

import {
  makeEntityId,
  makeIsoDate,
  nextSequence,
  type FactoryOverrides,
  withOverrides,
} from './shared';

export type TestBusinessProfile = AdminBusinessDetailDto & {
  categoryId: string;
  categoryName: string;
  countryId: string;
  countryName: string;
  cityId: string;
  cityName: string;
};

function createBusinessProfileBase(
  status: BusinessStatus,
  overrides?: FactoryOverrides<TestBusinessProfile>,
): TestBusinessProfile {
  const sequence = nextSequence('business-profile');
  const createdAt = makeIsoDate(sequence, 8);
  const approvedAt =
    status === 'APPROVED' || status === 'PUBLISHED' || status === 'HIDDEN' ? createdAt : null;
  const publishedAt = status === 'PUBLISHED' ? makeIsoDate(sequence, 9) : null;
  const hiddenAt = status === 'HIDDEN' ? makeIsoDate(sequence, 10) : null;
  const rejectionReason = status === 'REJECTED' ? 'Missing verification details' : null;

  const ownerId = makeEntityId('member', sequence);
  const owner: AdminBusinessOwnerSummaryDto = {
    id: ownerId,
    phone: `+1555000${sequence.toString().padStart(4, '0')}`,
    displayName: `Member ${sequence}`,
    status: 'ACTIVE',
    membershipTier: 'VIP',
  };

  return withOverrides(
    {
      id: makeEntityId('business', sequence),
      ownerUserId: ownerId,
      slug: `business-${sequence}`,
      name: `Business ${sequence}`,
      status,
      categoryId: makeEntityId('category', 1),
      blockName: 'Hospitality, Education & Personal Services',
      blockSlug: 'hospitality-education-and-personal-services',
      categoryName: 'Hospitality',
      categorySlug: 'hospitality-education-and-personal-services-hotels-and-apartments',
      subcategoryName: 'Hotels',
      subcategorySlug: 'hospitality-education-and-personal-services-hotels-and-apartments-hotels',
      countryId: makeEntityId('country', 1),
      countryName: 'United States',
      cityId: makeEntityId('city', 1),
      cityName: 'New York',
      briefDescription: `Business ${sequence} short description`,
      description: `Business ${sequence} detailed description`,
      coverImageUrl: null,
      logoUrl: null,
      discountMuted: false,
      websiteUrl: `https://business-${sequence}.example.com`,
      socialUrl: `https://instagram.com/business_${sequence}`,
      featuredTop: false,
      featuredRecommended: false,
      memberDiscountPercent: null,
      representativeName: `Representative ${sequence}`,
      representativeEmail: `rep${sequence}@example.com`,
      representativePhone: `+1555222${sequence.toString().padStart(4, '0')}`,
      rejectionReason,
      internalNotes: status === 'UNDER_REVIEW' ? 'Awaiting moderation.' : null,
      approvedAt,
      hiddenAt,
      publishedAt,
      createdAt,
      updatedAt: createdAt,
      owner,
      placementSubscription: null,
      auditEntries: [],
    },
    overrides,
  );
}

export function createBusinessProfile(
  overrides?: FactoryOverrides<TestBusinessProfile>,
): TestBusinessProfile {
  return createBusinessProfileBase(overrides?.status ?? 'UNDER_REVIEW', overrides);
}

export function createBusinessProfileForStatus(
  status: BusinessStatus,
  overrides?: FactoryOverrides<TestBusinessProfile>,
): TestBusinessProfile {
  return createBusinessProfileBase(status, overrides);
}

export const BUSINESS_PROFILE_BY_STATUS = {
  UNDER_REVIEW: (overrides?: FactoryOverrides<TestBusinessProfile>) =>
    createBusinessProfileBase('UNDER_REVIEW', overrides),
  APPROVED: (overrides?: FactoryOverrides<TestBusinessProfile>) =>
    createBusinessProfileBase('APPROVED', overrides),
  PUBLISHED: (overrides?: FactoryOverrides<TestBusinessProfile>) =>
    createBusinessProfileBase('PUBLISHED', overrides),
  REJECTED: (overrides?: FactoryOverrides<TestBusinessProfile>) =>
    createBusinessProfileBase('REJECTED', overrides),
  HIDDEN: (overrides?: FactoryOverrides<TestBusinessProfile>) =>
    createBusinessProfileBase('HIDDEN', overrides),
} as const;
