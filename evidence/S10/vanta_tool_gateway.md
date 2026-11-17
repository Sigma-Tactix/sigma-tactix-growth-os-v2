# S10 Acceptance Verification: Typed VANTA Tool Gateway and Secret Vault Consent

- Task ID: `S10`
- Role: `platform`
- Milestone: `M2`
- Date: 2026-11-18
- Review Status: Self-verified via automated test suite and TypeScript compiler

---

## Executive Summary

Task S10 establishes the typed VANTA tool gateway, closes the Secret Vault security seam (Finding C-06), implements truthful completion semantics on step exhaustion (Finding C-09), and enforces human consent boundaries for state-modifying actions.

---

## Acceptance Criteria Verification

### Criterion S10-A1: Planner uses validated tool/schema/effect/cost/runtime policy

1. **Typed Tool Catalog (`src/lib/vantaToolGateway.ts`)**:
   - Registered tools:
     - `vanta_inspect_page` (`read_only`): inspects active workspace route and UI context.
     - `vanta_query_metrics` (`read_only`): queries verified growth, spend, audit, and conversion telemetry.
     - `vanta_search_documents` (`read_only`): searches Second Brain documents with enforced Secret Vault exclusion.
     - `vanta_propose_action` (`propose_mutation`): generates governed Action Proposals for human operator review in the Action Queue.
     - `vanta_execute_action` (`execute_mutating`): requires explicit signed human consent proof (`ActionApprovalRecord`); autonomous planner execution is denied.
2. **Schema & Policy Validation**:
   - Each tool defines a Zod input schema. Malformed or invalid payloads return `INVALID_INPUT` with structured error details.
   - Runtime role verification checks caller permissions (`owner`, `admin`, `member`). Unprivileged callers receive `UNAUTHORIZED_ROLE`.
   - Cost ceilings (`maxTokens`, `estimatedCostUsd`, `timeoutMs`) enforce resource limits. Calls exceeding remaining budget receive `BUDGET_EXCEEDED`.

### Criterion S10-A2: Secret Vault exclusion tested in semantic/keyword/attachments/memory/tool paths

Finding C-06 identified potential exposure of Secret Vaults (Executive, Credentials) across retrieval boundaries. The system now enforces exclusion at five distinct architectural boundaries:

1. **Semantic Search Path (`src/lib/rag.ts`)**:
   - `searchDocuments` validates requested vault identifiers against `isSecretVaultId`.
   - If an agent or caller requests an Executive or Credentials vault, the function returns an empty match set immediately without issuing an RPC.
   - Broad queries across the workspace filter all returned candidate rows through `sanitizeDocumentMatches` before returning.
2. **Keyword Search Path (`src/lib/vantaRetrieval.ts` & `vantaRoutes.ts`)**:
   - `vantaRoutes.ts` queries the `documents` table with `.not('vault_id', 'in', '("credentials","credentials-vault","executive","executive-vault","secrets","secret")')`.
   - `rankStoredDocuments` filters stored rows through `sanitizeStoredDocuments`.
   - `mergeVantaDocumentMatches` drops any record matching Secret Vault identifiers.
3. **Attachment Context Path (`src/server/routes/vantaRoutes.ts`)**:
   - `sanitizeLocalContexts` filters in-memory attached files, removing secret-flagged contexts and files matching sensitive filename patterns (`.env`, `credentials`, `executive-brief`, `private-key`).
   - `POST /local-context` inspects uploaded original file names and returns HTTP 403 if a client attempts to attach secret configuration or credential files.
4. **Approved Memory Path (`src/server/routes/vantaRoutes.ts`)**:
   - `sanitizeMemories` filters memory records retrieved from `vanta_memories`, rejecting records linked to secret vault identifiers or containing secret credential tags.
5. **Agent and VANTA Tool Path (`src/lib/agentTools.ts` & `src/lib/vantaToolGateway.ts`)**:
   - `search_second_brain` in `agentTools.ts` checks `isSecretVaultId` and returns an explicit access denial if a secret vault is requested.
   - `read_workspace_file` and `write_workspace_file` in `agentTools.ts` block access to sensitive file paths.
   - `vanta_search_documents` in `vantaToolGateway.ts` blocks queries targeting Secret Vaults with `code: 'POLICY_DENIED'`.

### Criterion S10-A3: Authorized tool returns receipt; injected/unknown tool/destination denied; cancellation works

1. **Operation Verification Receipts (`VantaToolReceipt`)**:
   - Every authorized tool call emits a typed receipt containing `receiptId`, `toolName`, `toolVersion`, `effect`, `workspaceId`, `userId`, `environment`, `verifiedAt`, `durationMs`, `status`, `proof`, `tokensUsed`, and `costUsd`.
2. **Injected and Unknown Tools Denied**:
   - Invocations of unregistered or injected tool names are rejected with `code: 'TOOL_NOT_FOUND'` and yield a receipt with `status: 'blocked'`.
3. **Injected and Unauthorized Destinations Denied**:
   - `vanta_inspect_page` checks `targetRoute` against approved internal routes. Injected external URLs or unauthorized debugger paths are rejected with `code: 'DESTINATION_DENIED'` and receipt `status: 'blocked'`.
4. **Cancellation Support**:
   - `executeVantaTool` takes an optional `AbortSignal`.
   - Pre-aborted signals and mid-execution aborts cancel the operation cleanly, returning `code: 'CANCELLED'` and receipt `status: 'cancelled'`.

### Finding C-09 Resolution: Step Exhaustion Semantics

- In `src/lib/aiProvider.ts`, loop termination due to `maxSteps` without a concluding message now returns `status: 'exhausted'` and output `"Mission incomplete: allocated tool execution budget exhausted without final deliverable."`
- In `server.ts`, exhausted agent executions record telemetry `status: 'INCOMPLETE'` or `'FAILED'`, preventing false positive completion logs.

---

## Automated Verification Results

- `npm run lint` (`tsc --noEmit`): Clean pass, 0 errors.
- Vitest targeted suite (`vantaToolGateway.test.ts`, `secretVaultExclusion.test.ts`, `aiProvider.test.ts`): 33 passed, 0 failed.
- Vitest repository test suite: 102 test files passed, 705 tests passed, 0 failed.
