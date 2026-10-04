# Sigma Tactix Growth OS Production UI/UX and Enterprise Polish Plan

**Date:** 2026-10-02

**Status:** In progress - first truth, onboarding, shell, theme, and typography slice implemented on 2026-10-03; full plan is not complete or release certified

**Source session:** `1790884878029_6b0ou`

**Scope:** Client onboarding, application shell, responsive behavior, typography, light/dark theming, evidence-labelled copy, accessibility, and production acceptance

**Implementation checkpoint (2026-10-03):** Blank manual-or-file onboarding, review-gated file suggestions, truthful browser-local workspace copy, Playbook dropdown, bundled IBM Plex fonts, light-theme Ecosystem empty state, overlay behavior, and removal of fabricated Dashboard health/activity claims are implemented and locally built. Durable server-side multi-workspace creation, retained onboarding source files, Reports remediation, global display-claim enforcement, and full accessibility/responsive/provider acceptance remain open.

## Executive decision

Do not treat this as a visual reskin. The first release gate is trust: a fresh tenant must never see another client's answers, invented operational states, unsupported performance figures, or a success message for work that failed. The second gate is workflow: onboarding must accept either a small set of verified inputs or client files, generate a reviewable draft, and ask the user only for missing or conflicting information. Visual polish follows on top of those truthful states.

The target experience is a calm enterprise workspace with one primary action per screen, progressive disclosure, plain language, durable state, and evidence visible at the point of each claim.

## Audit method and evidence boundary

This plan is based on:

- Live browser inspection of the authenticated local application in dark and light appearances.
- Desktop, medium-width, and narrow viewport checks.
- Accessibility-tree, console, network, and DOM overflow inspection.
- Source review of the shared shell, onboarding wizard, dashboard, reports, workspace context, Ecosystem drawer, and server ingestion routes.
- Reconciliation with the remediation work summarized in Cline session `1790884878029_6b0ou` and the current `MASTER_CONTEXT.md`.

This is not a deployment certification. Provider credentials, production tenant isolation, cross-browser acceptance, and authenticated live integrations remain external gates.

## Confirmed findings

### P0 - Truth and tenant safety

| Finding | Evidence | Production risk | Required result |
| --- | --- | --- | --- |
| Onboarding opens with Sigma-specific client answers | `ClientOnboardingWizard.tsx:43-74` initializes company, domain, ICP, pricing, connector properties, and model choices with Sigma values | A new client can inherit another workspace's facts and submit them as if verified | All client fields start empty unless loaded from that client's durable draft or an explicitly labelled demo workspace |
| Failed onboarding can still report success | `ClientOnboardingWizard.tsx:114-149` swallows API failures, ignores the diagnostic response, then completes provisioning | False completion and silent data loss | Fail closed per stage; preserve the draft; show the failed stage, reason, retry, and support reference |
| Workspace “provisioning” is browser-local | `WorkspaceContext.tsx:43-91, 104-143` stores workspaces in `localStorage` and emits claims about isolated vaults | No durable server record, no reliable tenant boundary, and no audit trail | Create the workspace server-side in a transaction, return a durable workspace ID, then hydrate the client |
| Onboarding success copy overstates controls | The browser reports dedicated vaults and tenant credentials while the active path only constructs a local object | Enterprise/security misrepresentation | UI wording must reflect `draft`, `creating`, `created`, `failed`, or `verification required`; security claims need runtime evidence |
| Ecosystem statuses and timings are seeded UI state | `EcosystemStatusBar.tsx` initializes named modules with operational/warning states and millisecond values | Invented telemetry appears operational | Render only server-issued status evidence; otherwise show `Not checked`, `Setup required`, `Unavailable`, or `Demo` |
| “Ping all” can manufacture a healthy result | The Ecosystem control mutates local state and displays a successful health-check message | False runtime proof | Replace with a server health-check job returning per-target attempts, timestamps, and results |
| Dashboard mixes live, benchmark, and unsupported claims | Live browser showed zero provider metrics beside ARR, CAC, ROAS targets, system health, 12 active agents, and “zero errors” activity copy | Users cannot distinguish measured facts from templates or stale records | Every metric and activity item must carry a provenance state and timestamp; unsupported cards disappear on fresh tenants |
| Reports render dense executive figures without adequate context | Browser inspection at narrow width showed `$84,250`, `4.82x`, and momentum figures while controls and cards overflowed | False confidence and unusable output | Report data must come from a versioned snapshot with field-level provenance; otherwise render an empty, benchmark, or demo state |

