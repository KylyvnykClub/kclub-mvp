'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  LayoutGrid,
  RefreshCw,
  ScrollText,
  User,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
import type { AdminUserDetailDto, StaffRole } from '@kclub/contracts';

const USER_DETAIL_TABS = ['overview', 'cards', 'subscriptions', 'logs'] as const;

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
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
}

export function UserDetailClient({ user }: UserDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UserDetailTab>('overview');
  const [syncing, setSyncing] = useState(false);
  const [logFilter, setLogFilter] = useState('');

  const filteredLogs = user.auditEntries.filter((entry) => {
    if (!logFilter) return true;
    const term = logFilter.toLowerCase();
    const actionMatch = entry.action.toLowerCase().includes(term);
    const actorMatch = (entry.actorStaffId || 'System').toLowerCase().includes(term);
    return actionMatch || actorMatch;
  });

  function handleTabChange(value: string): void {
    setActiveTab(parseUserDetailTab(value));
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
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4">
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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{user.displayName ?? user.phone}</h1>
          <p className="text-sm text-muted-foreground">
            User detail
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback>
                {user.displayName ? getInitials(user.displayName) : <User size={24} aria-hidden />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={user.status} />
                <Badge variant="outline" className="gap-1">
                  {user.membershipTier}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
                <span className="inline-flex items-center gap-1.5">
                  ID: <code className="font-mono">{user.id}</code>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  Registered {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full border-t">
          <div className="overflow-x-auto px-6 pt-2">
            <TabsList variant="line" className="min-w-max sm:w-full sm:min-w-0">
              <TabsTrigger value="overview">
                <LayoutGrid aria-hidden />
                Overview
              </TabsTrigger>
              <TabsTrigger value="cards">
                <CreditCard aria-hidden />
                Cards
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

          <div className="p-6 pt-4">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Personal information and preferences.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DescriptionList
                      items={[
                        { label: 'Display name', value: user.displayName ?? '—' },
                        { label: 'Phone', value: user.phone },
                        { label: 'Country', value: user.country ?? '—' },
                        { label: 'City', value: user.city ?? '—' },
                        { label: 'Locale preference', value: user.localePreference ?? '—' },
                        { label: 'Onboarding complete', value: user.onboardingComplete ? 'Yes' : 'No' },
                        {
                          label: 'Terms accepted',
                          value: user.termsAcceptedAt
                            ? new Date(user.termsAcceptedAt).toLocaleDateString()
                            : '—',
                        },
                        { label: 'Last updated', value: new Date(user.updatedAt).toLocaleDateString() },
                      ]}
                    />
                  </CardContent>
                </Card>

                {(user.about) && (
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {user.about}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cards" className="mt-0 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cards</CardTitle>
                  <CardDescription>Membership cards issued to this user.</CardDescription>
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
                              <TableCell className="font-mono text-xs">{card.cardNumber}</TableCell>
                              <TableCell>
                                <StatusBadge status={card.status} />
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{card.membershipTier}</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(card.issuedAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : '—'}
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
                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="mt-0">
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>Logs</CardTitle>
                    <CardDescription>{user.auditEntries.length} recorded events.</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter logs..."
                      className="pl-8"
                      value={logFilter}
                      onChange={(e) => setLogFilter(e.target.value)}
                    />
                  </div>
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
      </Card>
    </div>
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
