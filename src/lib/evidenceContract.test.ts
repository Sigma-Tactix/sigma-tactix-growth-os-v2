import { describe, it, expect } from 'vitest';
import {
  type EvidenceRecord,
  type ClaimVerificationInput,
  verifyClaimEvidence,
  classifyClaim,
  detectEvidenceDiscrepancy,
  computeArtifactSha256,
} from './evidenceContract';

describe('Evidence Contracts & Deterministic Claim Verification (Phase 2)', () => {
  const basePeriod = {
    start: '2026-09-01T00:00:00Z',
    end: '2026-09-30T23:59:59Z',
  };

  const validEvidence: EvidenceRecord = {
    id: 'ev-funnel-1',
    workspaceId: 'ws-sigmatactix',
    claimId: 'claim-checkout-friction',
    claimClassification: 'measured_fact',
    claimText: 'Checkout form has 5 input fields causing dropoff',
    dataSource: 'live',
    sourceLocator: 'https://sigmatactix.com/contact',
    coveredPeriod: basePeriod,
    observationTime: '2026-09-15T12:00:00Z',
    retrievalResult: 'success',
    scope: 'contact_form_audit',
    confidence: 0.95,
    artifactHash: computeArtifactSha256('contact_form_html_payload'),
  };

  it('classifies claims deterministically according to provenance standard', () => {
    expect(classifyClaim({ hasDirectMeasurement: true, dataSource: 'live' })).toBe('measured_fact');
    expect(classifyClaim({ isDerivedCalculation: true, hasDirectMeasurement: false })).toBe('calculation');
    expect(classifyClaim({ isEstimated: true })).toBe('estimate');
    expect(classifyClaim({ isCausalAssumption: true })).toBe('hypothesis');
    expect(classifyClaim({ retrievalFailed: true })).toBe('unavailable');
  });

  it('approves a well-formed claim with matching workspace, valid dates, and artifact hash', () => {
    const input: ClaimVerificationInput = {
      claimId: 'claim-checkout-friction',
      workspaceId: 'ws-sigmatactix',
      statement: 'Contact form presents 5 required fields without progressive disclosure',
      claimedPercentage: undefined,
      evidence: [validEvidence],
      expectedArtifactHash: validEvidence.artifactHash,
    };

    const result = verifyClaimEvidence(input);
    expect(result.verified).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.classification).toBe('measured_fact');
  });

  it('rejects claim with foreign workspace evidence (workspace boundary isolation)', () => {
    const foreignEvidence: EvidenceRecord = {
      ...validEvidence,
      workspaceId: 'ws-foreign-client',
    };

    const input: ClaimVerificationInput = {
      claimId: 'claim-1',
      workspaceId: 'ws-sigmatactix',
      statement: 'Some statement',
      evidence: [foreignEvidence],
    };

    const result = verifyClaimEvidence(input);
    expect(result.verified).toBe(false);
    expect(result.reasons.some(r => r.includes('workspace isolation mismatch'))).toBe(true);
  });

  it('rejects or flags unevidenced percentages (e.g. HTML capture claiming 62% abandonment rate)', () => {
    // HTML inspection evidence only proves DOM structure, not quantitative user behavior
    const htmlEvidence: EvidenceRecord = {
      ...validEvidence,
      claimClassification: 'measured_fact',
      scope: 'dom_structure_only',
    };

    const input: ClaimVerificationInput = {
      claimId: 'claim-abandonment',
      workspaceId: 'ws-sigmatactix',
      statement: '62% of mobile visitors abandon the contact form',
      claimedPercentage: 62.0,
      hasBehavioralAnalyticsEvidence: false, // Only has HTML screenshot / DOM capture
      evidence: [htmlEvidence],
    };

    const result = verifyClaimEvidence(input);
    expect(result.verified).toBe(false);
    expect(result.reasons.some(r => r.includes('Unevidenced quantitative percentage'))).toBe(true);
    // Downgraded to hypothesis if presented as fact without behavioral analytics
    expect(result.classification).toBe('hypothesis');
  });

  it('rejects numeric calculations with missing or zero denominators', () => {
    const calculationEvidence: EvidenceRecord = {
      ...validEvidence,
      claimClassification: 'calculation',
      numericValue: 45000,
      denominator: 0, // Zero denominator!
    };

    const input: ClaimVerificationInput = {
      claimId: 'claim-roi',
      workspaceId: 'ws-sigmatactix',
      statement: 'Projected ROI calculation is infinite',
      evidence: [calculationEvidence],
    };

    const result = verifyClaimEvidence(input);
    expect(result.verified).toBe(false);
    expect(result.reasons.some(r => r.includes('Invalid or missing denominator'))).toBe(true);
  });

  it('rejects stale or out-of-bounds observation time', () => {
    const staleEvidence: EvidenceRecord = {
      ...validEvidence,
      observationTime: '2024-01-01T00:00:00Z', // Far outside covered period 2026-09
    };

    const input: ClaimVerificationInput = {
      claimId: 'claim-freshness',
      workspaceId: 'ws-sigmatactix',
      statement: 'Current server SSL configuration',
      evidence: [staleEvidence],
    };

    const result = verifyClaimEvidence(input);
    expect(result.verified).toBe(false);
    expect(result.reasons.some(r => r.includes('stale or outside covered period'))).toBe(true);
  });

  it('detects conflicting evidence and refuses majority-vote resolution', () => {
    const sourceA: EvidenceRecord = {
      ...validEvidence,
      id: 'ev-audit-a',
      claimText: 'GA4 tag is completely missing',
      numericValue: 0,
      sourceLocator: 'https://sigmatactix.com/scripts',
    };
    const sourceB: EvidenceRecord = {
      ...validEvidence,
      id: 'ev-audit-b',
      claimText: 'GA4 tag is installed and firing G-XYZ',
      numericValue: 1,
      sourceLocator: 'https://tagassistant.google.com/?id=G-XYZ',
    };

    const discrepancy = detectEvidenceDiscrepancy([sourceA, sourceB]);
    expect(discrepancy.hasDiscrepancy).toBe(true);
    expect(discrepancy.conflictDetails).toHaveLength(2);
    expect(discrepancy.allowMajorityVoteOverride).toBe(false);
  });

  it('catches altered output artifact hashes', () => {
    const input: ClaimVerificationInput = {
      claimId: 'claim-hash',
      workspaceId: 'ws-sigmatactix',
      statement: 'Verified diagnostic report output',
      evidence: [validEvidence],
      expectedArtifactHash: 'expected-hash-abc-123-nonmatching',
    };

    const result = verifyClaimEvidence(input);
    expect(result.verified).toBe(false);
    expect(result.reasons.some(r => r.includes('Artifact hash altered or mismatched'))).toBe(true);
  });
});
