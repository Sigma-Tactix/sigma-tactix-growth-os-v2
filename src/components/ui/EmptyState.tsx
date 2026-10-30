import React from 'react';
import { cn } from '@/src/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** 'sm' for inline panel placeholders, 'md' for full-section placeholders */
  size?: 'sm' | 'md';
}

/**
 * Empty state: a titled, explained placeholder with an optional call to action.
 * Use instead of a blank panel so every list explains what will appear there
 * and how to make it appear.
 */
export function EmptyState({ icon, title, description, action, className, size = 'md' }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-[var(--sigma-border-strong)]',
        'bg-[var(--sigma-surface-subtle)]/40',
        size === 'sm' ? 'px-5 py-8 gap-2' : 'px-6 py-14 gap-3',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] text-[var(--sigma-text-muted)]',
            size === 'sm' ? 'h-9 w-9' : 'h-12 w-12'
          )}
        >
          {icon}
        </div>
      )}
      <h3 className={cn('font-semibold text-[var(--sigma-text)]', size === 'sm' ? 'text-xs' : 'text-sm')}>{title}</h3>
      {description && (
        <p className={cn('max-w-sm text-[var(--sigma-text-muted)]', size === 'sm' ? 'text-[11px]' : 'text-xs')}>
          {description}
        </p>
      )}
      {action && <div className="mt-1.5 flex items-center gap-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
