import React, { useId, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: 'pill' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  size = 'md',
  className,
}: TabsProps<T>) {
  const instanceId = useId().replace(/:/g, '');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    onChange(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Section navigation"
      className={cn(
        'relative flex max-w-full items-center font-sans select-none overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        variant === 'pill' && 'sigma-tabs-pill gap-1 p-1.5',
        variant === 'underline' && 'sigma-tabs-underline gap-1',
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            ref={(node) => { tabRefs.current[index] = node; }}
            key={tab.id}
            id={`${instanceId}-tab-${index}`}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'sigma-tab relative z-10 flex shrink-0 items-center justify-center whitespace-nowrap outline-none',
              size === 'sm' ? 'min-h-9 px-3 text-xs gap-1.5' : 'min-h-10 px-4 text-sm font-semibold gap-2',
              variant === 'underline' && 'rounded-none px-3',
              isActive
                ? 'sigma-tab-active'
                : 'sigma-tab-inactive'
            )}
          >
            {/* Animated Pill Background */}
            {variant === 'pill' && isActive && (
              <motion.div
                layoutId={`${instanceId}-active-pill`}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38, mass: 0.7 }}
                className="sigma-tab-active-pill absolute inset-0 rounded-[9px]"
              />
            )}

            {/* Underline Indicator */}
            {variant === 'underline' && isActive && (
              <motion.div
                layoutId={`${instanceId}-active-line`}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 38, mass: 0.7 }}
                className="sigma-tab-active-line absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
              />
            )}

            <span className="relative z-20 flex items-center gap-2">
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums font-bold transition-colors',
                    isActive
                      ? 'bg-black/15 text-[var(--sigma-tab-active-text)]'
                      : 'bg-[var(--sigma-surface-subtle)] text-[var(--sigma-text-soft)] border border-[var(--sigma-border)]'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
