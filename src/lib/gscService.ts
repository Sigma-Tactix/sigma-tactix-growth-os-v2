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

/** Env names that may carry the canonical public origin (first non-empty wins). */
const GSC_APP_ORIGIN_ENV_VARS = ["APP_URL", "APP_ORIGIN", "PUBLIC_APP_URL"] as const;

/** Normalizes a public origin: trims whitespace, strips trailing slashes. */
export function normalizeGscOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
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
    if (raw && !raw.startsWith("MY_")) return normalizeGscOrigin(raw);
  }
  const fallback = (requestOrigin || "").trim();
  return fallback ? normalizeGscOrigin(fallback) : "";
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