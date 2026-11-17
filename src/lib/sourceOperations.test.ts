import { describe, expect, it, vi } from 'vitest';
import {
  normalizeAccountIdentifier,
  normalizeSourceMetrics,
  classifyProviderError,
  OPERATION_APPROVAL_REGISTER,
  assessOperationReadiness,
  executeConnectorReconciliation,
} from './sourceOperations';
import type { Connector } from '../types';

describe('Source Operations and Baseline Verification (Task S13)', () => {
  describe('S13-A1: Account Normalization and Metric Reconciliation', () => {
    it('normalizes Google Analytics 4 property and account identifiers', () => {
      expect(normalizeAccountIdentifier('Google Analytics 4', 'properties/458674440')).toEqual({
        valid: true,
        normalizedId: '458674440',
      });
      expect(normalizeAccountIdentifier('GA4', 'accounts/12345')).toEqual({
        valid: true,
        normalizedId: '12345',
      });
      expect(normalizeAccountIdentifier('Google Analytics', 'invalid_id').valid).toBe(false);
    });

    it('normalizes Google Ads 10-digit customer IDs with canonical hyphens', () => {
      expect(normalizeAccountIdentifier('Google Ads', '1234567890')).toEqual({
        valid: true,
        normalizedId: '123-456-7890',
      });
      expect(normalizeAccountIdentifier('Google Ads', '123-456-7890')).toEqual({
        valid: true,
        normalizedId: '123-456-7890',
      });
      expect(normalizeAccountIdentifier('Google Ads', '12345').valid).toBe(false);
    });

    it('enforces Meta Ads act_ prefix and rejects Page IDs', () => {
      expect(normalizeAccountIdentifier('Meta Ads', 'act_109090252077535')).toEqual({
        valid: true,
        normalizedId: 'act_109090252077535',
      });
      expect(normalizeAccountIdentifier('Meta Ads', '109090252077535').valid).toBe(false);
      expect(normalizeAccountIdentifier('Meta Ads', '109090252077535').error).toContain('act_<digits>');
    });

    it('normalizes LinkedIn, X, TikTok, and Search Console properties', () => {
      expect(normalizeAccountIdentifier('LinkedIn Ads', 'urn:li:sponsoredAccount:50998877')).toEqual({
        valid: true,
        normalizedId: '50998877',
      });
      expect(normalizeAccountIdentifier('Twitter Ads', '18ce54d4x5t')).toEqual({
        valid: true,
        normalizedId: '18ce54d4x5t',
      });
      expect(normalizeAccountIdentifier('TikTok Ads', 'adv-7890123')).toEqual({
        valid: true,
        normalizedId: '7890123',
      });
      expect(normalizeAccountIdentifier('Google Search Console', 'https://example.com/')).toEqual({
        valid: true,
        normalizedId: 'https://example.com/',
      });
      expect(normalizeAccountIdentifier('Google Search Console', 'sc-domain:example.com')).toEqual({
        valid: true,
        normalizedId: 'sc-domain:example.com',
      });
    });

    it('normalizes source metrics, calculates ROAS/CTR/CPC, and tags freshness', () => {
      const now = new Date().toISOString();
      const metrics = normalizeSourceMetrics('Meta Ads', 'act_123456789', {
        spend: 1500,
        revenue: 4500,
        conversions: 30,
        impressions: 50000,
        clicks: 1250,
      }, {
        accountName: 'Growth Performance Account',
        observedAt: now,
        isFixture: false,
      });

      expect(metrics.accountIdentifier).toBe('act_123456789');
      expect(metrics.spend).toBe(1500);
      expect(metrics.revenue).toBe(4500);
      expect(metrics.roas).toBe(3.0);
      expect(metrics.ctr).toBe(2.5); // (1250 / 50000) * 100
      expect(metrics.cpc).toBe(1.2); // 1500 / 1250
      expect(metrics.freshness).toBe('fresh');
      expect(metrics.providerStatus).toBe('synced');
      expect(metrics.isFixture).toBe(false);
      expect(metrics.source).toBe('live_provider');
      expect(metrics.verificationLevel).toBe('production_verified');
    });
  });

  describe('S13-A2: Honest Refresh, Revoke, Permission, Empty, and Stale State', () => {
    it('classifies 401 Unauthorized as revoked requiring re-authentication', () => {
      const result = classifyProviderError(401, { error: { message: 'The access token has expired' } });
      expect(result.outcome).toBe('revoked');
      expect(result.requiresReauth).toBe(true);
      expect(result.message).toContain('expired');
    });

    it('classifies 403 Forbidden as permission denied without masking as sync failure', () => {
      const result = classifyProviderError(403, { error: { message: 'Missing ads_read permission on this system user' } });
      expect(result.outcome).toBe('permission_denied');
      expect(result.requiresReauth).toBe(true);
      expect(result.message).toContain('Missing ads_read');
    });

    it('detects empty telemetry payloads and tags providerStatus as empty', () => {
      const metrics = normalizeSourceMetrics('Google Ads', '123-456-7890', {
        spend: 0,
        revenue: 0,
        conversions: 0,
        impressions: 0,
        clicks: 0,
      });
      expect(metrics.providerStatus).toBe('empty');
      expect(metrics.roas).toBe(0);
    });

    it('identifies stale metrics when observation timestamp exceeds 24 hours', () => {
      const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const metrics = normalizeSourceMetrics('Google Ads', '123-456-7890', {
        spend: 500,
        revenue: 1000,
        conversions: 10,
        impressions: 5000,
        clicks: 100,
      }, {
        observedAt: twoDaysAgo,
      });
      expect(metrics.freshness).toBe('stale');
      expect(metrics.providerStatus).toBe('stale');
    });

    it('transitions connector status honestly to failed on revoked credentials during reconciliation', async () => {
      const connector: Connector = {
        id: 'conn-meta-1',
        platform: 'Meta Ads',
        status: 'Connected',
        verificationState: 'verified',
        connectedBy: 'admin',
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Error validating access token: Session has expired.' } }),
      });

      const outcome = await executeConnectorReconciliation(
        connector,
        { accessToken: 'expired-token', adAccountId: 'act_109090252077535' },
        mockFetch as any
      );

      expect(outcome.status).toBe('Revoked');
      expect(outcome.updatedConnectorState?.status).toBe('Disconnected');
      expect(outcome.updatedConnectorState?.verificationState).toBe('failed');
      expect(outcome.updatedConnectorState?.verificationError).toContain('expired');
    });

    it('transitions connector status to failed on 403 permission denied during reconciliation', async () => {
      const connector: Connector = {
        id: 'conn-meta-2',
        platform: 'Meta Ads',
        status: 'Connected',
        verificationState: 'verified',
        connectedBy: 'admin',
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: 'User does not have permission to access ad account act_109090252077535' } }),
      });

      const outcome = await executeConnectorReconciliation(
        connector,
        { accessToken: 'unauthorized-token', adAccountId: 'act_109090252077535' },
        mockFetch as any
      );

      expect(outcome.status).toBe('PermissionDenied');
      expect(outcome.updatedConnectorState?.verificationState).toBe('failed');
      expect(outcome.message).toContain('User does not have permission');
    });
  });

  describe('S13-A3: Operation Approvals Register and Live vs Fixture Distinction', () => {
    it('verifies all registered operations specify required developer app approvals and scopes', () => {
      expect(OPERATION_APPROVAL_REGISTER.length).toBeGreaterThanOrEqual(8);
      for (const op of OPERATION_APPROVAL_REGISTER) {
        expect(op.operationId).toBeDefined();
        expect(op.requiredAppApproval).toBeDefined();
        expect(op.requiredCredentials.length).toBeGreaterThan(0);
        expect(op.requiredScopes.length).toBeGreaterThan(0);
      }
    });

    it('records missing credentials when operations lack configured keys', () => {
      const readiness = assessOperationReadiness('paid.ads.metrics', {});
      expect(readiness.configured).toBe(false);
      expect(readiness.readinessState).toBe('blocked_credentials');
      expect(readiness.missingCredentials).toContain('accessToken');
      expect(readiness.missingCredentials).toContain('adAccountId');
      expect(readiness.missingApprovals).toContain('Meta App Review: ads_read permission and Business Verification');
    });

    it('enforces that test fixtures cannot be promoted to production verification', () => {
      const fixtureMetrics = normalizeSourceMetrics('TinyFish Intelligence', 'client-scan-1', {
        spend: 0,
        revenue: 0,
        conversions: 15,
        impressions: 200,
        clicks: 50,
      }, {
        isFixture: true,
      });

      expect(fixtureMetrics.isFixture).toBe(true);
      expect(fixtureMetrics.source).toBe('fixture');
      expect(fixtureMetrics.verificationLevel).toBe('unit_verified');
      expect(fixtureMetrics.verificationLevel).not.toBe('production_verified');
    });

    it('records fixture readiness state explicitly when fixture mode is active', () => {
      const readiness = assessOperationReadiness('paid.ads.metrics', {}, { allowFixture: true });
      expect(readiness.isFixture).toBe(true);
      expect(readiness.readinessState).toBe('ready_fixture');
      expect(readiness.remediationNote).toContain('deterministic test fixture mode');
    });

    it('marks operation ready for live execution only when all credentials and approvals are present', () => {
      const readiness = assessOperationReadiness('paid.ads.metrics', {
        accessToken: 'valid-meta-token',
        adAccountId: 'act_109090252077535',
        appApproved: true,
        verified: true,
      });

      expect(readiness.configured).toBe(true);
      expect(readiness.hasRequiredApprovals).toBe(true);
      expect(readiness.readinessState).toBe('ready_live');
      expect(readiness.missingCredentials).toHaveLength(0);
      expect(readiness.missingApprovals).toHaveLength(0);
      expect(readiness.isFixture).toBe(false);
    });
  });
});
