import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';
import { encryptCredentials } from '../../lib/credentialCrypto.js';
import {
  GSC_DEFAULT_SITE_URL,
  GSC_REDIRECT_PATH,
  buildGscAuthUrl,
  canonicalizeGscLoopback,
  exchangeGscAuthCode,
  fetchGscAnalyticsPayload,
  listGscSites,
  looksSuspiciousGscClientId,
  maskGscClientId,
  normalizeGscSiteUrl,
  probeGscAuthorize,
  readGscSettings,
  readGscTokens,
  refreshGscTokens,
  resolveGscOAuthClient,
  resolveGscRedirectUri,
  storeGscTokens,
  writeGscSettings,
} from '../../lib/gscService.js';
import type { WorkspaceData } from '../../types.js';

// ---------------------------------------------------------------------------
// Google Search Console (GSC) Integration Endpoints — 9 routes covering the
// OAuth connect/token-exchange/disconnect round-trip, live searchAnalytics,
// and the two PUBLIC browser navigations (/auth, /callback) that cannot
// carry a Bearer header.
//
// Extracted from server.ts (P2 increment 9 of the router-extraction program,
// see docs/OPTIMIZATION_AUDIT.md). The two in-file redirect-URI helpers
// (resolveRequestOrigin / resolveGscCallbackUri) co-move here; the gscService
// + credentialCrypto imports move with their sole consumer. Request-scoped
// getDB/saveDB and the per-route requireAuth are INJECTED (they stay in
// server.ts, which owns them).
//
// Mounted under /api/gsc (NOT /api/workspace, so the global
// app.use("/api/workspace", requireAuth) does NOT apply), positioned after
// app.use("/api", apiLimiter). The 7 data routes keep their per-route
// requireAuth; the 2 public OAuth navigations stay unauthenticated —
// preserving the inline auth semantics byte-for-byte.
// ---------------------------------------------------------------------------

export interface GscRouterDeps {
  getDB: (res: Response) => Promise<WorkspaceData>;
  saveDB: (res: Response, data: WorkspaceData) => Promise<void>;
  requireAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createGscRouter(deps: GscRouterDeps): Router {
  const router = Router();
  const { getDB, saveDB, requireAuth } = deps;

// Google Search Console (GSC) Integration Endpoints
//
// The data routes below run behind requireAuth: they read and write the
// workspace blob through getDB()/saveDB(), which need the request-scoped RLS
// client that requireAuth stashes on res.locals. The pre-fix routes were
// registered WITHOUT auth, so getDB() threw on every call, /api/gsc/status
// always answered 500, and the client rendered demo data no matter what the
// connect popups claimed.
//
// /api/gsc/auth and /api/gsc/callback stay public: they are browser
// navigations in the Google OAuth round-trip and cannot carry a Bearer
// header. The callback never touches the database — it bounces the
// authorization code back to the SPA, and the authenticated SPA then POSTs
// it to /api/gsc/token-exchange, so every workspace write still runs under RLS.
function resolveRequestOrigin(req: Request): string {
  // Behind a proxy/TLS-terminator Express sees http + internal host while the
  // public URL is https + external host. Google compares redirect_uri
  // byte-for-byte, so honor the forwarded headers first (their mismatch doc
  // calls out scheme/host/port drift as the #1 cause).
  const forwardedProto = (req.get("x-forwarded-proto") || "").split(",")[0].trim();
  const forwardedHost = (req.get("x-forwarded-host") || "").split(",")[0].trim();
  const protocol = forwardedProto || req.protocol;
  const host = forwardedHost || req.get("host") || "localhost";
  const origin = req.get("origin") && !forwardedHost ? req.get("origin") as string : `${protocol}://${host}`;
  return canonicalizeGscLoopback(origin.replace(/\/+$/, ""));
}

// Canonical public redirect URI for the GSC OAuth round-trip. Google matches
// redirect_uri EXACTLY (scheme + host + port + path), so a per-request origin
// (dev port vs. APP_URL vs. proxy host) is a guaranteed redirect_uri_mismatch.
// Canonical order: APP_URL / APP_ORIGIN / PUBLIC_APP_URL env (deployment
// truth) → request origin (dev / same-origin). The connect/token-exchange
// routes MUST share this helper so authorize and exchange always agree.
function resolveGscCallbackUri(req: Request): string {
  return resolveGscRedirectUri(resolveRequestOrigin(req));
}

router.get("/status", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const gsc = readGscSettings(db);
  res.json({
    connected: gsc.connected,
    siteUrl: gsc.siteUrl,
    verificationState: gsc.verificationState,
    verificationMessage: gsc.verificationMessage,
    hasGrant: Boolean(readGscTokens(db)),
    oauthConfigured: Boolean(resolveGscOAuthClient(db)),
    // The EXACT redirect URI Google must have whitelisted. Surfaced so the
    // Connect dialog can display it (copy button) and so a mismatch is
    // diagnosable without guessing which origin the server used.
    redirectUri: resolveGscCallbackUri(req),
    lastFetched: gsc.lastFetched,
    lastError: gsc.lastError,
  });
});

// Authenticated self-check for the OAuth setup: reports the canonical
// redirect URI, whether an OAuth client is configured, and whether the
// workspace has a stored grant — so redirect_uri_mismatch and sibling setup
// errors are diagnosable from inside the app instead of from Google's
// generic error page.
router.get("/diagnostics", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const gsc = readGscSettings(db);
  const redirectUri = resolveGscCallbackUri(req);
  const storedClient = resolveGscOAuthClient(db);
  // Forwarded-origin visibility: when the app sits behind a proxy the public
  // callback host differs from what Express would see without the headers —
  // surface both so a scheme/host/port drift is diagnosable in-app.
  const forwardedHost = (req.get("x-forwarded-host") || "").split(",")[0].trim() || null;
  const forwardedProto = (req.get("x-forwarded-proto") || "").split(",")[0].trim() || null;
  res.json({
    redirectUri,
    redirectPath: GSC_REDIRECT_PATH,
    oauthConfigured: Boolean(storedClient),
    connected: gsc.connected,
    siteUrl: gsc.siteUrl,
    verificationState: gsc.verificationState,
    hasGrant: Boolean(readGscTokens(db)),
    storedRedirectUri: gsc.oauthRedirectUri || null,
    redirectUriMatchesStored: !gsc.oauthRedirectUri || gsc.oauthRedirectUri === redirectUri,
    clientIdMasked: storedClient ? maskGscClientId(storedClient.clientId) : null,
    clientIdSuspicious: storedClient ? looksSuspiciousGscClientId(storedClient.clientId) : null,
    forwardedProto,
    forwardedHost,
    requestHost: req.get("host") || null,
    appOriginEnv: (process.env.APP_URL || process.env.APP_ORIGIN || process.env.PUBLIC_APP_URL || "").trim() || null,
  });
});

