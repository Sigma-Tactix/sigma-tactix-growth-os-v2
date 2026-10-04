# SigmaTactix Growth OS — Recommended System Architecture

> **Status**: Proposed target architecture (design deliverable, not an implementation record)
> **Authored**: 2026-10-02
> **Scope**: Whole platform — runtime, agent hierarchy, sub-agents, MCP connectors, governance
> **Status of code**: Implementation exists partially; gaps are called out explicitly in §10.

This document is the architectural counterpart to the product narrative in
`artifacts/video/sigma-growth-os-film/creative-brief.md` and the strategic
direction in `MASTER_CONTEXT.md`. It translates *"from scattered signals to
coordinated growth"* into concrete layers, contracts, and boundaries.

It does **not** supersede `.clinerules`, `CONTEXT.md`, or `docs/adr/`. Where
those carry a hard invariant, this document defers to them.

---

## 1. Narrative → Architecture Mapping

The product film and the README describe five movements. Each becomes a
structural layer. This is deliberate: the architecture is the argument.

| # | Narrative claim (verbatim) | Architectural layer | Primary guarantee |
| --- | --- | --- | --- |
| 1 | "one governed operating layer" | **L1 Command Layer** | Single write path; every mutation is ledgered |
| 2 | "strategy · intelligence · execution" | **L2 Second Brain (10 Vaults)** | RLS isolation; Secret Vault never agent-readable |
| 3 | "specialized agents. human approval." | **L3 Agent Swarm** | Vault-scoped RBAC + mandatory HITL gates |
| 4 | "connect every growth workflow" | **L4 Connector Mesh (MCP)** | Read/write split; encrypted credentials |
| 5 | "see what is active. know what is next." | **L5 VANTA Living Core** | Legibility, provenance, no fabricated state |

The connective tissue that makes the five layers one system rather than five
features is the **Execution Ledger** (L0), which sits *beneath* all of them.

```text
                    ┌──────────────────────────────────────┐
                    │      L5  VANTA Living Core          │  legibility / provenance
                    │  state engine · priority · narration │
                    └───────────────┬──────────────────────┘
   ┌────────────┐   ┌──────────────┴──────────────┐   ┌──────────────┐
   │ L3 Swarm   │──▶│        L1 Command Layer      │◀──│  L1b HITL    │
   │ 7 agents + │   │  orchestrator · policy · task │   │ Approval Desk│
   │ sub-agents │   │  contracts · DAG validation   │   │              │
   └─────┬──────┘   └──────────────┬───────────────┘   └──────────────┘
         │ reads                   │ writes                     ▲
         ▼                         ▼                            │ gate
   ┌──────────────┐        ┌───────────────────────────────────┴──┐
   │  L2 Second   │        │            L0  EXECUTION LEDGER      │
   │  Brain       │        │  runs · events · approvals ·         │
   │  10 Vaults   │        │  node-attempts · artifacts · delivery │
   │  + pgvector  │        │  (migration 0017, RLS, append-only)   │
   └──────┬───────┘        └──────────────────┬───────────────────┘
          │ RAG / grants                      │ evidence
          ▼                                   ▼
   ┌────────────────────────────────────────────────────────────┐
   │            L4  CONNECTOR MESH  (MCP + native SDKs)          │
   │  read plane  ────────────────────────────────────────────   │
   │  write plane (HITL-gated)  ──────────────────────────────   │
   └────────────────────────────────────────────────────────────┘
```

**Reading rule for the diagrams:** data flows *up* through L4 → L2 → L3 → L5.
Authority flows *down* through L1 (policy) and L0 (the only write path).
An agent never writes to a connector without an approval token minted at L1.

---

## 2. L0 — Execution Ledger (the spine)

The single most important architectural decision is that **there is exactly one
write path for anything an agent does**, and it is already built
(`backend/database/migrations/0017_execution_ledger.sql`, applied 2026-10-02).

### 2.1 Why this is foundational