### P0 - Client onboarding friction

The current five-step wizard is a manual questionnaire. It does not offer file intake, does not generate later steps from Step 1, and exposes implementation language such as “sovereign tenant boundary,” “inference model,” and “autonomous diagnostic” before the client has established basic context.

The existing vault routes provide useful building blocks, but they are not yet a safe onboarding extractor:

- `/api/workspace/vault/upload` stores supported files and fingerprints duplicates.
- `/api/workspace/vault/analyze-document` extracts text from several formats, then can fall back to heuristic categorization and generic summaries.
- The fallback is appropriate for a draft vault record, but not for silently filling authoritative onboarding fields.
- DOCX and PPTX extraction need explicit production support before those formats are promised in onboarding.

### P1 - Shell, theme, and responsive layout

| Finding | Browser evidence | Required result |
| --- | --- | --- |
| Header overload | At the medium viewport, the right-side header content measured 731px inside a 419px slot | One stable top bar; Playbook becomes one menu; secondary actions move to overflow; role and status controls collapse by priority |
| Playbook consumes permanent horizontal space | Four phases plus a label remain visible at extra-large widths and compete with workspace, tutorial, onboarding, VANTA, ecosystem, appearance, role, alerts, and avatar | One `Playbook` dropdown showing the current phase; full phase list appears only when opened |
| Ecosystem is black in light appearance | Live light-mode screenshot reproduced a white header over a hard-coded black drawer body | Entire drawer uses semantic Sigma tokens; status colors retain contrast in both themes |
| Hard-coded dark classes bypass theme tokens | The onboarding, Ecosystem, VANTA widget, reports, and other modules contain many `bg-black`, `text-white`, and `border-white` utilities | Replace surface and text colors with semantic tokens; permit dark-only treatment only for a deliberately isolated preview surface |
| Reports are not responsive | At the medium viewport multiple report regions exceeded their containers; at the narrow viewport the fixed palette consumed much of the screen and horizontal scrolling remained | Palette becomes a drawer on narrow widths; report toolbar wraps by priority; cards and charts use container queries; tables provide deliberate scrolling or stacked summaries |
| Agent chart labels collide | Browser and console inspection showed chart dimension warnings and clipped time labels | Chart containers get explicit minimum sizes and responsive tick density |
| Text is too small and mono-heavy | Route sampling found dozens to hundreds of text nodes below 12px; Reports had the highest density | Minimum readable product copy is 13px, controls 14px, helper text 12px; monospace is limited to IDs, timestamps, logs, and evidence codes |

### P1 - Accessibility and interaction quality

- Several routes contain form controls without programmatic labels.
- The onboarding overlay lacks an explicit dialog role, `aria-modal`, labelled title, focus trap, Escape handling, and focus return.
- The onboarding close button has no accessible name.
- Status is often conveyed through color, abbreviations, or decorative dots alone.
- The interface needs keyboard, 200% zoom, reduced-motion, and screen-reader acceptance testing.

## Target onboarding experience

### Information architecture

Replace the five-step manual wizard with four stages:

1. **Add the client**
   - Required: organization name and primary domain.
   - Optional: website crawl consent and geography.
   - Two equal input paths: `Upload client files` or `Enter details manually`.
   - Files can be added by drag-and-drop or chooser. The UI states supported formats and limits before upload.
2. **Review generated profile**
   - Generate a draft company profile, ICP, offer, brand voice, goals, and known constraints from the domain and accepted files.
   - Each field displays `source`, `captured at`, `confidence`, and `status`.
   - Conflicts are never resolved silently. The user chooses the correct value or marks it unknown.
   - Only missing, low-confidence, or conflicting fields become questions.
