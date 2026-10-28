import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  GSC_DEFAULT_SITE_URL,
  GSC_OAUTH_SCOPE,
  GSC_REDIRECT_PATH,
  buildGscAnalyticsPayload,
  buildGscAuthUrl,
  classifyGscAuthProbe,
  decodeGscAuthError,
  exchangeGscAuthCode,
  looksSuspiciousGscClientId,
  maskGscClientId,
  normalizeGscOrigin,
  normalizeGscSiteUrl,
  probeGscAuthorize,
  readGscSettings,
  readGscTokens,
  resolveGscAppOrigin,
  resolveGscDateRange,
  resolveGscOAuthClient,
  resolveGscRedirectUri,
  storeGscTokens,
  writeGscSettings,
} from "./gscService.js";
import type { WorkspaceData } from "../types.js";

// The GSC regression seam: these tests lock the fix for "connected via popup
// but the module still shows demo data" at the service layer — settings
// migration, secret encryption, honest OAuth resolution, and real-data
// aggregation. Client-side state selection is covered by the contract on
// fetchGSCAnalytics (live | disconnected | awaiting | error).

function makeDb(): WorkspaceData {
  return { settings: {} } as unknown as WorkspaceData;
}

describe("resolveGscDateRange", () => {
  it("maps every UI range preset onto GSC date bounds", () => {
    const cases: Array<[string, number]> = [
      ["7d", 7],
      ["28d", 28],
      ["90d", 90],
      ["16m", 480],
    ];
    for (const [range, days] of cases) {
      const resolved = resolveGscDateRange(range);
      expect(resolved.days).toBe(days);
      expect(resolved.startDate <= resolved.endDate).toBe(true);
      const spanDays =
        (new Date(resolved.endDate).getTime() - new Date(resolved.startDate).getTime()) / 86_400_000;
      expect(Math.round(spanDays)).toBe(days);
    }
  });

  it("falls back to the 28d preset for unknown ranges", () => {
    expect(resolveGscDateRange("not-a-range").days).toBe(28);
  });
});

describe("normalizeGscSiteUrl", () => {
  it("lowercases, trims and strips trailing slashes", () => {
    expect(normalizeGscSiteUrl("  https://Example.com/  ")).toBe("https://example.com");
    expect(normalizeGscSiteUrl("sc-domain:Example.com")).toBe("sc-domain:example.com");
  });

  it("treats a trailing-slash property as the same site key", () => {
    expect(normalizeGscSiteUrl("https://site.test")).toBe(normalizeGscSiteUrl("https://site.test/"));
  });
});

