'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Globe,
  LayoutGrid,
  MapPin,
  Phone,
  RefreshCw,
  ScrollText,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import type { AdminInvoiceDto, AdminUserDetailDto, StaffRole } from '@kclub/contracts';

import { AdminFilterBar } from '@/components/admin-filter-bar';
import { MembershipTierBadge } from '@/components/membership-tier-badge';
import { StatusBadge } from '@/components/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button, buttonVariants } from '@/components/ui/button';
import { fetchUserInvoicesAction } from '@/features/users/actions';
import {
  SubscriptionReceipts,
  type InvoiceLoadStatus,
  shouldLoadSubscriptionReceipts,
} from '@/features/users/components/subscription-receipts';
import { cn } from '@/lib/utils';

const USER_DETAIL_TABS = ['overview', 'card', 'subscriptions', 'logs'] as const;

type UserDetailTab = (typeof USER_DETAIL_TABS)[number];

function parseUserDetailTab(value: string | null): UserDetailTab {
  if (value && USER_DETAIL_TABS.includes(value as UserDetailTab)) {
    return value as UserDetailTab;
  }
  return 'overview';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

type UserDetailClientProps = {
  user: AdminUserDetailDto;
  staffRole: StaffRole;
};

async function syncVipSubscription(userId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/proxy/users/${userId}/sync-vip`, { method: 'POST' });
  return res.ok ? { ok: true } : { ok: false, error: `Request failed (${res.status})` };
}

export function UserDetailClient({ user }: UserDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UserDetailTab>('overview');
  const [syncing, setSyncing] = useState(false);
  const [logFilter, setLogFilter] = useState('');
  const [invoices, setInvoices] = useState<AdminInvoiceDto[]>([]);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceLoadStatus>('idle');
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const filteredLogs = user.auditEntries.filter((entry) => {
    if (!logFilter) return true;
    const term = logFilter.toLowerCase();
    const actionMatch = entry.action.toLowerCase().includes(term);
    const actorMatch = (entry.actorStaffId || 'System').toLowerCase().includes(term);
    return actionMatch || actorMatch;
  });

  function handleTabChange(value: string): void {
    const nextTab = parseUserDetailTab(value);
    setActiveTab(nextTab);

    if (shouldLoadSubscriptionReceipts(nextTab, invoiceStatus)) {
      void loadInvoices();
    }
  }

  async function loadInvoices(force = false): Promise<void> {
    if (!force && invoiceStatus !== 'idle') return;

    setInvoiceStatus('loading');
    setInvoiceError(null);
    const result = await fetchUserInvoicesAction(user.id);

    if (!result.ok) {
      setInvoiceStatus('error');
      setInvoiceError(result.error);
      return;
    }

    setInvoices(result.invoices);
    setInvoiceStatus('success');
  }

  async function handleSyncVip(): Promise<void> {
    setSyncing(true);
    const result = await syncVipSubscription(user.id);
    setSyncing(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Sync failed');
      return;
    }
    toast.success('VIP subscription synced from Stripe');
    router.refresh();

    if (activeTab === 'subscriptions') {
      await loadInvoices(true);
    }
  }

  const location = [user.city, user.country].filter(Boolean).join(', ');

  return (
    <div className="mx-auto w-full space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/users"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'w-fit gap-2 px-0 text-muted-foreground hover:text-foreground',
        )}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to users
      </Link>

      {/* Profile header card */}
      <Card className="overflow-hidden">
        {/* Cover banner */}
        <div className="relative h-28 sm:h-44">
          <div className="" />
        </div>

        {/* Avatar + info section */}
        <div className="relative px-4 pb-4 sm:px-6">
          {/* Avatar */}
          <div className="-mt-12 mb-4 flex flex-col gap-3 sm:-mt-16 sm:flex-row sm:items-end sm:gap-5">
            <div className="shrink-0 rounded-full border-4 border-background bg-background">
              <Avatar className="size-20 text-xl sm:size-28 sm:text-2xl">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.displayName ?? 'User avatar'} />
                ) : null}
                <AvatarFallback className="text-xl">
                  {user.displayName ? (
                    getInitials(user.displayName)
                  ) : (
                    <User size={32} aria-hidden />
                  )}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="mb-1 min-w-0 flex-1 space-y-2">
              {/* Name + badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {user.displayName ?? user.phone}
                </h1>
                <div className="flex items-center gap-2">
                  <StatusBadge status={user.status} />
                  <MembershipTierBadge tier={user.membershipTier} />
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:gap-x-5 sm:text-sm">
                {user.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    {user.phone}
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full gap-0">
            <div className="-mx-4 overflow-x-auto border-t px-4 sm:-mx-6 sm:px-6">
              <TabsList variant="line" className="min-w-max sm:w-full sm:min-w-0">
                <TabsTrigger value="overview">
                  <LayoutGrid aria-hidden />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="card">
                  <CreditCard aria-hidden />
                  Card
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {user.cards.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="subscriptions">
                  <Calendar aria-hidden />
                  Subscriptions
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {user.subscriptions.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="logs">
                  <ScrollText aria-hidden />
                  Logs
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {user.auditEntries.length}
                  </Badge>
                </TabsTrigger>
                <TabsIndicator />
              </TabsList>
            </div>

            {/* Tab content */}
            <div className="p-4 pt-4 sm:p-6 sm:pt-5">
              {/* ── Overview ── */}
              <TabsContent value="overview" className="mt-0">
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Left column — Profile info */}
                  <div className="space-y-6 lg:col-span-1">
                    {/* Profile card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Profile</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {/* About section */}
                        <div>
                          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            About
                          </h4>
                          <ul className="space-y-3">
                            <ProfileInfoRow
                              icon={<User className="h-4 w-4" />}
                              value={user.displayName ?? '—'}
                            />
                            <ProfileInfoRow
                              icon={<Building2 className="h-4 w-4" />}
                              value={user.membershipTier}
                            />
                            <ProfileInfoRow
                              icon={<Calendar className="h-4 w-4" />}
                              value={`Registered ${new Date(user.createdAt).toLocaleDateString()}`}
                            />
                          </ul>
                        </div>

                        <Separator />

                        {/* Contacts section */}
                        <div>
                          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Contacts
                          </h4>
                          <ul className="space-y-3">
                            <ProfileInfoRow
                              icon={<Phone className="h-4 w-4" />}
                              value={user.phone}
                            />
                            {location && (
                              <ProfileInfoRow
                                icon={<MapPin className="h-4 w-4" />}
                                value={location}
                              />
                            )}
                            {user.localePreference && (
                              <ProfileInfoRow
                                icon={<Globe className="h-4 w-4" />}
                                value={user.localePreference}
                              />
                            )}
                          </ul>
                        </div>

                        <Separator />

                        {/* Details section */}
                        <div>
                          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Details
                          </h4>
                          <ul className="space-y-3">
                            <ProfileInfoRow
                              icon={<CreditCard className="h-4 w-4" />}
                              value={`${user.cards.length} card${user.cards.length !== 1 ? 's' : ''} issued`}
                            />
                            <ProfileInfoRow
                              icon={<Calendar className="h-4 w-4" />}
                              value={`${user.subscriptions.length} subscription${user.subscriptions.length !== 1 ? 's' : ''}`}
                            />
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right column — About + Details */}
                  <div className="space-y-6 lg:col-span-2">
                    {/* About */}
                    {user.about && (
                      <Card>
                        <CardHeader>
                          <CardTitle>About</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">
                            {user.about}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Profile details table */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Personal information</CardTitle>
                        <CardDescription>Account settings and preferences.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DescriptionList
                          items={[
                            { label: 'Display name', value: user.displayName ?? '—' },
                            { label: 'Phone', value: user.phone },
                            { label: 'Country', value: user.country ?? '—' },
                            { label: 'City', value: user.city ?? '—' },
                            { label: 'Locale preference', value: user.localePreference ?? '—' },
                            {
                              label: 'Onboarding complete',
                              value: user.onboardingComplete ? 'Yes' : 'No',
                            },
                            {
                              label: 'Terms accepted',
                              value: user.termsAcceptedAt
                                ? new Date(user.termsAcceptedAt).toLocaleDateString()
                                : '—',
                            },
                            {
                              label: 'Last updated',
                              value: new Date(user.updatedAt).toLocaleDateString(),
                            },
                          ]}
                        />
                      </CardContent>
                    </Card>

                    {/* Audit log preview */}
                    {user.auditEntries.length > 0 && (
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                          <CardTitle>Recent activity</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTabChange('logs')}
                            className="text-muted-foreground"
                          >
                            View all
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {user.auditEntries.slice(0, 5).map((entry) => (
                              <div key={entry.id} className="flex items-start gap-3">
                                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge status={entry.action} />
                                    <span className="text-xs text-muted-foreground">
                                      {entry.actorStaffId ?? 'System'}
                                    </span>
                                  </div>
                                  {entry.after && (
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                      {Object.entries(entry.after)
                                        .map(([k, v]) => `${k}: ${String(v)}`)
                                        .join(', ')}
                                    </p>
                                  )}
                                  <p className="text-muted-foreground/60 mt-1 text-xs">
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ── Card tab ── */}
              <TabsContent value="card" className="mt-0 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Card</CardTitle>
                    <CardDescription>Membership card issued to this user.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {user.cards.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No cards issued.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Card #</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Tier</TableHead>
                              <TableHead>Issued</TableHead>
                              <TableHead>Expires</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {user.cards.map((card) => (
                              <TableRow key={card.id}>
                                <TableCell className="font-mono text-xs">
                                  {card.cardNumber}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={card.status} />
                                </TableCell>
                                <TableCell>
                                  <MembershipTierBadge tier={card.membershipTier} />
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(card.issuedAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {card.expiresAt
                                    ? new Date(card.expiresAt).toLocaleDateString()
                                    : '—'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Subscriptions tab ── */}
              <TabsContent value="subscriptions" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Subscriptions</CardTitle>
                      <CardDescription>VIP subscription history.</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={syncing}
                      onClick={handleSyncVip}
                      className="shrink-0"
                    >
                      <RefreshCw
                        className={cn('mr-1.5 h-3.5 w-3.5', syncing && 'animate-spin')}
                        aria-hidden={true}
                      />
                      {syncing ? 'Syncing...' : 'Sync from Stripe'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {user.subscriptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No VIP subscription history.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead>Period start</TableHead>
                              <TableHead>Period end</TableHead>
                              <TableHead>Cancel at period end</TableHead>
                              <TableHead>Created</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {user.subscriptions.map((sub) => (
                              <TableRow key={sub.id}>
                                <TableCell>
                                  <StatusBadge status={sub.status} />
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {sub.currentPeriodStart
                                    ? new Date(sub.currentPeriodStart).toLocaleDateString()
                                    : '—'}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {sub.currentPeriodEnd
                                    ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                                    : '—'}
                                </TableCell>
                                <TableCell>{sub.cancelAtPeriodEnd ? 'Yes' : 'No'}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(sub.createdAt).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    <SubscriptionReceipts
                      invoices={invoices}
                      status={invoiceStatus}
                      error={invoiceError}
                      onRetry={() => void loadInvoices(true)}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Logs tab ── */}
              <TabsContent value="logs" className="mt-0">
                <Card>
                  <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>Logs</CardTitle>
                      <CardDescription>{user.auditEntries.length} recorded events.</CardDescription>
                    </div>
                    <AdminFilterBar
                      variant="plain"
                      className="w-full sm:w-80"
                      search={{
                        label: 'User logs',
                        placeholder: 'Filter logs',
                        value: logFilter,
                        onValueChange: setLogFilter,
                      }}
                      activeFilterCount={logFilter.trim() ? 1 : 0}
                      onReset={() => setLogFilter('')}
                    />
                  </CardHeader>
                  <CardContent>
                    {filteredLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No logs found.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Action</TableHead>
                              <TableHead>Staff</TableHead>
                              <TableHead>Details</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLogs.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell>
                                  <StatusBadge status={entry.action} />
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {entry.actorStaffId ?? 'System'}
                                </TableCell>
                                <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground">
                                  {entry.after
                                    ? Object.entries(entry.after)
                                        .map(([k, v]) => `${k}: ${String(v)}`)
                                        .join(', ')
                                    : '—'}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(entry.createdAt).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}

function ProfileInfoRow({ icon, value }: { icon: React.ReactNode; value: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span>{value}</span>
    </li>
  );
}

type DescriptionItem = {
  label: string;
  value: React.ReactNode;
};

function DescriptionList({ items }: { items: DescriptionItem[] }) {
  return (
    <dl className="space-y-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-start sm:gap-4"
        >
          <dt className="text-sm font-medium text-muted-foreground">{item.label}</dt>
          <dd className="text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
