/**
 * Phase 2 §6: cross-claim consistency and independent review.
 *
 * Two rules from the plan are enforced here:
 *
 *  1. "Conflicting evidence is surfaced as a discrepancy with both references.
 *     No majority vote may manufacture certainty." So disagreement is reported,
 *     never resolved by counting votes.
 *
 *  2. "A model's confidence is advisory; it cannot override failed checks."
 *     The reviewer below may only TIGHTEN a claim's classification — it can
 *     turn `measured_fact` into `estimate`, but it can never promote an
 *     `estimate` into `measured_fact`. That direction is one-way by design, and
 *     the test suite pins it.
 */
import {
  detectEvidenceDiscrepancy,
  type ClaimClassification,
  type EvidenceRecord,
} from "./evidenceContract.js";

export interface ClaimUnderReview {
  claimId: string;
  claimText: string;
  classification: ClaimClassification;
  evidence: EvidenceRecord[];
  /** Findings surfaced for this claim, if any. */
  findingIds?: string[];
}

export interface ClaimDiscrepancy {
  claimId: string;
  claimText: string;
  /** Both sides, with locators — never a resolution. */
  references: Array<{ evidenceId: string; locator: string; value: unknown }>;
  /** Always false: a vote must never manufacture certainty. */
  resolvedByMajorityVote: false;
}

/**
 * Finds claims whose supporting evidence disagrees.
 *
 * Note the limit of this check: it can only compare claims that HAVE multiple
 * numeric observations. A claim with one observation is not proven consistent —
 * it is simply un-cross-examined, and must not be reported as "confirmed".
 */
export function detectClaimDiscrepancies(
  claims: ClaimUnderReview[]
): ClaimDiscrepancy[] {
  const out: ClaimDiscrepancy[] = [];
  for (const claim of claims) {
    const result = detectEvidenceDiscrepancy(claim.evidence);
    if (result.hasDiscrepancy) {
      out.push({
        claimId: claim.claimId,
        claimText: claim.claimText,
        references: result.conflictDetails,
        resolvedByMajorityVote: false,
      });
    }
  }
  return out;
}

export interface ReviewVerdict {
  claimId: string;
  /** What the reviewer concluded, BEFORE the monotonic guard is applied. */
  proposedClassification?: ClaimClassification;
  rationale?: string;
  /** Set when the reviewer proposed an upgrade that was refused. */
  refusedUpgradeFrom?: ClaimClassification;
  refusedUpgradeTo?: ClaimClassification;
}

const RANK: Record<ClaimClassification, number> = {
  measured_fact: 4,
  calculation: 3,
  estimate: 2,
  hypothesis: 1,
  unavailable: 0,
};

/**
 * Builds the reviewer's input WITHOUT the worker's reasoning.
 *
 * §6 requires independent review to receive "the claim, evidence and
 * acceptance rules without the worker's reasoning". Passing the worker's
 * narrative would let it argue for its own conclusion, so this deliberately
 * assembles only: what was claimed, what evidence exists, and the rules a
 * reviewer may apply. The worker never sees the verdict either — the outcome
 * is the monotonic guard, not a rewrite.
 */
export function buildReviewerPacket(claim: ClaimUnderReview): {
  claimId: string;
  claimText: string;
  currentClassification: ClaimClassification;
  evidence: Array<{
    evidenceId: string;
    sourceLocator: string;
    observationTime: string;
    retrievalResult: string;
    dataSource: string;
    numericValue?: number;
  }>;
  acceptanceRules: string[];
} {
  return {
    claimId: claim.claimId,
    claimText: claim.claimText,
    currentClassification: claim.classification,
    // Only the provenance, not the analyst's prose about it.
    evidence: claim.evidence.map((e) => ({
      evidenceId: e.id,
      sourceLocator: e.sourceLocator,
      observationTime: e.observationTime,
      retrievalResult: e.retrievalResult,
      dataSource: e.dataSource,
      numericValue: e.numericValue,
    })),
    acceptanceRules: [
      'Judge only the claim against the evidence listed. Do not assume anything not shown.',
      'A model estimate may never be restated as a measured fact.',
      'A claim whose evidence retrieval failed is unavailable, not negative.',
      'A single observation is not corroboration.',
      'You may lower confidence only; upgrades are rejected by the system.',
    ],
  };
}

/** Parses a reviewer's response into a verdict, tolerating malformed output. */
export function parseReviewerVerdict(
  claimId: string,
  raw: string
): ReviewVerdict {
  try {
    const parsed = JSON.parse(raw || "{}");
    const allowed: ClaimClassification[] = [
      'measured_fact', 'calculation', 'estimate', 'hypothesis', 'unavailable',
    ];
    return {
      claimId,
      proposedClassification: allowed.includes(parsed?.classification)
        ? parsed.classification
        : undefined,
      rationale: typeof parsed?.rationale === 'string' ? parsed.rationale : undefined,
    };
  } catch {
    // An unreadable review is no review. Silently defaulting to "keep the
    // current classification" would hide that the review step did not happen.
    return { claimId };
  }
}

/**
 * Applies a reviewer's verdict under the monotonic guard.
 *
 * A reviewer may lower confidence (rank decreases) and that is honoured. A
 * reviewer attempting to raise it is refused and recorded, because no model
 * opinion is allowed to manufacture a stronger claim than its evidence.
 */
export function applyReviewVerdict(
  claim: ClaimUnderReview,
  verdict: ReviewVerdict
): { classification: ClaimClassification; refusedUpgrade?: { from: ClaimClassification; to: ClaimClassification } } {
  const proposed = verdict.proposedClassification;
  if (!proposed) return { classification: claim.classification };

  if (RANK[proposed] > RANK[claim.classification]) {
    return {
      classification: claim.classification,
      refusedUpgrade: { from: claim.classification, to: proposed },
    };
  }
  return { classification: proposed };
}