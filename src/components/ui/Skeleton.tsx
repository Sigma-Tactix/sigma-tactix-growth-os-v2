import React from 'react';
import { cn } from '@/src/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 'text' | 'title' | 'block' | 'circle' */
  variant?: 'text' | 'title' | 'block' | 'circle';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ variant = 'text', width, height, className, style, ...props }: SkeletonProps) {
  const variantClass = {
    text: 'h-3.5 rounded-md',
    title: 'h-5 rounded-lg',
    block: 'h-24 rounded-xl',
    circle: 'rounded-full',
  }[variant];

  return (
    <div
      className={cn('animate-pulse bg-[var(--sigma-surface-subtle)]', variantClass, className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}

/** N stacked text lines, the last one shorter — the common "content loading" shape. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '62%' : '100%'} />
      ))}
    </div>
  );
}

/** KPI card placeholder: label line + big number block + delta line. */
export function SkeletonMetric() {
  return (
    <div className="rounded-2xl border border-[var(--sigma-border)] bg-[var(--sigma-surface)] p-5 space-y-3" aria-hidden="true">
      <Skeleton variant="text" width="45%" />
      <Skeleton variant="title" width="70%" />
      <Skeleton variant="text" width="35%" />
    </div>
  );
}

/** Table-shaped placeholder used while a data grid loads. */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-[var(--sigma-border)] overflow-hidden" aria-hidden="true">
      <div className="bg-[var(--sigma-surface-subtle)] px-4 py-3 border-b border-[var(--sigma-border)]">
        <Skeleton variant="text" width="30%" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3 border-b border-[var(--sigma-border)] last:border-0 flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={c === 0 ? '28%' : `${Math.max(12, 40 - c * 8)}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
