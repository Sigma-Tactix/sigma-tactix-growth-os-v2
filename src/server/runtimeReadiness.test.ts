import { describe, expect, it, vi } from 'vitest';
import { assessRuntimeReadiness } from './runtimeReadiness.js';

describe('runtime readiness', () => {
  it('does not claim readiness from environment variables alone', async () => {
    const result = await assessRuntimeReadiness({ env: {} });
    expect(result.ready).toBe(false);
    expect(result.database).toBe('unconfigured');
    expect(result.worker.healthy).toBe(false);
  });

  it('recognizes database permission denial as connectivity, without bypassing RLS', async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: '42501' }), { status: 401 }));
    const result = await assessRuntimeReadiness({
      env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public-test-key', VERCEL_ENV: 'preview' },
      fetch: request,
    });
    expect(result.database).toBe('reachable');
    expect(result.ready).toBe(false);
    expect(result.environment).toBe('preview');
    const [url, options] = request.mock.calls[0];
    expect(String(url)).toContain('limit=0');
    expect(options.headers.Authorization).toBe('Bearer public-test-key');
  });

  it.each([
    [401, { message: 'Invalid API key' }],
    [404, { code: '42P01' }],
    [200, []],
    [500, { code: '42501' }],
  ])('does not accept status %s as a successful restricted database probe', async (status, body) => {
    const result = await assessRuntimeReadiness({
      env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public-test-key' },
      fetch: vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })),
    });
    expect(result.database).toBe('unavailable');
  });

  it('handles network failures without exposing upstream details', async () => {
    const result = await assessRuntimeReadiness({
      env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'public-test-key' },
      fetch: vi.fn().mockRejectedValue(new Error('secret-bearing upstream detail')),
    });
    expect(result.database).toBe('unavailable');
    expect(JSON.stringify(result)).not.toContain('secret-bearing');
  });
});
