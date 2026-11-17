import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import {
  resolveSafeWorkspacePath,
  safeReadWorkspaceFile,
  safeWriteWorkspaceFile,
  executeSandboxedCommand,
  executeIsolatedBrowserResearch,
} from './computerRuntime.js';

describe('Isolated Browser and File Runtime (S11-A1, S11-A2, S11-A3 / Finding C-08)', () => {
  let tempBaseDir: string;
  let clientARoot: string;
  let clientBRoot: string;

  beforeEach(async () => {
    tempBaseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'growth-os-s11-test-'));
    clientARoot = path.join(tempBaseDir, 'clients', 'client-a', 'mission-1');
    clientBRoot = path.join(tempBaseDir, 'clients', 'client-b', 'mission-2');
    await fs.mkdir(clientARoot, { recursive: true });
    await fs.mkdir(clientBRoot, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempBaseDir, { recursive: true, force: true }).catch(() => {});
  });

  describe('S11-A1: Two client browser sessions and file roots cannot share data', () => {
    it('isolates files between two client workspaces so Client A cannot access Client B data', async () => {
      // Client B writes confidential data into its workspace
      await safeWriteWorkspaceFile(clientBRoot, 'deliverables/strategy.json', JSON.stringify({ revenue: 500000 }));

      // Client A writes its own file
      await safeWriteWorkspaceFile(clientARoot, 'deliverables/public_plan.json', JSON.stringify({ public: true }));

      // Client A reads its own file successfully
      const clientARead = await safeReadWorkspaceFile(clientARoot, 'deliverables/public_plan.json');
      expect(JSON.parse(clientARead.content)).toEqual({ public: true });

      // Client A attempts lexical directory traversal to read Client B's file
      const crossPath = path.join('..', '..', 'client-b', 'mission-2', 'deliverables', 'strategy.json');
      await expect(safeReadWorkspaceFile(clientARoot, crossPath)).rejects.toThrow(/traversal.*forbidden/i);

      // Client A attempts to write into Client B's workspace
      await expect(
        safeWriteWorkspaceFile(clientARoot, crossPath, '{"malicious":true}'),
      ).rejects.toThrow(/traversal.*forbidden/i);
    });

    it('prevents symlink attacks from Client A attempting to access Client B data', async () => {
      // Client B creates a target file
      const clientBTargetFile = path.join(clientBRoot, 'secret_notes.txt');
      await fs.writeFile(clientBTargetFile, 'Confidential client B notes', 'utf-8');

      // Create a symlink in Client A's workspace pointing to Client B's file
      const clientASymlink = path.join(clientARoot, 'link_to_client_b');
      try {
        await fs.symlink(clientBTargetFile, clientASymlink);
      } catch (err: any) {
        // On Windows without Developer Mode, symlink creation may require privilege; test handles graceful fallback
        if (err.code === 'EPERM') return;
      }

      // Client A tries to read through the symlink
      await expect(safeReadWorkspaceFile(clientARoot, 'link_to_client_b')).rejects.toThrow(
        /Symlink traversal outside workspace root is forbidden/i,
      );
    });

    it('ensures distinct browser session directories and isolation identifiers for different clients and runs', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'text/html; charset=utf-8',
          'content-length': '128',
        }),
        arrayBuffer: async () => Buffer.from('<html><body>Research Results</body></html>'),
      });
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockFetch;

      try {
        const resultA = await executeIsolatedBrowserResearch({
          workspaceId: 'client-a',
          runId: 'run-101',
          workspaceRoot: clientARoot,
          targetUrl: 'https://example.com/industry-report',
        });

        const resultB = await executeIsolatedBrowserResearch({
          workspaceId: 'client-b',
          runId: 'run-102',
          workspaceRoot: clientBRoot,
          targetUrl: 'https://example.org/market-stats',
        });

        expect(resultA.success).toBe(true);
        expect(resultB.success).toBe(true);

        const receiptA = resultA.data!.receipt;
        const receiptB = resultB.data!.receipt;

        expect(receiptA.workspaceId).toBe('client-a');
        expect(receiptA.runId).toBe('run-101');
        expect(receiptA.isolationId).toBe('iso_client-a_run-101');

        expect(receiptB.workspaceId).toBe('client-b');
        expect(receiptB.runId).toBe('run-102');
        expect(receiptB.isolationId).toBe('iso_client-b_run-102');

        expect(receiptA.isolationId).not.toBe(receiptB.isolationId);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('S11-A2: Runtime cannot access host home/IDE credentials or internal network targets', () => {
    it('blocks access to host home, IDE configs, and credential stores', async () => {
      const sensitiveNames = [
        '.env',
        '.env.production',
        'credentials.json',
        'executive-brief.md',
        'private-key.pem',
        '.ssh/id_rsa',
        '.aws/credentials',
        '.antigravity-ide/config',
        '.cursor/rules',
        '.vscode/settings.json',
        '.gemini/token',
        '.git/config',
      ];

      for (const name of sensitiveNames) {
        await expect(resolveSafeWorkspacePath(clientARoot, name, false)).rejects.toThrow(
          /forbidden|PATH_DENIED/i,
        );
      }
    });

    it('rejects null-byte injection in path resolution', async () => {
      await expect(resolveSafeWorkspacePath(clientARoot, 'safe.txt\0/../../etc/passwd')).rejects.toThrow(
        /Null bytes.*forbidden/i,
      );
    });

    it('enforces caller authentication and per-run identity for the isolated command supervisor', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
        if (url.endsWith('/health')) {
          return { ok: true, status: 200 };
        }
        if (url.endsWith('/execute')) {
          expect(opts.headers['x-workspace-id']).toBe('ws-security-1');
          expect(opts.headers['x-run-id']).toBe('run-audit-99');
          expect(opts.headers['Authorization']).toBe('Bearer valid-supervisor-token');

          const body = JSON.parse(opts.body);
          expect(body.workspaceId).toBe('ws-security-1');
          expect(body.runId).toBe('run-audit-99');
          expect(body.command).toBe('python generate_audit.py');

          return {
            ok: true,
            status: 200,
            json: async () => ({ exitCode: 0, stdout: 'Audit generated', stderr: '' }),
          };
        }
        return { ok: false, status: 404 };
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockFetch;

      try {
        const result = await executeSandboxedCommand({
          workspaceId: 'ws-security-1',
          runId: 'run-audit-99',
          command: 'python generate_audit.py',
          supervisorUrl: 'https://supervisor.internal.cloud',
          supervisorToken: 'valid-supervisor-token',
        });

        expect(result.success).toBe(true);
        expect(result.stdout).toBe('Audit generated');
        expect(result.workspaceId).toBe('ws-security-1');
        expect(result.runId).toBe('run-audit-99');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('fails closed when isolated command supervisor is offline without host fallback', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Supervisor connection refused'));

      try {
        const result = await executeSandboxedCommand({
          workspaceId: 'ws-security-1',
          runId: 'run-audit-99',
          command: 'dir',
          supervisorUrl: 'http://127.0.0.1:4312',
        });

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/isolated command supervisor is unavailable; host execution is disabled/i);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('blocks internal network and cloud metadata targets in browser research', async () => {
      const blockedUrls = [
        'http://127.0.0.1:8080/admin',
        'http://localhost:3000/internal-api',
        'http://169.254.169.254/latest/meta-data/', // AWS/GCP cloud metadata
        'http://192.168.1.1/router-settings',
        'http://10.0.0.1/internal',
      ];

      for (const url of blockedUrls) {
        const result = await executeIsolatedBrowserResearch({
          workspaceId: 'client-a',
          runId: 'run-net-1',
          workspaceRoot: clientARoot,
          targetUrl: url,
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe('URL_BLOCKED');
        expect(result.error).toMatch(/blocked by network isolation boundary/i);
      }
    });
  });

  describe('S11-A3: Bounded public-browser research/download task records evidence; size/type/path limits and teardown verified', () => {
    it('executes bounded public research, downloads asset to workspace downloads, records SHA256 receipt, and tears down session', async () => {
      const mockHtml = '<html><head><title>Market Analysis</title></head><body>B2B SaaS Growth Benchmarks</body></html>';
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'text/html; charset=utf-8',
          'content-length': String(Buffer.byteLength(mockHtml)),
        }),
        arrayBuffer: async () => Buffer.from(mockHtml),
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockFetch;

      try {
        const result = await executeIsolatedBrowserResearch({
          workspaceId: 'client-a',
          runId: 'run-research-42',
          workspaceRoot: clientARoot,
          targetUrl: 'https://example.com/saas-benchmarks',
          downloadFile: true,
          outputFilename: 'saas_benchmarks.html',
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.text).toContain('B2B SaaS Growth Benchmarks');

        const receipt = result.data!.receipt;
        expect(receipt.receiptId).toMatch(/^[0-9a-f-]{36}$/);
        expect(receipt.workspaceId).toBe('client-a');
        expect(receipt.runId).toBe('run-research-42');
        expect(receipt.url).toBe('https://example.com/saas-benchmarks');
        expect(receipt.contentType).toBe('text/html');
        expect(receipt.downloadedBytes).toBe(Buffer.byteLength(mockHtml));
        expect(receipt.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(receipt.savedPath).toBeDefined();
        expect(receipt.savedPath!).toContain('downloads');
        expect(receipt.teardownVerified).toBe(true);

        // Verify the file was written inside clientARoot/downloads
        const downloadedContent = await fs.readFile(receipt.savedPath!, 'utf-8');
        expect(downloadedContent).toBe(mockHtml);

        // Verify session profile directory was torn down and purged
        const sessionDir = path.join(clientARoot, '.browser-sessions', 'run-research-42');
        await expect(fs.access(sessionDir)).rejects.toThrow();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('rejects download when content length exceeds the allocated size ceiling (5 MB)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/pdf',
          'content-length': '10485760', // 10 MB > 5 MB
        }),
        arrayBuffer: async () => Buffer.alloc(10485760),
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockFetch;

      try {
        const result = await executeIsolatedBrowserResearch({
          workspaceId: 'client-a',
          runId: 'run-large-file',
          workspaceRoot: clientARoot,
          targetUrl: 'https://example.com/huge-report.pdf',
          maxDownloadBytes: 5 * 1024 * 1024,
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe('DOWNLOAD_TOO_LARGE');
        expect(result.error).toMatch(/exceeds allocated limit/i);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('rejects downloads with disallowed or executable MIME types', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/x-msdownload', // Windows executable
          'content-length': '1024',
        }),
        arrayBuffer: async () => Buffer.alloc(1024),
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = mockFetch;

      try {
        const result = await executeIsolatedBrowserResearch({
          workspaceId: 'client-a',
          runId: 'run-blocked-mime',
          workspaceRoot: clientARoot,
          targetUrl: 'https://example.com/installer.exe',
        });

        expect(result.success).toBe(false);
        expect(result.code).toBe('UNSUPPORTED_MIME');
        expect(result.error).toMatch(/not in the authorized MIME whitelist/i);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
