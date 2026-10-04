# SigmaTactix Growth OS — Agent & Sub-Agent Architecture (Vanta-Rooted)

> **Status**: Proposed target architecture. Complements `docs/SYSTEM_ARCHITECTURE.md`;
> gaps justified in `docs/ARCHITECTURE_GAP_ANALYSIS.md`.
> **Authored**: 2026-10-02
> **Invariant source**: `CONTEXT.md`, `.clinerules`, `src/lib/agentPolicies.ts`

---

## 1. The Hierarchy (one root, 3 tiers)

```text
                          ┌───────────────────────────────────┐
                          │   VANTA  — Master Agent (M0)     │
                          │   Root of all task decomposition  │
                          │   NEVER executes. NEVER writes.   │
                          │   Dispatches → owns → explains    │
                          └─────────────────┬─────────────────┘
                                            │ dispatches
        ┌──────────────┬──────────────┬─────┴──────┬──────────────┬──────────────┐
        ▼              ▼              ▼            ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐  ┌─────────┐   ┌─────────┐   ┌─────────┐
   │  A1     │   │  A2     │   │  A3     │  │  A4     │   │  A5     │   │  A6/A7  │
   │ Audit   │   │Marketing│   │  SEO &  │  │Creative │   │ AI SDR  │   │  CS/Ops │
   │Diagnost.│   │         │   │Authority│  │Director │   │(NEVER   │   │         │
   └────┬────┘   └────┬────┘   └────┬────┘  └────┬────┘   │  SENDS) │   └────┬────┘
        │ owns        │ owns        │ owns       │ owns          │ owns         │ owns
        ▼             ▼             ▼            ▼              ▼              ▼
   Tier 2 sub-agents per agent (catalogued in §3, 39 total)
        │ decomposes each task into bounded steps
        ▼
   ┌────────────────────────────────────────────────────────────────────────────┐
   │  TIER 3 — EXECUTION NODES  (BoundedWorkflowGraph nodes, no free reasoning) │
   │  Each: inputSchema, outputSchema, permittedTools, timeoutMs, budgetCap    │
   └────────────────────────────────────────────────────────────────────────────┘
```

**Three tiers, strictly:**

| Tier | Name | Who | Can reason? | Can write? |
| --- | --- | --- | --- | --- |
| **T0** | Master Agent | VANTA | Yes — decomposition, prioritisation, explanation | **Never** |
| **T1** | System Agent | A1–A7 | Yes — planning within its domain | Drafts only, HITL-gated |
| **T2** | Sub-Agent | 39 named in §3 | No — deterministic execution of one bounded step | Only its own artifacts |
| **T3** | Execution Node | Graph nodes | **No LLM at all** where possible | No |

The tier separation is the governance mechanism. A T2 sub-agent cannot decide
*what* to do, only *how* to do its assigned step — so the blast radius of a
hallucination is one artifact, not a strategy.

## 2. VANTA as Master Agent (M0)

### 2.1 Current vs. required

| Aspect | Current (`vantaServer.ts`, `vanta.ts`) | Required |
| --- | --- | --- |
| Role | Conversational operator, read-only | **Root dispatcher + explainer** |
| Execution | Explicitly forbidden | Still forbidden — **do not change this** |
| Dispatch | None (`VantaActionProposal` has `targetModule`/`targetRoute` only) | Emits `DispatchPlan` naming an **Agent + Sub-agents** |
| Vault policy | Not a key in `AGENT_VAULT_POLICIES` (F9) | Add read-only, cross-vault-metadata policy |
| Ledger awareness | Reads tasks as context strings | Reads live run state; narrates real transitions |

**Critical design note.** VANTA's *"you cannot execute changes"* constraint is
**correct and must be preserved**. Master ≠ omnipotent. VANTA decomposes and
dispatches; T1 agents plan; humans approve anything that writes. If VANTA
gained execution rights the approval gate would become decorative — exactly the
failure `.clinerules` rule 2 and the execution ledger exist to prevent.

### 2.2 Vanta's vault policy (new row)

VANTA must *see* everything to prioritise, but *read* nothing sensitive:

