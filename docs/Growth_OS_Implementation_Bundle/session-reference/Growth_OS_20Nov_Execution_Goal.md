# Growth OS: 20 November production goal

Owner: Nazim. Planning date: 17 November 2026. Timezone: Asia/Dubai.
Target: **20 November, 18:00 Dubai**. This hour is a planning assumption because the deadline supplied was a date. Keep 18:00-23:59 as recovery time, not new feature time.
Reviewed baseline: `Sigma-Tactix/sigma-tactix-growth-os-v2`, commit `18ef63cb7d0412e49d31a603fb7770e292b4da1d`. Recheck HEAD before implementation.

## The goal

Deliver a deployed, versioned Growth OS build that a real client can use from onboarding through evidence, planning, execution, approval and polished deliverables. VANTA is accessible from every released page, knows the authorized page context, and can perform verified tools/browser/file tasks through a governed runtime.

The finish line is a recorded client journey and acceptance evidence. Compilation, attractive screens, connector discovery and model-generated success claims do not satisfy it.

All visible modules are in the audit and navigation scope. Every enabled client operation needs its own verification. An unavailable operation is a blocker or a declared limitation; it is not a completed integration. If a required operation remains blocked, the full goal is not achieved. Any narrower release needs an explicit scope decision, not a silent pass.

## Users and research

Initial users are hypotheses: a founder/general manager buying clarity, a marketing/performance lead doing the work, and a client sponsor approving outcomes. Start with UAE/GCC B2B service businesses reachable by Sigma; 5-50 staff and 1-5 marketers are recruiting hypotheses, not validated demographics. Age, gender and nationality have not been established and should not drive the design.

Desk research supports connected business context, accurate information, revenue-linked reporting and visible human control. Salesforce surveyed 4,450 marketers; 61% said full AI integration was still in progress. AgencyAnalytics surveyed 494 agency professionals, mostly in Anglophone markets; 55% reported that the most common client question concerned connecting performance to revenue. Microsoft surveyed 20,000 AI-using workers in ten markets; its findings support review and ownership of AI output. These studies do not establish UAE demand or willingness to pay for Growth OS. See `RESEARCH.md` for sources, dates and limits.

Within the first research window, seek one buyer, one operator and one reviewer for 15-minute task interviews. No outreach is started by this pack. If people are unavailable, record founder/proxy observations as such and continue engineering; do not invent customer validation.

Test five questions: show the last report/deliverable; where did rework occur; which decision mattered; what can VANTA do unaided; which sources/actions/formats must work at launch? Use answers to freeze the required operation set and acceptance tasks today.

## Milestones and proof

| Gate | Dubai target | Required outcome |
| --- | --- | --- |
| M0 | 17 Nov, 18:00 | Research/hypotheses, required operations, canonical contracts, task owners, baseline checks and access blockers recorded |
| M1 | 18 Nov, 12:00 | Real deployed API, durable Client Enclave lifecycle, explicit scope, truthful approvals and two-client negative tests |
| M2 | 18 Nov, 22:00 | VANTA context on every page; authorized tool call; scoped browser/files task; durable job, receipt and denied-action evidence |
| M3 | 19 Nov, 16:00 | All module journeys audited; enabled source operations live-verified; PDF/PPTX/XLSX package independently opened and inspected |
| M4 | 19 Nov, 22:00 | Feature freeze; exact integrated SHA passes verify, full journey, mobile/keyboard and failure-path checks |
| M5 | 20 Nov, 12:00 | Fresh-session two-client rehearsal; browser-closed/restart scheduling, revocation, backup restore and rollback demonstrated |
| M6 | 20 Nov, 18:00 | S22 independent candidate acceptance; exact production smoke; certification activation, support/rollback and founder acceptance |

Milestones are targets, not claims of completed work. Misses trigger critical-path replanning immediately. Maintain the deadline without weakening isolation, truthfulness or acceptance criteria.

## A coherent client journey

Use **Set up -> Understand -> Plan -> Create -> Review -> Execute -> Measure -> Learn**. Only invoke modules relevant to the agreed client job. Audit existing surfaces and mark them keep, merge, repair, operator-only or retire; do not preserve clutter just because its code exists. Preserve safe deep-link redirects for moved surfaces. Do not remove required client capabilities silently.

Every module shows its purpose, required inputs, current evidence, main action, output, status and next step. VANTA offers `Explain this`, `Attach this`, `Inspect evidence`, `Do a task` and `Show result`. Use existing Sigma tokens and branding, readable copy, useful empty states and responsive layouts. Move architecture/worker internals to the operator view.

