import { describe, expect, it } from 'vitest';
import { assertPreviewSupabaseIsolation, resolveSupabasePublicConfig } from './supabaseConfiguration';

const production = { url: 'https://production.supabase.co', anonKey: 'public-production' };
const preview = { VERCEL_ENV: 'preview', VITE_SUPABASE_URL: 'https://staging.supabase.co', VITE_SUPABASE_ANON_KEY: 'public-staging', SUPABASE_URL: 'https://staging.supabase.co', SUPABASE_ANON_KEY: 'public-staging' };

describe('Supabase deployment configuration', () => {
  it('retains existing production configuration when no override is supplied', () => {
    expect(resolveSupabasePublicConfig({}, production)).toEqual(production);
    expect(() => assertPreviewSupabaseIsolation({}, production)).not.toThrow();
  });
  it('uses the explicit public override', () => expect(resolveSupabasePublicConfig(preview, production)).toEqual({ url: preview.VITE_SUPABASE_URL, anonKey: preview.VITE_SUPABASE_ANON_KEY }));
  it('rejects a partial override', () => expect(() => resolveSupabasePublicConfig({ VITE_SUPABASE_URL: preview.VITE_SUPABASE_URL }, production)).toThrow('both'));
  it('rejects public exposure of privileged key formats', () => {
    for (const key of ['sb_secret_test', `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ role: 'service_role' }))}.signature`]) {
      expect(() => resolveSupabasePublicConfig({ VITE_SUPABASE_URL: preview.VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY: key }, production)).toThrow();
    }
  });
  it('accepts a matched staging preview without privileged credentials', () => expect(() => assertPreviewSupabaseIsolation(preview, production)).not.toThrow());
  it('blocks an implicit production fallback on preview', () => expect(() => assertPreviewSupabaseIsolation({ VERCEL_ENV: 'preview' }, production)).toThrow('dedicated'));
  it('blocks shared production and preview projects', () => expect(() => assertPreviewSupabaseIsolation({ ...preview, VITE_SUPABASE_URL: production.url }, production)).toThrow('separate'));
  it('blocks mismatched server bindings', () => expect(() => assertPreviewSupabaseIsolation({ ...preview, SUPABASE_URL: production.url }, production)).toThrow('match'));
  it('blocks unnecessary service-role injection into preview', () => expect(() => assertPreviewSupabaseIsolation({ ...preview, SUPABASE_SERVICE_ROLE_KEY: 'server-secret' }, production)).toThrow('service-role'));
});
