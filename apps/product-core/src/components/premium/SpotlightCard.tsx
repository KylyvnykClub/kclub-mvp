'use client';

import { useRef, useState } from 'react';

import { cn } from '@kclub/ui';

type SpotlightCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'hover:border-kclub-gold-500/30 dark:border-kclub-navy-700 dark:bg-kclub-navy-900 group relative overflow-hidden rounded-xl border border-border bg-card transition duration-200',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 motion-safe:group-hover:opacity-100',
          isHovered && 'opacity-100',
        )}
        style={{
          background: `radial-gradient(420px circle at ${position.x}px ${position.y}px, rgba(201, 162, 39, 0.12), transparent 45%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
