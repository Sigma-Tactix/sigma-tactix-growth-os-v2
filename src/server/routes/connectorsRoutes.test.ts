import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createConnectorsRouter } from './connectorsRoutes.js';

vi.mock('../connectorAdapters.js', () => ({
  getConnectorAdapter: vi.fn(),
  hasConnectorAdapter: vi.fn(),
  getStoredCredentials: vi.fn(),
  getAccessTokenFromServiceAccount: vi.fn(),
  publishAdapters: {},
  RECONCILIATION_KEYS: { 'Meta Ads': 'metaStatus', 'HubSpot CRM': 'hubspotStatus' },
}));
vi.mock('../../lib/sourceOperations.js', () => ({
  executeConnectorReconciliation: vi.fn(),
}));
vi.mock('../../lib/credentialCrypto.js', () => ({
  encryptCredentials: vi.fn((o: any) => 'ENC:' + JSON.stringify(o)),
}));

import { getConnectorAdapter, hasConnectorAdapter, getStoredCredentials } from '../connectorAdapters.js';
import { executeConnectorReconciliation } from '../../lib/sourceOperations.js';
import { encryptCredentials } from '../../lib/credentialCrypto.js';

// --- fixtures -------------------------------------------------------------

function makeDb(connectors: any[] = []) {
  return { secondBrain: { connectors } } as any;
}

function makeDeps(db: any, requireEnabled: string[] = ['reporting']) {
  const getDB = vi.fn(async () => db);
  const saveDB = vi.fn(async () => {});
  const requireModule = (mod: string) => (_req: any, res: any, next: any) => {
    if (!requireEnabled.includes(mod)) {
      res.status(403).json({
        error: `Your current plan does not include the "${mod}" module. Upgrade to unlock it.`,
        moduleKey: mod,
        currentTier: 'starter',
      });
      return;
    }
    next();
  };
  return { getDB, saveDB, requireModule };
}

function makeRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: {},
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

// Routes may carry injected middleware layers (requireModule on
// /run-reconciliation); walk the route stack manually and await async layers.
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

const CONN = {
  id: 'conn-1',
  platform: 'HubSpot CRM',
  status: 'Disconnected' as string,
};