describe("GSC workspace settings persistence", () => {
  it("migrates legacy flat fields (pre-fix shape) on read", () => {
    const db = {
      settings: {
        gscConnected: true,
        gscSiteUrl: "sc-domain:legacy.test",
        gscLastFetched: "2026-01-01T00:00:00.000Z",
      },
    } as unknown as WorkspaceData;
    const gsc = readGscSettings(db);
    expect(gsc.connected).toBe(true);
    expect(gsc.siteUrl).toBe("sc-domain:legacy.test");
    expect(gsc.lastFetched).toBe("2026-01-01T00:00:00.000Z");
  });

  it("reports a fresh workspace as disconnected at the default site", () => {
    const gsc = readGscSettings(makeDb());
    expect(gsc.connected).toBe(false);
    expect(gsc.siteUrl).toBe(GSC_DEFAULT_SITE_URL);
  });

  it("write → read round-trips the structured gsc object over legacy fields", () => {
    const db = {
      settings: { gscConnected: true, gscSiteUrl: "sc-domain:legacy.test" },
    } as unknown as WorkspaceData;
    writeGscSettings(db, { connected: false, siteUrl: "https://new.test" });
    const gsc = readGscSettings(db);
    expect(gsc.connected).toBe(false);
    expect(gsc.siteUrl).toBe("https://new.test");
    // Legacy fields are not resurrected once the structured object exists.
    expect(gsc.siteUrl).not.toBe("sc-domain:legacy.test");
  });

  it("stores Google tokens AES-encrypted — never raw in the blob", () => {
    const db = makeDb();
    storeGscTokens(db, {
      accessToken: "ya29.RAW-SECRET",
      refreshToken: "refresh-secret-token",
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    const serialized = JSON.stringify(db);
    expect(serialized).not.toContain("ya29.RAW-SECRET");
    expect(serialized).not.toContain("refresh-secret-token");
    expect(readGscTokens(db)?.accessToken).toBe("ya29.RAW-SECRET");
    expect(readGscTokens(db)?.refreshToken).toBe("refresh-secret-token");
  });

  it("treats an undecryptable token blob as no grant (reconnect issues new tokens)", () => {
    const db = makeDb();
    writeGscSettings(db, { connected: true, tokensEncrypted: "not-a-valid-ciphertext" });
    expect(readGscTokens(db)).toBeNull();
    expect(readGscSettings(db).connected).toBe(true);
  });
});

describe("resolveGscOAuthClient", () => {
  const envSnapshot = {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    key: process.env.CONNECTOR_CREDENTIALS_KEY,
  };

  beforeEach(() => {
    process.env.CONNECTOR_CREDENTIALS_KEY = "gsc-service-test-key";
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  });

  afterEach(() => {
    if (envSnapshot.clientId === undefined) delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    else process.env.GOOGLE_OAUTH_CLIENT_ID = envSnapshot.clientId;
    if (envSnapshot.clientSecret === undefined) delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    else process.env.GOOGLE_OAUTH_CLIENT_SECRET = envSnapshot.clientSecret;
    if (envSnapshot.key === undefined) delete process.env.CONNECTOR_CREDENTIALS_KEY;
    else process.env.CONNECTOR_CREDENTIALS_KEY = envSnapshot.key;
  });

  it("returns null when neither a stored client nor env vars exist", () => {
    expect(resolveGscOAuthClient(makeDb())).toBeNull();
  });

  it("uses the env pair when no workspace client is stored", () => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = "env-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "env-client-secret";
    expect(resolveGscOAuthClient(makeDb())).toEqual({
      clientId: "env-client-id",
      clientSecret: "env-client-secret",
    });
  });

  it("requires BOTH env vars — a half-configured env answers null", () => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = "env-client-id";
    expect(resolveGscOAuthClient(makeDb())).toBeNull();
  });

  it("gives a stored workspace client precedence over the env pair", async () => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = "env-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "env-client-secret";
    const { encryptCredentials } = await import("./credentialCrypto.js");
    const db = makeDb();
    writeGscSettings(db, {
      connected: true,
      oauthClientEncrypted: encryptCredentials({ clientId: "popup-client-id", clientSecret: "popup-client-secret" }),
    });
    expect(resolveGscOAuthClient(db)).toEqual({
      clientId: "popup-client-id",
      clientSecret: "popup-client-secret",
    });
  });

  it("falls back to the env pair when the stored client blob is corrupt", async () => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = "env-client-id";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "env-client-secret";
    const db = makeDb();
    writeGscSettings(db, { connected: true, oauthClientEncrypted: "corrupt-ciphertext" });
    expect(resolveGscOAuthClient(db)?.clientId).toBe("env-client-id");
  });
});

describe("buildGscAuthUrl", () => {
  it("builds a consent URL with the read-only scope and CSRF state", () => {
    const url = new URL(
      buildGscAuthUrl({
        clientId: "client-123",
        redirectUri: "https://app.test/api/gsc/callback",
        state: "nonce-abc",
      }),
    );
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("client-123");
    expect(url.searchParams.get("redirect_uri")).toBe("https://app.test/api/gsc/callback");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe(GSC_OAUTH_SCOPE);
    expect(url.searchParams.get("access_type")).toBe("offline");
  });
});

