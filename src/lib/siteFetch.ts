import * as cheerio from "cheerio";
import { isIP } from "net";
import { lookup as dnsLookup } from "dns/promises";

// Real website fetch + structural parse, shared by every module that audits
// a live URL (Growth Audit Engine, Authority & SEO, Competitor Analysis).
// Built once here instead of per-module so a fetch/timeout/parsing fix lands
// everywhere at once — same "connectors built once, reused" principle the
// project already applies to third-party API adapters. This is also the
// single SSRF choke point for all of them: an adversarial review found the
// Competitor Analysis "domain" field (fully user-controlled, no format
// validation) reached this fetch with no host restriction, so a workspace
// member could target internal services or the cloud metadata endpoint
// (169.254.169.254) and have the fetched body reflected back through the
// Gemini analysis. Fixing it once here, at the actual fetch, closes it for
// every caller (Growth Audit, UI/UX Audit, Authority & SEO, Competitor
// Analysis) instead of requiring every route to remember to validate input.

export interface SiteSnapshot {
  url: string;
  finalUrl: string;
  statusCode: number;
  title: string;
  metaDescription: string;
  h1s: string[];
  h2s: string[];
  wordCount: number;
  hasViewportMeta: boolean;
  hasStructuredData: boolean;
  structuredDataTypes: string[];
  hasFaqContent: boolean;
  openGraph: Record<string, string>;
  canonicalUrl: string | null;
  internalLinkCount: number;
  externalLinkCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  analyticsSignals: string[]; // real detected tracking scripts (GTM, GA4, Meta Pixel, etc.)
  bodyTextSample: string; // truncated visible text, for feeding an LLM
  // When this content was actually retrieved. Phase 2 evidence records need an
  // honest observation time for freshness/period checks — without it, freshness
  // would have to be guessed at report time.
  fetchedAt: string;
  /** True when this content was GENERATED, not fetched (crawl failed). */
  synthetic?: boolean;
}

const ANALYTICS_SIGNATURES: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /googletagmanager\.com\/gtm\.js/i, label: "Google Tag Manager" },
  { pattern: /gtag\(['"]config['"]/i, label: "Google Analytics (gtag.js)" },
  { pattern: /connect\.facebook\.net\/.*\/fbevents\.js|fbq\(['"]init['"]/i, label: "Meta Pixel" },
  { pattern: /snap\.licdn\.com\/li\.lms-analytics/i, label: "LinkedIn Insight Tag" },
  { pattern: /static\.ads-twitter\.com|twq\(/i, label: "X (Twitter) Pixel" },
  { pattern: /analytics\.tiktok\.com/i, label: "TikTok Pixel" },
  { pattern: /clarity\.ms\/tag/i, label: "Microsoft Clarity" },
  { pattern: /hotjar\.com/i, label: "Hotjar" },
  { pattern: /segment\.(com|io)\/analytics\.js/i, label: "Segment" },
];

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("No URL provided");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withScheme); // throws on genuinely malformed input
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Unsupported URL scheme: ${parsed.protocol}`);
  }
  return parsed.toString();
}

// IPv4/IPv6 ranges that must never be reachable from a server-side fetch
// triggered by user input: loopback, private/internal, link-local (which
// covers the 169.254.169.254 cloud metadata endpoint on AWS/GCP/Azure), and
// unspecified. Deliberately conservative — false positives here just mean a
// legitimate audit target needs a real public domain, which every real
// client site already has.
function isPrivateOrReservedIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
    return false;
  }
  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true; // link-local + unique-local
    const v4Mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (v4Mapped) return isPrivateOrReservedIp(v4Mapped[1]);
    return false;
  }
  return true; // not a parseable IP at all — treat as unsafe rather than guess
}

// Resolves the hostname and rejects it if ANY resolved address is
// private/reserved — a hostname can have multiple A/AAAA records, and DNS
// rebinding means "looked safe once" isn't good enough on its own, but this
// closes the straightforward case (an attacker just pointing a domain, or
// using a raw IP/localhost, at an internal target).
export async function assertPublicHost(urlString: string): Promise<void> {
  const { hostname } = new URL(urlString);
  if (isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) throw new Error(`Refusing to fetch a private/internal address: ${hostname}`);
    return;
  }
  if (hostname === "localhost") throw new Error("Refusing to fetch localhost");
  let addresses: { address: string }[];
  try {
    addresses = await dnsLookup(hostname, { all: true });
  } catch (err: any) {
    throw new Error(`Could not resolve ${hostname}: ${err.message || err}`);
  }
  for (const { address } of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new Error(`Refusing to fetch ${hostname} — it resolves to a private/internal address (${address})`);
    }
  }
}

/**
 * Normalizes an agent-supplied HTTP(S) URL and proves that its current DNS
 * answers do not target loopback, link-local, private, or reserved networks.
 * Callers that follow redirects must invoke this again for every hop.
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<string> {
  const normalized = normalizeUrl(rawUrl);
  await assertPublicHost(normalized);
  return normalized;
}

export async function fetchSiteContent(rawUrl: string, timeoutMs = 12000): Promise<SiteSnapshot> {
  let url = normalizeUrl(rawUrl);
  const requestedUrl = url;

  // Manual redirect loop (instead of redirect:"follow") so every hop —
  // including ones a malicious/compromised server adds after the fact — is
  // re-validated against the same private-IP check as the original URL.
  let res: Response | null = null;
  for (let hop = 0; hop < 5; hop++) {
    await assertPublicHost(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      res = await fetch(url, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SigmaTactixGrowthOS/1.0; +https://sigmatactix.com)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error(`Fetching ${url} timed out after ${timeoutMs}ms`);
      }
      throw new Error(`Could not reach ${url}: ${err.message || err}`);
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      url = new URL(res.headers.get("location") as string, url).toString();
      if (url.startsWith("http:") === false && url.startsWith("https:") === false) {
        throw new Error(`Redirected to an unsupported URL scheme: ${url}`);
      }
      continue;
    }
    break;
  }
  if (!res) throw new Error(`Could not reach ${url}`);

  if (!res.ok) {
    throw new Error(`${url} responded ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const h1s = $("h1").map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const h2s = $("h2").map((_, el) => $(el).text().trim()).get().filter(Boolean);

  const structuredDataTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && item["@type"]) {
          structuredDataTypes.push(String(item["@type"]));
        }
      }
    } catch {
      // malformed JSON-LD on the page — ignore, not our bug to fix
    }
  });

  const openGraph: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr("property");
    const content = $(el).attr("content");
    if (prop && content) openGraph[prop] = content;
  });

  let internalLinkCount = 0;
  let externalLinkCount = 0;
  const origin = new URL(url).origin;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const resolved = new URL(href, url);
      if (resolved.origin === origin) internalLinkCount++;
      else externalLinkCount++;
    } catch {
      // relative/invalid href we couldn't resolve — skip
    }
  });

  const images = $("img");
  let imagesMissingAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (!alt || !alt.trim()) imagesMissingAlt++;
  });

  const analyticsSignals = ANALYTICS_SIGNATURES
    .filter(sig => sig.pattern.test(html))
    .map(sig => sig.label);

  $("script, style, noscript").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").length : 0;

  const bodyLower = bodyText.toLowerCase();
  const hasFaqContent =
    structuredDataTypes.includes("FAQPage") ||
    /frequently asked questions|\bfaq\b/.test(bodyLower);

  return {
    url: requestedUrl,
    finalUrl: res.url || url,
    statusCode: res.status,
    title: $("title").first().text().trim(),
    metaDescription: $('meta[name="description"]').attr("content")?.trim() || "",
    h1s,
    h2s,
    wordCount,
    hasViewportMeta: $('meta[name="viewport"]').length > 0,
    hasStructuredData: structuredDataTypes.length > 0,
    structuredDataTypes: [...new Set(structuredDataTypes)],
    hasFaqContent,
    openGraph,
    canonicalUrl: $('link[rel="canonical"]').attr("href") || null,
    internalLinkCount,
    externalLinkCount,
    imageCount: images.length,
    imagesMissingAlt,
    analyticsSignals,
    bodyTextSample: bodyText.slice(0, 6000),
    fetchedAt: new Date().toISOString(),
  };
}

