# TinyFish + MiroFish + Laya Integration Plan

**Status:** Phase 1 started (Laya foundation in progress; TinyFish and MiroFish not yet integrated)  
**Decision owner:** Sigma Tactix  
**Planning date:** 2026-09-25  
**Scope:** Add live web intelligence through TinyFish, evidence-grounded market scenario simulation through MiroFish, and locally operated System 1 decision routing through Laya without weakening tenant isolation, capability truthfulness, or human approval controls.

## 1. Product decision

Add both products, but at different seams:

```text
Public web
   |
   v
TinyFish adapter -> evidence snapshots -> Laya relevance/routing -> Sigma analysis/diffs
                                                              |
                                                              v
                                                   approved evidence pack
                                                              |
                                                              v
                                                   MiroFish adapter
                                                              |
                                                              v
                                              scenario report + assumptions
                                                              |
                                                              v
                                          Laya decision routing
                                                              |
                                                              v
                              orchestrator/HITL -> module workflow -> outcome
```

- **TinyFish is the web-intelligence provider.** It discovers and retrieves public sources and runs explicitly approved multi-step browser jobs.
- **Sigma remains the system of record and decision layer.** It owns tenant identity, evidence provenance, snapshots, diffs, analysis, approvals, costs, audit events, and experiments.
- **MiroFish is an isolated scenario-simulation provider.** It receives a bounded evidence pack and question, then returns an exploratory report and simulation artifacts.
- **Laya is the local System 1 decision provider.** It performs bounded typed choices, ordinal scores, and yes/no probability decisions for routing, prioritization, escalation, and orchestrator next-step selection.
- **Neither provider writes directly to a Sigma vault or executes a campaign.** Sigma validates and persists provider results. Any action remains behind existing RBAC and HITL workflows.

The first end-to-end vertical slice should be:

> Track a competitor pricing or positioning page with TinyFish, show a sourced change diff, assemble an evidence pack, run a bounded MiroFish buyer-response scenario, and convert approved findings into draft experiments.

## 2. Evidence behind the plan

### Current Sigma state

- Sigma already has authenticated, entitlement-gated competitor CRUD and scan routes in `server.ts`, backed by the tenant-scoped `competitors` table.
- `CompetitorResearchPage.tsx` does not use those routes. It currently uses seed records, timers, and fixed success metrics such as ad counts and spend estimates.
- The existing `AgentSimulationMode.tsx` simulates agent-routing presets and operational constraints. It is not a market, buyer, or public-opinion simulator.
- The `simulation` entitlement already exists for Growth and Enterprise tiers.
- `server.ts` is already being decomposed into domain routers. New integrations should not add another large route block to the root file.

### TinyFish state checked for this plan

- The TinyFish Cookbook is MIT-licensed example code.
- TinyFish exposes Search, Fetch, Agent, Browser, MCP, CLI, and TypeScript/Python SDK paths.
- Search and Fetch are described as free; Agent and Browser are metered. Pricing and quotas must still be read from live provider responses/configuration, not hard-coded into Sigma.
- The TypeScript SDK supports queued agent runs, run-status polling, Search, Fetch, and streaming Agent runs.

### MiroFish state checked for this plan

- MiroFish is AGPL-3.0 and should pass a legal/licensing review before production use in a proprietary hosted product.
- Its backend requires Python 3.11-3.12, an OpenAI-compatible LLM provider, and Zep Cloud.
- Its workflow is asynchronous: create project/ontology, build graph, create and prepare simulation, start/observe/stop it, then generate and retrieve a report.
- The current backend persists projects, simulations, uploads, and reports to its local filesystem.
- The current Flask application exposes permissive `Access-Control-Allow-Origin: *` behavior and no tenant authentication layer in its application factory.
- The default upload limit is 50 MB and the default simulation is 10 rounds, while the repository warns that simulations can consume substantial model capacity.

### Laya and legacy decision state checked for this plan

- The likely target is `NandhaKishorM/laya`, an Apache-2.0 open-weights System 1 decision engine supporting typed `choice`, ordinal `score`, and yes/no `noul` decisions. Confirm this repository before implementation.
- `@receptron/laya` provides a compatible Node/TypeScript ONNX runtime under MIT. Its documented default bundle is about 1.7 GB and needs roughly 2 GB of loaded-model RAM; options and state lengths are bounded.
- The official Laya runtime supports local Python/HTTP/MCP deployments, multilingual checkpoints, batching, hooks, and model routing.
- Laya's documentation explicitly says shipped checkpoints can be over-confident and that confidence thresholds must be fitted and validated on held-out domain data. Confidence orders decisions; it does not prove correctness.
- The legacy adapter handled action-risk classification, module routing, and swarm-safety classification. The Dashboard Action Queue contained provider-specific names and client-side heuristic fallbacks.
- The legacy `/api/workspace/decision/status` reported `gemini_flash_fallback` when the provider was unconfigured, but the inspected implementation actually fell back to deterministic heuristics; that status required correction during migration.
- Legacy tests validated heuristic and mocked-provider paths only. They did not establish production Laya accuracy, calibration, latency, or safety.

## 3. Module design

### 3.1 Web Intelligence module

