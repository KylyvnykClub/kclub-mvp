import { getDbClient, schema } from '@/server/db';
import { eq, and, lte, ne, isNotNull, inArray, sql } from 'drizzle-orm';
import { createDbAuditService } from '@/server/audit';
import { createRequestContext } from '@/server/context';

const auditService = createDbAuditService();
const systemContext = createRequestContext({ actor: { kind: 'system' } });

const WEBHOOK_RETENTION_DAYS = 90;

export type DailyMaintenanceResult = {
  expiredCards: number;
  expiredSubscriptions: number;
  hiddenBusinesses: number;
  cleanedEvents: number;
};

export async function runDailyMaintenance(): Promise<DailyMaintenanceResult> {
  const db = getDbClient();
  const now = new Date();

  const expiredCards = await expireCards(db, now);
  const expiredSubscriptions = await expireSubscriptions(db, now);
  const hiddenBusinesses = await hideExpiredBusinesses(db, now);
  const cleanedEvents = await cleanOldWebhookEvents(db, now);

  return { expiredCards, expiredSubscriptions, hiddenBusinesses, cleanedEvents };
}

async function expireCards(db: ReturnType<typeof getDbClient>, now: Date): Promise<number> {
  const result = await db.update(schema.memberCards)
    .set({ status: 'EXPIRED' })
    .where(and(
      eq(schema.memberCards.status, 'ACTIVE'),
      isNotNull(schema.memberCards.expiresAt),
      lte(schema.memberCards.expiresAt, now)
    ))
    .returning({ id: schema.memberCards.id });
  return result.length;
}

async function expireSubscriptions(
  db: ReturnType<typeof getDbClient>,
  now: Date,
): Promise<number> {
  const result = await db.update(schema.vipSubscriptions)
    .set({ status: 'EXPIRED', expiresAt: now })
    .where(and(
      ne(schema.vipSubscriptions.status, 'EXPIRED'),
      isNotNull(schema.vipSubscriptions.currentPeriodEnd),
      lte(schema.vipSubscriptions.currentPeriodEnd, now)
    ))
    .returning({ id: schema.vipSubscriptions.id });
  return result.length;
}

async function hideExpiredBusinesses(
  db: ReturnType<typeof getDbClient>,
  now: Date,
): Promise<number> {
  const expiredVipUserIds = await db
    .selectDistinct({ userId: schema.vipSubscriptions.userId })
    .from(schema.vipSubscriptions)
    .where(and(
      eq(schema.vipSubscriptions.status, 'EXPIRED'),
      isNotNull(schema.vipSubscriptions.userId)
    ));

  if (expiredVipUserIds.length === 0) return 0;

  const userIds = expiredVipUserIds.map((s) => s.userId).filter(Boolean) as string[];

  const businessesToHide = await db.query.businessProfiles.findMany({
    where: and(
      inArray(schema.businessProfiles.userId, userIds),
      eq(schema.businessProfiles.status, 'PUBLISHED')
    ),
  });

  if (businessesToHide.length === 0) return 0;

  const businessIds = businessesToHide.map((b) => b.id);

  await db.transaction(async (tx) => {
    await tx.update(schema.businessProfiles)
      .set({
        status: 'HIDDEN',
        hiddenAt: now,
        featuredTop: false,
        featuredRecommended: false,
      })
      .where(inArray(schema.businessProfiles.id, businessIds));
  });

  for (const business of businessesToHide) {
    await auditService.log(
      {
        action: 'BUSINESS_HIDDEN',
        entityType: 'BusinessProfile',
        entityId: business.id,
        before: { status: 'PUBLISHED' },
        after: { status: 'HIDDEN', reason: 'VIP subscription expired' },
      },
      systemContext,
    );
  }

  return businessesToHide.length;
}

async function cleanOldWebhookEvents(
  db: ReturnType<typeof getDbClient>,
  now: Date,
): Promise<number> {
  const cutoff = new Date(now.getTime() - WEBHOOK_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const result = await db.delete(schema.stripeWebhookEvents)
    .where(lte(schema.stripeWebhookEvents.createdAt, cutoff))
    .returning({ id: schema.stripeWebhookEvents.eventId });
  return result.length;
}