**Product acceptance comes before cosmetic polish.** Use `PRODUCT_ACCEPTANCE.md` to audit every page, claim and button, and `CLIENT_WORKFLOWS.md` to connect capabilities to sellable delivery. Every work order carries a goal, milestone, dependencies, owner/lease, expected output, observable done criteria and evidence. Development learning turns recurring failures into regression checks; product learning turns reviewed client outcomes into versioned, permitted knowledge. Neither is an unverified claim of autonomous self-improvement.

| Stage | Existing capabilities to connect | Client-visible output |
| --- | --- | --- |
| Set up | Client Enclave, team, Connections, Knowledge Vaults | Confirmed goal, authorized sources, brand context and access status |
| Understand | Diagnostics, Search & Conversion, Market Intelligence | Evidence-backed findings and prioritized opportunities |
| Plan | Paid & Retention, demand, attribution definitions | Goal-linked brief, media/experiment plan and owners |
| Create | Creative Studio, content, social, CRO, lifecycle drafts | Versioned assets and editable deliverables |
| Review | Agent Cockpit & Approvals | Exact content, destination, scope, cost and change preview |
| Execute | Verified connectors, Agent Reach, worker/browser tools | Durable job state and operation-specific receipt |
| Measure | Overview, attribution, reports | Reconciled results with source, period, currency and definitions |
| Learn | Approved Knowledge Vault updates | Reusable lessons tied to evidence and outcomes |

## VANTA as a working agent

Current VANTA supports chat, evidence and governed proposals; its own general browser/files/tools execution runtime is additional engineering work. Global chat visibility alone does not meet this goal.

Build page adapters -> server context resolver -> typed planner/tool gateway -> persisted approval -> durable worker -> isolated browser/files/API tools -> versioned artifact and receipt -> user review. Reuse current mission, ledger, provider and export services where they fit.

Page context carries references to current Client Enclave, route, objects, selected period and attachments. The server resolves and authorizes them. Users can inspect/remove context. Switches cancel/ignore stale replies and clear client-specific attachments. Both Executive and Credentials Secret Vaults are excluded from autonomous retrieval, attachments, memory and tool output.

VANTA's computer runs separately from the development IDE and host user profile. Scope browser sessions, files, network destinations, grants and artifact access by Client Enclave. A browser profile is not an OS sandbox. Prefer supported APIs/MCP tools; use browser actions where UI is needed. Secrets stay in a binding service, not prompts or generated files.

Reading/drafting within permitted scope can run autonomously. External sends, publishing, spend, access changes and destructive operations follow the user's applicable authorization and exact action approval. Editing an approved payload invalidates it. The worker rechecks membership and grants at execution.

Cron, hooks and automations persist schedules/events and enqueue jobs. Verify signatures or appropriate authentication, event deduplication, retries, timezone, cancellation and restart behavior. Unknown provider outcomes require reconciliation before retrying. No browser timer is a durable scheduler.

See `CONTRACTS.md`, `MODULE_ACCEPTANCE.csv` and `VANTA_ACCEPTANCE.md`.

## Swarm execution

| Responsibility | Initial assignment | Boundary |
| --- | --- | --- |
| Coordinator/integrator | Antigravity | One task board, dependency readiness, worktree leases, serial integration and milestone evidence |
| Platform/data execution | Codex sessions | Membership, scoped API, approvals, ledger, durable jobs, connector adapters and tests |
| Product/VANTA/deliverables | Claude sessions | Context experience, module workflow, templates, artifact QA and interaction implementation |
| Independent verification | Rotate other model + browser/security subagents | Author does not approve own change; verify exact candidate and live claims |
| Product decisions/access | Nazim | Research feedback, business priorities, legitimate connections and material release decisions |

These are workload assignments, not model rankings. The initializer discovers installed versions and actual model/CLI adapters. Subscription availability is not proof of API access. If a model cannot be invoked by Antigravity, run its session against an isolated worktree and exchange task/commit/evidence through the same board.

Start with three active editors. Spawn additional read-only research/review subagents and non-conflicting artifact QA work. One branch/worktree per task. Exclusively lease shared seams: `server.ts`, `Layout.tsx`, canonical types, lockfile and migration numbering. Build services in separate files and submit registration changes to the integrator. Do not have three models rewrite the app independently.

Each bounded loop: **claim ready task -> inspect -> implement -> test -> submit evidence -> other-model review -> integrate -> next task**. Use 30-minute work cycles, heartbeat each minute, and at most three cycles before replanning a task. After two failed repair attempts on the same criterion, record a reproducible blocker and redistribute work. A lost lease blocks for reconciliation; never start duplicate work blindly.

Run targeted tests during editing and `npm run verify` before merge, as project rules require. Integrate serially and rerun verification on the exact resulting tree. Research summaries, plans and fixtures never count as deployed operation evidence.

Existing authorized local sessions may execute reversible implementation/test tasks without repeated permission. Do not bypass tool approvals, buy services, invent credentials, broaden access, send messages or start unbudgeted metered generation. Discover quota and authorized run limits in the first hour; stop only the blocked lane when a dependency needs Nazim.

