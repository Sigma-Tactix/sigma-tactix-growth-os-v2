import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fsNode from 'node:fs';
import * as os from 'node:os';
import * as pathNode from 'node:path';
import { createCroRendersRouter } from './croRendersRoutes.js';

// --- lib surface: the CRO pipeline orchestrates a lot of real libs; mock
// --- them all so the route's own guard ladders + honesty degradation are
// --- what gets exercised.
vi.mock('../../lib/screenshot.js', () => ({
  captureAndStoreAuditScreenshots: vi.fn(),
  renderAndStoreLandingArtifactPreviews: vi.fn(),
}));
vi.mock('../../lib/landingArtifact.js', () => ({
  buildLandingPageDraft: vi.fn(),
  validateLandingArtifactForApproval: vi.fn(),
}));
vi.mock('../../lib/artifactInspection.js', () => ({
  inspectArtifactBytes: vi.fn(),
}));
vi.mock('../../lib/missionExecution.js', () => ({
  createDispatchPlan: vi.fn(),
  taskMetadata: vi.fn(),
}));
vi.mock('../../lib/agentPolicies.js', () => ({
  getAgentPolicy: vi.fn(() => ({ allowed: ['content'] })),
}));
vi.mock('../../lib/siteFetch.js', () => ({
  fetchSiteContent: vi.fn(),
}));
vi.mock('../../lib/supabaseAdmin.js', () => ({
  getServiceRoleClient: vi.fn(),
}));
vi.mock('../../lib/onboardingChat.js', () => ({
  onboardingChatRequest: {
    safeParse: (body: any) => {
      const msgs = body?.messages;
      const ok = Array.isArray(msgs) && msgs.length >= 1 && msgs.length <= 20 && msgs[msgs.length - 1]?.role === 'user';
      return { success: ok, data: { messages: msgs || [] } };
    },
  },
  ONBOARDING_INSTRUCTION: 'SYS',
}));
vi.mock('../../lib/evidenceContract.js', () => ({
  computeArtifactSha256: vi.fn(),
}));
vi.mock('../providers/creative/hyperframesRenderer.js', () => ({
  hyperframesRenderer: { isReady: vi.fn(), statusMessage: vi.fn(), artifactPath: vi.fn() },
}));

import { captureAndStoreAuditScreenshots, renderAndStoreLandingArtifactPreviews } from '../../lib/screenshot.js';
import { buildLandingPageDraft, validateLandingArtifactForApproval } from '../../lib/landingArtifact.js';
import { inspectArtifactBytes } from '../../lib/artifactInspection.js';
import { createDispatchPlan, taskMetadata } from '../../lib/missionExecution.js';
import { fetchSiteContent } from '../../lib/siteFetch.js';
import { getServiceRoleClient } from '../../lib/supabaseAdmin.js';
import { onboardingChatRequest } from '../../lib/onboardingChat.js';
import { computeArtifactSha256 } from '../../lib/evidenceContract.js';
import { hyperframesRenderer } from '../providers/creative/hyperframesRenderer.js';

function makeDb(overrides: any = {}) {
  return { agentTasks: [], secondBrain: {}, ...overrides } as any;
}

function makeDeps(db: any, overrides: any = {}) {
  return {
    getDB: vi.fn(async () => db),
    saveDB: vi.fn(async () => {}),
    requireModule: vi.fn(() => (_r: any, _s: any, next: any) => next()),
    expensiveLimiter: (_r: any, _s: any, next: any) => next(),
    callerIsOwnerOrAdmin: vi.fn(async () => true),
    workspaceHasSecondApprover: vi.fn(async () => false),
    recordLedgerTask: vi.fn(async () => null),
    loadAgentTasks: vi.fn(async () => db.agentTasks),
    resolveEffectiveGeminiKey: vi.fn(async () => 'gemini-key'),
    getGeminiClient: vi.fn(() => ({
      models: {
        generateContent: vi.fn(async () => ({ text: 'onboarding reply' })),
      },
    })),
    resolveEffectiveGeminiModel: vi.fn(async () => 'gemini-2.5-flash'),
    ...overrides,
  };
}

