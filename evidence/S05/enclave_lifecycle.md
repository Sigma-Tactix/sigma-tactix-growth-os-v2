# Task S05: Durable Client Enclave Lifecycle

- **Task ID**: S05
- **Role**: platform
- **Status**: Complete / Submitted
- **Milestone**: M1
- **Target Release**: 20 November 2026

---

## 1. Acceptance Verification Summary

### Criterion S05-A1: Wizard persists server-issued ID, profile, membership, and resumable onboarding
* **Server-Issued ID Generation**: Client workspace creation no longer generates synthetic `ws-${Date.now()}` client-side strings. Workspace provisioning calls `POST /api/workspace/manage` via `createWorkspaceEnclave()`. The server executes `createWorkspace()` against Postgres `workspaces`, returning a database-generated UUID.
* **Membership Enrollment**: The Postgres database trigger `trg_add_owner_membership` automatically assigns the creator `owner` role in `workspace_members`.
* **Profile Persistence**: Onboarding attributes (`domain`, `brandVault.corePositioning`, `brandVault.offersAndPricing`, `brandVault.voiceAndTone`, `customerVault.idealCustomerProfile`) are stored in `workspace_state` via `saveWorkspace()`. Fresh workspaces are initialized strictly from `emptyWorkspaceData`, preventing any demo data bleed into client records.
* **Resumable Onboarding**: Added session draft persistence in `src/lib/clientOnboarding.ts` (`saveOnboardingSession`, `loadOnboardingSession`, `clearOnboardingSession`). The onboarding wizard retains draft inputs, uploaded document metadata, and progress step across browser reloads or accidental dialog closures. Completed onboarding or explicit discard clears the saved session.

### Criterion S05-A2: Second authorized session can list and reopen the same client
* **Session Listing**: `WorkspaceContext` queries `GET /api/workspace/manage` on mount and refresh via `listWorkspaces()`. The server returns all workspaces where the authenticated caller is an owner or member, retaining database-verified IDs, names, roles, and plan tiers.
* **Multi-Device / Multi-Tab Synchronization**: A second authorized session retrieves the existing client enclave without relying on first-browser localStorage cache.
* **Tenant Isolation**: Foreign callers with no membership in the workspace cannot view or select the client enclave; `listMemberWorkspaces()` returns empty arrays for foreign users.

### Criterion S05-A3: UI role derives from server membership; local tier/role edits cannot grant access
* **Server-Authoritative Role & Tier**: `ClientWorkspace.role` and `ClientWorkspace.tier` are synchronized directly from server membership records.
* **Anti-Tampering Enforcement**: Local manipulation of browser storage has no effect on authorization boundaries. Server endpoints enforce permissions through `callerIsOwnerOrAdmin()` against `workspace_members` and check entitlements via `getEntitlements()` against Postgres `workspaces.tier`. Unprivileged attempts return HTTP 403 Forbidden.
* **Tier Mutation Gate**: Plan tier updates in `WorkspaceContext` dispatch to `POST /api/workspace/billing/set-tier`, requiring server-verified owner or admin authorization.

---

## 2. Test Execution Proof

The lifecycle implementation was verified with unit, integration, and security checks:

```
Test Suites:
✓ src/lib/enclaveLifecycle.test.ts (7 tests passed)
✓ src/lib/clientOnboarding.test.ts (7 tests passed)
✓ src/lib/workspaceManage.test.ts (13 tests passed)
✓ src/lib/workspaceStore.test.ts (10 tests passed)
✓ src/lib/workspaceIsolation.test.ts (12 tests passed)
✓ src/lib/workspaceContext.test.ts (4 tests passed)
Total Lifecycle Tests: 53 passed, 0 failures.

Typecheck:
npm run lint (tsc --noEmit): Exit code 0.

Build:
npm run build: Vite frontend + Node.js server (dist/server.js) compiled cleanly.
```
