import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  // Fill + AA-safe text via the theme-aware --sigma-on-primary token: light
  // theme #d83812 with white (4.67:1); dark theme #ff5a32 with #09090b
  // (6.40:1). Verified in the contrast sweep — white on #ff5a32 would only be
  // 3.11:1 (AA fail at 12px), so a static white is not used.
  primary: `
    bg-gradient-to-b from-[var(--sigma-primary)] to-[var(--sigma-primary-hover)]
    text-[var(--sigma-on-primary)] font-semibold
    border border-[var(--sigma-primary-hover)]/80
    shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.25)]
    hover:brightness-105 hover:shadow-[0_4px_16px_rgba(255,72,27,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]
    focus-visible:ring-2 focus-visible:ring-[var(--sigma-primary)] focus-visible:ring-offset-2
  `,
  secondary: `
    bg-[var(--sigma-surface)] 
    text-[var(--sigma-text)] 
    border border-[var(--sigma-border)] 
    shadow-[var(--sigma-shadow-sm)]
    hover:bg-[var(--sigma-surface-subtle)] hover:border-[var(--sigma-border-strong)]
    focus-visible:ring-2 focus-visible:ring-[var(--sigma-text-muted)] focus-visible:ring-offset-2
  `,
  outline: `
    bg-transparent 
    text-[var(--sigma-text)] 
    border border-[var(--sigma-border)] 
    hover:bg-[var(--sigma-surface-subtle)] hover:border-[var(--sigma-border-strong)]
    focus-visible:ring-2 focus-visible:ring-[var(--sigma-text-muted)] focus-visible:ring-offset-2
  `,
  ghost: `
    bg-transparent 
    text-[var(--sigma-text-soft)] 
    border border-transparent 
    hover:bg-[var(--sigma-surface-subtle)] hover:text-[var(--sigma-text)]
    focus-visible:ring-2 focus-visible:ring-[var(--sigma-text-muted)] focus-visible:ring-offset-2
  `,
  destructive: `
    bg-rose-500/10 
    text-rose-accent 
    border border-rose-500/30 
    hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-accent
    focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2
  `,
};

// btn-xs / btn-sm: compact visual height, extended to a 44px hit area on touch
// devices via a pseudo-element (see index.css @media (pointer: coarse)).
const sizeStyles: Record<ButtonSize, string> = {
  xs: 'btn-xs h-7 px-2.5 text-[11px] rounded-lg gap-1.5',
  sm: 'btn-sm h-8.5 px-3 text-xs rounded-lg gap-2',
  md: 'h-10 px-4 text-xs font-medium rounded-xl gap-2',
  lg: 'h-11.5 px-5 text-sm font-semibold rounded-xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon,
  icon,
  rightIcon,
  disabled,
  children,
  ...props
}, ref) => {
  const leadingIcon = leftIcon || icon;
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-sans select-none outline-none transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:transform-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...(props as any)}
    >
      {isLoading ? (
        <Loader2 className="animate-spin shrink-0" size={size === 'xs' ? 12 : 14} />
      ) : leadingIcon ? (
        <span className="shrink-0">{leadingIcon}</span>
      ) : null}
      
      {children && <span>{children}</span>}
      
      {!isLoading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';
export default Button;

