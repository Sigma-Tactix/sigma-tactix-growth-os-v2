/**
 * Shared motion vocabulary.
 *
 * Before this existed, four components each hand-rolled `initial`/`animate` with
 * different distances, no easing and no shared timing — so nothing felt like it came
 * from the same product. These are the only durations, easings and variants the app
 * should use.
 *
 * Reduced motion is handled globally, not here: `<MotionConfig reducedMotion="user">`
 * in `main.tsx` neutralises transform/layout animation for everyone who asked for it,
 * and `index.css` carries the matching `@media (prefers-reduced-motion: reduce)` block
 * for CSS-driven `transition-*` / `animate-*` utilities. Opacity still fades, which is
 * the behaviour the spec intends — reduced, not removed.
 */
import type { Transition, Variants } from 'motion/react';

/** Durations in seconds. Anything outside this scale is a mistake, not a choice. */
export const DURATION = {
  /** Colour and opacity on hover — fast enough to feel like a direct response. */
  instant: 0.12,
  /** Default for entering elements and small state changes. */
  base: 0.22,
  /** Panels, drawers, anything that moves a meaningful distance. */
  slow: 0.36,
} as const;

/**
 * Standard ease-out. Motion decelerates into place — it never eases in, because an
 * element that starts slowly reads as lag rather than as design.
 */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Springs. Used where an element should feel like it has mass: presses, drags, pops. */
export const SPRING = {
  /** Buttons and small controls. Crisp, no visible overshoot. */
  tight: { type: 'spring', stiffness: 420, damping: 32, mass: 0.7 },
  /** Cards and panels. A little weight, still settles quickly. */
  soft: { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 },
} satisfies Record<string, Transition>;

export const TRANSITION = {
  base: { duration: DURATION.base, ease: EASE },
  slow: { duration: DURATION.slow, ease: EASE },
} satisfies Record<string, Transition>;

/** Fade up. The default entrance for cards, rows and sections. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: TRANSITION.base },
  exit: { opacity: 0, y: 6, transition: { duration: DURATION.instant, ease: EASE } },
};

/** Plain fade, for anything where movement would fight the layout. */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: TRANSITION.base },
  exit: { opacity: 0, transition: { duration: DURATION.instant, ease: EASE } },
};

/** Scale in. Dialogs, popovers, toasts — things that originate rather than arrive. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: SPRING.soft },
  exit: { opacity: 0, scale: 0.97, transition: { duration: DURATION.instant, ease: EASE } },
};

/**
 * Stagger container. Children cascade instead of mounting as one block.
 *
 * `staggerChildren` is small on purpose: at 15 tabs with long lists, anything above
 * ~0.05s makes the last row arrive late enough to read as jank.
 */
export const stagger = (staggerChildren = 0.04, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

/** Props for a one-shot entrance. Spread onto a `motion.*` element. */
export const entrance = (variants: Variants = fadeUp) => ({
  variants,
  initial: 'hidden' as const,
  animate: 'visible' as const,
});

/** Props for an entrance driven by scroll position, played once. */
export const entranceOnScroll = (variants: Variants = fadeUp) => ({
  variants,
  initial: 'hidden' as const,
  whileInView: 'visible' as const,
  viewport: { once: true, margin: '-64px' },
});

/**
 * Press feedback. `whileTap` gives the physical click the audit found missing —
 * `active:` appeared 13 times against 266 `hover:` uses.
 */
export const pressable = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.98, y: 0 },
  transition: SPRING.tight,
} as const;
