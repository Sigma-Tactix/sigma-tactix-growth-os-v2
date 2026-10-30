import { encryptCredentials, decryptCredentials } from "./credentialCrypto";
import type { WorkspaceData, GscWorkspaceSettings, GscOAuthClientConfig, GscTokens } from "../types";

// ============================================================================
// Google Search Console service (server-side).
//
// Deep module behind the /api/gsc/* routes in server.ts. Holds three kinds of
// responsibility so the routes stay thin:
//   1. Workspace-blob settings access (read/normalize/write, legacy migration)
//      — secrets are AES-256-GCM wrapped via credentialCrypto, never raw.
//   2. OAuth 2.0 plumbing (consent URL, code exchange, refresh).
//   3. Search Analytics API queries + honest response shaping.
//
// Honesty invariant: this module never fabricates data. When live data cannot
// be fetched it returns a structured reason (awaiting_grant / fetch_failed)
// that the client renders as an explicit state — demo numbers are only ever
// generated client-side when the workspace is genuinely disconnected.
// ============================================================================

export const GSC_DEFAULT_SITE_URL = "sc-domain:sigmatactix.com";
export const GSC_OAUTH_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
export const GSC_REDIRECT_PATH = "/api/gsc/callback";

/**
 * Google treats http://localhost and http://127.0.0.1 as DISTINCT redirect
 * URIs (byte-for-byte matching per their mismatch doc) — yet they reach the
 * same dev server. Canonicalize loopback to "localhost" so a grant minted
 * from one spelling does not fail when the browser uses the other.
 */
export function canonicalizeGscLoopback(origin: string): string {
  return origin
    .replace(/^http:\/\/127\.0\.0\.1(?::|\/|$)/i, (m) => m.replace("127.0.0.1", "localhost"))
    .replace(/^http:\/\/\[::1\](?::|\/|$)/i, (m) => m.replace("[::1]", "localhost"));
}

/** Env names that may carry the canonical public origin (first non-empty wins). */
const GSC_APP_ORIGIN_ENV_VARS = ["APP_URL", "APP_ORIGIN", "PUBLIC_APP_URL"] as const;

/**
 * Normalizes a public origin: trims whitespace, strips trailing slashes.
 * Lowercases the hostname (hosts are case-insensitive but Google compares the
 * full URI byte-for-byte, so a mixed-case Host header would poison the mint).
 */
export function normalizeGscOrigin(origin: string): string {
  const trimmed = origin.trim().replace(/\/+$/, "");
  try {
    const url = new URL(trimmed);
    url.hostname = url.hostname.toLowerCase();
    return url.toString().replace(/\/+$/, "");
  } catch {
    return trimmed;
  }
}

/**
 * Canonical public origin for the OAuth round-trip.
 * Prefers APP_URL / APP_ORIGIN / PUBLIC_APP_URL (deployment truth) so the
 * redirect URI is STABLE across requests. Falls back to the supplied request
 * origin (dev / same-origin serving) when no env is set. Returns "" when
 * neither is available so callers can answer honestly instead of minting a
 * broken URI.
 */
export function resolveGscAppOrigin(requestOrigin?: string): string {
  for (const name of GSC_APP_ORIGIN_ENV_VARS) {
    const raw = (process.env[name] || "").trim();
    // The repo ships APP_URL="MY_..." style placeholders in some setups —
    // never mint a redirect URI from a placeholder.
    if (raw && !raw.startsWith("MY_")) {
      // Google compares the URI byte-for-byte: http://localhost:3000 and
      // http://127.0.0.1:3000 are DIFFERENT whitelists. Canonicalize to
      // "localhost" so the grant the user pastes always matches the mint.
      return canonicalizeGscLoopback(normalizeGscOrigin(raw));
    }
  }
  const fallback = (requestOrigin || "").trim();
  return fallback ? canonicalizeGscLoopback(normalizeGscOrigin(fallback)) : "";
}

/**
 * Google OAuth client-ID shape check (their mismatch doc: Web-application
 * clients use Authorized redirect URIs; a truncated/pasted-wrong value or a
 * non-Web client type can NEVER match a web-server redirect URI). This only
 * WARNS, never blocks — it flags values that do not look like a Web client ID
 * so the dialog can say so before the browser hits Google's Error 400 page.
 */
