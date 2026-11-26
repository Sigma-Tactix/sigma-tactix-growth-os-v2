import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGscRouter } from './gscRoutes.js';

// --- gscService: the whole 18-symbol surface the router consumes -------------
vi.mock('../../lib/gscService.js', () => ({
  GSC_DEFAULT_SITE_URL: 'https://example.com',
  GSC_REDIRECT_PATH: '/gsc-callback',
  buildGscAuthUrl: vi.fn((o: any) => `https://accounts.google.com/g/oauth?client_id=${o.clientId}&state=${o.state}`),
  canonicalizeGscLoopback: vi.fn((o: string) => o),
  exchangeGscAuthCode: vi.fn(),
  fetchGscAnalyticsPayload: vi.fn(),
  listGscSites: vi.fn(),
  looksSuspiciousGscClientId: vi.fn(() => false),
  maskGscClientId: vi.fn((id: string) => id.slice(0, 4) + '…'),
  normalizeGscSiteUrl: vi.fn((s: string) => s),
  probeGscAuthorize: vi.fn(),
  readGscSettings: vi.fn((db: any) => db.__gscSettings || { connected: false }),
  readGscTokens: vi.fn((db: any) => db.__gscTokens),
  refreshGscTokens: vi.fn(),
  resolveGscOAuthClient: vi.fn((db: any) => db.__gscOAuthClient),
  resolveGscRedirectUri: vi.fn((origin: string) => origin + '/gsc-callback'),
  storeGscTokens: vi.fn((db: any, t: any) => { db.__gscTokens = t; }),
  writeGscSettings: vi.fn((db: any, patch: any) => { db.__gscSettings = { ...(db.__gscSettings || {}), ...patch }; }),
}));
vi.mock('../../lib/credentialCrypto.js', () => ({
  encryptCredentials: vi.fn((o: any) => 'ENC:' + JSON.stringify(o)),
}));

import {
  buildGscAuthUrl,
  exchangeGscAuthCode,
  fetchGscAnalyticsPayload,
  listGscSites,
  maskGscClientId,
  normalizeGscSiteUrl,
  probeGscAuthorize,
  refreshGscTokens,
  resolveGscOAuthClient,
  resolveGscRedirectUri,
} from '../../lib/gscService.js';

// --- fixtures ----------------------------------------------------------------

function makeDb(overrides: any = {}) {
  return {
    __gscSettings: { connected: false } as any,
    __gscTokens: undefined as any,
    __gscOAuthClient: undefined as any,
    ...overrides,
  } as any;
}

function makeDeps(db: any, requireAuthCalls: number[] = []) {
  const getDB = vi.fn(async () => db);
  const saveDB = vi.fn(async () => {});
  // GscRouterDeps.requireAuth is an async middleware (Promise<void>); match it.
  const requireAuth = vi.fn(async (_req: any, _res: any, next: any) => {
    requireAuthCalls.push(1);
    next();
  });
  return { getDB, saveDB, requireAuth };
}

function makeRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    redirects: [] as string[],
    locals: { sb: {}, wsId: 'ws-1', userId: 'user-1' },
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
    redirect(to: string) { res.redirects.push(to); return res; },
  };
  return res;
}

function makeReq(overrides: any = {}) {
  return {
    method: 'GET',
    url: '/',
    params: {},
    query: {},
    body: {},
    protocol: 'https',
    // req.get: no forwarded headers, no origin header → origin = protocol://host
    get: vi.fn((h: string) => {
      const m: Record<string, any> = { host: 'app.example.com' };
      return m[h];
    }),
    ...overrides,
  } as any;
}

// Walk the route stack (handles per-route requireAuth layers) and await async
// handler results — same convention as the other router tests.
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

const savedClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;