3. **Choose data connections**
   - Show recommended connectors derived from the reviewed profile.
   - A selection is `Setup requested`, not `Connected`.
   - OAuth, service-account, and account-selection flows remain provider-specific and are verified separately.
   - Do not collect general model API keys in client onboarding.
4. **Confirm and create**
   - Present the exact data to save, files to retain, connector setup tasks, and diagnostic scope.
   - Create the workspace first. Queue the diagnostic only after persistence succeeds and the user explicitly confirms it.
   - Show durable IDs and stage results. Never convert a failed or partial operation into success.

### “Step 1 generates the rest” contract

The generation flow must be deterministic around evidence, even when an LLM assists extraction:

```text
domain + approved files
  -> private staging upload and malware/type checks
  -> text/table extraction
  -> typed field extraction
  -> source spans and confidence per field
  -> conflict detection
  -> reviewable onboarding draft
  -> user confirmation
  -> transactional workspace creation
  -> optional diagnostic queued with HITL
```

Generated values are suggestions, never facts until confirmed. No connector, agent, audit, or report is marked live because it was recommended during onboarding.

### Data model

Add durable, RLS-protected records rather than extending browser-local workspace state:

- `onboarding_sessions`: workspace candidate, owner, status, current stage, idempotency key, timestamps.
- `onboarding_sources`: file or domain source, storage path, hash, MIME type, extraction status, retention policy.
- `onboarding_fields`: field key, proposed value, source locator, extractor version, confidence, confirmation status.
- `onboarding_conflicts`: competing values, source references, resolution, resolver, resolved timestamp.
- `onboarding_events`: append-only stage events for upload, extraction, review, confirmation, creation, and failure.

Do not store passwords, OAuth refresh tokens, or raw provider secrets in onboarding field records. Existing encrypted connector flows remain the only credential boundary.

### API boundaries

Add a bounded server-owned onboarding service:

- `POST /api/onboarding/sessions` - start or resume an idempotent draft.
- `POST /api/onboarding/sessions/:id/sources` - upload or register a domain source.
- `POST /api/onboarding/sessions/:id/extract` - create typed proposals with source spans.
- `PATCH /api/onboarding/sessions/:id/fields` - confirm, edit, or reject proposals.
- `POST /api/onboarding/sessions/:id/confirm` - validate required fields and create the workspace transactionally.
- `GET /api/onboarding/sessions/:id` - resume the same durable state across devices.

Reuse safe extraction and storage utilities from the vault routes, but do not reuse their heuristic fallback as authoritative onboarding data.

### File support and trust states

Initial production support should be limited to formats that have a tested extractor:

- PDF, DOCX, TXT, Markdown, CSV, XLS, XLSX, JSON.
- PPTX only after a tested slide-text extractor is added.
- Images only after OCR is available and labelled with OCR confidence.

Every file moves through `Uploading`, `Stored`, `Extracting`, `Needs review`, `Ready`, or `Failed`. A stored file with failed text extraction is not `Ready` for AI grounding.

## Enterprise shell and visual system

### Navigation hierarchy

Desktop header priority:

1. Global navigation toggle or search.
2. Active workspace.
3. Current route title or compact breadcrumb.
4. Primary route action.
5. `Playbook` dropdown.
6. Alerts and profile.
7. All other actions in a labelled overflow menu.

At widths below 1280px, hide search behind a command button, collapse Playbook, and move Tutorial, VANTA, Ecosystem, theme, and role switching into overflow. At mobile widths, keep only menu, route title, primary action, alerts, and profile.

### Playbook dropdown

Use an accessible menu button labelled `Playbook` with the current phase as secondary text. The menu lists all four phases, their purpose, route, and evidence state. Keyboard navigation, Escape close, focus return, and click-outside behavior are required.

### Ecosystem drawer

