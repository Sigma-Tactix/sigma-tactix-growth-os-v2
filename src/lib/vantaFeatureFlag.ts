const releaseEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

export type VantaNavigationTarget = Readonly<{
  href: '/living-system' | '/living-system?vantaLab=1';
  badge: 'Live' | 'Preview';
}>;

export function isVantaReleaseEnabled(value?: string): boolean {
  const candidate = arguments.length === 0 ? releaseEnv?.VITE_VANTA_ENABLED : value;
  return candidate === 'true';
}

export function resolveVantaNavigationTarget({
  releaseEnabled,
  development,
}: {
  releaseEnabled: boolean;
  development: boolean;
}): VantaNavigationTarget | null {
  if (releaseEnabled) return { href: '/living-system', badge: 'Live' };
  if (development) return { href: '/living-system?vantaLab=1', badge: 'Preview' };
  return null;
}

/**
 * The Living System entry point is always discoverable: when the release gate
 * is off and not in a dev preview, the item still appears in the sidebar with
 * a "Gated" badge so users can see the feature and learn how to enable it,
 * instead of concluding it is missing or broken.
 */
export const VANTA_GATED_BADGE = 'Gated';
