import type { MemberTier } from '@kclub/contracts';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type MembershipTierBadgeProps = {
  tier: MemberTier;
  className?: string;
};

export function MembershipTierBadge({ tier, className }: MembershipTierBadgeProps) {
  if (tier === 'VIP') {
    return (
      <Badge
        variant="outline"
        className={cn(
          'min-w-16 justify-center border-brand-500 bg-brand-100 text-brand-900 dark:border-brand-500 dark:bg-brand-900 dark:text-brand-100',
          className,
        )}
      >
        VIP
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn('min-w-16 justify-center', className)}>
      {tier}
    </Badge>
  );
}
