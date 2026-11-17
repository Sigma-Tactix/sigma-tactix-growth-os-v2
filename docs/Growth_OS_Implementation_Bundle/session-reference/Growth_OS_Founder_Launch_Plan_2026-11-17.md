# Growth OS: founder launch plan

Date: 17 November 2026, Dubai. Status: proposed product and execution plan, ready for implementation.

**Decision: launch a managed Growth Intelligence service through a focused client portal. Keep the existing stack and prove one complete client workflow before expanding automation.**

Product promise: **Know what is working, decide what to change, and track the result, with evidence behind every recommendation.**

## 1. Evidence and limits

Reviewed the current public [Growth OS v2 repository](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2), pinned to commit `18ef63cb7d0412e49d31a603fb7770e292b4da1d`, and the rendered text of the selected deployed dashboard. The supplied ZIP is an older 4 November snapshot, commit `64b73266d8295c05c835f3dd7758fa02f31eaf04`.

The current commit's [CI run](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/actions/runs/43985948242) reports successful build, typecheck, tests, and security jobs. I inspected their step results. I did not rerun the application locally, perform a visual/mobile audit, test live provider credentials, or inspect deployed database policies and runtime configuration. Green CI establishes useful engineering evidence; it does not establish client readiness.

| Finding in current code or page | Consequence | First response |
| --- | --- | --- |
| [New-client wizard](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/blob/18ef63cb7d0412e49d31a603fb7770e292b4da1d/src/components/Layout.tsx#L838) calls `provisionWorkspace`; [WorkspaceContext](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/blob/18ef63cb7d0412e49d31a603fb7770e292b4da1d/src/contexts/WorkspaceContext.tsx#L104) creates a browser-only draft. A separate server create/list API already exists. | A client profile can look created without durable membership or cross-device access. | Connect the wizard and selector to the existing server lifecycle. |
| [apiFetch](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/blob/18ef63cb7d0412e49d31a603fb7770e292b4da1d/src/lib/api.ts#L16) attaches auth but does not itself attach the selected workspace. `requireAuth` in `server.ts` falls back to the caller's default when an explicitly requested workspace is invalid or inaccessible. | Visible selection and API target can diverge. This is a wrong-client execution risk to resolve, not proof of cross-client data leakage. | Require explicit server-issued workspace IDs for scoped operations; reject an invalid explicit selection. |
| [ActionQueueTab](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/blob/18ef63cb7d0412e49d31a603fb7770e292b4da1d/src/components/dashboard/ActionQueueTab.tsx#L143) calls `approveItem` after failed/non-successful social dispatch. That store marks the item `COMPLETED`. The call also uses bare `fetch` without the shared auth wrapper. | Approval can be displayed as completion without delivery. | Persist approval separately from execution and require receipts for completion. |
| [Scheduler](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/blob/18ef63cb7d0412e49d31a603fb7770e292b4da1d/src/pages/Scheduler.tsx) keeps schedules and history in component state. Its manual trigger records a queued local render. | Recurring delivery cannot be promised from this UI path. | Offer manual report delivery initially; expose scheduling only after a durable worker is verified. |
| [vercel.json](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/blob/18ef63cb7d0412e49d31a603fb7770e292b4da1d/vercel.json) declares a Vite static build and catch-all HTML rewrite; [DEPLOY.md](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/blob/18ef63cb7d0412e49d31a603fb7770e292b4da1d/DEPLOY.md) describes a separate Node deployment requirement. | A working SPA does not prove its API, callbacks, or worker are deployed. The current live topology remains unverified. | Record the actual topology and test real HTTP contracts on staging and production. |
| [CI configuration](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/blob/18ef63cb7d0412e49d31a603fb7770e292b4da1d/.github/workflows/ci.yml#L99) permits secret-scan failure and suppresses audit exit failures. [Isolation tests](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/blob/18ef63cb7d0412e49d31a603fb7770e292b4da1d/src/lib/workspaceIsolation.test.ts) simulate RLS with fake clients. | A green security job does not prove enforceable release gates or deployed isolation. | Make relevant failures blocking; add tests against a disposable real database. |
| Current dashboard labels benchmarks and samples honestly, but mixes them with client reporting, intake telemetry, AI runtime status, and infrastructure navigation. | Clients must interpret the system before they can use it. | Put client decisions first; move infrastructure to operator views. |

Preserve the existing work: authenticated routes, RLS-scoped helpers, onboarding field provenance, encrypted connector handling, durable ledger foundations, department hubs, and report rendering. The current report export service imports the executive PDF renderer; the older status document's claim that it is test-only is stale. Revalidate older blocker lists before creating duplicate work.

## 2. What to sell first

**Recommended starting segment, to validate:** founder-led GCC B2B service firms with existing acquisition activity, an accountable marketing owner, and access to one usable data source. This is a focus choice, not a claim about existing customers.

Start with three paid, founder-led pilots. Each covers one business, one primary objective, and one or two verified sources.

| Offer | Client receives | Boundary |
| --- | --- | --- |
| Initial Growth Diagnostic | Agreed goal, measurement gaps, evidence-backed baseline, three prioritized actions | Unsupported findings remain unknown; no invented audit precision |
| 30-day Managed Growth Pilot | Client portal, weekly decision brief, action ownership, approvals, end-of-pilot review | Human supervision and manual delivery where necessary |
| Ongoing managed service | Repeated measurement and improvement cycle | Offered after the pilot demonstrates repeatable delivery |

Choose a fixed pilot fee from delivery effort, provider costs, support load, and target margin. Do not copy embedded subscription prices into a new offer without reconciling the commercial catalogue. Track founder hours as a delivery cost.

Sell the agreed scope explicitly. Keep autonomous campaign changes, bulk outreach, unattended publishing, broad connector coverage, and self-serve SaaS outside the initial commitment. Expansion requires operation-specific proof.

## 3. Redesign around the client's weekly work

Use a quiet, readable interface: existing Sigma orange for the main action, neutral surfaces, clear type, consistent status labels, and restrained motion. Retain VANTA as the visible assistant with evidence and action previews. Keep the 3D brain as an optional knowledge exploration view.

| Main navigation | Human question | Contents |
| --- | --- | --- |
| Overview | What needs my attention? | Primary outcome, source freshness, top three insights, pending decisions, next review |
| Plan | What are we trying to achieve? | Goal, baseline, agreed targets, prioritized experiments and owner |
| Work | What is happening? | Deliverables and actions; studios open within the relevant task |
| Approvals | What needs my decision? | Exact proposed change, evidence, cost/risk, destination, approve/reject |
| Reports | What changed and what did we learn? | Weekly brief, period comparison, completed actions, exports |
| Knowledge | What does the system know? | Searchable Knowledge Vaults, sources, permissions and update dates |

Put Connections, Team, Billing and Preferences in Settings. Give operators a separate, permission-controlled view for runtime health, agent routing, architecture, costs and failures. Navigation visibility is not an authorization boundary.

Retain canonical project terms such as Client Enclave and Knowledge Vault. Add a short plain-language explanation where needed. Any terminology change should update `CONTEXT.md` and the associated contracts together.

### First screen

At the top: Client Enclave, reporting period, primary goal, last successful refresh. Then four blocks:

1. **Performance:** at most four agreed KPIs, each with unit, comparison period and source.
2. **Needs attention:** the three most consequential observations, each with a recommended next step.
3. **Work and decisions:** owner, status, due date and pending approvals.
4. **Next review:** what the team will evaluate and when.

An unconnected client sees a setup checklist and a useful empty state. Missing values display `Unavailable`, not zero. A verified zero remains zero. Benchmarks live in a separate reference view with source, market, date and assumptions.

Every insight follows: **Observation -> Evidence -> Interpretation -> Recommended action -> Owner -> Success measure.** Financial impact is an estimate unless measured, with its assumptions visible. Do not invent calibrated confidence percentages.

## 4. Onboarding and activation

| Step | Required result |
| --- | --- |
| Agree scope | Objective, KPI definition, baseline period, audience, responsible owner and commercial scope |
| Create access | Server-issued Client Enclave ID and verified membership; invite/resume works on another device |
| Add context | Confirm brand, offer, constraints and authorized Knowledge Vault documents |
| Connect evidence | Select exact property/account; verify permission, refresh and fetch for the supported operation |
| Review baseline | Reconcile dates, currency, attribution and totals with the source; record missing coverage |
| Activate | Client reviews first brief, assigns one action and schedules the first review |

Separate signing in from connecting marketing data. Current Google sign-in requests Analytics and `adwords` scopes, while its UI describes both as read-only. Google's scope catalogue describes `adwords` as permitting management of Ads data. Request connector consent at the appropriate step, explain the actual scope, and enforce read-only pilot behavior server-side. A platform permission is not an instruction to execute writes.

Activation means **a verified baseline and an acknowledged next action**, not an account registration. If connectors are blocked, an explicitly labelled, validated manual import can support the pilot. It must retain source file, period, mapping and review history.

## 5. A shared model for humans and agents

Humans use screens; agents use typed tools. Both read and modify the same authorized records through the same services. Chat history, localStorage and UI role switches must not become authorities for membership, billing, approvals or execution.

Use these linked records: Client Enclave, Goal, Evidence Snapshot, Insight, Action, Approval, Run, Artifact and Report Snapshot. Reuse existing types and ledger tables where suitable before adding new ones.

| Record | Minimum contract |
| --- | --- |
| Evidence | Workspace ID, source/account ID, captured time, reporting period, metric definitions, data state, source reference |
| Insight | Evidence references, observation, reasoning, uncertainty, suggested action |
| Action | Goal, owner, intended destination, exact payload/version, permission requirement, budget limit, success measure |
| Approval | Authorized approver, approved payload hash, limits, expiry, decision time |
| Run | Action version, idempotency key, attempts, state, timestamps, error or receipt |
| Report | Immutable source snapshot references, period, metric definitions, narrative, artifact version |

Data state vocabulary: `verified`, `stale`, `manual`, `benchmark`, `simulated`, `unavailable`. Connection state is separate from data freshness and job state.

Execution lifecycle: `draft -> pending_approval -> approved -> queued -> running -> succeeded/failed`. Retain rejection, cancellation and blocked states. Approval is consent to an exact version; editing it requires renewed approval. A provider accepting a job is not proof of delivery. An executed action is not proof of improved marketing performance.

Agent policy: permitted reads, drafts and recommendations may run within scope and cost limits. Publishing, sending, spend changes, billing/access changes and destructive operations require the applicable approval. Secret Vaults remain excluded from autonomous agent retrieval. Authorization must be rechecked at execution time, including after membership or connector revocation.

### Compact agent task contract

```yaml
id: GO-03
objective: Make approval and execution status truthful and durable.
depends_on: [GO-02]
inputs:
  - src/components/dashboard/ActionQueueTab.tsx
  - src/lib/actionQueueStore.ts
  - src/lib/executionLedgerStore.ts
outputs:
  - Server-owned approval transition and client integration
  - Failure-path and duplicate-submit evidence
boundaries:
  - Preserve RLS and workspace membership checks
  - No live publishing or provider spending
acceptance:
  - Approval does not mark a run succeeded
  - A 401, 403, 500 or timeout never produces a completion badge
  - Reload and a second authorized device show the same status
  - Repeating approval cannot create duplicate external work
done_evidence:
  - Commit, relevant tests, verify result, preview and limitations
```

## 6. Engineering approach

Keep React, Vite, Express and Supabase. Use a modular monolith with one controlled deployment path. Extract relevant routes/services while fixing workflows; a full gateway rewrite should not delay a verified pilot.

Recommended starting topology: a managed Node/container service serves the existing Express app and SPA under one origin, backed by Supabase. A durable queue and worker execute asynchronous jobs. If keeping the Vercel frontend, explicitly route API requests to the backend and verify callbacks and auth on that topology. Vercel supports Express, so the issue is configuration and verification rather than platform inability.

Workers require durable jobs, retries with backoff, leases, per-workspace limits, cancellation, attempt logs and idempotency. Use a restricted worker identity and scoped execution functions; never solve background execution by broadly bypassing RLS. Record unknown external outcomes for reconciliation before retrying.

Ship a capability registry per operation: supported, configured, verified, last successful operation, freshness and limitation. A connector logo or saved credential is insufficient. For the pilot, select GA4 plus the client's primary paid channel only after live verification. Manual reporting can precede scheduled distribution.

## 7. Ordered implementation backlog

Owners below are responsibilities, not claims about current staffing. Each item becomes one focused PR or a small linked sequence. P0 means required before external pilot use of the affected workflow.

| ID | Priority / owner | Deliverable | Acceptance / dependency |
| --- | --- | --- | --- |
| GO-01 | P0 / Engineering | Verify deployment topology; record build SHA; add deployed smoke checks | HTML for SPA, JSON for API; expected unauthenticated 401; unknown API is JSON 404; authenticated DB read/write works; rollback demonstrated |
| GO-02 | P0 / Engineering | Server-backed Client Enclave lifecycle and explicit scope | Build on existing `/api/workspace/manage`; persist profile and membership; second-device resume; scoped requests carry server-issued ID; invalid explicit scope fails rather than silently targeting default. Depends on GO-01 |
| GO-03 | P0 / Engineering | Durable approval/run lifecycle | Implement the task contract above; remove success-on-failure behavior. Depends on GO-02 |
| GO-04 | P0 / Engineering | Real authorization tests and blocking security gate | Test two users/two workspaces against disposable Postgres, API, RPC and storage; test revocation and Secret Vault exclusion; scan failures block; high-risk dependency exceptions require documented owner and expiry. UI role derives from membership; remove hardcoded developer credentials and rotate if reused |
| GO-05 | P0 / Engineering + Delivery | One verified source-to-baseline path | Account selection, OAuth expiry/revocation, freshness, import validation, reconciled totals, dates/currency and missing-data behavior. Depends on GO-02 and GO-04 |
| GO-06 | P1 / Product + Engineering | Simplified client shell and overview | Six destinations; operator-only infrastructure; live, unavailable and stale states; keyboard and mobile acceptance; first-time user identifies next action without a walkthrough |
| GO-07 | P0 / Delivery + Engineering | First weekly decision brief | Use existing report snapshot/export path; source-backed findings, three actions, owner and immutable report; fresh session export works; client acknowledges next action. Depends on GO-03 and GO-05 |
| GO-08 | P1 / Engineering | Durable scheduled delivery | Survives browser closure, worker restart and duplicate triggers; correct timezone; verified provider receipt; failures visible. Until complete, manual delivery remains explicit |
| GO-09 | P0 / Founder + Delivery | Pilot operating pack | Agreed scope, fee, named support contact, onboarding checklist, access register, cancellation/export/deletion process, review cadence and internal cost tracking |
| GO-10 | P0 / Founder + Engineering | Pilot release evidence and rehearsal | Exact release SHA and migrations, GO-01 to GO-07/09 acceptance evidence, two-client rehearsal, backup restore exercise, rollback, monitoring and capability boundaries. Enable only workflows with evidence |

Proposed sequence, not a delivery guarantee:

- **Week 1:** freeze launch scope; GO-01, GO-02, immediate GO-03 fix, start GO-04.
- **Week 2:** complete isolation evidence and one verified data path; begin new shell.
- **Week 3:** finish overview and decision brief; rehearse onboarding and manual delivery.
- **Week 4:** admit up to three pilots sequentially after release gates; observe each before the next. Scheduling can follow without blocking a manually delivered pilot.

Dates move when acceptance evidence is missing. Review progress by client workflow completed, not module count or number of agent outputs.

## 8. Release and commercial scorecard

Before admitting client one, demonstrate: sign-in -> durable Client Enclave -> correct source -> reviewed baseline -> insight -> authorized action -> recorded result -> report. Repeat with a second client and verify separation, refresh, failure and revocation paths.

| Proposed pilot target | Measurement |
| --- | --- |
| First useful brief within one business day after usable access arrives | Verified-access time to client-reviewable brief; separately record client/provider delays |
| Every displayed performance figure is traceable | Count missing source/period/definition references; target zero |
| Every completed external action has a receipt | Completed runs missing required evidence; target zero |
| Every pilot receives a weekly decision review | Delivered and acknowledged reviews / scheduled reviews |
| Delivery is commercially repeatable | Fee less provider/hosting costs, delivery labor and support; measure renewal intent and actual renewal separately |

Do not promise a growth uplift before establishing baseline quality and a measurement window. Keep reporting consistency separate from incrementality or causal attribution.

## 9. Instructions to hand to Antigravity or Codex

```text
Implement one Growth OS launch ticket at a time from this plan.
Read AGENTS.md and relevant domain contracts. Recheck findings against the current
branch; this review is pinned to 18ef63c and may become stale.
Use one focused branch and PR per task. Reuse existing services and migrations.
Keep the current stack. Start with GO-01, then GO-02 and GO-03.
Preserve RLS, credential encryption, Secret Vault exclusions and approval gates.
Treat the selected Client Enclave as explicit request scope; never silently write
to another workspace. Server membership is authoritative.
Do not replace missing data with samples, simulated success or invented metrics.
Add meaningful tests for the changed failure paths. Run npm run verify before merge.
For each PR report: changed behavior, acceptance evidence, migration/config needs,
rollback approach and remaining limitations. Do not deploy or run paid external
actions as part of this implementation task.
```

Maintain one short `PRODUCT.md`, the canonical `AGENTS.md`, typed contracts, the active backlog, and a release evidence record. Generate capability/status summaries from code and checks where possible. Keep historical narrative in an archive instead of requiring every human and agent to reread it.

### Primary technical references checked

- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express): supported deployment modes, static asset behavior and scheduled tasks.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): database-enforced policies and privileged key boundaries.
- [Google OAuth scope catalogue](https://developers.google.com/identity/protocols/oauth2/scopes): actual `adwords` permission description.

No repository changes, deployments, client invitations or external publishing were performed in preparing this plan.
