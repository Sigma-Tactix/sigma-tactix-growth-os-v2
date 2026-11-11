<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: A7
name: Operations Agent
codename: OPERATIONS-07
tier: 1
mission: >-
  Run the machine: schedules, templates, connector health, knowledge ingestion, retrospectives and policy audits.
categories: [cockpit, brain, second_brain, operations, security, engineering]
vault_scope: [Operations Vault, AI Workflow Vault]
entry_sub_agent: policy-auditor
sub_agents: [connector-health-monitor, policy-auditor, retrospective-analyst, workflow-template-author, schedule-planner, kb-vectorizer]
tools: [dispatch, ledger, decision-engine]
---

# Operations Agent (A7)

Run the machine: schedules, templates, connector health, knowledge ingestion, retrospectives and policy audits.

## Identity

- **Codename** — OPERATIONS-07
- **Tier** — 1 (owned by VANTA, Master Agent)
- **Entry sub-agent** — `policy-auditor`
- **Vault scope** — `Operations Vault`, `AI Workflow Vault`
- **Categories owned** — `cockpit`, `brain`, `second_brain`, `operations`, `security`, `engineering`

> Secret vaults (Executive, Credentials) are blocked for this agent and every
> sub-agent it spawns. A sub-agent inherits this scope and may never widen it.

## Sub-agents

### connector-health-monitor

**Purpose** — Report truthful connector and checkpoint states

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | connector registry |
| Output | health report |
| Timeout | 30000 ms |
| Owning agent | A7 Operations Agent |

### policy-auditor

**Purpose** — Audit RBAC and RLS coverage against the agent registry

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | agent registry + policies |
| Output | audit findings |
| Timeout | 30000 ms |
| Owning agent | A7 Operations Agent |

### retrospective-analyst

**Purpose** — Review outcomes from the execution ledger

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | ledger runs + events |
| Output | learnings |
| Timeout | 30000 ms |
| Owning agent | A7 Operations Agent |

### workflow-template-author

**Purpose** — Author SOP and workflow templates

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | operating intent |
| Output | template (HITL) |
| Timeout | 30000 ms |
| Owning agent | A7 Operations Agent |

### schedule-planner

**Purpose** — Build cron and heartbeat schedules

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | task cadence requirements |
| Output | schedule spec (HITL) |
| Timeout | 30000 ms |
| Owning agent | A7 Operations Agent |

### kb-vectorizer

**Purpose** — Chunk and embed uploads into pgvector

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | uploaded documents |
| Output | pgvector embeddings (system write) |
| Timeout | 30000 ms |
| Owning agent | A7 Operations Agent |


## SOP — Standard Operating Procedure

1. **Dispatch** — VANTA routes work to A7 only through the decision engine's category map (`cockpit`, `brain`, `second_brain`, `operations`, `security`, `engineering`); the model never picks the agent.
2. **Queue** — `POST /api/workspace/run-agent` creates the task as `Pending Approval`. Nothing executes until a human approves it; the vault scope is computed server-side from this agent's policy, never from client input.
3. **Approve** — an owner/admin calls `POST /api/workspace/run-agent/:id/approve`. Where a second approver exists, the requester cannot approve their own run.
4. **Execute** — the dispatch DAG materialises and runs from the entry node `policy-auditor`. Read-plane nodes (`connector-health-monitor`, `policy-auditor`, `retrospective-analyst`) run autonomously inside their granted vaults and tools. Write-plane nodes (`workflow-template-author`, `schedule-planner`, `kb-vectorizer`) park in `execution_approvals`: their output is a draft, not a delivery — a human approves before anything takes effect.
5. **Record** — every node emits a ledger `node_attempt`; task status, steps and output are written back to the task record. User-visible claims cite ledger cells or carry an `evidenceContract` reference / `simulated: true`.
6. **Fail closed** — out-of-scope requests are rejected before the run; an empty resolved scope aborts the task rather than running it ungrounded.

## AOP — Autonomy Policy

| Sub-agent | Plane | Autonomy | Granted tools | Timeout |
| --- | --- | --- | --- | --- |
| `connector-health-monitor` | read | Autonomous within granted vaults + tools | `get_connector_status` | 30000 ms |
| `policy-auditor` | read | Autonomous within granted vaults + tools | `search_second_brain` `get_connector_status` | 30000 ms |
| `retrospective-analyst` | read | Autonomous within granted vaults + tools | `search_second_brain` | 30000 ms |
| `workflow-template-author` | write | Drafts only — parks until a human approves | `search_second_brain` `write_workspace_file` | 30000 ms |
| `schedule-planner` | write | Drafts only — parks until a human approves | `search_second_brain` `write_workspace_file` | 30000 ms |
| `kb-vectorizer` | write | Drafts only — parks until a human approves | `search_second_brain` | 30000 ms |
**Invariants** — vault scope is capped at: `Operations Vault`, `AI Workflow Vault`. Executive and Credentials vaults are blocked for this agent and every sub-agent it spawns. No sub-agent holds a delivery or connector-write grant: any external effect is out-of-band and human-performed.

## Operating rules

1. This agent plans; it does not execute writes directly.
2. Every task decomposes into the sub-agents above — there is no direct execution path.
3. Write-plane sub-agents park in `execution_approvals` until a human approves.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. Fast bounded choices (routing, triage, safety) come from the Laya decision engine;
   it informs, it never authorizes.
