# Growth OS remediation plan

Date: 2026-10-01. Status: proposed implementation plan, not a completed fix or a release certification.

## 1. Target outcome and corrected baseline

A brand should receive an evidenced explanation of its revenue gap, a choice of interventions with duration and fees, and a reliable content-to-publication workflow. The provider should be able to open any deliverable and see what was created, which work ran, who approved it, where it went, and what happened afterwards.

The user-supplied executive PDF downloaded successfully. It is a two-page A4 file, 33,779 bytes, created at 17:49:23 +04 on October 1. Both pages were inspected. Its amber palette conflicts with the app's orange brand; page two has overlapping action headings and impact text; it contains unsupported verification, performance, and security claims. Download failure is withdrawn as a finding.

The earlier audit was exploratory user-journey testing. It did not establish concurrent-user capacity, restart recovery, tenant isolation, or backend data loss. This plan adds explicit tests for those concerns.

Current code inspection confirms:

| Issue | Evidence in current source | Implication |
|---|---|---|
| Approval queue mismatch | `GrowthDiagnostics.tsx:152` posts to `/api/workspace/run-agent`; `AgentCockpit.tsx:76` initializes a separate local queue from an empty constant | Repair the reader and state model; do not assume server tasks were deleted |
| Empty global logs | Cockpit owns a separate local log array; `AgentLogsViewer.tsx` only filters its props | Connect logs to durable execution events |
| Fabricated telemetry path | `AgentHeatmap.tsx:112` creates random events and labels them verifiable executions | Isolate simulation data and derive real counts from the server ledger |
| Unfounded diagnostic precision | `server.ts:3350` onward supplies fixed fallback percentages and savings; `growthAuditAgents.ts` assigns some evidence states by category | Validate each claim against its actual source; fetched HTML cannot establish measured funnel loss |
| Strategy mismatch | `growthStrategy.ts:129` classifies free-text recommendations with overlapping regexes | Use explicit strategy types and evidence IDs; do not attach search-query work to CRO merely because text matched |
| Generic social output | `SocialCarouselsPage.tsx:283` uses a timer and four fixed slides; caption and thread are separate state | Generate one validated campaign bundle and save all variants together |
| Fake social sync | `SocialListeningPage.tsx:92` and deploy action show timed success; `handleAgentReachScan` is a separate actual API path | Route user actions to measured provider work and log zero results/errors |
| Fake report save | `Reports.tsx:112` shows a toast only | Persist a versioned report before confirming save |
| Hardcoded report claims | `Reports.tsx:151` supplies fixed tenant, metrics, narratives and vault counts; `exportService.ts:465` draws jsPDF coordinates | Replace data assembly as well as the renderer |
| Simulated scheduler | `Scheduler.tsx:39-115` has static statistics/history and local timers | Add durable schedules and delivery attempts, or show an explicit unavailable state |

Existing strengths to reuse: server approval/rejection routes, workspace version-conflict handling, provider adapters, normalized reporting endpoint, content approval/publish routes, scoped decision traces, and approved brand assets. These are implementation seams, not proof that every runtime path works.

## 2. How the references shape the plan

