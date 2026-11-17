# Growth OS: implementation guide and session handoff

Prepared for Nazim, 17 November 2026. Target: **20 November 2026, 18:00 Asia/Dubai**.

**Current verdict: NOT CERTIFIED.** This guide consolidates the session's research, product decisions, work orders, source/live findings and verification sequence. It does not claim implementation workers have started or defects have been repaired.

## 1. Start here

1. Open the existing current checkout of [Sigma-Tactix/sigma-tactix-growth-os-v2](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2) in Antigravity. Preserve local changes, branches and any running task board. Do not replace the checkout with the older uploaded source ZIP.
2. Extract this implementation bundle into a temporary folder. Its `docs/release-2026-11-20/` directory contains the revision-3 execution kit plus this guide's supplementary records. Review/copy that directory into the checkout without overwriting newer work or an active board. Adding the pack to Git is an implementation step, not something performed by this guide.
3. Read the repository's `AGENTS.md` and `CONTEXT.md`, then `docs/release-2026-11-20/START_HERE.md`, this guide, `GOAL.md`, `TASKS.md` and `certification/LIVE_AUDIT.md`.
4. Give the coordinator the short prompt in section 3. It should detect installed goal/session capabilities rather than assume a slash command exists.
5. Keep the IDE/host available. A cloud checkpoint can supervise progress; it cannot keep a sleeping local IDE running or launch external models on its own.

## 2. Product outcome and operating rules

Deliver a client journey: **Set up -> Understand -> Plan -> Create -> Review -> Execute -> Measure -> Learn**.

The app must support a useful paid job, not require clients to navigate every studio. Initial users are the founder/buyer, marketing operator and client reviewer. UAE/GCC B2B services is the starting-market hypothesis; demographics, willingness to pay and company-size assumptions remain unvalidated. Seek short buyer/operator/reviewer interviews while engineering continues; label founder/proxy feedback honestly.

Three acceptance workflows:

| Client job | Sequence | Accepted output |
| --- | --- | --- |
| Growth diagnostic | Brief, evidence, analysis, priorities | Sourced PDF, editable deck and action workbook |
| Campaign delivery | Brief, research, plan, assets, review, approved delivery | Versioned campaign package and real execution receipts where publishing is included |
| Recurring growth management | Refresh, reconcile, explain, decide, execute, measure | Verified report and action-result history, with reusable approved lessons |

Every retained page/control needs a purpose, prerequisite, meaningful result, evidence and next step. Classify each as keep, merge, repair, operator-only or retire. Preserve safe deep links. Architecture, runtime diagnostics and technical worker details belong in operator views. Remove unsupported accuracy/activity claims; distinguish examples, benchmarks, estimates, simulations and measured results.

Use the same server-owned records for people and agents. **Approved, executed, delivered and measured business impact are different states.** VANTA is accessible on every released page, receives only authorized context and returns inspectable results. A visible chat dock alone is insufficient.

## 3. Paste this into the Antigravity coordinator

```text
Execute the release goal in docs/release-2026-11-20/prompts/COORDINATOR.md.
Read AGENTS.md, CONTEXT.md, GOAL.md, TASKS.md, tasks.json,
IMPLEMENTATION_GUIDE.md, BLOCKER_REGISTER.csv, CHECKPOINT_NOTES.md,
and certification/LIVE_AUDIT.md plus SOURCE_FINDINGS.md.
Target: 20 November 2026, 18:00 Asia/Dubai.

Preserve existing work and reconcile any active board before initialization.
Recheck HEAD, installed model adapters, staging, quotas and existing sessions.
Start S00/S01/S03, then freeze S02 contracts and ownership.
Use one coordinator, at most three editors, isolated task worktrees and
one shared absolute board path. Claim only dependency-ready work.
Invoke actual available Codex/Claude/Antigravity sessions; record session IDs.
Do not describe an uninvoked model or catalogue capability as running.

Fix shared routing, client scope, authorization and false completion before
controlled provider writes. Audit every route/control/operation. Keep
independent ready work moving while access-blocked lanes wait.
Use bounded loops, independent review and exact-SHA evidence.
Do not drop required capabilities or weaken acceptance to meet the date.
Prepare a reviewable release candidate; apply the current authorization
before deployment or external side effects. Report concrete blockers.
```

Use `/goal` only if the installed version supports it. Otherwise use that version's supported goal workflow. The task board coordinates ownership; it is not a model launcher, permission system or distributed scheduler.

## 4. Initialize once and prevent duplication