// Verify the EXACT client + redirect URI pair against Google without starting
// a full connect. The Connect dialog calls this after the user edits the
// whitelist in Google Cloud so the verdict ("Google accepts this pair now")
// is visible in-app instead of discovered as another Error 400 page.
router.post("/preflight", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const redirectUri = resolveGscCallbackUri(req);
  if (!redirectUri) {
    res.status(503).json({ ok: null, code: "redirect_uri_unresolvable", detail: "Set APP_URL on the server so a redirect URI can be minted." });
    return;
  }
  const requestedClientId = typeof req.body?.clientId === "string" ? req.body.clientId.trim() : "";
  const storedClient = resolveGscOAuthClient(db);
  const clientId = requestedClientId || storedClient?.clientId || "";
  if (!clientId) {
    res.json({ ok: false, code: "missing_client_id", detail: "No OAuth Client ID available. Paste one in the connect dialog first.", redirectUri });
    return;
  }
  const result = await probeGscAuthorize({ clientId, redirectUri });
  res.json({
    ...result,
    redirectUri,
    clientIdMasked: maskGscClientId(clientId),
    // Warn (never block) when the pasted ID does not look like a Google Web
    // client — a Desktop/Android/iOS client or a truncated paste can NEVER
    // match a web redirect URI, per Google's mismatch rules.
    clientIdSuspicious: looksSuspiciousGscClientId(clientId),
  });
});

