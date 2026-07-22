import { Separator } from '@/components/ui/separator';

type PageShellProps = {
  title: string;
  description?: string;
  breadcrumbs?: string;
  roleScope?: string;
  count?: number;
  children?: React.ReactNode;
};

export function PageShell({ title, description, breadcrumbs, children }: PageShellProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        {breadcrumbs && (
          <p className="text-xs text-muted-foreground">{breadcrumbs}</p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Separator />
      {children}
    </div>
  );
}