Without it, every other guarantee is decorative. Three failure modes it
eliminates, all of which this codebase has already suffered:

1. **Fabricated success** — a `setTimeout` chain that reports "PostgreSQL
   transaction committed" when nothing was written. Fixed by Phase 0, and
   structurally prevented by making the ledger the *only* path that can emit a
   verified success.
2. **Silent partial failure** — a 5-node pipeline where nodes 1–4 succeed and
   node 5 times out, and the UI shows green. `node_attempts` makes each hop
   individually queryable.
3. **Unreplayable execution** — you cannot answer "why did this campaign get
   paused?". An append-only event log with a monotonic sequence answers it.

### 2.2 Ledger contract

| Table | Purpose | Invariant |
| --- | --- | --- |
| `execution_runs` | One run per logical task | `idempotency_key = agent-task:<taskId>`; re-sync is a **no-op**, never a duplicate |
| `execution_events` | One event per legal state hop | Monotonic sequence trigger rejects duplicates (`P0001`) |
| `execution_approvals` | HITL decisions | Approval must exist *before* any write-plane artifact |
| `execution_node_attempts` | Per-DAG-node outcome | Partial failure is representable, not hidden |
| `execution_artifacts` | Produced outputs (briefs, creatives, reports) | Referenced by downstream runs |
| `execution_delivery_attempts` | External send/publish | Retries are attempts, not new runs |

Enforced today: RLS on all six tables via `is_member()`, `anon` revoked at the
privilege layer (`42501`), `service_role` retained, `status` CHECK constraint.

**Rule:** no module may report a success that has no corresponding
`execution_events` row. This is testable and should become a CI assertion
alongside `auditClaimEvidence.ts`.
alongside `auditClaimEvidence.ts`.

---

## 3. L1 — Command Layer (Orchestrator + Policy)

### 3.1 Two orchestrators, deliberately separated

The codebase already contains two "orchestrators" that must not be confused:

| Orchestrator | Scope | State | Backing |
| --- | --- | --- | --- |
| **`sigmatactix-orchestrator`** (`.agents/agentic.json`) | *Development* — how this repo is built | Repo files, `feature_list.json`, `.agents/**` | Subagents edit with `edit:` allow/deny maps |
| **Growth OS Command Layer** (to be built) | *Runtime* — how client growth work is executed | Client Enclave data, ledger rows | `server.ts` routes + `agentPolicies.ts` |

Conflating them would let a coding agent's write permissions leak into a
production client Enclave. They share *vocabulary*, never *credentials*.

### 3.2 Runtime Command Layer responsibilities

1. **Intent classification** — route an incoming request to one agent, a
   pipeline, or a supervisor session (§6).
2. **Policy evaluation** — call `evaluateAgentRequest()` *before* dispatch.
   An out-of-scope vault request is rejected at L1, not discovered mid-run.
3. **DAG validation** — every multi-agent plan must be a
   `boundedWorkflowGraph`, statically checked for cycles, depth bounds, and
   budget before execution begins.
4. **HITL gating** — classify each planned node as `autonomous` or
   `approval-required`. Write-plane nodes are always approval-required (§5).
5. **Ledger emission** — open a run, emit events on every hop, close it.
6. **Budget accounting** — token spend against `0014_token_metering.sql`, with
   model resolution via `tokenCostEngine.ts` (longest-key-first matching).

### 3.3 Deep-module seams

Keep the interface small; hide complexity (`.clinerules` rule 8). The Command
Layer should expose **four** operations and nothing else:

```text
dispatch(intent, context)      -> runId            // route, policy, plan
await run(runId)               -> LedgerState      // poll or subscribe
approve(runId, nodeId, actor)  -> void             // HITL decision
explain(runId)                 -> DecisionTrace    // 0016, provenance
```

Everything else — vault resolution, model selection, connector invocation,
evidence assembly — is internal. Route decomposition (`docs/adr/0001`) is the
in-flight mechanism for getting there; the monolith is the current blocker.

