# Release evidence and decision

## Candidate

Record exact commit, artifact/build hash, environment, public origin, applied migrations, sanitized configuration inventory and enabled operations. Freeze features on 19 November at 22:00 Dubai; blocker fixes may create a new candidate requiring affected evidence to rerun.

## Mandatory demonstrations

1. Fresh login, legitimate invite, durable Client Enclave creation and second-device/session resume.
2. Client A and B remain isolated through API, database policies, RPC, files, retrieval, browser sessions, jobs and exports. Invalid explicit scope is rejected.
3. Sources: actual selected account/property, normalized baseline, refresh/revocation/failure and freshness. Reconcile period/currency/definitions against provider evidence.
4. VANTA on every released page: inspect context, attach permitted objects/files, remove context, navigate and switch clients mid-response without stale output. Both Secret Vault classes remain excluded.
5. VANTA invokes an authorized typed tool, executes a scoped browser/file task, records receipt, exposes progress and cancellation, and rejects an unauthorized/injected action.
6. An exact approved action executes once. Editing/revoking approval blocks execution. Failed/unknown dispatch cannot become completed. Unknown external result is reconciled before retry.
7. Signed/authenticated hook once, duplicate/replay denied/deduplicated, malformed event visible. Schedule executes with browser closed; restart resumes eligible work; timezone and missed-run behavior verified.
8. Every module row in MODULE_ACCEPTANCE.csv has proof for each enabled operation. Anything required and blocked fails the full goal.
9. Generate PDF, PPTX and XLSX from the same immutable snapshot. Independently open/render. Check branding, source/period/currency, every page/slide, editable content, workbook formulas, safe imports and access controls. Save QA evidence.
10. Desktop/mobile/keyboard journey, loading/empty/stale/offline/error states, no console errors that break required work.
11. Exact integrated npm run verify and blocking secret/security checks; backup restore, monitoring/run correlation, worker restart, rollback and re-smoke.
12. Production deploy only under applicable authorization, using verified candidate. Observe build ID, liveness/readiness, authenticated operation, static deep link, valid API JSON and expected unauthorized responses. Confirm support owner and limitations.

## Evidence receipt

Each scenario: acceptance ID, task ID, exact SHA, environment, observed time, role/client fixture, inputs, command/exit or browser steps, output artifact/receipt hash, reviewer and limitation. Redact secrets and real customer content. Keep private evidence private; public GitHub is not a suitable destination for raw client data.

## Decision

GO: required rows pass, no unresolved P0/P1 client-impact defect, enabled providers have operation-level proof, candidate is recoverable and founder sees a working delivery package.

NO-GO: missing isolation, false execution success, unverified required tool, failed durable jobs, broken required artifact, or missing deployed evidence. Keep independent safe work moving; present the precise blocked capability and remaining work. Any narrower launch is a separate scope decision.

## Formal certification

Follow certification/METHOD.md. S22 issues candidate acceptance or NO-GO after complete operation coverage and REL-01 minimum twelve-hour, ten-job unattended staging soak with zero duplicate external effects, false completions or unresolved outcomes. S20 activates production certification only after matching deployed build/configuration and authenticated smoke. Initial source/UI findings are not completed scenario evidence. Scope, reviewers, status counts, evidence hashes and retest requirements are mandatory. A blocked/failed/not-run/waived required case prevents full certification.

## Explicit predeploy and production phases

S22 requires every candidate/staging-required case to PASS. It may issue candidate acceptance only, with the three explicitly named production bindings pending deployment: `OPS-02@production` (exact runtime identity/routing/readiness), `AUTH-01@production` (fresh authorized test login/scope/resume and denied foreign scope), and `ART-04@production` (authorized persisted test-artifact read and foreign denial). Their definitions are in SCENARIOS.json release_phases. This phase marker never changes a result to PASS and never permits production certification.

S20-A1 checks completed candidate evidence. S20-A2 deploys under applicable authorization and runs all three production bindings. Only after all pass may S20-A3 activate production certification. Failure means NO-GO and rollback/recovery. No other mandatory case can be deferred by this rule.

Soak scheduling: S19 starts REL-01 on the frozen candidate by **19 November 22:00 Dubai**, finishing by **20 November 10:00**, before M5/S22. S22 reviews completed evidence; it does not wait until its own start to launch twelve hours of work. Run the durable soak asynchronously under one owner, with coordinator heartbeats/checkpoints. Changes invalidating evidence require a rerun; missing the deadline remains a failed gate.
