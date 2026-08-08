import { eq, and, or, isNotNull, lte, not, inArray } from 'drizzle-orm';
import { getDbClient, schema } from '@/server/db';
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
  const expiredVipSubscriptions = await expireVipSubscriptions(db, now);
  const expiredPlacementSubscriptions = await expirePlacementSubscriptions(db, now);
  const hiddenBusinesses = await hideExpiredBusinesses(db, now);
  const cleanedEvents = await cleanOldWebhookEvents(db, now);

  return {
    expiredCards,
    expiredSubscriptions: expiredVipSubscriptions + expiredPlacementSubscriptions,
    hiddenBusinesses,
    cleanedEvents,
  };
}

async function expireCards(db: ReturnType<typeof getDbClient>, now: Date): Promise<number> {
  const result = await db
    .update(schema.memberCards)
    .set({ status: 'EXPIRED' })
    .where(
      and(
        eq(schema.memberCards.status, 'ACTIVE'),
        isNotNull(schema.memberCards.expires_at),
        lte(schema.memberCards.expires_at, now),
      ),
    )
    .returning({ id: schema.memberCards.id });
  return result.length;
}

async function expireVipSubscriptions(
  db: ReturnType<typeof getDbClient>,
  now: Date,
): Promise<number> {
  const result = await db
    .update(schema.vipSubscriptions)
    .set({ status: 'EXPIRED', expires_at: now })
    .where(
      and(
        not(eq(schema.vipSubscriptions.status, 'EXPIRED')),
        isNotNull(schema.vipSubscriptions.current_period_end),
        lte(schema.vipSubscriptions.current_period_end, now),
      ),
    )
    .returning({ id: schema.vipSubscriptions.id });
  return result.length;
}

async function expirePlacementSubscriptions(
  db: ReturnType<typeof getDbClient>,
  now: Date,
): Promise<number> {
  const result = await db
    .update(schema.subscriptions)
    .set({ status: 'EXPIRED', canceled_at: now })
    .where(
      and(
        eq(schema.subscriptions.kind, 'BUSINESS_PLACEMENT'),
        not(eq(schema.subscriptions.status, 'EXPIRED')),
        isNotNull(schema.subscriptions.current_period_end),
        lte(schema.subscriptions.current_period_end, now),
      ),
    )
    .returning({ id: schema.subscriptions.id });

  return result.length;
}

async function hideExpiredBusinesses(
  db: ReturnType<typeof getDbClient>,
  now: Date,
): Promise<number> {
  const expiredVipUserIds = await db
    .selectDistinct({ user_id: schema.vipSubscriptions.user_id })
    .from(schema.vipSubscriptions)
    .where(
      and(
        eq(schema.vipSubscriptions.status, 'EXPIRED'),
        isNotNull(schema.vipSubscriptions.user_id),
      ),
    );

  const expiredPlacementBusinessIds = await db
    .selectDistinct({ business_id: schema.subscriptions.business_profile_id })
    .from(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.kind, 'BUSINESS_PLACEMENT'),
        eq(schema.subscriptions.status, 'EXPIRED'),
        isNotNull(schema.subscriptions.business_profile_id),
      ),
    );

  const userIds = expiredVipUserIds.map((s) => s.user_id).filter((id): id is string => id !== null);
  const businessIdsFromPlacement = expiredPlacementBusinessIds
    .map((entry) => entry.business_id)
    .filter((id): id is string => id !== null);

  if (userIds.length === 0 && businessIdsFromPlacement.length === 0) {
    return 0;
  }

  const expiredBusinessPredicate =
    userIds.length > 0 && businessIdsFromPlacement.length > 0
      ? or(
          inArray(schema.businessProfiles.user_id, userIds),
          inArray(schema.businessProfiles.id, businessIdsFromPlacement),
        )
      : userIds.length > 0
        ? inArray(schema.businessProfiles.user_id, userIds)
        : inArray(schema.businessProfiles.id, businessIdsFromPlacement);

  const businessesToHide = await db.query.businessProfiles.findMany({
    where: and(eq(schema.businessProfiles.status, 'PUBLISHED'), expiredBusinessPredicate),
  });

  if (businessesToHide.length === 0) return 0;

  const businessIds = businessesToHide.map((b) => b.id);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.businessProfiles)
      .set({
        status: 'HIDDEN',
        hidden_at: now,
        featured_top: false,
        featured_recommended: false,
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
        after: { status: 'HIDDEN', reason: 'VIP or placement subscription expired' },
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
  const result = await db
    .delete(schema.stripeWebhookEvents)
    .where(lte(schema.stripeWebhookEvents.created_at, cutoff))
    .returning({ id: schema.stripeWebhookEvents.id });
  return result.length;
}
