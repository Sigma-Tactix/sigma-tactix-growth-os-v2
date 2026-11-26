import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createContentAiRouter } from './contentAiRoutes.js';

// --- lib surface: the 3 routes orchestrate a lot of real libs; mock them all
// --- so the route's own logic (guards, ordering, honesty, persistence) is what
// --- gets exercised.
vi.mock('../../lib/rag.js', () => ({
  saveDocument: vi.fn(async () => 'doc-1'),
  searchDocuments: vi.fn(async () => []),
}));
vi.mock('../../lib/siteFetch.js', () => ({
  fetchSiteContent: vi.fn(),
  summarizeSnapshotForPrompt: vi.fn((s: any) => JSON.stringify(s)),
  createSyntheticSnapshot: vi.fn((domain: string) => ({ url: domain, finalUrl: domain, synthetic: true, fetchedAt: new Date().toISOString() })),
}));
vi.mock('../../lib/screenshot.js', () => ({
  captureAndStoreAuditScreenshots: vi.fn(),
  ScreenshotCapacityError: class ScreenshotCapacityError extends Error {},
}));
vi.mock('../../lib/boundedWorkflowGraph.js', () => ({
  BoundedWorkflowGraph: vi.fn(),
}));
vi.mock('../../lib/evidenceContract.js', () => ({
  computeArtifactSha256: vi.fn(() => 'hash'),
}));
vi.mock('../../lib/auditConsistency.js', () => ({
  detectClaimDiscrepancies: vi.fn(() => []),
  buildReviewerPacket: vi.fn((claim: any) => ({ claimId: claim.claimId, claimText: claim.claimText })),
  parseReviewerVerdict: vi.fn((claimId: string, _text: string) => ({ claimId, classification: 'estimate', rationale: 'ok' })),
  applyReviewVerdict: vi.fn((claim: any, verdict: any) => ({ classification: verdict.classification })),
}));
vi.mock('../../lib/growthStrategy.js', () => ({
  buildGrowthStrategies: vi.fn(() => ['strategy-1']),
}));
vi.mock('../../lib/auditScoring.js', () => ({
  computeAuditScore: vi.fn(() => ({ score: 72, basis: 'rubric', checks: [], notAssessed: [] })),
}));
vi.mock('../../lib/growthAuditAgents.js', () => ({
  AUDIT_CATEGORIES: [{ key: 'c1' }],
  runCategoryAgent: vi.fn(),
  runSynthesisAgent: vi.fn(),
}));
vi.mock('../../lib/tokenCostEngine.js', () => ({
  estimateTokens: vi.fn(() => 10),
}));
vi.mock('../../lib/executionLedgerStore.js', () => ({
  startNodeAttempt: vi.fn(async () => 'attempt-1'),
  finishNodeAttempt: vi.fn(async () => {}),
}));
vi.mock('@google/genai', () => ({
  Type: { OBJECT: 'OBJECT', STRING: 'STRING', INTEGER: 'INTEGER', ARRAY: 'ARRAY' },
}));

import { BoundedWorkflowGraph } from '../../lib/boundedWorkflowGraph.js';
import { createSyntheticSnapshot, fetchSiteContent, summarizeSnapshotForPrompt } from '../../lib/siteFetch.js';
import { ScreenshotCapacityError, captureAndStoreAuditScreenshots } from '../../lib/screenshot.js';
import { saveDocument, searchDocuments } from '../../lib/rag.js';

function makeDb(overrides: any = {}) {
  return {
    secondBrain: {
      brandVault: { brandSlogan: 's', corePositioning: 'p', voiceAndTone: 't', keyMessages: ['m'] },
      customerVault: { idealCustomerProfile: 'icp' },
    },
    contentAssets: [],
    ...overrides,
  } as any;
}