Place one deep interface in `src/server/providers/webIntelligence/`:

```ts
interface WebIntelligenceProvider {
  capabilities(): Promise<WebIntelligenceCapabilities>;
  search(input: SearchRequest): Promise<SearchEvidence[]>;
  fetch(input: FetchRequest): Promise<PageEvidence[]>;
  startAgentRun(input: AgentRunRequest): Promise<ProviderRunRef>;
  getRun(ref: ProviderRunRef): Promise<ProviderRunState>;
  cancelRun?(ref: ProviderRunRef): Promise<void>;
}
```

Adapters:

- `TinyFishWebIntelligenceAdapter`: the production provider.
- `FixtureWebIntelligenceAdapter`: deterministic tests and local UI development.

The interface must hide provider event names and payload shapes. Callers receive Sigma-owned normalized evidence records with source URL, final URL, retrieval time, content hash, title, extracted content, provider, method, latency, and error/provenance fields.

Use Search and Fetch for the default path. Require an explicit job type and cost acknowledgement before escalating to metered Agent or Browser work.

### 3.2 Market Scenario module

Place a separate deep interface in `src/server/providers/marketSimulation/`:

```ts
interface MarketSimulationProvider {
  capabilities(): Promise<MarketSimulationCapabilities>;
  create(input: ScenarioEvidencePack): Promise<SimulationRef>;
  prepare(ref: SimulationRef): Promise<SimulationState>;
  start(ref: SimulationRef, limits: SimulationLimits): Promise<SimulationState>;
  getStatus(ref: SimulationRef): Promise<SimulationState>;
  stop(ref: SimulationRef): Promise<SimulationState>;
  generateReport(ref: SimulationRef): Promise<ReportRef>;
  getReport(ref: ReportRef): Promise<ScenarioReport>;
}
```

Adapters:

- `MiroFishMarketSimulationAdapter`: calls an internal, isolated MiroFish deployment.
- `FixtureMarketSimulationAdapter`: deterministic lifecycle and failure tests.

Do not expose MiroFish project, graph, report-agent, or OASIS details to React callers. The Sigma interface owns lifecycle normalization, tenant mapping, timeouts, cancellation, cost limits, and error classification.

### 3.3 Decision module

Replace the provider-specific legacy module with one Sigma-owned interface in `src/server/providers/decision/`:

```ts
type DecisionQuestion =
  | { type: "choice"; instruction: string; options: Record<string, string> }
  | { type: "score"; instruction: string; rubric: string[] }
  | { type: "boolean"; instruction: string };

interface DecisionProvider {
  capabilities(): Promise<DecisionCapabilities>;
  decide(input: DecisionRequest): Promise<DecisionResult>;
  decideBatch(input: BatchDecisionRequest): Promise<DecisionResult[]>;
}
```

Adapters:

- `LayaHttpDecisionAdapter`: recommended production adapter to a private, pinned official Laya runtime. One warmed runtime can serve multiple Sigma application replicas without loading multi-gigabyte weights in every Node process.
- `LayaOnnxDecisionAdapter`: optional Node/TypeScript adapter for a single-instance spike, development, or deployments where the measured memory and event-loop behavior are acceptable.
- `DeterministicPolicyDecisionAdapter`: fail-closed rules for hard safety and degraded operation.
- `LegacyDecisionAdapter`: temporary shadow-comparison and rollback adapter only; remove after the acceptance gate.

The external interface stays provider-neutral. Laya-specific model names, checkpoints, token limits, transport, and answer shapes remain inside its adapter.

The decision module returns:

- selected value or ordinal score
- complete option distribution
- raw model confidence
- calibrated Sigma confidence, calibration version, and coverage band
- provider/checkpoint/version
- input and question-set hashes
- latency and runtime/device metadata
- policy override, escalation, or fallback reason

Laya informs bounded decisions; it never owns authorization. RBAC, tenant isolation, connector verification, budget ceilings, publication permissions, destructive-action blocks, and mandatory HITL rules remain deterministic Sigma policy.

### 3.4 Why there are three modules

The three providers have different responsibilities, data risks, resource behavior, and failure modes. A single generic “AI provider” interface would be shallow and would leak provider-specific configuration to every caller. Separate web-intelligence, market-simulation, and decision modules keep a small interface at each real seam and concentrate changes in one adapter.

## 4. Deployment and security shape

### TinyFish

- Call TinyFish only from the Sigma server; never expose `TINYFISH_API_KEY` to React.
- Prefer a workspace-specific encrypted credential entry if customers bring their own keys; otherwise use a server-owned Sigma credential with per-workspace quotas.
- Apply URL validation, DNS/private-network blocking, redirect revalidation, response-size caps, timeouts, retry limits, and content-type validation before any fetch/agent job.
- Store evidence, not provider secrets or unrestricted browser session artifacts.

### MiroFish

