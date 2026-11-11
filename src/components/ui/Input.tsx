import React, { forwardRef } from 'react';
import { cn } from '@/src/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className,
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  id,
  disabled,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 font-sans">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[var(--sigma-text-soft)] tracking-tight"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-[var(--sigma-text-muted)] pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={cn(
            'w-full h-10 px-3.5 bg-[var(--sigma-input)] text-[var(--sigma-text)] text-sm rounded-xl border transition-all duration-150',
            'border-[var(--sigma-border)] shadow-[var(--sigma-shadow-sm)]',
            'placeholder:text-[var(--sigma-text-muted)]',
            'focus:outline-none focus:border-[var(--sigma-primary)] focus:ring-2 focus:ring-[var(--sigma-primary)]/20',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error && 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20',
            disabled && 'opacity-50 cursor-not-allowed bg-[var(--sigma-surface-subtle)]',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 text-[var(--sigma-text-muted)] flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-accent font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[var(--sigma-text-muted)]">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