- Use `--sigma-canvas`, `--sigma-surface`, `--sigma-surface-subtle`, `--sigma-text`, and semantic status tokens.
- Remove the claim `83% up`; replace it with counts by evidence state such as `15 verified`, `3 need setup`, `2 unavailable` only when supplied by the backend.
- Replace fabricated latency with `Not measured` until a timestamped attempt exists.
- Change `Live` to `Verified now` only when the last check succeeded inside a defined freshness window.
- Make docked mode responsive. Below 1280px it becomes an overlay drawer and cannot permanently reduce the content canvas.

### Typography

Adopt a single self-hosted family for product UI:

- **Recommended default:** IBM Plex Sans, variable font, for body, headings, controls, and tables.
- **Technical text only:** IBM Plex Mono for IDs, code, timestamps, logs, and provenance.
- **Alternative requiring brand approval:** a licensed Söhne family.

Remove Inter and Montserrat imports, stop loading fonts from Google at runtime, and self-host WOFF2 assets with `font-display: swap`. Use weight and spacing for hierarchy instead of uppercase mono labels. Target sizes:

- Page title: 28-32px desktop, 24-28px mobile.
- Section title: 18-20px.
- Body and controls: 14-16px.
- Helper text: 12-13px.
- Evidence IDs and timestamps: 12px mono.

### Responsive rules

- Every flex/grid child that may shrink gets `min-width: 0`.
- Avoid fixed side panels inside the main content canvas at narrow widths.
- Use container queries for report cards and chart toolbars.
- Long labels wrap at natural word boundaries; identifiers use `overflow-wrap: anywhere`.
- Tables either provide a clearly signposted horizontal viewport or switch to key-value rows.
- Toolbars group actions by priority and move lower-priority actions to overflow.
- Test 360, 390, 768, 1024, 1280, 1440, and 1920 CSS pixels plus 200% zoom.

## Remove AI slop and unsupported claims

### Copy standard

Replace vague or promotional product language with task, state, and evidence:

| Avoid | Use when true |
| --- | --- |
| Sovereign client enclave | Client workspace |
| Autonomous growth diagnostic | Diagnostic draft or Diagnostic run, with run ID and status |
| Live stream | Provider data, last received at [time] |
| Operational | Last check passed at [time] |
| Verified | Verified by [provider/check], evidence ID [id] |
| Zero fake data policy | No data available, benchmark, demo, estimate, or measured fact |
| Self-healing engine | Retry policy and last retry result |
| Intelligence layer | The concrete source, extraction, model, or workflow |

Words such as `live`, `verified`, `operational`, `real-time`, `autonomous`, `secure`, `encrypted`, `isolated`, `zero`, and `production-ready` require an evidence object. They cannot be decorative copy.

### Claim contract

All metrics, statuses, activity rows, and generated recommendations use one display contract:

```ts
type ClaimState =
  | 'measured_fact'
  | 'provider_reported'
  | 'user_confirmed'
  | 'estimate'
  | 'benchmark'
  | 'simulation'
  | 'stale'
  | 'unavailable'
  | 'failed';

interface DisplayClaim<T> {
  value: T | null;
  state: ClaimState;
  sourceLabel: string;
  sourceUrl?: string;
  evidenceId?: string;
  observedAt?: string;
  validUntil?: string;
  explanation?: string;
}
```

Components must render the state beside the value. A missing value stays `null` and renders `Not available`, never zero, neutral, optimal, or success.

### Claim-removal sweep

Audit and remediate in this order:

1. Shared shell: notifications, workspace badges, VANTA, and Ecosystem.
2. Dashboard: activity feed, system health, active agents, ARR/CAC/ROAS presentation, benchmark/live mixing.
3. Reports and attribution: values, momentum labels, dates, channels, and export metadata.
4. Agent Cockpit: rehearsals, timings, accuracy claims, state commits, and completed-task messages.
5. SEO, content, outreach, scheduler, and creative modules: timers, random metrics, seeded output, and success toasts.
6. Server fallbacks: generic generated assertions and success responses without artifacts.

