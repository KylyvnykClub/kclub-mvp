import { describe, expect, test } from 'vitest';

import {
  toMemberBusinessProfileDto,
  toPublicBusinessDetailDto,
  toPublicBusinessListItemDto,
} from '../../src/server/services/business-service';

describe('toPublicBusinessListItemDto', () => {
  const baseBusiness = {
    id: 'bus-1',
    slug: 'bus-slug',
    name: 'Business Name',
    category_id: 'category-1',
    category: {
      name: 'Subcategory',
      slug: 'block-category-subcategory',
      level: 'SUBCATEGORY',
      parent: {
        name: 'Category',
        slug: 'block-category',
        parent: { name: 'Block', slug: 'block' },
      },
    },
    country: { name: 'Country' },
    city: { name: 'City' },
    brief_description: 'Brief',
    website_url: 'http://example.com',
    social_url: null,
    featured_top: true,
    featured_recommended: false,
    member_discount_percent: 15,
    cover_image_url: null,
    logo_url: null,
    discount_muted: false,
  };

  test('maps to public list item DTO correctly', () => {
    const dto = toPublicBusinessListItemDto(baseBusiness);

    expect(dto).toEqual({
      id: 'bus-1',
      slug: 'bus-slug',
      name: 'Business Name',
      categoryId: 'category-1',
      blockName: 'Block',
      blockSlug: 'block',
      categoryName: 'Category',
      categorySlug: 'block-category',
      subcategoryName: 'Subcategory',
      subcategorySlug: 'block-category-subcategory',
      countryName: 'Country',
      cityName: 'City',
      briefDescription: 'Brief',
      websiteUrl: 'http://example.com',
      socialUrl: null,
      featuredTop: true,
      featuredRecommended: false,
      memberDiscountPercent: 15,
      coverImageUrl: null,
      logoUrl: null,
      discountMuted: false,
    });
  });
});

describe('toPublicBusinessDetailDto', () => {
  const baseBusiness = {
    id: 'bus-1',
    slug: 'bus-slug',
    name: 'Business Name',
    country_id: 'country-1',
    city_id: 'city-1',
    category_id: 'category-1',
    category: { name: 'Category', slug: 'category', level: 'CATEGORY' },
    country: { name: 'Country' },
    city: { name: 'City' },
    brief_description: 'Brief',
    website_url: 'http://example.com',
    social_url: null,
    featured_top: true,
    featured_recommended: false,
    member_discount_percent: null,
    cover_image_url: null,
    logo_url: null,
    discount_muted: false,
    description: 'Full description',
    representative_name: 'Rep Name',
    published_at: new Date('2026-06-15T10:00:00.000Z'),
  };

  test('maps to public detail DTO correctly', () => {
    const dto = toPublicBusinessDetailDto(baseBusiness);

    expect(dto).toEqual({
      id: 'bus-1',
      slug: 'bus-slug',
      name: 'Business Name',
      categoryId: 'category-1',
      blockName: null,
      blockSlug: null,
      categoryName: 'Category',
      categorySlug: 'category',
      subcategoryName: null,
      subcategorySlug: null,
      countryName: 'Country',
      cityName: 'City',
      briefDescription: 'Brief',
      websiteUrl: 'http://example.com',
      socialUrl: null,
      featuredTop: true,
      featuredRecommended: false,
      memberDiscountPercent: null,
      coverImageUrl: null,
      logoUrl: null,
      discountMuted: false,
      description: 'Full description',
      representativeName: 'Rep Name',
      publishedAt: '2026-06-15T10:00:00.000Z',
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
    });
  });
});

describe('toMemberBusinessProfileDto', () => {
  const baseBusiness = {
    id: 'bus-1',
    slug: 'bus-slug',
    name: 'Business Name',
    country_id: 'country-1',
    city_id: 'city-1',
    category_id: 'category-1',
    category: { name: 'Category', slug: 'category', level: 'CATEGORY' },
    country: { name: 'Country' },
    city: { name: 'City' },
    brief_description: 'Brief',
    website_url: 'http://example.com',
    social_url: null,
    featured_top: true,
    featured_recommended: false,
    member_discount_percent: null,
    cover_image_url: null,
    logo_url: null,
    discount_muted: false,
    description: 'Full description',
    representative_name: 'Rep Name',
    published_at: null,
    status: 'UNDER_REVIEW',
    representative_email: 'rep@example.com',
    representative_phone: '+15551234567',
    rejection_reason: null,
    created_at: new Date('2026-06-15T10:00:00.000Z'),
    updated_at: new Date('2026-06-15T10:00:00.000Z'),
  };

  test('maps to member profile DTO correctly', () => {
    const dto = toMemberBusinessProfileDto(baseBusiness);

    expect(dto).toEqual({
      id: 'bus-1',
      slug: 'bus-slug',
      name: 'Business Name',
      categoryId: 'category-1',
      blockName: null,
      blockSlug: null,
      categoryName: 'Category',
      categorySlug: 'category',
      subcategoryName: null,
      subcategorySlug: null,
      countryName: 'Country',
      cityName: 'City',
      briefDescription: 'Brief',
      websiteUrl: 'http://example.com',
      socialUrl: null,
      featuredTop: true,
      featuredRecommended: false,
      memberDiscountPercent: null,
      coverImageUrl: null,
      logoUrl: null,
      discountMuted: false,
      description: 'Full description',
      representativeName: 'Rep Name',
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
      countryId: 'country-1',
      cityId: 'city-1',
      status: 'UNDER_REVIEW',
      representativeEmail: 'rep@example.com',
      representativePhone: '+15551234567',
      rejectionReason: null,
      verificationDocuments: [],
      createdAt: '2026-06-15T10:00:00.000Z',
      updatedAt: '2026-06-15T10:00:00.000Z',
    });
  });

  test('does not include internal notes or owner id', () => {
    const dto = toMemberBusinessProfileDto({
      ...baseBusiness,
      internal_notes: 'Secret note',
      user_id: 'user-1',
    });

    expect((dto as any).internalNotes).toBeUndefined();
    expect((dto as any).userId).toBeUndefined();
    expect((dto as any).ownerUserId).toBeUndefined();
  });
});
