'use client';

import { useState } from 'react';

import { PageShell } from '@/components/page-shell';
import { SubTabs, type SubTabItem } from '@/components/sub-tabs';
import { SubscriptionsTable } from '@/features/subscriptions/components/subscriptions-table';
import { MembershipsView } from '@/features/memberships/components/memberships-view';
import { StripePricesForm } from '@/features/stripe-prices/components/stripe-prices-form';
import type { AdminSubscriptionListItemDto, MembershipPlanDto, AdminConfigEntryDto, StaffRole } from '@kclub/contracts';

type BillingPageClientProps = {
  staffRole: StaffRole;
  initialSection?: string;
  subscriptions: AdminSubscriptionListItemDto[];
  plans: MembershipPlanDto[];
  prices: AdminConfigEntryDto[];
};

function getBillingTabs(role: StaffRole): SubTabItem[] {
  const tabs: SubTabItem[] = [
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'memberships', label: 'Memberships' },
  ];
  if (role === 'OWNER') {
    tabs.push({ id: 'stripe-prices', label: 'Stripe Prices' });
  }
  return tabs;
}

function normalizeSection(section: string | undefined, tabs: SubTabItem[]): string {
  if (section && tabs.some((t) => t.id === section)) return section;
  return tabs[0]?.id ?? 'subscriptions';
}

export function BillingPageClient({
  staffRole,
  initialSection,
  subscriptions,
  plans,
  prices,
}: BillingPageClientProps) {
  const tabs = getBillingTabs(staffRole);
  const [activeSection, setActiveSection] = useState(() => normalizeSection(initialSection, tabs));

  return (
    <PageShell title="Billing" description="Subscriptions, memberships, and pricing." roleScope="ADMIN">
      <div className="space-y-6">
        <SubTabs tabs={tabs} activeTab={activeSection} onTabChange={setActiveSection} />
        {activeSection === 'subscriptions' && (
          <SubscriptionsTable subscriptions={subscriptions} staffRole={staffRole} />
        )}
        {activeSection === 'memberships' && <MembershipsView plans={plans} />}
        {activeSection === 'stripe-prices' && staffRole === 'OWNER' && (
          <div>
            <h3 className="mb-2 text-lg font-medium">Stripe Price IDs</h3>
            <StripePricesForm prices={prices} />
          </div>
        )}
      </div>
    </PageShell>
  );
}