| Vault | Vanta access | Rationale |
| --- | --- | --- |
| Brand, Customer, Marketing, Website, Authority, Operations, Audit | **metadata read** | Counts, recency, health — not content |
| AI Workflow | read | DAG/router visibility |
| **Executive** | **BLOCKED** | Financials/IP never in planning context |
| **Credentials** | **BLOCKED** | Never, at any tier |

Add to `agentPolicies.ts`:

```ts
"VANTA Master Agent": {
  allowed: ["Brand Vault","Customer Vault","Marketing Vault","Website Vault",
            "Authority Vault","Operations Vault","Audit Vault","AI Workflow Vault"],
  blocked: ["Executive Vault","Credentials Vault"],
},
```

This row is **additive** — existing policies unchanged, and `ALWAYS_BLOCKED`
already prevents re-opening the secret vaults.

### 2.3 DispatchPlan contract

```ts
interface DispatchPlan {
  planId: string;
  intent: string;              // operator's goal, restated
  category: ModuleKey;         // one of the 15 in §7
  ownerAgent: SystemAgentName; // A1–A7, MUST match MODULE_TO_SYSTEM_AGENT
  subAgents: SubAgentSpec[];   // T2 workers, each bounded
  requiresApproval: boolean;   // true if ANY node touches the write plane
  evidenceRefs: string[];      // VantaEvidence ids grounding the plan
  budgetCap: { maxTokens: number; maxCostUsd: number };
}
```

`ownerAgent` is **not** chosen freely by the model — it is derived from
`MODULE_TO_SYSTEM_AGENT[category]` and validated. Vanta proposes *how*; the map
dictates *who owns it*. This closes gap F5 permanently.

---

## 3. Sub-Agent Catalogue (Tier 2)

Every category has an owning agent; every agent owns a sub-agent roster.
**Every task, without exception, decomposes into sub-agents.**

### A1 — Audit Diagnostic Agent

*Categories:* `growth`, `uiux`, `reporting`, `simulation`
*Vaults:* Website, Marketing, Authority, Audit, AI Workflow

| Sub-agent | Bounded responsibility | Output | Plane |
| --- | --- | --- | --- |
| `evidence-collector` | Fetch + parse N target URLs | `evidenceContract[]` | read (SSRF-guarded) |
| `web-vitals-scorer` | Lighthouse/CWV for target pages | score record | read |
| `competitor-gap-mapper` | Diff client vs. rivals | gap list | read |
| `funnel-analyst` | Map conversion stages from GA4 | funnel model | read |
| `audit-score-composer` | Fuse subscores → overall score | audit draft | **write (HITL)** |
| `roadmap-synthesizer` | Gaps → 90-day plan | roadmap artifact | **write (HITL)** |

### A2 — Marketing Agent

*Categories:* `performance`, `competitors`
*Vaults:* Brand, Customer, Marketing, Authority, AI Workflow

| Sub-agent | Bounded responsibility | Output | Plane |
| --- | --- | --- | --- |
| `channel-mix-analyst` | Score channels vs. budget/ICP | mix recommendation | read |
| `spend-efficiency-scorer` | ROAS/CPA/CAC per campaign | efficiency table | read |
| `creative-fatigue-detector` | Frequency/decay signals | fatigue flags | read |
| `budget-allocator` | Propose reallocation | allocation plan | **write (HITL)** |
| `bid-strategist` | Bidding adjustments | bid plan | **write (HITL)** |
| `kpi-tracker` | Target vs actual | KPI snapshot | read |

### A3 — SEO & Authority Agent

*Categories:* `authority`
*Vaults:* Brand, Authority, AI Workflow

| Sub-agent | Bounded responsibility | Output | Plane |
| --- | --- | --- | --- |
| `query-intent` | Cluster a head term by intent | intent clusters | read |
| `keyword-gap-finder` | Client vs. competitor keyword delta | gap list | read |
| `citation-gap` | AEO citation opportunities | ranked gaps | read |
| `schema-emitter` | JSON-LD for target pages | schema artifacts | **write (HITL)** |
| `backlink-prospector` | Authority Vault link opportunities | prospect list | read |
| `content-brief-writer` | Briefs from gap + Brand voice | briefs | **write (HITL)** |

