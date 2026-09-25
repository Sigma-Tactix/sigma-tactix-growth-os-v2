import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/src/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlight?: boolean;
  spotlightColor?: string;
  elevation?: 'flat' | 'raised' | 'floating';
  interactive?: boolean;
}

export function GlassCard({
  children,
  className,
  spotlight = false,
  spotlightColor = 'rgba(255, 72, 27, 0.08)',
  elevation = 'flat',
  interactive = false,
  onMouseMove,
  ...props
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!spotlight || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    onMouseMove?.(e);
  }, [spotlight, onMouseMove]);

  const elevationClasses = {
    flat: 'shadow-[var(--sigma-shadow-sm)]',
    raised: 'shadow-[var(--sigma-shadow-md)]',
    floating: 'shadow-[var(--sigma-shadow-lg)]',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative rounded-[16px] overflow-hidden transition-all duration-200',
        'bg-[var(--sigma-glass)] backdrop-blur-xl',
        'border border-[var(--sigma-border)]',
        'shadow-[inset_0_1px_0_0_var(--sigma-highlight)]',
        elevationClasses[elevation],
        interactive && 'hover:border-[var(--sigma-border-strong)] hover:shadow-[var(--sigma-shadow-md)] cursor-pointer active:scale-[0.995]',
        className
      )}
      {...props}
    >
      {spotlight && isHovered && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 opacity-100"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 60%)`,
          }}
          aria-hidden="true"
        />
      )}
      <div className="contents">
        {children}
      </div>
    </div>
  );
}

export function GlassCardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4 border-b border-[var(--sigma-border)] flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

export function GlassCardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function GlassCardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-3.5 border-t border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)]/50 flex items-center justify-between text-xs', className)} {...props}>
      {children}
    </div>
  );
}

export default GlassCard;
