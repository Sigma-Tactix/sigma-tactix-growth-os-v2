import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement;
  /** Extra class on the tooltip bubble */
  className?: string;
  /** Disable the hover tooltip (e.g. on touch or when busy) */
  disabled?: boolean;
}

const sideClasses: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
};

/**
 * Lightweight CSS-hover tooltip: no focus management, no portal, no z-index
 * surprises inside scroll containers. For long-form or interactive content,
 * use the Dialog primitive instead.
 */
export function Tooltip({ content, side = 'top', children, className, disabled }: TooltipProps) {
  const [open, setOpen] = useState(false);
  if (disabled || content == null || content === '') return children;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: side === 'top' ? 2 : side === 'bottom' ? -2 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            role="tooltip"
            className={cn(
              'pointer-events-none absolute z-[70] whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-medium',
              'bg-[var(--sigma-surface-raised)] border border-[var(--sigma-border-strong)] text-[var(--sigma-text-soft)]',
              'shadow-[var(--sigma-shadow-md)]',
              sideClasses[side],
              className
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default Tooltip;
