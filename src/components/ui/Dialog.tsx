import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Omit the default header/close button entirely (body-only dialogs, e.g. confirmations with custom layout) */
  bare?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
}

const sizeStyles: Record<NonNullable<DialogProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Centered modal dialog on the sigma material system.
 * Portal-rendered, ESC-to-close, backdrop click, body scroll lock, focus on open.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  bare = false,
  closeOnBackdrop = true,
  className,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (closeOnBackdrop && e.target === e.currentTarget) onClose();
          }}
          aria-hidden={!open}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'w-full rounded-2xl bg-[var(--sigma-surface)] border border-[var(--sigma-border-strong)]',
              'shadow-[var(--sigma-shadow-lg)] text-[var(--sigma-text)] outline-none flex flex-col overflow-hidden',
              'max-h-[min(32rem,calc(100vh-2rem))]',
              sizeStyles[size],
              className
            )}
          >
            {!bare && (
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--sigma-border)]">
                <div className="min-w-0">
                  {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
                  {description && (
                    <p className="mt-0.5 text-xs text-[var(--sigma-text-muted)]">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="shrink-0 min-h-8 min-w-8 p-2 rounded-lg text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sigma-primary)] focus-visible:ring-offset-2"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {children && (
              <div className="px-5 py-4 overflow-y-auto grow min-h-0 flex-1">{children}</div>
            )}
            {footer && (
              <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)]/50 rounded-b-2xl">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default Dialog;
