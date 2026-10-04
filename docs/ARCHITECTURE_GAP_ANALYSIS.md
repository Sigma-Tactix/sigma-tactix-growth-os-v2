# SigmaTactix Growth OS — Current State vs. Designed Architecture (Findings)

> **Status**: Gap analysis. Companion to `docs/SYSTEM_ARCHITECTURE.md`.
> **Authored**: 2026-10-02
> **Method**: Read-only inspection of the working tree. Every "current" claim below
> cites a file and line so it can be re-verified.

---

## 1. Findings Summary

| # | Finding | Severity | Evidence |
| --- | --- | --- | --- |
| **F1** | **VANTA has a master-agent descriptor and emits a server-derived dispatch plan, but remains read-only.** | **Medium** | `MASTER_AGENT`, `DispatchPlan`, VANTA response payload, and explicit `/api/workspace/missions/dispatch` handoff |
| **F2** | **Sub-agents are catalogued and selected registry-owned nodes are materialized at runtime.** | **Low** | `agentRegistry.ts`, `expandDispatchPlan()`, `missionExecution.ts`; richer workflow-specific selection remains deferred |
| **F3** | **Task decomposition is now present for generic tasks and pipelines; explicitly dispatched VANTA plans execute a bounded multi-node chain.** | **Low** | `AgentTask` mission fields, `expandDispatchPlan()`, `materializeDispatchGraph()`, pipeline parent/child tasks |
| **F4** | **RBAC dispatch enforcement is wired.** | Closed | `/api/workspace/run-agent` resolves policy scope server-side and rejects requested out-of-scope vaults |
| **F5** | **Category ownership is total for the current 17-key map.** | Closed | `CATEGORY_OWNERS` and `MODULE_TO_SYSTEM_AGENT` are tested for coverage |
| **F6** | **Ledger now supports mission/plan/sub-agent and parent-run lineage.** | Medium | `0018_mission_execution_hierarchy.sql`; the configured database is verified, while other deployed environments remain open |
| **F7** | **Bounded workflow graph is now the generic task execution seam.** | Closed for current slice | `/run-agent` preserves focused execution; `/api/workspace/missions/dispatch` materializes selected registry-owned nodes |
| **F8** | **~28 MCP connectors are demo fixtures presented as capability.** | Medium | `demoWorkspace.ts:519-556`; `.mcp.json` has only `threejsresources` |
| **F9** | **VANTA has no agent-policy identity.** It is not a key in `AGENT_VAULT_POLICIES`. | Medium | `agentPolicies.ts:31-71` — 7 keys, none is VANTA |

---

## 2. What Already Works (do not rebuild)

These are real assets the new design must reuse:

| Asset | Status | Reuse as |
| --- | --- | --- |
| Execution Ledger (`0017`) | Applied to prod, RLS on 6 tables | Parent/child run store for Vanta decomposition |
| `agentPolicies.ts` | 7 policies, default-deny, `ALWAYS_BLOCKED` | Agent → vault grant table (extend, don't replace) |
| `agentResolution.ts` | Compiles exhaustively; maps 182 personas → 7 system agents | Vanta's persona→agent routing |
| `MODULE_TO_SYSTEM_AGENT` | 15 live keys + 8 legacy aliases | Category→agent ownership map |
| `BoundedWorkflowGraph` | Timeouts, budgets, retries, checkpoints, artifact hashes | The sub-agent execution substrate, now wired through `missionExecution.ts` |
| `evidenceContract` / `auditClaimEvidence` | Claim↔evidence binding | Sub-agent output validation |
| `decisionTrace` (`0016`) | Provenance records | Vanta's "why" explanations |
| Agent Reach (15 channels) | Working CLI router | Evidence-gathering sub-agent backend |

**Key insight:** the decomposition and explicit VANTA handoff seams now exist.
The remaining work is client-side dispatch affordance, richer workflow-specific
node contracts, and migration verification in each deployed environment.

---

## 3. Gap → Requirement Traceability

| Gap | Required capability | Design section |
| --- | --- | --- |
| F1 | Vanta as root dispatcher with an explicit policy identity | `AGENT_ARCHITECTURE.md` §3 |
| F2, F3 | Task decomposition model: task → sub-agents → DAG nodes | §4, §5 |
| F4 | Enforcement point for `evaluateAgentRequest` | §6 |
| F5 | Complete category→agent ownership, no silent default | §7 |
| F6 | Hierarchical run linkage in the ledger | §8 |
| F7 | Wire `BoundedWorkflowGraph` as the sub-agent runtime | §5 |
| F8 | Honest connector status surfaced through Vanta | §7 |
| F9 | VANTA vault policy row (read-only, cross-vault) | §6 |

---

## 4. Verification

Claims in this document were rechecked against the current working tree after
the mission execution slice:

```text
npm run lint   # tsc --noEmit — clean
npm run test   # 62 files, 421 tests passing
```

Re-verify the current execution seam with:

```bash
rg -n 'DispatchPlan|materializeDispatchGraph|parent_run_id|sub_agent' src server.ts backend/database/migrations
```
