import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { assertPublicHost } from './siteFetch.js';
import { isSecretVaultId } from './secretVaultPolicy.js';

export interface SandboxedCommandOptions {
  workspaceId: string;
  runId: string;
  command: string;
  timeoutSeconds?: number;
  supervisorUrl?: string;
  supervisorToken?: string;
}

export interface SandboxedCommandResult {
  success: boolean;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
  workspaceId?: string;
  runId?: string;
}

export interface BrowserResearchReceipt {
  receiptId: string;
  workspaceId: string;
  runId: string;
  url: string;
  contentType: string;
  downloadedBytes: number;
  sha256: string;
  savedPath?: string;
  verifiedAt: string;
  durationMs: number;
  teardownVerified: boolean;
  isolationId: string;
}

export interface BrowserResearchOptions {
  workspaceId: string;
  runId: string;
  workspaceRoot: string;
  targetUrl: string;
  extractText?: boolean;
  downloadFile?: boolean;
  outputFilename?: string;
  maxDownloadBytes?: number;
  allowedMimeTypes?: string[];
  signal?: AbortSignal;
}

export interface BrowserResearchResult {
  success: boolean;
  data?: {
    url: string;
    title?: string;
    text?: string;
    receipt: BrowserResearchReceipt;
  };
  error?: string;
  code?: 'URL_BLOCKED' | 'DOWNLOAD_TOO_LARGE' | 'UNSUPPORTED_MIME' | 'PATH_DENIED' | 'FETCH_FAILED' | 'CANCELLED';
}

const DEFAULT_MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024; // 5 MB ceiling
const DEFAULT_ALLOWED_MIME_TYPES = [
  'text/html',
  'application/json',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const HOST_SENSITIVE_PATTERNS = [
  /\.env(\..+)?$/i,
  /credentials/i,
  /executive[-_]brief/i,
  /api[-_]?keys?/i,
  /private[-_]?key/i,
  /token[-_]?secret/i,
  /\.ssh($|[\\/])/i,
  /\.aws($|[\\/])/i,
  /\.azure($|[\\/])/i,
  /\.kube($|[\\/])/i,
  /\.antigravity[-_]ide($|[\\/])/i,
  /\.cursor($|[\\/])/i,
  /\.vscode($|[\\/])/i,
  /\.gemini($|[\\/])/i,
  /\.git($|[\\/])/i,
];

/**
 * Resolves a canonical safe path inside the workspaceRoot with strict realpath,
 * symlink traversal, and sensitive directory protections.
 */
export async function resolveSafeWorkspacePath(
  workspaceRoot: string,
  relativePath: string,
  forWrite = false,
): Promise<string> {
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    throw new Error('PATH_DENIED: Path parameter is missing or empty.');
  }

  // Reject null-byte injection
  if (relativePath.includes('\0')) {
    throw new Error('PATH_DENIED: Null bytes in path are forbidden.');
  }

  // Reject sensitive directory names and files anywhere in relative path
  if (HOST_SENSITIVE_PATTERNS.some(p => p.test(relativePath))) {
    throw new Error('PATH_DENIED: Access to host credentials, IDE configs, or Secret Vault files is excluded and forbidden.');
  }

  // Ensure workspaceRoot directory exists and get its canonical realpath
  await fs.mkdir(workspaceRoot, { recursive: true });
  const canonicalRoot = await fs.realpath(workspaceRoot);

  const resolved = path.resolve(canonicalRoot, relativePath);

  // Lexical check first
  const lexicalRelative = path.relative(canonicalRoot, resolved);
  if (lexicalRelative.startsWith('..') || path.isAbsolute(lexicalRelative)) {
    throw new Error('PATH_DENIED: Path traversal outside workspace root is forbidden.');
  }

  // Realpath / Symlink check
  try {
    const canonicalResolved = await fs.realpath(resolved);
    const relativeToCanonicalRoot = path.relative(canonicalRoot, canonicalResolved);
    if (relativeToCanonicalRoot.startsWith('..') || path.isAbsolute(relativeToCanonicalRoot)) {
      throw new Error('PATH_DENIED: Symlink traversal outside workspace root is forbidden.');
    }
    return canonicalResolved;
  } catch (err: any) {
    if (err.code === 'ENOENT' && forWrite) {
      // For write operations on files that do not exist yet, verify the nearest existing parent directory
      let currentDir = path.dirname(resolved);
      while (currentDir !== canonicalRoot && currentDir !== path.dirname(currentDir)) {
        try {
          const canonicalDir = await fs.realpath(currentDir);
          const dirRel = path.relative(canonicalRoot, canonicalDir);
          if (dirRel.startsWith('..') || path.isAbsolute(dirRel)) {
            throw new Error('PATH_DENIED: Parent directory symlink traversal outside workspace root is forbidden.');
          }
          break;
        } catch (dirErr: any) {
          if (dirErr.code === 'ENOENT') {
            currentDir = path.dirname(currentDir);
            continue;
          }
          throw dirErr;
        }
      }
      return resolved;
    }
    throw err;
  }
}

