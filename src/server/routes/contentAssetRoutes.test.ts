import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createContentAssetRouter } from './contentAssetRoutes.js';

function makeDb(overrides: any = {}) {
  return {
    contentAssets: [],
    secondBrain: {
      brandVault: { voiceAndTone: 'confident', corePositioning: 'AI-native', keyMessages: ['m'] },
      customerVault: { idealCustomerProfile: 'B2B SaaS' },
      connectors: [],
    },
    ...overrides,
  } as any;
}

function makeDeps(db: any, overrides: any = {}) {
  return {
    getDB: vi.fn(async () => db),
    saveDB: vi.fn(async () => {}),
    callerIsOwnerOrAdmin: vi.fn(async () => true),
    publishAdapters: {} as any,
    getStoredCredentials: vi.fn(() => ({})),
    getGeminiClient: vi.fn(() => ({ models: { generateContent: async () => ({ text: 'IMPROVED', usageMetadata: {} }) } })),
    resolveEffectiveGeminiKey: vi.fn(async () => 'live-key'),
    resolveEffectiveGeminiModel: vi.fn(async () => 'gemini-2.5-flash'),
    classifyGeminiError: vi.fn((e: any) => 'gemini: ' + (e?.message || 'unknown')),
    recordTokenUsage: vi.fn(async () => null),
    requireModule: vi.fn(() => (_req: any, _res: any, next: any) => next()),
    ...overrides,
  };
}

function makeRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: { sb: {}, wsId: 'ws-1', userId: 'user-1' },
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
  };
  return res;
}

function makeReq(overrides: any = {}) {
  return { method: 'POST', url: '/', params: {}, query: {}, body: {}, ...overrides };
}

// Each route carries a single requireModule tier-gate layer before the
// handler; walk both and await async layers.
async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find((s: any) => s.route?.path === path && s.route?.methods?.[method.toLowerCase()]);
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  const stack = layer.route.stack;
  for (let i = 0; i < stack.length; i++) {
    let nextCalled = false;
    const maybeP = stack[i].handle(req, res, () => { nextCalled = true; });
    if (maybeP && typeof maybeP.then === 'function') await maybeP;
    if (!nextCalled) return;
  }
}

const savedKey = process.env.GEMINI_API_KEY;

