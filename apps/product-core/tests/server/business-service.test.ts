import { describe, expect, test } from 'bun:test';

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
    category: { name: 'Category' },
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
      categoryName: 'Category',
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
    category: { name: 'Category' },
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
      categoryName: 'Category',
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
    });
  });
});

describe('toMemberBusinessProfileDto', () => {
  const baseBusiness = {
    id: 'bus-1',
    slug: 'bus-slug',
    name: 'Business Name',
    category: { name: 'Category' },
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
      categoryName: 'Category',
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
      status: 'UNDER_REVIEW',
      representativeEmail: 'rep@example.com',
      representativePhone: '+15551234567',
      rejectionReason: null,
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
