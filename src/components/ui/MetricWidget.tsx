import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import GlassCard from './GlassCard';

export interface MetricWidgetProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  delta?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  hint?: string;
  subtext?: string;
  className?: string;
  onClick?: () => void;
}

export function MetricWidget({
  label,
  value,
  prefix,
  suffix,
  delta,
  icon,
  hint,
  subtext,
  className,
  onClick,
}: MetricWidgetProps) {
  return (
    <GlassCard
      spotlight
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={cn('p-5 flex flex-col justify-between', className)}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-medium text-[var(--sigma-text-muted)] tracking-tight truncate" title={label}>
          {label}
        </span>
        {icon && (
          <div className="p-1.5 rounded-lg bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-soft)] shrink-0 border border-[var(--sigma-border)]">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 my-1">
        {prefix && <span className="text-base font-semibold text-[var(--sigma-text-soft)]">{prefix}</span>}
        <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight tabular-nums text-[var(--sigma-text)]">
          {value}
        </span>
        {suffix && <span className="text-sm font-medium text-[var(--sigma-text-muted)] ml-0.5">{suffix}</span>}
      </div>

      {(delta || subtext || hint) && (
        <div className="mt-3 pt-2.5 border-t border-[var(--sigma-border)] flex items-center justify-between text-[11px]">
          {delta && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-semibold font-mono rounded px-1.5 py-0.5',
                  delta.trend === 'up'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : delta.trend === 'down'
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-[var(--sigma-text-muted)] bg-[var(--sigma-surface-subtle)]'
                )}
              >
                {delta.trend === 'up' && <ArrowUpRight size={12} />}
                {delta.trend === 'down' && <ArrowDownRight size={12} />}
                {delta.trend === 'neutral' && <Minus size={12} />}
                {delta.value}
              </span>
              {delta.label && (
                <span className="text-[var(--sigma-text-muted)] font-normal ml-1 truncate">
                  {delta.label}
                </span>
              )}
            </div>
          )}

          {subtext && !delta && (
            <span className="text-[var(--sigma-text-muted)] truncate">{subtext}</span>
          )}

          {hint && (
            <span className="text-[10px] font-mono text-[var(--sigma-text-muted)] uppercase tracking-wider ml-auto">
              {hint}
            </span>
          )}
        </div>
      )}
    </GlassCard>
  );
}

export default MetricWidget;