export function looksSuspiciousGscClientId(clientId: string): boolean {
  const id = clientId.trim();
  if (!id) return true;
  if (!/\.apps\.googleusercontent\.com$/.test(id)) return true;
  if (/\s/.test(id) || id.length < 30) return true;
  return false;
}

/** The EXACT redirect URI Google must have whitelisted (origin + path). */
export function resolveGscRedirectUri(requestOrigin?: string): string {
  const origin = resolveGscAppOrigin(requestOrigin);
  return origin ? `${origin}${GSC_REDIRECT_PATH}` : "";
}

export type GscDateRange = "7d" | "28d" | "90d" | "16m";

export interface GscResolvedRange {
  startDate: string;
  endDate: string;
  days: number;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Maps the UI's range presets onto GSC searchAnalytics date bounds. */
export function resolveGscDateRange(range: string): GscResolvedRange {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "16m" ? 480 : 28;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  return { startDate: isoDate(startDate), endDate: isoDate(endDate), days };
}

/** Site keys are case-insensitive and must not carry a trailing slash. */
export function normalizeGscSiteUrl(siteUrl: string): string {
  return siteUrl.trim().replace(/\/+$/, "").toLowerCase();
}

/**
 * Read GSC settings from the workspace blob. Falls back to the legacy flat
 * fields (`settings.gscConnected` / `gscSiteUrl` / `gscLastFetched`) written
 * by the pre-fix routes so existing workspaces keep their connection state.
 */
export function readGscSettings(db: WorkspaceData): GscWorkspaceSettings {
  const settings = (db as unknown as { settings?: Record<string, unknown> }).settings;
  const raw = settings?.gsc as GscWorkspaceSettings | undefined;
  if (raw && typeof raw === "object" && "connected" in raw) {
    return { siteUrl: GSC_DEFAULT_SITE_URL, ...raw };
  }
  const legacy = settings as
    | { gscConnected?: unknown; gscSiteUrl?: unknown; gscLastFetched?: unknown }
    | undefined;
  return {
    connected: Boolean(legacy?.gscConnected),
    siteUrl: typeof legacy?.gscSiteUrl === "string" && legacy.gscSiteUrl.trim()
      ? legacy.gscSiteUrl
      : GSC_DEFAULT_SITE_URL,
    lastFetched: typeof legacy?.gscLastFetched === "string" ? legacy.gscLastFetched : undefined,
  };
}

export function writeGscSettings(
  db: WorkspaceData,
  patch: Partial<GscWorkspaceSettings>,
): GscWorkspaceSettings {
  const current = readGscSettings(db);
  const next: GscWorkspaceSettings = { ...current, ...patch };
  const settings = ((db as unknown as { settings?: Record<string, unknown> }).settings ??= {});
  settings.gsc = next;
  return next;
}

/**
 * The OAuth client used for the consent flow: a workspace-supplied pair
 * (from the connect dialog) wins; otherwise the server env pair. Returns
 * null when neither exists — callers must surface that honestly instead of
 * faking a connection.
 */
export function resolveGscOAuthClient(db: WorkspaceData): GscOAuthClientConfig | null {
  const gsc = readGscSettings(db);
  if (gsc.oauthClientEncrypted) {
    try {
      const dec = decryptCredentials(gsc.oauthClientEncrypted) as unknown as GscOAuthClientConfig;
      if (dec?.clientId && dec?.clientSecret) {
        return { clientId: dec.clientId, clientSecret: dec.clientSecret };
      }
    } catch {
      // Corrupted or re-keyed blob — fall through to the env pair.
    }
  }
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  if (clientId && clientSecret) return { clientId, clientSecret };
  return null;
}

export function buildGscAuthUrl(input: { clientId: string; redirectUri: string; state: string }): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: GSC_OAUTH_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: input.state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Pre-flight: verify client_id + redirect_uri with Google BEFORE the browser
// navigates to the consent screen. Per Google's OAuth web-server docs
// (authorization errors → redirect_uri_mismatch), Google validates the pair at
// the authorize endpoint itself: an unregistered URI bounces to
// accounts.google.com/signin/oauth/error?authError=<base64url> (live probe:
// `Cg5pbnZhbGlkX2NsaWVudA` → "invalid_client"), while an accepted pair is
// 302'd to sign-in/consent. Probing that first hop converts Google's dead-end
// error page into an exact, actionable diagnosis inside the Connect dialog.
// FAIL-OPEN invariant: any network/parsing hiccup returns ok:null so the real
// user-facing flow still runs and reports its own outcome.
// ---------------------------------------------------------------------------

/**
 * Google OAuth client IDs always end in `.apps.googleusercontent.com`.
 * Deliberately NOT policing the numeric prefix — the goal is only to catch
 * pasted Client Secrets (`GOCSPX-…`) and API keys (`AIza…`) early.
 */
const GSC_CLIENT_ID_PATTERN = /\.apps\.googleusercontent\.com$/i;

/** Error codes Google can pack into the authorize bounce. */
const GSC_AUTH_ERROR_CODES = [
  "redirect_uri_mismatch",
  "invalid_client",
  "invalid_request",
  "unauthorized_client",
  "admin_policy_enforcement",
] as const;

export interface GscPreflightResult {
  /** true = Google accepted the pair; false = rejected; null = could not verify. */
  ok: boolean | null;
  code?: string;
  detail?: string;
}

/** `1067897367455-abc…` — enough to identify which client must whitelist the URI. */
export function maskGscClientId(clientId: string): string {
  const trimmed = clientId.trim();
  if (trimmed.length <= 16) return trimmed;
  return `${trimmed.slice(0, 8)}…${trimmed.slice(-28)}`;
}

/**
 * Google packs the OAuth failure into the `authError` query param as base64url
 * with a protobuf-style prefix (0x0a + length + ASCII). Decode it and fall
 * back to scanning the raw value for known codes.
 */
export function decodeGscAuthError(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let decoded = "";
  try {
    decoded = Buffer.from(trimmed, "base64url").toString("latin1");
  } catch {
    decoded = "";
  }
  const haystack = `${trimmed} ${decoded}`;
  for (const code of GSC_AUTH_ERROR_CODES) {
    if (haystack.includes(code)) return code;
  }
  return null;
}

/** Classifies the first hop of the authorize endpoint's response. */
export function classifyGscAuthProbe(input: {
  status: number;
  location?: string | null;
  body?: string | null;
}): GscPreflightResult {
  const { status, location, body } = input;
  if (location) {
    const isGoogleError =
      /accounts\.google\.com\/(?:v\d+\/)?(?:signin\/oauth\/error|o\/error)/i.test(location) ||
      /[?&]authError=/.test(location);
    if (isGoogleError) {
      let code: string | null = null;
      try {
        code = decodeGscAuthError(new URL(location).searchParams.get("authError"));
      } catch {
        // Malformed Location — keep code null and report the generic bucket.
      }
      return {
        ok: false,
        code: code || "oauth_error",
        detail: "Google rejected the authorization request before sign-in.",
      };
    }
    if (/accounts\.google\.com/i.test(location)) {
      // Sign-in / consent — Google accepted this exact client + URI pair.
      return { ok: true };
    }
    return {
      ok: null,
      code: "unexpected_redirect",
      detail: `Google redirected to an unrecognized URL: ${location.slice(0, 160)}`,
    };
  }
  const text = body || "";
  if (text) {
    for (const code of GSC_AUTH_ERROR_CODES) {
      if (text.includes(code)) {
        return { ok: false, code, detail: "Google served an error page instead of the sign-in flow." };
      }
    }
    if (/Error\s*400/i.test(text)) {
      return { ok: false, code: "error_400", detail: "Google served a 400 error page instead of the sign-in flow." };
    }
    if (/<form[^>]+action="[^"]*signin|Sign in with Google/i.test(text)) {
      return { ok: true };
    }
  }
  if (status >= 300 && status < 400) {
    return { ok: null, code: "redirect_without_location", detail: "Redirect carried no Location header." };
  }
  return {
    ok: null,
    code: "unrecognized_response",
    detail: `Google answered HTTP ${status} — could not determine whether the pair is registered.`,
  };
}

