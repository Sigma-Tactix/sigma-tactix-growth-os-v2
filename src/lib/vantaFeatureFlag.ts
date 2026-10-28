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
