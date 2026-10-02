/**
 * Phase 2: turning captured social discussions into evidence records.
 *
 * The user's requirement was "evidence of discussions within groups". That is
 * only satisfied by a real, clickable discussion — and the rule this module
 * enforces is the difference between evidence and decoration:
 *
 *   A captured thread PROVES a discussion exists at that URL. It does NOT
 *   prove what the market thinks, how big the market is, or how positive the
 *   sentiment is. Reach/engagement/sentiment fields are therefore never
 *   promoted into the claim.
 *
 * It also refuses the most dangerous case found in production data: a capture
 * that is a generic trending listing (`source_url: "hot"`) with a swarm as the
 * author. That is the platform's feed, not a conversation about this client, so
 * it is classified `unavailable` rather than dressed up as brand sentiment.
 */
import type { ClaimClassification, EvidenceRecord } from "./evidenceContract.js";

export interface CapturedMention {
  id: string;
  platform: string;
  mentionText: string;
  /** Raw source_url from the capture. Often NOT a permalink. */
  sourceUrl?: string | null;
  author?: string | null;
  detectedAt?: string | null;
  sentiment?: string | null;
  reach?: number | null;
}

export interface SocialEvidenceResult {
  evidence: EvidenceRecord[];
  classification: ClaimClassification;
  /** Claims this capture can and cannot support. */
  supports: string;
  doesNotSupport: string;
  permalinks: string[];
}

/** Pulls real discussion URLs out of captured markdown, deduped in order. */
export function extractPermalinks(mentionText: string): string[] {
  const found: string[] = [];
  const patterns = [
    /\]\(\s*(https?:\/\/[^\s)]+)\s*\)/g,   // markdown [text](url)
    /<?(https?:\/\/[^\s>]+)>?/g,          // bare URL
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(mentionText || "")) !== null) {
      const url = match[1].replace(/[.,;)]+$/, "");
      if (url && !found.includes(url)) found.push(url);
    }
  }
  return found;
}

const SWARM_AUTHOR = /swarm|agent reach|system|bot/i;

/**
 * Builds the evidence record for one captured mention.
 *
 * `claimText` is what the client is asserting, e.g. "customers discuss this
 * on <platform>". The classification is decided by whether the capture carries
 * a real permalink to a real author — never by the sentiment or reach columns.
 */
export function buildSocialEvidence(params: {
  mention: CapturedMention;
  workspaceId: string;
  claimId: string;
  claimText: string;
}): SocialEvidenceResult {
  const { mention } = params;
  const permalinks = extractPermalinks(mention.mentionText || "");

  const isGenericFeed =
    (mention.sourceUrl || "").trim().toLowerCase() === "hot" ||
    SWARM_AUTHOR.test(mention.author || "");

  // A discussion needs BOTH a clickable thread and someone who actually posted.
  const isCitable = permalinks.length > 0 && !isGenericFeed;

  const classification: ClaimClassification = isCitable
    ? "measured_fact"
    : "unavailable";

  const evidence: EvidenceRecord[] = permalinks.length
    ? permalinks.map((url, i) => ({
        id: `${params.claimId}-social-${i + 1}`,
        workspaceId: params.workspaceId,
        claimId: params.claimId,
        claimClassification: classification,
        claimText: params.claimText,
        dataSource: "connector" as const,
        sourceLocator: url,
        coveredPeriod: {
          start: mention.detectedAt || new Date().toISOString(),
          end: mention.detectedAt || new Date().toISOString(),
        },
        observationTime: mention.detectedAt || new Date().toISOString(),
        retrievalResult: "success" as const,
        scope: `social_discussion:${mention.platform}`,
        // Advisory only, and deliberately modest: we observed a thread, we did
        // not measure the market.
        confidence: isCitable ? 0.6 : 0.2,
      }))
    : [];

  const reasons: string[] = [];
  if (permalinks.length === 0) {
    reasons.push("No permalink found in the capture — nothing clickable to cite.");
  }
  if (isGenericFeed) {
    reasons.push(
      "Capture is a generic trending listing (or authored by the capture tool), " +
        "not a discussion about this client."
    );
  }

  return {
    evidence,
    classification,
    supports: isCitable
      ? `That a discussion thread exists at the cited link(s) on ${mention.platform}, captured ${mention.detectedAt || "recently"}.`
      : "Nothing yet. This capture cannot support a client-facing claim.",
    doesNotSupport:
      "Market size, sentiment accuracy, reach, engagement, or any claim that people " +
      "are discussing THIS client. Those require per-brand mentions with real permalinks.",
    permalinks,
  };
}