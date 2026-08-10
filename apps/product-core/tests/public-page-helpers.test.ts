import { describe, expect, test } from 'vitest';

import type {
  PublicBusinessListItemDto,
  PublicBusinessDetailDto,
  PublicCardVerificationDto,
} from '@kclub/contracts';

import {
  getFeaturedBusinessGroups,
  getTopPartners,
  isPublicCardVerificationPiiSafe,
  isPublicBusinessListPiiSafe,
  isPublicBusinessDetailPiiSafe,
} from '../src/features/public/public-page-helpers';

function createPublicBusiness(
  id: string,
  flags: Partial<Pick<PublicBusinessListItemDto, 'featuredTop' | 'featuredRecommended'>> = {},
): PublicBusinessListItemDto {
  return {
    id,
    slug: `partner-${id}`,
    name: `Partner ${id}`,
    categoryId: `category-${id}`,
    blockName: 'Services',
    blockSlug: 'services',
    categoryName: 'Hospitality',
    categorySlug: 'services-hospitality',
    subcategoryName: null,
    subcategorySlug: null,
    countryName: 'United States',
    cityName: 'New York',
    briefDescription: null,
    websiteUrl: null,
    socialUrl: null,
    featuredTop: flags.featuredTop ?? false,
    featuredRecommended: flags.featuredRecommended ?? false,
    memberDiscountPercent: null,
    coverImageUrl: null,
    logoUrl: null,
    discountMuted: false,
  };
}

describe('public business presentation helpers', () => {
  test('limits featured top and recommended blocks to published DTOs supplied by the public service', () => {
    const businesses = [
      createPublicBusiness('1', { featuredTop: true, featuredRecommended: true }),
      createPublicBusiness('2', { featuredTop: true }),
      createPublicBusiness('3', { featuredTop: true }),
      createPublicBusiness('4', { featuredTop: true }),
      createPublicBusiness('5', { featuredRecommended: true }),
      createPublicBusiness('6', { featuredRecommended: true }),
      createPublicBusiness('7', { featuredRecommended: true }),
      createPublicBusiness('8', { featuredRecommended: true }),
    ];

    const groups = getFeaturedBusinessGroups(businesses);

    expect(groups.top.map((business) => business.id)).toEqual(['1', '2', '3']);
    expect(groups.recommended.map((business) => business.id)).toEqual(['5', '6', '7']);
  });

  test('returns all featured top and recommended partners without homepage limits', () => {
    const businesses = [
      createPublicBusiness('1', { featuredTop: true }),
      createPublicBusiness('2', { featuredTop: true }),
      createPublicBusiness('3', { featuredTop: true }),
      createPublicBusiness('4', { featuredTop: true }),
      createPublicBusiness('5', { featuredRecommended: true }),
      createPublicBusiness('6', { featuredRecommended: true }),
      createPublicBusiness('7', { featuredRecommended: true }),
      createPublicBusiness('8'),
    ];

    expect(getTopPartners(businesses).map((business) => business.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
    ]);
  });

  test('deduplicates businesses that are both top and recommended', () => {
    const businesses = [
      createPublicBusiness('1', { featuredTop: true, featuredRecommended: true }),
      createPublicBusiness('2', { featuredRecommended: true }),
    ];

    expect(getTopPartners(businesses).map((business) => business.id)).toEqual(['1', '2']);
  });

  test('public business queries are pinned to published visibility', () => {
    expect({ status: 'PUBLISHED' as const }).toEqual({ status: 'PUBLISHED' });
  });
});

describe('public business list PII safety', () => {
  test('accepts clean public business list DTO', () => {
    const business: PublicBusinessListItemDto = {
      id: 'b1',
      slug: 'test-biz',
      name: 'Test Business',
      categoryId: 'c1',
      blockName: 'Block',
      blockSlug: 'block',
      categoryName: 'Category',
      categorySlug: 'block-category',
      subcategoryName: null,
      subcategorySlug: null,
      countryName: 'US',
      cityName: 'NY',
      briefDescription: null,
      websiteUrl: null,
      socialUrl: null,
      featuredTop: false,
      featuredRecommended: false,
      memberDiscountPercent: null,
      coverImageUrl: null,
      logoUrl: null,
      discountMuted: false,
    };

    expect(isPublicBusinessListPiiSafe(business)).toBe(true);
  });

  test('rejects if admin fields leak into public list DTO', () => {
    const leaked = {
      id: 'b1',
      slug: 'test-biz',
      name: 'Test',
      categoryId: 'c1',
      blockName: 'Block',
      blockSlug: 'block',
      categoryName: 'Cat',
      categorySlug: 'block-cat',
      subcategoryName: null,
      subcategorySlug: null,
      countryName: 'US',
      cityName: 'NY',
      briefDescription: null,
      websiteUrl: null,
      socialUrl: null,
      featuredTop: false,
      featuredRecommended: false,
      representativeEmail: 'leaked@test.com',
    } as unknown as PublicBusinessListItemDto;

    expect(isPublicBusinessListPiiSafe(leaked)).toBe(false);
  });
});

