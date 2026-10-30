import React from 'react';
import { cn } from '@/src/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Material depth: base panel, raised panel, or a flat sub-panel for nested content */
  elevation?: 'base' | 'raised' | 'subtle';
}

export function Card({ className, elevation = 'base', ...props }: CardProps) {
  return (
    <div
      className={cn(
        elevation === 'base' && 'sigma-panel',
        elevation === 'raised' && 'sigma-panel-raised',
        elevation === 'subtle' && 'sigma-subpanel',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--sigma-border)]', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold tracking-tight text-[var(--sigma-text)]', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('mt-0.5 text-xs text-[var(--sigma-text-muted)]', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)]/50 rounded-b-[15px]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