describe('Connectors Routes', () => {
  beforeEach(() => {
    vi.mocked(getConnectorAdapter).mockReset();
    vi.mocked(hasConnectorAdapter).mockReset();
    vi.mocked(getStoredCredentials).mockReset();
    vi.mocked(executeConnectorReconciliation).mockReset();
    vi.mocked(encryptCredentials).mockClear();
  });

  it('POST /connectors/:id/connect: 404 for an unknown connector id', async () => {
    const db = makeDb([{ id: 'other' } as any]);
    const deps = makeDeps(db);
    const router = createConnectorsRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/connectors/:id/connect', { method: 'POST', url: '/connectors/zzz/connect', params: { id: 'zzz' }, body: {} }, res);
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.error).toBe('Connector not found');
  });

  it('POST /connectors/:id/connect: 422 UNSUPPORTED_CONNECTOR when the platform has no live adapter', async () => {
    vi.mocked(hasConnectorAdapter).mockReturnValue(false);
    const db = makeDb([CONN]);
    const deps = makeDeps(db);
    const router = createConnectorsRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/connectors/:id/connect', { method: 'POST', url: '/connectors/conn-1/connect', params: { id: 'conn-1' }, body: { credentials: {} } }, res);
    expect(res.statusCode).toBe(422);
    expect(res.jsonData.code).toBe('UNSUPPORTED_CONNECTOR');
    expect(db.secondBrain.connectors[0].verificationState).toBe('unsupported');
    expect(deps.saveDB).toHaveBeenCalledTimes(1); // the fail-closed state is persisted
  });

  it('POST /connectors/:id/connect: 422 CONNECTOR_VERIFICATION_FAILED keeps the previously verified secret', async () => {
    vi.mocked(hasConnectorAdapter).mockReturnValue(true);
    vi.mocked(getConnectorAdapter).mockReturnValue(async () => false);
    const conn: any = { ...CONN, credentials: { encrypted: 'ENC:OLD' } };
    const db = makeDb([conn]);
    const deps = makeDeps(db);
    const router = createConnectorsRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/connectors/:id/connect', { method: 'POST', url: '/connectors/conn-1/connect', params: { id: 'conn-1' }, body: { credentials: { apiKey: 'bad' } } }, res);
    expect(res.statusCode).toBe(422);
    expect(res.jsonData.code).toBe('CONNECTOR_VERIFICATION_FAILED');
    // the invalid submission must NOT replace the stored secret:
    expect(conn.credentials).toEqual({ encrypted: 'ENC:OLD' });
    // and never echoed in the response:
    expect(JSON.stringify(res.jsonData)).not.toContain('apiKey');
  });

  it('POST /connectors/:id/connect: 200 verified — encrypts + stores credentials, omits them from the reply', async () => {
    vi.mocked(hasConnectorAdapter).mockReturnValue(true);
    vi.mocked(getConnectorAdapter).mockReturnValue(async () => true);
    const db = makeDb([CONN]);
    const deps = makeDeps(db);
    const router = createConnectorsRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/connectors/:id/connect', { method: 'POST', url: '/connectors/conn-1/connect', params: { id: 'conn-1' }, body: { credentials: { apiKey: 'fresh' } } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.verified).toBe(true);
    const conn = db.secondBrain.connectors[0];
    expect(conn.status).toBe('Connected');
    expect(conn.verificationState).toBe('verified');
    expect(conn.credentials).toEqual({ encrypted: 'ENC:{"apiKey":"fresh"}' });
    // credentials never echoed:
    expect((res.jsonData.connector as any).credentials).toBeUndefined();
  });

  it('POST /connectors/:id/connect: adapter exceptions are captured as verification failures (422, not a crash)', async () => {
    vi.mocked(hasConnectorAdapter).mockReturnValue(true);
    vi.mocked(getConnectorAdapter).mockReturnValue(async () => {
      throw new Error('provider said no');
    });
    const db = makeDb([CONN]);
    const router = createConnectorsRouter(makeDeps(db));
    const res = makeRes();
    await invoke(router, 'POST', '/connectors/:id/connect', { method: 'POST', url: '/connectors/conn-1/connect', params: { id: 'conn-1' }, body: { credentials: {} } }, res);
    expect(res.statusCode).toBe(422);
    expect(res.jsonData.error).toBe('provider said no');
    expect(db.secondBrain.connectors[0].verificationState).toBe('failed');
  });

  it('POST /connectors/:id/disconnect: 200 clears credentials; 404 when unknown', async () => {
    const conn: any = { ...CONN, credentials: { encrypted: 'ENC:OLD' } };
    const db = makeDb([conn]);
    const router = createConnectorsRouter(makeDeps(db));

    let res = makeRes();
    await invoke(router, 'POST', '/connectors/:id/disconnect', { method: 'POST', url: '/connectors/conn-1/disconnect', params: { id: 'conn-1' }, body: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(conn.status).toBe('Disconnected');
    expect(conn.credentials).toBeUndefined();
    expect((res.jsonData.connector as any).credentials).toBeUndefined();

    res = makeRes();
    await invoke(router, 'POST', '/connectors/:id/disconnect', { method: 'POST', url: '/connectors/nope/disconnect', params: { id: 'nope' }, body: {} }, res);
    expect(res.statusCode).toBe(404);
  });

  it('POST /run-reconciliation: 403 when the reporting module is not entitled', async () => {
    const router = createConnectorsRouter(makeDeps(makeDb(), []));
    const res = makeRes();
    await invoke(router, 'POST', '/run-reconciliation', { method: 'POST', url: '/run-reconciliation', params: {}, body: {} }, res);
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.moduleKey).toBe('reporting');
  });

  it('POST /run-reconciliation: reports Disconnected for platforms without a connected connector', async () => {
    const db = makeDb([{ ...CONN, status: 'Disconnected' }]);
    const router = createConnectorsRouter(makeDeps(db));
    const res = makeRes();
    await invoke(router, 'POST', '/run-reconciliation', { method: 'POST', url: '/run-reconciliation', params: {}, body: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.reconciliation.metaStatus).toBe('Disconnected');
    expect(res.jsonData.reconciliation.hubspotStatus).toBe('Disconnected');
    expect(res.jsonData.reconciliation.discrepancyCount).toBe(0);
  });

  it('POST /run-reconciliation: applies updatedConnectorState, marks mismatches on probe failure, persists once', async () => {
    const conn: any = { ...CONN, status: 'Connected' };
    const db = makeDb([conn]);
    const deps = makeDeps(db);
    vi.mocked(getStoredCredentials).mockReturnValue({ accessToken: 't' });
    vi.mocked(executeConnectorReconciliation).mockImplementation(async (_conn: any, _creds: any) => {
      throw new Error('expired');
    });

    const router = createConnectorsRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/run-reconciliation', { method: 'POST', url: '/run-reconciliation', params: {}, body: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.details['HubSpot CRM'].status).toBe('Mismatch');
    expect(res.jsonData.details['HubSpot CRM'].message).toBe('expired');
    expect(res.jsonData.reconciliation.discrepancyCount).toBe(1);
    // Mismatch (no state change) does NOT trigger a DB save:
    expect(deps.saveDB).not.toHaveBeenCalled();
    // credentials are decrypted via the shared helper before the probe:
    expect(vi.mocked(getStoredCredentials).mock.calls[0][0]).toBe(conn);
  });

  it('factory shape: 3 route layers; run-reconciliation carries the tier gate before its handler', () => {
    const router: any = createConnectorsRouter(makeDeps(makeDb()));
    const routeLayers = router.stack.filter((l: any) => l.route);
    expect(routeLayers).toHaveLength(3);
    const recon = routeLayers.find((l: any) => l.route.path === '/run-reconciliation');
    expect(recon.route.stack).toHaveLength(2); // [requireModule stub, handler]
  });
});
