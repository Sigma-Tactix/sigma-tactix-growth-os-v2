# Task S07: Truthful Durable Approval and Run States

- **Task ID**: S07
- **Role**: platform
- **Status**: Complete / Submitted
- **Milestone**: M1
- **Target Release**: 20 November 2026

---

## 1. Acceptance Verification Summary

### Criterion S07-A1: 401/403/500/timeout cannot create completion badge
* **Defect Resolved (Finding C-03)**: `ActionQueueTab.tsx` previously used raw unauthenticated `fetch('/api/social/schedule')` and unconditionally invoked `approveItem(id, note)` and `notifySuccess`, marking items `COMPLETED` with a green checkmark even after 401, 403, 500, or network timeouts.
* **Truthful Non-Success Handling**:
  * Dispatch calls now use `apiFetch` with JWT bearer authorization and workspace context headers.
  * Added `AbortController` timeout handling with an 8000ms ceiling.
  * Non-2xx responses (401 Unauthorized, 403 Forbidden, 422 Unprocessable Entity, 500 Server Error) and network/abort errors set `dispatchFailed = true`.
  * Failed dispatches invoke `actionQueueStore.failItem(id, failureReason)`, transition the action to `FAILED`, record the exact failure note, and notify the operator via `notifyError`.
  * Items in `FAILED` status render a high-visibility rose badge (`FAILED`) and a retry control; no completion badge is ever rendered.

### Criterion S07-A2: Approved payload version/hash bound to permission; revoked or edited action blocked
* **Deterministic Payload Hashing**: Implemented `computeActionPayloadHash(item)` using canonical key sorting across all action properties (`id`, `moduleName`, `moduleCategory`, `enclaveId`, `title`, `summary`, `suggestedAction`, `risk`, `runPayload`).
* **Approval Consent Binding**: `approveItem` binds an `ActionApprovalRecord` storing `approvedPayloadHash`, `approver`, `approvedAt`, and `status: 'APPROVED'`.
* **Payload Tamper Detection**: If an action's payload is modified after operator review, the payload hash changes. Execution is blocked with an explicit mismatch error (`Payload altered after review; consent invalidated.`), and the item transitions to `FAILED`.
* **Revocation Enforcement**: `revokeItem(id, reason)` marks the action as `REVOKED` and transitions status to `ALERT`. Any subsequent approval or execution attempt is blocked.
* **Server-Side Enforcement**: `/api/workspace/run-agent/:id/approve` verifies `expectedPayloadHash` against `task.payloadHash` (rejecting mismatches with HTTP 422) and blocks revoked actions with HTTP 403.

### Criterion S07-A3: Repeated approval does not duplicate side effects; reload sees same persisted state
* **Idempotency & Concurrent Gate**: `inFlightIds` prevents double-click race conditions. Actions already in `RUNNING` or `COMPLETED` status return immediately without dispatching duplicate network requests.
* **Idempotent Store Transitions**: Repeated `approveItem` calls with identical payload hashes return `{ success: true }` without emitting redundant mutations.
* **Persistent State Across Reloads**: `ActionQueueStore` writes state transitions to `localStorage`. Re-hydrating a new store instance restores exact terminal statuses (`COMPLETED` with approval hashes, `FAILED` with error messages, `ALERT` with revocation reasons). Reloading the browser preserves failure states without reset.

---

## 2. Test Execution Proof

Verified via automated test suites:

```
Test Suites:
- src/lib/actionQueueGovernance.test.ts (12 tests passed)
- src/lib/actionQueueStore.test.ts (7 tests passed)
- src/server/workspaceScope.test.ts (6 tests passed)
- src/lib/enclaveLifecycle.test.ts (7 tests passed)
Total Governance Tests: 32 passed, 0 failures.

Full Suite Verification:
npm run test: 99 test files passed | 1 skipped, 677 tests passed, 0 failures.
npm run lint (tsc --noEmit): Exit code 0.
```