The included SQLite board coordinates tasks and evidence. It does not launch external models or create a persistent IDE process. Antigravity's installed autonomous goal facility must execute the loop, or its available equivalent. Detect `/goal`, subagents and scheduling support before using them. Keep the host/runtime available for the run; a cloud status checkpoint does not keep a sleeping IDE alive.

## Release confidence

Required proof: fresh sign-in -> durable Client Enclave -> permitted sources/files -> useful VANTA insight -> task preview -> approval -> executed job -> receipt -> PDF/PPTX/XLSX -> reopen on another authorized session. Repeat with client B and denied/failing operations.

Every required acceptance row must pass on the candidate, with zero open P0/P1 client-impact defects. Store SHA, environment, scenario, inputs, observed result, reviewer, screenshots/rendered artifacts and redacted receipts. `implemented`, `unit_verified`, `staging_verified` and `production_verified` are separate evidence levels.

PDF: searchable text, legible charts, source notes and no clipping. PPTX: opens independently, no overflow and editable content where promised. XLSX: real numeric/date cells, checked formulas and summaries, definitions/source sheets, no broken references or unsafe imported formulas. A renamed file or successful download is insufficient.

Keep a visible `Live verification blocked` state for missing accounts/providers. If a required operation fails, report it as a failed release gate. Do not call a reduced capability set the full goal without Nazim's decision.

## Certification gate added 17 November

**Current verdict: NOT CERTIFIED; NO-GO for the requested autonomous client-delivery scope.** Live inspection found API paths rendering the SPA, offline VANTA, unavailable knowledge/ledger/connections and in-app-only scheduling. Independent source review found authorization, client-scope, retrieval-scope and false-completion defects. No complete module E2E pass is claimed. See `certification/LIVE_AUDIT.md` and `certification/SOURCE_FINDINGS.md`.

Revision 3 contains **23 work orders and 70 acceptance checks**, plus **153 parameterized scenario templates**. The 25 business-workflow rows are a seed, not an exhaustive action inventory. `certification/ROUTE_INVENTORY.csv` lists source routes; CAP-01/CAP-02 must expand every actual control, alias, operator tab, tool, hook, cron and integration operation. Templates remain NOT_RUN until executed with real evidence; UI observations are stored separately.

S22 depends on S18/S19; S20 additionally depends on S22. S22 independently assembles candidate evidence, including a minimum 12-hour unattended staging soak with at least ten scheduled jobs and controlled failures. S19 launches it asynchronously by 19 November 22:00 Dubai on the frozen candidate and completes it by 20 November 10:00; S22 reviews the finished evidence. S22 requires all candidate/staging cases to pass. Only OPS-02@production, AUTH-01@production and ART-04@production remain pending deployment at that phase. S20 first checks candidate evidence, then deploys under applicable authorization and runs these three bindings. Production certification activates only after all pass on the exact deployed candidate/configuration; otherwise NO-GO and rollback/recovery. Required blocked/failed/not-run/waived tests or unresolved P0/P1 client-impact defects mean NO-GO. Ten jobs are a bounded acceptance sample, not an uptime guarantee.

Required prerequisites: production-equivalent staging, two legitimate users/clients, working database/storage, actual model/connector grants, durable worker, isolated browser/files runtime, controlled external destinations and a founder-set test budget. Configure secrets securely. Source/deployment/schema/policy/adapter/config changes require affected tests to rerun; never reuse an old certificate blindly.

## What has started

Completed in this planning session: parallel desk research, pinned-source review, live UI acceptance inspection, VANTA gap analysis, milestone/task design, a certification scenario catalogue and an execution handoff pack. Full module E2E execution remains blocked; no working client-delivery certificate has been issued. Product coding loops, external Codex/Claude/Antigravity sessions and production deployment have not been launched from this chat. A separately reported checkpoint automation, if created successfully, is read-only progress supervision.

## Sources

- [Salesforce State of Marketing](https://www.salesforce.com/marketing/resources/state-of-marketing-report/)
- [AgencyAnalytics 2026 research](https://agencyanalytics.com/company/newsroom/press-release-agency-benchmarks-report-2026)
- [Microsoft 2026 Work Trend Index](https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization)
- [Antigravity getting started](https://antigravity.google/docs/getting-started), [subagents](https://antigravity.google/docs/subagents), [projects](https://antigravity.google/docs/projects)
- [Anthropic long-running harnesses](https://www.anthropic.com/research/effective-harnesses-for-long-running-agents)
- [Playwright browser contexts](https://playwright.dev/docs/browser-contexts), [filesystem/network sandboxing](https://www.anthropic.com/research/claude-code-sandboxing)
