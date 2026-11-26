import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCompetitorsRouter } from './competitorsRoutes.js';

vi.mock('../../lib/siteFetch.js', () => ({
  fetchSiteContent: vi.fn(),
  summarizeSnapshotForPrompt: vi.fn((s: any) => `title=${s?.title ?? ''} words=${s?.wordCount ?? 0}`),
  createSyntheticSnapshot: vi.fn(),
}));
vi.mock('../../lib/rag.js', () => ({
  saveDocument: vi.fn(),
  searchDocuments: vi.fn(),
  indexPerformanceHook: vi.fn(),
}));

import { fetchSiteContent, summarizeSnapshotForPrompt } from '../../lib/siteFetch.js';
import { saveDocument } from '../../lib/rag.js';

// Fake Supabase table builder (same shape the CRM tests use).
function makeSb(cfg: Record<string, { data?: any; error?: any }> = {}) {
  const ops: Array<{ m: string; args: any[]; table?: string }> = [];
  const make = (result: { data?: any; error?: any }) => {
    const b: any = {};
    let updatedRow: any = null;
    for (const m of ['select', 'order', 'eq', 'insert', 'update', 'delete', 'single', 'limit']) {
      b[m] = (...args: any[]) => {
        ops.push({ m, args });
        if (m === 'update') updatedRow = args[0];
        return b;
      };
    }
    // A builder resolves to the result its terminal operation recorded — like
    // the real client, `select()` after `update()` returns the updated row.
    b.then = (onF: any, onR: any) => {
      const resolved = updatedRow !== null ? { data: updatedRow, error: null } : result;
      return Promise.resolve(resolved).then(onF, onR);
    };
    return b;
  };
  const from = vi.fn((table: string) => {
    ops.push({ m: 'from', args: [table] });
    return make(cfg[table] ?? { data: undefined, error: null });
  });
  return { sb: { from }, ops, from };
}

function makeRequireModule(enabled: string[] = ['competitors']) {
  return (mod: string) => (_req: any, res: any, next: any) => {
    if (!enabled.includes(mod)) {
      res.status(403).json({ error: `Your current plan does not include the "${mod}" module.`, moduleKey: mod });
      return;
    }
    next();
  };
}

function makeDeps(overrides: any = {}) {
  const genCalls: any[] = [];
  return {
    ...{
      requireModule: makeRequireModule() as any,
      // The router mounts the limiter INSTANCE as a route layer (rateLimit's
      // return value), so the stub must be middleware itself, not a factory.
      expensiveLimiter: (_req: any, _res: any, next: any) => next(),
      getGeminiClient: vi.fn(() => ({
        models: {
          generateContent: async (req: any) => {
            genCalls.push(req);
            return { text: JSON.stringify({ positioningSummary: 'summary', strengths: ['s1'], weaknesses: ['w1'], contentStrategyNotes: 'c', seoSignalsNotes: 'e', recommendedCounterMoves: ['m'] }) };
          },
        },
      })),
      resolveEffectiveGeminiKey: vi.fn(async () => 'workspace-key'),
      resolveEffectiveGeminiModel: vi.fn(async () => 'test-model'),
      classifyGeminiError: vi.fn((e: any) => 'CLASSIFIED:' + String(e?.message || e)),
      getDB: vi.fn(async () => ({ secondBrain: { brandVault: { corePositioning: 'Acme positioning' } } })),
    },
    ...overrides,
    _genCalls: genCalls,
  };
}

function makeRes(sb: any, wsId = 'ws-1') {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: { sb, wsId, userId: 'user-1' },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.jsonData = data;
      return res;
    },
  };
  return res;
}

// A minimally-complete SiteSnapshot fixture (the real fields from
// src/lib/siteFetch.ts), so tests don't invent ad-hoc shapes.
function siteSnap(overrides: Record<string, unknown> = {}): any {
  return {
    url: 'https://rival.com/',
    finalUrl: 'https://rival.com/',
    statusCode: 200,
    title: 'Rival Home',
    metaDescription: '',
    h1s: ['Rival'],
    h2s: [],
    wordCount: 120,
    hasViewportMeta: true,
    hasStructuredData: false,
    structuredDataTypes: [],
    hasFaqContent: false,
    ...overrides,
  };
}