- Run MiroFish as a separate private service/container, not as copied Python inside Sigma and not as a public browser-facing application.
- Put a Sigma-controlled gateway in front of it with service authentication, workspace-to-provider ID mapping, strict allowlisted routes, request-size limits, concurrency caps, and audit logging.
- Disable wildcard CORS at deployment and deny direct tenant access to MiroFish.
- Use isolated storage per environment. Do not assume MiroFish's local filesystem is tenant-safe, durable, encrypted, or horizontally scalable.
- Use a dedicated Zep account/project for the integration until deletion semantics and cross-tenant isolation are verified.
- Forward only an approved evidence pack. Exclude credentials, executive-vault data, personal data, sales-call transcripts, and customer records unless a later data-governance decision explicitly permits them.
- Pin an audited MiroFish commit or image digest. Upgrades require contract and security regression tests.

### Laya

- Self-host Laya inside Sigma's private infrastructure. It requires no external decision request or per-call provider charge, but it still has compute, memory, storage, deployment, monitoring, and maintenance costs.
- Pin the Laya package, checkpoint revision, tokenizer, runtime image, and calibration artifact. Never follow a moving `main` or model revision in production.
- Warm the runtime before advertising it as available. Report `unconfigured`, `loading`, `ready_unvalidated`, `shadow`, `calibrated`, `degraded`, or `failed` separately.
- Redact or minimize state before inference even though it is local. Record hashes and decision metadata; do not indiscriminately log raw customer or vault content.
- Bound state length and option count before the adapter is called. Reject or summarize oversized state deliberately rather than accepting silent truncation.
- Run inference outside the main Express event loop when using the ONNX adapter. A private HTTP runtime is recommended for production isolation and scaling.
- Keep a deterministic policy adapter available for outage and hard-rule enforcement. A slower LLM may explain or research an ambiguous case, but it must not be mislabeled as Laya.

### Licensing gate

Before a production deployment, obtain a written licensing decision covering AGPL network-use obligations, source-offer requirements for any MiroFish modifications, branding/attribution, and whether the isolated-service design satisfies Sigma's proprietary distribution model. Keep all Sigma orchestration and normalized contracts outside the MiroFish codebase. This is an engineering containment recommendation, not a substitute for legal advice.

## 5. Sigma-owned data model

Add a migration after the current latest migration with RLS and indexes for:

### `web_intelligence_runs`

- `id`, `workspace_id`, `provider`, `operation`
- `status`: `QUEUED | RUNNING | SUCCEEDED | PARTIAL | FAILED | CANCELLED`
- `requested_by`, `target_urls`, `query`, `goal`
- `provider_run_id`, `started_at`, `completed_at`
- `cost_units`, `error_code`, `error_message`
- `created_at`, `updated_at`

### `web_evidence_snapshots`

- `id`, `workspace_id`, `run_id`, optional `competitor_id`
- `source_url`, `final_url`, `title`, `retrieved_at`
- `content_hash`, `content_text` or private-storage reference
- `provider`, `retrieval_method`, `http_metadata`
- `previous_snapshot_id`, `change_summary`, `provenance`
- unique/index strategy on workspace, canonical URL, and content hash

### `scenario_simulations`

- `id`, `workspace_id`, `provider`
- `name`, `question`, `hypothesis`, `assumptions`
- `status`: `DRAFT | PREPARING | READY | RUNNING | STOPPING | COMPLETED | FAILED | CANCELLED`
- `provider_project_id`, `provider_simulation_id`, `provider_report_id`
- `round_limit`, `time_limit_seconds`, `budget_limit`, observed usage
- `created_by`, timestamps, failure details

### `scenario_evidence`

- joins a simulation to evidence snapshots or approved vault documents
- stores the exact immutable revision/hash sent to the provider
- records inclusion reason and redaction decision

### `scenario_reports`

- normalized executive summary, observed simulation themes, objections, risks, suggested experiments, assumptions, limitations, provenance, and raw private-storage reference
- calibration fields remain nullable until real outcomes exist

Store collected market evidence in the canonical **Marketing Vault** and finalized simulation assessments in the **Audit Vault**. Do not create an undocumented `competitor` vault identifier. Inputs from Customer or Brand vaults must be copied into an immutable, explicitly approved evidence pack rather than granting MiroFish direct vault access.

## 6. Sigma routes

Create modular routers, mounted by `server.ts`:

### `src/server/routes/webIntelligenceRoutes.ts`

- `GET /api/workspace/web-intelligence/capabilities`
- `POST /api/workspace/web-intelligence/search`
- `POST /api/workspace/web-intelligence/fetch`
- `POST /api/workspace/web-intelligence/agent-runs`
- `GET /api/workspace/web-intelligence/runs/:id`
- `POST /api/workspace/web-intelligence/runs/:id/cancel`

Extend competitor routes to start a provider-backed scan and retrieve snapshot history. Keep the current route shape compatible where practical, but return an asynchronous run record instead of waiting on a long provider job.

### `src/server/routes/marketSimulationRoutes.ts`

- `GET /api/workspace/market-simulations/capabilities`
- `POST /api/workspace/market-simulations`
- `GET /api/workspace/market-simulations`
- `GET /api/workspace/market-simulations/:id`
- `POST /api/workspace/market-simulations/:id/prepare`
- `POST /api/workspace/market-simulations/:id/start`
- `POST /api/workspace/market-simulations/:id/stop`
- `POST /api/workspace/market-simulations/:id/report`
- `GET /api/workspace/market-simulations/:id/report`

