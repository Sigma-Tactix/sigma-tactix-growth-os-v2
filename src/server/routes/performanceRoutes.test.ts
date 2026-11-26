import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPerformanceRouter } from './performanceRoutes.js';

vi.mock('../../lib/rag.js', () => ({
  saveDocument: vi.fn(async () => 'doc-1'),
}));
import { saveDocument } from '../../lib/rag.js';

function makeDb(overrides: any = {}) {
  return {
    secondBrain: { customerVault: {}, brandVault: {} },
    ...overrides,
  } as any;
}

let geminiCalls: any[] = [];
function makeDeps(db: any, overrides: any = {}) {
  geminiCalls = [];
  const client = {
    models: {
      generateContent: async (cfg: any) => {
        geminiCalls.push(cfg);
        // the router nests the schema under `config`; Type.ARRAY is the
        // uppercase string "ARRAY"
        if (String(cfg?.config?.responseSchema?.type).toLowerCase() === 'array') {
          return { text: JSON.stringify([{ channel: 'Google Ads', why: 'w', strategy: 's', competitors: 'c' }]) };
        }
        return { text: JSON.stringify({
          icp: 'icp', budget: '$10k', cpaTarget: '$100',
          mediaPlan: [{ channel: 'Google Ads' }],
          clientInsights: { painPoints: 'p', budgetSignal: 'Strong', urgency: 'High', recommendedPackage: 'Retainer', summary: 's' },
        }) };
      },
    },
  };
  return {
    getDB: vi.fn(async () => db),
    saveDB: vi.fn(async () => {}),
    getGeminiClient: vi.fn(() => client),
    resolveEffectiveGeminiKey: vi.fn(async () => 'key'),
    resolveEffectiveGeminiModel: vi.fn(async () => 'gemini-2.5-flash'),
    classifyGeminiError: vi.fn((e: any) => 'gemini: ' + (e?.message || 'unknown')),
    expensiveLimiter: (_req: any, _res: any, next: any) => next(),
    requireModule: vi.fn((_mod: string) => (_req: any, _res: any, next: any) => next()),
    upload: { single: () => (_req: any, _res: any, next: any) => next() },
    ...overrides,
  };
}

function makeRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    sent: null,
    headers: {} as Record<string, string>,
    locals: { sb: {}, wsId: 'ws-1', userId: 'user-1' },
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
    setHeader(k: string, v: string) { res.headers[k] = v; return res; },
    send(body: string) { res.sent = body; return res; },
  };
  return res;
}

function makeReq(overrides: any = {}) {
  return { method: 'POST', url: '/', params: {}, query: {}, body: {}, ...overrides };
}

// Walk every layer of the route stack (multer, limiter, tier gate, handler)
// and await async layers.
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

