'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminIntroductionListItemDto, StaffRole } from '@kclub/contracts';
import { IntroductionActions } from './introduction-action-dialogs';

type IntroductionDetailClientProps = {
  introduction: AdminIntroductionListItemDto;
  staffRole: StaffRole;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:gap-4">
      <div className="w-40 shrink-0 text-sm text-muted-foreground">{label}</div>
      <div className="min-w-0 text-sm text-foreground">{value}</div>
    </div>
  );
}

export function IntroductionDetailClient({
  introduction,
  staffRole,
}: IntroductionDetailClientProps) {
  const router = useRouter();

  const canMutate = staffRole === 'OWNER' || staffRole === 'ADMIN' || staffRole === 'MODERATOR';
  const requesterName =
    introduction.requesterBusiness.name ||
    introduction.requesterUser.displayName ||
    introduction.requesterUser.phone;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/dashboard/introductions" />}>
          <ArrowLeft className="h-4 w-4" />
          Back to introductions
        </Button>
        <IntroductionActions
          id={introduction.id}
          status={introduction.status}
          canMutate={canMutate}
          onAction={() => router.refresh()}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Introduction</CardTitle>
          <StatusBadge status={introduction.status} />
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <DetailRow label="Client name" value={introduction.clientName || '—'} />
          <DetailRow label="Client contact" value={introduction.clientContact || '—'} />
          <DetailRow
            label="Message"
            value={
              introduction.message ? (
                <span className="whitespace-pre-wrap">{introduction.message}</span>
              ) : (
                '—'
              )
            }
          />
          {introduction.rejectionReason && (
            <DetailRow label="Rejection reason" value={introduction.rejectionReason} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requester</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <DetailRow label="Name" value={requesterName} />
          <DetailRow
            label="Member"
            value={introduction.requesterUser.displayName ?? introduction.requesterUser.phone}
          />
          <DetailRow label="Phone" value={introduction.requesterUser.phone || '—'} />
          {introduction.requesterBusiness.id && (
            <DetailRow
              label="Business"
              value={
                <Link
                  href={`/dashboard/businesses/${introduction.requesterBusiness.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {introduction.requesterBusiness.name}
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target Business</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <DetailRow
            label="Business"
            value={
              introduction.targetBusiness.id ? (
                <Link
                  href={`/dashboard/businesses/${introduction.targetBusiness.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {introduction.targetBusiness.name}
                </Link>
              ) : (
                '—'
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <DetailRow label="Created" value={new Date(introduction.createdAt).toLocaleString()} />
          <DetailRow label="Updated" value={new Date(introduction.updatedAt).toLocaleString()} />
        </CardContent>
      </Card>
    </div>
  );
}
