'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  EyeOff,
  Globe,
  LayoutGrid,
  Link2,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  ScrollText,
  ShieldX,
  Tag,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

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
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { AdminBusinessDetailDto, StaffRole } from '@kclub/contracts';

const BUSINESS_DETAIL_TABS = ['overview', 'owner', 'edit', 'audit'] as const;

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
      return 'REJECT';
    case 'PUBLISHED':
      return 'HIDE';
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
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
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
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
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
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
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
  return { ok: res.ok, error: res.ok ? undefined : `Request failed (${res.status})` };
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
};

export function BusinessDetailClient({ business, staffRole }: BusinessDetailClientProps) {
  const router = useRouter();
  const action = canSeeAction(business.status, staffRole);
  const canEdit = canMutateBusiness(staffRole);
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

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback>{getInitials(business.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={business.status} />
                <Badge variant="outline" className="gap-1">
                  <Tag size={12} aria-hidden />
                  {business.categoryName}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <MapPin size={12} aria-hidden />
                  {business.cityName}, {business.countryName}
                </Badge>
              </div>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} aria-hidden />
                  {business.representativeEmail}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} aria-hidden />
                  {business.representativePhone}
                </span>
                <span className="inline-flex items-center gap-1.5">
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
              {action === 'REJECT' && (
                <RejectDialog
                  businessId={business.id}
                  businessName={business.name}
                  onAction={() => router.refresh()}
                />
              )}
              {action === 'HIDE' && (
                <HideDialog
                  businessId={business.id}
                  businessName={business.name}
                  onAction={() => router.refresh()}
                />
              )}
            </div>
          )}
        </CardContent>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full border-t">
          <div className="overflow-x-auto px-6 pt-2">
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
              <TabsTrigger value="audit">
                <ScrollText aria-hidden />
                Audit
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                  {business.auditEntries.length}
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
                <CardHeader>
                  <CardTitle>Owner</CardTitle>
                  <CardDescription>Member account linked to this business.</CardDescription>
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
                        <Badge variant="outline">{business.owner.membershipTier}</Badge>
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
                        value: <Badge variant="outline">{business.owner.membershipTier}</Badge>,
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

            <TabsContent value="audit" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Audit trail</CardTitle>
                  <CardDescription>{business.auditEntries.length} recorded events.</CardDescription>
                </CardHeader>
                <CardContent>
                  {business.auditEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No audit entries.</p>
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
                          {business.auditEntries.map((entry) => (
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
            <Input
              id="edit-representativePhone"
              name="representativePhone"
              type="tel"
              value={fields.representativePhone}
              onChange={handleChange}
              required
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
            placeholder="Short description (max 500 chars)"
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
