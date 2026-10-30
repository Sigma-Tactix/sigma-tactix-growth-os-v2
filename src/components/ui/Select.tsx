import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  /** Group header label; options with the same group render inside one <optgroup> */
  group?: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: (SelectOption | string | number)[];
  placeholder?: string;
  /** Compact 32px height matching Input sm usage */
  compact?: boolean;
  label?: React.ReactNode;
  helperText?: string;
}

const normalizeOptions = (options: (SelectOption | string | number)[], placeholder?: string) => {
  const out: SelectOption[] =
    placeholder !== undefined
      ? [{ label: placeholder, value: '', disabled: true }]
      : [];
  for (const opt of options) {
    out.push(typeof opt === 'object' ? opt : { label: String(opt), value: String(opt) });
  }
  return out;
};

/**
 * Theme-consistent select on the sigma material system. Native <select> under the
 * hood (reliable, keyboard-accessible, works with optgroup), styled to match Input.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, compact, label, helperText, className, id, style, ...props }: SelectProps, ref) => {
    const flat = normalizeOptions(options, placeholder);
    const groups = new Map<string, SelectOption[]>();
    const ungrouped: SelectOption[] = [];
    for (const opt of flat) {
      if (typeof opt.value === 'string' && opt.value === '') {
        ungrouped.push(opt);
        continue;
      }
      if (opt.group) {
        if (!groups.has(opt.group)) groups.set(opt.group, []);
        groups.get(opt.group)!.push(opt);
      } else {
        ungrouped.push(opt);
      }
    }

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-[11px] font-mono uppercase tracking-wider text-[var(--sigma-text-muted)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            style={style}
            className={cn(
              'w-full appearance-none rounded-xl border bg-[var(--sigma-input)] pr-9 font-mono text-xs text-[var(--sigma-text)]',
              'border-[var(--sigma-border)] shadow-[var(--sigma-shadow-sm)]',
              'transition-all duration-150 focus:outline-none focus:border-[var(--sigma-primary)] focus:ring-2 focus:ring-[var(--sigma-primary)]/20',
              compact ? 'h-8 pl-3 text-[11px]' : 'h-10 pl-3.5'
            )}
            {...props}
          >
            {ungrouped.map((opt, i) => (
              <option key={typeof opt.value === 'number' ? `n${i}` : String(opt.value)} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {[...groups.entries()].map(([group, opts]) => (
              <optgroup key={group} label={group}>
                {opts.map((opt, i) => (
                  <option key={`${group}-${typeof opt.value === 'number' ? `n${i}` : String(opt.value)}`} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sigma-text-muted)]"
          />
        </div>
        {helperText && <p className="mt-1.5 text-[11px] text-[var(--sigma-text-muted)]">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
