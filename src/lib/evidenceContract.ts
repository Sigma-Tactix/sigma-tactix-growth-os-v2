/**
 * Evidence Contracts & Deterministic Claim Verification (Phase 2)
 *
 * Implements strict claim classifications, deterministic arithmetic/denominator bounds,
 * workspace boundary checks, contradiction detection, and artifact hash integrity.
 */

import crypto from 'crypto';

export type ClaimClassification =
  | 'measured_fact'
  | 'calculation'
  | 'estimate'
  | 'hypothesis'
  | 'unavailable';

export interface EvidenceRecord {
  id: string;
  workspaceId: string;
  claimId: string;
  claimClassification: ClaimClassification;
  claimText: string;
  dataSource: 'live' | 'connector' | 'synthetic' | 'manual_audit' | 'benchmark';
  sourceLocator: string;
  coveredPeriod: { start: string; end: string };
  observationTime: string;
  retrievalResult: 'success' | 'partial' | 'failed' | 'simulated';
  scope: string;
  confidence: number; // 0.0 - 1.0 (advisory only)
  baselineRange?: { min: number; max: number; unit: string };
  numericValue?: number;
  denominator?: number;
  artifactHash?: string;
  dependencies?: string[];
}

export interface ClaimVerificationInput {
  claimId: string;
  workspaceId: string;
  statement: string;
  claimedPercentage?: number;
  hasBehavioralAnalyticsEvidence?: boolean;
  evidence: EvidenceRecord[];
  expectedArtifactHash?: string;
}

export interface ClaimVerificationResult {
  claimId: string;
  verified: boolean;
  classification: ClaimClassification;
  reasons: string[];
}

export interface DiscrepancyResult {
  hasDiscrepancy: boolean;
  conflictDetails: Array<{ evidenceId: string; locator: string; value: unknown }>;
  allowMajorityVoteOverride: boolean;
}

export function computeArtifactSha256(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Classifies a claim deterministically based on empirical provenance inputs.
 */
export function classifyClaim(params: {
  hasDirectMeasurement?: boolean;
  isDerivedCalculation?: boolean;
  isEstimated?: boolean;
  isCausalAssumption?: boolean;
  retrievalFailed?: boolean;
  dataSource?: string;
}): ClaimClassification {
  if (params.retrievalFailed) return 'unavailable';
  if (params.hasDirectMeasurement && params.dataSource === 'live') return 'measured_fact';
  if (params.isDerivedCalculation) return 'calculation';
  if (params.isEstimated) return 'estimate';
  if (params.isCausalAssumption) return 'hypothesis';
  return 'estimate';
}

/**
 * Validates a claim against its supporting evidence records according to Phase 2 rules.
 */
export function verifyClaimEvidence(input: ClaimVerificationInput): ClaimVerificationResult {
  const reasons: string[] = [];
  let classification: ClaimClassification = 'measured_fact';

  if (!input.evidence || input.evidence.length === 0) {
    return {
      claimId: input.claimId,
      verified: false,
      classification: 'unavailable',
      reasons: ['No evidence records provided for claim.'],
    };
  }

  // 1. Workspace boundary check
  for (const ev of input.evidence) {
    if (ev.workspaceId !== input.workspaceId) {
      reasons.push(`Evidence ${ev.id} failed workspace isolation mismatch: ${ev.workspaceId} !== ${input.workspaceId}`);
    }
  }

  // 2. Artifact hash check
  if (input.expectedArtifactHash) {
    for (const ev of input.evidence) {
      if (ev.artifactHash && ev.artifactHash !== input.expectedArtifactHash) {
        reasons.push(`Artifact hash altered or mismatched for evidence ${ev.id}`);
      }
    }
  }

  // 3. Date bounds & Freshness check
  for (const ev of input.evidence) {
    const obsTime = new Date(ev.observationTime).getTime();
    const periodStart = new Date(ev.coveredPeriod.start).getTime();
    const periodEnd = new Date(ev.coveredPeriod.end).getTime();

    // Allow a 30-day grace window around the covered period
    const minTime = periodStart - 30 * 24 * 60 * 60 * 1000;
    const maxTime = periodEnd + 30 * 24 * 60 * 60 * 1000;

    if (isNaN(obsTime) || obsTime < minTime || obsTime > maxTime) {
      reasons.push(`Evidence ${ev.id} observation time (${ev.observationTime}) is stale or outside covered period [${ev.coveredPeriod.start} - ${ev.coveredPeriod.end}]`);
    }
  }

  // 4. Arithmetic & Denominator checks
  for (const ev of input.evidence) {
    if (ev.claimClassification === 'calculation' || ev.numericValue !== undefined) {
      if (ev.denominator !== undefined && ev.denominator <= 0) {
        reasons.push(`Invalid or missing denominator (denominator=${ev.denominator}) for calculation evidence ${ev.id}`);
      }
    }
  }

  // 5. Unevidenced quantitative percentages
  if (input.claimedPercentage !== undefined && input.claimedPercentage > 0) {
    if (input.hasBehavioralAnalyticsEvidence === false) {
      reasons.push(
        `Unevidenced quantitative percentage (${input.claimedPercentage}%) cannot be accepted as measured fact without behavioral analytics/instrumentation telemetry.`
      );
      classification = 'hypothesis';
    }
  }

  // Determine overall classification
  if (input.evidence.some(e => e.retrievalResult === 'failed')) {
    classification = 'unavailable';
  } else if (classification !== 'hypothesis') {
    const primary = input.evidence[0];
    classification = primary.claimClassification;
  }

  const verified = reasons.length === 0;

  return {
    claimId: input.claimId,
    verified,
    classification,
    reasons,
  };
}

/**
 * Detects contradictory evidence for the same claim/metric without majority-voting away discrepancies.
 */
export function detectEvidenceDiscrepancy(evidenceList: EvidenceRecord[]): DiscrepancyResult {
  if (evidenceList.length < 2) {
    return {
      hasDiscrepancy: false,
      conflictDetails: [],
      allowMajorityVoteOverride: false,
    };
  }

  const conflicts: Array<{ evidenceId: string; locator: string; value: unknown }> = [];
  const firstVal = evidenceList[0].numericValue;

  for (const ev of evidenceList) {
    if (ev.numericValue !== firstVal && ev.numericValue !== undefined && firstVal !== undefined) {
      conflicts.push({
        evidenceId: ev.id,
        locator: ev.sourceLocator,
        value: ev.numericValue,
      });
    }
  }

  if (conflicts.length > 0) {
    // Include the first reference as well to present both sides
    conflicts.unshift({
      evidenceId: evidenceList[0].id,
      locator: evidenceList[0].sourceLocator,
      value: firstVal,
    });
  }

  return {
    hasDiscrepancy: conflicts.length > 0,
    conflictDetails: conflicts,
    // Strict requirement: No majority vote may manufacture certainty
    allowMajorityVoteOverride: false,
  };
}
