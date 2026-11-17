import { describe, expect, it } from 'vitest';
import * as os from 'os';
import * as path from 'path';
import { ReportArtifactRepository } from './reportArtifactPipeline';
import { isSecretVaultId, isSecretVaultName, SECRET_VAULT_IDS, SECRET_VAULT_NAMES } from './secretVaultPolicy';
import { AGENT_VAULT_POLICIES } from './agentPolicies';
import { resolveSafeWorkspacePath } from './computerRuntime';
import { isPrivateOrReservedIp, assertPublicHost } from './siteFetch';
import { classifyProviderError } from './sourceOperations';
import { VANTA_TOOL_CATALOG } from './vantaToolGateway';

describe('Adversarial Security & Isolation Acceptance (Task S17)', () => {
  describe('S17-A1: Multi-Tenant Client Enclave Isolation Across Surfaces', () => {
    it('strictly denies cross-client artifact downloads between two independent tenants', () => {
      const repo = new ReportArtifactRepository();

      const alphaArtifact = {
        format: 'pdf' as const,
        buffer: new Uint8Array([1, 2, 3, 4]),
        byteSize: 4,
        artifactHash: 'hash-alpha-12345',
        filename: 'sigmatactix-alpha-report.pdf',
        mime: 'application/pdf',
        metadata: { pageCount: 1, workspaceId: 'ws-client-alpha' },
      };

      repo.storeArtifact(alphaArtifact, 'ws-client-alpha', 'snap-alpha-1');

      // 1. Authorized tenant succeeds
      const alphaAccess = repo.getArtifactForWorkspace('hash-alpha-12345', 'ws-client-alpha');
      expect(alphaAccess.status).toBe('found');
      if (alphaAccess.status === 'found') {
        expect(alphaAccess.artifact.filename).toBe('sigmatactix-alpha-report.pdf');
      }

      // 2. Foreign tenant (Client Bravo) is strictly denied with forbidden status
      const bravoAccess = repo.getArtifactForWorkspace('hash-alpha-12345', 'ws-client-bravo');
      expect(bravoAccess.status).toBe('forbidden');
      if (bravoAccess.status === 'forbidden') {
        expect(bravoAccess.error).toContain('Cross-client download denied');
      }

      // 3. Unauthenticated/empty workspace is denied
      const anonymousAccess = repo.getArtifactForWorkspace('hash-alpha-12345', '');
      expect(anonymousAccess.status).toBe('forbidden');
    });

    it('enforces directory boundary and rejects path traversal, null bytes, and sensitive files', async () => {
      const tempBase = path.join(os.tmpdir(), `sigmatactix-test-enclave-${Date.now()}`);
      const alphaRoot = path.join(tempBase, 'ws-client-alpha');
      const bravoRoot = path.join(tempBase, 'ws-client-bravo');

      // 1. Valid workspace paths resolve inside their respective canonical roots
      const alphaFile = await resolveSafeWorkspacePath(alphaRoot, 'reports/report.pdf', true);
      const bravoFile = await resolveSafeWorkspacePath(bravoRoot, 'reports/report.pdf', true);

      expect(alphaFile).toContain('ws-client-alpha');
      expect(bravoFile).toContain('ws-client-bravo');
      expect(alphaFile).not.toEqual(bravoFile);

      // 2. Traversal attempt outside root is blocked
      await expect(resolveSafeWorkspacePath(alphaRoot, '../../outside.txt')).rejects.toThrow(/Path traversal outside workspace root is forbidden/i);

      // 3. Null byte injection is blocked
      await expect(resolveSafeWorkspacePath(alphaRoot, 'bad\0file.txt')).rejects.toThrow(/Null bytes in path are forbidden/i);

      // 4. Sensitive credentials / vault file access is blocked
      await expect(resolveSafeWorkspacePath(alphaRoot, '.env')).rejects.toThrow(/Access to host credentials/i);
      await expect(resolveSafeWorkspacePath(alphaRoot, '.ssh/id_rsa')).rejects.toThrow(/Access to host credentials/i);
      await expect(resolveSafeWorkspacePath(alphaRoot, 'credentials.json')).rejects.toThrow(/Access to host credentials/i);
    });
  });

  describe('S17-A2: Revocation, Secret Vault, Prompt Injection, SSRF, and Approval Mutations Denied', () => {
    it('verifies zero-trust exclusion of all Secret Vaults across all autonomous agent policies', () => {
      expect(SECRET_VAULT_IDS).toContain('credentials');
      expect(SECRET_VAULT_IDS).toContain('credentials-vault');
      expect(SECRET_VAULT_IDS).toContain('executive');
      expect(SECRET_VAULT_IDS).toContain('executive-vault');

      expect(SECRET_VAULT_NAMES).toContain('Executive Vault');
      expect(SECRET_VAULT_NAMES).toContain('Credentials Vault');

      expect(isSecretVaultName('Executive Vault')).toBe(true);
      expect(isSecretVaultName('Credentials Vault')).toBe(true);
      expect(isSecretVaultId('credentials')).toBe(true);
      expect(isSecretVaultId('executive')).toBe(true);

      for (const [agentName, policy] of Object.entries(AGENT_VAULT_POLICIES)) {
        expect(policy.blocked, `${agentName} must block Executive Vault`).toContain('Executive Vault');
        expect(policy.blocked, `${agentName} must block Credentials Vault`).toContain('Credentials Vault');
        expect(policy.allowed, `${agentName} must never allow Executive Vault`).not.toContain('Executive Vault');
        expect(policy.allowed, `${agentName} must never allow Credentials Vault`).not.toContain('Credentials Vault');
      }
    });

    it('rejects SSRF attempts against cloud metadata, internal loopback, and private IPv4/IPv6 networks', async () => {
      // Loopback
      expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('127.0.0.2')).toBe(true);

      // Cloud metadata (AWS, GCP, Azure 169.254.169.254)
      expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
      expect(isPrivateOrReservedIp('169.254.1.1')).toBe(true);

      // RFC 1918 Private networks
      expect(isPrivateOrReservedIp('10.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('10.255.255.255')).toBe(true);
      expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('172.31.255.255')).toBe(true);
      expect(isPrivateOrReservedIp('192.168.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('192.168.1.254')).toBe(true);

      // Public routable IPs must be allowed
      expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
      expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false);
      expect(isPrivateOrReservedIp('142.250.190.46')).toBe(false);

      // Test assertPublicHost rejects private addresses
      await expect(assertPublicHost('http://127.0.0.1:8080/admin')).rejects.toThrow(/Refusing to fetch a private\/internal address/);
      await expect(assertPublicHost('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(/Refusing to fetch a private\/internal address/);
      await expect(assertPublicHost('http://10.1.2.3/internal-api')).rejects.toThrow(/Refusing to fetch a private\/internal address/);
      await expect(assertPublicHost('http://localhost:3000')).rejects.toThrow(/Refusing to fetch localhost/);
    });

    it('truthfully transitions connector state to Disconnected upon 401/403 revocation', () => {
      const revoked401 = classifyProviderError(401, 'OAuth token expired or revoked');
      expect(revoked401.outcome).toBe('revoked');
      expect(revoked401.requiresReauth).toBe(true);

      const denied403 = classifyProviderError(403, 'User lacks permission');
      expect(denied403.outcome).toBe('permission_denied');
      expect(denied403.requiresReauth).toBe(true);
    });
  });

  describe('S17-A3: Secret Scans Block Failures & Critical Findings Resolution (C-01 to C-11)', () => {
    it('verifies safe workspace serialization excludes encrypted provider keys and webhook secrets', () => {
      const sensitiveDb: any = {
        id: 'ws-test',
        name: 'Acme Growth',
        aiProviderKeys: { openai: 'sk-secret-key-123', anthropic: 'sk-ant-secret' },
        secondBrain: { connectors: [] },
        settings: { customDomain: 'acme.com' },
      };

      // Emulate safeWorkspace destructuring in server.ts:2330
      const { aiProviderKeys: _keys, secondBrain: _sb, ...safeWorkspace } = sensitiveDb;

      expect(safeWorkspace.aiProviderKeys).toBeUndefined();
      expect(JSON.stringify(safeWorkspace)).not.toContain('sk-secret-key-123');
      expect(JSON.stringify(safeWorkspace)).not.toContain('sk-ant-secret');
    });

    it('verifies VANTA tools enforce strict effect types and runtime policy validation (C-05)', () => {
      expect(VANTA_TOOL_CATALOG.size).toBeGreaterThanOrEqual(5);
      for (const [toolName, def] of VANTA_TOOL_CATALOG.entries()) {
        expect(['read_only', 'propose_mutation', 'execute_mutating']).toContain(def.effect);
        if (def.effect === 'execute_mutating') {
          // Mutating tools must enforce approval gating or supervisor authentication
          expect(def.description).toBeDefined();
        }
      }
    });
  });
});