describe('Content Asset Routes', () => {
  beforeEach(() => { vi.mocked; delete process.env.GEMINI_API_KEY; });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (savedKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = savedKey;
  });

  it('route shape: 3 scoped route layers, each [requireModule, handler]', () => {
    const router: any = createContentAssetRouter(makeDeps(makeDb()));
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(3);
    expect(layers.map((l: any) => l.route.path).sort()).toEqual([
      '/content-assets/:id/improve',
      '/content-assets/:id/publish',
      '/content-status',
    ]);
    for (const l of layers) expect(l.route.stack).toHaveLength(2);
  });

  it('POST /content-status: 400 for an unknown status and for the reserved "Published"', async () => {
    const db = makeDb({ contentAssets: [{ id: 'a1', status: 'Draft' }] });
    const router = createContentAssetRouter(makeDeps(db));

    let res = makeRes();
    await invoke(router, 'POST', '/content-status', makeReq({ body: { id: 'a1', status: 'Bogus' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('status must be one of');

    res = makeRes();
    await invoke(router, 'POST', '/content-status', makeReq({ body: { id: 'a1', status: 'Published' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('by publishing it');
  });

  it('POST /content-status: approving requires owner/admin; plain authoring stays open to members', async () => {
    const db = makeDb({ contentAssets: [{ id: 'a1', status: 'Pending Approval' }] });
    const router = createContentAssetRouter(makeDeps(db, {
      callerIsOwnerOrAdmin: vi.fn(async () => false),
    }));
    let res = makeRes();
    await invoke(router, 'POST', '/content-status', makeReq({ body: { id: 'a1', status: 'Approved' } }), res);
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.error).toContain('owner or admin to approve');

    // moving back to Draft is ordinary authoring — no owner check, no 403
    const db2 = makeDb({ contentAssets: [{ id: 'a1', status: 'Approved' }] });
    const router2 = createContentAssetRouter(makeDeps(db2, {
      callerIsOwnerOrAdmin: vi.fn(async () => false),
    }));
    res = makeRes();
    await invoke(router2, 'POST', '/content-status', makeReq({ body: { id: 'a1', status: 'Draft' } }), res);
    expect(res.statusCode).toBe(200);
    expect(db2.contentAssets[0].status).toBe('Draft');
  });

  it('POST /content-status: 404 for an unknown id; 200 persists a valid transition', async () => {
    const db = makeDb({ contentAssets: [{ id: 'a1', status: 'Pending Approval' }] });
    const deps = makeDeps(db);
    const router = createContentAssetRouter(deps);

    let res = makeRes();
    await invoke(router, 'POST', '/content-status', makeReq({ body: { id: 'ghost', status: 'Approved' } }), res);
    expect(res.statusCode).toBe(404);

    res = makeRes();
    await invoke(router, 'POST', '/content-status', makeReq({ body: { id: 'a1', status: 'Approved' } }), res);
    expect(res.statusCode).toBe(200);
    expect(db.contentAssets[0].status).toBe('Approved');
    expect(deps.saveDB).toHaveBeenCalled();
  });

  it('POST /content-assets/:id/publish: 403 for a non-owner, 404 missing, 409 not-approved, 400 no channels', async () => {
    const db = makeDb({
      contentAssets: [{ id: 'a1', title: 'T', content: 'C', status: 'Draft' }],
      secondBrain: { connectors: [{ platform: 'LinkedIn', status: 'Connected', credentials: {} }] },
    });
    const router = createContentAssetRouter(makeDeps(db, {
      callerIsOwnerOrAdmin: vi.fn(async () => false),
    }));

    let res = makeRes();
    await invoke(router, 'POST', '/content-assets/:id/publish', makeReq({ params: { id: 'a1' }, body: { channels: ['LinkedIn'] } }), res);
    expect(res.statusCode).toBe(403);

    // owner path: asset missing
    const db2 = makeDb({ secondBrain: { connectors: [] } });
    const router2 = createContentAssetRouter(makeDeps(db2));
    res = makeRes();
    await invoke(router2, 'POST', '/content-assets/:id/publish', makeReq({ params: { id: 'ghost' }, body: { channels: ['LinkedIn'] } }), res);
    expect(res.statusCode).toBe(404);

    // HITL gate: a Draft asset cannot publish (owner, asset exists)
    const db3 = makeDb({ contentAssets: [{ id: 'a1', status: 'Draft' }], secondBrain: { connectors: [] } });
    const router3 = createContentAssetRouter(makeDeps(db3));
    res = makeRes();
    await invoke(router3, 'POST', '/content-assets/:id/publish', makeReq({ params: { id: 'a1' }, body: { channels: ['LinkedIn'] } }), res);
    expect(res.statusCode).toBe(409);
    expect(res.jsonData.assetStatus).toBe('Draft');

    // 400: no channels
    const db4 = makeDb({ contentAssets: [{ id: 'a1', status: 'Approved' }], secondBrain: { connectors: [] } });
    const router4 = createContentAssetRouter(makeDeps(db4));
    res = makeRes();
    await invoke(router4, 'POST', '/content-assets/:id/publish', makeReq({ params: { id: 'a1' }, body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('Select at least one channel');
  });

  it('POST /content-assets/:id/publish: an approved asset posts to connected channels and records the per-channel outcome', async () => {
    const posted: any[] = [];
    const db = makeDb({
      contentAssets: [{ id: 'a1', title: 'T', content: 'C', status: 'Approved' }],
      secondBrain: { connectors: [{ platform: 'LinkedIn', status: 'Connected', credentials: { encrypted: 'enc' } }] },
    });
    const deps = makeDeps(db, {
      publishAdapters: {
        LinkedIn: vi.fn(async (_creds: any, content: any) => {
          posted.push(content);
          return { success: true, url: 'https://li/post' };
        }),
      },
      getStoredCredentials: vi.fn(() => ({ token: 'dec' })),
    });
    const router = createContentAssetRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/content-assets/:id/publish', makeReq({ params: { id: 'a1' }, body: { channels: ['LinkedIn'] } }), res);
    expect(res.statusCode).toBe(200);
    // the adapter got the DECRYPTED credentials, not the raw blob
    expect(db.secondBrain.connectors[0].credentials.encrypted).toBe('enc');
    expect(res.jsonData.results[0]).toMatchObject({ platform: 'LinkedIn', success: true, url: 'https://li/post' });
    expect(posted[0]).toEqual({ title: 'T', body: 'C' });
    // a successful post flips the asset to Published
    expect(db.contentAssets[0].status).toBe('Published');
    expect(deps.saveDB).toHaveBeenCalled();
  });

  it('POST /content-assets/:id/publish: an unconnected channel records the honest reason, not a silent no-op', async () => {
    const db = makeDb({
      contentAssets: [{ id: 'a1', title: 'T', content: 'C', status: 'Approved' }],
      secondBrain: { connectors: [{ platform: 'LinkedIn', status: 'Disconnected', credentials: {} }] },
    });
    const deps = makeDeps(db, {
      publishAdapters: { LinkedIn: vi.fn(async () => ({ success: true, url: 'x' })) },
    });
    const router = createContentAssetRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/content-assets/:id/publish', makeReq({ params: { id: 'a1' }, body: { channels: ['LinkedIn'] } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.results[0].success).toBe(false);
    expect(res.jsonData.results[0].error).toContain('Not connected');
    // the asset did NOT flip to Published (no channel actually posted)
    expect(db.contentAssets[0].status).toBe('Approved');
    expect((deps.publishAdapters as any).LinkedIn).not.toHaveBeenCalled();
  });

  it('POST /content-assets/:id/improve: 404 missing, 503 without GEMINI_API_KEY, 200 live, 500 provider failure', async () => {
    const db404 = makeDb({ contentAssets: [] });
    let router = createContentAssetRouter(makeDeps(db404));
    let res = makeRes();
    await invoke(router, 'POST', '/content-assets/:id/improve', makeReq({ params: { id: 'ghost' } }), res);
    expect(res.statusCode).toBe(404);

    // 503 with no key
    const db = makeDb({ contentAssets: [{ id: 'a1', channel: 'linkedin', title: 'T', content: 'OLD' }] });
    router = createContentAssetRouter(makeDeps(db));
    res = makeRes();
    await invoke(router, 'POST', '/content-assets/:id/improve', makeReq({ params: { id: 'a1' } }), res);
    expect(res.statusCode).toBe(503);
    expect(db.contentAssets[0].content).toBe('OLD'); // untouched

    // 200 live success
    process.env.GEMINI_API_KEY = 'live-key';
    const db2 = makeDb({ contentAssets: [{ id: 'a1', channel: 'linkedin', title: 'T', content: 'OLD' }] });
    const deps = makeDeps(db2);
    router = createContentAssetRouter(deps);
    res = makeRes();
    await invoke(router, 'POST', '/content-assets/:id/improve', makeReq({ params: { id: 'a1' } }), res);
    expect(res.statusCode).toBe(200);
    expect(db2.contentAssets[0].content).toBe('IMPROVED');
    expect(deps.recordTokenUsage).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ actionType: 'IMPROVE_ASSET' }));

    // 500 provider failure — content unchanged
    const db3 = makeDb({ contentAssets: [{ id: 'a1', channel: 'linkedin', title: 'T', content: 'OLD' }] });
    const deps3 = makeDeps(db3, {
      getGeminiClient: vi.fn(() => ({ models: { generateContent: async () => { throw new Error('quota') } } })),
    });
    router = createContentAssetRouter(deps3);
    res = makeRes();
    await invoke(router, 'POST', '/content-assets/:id/improve', makeReq({ params: { id: 'a1' } }), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.error).toBe('gemini: quota');
    expect(db3.contentAssets[0].content).toBe('OLD');
  });
});
