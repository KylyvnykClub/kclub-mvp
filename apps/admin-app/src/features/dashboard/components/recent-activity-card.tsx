import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardActivityItemDto, DashboardActivityType } from '@kclub/contracts';

const ACTIVITY_LABELS: Record<DashboardActivityType, string> = {
  USER_REGISTERED: 'New user',
  BUSINESS_SUBMITTED: 'Business',
  INTRODUCTION_SUBMITTED: 'Introduction',
};

const ACTIVITY_BADGE_VARIANTS: Record<DashboardActivityType, 'success' | 'secondary' | 'outline'> =
  {
    USER_REGISTERED: 'success',
    BUSINESS_SUBMITTED: 'secondary',
    INTRODUCTION_SUBMITTED: 'outline',
  };

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RecentActivityCard({ items }: { items: DashboardActivityItemDto[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ul className="divide-y">
            {items.map((item, index) => (
              <li
                key={`${item.type}-${item.timestamp}-${index}`}
                className="flex items-start gap-3 py-2 sm:items-center"
              >
                <Badge variant={ACTIVITY_BADGE_VARIANTS[item.type]} className="mt-0.5 shrink-0 sm:mt-0">
                  {ACTIVITY_LABELS[item.type]}
                </Badge>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{item.title}</span>
                  <span className="text-xs text-muted-foreground sm:hidden">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                  {formatTimestamp(item.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