---

## 4. L2 — Second Brain: the 10 Vaults

The vault model is sound and should be preserved exactly. Two things are
load-bearing beyond RLS:

1. **The two-namespace hazard.** `agentPolicies.ts` documents that display
   names (`"Brand Vault"`) and `documents.vault_id` keys (`"brand"`) are two
   *different* namespaces. Getting this wrong does not fail loudly — it returns
   zero rows and looks like "RAG is broken". The explicit
   `VAULT_NAME_TO_DOCUMENT_IDS` map plus a type-exhaustive record is the right
   defence. **Any new vault must extend the map or fail the build.**
2. **Default-deny.** `getAgentPolicy()` falls back to `{allowed: [], blocked: []}`
   for an unknown agent name. An agent type that is registered in the UI but
   missing from `AGENT_VAULT_POLICIES` is silently inert. Recommend a startup
   assertion that every `agent_type_enum` value has a policy row.

### 4.1 Vault capability matrix (current, authoritative)

| Vault | Agents allowed | Agents blocked | Notes |
| --- | --- | --- | --- |
| **Executive** | *no agent* (Owner only) | all | IP, financials, cap table |
| **Credentials** | *no agent* (system only) | all | AES-256-GCM via `credentialCrypto.ts` |
| **Brand** | Marketing, SDR, Authority, CS, Audit, Creative | — | |
| **Customer** | Marketing, SDR, CS, Creative | Authority, Audit, Ops | ICP, personas, win-loss |
| **Marketing** | Marketing, CS, Audit | SDR, Authority, Ops | incl. `performance` docs |
| **Website** | Audit | SDR, Authority, Marketing | |
| **Authority** | Marketing, Authority, Audit | SDR, Creative | keywords, citations |
| **Operations** | Ops | Marketing, SDR, CS, Audit | SOPs, org chart |
| **AI Workflow** | **all 7 agents** | — | prompts, routers, DAGs |
| **Audit** | Audit | — | findings + `competitor` docs |

`ALWAYS_BLOCKED = ["Executive Vault", "Credentials Vault"]` is applied
*after* explicit policy, so no policy edit can accidentally re-open them.
Preserve that ordering.

### 4.2 Retrieval architecture

- **pgvector** embeddings, scoped retrieval via `match_documents_scoped()`
  (migration `0013`) — scoping is applied in SQL, not in the client.
- `general` (unclassified uploads) is readable by any agent with ≥1 authorized
  vault. This is a deliberate usability/security tradeoff, documented in the
  source. Preserve it, and keep the warning that nothing sensitive may be filed
  as `general`.
- **Retrieval is evidence.** Every retrieved chunk that feeds a claim must be
  able to produce an `evidenceContract` entry with a provenance banner.
  This is what makes AEO citation claims defensible rather than decorative.

---

## 5. L3 — Agent Swarm: System Agents & Sub-Agents

### 5.1 Design principle

**Seven system agents, not seventy.** The `backend/agent-skills/` directory holds
~150 agent personas. Treat them as *prompt material* addressable by a skill
selector, not as independently-scheduled actors. Ten concurrently-running
agents with overlapping vault grants is how a governance story becomes
unfalsifiable.

The 7 agents below are the ones with real `agent_type_enum` values in
`init.sql`, real rows in `AGENT_VAULT_POLICIES`, and real UI wiring. They are
the swarm.

### 5.2 The seven system agents

