import { describe, expect, it } from 'vitest';
import {
  buildCapabilityRegistry,
  buildOperationCapabilities,
  OPERATION_DEFINITIONS,
  type OperationCapabilityStatus,
} from './capabilityRegistry';
import type { WorkspaceData } from '../types';

function workspace(overrides: any = {}): WorkspaceData {
  return {
    id: 'ws-test-01',
    secondBrain: { connectors: [] },
    settings: { technical: { customDomain: '', sslStatus: 'Inactive' }, integrations: [], mcps: [], skills: [] },
    ...overrides,
  } as WorkspaceData;
}

describe('Growth OS capability registry', () => {
  it('does not mislabel an enabled MCP catalogue toggle as configured', () => {
    const registry = buildCapabilityRegistry(workspace({
      settings: {
        technical: { customDomain: '', sslStatus: 'Inactive' },
        integrations: [],
        skills: [],
        mcps: [{ id: 'mcp-growth-1', name: 'Fetch / Web MCP', moduleKey: 'growth', purpose: 'Fetch pages', enabled: true }],
      },
    }));

    expect(registry.capabilities).toContainEqual(expect.objectContaining({
      id: 'mcp-growth-1',
      kind: 'mcp',
      state: 'declared',
      configured: false,
      reachable: false,
      verified: false,
      evidence: ['Workspace catalogue toggle is enabled; no runtime transport or handshake is registered.'],
    }));
  });

  it('reports provider-verified connectors separately from merely declared connectors', () => {
    const registry = buildCapabilityRegistry(workspace({
      secondBrain: {
        connectors: [
          { id: 'ga4', platform: 'Google Analytics', status: 'Connected', connectedBy: 'owner', verificationState: 'verified', verifiedAt: '2026-09-25T00:00:00.000Z' },
          { id: 'meta', platform: 'Meta Ads', status: 'Disconnected', connectedBy: '' },
        ],
      } as WorkspaceData['secondBrain'],
    }));

    expect(registry.capabilities.find(item => item.id === 'connector-ga4')).toMatchObject({
      state: 'verified', configured: true, reachable: true, verified: true,
    });
    expect(registry.capabilities.find(item => item.id === 'connector-meta')).toMatchObject({
      state: 'declared', configured: false, reachable: false, verified: false,
    });
  });

  it('includes Laya runtime evidence without promoting shadow mode to automation-ready', () => {
    const registry = buildCapabilityRegistry(workspace(), {
      provider: 'laya', configured: true, reachable: true, state: 'shadow', mode: 'shadow', model: 'auto',
      calibrated: false, executionEligible: false, checkedAt: '2026-09-25T00:00:00.000Z',
      detail: 'Reachable and observing decisions; deterministic policy remains authoritative.',
    });

    expect(registry.capabilities.find(item => item.id === 'provider-laya')).toMatchObject({
      state: 'reachable', configured: true, reachable: true, verified: false, automationEligible: false,
    });
  });

  it('reports a configured TinyFish key without calling it verified', () => {
    const registry = buildCapabilityRegistry(workspace(), undefined, [{
      provider: 'tinyfish', configured: true, verified: false, operations: ['search', 'fetch'],
      detail: 'API key is configured; no provider request has been verified in this process.',
    }]);
    expect(registry.capabilities.find(item => item.id === 'provider-tinyfish')).toMatchObject({
      state: 'authenticated', configured: true, reachable: false, verified: false,
    });
  });

  describe('S08-A1: Every visible operation has supported/configured/verified/freshness/limitation state', () => {
    it('covers all defined operations with complete state taxonomy', () => {
      const now = new Date().toISOString();
      const registry = buildCapabilityRegistry(workspace(), undefined, [], now);

      expect(registry.operations.length).toBe(OPERATION_DEFINITIONS.length);
      expect(registry.operationsSummary.total).toBe(OPERATION_DEFINITIONS.length);

      for (const op of registry.operations) {
        expect(typeof op.id).toBe('string');
        expect(typeof op.operation).toBe('string');
        expect(typeof op.moduleKey).toBe('string');
        expect(typeof op.provider).toBe('string');
        expect(typeof op.supported).toBe('boolean');
        expect(typeof op.configured).toBe('boolean');
        expect(typeof op.verified).toBe('boolean');
        expect(typeof op.productionVerified).toBe('boolean');
        expect(['fresh', 'stale', 'unverified']).toContain(op.freshness);
        expect(typeof op.limitation).toBe('string');
        expect(op.limitation.length).toBeGreaterThan(0);
        expect(Array.isArray(op.evidence)).toBe(true);
      }
    });

    it('correctly calculates freshness for recent vs expired checks', () => {
      const now = '2026-11-20T12:00:00.000Z';
      const recentCheck = '2026-11-20T08:00:00.000Z'; // 4 hours ago -> fresh
      const staleCheck = '2026-11-18T10:00:00.000Z';  // 48+ hours ago -> stale

      const registryRecent = buildCapabilityRegistry(workspace({
        secondBrain: {
          connectors: [
            { id: 'c1', platform: 'Google Analytics', status: 'Connected', connectedBy: 'owner', verificationState: 'verified', verifiedAt: recentCheck },
          ],
        } as any,
      }), undefined, [], now);

      const registryStale = buildCapabilityRegistry(workspace({
        secondBrain: {
          connectors: [
            { id: 'c1', platform: 'Google Analytics', status: 'Connected', connectedBy: 'owner', verificationState: 'verified', verifiedAt: staleCheck },
          ],
        } as any,
      }), undefined, [], now);

      const opRecent = registryRecent.operations.find(o => o.id === 'search.gsc.read');
      const opStale = registryStale.operations.find(o => o.id === 'search.gsc.read');

      expect(opRecent?.freshness).toBe('fresh');
      expect(opStale?.freshness).toBe('stale');
    });
  });

  describe('S08-A2: Verification identifies exact account/environment/tool version and receipt', () => {
    it('generates structured receipt with exact metadata for verified operations', () => {
      const now = '2026-11-20T12:00:00.000Z';
      const registry = buildCapabilityRegistry(workspace({
        id: 'ws-acme-corp',
        secondBrain: {
          connectors: [
            { id: 'conn-gsc', platform: 'Google Search Console', status: 'Connected', connectedBy: 'owner', verificationState: 'verified', verifiedAt: now },
          ],
        } as any,
      }), undefined, [], now);

      const gscOp = registry.operations.find(o => o.id === 'search.gsc.read');
      expect(gscOp?.verified).toBe(true);
      expect(gscOp?.receipt).toBeDefined();

      const receipt = gscOp!.receipt!;
      expect(receipt.receiptId).toMatch(/^rcpt-search-gsc-read-/);
      expect(receipt.verifiedAt).toBe(now);
      expect(receipt.environment).toBe('production');
      expect(receipt.toolVersion).toBe('gsc:v1');
      expect(receipt.account).toBe('ws-acme-corp');
      expect(receipt.workspaceId).toBe('ws-acme-corp');
      expect(receipt.proof).toContain('Provider handshake verified with Google Search Console');
      expect(receipt.limitation).toContain('Read-only query access');
    });

    it('identifies exact tool versions for built-in deterministic operations', () => {
      const registry = buildCapabilityRegistry(workspace({ id: 'ws-video' }));
      const videoOp = registry.operations.find(o => o.id === 'creative.video.render');

      expect(videoOp?.verified).toBe(true);
      expect(videoOp?.receipt?.toolVersion).toBe('hyperframes:0.8.139');
      expect(videoOp?.receipt?.workspaceId).toBe('ws-video');
    });
  });

  describe('S08-A3: Fixtures and key presence never mark operation production verified', () => {
    it('restricts fixture adapter to unit_verified and test environment, never production_verified', () => {
      const registry = buildCapabilityRegistry(workspace(), undefined, [{
        provider: 'tinyfish',
        configured: true,
        verified: true,
        isFixture: true,
        environment: 'test',
        toolVersion: 'tinyfish:0.4.1-fixture',
        detail: 'Fixture adapter active for deterministic testing and local development.',
      }]);

      const tinyfishOp = registry.operations.find(o => o.id === 'intel.competitors.scan');
      expect(tinyfishOp).toBeDefined();
      expect(tinyfishOp?.isFixture).toBe(true);
      expect(tinyfishOp?.productionVerified).toBe(false);
      expect(tinyfishOp?.verificationLevel).toBe('unit_verified');
      expect(tinyfishOp?.receipt?.environment).toBe('test');
      expect(tinyfishOp?.evidence[0]).toContain('Fixture adapter active for deterministic testing; live production verification pending.');
    });

    it('rejects production verification for MiroFish fixture adapter', () => {
      const registry = buildCapabilityRegistry(workspace(), undefined, [{
        provider: 'mirofish',
        configured: true,
        verified: true,
        isFixture: true,
        detail: 'Fixture market simulation adapter active for deterministic testing and local development.',
      }]);

      const mirofishOp = registry.operations.find(o => o.id === 'intel.simulator.run');
      expect(mirofishOp?.productionVerified).toBe(false);
      expect(mirofishOp?.verificationLevel).toBe('unit_verified');
      expect(mirofishOp?.receipt?.environment).toBe('test');
    });

    it('never marks mere API key presence as verified or production_verified', () => {
      const registry = buildCapabilityRegistry(workspace(), undefined, [{
        provider: 'tinyfish',
        configured: true,
        verified: false,
        detail: 'API key is configured; no live provider request has been verified in this process.',
      }]);

      const tinyfishOp = registry.operations.find(o => o.id === 'intel.competitors.scan');
      expect(tinyfishOp?.configured).toBe(true);
      expect(tinyfishOp?.verified).toBe(false);
      expect(tinyfishOp?.productionVerified).toBe(false);
      expect(tinyfishOp?.verificationLevel).toBe('implemented');
      expect(tinyfishOp?.receipt).toBeUndefined();
      expect(tinyfishOp?.evidence[0]).toContain('API key is configured');
    });

    it('never marks unverified connector credentials as production_verified', () => {
      const registry = buildCapabilityRegistry(workspace({
        secondBrain: {
          connectors: [
            {
              id: 'conn-gsc-unverified',
              platform: 'Google Search Console',
              status: 'Configured',
              verificationState: 'configured',
              credentials: { encrypted: 'cipher-blob-only' } as any,
            },
          ],
        } as any,
      }));

      const gscOp = registry.operations.find(o => o.id === 'search.gsc.read');
      expect(gscOp?.configured).toBe(true);
      expect(gscOp?.verified).toBe(false);
      expect(gscOp?.productionVerified).toBe(false);
      expect(gscOp?.verificationLevel).toBe('implemented');
      expect(gscOp?.receipt).toBeUndefined();
      expect(gscOp?.evidence[0]).toContain('Encrypted credentials exist');
    });
  });
});