function makeDeps(db: any, overrides: any = {}) {
  const client = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({ classification: 'estimate', rationale: 'ok' }),
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
      }),
    },
  };
  return {
    getDB: vi.fn(async () => db),
    saveDB: vi.fn(async () => {}),
    getGeminiClient: vi.fn(() => client),
    resolveEffectiveGeminiKey: vi.fn(async () => 'live-key'),
    resolveEffectiveGeminiModel: vi.fn(async () => 'gemini-2.5-flash'),
    classifyGeminiError: vi.fn((e: any) => 'gemini: ' + (e?.message || 'unknown')),
    recordTokenUsage: vi.fn(async () => null),
    expensiveLimiter: (_r: any, _s: any, next: any) => next(),
    requireModule: vi.fn((_m: string) => (_r: any, _s: any, next: any) => next()),
    upload: { single: () => (_r: any, _s: any, next: any) => next() },
    getGrowthProviderSnapshots: vi.fn(async () => []),
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

// Walk every layer of the route stack (limiter, tier gate, handler) and
// await async layers — same convention as the other router tests.
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

function mockWorkflow(result: any) {
  // the route does `new BoundedWorkflowGraph(...)`, so the mock implementation
  // must be constructable (arrow fns are not) — a plain fn returning an object
  // is what `new` yields.
  vi.mocked(BoundedWorkflowGraph).mockImplementation(function MockWorkflow() {
    return { run: vi.fn(async () => result) };
  } as any);
}

describe('Content AI Routes', () => {
  beforeEach(() => {
    vi.mocked(fetchSiteContent).mockClear();
    vi.mocked(createSyntheticSnapshot).mockClear();
    vi.mocked(captureAndStoreAuditScreenshots).mockClear();
    vi.mocked(saveDocument).mockClear();
    vi.mocked(searchDocuments).mockClear();
    vi.mocked(BoundedWorkflowGraph).mockReset();
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('route shape: 3 scoped layers; each runs limiter → tier gate → handler', () => {
    const router: any = createContentAiRouter(makeDeps(makeDb()));
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(3);
    expect(layers.map((l: any) => l.route.path)).toEqual(['/run-diagnostic', '/run-uiux', '/generate-content']);
    for (const l of layers) expect(l.route.stack).toHaveLength(3); // [expensiveLimiter, requireModule, handler]
  });

  it('POST /run-diagnostic: 503 provider-unavailable when no effective key (no audit fabricated)', async () => {
    const db = makeDb();
    const deps = makeDeps(db, { resolveEffectiveGeminiKey: vi.fn(async () => undefined) });
    const router = createContentAiRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/run-diagnostic', makeReq({ body: { domain: 'acme.com' } }), res);
    expect(res.statusCode).toBe(503);
    expect(res.jsonData.code).toBe('GROWTH_AUDIT_PROVIDER_UNAVAILABLE');
    expect(db.growthAudit).toBeUndefined(); // nothing persisted
  });

  it('POST /run-diagnostic: a live DAG failure is an honest 502 with the workflow status', async () => {
    vi.mocked(fetchSiteContent).mockResolvedValueOnce({ url: 'acme.com', finalUrl: 'acme.com', synthetic: false, fetchedAt: new Date().toISOString() } as any);
    mockWorkflow({ status: 'failed', error: 'specialists blocked', nodeResults: {} });
    const db = makeDb();
    const router = createContentAiRouter(makeDeps(db));
    const res = makeRes();
    await invoke(router, 'POST', '/run-diagnostic', makeReq({ body: { domain: 'acme.com' } }), res);
    expect(res.statusCode).toBe(502);
    expect(res.jsonData.workflowStatus).toBe('failed');
    expect(db.growthAudit).toBeUndefined();
  });

  it('POST /run-diagnostic: fetch failure falls back to the synthetic snapshot (evidenceMode heuristic)', async () => {
    vi.mocked(fetchSiteContent).mockRejectedValueOnce(new Error('dns fail'));
    mockWorkflow({
      status: 'succeeded',
      nodeResults: {
        specialists: { status: 'succeeded', findingsSummary: [{ id: 'f1', text: 't', impactPct: 5, dataSource: 'placeholder' }], findings: [] },
        synthesis: { status: 'succeeded', synthesis: { recommendations: ['r'], roadmap90Day: ['road'] } },
      },
    });
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createContentAiRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/run-diagnostic', makeReq({ body: { domain: 'acme.com' } }), res);
    expect(res.statusCode).toBe(200);
    expect(createSyntheticSnapshot).toHaveBeenCalled(); // the fallback fired
    expect(res.jsonData.growthAudit.evidenceMode).toBe('heuristic');
    expect(res.jsonData.growthAudit.score).toBe(72); // rubric-based, never invented
    expect(db.growthAudit.status).toBe('completed');
    expect(deps.recordTokenUsage).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ actionType: 'GROWTH_DIAGNOSTIC' }));
    expect(saveDocument).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ sourceModule: 'growth_audit' }));
  });

  it('POST /run-diagnostic: a successful live DAG persists the reviewed audit + strategies', async () => {
    vi.mocked(fetchSiteContent).mockResolvedValueOnce({ url: 'acme.com', finalUrl: 'acme.com', synthetic: false, fetchedAt: new Date().toISOString() } as any);
    mockWorkflow({
      status: 'succeeded',
      nodeResults: {
        specialists: { status: 'succeeded', findingsSummary: [{ id: 'f1', text: 't', impactPct: 5, dataSource: 'live' }], findings: [] },
        synthesis: { status: 'succeeded', synthesis: { recommendations: ['r1'], roadmap90Day: ['road1'] } },
      },
    });
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createContentAiRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/run-diagnostic', makeReq({ body: { domain: 'acme.com' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.growthAudit.evidenceMode).toBe('live');
    expect(res.jsonData.growthAudit.strategies).toEqual(['strategy-1']); // from getGrowthProviderSnapshots
    expect(deps.getGrowthProviderSnapshots).toHaveBeenCalled();
    expect(db.growthAudit.lastAuditedAt).toBeTruthy();
  });

  it('POST /run-uiux: 503 provider-unavailable without GEMINI_API_KEY (no mock audit fabricated)', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const db = makeDb();
    const router = createContentAiRouter(makeDeps(db));
    const res = makeRes();
    await invoke(router, 'POST', '/run-uiux', makeReq({ body: { url: 'acme.com' } }), res);
    expect(res.statusCode).toBe(503);
    expect(res.jsonData.code).toBe('UIUX_PROVIDER_UNAVAILABLE');
    expect(db.uiuxAudit).toBeUndefined();
  });

  it('POST /run-uiux: 400 without a URL; 422 when the page cannot be fetched', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'live-key');
    const db = makeDb();
    const router = createContentAiRouter(makeDeps(db));

    let res = makeRes();
    await invoke(router, 'POST', '/run-uiux', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);

    vi.mocked(fetchSiteContent).mockRejectedValueOnce(new Error('dns fail'));
    res = makeRes();
    await invoke(router, 'POST', '/run-uiux', makeReq({ body: { url: 'acme.com' } }), res);
    expect(res.statusCode).toBe(422);
    expect(res.jsonData.error).toContain('Could not fetch the page');
  });

  it('POST /run-uiux: a Chromium capacity error is a retry-able 503, not a silent text-only downgrade', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'live-key');
    vi.mocked(fetchSiteContent).mockResolvedValueOnce({ url: 'acme.com', finalUrl: 'acme.com', synthetic: false, fetchedAt: new Date().toISOString() } as any);
    vi.mocked(captureAndStoreAuditScreenshots).mockRejectedValueOnce(new (vi.mocked(ScreenshotCapacityError) as any)('capacity'));
    const db = makeDb();
    const router = createContentAiRouter(makeDeps(db));
    const res = makeRes();
    await invoke(router, 'POST', '/run-uiux', makeReq({ body: { url: 'acme.com' } }), res);
    expect(res.statusCode).toBe(503);
  });

  it('POST /run-uiux: live success persists db.uiuxAudit + RAG mirror + token usage', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'live-key');
    vi.mocked(fetchSiteContent).mockResolvedValueOnce({ url: 'acme.com', finalUrl: 'https://acme.com', synthetic: false, fetchedAt: new Date().toISOString() } as any);
    vi.mocked(captureAndStoreAuditScreenshots).mockResolvedValueOnce({ desktop: 'u', mobile: 'm', fullPage: 'f' } as any);
    const db = makeDb();
    const deps = makeDeps(db, {
      getGeminiClient: vi.fn(() => ({
        models: {
          generateContent: async () => ({
            text: JSON.stringify({
              frictionRating: 'Low', overallScore: 81,
              findings: { usability: 'u', accessibility: 'a', navigation: 'n', mobileResponse: 'm', conversionFriction: 'c' },
              pageLevelRecommendations: [],
            }),
            usageMetadata: { promptTokenCount: 2, candidatesTokenCount: 1, totalTokenCount: 3 },
          }),
        },
      })),
    });
    const router = createContentAiRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/run-uiux', makeReq({ body: { url: 'acme.com', descriptionOfIssues: 'slow' } }), res);
    expect(res.statusCode).toBe(200);
    expect(db.uiuxAudit.overallScore).toBe(81);
    expect(db.uiuxAudit.url).toBe('https://acme.com');
    expect(db.uiuxAudit.screenshots.fullPage).toBe('f');
    expect(deps.recordTokenUsage).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ actionType: 'UIUX_AUDIT' }));
    expect(saveDocument).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ sourceModule: 'uiux_audit' }));
  });

  it('POST /generate-content: without GEMINI_API_KEY the honest mock asset is persisted as a Draft', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createContentAiRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/generate-content', makeReq({
      body: { title: 'Post', channel: 'linkedin', assetType: 'carousel', brief: { context: 'c', direction: 'd', emotions: 'e', objective: 'o', offer: 'x' } },
    }), res);
    expect(res.statusCode).toBe(200);
    const asset = db.contentAssets[0];
    expect(asset.status).toBe('Draft');
    expect(asset.content.startsWith('[Generated Draft for: Post]')).toBe(true);
    expect(deps.saveDB).toHaveBeenCalled();
  });

  it('POST /generate-content: a live key generates real content; a provider error is a 500 (no asset persisted)', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'live-key');
    const db = makeDb();
    const deps = makeDeps(db, {
      getGeminiClient: vi.fn(() => ({ models: { generateContent: async () => ({ text: 'REAL CONTENT' }) } })),
    });
    const router = createContentAiRouter(deps);
    const body = { title: 'Post', channel: 'linkedin', assetType: 'post', brief: { context: 'c', direction: 'd', emotions: 'e', objective: 'o', offer: 'x' } };

    let res = makeRes();
    await invoke(router, 'POST', '/generate-content', makeReq({ body }), res);
    expect(res.statusCode).toBe(200);
    expect(db.contentAssets[0].content).toBe('REAL CONTENT');
    expect(db.contentAssets[0].status).toBe('Draft');

    const dbFail = makeDb();
    const depsFail = makeDeps(dbFail, {
      getGeminiClient: vi.fn(() => ({ models: { generateContent: async () => { throw new Error('quota') } } })),
    });
    res = makeRes();
    await invoke(createContentAiRouter(depsFail), 'POST', '/generate-content', makeReq({ body }), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.error).toContain('Gemini Content Generation failed');
    expect(dbFail.contentAssets).toHaveLength(0); // nothing persisted on failure
  });
});