| # | Agent | Mission | Vaults | Write plane | HITL |
| --- | --- | --- | --- | --- | --- |
| **A1** | **Audit Diagnostic Agent** | Site + funnel diagnosis, scored findings | Website, Marketing, Authority, Audit, AI Workflow | none | optional |
| **A2** | **Marketing Agent** | Channel strategy, campaign briefs, creative direction | Brand, Customer, Marketing, Authority, AI Workflow | draft only | **required** |
| **A3** | **SEO & Authority Agent** | Keywords, backlinks, topical graph, AEO citation | Brand, Authority, AI Workflow | draft only | **required** |
| **A4** | **Creative Director Agent** | Brand-faithful asset specs, variants | Brand, Customer, AI Workflow | draft only | **required** |
| **A5** | **AI SDR (Sales Agent)** | Lead qualification, outreach drafts, pipeline hygiene | Brand, Customer, AI Workflow | **none — never sends** | **required** |
| **A6** | **Customer Success Agent** | Health signals, renewal risk, churn save plays | Brand, Customer, Marketing, AI Workflow | draft only | **required** |
| **A7** | **Operations Agent** | SOPs, workflow templates, org/process | Operations, AI Workflow | template only | **required** |

Two structural observations:

- **A1 is the only agent that can read Website Vault**, and it is the only agent
  that produces `Audit Vault` findings. That makes it the natural *entry point*
  for every diagnostic pipeline — it is the system's sensor layer.
- **A5 cannot send.** It has no connector write grant. Outreach is a proposal
  until a human sends it. This is the strongest available trust signal to a
  prospective client and should be stated plainly in sales material rather than
  buried in a security doc.

### 5.3 Sub-agent hierarchy

Sub-agents are **scoped, ephemeral workers** spawned by a system agent for one
bounded sub-goal. They are not long-lived personas. Each inherits its parent's
vault grants *minus* Executive and Credentials, and may hold a **narrower**
grant than the parent.

```text
                       ┌──────────────────────────────┐
                       │   L1 COMMAND LAYER           │
                       │  dispatch / policy / DAG     │
                       └──────────────┬───────────────┘
                                      │ spawns (bounded, budgeted)
        ┌─────────────────────────────┴──────────────────────────────┐
        │                                                            │
   ┌────▼─────┐  ┌───────▼──────┐  ┌────▼──────┐  ┌──────────────┐  │
   │ A1 Audit │  │ A2 Marketing │  │ A3 SEO &  │  │ A4 Creative  │  │
   │ Diagnostic│  │              │  │ Authority │  │  Director    │  │
   └────┬─────┘  └───────┬──────┘  └────┬──────┘  └──────┬───────┘  │
        │                │              │               │          │
   ┌────┴────┐      ┌────┴────┐    ┌────┴────┐     ┌────┴────┐     │
   │scraper  │      │query    │    │keyword  │     │prompt-  │     │
   │sub-agent│      │intent   │    │graph    │     │engine   │     │
   │(no write)│     │sub-agent│    │sub-agent│     │sub-agent│     │
   │evidence │      │(read)   │    │(read)   │     │(read)   │     │
   │contract │      └─────────┘    └─────────┘     └─────────┘     │
   └─────────┘                                                   │
                                                                │
   ┌────▼─────┐  ┌───────▼──────┐  ┌──────────────┐  ┌────────▼─────┐ │
   │ A5 AI SDR│  │ A6 Customer  │  │ A7 Operations│  │ VANTA        │ │
   │ NEVER    │  │  Success     │  │              │  │ Read-only    │ │
   │ SENDS    │  └──────────────┘  └──────────────┘  │ projection   │ │
   └──────────┘                                      └──────────────┘ │
```

### 5.4 Sub-agent catalogue (recommended, minimal set)

Spawn a sub-agent only when the parent needs *parallel* work over a *bounded*
input set. Otherwise call a skill.

| Sub-agent | Parent | Input contract | Output contract | Guard |
| --- | --- | --- | --- | --- |
| `evidence-collector` | A1 | list of target URLs (SSRF-checked) | `evidenceContract[]` w/ provenance | `assertPublicHost()`; no writes |
| `query-intent` | A3 | raw keyword head term | scored intent clusters | read-only |
| `citation-gap` | A3 | SERP/AEO snapshot | gap list, ranked by effort | read-only |
| `creative-variant` | A4 | approved brief | N asset specs (no pixels) | Brand Vault read |
| `lead-qualifier` | A5 | lead record | ICP score + rationale | **no connector writes, ever** |
| `pipeline-analyst` | A6/A7 | deal/renewal history | risk + save-play proposal | Customer/Marketing read |
| `report-assembler` | any | ledger + evidence | PDF/PPTX/XLSX artifact | writes to `execution_artifacts` only |