Keep demo fixtures only in a clearly marked demo workspace or preview route. Fresh tenants receive empty states with a next action.

### Automated enforcement

- Add a source lint that flags high-risk claim words in user-visible strings unless used through the claim component.
- Add tests asserting a fresh tenant contains no client-specific company, domain, account ID, metric, run, notification, or activity row.
- Add contract tests for `null`, stale, failed, benchmark, demo, and verified states.
- Forbid timer-only transitions to completed/success.
- Require an artifact, provider receipt, or persisted event before a workflow can display completed.

## Implementation workstreams

### Workstream 0 - Release safety and claim quarantine

**Goal:** Stop unsupported claims before visual polish makes them more persuasive.

1. Create the shared claim contract and evidence badge.
2. Remove or gate seeded shell, dashboard, reports, Ecosystem, and notification data.
3. Replace onboarding success fallbacks with explicit failure states.
4. Remove browser-local workspace provisioning claims.
5. Add fresh-tenant and claim-word tests.

**Exit gate:** A new tenant shows no client-specific or operational data without evidence, and no failed request can end in a success state.

### Workstream 1 - Evidence-first onboarding

1. Define schemas and RLS for onboarding drafts, sources, fields, conflicts, and events.
2. Build server-owned session, upload, extraction, review, and confirmation endpoints.
3. Add tested extractors and safe format limits.
4. Replace the wizard with the four-stage experience.
5. Add resume, retry, conflict review, and accessible dialog behavior.
6. Create the workspace transactionally, then offer a governed diagnostic run.

**Exit gate:** Manual and file-first paths both create the same durable, confirmed workspace record; the generated path asks only unresolved questions.

### Workstream 2 - Shell, theme, and typography

1. Convert Playbook to a dropdown and simplify header action priority.
2. Tokenize Ecosystem, onboarding, VANTA shell, and remaining shared dark classes.
3. Self-host IBM Plex Sans/Mono and publish typography tokens.
4. Define responsive toolbar, drawer, card, table, and empty-state primitives.
5. Remove dense uppercase/mono decorative labels and redundant badges.

**Exit gate:** No global horizontal overflow at supported widths; light mode has no unintended dark islands; header remains usable from 360px to 1920px.

### Workstream 3 - Route-by-route enterprise polish

Audit in user-journey order:

1. Onboarding and workspace creation.
2. Diagnostics and strategy approval.
3. Agent Cockpit and execution evidence.
4. Reports and exports.
5. Connectors, paid media, attribution, scheduler, and content.
6. Second Brain and remaining studios.

For each route, reduce visible choices, establish one primary action, add loading/empty/error states, apply the claim contract, test keyboard flow, and capture responsive visual baselines.

**Exit gate:** Each route has an owner-approved acceptance record covering content, state truth, responsive behavior, accessibility, and failure recovery.

### Workstream 4 - Production acceptance

- Chrome, Edge, Firefox, and Safari on desktop; Chrome and Safari on mobile.
- WCAG 2.2 AA automated and manual checks.
- Keyboard-only completion of onboarding, Playbook, Ecosystem, reports, and approvals.
- 200% zoom and reduced-motion checks.
- Visual regression at the defined widths in both appearances.
- Console free of application warnings and accessibility issues.
- No failed network request hidden behind a success toast.
- Clean-checkout typecheck, tests, build, and browser suite.
- Two-workspace adversarial tenant-isolation test.
- Export inspection for filename, bytes, rendered layout, provenance, and branding.

## File-level implementation map