### A4 — Creative Director Agent

*Categories:* `content`, `social`
*Vaults:* Brand, Customer, AI Workflow

| Sub-agent | Bounded responsibility | Output | Plane |
| --- | --- | --- | --- |
| `brand-voice-enforcer` | Validate copy against Brand Vault | pass/fail + deltas | read |
| `creative-variant` | N variants from an approved brief | variant specs | **write (HITL)** |
| `visual-prompt-engineer` | Image/video prompt synthesis | prompt set | **write (HITL)** |
| `repurposer` | Long-form → channel fragments | fragments | **write (HITL)** |
| `carousel-architect` | Social carousel structures | carousel specs | **write (HITL)** |
| `video-storyboarder` | Shot list + voiceover | storyboard | **write (HITL)** |

### A5 — AI SDR (Sales Agent)

*Categories:* `crm`
*Vaults:* Brand, Customer, AI Workflow · **NO WRITE PLANE — EVER**

| Sub-agent | Bounded responsibility | Output | Plane |
| --- | --- | --- | --- |
| `lead-qualifier` | Score lead vs. ICP | score + rationale | read |
| `account-researcher` | Firmographics + signals | account brief | read (Agent Reach) |
| `sequence-drafter` | Draft first-touch sequence | **draft only** | **write (HITL)** |
| `pipeline-hygienist` | Stage/field hygiene | cleanup list | read |
| `handoff-composer` | Context for human rep | handoff note | **write (HITL)** |

> **Hard invariant.** No sub-agent under A5 has a connector write grant.
> Outreach leaves the system only when a human sends it. Any future change that
> grants A5 a write tool is a security regression, not a feature.

### A6 — Customer Success Agent

*Categories:* `customer_success`
*Vaults:* Brand, Customer, Marketing, AI Workflow

| Sub-agent | Bounded responsibility | Output | Plane |
| --- | --- | --- | --- |
| `health-scorer` | Usage + support signals → health | health score | read |
| `churn-risk-analyst` | Renewal risk with drivers | risk record | read |
| `save-play-designer` | Intervention proposal | save play | **write (HITL)** |
| `expansion-signal-finder` | Upsell/upgrade triggers | opportunity list | read |
| `qbr-composer` | Quarterly review narrative | QBR doc | **write (HITL)** |

### A7 — Operations Agent

*Categories:* `cockpit`, `brain`, `second_brain`, `operations`, `security`, `engineering`
*Vaults:* Operations, AI Workflow

| Sub-agent | Bounded responsibility | Output | Plane |
| --- | --- | --- | --- |
| `workflow-template-author` | SOP/workflow templates | template | **write (HITL)** |
| `schedule-planner` | Build cron/heartbeat plans | schedule spec | **write (HITL)** |
| `connector-health-monitor` | Verify connector states honestly | health report | read |
| `kb-vectorizer` | Chunk + embed uploads into pgvector | embeddings | write (system) |
| `retrospective-analyst` | Outcome review from ledger | learnings | **write (HITL)** |
| `policy-auditor` | RBAC/RLS compliance checks | audit findings | read |

**Total: 7 owning agents, 39 sub-agents, 17 categories — full coverage.**

> Authoritative source: `src/lib/agentRegistry.ts`. Files under `agents/` are
> generated from it (`npm run agents:docs`) and cross-checked against
> `agentPolicies.ts` by `agentRegistry.test.ts`.

---

## 4. The Universal Decomposition Rule

There is exactly one legal path from a task to sub-agents. No agent may execute
a task directly.

```text
1. VANTA           classify intent → category → DispatchPlan
2. Category map    category → ownerAgent        (MODULE_TO_SYSTEM_AGENT, validated)
3. Vault policy    ownerAgent → allowed vaults   (agentPolicies, default-deny)
4. Decompose       ownerAgent → sub-agent roster (§3), each with input/output schema
5. Materialise     sub-agents → BoundedWorkflowGraph nodes with budgets + timeouts
6. Execute         read-plane nodes run now; write-plane nodes PARK as approvals
7. Ledger          every hop → execution_events; children link to parent run
8. Explain         VANTA narrates what ran, what was measured, what is pending
```