**Sub-agent rules (non-negotiable):**

1. Inherit parent's grants, subtract Secret Vaults, never widen.
2. Bounded scope: explicit input set, explicit output set, explicit budget cap.
3. No sub-agent opens its own run — it emits a `node_attempt` on the parent's run.
   This keeps `execution_runs` meaningful as a *task* log rather than a call log.
4. No sub-agent may emit a user-visible claim without an `evidenceContract`
   reference or an explicit `simulated: true` flag.

### 5.5 Swarm ↔ Harness subagent distinction

Three agent concepts share the word "agent" in this repo. Keep them separate in
code, naming, and docs:

| Concept | Lives in | Governed by | Vault access |
| --- | --- | --- | --- |
| **Growth system agents (A1–A7)** | `init.sql` `agent_type_enum`, `agentPolicies.ts` | RLS + RBAC + HITL | Scoped per agent |
| **Harness dev subagents** (`code-architect`, `quality-engineer`, `agent-trainer`, `delivery-lead`) | `.agents/agentic.json`, `.agents/subagents/` | `edit:` allow/deny maps | **none** — they touch the repo, not client data |
| **Persona library** (~150 in `backend/agent-skills/`) | prompt files | none at runtime | none unless promoted to A1–A7 |

The last group is a content library. Promoting a persona to a runtime agent is a
security decision requiring a vault policy row, not a configuration change.

---

## 6. L4 — Connector Mesh (MCP)

### 6.1 The read/write split is the architecture

The single most important connector decision, already validated in
`docs/research/saved-github-repos-integration-assessment.md` (the AdPilot
"read-MCP / write-SDK" split):

- **Read plane** — MCP servers. Metrics, crawls, keyword data, competitor
  monitoring. Fast to add, safe to fan out, no approval needed.
- **Write plane** — native SDKs behind an approval gate. Publishing, sending,
  bidding, CRM mutation. Slow to add, correctly slow.

Most teams get this backwards and end up with an LLM able to spend money.
Refuse that. Every write-plane call requires an `execution_approvals` row
minted by a human, and a write made without one is a bug, not a config state.

### 6.2 Recommended MCP catalog

Categorised by plane and trust level. **Tier 1 = build now**, Tier 2 = next,
Tier 3 = evaluate.

#### Tier 1 — Foundation (build now)

| Server | Plane | Serves | Notes |
| --- | --- | --- | --- |
| **Filesystem** | read/write | Vault document staging | Reference server; scope to a per-run temp dir, never the repo root |
| **Memory** | read/write | Cross-run agent recall | Reference server; namespace per Client Enclave |
| **Sequential Thinking** | read | Complex multi-step reasoning | Reference server; useful for A1 diagnostics |
| **Fetch** | read | Web content acquisition | Reference server; **must** sit behind `assertPublicHost()` |
| **Supabase (internal)** | read | Vault tables + pgvector RAG | Build in-repo; scoped JWTs only, never service-role from agents |
| **Postgres (internal)** | read | Analytical rollups, reporting | Read-replica role; no writes |

#### Tier 2 — Channel data (build next)

| Server | Plane | Serves |
| --- | --- | --- |
| **Google Ads MCP** | read (already shipped, read-only) | A2 paid media |
| **Meta Ads API** | read | A2 competitive + performance |
| **GA4** | read | A1 funnel, A6 health |
| **Google Search Console** | read | A3 indexation |
| **HubSpot** | read | A5 pipeline (read until a human sends) |
| **Firecrawl / scrape** | read | A1, competitor monitoring — SSRF-guarded |
| **Ahrefs** | read | A3 backlinks |