router.post("/connect", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const siteUrl = typeof req.body?.siteUrl === "string" && req.body.siteUrl.trim()
    ? req.body.siteUrl.trim()
    : "";
  if (!siteUrl) {
    res.status(400).json({
      success: false,
      error: "A verified Search Console property is required (e.g. sc-domain:example.com or https://example.com/).",
    });
    return;
  }
  const clientId = typeof req.body?.clientId === "string" ? req.body.clientId.trim() : "";
  const clientSecret = typeof req.body?.clientSecret === "string" ? req.body.clientSecret.trim() : "";
  if (Boolean(clientId) !== Boolean(clientSecret)) {
    res.status(400).json({ success: false, error: "Provide both an OAuth Client ID and Client Secret, or neither." });
    return;
  }

  const previous = readGscSettings(db);
  const oauthState = crypto.randomBytes(24).toString("hex");
  // Canonical redirect URI (APP_URL/APP_ORIGIN/PUBLIC_APP_URL → request
  // origin). Stored on the workspace so token-exchange reuses the EXACT same
  // value Google authorized — Google compares authorize/exchange literally.
  const oauthRedirectUri = resolveGscCallbackUri(req);
  if (!oauthRedirectUri) {
    res.status(503).json({
      success: false,
      error: "Cannot determine this app's public URL, so no OAuth redirect URI can be minted. Set APP_URL (e.g. APP_URL=http://localhost:8787) on the server and reconnect.",
    });
    return;
  }
  const alreadyVerified =
    Boolean(readGscTokens(db)) &&
    previous.verificationState === "verified" &&
    normalizeGscSiteUrl(previous.siteUrl || "") === normalizeGscSiteUrl(siteUrl);

  writeGscSettings(db, {
    connected: true,
    siteUrl,
    oauthState,
    oauthRedirectUri,
    verificationState: alreadyVerified ? "verified" : "configured",
    verificationMessage: undefined,
    lastError: undefined,
  });
  if (clientId && clientSecret) {
    writeGscSettings(db, { oauthClientEncrypted: encryptCredentials({ clientId, clientSecret }) });
  }

  const client = resolveGscOAuthClient(db);
  const gsc = readGscSettings(db);
  await saveDB(res, db);

  const authUrl = client
    ? buildGscAuthUrl({ clientId: client.clientId, redirectUri: oauthRedirectUri, state: oauthState })
    : null;

  // Pre-flight (Google's docs: redirect_uri_mismatch is decided at the
  // authorize endpoint): probe the EXACT pair server-to-server BEFORE the
  // browser navigates, so the dialog can show Google's real verdict instead
  // of letting the user hit its dead-end Error 400 page. Fail-open: on any
  // inconclusive probe (ok:null) the authUrl is still returned.
  let preflight: { ok: boolean | null; code?: string; detail?: string } | null = null;
  let effectiveAuthUrl = authUrl;
  if (client) {
    preflight = await probeGscAuthorize({ clientId: client.clientId, redirectUri: oauthRedirectUri });
    if (preflight.ok === false) {
      // Don't send the browser into a guaranteed Google error page.
      effectiveAuthUrl = null;
    }
  }

  res.json({
    success: true,
    connected: true,
    siteUrl,
    verificationState: gsc.verificationState,
    hasGrant: Boolean(readGscTokens(db)),
    oauthConfigured: Boolean(client),
    authUrl: effectiveAuthUrl,
    // Echoed so the dialog can show the EXACT URI the user must whitelist in
    // Google Cloud → Credentials → Authorized redirect URIs.
    redirectUri: oauthRedirectUri,
    clientIdMasked: client ? maskGscClientId(client.clientId) : undefined,
    preflight,
    error: client
      ? preflight?.ok === false
        ? `Google rejected this OAuth setup: ${preflight.code || "authorization_error"}. ${preflight.detail || ""} Whitelist the redirect URI shown in this dialog under client ${maskGscClientId(client.clientId)} → Authorized redirect URIs, then connect again.`
        : undefined
      : "Google OAuth is not configured. Enter a Client ID & Secret in this dialog, or set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET on the server. Without an OAuth client no live Search Console data can be fetched.",
  });
});

