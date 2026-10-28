/**
 * Google Search Console API Client Wrapper
 *
 * Client half of the /api/gsc/* contract (server: server.ts + gscService.ts).
 *
 * Truthfulness contract (SEO & AEO Authority module):
 *  - getGSCConnectionStatus() reports what the SERVER says; on transport
 *    failure it answers {connected:false} so the UI shows DEMO DATA rather
 *    than claiming a connection.
 *  - fetchGSCAnalytics() never silently falls back to demo numbers. It
 *    returns a discriminated result ('live' | 'disconnected' | 'awaiting' |
 *    'error') so the caller can render the exact state; generateDemoGSCData()
 *    must only be used for the explicit DEMO DATA (disconnected) state.
 *
 * OAuth secrets never transit this module — the server stores the client
 * pair and Google tokens AES-256-GCM wrapped in the workspace blob.
 */

import { apiFetch } from './api';

export interface GSCMetrics {
  clicks: number;
  impressions: number;
  ctr: number;       // 0-1
  position: number;  // average position
}

export interface GSCTimeSeriesPoint {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCAnalyticsResponse {
  siteUrl: string;
  dateRange: { start: string; end: string };
  totals: GSCMetrics;
  timeSeries: GSCTimeSeriesPoint[];
  topQueries: GSCQueryRow[];
  topPages: GSCPageRow[];
  fetchedAt: string;
}

export type GscVerificationState = 'configured' | 'verified' | 'failed';

export interface GSCConnectionStatus {
  connected: boolean;
  siteUrl?: string;
  verificationState?: GscVerificationState;
  verificationMessage?: string;
  /** A stored Google OAuth grant exists (tokens in the encrypted vault). */
  hasGrant?: boolean;
  /** An OAuth client (popup-supplied or env) is available for the flow. */
  oauthConfigured?: boolean;
  /**
   * The EXACT redirect URI Google must have whitelisted (origin + path).
   * The dialog displays this with a copy button so redirect_uri_mismatch is
   * fixable without guessing which origin the server used.
   */
  redirectUri?: string;
  lastFetched?: string;
  lastError?: string;
}

/**
 * Check if GSC is connected and configured.
 */
export async function getGSCConnectionStatus(): Promise<GSCConnectionStatus> {
  try {
    const res = await apiFetch('/api/gsc/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend not available — fall through to disconnected state
  }
  return { connected: false };
}

export type GSCAnalyticsResult =
  | { kind: 'live'; data: GSCAnalyticsResponse }
  | { kind: 'disconnected' }
  | { kind: 'awaiting'; message: string }
  | { kind: 'error'; message: string };

function readErrorMessage(payload: unknown, fallback: string): string {
  const record = payload as Record<string, unknown> | null | undefined;
  if (record && typeof record.message === 'string' && record.message.trim()) return record.message;
  if (record && typeof record.error === 'string' && record.error.trim()) return record.error;
  return fallback;
}

/**
 * Fetch GSC analytics for the configured site.
 *
 * Distinguishes the states the old null-return conflated:
 *  - 'live'         real payload → render LIVE
 *  - 'disconnected' server says not connected → render DEMO DATA
 *  - 'awaiting'     connected but no OAuth grant / no data yet → render the
 *                   explicit waiting panel (never demo numbers, never LIVE)
 *  - 'error'        connected but the fetch failed → render the error
 */
export async function fetchGSCAnalytics(
  dateRange: '7d' | '28d' | '90d' | '16m' = '28d'
): Promise<GSCAnalyticsResult> {
  let res: Response;
  try {
    res = await apiFetch(`/api/gsc/analytics?range=${dateRange}`);
  } catch {
    return { kind: 'error', message: 'Backend unreachable — Search Console data could not be fetched.' };
  }
  const payload: unknown = await res.json().catch(() => ({}));

  const candidate = payload as Partial<GSCAnalyticsResponse> | null | undefined;
  if (
    res.ok &&
    candidate &&
    typeof candidate === 'object' &&
    Array.isArray(candidate.timeSeries) &&
    candidate.totals &&
    typeof candidate.totals === 'object'
  ) {
    return { kind: 'live', data: candidate as GSCAnalyticsResponse };
  }

  const record = payload as Record<string, unknown> | null | undefined;
  if (res.status === 409 || record?.connected === false) {
    return { kind: 'disconnected' };
  }

  const message = readErrorMessage(payload, `Search Console request failed (HTTP ${res.status}).`);
  if (res.ok && record?.hasData === false) {
    return { kind: 'awaiting', message };
  }
  return { kind: 'error', message };
}

export interface GscPreflight {
  /** true = Google accepted the pair; false = rejected; null = could not verify. */
  ok: boolean | null;
  code?: string;
  detail?: string;
}

export interface GSCConnectResult {
  success: boolean;
  connected?: boolean;
  siteUrl?: string;
  verificationState?: GscVerificationState;
  hasGrant?: boolean;
  oauthConfigured?: boolean;
  /** Google consent URL — navigate here to complete the OAuth grant. */
  authUrl?: string | null;
  /** EXACT redirect URI Google must have whitelisted — display in the dialog. */
  redirectUri?: string;
  /** Masked client ID whose Authorized redirect URIs must contain redirectUri. */
  clientIdMasked?: string;
  /**
   * Server-side verdict for the exact client + redirect URI pair, tested
   * against Google's authorize endpoint BEFORE the browser navigates there.
   * When ok === false the client must NOT navigate to authUrl — Google would
   * only show the same dead-end Error 400 page.
   */
  preflight?: GscPreflight | null;
  error?: string;
}

/**
 * Store the property (and optional custom OAuth client) server-side. When
 * `authUrl` comes back, the caller MUST navigate to it to finish the Google
 * grant — until then the connection is only 'configured', not verified.
 */
export async function connectGSC(input: {
  siteUrl: string;
  clientId?: string;
  clientSecret?: string;
}): Promise<GSCConnectResult> {
  let res: Response;
  try {
    res = await apiFetch('/api/gsc/connect', { method: 'POST', body: JSON.stringify(input) });
  } catch {
    return { success: false, error: 'Backend unreachable — could not reach the server to connect Search Console.' };
  }
  const payload: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: readErrorMessage(payload, `Connection failed (HTTP ${res.status}).`) };
  }
  return { success: true, ...(payload as Omit<GSCConnectResult, 'success'>) };
}

