# Growth OS User-Journey Stress Test

**Date:** 2026-10-01 (Asia/Dubai)  
**Environment:** `http://localhost:3000` in the user's existing Chrome session  
**Workspace:** Sigma Tactix (HQ)  
**Test posture:** Browser-driven end-user journey. No external social post, reply, message, connector configuration, or destructive action was performed.

**Correction after user review, 2026-10-01:** The PDF download succeeded. The user supplied `/Users/mac/Downloads/sigmatactix-tpl-omnichannel-executive-summary.pdf`; its two pages and creation timestamp (17:49:23 +04) match the export action. Both pages were rendered and visually inspected. The remaining PDF defects are brand mismatch, overlapping action-title/impact text, unsupported claims, and missing evidence links. The original session was an exploratory workflow test, not a concurrency/load stress test. Subsequent source inspection also confirms that Save Report only displays a toast, the Cockpit uses local approval state, and Social Sync is a timed success notification. Initial Agent Reach unavailability followed by a completed doctor result does not establish a lasting runtime failure.

## Scenario

A brand wants to:

1. Identify missing MRR and the revenue leaks causing it.
2. Receive strategic solutions, estimated duration, and fees.
3. Create and actively distribute social content to build traction and engagement.

The service provider wants to see:

1. What was delivered and how.
2. What was created or run.
3. Clear task and execution logs.

## Executive result

The app can create a heuristic diagnostic, a 90-day roadmap, draft social assets, and a report configuration. It does not currently complete the requested commercial or operational journey reliably.

The largest blockers are:

- No missing-MRR calculation or fee proposal.
- Diagnostic tasks claim to enter HITL review but do not appear in the Agent Cockpit; backend data loss was not established.
- Social generation does not faithfully use the supplied topic across the carousel, caption, and X thread.
- No connected end-to-end publish/schedule flow was available.
- Several screens make mutually contradictory “live,” “verified,” and execution claims.
- Provider logs do not reconcile with the actions completed during the test.

## Actions and observed results

| # | User action | Observed result | Evidence/status |
|---|---|---|---|
| 1 | Opened Growth Diagnostics for `sigmatactix.com` | Existing score was 68/100 with 8 findings and three strategies | Visible in browser |
| 2 | Expanded diagnostic evidence and roadmap | Displayed 8 findings and a three-phase, 90-day plan | Visible in browser |
| 3 | Ran a fresh diagnostic | Score changed to 78/100; result was labelled “Heuristic findings - verify before execution”; 6 findings and a revised 90-day roadmap were generated | Run completed with success toast |
| 4 | Selected “Build discoverable authority” | Agent mix updated to SEO & Authority, Marketing, and Audit Diagnostic agents | Visible in browser |
| 5 | Sent the strategy to HITL review | Diagnostics said 3 tasks were awaiting approval | Success toast and three local task statuses |
| 6 | Opened Agent Cockpit approvals | Cockpit showed `0 Pending Review`; the three tasks were absent from this view | Observed UI mismatch; source inspection shows local state disconnected from the server ledger |
| 7 | Opened Agent Cockpit global logs | Global, all-level log view said no telemetry records matched | No trace for the diagnostic or queued tasks |
| 8 | Generated a LinkedIn carousel using `How to Find Missing MRR: 5 Revenue Leaks and a 90-Day Recovery Plan` for B2B SaaS founders | A four-slide carousel was created and the run counter increased from 1 to 2 | Creation succeeded, content fidelity failed |
| 9 | Opened X Thread output | X thread remained the old preset “5 invisible digital cracks” content and included unsupported statistics | Stale output; ignored new topic |
| 10 | Inspected Reporting Scheduler | Scheduler supports PDF/PPTX/CSV report delivery only; no social-post cadence or generated-campaign handoff was exposed | Capability gap |
| 11 | Ran Social Listening “Sync Social Feeds” | Toast claimed 14 sources were scanned and 0 PR emergencies found | Completion toast only |
| 12 | Rechecked Social Listening run history | Run count stayed at 1 and only the older 04:40 run remained | New scan not logged |
| 13 | Opened Agent Reach | Initially showed runtime unavailable, 0 channels, and a disabled doctor action | Runtime unavailable state |
| 14 | Navigated away after doctor activity | Toast later claimed 15 channels scanned: 5 ready, 3 warnings, 7 unavailable | Asynchronous transition; loading/error handling needs verification, not proof of permanent failure |
| 15 | Inspected Connector Hub | LinkedIn Pages, X API, Meta/Instagram, and Reddit organic connectors were available only as “Configure & Connect” | No verified publishing connector in this journey |
| 16 | Opened Executive Reports | Report claimed live attribution across eight active streams, $84,250 spend, $480,780 revenue, and 4,782 conversions | Contradicts connector evidence |
| 17 | Saved report | App confirmed it saved the report configuration | Subsequent source inspection: toast only, no persistence in this handler |
| 18 | Exported Executive Summary PDF | PDF was downloaded successfully and subsequently supplied by the user | Confirmed two-page, 33,779-byte A4 PDF; remaining issues are visual quality, brand fidelity, data provenance, and report logic |

## What was created or run

### Created

