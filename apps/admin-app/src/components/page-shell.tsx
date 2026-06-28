import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type PageShellProps = {
  title: string;
  description: string;
  roleScope?: string;
  count?: number;
  children?: React.ReactNode;
};

export function PageShell({ title, description, count, children }: PageShellProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {count !== undefined && (
          <span className="text-sm font-medium text-muted-foreground">
            {count.toLocaleString()}
          </span>
        )}
      </div>
      <Separator />
      {children ?? (
        <Card>
          <CardHeader>
            <CardTitle>Scaffold Ready</CardTitle>
            <CardDescription>
              This route is connected to the admin dashboard layout and ready for feature
              implementation.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Wire this page to BFF server actions and product-core admin endpoints under{' '}
            <code>/api/admin/v1</code>.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
