export interface SupabasePublicConfig { url: string; anonKey: string }
type Environment = Record<string, string | undefined>;

export function resolveSupabasePublicConfig(env: Environment, fallback: SupabasePublicConfig): SupabasePublicConfig {
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (Boolean(url) !== Boolean(anonKey)) throw new Error('Set both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  if (!url || !anonKey) return fallback;
  const parsed = new URL(url);
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Invalid public Supabase URL.');
  if (anonKey.startsWith('sb_secret_')) throw new Error('A server secret cannot be used as the public Supabase key.');
  if (anonKey.split('.').length === 3) {
    try {
      const payload = JSON.parse(atob(anonKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role === 'service_role') throw new Error('A service-role key cannot be used in the browser.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('service-role')) throw error;
      throw new Error('Invalid public Supabase JWT.');
    }
  }
  return { url: parsed.origin, anonKey };
}

/** Build-time preview isolation; this does not replace deployment protection. */
export function assertPreviewSupabaseIsolation(env: Environment, production: SupabasePublicConfig): void {
  if (env.VERCEL_ENV !== 'preview') return;
  if (!env.VITE_SUPABASE_URL?.trim() || !env.VITE_SUPABASE_ANON_KEY?.trim()) throw new Error('Preview requires dedicated browser Supabase configuration.');
  const browser = resolveSupabasePublicConfig(env, production);
  if (new URL(browser.url).protocol !== 'https:' || new URL(browser.url).origin === new URL(production.url).origin) throw new Error('Preview must use a separate HTTPS Supabase project.');
  if (!env.SUPABASE_URL || new URL(env.SUPABASE_URL).origin !== new URL(browser.url).origin || env.SUPABASE_ANON_KEY?.trim() !== browser.anonKey) throw new Error('Preview browser and API Supabase configuration must match.');
  if (env.SUPABASE_SERVICE_ROLE_KEY?.trim()) throw new Error('Remove the unnecessary service-role key from preview.');
}
