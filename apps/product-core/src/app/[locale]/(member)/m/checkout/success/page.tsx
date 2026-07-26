import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CheckCircle2, FileText } from 'lucide-react';
import type Stripe from 'stripe';

import type { Locale } from '@/i18n/routing';
import { getDbClient, schema } from '@/server/db';
import { and, desc, eq } from 'drizzle-orm';
import { getStripeClient } from '@/server/stripe/client';
import { getCurrentMemberProfileForPage } from '@/server/member-page';
import { CabinetButton } from '@/features/member/components/cabinet/CabinetButton';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'member.checkout.success' });

  return { title: t('metaTitle') };
}

async function syncVipSubscription(session: Stripe.Checkout.Session, userId: string) {
  const db = getDbClient();
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

async function syncPlacementSubscription(session: Stripe.Checkout.Session, userId: string) {
  const businessId = session.metadata?.businessId;
  const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;
  const stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : null;

  if (!businessId || !stripeSubscriptionId) return;

  const db = getDbClient();
  const existing = await db.query.subscriptions.findFirst({
    where: and(
      eq(schema.subscriptions.business_profile_id, businessId),
      eq(schema.subscriptions.kind, 'BUSINESS_PLACEMENT'),
    ),
    orderBy: [desc(schema.subscriptions.created_at)],
  });

  if (existing) {
    await db
      .update(schema.subscriptions)
      .set({
        status: 'ACTIVE',
        stripe_customer_id: stripeCustomerId ?? existing.stripe_customer_id,
        stripe_subscription_id: stripeSubscriptionId,
      })
      .where(eq(schema.subscriptions.id, existing.id));
  } else {
    await db.insert(schema.subscriptions).values({
      user_id: userId,
      business_profile_id: businessId,
      kind: 'BUSINESS_PLACEMENT',
      status: 'ACTIVE',
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
    });
  }
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const { session_id } = await searchParams;

  const fallbackHref = `/${locale}/m/dashboard?tab=subscription`;

  if (!session_id) {
    redirect(fallbackHref);
  }

  let session: Stripe.Checkout.Session;
  let profileId: string | null = null;

  try {
    const [stripe, profile] = await Promise.all([
      Promise.resolve(getStripeClient()),
      getCurrentMemberProfileForPage(),
    ]);
    profileId = profile?.id ?? null;
    session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['invoice'] });
  } catch {
    redirect(fallbackHref);
  }

  const checkoutType = session.metadata?.type;
  const isOwnSession =
    session.payment_status === 'paid' &&
    Boolean(session.metadata?.userId) &&
    profileId === session.metadata?.userId;

  if (!isOwnSession) {
    redirect(fallbackHref);
  }

  if (checkoutType === 'vip' && profileId) {
    try {
      await syncVipSubscription(session, profileId);
    } catch {
      // Non-critical — webhook will also handle this
    }
  }

  if (checkoutType === 'business_placement' && profileId) {
    try {
      await syncPlacementSubscription(session, profileId);
    } catch {
      // Non-critical — webhook will also handle this
    }
  }

  const t = await getTranslations({ locale, namespace: 'member.checkout.success' });

  const invoice =
    session.invoice && typeof session.invoice === 'object'
      ? (session.invoice as Stripe.Invoice)
      : null;

  const amount = session.amount_total ?? invoice?.amount_paid ?? null;
  const currency = (session.currency ?? invoice?.currency ?? 'usd').toUpperCase();
  const paidAt = new Date((invoice?.created ?? session.created) * 1000);

  const accountHref =
    checkoutType === 'business_placement'
      ? `/${locale}/m/dashboard?tab=business`
      : `/${locale}/m/dashboard?tab=subscription`;

  const rows: Array<{ label: string; value: string }> = [
    {
      label: t('planLabel'),
      value: checkoutType === 'business_placement' ? t('planBusiness') : t('planVip'),
    },
    ...(amount !== null
      ? [
          {
            label: t('amountLabel'),
            value: (amount / 100).toLocaleString(locale, { style: 'currency', currency }),
          },
        ]
      : []),
    {
      label: t('dateLabel'),
      value: paidAt.toLocaleDateString(locale, { dateStyle: 'long' }),
    },
    ...(invoice?.number ? [{ label: t('invoiceLabel'), value: invoice.number }] : []),
    { label: t('statusLabel'), value: t('statusPaid') },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5.5rem)] w-full max-w-lg flex-col items-center justify-center py-16">
      <div className="w-full border border-border bg-surface-muted p-8 sm:p-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <CheckCircle2 size={44} className="mb-4 text-success" aria-hidden />
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {checkoutType === 'business_placement' ? t('subtitleBusiness') : t('subtitle')}
          </p>
        </div>

        <dl className="divide-y divide-border border-y border-border">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {row.label}
              </dt>
              <dd className="text-sm font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>

        {invoice?.hosted_invoice_url ? (
          <p className="mt-4 text-center">
            <a
              href={invoice.hosted_invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent underline-offset-2 hover:underline"
            >
              <FileText size={13} aria-hidden />
              {t('receiptLink')}
            </a>
          </p>
        ) : null}

        <CabinetButton asChild fullWidth density="large" className="mt-8">
          <Link href={accountHref}>{t('goToAccount')}</Link>
        </CabinetButton>
      </div>
    </div>
  );
}