describe('GSC Routes', () => {
  beforeEach(() => {
    vi.mocked(buildGscAuthUrl).mockClear();
    vi.mocked(exchangeGscAuthCode).mockClear();
    vi.mocked(fetchGscAnalyticsPayload).mockClear();
    vi.mocked(listGscSites).mockClear();
    vi.mocked(probeGscAuthorize).mockClear();
    vi.mocked(refreshGscTokens).mockClear();
    vi.mocked(resolveGscOAuthClient).mockClear();
    vi.mocked(normalizeGscSiteUrl).mockImplementation((s: string) => s);
    vi.mocked(resolveGscRedirectUri).mockImplementation((origin: string) => origin + '/gsc-callback');
    vi.mocked(maskGscClientId).mockImplementation((id: string) => id.slice(0, 4) + '…');
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
  });
  afterEach(() => {
    if (savedClientId === undefined) delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    else process.env.GOOGLE_OAUTH_CLIENT_ID = savedClientId;
  });

  it('auth shape: the 7 data routes carry a per-route requireAuth layer; /auth and /callback do not', () => {
    const gated = ['GET /status', 'GET /diagnostics', 'POST /preflight', 'POST /connect', 'POST /token-exchange', 'POST /disconnect', 'GET /analytics'];
    const public_ = ['GET /auth', 'GET /callback'];
    const router: any = createGscRouter(makeDeps(makeDb()));
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(9);
    for (const spec of gated) {
      const [m, p] = spec.split(' ');
      const layer = layers.find((l: any) => l.route.path === p && l.route.methods?.[m.toLowerCase()]);
      expect(layer.route.stack).toHaveLength(2); // [requireAuth, handler]
      expect(typeof layer.route.stack[0].handle).toBe('function');
    }
    for (const spec of public_) {
      const [m, p] = spec.split(' ');
      const layer = layers.find((l: any) => l.route.path === p && l.route.methods?.[m.toLowerCase()]);
      expect(layer.route.stack).toHaveLength(1); // [handler] — no auth layer
      expect(['/auth', '/callback']).toContain(p);
    }
  });

  it('GET /status: reports settings, grant presence, oauth config and the canonical redirect URI', async () => {
    const db = makeDb({
      __gscSettings: { connected: true, siteUrl: 'sc-domain:acme.com', verificationState: 'verified' },
      __gscTokens: { accessToken: 't' },
      __gscOAuthClient: { clientId: 'id', clientSecret: 's' },
    });
    const router = createGscRouter(makeDeps(db));
    const res = makeRes();
    await invoke(router, 'GET', '/status', makeReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      connected: true,
      siteUrl: 'sc-domain:acme.com',
      verificationState: 'verified',
      hasGrant: true,
      oauthConfigured: true,
      redirectUri: 'https://app.example.com/gsc-callback',
    });
  });

  it('GET /diagnostics: surfaces the stored-vs-effective redirect match and masked client id', async () => {
    const db = makeDb({
      __gscSettings: { connected: true, siteUrl: 'x', oauthRedirectUri: 'https://app.example.com/gsc-callback' },
      __gscOAuthClient: { clientId: 'googlewebid', clientSecret: 's' },
    });
    const router = createGscRouter(makeDeps(db));
    const res = makeRes();
    await invoke(router, 'GET', '/diagnostics', makeReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.redirectUriMatchesStored).toBe(true);
    expect(res.jsonData.clientIdMasked).toBe('goog…');
    expect(res.jsonData.oauthConfigured).toBe(true);
  });

  it('POST /preflight: 503 when the redirect URI is unresolvable; reports a missing client id; passes through the probe verdict', async () => {
    const db = makeDb();
    const router = createGscRouter(makeDeps(db));

    vi.mocked(resolveGscRedirectUri).mockReturnValueOnce('');
    let res = makeRes();
    await invoke(router, 'POST', '/preflight', makeReq({ method: 'POST', body: { clientId: 'c' } }), res);
    expect(res.statusCode).toBe(503);
    expect(res.jsonData.code).toBe('redirect_uri_unresolvable');

    vi.mocked(probeGscAuthorize).mockResolvedValueOnce({ ok: true, code: 'ok' });
    res = makeRes();
    await invoke(router, 'POST', '/preflight', makeReq({ method: 'POST', body: {} }), res);
    expect(res.jsonData.ok).toBe(false);
    expect(res.jsonData.code).toBe('missing_client_id');

    vi.mocked(probeGscAuthorize).mockResolvedValueOnce({ ok: true, code: 'ok' });
    res = makeRes();
    await invoke(router, 'POST', '/preflight', makeReq({ method: 'POST', body: { clientId: ' abc ' } }), res);
    expect(res.jsonData.ok).toBe(true);
    expect(res.jsonData.clientIdMasked).toBe('abc…');
    expect(probeGscAuthorize).toHaveBeenLastCalledWith({ clientId: 'abc', redirectUri: 'https://app.example.com/gsc-callback' });
  });

  it('POST /connect: 400 without a site URL; 400 on mismatched id/secret; success mints state + OAuth URL', async () => {
    const db = makeDb();
    const router = createGscRouter(makeDeps(db));

    let res = makeRes();
    await invoke(router, 'POST', '/connect', makeReq({ method: 'POST', body: {} }), res);
    expect(res.statusCode).toBe(400);

    res = makeRes();
    await invoke(router, 'POST', '/connect', makeReq({ method: 'POST', body: { siteUrl: 'sc-domain:a.com', clientId: 'id-only' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('both an OAuth Client ID and Client Secret');

    // success sub-case: a resolvable OAuth client + a passing preflight probe,
    // so the OAuth consent URL is minted and returned.
    db.__gscOAuthClient = { clientId: 'id', clientSecret: 'secret' };
    vi.mocked(probeGscAuthorize).mockResolvedValueOnce({ ok: true, code: 'ok' });
    res = makeRes();
    await invoke(router, 'POST', '/connect', makeReq({ method: 'POST', body: { siteUrl: 'sc-domain:a.com', clientId: 'id', clientSecret: 'secret' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.redirectUri).toBe('https://app.example.com/gsc-callback');
    expect(res.jsonData.authUrl).toBe('https://accounts.google.com/g/oauth?client_id=id&state=' + db.__gscSettings.oauthState);
    expect(db.__gscSettings.verificationState).toBe('configured'); // no prior verified grant
    expect(db.__gscSettings.oauthClientEncrypted).toBe('ENC:{"clientId":"id","clientSecret":"secret"}');

    // without any resolvable client the same call still succeeds but reports
    // "OAuth not configured" and no auth URL (the honest empty-URL path).
    db.__gscOAuthClient = undefined;
    vi.mocked(probeGscAuthorize).mockResolvedValueOnce({ ok: true, code: 'ok' });
    res = makeRes();
    await invoke(router, 'POST', '/connect', makeReq({ method: 'POST', body: { siteUrl: 'sc-domain:a.com' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.authUrl).toBeNull();
    expect(res.jsonData.error).toContain('Google OAuth is not configured');
  });

  it('POST /token-exchange: 409 not connected, 400 missing code, 400 state mismatch, 503 no client', async () => {
    const db = makeDb({ __gscSettings: { connected: false, oauthState: 'st' } });
    const router = createGscRouter(makeDeps(db));
    let res = makeRes();
    await invoke(router, 'POST', '/token-exchange', makeReq({ method: 'POST', body: { code: 'c', state: 'st' } }), res);
    expect(res.statusCode).toBe(409);

    db.__gscSettings = { connected: true, oauthState: 'st' };
    res = makeRes();
    await invoke(router, 'POST', '/token-exchange', makeReq({ method: 'POST', body: { state: 'st' } }), res);
    expect(res.statusCode).toBe(400);

    res = makeRes();
    await invoke(router, 'POST', '/token-exchange', makeReq({ method: 'POST', body: { code: 'c', state: 'WRONG' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('state mismatch');

    vi.mocked(resolveGscOAuthClient).mockImplementationOnce(() => null);
    res = makeRes();
    await invoke(router, 'POST', '/token-exchange', makeReq({ method: 'POST', body: { code: 'c', state: 'st' } }), res);
    expect(res.statusCode).toBe(503);
  });

  it('POST /token-exchange: a rejected grant persists a failed verification with the exact redirect URI', async () => {
    const db = makeDb({
      __gscSettings: { connected: true, oauthState: 'st', oauthRedirectUri: 'https://app.example.com/gsc-callback', siteUrl: 'sc-domain:a.com' },
      __gscOAuthClient: { clientId: 'id', clientSecret: 's' },
    });
    vi.mocked(exchangeGscAuthCode).mockResolvedValueOnce({ ok: false, error: 'invalid_grant: redirect_uri_mismatch' });
    const router = createGscRouter(makeDeps(db));
    const res = makeRes();
    await invoke(router, 'POST', '/token-exchange', makeReq({ method: 'POST', body: { code: 'c', state: 'st' } }), res);
    expect(res.statusCode).toBe(422);
    expect(res.jsonData.error).toContain('redirect_uri_mismatch');
    expect(res.jsonData.error).toContain('https://app.example.com/gsc-callback');
    expect(db.__gscSettings.verificationState).toBe('failed');
  });

  it('POST /token-exchange: success stores tokens and verifies site access', async () => {
    const db = makeDb({
      __gscSettings: { connected: true, oauthState: 'st', oauthRedirectUri: 'https://app.example.com/gsc-callback', siteUrl: 'sc-domain:a.com' },
      __gscOAuthClient: { clientId: 'id', clientSecret: 's' },
    });
    vi.mocked(exchangeGscAuthCode).mockResolvedValueOnce({ ok: true, tokens: { accessToken: 'AT', refreshToken: 'RT', expiresAt: new Date().toISOString() } });
    vi.mocked(listGscSites).mockResolvedValueOnce({ ok: true, status: 200, json: { siteEntries: [{ siteUrl: 'sc-domain:a.com' }] } });
    const router = createGscRouter(makeDeps(db));
    const res = makeRes();
    await invoke(router, 'POST', '/token-exchange', makeReq({ method: 'POST', body: { code: 'c', state: 'st' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({ success: true, connected: true, propertyAccessible: true, verificationState: 'verified', accessibleSites: ['sc-domain:a.com'] });
    expect(db.__gscTokens?.accessToken).toBe('AT');
  });

  it('POST /disconnect: clears the grant + stale flow state but keeps the site URL', async () => {
    const db = makeDb({
      __gscSettings: { connected: true, siteUrl: 'sc-domain:a.com', oauthState: 'st', oauthRedirectUri: 'u', tokensEncrypted: 'ENC', verificationState: 'verified' },
      __gscTokens: { accessToken: 'AT' },
    });
    const deps = makeDeps(db);
    const router = createGscRouter(deps);
    const res = makeRes();
    await invoke(router, 'POST', '/disconnect', makeReq({ method: 'POST', body: {} }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({ success: true, connected: false });
    expect(db.__gscSettings.connected).toBe(false);
    expect(db.__gscSettings.oauthState).toBeUndefined();
    expect(db.__gscSettings.oauthRedirectUri).toBeUndefined();
    expect(db.__gscSettings.tokensEncrypted).toBeUndefined();
    expect(db.__gscSettings.siteUrl).toBe('sc-domain:a.com'); // kept for reconnect
    expect(deps.saveDB).toHaveBeenCalled();
  });

  it('GET /auth (public): error redirects for the 3 unresolvable cases; success builds the OAuth consent URL', async () => {
    const router = createGscRouter(makeDeps(makeDb()));

    let res = makeRes();
    await invoke(router, 'GET', '/auth', makeReq({ query: { state: 'st' } }), res);
    expect(res.redirects[0]).toBe('/seo-aeo?tab=SEARCH_CONSOLE&gsc_error=oauth_not_configured');

    process.env.GOOGLE_OAUTH_CLIENT_ID = 'cid';
    res = makeRes();
    await invoke(router, 'GET', '/auth', makeReq({}), res);
    expect(res.redirects[0]).toBe('/seo-aeo?tab=SEARCH_CONSOLE&gsc_error=missing_state');

    vi.mocked(resolveGscRedirectUri).mockReturnValueOnce('');
    res = makeRes();
    await invoke(router, 'GET', '/auth', makeReq({ query: { state: 'st' } }), res);
    expect(res.redirects[0]).toBe('/seo-aeo?tab=SEARCH_CONSOLE&gsc_error=redirect_uri_unresolvable');

    vi.mocked(resolveGscRedirectUri).mockImplementation((o: string) => o + '/gsc-callback');
    res = makeRes();
    await invoke(router, 'GET', '/auth', makeReq({ query: { state: 'st' } }), res);
    expect(res.redirects[0]).toBe('https://accounts.google.com/g/oauth?client_id=cid&state=st');
  });

  it('GET /callback (public): forwards the code to the SPA, or an honest error redirect', async () => {
    const router = createGscRouter(makeDeps(makeDb()));

    let res = makeRes();
    await invoke(router, 'GET', '/callback', makeReq({ query: { error: 'access_denied' } }), res);
    expect(res.redirects[0]).toBe('/seo-aeo?tab=SEARCH_CONSOLE&gsc_error=access_denied');

    res = makeRes();
    await invoke(router, 'GET', '/callback', makeReq({ query: { code: 'c' } }), res);
    expect(res.redirects[0]).toBe('/seo-aeo?tab=SEARCH_CONSOLE&gsc_error=missing_code');

    res = makeRes();
    await invoke(router, 'GET', '/callback', makeReq({ query: { code: 'the-code', state: 'the-state' } }), res);
    expect(res.redirects[0]).toBe('/seo-aeo?tab=SEARCH_CONSOLE&gsc_code=the-code&gsc_state=the-state');
  });

  it('GET /analytics: 409 when not connected; awaiting_grant when no tokens; 200 live data on fetch', async () => {
    const db = makeDb({ __gscSettings: { connected: false, siteUrl: 'sc-domain:a.com' } });
    const router = createGscRouter(makeDeps(db));
    let res = makeRes();
    await invoke(router, 'GET', '/analytics', makeReq(), res);
    expect(res.statusCode).toBe(409);

    db.__gscSettings.connected = true;
    res = makeRes();
    await invoke(router, 'GET', '/analytics', makeReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({ connected: true, hasData: false, reason: 'awaiting_grant' });

    db.__gscTokens = { accessToken: 'AT' };
    vi.mocked(fetchGscAnalyticsPayload).mockResolvedValueOnce({ ok: true, data: { rows: [1] } } as any);
    res = makeRes();
    await invoke(router, 'GET', '/analytics', makeReq({ query: { range: '7d' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({ rows: [1] });
    expect(fetchGscAnalyticsPayload).toHaveBeenCalledWith(expect.objectContaining({ siteUrl: 'sc-domain:a.com', range: '7d' }));
    expect(db.__gscSettings.verificationState).toBe('verified');
  });

  it('GET /analytics: an expired refreshable token is refreshed before the fetch; a failed refresh with no valid token is an honest 401', async () => {
    const db = makeDb({
      __gscSettings: { connected: true, siteUrl: 'sc-domain:a.com' },
      __gscTokens: { accessToken: 'OLD', refreshToken: 'RT', expiresAt: new Date(Date.now() + 1000).toISOString() },
      __gscOAuthClient: { clientId: 'id', clientSecret: 's' },
    });
    vi.mocked(refreshGscTokens).mockResolvedValueOnce({ ok: true, tokens: { accessToken: 'NEW', expiresAt: new Date(Date.now() + 3600_000).toISOString() } });
    vi.mocked(fetchGscAnalyticsPayload).mockResolvedValueOnce({ ok: true, data: { rows: [] } } as any);
    const router = createGscRouter(makeDeps(db));
    let res = makeRes();
    await invoke(router, 'GET', '/analytics', makeReq(), res);
    expect(res.statusCode).toBe(200);
    expect(db.__gscTokens.accessToken).toBe('NEW'); // merged, refreshToken preserved
    expect(db.__gscTokens.refreshToken).toBe('RT');

    db.__gscTokens = { accessToken: '', refreshToken: 'RT', expiresAt: '1970-01-01T00:00:00Z' };
    vi.mocked(refreshGscTokens).mockResolvedValueOnce({ ok: false, error: 'invalid_grant' });
    res = makeRes();
    await invoke(router, 'GET', '/analytics', makeReq(), res);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData.reason).toBe('token_refresh_failed');
    expect(db.__gscSettings.verificationState).toBe('failed');
  });

  it('GET /analytics: a rejected fetch persists the error and answers 422', async () => {
    const db = makeDb({ __gscSettings: { connected: true, siteUrl: 'sc-domain:a.com' }, __gscTokens: { accessToken: 'AT' } });
    vi.mocked(fetchGscAnalyticsPayload).mockResolvedValueOnce({ ok: false, error: 'API quota exceeded', status: 429 } as any);
    const deps = makeDeps(db);
    const router = createGscRouter(deps);
    const res = makeRes();
    await invoke(router, 'GET', '/analytics', makeReq(), res);
    expect(res.statusCode).toBe(422);
    expect(res.jsonData.reason).toBe('fetch_failed');
    expect(db.__gscSettings.lastError).toBe('API quota exceeded');
    expect(deps.saveDB).toHaveBeenCalled();
  });
});
