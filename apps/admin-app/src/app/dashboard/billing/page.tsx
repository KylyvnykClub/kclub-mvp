import { requireStaffProfile } from '@/server/auth/profile';
import { fetchSubscriptions } from '@/features/subscriptions/api';
import { fetchMembershipPlans } from '@/features/memberships/api';
import { fetchStripePrices } from '@/features/stripe-prices/api';
import { fetchDashboardMetrics } from '@/features/dashboard/api';
import { fetchPayments } from '@/features/billing/api';
import { BillingPageClient } from '@/features/billing/components/billing-page-client';

type BillingPageProps = {
  searchParams: Promise<{ section?: string }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const profile = await requireStaffProfile();
  const sp = await searchParams;

  const [subscriptions, plans, prices, payments, metrics] = await Promise.all([
    fetchSubscriptions(),
    fetchMembershipPlans(),
    profile.role === 'OWNER' ? fetchStripePrices() : Promise.resolve(null),
    fetchPayments(),
    fetchDashboardMetrics(),
  ]);

  const m = metrics.status === 'success' ? metrics.data : null;

  return (
    <BillingPageClient
      staffRole={profile.role}
      initialSection={sp.section}
      subscriptions={subscriptions ?? []}
      plans={plans ?? []}
      prices={prices ?? []}
      payments={payments ?? []}
      stats={
        m
          ? {
              activeSubscriptions: m.activeSubscriptions,
              pastDueSubscriptions: m.pastDueSubscriptions,
              totalPlans: plans?.length ?? 0,
            }
          : undefined
      }
    />
  );
}
