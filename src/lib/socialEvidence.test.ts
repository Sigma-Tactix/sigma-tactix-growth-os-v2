import { describe, it, expect } from "vitest";
import { buildSocialEvidence, extractPermalinks } from "./socialEvidence.js";

const REAL = {
  id: "m1",
  platform: "Reddit",
  mentionText: "Anyone tried this? https://www.reddit.com/r/marketing/comments/abc123/",
  sourceUrl: "https://www.reddit.com/r/marketing/comments/abc123/",
  author: "u/someperson",
  detectedAt: "2026-10-01T09:00:00Z",
  sentiment: "Negative",
  reach: 8400,
};

const base = { workspaceId: "ws-1", claimId: "c-social", claimText: "Buyers discuss this tool." };

describe("Phase 2 social discussion evidence", () => {
  describe("permalink extraction", () => {
    it("pulls urls out of captured markdown, deduped in order", () => {
      const urls = extractPermalinks(
        "See [a](https://x.com/1) and [b](https://y.com/2) plus https://x.com/1 again."
      );
      expect(urls).toEqual(["https://x.com/1", "https://y.com/2"]);
    });

    it("returns nothing when the capture has no link", () => {
      expect(extractPermalinks("just some text with no url")).toEqual([]);
    });
  });

  it("classifies a real, citable discussion as a measured fact", () => {
    const result = buildSocialEvidence({ mention: REAL, ...base });
    expect(result.classification).toBe("measured_fact");
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0].sourceLocator).toContain("reddit.com");
  });

  it("REFUSES a generic trending capture as evidence about the client", () => {
    // This is the real shape of production data: source_url "hot" and the
    // capture tool as author. It must not become client-facing "sentiment".
    const result = buildSocialEvidence({
      mention: {
        id: "m2",
        platform: "V2EX",
        mentionText: "1. **some thread** (249 replies) - [https://www.v2ex.com/t/1](https://www.v2ex.com/t/1)",
        sourceUrl: "hot",
        author: "Agent Reach Swarm",
        detectedAt: "2026-09-17T16:27:07Z",
      },
      ...base,
    });
    expect(result.classification).toBe("unavailable");
    expect(result.supports).toMatch(/Nothing yet/i);
  });

  it("refuses a swarm-authored capture even when a link is present", () => {
    const result = buildSocialEvidence({
      mention: { ...REAL, author: "Agent Reach Swarm", sourceUrl: "hot" },
      ...base,
    });
    expect(result.classification).toBe("unavailable");
  });

  it("never promotes reach/engagement/sentiment into the claim", () => {
    const result = buildSocialEvidence({ mention: REAL, ...base });
    // The columns exist on the row but must not become a measured audience size.
    expect(result.doesNotSupport).toMatch(/Market size, sentiment accuracy, reach/i);
    expect(result.evidence[0].numericValue).toBeUndefined();
  });

  it("produces no evidence records when there is no permalink at all", () => {
    const result = buildSocialEvidence({
      mention: { ...REAL, mentionText: "no link here", sourceUrl: null },
      ...base,
    });
    expect(result.classification).toBe("unavailable");
    expect(result.evidence).toEqual([]);
  });

  it("scopes each evidence record to the workspace that captured it", () => {
    const result = buildSocialEvidence({ mention: REAL, ...base, workspaceId: "ws-9" });
    expect(result.evidence[0].workspaceId).toBe("ws-9");
    expect(result.evidence[0].scope).toContain("Reddit");
  });
});