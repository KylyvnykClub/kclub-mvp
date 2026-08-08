import {
  ERROR_CODES,
  type ClubCardStatus,
  type MemberCardDto,
  type MemberTier,
  type PublicCardVerificationDto,
} from '@kclub/contracts';
import { canIssueNewActiveCard, canTransitionCardStatus } from '@kclub/domain';

import { eq, and, count } from 'drizzle-orm';
import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@/server/db';
import { formatCardNumber, cardNumberToTierPrefix, parseCardNumber } from './card-helpers';

export type CardRecord = {
  id: string;
  user_id: string;
  card_number: string;
  membership_tier: string;
  status: string;
  qr_payload_url: string | null;
  issued_at: Date;
  expires_at: Date | null;
  revoked_at: Date | null;
  revoked_reason: string | null;
};

function isUniqueViolation(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}

export function toMemberCardDto(card: CardRecord): MemberCardDto {
  return {
    id: card.id,
    userId: card.user_id,
    cardNumber: card.card_number,
    status: card.status as ClubCardStatus,
    membershipTier: card.membership_tier as MemberTier,
    qrPayloadUrl: card.qr_payload_url ?? '',
    issuedAt: card.issued_at.toISOString(),
    expiresAt: card.expires_at?.toISOString() ?? null,
  };
}

export function toPublicCardVerificationDto(card: CardRecord): PublicCardVerificationDto {
  return {
    cardNumber: card.card_number,
    status: card.status as ClubCardStatus,
    membershipTier: card.membership_tier as MemberTier,
    issuedAt: card.issued_at.toISOString(),
    expiresAt: card.expires_at?.toISOString() ?? null,
  };
}

async function generateNextCardNumber(tierPrefix: 'VIP' | 'MEM' = 'MEM'): Promise<string> {
  const db = getDbClient();

  const lastCard = await db.query.memberCards.findFirst({
    orderBy: (cards, { desc }) => [desc(cards.card_number)],
    columns: { card_number: true },
  });

  let nextSeq = 1;
  if (lastCard) {
    try {
      const { sequence } = parseCardNumber(lastCard.card_number);
      nextSeq = sequence + 1;
    } catch {
      nextSeq = 1;
    }
  }

  return formatCardNumber(tierPrefix, nextSeq);
}

export async function getActiveCardForUser(userId: string): Promise<CardRecord | null> {
  const db = getDbClient();

  const card = await db.query.memberCards.findFirst({
    where: (fields, { eq, and }) => and(eq(fields.user_id, userId), eq(fields.status, 'ACTIVE')),
    orderBy: (fields, { desc }) => [desc(fields.issued_at)],
  });

  return (card as CardRecord) ?? null;
}

export async function issueCardForUser(
  userId: string,
  membershipTier: string,
): Promise<CardRecord> {
  const db = getDbClient();

  const activeCardResult = await db
    .select({ count: count() })
    .from(schema.memberCards)
    .where(and(eq(schema.memberCards.user_id, userId), eq(schema.memberCards.status, 'ACTIVE')));
  const activeCardCount = activeCardResult[0]!.count;

  if (!canIssueNewActiveCard(activeCardCount)) {
    throw new AppError({
      code: ERROR_CODES.CARD_ALREADY_ACTIVE,
      message: 'User already has an active card',
      status: 409,
    });
  }

  const tierPrefix = cardNumberToTierPrefix(membershipTier as 'MEMBER' | 'VIP');

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const cardNumber = await generateNextCardNumber(tierPrefix);

      const [card] = await db
        .insert(schema.memberCards)
        .values({
          user_id: userId,
          card_number: cardNumber,
          membership_tier: membershipTier as MemberTier,
          qr_payload_url: `/verify-card/${cardNumber}`,
        })
        .returning();

      return card as CardRecord;
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        attempt++;
        if (attempt >= MAX_RETRIES) {
          throw new AppError({
            code: ERROR_CODES.SERVER_ERROR,
            message: 'Failed to generate a unique card number after multiple attempts.',
            status: 500,
          });
        }
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unreachable code');
}

export async function issueCardForUserIfNoneActive(
  userId: string,
  membershipTier: string,
): Promise<CardRecord | null> {
  const activeCard = await getActiveCardForUser(userId);
  if (activeCard) return null;

  return issueCardForUser(userId, membershipTier);
}

export async function revokeCard(cardId: string, reason?: string): Promise<CardRecord> {
  const db = getDbClient();

  const card = await db.query.memberCards.findFirst({
    where: (fields, { eq }) => eq(fields.id, cardId),
  });

  if (!card) {
    throw new AppError({
      code: ERROR_CODES.CARD_NOT_FOUND,
      message: 'Card not found',
      status: 404,
    });
  }

  if (!canTransitionCardStatus(card.status as ClubCardStatus, 'REVOKED')) {
    throw new AppError({
      code: ERROR_CODES.CARD_INVALID_STATUS_TRANSITION,
      message: `Cannot revoke a card with status ${card.status}`,
      status: 409,
    });
  }

  const [updated] = await db
    .update(schema.memberCards)
    .set({
      status: 'REVOKED',
      revoked_at: new Date(),
      revoked_reason: reason ?? null,
    })
    .where(eq(schema.memberCards.id, cardId))
    .returning();

  return updated as CardRecord;
}

export async function reissueCard(
  userId: string,
  membershipTier: string,
  currentCardId: string,
  revokeReason?: string,
): Promise<CardRecord> {
  const db = getDbClient();

  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const [newCard] = await db.transaction(async (tx) => {
        const card = await tx.query.memberCards.findFirst({
          where: (fields, { eq }) => eq(fields.id, currentCardId),
        });

        if (!card) {
          throw new AppError({
            code: ERROR_CODES.CARD_NOT_FOUND,
            message: 'Card not found',
            status: 404,
          });
        }

        if (!canTransitionCardStatus(card.status as ClubCardStatus, 'REVOKED')) {
          throw new AppError({
            code: ERROR_CODES.CARD_INVALID_STATUS_TRANSITION,
            message: `Cannot reissue: current card status is ${card.status}`,
            status: 409,
          });
        }

        await tx
          .update(schema.memberCards)
          .set({
            status: 'REVOKED',
            revoked_at: new Date(),
            revoked_reason: revokeReason ?? null,
          })
          .where(eq(schema.memberCards.id, currentCardId));

        const tierPrefix = cardNumberToTierPrefix(membershipTier as 'MEMBER' | 'VIP');
        const cardNumber = await generateNextCardNumber(tierPrefix);

        const [newCardRecord] = await tx
          .insert(schema.memberCards)
          .values({
            user_id: userId,
            card_number: cardNumber,
            membership_tier: membershipTier as MemberTier,
            qr_payload_url: `/verify-card/${cardNumber}`,
          })
          .returning();

        return [newCardRecord];
      });

      return newCard as CardRecord;
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        attempt++;
        if (attempt >= MAX_RETRIES) {
          throw new AppError({
            code: ERROR_CODES.SERVER_ERROR,
            message: 'Failed to generate a unique card number after multiple attempts.',
            status: 500,
          });
        }
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unreachable code');
}

export async function publicVerifyCard(cardNumber: string): Promise<PublicCardVerificationDto> {
  const db = getDbClient();

  const card = await db.query.memberCards.findFirst({
    where: (fields, { eq }) => eq(fields.card_number, cardNumber),
  });

  if (!card) {
    throw new AppError({
      code: ERROR_CODES.CARD_NOT_FOUND,
      message: 'Card not found',
      status: 404,
    });
  }

  return toPublicCardVerificationDto(card as CardRecord);
}
