import { TriangleAlert } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardErrorState({ code }: { code: string }) {
  const unreachable = code === 'NETWORK_ERROR';

  return (
    <Card className="border-destructive/50">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <TriangleAlert className="size-4 text-destructive" />
        <CardTitle className="text-sm font-medium text-destructive">
          {unreachable ? 'Product Core API is unreachable' : 'Failed to load dashboard metrics'}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {unreachable ? (
          <p>
            Could not connect to the product-core service. In local development, make sure it is
            running on port 3000, then refresh this page.
          </p>
        ) : (
          <p>The metrics request failed (code: {code}). Try refreshing the page.</p>
        )}
      </CardContent>
    </Card>
  );
}
