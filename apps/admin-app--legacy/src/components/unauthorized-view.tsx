import { ShieldX } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type UnauthorizedViewProps = {
  staffRole: string;
  requiredRoles: string;
};

export function UnauthorizedView({ staffRole, requiredRoles }: UnauthorizedViewProps) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        <div className="bg-destructive/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
          <ShieldX className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle>Access Denied</CardTitle>
        <CardDescription>You don&apos;t have permission to view this page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-center text-sm">
        <div className="flex items-center justify-center gap-2">
          <span className="text-muted-foreground">Your role:</span>
          <Badge variant="secondary">{staffRole}</Badge>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-muted-foreground">Required:</span>
          <Badge variant="outline">{requiredRoles}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
