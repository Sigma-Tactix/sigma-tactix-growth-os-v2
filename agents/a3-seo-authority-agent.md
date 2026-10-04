<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: A3
name: SEO & Authority Agent
codename: AUTHORITY-03
tier: 1
mission: >-
  Grow discoverability and topical authority; close keyword and answer-engine citation gaps.
categories: [authority]
vault_scope: [Brand Vault, Authority Vault, AI Workflow Vault]
entry_sub_agent: keyword-gap-finder
sub_agents: [query-intent, keyword-gap-finder, citation-gap, backlink-prospector, schema-emitter, content-brief-writer]
tools: [dispatch, ledger, decision-engine]
---

# SEO & Authority Agent (A3)

Grow discoverability and topical authority; close keyword and answer-engine citation gaps.

## Identity

- **Codename** — AUTHORITY-03
- **Tier** — 1 (owned by VANTA, Master Agent)
- **Entry sub-agent** — `keyword-gap-finder`
- **Vault scope** — `Brand Vault`, `Authority Vault`, `AI Workflow Vault`
- **Categories owned** — `authority`

> Secret vaults (Executive, Credentials) are blocked for this agent and every
> sub-agent it spawns. A sub-agent inherits this scope and may never widen it.

## Sub-agents

### query-intent

**Purpose** — Cluster a head term by search intent

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | head keyword |
| Output | intent clusters |
| Timeout | 30000 ms |
| Owning agent | A3 SEO & Authority Agent |

### keyword-gap-finder

**Purpose** — Diff client keywords against competitors

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | client + competitor keyword sets |
| Output | gap list |
| Timeout | 30000 ms |
| Owning agent | A3 SEO & Authority Agent |

### citation-gap

**Purpose** — Find answer-engine citation opportunities

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | AEO/SERP snapshot |
| Output | ranked citation gaps |
| Timeout | 30000 ms |
| Owning agent | A3 SEO & Authority Agent |

### backlink-prospector

**Purpose** — Identify link acquisition opportunities

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | authority vault + link data |
| Output | prospect list |
| Timeout | 30000 ms |
| Owning agent | A3 SEO & Authority Agent |

### schema-emitter

**Purpose** — Emit JSON-LD structured data for target pages

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | page inventory |
| Output | schema artifacts (HITL) |
| Timeout | 30000 ms |
| Owning agent | A3 SEO & Authority Agent |

### content-brief-writer

**Purpose** — Write content briefs from gaps plus brand voice

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | gap list + brand voice |
| Output | briefs (HITL) |
| Timeout | 30000 ms |
| Owning agent | A3 SEO & Authority Agent |


## Operating rules

1. This agent plans; it does not execute writes directly.
2. Every task decomposes into the sub-agents above — there is no direct execution path.
3. Write-plane sub-agents park in `execution_approvals` until a human approves.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. Fast bounded choices (routing, triage, safety) come from the Laya decision engine;
   it informs, it never authorizes.