**Rules that make this non-bypassable:**

| # | Rule | Enforcement |
| --- | --- | --- |
| R1 | An agent with no sub-agent roster for its category **cannot run** | Startup assertion; category→roster must be total |
| R2 | Sub-agent vault scope ⊆ owner scope − {Executive, Credentials} | `evaluateAgentRequest` per sub-agent at spawn |
| R3 | No sub-agent opens a run; it emits a `node_attempt` on the parent's run | Ledger FK constraint |
| R4 | Write-plane node without an approval row **never executes** | `execution_approvals` check at the executor |
| R5 | No sub-agent emits a user-visible claim without `evidenceRefs` or `simulated: true` | `auditClaimEvidence` validation |
| R6 | Every sub-agent carries `timeoutMs`, `maxRetries`, `budgetCap` | Required fields in `WorkflowNodeDefinition` |

---

## 5. Worked Example

**Operator to VANTA:** *"Our Meta ROAS dropped. Find out why and tell me what to fix."*

```text
VANTA (T0)
  intent: diagnose ROAS decline
  category: performance → ownerAgent = Marketing Agent   (map-derived, not model-chosen)
  evidenceRefs: [paid-ads-spend-table, meta-campaign-export]
  subAgents:
    spend-efficiency-scorer   → read    (ROAS/CPA per campaign, 30d)
    creative-fatigue-detector → read    (frequency + decay signals)
    channel-mix-analyst       → read    (mix vs. budget/ICP)
    kpi-tracker              → read    (target vs. actual)
  requiresApproval: false     (all read-plane)
  budgetCap: 40k tokens

Marketing Agent (T1) → validates the roster is legal for A2, then materialises:

  [spend-efficiency-scorer]─┐
  [creative-fatigue-detector]├─ fan-out (parallel)
  [channel-mix-analyst]──────┤
  [kpi-tracker]─────────────┘
              ↓
  BoundedWorkflowGraph: 4 nodes, each timeoutMs + budgetCap
              ↓
  execution_runs (parent) + execution_node_attempts (children)
              ↓
VANTA narrates: "ROAS fell 22% on 2 campaigns; both are frequency-saturated
at 6.2 vs. a 3.5 benchmark. Root cause is creative fatigue, not budget."
```

A follow-up — *"cut spend on those two"* — takes a different path:

```text
category: performance → Marketing Agent
subAgents: budget-allocator (write plane) → bid-strategist (write plane)
requiresApproval: TRUE
  → both nodes PARK in execution_approvals; VANTA proposes; a human approves;
    only then do they execute.
```

Note the state change: the same agent, same category, but `requiresApproval`
flips solely because the sub-agents moved to the write plane. That single
property is the entire governance model.

---

## 6. Category Ownership — Complete Coverage

Extends `MODULE_TO_SYSTEM_AGENT` to be **total** (no fallback branch). Closes F5.

| Category key | Owning agent | Sub-agent entry point |
| --- | --- | --- |
| `growth` | A1 Audit Diagnostic | `evidence-collector` |
| `uiux` | A1 Audit Diagnostic | `web-vitals-scorer` |
| `reporting` | A1 Audit Diagnostic | `audit-score-composer` |
| `simulation` | A1 Audit Diagnostic | `funnel-analyst` |
| `performance` | A2 Marketing | `spend-efficiency-scorer` |
| `competitors` | A2 Marketing | `competitor-gap-mapper` |
| `authority` | A3 SEO & Authority | `keyword-gap-finder` |
| `content` | A4 Creative Director | `creative-variant` |
| `social` | A4 Creative Director | `repurposer` |
| `crm` | A5 AI SDR | `lead-qualifier` |
| `customer_success` | A6 Customer Success | `health-scorer` |
| `cockpit` | A7 Operations | `retrospective-analyst` |
| `brain` | A7 Operations | `kb-vectorizer` |
| `second_brain` | A7 Operations | `kb-vectorizer` |
| `operations` | A7 Operations | `workflow-template-author` |
| `security` | A7 Operations | `policy-auditor` |
| `engineering` | A7 Operations | `policy-auditor` |