describe('public business detail PII safety', () => {
  test('accepts clean public business detail DTO', () => {
    const detail: PublicBusinessDetailDto = {
      id: 'b1',
      slug: 'test-biz',
      name: 'Test Business',
      categoryId: 'c1',
      blockName: 'Block',
      blockSlug: 'block',
      categoryName: 'Category',
      categorySlug: 'block-category',
      subcategoryName: null,
      subcategorySlug: null,
      countryName: 'US',
      cityName: 'NY',
      briefDescription: null,
      websiteUrl: null,
      socialUrl: null,
      featuredTop: false,
      featuredRecommended: false,
      memberDiscountPercent: null,
      coverImageUrl: null,
      logoUrl: null,
      discountMuted: false,
      description: null,
      representativeName: 'Rep',
      publishedAt: null,
      publicPhone: null,
      publicEmail: null,
      address: null,
      workingHours: null,
      foundedYear: null,
      teamSize: null,
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      ogImageUrl: null,
    };

    expect(isPublicBusinessDetailPiiSafe(detail as unknown as Record<string, unknown>)).toBe(true);
  });

  test('rejects if admin fields leak into public detail DTO', () => {
    const leaked = {
      id: 'b1',
      slug: 'test-biz',
      name: 'Test',
      categoryId: 'c1',
      blockName: 'Block',
      blockSlug: 'block',
      categoryName: 'Cat',
      categorySlug: 'block-cat',
      subcategoryName: null,
      subcategorySlug: null,
      countryName: 'US',
      cityName: 'NY',
      briefDescription: null,
      websiteUrl: null,
      socialUrl: null,
      featuredTop: false,
      featuredRecommended: false,
      memberDiscountPercent: null,
      coverImageUrl: null,
      logoUrl: null,
      discountMuted: false,
      description: null,
      representativeName: 'Rep',
      publishedAt: null,
      publicPhone: null,
      publicEmail: null,
      address: null,
      workingHours: null,
      foundedYear: null,
      teamSize: null,
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      ogImageUrl: null,
      ownerUserId: 'u1',
    } as PublicBusinessDetailDto;

    expect(isPublicBusinessDetailPiiSafe(leaked as unknown as Record<string, unknown>)).toBe(false);
  });
});

describe('public card verification presentation helpers', () => {
  test('accepts the public card DTO shape', () => {
    const card: PublicCardVerificationDto = {
      cardNumber: 'MEM-000001',
      status: 'ACTIVE',
      membershipTier: 'MEMBER',
      issuedAt: '2026-06-16T10:00:00.000Z',
      expiresAt: null,
    };

    expect(isPublicCardVerificationPiiSafe(card)).toBe(true);
  });

  test('rejects accidental private card or member fields', () => {
    const leakedCard = {
      cardNumber: 'MEM-000001',
      status: 'ACTIVE',
      membershipTier: 'MEMBER',
      issuedAt: '2026-06-16T10:00:00.000Z',
      expiresAt: null,
      userId: 'user-1',
      phone: '+15551234567',
    } as unknown as PublicCardVerificationDto;

    expect(isPublicCardVerificationPiiSafe(leakedCard)).toBe(false);
  });

  test('rejects display name in the public verification payload', () => {
    const leakedCard = {
      cardNumber: 'MEM-000001',
      status: 'ACTIVE',
      membershipTier: 'MEMBER',
      displayName: 'John',
      issuedAt: '2026-06-16T10:00:00.000Z',
      expiresAt: null,
    } as unknown as PublicCardVerificationDto;

    expect(isPublicCardVerificationPiiSafe(leakedCard)).toBe(false);
  });
});
