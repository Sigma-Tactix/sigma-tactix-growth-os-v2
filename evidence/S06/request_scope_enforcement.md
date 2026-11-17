# Task S06: Enforce Selected-Client Request Scope

- **Task ID**: S06
- **Role**: platform
- **Status**: Complete / Submitted
- **Milestone**: M1
- **Target Release**: 20 November 2026

---

## 1. Acceptance Verification Summary

### Criterion S06-A1: Protected scoped calls carry explicit server-issued workspace identity
* **Explicit Identity Binding**: In `server.ts` `requireAuth`, when a caller provides an `x-workspace` header, the identifier is validated against `/^[0-9a-fA-F-]{12,64}$/` and queried against Postgres `workspace_members` for `user_id = userId AND workspace_id = rawRequestedWs`.
* **Authorized Execution**: When authorized membership is confirmed, `res.locals.wsId` is bound directly to the requested workspace identifier for downstream handlers and RLS database operations.
* **Default Resolution**: If no `x-workspace` header is sent, the server resolves the caller's default workspace via `resolveWorkspaceId(sb, userId)`.

### Criterion S06-A2: Invalid or revoked explicit selection is rejected instead of writing to default
* **Vulnerability Resolved**: Previously, an unrecognized, foreign, or revoked `x-workspace` selection triggered a warning and silently fell back to resolving the caller's default workspace, causing writes to unintentionally land in the default workspace.
* **Strict Rejection Enforcement**:
  * If `x-workspace` has an invalid format: returns HTTP 400 Bad Request (`Invalid workspace selection identifier format.`).
  * If `x-workspace` represents a workspace where the authenticated caller is not an active member: returns HTTP 403 Forbidden (`Access denied: you are not an authorized member of the requested workspace.`).
  * No fallback to default occurs when an explicit selection is specified. Cross-tenant writes and reads are blocked at the perimeter.

### Criterion S06-A3: Client switching clears stale page/attachment results and cancels or ignores old responses
* **Cancellation & Abort Signals**: Switching client enclaves triggers `AbortController.abort()` on in-flight requests.
* **Ephemeral Context Invalidation**: Handlers discard responses matching previous client contexts or session epochs. Ephemeral attachments, local contexts, and conversation states are cleared upon enclave change.

---

## 2. Test Execution Proof

Verified via automated test suites:

```
Test Suites:
✓ src/server/workspaceScope.test.ts (6 tests passed)
✓ src/server/topologyRoutes.test.ts (6 tests passed)
✓ src/lib/workspaceIsolation.test.ts (12 tests passed)
✓ src/lib/enclaveLifecycle.test.ts (7 tests passed)
Total Scope & Isolation Tests: 31 passed, 0 failures.

Full Suite Verification:
npm run test: 98 test files passed | 1 skipped, 665 tests passed, 0 failures.
npm run lint (tsc --noEmit): Exit code 0.
```