// A short, LLM-friendly summary block — every audit prompt embeds this
// instead of re-deriving its own ad-hoc description of the same fetch.
export function summarizeSnapshotForPrompt(snap: SiteSnapshot): string {
  return `
URL: ${snap.finalUrl} (HTTP ${snap.statusCode})
Title: ${snap.title || "(missing)"}
Meta description: ${snap.metaDescription || "(missing)"}
H1s: ${snap.h1s.join(" | ") || "(none found)"}
H2s (first 8): ${snap.h2s.slice(0, 8).join(" | ") || "(none found)"}
Word count: ${snap.wordCount}
Mobile viewport tag present: ${snap.hasViewportMeta}
Structured data (schema.org) present: ${snap.hasStructuredData} — types: ${snap.structuredDataTypes.join(", ") || "none"}
FAQ / answer-format content detected: ${snap.hasFaqContent}
Open Graph tags present: ${Object.keys(snap.openGraph).length > 0}
Canonical tag: ${snap.canonicalUrl || "(missing)"}
Internal links: ${snap.internalLinkCount}, External links: ${snap.externalLinkCount}
Images: ${snap.imageCount} total, ${snap.imagesMissingAlt} missing alt text
Detected analytics/tracking scripts: ${snap.analyticsSignals.join(", ") || "none detected"}
Visible body text sample (truncated):
"""
${snap.bodyTextSample.slice(0, 3000)}
"""
`.trim();
}

export function createSyntheticSnapshot(domain: string): SiteSnapshot {
  const clean = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase().trim();
  const brandName = clean.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    url: `https://${clean}`,
    finalUrl: `https://${clean}`,
    statusCode: 200,
    title: `${brandName} — Modern Growth & Digital Intelligence Infrastructure`,
    metaDescription: `${brandName} accelerates business performance through data-driven digital operations and customer intelligence.`,
    h1s: [`Scale Your Performance with ${brandName}`],
    h2s: ["Core Capabilities", "Why Industry Leaders Choose Us", "Measurable Business Impact", "Integrated Customer Platform"],
    wordCount: 840,
    hasViewportMeta: true,
    hasStructuredData: true,
    structuredDataTypes: ["Organization", "WebSite"],
    hasFaqContent: false,
    openGraph: {
      title: `${brandName} Platform`,
      description: `Official digital presence and growth platform for ${brandName}`,
      type: "website"
    },
    canonicalUrl: `https://${clean}/`,
    internalLinkCount: 24,
    externalLinkCount: 6,
    imageCount: 18,
    imagesMissingAlt: 5,
    analyticsSignals: ["Google Tag Manager", "Google Analytics (gtag.js)"],
    bodyTextSample: `${brandName} provides comprehensive digital intelligence, marketing attribution, and automated growth capabilities for high-performance organizations. Discover unified workflows, multi-channel customer acquisition, and enterprise data governance.`,
    // Marked synthetic: this content was NOT fetched. Evidence records must be
    // able to tell a synthetic snapshot from a real observation, or a failed
    // crawl would silently become "evidence".
    fetchedAt: new Date().toISOString(),
    synthetic: true,
  };
}
