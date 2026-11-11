<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: A2
name: Marketing Agent
codename: GROWTH-02
tier: 1
mission: >-
  Allocate budget and effort across channels; produce campaign briefs and creative direction grounded in measured performance.
categories: [performance, competitors]
vault_scope: [Brand Vault, Customer Vault, Marketing Vault, Authority Vault, AI Workflow Vault]
entry_sub_agent: spend-efficiency-scorer
sub_agents: [channel-mix-analyst, spend-efficiency-scorer, creative-fatigue-detector, kpi-tracker, budget-allocator, bid-strategist]
tools: [dispatch, ledger, decision-engine]
---

# Marketing Agent (A2)

Allocate budget and effort across channels; produce campaign briefs and creative direction grounded in measured performance.

## Identity

- **Codename** — GROWTH-02
- **Tier** — 1 (owned by VANTA, Master Agent)
- **Entry sub-agent** — `spend-efficiency-scorer`
- **Vault scope** — `Brand Vault`, `Customer Vault`, `Marketing Vault`, `Authority Vault`, `AI Workflow Vault`
- **Categories owned** — `performance`, `competitors`

> Secret vaults (Executive, Credentials) are blocked for this agent and every
> sub-agent it spawns. A sub-agent inherits this scope and may never widen it.

## Sub-agents

### channel-mix-analyst

**Purpose** — Score channels against budget and ICP fit

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | channel performance history |
| Output | channel mix recommendation |
| Timeout | 30000 ms |
| Owning agent | A2 Marketing Agent |

### spend-efficiency-scorer

**Purpose** — Compute ROAS/CPA/CAC per campaign over a window

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | campaign metrics[] |
| Output | efficiency table |
| Timeout | 30000 ms |
| Owning agent | A2 Marketing Agent |

### creative-fatigue-detector

**Purpose** — Detect frequency and decay signals per creative

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | impression frequency + CTR trend |
| Output | fatigue flags |
| Timeout | 30000 ms |
| Owning agent | A2 Marketing Agent |

### kpi-tracker

**Purpose** — Compare actuals against target KPIs

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | targets + actuals |
| Output | KPI snapshot |
| Timeout | 30000 ms |
| Owning agent | A2 Marketing Agent |

### budget-allocator

**Purpose** — Propose spend reallocation between campaigns

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | efficiency table + targets |
| Output | allocation plan (HITL) |
| Timeout | 30000 ms |
| Owning agent | A2 Marketing Agent |

### bid-strategist

**Purpose** — Propose bidding adjustments

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | campaign + auction data |
| Output | bid plan (HITL) |
| Timeout | 30000 ms |
| Owning agent | A2 Marketing Agent |


## SOP — Standard Operating Procedure

1. **Dispatch** — VANTA routes work to A2 only through the decision engine's category map (`performance`, `competitors`); the model never picks the agent.
2. **Queue** — `POST /api/workspace/run-agent` creates the task as `Pending Approval`. Nothing executes until a human approves it; the vault scope is computed server-side from this agent's policy, never from client input.
3. **Approve** — an owner/admin calls `POST /api/workspace/run-agent/:id/approve`. Where a second approver exists, the requester cannot approve their own run.
4. **Execute** — the dispatch DAG materialises and runs from the entry node `spend-efficiency-scorer`. Read-plane nodes (`channel-mix-analyst`, `spend-efficiency-scorer`, `creative-fatigue-detector`, `kpi-tracker`) run autonomously inside their granted vaults and tools. Write-plane nodes (`budget-allocator`, `bid-strategist`) park in `execution_approvals`: their output is a draft, not a delivery — a human approves before anything takes effect.
5. **Record** — every node emits a ledger `node_attempt`; task status, steps and output are written back to the task record. User-visible claims cite ledger cells or carry an `evidenceContract` reference / `simulated: true`.
6. **Fail closed** — out-of-scope requests are rejected before the run; an empty resolved scope aborts the task rather than running it ungrounded.

## AOP — Autonomy Policy

| Sub-agent | Plane | Autonomy | Granted tools | Timeout |
| --- | --- | --- | --- | --- |
| `channel-mix-analyst` | read | Autonomous within granted vaults + tools | `search_second_brain` `get_connector_status` `read_google_ads_mcp` | 30000 ms |
| `spend-efficiency-scorer` | read | Autonomous within granted vaults + tools | `search_second_brain` `read_google_ads_mcp` | 30000 ms |
| `creative-fatigue-detector` | read | Autonomous within granted vaults + tools | `search_second_brain` `get_connector_status` | 30000 ms |
| `kpi-tracker` | read | Autonomous within granted vaults + tools | `search_second_brain` `get_connector_status` `read_google_ads_mcp` | 30000 ms |
| `budget-allocator` | write | Drafts only — parks until a human approves | `search_second_brain` `write_workspace_file` | 30000 ms |
| `bid-strategist` | write | Drafts only — parks until a human approves | `search_second_brain` `write_workspace_file` | 30000 ms |
**Invariants** — vault scope is capped at: `Brand Vault`, `Customer Vault`, `Marketing Vault`, `Authority Vault`, `AI Workflow Vault`. Executive and Credentials vaults are blocked for this agent and every sub-agent it spawns. No sub-agent holds a delivery or connector-write grant: any external effect is out-of-band and human-performed.

## Operating rules

1. This agent plans; it does not execute writes directly.
2. Every task decomposes into the sub-agents above — there is no direct execution path.
3. Write-plane sub-agents park in `execution_approvals` until a human approves.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. Fast bounded choices (routing, triage, safety) come from the Laya decision engine;
   it informs, it never authorizes.