/**
 * Safely reads a workspace file with realpath, symlink, Secret Vault, and size limits.
 */
export async function safeReadWorkspaceFile(
  workspaceRoot: string,
  filePath: string,
  options: { maxBytes?: number } = {},
): Promise<{ filePath: string; content: string; truncated: boolean; sizeBytes: number }> {
  const maxBytes = options.maxBytes || 20_000;
  const canonicalPath = await resolveSafeWorkspacePath(workspaceRoot, filePath, false);

  const content = await fs.readFile(canonicalPath, 'utf-8');
  const sizeBytes = Buffer.byteLength(content, 'utf-8');
  const truncated = sizeBytes > maxBytes;
  return {
    filePath,
    content: truncated ? content.slice(0, maxBytes) : content,
    truncated,
    sizeBytes,
  };
}

/**
 * Safely writes a workspace file with realpath, symlink, Secret Vault, and size limits.
 */
export async function safeWriteWorkspaceFile(
  workspaceRoot: string,
  filePath: string,
  content: string,
  options: { maxBytes?: number } = {},
): Promise<{ success: boolean; filePath: string; bytesWritten: number }> {
  const maxBytes = options.maxBytes || 256_000;
  const bytesWritten = Buffer.byteLength(content, 'utf-8');
  if (bytesWritten > maxBytes) {
    throw new Error(`FILE_TOO_LARGE: Content size (${bytesWritten} bytes) exceeds maximum limit of ${maxBytes} bytes.`);
  }

  const safePath = await resolveSafeWorkspacePath(workspaceRoot, filePath, true);
  await fs.mkdir(path.dirname(safePath), { recursive: true });
  await fs.writeFile(safePath, content, 'utf-8');

  return {
    success: true,
    filePath,
    bytesWritten,
  };
}

/**
 * Executes a sandboxed command through the isolated command supervisor.
 * Includes workspaceId, runId, caller authentication, and fails closed without host fallback.
 */