/**
 * Server-to-server probe of the authorize endpoint with the EXACT pair the
 * browser would use. No client secret is required (and none is sent) — the
 * authorize endpoint validates only client_id + redirect_uri.
 */
export async function probeGscAuthorize(input: {
  clientId: string;
  redirectUri: string;
}): Promise<GscPreflightResult> {
  const clientId = input.clientId.trim();
  if (!clientId) {
    return { ok: false, code: "missing_client_id", detail: "No OAuth Client ID to verify." };
  }
  if (!GSC_CLIENT_ID_PATTERN.test(clientId)) {
    return {
      ok: false,
      code: "invalid_client_id_format",
      detail:
        "That does not look like a Google OAuth Client ID (expected `<id>.apps.googleusercontent.com`). You may have pasted the Client Secret or an API key.",
    };
  }
  const url = buildGscAuthUrl({ clientId, redirectUri: input.redirectUri, state: "gsc-preflight" });
  try {
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(8000) });
    if (res.status >= 300 && res.status < 400) {
      return classifyGscAuthProbe({ status: res.status, location: res.headers.get("location") });
    }
    const page = await res.text().catch(() => "");
    return classifyGscAuthProbe({ status: res.status, body: page });
  } catch (err) {
    return {
      ok: null,
      code: "probe_failed",
      detail: err instanceof Error ? err.message : "Could not reach Google to verify the pair.",
    };
  }
}

