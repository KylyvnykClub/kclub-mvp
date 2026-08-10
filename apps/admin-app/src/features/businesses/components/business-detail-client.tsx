'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  Download,
  EyeOff,
  Globe,
  Inbox,
  LayoutGrid,
  Link2,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  RefreshCw,
  ScrollText,
  Send,
  Settings,
  ShieldX,
  Tag,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { AdminFilterBar } from '@/components/admin-filter-bar';
import { MembershipTierBadge } from '@/components/membership-tier-badge';
import { StatusBadge } from '@/components/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type {
  AdminBusinessDetailDto,
  AdminIntroductionListItemDto,
  AuditLogDto,
  StaffRole,
} from '@kclub/contracts';
import { PhoneInput } from '@kclub/ui';
import { IntroductionsTable } from '@/features/introductions/components/introductions-table';

const ADMIN_PHONE_INPUT_CLASSNAME =
  'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';
const ADMIN_PHONE_TRIGGER_CLASSNAME =
  'flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50';
const ADMIN_PHONE_PANEL_CLASSNAME = 'border-border bg-popover text-popover-foreground shadow-md';

const BUSINESS_DETAIL_TABS = ['overview', 'owner', 'edit', 'settings', 'audit', 'inbox'] as const;

type BusinessDetailTab = (typeof BUSINESS_DETAIL_TABS)[number];

function parseBusinessDetailTab(value: string | null): BusinessDetailTab {
  if (value && BUSINESS_DETAIL_TABS.includes(value as BusinessDetailTab)) {
    return value as BusinessDetailTab;
  }
  return 'overview';
}

function canMutateBusiness(role: StaffRole): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'MODERATOR';
}

function canSeeAction(status: string, role: StaffRole): string | null {
  if (!canMutateBusiness(role)) return null;
  switch (status) {
    case 'UNDER_REVIEW':
      return 'APPROVE_REJECT';
    case 'APPROVED':
      return 'PUBLISH_REJECT';
    case 'PUBLISHED':
      return 'HIDE';
    case 'HIDDEN':
      return 'SHOW';
    default:
      return null;
  }
}

async function approveBusiness(
  businessId: string,
  notes?: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/proxy/businesses/${businessId}/approve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(notes ? { notes } : {}),
  });
  return res.ok ? { ok: true } : { ok: false, error: `Request failed (${res.status})` };
}

async function rejectBusiness(
  businessId: string,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/proxy/businesses/${businessId}/reject`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return res.ok ? { ok: true } : { ok: false, error: `Request failed (${res.status})` };
}

async function publishBusiness(businessId: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/proxy/businesses/${businessId}/publish`, { method: 'POST' });
  return res.ok ? { ok: true } : { ok: false, error: `Request failed (${res.status})` };
}

