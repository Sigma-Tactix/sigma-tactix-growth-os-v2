import { useEffect, useState, RefObject } from 'react';
import { ScrollProgressOptions } from './orb.types';

/**
 * Calculates [0, 1] scroll progress for a targeted element.
 * Respects 'reduced-motion' preferences.
 */
export function useScrollProgress(
  targetRef: RefObject<HTMLElement | null>,
  options: ScrollProgressOptions = {}
): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(0.5);
      options.onUpdate?.(0.5);
      return;
    }

    let ticking = false;

    function calculateProgress() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;

      // Distance from top of element entering viewport bottom to leaving viewport top
      const totalDist = windowH + rect.height;
      const currentDist = windowH - rect.top;

      let p = currentDist / totalDist;
      p = Math.max(0, Math.min(1, p));

      setProgress(p);
      options.onUpdate?.(p);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(calculateProgress);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    calculateProgress();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [targetRef, options.start, options.end]);

  return progress;
}