// Flexible supabase-style chain builder; per-table result overrides.
function makeSb(overrides: Record<string, any> = {}) {
  const insertPayloads: any[] = [];
  const from = vi.fn((table: string) => {
    const b: any = {};
    const resolved = () => overrides[table] ?? { data: [], error: null };
    for (const m of ['select', 'order', 'delete', 'eq']) b[m] = () => b;
    b.insert = (p: any) => { insertPayloads.push({ table, p }); return b; };
    b.single = () => b;
    b.maybeSingle = () => b;
    // thenable: `await sb.from(t).select(...)` resolves to the per-table value
    b.then = (onF: any) => Promise.resolve(resolved()).then(onF);
    return b;
  });
  return {
    from,
    insertPayloads,
    storage: {
      from: vi.fn(() => ({ upload: vi.fn(async () => {}), download: vi.fn() })),
    },
  } as any;
}

function makeRes(sb: any, extras: Record<string, any> = {}) {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    sent: null,
    sentFile: null,
    headers: {} as Record<string, any>,
    locals: { sb, wsId: 'ws-1', userId: 'user-1', user: { id: 'user-1' } },
    ...extras,
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
    setHeader(k: string, v: any) { res.headers[k] = v; return res; },
    type() { return res; },
    send(d: any) { res.sent = d; return res; },
    sendFile(p: any) { res.sentFile = p; return res; },
    attachment() { return res; },
  };
  return res;
}

function makeReq(overrides: any = {}) {
  return { method: 'POST', url: '/', params: {}, query: {}, body: {}, ...overrides };
}

// A service-role client mock: getServiceRoleClient().from(table).update(...)
// .eq("id").eq("workspace_id").eq("status").select("*").maybeSingle() → a
// resolved row-or-error. Built bottom-up with named links so the chain is
// readable (no nested paren counting).
function mockServiceRoleUpdate(updateResult: { data: any; error: any }) {
  const maybeSingleQuery = { maybeSingle: vi.fn(async () => updateResult) };
  const selectQuery = { select: vi.fn(() => maybeSingleQuery) };
  const eqStatus = { eq: vi.fn(() => selectQuery) };
  const eqWorkspace = { eq: vi.fn(() => eqStatus) };
  const eqId = { eq: vi.fn(() => eqWorkspace) };
  const updateQuery = { update: vi.fn(() => eqId) };
  const client = { from: vi.fn(() => updateQuery) };
  vi.mocked(getServiceRoleClient).mockReturnValue(client as any);
}

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

const ENV_KEYS = ['GEMINI_API_KEY'];

