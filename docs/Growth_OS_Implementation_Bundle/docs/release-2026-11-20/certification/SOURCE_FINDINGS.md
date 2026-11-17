# Growth OS source-to-certification audit

17 November 2026. Independent source inspection, no product edits or live side effects.

GitHub `main` was rechecked and remains `18ef63cb7d0412e49d31a603fb7770e292b4da1d`. Current selected source plus fresh pinned VANTA, tool, RAG and social adapter files were reviewed. This report records source findings and required tests, not a claim that production behavior passed. The parent agent is inspecting the live browser separately.

## Certification verdict

**Full production autonomy cannot currently be certified from this source.** Existing UI, authenticated helpers, bounded agent execution and ledger foundations are useful, but source-confirmed gaps below prevent an evidence-based claim that every integration and autonomous workflow works end to end. No live database leak or provider delivery was asserted or tested here.

### Confirmed source gaps and exact acceptance

| ID | Source evidence | Finding and classification | Required acceptance |
| --- | --- | --- | --- |
| C-01 | `server.ts:2348-2361`; `src/server/routes/socialDistributionRoutes.ts:17-98` | **P0 authorization defect in source:** `/api/social` mounts the social router outside the `/api/workspace` auth prefix. Its draft/schedule/publish handlers contain no auth, membership, workspace or approval checks; the same provider instance is passed to both mounts. No endpoint was invoked. | In staging, unauthenticated and non-member requests fail; an authorized read cannot publish; publishing requires exact approved payload/destination; per-workspace provider binding is demonstrated. Disable/remove the unguarded mount or apply equivalent controls. |
| C-02 | `src/server/providers/socialDistribution/socialSchedulerAdapter.ts:213-231,264-275` | **P0 truth defect:** unconfigured dispatch returns `success:true`, fake provider IDs/URLs and `published` or `scheduled`. Live dispatch derives status from requested mode and even substitutes an ID if absent. These are not verified delivery receipts. | Unconfigured provider returns unavailable or an explicit simulation type never accepted as delivery. Real post state is queried/confirmed and provider-issued IDs required. Test malformed provider response and accepted-but-not-delivered cases. |
| C-03 | `ActionQueueTab.tsx:143-180`; `actionQueueStore.ts:308-315` | **P0 truth/durability defect:** queue approval proceeds after failed HTTP/non-success response and calls `approveItem`, which marks `COMPLETED`; queue is localStorage-backed. | Approval, queued and delivered states remain distinct; 401/403/422/500/timeout never yield completion; cross-device state and duplicates tested. |
| C-04 | `WorkspaceContext.tsx:104-143`; `Layout.tsx:838-847`; `api.ts:16-29`; `server.ts:575-610` | **P0 context integrity gap:** new-client wizard creates local browser ID; shared fetch wrapper does not inject selected workspace; invalid explicit workspace selection falls back to default. | Server-issued identity and membership survive new browser/device; every scoped request carries correct ID; invalid explicit scope fails, especially on writes. This is a wrong-client risk, not evidence of cross-tenant data disclosure. |
| C-05 | `src/lib/vantaServer.ts:160-166`; `server.ts:2221`; `vantaRoutes.ts:395` | **Capability limit, not a broken feature:** VANTA is explicitly read/explain/propose and routes action to governed mission. Its prompt says it cannot execute changes; external writes are described unavailable. | A typed tool/mission bridge plus per-page context must be implemented and verified before claiming direct VANTA computer autonomy. Mere availability of the dock is insufficient. |
| C-06 | `vantaRoutes.ts:367-398`; `agentTools.ts:289-304`; `rag.ts:105-130`; `agentPolicies.ts` | **P0 policy seam:** VANTA semantic search has no `vaultIds` scope; keyword query excludes credentials IDs but does not explicitly exclude Executive. Agent tool `search_second_brain` accepts model-supplied `vaultId` without receiving allowed agent scope. RAG falls back to the general `match_documents` RPC. Real row contents/RLS were not inspected. | Seed harmless sentinel records in every vault of two staging workspaces; forbidden records must never reach context, snippets, output or logs via semantic, keyword, tool, memory or attachment paths. Enforce scope in service/RPC boundary, not prompt text. |
| C-07 | `server.ts:2227-2233,2249`; `vantaRoutes.ts:543-567` | **Persistence/format limit:** attached local context is an expiring in-process Map; XLSX ingestion is explicitly unavailable. | Attachment behavior after restart/multi-instance is honest; durable references and ownership checks if persistence promised; supported MIME/size/expiry/removal matrix tested. XLSX output does not imply XLSX input support. |
| C-08 | `agentTools.ts:328-373,375-426`; `server.ts:5907-5919` | **Runtime evidence missing:** shell tool correctly has no host fallback and requires a supervisor, but supervisor request contains only command and timeout, not workspace/run identity. File tool has lexical path traversal checks but no realpath/symlink boundary in reviewed code. | Two-client filesystem/process/network isolation, supervisor caller authentication, per-run identity, no host-home access and symlink traversal tests. Supervisor unavailable must block capability. No generic browser tool is present in this reviewed tool list. |
| C-09 | `aiProvider.ts:319-322,467-468`; `server.ts:5926-5946` | **P0 false completion risk:** max-step exhaustion without final result emits "Mission completed within allocated tool execution budget." Caller logs completed and telemetry success after a returned result. Tool errors are returned to the model; a final narrative is not itself a result receipt. | Step exhaustion yields blocked/incomplete; failed required tool cannot yield success; executor output schema requires intended artifact/receipt. Budget/timeout/cancel outcomes independently tested. |
| C-10 | `Scheduler.tsx:61-64,99-130`; `server.ts:7292-7317,9760-9793` | **Durability/certification gap:** schedule UI keeps data in React state; ledger cutover defaults off and can fall back even when configured authoritative. No inspected code establishes reliable unattended scheduling. | Browser-closed trigger, restart recovery, leases, dedupe, retries, missed-run policy, dead-letter state and timezone demonstrated. Reads can degrade, but new external writes must block if approval/ledger proof is unavailable. |
| C-11 | `vercel.json`; `DEPLOY.md`; `deploymentSmoke.test.ts:20-49`; `.github/workflows/ci.yml:99-106`; `workspaceIsolation.test.ts:11-16` | **Verification gap:** deployment smoke checks source strings, isolation suite simulates DB clients, scan failure is allowed and audit errors suppressed. Green CI is not deployed HTTP/RLS proof. | Real staging API, database, storage and provider tests; blocker scans enforced; record exact deployment SHA/config/migration fingerprints and rollback. |

