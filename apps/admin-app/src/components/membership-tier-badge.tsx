import type { MemberTier } from '@kclub/contracts';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const membershipTierClassNames = {
  MEMBER:
    'border-border bg-secondary text-secondary-foreground dark:border-border dark:bg-secondary dark:text-secondary-foreground',
  VIP: 'border-brand-500/30 bg-brand-100 text-brand-900 dark:border-brand-500/40 dark:bg-brand-900/40 dark:text-brand-100',
} satisfies Record<MemberTier, string>;

type MembershipTierBadgeProps = {
  tier: MemberTier;
  className?: string;
};

export function MembershipTierBadge({ tier, className }: MembershipTierBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('min-w-16 justify-center', membershipTierClassNames[tier], className)}
    >
      {tier}
    </Badge>
  );
}