**Owner: coordinator/integrator.** Discover actual Node/npm/Python versions, adapters, session IDs, quota, staging, browser runtime and service readiness. Record configuration presence/status without recording secrets. Recheck HEAD and local changes; reviewed baseline is `18ef63cb7d0412e49d31a603fb7770e292b4da1d`.

Run the board utility's tests and help before using it. From the release directory:

```bash
python3 -m unittest discover -s tools -p test_sprint_board.py -v
python3 tools/sprint_board.py --help
```

For a genuinely new board, the initializer uses the documented `init` command with `tasks.json`, the absolute product checkout and one absolute SQLite path in a central, ignored local runtime directory. If a board already exists, preserve its database/leases and reconcile revision changes. Do not initialize a second coordinator or overwrite its state. Distributed machines require a server-owned coordinator rather than a SQLite file on cloud sync.

Each task has one owner, branch/worktree, declared shared-file resources, dependencies, acceptance and evidence. Lease `server.ts`, `Layout.tsx`, canonical types, migration numbering and lockfile changes consistently. The utility cannot protect undeclared writes.

Initial lanes, subject to actual adapter availability:

| Lane | Initial responsibility |
| --- | --- |
| Antigravity coordinator | Dispatch, dependencies, board, serial integration and milestone decisions |
| Codex platform/data | Identity, API scope, authorization, providers, approvals, ledger, worker and isolation |
| Claude product/VANTA | Context experience, concise module sequence, templates and deliverables |
| Independent QA/review | Exact-build acceptance, security, browser/mobile and artifact inspection |
| Nazim | Buyer/operator feedback, legitimate service access, controlled targets, cost cap and material release decisions |

Loop: **claim -> inspect -> build -> test -> independent review -> integrate -> record lesson -> next task**. Use 30-minute work cycles, minute heartbeats and at most three cycles before replanning. Two repeated failed repairs require a reproducible blocker/replan. Expired leases require reconciliation before reassignment. Do not reuse a stopped worker's files blindly.

## 5. Remove shared blockers first

Detailed rows and closure tests are in `BLOCKER_REGISTER.csv`; source locations are in `certification/SOURCE_FINDINGS.md`.

| Order | Tasks | Repair and required proof |
| --- | --- | --- |
| 1 | S04 | Real deployed API topology; health/authenticated routes return proper representations. Record frontend/API/config identities. SPA rendering is not an API pass. |
| 2 | S05/S06 | Server-issued Client Enclaves and membership; explicit selected-client requests; invalid/foreign scope fails instead of falling back. Reopen on another session. |
| 3 | S07/S10/S17 | Durable truthful approvals; secure social mounts; fail closed on missing ledger/approval; step exhaustion is incomplete. No failed request or fake adapter receipt can mean delivered. |
| 4 | S09/S10/S11/S17 | Authorized VANTA page context and retrieval; Secret Vault exclusions; isolated browser/files/process/network runtime; per-run identity and symlink tests. |
| 5 | S08/S12/S13 | Real operation-specific providers, persisted receipts, durable worker, authenticated hooks/cron, deduplication, recovery and revocation. |

Platform and security fixes are engineering work. Missing account access blocks only the affected provider lane; it does not prevent independent UI inspection or other ready implementation work.

## 6. Establish test prerequisites

Create an access/readiness register with these fields: operation, provider, environment, account identity, grant/scope, configuration status, quota/cost cap, controlled destination, owner, blocker, next action and verification evidence. Never store raw keys in this register.

Needed:

- Production-equivalent staging and exact frontend/API/worker/schema/policy/configuration identities.
- Two legitimate users/roles and two Client Enclaves with harmless test documents and sentinel records.
- Working database, object storage and verified migrations in the tested environment.
- Required model, embedding, image, video, analytics, advertising, CRM and delivery grants, only for operations being promised.
- Durable worker and isolated browser/files runtime with authenticated supervisor access.
- Controlled email/social/CRM/calendar/ad destinations for the operations requiring external effects.
- Founder-set provider budget cap and a documented run limit.

Use protected configuration. Do not paste secrets into chat, prompts, logs or Git. An unconfigured UI does not prove which secrets are absent from the actual host. Verify presence safely. A subscription is not API authorization. Do not purchase credits, broaden permissions or publish to real client destinations implicitly.

## 7. Audit and repair every module

**Owners: product + platform; acceptance owner: independent QA.**

