const releaseEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

export function isVantaReleaseEnabled(value?: string): boolean {
  const candidate = arguments.length === 0 ? releaseEnv?.VITE_VANTA_ENABLED : value;
  return candidate === 'true';
}
