import { cn } from '../classes';

type ButtonColor =
  'primary' | 'secondary' | 'outline' | 'brand' | 'brand-secondary' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export function getButtonClasses({
  color = 'primary',
  size = 'md',
  fullWidth,
  className,
}: {
  color?: ButtonColor;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(
    'focus-visible:ring-focus focus-visible:ring-offset-focus relative inline-flex items-center justify-center font-semibold uppercase transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    {
      'bg-primary text-primary-foreground border border-transparent shadow-sm hover:opacity-90 rounded-md':
        color === 'primary',
      'border border-border bg-secondary text-secondary-foreground hover:bg-surface-muted shadow-sm rounded-md':
        color === 'secondary',
      'border border-foreground text-foreground hover:bg-foreground hover:text-background [&>svg:last-child]:absolute [&>svg:last-child]:top-1.5 [&>svg:last-child]:right-1.5 [&>svg:last-child]:shrink-0 pr-10':
        color === 'outline',
      'bg-accent text-zinc-950 border border-transparent hover:bg-accent-hover [&>svg:last-child]:absolute [&>svg:last-child]:top-1.5 [&>svg:last-child]:right-1.5 [&>svg:last-child]:shrink-0 pr-10':
        color === 'brand',
      'bg-transparent text-foreground border border-accent hover:bg-accent/10 [&>svg:last-child]:absolute [&>svg:last-child]:top-1.5 [&>svg:last-child]:right-1.5 [&>svg:last-child]:shrink-0 pr-10':
        color === 'brand-secondary',
      'bg-red-600 text-white border border-transparent shadow-sm hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-md':
        color === 'destructive',
      'text-muted-foreground hover:text-foreground border border-transparent rounded-md':
        color === 'ghost',
    },
    {
      'px-4 py-2.5 text-[10px] tracking-[0.2em]': size === 'sm',
      'px-5 py-3 text-xs tracking-[0.24em]': size === 'md',
      'px-6 py-3.5 text-sm tracking-[0.26em]': size === 'lg',
    },
    fullWidth && 'w-full',
    className,
  );
}

export function Button({
  color = 'primary',
  size = 'md',
  fullWidth,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: ButtonColor;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  return <button className={getButtonClasses({ color, size, fullWidth, className })} {...props} />;
}