export interface GSCExchangeResult {
  success: boolean;
  connected?: boolean;
  siteUrl?: string;
  propertyAccessible?: boolean;
  accessibleSites?: string[];
  verificationState?: GscVerificationState;
  verificationMessage?: string;
  error?: string;
}

export interface GSCDiagnostics {
  redirectUri: string;
  redirectPath: string;
  oauthConfigured: boolean;
  connected: boolean;
  siteUrl?: string;
  verificationState?: GscVerificationState;
  hasGrant: boolean;
  storedRedirectUri: string | null;
  redirectUriMatchesStored: boolean;
  /** Masked ID of the stored OAuth client (whose whitelist must hold redirectUri). */
  clientIdMasked?: string | null;
  /** True when the stored ID does not look like a Google Web client — warn only. */
  clientIdSuspicious?: boolean | null;
  /** Proxy-visibility fields: scheme/host drift is the #1 mismatch cause. */
  forwardedProto?: string | null;
  forwardedHost?: string | null;
  requestHost?: string | null;
  appOriginEnv?: string | null;
}

/** Self-check for the OAuth setup — surfaces the canonical redirect URI. */
export async function fetchGSCDiagnostics(): Promise<GSCDiagnostics | null> {
  try {
    const res = await apiFetch('/api/gsc/diagnostics');
    if (!res.ok) return null;
    return (await res.json()) as GSCDiagnostics;
  } catch {
    return null;
  }
}

export interface GSCPreflightResult extends GscPreflight {
  redirectUri?: string;
  clientIdMasked?: string;
  /** True when the tested ID does not look like a Google Web client — warn only. */
  clientIdSuspicious?: boolean;
}

/**
 * Ask the server to verify the exact client_id + redirect_uri pair against
 * Google's authorize endpoint — returns Google's real verdict without the
 * browser ever navigating there (so no dead-end Error 400 page).
 */