// Routes carry injected middleware layers (gate, limiter) before the handler,
// so walk the route stack manually and await any async layer's promise.
async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find(
    (s: any) => s.route?.path === path && s.route?.methods?.[method.toLowerCase()],
  );
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  const stack = layer.route.stack;
  for (let i = 0; i < stack.length; i++) {
    let nextCalled = false;
    const maybeP = stack[i].handle(req, res, () => {
      nextCalled = true;
    });
    if (maybeP && typeof maybeP.then === 'function') await maybeP;
    if (!nextCalled) return;
  }
}

describe('Competitors Routes', () => {
  const savedKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    vi.mocked(fetchSiteContent).mockReset();
    vi.mocked(saveDocument).mockReset();
    process.env.GEMINI_API_KEY = 'test-key';
  });
  afterEach(() => {
    if (savedKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = savedKey;
  });

  it('fail-closed tier gate: 403 when the competitors module is not entitled', async () => {
    const { sb } = makeSb();
    const deps = makeDeps({ requireModule: makeRequireModule([]) as any });
    const router = createCompetitorsRouter(deps);
    const res = makeRes(sb);
    await invoke(router, 'GET', '/', { method: 'GET', url: '/competitors', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(403);
  });

  it('GET / lists competitors (200) and 500 on table error', async () => {
    const ok = makeSb({ competitors: { data: [{ id: 'cmp-1', name: 'Rival' }], error: null } });
    let router = createCompetitorsRouter(makeDeps());
    let res = makeRes(ok.sb);
    await invoke(router, 'GET', '/', { method: 'GET', url: '/competitors', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.competitors).toEqual([{ id: 'cmp-1', name: 'Rival' }]);

    const bad = makeSb({ competitors: { data: null, error: new Error('db down') } });
    router = createCompetitorsRouter(makeDeps());
    res = makeRes(bad.sb);
    await invoke(router, 'GET', '/', { method: 'GET', url: '/competitors', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(500);
  });

  it('POST / validates fields and sanitizes trackedKeywords', async () => {
    const sbx = makeSb({ competitors: { data: { id: 'cmp-9' }, error: null } });
    const router = createCompetitorsRouter(makeDeps());

    let res = makeRes(sbx.sb);
    await invoke(router, 'POST', '/', { method: 'POST', url: '/competitors', params: {}, body: { name: 'X' } }, res);
    expect(res.statusCode).toBe(400);

    res = makeRes(sbx.sb);
    await invoke(
      router, 'POST', '/',
      { method: 'POST', url: '/competitors', params: {}, body: { name: ' Rival ', domain: ' rival.com ', trackedKeywords: 'not-an-array' } }, res,
    );
    expect(res.statusCode).toBe(200);
    const insertOp = sbx.ops.find((o: any) => o.m === 'insert');
    expect(insertOp.args[0]).toMatchObject({ name: 'Rival', domain: 'rival.com', workspace_id: 'ws-1', tracked_keywords: [] });

    // array input keeps only string entries
    sbx.ops.length = 0;
    res = makeRes(sbx.sb);
    await invoke(
      router, 'POST', '/',
      { method: 'POST', url: '/competitors', params: {}, body: { name: 'R', domain: 'd.com', trackedKeywords: ['a', 1, 'b'] } }, res,
    );
    const insertOp2 = sbx.ops.find((o: any) => o.m === 'insert');
    expect(insertOp2.args[0].tracked_keywords).toEqual(['a', 'b']);
  });

  it('DELETE /:id (200) and 500 on error', async () => {
    const ok = makeSb({ competitors: { data: true, error: null } });
    let router = createCompetitorsRouter(makeDeps());
    let res = makeRes(ok.sb);
    await invoke(router, 'DELETE', '/:id', { method: 'DELETE', url: '/competitors/cmp-1', params: { id: 'cmp-1' }, body: {} }, res);
    expect(res.statusCode).toBe(200);

    const bad = makeSb({ competitors: { data: null, error: new Error('locked') } });
    router = createCompetitorsRouter(makeDeps());
    res = makeRes(bad.sb);
    await invoke(router, 'DELETE', '/:id', { method: 'DELETE', url: '/competitors/cmp-1', params: { id: 'cmp-1' }, body: {} }, res);
    expect(res.statusCode).toBe(500);
  });

  it('POST /:id/scan: 404 unknown competitor, 503 without a key, 422 when the site fetch fails', async () => {
    const sbx = makeSb({ competitors: { data: null, error: new Error('nope') } });
    let router = createCompetitorsRouter(makeDeps());
    let res = makeRes(sbx.sb);
    await invoke(router, 'POST', '/:id/scan', { method: 'POST', url: '/competitors/cmp-1/scan', params: { id: 'cmp-1' }, body: {} }, res);
    expect(res.statusCode).toBe(404);

    delete process.env.GEMINI_API_KEY;
    const found = makeSb({ competitors: { data: { id: 'cmp-1', name: 'R', domain: 'rival.com' }, error: null } });
    router = createCompetitorsRouter(makeDeps());
    res = makeRes(found.sb);
    await invoke(router, 'POST', '/:id/scan', { method: 'POST', url: '/competitors/cmp-1/scan', params: { id: 'cmp-1' }, body: {} }, res);
    expect(res.statusCode).toBe(503);

    process.env.GEMINI_API_KEY = 'test-key';
    vi.mocked(fetchSiteContent).mockRejectedValueOnce(new Error('DNS failure'));
    router = createCompetitorsRouter(makeDeps());
    res = makeRes(found.sb);
    await invoke(router, 'POST', '/:id/scan', { method: 'POST', url: '/competitors/cmp-1/scan', params: { id: 'cmp-1' }, body: {} }, res);
    expect(res.statusCode).toBe(422);
    expect(res.jsonData.error).toContain('DNS failure');
  });

  it('POST /:id/scan: happy path persists the analysis and saves the document', async () => {
    vi.mocked(fetchSiteContent).mockResolvedValueOnce(siteSnap());
    const sbx = makeSb({
      competitors: {
        data: { id: 'cmp-1', name: 'Rival', domain: 'rival.com', tracked_keywords: ['growth'] },
        error: null,
      },
    });
    const deps = makeDeps();
    const router = createCompetitorsRouter(deps);
    const res = makeRes(sbx.sb);
    await invoke(router, 'POST', '/:id/scan', { method: 'POST', url: '/competitors/cmp-1/scan', params: { id: 'cmp-1' }, body: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.competitor.last_analysis.positioningSummary).toBe('summary');
    expect(res.jsonData.competitor.last_analysis.scannedUrl).toBe('https://rival.com/');
    // workspace context + snapshot reached the prompt:
    const prompt = deps._genCalls[0].contents;
    expect(prompt).toContain('Acme positioning');
    expect(prompt).toContain('growth');
    expect(prompt).toContain(summarizeSnapshotForPrompt(siteSnap()));
    // analysis persisted + RAG document saved:
    const updateOp = sbx.ops.find((o: any) => o.m === 'update');
    expect(updateOp.args[0].last_analysis.positioningSummary).toBe('summary');
    expect(saveDocument).toHaveBeenCalledTimes(1);
    expect(saveDocument).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ vaultId: 'competitor', sourceModule: 'competitor_analysis' }));
  });

  it('POST /:id/scan: Gemini failure is classified via the injected classifier', async () => {
    vi.mocked(fetchSiteContent).mockResolvedValueOnce(siteSnap({ title: 'T', wordCount: 1 }));
    const sbx = makeSb({ competitors: { data: { id: 'cmp-1', name: 'R', domain: 'rival.com' }, error: null } });
    const failingClient = { models: { generateContent: async () => { throw new Error('API key not valid'); } } };
    const deps = makeDeps({ getGeminiClient: () => failingClient });
    const router = createCompetitorsRouter(deps);
    const res = makeRes(sbx.sb);
    await invoke(router, 'POST', '/:id/scan', { method: 'POST', url: '/competitors/cmp-1/scan', params: { id: 'cmp-1' }, body: {} }, res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.error).toBe('CLASSIFIED:API key not valid');
    expect(deps.classifyGeminiError).toHaveBeenCalled();
  });

  it('factory shape: 4 scoped route layers; scan route carries limiter + gate before handler', () => {
    const router: any = createCompetitorsRouter(makeDeps());
    const routeLayers = router.stack.filter((l: any) => l.route);
    expect(routeLayers).toHaveLength(4);
    const scan = routeLayers.find((l: any) => l.route.path === '/:id/scan');
    // [expensiveLimiter, requireModule stub, handler]
    expect(scan.route.stack).toHaveLength(3);
  });
});
