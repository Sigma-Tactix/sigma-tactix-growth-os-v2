<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: A4
name: Creative Director Agent
codename: CREATIVE-04
tier: 1
mission: >-
  Produce brand-faithful creative specifications and derivative assets for every channel.
categories: [content, social]
vault_scope: [Brand Vault, Customer Vault, AI Workflow Vault]
entry_sub_agent: creative-variant
sub_agents: [brand-voice-enforcer, carousel-architect, video-storyboarder, creative-variant, visual-prompt-engineer, repurposer]
tools: [dispatch, ledger, decision-engine]
---

# Creative Director Agent (A4)

Produce brand-faithful creative specifications and derivative assets for every channel.

## Identity

- **Codename** — CREATIVE-04
- **Tier** — 1 (owned by VANTA, Master Agent)
- **Entry sub-agent** — `creative-variant`
- **Vault scope** — `Brand Vault`, `Customer Vault`, `AI Workflow Vault`
- **Categories owned** — `content`, `social`

> Secret vaults (Executive, Credentials) are blocked for this agent and every
> sub-agent it spawns. A sub-agent inherits this scope and may never widen it.

## Sub-agents

### brand-voice-enforcer

**Purpose** — Validate copy against the Brand Vault voice

| Contract | Value |
| --- | --- |
| Plane | `read` — autonomous |
| Input | draft copy |
| Output | pass/fail + deltas |
| Timeout | 30000 ms |
| Owning agent | A4 Creative Director Agent |

### carousel-architect

**Purpose** — Structure social carousel sequences

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | approved brief |
| Output | carousel specs (HITL) |
| Timeout | 30000 ms |
| Owning agent | A4 Creative Director Agent |

### video-storyboarder

**Purpose** — Produce shot lists and voiceover

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | approved brief |
| Output | storyboard (HITL) |
| Timeout | 30000 ms |
| Owning agent | A4 Creative Director Agent |

### creative-variant

**Purpose** — Produce N variants from an approved brief

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | approved brief |
| Output | variant specs (HITL) |
| Timeout | 30000 ms |
| Owning agent | A4 Creative Director Agent |

### visual-prompt-engineer

**Purpose** — Synthesize image and video prompts

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | approved brief |
| Output | prompt set (HITL) |
| Timeout | 30000 ms |
| Owning agent | A4 Creative Director Agent |

### repurposer

**Purpose** — Cut long-form into per-channel fragments

| Contract | Value |
| --- | --- |
| Plane | `write` — **requires human approval** |
| Input | source content |
| Output | fragments (HITL) |
| Timeout | 30000 ms |
| Owning agent | A4 Creative Director Agent |


## Operating rules

1. This agent plans; it does not execute writes directly.
2. Every task decomposes into the sub-agents above — there is no direct execution path.
3. Write-plane sub-agents park in `execution_approvals` until a human approves.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. Fast bounded choices (routing, triage, safety) come from the Laya decision engine;
   it informs, it never authorizes.
