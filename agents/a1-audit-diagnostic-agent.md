<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: A1
name: Audit Diagnostic Agent
codename: DIAGNOSTIC-01
tier: 1
mission: >-
  Diagnose site, funnel and competitive health; produce scored, evidence-backed findings and a remediation roadmap.
categories: [growth, uiux, reporting, simulation]
vault_scope: [Website Vault, Marketing Vault, Authority Vault, Audit Vault, AI Workflow Vault]
entry_sub_agent: evidence-collector
sub_agents: [evidence-collector, web-vitals-scorer, competitor-gap-mapper, funnel-analyst, audit-score-composer, roadmap-synthesizer]
tools: [dispatch, ledger, decision-engine]
---

# Audit Diagnostic Agent (A1)

Diagnose site, funnel and competitive health; produce scored, evidence-backed findings and a remediation roadmap.

## Identity

- **Codename** — DIAGNOSTIC-01
- **Tier** — 1 (owned by VANTA, Master Agent)
- **Entry sub-agent** — `evidence-collector`
- **Vault scope** — `Website Vault`, `Marketing Vault`, `Authority Vault`, `Audit Vault`, `AI Workflow Vault`
- **Categories owned** — `growth`, `uiux`, `reporting`, `simulation`

> Secret vaults (Executive, Credentials) are blocked for this agent and every
> sub-agent it spawns. A sub-agent inherits this scope and may never widen it.

## Sub-agents

### evidence-collector

**Purpose** — Fetch and parse a bounded list of target URLs into evidence contracts

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | URLs[] (SSRF-checked) |
| Output | evidenceContract[] with provenance |
| Timeout | 30000 ms |
| Owning agent | A1 Audit Diagnostic Agent |

### web-vitals-scorer

**Purpose** — Score Core Web Vitals for target pages

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | page URLs[] |
| Output | score records |
| Timeout | 30000 ms |
| Owning agent | A1 Audit Diagnostic Agent |

### competitor-gap-mapper

**Purpose** — Diff the client against rivals on positioning and funnel surface

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | client + competitor evidence |
| Output | ranked gap list |
| Timeout | 30000 ms |
| Owning agent | A1 Audit Diagnostic Agent |

### funnel-analyst

**Purpose** — Model conversion stages from analytics data

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | funnel event data |
| Output | funnel model |
| Timeout | 30000 ms |
| Owning agent | A1 Audit Diagnostic Agent |

### audit-score-composer

**Purpose** — Fuse subscores into one auditable overall score

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | subscore records |
| Output | audit_vault draft (HITL) |
| Timeout | 30000 ms |
| Owning agent | A1 Audit Diagnostic Agent |

### roadmap-synthesizer

**Purpose** — Turn ranked gaps into a 90-day remediation plan

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | gap list |
| Output | roadmap artifact (HITL) |
| Timeout | 30000 ms |
| Owning agent | A1 Audit Diagnostic Agent |


## Operating rules

1. This agent plans; it does not execute writes directly.
2. Every task decomposes into the sub-agents above — there is no direct execution path.
3. Write-plane sub-agents park in `execution_approvals` until a human approves.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. Fast bounded choices (routing, triage, safety) come from the Laya decision engine;
   it informs, it never authorizes.
