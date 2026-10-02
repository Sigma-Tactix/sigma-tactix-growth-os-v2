import {
  classifyClaim,
  verifyClaimEvidence,
  type ClaimClassification,
  type EvidenceRecord,
} from "./evidenceContract.js";

/**
 * Phase 2: the evidence record for an audit claim.
 *
 * An audit finding says things like "impact 40%". A bare percentage on a client
 * screen reads as a measurement, but it is actually a model's judgement over a
 * fetched page. This attaches the provenance behind that number so it can be
 * labelled for what it is, and so a later reader can check which observation it
 * came from.
 *
 * The classification is decided by `classifyClaim` from the deterministic rules,
 * never by the model's confidence in itself.
 */
export interface AuditClaimEvidence {
  claimId: string;
  claimText: string;
  classification: ClaimClassification;
  verified: boolean;
  reasons: string[];
  evidence: EvidenceRecord[];
}

const SNAPSHOT_ORIGIN = "site_snapshot";

/**
 * Builds the evidence for one audit finding from the evidence that actually
 * exists at audit time.
 *
 * The audit runs against a fetched page snapshot, so:
 *  - a finding with NO live data source is `unavailable` for anything measured —
 *    the page can support what the page says, not an external metric;
 *  - even with a live source, an impact percentage is a model `estimate`. It is
 *    never promoted to `measured_fact`, because nothing measured it.
 */
export function buildAuditClaimEvidence(params: {
  claimId: string;
  workspaceId: string;
  statement: string;
  claimedPercentage: number;
  snapshotUrl: string;
  hasLiveDataSource: boolean;
  /** Snapshot was GENERATED because the crawl failed — supports nothing. */
  isSyntheticSnapshot?: boolean;
  observedAt: string;
}): AuditClaimEvidence {
  const evidence: EvidenceRecord[] = [
    {
      id: `${params.claimId}-${SNAPSHOT_ORIGIN}`,
      workspaceId: params.workspaceId,
      claimId: params.claimId,
      claimClassification: "measured_fact",
      claimText: params.statement,
      // Page content is a real observation of the page, and nothing more.
      dataSource: params.hasLiveDataSource ? "connector" : "manual_audit",
      sourceLocator: params.snapshotUrl,
      coveredPeriod: { start: params.observedAt, end: params.observedAt },
      observationTime: params.observedAt,
      // A synthetic snapshot must never masquerade as a successful retrieval.
      retrievalResult: params.isSyntheticSnapshot ? "simulated" : "success",
      scope: "page_content_snapshot",
      confidence: 0.5, // advisory only; never used to promote a claim
      numericValue: params.claimedPercentage,
    },
  ];

  const classification = classifyClaim({
    hasDirectMeasurement: false, // an impact % is never directly measured
    isEstimated: true,
    // A snapshot that had to be fabricated means we could not observe anything,
    // so the claim is unavailable rather than merely estimated.
    retrievalFailed: params.isSyntheticSnapshot === true,
    dataSource: params.hasLiveDataSource ? "connector" : "manual_audit",
  });

  const verification = verifyClaimEvidence({
    claimId: params.claimId,
    workspaceId: params.workspaceId,
    statement: params.statement,
    claimedPercentage: params.claimedPercentage,
    evidence,
  });

  // The evidence backs the observation; it does not make the model's impact
  // estimate a measurement. If the contract rejects it outright (e.g. workspace
  // mismatch), fall back to the honest "we could not substantiate this" state.
  return {
    claimId: params.claimId,
    claimText: params.statement,
    classification: verification.verified ? classification : verification.classification,
    verified: verification.verified,
    reasons: verification.reasons,
    evidence,
  };
}