Start with `PRODUCT_ACCEPTANCE.md`, `CLIENT_WORKFLOWS.md`, `CONTROL_INVENTORY.csv`, `certification/ROUTE_INVENTORY.csv`, `MODULE_ACCEPTANCE.csv` and `BLOCKER_REGISTER.csv`. The initial inventory contains 45 explicit patterns plus the catch-all; suite tabs do not establish direct-route coverage. Expand it from the current runtime, including aliases, admin tabs, export formats, provider actions, tool schemas, hooks and cron triggers.

For every control record its route, user purpose, prerequisites, exact effect, source, permission, cost, output, next step, disposition and acceptance ID. Preserve source references. Separate live observation, source defect, missing capability, missing access and unexecuted test. An empty editor is not proof generation is broken.

For each module execute:

1. Valid input -> actual execution -> usable output -> persisted result -> independent readback.
2. Invalid input, unavailable dependency, expired/revoked grant and malformed response.
3. Unauthorized user/client and forbidden context; rapid Client Enclave switching.
4. Reload, another authorized session and restart where applicable.
5. Double-submit, cancellation, timeout and ambiguous provider outcome; reconcile before retry.
6. Page-specific VANTA attachment/context, cited explanation, approved task and result handoff.
7. Keyboard/mobile, useful empty/error states and honest claims.

All module groups remain required: dashboard/diagnostics; Knowledge Vaults; editorial/image/video/content engine; social creation/listening/publishing; SEO/AEO/CRO; intake/outreach; paid/email; competitive intelligence/simulation; attribution/reports; connections; cockpit/Reach/scheduling; VANTA/Living System; client/admin/models/prompts/mailboxes/MCP/audit/learnings; architecture/harness/preview and navigation aliases. Where billing is enabled, verify test-mode subscription/webhook behaviour.

Known priority examples: repair dashboard colour consistency and remove home-page sample clutter; remove unsupported agent accuracy/ACTIVE claims; fix simulator API failure; repair social authorization/fake receipts; fix approvals after HTTP failure; restore knowledge/ledger; wire required renderers; replace in-app scheduling; reconcile report summary/table; restore lecture-deck dependencies and remove silent acceptance skips.

## 8. VANTA and client deliverables

Follow `VANTA_ACCEPTANCE.md` and `CONTRACTS.md`:

Page/object/period references -> server authorization -> typed planner/tool gateway -> exact persisted approval where required -> durable worker -> isolated browser/files/API -> artifact + receipt -> review.

Test stale context, client switch mid-stream, stop/retry, attachment removal/expiry, memory sharing/unsharing, source revocation and prompt injection. Current source attachments are process-local/expiring; XLSX ingestion is unavailable. Do not imply XLSX input support because XLSX export exists.

Every recommendation follows **Observation -> Evidence -> Interpretation -> Action -> Owner -> Success measure**.

Deliver PDF/PPTX/XLSX from one immutable reconciled snapshot. Independently inspect every PDF page and deck slide; check editable content where promised, readable charts, source notes and overflow. Check workbook cell types, formulas, dates, totals, definitions and safe imported values. Verify private downloads and second-session reopening. A filename, successful download or export-library import is not acceptance.

## 9. Milestones and release sequence

All times Dubai. Targets are unchanged; a missed gate requires critical-path replanning, not retroactive passing.

| Gate | Target | Tasks / proof |
| --- | --- | --- |
| M0 | 17 Nov 18:00 | S00/S01/S03/S02: research/hypotheses, required operations, full inventory start, contracts, owners, baseline/access blockers |
| M1 | 18 Nov 12:00 | S04-S07: real API, durable client lifecycle, explicit scope, truthful approvals and two-client negatives |
| M2 | 18 Nov 22:00 | S08-S12: VANTA context/tools, isolated computer, durable worker/cron/hooks and receipts |
| M3 | 19 Nov 16:00 | S13-S16: real source operations, concise modules, complete module journeys and inspected artifacts |
| M4 | 19 Nov 22:00 | S17/S18/S21: security, fresh-session full journey, learning evidence and exact-SHA freeze |
| M5 | 20 Nov 12:00 | S19 + completed rehearsal: recovery/revocation/restore/rollback and finished unattended test |
| M6 | 20 Nov 18:00 | S22 then S20: independent candidate acceptance, authorized deployment, exact production smoke and founder acceptance |

Task numbers are not a serial execution order: honor `tasks.json` dependencies. S04 can follow S03 while other ready M0 work continues. S22 depends on S18/S19 and S20 also depends on S22.

Start the minimum **12-hour unattended staging soak by 19 November 22:00**, on the frozen candidate, to finish by **20 November 10:00**. Run at least ten scheduled jobs, browser closed, with worker restart and controlled failure. Require no duplicate effects, false completions or unresolved delivery states. Independently review the finished evidence. Changes invalidating acceptance require affected tests and any invalidated soak to rerun. A bounded soak is not an uptime guarantee.