#### Tier 3 — Evaluate before adopting

| Server | Why defer |
| --- | --- |
| **GitHub / GitLab** | Dev-plane, not client-growth. Belongs to the Harness, not Growth OS |
| **Slack / Notion** | Useful, but only after the ledger and HITL are proven end-to-end |
| **n8n MCP** | Adopt n8n as an *execution sidecar* per the repo assessment; don't put its runtime inside the command layer |
| **Google Drive / Gmail** | Archived reference servers; prefer official vendor servers |

> **Provenance note.** The official `modelcontextprotocol/servers` repo now
> maintains only a small set of *reference implementations* (Everything, Fetch,
> Filesystem, Git, Memory, Sequential Thinking, Time). GitHub, GitLab, Google
> Drive, Slack, Brave Search and others moved to `servers-archived`; prefer
> official vendor-maintained servers or the MCP Registry. The reference servers
> are explicitly **not production-ready** — each needs its own threat model
> before it touches client data.

### 6.3 Connector governance

- Credentials: AES-256-GCM, per-connector key, `credentialCrypto.ts`. Never a
  raw key in a DB row, never in `demoWorkspace.ts`.
- OAuth refresh happens in a **credential broker**, never in an agent's context.
- Rate limiting is two-tier already (`.clinerules` security table); write-plane
  routes need a stricter tier than read-plane.
- Every connector declares: `plane` (read/write), `requiresApproval` (bool),
  `dataClassification` (which vault its output may be filed under).
- `VITE_SEED_DEMO_WORKSPACE` gates all fixture data — a fresh tenant must render
  zero fabricated rows, including connector rows.

---

## 7. Orchestration Patterns (composable, not monolithic)

The system should not pick one multi-agent pattern. Use the cheapest one that
fits each request, and compose.

| Pattern | Use for | Failure posture |
| --- | --- | --- |
| **Router** (LLM classify → one agent) | ~80% of requests: single-domain tasks | If classification is low-confidence, escalate to Supervisor |
| **Sequential pipeline** | Fixed ordering: Audit → Strategy → Creative → Approval | Strictly ordered; each node's output is the next node's input |
| **Parallel fan-out** | Independent research: keyword gaps + competitor scan + site health | Per-node error recovery; partial results are legitimate |
| **Supervisor** | Multi-domain requests needing a decision owner | Central authority; aggregation is its job |
| **Event-driven** | Side effects: delivery, notifications, audit logging | Loosely coupled; the ledger is the bus of record |
| **Hierarchical** | >15 agents | **Not yet.** Revisit when A1–A7 saturate |

**Recommendation:** Ship Router + Pipeline + Fan-out first. They cover the
realistic workload and have the best debuggability. Add Supervisor only when a
concrete request class needs a decision owner. Do **not** build a free-form
swarm — with 7 agents and overlapping vaults it produces unreproducible runs
and makes the HITL story unenforceable.

The one pattern that is already correct here is **event-driven**: `execution_events`
is the append-only log every other layer reads to reconstruct what happened.

### 7.1 Failure and observability requirements

Every orchestration path must satisfy, or it does not ship:

1. **Timeout per node**, with a recorded `node_attempt` outcome. No silent hangs.
2. **Budget cap per run**; exceeding it stops the run and emits an event.
3. **Deterministic re-run**: same inputs + same DAG → same run id via
   `idempotency_key`; a re-sync is a no-op.
4. **Provenance for every claim** (`DecisionTrace`, migration `0016`).
5. **No fabricated telemetry**: `agentTelemetry.ts` must keep reporting `N/A`
   rather than a fake success rate or `0ms` latency. This is a product promise.

---

## 8. L5 — VANTA Living Core

VANTA is the read-only projection layer. It has **no write grants**. Its job is
the narrative promise: *"see what is active, know what is next."*

