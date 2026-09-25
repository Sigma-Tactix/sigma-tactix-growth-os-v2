import React from 'react';
import { cn } from '@/src/lib/utils';

export type BadgeVariant = 'brand' | 'vermilion' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default' | 'outline';
export type BadgeSize = 'xs' | 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  brand: {
    container: 'bg-[#ff481b]/10 text-[#ff481b] border-[#ff481b]/25',
    dot: 'bg-[#ff481b]',
  },
  vermilion: {
    container: 'bg-[#ff481b]/10 text-[#ff481b] border-[#ff481b]/25',
    dot: 'bg-[#ff481b]',
  },
  success: {
    container: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    dot: 'bg-emerald-400',
  },
  warning: {
    container: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    dot: 'bg-amber-400',
  },
  danger: {
    container: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
    dot: 'bg-rose-400',
  },
  info: {
    container: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
    dot: 'bg-sky-400',
  },
  neutral: {
    container: 'bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-soft)] border-[var(--sigma-border)]',
    dot: 'bg-[var(--sigma-text-muted)]',
  },
  default: {
    container: 'bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-soft)] border-[var(--sigma-border)]',
    dot: 'bg-[var(--sigma-text-muted)]',
  },
  outline: {
    container: 'bg-transparent text-[var(--sigma-text-soft)] border-[var(--sigma-border)]',
    dot: 'bg-[var(--sigma-text-muted)]',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 rounded-md gap-1',
  sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1.5 font-medium',
  md: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-medium',
};

export function Badge({
  className,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  pulse = false,
  icon,
  children,
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center border font-sans tracking-tight select-none',
        styles.container,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                styles.dot
              )}
            />
          )}
          <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', styles.dot)} />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
