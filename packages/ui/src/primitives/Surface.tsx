import { cn } from '../classes';

export function Surface({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-surface  w-full max-w-md px-4 py-10 shadow-sm  ',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