async function hideBusiness(
  businessId: string,
  reason?: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/proxy/businesses/${businessId}/hide`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(reason ? { reason } : {}),
  });
  return res.ok ? { ok: true } : { ok: false, error: `Request failed (${res.status})` };
}

async function updateBusiness(
  businessId: string,
  data: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/proxy/businesses/${businessId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.ok ? { ok: true } : { ok: false, error: `Request failed (${res.status})` };
}

async function updateBusinessSettings(
  businessId: string,
  data: {
    featuredTop?: boolean;
    featuredRecommended?: boolean;
    memberDiscountPercent?: number | null;
    discountMuted?: boolean;
  },
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/proxy/businesses/${businessId}/featured`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (res.status === 409) {
    const body = await res.json().catch(() => ({}));
    const code = body?.error?.code ?? '';
    const message = body?.error?.message ?? 'Conflict';
    return { ok: false, error: code || message };
  }

  return res.ok ? { ok: true } : { ok: false, error: `Request failed (${res.status})` };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

type BusinessDetailClientProps = {
  business: AdminBusinessDetailDto;
  staffRole: StaffRole;
  introductions: AdminIntroductionListItemDto[];
};

export function BusinessDetailClient({
  business,
  staffRole,
  introductions,
}: BusinessDetailClientProps) {
  const router = useRouter();
  const action = canSeeAction(business.status, staffRole);
  const canEdit = canMutateBusiness(staffRole);
  const awaitingPublication =
    business.status === 'APPROVED' && business.placementSubscription?.status === 'ACTIVE';
  const [activeTab, setActiveTab] = useState<BusinessDetailTab>('overview');

  function handleTabChange(value: string): void {
    const nextTab = parseBusinessDetailTab(value);
    setActiveTab(nextTab === 'edit' && !canEdit ? 'overview' : nextTab);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/businesses"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'w-fit gap-2 px-0 text-muted-foreground hover:text-foreground',
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to businesses
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
          <p className="text-sm text-muted-foreground">
            {business.categoryName} · {business.cityName}, {business.countryName}
          </p>
        </div>
      </div>

      {awaitingPublication && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" aria-hidden />
          <div>
            <p className="font-medium">This business has been paid</p>
            <p className="text-muted-foreground">
              The placement subscription is active. Review and publish the business to make it
              visible in the directory.
            </p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 text-base sm:h-16 sm:w-16 sm:text-lg">
              <AvatarFallback>{getInitials(business.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1.5 sm:space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <StatusBadge status={business.status} />
                {awaitingPublication && (
                  <Badge
                    variant="outline"
                    className="border-blue-500/20 bg-blue-500/15 text-blue-500 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300"
                  >
                    PAID
                  </Badge>
                )}
                <Badge variant="outline" className="gap-1 text-[11px] sm:text-xs">
                  <Tag size={12} aria-hidden />
                  {business.categoryName}
                </Badge>
                <Badge variant="outline" className="hidden gap-1 sm:inline-flex">
                  <MapPin size={12} aria-hidden />
                  {business.cityName}, {business.countryName}
                </Badge>
              </div>
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4 sm:text-sm">
                <span className="inline-flex items-center gap-1.5 truncate">
                  <Mail size={14} aria-hidden className="shrink-0" />
                  {business.representativeEmail}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} aria-hidden className="shrink-0" />
                  {business.representativePhone}
                </span>
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                  <Building2 size={14} aria-hidden />
                  Joined {new Date(business.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {action !== null && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {action === 'APPROVE_REJECT' && (
                <>
                  <ApproveDialog businessId={business.id} onAction={() => router.refresh()} />
                  <RejectDialog
                    businessId={business.id}
                    businessName={business.name}
                    onAction={() => router.refresh()}
                  />
                </>
              )}
              {action === 'PUBLISH_REJECT' && (
                <>
                  <PublishDialog businessId={business.id} onAction={() => router.refresh()} />
                  <RejectDialog
                    businessId={business.id}
                    businessName={business.name}
                    onAction={() => router.refresh()}
                  />
                </>
              )}
              {action === 'HIDE' && (
                <HideDialog
                  businessId={business.id}
                  businessName={business.name}
                  onAction={() => router.refresh()}
                />
              )}
              {action === 'SHOW' && (
                <ShowDialog businessId={business.id} onAction={() => router.refresh()} />
              )}
            </div>
          )}
        </CardContent>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full border-t">
          <div className="overflow-x-auto px-4 pt-2 sm:px-6">
            <TabsList variant="line" className="min-w-max sm:w-full sm:min-w-0">
              <TabsTrigger value="overview">
                <LayoutGrid aria-hidden />
                Overview
              </TabsTrigger>
              <TabsTrigger value="owner">
                <User aria-hidden />
                Owner
              </TabsTrigger>
              {canEdit && (
                <TabsTrigger value="edit">
                  <PencilLine aria-hidden />
                  Edit profile
                </TabsTrigger>
              )}
              {canEdit && (
                <TabsTrigger value="settings">
                  <Settings aria-hidden />
                  Settings
                </TabsTrigger>
              )}
              <TabsTrigger value="audit">
                <ScrollText aria-hidden />
                Logs
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                  {business.auditEntries.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="inbox">
                <Inbox aria-hidden />
                Inbox
                {introductions.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                    {introductions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsIndicator />
            </TabsList>
          </div>

          <div className="p-4 pt-3 sm:p-6 sm:pt-4">
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                    <CardDescription>Business profile and publication details.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DescriptionList
                      items={[
                        {
                          label: 'ID',
                          value: <code className="font-mono text-xs">{business.id}</code>,
                        },
                        {
                          label: 'Slug',
                          value: <code className="font-mono text-xs">{business.slug}</code>,
                        },
                        { label: 'Category', value: business.categoryName },
                        {
                          label: 'Location',
                          value: `${business.cityName}, ${business.countryName}`,
                        },
                        {
                          label: 'Featured top',
                          value: (
                            <Badge variant={business.featuredTop ? 'secondary' : 'outline'}>
                              {business.featuredTop ? 'Yes' : 'No'}
                            </Badge>
                          ),
                        },
                        {
                          label: 'Featured recommended',
                          value: (
                            <Badge variant={business.featuredRecommended ? 'secondary' : 'outline'}>
                              {business.featuredRecommended ? 'Yes' : 'No'}
                            </Badge>
                          ),
                        },
                        {
                          label: 'Member discount',
                          value:
                            business.memberDiscountPercent != null
                              ? `${business.memberDiscountPercent}%`
                              : '—',
                        },
                        {
                          label: 'Published',
                          value: business.publishedAt
                            ? new Date(business.publishedAt).toLocaleDateString()
                            : '—',
                        },
                        {
                          label: 'Approved',
                          value: business.approvedAt
                            ? new Date(business.approvedAt).toLocaleDateString()
                            : '—',
                        },
                        ...(business.rejectionReason
                          ? [{ label: 'Rejection reason', value: business.rejectionReason }]
                          : []),
                      ]}
                    />
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Contact</CardTitle>
                    <CardDescription>Representative and public links.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DescriptionList
                      items={[
                        { label: 'Representative', value: business.representativeName ?? '—' },
                        {
                          label: 'Email',
                          value: (
                            <span className="inline-flex items-center gap-1.5 break-all">
                              <Mail
                                size={14}
                                aria-hidden
                                className="shrink-0 text-muted-foreground"
                              />
                              {business.representativeEmail}
                            </span>
                          ),
                        },
                        {
                          label: 'Phone',
                          value: (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone
                                size={14}
                                aria-hidden
                                className="shrink-0 text-muted-foreground"
                              />
                              {business.representativePhone}
                            </span>
                          ),
                        },
                        {
                          label: 'Website',
                          value: business.websiteUrl ? (
                            <a
                              href={business.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 break-all font-medium underline underline-offset-4"
                            >
                              <Globe size={14} aria-hidden className="shrink-0" />
                              {business.websiteUrl}
                            </a>
                          ) : (
                            '—'
                          ),
                        },
                        {
                          label: 'Social',
                          value: business.socialUrl ? (
                            <a
                              href={business.socialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 break-all font-medium underline underline-offset-4"
                            >
                              <Link2 size={14} aria-hidden className="shrink-0" />
                              {business.socialUrl}
                            </a>
                          ) : (
                            '—'
                          ),
                        },
                      ]}
                    />
                  </CardContent>
                </Card>
              </div>

              {(business.briefDescription || business.description) && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {business.briefDescription && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Brief description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-6">{business.briefDescription}</p>
                      </CardContent>
                    </Card>
                  )}
                  {business.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {business.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Placement & payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {business.placementSubscription ? (
                      <DescriptionList
                        items={[
                          {
                            label: 'Status',
                            value: <StatusBadge status={business.placementSubscription.status} />,
                          },
                          {
                            label: 'Period end',
                            value: business.placementSubscription.currentPeriodEnd
                              ? new Date(
                                  business.placementSubscription.currentPeriodEnd,
                                ).toLocaleDateString()
                              : '—',
                          },
                        ]}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">No placement subscription.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Internal notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {business.internalNotes ? (
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {business.internalNotes}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No internal notes. Notes can be added during approval.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="owner" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                  <div className="space-y-1.5">
                    <CardTitle>Owner</CardTitle>
                    <CardDescription>Member account linked to this business.</CardDescription>
                  </div>
                  <Link
                    href={`/dashboard/users/${business.owner.id}`}
                    className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                  >
                    View account
                  </Link>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback>
                        {business.owner.displayName ? (
                          getInitials(business.owner.displayName)
                        ) : (
                          <User size={20} aria-hidden />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {business.owner.displayName ?? 'No display name'}
                      </p>
                      <p className="text-sm text-muted-foreground">{business.owner.phone}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <StatusBadge status={business.owner.status} />
                        <MembershipTierBadge tier={business.owner.membershipTier} />
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <DescriptionList
                    items={[
                      {
                        label: 'User ID',
                        value: <code className="font-mono text-xs">{business.owner.id}</code>,
                      },
                      { label: 'Phone', value: business.owner.phone },
                      { label: 'Display name', value: business.owner.displayName ?? '—' },
                      {
                        label: 'Membership',
                        value: <MembershipTierBadge tier={business.owner.membershipTier} />,
                      },
                      {
                        label: 'Status',
                        value: <StatusBadge status={business.owner.status} />,
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {canEdit && (
              <TabsContent value="edit" className="mt-0">
                <EditProfileTab business={business} onSaved={() => router.refresh()} />
              </TabsContent>
            )}

            {canEdit && (
              <TabsContent value="settings" className="mt-0">
                <SettingsTab business={business} onSaved={() => router.refresh()} />
              </TabsContent>
            )}

            <TabsContent value="inbox" className="mt-0 space-y-4">
              <div>
                <h3 className="text-base font-medium">Inbox</h3>
                <p className="text-sm text-muted-foreground">
                  Incoming recommendations from other businesses.
                </p>
              </div>
              <IntroductionsTable introductions={introductions} staffRole={staffRole} />
            </TabsContent>

            <TabsContent value="audit" className="mt-0">
              <LogsTab entries={business.auditEntries} onRefresh={() => router.refresh()} />
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

type EditProfileTabProps = {
  business: AdminBusinessDetailDto;
  onSaved: () => void;
};

function EditProfileTab({ business, onSaved }: EditProfileTabProps) {
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({
    name: business.name,
    representativeName: business.representativeName ?? '',
    representativeEmail: business.representativeEmail,
    representativePhone: business.representativePhone,
    briefDescription: business.briefDescription ?? '',
    websiteUrl: business.websiteUrl ?? '',
    socialUrl: business.socialUrl ?? '',
    seoTitle: business.seoTitle ?? '',
    seoDescription: business.seoDescription ?? '',
    seoKeywords: business.seoKeywords ?? '',
    ogImageUrl: business.ogImageUrl ?? '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);

    const payload: Record<string, unknown> = {};
    if (fields.name !== business.name) payload.name = fields.name;
    if (fields.representativeName !== (business.representativeName ?? ''))
      payload.representativeName = fields.representativeName || undefined;
    if (fields.representativeEmail !== business.representativeEmail)
      payload.representativeEmail = fields.representativeEmail;
    if (fields.representativePhone !== business.representativePhone)
      payload.representativePhone = fields.representativePhone;
    if (fields.briefDescription !== (business.briefDescription ?? ''))
      payload.briefDescription = fields.briefDescription || undefined;
    if (fields.websiteUrl !== (business.websiteUrl ?? ''))
      payload.websiteUrl = fields.websiteUrl || null;
    if (fields.socialUrl !== (business.socialUrl ?? ''))
      payload.socialUrl = fields.socialUrl || null;
    if (fields.seoTitle !== (business.seoTitle ?? '')) payload.seoTitle = fields.seoTitle || null;
    if (fields.seoDescription !== (business.seoDescription ?? ''))
      payload.seoDescription = fields.seoDescription || null;
    if (fields.seoKeywords !== (business.seoKeywords ?? ''))
      payload.seoKeywords = fields.seoKeywords || null;
    if (fields.ogImageUrl !== (business.ogImageUrl ?? ''))
      payload.ogImageUrl = fields.ogImageUrl || null;

    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save');
      setLoading(false);
      return;
    }

    const result = await updateBusiness(business.id, payload);
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error ?? 'Failed to save changes');
      return;
    }

    toast.success('Business profile updated');
    onSaved();
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium">Edit business profile</h3>
        <p className="text-sm text-muted-foreground">Update public-facing business information.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Business name</Label>
            <Input
              id="edit-name"
              name="name"
              value={fields.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-representativeName">Representative name</Label>
            <Input
              id="edit-representativeName"
              name="representativeName"
              value={fields.representativeName}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-representativeEmail">Representative email</Label>
            <Input
              id="edit-representativeEmail"
              name="representativeEmail"
              type="email"
              value={fields.representativeEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-representativePhone">Representative phone</Label>
            <PhoneInput
              id="edit-representativePhone"
              name="representativePhone"
              value={fields.representativePhone}
              onChange={(value) => setFields((prev) => ({ ...prev, representativePhone: value }))}
              required
              inputClassName={ADMIN_PHONE_INPUT_CLASSNAME}
              triggerClassName={ADMIN_PHONE_TRIGGER_CLASSNAME}
              panelClassName={ADMIN_PHONE_PANEL_CLASSNAME}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-websiteUrl">Website URL</Label>
            <Input
              id="edit-websiteUrl"
              name="websiteUrl"
              type="url"
              placeholder="https://example.com"
              value={fields.websiteUrl}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-socialUrl">Social URL</Label>
            <Input
              id="edit-socialUrl"
              name="socialUrl"
              type="url"
              placeholder="https://instagram.com/..."
              value={fields.socialUrl}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-briefDescription">Brief description</Label>
          <Input
            id="edit-briefDescription"
            name="briefDescription"
            value={fields.briefDescription}
            onChange={handleChange}
            placeholder="Short description (max 2000 chars)"
            maxLength={2000}
          />
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium">SEO & Meta</h4>
          <p className="text-sm text-muted-foreground">
            Custom metadata for search engines. Leave empty to use defaults.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-seoTitle">SEO Title</Label>
            <Input
              id="edit-seoTitle"
              name="seoTitle"
              value={fields.seoTitle}
              onChange={handleChange}
              placeholder="Custom page title (max 200 chars)"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-ogImageUrl">OG Image URL</Label>
            <Input
              id="edit-ogImageUrl"
              name="ogImageUrl"
              type="url"
              value={fields.ogImageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-seoDescription">SEO Description</Label>
          <Input
            id="edit-seoDescription"
            name="seoDescription"
            value={fields.seoDescription}
            onChange={handleChange}
            placeholder="Custom meta description (max 500 chars)"
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-seoKeywords">SEO Keywords</Label>
          <Input
            id="edit-seoKeywords"
            name="seoKeywords"
            value={fields.seoKeywords}
            onChange={handleChange}
            placeholder="keyword1, keyword2, keyword3"
            maxLength={500}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={loading} size="sm">
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

type SettingsTabProps = {
  business: AdminBusinessDetailDto;
  onSaved: () => void;
};

function SettingsTab({ business, onSaved }: SettingsTabProps) {
  const [loading, setLoading] = useState(false);
  const [featuredTop, setFeaturedTop] = useState(business.featuredTop ?? false);
  const [featuredRecommended, setFeaturedRecommended] = useState(
    business.featuredRecommended ?? false,
  );
  const [discountInput, setDiscountInput] = useState(
    business.memberDiscountPercent != null ? String(business.memberDiscountPercent) : '',
  );
  const [discountMuted, setDiscountMuted] = useState(business.discountMuted ?? false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);

    const memberDiscountPercent = discountInput === '' ? null : parseInt(discountInput, 10);

    const payload: {
      featuredTop?: boolean;
      featuredRecommended?: boolean;
      memberDiscountPercent?: number | null;
      discountMuted?: boolean;
    } = {};

    if (featuredTop !== (business.featuredTop ?? false)) {
      payload.featuredTop = featuredTop;
    }
    if (featuredRecommended !== (business.featuredRecommended ?? false)) {
      payload.featuredRecommended = featuredRecommended;
    }
    if (memberDiscountPercent !== (business.memberDiscountPercent ?? null)) {
      payload.memberDiscountPercent = memberDiscountPercent;
    }
    if (discountMuted !== (business.discountMuted ?? false)) {
      payload.discountMuted = discountMuted;
    }

    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save');
      setLoading(false);
      return;
    }

    const result = await updateBusinessSettings(business.id, payload);

    setLoading(false);

    if (!result.ok) {
      if (result.error === 'FEATURED_LIMIT_REACHED') {
        toast.error('Maximum top or recommended (3) already reached.');
      } else if (result.error === 'FEATURED_BUSINESS_NOT_PUBLISHED') {
        toast.error('Only PUBLISHED businesses can be featured.');
      } else {
        toast.error(result.error ?? 'Failed to save settings');
      }
      setFeaturedTop(business.featuredTop ?? false);
      setFeaturedRecommended(business.featuredRecommended ?? false);
      return;
    }

    toast.success('Settings saved');
    onSaved();
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium">Business settings</h3>
        <p className="text-sm text-muted-foreground">
          Featured placement and member discount configuration.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Featured placement</CardTitle>
            <CardDescription>
              Controls which sections the business appears in on the public catalog.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Top</Label>
                <p className="text-sm text-muted-foreground">Show in the Top featured section.</p>
              </div>
              <Switch checked={featuredTop} onCheckedChange={setFeaturedTop} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Recommended</Label>
                <p className="text-sm text-muted-foreground">Show in the Recommended section.</p>
              </div>
              <Switch checked={featuredRecommended} onCheckedChange={setFeaturedRecommended} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member discount</CardTitle>
            <CardDescription>
              Discount percentage shown on the business card for club members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex max-w-xs items-center gap-3">
              <Input
                id="settings-discount"
                type="number"
                min={0}
                max={100}
                step={1}
                placeholder="0–100"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Leave empty to remove the discount badge from the card.
            </p>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label>Muted</Label>
                <p className="text-sm text-muted-foreground">
                  Blur the discount ribbon on the card.
                </p>
              </div>
              <Switch checked={discountMuted} onCheckedChange={setDiscountMuted} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} size="sm">
            {loading ? 'Saving...' : 'Save settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Logs Tab ──────────────────────────────────────────────────────────────

type LogsTabProps = {
  entries: AuditLogDto[];
  onRefresh: () => void;
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString() +
    ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
}

function formatRequest(entityType: string, entityId: string): string {
  return `${entityType} / ${entityId.slice(0, 8)}…`;
}

function formatMessages(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): string {
  if (!after && !before) return '—';
  if (after) {
    const pairs = Object.entries(after).map(([k, v]) => `${k}: ${String(v ?? '—')}`);
    return pairs.join(' · ') || '—';
  }
  return '—';
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function LogsTab({ entries, onRefresh }: LogsTabProps) {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const uniqueActions = Array.from(new Set(entries.map((e) => e.action))).sort();

  const filtered = entries.filter((e) => {
    if (actionFilter !== 'all' && e.action !== actionFilter) return false;
    const day = e.createdAt.slice(0, 10);
    if (dateFrom && day < dateFrom) return false;
    if (dateTo && day > dateTo) return false;
    return true;
  });

  function handleRefresh() {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  }

  function handleExportCSV() {
    const header = ['Action', 'Time', 'Status', 'Host', 'Request', 'Messages'].join(',');
    const rows = filtered.map((e) =>
      [
        e.action,
        e.createdAt,
        e.actorRole ?? 'System',
        e.ipAddress ?? '',
        `${e.entityType}/${e.entityId}`,
        formatMessages(e.before, e.after).replace(/,/g, ';'),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    downloadBlob([header, ...rows].join('\n'), 'logs.csv', 'text/csv;charset=utf-8;');
  }

  function handleExportJSON() {
    const data = filtered.map((e) => ({
      action: e.action,
      time: e.createdAt,
      status: e.actorRole ?? 'System',
      host: e.ipAddress ?? null,
      request: `${e.entityType}/${e.entityId}`,
      before: e.before,
      after: e.after,
    }));
    downloadBlob(JSON.stringify(data, null, 2), 'logs.json', 'application/json');
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="space-y-2">
        <AdminFilterBar
          variant="plain"
          fields={[
            {
              id: 'business-log-action-filter',
              kind: 'select',
              label: 'Action',
              value: actionFilter,
              placeholder: 'All actions',
              options: [
                { label: 'All actions', value: 'all' },
                ...uniqueActions.map((action) => ({
                  label: action.replaceAll('_', ' '),
                  value: action,
                })),
              ],
              onValueChange: setActionFilter,
            },
            {
              id: 'business-log-date-from-filter',
              kind: 'input',
              label: 'From date',
              type: 'date',
              value: dateFrom,
              onValueChange: setDateFrom,
            },
            {
              id: 'business-log-date-to-filter',
              kind: 'input',
              label: 'To date',
              type: 'date',
              value: dateTo,
              onValueChange: setDateTo,
            },
          ]}
          activeFilterCount={
            (actionFilter !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)
          }
          onReset={() => {
            setActionFilter('all');
            setDateFrom('');
            setDateTo('');
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {filtered.length}/{entries.length} rows
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="h-3.5 w-3.5" />
              JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Action</TableHead>
              <TableHead className="w-[160px]">Time</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Host</TableHead>
              <TableHead className="w-[180px]">Request</TableHead>
              <TableHead>Messages</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  No log entries found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => (
                <TableRow key={entry.id} className="align-top">
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                      {entry.action}
                    </code>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.actorRole ? 'secondary' : 'outline'} className="text-xs">
                      {entry.actorRole ?? 'System'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {entry.ipAddress ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {formatRequest(entry.entityType, entry.entityId)}
                  </TableCell>
                  <TableCell className="max-w-[320px] text-xs text-muted-foreground">
                    <span className="line-clamp-2">
                      {formatMessages(entry.before, entry.after)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── Dialogs ───────────────────────────────────────────────────────────────

function PublishDialog({ businessId, onAction }: { businessId: string; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="secondary">
            <Send className="mr-1.5 h-4 w-4" />
            Publish
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish business</DialogTitle>
          <DialogDescription>
            This will make the business visible in the public directory immediately.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const result = await publishBusiness(businessId);
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error ?? 'Failed to publish');
                return;
              }
              setOpen(false);
              toast.success('Business published');
              onAction();
            }}
          >
            {loading ? 'Publishing...' : 'Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShowDialog({ businessId, onAction }: { businessId: string; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="secondary">
            <Send className="mr-1.5 h-4 w-4" />
            Show
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Show business</DialogTitle>
          <DialogDescription>
            This will re-publish the business and make it visible in the public directory again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const result = await publishBusiness(businessId);
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error ?? 'Failed to show business');
                return;
              }
              setOpen(false);
              toast.success('Business is now visible');
              onAction();
            }}
          >
            {loading ? 'Publishing...' : 'Show'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApproveDialog({ businessId, onAction }: { businessId: string; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Approve
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve business</DialogTitle>
          <DialogDescription>
            This will transition the business to APPROVED. Publication still requires payment via
            webhook.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="approve-notes">Internal notes (optional)</Label>
          <Input
            id="approve-notes"
            placeholder="Add internal notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const result = await approveBusiness(businessId, notes || undefined);
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error ?? 'Failed to approve');
                return;
              }
              setOpen(false);
              toast.success('Business approved');
              onAction();
            }}
          >
            {loading ? 'Approving...' : 'Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  businessId,
  businessName,
  onAction,
}: {
  businessId: string;
  businessName: string;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <ShieldX className="mr-1.5 h-4 w-4" />
            Reject
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject business</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject {businessName}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason (required)</Label>
          <Input
            id="reject-reason"
            placeholder="Why is this business being rejected?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={loading || !reason.trim()}
            onClick={async () => {
              setLoading(true);
              const result = await rejectBusiness(businessId, reason.trim());
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error ?? 'Failed to reject');
                return;
              }
              setOpen(false);
              toast.success('Business rejected');
              onAction();
            }}
          >
            {loading ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HideDialog({
  businessId,
  businessName,
  onAction,
}: {
  businessId: string;
  businessName: string;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="secondary" size="sm">
            <EyeOff className="mr-1.5 h-4 w-4" />
            Hide
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hide business</DialogTitle>
          <DialogDescription>
            {businessName} will be hidden from the public directory. Featured flags will be reset.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="hide-reason">Reason (optional)</Label>
          <Input
            id="hide-reason"
            placeholder="Why is this business being hidden?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const result = await hideBusiness(businessId, reason || undefined);
              setLoading(false);
              if (!result.ok) {
                toast.error(result.error ?? 'Failed to hide');
                return;
              }
              setOpen(false);
              toast.success('Business hidden');
              onAction();
            }}
          >
            {loading ? 'Hiding...' : 'Hide'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
