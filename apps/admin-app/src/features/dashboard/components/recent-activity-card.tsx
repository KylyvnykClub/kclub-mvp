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
                className="flex items-center gap-3 py-2"
              >
                <Badge variant={ACTIVITY_BADGE_VARIANTS[item.type]}>
                  {ACTIVITY_LABELS[item.type]}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
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