// Regression seam for Error 400 redirect_uri_mismatch: the server must mint
// ONE canonical redirect URI (env origin → request origin) so the authorize
// URL and the code exchange always agree byte-for-byte, and so the dialog can
// display the exact string Google must have whitelisted.
describe("canonical GSC redirect URI", () => {
  const ENV_VARS = ["APP_URL", "APP_ORIGIN", "PUBLIC_APP_URL"] as const;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const name of ENV_VARS) {
      saved[name] = process.env[name];
      delete process.env[name];
    }
  });

  afterEach(() => {
    for (const name of ENV_VARS) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  });

  it("normalizes origins by trimming whitespace and trailing slashes", () => {
    expect(normalizeGscOrigin("  https://app.test/  ")).toBe("https://app.test");
    expect(normalizeGscOrigin("http://localhost:8787///")).toBe("http://localhost:8787");
  });

  it("prefers APP_URL over the request origin for stability", () => {
    process.env.APP_URL = "https://app.example.com";
    expect(resolveGscAppOrigin("http://localhost:8787")).toBe("https://app.example.com");
    expect(resolveGscRedirectUri("http://localhost:8787")).toBe(
      `https://app.example.com${GSC_REDIRECT_PATH}`,
    );
  });

  it("accepts APP_ORIGIN and PUBLIC_APP_URL when APP_URL is unset", () => {
    process.env.APP_ORIGIN = "https://origin.example.com/";
    expect(resolveGscRedirectUri("http://localhost:8787")).toBe(
      `https://origin.example.com${GSC_REDIRECT_PATH}`,
    );
    delete process.env.APP_ORIGIN;
    process.env.PUBLIC_APP_URL = "https://public.example.com";
    expect(resolveGscRedirectUri("http://localhost:8787")).toBe(
      `https://public.example.com${GSC_REDIRECT_PATH}`,
    );
  });

  it("ignores MY_ placeholder values and falls back to the request origin", () => {
    process.env.APP_URL = "MY_APP_URL";
    expect(resolveGscRedirectUri("http://localhost:8787")).toBe(
      `http://localhost:8787${GSC_REDIRECT_PATH}`,
    );
  });

  it("falls back to the request origin in dev and answers empty when unknown", () => {
    expect(resolveGscRedirectUri("http://localhost:8787")).toBe(
      `http://localhost:8787${GSC_REDIRECT_PATH}`,
    );
    expect(resolveGscRedirectUri()).toBe("");
  });

  it("canonicalizes 127.0.0.1 to localhost (Google compares byte-for-byte)", () => {
    expect(resolveGscRedirectUri("http://127.0.0.1:8787")).toBe(
      `http://localhost:8787${GSC_REDIRECT_PATH}`,
    );
    process.env.APP_URL = "http://127.0.0.1:3000";
    expect(resolveGscRedirectUri("http://localhost:3000")).toBe(
      `http://localhost:3000${GSC_REDIRECT_PATH}`,
    );
  });

  it("lowercases mixed-case hostnames before minting the URI", () => {
    expect(normalizeGscOrigin("http://LocalHost:3000/")).toBe("http://localhost:3000");
  });
});

describe("GSC OAuth client-ID shape check", () => {
  it("accepts a full Web client ID", () => {
    expect(
      looksSuspiciousGscClientId("123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"),
    ).toBe(false);
  });

  it("flags truncated, whitespace-bearing, and non-Google values", () => {
    expect(looksSuspiciousGscClientId("")).toBe(true);
    expect(looksSuspiciousGscClientId("short-id")).toBe(true);
    expect(looksSuspiciousGscClientId("123456789012-abc def.apps.googleusercontent.com")).toBe(true);
    expect(looksSuspiciousGscClientId("not-a-google-client")).toBe(true);
  });
});

