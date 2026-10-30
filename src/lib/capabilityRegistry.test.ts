import { describe, expect, it } from 'vitest';
import { buildCapabilityRegistry } from './capabilityRegistry';
import type { WorkspaceData } from '../types';

function workspace(overrides: Partial<WorkspaceData> = {}): WorkspaceData {
  return {
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
});
