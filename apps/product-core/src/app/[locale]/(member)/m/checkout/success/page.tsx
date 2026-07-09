import { redirect } from 'next/navigation';

import type { Locale } from '@/i18n/routing';
import { getDbClient, schema } from '@/server/db';
import { desc, eq } from 'drizzle-orm';
import { getStripeClient } from '@/server/stripe/client';
import { getCurrentMemberProfileForPage } from '@/server/member-page';

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const { session_id } = await searchParams;

  if (session_id) {
    try {
      const [stripe, profile] = await Promise.all([
        Promise.resolve(getStripeClient()),
        getCurrentMemberProfileForPage(),
      ]);

      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (
        session.payment_status === 'paid' &&
        session.metadata?.type === 'vip' &&
        session.metadata.userId &&
        profile?.id === session.metadata.userId
      ) {
        const db = getDbClient();
        const userId = profile.id;
        const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;
        const stripeSubscriptionId =
          typeof session.subscription === 'string' ? session.subscription : null;

        const existing = await db.query.vipSubscriptions.findFirst({
          where: eq(schema.vipSubscriptions.user_id, userId),
          orderBy: [desc(schema.vipSubscriptions.created_at)],
        });

        await db.transaction(async (tx) => {
          await tx
            .update(schema.users)
            .set({ membership_tier: 'VIP' })
            .where(eq(schema.users.id, userId));

          if (existing) {
            await tx
              .update(schema.vipSubscriptions)
              .set({
                status: 'ACTIVE',
                stripe_customer_id: stripeCustomerId ?? existing.stripe_customer_id,
                stripe_subscription_id: stripeSubscriptionId ?? existing.stripe_subscription_id,
              })
              .where(eq(schema.vipSubscriptions.id, existing.id));
          } else {
            await tx.insert(schema.vipSubscriptions).values({
              user_id: userId,
              status: 'ACTIVE',
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
            });
          }
        });
      }
    } catch {
      // Non-critical — webhook will also handle this
    }
  }

  redirect(`/${locale}/m/dashboard?tab=introductions`);
}
