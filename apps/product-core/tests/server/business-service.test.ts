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
    briefDescription: 'Brief',
    websiteUrl: 'http://example.com',
    socialUrl: null,
    featuredTop: true,
    featuredRecommended: false,
    memberDiscountPercent: 15,
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
    briefDescription: 'Brief',
    websiteUrl: 'http://example.com',
    socialUrl: null,
    featuredTop: true,
    featuredRecommended: false,
    memberDiscountPercent: null,
    description: 'Full description',
    representativeName: 'Rep Name',
    publishedAt: new Date('2026-06-15T10:00:00.000Z'),
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
    briefDescription: 'Brief',
    websiteUrl: 'http://example.com',
    socialUrl: null,
    featuredTop: true,
    featuredRecommended: false,
    memberDiscountPercent: null,
    description: 'Full description',
    representativeName: 'Rep Name',
    publishedAt: null,
    status: 'UNDER_REVIEW',
    representativeEmail: 'rep@example.com',
    representativePhone: '+15551234567',
    rejectionReason: null,
    createdAt: new Date('2026-06-15T10:00:00.000Z'),
    updatedAt: new Date('2026-06-15T10:00:00.000Z'),
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
      internalNotes: 'Secret note',
      userId: 'user-1',
    });

    expect((dto as any).internalNotes).toBeUndefined();
    expect((dto as any).userId).toBeUndefined();
    expect((dto as any).ownerUserId).toBeUndefined();
  });
});