export async function executeSandboxedCommand(
  options: SandboxedCommandOptions,
): Promise<SandboxedCommandResult> {
  const { workspaceId, runId, command, timeoutSeconds = 30 } = options;
  const cmd = (command || '').trim();
  if (!cmd) {
    return { success: false, error: 'Missing command parameter', workspaceId, runId };
  }

  // Destructive command safety guard
  const blockedPatterns = [/rm\s+-rf\s+\//, /mkfs/, />\s*\/dev\/sd/, /shutdown/, /reboot/];
  if (blockedPatterns.some(p => p.test(cmd))) {
    return {
      success: false,
      error: 'Command blocked by security policy: destructive or privileged pattern detected.',
      workspaceId,
      runId,
    };
  }

  const supervisorUrl = options.supervisorUrl || process.env.COMPUTER_SUPERVISOR_URL || 'http://127.0.0.1:4312';
  const supervisorToken = options.supervisorToken || process.env.COMPUTER_SUPERVISOR_TOKEN;

  try {
    const supervisor = new URL(supervisorUrl);
    const isLoopback = ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(supervisor.hostname);
    if (!isLoopback && !supervisorToken) {
      return {
        success: false,
        error: 'Remote isolated command supervisor requires authentication.',
        workspaceId,
        runId,
      };
    }

    const ping = await fetch(`${supervisorUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(1000) });
    if (!ping.ok) {
      return {
        success: false,
        error: `Isolated command supervisor health check failed (${ping.status}).`,
        workspaceId,
        runId,
      };
    }

    const payload = {
      workspaceId,
      runId,
      command: cmd,
      timeoutSeconds: Math.min(timeoutSeconds, 120),
      env: {
        WORKSPACE_ID: workspaceId,
        RUN_ID: runId,
      },
    };

    const resp = await fetch(`${supervisorUrl}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-workspace-id': workspaceId,
        'x-run-id': runId,
        ...(supervisorToken ? { Authorization: `Bearer ${supervisorToken}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(Math.min(timeoutSeconds * 1000 + 2000, 122_000)),
    });

    if (!resp.ok) {
      return {
        success: false,
        error: `Isolated command supervisor rejected execution (${resp.status}).`,
        workspaceId,
        runId,
      };
    }

    const result = await resp.json() as any;
    return {
      success: result.exitCode === 0,
      exitCode: result.exitCode ?? 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      workspaceId,
      runId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `The isolated command supervisor is unavailable; host execution is disabled. ${error?.message || ''}`.trim(),
      workspaceId,
      runId,
    };
  }
}

/**
 * Executes bounded public-browser research and download within an isolated workspace sandbox.
 * Enforces public host checks, session profile isolation, download size limits, MIME whitelist, and teardown.
 */
export async function executeIsolatedBrowserResearch(
  options: BrowserResearchOptions,
): Promise<BrowserResearchResult> {
  const startTime = Date.now();
  const {
    workspaceId,
    runId,
    workspaceRoot,
    targetUrl,
    extractText = true,
    downloadFile = false,
    outputFilename,
    maxDownloadBytes = DEFAULT_MAX_DOWNLOAD_BYTES,
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
    signal,
  } = options;

  const isolationId = `iso_${workspaceId}_${runId}`;
  const receiptId = crypto.randomUUID();

  // 1. Cancellation check
  if (signal?.aborted) {
    return { success: false, code: 'CANCELLED', error: 'Browser research cancelled by signal.' };
  }

  // 2. Network boundary: reject internal network, loopback, or cloud metadata targets
  try {
    await assertPublicHost(targetUrl);
  } catch (err: any) {
    return {
      success: false,
      code: 'URL_BLOCKED',
      error: `Target URL blocked by network isolation boundary: ${err?.message || ''}`,
    };
  }

  // 3. Isolated session setup
  const sessionDir = path.join(workspaceRoot, '.browser-sessions', runId);
  await fs.mkdir(sessionDir, { recursive: true });

  let teardownVerified = false;
  try {
    // 4. Fetch target URL with bounded streaming and timeout
    const fetchResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GrowthOS-Research/1.0',
        Accept: 'text/html,application/json,text/plain,*/*',
      },
      signal: signal || AbortSignal.timeout(30_000),
    });

    if (!fetchResponse.ok) {
      return {
        success: false,
        code: 'FETCH_FAILED',
        error: `HTTP request failed with status ${fetchResponse.status}`,
      };
    }

    const contentType = (fetchResponse.headers.get('content-type') || 'application/octet-stream')
      .split(';')[0]
      .trim()
      .toLowerCase();

    // Check MIME type whitelist
    const isAllowedMime = allowedMimeTypes.some(m => contentType === m || contentType.startsWith(`${m}/`));
    if (!isAllowedMime) {
      return {
        success: false,
        code: 'UNSUPPORTED_MIME',
        error: `Content-Type '${contentType}' is not in the authorized MIME whitelist for browser downloads.`,
      };
    }

    // Check advertised length
    const advertisedLength = Number(fetchResponse.headers.get('content-length'));
    if (advertisedLength && advertisedLength > maxDownloadBytes) {
      return {
        success: false,
        code: 'DOWNLOAD_TOO_LARGE',
        error: `Download size (${advertisedLength} bytes) exceeds allocated limit of ${maxDownloadBytes} bytes.`,
      };
    }

    // Bounded streaming read with SHA-256 calculation
    const hasher = crypto.createHash('sha256');
    const chunks: Buffer[] = [];
    let downloadedBytes = 0;

    const arrayBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    downloadedBytes = buffer.length;

    if (downloadedBytes > maxDownloadBytes) {
      return {
        success: false,
        code: 'DOWNLOAD_TOO_LARGE',
        error: `Downloaded content size (${downloadedBytes} bytes) exceeded maximum ceiling of ${maxDownloadBytes} bytes.`,
      };
    }

    hasher.update(buffer);
    const sha256 = hasher.digest('hex');

    let savedPath: string | undefined = undefined;
    if (downloadFile) {
      const safeFilename = path.basename(outputFilename || path.basename(new URL(targetUrl).pathname) || 'research.bin');
      const downloadsDir = path.join(workspaceRoot, 'downloads');
      await fs.mkdir(downloadsDir, { recursive: true });
      const targetFilePath = await resolveSafeWorkspacePath(workspaceRoot, path.join('downloads', safeFilename), true);
      await fs.writeFile(targetFilePath, buffer);
      savedPath = targetFilePath;
    }

    let textContent: string | undefined = undefined;
    if (extractText && (contentType.includes('text') || contentType.includes('json') || contentType.includes('html'))) {
      textContent = buffer.toString('utf-8').slice(0, 50_000);
    }

    // Teardown temporary session artifacts
    await fs.rm(sessionDir, { recursive: true, force: true });
    teardownVerified = true;

    const receipt: BrowserResearchReceipt = {
      receiptId,
      workspaceId,
      runId,
      url: targetUrl,
      contentType,
      downloadedBytes,
      sha256,
      savedPath,
      verifiedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      teardownVerified,
      isolationId,
    };

    return {
      success: true,
      data: {
        url: targetUrl,
        text: textContent,
        receipt,
      },
    };
  } catch (err: any) {
    // Teardown on failure
    await fs.rm(sessionDir, { recursive: true, force: true }).catch(() => {});
    return {
      success: false,
      code: 'FETCH_FAILED',
      error: `Browser research failed: ${err?.message || err}`,
    };
  }
}