| Capability | Reads from | Never does |
| --- | --- | --- |
| State engine (what is active) | `execution_runs` + `execution_events` | Invent a run that isn't in the ledger |
| Priority ranking (what needs attention) | pending `execution_approvals`, failed nodes | Auto-approve |
| Narration (what should happen next) | DecisionTrace + next DAG node | Execute the next step itself |
| Vault topology visualisation | `documents.vault_id` counts | Read Executive/Credentials contents |

VANTA is derived state. If it cannot be recomputed from the ledger, vaults, and
decision traces, it is wrong and must be rebuilt rather than patched. That
constraint is what keeps the Living System honest.

---

## 9. Delivery Roadmap (sequenced against the 6 P0 blockers)

Non-spine feature work stays frozen until the P0 blockers in `MASTER_CONTEXT.md`
clear. This architecture follows that ordering.

| Phase | Work | Unblocks |
| --- | --- | --- |
| **P0 (now)** | Clean `npm run check`; 2-workspace tenant isolation; auth inventory; Stripe threat tests; secret scan; licensing verification | Everything |
| **P1** | Wire `evaluateAgentRequest()` into the run-agent route at L1 | Agent RBAC becomes real |
| **P1** | Split `server.ts` into domain routers (`docs/adr/0001`) | L1 seams become enforceable |
| **P1** | Ship Foundation MCP tier (Filesystem, Memory, Fetch, Supabase, Postgres) | L4 read plane |
| **P2** | `execution_events` completeness assertion in CI | No unbacked success claims |
| **P2** | Startup assertion: every `agent_type_enum` value has a vault policy | No silently-inert agents |
| **P2** | Write-plane approval gate + credential broker | Safe first write connector |
| **P3** | Sub-agent spawn framework (bounded, budgeted, node_attempt) | A1 parallel diagnostics |
| **P3** | VANTA projection rebuild from ledger | Living System integrity |
| **P4** | Supervisor pattern, only if measured need | — |

---

## 10. Known Gaps (design vs. current state)

Honest inventory — this doc is a target, not a claim of completion.

| Design element | Current state | Action |
| --- | --- | --- |
| L1 Command Layer as a module | Does not exist; logic lives in the 336k-char `server.ts` | P1 route decomposition |
| RBAC enforcement at dispatch | `agentPolicies.ts` written but the wiring into `/run-agent` is a TODO in the source comments | P1 |
| Write-plane approval enforcement | `execution_approvals` table exists; enforcement not universal | P2 |
| Foundation MCP tier | `.mcp.json` has only `threejsresources`; the ~28 servers in `demoWorkspace.ts` are **demo fixtures**, not live connectors | P1 |
| Sub-agent runtime | Harness subagents exist for dev; no runtime sub-agent spawn for A1–A7 | P3 |
| Supervisor pattern | Absent by design | P4 |
| Agent policy completeness | 3 of the 7 `agent_type_enum` names were historically missing (now fixed) | add P2 assertion |
| `VP8` license status | P0 licensing verification open | P0 |

The `demoWorkspace.ts` MCP list is the highest-risk item in this document: it
reads like a live capability inventory and is in fact fixture data. It must
never be presented to a client as connected capability.

---

## 11. Cross-References

| Concern | Source of truth |
| --- | --- |
| Domain language, invariants | `CONTEXT.md`, `.clinerules` |
| Current system state, blockers | `MASTER_CONTEXT.md` |
| Route decomposition decision | `docs/adr/0001-modular-route-decomposition.md` |
| Repo/license vetting | `docs/research/saved-github-repos-integration-assessment.md` |
| Product narrative | `artifacts/video/sigma-growth-os-film/creative-brief.md` |
| Dev subagent permissions | `.agents/agentic.json` |
| Vault RBAC | `src/lib/agentPolicies.ts` |
| Ledger schema | `backend/database/migrations/0017_execution_ledger.sql` |
| Security controls | `SECURITY.md`, `.clinerules` §3 |

**Verification command before trusting this document's claims about the code:**
`npm run lint && npm run test`
