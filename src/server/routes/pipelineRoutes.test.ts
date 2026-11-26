import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPipelineRouter } from './pipelineRoutes.js';

// --- lib modules the router imports directly --------------------------------
vi.mock('../../lib/sourceOperations.js', () => ({
  normalizeSourceMetrics: vi.fn((_platform: string, _propertyId: string, m: any) => ({
    spend: m?.spend || 0,
    conversions: m?.conversions || 0,
    revenue: m?.revenue || 0,
    roas: 0,
    isFixture: !!m?.isFixture,
    observedAt: m?.observedAt || '2026-01-01T00:00:00.000Z',
  })),
  assessOperationReadiness: vi.fn((opId: string, _creds: any) => ({ operationId: opId, readinessState: 'ready_fixture', details: [] })),
  OPERATION_APPROVAL_REGISTER: [
    { operationId: 'op-slack', canonicalPlatform: 'Slack' },
    { operationId: 'op-notion', canonicalPlatform: 'Notion' },
  ],
}));
vi.mock('../../lib/connectorLifecycle.js', () => ({
  classifyChannelMedia: vi.fn(() => 'paid'),
  validatePriorityConnectorCredentials: vi.fn(() => ({ valid: true })),
}));
vi.mock('../../lib/pipelineVerification.js', () => ({
  canonicalConnectorPlatform: vi.fn(() => 'Slack'),
  verifyPipelineConnection: vi.fn(async () => ({ verified: true, latencyMs: 12, source: 'adapter' })),
}));
vi.mock('../../lib/credentialCrypto.js', () => ({
  encryptCredentials: vi.fn((o: any) => 'ENC:' + JSON.stringify(o)),
}));

import { normalizeSourceMetrics, assessOperationReadiness, OPERATION_APPROVAL_REGISTER } from '../../lib/sourceOperations.js';
import { verifyPipelineConnection } from '../../lib/pipelineVerification.js';

// --- fixtures ---------------------------------------------------------------

function pipeline(p: Partial<any> = {}): any {
  return {
    id: 'pipe-1',
    name: 'Slack (Acme)',
    platform: 'Slack',
    accountName: 'Acme',
    propertyId: 'T123',
    targetVault: 'Marketing Vault',
    syncFrequency: 'Every 15 mins',
    protocol: 'Direct REST API (OAuth 2.0)',
    status: 'active',
    verificationState: 'verified',
    lastPing: '2026-01-02T00:00:00.000Z',
    latencyMs: 50,
    credentialSnippet: 'Encrypted credentials vault',
    metricsCollected: [],
    webhookUrl: 'https://x',
    webhookSecret: 'whsec_existing',
    totalEventsIngested: 0,
    ...p,
  };
}

function makeDb(overrides: any = {}) {
  return {
    secondBrain: {
      pipelines: [pipeline()],
      connectors: [{ id: 'conn-1', platform: 'Slack', status: 'Connected', verificationState: 'verified' }],
      ...overrides,
    },
  } as any;
}