Every category resolves to exactly one owner and at least one sub-agent.
An unmapped category is a **build error**, not a `|| "Marketing Agent"` default.

---

## 7. Ledger Schema Extension

Closes F6. Adds parent/child linkage so a Vanta plan and its sub-agent attempts
are one reconstructable unit.

```sql
-- 0018_mission_execution_hierarchy.sql

ALTER TABLE execution_runs
  ADD COLUMN IF NOT EXISTS parent_run_id  uuid REFERENCES execution_runs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS owner_agent    text,     -- 'VANTA Master Agent' | A1..A7
  ADD COLUMN IF NOT EXISTS category       text,     -- module key
  ADD COLUMN IF NOT EXISTS plan_id        text;     -- DispatchPlan.planId

ALTER TABLE execution_node_attempts
  ADD COLUMN IF NOT EXISTS sub_agent      text NOT NULL,   -- §3 name
  ADD COLUMN IF NOT EXISTS tier           smallint NOT NULL DEFAULT 2
        CHECK (tier IN (2, 3)),
  ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS evidence_refs  jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_runs_parent ON execution_runs(parent_run_id);
CREATE INDEX IF NOT EXISTS idx_nodes_subagent ON execution_node_attempts(sub_agent);
```text

Plus `agentSubAgents.ts` as the single registry of §3 (sub-agent → owning agent,
vault scope, input/output schemas, timeout, budget). It is the runtime mirror of
this document and the thing R1/R2 assert against.

---

## 8. Enforcement Point (closes F4)

`agentPolicies.ts` states the wiring as a source TODO. Concretely, inside the
dispatch path — before any LLM call:

```ts
// server.ts — POST /api/workspace/run-agent
const dispatch = resolveAgentDispatch(requestedAgentName, requestedGoal, moduleKey);
if (!dispatch) return res.status(400).json({ error: 'Unknown agent or unmapped module' });

const scope = evaluateAgentRequest(dispatch.agentName, requestedVaults);
if (!scope.authorized) {
  return res.status(403).json({
    error: 'Vault scope denied',
    unauthorized: scope.unauthorizedRequests,   // never silently proceed
  });
}
```text

Today an unauthorised request can still produce an artifact with
`allowedScope: []` — "fail-closed on the data, fail-OPEN on the run", which is
precisely the bug `agentResolution.ts` documents. This block closes it.

---

## 9. Implementation Roadmap

| Phase | Work | Closes |
| --- | --- | --- |
| **P0** | Clear the 6 launch blockers (unchanged priority) | — |
| **P1** | Add `VANTA Master Agent` policy row | F9 |
| **P1** | Wire `evaluateAgentRequest` into `/run-agent` | F4 |
| **P1** | Make `MODULE_TO_SYSTEM_AGENT` total; drop the default | F5 |
| **P2** | Migration `0018_mission_execution_hierarchy.sql` | F6 |
| **P2** | `agentSubAgents.ts` registry + R1/R2 assertions | F2, F3 |
| **P2** | Materialise sub-agents → `BoundedWorkflowGraph` | F7 |
| **P3** | VANTA emits `DispatchPlan`; UI shows plan → agent → sub-agents | F1 |
| **P3** | Approval gate at the write-plane node | R4 |
| **P4** | Live connector plane behind health checks | F8 |

---

## 10. Cross-References

| Concern | Source of truth |
| --- | --- |
| Layer architecture | `docs/SYSTEM_ARCHITECTURE.md` |
| Gap evidence | `docs/ARCHITECTURE_GAP_ANALYSIS.md` |
| Fast bounded decisions (Laya) | `docs/LAYA_DECISION_ENGINE.md` |
| Vault policies | `src/lib/agentPolicies.ts` |
| Persona→agent routing | `src/lib/agentResolution.ts` |
| DAG engine | `src/lib/boundedWorkflowGraph.ts` |
| Decision engine | `src/lib/decisionEngine.ts` |
| Ledger | `backend/database/migrations/0017_execution_ledger.sql` |
| Vanta runtime | `src/lib/vantaServer.ts`, `src/lib/vanta.ts` |
| Domain language | `CONTEXT.md`, `.clinerules` |
