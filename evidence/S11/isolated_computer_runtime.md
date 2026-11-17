# Task S11 Evidence: Isolated Computer and Browser Runtime

## 1. Scope and Objective
This document provides verification evidence for Task S11 and confirms the operational closure of Finding C-08.
The objective is ensuring tenant file operations and browser research execute within strict sandboxes with no cross-tenant sharing, no host credential exposure, and no internal network probing.

## 2. Acceptance Criteria Verification

### S11-A1: Cross-Tenant Session and Filesystem Isolation
- **Mechanism**: `resolveSafeWorkspacePath`, `safeReadWorkspaceFile`, and `safeWriteWorkspaceFile` bind all file operations to the designated `workspaceRoot`. Browser operations allocate a per-run isolated session directory under `.browser-sessions/${runId}`.
- **Verification**: `src/lib/computerRuntime.test.ts` executes concurrent operations across distinct workspace roots (`tenant-alpha` and `tenant-beta`) and separate run sessions (`run-101` and `run-202`). Operations in one tenant workspace cannot view, modify, or locate files in another tenant directory. Browser profile contexts instantiate independent temporary directories that tear down upon completion.

### S11-A2: Host Home, IDE Credentials, and Internal Network Protection
- **Mechanism**:
  - `resolveSafeWorkspacePath` resolves canonical paths via `fs.realpath` and rejects traversal out of the workspace root.
  - Blocklist enforcement rejects access to host configuration directories and credentials (`.antigravity-ide`, `.cursor`, `.vscode`, `.gemini`, `.ssh`, `.aws`, `.env`, `.git`) as well as executive briefs and secret tokens.
  - Symlinks pointing outside the workspace root or targeting host directories fail closed with `PATH_DENIED`.
  - Network enforcement in `assertPublicHost` blocks loopback addresses (`127.0.0.1`, `localhost`, `::1`), private RFC1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and cloud instance metadata services (`169.254.169.254`).
  - `executeSandboxedCommand` dispatches to the isolated supervisor with explicit `workspaceId`, `runId`, and bearer token headers. Host fallback execution is disabled.
- **Verification**: Unit tests verify that path traversal attempts (`../../etc/passwd`), symlink escapes to host folders, requests to internal IPs (`127.0.0.1`, `192.168.1.5`), and requests to metadata endpoints (`169.254.169.254`) throw immediate rejection errors.

### S11-A3: Bounded Public Browser Research and Asset Downloads
- **Mechanism**: `executeIsolatedBrowserResearch` provides bounded web research for public HTTP/HTTPS resources:
  - Enforces public destination validation via `assertPublicHost`.
  - Caps downloads at 5 MB (`MAX_DOWNLOAD_BYTES = 5 * 1024 * 1024`).
  - Restricts download MIME types to an allowed whitelist (`text/html`, `text/plain`, `text/markdown`, `application/json`, `application/pdf`, `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`).
  - Constrains output artifacts to `${workspaceRoot}/downloads/` and validates destination filenames to block subpath traversal.
  - Generates a cryptographically hashed `BrowserResearchReceipt` including timestamp, SHA-256 digest, target URL, and byte count.
  - Verifies browser profile teardown upon session completion.
- **Verification**: Unit tests verify successful asset retrieval with SHA-256 receipt generation, rejection of oversized payloads, rejection of unwhitelisted content types (such as executable binaries), and cleanup of temporary session folders.

## 3. Test Execution Summary
The test suite `src/lib/computerRuntime.test.ts` (11 tests) and regression suite `src/lib/agentPipeline.test.ts` (10 tests) pass with zero failures. Full platform verification `npm run verify` passed cleanly (103 test files passed, 716 tests passed).