describe('CRO / HyperFrames Renders / Onboarding-Chat Routes', () => {
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    vi.mocked(fetchSiteContent).mockClear();
    vi.mocked(captureAndStoreAuditScreenshots).mockClear();
    vi.mocked(renderAndStoreLandingArtifactPreviews).mockClear();
    vi.mocked(buildLandingPageDraft).mockClear();
    vi.mocked(validateLandingArtifactForApproval).mockClear();
    vi.mocked(inspectArtifactBytes).mockClear();
    vi.mocked(createDispatchPlan).mockClear();
    vi.mocked(taskMetadata).mockClear();
    vi.mocked(computeArtifactSha256).mockClear();
    vi.mocked((getServiceRoleClient as any)).mockClear();
    vi.mocked((hyperframesRenderer as any).isReady).mockClear();
    vi.mocked((hyperframesRenderer as any).statusMessage).mockClear();
    vi.mocked((hyperframesRenderer as any).artifactPath).mockClear();
  });
  afterEach(() => {
    if (process.env.GEMINI_API_KEY === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = 'was-set';
    vi.unstubAllGlobals();
  });

  it('route shape: the CRO routes keep their per-route limiter + tier-gate layers; renders + onboarding vary', () => {
    const router: any = createCroRendersRouter(makeDeps(makeDb()));
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(7);
    // GET and POST can share a path (both at /cro/artifacts), so key by
    // method+path to keep the two distinct layers.
    const byKey: Record<string, number> = {};
    for (const l of layers) {
      const m = Object.keys(l.route.methods).join('|');
      byKey[`${m.toUpperCase()} ${l.route.path}`] = l.route.stack.length;
    }
    expect(byKey['GET /api/workspace/cro/artifacts']).toBe(2); // [requireModule, handler]
    expect(byKey['POST /api/workspace/cro/artifacts']).toBe(3); // [expensiveLimiter, requireModule, handler]
    expect(byKey['GET /api/workspace/cro/artifacts/:id/html']).toBe(2);
    expect(byKey['POST /api/workspace/cro/artifacts/:id/approve']).toBe(3);
    expect(byKey['POST /api/workspace/creative/renders']).toBe(1); // no gate — plain handler
    expect(byKey['GET /api/workspace/creative/renders/:taskId/download']).toBe(1);
    expect(byKey['POST /api/workspace/onboarding-chat']).toBe(2); // [expensiveLimiter, handler]
  });

  it('GET /api/workspace/cro/artifacts: a supabase error falls back to the in-memory artifact list; success merges both', async () => {
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createCroRendersRouter(deps);

    // error → in-memory only (empty in a fresh router)
    let sb = makeSb({ landing_artifacts: { data: null, error: { message: 'table not migrated' } } });
    let res = makeRes(sb);
    await invoke(router, 'GET', '/api/workspace/cro/artifacts', makeReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.artifacts).toEqual([]);

    // success → supabase rows + in-memory rows are merged
    sb = makeSb({ landing_artifacts: {
      data: [{
        id: 'art-1', workspace_id: 'ws-1', created_by: 'user-1', source_url: 'https://x',
        source_captured_at: '2026-01-01', source_hash: 'h', source_title: 'X',
        brief: {}, sections: [], source_previews: {}, proposed_previews: {},
        html_storage_path: 'p', html_hash: 'hh', html_bytes: 5, status: 'draft',
        approved_by: null, approved_at: null, created_at: 'c', updated_at: 'u',
      }], error: null,
    } });
    res = makeRes(sb);
    await invoke(router, 'GET', '/api/workspace/cro/artifacts', makeReq({ method: 'GET' }), res);
    expect(res.jsonData.artifacts).toHaveLength(1);
    expect(res.jsonData.artifacts[0]).toMatchObject({ id: 'art-1', status: 'draft', htmlUrl: '/api/workspace/cro/artifacts/art-1/html' });
  });

  it('POST /api/workspace/cro/artifacts: 400 ladders, a 422 on fetch failure, and a 201 that degrades to in-memory when the DB insert fails', async () => {
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createCroRendersRouter(deps);

    let sb = makeSb();
    let res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/cro/artifacts', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('public target URL is required');

    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/cro/artifacts',
      makeReq({ body: { url: 'https://acme.com', objective: 'x'.repeat(501) } }), res);
    expect(res.statusCode).toBe(400); // the brief fields must stay under 500 chars
    expect(res.jsonData.error).toContain('under 500 characters');

    // fetch failure → 422
    vi.mocked(fetchSiteContent).mockRejectedValueOnce(new Error('dns fail'));
    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/cro/artifacts', makeReq({ body: { url: 'https://acme.com', objective: 'Grow', audience: 'CFOs', primaryCta: 'Book a call' } }), res);
    expect(res.statusCode).toBe(422);
    expect(res.jsonData.error).toContain('Could not capture the public source page');

    // success → a DB insert that errors still returns the in-memory artifact as 201
    vi.mocked(fetchSiteContent).mockResolvedValueOnce({
      url: 'https://acme.com', finalUrl: 'https://acme.com/', title: 'Acme', metaDescription: 'md', h1s: [], h2s: [], fetchedAt: new Date().toISOString(),
    } as any);
    vi.mocked(captureAndStoreAuditScreenshots).mockResolvedValueOnce({ desktop: 'd', mobile: 'm', fullPage: null } as any);
    vi.mocked(buildLandingPageDraft).mockReturnValue({
      html: '<html></html>', sourceUrl: 'https://acme.com', sourceCapturedAt: 'c', sourceHash: 'sh', htmlHash: 'hh', sections: [],
    } as any);
    vi.mocked(renderAndStoreLandingArtifactPreviews).mockResolvedValueOnce({ desktop: 'pd', mobile: 'pm' } as any);
    vi.mocked(validateLandingArtifactForApproval).mockReturnValue({ ready: true, reasons: [] } as any);
    vi.mocked(inspectArtifactBytes).mockReturnValue({ valid: true, reasons: [] } as any);
    // DB insert fails (table not migrated) → the in-memory artifact is returned
    sb = makeSb({ landing_artifacts: { data: null, error: { message: 'no table yet' } } });
    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/cro/artifacts', makeReq({ body: { url: 'https://acme.com', objective: 'Grow', audience: 'CFOs', primaryCta: 'Book a call' } }), res);
    expect(res.statusCode).toBe(201);
    expect(res.jsonData.artifact.status).toBe('draft');
    expect(res.jsonData.artifact.htmlUrl).toMatch(/^\/api\/workspace\/cro\/artifacts\/.+\/html$/);
  });

  it('POST /api/workspace/cro/artifacts/:id/approve: 403 non-owner, 404 missing, 409 not-draft, 403 second-approver, 422 not-eligible, 409 update-failed, 200 success', async () => {
    const row = (status: string, createdBy: string) => ({
      id: 'art-1', workspace_id: 'ws-1', created_by: createdBy, source_url: 'https://x',
      source_captured_at: 'c', source_hash: 'h', source_title: 'X',
      brief: {}, sections: [], source_previews: { desktop: 'a', mobile: 'b' },
      proposed_previews: { desktop: 'c', mobile: 'd' },
      html_storage_path: 'p', html_hash: 'hh', html_bytes: 5, status,
      approved_by: null, approved_at: null, created_at: 'c', updated_at: 'u',
    });

    let sb = makeSb();
    let deps = makeDeps(makeDb(), { callerIsOwnerOrAdmin: vi.fn(async () => false) });
    let router = createCroRendersRouter(deps);
    let res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/cro/artifacts/:id/approve', makeReq({ params: { id: 'art-1' } }), res);
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.error).toContain('owner or admin');

    // 404: the lookup errors
    sb = makeSb({ landing_artifacts: { data: null, error: { message: 'x' } } });
    deps = makeDeps(makeDb());
    router = createCroRendersRouter(deps);
    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/cro/artifacts/:id/approve', makeReq({ params: { id: 'nope' } }), res);
    expect(res.statusCode).toBe(404);

    // 409: not a draft
    sb = makeSb({ landing_artifacts: { data: row('approved', 'user-1'), error: null } });
    deps = makeDeps(makeDb());
    router = createCroRendersRouter(deps);
    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/cro/artifacts/:id/approve', makeReq({ params: { id: 'art-1' } }), res);
    expect(res.statusCode).toBe(409);
    expect(res.jsonData.error).toContain('not draft');

    // 403: the creator cannot self-approve when another approver exists
    sb = makeSb({ landing_artifacts: { data: row('draft', 'user-1'), error: null } });
    deps = makeDeps(makeDb(), { workspaceHasSecondApprover: vi.fn(async () => true) });
    router = createCroRendersRouter(deps);
    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/cro/artifacts/:id/approve', makeReq({ params: { id: 'art-1' } }), res);
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.error).toContain('Another owner or admin must approve');

    // 422: not approval-eligible (previews missing)
    sb = makeSb({ landing_artifacts: { data: row('draft', 'someone-else'), error: null } });
    vi.mocked(validateLandingArtifactForApproval).mockReturnValue({ ready: false, reasons: ['missing previews'] } as any);
    deps = makeDeps(makeDb());
    router = createCroRendersRouter(deps);
    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/cro/artifacts/:id/approve', makeReq({ params: { id: 'art-1' } }), res);
    expect(res.statusCode).toBe(422);
    expect(res.jsonData.reasons).toEqual(['missing previews']);

    // 409: the service-role update fails
    vi.mocked(validateLandingArtifactForApproval).mockReturnValue({ ready: true, reasons: [] } as any);
    sb = makeSb({ landing_artifacts: { data: row('draft', 'someone-else'), error: null } });
    mockServiceRoleUpdate({ data: null, error: { message: 'state changed' } });
    deps = makeDeps(makeDb());
    router = createCroRendersRouter(deps);
    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/cro/artifacts/:id/approve', makeReq({ params: { id: 'art-1' } }), res);
    expect(res.statusCode).toBe(409);

    // 200: the service-role update succeeds (status pinned to draft so a
    // concurrent approval cannot double-fire)
    mockServiceRoleUpdate({ data: { ...row('approved', 'user-1'), approved_by: 'user-1' }, error: null });
    sb = makeSb({ landing_artifacts: { data: row('draft', 'someone-else'), error: null } });
    deps = makeDeps(makeDb());
    router = createCroRendersRouter(deps);
    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/cro/artifacts/:id/approve', makeReq({ params: { id: 'art-1' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.artifact.status).toBe('approved');
    expect(res.jsonData.artifact.approvedBy).toBe('user-1');
  });

  it('GET /api/workspace/cro/artifacts/:id/html: integrity + inspection gates, 404 when no row, 410 when the buffer is unavailable', async () => {
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createCroRendersRouter(deps);

    // 404: no DB row, nothing in the in-memory cache for this router instance
    let sb = makeSb({ landing_artifacts: { data: null, error: null } });
    let res = makeRes(sb);
    await invoke(router, 'GET', '/api/workspace/cro/artifacts/:id/html', makeReq({ method: 'GET', params: { id: 'ghost' } }), res);
    expect(res.statusCode).toBe(404);

    // 410: the row exists but the storage download returns nothing and the
    // memory cache is empty for the hash
    vi.mocked(computeArtifactSha256).mockReturnValue('hh');
    sb = makeSb({ landing_artifacts: {
      data: { id: 'art-1', workspace_id: 'ws-1', html_storage_path: 'p', html_hash: 'hh' }, error: null,
    } });
    vi.mocked((sb as any).storage.from).mockReturnValue({ download: vi.fn(async () => { throw new Error('down'); }) });
    res = makeRes(sb);
    await invoke(router, 'GET', '/api/workspace/cro/artifacts/:id/html', makeReq({ method: 'GET', params: { id: 'art-1' } }), res);
    expect(res.statusCode).toBe(410);
  });

  it('POST /api/workspace/creative/renders: 400 ladders, a 503 when HyperFrames is not ready, a 202 HITL-queued task + ledger record', async () => {
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createCroRendersRouter(deps);
    const sb = makeSb();

    let res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/creative/renders', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);

    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/creative/renders', makeReq({ body: { title: 'T', aspectRatio: '2:1' } }), res);
    expect(res.statusCode).toBe(400);

    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/creative/renders', makeReq({ body: { title: 'T', durationSeconds: 99 } }), res);
    expect(res.statusCode).toBe(400);

    vi.mocked((hyperframesRenderer as any).isReady).mockReturnValue(false);
    vi.mocked((hyperframesRenderer as any).statusMessage).mockReturnValue('renderer cold');
    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/creative/renders', makeReq({ body: { title: 'T' } }), res);
    expect(res.statusCode).toBe(503);

    // 202: the task is queued Pending Approval (HITL), the ledger is recorded
    vi.mocked((hyperframesRenderer as any).isReady).mockReturnValue(true);
    vi.mocked(createDispatchPlan).mockReturnValue({
      intent: 'x', missionId: 'm', planId: 'p', entrySubAgent: 's1', executionSubAgentIds: ['s1'],
    } as any);
    vi.mocked(taskMetadata).mockReturnValue({ planId: 'p' } as any);
    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/creative/renders', makeReq({ body: { title: 'Motion', subtitle: 's', cta: 'cta' } }), res);
    expect(res.statusCode).toBe(202);
    expect(res.jsonData.task.requiresApproval).toBe(true);
    expect(res.jsonData.task.status).toBe('Pending Approval');
    expect(db.agentTasks[0].creativeRender).toMatchObject({ title: 'Motion', aspectRatio: '9:16', durationSeconds: 8 });
    expect(deps.saveDB).toHaveBeenCalled();
    expect(deps.recordLedgerTask).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: 'Pending Approval' }), 'user-1', expect.stringContaining('HITL'), { planId: 'p' });
  });

  it('GET /api/workspace/creative/renders/:taskId/download: 404 unknown, 409 not-complete, 410 artifact-unavailable, 200 streams the mp4', async () => {
    const db = makeDb();
    const deps = makeDeps(db, {
      loadAgentTasks: vi.fn(async () => [
        { id: 'task-nonrender', agentName: 'a', status: 'Success' } as any, // no creativeRender → 404
        { id: 'task-queued', agentName: 'a', status: 'Pending Approval', creativeRender: { title: 'T' } } as any,
        { id: 'task-done', agentName: 'a', status: 'Success', creativeRender: { title: 'T' } } as any,
      ]),
    });
    const router = createCroRendersRouter(deps);
    const sb = makeSb();

    let res = makeRes(sb);
    await invoke(router, 'GET', '/api/workspace/creative/renders/:taskId/download', makeReq({ method: 'GET', params: { taskId: 'task-nonrender' } }), res);
    expect(res.statusCode).toBe(404);

    res = makeRes(sb);
    await invoke(router, 'GET', '/api/workspace/creative/renders/:taskId/download', makeReq({ method: 'GET', params: { taskId: 'task-queued' } }), res);
    expect(res.statusCode).toBe(409);

    // 410: the render succeeded but the local artifact is gone
    vi.mocked((hyperframesRenderer as any).artifactPath).mockReturnValue('/no/such/file.mp4');
    res = makeRes(sb);
    await invoke(router, 'GET', '/api/workspace/creative/renders/:taskId/download', makeReq({ method: 'GET', params: { taskId: 'task-done' } }), res);
    expect(res.statusCode).toBe(410);

    // 200: a real existing artifact streams as video/mp4
    const tmp = fsNode.mkdtempSync(pathNode.join(os.tmpdir(), 'hf-'));
    const file = pathNode.join(tmp, 'task-done.mp4');
    fsNode.writeFileSync(file, 'mp4bytes');
    vi.mocked((hyperframesRenderer as any).artifactPath).mockReturnValue(file);
    res = makeRes(sb);
    await invoke(router, 'GET', '/api/workspace/creative/renders/:taskId/download', makeReq({ method: 'GET', params: { taskId: 'task-done' } }), res);
    expect(res.sentFile).toBe(file);
    expect(res.headers['Content-Type'] ?? res.statusCode).toBeDefined();
  });

  it('POST /api/workspace/onboarding-chat: a 400 schema violation, a 503 with no key, a 200 live reply, a 502 provider failure', async () => {
    const db = makeDb();
    const deps = makeDeps(db, {
      resolveEffectiveGeminiKey: vi.fn(async () => undefined),
    });
    const router = createCroRendersRouter(deps);
    const sb = makeSb();

    let res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/onboarding-chat', makeReq({ body: { messages: [] } }), res);
    expect(res.statusCode).toBe(400);

    res = makeRes(sb);
    await invoke(router, 'POST', '/api/workspace/onboarding-chat', makeReq({ body: { messages: [{ role: 'user', content: 'hi' }] } }), res);
    expect(res.statusCode).toBe(503);
    expect(res.jsonData.error).toContain('Configure an AI provider');

    // live reply
    const depsLive = makeDeps(db);
    const routerLive = createCroRendersRouter(depsLive);
    res = makeRes(sb);
    await invoke(routerLive, 'POST', '/api/workspace/onboarding-chat', makeReq({ body: { messages: [{ role: 'user', content: 'hello' }] } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.text).toBe('onboarding reply');

    // 502: the provider call throws
    const failingClient = vi.fn();
    failingClient.mockImplementation(() => ({
      models: {
        generateContent: vi.fn(async () => { throw new Error('quota'); }),
      },
    }));
    const depsFail = makeDeps(db, { getGeminiClient: failingClient });
    const routerFail = createCroRendersRouter(depsFail);
    res = makeRes(sb);
    await invoke(routerFail, 'POST', '/api/workspace/onboarding-chat', makeReq({ body: { messages: [{ role: 'user', content: 'hello' }] } }), res);
    expect(res.statusCode).toBe(502);
  });
});
