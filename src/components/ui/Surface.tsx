import type { HTMLAttributes } from 'react';
import { cn } from '@/src/lib/utils';

type SurfaceProps = HTMLAttributes<HTMLDivElement> & { elevation?: 'base' | 'raised' | 'feature' | 'inverse' };
const elevationClass = { base: 'sigma-surface', raised: 'sigma-surface-raised', feature: 'sigma-card-feature', inverse: 'sigma-inverse' };

export function Surface({ className, elevation = 'base', ...props }: SurfaceProps) {
  return <div className={cn(elevationClass[elevation], className)} {...props} />;
}