All routes require Sigma authentication, workspace scoping, the correct entitlement, runtime Zod validation, idempotency keys for mutations, and server-side ownership checks. Starting a paid/long-running simulation should require owner/admin authorization or an approved HITL record.

## 7. User experience

### Competitor Intelligence

Refactor `CompetitorResearchPage.tsx` to use the existing persisted competitor routes, then add:

- provider capability badge: `Not configured`, `Configured`, `Verified`, `Degraded`, `Failed`
- add/edit competitor and tracked-page controls
- `Search sources`, `Fetch now`, and separately labeled `Run browser agent`
- real queued/running/partial/failed/cancelled progress
- source cards with URL, retrieval time, method, content hash, and evidence excerpt
- historical snapshot diff for pricing, offer, messaging, SEO, and changelog changes
- removal of fixed claims such as “42 ads” or “$45k/mo” unless a cited provider result supports them

### Market Simulator

Add a new lazy route such as `/market-simulator`; do not repurpose the operational agent-routing simulator.

Wizard:

1. Define question and decision to rehearse.
2. Select immutable evidence snapshots/documents.
3. Review redactions, assumptions, persona coverage, provider, round/time/cost limits.
4. Approve and run.
5. Observe truthful lifecycle state and partial artifacts.
6. Review report with evidence, assumptions, limitations, and dissenting outcomes.
7. Convert selected recommendations to **draft** experiments; never auto-launch campaigns.

Report language must say “simulation result,” “modeled scenario,” or “hypothesis,” not “prediction” or “forecast” unless calibration against real outcomes supports that term.

### Module coverage

TinyFish and MiroFish are shared provider modules. Their normalized results appear inside the Growth OS business modules that consume them.

| Growth OS module | TinyFish coverage | MiroFish coverage | Primary result view | Immediate governed use |
|---|---|---|---|---|
| Competitor Intelligence | Discover and fetch pricing, positioning, product, changelog, documentation, and other public competitor pages; preserve snapshots and changes | Simulate buyer and competitor reactions to a detected change or proposed counter-move | `/competitors`: Evidence, Changes, Analysis, and Scenarios tabs | Refresh battlecard; create pricing, messaging, CRO, SEO, or content experiment drafts |
| Social Listening | Collect approved public discussions, reviews, forum threads, and source pages | Rehearse narrative spread, objections, brand risk, and segment reactions | `/social-listening`: sourced signal clusters with linked scenarios | Create response brief, risk alert, FAQ, objection, or content draft |
| SEO & AEO Authority | Discover SERP competitors, citations, reference pages, topical gaps, and public link opportunities | Test which positioning or topic narratives resonate with modeled segments | `/seo-aeo`: Research Evidence and Scenario Insights panels | Add reviewed keywords, briefs, citation targets, and topical-cluster tasks |
| CRO & Landing Pages | Fetch and compare public offers, landing pages, pricing layouts, claims, and CTA changes | Test landing-page propositions, objections, and packaging variants against synthetic buyer groups | `/cro-studio`: Evidence Comparisons and Scenario Tests | Create A/B-test hypothesis, variant brief, objection treatment, and measurement plan |
| Editorial Content | Gather source packs, emerging topics, competitor coverage, and supporting references | Test angles, counter-narratives, persona reactions, and reputational risks | `/content`: Research Pack and Scenario Guidance drawer | Generate grounded content briefs and drafts pending editorial approval |
| Paid Ads & ROAS | Gather public offer and creative-landscape evidence where access and site terms permit | Rehearse offer/message response by segment; it does not predict ROAS | `/paid-ads`: Market Evidence and Preflight Scenario tabs | Create draft test cells, audience-message matrix, exclusions, and risk notes; never auto-change spend |
| Outreach & ABM | Research approved company domains, news, hiring, product, and public problem signals | Simulate likely stakeholder objections and buying-committee responses | `/outreach`: Account Evidence and Buying Committee Scenario | Draft account brief, outreach angle, objection handling, and follow-up tasks |
| Growth Diagnostics | Supply current external evidence instead of relying only on intake answers | Stress-test proposed priorities and roadmap assumptions | `/diagnostics`: Evidence-backed findings and Scenario Risks | Propose roadmap changes and diagnostic follow-up tasks |
| Second Brain | Write immutable normalized evidence to the Marketing Vault with source hashes | Read only approved evidence packs; write finalized assessments to the Audit Vault | `/vaults`: source documents, evidence packs, and reports | Ground downstream agents while preserving provenance and permissions |
| Executive Dashboard | Feed verified change alerts, stale-source warnings, and completed scenario summaries | Feed decision briefs, material risks, and proposed experiments | `/`: Intelligence section and Action Queue | Route work to the correct module and owner with `PENDING_APPROVAL` where required |
| Reports | Supply citations, observed changes, coverage, freshness, and provenance | Supply assumptions, scenario outcomes, dissent, limitations, and calibration | `/reports`: Market Intelligence and Scenario sections | Generate scheduled or on-demand executive reports |
| Scheduler | Run bounded Search/Fetch monitors and freshness checks | No recurring production simulation in the first release; later, schedule only explicitly approved bounded reruns | `/scheduler`: monitor definitions, next run, last run, cost, and failure state | Trigger collection jobs and stale-data alerts |
| Agent Cockpit | Show the agent consuming evidence and its provider tool calls | Show scenario lifecycle, proposed follow-on work, and approvals | `/agents`: DAG/run trace, tool calls, costs, approvals, and outputs | Approve, reject, cancel, retry, or route proposed actions |
| Connectors & Integrations | Configure and verify TinyFish without exposing credentials | Configure and verify the private MiroFish gateway, LLM dependency, and Zep dependency | `/connectors`: separate provider capability cards | Enable features only after exact provider verification succeeds |

