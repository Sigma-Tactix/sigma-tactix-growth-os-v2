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
    container: 'bg-[var(--sigma-primary-subtle)] text-[var(--sigma-accent)] border-[var(--sigma-primary)]/25',
    dot: 'bg-[var(--sigma-primary)]',
  },
  vermilion: {
    container: 'bg-[var(--sigma-primary-subtle)] text-[var(--sigma-accent)] border-[var(--sigma-primary)]/25',
    dot: 'bg-[var(--sigma-primary)]',
  },
  success: {
    container: 'bg-emerald-500/10 text-emerald-accent border-emerald-500/25',
    dot: 'bg-[var(--sigma-accent-emerald)]',
  },
  warning: {
    container: 'bg-amber-500/10 text-amber-accent border-amber-500/25',
    dot: 'bg-[var(--sigma-accent-amber)]',
  },
  danger: {
    container: 'bg-rose-500/10 text-rose-accent border-rose-500/25',
    dot: 'bg-[var(--sigma-accent-rose)]',
  },
  info: {
    container: 'bg-sky-500/10 text-cyan-accent border-sky-500/25',
    dot: 'bg-[var(--sigma-accent-cyan)]',
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
