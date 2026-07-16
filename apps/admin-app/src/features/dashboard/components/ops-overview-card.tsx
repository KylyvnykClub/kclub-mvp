import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import type { DashboardMetricsDto } from '@kclub/contracts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type OpsRowProps = {
  label: string;
  value: number;
  detail?: string;
  href?: string;
};

function OpsRow({ label, value, detail, href }: OpsRowProps) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{label}</p>
        {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      {href ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
    </>
  );

  if (href) {
    return (
      <li>
        <Link
          href={href}
          className="hover:bg-muted/50 flex items-center gap-3 rounded-md px-1 py-2 transition-colors"
        >
          {content}
        </Link>
      </li>
    );
  }

  return <li className="flex items-center gap-3 px-1 py-2">{content}</li>;
}

export function OpsOverviewCard({ data }: { data: DashboardMetricsDto }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Operations</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          <OpsRow
            label="Registered users"
            value={data.totalUsers}
            detail={`${data.activeUsers} active / ${data.blockedUsers} blocked`}
            href="/dashboard/users"
          />
          <OpsRow label="New users (7d)" value={data.newUsers7d ?? 0} href="/dashboard/users" />
          <OpsRow
            label="Businesses under review"
            value={data.businessesUnderReview}
            href="/dashboard/businesses"
          />
          <OpsRow
            label="Businesses"
            value={data.totalBusinesses ?? 0}
            detail={`${data.publishedBusinesses ?? 0} published / ${data.newBusinesses7d ?? 0} new (7d)`}
            href="/dashboard/businesses"
          />
          <OpsRow
            label="Introductions pending"
            value={data.introductionsSubmitted + data.introductionsInReview}
            detail={`${data.introductionsSubmitted} submitted / ${data.introductionsInReview} in review`}
            href="/dashboard/introductions"
          />
        </ul>
      </CardContent>
    </Card>
  );
}