describe('Performance Routes', () => {
  beforeEach(() => { vi.mocked(saveDocument).mockClear(); delete process.env.GEMINI_API_KEY; });
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.GEMINI_API_KEY; });

  it('route shapes: the 2 file routes run multer BEFORE the tier gate; all routes carry the performance gate', () => {
    const router: any = createPerformanceRouter(makeDeps(makeDb()));
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(8);
    for (const l of layers) {
      // every route has the requireModule gate somewhere in its layer stack
      const stack = l.route.stack;
      // exact-match: the two FILE routes carry multer; the /url sibling must not
      if (l.route.path === '/performance/upload-report' || l.route.path === '/performance/media-plan-template') {
        expect(stack).toHaveLength(3);
      } else {
        expect(stack).toHaveLength(l.route.path === '/run-performance-swarm' ? 3 : 2); // swarm adds expensiveLimiter
      }
      expect(stack[stack.length - 1].handle.name).not.toEqual('next'); // ends in the handler
    }
    const paths = layers.map((l: any) => l.route.path);
    for (const p of paths) expect(p).toMatch(/^\/(run-performance-swarm|performance\/)/);
  });

  it('POST /run-performance-swarm: with GEMINI_API_KEY set, notes are required and the live swarm persists the plan', async () => {
    process.env.GEMINI_API_KEY = 'live-key';
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createPerformanceRouter(deps);
    let res = makeRes();
    await invoke(router, 'POST', '/run-performance-swarm', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('Discovery call notes are required');

    res = makeRes();
    await invoke(router, 'POST', '/run-performance-swarm', makeReq({ body: { notes: 'call notes' } }), res);
    expect(res.statusCode).toBe(200);
    expect(db.secondBrain.customerVault.idealCustomerProfile).toBe('icp');
    expect((db as any).mediaPlan).toEqual([{ channel: 'Google Ads' }]);
    expect(saveDocument).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ sourceModule: 'discovery_notes', contentText: 'call notes' }));
    expect(deps.saveDB).toHaveBeenCalled();
  });

  it('POST /run-performance-swarm: without GEMINI_API_KEY the mock fallback seeds canned data', async () => {
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createPerformanceRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/run-performance-swarm', makeReq({ body: { notes: 'notes' } }), res);
    expect(res.statusCode).toBe(200);
    expect((db as any).performanceBudget).toBe('$50,000');
    expect((db as any).mediaPlan.length).toBe(7);
    expect((db as any).performanceClientInsights.recommendedPackage).toBe('Growth Systems Retainer');
    expect(geminiCalls.length).toBe(0); // no live call in mock mode
  });

  it('POST /performance/upload-report: 400 no file, 500 storage failure, 200 persists the report record', async () => {
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createPerformanceRouter(deps);

    let res = makeRes();
    await invoke(router, 'POST', '/performance/upload-report', makeReq(), res);
    expect(res.statusCode).toBe(400);

    const file = { originalname: 'q2.csv', buffer: Buffer.from('channel,cpa\nsearch,120'), size: 20, mimetype: 'text/csv' };
    res = makeRes();
    (res.locals.sb as any).storage = { from: () => ({ upload: async () => ({ error: new Error('quota') }) }) };
    await invoke(router, 'POST', '/performance/upload-report', { ...makeReq(), file }, res);
    expect(res.statusCode).toBe(500);

    const sbStorageUpload = vi.fn(async () => ({ error: null }));
    const resOk = makeRes();
    (resOk.locals.sb as any).storage = { from: () => ({ upload: sbStorageUpload }) };
    await invoke(router, 'POST', '/performance/upload-report', { ...makeReq(), file }, resOk);
    expect(resOk.statusCode).toBe(200);
    const report = (db as any).campaignReports[0];
    expect(report.fileName).toBe('q2.csv');
    expect(report.documentId).toBe('doc-1');
    expect(saveDocument).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ sourceModule: 'campaign_report' }));
  });

  it('POST /performance/questionnaire-notes: 400 empty, 200 prepends + mirrors to RAG; DELETE removes by id', async () => {
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createPerformanceRouter(deps);

    let res = makeRes();
    await invoke(router, 'POST', '/performance/questionnaire-notes', makeReq({ body: { text: '  ' } }), res);
    expect(res.statusCode).toBe(400);

    res = makeRes();
    await invoke(router, 'POST', '/performance/questionnaire-notes', makeReq({ body: { text: '  note one  ' } }), res);
    expect(res.statusCode).toBe(200);
    expect((db as any).questionnaireNotes[0].text).toBe('note one');
    expect(saveDocument).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ sourceModule: 'questionnaire_notes' }));

    const noteId = (db as any).questionnaireNotes[0].id;
    res = makeRes();
    await invoke(router, 'DELETE', '/performance/questionnaire-notes/:noteId', { ...makeReq(), params: { noteId } }, res);
    expect(res.statusCode).toBe(200);
    expect((db as any).questionnaireNotes).toHaveLength(0);
  });

  it('POST /performance/media-plan-template: 400 no file, 200 stores the template record', async () => {
    const db = makeDb();
    const router = createPerformanceRouter(makeDeps(db));
    let res = makeRes();
    await invoke(router, 'POST', '/performance/media-plan-template', makeReq(), res);
    expect(res.statusCode).toBe(400);

    const sbUpload = vi.fn(async () => ({ error: null }));
    res = makeRes();
    (res.locals.sb as any).storage = { from: () => ({ upload: sbUpload }) };
    const req = makeReq(); (req as any).file = { originalname: 'template.xlsx', buffer: Buffer.from('x'), size: 1, mimetype: 'application/octet-stream' };
    await invoke(router, 'POST', '/performance/media-plan-template', req, res);
    expect(res.statusCode).toBe(200);
    expect((db as any).mediaPlanTemplate.fileName).toBe('template.xlsx');
    expect((db as any).mediaPlanTemplate.storagePath).toMatch(/^ws-1\/media-plan-templates\//);
  });

  it('GET /performance/media-plan-template/url: 404 without a template, 500 on signed-URL failure, 200 with the URL', async () => {
    const db = makeDb();
    const router = createPerformanceRouter(makeDeps(db));

    let res = makeRes();
    await invoke(router, 'GET', '/performance/media-plan-template/url', makeReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(404);

    (db as any).mediaPlanTemplate = { storagePath: 'ws-1/media-plan-templates/t.xlsx' };
    res = makeRes();
    (res.locals.sb as any).storage = { from: () => ({ createSignedUrl: async () => ({ error: new Error('nope') }) }) };
    await invoke(router, 'GET', '/performance/media-plan-template/url', makeReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(500);

    res = makeRes();
    (res.locals.sb as any).storage = { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: 'https://signed.example/t' } }) }) };
    await invoke(router, 'GET', '/performance/media-plan-template/url', makeReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.url).toBe('https://signed.example/t');
  });

  it('GET /performance/sample-template/:kind: 404 unknown kind, 200 streams a CSV with attachment headers', async () => {
    const router = createPerformanceRouter(makeDeps(makeDb()));

    let res = makeRes();
    await invoke(router, 'GET', '/performance/sample-template/:kind', makeReq({ method: 'GET', params: { kind: 'nope' } }), res);
    expect(res.statusCode).toBe(404);

    res = makeRes();
    await invoke(router, 'GET', '/performance/sample-template/:kind', makeReq({ method: 'GET', params: { kind: 'basic' } }), res);
    expect(res.sent).toContain('Channel,Funnel Stage');
    expect(res.headers['Content-Disposition']).toContain('media-plan-template-basic.csv');
    expect(res.headers['Content-Type']).toBe('text/csv');
  });

  it('POST /performance/channel-strategies: 503 without GEMINI_API_KEY; 200 persists per-channel strategy', async () => {
    const db = makeDb();
    (db as any).mediaPlan = [{ channel: 'Meta Ads' }];
    const router = createPerformanceRouter(makeDeps(db));

    let res = makeRes();
    await invoke(router, 'POST', '/performance/channel-strategies', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(503);

    process.env.GEMINI_API_KEY = 'live-key';
    res = makeRes();
    await invoke(router, 'POST', '/performance/channel-strategies', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(200);
    expect((db as any).channelStrategies[0]).toMatchObject({ channel: 'Google Ads' });
    // the prompt was built from the stored plan's channels
    expect(geminiCalls[0].contents).toContain('Meta Ads');
  });

  it('POST /performance/channel-strategies: a gemini failure surfaces the classified error as a 500', async () => {
    process.env.GEMINI_API_KEY = 'live-key';
    const db = makeDb();
    const deps = makeDeps(db, {
      getGeminiClient: vi.fn(() => ({ models: { generateContent: async () => { throw new Error('quota'); } } })),
      classifyGeminiError: vi.fn((e: any) => 'classified: ' + e.message),
    });
    const router = createPerformanceRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/performance/channel-strategies', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.error).toBe('classified: quota');
  });
});
