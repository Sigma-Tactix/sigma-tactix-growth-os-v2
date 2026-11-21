import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

describe('exported Express runtime over HTTP', () => {
  let server: Server;
  let origin: string;
  beforeAll(async () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_ANON_KEY', '');
    const { default: app } = await import('../../server.js');
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  }, 30000);
  afterAll(async () => {
    if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    vi.unstubAllEnvs();
  });
  it('returns JSON liveness from the actual API', async () => {
    const response = await fetch(`${origin}/api/health`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toMatchObject({ ok: true, status: 'alive' });
  });
  it('returns JSON readiness failure when required dependencies are unavailable', async () => {
    const response = await fetch(`${origin}/api/ready`);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ready: false, database: 'unconfigured' });
  });
  it('requires authentication on Client Enclave routes', async () => {
    const response = await fetch(`${origin}/api/workspace`);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: 'Missing Authorization header' });
  });
  it.each(['/api', '/api/__connection_check_missing__'])('returns JSON 404 for API path %s', async path => {
    const response = await fetch(`${origin}${path}`);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: 'API endpoint not found' });
  });
});