// Completes the OAuth grant. Runs authenticated so the token write stays
// inside the caller's RLS-scoped workspace blob. The state nonce minted by
// /api/gsc/connect binds the incoming code to THIS workspace's pending flow
// (CSRF protection for the public callback bounce).
router.post("/token-exchange", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const gsc = readGscSettings(db);
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  const state = typeof req.body?.state === "string" ? req.body.state.trim() : "";

  if (!gsc.connected) {
    res.status(409).json({ success: false, error: "Google Search Console is not connected for this workspace. Start the connection again." });
    return;
  }
  if (!code) {
    res.status(400).json({ success: false, error: "Missing OAuth authorization code." });
    return;
  }
  if (!state || !gsc.oauthState || state !== gsc.oauthState) {
    res.status(400).json({ success: false, error: "OAuth state mismatch — the grant does not match this workspace's pending connection. Start the connection again." });
    return;
  }
  const client = resolveGscOAuthClient(db);
  if (!client) {
    res.status(503).json({ success: false, error: "Google OAuth is not configured (no stored client and no GOOGLE_OAUTH_CLIENT_ID/SECRET on the server)." });
    return;
  }

  // Reuse the URI stored at /api/gsc/connect time — Google requires the
  // exchange's redirect_uri to be byte-identical to the authorize one. The
  // canonical fallback only fires for grants minted before this fix shipped.
  const redirectUri = gsc.oauthRedirectUri || resolveGscCallbackUri(req);
  if (!redirectUri) {
    const message = "Stored OAuth flow has no redirect URI and this app's public URL cannot be determined. Set APP_URL on the server and reconnect.";
    writeGscSettings(db, { verificationState: "failed", verificationMessage: message, lastError: message });
    await saveDB(res, db);
    res.status(503).json({ success: false, error: message });
    return;
  }

  const exchanged = await exchangeGscAuthCode({
    code,
    clientId: client.clientId,
    clientSecret: client.clientSecret,
    redirectUri,
  });
  if (!exchanged.ok || !exchanged.tokens) {
    const raw = exchanged.error || "Google rejected the OAuth grant.";
    // redirect_uri_mismatch is a SETUP error, not a transient one: surface the
    // exact stored URI so the user can whitelist it instead of retrying blind.
    const message = /redirect_uri_mismatch/i.test(raw)
      ? `Google rejected the grant: redirect_uri_mismatch. Add this EXACT redirect URI in Google Cloud → APIs & Services → Credentials → your OAuth client → Authorized redirect URIs, then reconnect: ${redirectUri}`
      : raw;
    writeGscSettings(db, { verificationState: "failed", verificationMessage: message, lastError: message });
    await saveDB(res, db);
    res.status(422).json({ success: false, error: message });
    return;
  }

  storeGscTokens(db, exchanged.tokens);
  const siteUrl = gsc.siteUrl || GSC_DEFAULT_SITE_URL;
  const sites = await listGscSites(exchanged.tokens.accessToken);
  if (!sites.ok) {
    const message = `OAuth grant stored, but the Search Console API rejected the access check: ${sites.error}`;
    writeGscSettings(db, { verificationState: "failed", verificationMessage: message, lastError: message });
    await saveDB(res, db);
    res.status(422).json({ success: false, connected: true, error: message });
    return;
  }

  const entries = sites.json?.siteEntries || [];
  const accessible = entries.some(entry => normalizeGscSiteUrl(entry.siteUrl) === normalizeGscSiteUrl(siteUrl));
  const message = accessible
    ? undefined
    : `The granted Google account cannot read "${siteUrl}". Properties it can read: ${entries.slice(0, 8).map(entry => entry.siteUrl).join(", ") || "(none returned)"
    }${entries.length > 8 ? " …" : ""}`;
  writeGscSettings(db, {
    verificationState: accessible ? "verified" : "failed",
    verificationMessage: message,
    lastError: message,
  });
  await saveDB(res, db);
  res.json({
    success: accessible,
    connected: true,
    siteUrl,
    propertyAccessible: accessible,
    accessibleSites: entries.map(entry => entry.siteUrl),
    verificationState: accessible ? "verified" : "failed",
    verificationMessage: message,
    error: message,
  });
});

router.post("/disconnect", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  // Keep siteUrl + the stored OAuth client so a reconnect does not force the
  // user to re-enter credentials; drop the grant and every claim of state —
  // including the minted redirect URI, which would otherwise go stale.
  writeGscSettings(db, {
    connected: false,
    tokensEncrypted: undefined,
    oauthState: undefined,
    oauthRedirectUri: undefined,
    verificationState: undefined,
    verificationMessage: undefined,
    lastFetched: undefined,
    lastError: undefined,
  });
  await saveDB(res, db);
  res.json({ success: true, connected: false });
});

// Public: browser navigation during the OAuth round-trip (no Bearer header
// possible). With no `state` minted by an authenticated /api/gsc/connect call
// there is nothing to bind the grant to, so this route answers honestly with
// an error redirect instead of the old fake "gsc_connected=true" bounce.
// Uses the same canonical redirect URI as /api/gsc/connect so both Google
// consent URLs agree byte-for-byte.
router.get("/auth", (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const redirectUri = resolveGscCallbackUri(req);
  if (!clientId || !state || !redirectUri) {
    const reason = !clientId ? "oauth_not_configured" : !state ? "missing_state" : "redirect_uri_unresolvable";
    res.redirect(`/seo-aeo?tab=SEARCH_CONSOLE&gsc_error=${reason}`);
    return;
  }
  res.redirect(
    buildGscAuthUrl({
      clientId,
      redirectUri,
      state,
    }),
  );
});

