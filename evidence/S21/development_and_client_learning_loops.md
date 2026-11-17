# Task S21: Development and Client Learning Loops

**Date**: 2026-11-18  
**Milestone**: M4 ("Integrated release candidate and feature freeze")  
**Task ID**: S21  
**Role**: Product  
**Working Repository**: `C:\Dev Projects\sigma-tactix-growth-os-v2`  
**Acceptance Criteria**: S21-A1, S21-A2, S21-A3  

---

## 1. Overview & Architecture

Task S21 establishes the bidirectional learning loop architecture for Growth OS across development and client operations.

A common failure mode in agentic platforms is allowing learned context or dynamic memory to mutate authorization policies, bypass review gates, or persist uninspected prompt context into sensitive vaults. S21 introduces `src/lib/learningRegistry.ts`, implementing:
1. Versioned development lessons derived from reproduced sprint defects, linked to regression test suites.
2. Operator-reviewed client job learnings persisted into permitted Knowledge Vaults (`Brand Vault`, `Marketing Vault`, `Customer Vault`) with zero-trust exclusion of Secret Vaults (`Executive Vault`, `Credentials Vault`).
3. Tenant-isolated, scoped retrieval preventing foreign workspace data disclosure, with explicit supersession and revocation mechanics and policy immutability assertions.

---

## 2. Acceptance Verification Against Criteria

### S21-A1: Development Lessons from Reproduced Failures & Regression Cases

Three real development failures encountered during the release sprint were catalogued into `DEVELOPMENT_LESSON_REGISTRY`, each paired with a verified code fix and dedicated regression test suite:

1. **`DEV-LRN-001` (GSC Domain Parsing Defect)**:
   - **Failure**: The Node.js URL parser interpreted `sc-domain:example.com` as having an origin of `null`, concatenating `origin + hostname` into `nullexample.com`.
   - **Fix**: Added explicit `sc-domain:` prefix detection prior to URL construction in `normalizeAccountIdentifier`.
   - **Regression Suite**: `src/lib/sourceOperations.test.ts`.
2. **`DEV-LRN-002` (SheetJS Formula Cell Omission)**:
   - **Failure**: In `renderSnapshotToXLSX`, formula cells defined as `{ f: 'C2/B2' }` without explicit numeric type `t: 'n'` and precomputed value `v` were dropped during workbook serialization.
   - **Fix**: Formatted all formula cells with `{ t: 'n', f: formulaString, v: computedValue }` and parsed with `cellFormula: true`.
   - **Regression Suite**: `src/lib/reportArtifactPipeline.test.ts`.
3. **`DEV-LRN-003` (Tool Execution Budget Step Exhaustion)**:
   - **Failure**: Max-step loop termination previously emitted a generic completion message without checking whether the requested artifact had actually been delivered.
   - **Fix**: Tagged step budget exhaustion as `execution_incomplete` with error code `step_exhaustion`, preventing false completions.
   - **Regression Suite**: `src/lib/vantaToolGateway.test.ts`.

### S21-A2: Completed Client Job Learnings & Permitted Knowledge Vault Placement

- **Learning Recording Flow**:
  - `recordClientLearning` captures completed task context, reviewed outcomes, operational limitations, and actionable findings.
  - New entries enter a `pending_review` state until explicitly reviewed and approved by an authorized operator (`approveLearning`).
- **Zero-Trust Secret Vault Enforcement**:
  - Any attempt to target a learning into `Executive Vault`, `Credentials Vault`, `Financial Vault`, or `HR Vault` is rejected immediately by `isSecretVaultName` and `isSecretVaultId` checks, throwing `FORBIDDEN_VAULT`.

### S21-A3: Scoped Retrieval, Supersession, Revocation, and Policy Immutability

- **Scoped & Tenant-Isolated Retrieval**:
  - `queryScopedLearnings` enforces `entry.workspaceId === requestingWorkspaceId`. Client Bravo cannot query or inspect lessons registered by Client Alpha.
  - Queries filter out unapproved (`pending_review`, `draft`), superseded, and revoked records.
- **Supersession & Revocation Lifecycle**:
  - Outdated lessons are replaced using `supersedeLearning`, which increments the version number, creates a linked successor entry, and marks the predecessor `superseded`.
  - Discredited findings are marked `revoked` via `revokeLearning`, removing them from future model prompt contexts.
- **Policy Immutability Assertion**:
  - `assertPolicyImmutable` scans lesson text against patterns targeting privilege elevation, approval bypass, or vault restriction overrides. Any match halts execution immediately with `POLICY_VIOLATION`.

---

## 3. Automated Verification Evidence

Automated unit test suite `src/lib/learningRegistry.test.ts`:
```
 RUN  v4.1.11 C:/Dev Projects/sigma-tactix-growth-os-v2

 ✓ src/lib/learningRegistry.test.ts (7 tests) 8ms
   ✓ contains versioned development lessons with verified fixes and regression test pointers
   ✓ records and approves a client job learning into an approved Knowledge Vault
   ✓ strictly forbids targeting lessons into Secret Vaults
   ✓ retrieves only active approved lessons within the requesting workspace and vault scope
   ✓ supersedes an existing lesson with a newer version and excludes superseded records from queries
   ✓ revokes an incorrect lesson and removes it from subsequent retrieval queries
   ✓ prevents self-modification of policies, privilege elevation, and Secret Vault bypass attempts

 Test Files  1 passed (1)
      Tests  7 passed (7)
```

Full repository verification run (`npm run verify`):
- TypeScript: 0 errors (`tsc --noEmit`).
- ESLint: 0 errors.
- Vitest: 111 test files passed, 789 tests passed (0 failed, 3 skipped).
- Build: Vite production bundle and Node.js server bundle generated cleanly.
