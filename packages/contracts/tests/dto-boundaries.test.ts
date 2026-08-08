import { describe, expect, test } from 'vitest';

import type {
  AdminBusinessDetailDto,
  AdminCardListItemDto,
  AdminInvoiceDto,
  MemberBusinessProfileDto,
  MemberCardDto,
  PublicBusinessDetailDto,
  PublicBusinessListItemDto,
  PublicCardVerificationDto,
  CurrentMemberProfileDto,
} from '../src';

// The real assertions in this file are compile-time only (Assert<...> below).
// Vitest, unlike bun test, refuses files with zero runtime suites, so anchor one.
describe('dto boundary type assertions', () => {
  test('file typechecks', () => {
    expect(true).toBe(true);
  });
});

type Assert<T extends true> = T;
type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;

type PublicBusinessDoesNotExposeAdminEmail = Assert<
  HasKey<PublicBusinessDetailDto, 'representativeEmail'> extends false ? true : false
>;
type PublicBusinessDoesNotExposeAdminPhone = Assert<
  HasKey<PublicBusinessDetailDto, 'representativePhone'> extends false ? true : false
>;
type PublicBusinessDoesNotExposeOwner = Assert<
  HasKey<PublicBusinessDetailDto, 'ownerUserId'> extends false ? true : false
>;
type AdminBusinessExposesModerationFields = Assert<
  HasKey<AdminBusinessDetailDto, 'representativeEmail'> extends true ? true : false
>;
type AdminBusinessExposesOwner = Assert<
  HasKey<AdminBusinessDetailDto, 'owner'> extends true ? true : false
>;
type AdminBusinessExposesPlacementSubscription = Assert<
  HasKey<AdminBusinessDetailDto, 'placementSubscription'> extends true ? true : false
>;
type AdminBusinessExposesAuditEntries = Assert<
  HasKey<AdminBusinessDetailDto, 'auditEntries'> extends true ? true : false
>;

type PublicCardVerifyDoesNotExposeUserId = Assert<
  HasKey<PublicCardVerificationDto, 'userId'> extends false ? true : false
>;
type PublicCardVerifyDoesNotExposeCardId = Assert<
  HasKey<PublicCardVerificationDto, 'id'> extends false ? true : false
>;
type PublicCardVerifyDoesNotExposeDisplayName = Assert<
  HasKey<PublicCardVerificationDto, 'displayName'> extends false ? true : false
>;

type AdminCardListItemExposesUserPhone = Assert<
  HasKey<AdminCardListItemDto, 'userPhone'> extends true ? true : false
>;
type AdminCardListItemExposesUserDisplayName = Assert<
  HasKey<AdminCardListItemDto, 'userDisplayName'> extends true ? true : false
>;
type AdminInvoiceExposesPdfReceipt = Assert<
  HasKey<AdminInvoiceDto, 'invoicePdf'> extends true ? true : false
>;
type AdminInvoiceDoesNotExposeCustomerId = Assert<
  HasKey<AdminInvoiceDto, 'stripeCustomerId'> extends false ? true : false
>;
type AdminInvoiceDoesNotExposeMetadata = Assert<
  HasKey<AdminInvoiceDto, 'metadata'> extends false ? true : false
>;
type MemberCardDtoDoesNotExposeUserPhone = Assert<
  HasKey<MemberCardDto, 'userPhone'> extends false ? true : false
>;
type MemberCardDtoDoesNotExposeUserDisplayName = Assert<
  HasKey<MemberCardDto, 'userDisplayName'> extends false ? true : false
>;

type PublicBusinessListItemDoesNotExposeStatus = Assert<
  HasKey<PublicBusinessListItemDto, 'status'> extends false ? true : false
>;
type PublicBusinessListItemDoesNotExposeOwnerId = Assert<
  HasKey<PublicBusinessListItemDto, 'ownerUserId'> extends false ? true : false
>;
type PublicBusinessDetailDoesNotExposeStripeId = Assert<
  HasKey<PublicBusinessDetailDto, 'stripeCustomerId'> extends false ? true : false
>;

type MemberBusinessProfileDoesNotExposeInternalNotes = Assert<
  HasKey<MemberBusinessProfileDto, 'internalNotes'> extends false ? true : false
>;

type MemberProfileDoesNotExposeSupabaseId = Assert<
  HasKey<CurrentMemberProfileDto, 'supabaseAuthUserId'> extends false ? true : false
>;

export type {
  AdminBusinessExposesAuditEntries,
  AdminBusinessExposesModerationFields,
  AdminBusinessExposesOwner,
  AdminBusinessExposesPlacementSubscription,
  AdminCardListItemExposesUserPhone,
  AdminCardListItemExposesUserDisplayName,
  AdminInvoiceDoesNotExposeCustomerId,
  AdminInvoiceDoesNotExposeMetadata,
  AdminInvoiceExposesPdfReceipt,
  MemberCardDtoDoesNotExposeUserPhone,
  MemberCardDtoDoesNotExposeUserDisplayName,
  PublicBusinessDoesNotExposeAdminEmail,
  PublicBusinessDoesNotExposeAdminPhone,
  PublicBusinessDoesNotExposeOwner,
  PublicCardVerifyDoesNotExposeUserId,
  PublicCardVerifyDoesNotExposeCardId,
  PublicCardVerifyDoesNotExposeDisplayName,
  PublicBusinessListItemDoesNotExposeStatus,
  PublicBusinessListItemDoesNotExposeOwnerId,
  PublicBusinessDetailDoesNotExposeStripeId,
  MemberBusinessProfileDoesNotExposeInternalNotes,
  MemberProfileDoesNotExposeSupabaseId,
};
