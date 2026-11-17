# Task S02: Freeze Shared Contracts, Migration Sequence, and Task Ownership

- **Task ID**: S02
- **Role**: integrator
- **Status**: Complete / Submitted
- **Milestone**: M0 Gate Closure
- **Target Release**: 20 November 2026

---

## 1. Type, Table, and Service Mappings (Acceptance S02-A1)

| Domain Contract | Proposed Contract in `CONTRACTS.md` | Concrete Source Implementation | Database Table / Migration |
| :--- | :--- | :--- | :--- |
| **Page Context Envelope** | `workspaceId`, `route`, `entityRefs`, `selectionRefs`, `filters`, `attachmentIds` | `src/types.ts` (`WorkspaceData`), `src/contexts/WorkspaceContext.tsx`, `src/contexts/VantaContext.tsx` | Enforced in memory via React Context and scoped RPCs; validated on server routes |
| **Tool & Action Consent** | Stable tool ID, input/output schema, effect class, role scope, approval state | `src/types.ts` (`AgentTask`), `src/lib/agentPolicies.ts`, `src/lib/actionQueueStore.ts` | `0018_mission_execution_hierarchy.sql`, `0020_mcp_tool_calls.sql` |
| **Execution Ledger & Runs** | Monotonic states: `requested`, `pending_approval`, `approved`, `queued`, `running`, `succeeded`, `failed`, `cancelled` | `src/lib/executionLedger.ts` (`ExecutionRun`, `NodeAttempt`, `LedgerEvent`, `RunStatus`) | `backend/database/migrations/0017_execution_ledger.sql` (`execution_runs`, `node_attempts`, `ledger_events`) |
| **Artifacts & Provenance** | Immutable bytes, MIME, renderer version, source snapshot refs, QA receipt | `src/lib/exportProvenance.ts`, `src/lib/reportSnapshot.ts`, `src/lib/pdfReportRenderer.ts` | `backend/database/migrations/0019_landing_artifacts.sql` (`landing_artifacts`) |
| **Capability Registry** | Operation-specific: provider + tool + operation + account + status + evidence | `src/lib/capabilityRegistry.ts`, `src/data/aiProviderCatalog.ts`, `src/server/providers/` | Dynamic capability status matrix with verified receipt timestamps |

---

## 2. Frozen Semantics & Migration Sequence (Acceptance S02-A2)

### A. Ubiquitous Domain Terminology Invariants
* **Client Enclave**: Multi-tenant isolation boundary (never "account" or "tenant folder").
* **Knowledge Vault**: Specialized domain vault (never "bucket" or "folder").
* **Secret Vault**: Specifically `executive_vault` and `credentials_vault` (never accessible to autonomous AI agents).
* **Human-in-the-Loop (HITL)**: Mandatory affirmative human approval gate for all external, state-mutating, or financial actions.
* **VANTA**: System multimodal voice and neural inspection core.
* **Agent Reach**: 15-channel external intelligence router.

### B. Monotonic Execution Ledger States
```
[ requested ] ──> [ pending_approval ] ──> [ approved ] ──> [ queued ] ──> [ running ] ──> [ succeeded ]
                          │                                                                       ▲
                          └──> [ rejected ]                                                       │
                                                                                                  ├──> [ failed ]
                                                                                                  └──> [ cancelled ]
```

### C. Migration Sequence Baseline
* Active highest database migration: `0022_fix_workspaces_select_policy.sql`.
* **Next assigned migration number**: `0023_*.sql`. No parallel or out-of-order numbering is permitted.

---

## 3. Shared File Ownership and Resource Leases (Acceptance S02-A3)

To prevent merge collisions and unauthorized concurrent modifications across tasks:

| Protected Resource Key | Target File / Area | Authorized Task Lane |
| :--- | :--- | :--- |
| `server.ts` | Express API gateway (`server.ts`) | Platform Lane (`S04`, `S06`, `S07`, `S10`, `S12`) |
| `Layout.tsx` | Application shell and VANTA attachment dock (`src/components/Layout.tsx`) | Product Lane (`S09`) |
| `workspace-lifecycle` | Client Enclave lifecycle services (`src/lib/workspaceManage.ts`) | Platform Lane (`S05`) |
| `execution-ledger` | Authoritative run ledger (`src/lib/executionLedger.ts`) | Platform Lane (`S07`) |
| `shared-contracts` | Type definitions (`src/types.ts`) & Migration Numbering | Integrator Lane (`S02`, `S20`) |
| `control-inventory` | Seed and extended route inventories (`docs/release-2026-11-20/`) | Product Lane (`S00`, `S14`) |
| `certification-evidence`| Independent verification test results (`certification/`) | QA Lane (`S15`, `S17`, `S18`, `S22`) |

All task evidence must be placed in `evidence/S{task_id}/` inside the repository tree and verified before review.