Stage acceptance comes before deployment. Only the three production bindings identified by the existing certification method may remain pending at candidate acceptance: OPS-02@production, AUTH-01@production and ART-04@production. Activate production certification only after those pass on the exact deployed candidate/configuration. Use the evening for recovery, not new features. Follow the existing coordinator's stop deadline of 20 November 23:59 Dubai.

## 10. Definition of done and progress reports

Record levels separately: **planned -> implemented -> unit/integration tested -> staging verified -> production verified**.

A task closes only with an exact commit, environment/config identity, scenario/inputs, expected versus actual result, reviewer, logs and redacted artifact/receipt references. Store private evidence outside publicly tracked files; the board's evidence path checks require files inside the checkout, so use an ignored private evidence directory and publish only redacted summaries. Board evidence validation is not independent proof a command ran.

Run targeted tests during work and `npm run verify` before integration. Rerun on the exact integrated tree. Required module/security/recovery checks must pass beyond CI. Every mandatory FAIL, BLOCKED, NOT_RUN or WAIVED result, or unresolved P0/P1 client-impact defect, prevents full certification. A narrower release requires Nazim's explicit scope decision.

Progress report: exact SHA; real session IDs; task owners/status; acceptance passed/failed/blocked/not-run; critical path; missing access owner; quota/cost; next action; time to next gate. Never equate a skill catalogue, test definition, successful build, mock result or unavailable operation with delivered capability.

Development learning: reproduced failure -> regression -> reviewed repair. Client learning: approved result -> versioned permitted lesson -> correct later retrieval. Neither is proof of autonomous self-improvement merely because a panel says learning.

## 11. File map and references

| Resource | Use |
| --- | --- |
| `GOAL.md`, `TASKS.md`, `tasks.json` | Goal, milestones, 23 work orders, dependencies and 70 acceptance checks |
| `prompts/COORDINATOR.md`, `WORKER.md`, `REVIEWER.md` | Coordinator, bounded implementation and independent review instructions |
| `tools/sprint_board.py`, `tools/README.md`, tests | Task claims, leases, locks and evidence consistency |
| `RESEARCH.md` | Research sources, user hypotheses and limits |
| `CONTRACTS.md`, `VANTA_ACCEPTANCE.md` | Shared records, authorization and VANTA computer acceptance |
| `PRODUCT_ACCEPTANCE.md`, `CLIENT_WORKFLOWS.md` | Page/control usefulness and paid client outcomes |
| `MODULE_ACCEPTANCE.csv`, `CONTROL_INVENTORY.csv` | Seed inventories to expand, not completed coverage |
| `certification/LIVE_AUDIT.md`, `LIVE_OBSERVATIONS.json` | Live findings and observation boundaries |
| `certification/SOURCE_FINDINGS.md` | Eleven source findings, file/line references and acceptance |
| `certification/SCENARIOS.json`, `METHOD.md` | 153 parameterized scenario templates; bind to real operations and evidence |
| `certification/ROUTE_INVENTORY.csv`, `MODULE_COVERAGE.csv` | Route/control and module coverage status |
| `EVIDENCE_TEMPLATE.json`, `RELEASE_RUNBOOK.md` | Acceptance receipt and release/recovery sequence |
| `BLOCKER_REGISTER.csv`, `CHECKPOINT_NOTES.md` | Consolidated blockers and exact-SHA CI caveats from this session |

The earlier four-week founder plan is background only; this 20 November goal supersedes its schedule. The implementation bundle preserves revision-3 task definitions; supplementary registers do not mark tasks passed or silently change the task schema.

Official references already used in this session; check installed/current behaviour before implementation:

- [Antigravity getting started](https://antigravity.google/docs/getting-started) and [subagents](https://antigravity.google/docs/subagents).
- [Long-running agent harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents).
- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express).
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Google OAuth scopes](https://developers.google.com/identity/protocols/oauth2/scopes).
- [Playwright browser contexts](https://playwright.dev/docs/browser-contexts).
- [Salesforce State of Marketing](https://www.salesforce.com/marketing/resources/state-of-marketing-report/), [AgencyAnalytics research](https://agencyanalytics.com/company/newsroom/press-release-agency-benchmarks-report-2026), [Microsoft Work Trend Index](https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization).

No repository modifications, external IDE workers, provider spending or deployments were performed in preparing this handoff.