export function readGscTokens(db: WorkspaceData): GscTokens | null {
  const gsc = readGscSettings(db);
  if (!gsc.tokensEncrypted) return null;
  try {
    const dec = decryptCredentials(gsc.tokensEncrypted) as unknown as GscTokens;
    if (dec?.accessToken) return dec;
  } catch {
    // Treat an undecryptable blob as no grant — the reconnect flow issues new tokens.
  }
  return null;
}

export function storeGscTokens(db: WorkspaceData, tokens: GscTokens): void {
  writeGscSettings(db, {
    tokensEncrypted: encryptCredentials(tokens as unknown as Record<string, unknown>),
  });
}

// ---------------------------------------------------------------------------
// Google HTTP plumbing
// ---------------------------------------------------------------------------

export interface GscGoogleResult<T> {
  ok: boolean;
  status: number;
  json?: T;
  error?: string;
}

async function gscFetch<T>(url: string, init: RequestInit): Promise<GscGoogleResult<T>> {
  try {
    const res = await fetch(url, init);
    const json = (await res.json().catch(() => undefined)) as T | undefined;
    if (!res.ok) {
      const message =
        (json as { error?: { message?: string } } | undefined)?.error?.message ||
        `Google returned HTTP ${res.status}`;
      return { ok: false, status: res.status, json, error: message };
    }
    return { ok: true, status: res.status, json };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "Network error reaching Google APIs.",
    };
  }
}

export async function exchangeGscAuthCode(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{ ok: boolean; tokens?: GscTokens; error?: string }> {
  const body = new URLSearchParams({
    code: input.code,
    client_id: input.clientId,
    client_secret: input.clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
  });
  const result = await gscFetch<{ access_token?: string; refresh_token?: string; expires_in?: number; scope?: string }>(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );
  if (!result.ok || !result.json?.access_token) {
    return { ok: false, error: result.error || "Google rejected the authorization code." };
  }
  return {
    ok: true,
    tokens: {
      accessToken: result.json.access_token,
      refreshToken: result.json.refresh_token,
      expiresAt: new Date(Date.now() + Number(result.json.expires_in || 3600) * 1000).toISOString(),
      scope: result.json.scope,
    },
  };
}

export async function refreshGscTokens(input: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<{ ok: boolean; tokens?: GscTokens; error?: string }> {
  const body = new URLSearchParams({
    client_id: input.clientId,
    client_secret: input.clientSecret,
    refresh_token: input.refreshToken,
    grant_type: "refresh_token",
  });
  const result = await gscFetch<{ access_token?: string; expires_in?: number; scope?: string }>(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );
  if (!result.ok || !result.json?.access_token) {
    return { ok: false, error: result.error || "Google rejected the refresh token." };
  }
  return {
    ok: true,
    tokens: {
      accessToken: result.json.access_token,
      refreshToken: input.refreshToken,
      expiresAt: new Date(Date.now() + Number(result.json.expires_in || 3600) * 1000).toISOString(),
      scope: result.json.scope,
    },
  };
}

export async function listGscSites(
  accessToken: string,
): Promise<GscGoogleResult<{ siteEntries?: Array<{ siteUrl: string; permissionLevel?: string }> }>> {
  return gscFetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function queryGsc(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  rowLimit: number,
): Promise<GscGoogleResult<{ rows?: SearchAnalyticsRow[] }>> {
  return gscFetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, dataState: "all" }),
    },
  );
}

