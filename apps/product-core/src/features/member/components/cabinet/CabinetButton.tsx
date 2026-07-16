'use client';

import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type CabinetButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
type CabinetButtonDensity = 'compact' | 'default' | 'large';

type CabinetButtonProps = Omit<ComponentProps<typeof Button>, 'variant' | 'size'> & {
  tone?: CabinetButtonTone;
  density?: CabinetButtonDensity;
  fullWidth?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
};

const toneClassNames: Record<CabinetButtonTone, ComponentProps<typeof Button>['variant']> = {
  primary: 'default',
  secondary: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
  link: 'link',
};

const densityClassNames: Record<CabinetButtonDensity, string> = {
  compact: 'h-7 px-3 text-xs',
  default: 'h-9 px-4 text-sm',
  large: 'h-12 px-5 text-sm',
};

export function CabinetButton({
  tone = 'primary',
  density = 'default',
  fullWidth = false,
  iconStart,
  iconEnd,
  className,
  children,
  ...props
}: CabinetButtonProps) {
  const content = props.asChild ? (
    children
  ) : (
    <>
      {iconStart}
      {children}
      {iconEnd}
    </>
  );

  return (
    <Button
      variant={toneClassNames[tone]}
      size="default"
      className={cn(
        'rounded-none font-semibold tracking-normal',
        densityClassNames[density],
        tone === 'link' && 'h-auto px-0 py-0 underline-offset-2',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {content}
    </Button>
  );
}