export async function preflightGSC(input?: { clientId?: string }): Promise<GSCPreflightResult> {
  try {
    const res = await apiFetch('/api/gsc/preflight', {
      method: 'POST',
      body: JSON.stringify({ clientId: input?.clientId || undefined }),
    });
    const payload: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: null, code: 'preflight_unavailable', detail: readErrorMessage(payload, `Pre-flight failed (HTTP ${res.status}).`) };
    }
    return payload as GSCPreflightResult;
  } catch {
    return { ok: null, code: 'backend_unreachable', detail: 'Backend unreachable — could not verify the pair with Google.' };
  }
}

/** Completes the OAuth grant by exchanging the callback's code + state. */
export async function exchangeGSCCode(code: string, state: string): Promise<GSCExchangeResult> {
  let res: Response;
  try {
    res = await apiFetch('/api/gsc/token-exchange', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  } catch {
    return { success: false, error: 'Backend unreachable — the OAuth grant could not be verified.' };
  }
  const payload: unknown = await res.json().catch(() => ({}));
  const body = (payload || {}) as Omit<GSCExchangeResult, 'success'>;
  if (!res.ok) {
    return {
      success: false,
      ...body,
      error: body.error || readErrorMessage(payload, `OAuth verification failed (HTTP ${res.status}).`),
    };
  }
  return { success: true, ...body };
}

/** Clears the connection server-side. The caller re-reads status via
 *  loadData() afterwards, so a transport failure still renders the truth. */
export async function disconnectGSC(): Promise<void> {
  try {
    await apiFetch('/api/gsc/disconnect', { method: 'POST' });
  } catch {
    // Caller re-reads status and renders whatever the server reports.
  }
}

/** Human-readable copy for the ?gsc_error= codes the OAuth callback emits. */
export function describeGscOAuthError(code: string): string {
  switch (code) {
    case 'oauth_not_configured':
      return 'Google OAuth is not configured. Enter a Client ID & Secret in the connect dialog, or set GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET on the server.';
    case 'missing_state':
      return 'The OAuth link was missing its workspace state. Start the connection from the connect dialog instead.';
    case 'missing_code':
      return 'Google did not return an authorization code. Try connecting again.';
    case 'redirect_uri_unresolvable':
      return "The server could not determine its own public URL, so no OAuth redirect URI could be minted. Set APP_URL on the server (e.g. APP_URL=http://localhost:8787) and reconnect.";
    case 'redirect_uri_mismatch':
      return 'Google rejected the redirect URI (redirect_uri_mismatch — URI must match byte-for-byte: scheme, host, port and path). Open the Connect dialog, copy the exact Redirect URI shown, and add it under Google Cloud → APIs & Services → Credentials → YOUR OAuth client (a Web-application client; a Desktop client can never match a web redirect URI) → Authorized redirect URIs (not Authorized JavaScript origins). Also confirm it is on the SAME client whose ID/Secret you entered, with no trailing slash and http/https matching, then reconnect.';
    case 'access_denied':
      return 'Authorization was declined on the Google consent screen. Grant Search Console access to continue.';
    default:
      return `Google OAuth returned an error: ${code}`;
  }
}

/**
 * DEMO-ONLY fallback data for the disconnected state (rendered under the
 * DEMO DATA badge). Never surface this under a LIVE badge or while the
 * workspace reports an active GSC connection — awaiting/error states have
 * their own explicit panels in SearchConsoleTrends.
 */
export function generateDemoGSCData(dateRange: '7d' | '28d' | '90d' | '16m' = '28d'): GSCAnalyticsResponse {
  const days = dateRange === '7d' ? 7 : dateRange === '28d' ? 28 : dateRange === '90d' ? 90 : 480;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Generate time series with realistic organic growth pattern
  const timeSeries: GSCTimeSeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    const weekdayMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.55 : 1;
    const growthFactor = 1 + (i / days) * 0.35;
    const baseClicks = Math.round((42 + Math.random() * 28) * weekdayMultiplier * growthFactor);
    const baseImpressions = Math.round((680 + Math.random() * 320) * weekdayMultiplier * growthFactor);

    timeSeries.push({
      date: d.toISOString().split('T')[0],
      clicks: baseClicks,
      impressions: baseImpressions,
      ctr: baseClicks / baseImpressions,
      position: 14.2 - (i / days) * 3.8 + Math.random() * 1.5
    });
  }

  const totalClicks = timeSeries.reduce((s, p) => s + p.clicks, 0);
  const totalImpressions = timeSeries.reduce((s, p) => s + p.impressions, 0);

  const topQueries: GSCQueryRow[] = [
    { query: 'ai growth consulting', clicks: Math.round(totalClicks * 0.12), impressions: Math.round(totalImpressions * 0.08), ctr: 0.094, position: 6.2 },
    { query: 'growth os for b2b', clicks: Math.round(totalClicks * 0.09), impressions: Math.round(totalImpressions * 0.065), ctr: 0.087, position: 8.4 },
    { query: 'ai marketing agent', clicks: Math.round(totalClicks * 0.08), impressions: Math.round(totalImpressions * 0.11), ctr: 0.046, position: 12.1 },
    { query: 'sigma tactix', clicks: Math.round(totalClicks * 0.15), impressions: Math.round(totalImpressions * 0.04), ctr: 0.23, position: 1.2 },
    { query: 'automated growth infrastructure', clicks: Math.round(totalClicks * 0.06), impressions: Math.round(totalImpressions * 0.07), ctr: 0.054, position: 9.8 },
    { query: 'second brain for business', clicks: Math.round(totalClicks * 0.05), impressions: Math.round(totalImpressions * 0.06), ctr: 0.052, position: 11.3 },
    { query: 'ai native growth consultancy', clicks: Math.round(totalClicks * 0.07), impressions: Math.round(totalImpressions * 0.05), ctr: 0.088, position: 7.6 },
    { query: 'replace marketing agency with ai', clicks: Math.round(totalClicks * 0.04), impressions: Math.round(totalImpressions * 0.09), ctr: 0.028, position: 15.4 },
    { query: 'aeo optimization service', clicks: Math.round(totalClicks * 0.03), impressions: Math.round(totalImpressions * 0.04), ctr: 0.047, position: 13.2 },
    { query: 'growth diagnostic audit', clicks: Math.round(totalClicks * 0.06), impressions: Math.round(totalImpressions * 0.03), ctr: 0.125, position: 4.8 }
  ];

  const topPages: GSCPageRow[] = [
    { page: 'https://sigmatactix.com/', clicks: Math.round(totalClicks * 0.32), impressions: Math.round(totalImpressions * 0.25), ctr: 0.081, position: 8.2 },
    { page: 'https://sigmatactix.com/growth-diagnostic', clicks: Math.round(totalClicks * 0.18), impressions: Math.round(totalImpressions * 0.15), ctr: 0.076, position: 9.4 },
    { page: 'https://sigmatactix.com/services', clicks: Math.round(totalClicks * 0.14), impressions: Math.round(totalImpressions * 0.12), ctr: 0.074, position: 10.1 },
    { page: 'https://sigmatactix.com/blog/ai-growth-os-guide', clicks: Math.round(totalClicks * 0.11), impressions: Math.round(totalImpressions * 0.18), ctr: 0.039, position: 14.6 },
    { page: 'https://sigmatactix.com/case-studies', clicks: Math.round(totalClicks * 0.08), impressions: Math.round(totalImpressions * 0.08), ctr: 0.063, position: 11.8 },
    { page: 'https://sigmatactix.com/about', clicks: Math.round(totalClicks * 0.06), impressions: Math.round(totalImpressions * 0.05), ctr: 0.076, position: 9.2 },
    { page: 'https://sigmatactix.com/blog/replace-agency-with-ai', clicks: Math.round(totalClicks * 0.05), impressions: Math.round(totalImpressions * 0.09), ctr: 0.035, position: 16.3 },
    { page: 'https://sigmatactix.com/pricing', clicks: Math.round(totalClicks * 0.04), impressions: Math.round(totalImpressions * 0.04), ctr: 0.063, position: 12.4 }
  ];

  return {
    siteUrl: 'sc-domain:sigmatactix.com',
    dateRange: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    },
    totals: {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: totalClicks / totalImpressions,
      position: timeSeries.reduce((s, p) => s + p.position, 0) / timeSeries.length
    },
    timeSeries,
    topQueries,
    topPages,
    fetchedAt: new Date().toISOString()
  };
}
