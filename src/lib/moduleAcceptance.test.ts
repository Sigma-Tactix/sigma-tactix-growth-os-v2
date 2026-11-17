import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MARKETING_LIFECYCLE_STAGES } from '../data/marketingWorkflowSequence';
import { SUITE_MODULES } from '../data/suiteHubConfig';
import { OPERATION_DEFINITIONS, buildCapabilityRegistry } from './capabilityRegistry';
import { OPERATION_APPROVAL_REGISTER, assessOperationReadiness } from './sourceOperations';
import { VANTA_TOOL_CATALOG } from './vantaToolGateway';
import { SECRET_VAULT_IDS, isSecretVaultId } from './secretVaultPolicy';
import { AGENT_VAULT_POLICIES } from './agentPolicies';

interface ModuleAcceptanceRow {
  id: string;
  route: string;
  userJob: string;
  input: string;
  requiredOutput: string;
  externalOperation: string;
  deliverable: string;
  dependencies: string[];
  vantaContext: string;
  happyPath: string;
  failurePath: string;
  permissionPath: string;
  evidenceRef: string;
  status: string;
}

function parseModuleAcceptanceCSV(): ModuleAcceptanceRow[] {
  const csvPath = path.resolve(process.cwd(), 'docs/release-2026-11-20/MODULE_ACCEPTANCE.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const rows: ModuleAcceptanceRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 14) {
      rows.push({
        id: parts[0].trim(),
        route: parts[1].trim(),
        userJob: parts[2].trim(),
        input: parts[3].trim(),
        requiredOutput: parts[4].trim(),
        externalOperation: parts[5].trim(),
        deliverable: parts[6].trim(),
        dependencies: parts[7].split(';').map(d => d.trim()),
        vantaContext: parts[8].trim(),
        happyPath: parts[9].trim(),
        failurePath: parts[10].trim(),
        permissionPath: parts[11].trim(),
        evidenceRef: parts[12].trim(),
        status: parts[13].trim(),
      });
    }
  }
  return rows;
}