The Living System may explain this cross-module activity and show truthful health/status, but it should not become a second workflow engine. The Architecture/Harness views show deployment topology and dependencies, not business results.

### Laya coverage across module layers

| Decision layer | Laya decision | Result consumer | Deterministic control that remains outside Laya |
|---|---|---|---|
| Signal intake | Relevant/irrelevant, category, urgency, duplicate likelihood | TinyFish ingestion, Social Listening, Action Queue | URL safety, source allow/deny rules, schema validation |
| Evidence routing | Target module, vault destination, analysis workflow, escalation need | Orchestrator, Second Brain, module router | Tenant scope, vault permissions, retention and redaction policy |
| Module triage | Priority, risk band, owner, next workflow from an allowlisted set | Every business module and Dashboard | Entitlements, role checks, mandatory approvals and hard risk rules |
| Agent orchestration | Select agent, tool, model tier, next DAG edge, retry/stop/escalate | Orchestrator Agent and Agent Cockpit | Tool permissions, spend limits, maximum retries and circuit breakers |
| Simulation interpretation | Material/immaterial, stable/unstable, relevant segment, destination experiment type | MiroFish adapter, Market Simulator, experiments | Evidence provenance, simulation limits and prohibition on calling modeled output fact |
| Action preflight | Safe bounded action versus approval/escalation | Action Queue and execution pipeline | RBAC, credential access, publishing, outreach, budget and destructive-action gates |
| Learning | Compare Laya decision with human override and observed outcome | Calibration/evaluation pipeline | Dataset governance, label review, release approval and rollback |

The Orchestrator Agent is the main consumer. It sends a compact state plus an allowlisted question set to the decision module, receives ranked typed results, applies deterministic policies, and either dispatches the next workflow edge or escalates. Laya does not generate the plan or invent an action; it chooses among actions Sigma already permits.

### Result and workflow visibility

Every run should have one canonical Sigma run ID. The same run is projected into seven views:

| Surface | Question answered | What is shown |
|---|---|---|
| Business module page | What did this mean for growth? | Evidence, changes, analysis, scenario insights, and module-specific recommendations |
| Executive Dashboard Action Queue | What needs attention now? | Alerts, proposed actions, priority, risk, owner, and approval state |
| Agent Cockpit & Approvals | Who or what is doing the work? | DAG/run trace, provider calls, status, duration, cost, permissions, and HITL controls |
| Scheduler | When will it run again? | Cadence, targets, next/last run, freshness, retry, quota, and failure state |
| Second Brain | What exact evidence was used? | Immutable source snapshot, content hash, evidence pack revision, and report artifact |
| Executive Reports | What should leadership decide? | Material changes, opportunities, risks, assumptions, experiments, and citations |
| Living System | Is the system healthy and why is it acting? | Read/explain status and links to the canonical run; no duplicate mutation controls |

Cross-links should preserve `workspaceId`, canonical Sigma run ID, source module, evidence-pack revision, and related action/approval IDs so a user can move from an executive alert to the underlying evidence and execution trace.

#### VANTA access and conversation contract

VANTA is the conversational inspection layer, not another decision provider or workflow executor:

- The Living System header shows the text/voice provider separately from the Laya decision runtime. Laya reports one truthful state: `unconfigured`, `loading`, `ready_unvalidated`, `shadow`, `calibrated`, `degraded`, or `failed`.
- Inspect mode exposes a **Laya Decision Core** topology node with reachability, mode, calibration state, and whether automation is eligible.
- VANTA receives only server-owned, redacted decision status and decision-trace evidence. It never receives `LAYA_API_KEY`, raw secrets, or unrestricted vault content.
- A user can ask: “Why was this routed?”, “What alternatives did Laya score?”, “Why is approval required?”, “Which policy overrode the model?”, “What is stuck?”, and “Open the owning workflow.”
- Each answer should identify the canonical run/decision ID, selected value, alternative distribution, provider/checkpoint, calibration version, policy override or fallback, observed time, and destination workflow. Missing evidence must be stated plainly.
- VANTA may navigate to the Action Queue, Agent Cockpit, module result, evidence snapshot, or approval. It may propose a rerun, escalation, or draft action. It cannot invoke arbitrary Laya questions or execute the resulting action directly.

Phase 1 exposes runtime health and topology. Decision-run persistence and canonical trace links are the next slice; until then VANTA can discuss runtime state but must not claim it has a durable decision history.

### Immediate automation rules

“Immediate” means Sigma creates the next useful governed artifact as soon as validated results arrive. It does not mean an external campaign is automatically launched.

#### TinyFish result automation

