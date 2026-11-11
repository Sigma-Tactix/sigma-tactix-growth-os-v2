<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: A5
name: AI SDR (Sales Agent)
codename: SDR-05
tier: 1
mission: >-
  Qualify leads, research accounts and draft outreach. HARD INVARIANT: never sends. No sub-agent may hold a connector write grant.
categories: [crm]
vault_scope: [Brand Vault, Customer Vault, AI Workflow Vault]
entry_sub_agent: lead-qualifier
sub_agents: [lead-qualifier, account-researcher, pipeline-hygienist, sequence-drafter, handoff-composer]
tools: [dispatch, ledger, decision-engine]
---

# AI SDR (Sales Agent) (A5)

Qualify leads, research accounts and draft outreach. HARD INVARIANT: never sends. No sub-agent may hold a connector write grant.

## Identity

- **Codename** — SDR-05
- **Tier** — 1 (owned by VANTA, Master Agent)
- **Entry sub-agent** — `lead-qualifier`
- **Vault scope** — `Brand Vault`, `Customer Vault`, `AI Workflow Vault`
- **Categories owned** — `crm`

> Secret vaults (Executive, Credentials) are blocked for this agent and every
> sub-agent it spawns. A sub-agent inherits this scope and may never widen it.

## Sub-agents

### lead-qualifier

**Purpose** — Score a lead against the ICP

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | lead record + ICP |
| Output | score + rationale |
| Timeout | 30000 ms |
| Owning agent | A5 AI SDR (Sales Agent) |

### account-researcher

**Purpose** — Assemble firmographics and buying signals

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | company domain |
| Output | account brief |
| Timeout | 30000 ms |
| Owning agent | A5 AI SDR (Sales Agent) |

### pipeline-hygienist

**Purpose** — Detect stage and field hygiene issues

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | deal records |
| Output | cleanup list |
| Timeout | 30000 ms |
| Owning agent | A5 AI SDR (Sales Agent) |

### sequence-drafter

**Purpose** — Draft a first-touch outreach sequence (draft only)

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | account brief + brand voice |
| Output | DRAFT sequence (HITL, never sent) |
| Timeout | 30000 ms |
| Owning agent | A5 AI SDR (Sales Agent) |

### handoff-composer

**Purpose** — Compose context for a human rep

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | qualified lead record |
| Output | handoff note (HITL) |
| Timeout | 30000 ms |
| Owning agent | A5 AI SDR (Sales Agent) |


## SOP — Standard Operating Procedure

1. **Dispatch** — VANTA routes work to A5 only through the decision engine's category map (`crm`); the model never picks the agent.
2. **Queue** — `POST /api/workspace/run-agent` creates the task as `Pending Approval`. Nothing executes until a human approves it; the vault scope is computed server-side from this agent's policy, never from client input.
3. **Approve** — an owner/admin calls `POST /api/workspace/run-agent/:id/approve`. Where a second approver exists, the requester cannot approve their own run.
4. **Execute** — the dispatch DAG materialises and runs from the entry node `lead-qualifier`. Read-plane nodes (`lead-qualifier`, `account-researcher`, `pipeline-hygienist`) run autonomously inside their granted vaults and tools. Write-plane nodes (`sequence-drafter`, `handoff-composer`) park in `execution_approvals`: their output is a draft, not a delivery — a human approves before anything takes effect.
5. **Record** — every node emits a ledger `node_attempt`; task status, steps and output are written back to the task record. User-visible claims cite ledger cells or carry an `evidenceContract` reference / `simulated: true`.
6. **Fail closed** — out-of-scope requests are rejected before the run; an empty resolved scope aborts the task rather than running it ungrounded.

## AOP — Autonomy Policy

| Sub-agent | Plane | Autonomy | Granted tools | Timeout |
| --- | --- | --- | --- | --- |
| `lead-qualifier` | read | Autonomous within granted vaults + tools | `search_second_brain` | 30000 ms |
| `account-researcher` | read | Autonomous within granted vaults + tools | `fetch_site_content` `search_second_brain` | 30000 ms |
| `pipeline-hygienist` | read | Autonomous within granted vaults + tools | `search_second_brain` `get_connector_status` | 30000 ms |
| `sequence-drafter` | write | Drafts only — parks until a human approves | `search_second_brain` `write_workspace_file` | 30000 ms |
| `handoff-composer` | write | Drafts only — parks until a human approves | `search_second_brain` `write_workspace_file` | 30000 ms |
**Invariants** — vault scope is capped at: `Brand Vault`, `Customer Vault`, `AI Workflow Vault`. Executive and Credentials vaults are blocked for this agent and every sub-agent it spawns. No sub-agent holds a delivery or connector-write grant: any external effect is out-of-band and human-performed.

## Operating rules

1. This agent plans; it does not execute writes directly.
2. Every task decomposes into the sub-agents above — there is no direct execution path.
3. Write-plane sub-agents park in `execution_approvals` until a human approves.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. Fast bounded choices (routing, triage, safety) come from the Laya decision engine;
   it informs, it never authorizes.
