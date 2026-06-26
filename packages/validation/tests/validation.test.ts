import { ERROR_CODES } from '@kclub/contracts';
import { describe, expect, test } from 'bun:test';

import {
  blockUserSchema,
  businessApproveSchema,
  businessFeaturedSchema,
  businessHideSchema,
  businessListFilterSchema,
  businessProfileEditableFieldsSchema,
  businessProfileSubmitSchema,
  businessRejectSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  cityCreateSchema,
  cityUpdateSchema,
  countryCreateSchema,
  countryUpdateSchema,
  entityIdParamSchema,
  formatZodError,
  introductionApproveSchema,
  introductionCancelSchema,
  introductionListFilterSchema,
  introductionRejectSchema,
  introductionSubmitSchema,
  memberOnboardingSchema,
  memberProfileUpdateSchema,
  parseWithValidation,
  phoneOtpSendSchema,
  phoneOtpVerifySchema,
  revokeCardSchema,
  reissueCardSchema,
  staffRoleUpdateSchema,
  staffTotpSetupSchema,
  staffTotpVerifySchema,
  staffPhoneOtpSendSchema,
  staffPhoneOtpVerifySchema,
  staffTotpCodeSchema,
  unblockUserSchema,
  adminConfigUpdateSchema,
  adminUserListSchema,
  adminCardListSchema,
} from '../src';

const uuid = '11111111-1111-4111-8111-111111111111';
const secondUuid = '22222222-2222-4222-8222-222222222222';

function expectInvalidField(
  schema: { safeParse: (value: unknown) => { success: boolean; error?: unknown } },
  value: unknown,
  path: string,
) {
  const result = schema.safeParse(value);
  expect(result.success).toBe(false);
  if (!result.success) {
    const formatted = formatZodError(result.error as never);
    expect(formatted.issues.filter((issue) => issue.path === path)).toHaveLength(1);
  }
}

describe('auth schemas', () => {
  test('validates phone OTP send and verify payloads', () => {
    expect(
      phoneOtpSendSchema.parse({
        phone: '+15551234567',
        purpose: 'sign-up',
        locale: 'en',
      }),
    ).toEqual({
      phone: '+15551234567',
      purpose: 'sign-up',
      locale: 'en',
    });

    expect(
      phoneOtpVerifySchema.parse({
        phone: '+15551234567',
        code: '123456',
        purpose: 'sign-in',
      }),
    ).toEqual({
      phone: '+15551234567',
      code: '123456',
      purpose: 'sign-in',
    });
  });

  test('returns clear field errors for invalid OTP inputs', () => {
    expectInvalidField(phoneOtpSendSchema, { phone: '555', purpose: 'sign-up' }, 'phone');
    expectInvalidField(
      phoneOtpVerifySchema,
      { phone: '+15551234567', code: 'abc', purpose: 'sign-in' },
      'code',
    );
  });
});