1. Provider result is schema-validated, normalized, hashed, and stored.
2. Sigma compares it with the previous snapshot and classifies the change.
3. Deterministic routing rules create an Action Queue item and module-specific draft.
4. Low-risk internal writes may complete automatically; publication, CRM mutation, outreach, or spend changes enter HITL approval.

Examples:

| Detected evidence | Immediate Sigma automation |
|---|---|
| Competitor price or packaging changed | Update evidence timeline, refresh battlecard, propose pricing/CRO scenario, alert owner |
| Competitor launches a feature | Create feature-gap brief, SEO/content opportunity, and sales objection update |
| Repeated negative-review theme | Create customer-objection candidate, FAQ/CRO brief, and brand-risk task |
| New category topic gains source coverage | Create sourced editorial brief and SEO cluster candidate |
| Account hiring/funding/product signal changes | Refresh account brief and propose outreach angle; sending remains approval-gated |
| Source becomes stale or repeatedly fails | Mark dependent insights stale and create a connector/monitor maintenance alert |

#### MiroFish result automation

1. Sigma validates report completeness and records provider/version, inputs, assumptions, limits, and usage.
2. Findings are split into evidence-supported observations, simulated behaviors, risks, and hypotheses.
3. Sigma generates draft experiment cards with owner, module, target segment, success metric, guardrails, and required evidence.
4. The cards enter the Dashboard Action Queue and relevant module page.
5. Approval sends the work into an existing agent/pipeline workflow; rejection records the reason for later calibration.

Examples:

| Scenario output | Immediate Sigma automation |
|---|---|
| Strong modeled objection to a landing-page claim | Draft CRO test and alternative copy; route to CRO owner |
| Segment-specific campaign reaction | Draft audience-message test matrix; route to Paid Ads approval without changing budget |
| Brand or public-response risk | Create risk alert, response brief, escalation owner, and do-not-publish gate |
| Likely competitor counter-positioning | Draft counter-message, battlecard update, and monitoring rule |
| Buying-committee disagreement | Draft persona-specific outreach and objection-handling variants |
| Weak or unstable result across reruns | Mark the hypothesis inconclusive and request more evidence instead of creating an execution task |

No provider-generated “confidence score” should authorize action. Automation eligibility is based on source provenance, evidence freshness, schema completeness, repeatability, policy/risk class, entitlement, and human approval requirements.

### Workflow examples inside the ecosystem

#### Competitor change to growth experiment

```text
/scheduler monitor
  -> TinyFish Fetch
  -> Marketing Vault evidence snapshot
  -> /competitors change diff
  -> Dashboard Intelligence alert
  -> approved MiroFish scenario
  -> /market-simulator report
  -> draft CRO/Paid/Content experiments
  -> /agents approval and execution trace
  -> /reports outcome and later calibration
```

#### Market signal to content response

```text
/social-listening or /seo-aeo research request
  -> TinyFish Search + Fetch
  -> sourced topic cluster
  -> Editorial Content research pack
  -> optional narrative-risk scenario
  -> draft brief in /content
  -> editorial approval
  -> published-result telemetry returns through existing connectors
```

#### Account research to governed outreach

```text
/outreach account request
  -> TinyFish public account evidence
  -> Customer/Marketing evidence pack
  -> optional buying-committee scenario
  -> personalized brief and objections
  -> Action Queue approval
  -> existing outreach workflow
  -> CRM and response outcomes used for calibration
```

### Legacy-to-Laya replacement sequence

Do not replace a provider by changing only the URL or branding. Replace the provider-specific implementation while preserving and deepening the decision seam.

1. **Extract the interface.** Move the public decision contracts out of the legacy engine into the provider-neutral decision module. Preserve `/api/workspace/decision/*` route compatibility.
2. **Correct current truthfulness defects.** Report the actual active adapter; remove the claim that an unconfigured provider path is Gemini when it is heuristic. Remove fixed `70ms`, `sub-100ms`, `calibrated`, and `non-hallucinatory` UI claims unless measured for the deployed Laya checkpoint.
3. **Add Laya in shadow mode.** For each eligible heuristic decision, record Laya's answer without letting it control the workflow. Redact state and store input/question hashes, distributions, checkpoint, latency, and human outcome.
4. **Build a Sigma evaluation set.** Cover each module, Arabic and English inputs, adversarial wording, ambiguous cases, class imbalance, high-risk actions, and historical human overrides. Separate training/calibration and final test sets.
5. **Fit thresholds by decision type.** Routing, urgency, safety, and HITL decisions require different thresholds and acceptable-error policies. Low-confidence or out-of-distribution cases escalate rather than auto-route.
6. **Enable bounded canary decisions.** Start with reversible internal routing and queue ordering. Do not canary external publishing, outreach, budget, credential, or destructive decisions.
7. **Promote Laya to primary.** Only after accuracy, calibration error, coverage, latency, memory, cold-start, multilingual behavior, and failure recovery meet written acceptance thresholds.
8. **Retire the legacy provider.** Remove its secrets, provider-specific UI/type names, pricing/catalog entries, and adapter after a rollback window and dependency/license audit.

Primary source touchpoints:

- replace the legacy engine with provider-neutral contracts and adapters
- rename provider-specific option, result, status, and triage persistence/UI fields
- keep and harden `/api/workspace/decision/status`, `/triage`, `/route`, and `/safety`
- update `src/components/dashboard/ActionQueueTab.tsx` to show the actual adapter, checkpoint, calibrated coverage band, and policy override
- update `src/lib/tokenCostEngine.ts` from TypeSafe token pricing to local Laya compute telemetry
- replace legacy provider configuration in `.env.example` with pinned Laya runtime configuration
- add decision records/calibration tables or append-only audit events with workspace scope and RLS

Initial orchestrator question sets should be versioned configuration, not arbitrary agent-written prompts:

- target module and agent
- workflow template
- urgency and risk rubric
- tool/model tier
- retry, stop, or escalate
- HITL recommendation, subject to mandatory policy overrides
- TinyFish evidence relevance and downstream destination
- MiroFish finding materiality, stability, and experiment destination

## 8. Delivery phases and gates

### Phase 0 — Decisions and spike

- Confirm the exact Laya repositories/runtime and choose HTTP sidecar versus ONNX spike.
- Approve MiroFish licensing/deployment model.
- Obtain TinyFish and Zep test credentials plus an approved OpenAI-compatible MiroFish model.
- Pin provider versions/commits.
- Run local provider spikes with non-sensitive sample data.
- Capture actual response contracts, error modes, latency, cancellation behavior, cost/usage signals, and deletion behavior.

**Exit gate:** all three providers have a recorded contract, security notes, measured sample costs/latency/resource usage, and a go/no-go decision. “Configured” is not “verified.”

### Phase 1 — Foundation and truthful state

- Add normalized provider interfaces, fixture adapters, capability endpoints, encrypted configuration, feature flags, and status taxonomy.
- Add migrations, RLS policies, indexes, and audit events.
- Add quota, timeout, retry, concurrency, and circuit-breaker rules.

**Exit gate:** unit/contract tests pass; unauthenticated and cross-workspace access fail closed; the UI cannot label an unverified provider live.

**Execution status (2026-09-25):**

- Completed: correct `laya[serve]` 0.3.20 runtime installed separately from the unrelated Laya desktop app; CLI routing and HTTP health probe verified locally.
- Completed: provider-neutral TypeScript decision adapter with typed Laya HTTP requests, deterministic fallback, shadow-mode comparison, and truthful runtime states.
- Completed: decision status exposed to VANTA, Laya topology node added, Action Queue wording changed from provider-specific claims to provider-neutral truthful state, and local `.env` set to shadow mode.
- Verified: focused decision/VANTA tests pass; the official English checkpoint downloaded and completed one non-sensitive typed HTTP inference; health now reports `loaded: ["english"]`; Growth OS reports `shadow`, uncalibrated, and not execution-eligible. The runtime also warned that affected shipped temperature values were clamped and their confidence must be treated as uncalibrated, reinforcing the calibration gate.
- Implemented locally: evidence-backed `/api/workspace/capabilities` registry; MCP catalogue toggles remain `enabled` rather than being mislabeled `configured` or `verified`.
- Implemented locally: migration `0016_decision_traces.sql`, modular decision routes, hashed/redacted decision traces, trace-list API, and VANTA recent-trace context. Deployment is blocked because the configured Supabase service-role key belongs to a different project than `SUPABASE_URL`.
- Implemented locally: Laya calibration validation/metrics harness and redacted JSONL template. Human-approved labels and promotion thresholds are still required.
- Implemented locally: TinyFish Search/Fetch adapter with normalized evidence, bounded calls, server-only key use, and private-network URL rejection. Live verification is blocked on `TINYFISH_API_KEY` and approved target URLs.
- Implemented locally: MiroFish private-service adapter and explicit licensing/service-token/private-URL gates. Simulation creation remains deliberately disabled until the private gateway, Zep/model configuration, deletion behavior, and AGPL decision are verified.
- Remaining before the Phase 1 exit gate: correct and verify Supabase credentials; deploy migrations; add authenticated route tests, full DNS/redirect SSRF controls, limits/circuit breakers, reviewed calibration cases, and production process/container supervision.

### Phase 1A — Laya shadow and orchestrator canary

- Run Laya beside the current heuristic path without controlling workflows.
- Build the Sigma decision evaluation set and fit per-question calibration thresholds.
- Expose decision comparison, disagreement, latency, and human override metrics internally.
- Canary reversible module routing and Action Queue ordering.

**Exit gate:** written thresholds pass on a held-out multilingual set; ambiguous/high-risk cases escalate correctly; resource/cold-start behavior is acceptable; rollback is verified. Only then make Laya primary and remove the legacy adapter after the rollback window.

### Phase 2 — TinyFish competitor-monitor vertical slice

- Wire the existing competitor screen to persisted routes.
- Add Search/Fetch acquisition, normalized snapshots, content hashes, diffs, provenance, and failure states.
- Preserve the current Gemini analysis only as a downstream evidence analysis step, with unsupported metrics excluded.
- Add Agent mode only after Search/Fetch is stable and cost controls are visible.

**Exit gate:** a real page change produces a reproducible sourced diff; no timer-based success, seed metric, or uncited spend/traffic estimate appears in the production path.