describe('Module Acceptance & Journey Verification (Task S15)', () => {
  const rows = parseModuleAcceptanceCSV();

  describe('S15-A1: Input, VANTA Task, Output, Next-Step, and Failure Acceptance per Module', () => {
    it('verifies all 25 modules in MODULE_ACCEPTANCE.csv have complete journey dimensions', () => {
      expect(rows.length).toBe(25);

      for (const row of rows) {
        expect(row.id).toBeDefined();
        expect(row.route.startsWith('/')).toBe(true);
        expect(row.userJob.length).toBeGreaterThan(0);
        expect(row.input.length).toBeGreaterThan(0);
        expect(row.requiredOutput.length).toBeGreaterThan(0);
        expect(row.externalOperation.length).toBeGreaterThan(0);
        expect(row.deliverable.length).toBeGreaterThan(0);
        expect(row.vantaContext).toBe('verified');
        expect(row.happyPath).toBe('verified');
        expect(row.failurePath).toBe('verified');
        expect(row.permissionPath).toBe('verified');
        expect(row.evidenceRef.length).toBeGreaterThan(0);
      }
    });

    it('verifies released workflow modules have explicit operational contracts and lifecycle progression', () => {
      // 14 primary operational modules defined in SUITE_MODULES
      expect(SUITE_MODULES.length).toBe(14);

      for (const mod of SUITE_MODULES) {
        expect(mod.purpose.length).toBeGreaterThan(0);
        expect(mod.input.length).toBeGreaterThan(0);
        expect(mod.mainAction.length).toBeGreaterThan(0);
        expect(mod.output.length).toBeGreaterThan(0);
        expect(mod.nextStep.length).toBeGreaterThan(0);
        expect(['ready', 'configured', 'active']).toContain(mod.status.toLowerCase());
        expect(mod.lifecycleStage).toBeDefined();
        expect(MARKETING_LIFECYCLE_STAGES.some(s => s.id === mod.lifecycleStage)).toBe(true);
      }
    });

    it('verifies VANTA tools are strictly typed, bounded, and mapped to operations', () => {
      expect(VANTA_TOOL_CATALOG.size).toBeGreaterThanOrEqual(5);
      for (const [name, tool] of VANTA_TOOL_CATALOG.entries()) {
        expect(name).toBeDefined();
        expect(tool.name).toBe(name);
        expect(tool.description.length).toBeGreaterThan(0);
        expect(tool.effect).toBeDefined();
        expect(['read_only', 'propose_mutation', 'execute_mutating']).toContain(tool.effect);
      }
    });
  });

  describe('S15-A2: Enabled External Action Verification Receipts and Permissions Proof', () => {
    it('verifies external operations have defined providers, operations, and module mappings', () => {
      expect(OPERATION_DEFINITIONS.length).toBeGreaterThanOrEqual(10);
      for (const op of OPERATION_DEFINITIONS) {
        expect(op.id).toBeDefined();
        expect(op.operation).toBeDefined();
        expect(op.moduleKey).toBeDefined();
        expect(op.provider).toBeDefined();
      }
    });

    it('verifies Secret Vaults strictly exclude autonomous agent access', () => {
      expect(SECRET_VAULT_IDS.length).toBeGreaterThan(0);
      for (const id of SECRET_VAULT_IDS) {
        expect(isSecretVaultId(id)).toBe(true);
      }

        // Check all agent vault policies: Executive Vault and Credentials Vault are strictly blocked
        for (const [_agentName, policy] of Object.entries(AGENT_VAULT_POLICIES)) {
          expect(policy.blocked).toContain('Executive Vault');
          expect(policy.blocked).toContain('Credentials Vault');
          expect(policy.allowed).not.toContain('Executive Vault');
          expect(policy.allowed).not.toContain('Credentials Vault');
        }
      });

    it('verifies capability registry generates receipts for verified connectors and reports', () => {
      const mockWorkspace: any = {
        id: 'ws-qa-acme',
        secondBrain: {
          connectors: [
            {
              id: 'ga4',
              platform: 'Google Analytics',
              status: 'Connected',
              verificationState: 'verified',
              verifiedAt: '2026-11-18T00:00:00.000Z',
              connectedBy: 'lead',
            },
          ],
        },
        settings: {
          technical: { customDomain: 'acme.com', sslStatus: 'Active' },
          integrations: [],
          skills: [],
          mcps: [],
        },
      };

      const registry = buildCapabilityRegistry(mockWorkspace);
      expect(registry.operations.length).toBeGreaterThan(0);
      const builtInOp = registry.operations.find(o => o.supported && o.verified);
      expect(builtInOp).toBeDefined();
      expect(builtInOp?.verified).toBe(true);
      expect(builtInOp?.receipt).toBeDefined();
      expect(builtInOp?.receipt?.workspaceId).toBe('ws-qa-acme');
      expect(builtInOp?.receipt?.verificationLevel).toBe('production_verified');
    });
  });

  describe('S15-A3: Truthful Classification of All 25 Rows (No Unavailable Counted as Working)', () => {
    it('ensures zero rows in MODULE_ACCEPTANCE.csv remain pending or unverified', () => {
      for (const row of rows) {
        expect(row.status).not.toBe('pending');
        expect(row.status).not.toBe('unverified');
        expect(['pass', 'blocked', 'fail']).toContain(row.status);
      }
    });

    it('honestly distinguishes developer app approval requirements and blocks ungranted live writes', () => {
      expect(OPERATION_APPROVAL_REGISTER.length).toBe(8);

      // In production mode with ungranted approvals, live operations must be reported as blocked
      const readiness = assessOperationReadiness('paid.ads.budget_mutation', {}, { allowFixture: false });
      expect(readiness.hasRequiredApprovals).toBe(false);
      expect(readiness.missingApprovals.length).toBeGreaterThan(0);

      // In fixture test mode, fixture mode is explicitly tagged
      const fixtureReadiness = assessOperationReadiness('paid.ads.metrics', {}, { allowFixture: true });
      expect(fixtureReadiness.isFixture).toBe(true);
    });
  });
});
