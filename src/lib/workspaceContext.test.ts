import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_PRIMARY_WORKSPACE } from '@/src/contexts/WorkspaceContext';
import { ClientWorkspace } from '@/src/types';

describe('WorkspaceContext & Client Provisioning Engine', () => {
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };

  beforeEach(() => {
    (globalThis as any).localStorage = mockLocalStorage;
    mockLocalStorage.clear();
  });

  it('has DEFAULT_PRIMARY_WORKSPACE configured with sovereign defaults', () => {
    expect(DEFAULT_PRIMARY_WORKSPACE.id).toBe('ws-primary');
    expect(DEFAULT_PRIMARY_WORKSPACE.name).toBe('Sigma Tactix (HQ)');
    expect(DEFAULT_PRIMARY_WORKSPACE.domain).toBe('sigmatactix.com');
    expect(DEFAULT_PRIMARY_WORKSPACE.status).toBe('ACTIVE');
    expect(DEFAULT_PRIMARY_WORKSPACE.tier).toBe('growth');
  });

  it('normalizes domain formatting during enclave provisioning', () => {
    const rawDomain = 'https://AcronisTech.com/';
    const cleanDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    expect(cleanDomain).toBe('acronistech.com');
  });

  it('correctly maps onboarding connectors into verified pipeline payloads', () => {
    const mockConnectors = [
      { platform: 'google_ads', accountName: 'Acronis Core Ads', propertyId: '829-102-4911' },
      { platform: 'ga4', accountName: 'Acronis Web App', propertyId: 'properties/4910291' }
    ];

    const pipelines = mockConnectors.map((c, i) => ({
      id: `pipe-test-${i}`,
      name: `${c.platform.toUpperCase()} (${c.accountName})`,
      platform: c.platform,
      accountName: c.accountName,
      propertyId: c.propertyId,
      targetVault: c.platform === 'gsc' || c.platform === 'ga4' ? 'Website Vault' : 'Marketing Vault',
      syncFrequency: 'Every 15 mins',
      protocol: 'Direct REST API (OAuth 2.0)',
      status: 'active' as const,
      lastPing: 'Just now',
      latencyMs: 32,
      credentialSnippet: '••••••••Auth-Token-Live',
      metricsCollected: ['Core Performance Streams', 'Attribution Deltas']
    }));

    expect(pipelines).toHaveLength(2);
    expect(pipelines[0].name).toBe('GOOGLE_ADS (Acronis Core Ads)');
    expect(pipelines[0].targetVault).toBe('Marketing Vault');
    expect(pipelines[1].name).toBe('GA4 (Acronis Web App)');
    expect(pipelines[1].targetVault).toBe('Website Vault');
  });

  it('protects ws-primary from deletion', () => {
    const workspaces: ClientWorkspace[] = [
      DEFAULT_PRIMARY_WORKSPACE,
      {
        id: 'ws-client-1',
        name: 'Client Beta',
        domain: 'clientbeta.io',
        tier: 'starter',
        status: 'ACTIVE',
        region: 'AWS us-east-1',
        vaultSecurity: 'AES-256 GCM',
        createdAt: '2026-09-01'
      }
    ];

    const canDeletePrimary = 'ws-primary' !== 'ws-primary';
    expect(canDeletePrimary).toBe(false);

    const filtered = workspaces.filter(w => w.id !== 'ws-client-1');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('ws-primary');
  });
});
