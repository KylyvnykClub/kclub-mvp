import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardMetricsDto } from '@kclub/contracts';

function OpsRow({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: number;
  detail?: string;
  href?: string;
}) {
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
          className="flex items-center gap-3 rounded-md px-1 py-2 transition-colors hover:bg-muted/50"
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
            label="Businesses under review"
            value={data.businessesUnderReview}
            href="/dashboard/businesses"
          />
          <OpsRow
            label="Introductions pending"
            value={data.introductionsSubmitted + data.introductionsInReview}
            detail={`${data.introductionsSubmitted} submitted · ${data.introductionsInReview} in review`}
            href="/dashboard/introductions"
          />
          <OpsRow
            label="Total users"
            value={data.totalUsers}
            detail={`${data.activeUsers} active · ${data.blockedUsers} blocked`}
            href="/dashboard/users"
          />
          <OpsRow label="New users (7d)" value={data.newUsers7d ?? 0} />
        </ul>
      </CardContent>
    </Card>
  );
}