describe("buildGscAnalyticsPayload", () => {
  const row = (keys: string[], clicks: number, impressions: number, ctr: number, position: number) => ({
    keys, clicks, impressions, ctr, position,
  });

  it("aggregates daily rows into impression-weighted totals", () => {
    const payload = buildGscAnalyticsPayload({
      siteUrl: "sc-domain:site.test",
      startDate: "2026-09-01",
      endDate: "2026-09-02",
      dailyRows: [
        row(["2026-09-01"], 10, 100, 0.1, 10),
        row(["2026-09-02"], 30, 300, 0.1, 5),
      ],
      queryRows: [row(["brand term"], 25, 250, 0.1, 1.5)],
      pageRows: [row(["https://site.test/"], 40, 400, 0.1, 4)],
      fetchedAt: "2026-10-07T00:00:00.000Z",
    });

    expect(payload.totals.clicks).toBe(40);
    expect(payload.totals.impressions).toBe(400);
    expect(payload.totals.ctr).toBeCloseTo(0.1, 6);
    // Weighted: (10*100 + 5*300) / 400 = 6.25 — not the plain mean (7.5).
    expect(payload.totals.position).toBeCloseTo(6.25, 6);
    expect(payload.timeSeries).toHaveLength(2);
    expect(payload.topQueries[0].query).toBe("brand term");
    expect(payload.topPages[0].page).toBe("https://site.test/");
    expect(payload.dateRange).toEqual({ start: "2026-09-01", end: "2026-09-02" });
  });

  it("never divides by zero when Google returns no impressions", () => {
    const payload = buildGscAnalyticsPayload({
      siteUrl: "sc-domain:site.test",
      startDate: "2026-09-01",
      endDate: "2026-09-01",
      dailyRows: [row(["2026-09-01"], 0, 0, 0, 0)],
      queryRows: [],
      pageRows: [],
    });
    expect(payload.totals.ctr).toBe(0);
    expect(Number.isFinite(payload.totals.position)).toBe(true);
  });

  it("produces empty-but-valid payloads for a property with zero data", () => {
    const payload = buildGscAnalyticsPayload({
      siteUrl: "sc-domain:site.test",
      startDate: "2026-09-01",
      endDate: "2026-09-28",
      dailyRows: [],
      queryRows: [],
      pageRows: [],
    });
    expect(payload.timeSeries).toEqual([]);
    expect(payload.totals).toEqual({ clicks: 0, impressions: 0, ctr: 0, position: 0 });
    expect(payload.topQueries).toEqual([]);
    expect(payload.topPages).toEqual([]);
  });

  it("filters malformed rows instead of emitting undefined keys", () => {
    const payload = buildGscAnalyticsPayload({
      siteUrl: "sc-domain:site.test",
      startDate: "2026-09-01",
      endDate: "2026-09-01",
      dailyRows: [row([], 5, 5, 0.1, 1), row(["2026-09-01"], 1, 1, 1, 1)],
      queryRows: [row(["kept"], 1, 1, 1, 1), row([""], 9, 9, 1, 1)],
      pageRows: [],
    });
    expect(payload.timeSeries).toHaveLength(1);
    expect(payload.timeSeries[0].date).toBe("2026-09-01");
    expect(payload.topQueries.map(q => q.query)).toEqual(["kept"]);
  });
});

// Pre-flight seam for the persistent Error 400 redirect_uri_mismatch: the
// server probes Google's authorize endpoint with the exact pair BEFORE the
// browser navigates, decodes Google's base64url authError bounce, and never
// blocks the real flow when the probe itself fails (fail-open ok:null).
describe("GSC authorize pre-flight", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("decodes Google's protobuf-wrapped authError values", () => {
    // Live-probed shape: 0x0a + length + ASCII ("invalid_client").
    expect(decodeGscAuthError("Cg5pbnZhbGlkX2NsaWVudA")).toBe("invalid_client");
    const mismatch = Buffer.concat([Buffer.from([0x0a, 0x14]), Buffer.from("redirect_uri_mismatch")]).toString("base64url");
    expect(decodeGscAuthError(mismatch)).toBe("redirect_uri_mismatch");
    // Falls back to the raw value when not base64url-wrapped.
    expect(decodeGscAuthError("error=redirect_uri_mismatch")).toBe("redirect_uri_mismatch");
    expect(decodeGscAuthError("")).toBeNull();
    expect(decodeGscAuthError(null)).toBeNull();
    expect(decodeGscAuthError("Cg5pbnZhbGlkX2NsaWVudA@not-base64!!")).toBe("invalid_client");
  });

  it("classifies the error bounce as a rejection with Google's exact code", () => {
    const errorLocation = `https://accounts.google.com/signin/oauth/error?authError=${Buffer.concat([
      Buffer.from([0x0a, 0x14]),
      Buffer.from("redirect_uri_mismatch"),
    ]).toString("base64url")}`;
    const verdict = classifyGscAuthProbe({ status: 302, location: errorLocation });
    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("redirect_uri_mismatch");
  });

  it("treats a sign-in/consent redirect as acceptance of the pair", () => {
    expect(
      classifyGscAuthProbe({
        status: 302,
        location: "https://accounts.google.com/v3/signin/oauth/error-check?authFlowRequestedUri=x",
      }).ok,
    ).not.toBe(true); // error-check page is not plain sign-in
    expect(classifyGscAuthProbe({ status: 302, location: "https://accounts.google.com/signin/oauth/consent?continue=x" }).ok).toBe(true);
    expect(classifyGscAuthProbe({ status: 302, location: "https://accounts.google.com/v3/signin/challenge/pwd?continue=x" }).ok).toBe(true);
  });

  it("falls open on redirects to unrecognized hosts", () => {
    const verdict = classifyGscAuthProbe({ status: 302, location: "https://phish.example.com/steal" });
    expect(verdict.ok).toBeNull();
    expect(verdict.code).toBe("unexpected_redirect");
  });

  it("classifies a directly-served error body instead of a redirect", () => {
    const verdict = classifyGscAuthProbe({ status: 200, body: "<html>Error 400: redirect_uri_mismatch</html>" });
    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("redirect_uri_mismatch");
    expect(classifyGscAuthProbe({ status: 200, body: '<form action="https://accounts.google.com/signin">' }).ok).toBe(true);
    expect(classifyGscAuthProbe({ status: 429, body: "" }).ok).toBeNull();
  });

  it("masks a client id down to an identifiable prefix + suffix", () => {
    const masked = maskGscClientId("1067897367455-abc123def456gh789ij012kl345mn67.apps.googleusercontent.com");
    expect(masked.startsWith("10678973")).toBe(true);
    expect(masked.endsWith(".apps.googleusercontent.com")).toBe(true);
    expect(masked).not.toContain("abc123def456");
    expect(maskGscClientId("short")).toBe("short");
  });

  it("rejects a non-Google client id locally without hitting the network", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const verdict = await probeGscAuthorize({ clientId: "not-a-client-id", redirectUri: "http://localhost:3000/api/gsc/callback" });
    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("invalid_client_id_format");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("probes with redirect:manual and classifies Google's 302 verdict", async () => {
    const errorLocation = "https://accounts.google.com/signin/oauth/error?authError=Cg5pbnZhbGlkX2NsaWVudA";
    const fetchMock = vi.fn().mockResolvedValue({
      status: 302,
      headers: { get: (h: string) => (h === "location" ? errorLocation : null) },
    });
    vi.stubGlobal("fetch", fetchMock);

    const verdict = await probeGscAuthorize({
      clientId: "1234567890-abcdefghijklmnop.apps.googleusercontent.com",
      redirectUri: "http://localhost:3000/api/gsc/callback",
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("invalid_client");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("client_id=1234567890-abcdefghijklmnop.apps.googleusercontent.com");
    expect(String(url)).toContain("redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fgsc%2Fcallback");
    expect(init.redirect).toBe("manual");
    // The secret must never be sent to the authorize endpoint.
    expect(String(url)).not.toContain("client_secret");
  });

  it("fails open when Google is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ETIMEDOUT")));
    const verdict = await probeGscAuthorize({
      clientId: "1234567890-abcdefghijklmnop.apps.googleusercontent.com",
      redirectUri: "http://localhost:3000/api/gsc/callback",
    });
    expect(verdict.ok).toBeNull();
    expect(verdict.code).toBe("probe_failed");
    expect(verdict.detail).toContain("ETIMEDOUT");
  });
});

