import { describe, it, expect } from "vitest";
import { computeAuditScore, AUDIT_RUBRIC } from "./auditScoring.js";
import type { SiteSnapshot } from "./siteFetch.js";

const base: SiteSnapshot = {
  url: "https://client.example/",
  finalUrl: "https://client.example/",
  statusCode: 200,
  title: "Client",
  metaDescription: "",
  h1s: [],
  h2s: [],
  wordCount: 0,
  hasViewportMeta: false,
  hasStructuredData: false,
  structuredDataTypes: [],
  hasFaqContent: false,
  openGraph: {},
  canonicalUrl: null,
  internalLinkCount: 0,
  externalLinkCount: 0,
  imageCount: 0,
  imagesMissingAlt: 0,
  analyticsSignals: [],
  bodyTextSample: "",
  fetchedAt: "2026-10-02T09:00:00Z",
};

describe("Phase 2 deterministic audit rubric", () => {
  it("scores 0 when nothing observable is present — and says so", () => {
    const r = computeAuditScore({ snapshot: base });
    expect(r.score).toBe(0);
    expect(r.earnedPoints).toBe(0);
    expect(r.checks.every(c => !c.passed)).toBe(true);
  });

  it("awards points only for signals actually observed", () => {
    const r = computeAuditScore({
      snapshot: { ...base, hasViewportMeta: true, hasStructuredData: true, wordCount: 900 },
    });
    expect(r.earnedPoints).toBeGreaterThan(0);
    const passed = r.checks.filter(c => c.passed).map(c => c.id);
    expect(passed).toContain('viewport');
    expect(passed).toContain('structuredData');
    expect(passed).toContain('contentDepth');
  });

  it("REFUSES to score a synthetic snapshot instead of reporting a number", () => {
    // A failed crawl produced fabricated page content. Scoring it would present
    // an invented number as an observation.
    const r = computeAuditScore({ snapshot: { ...base, synthetic: true } });
    expect(r.score).toBeNull();
    expect(r.basis).toMatch(/not a zero/i);
  });

  it("reports unobservable categories as not assessed, never as zero", () => {
    const r = computeAuditScore({
      snapshot: base,
      notAssessedCategories: ['socialMediaPresence', 'aiVisibility'],
    });
    expect(r.notAssessed).toEqual(['socialMediaPresence', 'aiVisibility']);
    expect(r.basis).toMatch(/excluded, not scored zero/);
  });

  it("states what the score is based on, so a client can audit it", () => {
    const r = computeAuditScore({ snapshot: base });
    expect(r.basis).toContain(String(AUDIT_RUBRIC.length));
    expect(r.basis).toContain('published checks');
  });

  it("scores a perfect page to 100 with no manual tuning", () => {
    const perfect = { ...base } as SiteSnapshot;
    for (const c of AUDIT_RUBRIC) c.observed(perfect); // sanity: predicates exist
    const r = computeAuditScore({
      snapshot: {
        ...base,
        hasViewportMeta: true, hasStructuredData: true, canonicalUrl: 'https://client.example/',
        wordCount: 2000, hasFaqContent: true, imageCount: 5, imagesMissingAlt: 0,
        internalLinkCount: 20, analyticsSignals: ['Google Analytics'], externalLinkCount: 5,
        openGraph: { 'og:title': 'Client' },
      },
    });
    expect(r.score).toBe(100);
  });

  it("never lets a broken predicate crash the audit", () => {
    const r = computeAuditScore({ snapshot: { ...base, analyticsSignals: null as any } });
    expect(r.checks.length).toBe(AUDIT_RUBRIC.length);
    expect(r.score).not.toBeNull();
  });
});