import {
  ERROR_CODES,
  type ClubCardStatus,
  type MemberCardDto,
  type MemberTier,
  type PublicCardVerificationDto,
} from '@kclub/contracts';
import { canIssueNewActiveCard, canTransitionCardStatus } from '@kclub/domain';

import { AppError } from '@/server/errors';
import { getDbClient, schema } from '@kclub/database';
import { eq, and, desc, count } from 'drizzle-orm';
import { formatCardNumber, cardNumberToTierPrefix, parseCardNumber } from './card-helpers';

export type CardRecord = {
  id: string;
  userId: string;
  cardNumber: string;
  membershipTier: string;
  status: string;
  qrPayloadUrl: string | null;
  issuedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CardWithUserDisplayName = CardRecord & {
  user: { displayName: string | null } | null;
};

export function toMemberCardDto(card: CardRecord): MemberCardDto {
  return {
    id: card.id,
    userId: card.userId,
    cardNumber: card.cardNumber,
    status: card.status as ClubCardStatus,
    membershipTier: card.membershipTier as MemberTier,
    qrPayloadUrl: card.qrPayloadUrl ?? '',
    issuedAt: card.issuedAt.toISOString(),
    expiresAt: card.expiresAt?.toISOString() ?? null,
  };
}

export function toPublicCardVerificationDto(
  card: CardWithUserDisplayName,
): PublicCardVerificationDto {
  return {
    cardNumber: card.cardNumber,
    status: card.status as ClubCardStatus,
    membershipTier: card.membershipTier as MemberTier,
    displayName: card.user?.displayName ?? null,
    issuedAt: card.issuedAt.toISOString(),
    expiresAt: card.expiresAt?.toISOString() ?? null,
  };
}

async function generateNextCardNumber(tierPrefix: 'VIP' | 'MEM' = 'MEM'): Promise<string> {
  const db = getDbClient();

  const lastCard = await db.query.memberCards.findFirst({
    orderBy: (cards, { desc }) => [desc(cards.cardNumber)],
    columns: { cardNumber: true },
  });

  let nextSeq = 1;
  if (lastCard) {
    try {
      const { sequence } = parseCardNumber(lastCard.cardNumber);
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
    where: (cards, { eq, and }) => and(eq(cards.userId, userId), eq(cards.status, 'ACTIVE')),
    orderBy: (cards, { desc }) => [desc(cards.issuedAt)],
  });

  return card ?? null;
}

export async function issueCardForUser(
  userId: string,
  membershipTier: string,
): Promise<CardRecord> {
  const db = getDbClient();

  const activeCardCountRes = await db
    .select({ value: count() })
    .from(schema.memberCards)
    .where(and(eq(schema.memberCards.userId, userId), eq(schema.memberCards.status, 'ACTIVE')));

  const activeCardCount = activeCardCountRes[0].value;

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

      const [card] = await db.insert(schema.memberCards).values({
        userId,
        cardNumber,
        membershipTier: membershipTier as MemberTier,
        qrPayloadUrl: `/verify-card/${cardNumber}`,
      }).returning();

      return card;
    } catch (error: any) {
      if (error?.code === '23505') { // Postgres unique violation
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
    where: (cards, { eq }) => eq(cards.id, cardId),
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

  const [updated] = await db.update(schema.memberCards).set({
    status: 'REVOKED',
    revokedAt: new Date(),
    revokedReason: reason ?? null,
  }).where(eq(schema.memberCards.id, cardId)).returning();

  return updated;
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
      const newCard = await db.transaction(async (tx) => {
        const card = await tx.query.memberCards.findFirst({
          where: (cards, { eq }) => eq(cards.id, currentCardId),
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

        await tx.update(schema.memberCards).set({
          status: 'REVOKED',
          revokedAt: new Date(),
          revokedReason: revokeReason ?? null,
        }).where(eq(schema.memberCards.id, currentCardId));

        const tierPrefix = cardNumberToTierPrefix(membershipTier as 'MEMBER' | 'VIP');
        const cardNumber = await generateNextCardNumber(tierPrefix);

        const [newCardRecord] = await tx.insert(schema.memberCards).values({
          userId,
          cardNumber,
          membershipTier: membershipTier as MemberTier,
          qrPayloadUrl: `/verify-card/${cardNumber}`,
        }).returning();

        return newCardRecord;
      });

      return newCard;
    } catch (error: any) {
      if (error?.code === '23505') { // Postgres unique violation
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
    where: (cards, { eq }) => eq(cards.cardNumber, cardNumber),
    with: { user: { columns: { displayName: true } } },
  });

  if (!card) {
    throw new AppError({
      code: ERROR_CODES.CARD_NOT_FOUND,
      message: 'Card not found',
      status: 404,
    });
  }

  return toPublicCardVerificationDto(card);
}
