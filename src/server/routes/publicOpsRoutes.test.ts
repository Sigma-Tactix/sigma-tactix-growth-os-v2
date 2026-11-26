import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPublicOpsRouter } from './publicOpsRoutes.js';

vi.mock('../runtimeReadiness.js', () => ({
  assessRuntimeReadiness: vi.fn(),
}));
vi.mock('../../lib/supabaseAdmin.js', () => ({
  getPublicClient: vi.fn(),
}));
import { assessRuntimeReadiness } from '../runtimeReadiness.js';
import { getPublicClient } from '../../lib/supabaseAdmin.js';

function makeRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: {},
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
  };
  return res;
}

function makeReq(overrides: any = {}) {
  return { method: 'GET', url: '/', params: {}, query: {}, body: {}, ...overrides };
}

// The probes are single-layer handlers; the two intake routes carry the
// co-moved publicLimiter (in-memory store, 20 req/60s — far above test
// volume, so it passes straight through to next()).
async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find((s: any) => s.route?.path === path && s.route?.methods?.[method.toLowerCase()]);
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  for (const h of layer.route.stack) {
    let nextCalled = false;
    const maybeP = h.handle(req, res, () => { nextCalled = true; });
    if (maybeP && typeof maybeP.then === 'function') await maybeP;
    if (!nextCalled) return;
  }
}

describe('Public Ops Routes', () => {
  beforeEach(() => {
    vi.mocked(assessRuntimeReadiness).mockClear();
    vi.mocked(getPublicClient).mockClear();
    process.env.GIT_COMMIT_SHA = 'deadbeefcafe1234';
  });
  afterEach(() => { delete process.env.GIT_COMMIT_SHA; });

  it('route shape: 6 registrations — 4 single-layer probes, 2 intake routes behind publicLimiter', () => {
    const router: any = createPublicOpsRouter();
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(6);
    const paths = layers.map((l: any) => l.route.path);
    for (const p of ['/healthz', '/api/health', '/readyz', '/api/ready', '/api/public/intake/:token', '/api/public/intake/:token/complete']) {
      expect(paths).toContain(p);
    }
    const probe = layers.find((l: any) => l.route.path === '/healthz');
    expect(probe.route.stack).toHaveLength(1);
    const intake = layers.find((l: any) => l.route.path === '/api/public/intake/:token');
    expect(intake.route.stack).toHaveLength(2); // [publicLimiter, handler]
  });

  it('GET /healthz + /api/health: dependency-free liveness with the runtime commit sha', async () => {
    const router = createPublicOpsRouter();
    for (const p of ['/healthz', '/api/health']) {
      const res = makeRes();
      await invoke(router, 'GET', p, makeReq({ url: p }), res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.ok).toBe(true);
      expect(res.jsonData.status).toBe('alive');
      expect(res.jsonData.commit).toBe('deadbeefcafe1234'); // GIT_COMMIT_SHA override wins
      expect(res.jsonData.uptimeSeconds).toBeGreaterThanOrEqual(0);
    }
  });

  it('GET /readyz + /api/ready: 200 when ready, 503 when not; body mixes readiness + commit + uptime', async () => {
    const router = createPublicOpsRouter();
    vi.mocked(assessRuntimeReadiness).mockResolvedValueOnce({ ready: true, checks: [] } as any);
    let res = makeRes();
    await invoke(router, 'GET', '/readyz', makeReq({ url: '/readyz' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({ ready: true, checks: [], commit: 'deadbeefcafe1234' });

    vi.mocked(assessRuntimeReadiness).mockResolvedValueOnce({ ready: false, checks: [{ name: 'supabase', ok: false }] } as any);
    res = makeRes();
    await invoke(router, 'GET', '/api/ready', makeReq({ url: '/api/ready' }), res);
    expect(res.statusCode).toBe(503);
    expect(res.jsonData).toMatchObject({ ready: false, commit: 'deadbeefcafe1234' });
    expect(res.jsonData.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('GET /api/public/intake/:token: RPC error → 500; array result unwraps to [0]; no info → 404', async () => {
    const router = createPublicOpsRouter();
    const rpc = vi.fn();
    vi.mocked(getPublicClient).mockReturnValue({ rpc } as any);

    rpc.mockResolvedValueOnce({ data: null, error: { message: 'RLS denied' } });
    let res = makeRes();
    await invoke(router, 'GET', '/api/public/intake/:token', makeReq({ url: '/api/public/intake/tok1', params: { token: 'tok1' } }), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData).toEqual({ error: 'RLS denied' });

    rpc.mockResolvedValueOnce({ data: [{ token: 'tok1', client_email: 'a@b.com' }], error: null });
    res = makeRes();
    await invoke(router, 'GET', '/api/public/intake/:token', makeReq({ url: '/api/public/intake/tok1', params: { token: 'tok1' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({ success: true, info: { token: 'tok1', client_email: 'a@b.com' } });
    // the RPC was called with the opaque token, on the anon (public) client
    expect(vi.mocked(getPublicClient).mock.calls.at(-1)).toBeDefined();
    expect(rpc.mock.calls[1]).toEqual(['get_intake_token_info', { p_token: 'tok1' }]);

    rpc.mockResolvedValueOnce({ data: null, error: null });
    res = makeRes();
    await invoke(router, 'GET', '/api/public/intake/:token', makeReq({ url: '/api/public/intake/expired', params: { token: 'expired' } }), res);
    expect(res.statusCode).toBe(404);
    expect(res.jsonData).toEqual({ error: 'This link is invalid or has expired.' });
  });

  it('POST /api/public/intake/:token/complete: RPC error → 500; already-used → 410; success → 200 with the payload forwarded', async () => {
    const router = createPublicOpsRouter();
    const rpc = vi.fn();
    vi.mocked(getPublicClient).mockReturnValue({ rpc } as any);

    rpc.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    let res = makeRes();
    await invoke(router, 'POST', '/api/public/intake/:token/complete',
      makeReq({ method: 'POST', url: '/api/public/intake/tok2/complete', params: { token: 'tok2' }, body: { payload: { fields: 'x' } } }), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData).toEqual({ error: 'boom' });

    rpc.mockResolvedValueOnce({ data: null, error: null });
    res = makeRes();
    await invoke(router, 'POST', '/api/public/intake/:token/complete',
      makeReq({ method: 'POST', url: '/api/public/intake/used/complete', params: { token: 'used' }, body: {} }), res);
    expect(res.statusCode).toBe(410);
    expect(res.jsonData).toEqual({ error: 'This link has already been used or has expired.' });

    rpc.mockResolvedValueOnce({ data: { ok: true }, error: null });
    res = makeRes();
    await invoke(router, 'POST', '/api/public/intake/:token/complete',
      makeReq({ method: 'POST', url: '/api/public/intake/tok3/complete', params: { token: 'tok3' }, body: { payload: { fields: 'y' } } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({ success: true });
    // payload forwarded (defaulting to {} when the body has none)
    expect(rpc.mock.calls[2]).toEqual(['complete_intake_token', { p_token: 'tok3', p_payload: { fields: 'y' } }]);
  });
});
