import { redirect } from 'next/navigation';

import type { Locale } from '@/i18n/routing';
import { getPrismaClient } from '@/server/db';
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
        const prisma = getPrismaClient();
        const userId = profile.id;
        const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;
        const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : null;

        const existing = await prisma.vipSubscription.findFirst({
          where: { user_id: userId },
          orderBy: { created_at: 'desc' },
        });

        await prisma.$transaction([
          // eslint-disable-next-line
          (prisma.user as any).update({
            where: { id: userId },
            data: { membership_tier: 'VIP' },
          }),
          existing
            ? prisma.vipSubscription.update({
                where: { id: existing.id },
                data: {
                  status: 'ACTIVE',
                  stripe_customer_id: stripeCustomerId ?? existing.stripe_customer_id,
                  stripe_subscription_id: stripeSubscriptionId ?? existing.stripe_subscription_id,
                },
              })
            : prisma.vipSubscription.create({
                data: {
                  user_id: userId,
                  status: 'ACTIVE',
                  stripe_customer_id: stripeCustomerId,
                  stripe_subscription_id: stripeSubscriptionId,
                },
              }),
        ]);
      }
    } catch {
      // Non-critical — webhook will also handle this
    }
  }

  redirect(`/${locale}/m/dashboard?tab=introductions`);
}