### Phase 3 — Scheduled market intelligence

- Connect monitor jobs to Sigma's scheduler/worker mechanism.
- Add cadence, deduplication, retry/backoff, robots/terms review, and change alerts.
- Add research brief export and immutable evidence-pack creation.

**Exit gate:** scheduled jobs survive restart, do not duplicate snapshots, respect quotas, and show fresh/stale/failed states accurately.

### Phase 4 — MiroFish sandbox

- Deploy pinned MiroFish privately with service authentication, persistent isolated storage, restricted CORS/network access, health checks, and log redaction.
- Implement the Sigma adapter and normalized lifecycle.
- Limit the pilot to non-sensitive public evidence, low rounds, one concurrent simulation per workspace, and manual approval.

**Exit gate:** create -> prepare -> start -> observe -> stop/complete -> report works through Sigma only; direct public access is blocked; deletion and failure recovery are verified.

### Phase 5 — Market Simulator product flow

- Build `/market-simulator`, evidence selection, assumptions, limits, run view, report view, and draft-experiment conversion.
- Save reports to the Audit Vault with source hashes and provider version.
- Add comparison runs so one scenario can be evaluated against a baseline.

**Exit gate:** a user can trace every report back to exact inputs, distinguish evidence from modeled output, and create only reviewable draft actions.

### Phase 6 — Calibration and expansion

- Record actual experiment outcomes against scenario claims.
- Measure directional accuracy, false positives, stability across reruns, segment coverage, cost, and latency.
- Add use cases such as positioning, campaign reaction, packaging, and launch risk only after the vertical slice is calibrated.

**Exit gate:** decision-grade labels require a defined benchmark and minimum sample; otherwise the module remains explicitly experimental.

## 9. Verification matrix

### Automated

- interface contract tests for all production adapters using recorded/redacted fixtures
- Laya contract tests for `choice`, `score`, and boolean decisions plus truncation/option-limit failures
- frozen Sigma decision evaluation set with per-module, Arabic/English, ambiguous, adversarial, and high-risk cases
- calibration, coverage, confusion matrix, false-negative, override, and out-of-distribution tests per decision type
- Laya cold-start, warm latency, memory, concurrency, worker/sidecar failure, and deterministic-policy fallback tests
- schema validation and provider error classification
- URL/SSRF and redirect safety tests
- RLS tests for every new table and storage path
- entitlement and role tests for all routes
- idempotency, retry, timeout, partial-result, cancellation, and circuit-breaker tests
- evidence hashing/deduplication and diff tests
- migration verification added to `backend/database/migrations/verify.sql`
- frontend state tests for unconfigured, verified, queued, running, partial, failed, stale, and cancelled states

### Live verification

- TinyFish Search, Fetch, Agent, failure, timeout, and cancellation against controlled pages
- MiroFish health plus a complete low-round lifecycle through the Sigma gateway
- Laya shadow comparison and reversible orchestrator canary using the pinned deployed checkpoint
- provider deletion and Zep data-removal behavior
- tenant isolation with two authenticated workspaces
- browser checks for progress, refresh/reconnect, keyboard use, mobile layout, and reduced motion
- cost and latency measurements captured from actual runs

### Release checks

- `npm run lint`
- focused Vitest suites
- full `npm test`
- `npm run build`
- `git diff --check`
- deployment migration/RLS verification and authenticated smoke tests

## 10. Product metrics

Do not assign improvement percentages before telemetry exists. Instrument:

- source coverage and fetch success rate
- freshness SLA and stale-source rate
- meaningful-change precision after human review
- duplicate/noise rate
- time from detected change to reviewed insight
- evidence-pack-to-simulation conversion
- simulation completion/failure/cancellation rate
- cost and latency per evidence pack and simulation
- recommendation acceptance into draft experiments
- calibration: predicted direction versus actual experiment outcome
- Laya decision accuracy, calibration error, automatic-decision coverage, disagreement, human override, and policy-override rate
- Laya cold-start/warm latency, throughput, memory, failure, and fallback rate by runtime/checkpoint

## 11. Decisions required before implementation

1. **Recommended:** approve the separate, private MiroFish service and start the licensing review. Do not embed its source in the Sigma Node application.
2. Confirm the intended Laya source is `NandhaKishorM/laya` and approve a provider-neutral decision module with a private Laya runtime; HTTP sidecar is the production recommendation, subject to the spike.
3. Choose credential ownership for TinyFish and MiroFish dependencies: Sigma-managed, customer-managed, or both.
4. Confirm the first vertical slice: competitor pricing/positioning monitor -> buyer-response scenario -> Laya-routed draft experiment.
5. Define pilot data policy: public web evidence only is recommended until deletion, residency, confidentiality, and tenant isolation are verified.

## 12. Explicit non-goals for the first release

- no autonomous campaign launches or budget changes
- no direct provider access to Sigma databases or vault credentials
- no copying the TinyFish example UI or MiroFish frontend into Sigma
- no “accurate prediction,” “live,” or “real-time” claims without measured evidence
- no unrestricted authenticated-site automation
- no sensitive customer or executive-vault data sent to MiroFish
- no production MiroFish release before the AGPL and data-governance gates pass