| Area | Existing touchpoints | Planned additions or changes |
| --- | --- | --- |
| Onboarding UI | `src/components/ClientOnboardingWizard.tsx`, `src/components/Layout.tsx` | Replace with source selection, extraction review, conflict resolution, confirmation, resume, and accessible dialog primitives |
| Workspace state | `src/contexts/WorkspaceContext.tsx` | Hydrate from server records; remove localStorage as source of truth |
| File ingestion | `server.ts` vault upload/analyze routes, `src/pages/SecondBrain.tsx` | Extract reusable storage/parser services; add typed onboarding extraction and provenance |
| Shell | `src/components/Layout.tsx` | Header priority model, Playbook menu, overflow menu, responsive action rules |
| Ecosystem | `src/components/EcosystemStatusBar.tsx` | Theme tokens, server health evidence, no seeded timings or local success mutation |
| Theme and type | `src/index.css`, UI primitives | IBM Plex self-hosting, semantic typography and status tokens, removal of hard-coded dark classes |
| Dashboard truth | `src/pages/Dashboard.tsx`, `src/components/IntakeMetricsChart.tsx` | Claim contract, evidence-backed activity, corrected zero/benchmark behavior, chart sizing |
| Reports | `src/pages/Reports.tsx`, report components | Responsive palette drawer, versioned snapshots, provenance, narrow-layout redesign |
| Agent evidence | `src/pages/AgentCockpit.tsx`, ledger modules | Separate rehearsal from execution; render persisted runs, attempts, artifacts, and receipts |
| Quality gates | Vitest, Playwright/browser suite, source lint | Fresh-tenant, claim-contract, onboarding E2E, theme, overflow, accessibility, and visual-regression tests |

## Acceptance scenarios

### Onboarding

- A clean account opens empty, not with Sigma Tactix details.
- A user can finish with only manual input.
- A user can upload files and review generated values before save.
- Conflicting values show both sources and require a decision.
- Unsupported or unreadable files fail visibly without losing the draft.
- Refreshing or changing device resumes the durable session.
- A failed workspace create or diagnostic remains failed and retryable.
- Connector selections remain setup requests until provider verification succeeds.
- No secret is logged, returned to the browser, or stored in onboarding fields.

### Shell and responsive UI

- Playbook is one menu and is keyboard accessible.
- No header element overlaps, clips, or creates global horizontal scrolling.
- Ecosystem matches light and dark appearance.
- Reports replace the fixed palette with a drawer at narrow widths.
- Text remains readable at every supported width and at 200% zoom.
- Charts do not emit dimension warnings or render clipped labels.

### Truthful copy and data

- Every visible metric can answer: source, state, and observed time.
- `null` renders as unavailable, not zero.
- Benchmark and demo data are unmistakable and cannot be exported as measured results.
- Operational and live states expire into stale or unknown.
- Completion requires a persisted terminal event plus artifact or provider receipt where applicable.
- The app contains no generic activity story, fake notification, random score, fabricated latency, or timer-generated success on a fresh tenant.

## Delivery sequence and estimate

The estimate below is planning guidance, not a commitment. It assumes one experienced full-stack engineer, access to the existing authenticated environment, and no major schema migration conflict.

| Sequence | Scope | Estimated focused engineering time |
| --- | --- | --- |
| 0 | Claim quarantine and fresh-tenant safety | 2-4 days |
| 1 | Durable file-assisted onboarding | 6-10 days |
| 2 | Shell, Playbook, Ecosystem, typography, shared responsive primitives | 4-7 days |
| 3 | Route-by-route polish led by Reports and Agent Cockpit | 5-9 days |
| 4 | Cross-browser, accessibility, tenant isolation, export, and release acceptance | 3-5 days |

**Total estimate:** 20-35 focused engineering days. Provider access, DOCX/PPTX extraction decisions, migration review, and the breadth of report redesign can move the range.

## Decisions required before implementation

1. Approve IBM Plex Sans/Mono as the default self-hosted product typography, or provide a licensed brand family.
2. Approve the initial onboarding file-format list and maximum file/count limits.
3. Confirm whether source files are retained after onboarding or moved into the selected Second Brain vaults.
4. Confirm whether the initial diagnostic is opt-in at confirmation or queued automatically for later approval. Recommended: explicit opt-in.
5. Confirm the migration window for durable onboarding sessions and server-owned workspaces.

## Definition of done

This program is complete only when the implementation, tests, browser evidence, and acceptance record exist. A design mock, green unit test, successful toast, configured connector, or passing local build is not enough on its own.
