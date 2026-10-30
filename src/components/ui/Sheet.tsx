import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'right' | 'left';
  /** Panel width; default 24rem */
  width?: string;
  closeOnBackdrop?: boolean;
  /** Render inside the nearest positioned ancestor instead of document.body (for in-view drawers like the hologram inspector) */
  inline?: boolean;
  className?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  width,
  closeOnBackdrop = true,
  inline = false,
  className,
}: SheetProps) {
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

  const slide = {
    initial: { opacity: 0, x: side === 'right' ? 48 : -48 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: side === 'right' ? 48 : -48 },
  };

  return (
    <AnimatePresence>
      {open &&
        createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              inline ? 'absolute' : 'fixed',
              'inset-0 z-50 bg-black/50 backdrop-blur-[2px]',
              inline ? 'overflow-hidden' : 'overflow-y-auto'
            )}
            onMouseDown={(e) => {
              if (closeOnBackdrop && e.target === e.currentTarget) onClose();
            }}
          >
            <motion.div
              ref={panelRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={typeof title === 'string' ? title : undefined}
              {...slide}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'absolute top-0 bottom-0 flex flex-col bg-[var(--sigma-surface)] border-[var(--sigma-border-strong)]',
                'shadow-[var(--sigma-shadow-xl)] text-[var(--sigma-text)] outline-none',
                side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
                width ? undefined : 'w-96 max-w-full',
                className
              )}
              style={width ? { width } : undefined}
            >
              {(title || description) && (
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
                    aria-label="Close panel"
                    className="shrink-0 -m-1 p-1.5 rounded-lg text-[var(--sigma-text-muted)] hover:text-[var(--sigma-text)] hover:bg-[var(--sigma-surface-subtle)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sigma-primary)]"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {children && (
                <div className="px-5 py-4 overflow-y-auto grow min-h-0 flex-1">{children}</div>
              )}
              {footer && (
                <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--sigma-border)] bg-[var(--sigma-surface-subtle)]/50">
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>,
          inline ? (document.body as HTMLElement) : document.body
        )}
    </AnimatePresence>
  );
}

export default Sheet;