// Public: Google redirects here with the authorization code. Touches NO
// database — it only forwards code+state to the authenticated SPA, which
// POSTs them to /api/gsc/token-exchange.
router.get("/callback", (req: Request, res: Response) => {
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const oauthError = typeof req.query.error === "string" ? req.query.error : "";
  if (oauthError) {
    res.redirect(`/seo-aeo?tab=SEARCH_CONSOLE&gsc_error=${encodeURIComponent(oauthError)}`);
    return;
  }
  if (!code || !state) {
    res.redirect("/seo-aeo?tab=SEARCH_CONSOLE&gsc_error=missing_code");
    return;
  }
  res.redirect(`/seo-aeo?tab=SEARCH_CONSOLE&gsc_code=${encodeURIComponent(code)}&gsc_state=${encodeURIComponent(state)}`);
});

// Real searchAnalytics queries for the connected property. Structured
// honesty: never returns fabricated numbers. Four outcomes —
//   409   not connected (client switches to demo + DEMO DATA badge)
//   200   {connected, hasData:false, reason:'awaiting_grant'} — connected but
//         no OAuth grant stored yet
//   422   connected but Google rejected the fetch (client shows the error)
//   200   full GSCAnalyticsResponse — client renders LIVE
router.get("/analytics", requireAuth, async (req: Request, res: Response) => {
  const db = await getDB(res);
  const gsc = readGscSettings(db);
  if (!gsc.connected) {
    res.status(409).json({ connected: false, error: "Google Search Console is not connected." });
    return;
  }

  const client = resolveGscOAuthClient(db);
  let tokens = readGscTokens(db);

  // Refresh the access token when it is (nearly) expired. A failed refresh
  // with a still-valid access token degrades to the fetch below; a failed
  // refresh with no usable token is an honest 401, not demo data.
  if (tokens?.refreshToken && client) {
    const expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt).getTime() : 0;
    if (!expiresAt || expiresAt <= Date.now() + 60_000) {
      const refreshed = await refreshGscTokens({
        clientId: client.clientId,
        clientSecret: client.clientSecret,
        refreshToken: tokens.refreshToken,
      });
      if (refreshed.ok && refreshed.tokens) {
        tokens = { ...tokens, ...refreshed.tokens, refreshToken: refreshed.tokens.refreshToken || tokens.refreshToken };
        storeGscTokens(db, tokens);
        await saveDB(res, db);
      } else if (!tokens.accessToken || expiresAt <= Date.now()) {
        const message = `Stored Google tokens expired and the refresh failed: ${refreshed.error}. Reconnect Google Search Console.`;
        writeGscSettings(db, { verificationState: "failed", verificationMessage: message, lastError: message });
        await saveDB(res, db);
        res.status(401).json({ connected: true, hasData: false, reason: "token_refresh_failed", error: message });
        return;
      }
    }
  }

  if (!tokens?.accessToken) {
    res.json({
      connected: true,
      hasData: false,
      reason: "awaiting_grant",
      message: "Connected — no Google OAuth grant stored yet. Complete the OAuth flow (connect with a Client ID/Secret) to fetch live Search Console data.",
    });
    return;
  }

  const siteUrl = gsc.siteUrl || GSC_DEFAULT_SITE_URL;
  const result = await fetchGscAnalyticsPayload({
    accessToken: tokens.accessToken,
    siteUrl,
    range: typeof req.query.range === "string" ? req.query.range : "28d",
  });
  if (!result.ok) {
    const errorMsg = (result as { ok: false; error: string; status: number }).error;
    writeGscSettings(db, { lastError: errorMsg });
    await saveDB(res, db);
    res.status(422).json({ connected: true, hasData: false, reason: "fetch_failed", error: errorMsg, siteUrl });
    return;
  }

  writeGscSettings(db, {
    lastFetched: new Date().toISOString(),
    lastError: undefined,
    verificationState: "verified",
    verificationMessage: undefined,
  });
  await saveDB(res, db);
  res.json(result.data);
});
  return router;
}