## What is already implemented, to preserve

- Bounded ReAct loop with allowed-tool name enforcement in both provider paths (`aiProvider.ts:265-274,411-423`), maximum five steps at `server.ts:5901`.
- Agent mission prompt context uses policy-scoped vault IDs (`server.ts:5859-5864`); the tool search path above needs parity with that boundary.
- Tools include read-only Google Ads MCP, public site fetch, semantic search, connector status, isolated-supervisor shell, scoped file read/write, and HTTP GET/POST (`agentTools.ts:7-115`). Shell has no host execution fallback.
- Durable run/attempt record code and richer lifecycle states exist. Existing work should be connected and tested rather than replaced by an unrelated orchestration layer.
- Current executive PDF renderer is imported by export service. Three-format deliverable testing must evaluate actual exported artifacts, not library availability.

## End-to-end scenario catalogue

Mode key: **R** = read-only UI/public data, normally safe to inspect now; **S** = disposable staging records/users/files; **P** = provider-backed call that may cost money or quota; **E** = external publication/message/access/billing effect requiring exact authorized destination/scope and a controlled test target. An S/P/E scenario remains blocked until prerequisites exist. A module is not passed merely because its route renders.

| Module / routes | Core scenario and expected proof | Mode / prerequisites |
| --- | --- | --- |
| Shell and suite hubs `/`, `/suite/*` | Every released route loads directly, back/forward works, mobile/keyboard access, source state truthful, old deep links retained; route/module registry coverage has no omissions | R; authenticated user |
| Client management `/tenants`, new-client wizard | Create empty client A, invite role, resume on device B, create client B, switch rapidly, revoke member; no data overlap, no local draft mistaken for provisioned client | S; two legitimate staging users and database/storage |
| Dashboard `/` | Known fixture totals/date/currency reconcile; disconnected/stale/zero/failed states differ; each insight opens evidence; selected Client Enclave equals API scope | R + S; source fixtures and metrics ingestion |
| Diagnostics `/diagnostics` | Public URL crawl returns captured evidence and honest coverage; invalid/private/redirect targets fail; AI finding links to exact evidence | R for viewing; S/P for running crawl/AI; approved public test site |
| Knowledge `/vaults` | Upload permitted file, extract, classify/review, retrieve, move/delete in test data; duplicate handling; Secret Vault and two-client sentinel tests | S/P; harmless files, DB/storage and embedding provider |
| VANTA on every page | Dock displays selected page/object/period, attach selection/file, answer cites accepted evidence, reject unauthorized reference; switch client mid-stream; stop/retry; proposal routes to exact governed action | R for opening; S/P for conversation/attachments and AI |
| VANTA memory/sharing | Private conversation invisible to second user, intentional share visible, unshare removes access, memory requires confirm and respects source revocation | S/P; two staging users |
| Editorial `/content` | Brief -> grounded draft -> edit -> approved version -> artifact; claims carry provenance and generated text survives reload | S/P; permitted brand fixtures and AI quota |
| Image `/image-studio` | Brief/reference -> actual provider job -> valid image -> dimensions/format -> private artifact; provider failure/credits exhausted honest | P; configured provider and user-set test spend cap |
| Video `/video-studio` | Storyboard -> real render job -> inspect playable MP4/audio/duration/aspect -> persisted download; renderer unavailable and cancellation honest | P; renderer/browser/ffmpeg dependencies if required, quota/cap |
| Social/carousels `/social-carousels` | Editable carousel -> valid PDF/PPTX assets -> authorized draft/schedule; exact destination/content preview; schedule not claimed delivered; actual test post receipt for publish certification | S/P; E only on approved disposable/private channel |
| Social listening `/social-listening` | Real supported query captures source URLs/timestamps, dedupe and clearly scoped coverage; response is a draft until authorized send | R/S/P; provider; E for posting response |
| SEO/AEO `/seo-aeo` | Verified GSC property and date query reconcile; expired OAuth/access denial; keyword/citation evidence retained; unsupported AEO observation unavailable | R/S/P; owner-approved GSC property and AI provider |
| CRO `/cro-studio` | Approved public target -> captured desktop/mobile source -> proposed page -> editable export -> preview and artifact hashes; no deployment asserted from local preview | S/P; browser runtime, storage; E if publishing site |
| Inbound `/intake` | Synthetic lead submitted to staging form -> idempotent capture -> qualification -> authorized test response; restart/retry; SLA measured from actual timestamps | S/P; E for WhatsApp/CRM/calendar/email to controlled recipients |
| Outreach `/outreach` | Approved target fixture -> deduped contact record -> sequence draft -> suppression/unsubscribe checks -> explicit controlled send -> receipt | S/P; E with consented test contacts only |
| Paid `/paid-ads` | Real import schema parses source values, preserves uncertainty, approved media plan; account-scoped read reconciles; mutation exact payload/approval and provider receipt if supported | S/P; E for campaign/budget changes, approved test account and cap |
| Email `/email-marketing` | Draft -> preview -> test delivery -> quiet hours/opt-out and dedupe; no claimed send from generated copy alone | S/P; E only approved test addresses and sender provider |
| Attribution `/attribution`, `/suite/attribution` | Known spend/conversion/revenue fixture produces correct formulas; period/currency/attribution windows explicit; missing source no invented CAC/ROAS | R/S/P; analytics/ad/CRM sources as used |
| Competitors `/competitors` | Approved public domain -> evidence snapshots -> source-linked findings -> SDR Battlecard draft; source changes/timeouts honest | R/S/P; crawler/intelligence provider |
| Market simulator `/market-simulator` | Simulation inputs and assumptions saved, result labelled simulated, repeat/cancel/failure behavior; no causal result or live market action claim | S/P; configured provider; fixture does not certify live provider |
| Agent cockpit `/agents` | Propose -> authorized approval -> allowed tool call -> real artifact/receipt -> observed lifecycle; denial, edit-after-approval, duplicate, error and exhausted-loop cases | S/P; controlled tools and supervisor |
| Agent Reach `/agent-reach` | Doctor verifies installed runtime/operation; selected channel supported; missing CLI/auth returns unavailable; real read and failure paths | R/S/P; actual CLI/service dependencies and account access |
| Scheduler `/scheduler`, `/cron` | Persisted job runs with browser closed, survives worker restart, dedupes trigger, records delivery receipt; timezone/missed run/retry/dead letter | S/P; E for controlled delivery; durable worker and scheduler |
| Reports `/reports` | Same immutable snapshot exports PDF, PPTX, XLSX with correct branding/data/source notes; open files, inspect all pages/slides, recalc workbook, persist and authorized download | S/P; renderer + artifact storage; no fake pass from filename |
| Connectors `/connectors` | Operation-specific setup/account selection/verification/read/expiry/revoke; denied scope honest; server encryption and no secret leak in prompts/logs/artifacts | R/S/P; actual least-privilege provider credentials |
| Models `/models` | Save/test/revoke provider config, verify selected model used by mission, quota/timeouts/error states; no broad default provider silently crosses workspace boundary | S/P; legitimate keys and cap |
| Admin `/admin`, `/tenants`, billing | Role-specific access and prohibited actions denied server-side; staging subscription/webhook forged signature/replay/out-of-order test; plan state from server | S; Stripe test mode; E for real billing/access changes |
| Skills/MCP `/skills`, `/prompts`, `/explorer` | Discovery != authorization; allowlisted tools and schema validation; attempted out-of-scope tool denied; one real supported invocation and revocation | S/P; actual approved MCP service; no secret export |
| Living system `/living-system` | Release flag respected; topology matches real permitted records; empty/stale/offline and WebGL fallback; activity maps to recorded runs, no fabricated health | R/S; provider/DB only if testing chat |
| Architecture/harness `/architecture`, `/harness` | Operator-only technical detail; runtime status from actual health checks; no credentials in displayed topology; broken dependency truthfully shown | R/S; known runtime topology |
| Learnings `/learnings` | Approved result -> permitted persistent memory -> future grounded retrieval; simulated/failed output cannot become a measured success case | S/P; known fixture plus memory/retrieval |

