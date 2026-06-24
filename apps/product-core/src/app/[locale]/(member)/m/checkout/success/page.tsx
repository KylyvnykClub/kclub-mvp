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
        // eslint-disable-next-line
        await (prisma.user as any).update({
          where: { id: profile.id },
          data: { membership_tier: 'VIP' },
        });
      }
    } catch {
      // Non-critical — webhook will also handle this
    }
  }

  redirect(`/${locale}/m/dashboard?tab=introductions`);
}
