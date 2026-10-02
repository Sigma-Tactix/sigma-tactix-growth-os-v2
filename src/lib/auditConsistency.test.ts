import { describe, it, expect } from "vitest";
import {
  detectClaimDiscrepancies,
  applyReviewVerdict,
  buildReviewerPacket,
  parseReviewerVerdict,
  type ClaimUnderReview,
} from "./auditConsistency.js";
import type { EvidenceRecord, ClaimClassification } from "./evidenceContract.js";

const ev = (over: Partial<EvidenceRecord>): EvidenceRecord => ({
  id: "e1",
  workspaceId: "ws-1",
  claimId: "c1",
  claimClassification: "measured_fact",
  claimText: "claim",
  dataSource: "connector",
  sourceLocator: "https://a.example/",
  coveredPeriod: { start: "2026-10-01T00:00:00Z", end: "2026-10-01T00:00:00Z" },
  observationTime: "2026-10-01T00:00:00Z",
  retrievalResult: "success",
  scope: "test",
  confidence: 0.8,
  ...over,
});

const claim = (over: Partial<ClaimUnderReview> = {}): ClaimUnderReview => ({
  claimId: "c1",
  claimText: "Claim under review",
  classification: "estimate",
  evidence: [ev({})],
  ...over,
});

describe("Phase 2 cross-claim consistency", () => {
  describe("contradiction detection", () => {
    it("surfaces both references when evidence disagrees", () => {
      const discrepancies = detectClaimDiscrepancies([
        claim({
          evidence: [
            ev({ id: "e1", numericValue: 12 }),
            ev({ id: "e2", sourceLocator: "https://b.example/", numericValue: 47 }),
          ],
        }),
      ]);
      expect(discrepancies).toHaveLength(1);
      expect(discrepancies[0].references).toHaveLength(2);
      expect(discrepancies[0].references.map(r => r.evidenceId)).toEqual(["e1", "e2"]);
    });

    it("never resolves a conflict by majority vote", () => {
      const discrepancies = detectClaimDiscrepancies([
        claim({
          evidence: [
            ev({ id: "e1", numericValue: 10 }),
            ev({ id: "e2", numericValue: 99 }),
            ev({ id: "e3", numericValue: 99 }),
          ],
        }),
      ]);
      // Two against one does not make the 99 "correct": all three positions are
      // surfaced, with locators, and the disagreement is left standing.
      expect(discrepancies[0].resolvedByMajorityVote).toBe(false);
      expect(discrepancies[0].references).toHaveLength(3);
      expect(discrepancies[0].references.map(r => r.value)).toEqual([10, 99, 99]);
    });

    it("reports nothing when evidence agrees", () => {
      expect(
        detectClaimDiscrepancies([
          claim({
            evidence: [ev({ id: "e1", numericValue: 5 }), ev({ id: "e2", numericValue: 5 })],
          }),
        ])
      ).toEqual([]);
    });

    it("does not call a single observation consistent — it is simply unchecked", () => {
      // One source cannot corroborate itself; silence is not confirmation.
      expect(detectClaimDiscrepancies([claim()])).toEqual([]);
    });
  });

  describe("independent review is monotonic", () => {
    it("hands the reviewer evidence and rules but NOT the worker's reasoning", () => {
      const packet = buildReviewerPacket(
        claim({
          claimText: "Paid social is under-invested.",
          classification: "estimate",
        })
      );
      // The packet must not carry narrative/prose fields from the worker.
      expect(Object.keys(packet).sort()).toEqual(
        ['acceptanceRules', 'claimId', 'claimText', 'currentClassification', 'evidence'].sort()
      );
      expect(packet.acceptanceRules.length).toBeGreaterThan(0);
      expect(packet.acceptanceRules.join(' ')).toMatch(/may lower confidence only/i);
      expect(packet.evidence[0]).not.toHaveProperty('insight');
      expect(packet.evidence[0]).not.toHaveProperty('rationale');
    });

    it("treats an unreadable review as NO review rather than a pass", () => {
      const verdict = parseReviewerVerdict('c1', 'not json at all');
      expect(verdict.proposedClassification).toBeUndefined();
    });

    it("ignores a classification outside the allowed vocabulary", () => {
      const verdict = parseReviewerVerdict('c1', JSON.stringify({ classification: 'definitely_true' }));
      expect(verdict.proposedClassification).toBeUndefined();
    });

    it("reads a well-formed verdict", () => {
      const verdict = parseReviewerVerdict('c1', JSON.stringify({ classification: 'hypothesis', rationale: 'single source' }));
      expect(verdict.proposedClassification).toBe('hypothesis');
      expect(verdict.rationale).toBe('single source');
    });

    it("lets a reviewer downgrade a claim", () => {
      const result = applyReviewVerdict(
        claim({ classification: "measured_fact" }),
        { claimId: "c1", proposedClassification: "estimate", rationale: "no corroboration" }
      );
      expect(result.classification).toBe("estimate");
      expect(result.refusedUpgrade).toBeUndefined();
    });

    it("REFUSES a reviewer upgrading an estimate to a measured fact", () => {
      // The core rule: a model's confidence is advisory and cannot manufacture
      // a stronger claim than its evidence supports.
      const result = applyReviewVerdict(
        claim({ classification: "estimate" }),
        { claimId: "c1", proposedClassification: "measured_fact", rationale: "I am confident" }
      );
      expect(result.classification).toBe("estimate");
      expect(result.refusedUpgrade).toEqual({ from: "estimate", to: "measured_fact" });
    });

    it("refuses every attempted upgrade across the whole scale", () => {
      const pairs: Array<[ClaimClassification, ClaimClassification]> = [
        ["unavailable", "estimate"],
        ["hypothesis", "calculation"],
        ["estimate", "measured_fact"],
      ];
      for (const [from, to] of pairs) {
        const result = applyReviewVerdict(
          claim({ classification: from }),
          { claimId: "c1", proposedClassification: to }
        );
        expect(result.classification).toBe(from);
        expect(result.refusedUpgrade?.from).toBe(from);
      }
    });

    it("leaves the classification untouched when the reviewer is silent", () => {
      const result = applyReviewVerdict(claim({ classification: "calculation" }), {
        claimId: "c1",
      });
      expect(result.classification).toBe("calculation");
    });
  });
});