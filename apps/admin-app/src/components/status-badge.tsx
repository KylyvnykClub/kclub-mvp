import { Badge } from '@/components/ui/badge';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

const variantMap: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  PUBLISHED: 'success',
  COMPLETED: 'success',
  APPROVED: 'success',
  UNDER_REVIEW: 'warning',
  SUBMITTED: 'warning',
  IN_REVIEW: 'warning',
  PAST_DUE: 'warning',
  BLOCKED: 'destructive',
  REJECTED: 'destructive',
  REVOKED: 'destructive',
  EXPIRED: 'destructive',
  CANCELED: 'secondary',
  HIDDEN: 'secondary',
  MEMBER: 'outline',
  VIP: 'default',
};

type StatusBadgeProps = {
  status: string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = variantMap[status] ?? 'outline';
  return <Badge variant={variant}>{status}</Badge>;
}
