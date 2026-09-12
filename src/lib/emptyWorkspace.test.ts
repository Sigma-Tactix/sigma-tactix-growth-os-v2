import { describe, it, expect } from 'vitest';
import { emptyWorkspaceData } from '../initialData';
import { demoWorkspaceData } from '../data/demoWorkspace';

// Regression tests for FEAT-005 (un-seed initialData).
//
// The failure these exist to prevent: loadWorkspace() seeded every new tenant
// with demoWorkspaceData — Sigma Tactix's own demo content — so a pilot
// client's first screen showed a completed audit scoring 68 against
// sigmatactix.com, six credential rows at @sigmatactix.com, five uploaded
// files, and nine connectors reporting 'Connected', all presented as theirs.
//
// FEAT-005 was marked spec_ready with no executable proof, which is the exact
// pattern docs/HARNESS_ADVISORY.md finding A-1 describes. These assertions are
// that proof: they fail loudly if demo content ever reaches the new-workspace
// template again.

describe('emptyWorkspaceData — the template a real new workspace is created from', () => {
  it('R1: contains no Sigma Tactix demo content anywhere in the tree', () => {
    const serialized = JSON.stringify(emptyWorkspaceData).toLowerCase();
    // The demo seed is riddled with these; the empty template must have none.
    expect(serialized).not.toContain('sigmatactix');
    expect(serialized).not.toContain('@');           // no seeded email addresses
    expect(serialized).not.toContain('elena rostova');
    expect(serialized).not.toContain('david sterling');
  });

  it('R1: the demo seed still DOES contain that content (so the test above is meaningful)', () => {
    // Guards against a false pass: if demoWorkspaceData were ever emptied,
    // the assertions above would trivially hold and prove nothing.
    const seed = JSON.stringify(demoWorkspaceData).toLowerCase();
    expect(seed).toContain('sigmatactix');
  });

  it('R1: reports no audit as having been run', () => {
    expect(emptyWorkspaceData.growthAudit.status).toBe('pending');
    expect(emptyWorkspaceData.growthAudit.score).toBe(0);
    expect(emptyWorkspaceData.growthAudit.findings).toHaveLength(0);
    expect(emptyWorkspaceData.growthAudit.recommendations).toHaveLength(0);
    expect(emptyWorkspaceData.growthAudit.roadmap90Day).toHaveLength(0);
    expect(emptyWorkspaceData.uiuxAudit).toBeNull();
    expect(emptyWorkspaceData.analyticsAudit).toBeNull();
    expect(emptyWorkspaceData.secondBrain.auditVault.overallScore).toBe(0);
  });

  it('R1: starts with no client-owned records of any kind', () => {
    expect(emptyWorkspaceData.secondBrain.credentialsVault).toHaveLength(0);
    expect(emptyWorkspaceData.secondBrain.uploadedFiles).toHaveLength(0);
    expect(emptyWorkspaceData.secondBrain.internalStack).toHaveLength(0);
    expect(emptyWorkspaceData.secondBrain.aiWorkflowVault).toHaveLength(0);
    expect(emptyWorkspaceData.contentAssets).toHaveLength(0);
    expect(emptyWorkspaceData.keywords).toHaveLength(0);
    expect(emptyWorkspaceData.agentTasks).toHaveLength(0);
    expect(emptyWorkspaceData.teamMembers).toHaveLength(0);
    expect(emptyWorkspaceData.invitations).toHaveLength(0);
    expect(emptyWorkspaceData.settings.integrations).toHaveLength(0);
    expect(emptyWorkspaceData.settings.technical.customDomain).toBe('');
  });

  it('R1: every vault free-text field is blank', () => {
    const b = emptyWorkspaceData.secondBrain;
    expect(b.brandVault.corePositioning).toBe('');
    expect(b.brandVault.brandSlogan).toBe('');
    expect(b.customerVault.idealCustomerProfile).toBe('');
    expect(b.marketingVault.campaignHistory).toBe('');
    expect(b.websiteVault.siteUrl).toBe('');
    expect(b.executiveVault.financialsOverview).toBe('');
    expect(b.authorityVault.targetKeywords).toHaveLength(0);
    expect(b.operationsVault.standardOperatingProcedures).toHaveLength(0);
  });

  // The connector catalog is deliberately NOT emptied: the connect/disconnect
  // routes resolve a connector by id out of this array, so an empty one would
  // make every integration un-connectable. What must be false is the *state*.
  it('R1: keeps the connector catalog but reports nothing as connected', () => {
    const connectors = emptyWorkspaceData.secondBrain.connectors;
    expect(connectors.length).toBeGreaterThan(0);
    expect(connectors.length).toBe(demoWorkspaceData.secondBrain.connectors.length);
    for (const c of connectors) {
      expect(c.status).toBe('Disconnected');
      expect(c.credentials).toBeUndefined();
      expect(c.lastSyncedAt).toBeUndefined();
      expect(c.connectedBy).toBe('');
    }
  });

  it('R1: keeps the shared MCP and plugin catalog, which is app config not tenant data', () => {
    expect(emptyWorkspaceData.settings.mcps.length).toBeGreaterThan(0);
    expect(emptyWorkspaceData.settings.skills).toHaveLength(0);
    expect(emptyWorkspaceData.settings.agentTeams).toEqual({});
  });

  it('R4: starts the setup wizard at step one with nothing completed', () => {
    expect(emptyWorkspaceData.setupProgress?.currentStep).toBe(1);
    expect(emptyWorkspaceData.setupProgress?.completedSteps).toHaveLength(0);
  });
});
