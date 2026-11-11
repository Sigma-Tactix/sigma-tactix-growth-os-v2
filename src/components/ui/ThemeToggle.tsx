import { useState } from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAppearance, type Appearance } from '@/src/contexts/AppearanceContext';
import { cn } from '@/src/lib/utils';

const options: Array<{ value: Appearance; label: string; Icon: typeof Sun }> = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

export default function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const { appearance, resolvedAppearance, setAppearance } = useAppearance();
  const reduceMotion = useReducedMotion();
  const ActiveIcon = resolvedAppearance === 'dark' ? Moon : Sun;

  return (
    <div className="relative">
      <button type="button" aria-label="Change appearance" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="sigma-control inline-flex min-w-10 items-center justify-center px-2.5" title="Appearance">
        <ActiveIcon size={16} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }} className="sigma-menu absolute right-0 top-full z-50 mt-2 w-40 p-1.5">
            {options.map(({ value, label, Icon }) => (
              <button key={value} type="button" onClick={() => { setAppearance(value); setOpen(false); }} className={cn('sigma-menu-item flex w-full min-h-9 items-center gap-2 px-2.5 text-left text-xs font-semibold', appearance === value && 'bg-accent/10 text-accent')}>
                <Icon size={15} aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {appearance === value && <Check size={14} aria-hidden="true" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
