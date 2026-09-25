import React from 'react';
import { useAppearance } from '@/src/contexts/AppearanceContext';

interface SigmaTactixLogoProps {
  variant?: 'full' | 'mark' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  themeOverride?: 'light' | 'dark';
  subtitle?: string | boolean;
  className?: string;
  onClick?: () => void;
}

const BRAND_ASSETS = {
  light: {
    mark: '/brand/sigma-tactix-mark-light.png',
    horizontal: '/brand/sigma-tactix-horizontal-light.png',
  },
  dark: {
    mark: '/brand/sigma-tactix-mark-dark.png',
    horizontal: '/brand/sigma-tactix-horizontal-dark.png',
  },
} as const;

export function SigmaTactixMark({
  size = 32,
  themeOverride,
  className = '',
}: {
  size?: number | string;
  themeOverride?: 'light' | 'dark';
  className?: string;
}) {
  const { resolvedAppearance } = useAppearance();
  const theme = themeOverride || resolvedAppearance;
  const dimension = typeof size === 'number' ? size : Number.parseFloat(size) || 32;

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden ${className}`}
      style={{ width: dimension, height: dimension }}
      aria-label="Sigma Tactix Mark"
      role="img"
    >
      <img
        src={BRAND_ASSETS[theme].mark}
        alt=""
        draggable={false}
        className="pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
        style={{ width: '250%', height: '250%' }}
      />
    </span>
  );
}

export default function SigmaTactixLogo({
  variant = 'full',
  size = 'md',
  themeOverride,
  subtitle = 'Growth OS',
  className = '',
  onClick,
}: SigmaTactixLogoProps) {
  const { resolvedAppearance } = useAppearance();
  const theme = themeOverride || resolvedAppearance;
  const sizeMap = {
    xs: { mark: 22, width: 108, height: 28, sub: 'text-[7px]' },
    sm: { mark: 28, width: 132, height: 34, sub: 'text-[8px]' },
    md: { mark: 34, width: 164, height: 40, sub: 'text-[8px]' },
    lg: { mark: 42, width: 198, height: 48, sub: 'text-[9px]' },
    xl: { mark: 54, width: 242, height: 58, sub: 'text-[10px]' },
  };
  const currentSize = typeof size === 'number' ? sizeMap.md : (sizeMap[size] || sizeMap.md);
  const markSize = typeof size === 'number' ? size : currentSize.mark;

  if (variant === 'mark') {
    return (
      <button type="button" className={`inline-flex items-center justify-center ${className}`} onClick={onClick} aria-label="Open Sigma Tactix dashboard">
        <SigmaTactixMark size={markSize} themeOverride={themeOverride} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`group inline-flex flex-col items-start border-0 bg-transparent p-0 ${className}`}
      onClick={onClick}
      aria-label="Open Sigma Tactix dashboard"
    >
      <span className="relative block overflow-hidden" style={{ width: currentSize.width, height: currentSize.height }}>
        <img
          src={BRAND_ASSETS[theme].horizontal}
          alt="Sigma Tactix"
          draggable={false}
          className="pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
          style={{ width: '125%', height: 'auto' }}
        />
      </span>
      {subtitle && (
        <span className={`ml-[22%] -mt-0.5 font-mono font-bold uppercase tracking-[0.24em] text-[var(--sigma-text-muted)] ${currentSize.sub}`}>
          {typeof subtitle === 'string' ? subtitle : 'Growth OS'}
        </span>
      )}
    </button>
  );
}
