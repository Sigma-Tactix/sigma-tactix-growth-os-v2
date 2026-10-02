import { describe, it, expect } from 'vitest';
import {
  emptyWorkspaceFixture,
  incompleteDataFixture,
  approvedDataFixture,
  staleDataFixture,
  providerFailureFixture,
  conflictingDataFixture,
  evaluateOperationalStatus,
  type ProviderDataState,
} from './regressionFixtures';

describe('Phase 0 Regression Fixtures & Status Verification', () => {
  it('emptyWorkspaceFixture has zero false-verified records', () => {
    const status = evaluateOperationalStatus(emptyWorkspaceFixture);
    expect(status.hasVerifiedStatus).toBe(false);
    expect(status.providerState).toBe('unconfigured');
    expect(emptyWorkspaceFixture.secondBrain.connectors.every(c => c.status === 'Disconnected')).toBe(true);
  });

  it('incompleteDataFixture cannot be marked as fully completed or verified', () => {
    const status = evaluateOperationalStatus(incompleteDataFixture);
    expect(status.hasVerifiedStatus).toBe(false);
    expect(status.providerState).toBe('incomplete');
    expect(status.missingBaselines).toContain('mrr_denominator');
  });

  it('approvedDataFixture with valid provenance and hash receives verified status', () => {
    const status = evaluateOperationalStatus(approvedDataFixture);
    expect(status.hasVerifiedStatus).toBe(true);
    expect(status.providerState).toBe('verified_access');
    expect(status.provenanceHash).toBeDefined();
  });

  it('staleDataFixture reports stale data rather than active live state', () => {
    const status = evaluateOperationalStatus(staleDataFixture);
    expect(status.hasVerifiedStatus).toBe(false);
    expect(status.providerState).toBe('stale_data');
    expect(status.isStale).toBe(true);
  });

  it('providerFailureFixture reports explicit failed state instead of 0 errors', () => {
    const status = evaluateOperationalStatus(providerFailureFixture);
    expect(status.hasVerifiedStatus).toBe(false);
    expect(status.providerState).toBe('failed');
    expect(status.errorDetails).toBeDefined();
  });

  it('conflictingDataFixture flags discrepancy without averaging or voting', () => {
    const status = evaluateOperationalStatus(conflictingDataFixture);
    expect(status.hasVerifiedStatus).toBe(false);
    expect(status.providerState).toBe('conflict');
    expect(status.conflicts).toHaveLength(1);
    expect(status.conflicts?.[0].sources).toContain('Stripe');
    expect(status.conflicts?.[0].sources).toContain('GA4');
  });

  it('no toast, AI assertion, or local event can bypass verification gate', () => {
    const spoofed = {
      ...emptyWorkspaceFixture,
      aiAssertion: '100% Verified by Gemini Model Vote',
      localToast: 'Export delivered successfully',
      clientCache: { status: 'DELIVERED' },
    };
    const status = evaluateOperationalStatus(spoofed as any);
    expect(status.hasVerifiedStatus).toBe(false);
    expect(status.providerState).toBe('unconfigured');
  });
});