describe('member schemas', () => {
  test('validates onboarding and profile updates', () => {
    expect(
      memberOnboardingSchema.parse({
        phone: '+15551234567',
        displayName: 'Member Name',
        localePreference: 'uk',
        termsAccepted: true,
      }),
    ).toEqual({
      phone: '+15551234567',
      displayName: 'Member Name',
      localePreference: 'uk',
      termsAccepted: true,
    });

    expect(memberProfileUpdateSchema.parse({ displayName: 'Updated Name' })).toEqual({
      displayName: 'Updated Name',
    });
  });

  test('rejects incomplete onboarding and empty profile updates', () => {
    expectInvalidField(
      memberOnboardingSchema,
      {
        phone: '+15551234567',
        displayName: 'A',
        localePreference: 'en',
        termsAccepted: true,
      },
      'displayName',
    );

    expect(memberProfileUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe('business schemas', () => {
  const validBusiness = {
    name: 'Kylyvnyk Partner',
    representativeName: 'Partner Owner',
    representativeEmail: 'owner@example.com',
    representativePhone: '+15551234567',
    countryId: uuid,
    cityId: secondUuid,
    categoryId: 'cabc123456789',
    websiteUrl: 'https://example.com',
    briefDescription: 'Private member service',
  };

  test('validates business submit, editable fields, and filters', () => {
    expect(businessProfileSubmitSchema.parse(validBusiness).name).toBe('Kylyvnyk Partner');
    expect(
      businessProfileEditableFieldsSchema.parse({
        representativeEmail: 'new@example.com',
        socialUrl: 'https://instagram.com/example',
      }),
    ).toEqual({
      representativeEmail: 'new@example.com',
      socialUrl: 'https://instagram.com/example',
    });
    expect(businessListFilterSchema.parse({ page: '2', limit: '50', status: 'PUBLISHED' })).toEqual(
      {
        page: 2,
        limit: 50,
        status: 'PUBLISHED',
      },
    );
  });

  test('rejects invalid business fields with one clear field error', () => {
    expectInvalidField(
      businessProfileSubmitSchema,
      { ...validBusiness, name: '<b>Bad</b>' },
      'name',
    );
    expectInvalidField(
      businessProfileSubmitSchema,
      { ...validBusiness, representativeEmail: 'not-email' },
      'representativeEmail',
    );
    expectInvalidField(
      businessProfileSubmitSchema,
      { ...validBusiness, websiteUrl: undefined, socialUrl: undefined },
      'websiteUrl',
    );
    expect(businessProfileEditableFieldsSchema.safeParse({}).success).toBe(false);
  });
});

describe('introduction schemas', () => {
  test('validates introduction submit, cancel, and filters', () => {
    expect(
      introductionSubmitSchema.parse({
        targetBusinessId: secondUuid,
        clientName: 'John Doe',
        clientContact: 'john@example.com',
        message: 'Please introduce us.',
      }),
    ).toEqual({
      targetBusinessId: secondUuid,
      clientName: 'John Doe',
      clientContact: 'john@example.com',
      message: 'Please introduce us.',
    });

    expect(introductionCancelSchema.parse({ id: uuid, reason: 'No longer needed' })).toEqual({
      id: uuid,
      reason: 'No longer needed',
    });
    expect(introductionListFilterSchema.parse({ status: 'SUBMITTED' })).toEqual({
      page: 1,
      limit: 20,
      status: 'SUBMITTED',
    });
  });

  test('rejects invalid introduction fields', () => {
    expectInvalidField(
      introductionSubmitSchema,
      {
        requesterBusinessId: 'bad',
        targetBusinessId: secondUuid,
      },
      'requesterBusinessId',
    );
    expectInvalidField(introductionCancelSchema, { id: uuid, reason: '<script />' }, 'reason');
  });
});

describe('staff auth schemas', () => {
  test('validates staff phone OTP send and verify payloads', () => {
    expect(staffPhoneOtpSendSchema.parse({ phone: '+15551234567' })).toEqual({
      phone: '+15551234567',
    });

    expect(staffPhoneOtpVerifySchema.parse({ phone: '+15551234567', code: '000000' })).toEqual({
      phone: '+15551234567',
      code: '000000',
    });
  });

  test('validates TOTP code-only schema', () => {
    expect(staffTotpCodeSchema.parse({ code: '123456' })).toEqual({ code: '123456' });
    expectInvalidField(staffTotpCodeSchema, { code: '12345a' }, 'code');
    expectInvalidField(staffTotpCodeSchema, { code: '12345' }, 'code');
    expectInvalidField(staffTotpCodeSchema, {}, 'code');
  });

  test('rejects invalid staff phone OTP fields', () => {
    expectInvalidField(staffPhoneOtpSendSchema, { phone: '555' }, 'phone');
    expectInvalidField(staffPhoneOtpSendSchema, {}, 'phone');
    expectInvalidField(staffPhoneOtpVerifySchema, { phone: '+15551234567', code: 'abc' }, 'code');
  });

  test('validates TOTP setup and verify payloads', () => {
    expect(
      staffTotpSetupSchema.parse({
        phone: '+15551234567',
        secret: 'JBSWY3DPEHPK3PXP',
        code: '123456',
      }),
    ).toEqual({
      phone: '+15551234567',
      secret: 'JBSWY3DPEHPK3PXP',
      code: '123456',
    });

    expect(staffTotpVerifySchema.parse({ phone: '+15551234567', code: '654321' })).toEqual({
      phone: '+15551234567',
      code: '654321',
    });
  });

  test('rejects invalid TOTP setup and verify fields', () => {
    expectInvalidField(
      staffTotpSetupSchema,
      { phone: '+15551234567', secret: 'not-valid-secret', code: '123456' },
      'secret',
    );
    expectInvalidField(staffTotpVerifySchema, { phone: '+15551234567', code: '12345a' }, 'code');
  });
});

describe('admin mutation schemas', () => {
  test('validates block and unblock user schemas', () => {
    expect(blockUserSchema.parse({ reason: 'Violated terms' })).toEqual({
      reason: 'Violated terms',
    });
    expect(blockUserSchema.parse({})).toEqual({});
    expect(unblockUserSchema.parse({ reason: 'Appeal granted' })).toEqual({
      reason: 'Appeal granted',
    });
    expect(unblockUserSchema.parse({})).toEqual({});
  });

  test('validates card revoke and reissue schemas', () => {
    expect(revokeCardSchema.parse({ reason: 'Lost card' })).toEqual({ reason: 'Lost card' });
    expect(revokeCardSchema.parse({})).toEqual({});
    expect(reissueCardSchema.parse({ reason: 'Damaged' })).toEqual({ reason: 'Damaged' });
    expect(reissueCardSchema.parse({})).toEqual({});
  });

  test('validates business moderation schemas', () => {
    expect(businessApproveSchema.parse({})).toEqual({});
    expect(businessApproveSchema.parse({ notes: 'Looks good' })).toEqual({ notes: 'Looks good' });

    expect(() => businessRejectSchema.parse({})).toThrow();
    expect(businessRejectSchema.parse({ reason: 'Invalid documents' })).toEqual({
      reason: 'Invalid documents',
    });

    expect(businessHideSchema.parse({})).toEqual({});
    expect(businessHideSchema.parse({ reason: 'Spam' })).toEqual({ reason: 'Spam' });

    expect(businessFeaturedSchema.parse({ featuredTop: true })).toEqual({ featuredTop: true });
    expect(businessFeaturedSchema.parse({ featuredRecommended: true })).toEqual({
      featuredRecommended: true,
    });
    expect(businessFeaturedSchema.parse({})).toEqual({});
  });

  test('validates introduction moderation schemas', () => {
    expect(introductionApproveSchema.parse({})).toEqual({});
    expect(introductionApproveSchema.parse({ notes: 'Proceed' })).toEqual({ notes: 'Proceed' });

    expect(() => introductionRejectSchema.parse({})).toThrow();
    expect(introductionRejectSchema.parse({ reason: 'Not eligible' })).toEqual({
      reason: 'Not eligible',
    });
  });

  test('validates taxonomy CRUD schemas', () => {
    expect(categoryCreateSchema.parse({ name: 'Tech', slug: 'tech' })).toEqual({
      name: 'Tech',
      slug: 'tech',
      isHighRisk: false,
      isActive: true,
    });
    expect(categoryUpdateSchema.parse({ name: 'Tech Updated' })).toEqual({ name: 'Tech Updated' });

    expect(countryCreateSchema.parse({ code2: 'DE', name: 'Germany', slug: 'germany' })).toEqual({
      code2: 'DE',
      name: 'Germany',
      slug: 'germany',
      isActive: true,
    });
    expect(countryUpdateSchema.parse({ isActive: false })).toEqual({ isActive: false });

    expect(cityCreateSchema.parse({ countryId: uuid, name: 'Berlin', slug: 'berlin' })).toEqual({
      countryId: uuid,
      name: 'Berlin',
      slug: 'berlin',
      isActive: true,
    });
    expect(cityUpdateSchema.parse({ name: 'Berlin Mitte' })).toEqual({ name: 'Berlin Mitte' });
  });

  test('validates staff role update and admin config schemas', () => {
    expect(staffRoleUpdateSchema.parse({ role: 'ADMIN' })).toEqual({ role: 'ADMIN' });
    expect(() => staffRoleUpdateSchema.parse({ role: 'INVALID' })).toThrow();

    expect(
      adminConfigUpdateSchema.parse({ value: { key: 'val' }, description: 'Test config' }),
    ).toEqual({
      value: { key: 'val' },
      description: 'Test config',
    });
    expect(adminConfigUpdateSchema.parse({ value: 'simple' })).toEqual({ value: 'simple' });
  });
});

describe('admin list schemas', () => {
  test('validates admin user list query params', () => {
    expect(adminUserListSchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(
      adminUserListSchema.parse({
        page: '2',
        limit: '50',
        search: 'test',
        status: 'ACTIVE',
        membershipTier: 'VIP',
      }),
    ).toEqual({
      page: 2,
      limit: 50,
      search: 'test',
      status: 'ACTIVE',
      membershipTier: 'VIP',
    });
  });

  test('rejects invalid admin user list params', () => {
    expectInvalidField(adminUserListSchema, { status: 'INVALID' }, 'status');
    expectInvalidField(adminUserListSchema, { membershipTier: 'GOLD' }, 'membershipTier');
  });

  test('validates admin card list query params', () => {
    expect(adminCardListSchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(
      adminCardListSchema.parse({
        page: '1',
        limit: '10',
        status: 'ACTIVE',
        membershipTier: 'MEMBER',
      }),
    ).toEqual({
      page: 1,
      limit: 10,
      status: 'ACTIVE',
      membershipTier: 'MEMBER',
    });
  });

  test('rejects invalid admin card list params', () => {
    expectInvalidField(adminCardListSchema, { status: 'INVALID' }, 'status');
    expectInvalidField(adminCardListSchema, { membershipTier: 'PLATINUM' }, 'membershipTier');
  });
});

describe('shared helpers', () => {
  test('validates id params and formats errors with contract codes', () => {
    expect(entityIdParamSchema.parse({ id: uuid })).toEqual({ id: uuid });

    const result = parseWithValidation(phoneOtpSendSchema, {
      phone: 'bad',
      purpose: 'sign-in',
      locale: 'de',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ERROR_CODES.VALIDATION_INVALID_INPUT);
      expect(result.error.issues).toEqual([
        expect.objectContaining({
          path: 'phone',
          code: ERROR_CODES.VALIDATION_INVALID_PHONE,
        }),
        expect.objectContaining({
          path: 'locale',
          code: ERROR_CODES.VALIDATION_INVALID_LOCALE,
        }),
      ]);
    }
  });
});
