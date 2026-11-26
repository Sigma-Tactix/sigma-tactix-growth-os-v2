import { describe, it, expect } from 'vitest';
import os from 'node:os';
import { createLectureDeckRouter } from './lectureDeckRoutes.js';

function makeRes(overrides: any = {}) {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    sent: null,
    headers: {} as Record<string, any>,
    ...overrides,
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
    setHeader(k: string, v: any) { res.headers[k] = v; return res; },
    send(body: any) { res.sent = body; return res; },
  };
  return res;
}

function makeReq(overrides: any = {}) {
  return { method: 'POST', url: '/', params: {}, query: {}, body: {}, ...overrides };
}

// The deck routes are plain synchronous handlers (no middleware layers),
// invoked on their FULL paths (root-mounted router).
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

// A baseDir that is guaranteed NOT to contain dist/decks or a tools dir, so
// every 404-branch under test is deterministic (no cache hit, no on-disk
// fallback read).
const emptyBaseDir = os.tmpdir();

describe('Lecture Deck Routes', () => {
  it('route shape: 4 full-path registrations, each a single handler (public routes carry no tier gate)', () => {
    const router: any = createLectureDeckRouter({ baseDir: emptyBaseDir });
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(4);
    const paths = layers.map((l: any) => `${l.route.methods ? Object.keys(l.route.methods).join('|') : ''} ${l.route.path}`);
    for (const p of [
      'post /api/reports/deck/generate',
      'post /api/workspace/reports/deck/generate',
      'get /api/reports/deck/:id/view',
      'get /api/reports/deck/:id/download',
    ]) {
      expect(paths).toContain(p);
    }
    for (const l of layers) expect(l.route.stack).toHaveLength(1); // handler only — no middleware
  });

  it('POST /api/reports/deck/generate (public): 400 without reportData — the engine never spawns', async () => {
    const router = createLectureDeckRouter({ baseDir: emptyBaseDir });
    const res = makeRes();
    await invoke(router, 'POST', '/api/reports/deck/generate', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toEqual({ error: 'reportData is required' });
  });

  it('POST /api/workspace/reports/deck/generate (authed twin): the same 400 guard, same handler', async () => {
    const router = createLectureDeckRouter({ baseDir: emptyBaseDir });
    const res = makeRes();
    await invoke(router, 'POST', '/api/workspace/reports/deck/generate', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toEqual({ error: 'reportData is required' });
  });

  it('GET /api/reports/deck/:id/view: 404 when the cache is empty and no on-disk deck exists', async () => {
    const router = createLectureDeckRouter({ baseDir: emptyBaseDir });
    const res = makeRes();
    await invoke(router, 'GET', '/api/reports/deck/:id/view', makeReq({ method: 'GET', params: { id: 'no-such-deck-0000' } }), res);
    expect(res.statusCode).toBe(404);
    expect(res.sent).toBe('Lecture deck presentation not found or expired.');
  });

  it('GET /api/reports/deck/:id/download: 404 JSON when neither cache nor disk has the artifact', async () => {
    const router = createLectureDeckRouter({ baseDir: emptyBaseDir });
    const res = makeRes();
    await invoke(router, 'GET', '/api/reports/deck/:id/download', makeReq({ method: 'GET', params: { id: 'no-such-deck-0000' } }), res);
    expect(res.statusCode).toBe(404);
    expect(res.jsonData).toEqual({ error: 'Lecture deck artifact not found' });
  });
});