- Fresh heuristic growth diagnostic for `sigmatactix.com`.
- Six heuristic/placeholder findings.
- Three strategy options.
- 90-day roadmap with three phases.
- Three proposed HITL tasks for the authority strategy, visible on Diagnostics but missing from the Cockpit view; server code writes these to its workspace ledger.
- Four-slide LinkedIn carousel draft for the missing-MRR topic.
- A second Social & Carousel run-history record.
- Report-save notification only; configuration persistence is not implemented in that handler.
- Downloaded Executive Summary PDF, subsequently confirmed from the user-supplied file.

### Ran

- Fresh diagnostic.
- Strategy-to-HITL queue action.
- Social carousel generation.
- Social feed synchronization.
- Agent Reach doctor activity (completed asynchronously).
- Report save and PDF export actions.

### Not run

- No agent task was approved or executed.
- No social post or reply was dispatched.
- No social account was connected.
- No social campaign was scheduled.
- No external message, email, or stakeholder share was sent.

## Defects and gaps

### P0 — Truth and evidence integrity

1. **HITL handoff is disconnected.** Diagnostics confirms three pending tasks, while Agent Cockpit immediately shows zero pending. Source inspection identifies separate local Cockpit state; this is not proof of backend task deletion.
2. **Live report claims conflict with connector state.** Reports present eight active paid/organic streams and large financial totals, while Connectors show one GA4 pipeline with one ingested event and no configured paid-media connectors.
3. **Social monitoring claims exceed execution evidence.** Source inspection confirms that Sync Social Feeds shows a timer-based success message without making a provider request. Agent Reach has a separate real scan path and subsequently completed its doctor check.
4. **Global status obscures scope and freshness.** The shared shell shows `Ecosystem: VERIFIED` alongside offline VANTA and stale verification. The UI must identify what was verified and when; these states alone do not prove every subsystem has failed.

### P1 — Requested customer outcome is incomplete

1. **No missing-MRR model.** The flow has no fields or formula for current MRR, target MRR, ARPA/ACV, churn, funnel volume, conversion rates, sales capacity, or confidence range.
2. **No commercial proposal.** The roadmap provides 30/60/90-day phases but does not show service fees, setup fees, recurring fees, assumptions, inclusions, exclusions, or ROI/payback.
3. **Unverified precision appears in heuristics.** The fresh diagnostic contains specific values such as 24% wasted spend, 62% mobile drop-off, 3.4-second LCP, 28% signal loss, $4,600/month reclaimed spend, and 45% organic growth while labelling findings as placeholders/heuristics. These values should not be presented as measured facts without source evidence.
4. **Generated social output ignores the brief.** The requested five-leak missing-MRR concept produced four generic slides; the accompanying caption did not update; the X thread remained old preset copy.
5. **No end-to-end publishing loop.** Generation, review, social connector verification, scheduling, dispatch, and engagement reporting are not connected into one user journey.

### P1 — Provider accountability is incomplete

1. **No canonical delivery ledger.** There is no single record joining customer objective, source evidence, chosen strategy, deliverables, approvals, execution, delivery channel, owner, timestamps, costs, and outcomes.
2. **Agent logs are empty for performed actions.** Global logs showed no matching telemetry despite a diagnostic, task queue action, and social generation being completed.
3. **Social sync did not create a run record.** The toast confirmed completion but the run count and history did not change.
4. **Report persistence and export provenance are missing.** Save Report only shows a notification. The PDF downloads successfully with a filename, but lacks a durable report/version record, evidence references, source-data timestamps, or a reconciled delivery ledger.

### P2 — Internal consistency and usability

1. Scheduler summary says 12 active schedules, while the table heading shows 3.
2. Scheduler history includes delivery claims without links to the delivered artifact, recipients, provider response, or retry/error details.
3. The reporting surface uses “Live attribution” without visible provenance or a benchmark/sample-data warning.

## Minimum acceptance criteria for this scenario

### Missing-MRR and proposal

- Collect baseline inputs and label their source: connected provider, user-entered, imported, benchmark, or inferred.
- Calculate missing MRR as a transparent range with assumptions and sensitivity analysis.
- Map every recommended intervention to expected revenue impact, confidence, dependencies, owner, and duration.
- Show fees separately: setup, monthly service, media/tool costs, optional add-ons, and estimated payback.
- Export a versioned proposal containing the evidence, formula, roadmap, fees, approvals, and disclaimers.

### Social execution

- Preserve the user brief across carousel, caption, thread, and platform variants.
- Require verified account/page identity before offering scheduling or dispatch.
- Support draft → review → approve → schedule → publish → provider receipt → engagement ingestion.
- Never show impressions, sentiment, or engagement as live unless returned by a verified provider payload.

### Provider delivery and logs

- Create one immutable job/run ID for every user action.
- Record actor, workspace, input, source provenance, task, agent/tool, start/end time, status, output artifact, approval, delivery target, provider receipt, and error/retry history.
- Reconcile counts across Diagnostics, Agent Cockpit, Social run history, Scheduler, and Reports.
- Link every “Delivered,” “Complete,” or “Live” label to inspectable evidence.

## Overall assessment

**Current status: Not ready for this end-to-end managed-service scenario.**

The strongest usable pieces are the guided diagnostic structure, strategy selection, 90-day roadmap layout, social asset preview, and explicit HITL language. The release blocker is not missing UI polish; it is the absence of a truthful, persistent execution and delivery spine connecting evidence to work, work to approval, approval to delivery, and delivery to measurable outcome.