describe("exchangeGscAuthCode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exchanges a code for tokens with the exact OAuth parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: "ya29.new", refresh_token: "rt-1", expires_in: 3600, scope: GSC_OAUTH_SCOPE }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await exchangeGscAuthCode({
      code: "auth-code",
      clientId: "cid",
      clientSecret: "csecret",
      redirectUri: "https://app.test/api/gsc/callback",
    });

    expect(result.ok).toBe(true);
    expect(result.tokens?.accessToken).toBe("ya29.new");
    expect(result.tokens?.refreshToken).toBe("rt-1");
    expect(new Date(result.tokens!.expiresAt).getTime()).toBeGreaterThan(Date.now());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    const params = new URLSearchParams(String(init.body));
    expect(params.get("grant_type")).toBe("authorization_code");
    expect(params.get("code")).toBe("auth-code");
    expect(params.get("client_id")).toBe("cid");
    expect(params.get("client_secret")).toBe("csecret");
    expect(params.get("redirect_uri")).toBe("https://app.test/api/gsc/callback");
  });

  it("surfaces Google's rejection message instead of claiming success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "invalid_grant: Bad Request" } }),
    }));

    const result = await exchangeGscAuthCode({
      code: "bad-code",
      clientId: "cid",
      clientSecret: "csecret",
      redirectUri: "https://app.test/api/gsc/callback",
    });

    expect(result.ok).toBe(false);
    expect(result.tokens).toBeUndefined();
    expect(result.error).toContain("invalid_grant");
  });

  it("answers not-ok on network failure rather than throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const result = await exchangeGscAuthCode({
      code: "auth-code",
      clientId: "cid",
      clientSecret: "csecret",
      redirectUri: "https://app.test/api/gsc/callback",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("ECONNREFUSED");
  });
});