Reyd Cronkwright's post calls for an account of the result, supporting metrics, interpretation, and the next action. We will use that as the report's narrative order and keep detailed logs in an appendix. Both gains and losses must appear; a missing baseline should be stated plainly. [Reporting reference](https://x.com/ReydCronkwright/status/2051331021077963132)

Ryven's article motivates bounded tasks, schema-checked handoffs, parallel independent work, deterministic reduction, fresh-context verification, external evidence, restartable state, and limited retry loops. These are useful design principles, not a guarantee of correctness. Our implementation will anchor factual claims to provider records and reproducible checks. Multiple model votes are insufficient to establish truth. [Graph engineering reference](https://x.com/imryven/status/2101412287013593420)

pdfcn provides copy-owned React PDF components with Forme and Takumi bases. Adopt its Forme components behind a server rendering adapter, starting with a compatibility prototype in the current Express app. Pin the reviewed source and dependencies. It does not require migrating the app to Next.js. [pdfcn repository](https://github.com/shadcn-labs/pdfcn)

The inspected Forme theme provider uses mutable module-level theme state, and the marketing template contains example metrics and fixed positive language. Explicit theme isolation and removal of sample defaults are required adoption work. Deployment compatibility remains untested. Source details and citations: [pdfcn adoption research](research/pdfcn-reporting-adoption-2026-10-01.md).

## 3. Implementation sequence and effort

Estimates below are planning ranges in focused engineering days for one experienced engineer, including relevant tests. They are not delivery commitments or client fees. Dependencies, provider access, and the pdfcn prototype can change them. Total sequential effort is approximately 24-38 engineering days; external approvals and account access can add elapsed time.

| Phase | Scope | Estimate | Completion gate |
|---|---|---|---|
| 0 | Correct misleading states and establish regression fixtures | 1-2 days | No operational screen reports timer/sample output as measured work |
| 1 | Shared task, approval, event and artifact ledger | 4-6 days | One task ID and consistent state across reloads, modules and operators |
| 2 | Evidence contracts and bounded graph execution | 4-6 days | Claims trace to sources; failed or unsupported nodes cannot become verified |
| 3 | Report snapshot, pdfcn renderer and delivery record | 4-6 days | Branded, readable PDF whose values and citations reconcile with saved evidence |
| 4 | Revenue opportunity model and priced proposals | 3-5 days | Transparent calculations, explicit assumptions, approved fee version |
| 5 | Social creation, approval, scheduling, receipts and measurement | 5-8 days | One verified channel completes the full loop, then additional adapters pass independently |
| 6 | Integrated failure, isolation, recovery and capacity testing | 3-5 days | Scenario passes with durable artifacts and logs; remaining external blockers are named |

Phase 3 can prototype layout while phase 2 is underway, using conspicuously labelled fixtures. Its production output still depends on the evidence and ledger gates. Phase 4's calculators can be developed independently after the shared contracts settle. Broad agent expansion, a graph database, and a new orchestration framework are outside the initial scope.

## 4. Phase 0: stop unsupported success claims

- Correct the audit's download finding and preserve its original observations with a dated correction.
- Remove unconditional verification, encryption, scan-count, delivery and performance statements from operational paths. Unknown is not zero; a zero requires a successful observation.
- Keep fixtures only in a clearly marked demo/simulation view. Do not delete existing records; mark legacy records without provenance as unverified and exclude them from live statistics until reconciled.
- Replace timer-based Social Sync, Sentinel deployment and scheduler success with actual results or an actionable unavailable state.
- Show provider states separately: unconfigured, checking, verified access, current data, stale data, failed and unsupported. Display exact account, scope and last successful observation where relevant.
- Correct Agent Reach's initial loading presentation: a pending doctor run is not an unavailable-runtime verdict. A late result must not overwrite newer workspace state.
- Define test fixtures for empty workspace, incomplete data, approved data, stale data, provider failure, and conflicting data.

Acceptance: no configured connector, localStorage event, cached preset, AI assertion or toast alone can set a verified/completed/delivered status.

## 5. Phase 1: one durable record of work

Start by connecting the Cockpit to existing server tasks. Retain the existing approval routes and permissions. Add a shared client task store with workspace-scoped cache keys, refresh after mutation, and resume-on-reload. Read the returned task status instead of unconditionally assigning Pending Approval after any HTTP success.

Then introduce a transactional execution ledger in Supabase/Postgres. Proposed records:

| Record | Essential fields and purpose |
|---|---|
| Run | Workspace, objective, workflow/version, requester, status, timestamps, budget, correlation ID |
| Node attempt | Run/node ID, attempt, typed input/output reference, executor/tool version, start/end, error, actual or estimated usage |
| Event | Unique event ID, monotonic sequence, actor, transition, timestamp, redacted details |
| Evidence and claim | Source/account, observation period, collection time, payload hash, locator, claim type, verification result, supersession |
| Approval | Actor, authority, approved content/version/hash, scope, expiry, decision and time |
| Artifact and report | Immutable version, content hash, storage key, report snapshot, brand/template versions |
| Delivery attempt | Artifact/version, destination identity, idempotency key, request time, provider receipt, state, error |
| Outcome observation | Metric definition, period, cohort, evidence ID, baseline comparison and attribution limits |

Use workspace foreign keys, membership checks and RLS on every record and artifact lookup. Retain the existing privacy-preserving decision-trace boundary; do not place credentials or unrestricted raw client data in browser logs or report appendices.

Migrate existing `workspace_state.agentTasks` with stable legacy IDs and reconciliation counts. Choose one authoritative write path after cutover; avoid maintaining divergent task copies. Preserve version-conflict handling until normalization is complete. New IDs should be collision-resistant, and submission idempotency should include workspace, audit version, strategy and task identity.

Transitions are server enforced: requested -> pending approval -> approved -> queued -> running -> succeeded/failed/blocked/cancelled. Rejection is explicit. Completion of a draft-generation node does not establish task execution, publication or business success. Long-running work should enqueue and return a run ID, with leased workers and resumable attempts.

The provider view should expose Work, Deliverables and Activity with a common run ID. Each row answers: what, why, actor, when, status, output, evidence, approval, destination and result. Heatmaps, counters and CSV/JSON exports derive from the same event stream. “Clear” should clear filters or archive a view, not erase the audit trail.

Acceptance: submit three tasks once, see exactly three across both pages and a second session; reload, switch workspace, approve one, reject another, and confirm all views agree. Duplicate clicks and simultaneous approvers must not execute twice.

## 6. Phase 2: the graph and evidence loop

Use a workflow graph for dependencies and a linked provenance graph for evidence. The existing visual DAG is a presentation surface; it must read the execution graph rather than imply that drawn nodes ran. Postgres records and typed edges are sufficient initially.

The proposed runtime sequence is:

1. Capture client objective, reporting period, baseline requirements and allowed actions.
2. Collect independent website, billing/CRM, analytics and channel evidence in parallel where access exists.
3. Normalize units, dates, currencies and identities; deduplicate in code.
4. Run bounded specialist analysis against only its permitted evidence.
5. Verify schema, calculations, provenance, freshness and contradictions.
6. Independently review consequential interpretations using fresh context and the source evidence.
7. Synthesize accepted claims into a strategy and report draft.
8. Obtain the required approval for the exact action/artifact version.
9. Execute permitted work and capture tool responses and deliverables.
10. Verify artifacts and provider receipts; assemble and deliver the report.
11. Measure outcomes at the defined interval; propose the next iteration.

Each node has a versioned input/output schema, permitted tools, timeout, retry policy, budget and an acceptance check. Every dependency edge references the actual output artifact ID and hash supplied downstream. Missing dependencies block a node; they do not prompt the model to invent replacement evidence.

Each client-facing factual claim must carry a source reference. Its classification is one of measured fact, calculation, estimate, hypothesis or unavailable. The evidence record includes workspace, provider/account, source locator, covered period, observation time, retrieval result and scope. A source URL by itself does not prove the claimed number. Several summaries derived from the same provider record count as one origin.

Verification order:

- Deterministic checks first: schema validity, permitted workspace, supported metric, arithmetic, denominator, date range, currency, duplicated attribution and source availability.
- Evidence-specific checks: an HTML capture supports visible form fields, not a measured 62% abandonment rate; a successful post response supports publication, not engagement; a completed render supports an artifact, not customer receipt.
- Independent review for material interpretations. Supply the claim, evidence and acceptance rules without the worker's reasoning. A model's confidence is advisory; it cannot override failed checks.
- Conflicting evidence is surfaced as a discrepancy with both references. No “majority vote” may manufacture certainty.

Failure loops have a dedupe key registered as soon as a finding is discovered, including rejected findings. Join verifier results by finding ID, never by array position after filtering. Retry transient failures with bounded backoff; unknown publication outcomes enter reconciliation before retry. Proposed starting bounds: two correction retries per node, three analysis rounds, two rounds without new findings, and configurable wall-clock/token/spend caps. These are engineering defaults to tune, not a mandate to repeatedly run every task.

A stopped budget loop reports partial or blocked. Two dry rounds mean no new findings in that tested scope, not proof the entire system is correct. Persist checkpoints, leases and immutable outputs so a restart resumes completed work. Fix validation rules and regenerate affected outputs; do not hand-edit an artifact to simulate a passing result.

Acceptance: deliberately insert an unsupported percentage, wrong workspace evidence, stale record, broken link, bad calculation, duplicate finding and altered output hash. Each must be caught. Killing and restarting a worker must retain finished nodes and prevent duplicate external side effects.

## 7. Phase 3: polished reports with pdfcn

### The report contract

Introduce a server-owned `ReportSnapshot` shared by screen preview, PDF and structured exports. Proposed fields include workspace/client identity, objective, current/comparison periods, metric definitions and values, evidence/claim IDs, narrative cards, work completed, deliverable references, planned actions, fees, caveats and approval version. Templates control presentation, not facts.

The executive section should take roughly five minutes to read. Suggested composition:

| Section | Required answer |
|---|---|
| Decision summary | What was the most consequential win or loss, and what decision is needed? |
| Performance cards | What changed versus the baseline, why it matters, and how certain is the explanation? |
| Delivery summary | What did we create or run, how was it delivered, and where is the output? |
| Next actions | What will happen next, owner, dependency, duration, expected range, fee and approval needed? |
| Evidence appendix | Which source, calculation, run, artifact and receipt supports each statement? |

Every finding follows result -> metric/baseline -> interpretation -> next action. Causal language requires suitable evidence; otherwise label the explanation a hypothesis to test. Include losses, stalled work, unavailable data and scope limits. An initial report with no historical measurements is a baseline and proposal, not a monthly performance report.

### Brand and rendering

Use the actual assets under `public/brand/`, with Sigma orange `#FF481B`, black, white and approved neutrals from `src/lib/palette.ts`. Start with a light print-friendly layout; allow a validated dark option and tenant-specific brand overrides. Default headings should be readable sans serif, with enough space for evidence references and long action titles. Never recreate the wordmark as typed text when an approved asset is available.

Expose a report brief: recipient/audience, objective, reporting period, language, currency, desired detail, sections, logo/brand, page size and delivery method. Save the selected template and brand profile versions with the report. Arabic/RTL and special fonts remain explicit requirements to validate before offering those exports.

Copy and pin the selected pdfcn Forme primitives, preserve their license, remove sample data and positive status defaults, and map semantic tokens to the brand profile. Isolate theme per render; test concurrent reports from different tenants. Add an Express renderer service using Forme's documented serialize/render boundary and verify actual Node/build/deployment support before rollout. If Forme fails the deployment check, evaluate the other pdfcn rendering base through a supported Node adapter; do not silently substitute a screenshot export.

Use content-driven page flow, wrapping, repeated table headers, sensible row breaks, page numbers and an evidence appendix. Long impact text should have its own region below the title. Put detailed logs outside the executive reading flow. Embed approved fonts where supported; verify selectable text, citations and pagination.

### Save, export and delivery

Save Report must persist the snapshot and return a report ID/version. Rendering creates a protected artifact with hash, byte size and storage reference. A download starts from that artifact, and the success message states exactly what is known: generated, download initiated, or confirmed download. Email/portal delivery is recorded separately with provider receipt and destination. Provider acceptance does not prove the recipient read the file.

Acceptance: the supplied PDF's overlap and brand defects are gone; empty and partial reports remain honest; long titles and 100-row tables paginate; two simultaneous brands cannot bleed styles or data; all headline values reconcile with detailed totals or explicitly explain different scopes. Download the real PDF and inspect its bytes, extracted text, all rendered pages and citation links. Save/reload must preserve the same version.

## 8. Phase 4: missing MRR, solutions, duration and fees

Separate a target gap from recoverable opportunity. `Target MRR - current MRR`, floored at zero, is a planning gap, not proof of lost revenue. Current MRR must come from a declared recurring-revenue definition and approved billing/CRM data; website traffic, ARR run-rate presets and ad spend are not substitutes. One-off commerce revenue should use a monthly-revenue model with a clearly different label.

Collect current/target MRR, recurring plan values, active customers, new/expansion/contraction/churn MRR, acquisition funnel counts, conversion rates, sales-cycle lag, churn cohorts, capacity, gross margin and source period. Use user-provided inputs when integrations are missing, labelled as such. Unknown inputs stay unknown.

Implement deterministic, versioned calculations. Examples:

- Next-month MRR = current MRR + new MRR + expansion MRR - contraction MRR - churn MRR.
- Acquisition opportunity = eligible funnel volume x feasible incremental customer-conversion rate x new-customer recurring value, adjusted for realization lag and capacity.
- Retention opportunity = at-risk recurring revenue x plausible avoidable churn fraction, with cohort and horizon stated.

Report conservative/base/upside scenarios, explicit assumptions, sensitivity and confidence. Do not add overlapping channel, funnel and retention opportunities twice. Saved ad spend is a cost benefit, not MRR. Before/after changes alone do not establish the intervention caused the difference.

Each strategy card must show evidence, mechanism, tasks, deliverables, expected impact range, dependencies, implementation time, first-measurement time, responsible role and fee components. Replace free-text regex routing with typed intervention categories and validated evidence links. Distinguish a 90-day planning horizon from a guaranteed time to revenue recovery.

Use a versioned service catalogue with setup, recurring, scoped project work, media spend and third-party costs separated. The repo contains several commercial models; do not pick a price implicitly. A quote references an explicitly selected approved catalogue and version, currency, validity and billing cadence. An unapproved price is shown as draft/quote required. Commercial fees and engineering effort estimates are separate.

Acceptance: missing denominators block numeric ROI; zero revenue, annual plans, refunds, mixed currencies, duplicate deals and churn/expansion are handled; a reviewer can reproduce the number from displayed inputs. The proposal contains duration and fee breakdown without unsupported recovery promises.

## 9. Phase 5: social publishing and engagement

Reuse existing `ContentAsset` approval and `/content-assets/:id/publish` infrastructure. Publishing code exists; the earlier browser journey established no usable connection from the carousel draft to it. Inspect and harden each adapter instead of creating a competing publishing system.

Generate a versioned campaign bundle containing the brief, brand voice, chosen channels, content points, carousel slides, caption, thread, CTA, evidence references and media assets. Validate topic coverage, requested content-point count, platform constraints and brand claims. Five requested leaks must be represented; cover and CTA slides may add to the slide count. If a generation provider fails, preserve the prior version and report failure rather than replacing it with a generic template.

Persist each output and run. Editing any publishable content invalidates the approval for that version. Each channel variant references the same campaign and has its own preview, approval, target account and delivery state. Unsupported formats must be explicit: text publishing is not evidence that an adapter supports LinkedIn document carousels, Instagram image sets or threaded posts.

Add a durable content calendar with timezone-aware schedules, worker leases, retries and cancellation state. Reports can use the same scheduling/delivery infrastructure with different job types. Display counters from actual schedule and attempt records; remove static scheduler statistics and invented Redis/worker health.

Before dispatch, validate exact account identity, required scope, supported media, current connector access and approved artifact hash. Record per-channel provider post ID, URL, timestamp, request/response evidence and errors. The existing route's top-level `success: true` cannot mean every channel published; derive partial success from results. On timeout, reconcile the provider outcome before retrying to avoid duplicates.

Route social scans through actual supported channel backends. Record channel attempts, coverage, query, time and zero results. Unavailable channels must not imply zero mentions or absence of a crisis. Remove sample personas, sentiment and impressions from operational analytics.

Ingest engagement from provider-owned observations with metric definition and period. Show unavailable metrics as unavailable. Associate leads/revenue only when valid tracking and attribution evidence exists. The next content iteration uses measured results and a new approval where needed.

Acceptance: approved draft -> scheduled job -> published receipt -> retrieved engagement observation -> client report. Prove one channel first; verify each additional platform and media format separately. Test expired credentials, partial publication, schedule timezone, duplicate clicks, edited-after-approval content, missing media and unknown provider outcomes. A user-approved test account/post is required only at the live publication step.

## 10. Coverage of every original defect

| Original issue | Planned resolution | Phase |
|---|---|---|
| HITL tasks absent in Cockpit | Shared task reader, durable IDs, server transitions and reconciled queue | 1 |
| Live report/connector contradictions | Evidence policy, one report snapshot, consistent scope/period | 0, 2, 3 |
| Social scan and reach assertions | Real backend attempts and measured coverage | 0, 5 |
| Ecosystem VERIFIED ambiguity | Scoped and timestamped capability states | 0 |
| No MRR calculation | Deterministic scenarios with sourced inputs | 4 |
| No fees/commercial proposal | Versioned catalogue and proposal | 4 |
| Unsupported heuristic precision | Claim-level provenance and no numerical fallback facts | 0, 2 |
| Generated social brief mismatch | Single campaign bundle and content validation | 5 |
| No end-to-end posting loop | Reuse and extend existing assets/publish adapters with schedule/receipts | 5 |
| No provider delivery ledger | Linked events, artifacts, approvals and delivery records | 1, 3 |
| Empty logs / missing social scan run | Server event stream for all actual and failed actions | 1, 5 |
| Report save/export provenance | Persist snapshot, render artifact, log distribution | 3 |
| Scheduler count/history inconsistency | Counters and history derived from actual durable jobs | 5 |
| No reporting provenance label | Source coverage and claim classification in preview and export | 2, 3 |
| PDF brand/layout defects | Brand tokens, actual logo, flowing pdfcn components and visual regression | 3 |

## 11. Final verification and rollout

Keep app changes behind per-workspace rollout controls. Backfill legacy data with explicit provenance limits and compare ledger counts before switching readers. A failed migration or render must leave existing records available. Do not certify production readiness from local unit tests alone.

Run focused contract and integration tests as each phase lands; finish with `npm run check` and `npm run build` on a clean checkout. Run browser acceptance on empty, partial-data and verified-data workspaces. Inspect actual downloads and confirm refresh/session continuity. Deployment-specific workers, migrations, storage policies and provider calls require separate runtime evidence.

Proposed bounded stress suite: 20 simultaneous local task submissions including duplicate keys, 10 two-brand report renders, concurrent approvals, worker termination mid-run, malformed/oversized inputs, rate limiting, expired credentials, interrupted downloads, and workspace/artifact-ID substitution. Use provider stubs for load; use separately authorized live smoke tests for external writes. Record environment, load, failure rate and p50/p95 timings before setting a capacity target.

Each release candidate must have an acceptance record containing run IDs, evidence references, artifact hashes, command results, browser captures and unresolved constraints. Production counters must exclude simulation attempts. Existing master-context launch blockers, including tenant isolation, auth inventory and billing security, remain release requirements and are not silently closed by this plan.

## 12. Decisions required at the relevant stage

- Before final proposal pricing: choose the active commercial catalogue/version. This does not block ledger, evidence, renderer or calculator development.
- Before customer-specific PDF sign-off: confirm any client override to the default Sigma light/orange brand, language and report requirements.
- Before live publishing verification: select the initial channel/account and approve the exact test artifact. Draft generation, adapter tests and schedule implementation can be prepared beforehand.
- During the pdfcn prototype: verify the actual deployment runtime and renderer packaging. Preserve the current React/Vite/Express architecture unless a concrete compatibility failure requires a change.

First implementation slice: remove false operational success states, connect the existing server approval ledger to the Cockpit, and prove one task through persisted events and a verifiable output. That establishes the foundation for the report, commercial and social workflows above.

## Sources and planning artifacts

- Corrected browser audit: [Growth OS user-journey test](../artifacts/growth-os-user-journey-stress-test-2026-10-01.md).
- Supplied PDF: `/Users/mac/Downloads/sigmatactix-tpl-omnichannel-executive-summary.pdf`.
- [Reporting logic post](https://x.com/ReydCronkwright/status/2051331021077963132), read in the browser.
- [Graph engineering article](https://x.com/imryven/status/2101412287013593420), read in the browser. Patterns are adapted, not adopted as executable instructions.
- [pdfcn repository](https://github.com/shadcn-labs/pdfcn) and [source-pinned adoption research](research/pdfcn-reporting-adoption-2026-10-01.md).
- Current local source and `MASTER_CONTEXT.md`; implementation facts above were inspected on 2026-10-01. Proposed record names, endpoints, effort and test loads are design choices, not existing verified capabilities.
