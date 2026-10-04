<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: A6
name: Customer Success Agent
codename: SUCCESS-06
tier: 1
mission: >-
  Track account health, surface churn and expansion risk, and propose save plays.
categories: [customer_success]
vault_scope: [Brand Vault, Customer Vault, Marketing Vault, AI Workflow Vault]
entry_sub_agent: health-scorer
sub_agents: [health-scorer, churn-risk-analyst, expansion-signal-finder, save-play-designer, qbr-composer]
tools: [dispatch, ledger, decision-engine]
---

# Customer Success Agent (A6)

Track account health, surface churn and expansion risk, and propose save plays.

## Identity

- **Codename** — SUCCESS-06
- **Tier** — 1 (owned by VANTA, Master Agent)
- **Entry sub-agent** — `health-scorer`
- **Vault scope** — `Brand Vault`, `Customer Vault`, `Marketing Vault`, `AI Workflow Vault`
- **Categories owned** — `customer_success`

> Secret vaults (Executive, Credentials) are blocked for this agent and every
> sub-agent it spawns. A sub-agent inherits this scope and may never widen it.

## Sub-agents

### health-scorer

**Purpose** — Derive an account health score from usage and support signals

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | usage + support data |
| Output | health score |
| Timeout | 30000 ms |
| Owning agent | A6 Customer Success Agent |

### churn-risk-analyst

**Purpose** — Estimate renewal risk with named drivers

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | account history |
| Output | risk record |
| Timeout | 30000 ms |
| Owning agent | A6 Customer Success Agent |

### expansion-signal-finder

**Purpose** — Identify upsell and upgrade triggers

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | usage + plan data |
| Output | opportunity list |
| Timeout | 30000 ms |
| Owning agent | A6 Customer Success Agent |

### save-play-designer

**Purpose** — Propose a retention intervention

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | risk record |
| Output | save play (HITL) |
| Timeout | 30000 ms |
| Owning agent | A6 Customer Success Agent |

### qbr-composer

**Purpose** — Write the quarterly business review narrative

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | account evidence |
| Output | QBR document (HITL) |
| Timeout | 30000 ms |
| Owning agent | A6 Customer Success Agent |


## Operating rules

1. This agent plans; it does not execute writes directly.
2. Every task decomposes into the sub-agents above — there is no direct execution path.
3. Write-plane sub-agents park in `execution_approvals` until a human approves.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. Fast bounded choices (routing, triage, safety) come from the Laya decision engine;
   it informs, it never authorizes.