## Shared adversarial and recovery gates

Run on a disposable staging environment, not the user's active production data:

1. Two users/two clients across API, table, RPC, object storage, signed links and VANTA retrieval; authenticated non-member and revoked-member cases.
2. Browser/supervisor unavailable; worker restart mid-job; database unavailable at approval/write; API returns HTML or malformed JSON; provider accepted a job then request timed out.
3. Replayed webhook, duplicated approval, double-click submit and overlapping cron trigger; exactly one intended external operation.
4. Deadline/step/cost cap and cancellation; visibility of partial output and unknown delivery; no blind retry of non-idempotent effect.
5. Prompt-injected source asks for Secret Vault content or a different destination; model cannot acquire permission or tool capability from source text.
6. Traversal/symlink/internal network/redirect targets tested against fixtures; process/container isolation with two concurrent client tasks.
7. Exact exported client data reconciled across PDF, PPTX and XLSX; every PDF page/PPT slide visually reviewed, workbook formulas/types/references checked.

## Test prerequisites and honest reporting

Required before comprehensive certification: legitimate staging accounts with two roles, Supabase staging DB and storage/migrations, staging deploy URL/build identity, provider accounts with exact supported scopes, durable worker/scheduler, isolated supervisor/browser runtime, controlled message/publication targets, and a user-set provider test budget. Store secrets through protected configuration; never request keys in chat or commit them.

Record each result as `passed`, `failed`, `blocked`, `not_run`, or `not_supported`. Include scenario ID, exact build/environment, caller role/workspace, steps, expected/actual, timestamp, evidence artifact/receipt and limitation. `blocked` and `not_supported` are not passes. Certification requires operation-level evidence, including negative and recovery paths; source inspection or UI rendering alone cannot substitute.

No tests, credentials, postings, provider jobs, database writes or source modifications were performed by this audit agent.
