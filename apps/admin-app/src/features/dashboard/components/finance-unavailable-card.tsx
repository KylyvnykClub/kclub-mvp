import { Lock, TriangleAlert } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { FinanceDashboardResult } from '../api';

type UnavailableStatus = Exclude<FinanceDashboardResult['status'], 'success'>;

const MESSAGES: Record<UnavailableStatus, { title: string; detail: string }> = {
  forbidden: {
    title: 'Finance metrics are restricted',
    detail: 'Revenue data is available to owners and admins only.',
  },
  unavailable: {
    title: 'Finance metrics not available yet',
    detail: 'The connected product-core deployment does not expose finance metrics.',
  },
  unreachable: {
    title: 'Finance metrics unreachable',
    detail: 'Could not reach product-core. Try again in a moment.',
  },
  error: {
    title: 'Failed to load finance metrics',
    detail: 'An unexpected error occurred while loading revenue data.',
  },
};

export function FinanceUnavailableCard({
  status,
  className,
}: {
  status: UnavailableStatus;
  className?: string;
}) {
  const message = MESSAGES[status];
  const Icon = status === 'forbidden' ? Lock : TriangleAlert;

  return (
    <Card className={className}>
      <CardContent className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 py-8 text-center">
        <Icon className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">{message.title}</p>
        <p className="text-xs text-muted-foreground">{message.detail}</p>
      </CardContent>
    </Card>
  );
}