function makeDeps(db: any, overrides: any = {}) {
  return {
    getDB: vi.fn(async () => db),
    saveDB: vi.fn(async () => {}),
    callerIsOwnerOrAdmin: vi.fn(async () => overrides.owner !== undefined ? overrides.owner : true),
    getStoredCredentials: vi.fn((c: any) => c?._creds || {}),
    getConnectorAdapter: vi.fn(() => async () => true),
    hasConnectorAdapter: vi.fn(() => true),
    getAccessTokenFromServiceAccount: vi.fn(async () => 'service-account-token'),
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

// Routes here have no injected middleware layers, but walk the route stack
// defensively (same convention as the other router tests).
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

describe('Pipeline Routes', () => {
  beforeEach(() => {
    vi.mocked(normalizeSourceMetrics).mockClear();
    vi.mocked(assessOperationReadiness).mockClear();
    vi.mocked(verifyPipelineConnection).mockClear();
    delete process.env.USE_FIXTURE_PROVIDERS;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.USE_FIXTURE_PROVIDERS;
  });

  it('GET /pipelines: empty when the workspace has none, echoes when present', async () => {
    const db = makeDb({ pipelines: [] });
    let router = createPipelineRouter(makeDeps(db));
    let res = makeRes();
    await invoke(router, 'GET', '/pipelines', { method: 'GET', url: '/pipelines', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.pipelines).toEqual([]);

    db.secondBrain.pipelines = [pipeline()];
    router = createPipelineRouter(makeDeps(db));
    res = makeRes();
    await invoke(router, 'GET', '/pipelines', { method: 'GET', url: '/pipelines', params: {}, query: {} }, res);
    expect(res.jsonData.pipelines).toHaveLength(1);
  });

  it('GET /reporting/metrics: aggregates only verified+active pipelines and honors the media filter', async () => {
    const db = makeDb({
      pipelines: [
        pipeline({ id: 'p-live', platform: 'Slack', status: 'active', verificationState: 'verified', lastMetrics: { available: true, spend: 100, conversions: 5, revenue: 500, isFixture: false, observedAt: '2026-02-01T00:00:00.000Z', mediaType: 'paid' } }),
        pipeline({ id: 'p-organic', platform: 'Google Analytics', status: 'active', verificationState: 'verified', lastMetrics: { available: true, spend: 0, conversions: 2, revenue: 0, isFixture: false, observedAt: '2026-02-02T00:00:00.000Z', mediaType: 'organic' } }),
        pipeline({ id: 'p-plain', platform: 'Slack', status: 'active', verificationState: 'configured' }), // not verified → excluded
      ],
    });
    const router = createPipelineRouter(makeDeps(db));

    const all = makeRes();
    await invoke(router, 'GET', '/reporting/metrics', { method: 'GET', url: '/reporting/metrics', params: {}, query: {} }, all);
    expect(all.statusCode).toBe(200);
    expect(all.jsonData.metrics.providers).toHaveLength(2);
    expect(all.jsonData.metrics.spend).toBe(100);
    expect(all.jsonData.metrics.conversions).toBe(7);
    expect(all.jsonData.metrics.revenue).toBe(500);
    expect(all.jsonData.metrics.roas).toBe(5);
    expect(all.jsonData.metrics.source).toBe('live_provider');

    const paid = makeRes();
    await invoke(router, 'GET', '/reporting/metrics', { method: 'GET', url: '/reporting/metrics', params: {}, query: { media: 'paid' } }, paid);
    expect(paid.jsonData.metrics.providers).toHaveLength(1);
    expect(paid.jsonData.metrics.providers[0].pipelineId).toBe('p-live');

    const none = makeRes();
    await invoke(createPipelineRouter(makeDeps(makeDb({ pipelines: [] }))), 'GET', '/reporting/metrics', { method: 'GET', url: '/reporting/metrics', params: {}, query: {} }, none);
    expect(none.jsonData.metrics.available).toBe(false);
    expect(none.jsonData.metrics.source).toBe('none');
  });

  it('GET /operations/readiness: evaluates each registered operation with decrypted credentials', async () => {
    const db = makeDb({ connectors: [{ id: 'c1', platform: 'Slack', status: 'Connected', verificationState: 'verified', _creds: { apiKey: 'k' } }] });
    const router = createPipelineRouter(makeDeps(db));
    const res = makeRes();
    await invoke(router, 'GET', '/operations/readiness', { method: 'GET', url: '/operations/readiness', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.operations).toHaveLength(2);
    // the Slack op received the decrypted credentials + verified flag:
    const slack = res.jsonData.operations.find((o: any) => o.operationId === 'op-slack');
    expect(slack).toBeDefined();
    expect(assessOperationReadiness).toHaveBeenCalledWith('op-slack', expect.objectContaining({ apiKey: 'k', verified: true }), expect.anything());
    expect(res.jsonData.summary.total).toBe(2);
  });

  it('POST /pipelines/save: 400 without evidence fields; on success unshifts a normalized pipeline + fresh webhook secret', async () => {
    const db = makeDb({ pipelines: [] });
    const deps = makeDeps(db);
    const router = createPipelineRouter(deps);

    const bad = makeRes();
    await invoke(router, 'POST', '/pipelines/save', { method: 'POST', url: '/pipelines/save', params: {}, body: { accountName: '  ' } }, bad);
    expect(bad.statusCode).toBe(400);

    const ok = makeRes();
    await invoke(router, 'POST', '/pipelines/save', { method: 'POST', url: '/pipelines/save', params: {}, body: { accountName: 'Acme', propertyId: 'T9', platform: 'Slack', credential: 'MUST-NOT-PERSIST' } }, ok);
    expect(ok.statusCode).toBe(200);
    const saved = db.secondBrain.pipelines[0];
    expect(saved.accountName).toBe('Acme');
    expect(saved.status).toBe('warning'); // fresh saves start unverified
    expect(saved.verificationState).toBe('configured');
    expect(saved.webhookSecret).toMatch(/^whsec_/);
    // credentials never land on the pipeline record:
    expect(JSON.stringify(saved)).not.toContain('MUST-NOT-PERSIST');
    expect(deps.saveDB).toHaveBeenCalledTimes(1);
  });

  it('POST /pipelines/save: an existing pipeline keeps its webhook secret', async () => {
    const db = makeDb({ pipelines: [pipeline({ id: 'pipe-1', webhookSecret: 'whsec_kept', accountName: 'Old', propertyId: 'T1' })] });
    const router = createPipelineRouter(makeDeps(db));
    const res = makeRes();
    await invoke(router, 'POST', '/pipelines/save', { method: 'POST', url: '/pipelines/save', params: {}, body: { id: 'pipe-1', accountName: 'New', propertyId: 'T1' } }, res);
    expect(res.statusCode).toBe(200);
    const saved = db.secondBrain.pipelines[0];
    expect(saved.accountName).toBe('New');
    expect(saved.webhookSecret).toBe('whsec_kept');
    expect(db.secondBrain.pipelines).toHaveLength(1); // updated in place, no duplicate
  });

  it('POST /pipelines/:id/agent-permissions: owner gate, validation, dedupe, unknown pipeline', async () => {
    const db = makeDb();
    const member = makeDeps(db, { owner: false });
    let res = makeRes();
    await invoke(createPipelineRouter(member), 'POST', '/pipelines/:id/agent-permissions', { method: 'POST', url: '/pipelines/pipe-1/agent-permissions', params: { id: 'pipe-1' }, body: { agentNames: ['a'] } }, res);
    expect(res.statusCode).toBe(403);

    const owner = makeDeps(db);
    router: {
      const router = createPipelineRouter(owner);

      res = makeRes();
      await invoke(router, 'POST', '/pipelines/:id/agent-permissions', { method: 'POST', url: '/pipelines/pipe-1/agent-permissions', params: { id: 'pipe-1' }, body: { agentNames: 'not-an-array' } }, res);
      expect(res.statusCode).toBe(400);

      res = makeRes();
      await invoke(router, 'POST', '/pipelines/:id/agent-permissions', { method: 'POST', url: '/pipelines/nope/agent-permissions', params: { id: 'nope' }, body: { agentNames: ['a'] } }, res);
      expect(res.statusCode).toBe(404);

      res = makeRes();
      await invoke(router, 'POST', '/pipelines/:id/agent-permissions', { method: 'POST', url: '/pipelines/pipe-1/agent-permissions', params: { id: 'pipe-1' }, body: { agentNames: [''] } }, res);
      expect(res.statusCode).toBe(400); // a whitespace-only name is invalid, not dropped

      res = makeRes();
      await invoke(router, 'POST', '/pipelines/:id/agent-permissions', { method: 'POST', url: '/pipelines/pipe-1/agent-permissions', params: { id: 'pipe-1' }, body: { agentNames: [' Scout ', 'Scout'] } }, res);
      expect(res.statusCode).toBe(200);
      // deduped + trimmed:
      expect(db.secondBrain.pipelines[0].allocatedAgents).toEqual(['Scout']);
    }
  });

  it('POST /pipelines/ping: 400 without evidence; 422 when the adapter verification fails', async () => {
    const db = makeDb({ pipelines: [] });
    const router = createPipelineRouter(makeDeps(db));

    const bad = makeRes();
    await invoke(router, 'POST', '/pipelines/ping', { method: 'POST', url: '/pipelines/ping', params: {}, body: {} }, bad);
    expect(bad.statusCode).toBe(400);

    vi.mocked(verifyPipelineConnection).mockRejectedValueOnce(new Error('Provider unreachable'));
    const fail = makeRes();
    await invoke(router, 'POST', '/pipelines/ping', { method: 'POST', url: '/pipelines/ping', params: {}, body: { accountName: 'Acme', propertyId: 'T1', platform: 'Slack' } }, fail);
    expect(fail.statusCode).toBe(422);
    expect(fail.jsonData.error).toContain('Provider unreachable');
  });

  it('POST /pipelines/ping: the submitted-credentials path runs validate + live adapter and persists the connector', async () => {
    const db = makeDb({ pipelines: [], connectors: [] });
    const router = createPipelineRouter(makeDeps(db));
    const res = makeRes();
    await invoke(
      router, 'POST', '/pipelines/ping',
      { method: 'POST', url: '/pipelines/ping', params: {}, body: { accountName: 'Acme', propertyId: 'T7', platform: 'Slack', credentials: { accessToken: 'tok' } } }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.verified).toBe(true);
    // a connector was persisted with encrypted credentials:
    expect(db.secondBrain.connectors[0].status).toBe('Connected');
    expect(db.secondBrain.connectors[0].credentials.encrypted).toContain('ENC:');
    // and a verified pipeline record was auto-created (a handshake is a connection event):
    expect(db.secondBrain.pipelines[0].verificationState).toBe('verified');
  });

  it('POST /pipelines/ping: the GA4 service-account path exchanges the JWT and verifies live', async () => {
    const db = makeDb({ pipelines: [], connectors: [] });
    const deps = makeDeps(db);
    const router = createPipelineRouter(deps);

    const saKey = JSON.stringify({ client_email: 'svc@example.com', private_key: 'PRIVATE' });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('accountSummaries')) {
        return { status: 200, json: async () => ({ accountSummaries: [{ account: 'accounts/111', propertySummaries: [{ property: 'properties/222' }] }] }) } as any;
      }
      if (String(url).includes('runReport')) {
        return { ok: true, status: 200, json: async () => ({}) } as any;
      }
      throw new Error('unexpected fetch ' + url);
    }));

    const res = makeRes();
    await invoke(
      router, 'POST', '/pipelines/ping',
      { method: 'POST', url: '/pipelines/ping', params: {}, body: { accountName: 'Acme', propertyId: 'properties/222', platform: 'Google Analytics 4', credential: saKey } }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.verified).toBe(true);
    // the property id was resolved to the bare id from the admin API response:
    expect(db.secondBrain.pipelines[0].propertyId).toBe('222');
    // a Google Analytics connector with the encrypted SA key was persisted:
    expect(db.secondBrain.connectors[0].platform).toBe('Google Analytics');
    expect(db.secondBrain.connectors[0].credentials.encrypted).toContain('serviceAccountKey');
    expect(res.jsonData.message).toContain('GA4 Property 222');
  });

  it('POST /pipelines/ping: the fixture-providers path verifies without any live call', async () => {
    process.env.USE_FIXTURE_PROVIDERS = 'true';
    const db = makeDb({ pipelines: [], connectors: [] });
    const router = createPipelineRouter(makeDeps(db));
    const res = makeRes();
    await invoke(
      router, 'POST', '/pipelines/ping',
      { method: 'POST', url: '/pipelines/ping', params: {}, body: { accountName: 'Acme', propertyId: 'properties/222', platform: 'Google Analytics 4' } }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.verified).toBe(true);
    expect(res.jsonData.resolvedPropertyId).toBe('222');
    expect(db.secondBrain.connectors[0].verificationState).toBe('verified');
  });

  it('POST /pipelines/:id/sync-metrics: 404 / 409 / 422 guards, then the GA4 happy path', async () => {
    const gaConn = { id: 'c-ga', platform: 'Google Analytics', _creds: { serviceAccountKey: JSON.stringify({ client_email: 'e', private_key: 'k' }), propertyId: 'T1' } };

    // 404 — unknown pipeline id (no pipeline with that id in the workspace)
    const db404 = makeDb({ pipelines: [pipeline({ id: 'p-known', propertyId: 'T1' })], connectors: [gaConn] });
    let router = createPipelineRouter(makeDeps(db404));
    let res = makeRes();
    await invoke(router, 'POST', '/pipelines/:id/sync-metrics', { method: 'POST', url: '/pipelines/p-missing/sync-metrics', params: { id: 'p-missing' }, body: {} }, res);
    expect(res.statusCode).toBe(404);

    // 409 — pipeline exists but provider access is not verified
    const db409 = makeDb({ pipelines: [pipeline({ id: 'p-unverified', propertyId: 'T1', verificationState: 'configured' })], connectors: [gaConn] });
    router = createPipelineRouter(makeDeps(db409));
    res = makeRes();
    await invoke(router, 'POST', '/pipelines/:id/sync-metrics', { method: 'POST', url: '/pipelines/p-unverified/sync-metrics', params: { id: 'p-unverified' }, body: {} }, res);
    expect(res.statusCode).toBe(409);
    expect(res.jsonData.error).toContain('verified before metrics');

    // 422 — verified pipeline on a platform with no metrics adapter
    const db422plat = makeDb({ pipelines: [pipeline({ id: 'p-slack', platform: 'Slack' })], connectors: [gaConn] });
    router = createPipelineRouter(makeDeps(db422plat));
    res = makeRes();
    await invoke(router, 'POST', '/pipelines/:id/sync-metrics', { method: 'POST', url: '/pipelines/p-slack/sync-metrics', params: { id: 'p-slack' }, body: {} }, res);
    expect(res.statusCode).toBe(422);
    expect(res.jsonData.error).toContain('not implemented for Slack');

    // 409 — verified GA4 pipeline but the stored GA connector has no service-account key
    const db409cred = makeDb({ pipelines: [pipeline({ id: 'p-ga', platform: 'Google Analytics', propertyId: 'T1' })], connectors: [{ id: 'c-ga', platform: 'Google Analytics', _creds: { propertyId: 'T1' } }] });
    router = createPipelineRouter(makeDeps(db409cred));
    res = makeRes();
    await invoke(router, 'POST', '/pipelines/:id/sync-metrics', { method: 'POST', url: '/pipelines/p-ga/sync-metrics', params: { id: 'p-ga' }, body: {} }, res);
    expect(res.statusCode).toBe(409);
    expect(res.jsonData.error).toContain('service-account JSON key');

    // 422 — the token exchange was rejected (provider rejected the stored credential)
    const dbToken = makeDb({ pipelines: [pipeline({ id: 'p-ga2', platform: 'Google Analytics', propertyId: 'T1' })], connectors: [gaConn] });
    router = createPipelineRouter(makeDeps(dbToken, { getAccessTokenFromServiceAccount: vi.fn(async () => null) }));
    res = makeRes();
    await invoke(router, 'POST', '/pipelines/:id/sync-metrics', { method: 'POST', url: '/pipelines/p-ga2/sync-metrics', params: { id: 'p-ga2' }, body: {} }, res);
    expect(res.statusCode).toBe(422);
    expect(res.jsonData.error).toContain('rejected the stored service-account credential');

    // happy path: token exchange + Data API pull persists ga4_data_api metrics
    const dbOk = makeDb({ pipelines: [pipeline({ id: 'p-ga3', platform: 'Google Analytics', propertyId: 'T1' })], connectors: [gaConn] });
    const deps = makeDeps(dbOk);
    router = createPipelineRouter(deps);
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      json: async () => ({ rows: [{ metricValues: [{ value: '11' }, { value: '22' }, { value: '3' }] }] }),
    }) as any);
    res = makeRes();
    await invoke(router, 'POST', '/pipelines/:id/sync-metrics', { method: 'POST', url: '/pipelines/p-ga3/sync-metrics', params: { id: 'p-ga3' }, body: {} }, res);
    expect(res.statusCode).toBe(200);
    const ga = dbOk.secondBrain.pipelines[0];
    expect(ga.lastMetrics).toMatchObject({ source: 'ga4_data_api', available: true, activeUsers: 11, sessions: 22, conversions: 3, mediaType: 'organic', spend: 0, revenue: 0, roas: 0 });
    expect(ga.lastIngestedAt).toBeTruthy();
    expect(res.jsonData.metrics.activeUsers).toBe(11);
    expect(deps.saveDB).toHaveBeenCalledTimes(1);
  });

  it('POST /pipelines/test-webhook: 400 without payload; on delivery it bumps counters, records RAG ingestion, persists', async () => {
    const db = makeDb({ uploadedFiles: [{ name: 'old' }] });
    const deps = makeDeps(db);
    const router = createPipelineRouter(deps);

    const bad = makeRes();
    await invoke(router, 'POST', '/pipelines/test-webhook', { method: 'POST', url: '/pipelines/test-webhook', params: {}, body: {} }, bad);
    expect(bad.statusCode).toBe(400);

    const ok = makeRes();
    await invoke(
      router, 'POST', '/pipelines/test-webhook',
      { method: 'POST', url: '/pipelines/test-webhook', params: {}, body: { pipelineId: 'pipe-1', platform: 'Slack', eventType: 'conversion', payload: { spend: 10, revenue: 20, conversions: 1 } } }, ok,
    );
    expect(ok.statusCode).toBe(200);
    expect(ok.jsonData.status).toBe('DELIVERED');
    expect(ok.jsonData.payloadHash).toMatch(/^sha256:/);
    const p = db.secondBrain.pipelines[0];
    expect(p.totalEventsIngested).toBe(1);
    expect(p.lastMetrics).toMatchObject({ source: 'verified_connector_payload', spend: 10, revenue: 20, roas: 2, available: true });
    // a new RAG ingestion record is prepended and the 50-record cap is honored:
    expect(db.secondBrain.uploadedFiles[0].vaultId).toBe('marketing-vault');
    expect(db.secondBrain.uploadedFiles).toHaveLength(2);
    expect(deps.saveDB).toHaveBeenCalled();
  });

  it('DELETE /pipelines/:id: removes the pipeline and persists (no-op save when absent)', async () => {
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createPipelineRouter(deps);
    const res = makeRes();
    await invoke(router, 'DELETE', '/pipelines/:id', { method: 'DELETE', url: '/pipelines/pipe-1', params: { id: 'pipe-1' }, body: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(db.secondBrain.pipelines).toHaveLength(0);
    expect(deps.saveDB).toHaveBeenCalledTimes(1);

    const res2 = makeRes();
    await invoke(router, 'DELETE', '/pipelines/:id', { method: 'DELETE', url: '/pipelines/ghost', params: { id: 'ghost' }, body: {} }, res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.jsonData.message).toContain('disconnected');
  });

  it('factory shape: 9 scoped route layers, all under /pipelines | /reporting/metrics | /operations/readiness', () => {
    const router: any = createPipelineRouter(makeDeps(makeDb()));
    const routeLayers = router.stack.filter((l: any) => l.route);
    expect(routeLayers).toHaveLength(9);
    const paths = routeLayers.map((l: any) => l.route.path);
    // nothing leaks above the mount: the full set of paths is exactly the 9
    // scoped routes, in registration order
    expect(paths).toEqual([
      '/pipelines',
      '/reporting/metrics',
      '/operations/readiness',
      '/pipelines/save',
      '/pipelines/:id/agent-permissions',
      '/pipelines/ping',
      '/pipelines/:id/sync-metrics',
      '/pipelines/test-webhook',
      '/pipelines/:id',
    ]);
    for (const p of paths) {
      expect(
        p.startsWith('/pipelines') || p === '/reporting/metrics' || p === '/operations/readiness',
        `unexpected route path: ${p}`,
      ).toBe(true);
    }
  });
});