// ---------------------------------------------------------------------------
// Response shaping (pure — covered by gscService.test.ts)
// ---------------------------------------------------------------------------

export interface GscAnalyticsPayload {
  siteUrl: string;
  dateRange: { start: string; end: string };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  timeSeries: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topPages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
  fetchedAt: string;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * Aggregates the three searchAnalytics queries into the exact shape the
 * client's GSCAnalyticsResponse expects. Totals come from the daily rows:
 * CTR is clicks/impressions (guarded against division by zero) and average
 * position is impression-weighted, matching how Search Console aggregates.
 */
export function buildGscAnalyticsPayload(input: {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dailyRows: SearchAnalyticsRow[];
  queryRows: SearchAnalyticsRow[];
  pageRows: SearchAnalyticsRow[];
  fetchedAt?: string;
}): GscAnalyticsPayload {
  const timeSeries = input.dailyRows
    .filter(row => Array.isArray(row.keys) && row.keys[0])
    .map(row => ({
      date: String(row.keys[0]),
      clicks: num(row.clicks),
      impressions: num(row.impressions),
      ctr: num(row.ctr),
      position: num(row.position),
    }));

  const clicks = timeSeries.reduce((sum, point) => sum + point.clicks, 0);
  const impressions = timeSeries.reduce((sum, point) => sum + point.impressions, 0);
  const weightedPositionSum = timeSeries.reduce((sum, point) => sum + point.position * point.impressions, 0);
  const position =
    impressions > 0
      ? weightedPositionSum / impressions
      : timeSeries.length > 0
        ? timeSeries.reduce((sum, point) => sum + point.position, 0) / timeSeries.length
        : 0;

  return {
    siteUrl: input.siteUrl,
    dateRange: { start: input.startDate, end: input.endDate },
    totals: {
      clicks,
      impressions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      position,
    },
    timeSeries,
    topQueries: input.queryRows
      .filter(row => Array.isArray(row.keys) && row.keys[0])
      .map(row => ({
        query: String(row.keys[0]),
        clicks: num(row.clicks),
        impressions: num(row.impressions),
        ctr: num(row.ctr),
        position: num(row.position),
      })),
    topPages: input.pageRows
      .filter(row => Array.isArray(row.keys) && row.keys[0])
      .map(row => ({
        page: String(row.keys[0]),
        clicks: num(row.clicks),
        impressions: num(row.impressions),
        ctr: num(row.ctr),
        position: num(row.position),
      })),
    fetchedAt: input.fetchedAt || new Date().toISOString(),
  };
}

export type GscAnalyticsFetchResult =
  | { ok: true; data: GscAnalyticsPayload }
  | { ok: false; error: string; status: number };

/**
 * Runs the three searchAnalytics queries for a property. The daily rows are
 * load-bearing (they feed totals + charts); query/page tables degrade to
 * empty rather than failing the whole fetch when Google answers them with a
 * non-fatal error.
 */
export async function fetchGscAnalyticsPayload(input: {
  accessToken: string;
  siteUrl: string;
  range: string;
}): Promise<GscAnalyticsFetchResult> {
  const { startDate, endDate } = resolveGscDateRange(input.range);
  const [daily, queries, pages] = await Promise.all([
    queryGsc(input.accessToken, input.siteUrl, startDate, endDate, ["date"], 25000),
    queryGsc(input.accessToken, input.siteUrl, startDate, endDate, ["query"], 10),
    queryGsc(input.accessToken, input.siteUrl, startDate, endDate, ["page"], 10),
  ]);
  if (!daily.ok) {
    return { ok: false, error: daily.error || "Search Analytics query failed.", status: daily.status };
  }
  return {
    ok: true,
    data: buildGscAnalyticsPayload({
      siteUrl: input.siteUrl,
      startDate,
      endDate,
      dailyRows: daily.json?.rows || [],
      queryRows: queries.ok ? queries.json?.rows || [] : [],
      pageRows: pages.ok ? pages.json?.rows || [] : [],
    }),
  };
}