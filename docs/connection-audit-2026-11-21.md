# Connection audit — 21 November 2026

The infrastructure services are accessible, but the deployed application is not connected end to end. Checks used the connected service tools, authenticated Vercel CLI metadata, public HTTP requests, and read-only PostgreSQL catalog queries. No user records or Secret Vault contents were read; no deployments, provider grants, or remote settings were changed.

## Verified identities

| Connection | Observed result |
| --- | --- |
| GitHub connector | Authenticated as `sigmatactix`; admin access to the current v2 repository. |
| Current repository | `Sigma-Tactix/sigma-tactix-growth-os-v2`, ID `1367656977`; local origin matches. |
| Other Growth OS repositories | `sigmatactix/Sigma-Tactix-Growth-OS` and `sigmatactix/sigma-tactix-growth-os-v1` also exist. The former personal v2 URL resolves to the current organization repository, rather than a separate v2 repository. |
| Vercel | `sigma-tactix-growth-os-v2`, project `prj_7zpThzqMg9eKObVmUGLIaZdrDG0F`, team `nazims-projects-ddc76692`. Git link correctly references the current repository ID and `main`. |
| Domains | `growth-os.sigmatactix.com` and `sigma-tactix-growth-os-v2.vercel.app` are verified on that Vercel project. |
| Supabase | `Sigmatactix-Growth-OS`, ref `rqktjogegbdlsdvpusie`, `ACTIVE_HEALTHY`, region `ca-central-1`. Health advisor returned no findings. |
| Database identity | Local server URL, browser config, production and preview JavaScript bundles, and Vercel integration public URL agree on that Supabase project. |
| Tool authentication | Connected GitHub/Vercel/Supabase tools worked. Local Vercel CLI 66.1.0 is authenticated as `sigmatactix-9394`; `gh` is installed but unauthenticated. |

## Confirmed failures and drift

### 1. Production serves the frontend on API paths

At `https://growth-os.sigmatactix.com`, `/`, `/healthz`, `/api/health`, `/api/ready`, `/api/connectors`, and `/api/__connection_audit_missing__` all returned HTTP 200, `text/html`, with an identical 1,185-character response and SHA-256:

`698ef68802682ab1ee633f5e1d1f937dce8b3b6211271e58cfe420a88e4ac715`

The default production `vercel.app` hostname also returned HTML for `/api/health`. A successful page load or status 200 therefore does not establish API health. The `/api/connectors` probe checks the API response contract; the registered connector mutation routes are actually under `/api/workspace/connectors/:id/` and were not invoked.

The production aliases point to `dpl_6M71gxumDbv23rus4Sd8Z3x1xErr`, created **17 Nov 2026, 04:20 Asia/Dubai**. It has commit metadata `18ef63c` and `gitDirty: 1`, so that SHA alone does not identify its exact source tree.

The checked-in `vercel.json` specifies Vite output `dist` and rewrites every request to `/index.html`, with no API handler or upstream API rewrite. Building `dist/server.js` does not by itself configure a deployed API runtime. This configuration would not reproduce the newer preview's backend setup.

### 2. The backend preview is alive but unready

Preview: `https://sigma-tactix-growth-os-v2-gedanx48d-nazims-projects-ddc76692.vercel.app`

| Probe | Result |
| --- | --- |
| `/api/health` | 200 JSON; `ok: true`, `status: alive`, commit `uncommitted-743bae6244fc`. |
| `/api/ready` | 503 JSON; `ready: false`, database `unverified`; worker `configured: false`, `healthy: false`; execution ledger authoritative mode false. |
| `/api/workspace` without a session | 401 JSON, `Missing Authorization header`, showing that the authentication boundary responds. |
| Unknown API path | 404 JSON, `API endpoint not found`, mode `routing_preview`. |

The preview was created **18 Nov 2026, 18:30 Asia/Dubai**, with `baseCommit: af69830` and source digest `743bae6244fcee596c16ba68ad9a8bce1a52dae74ffacd66b57a73bada1ee430`. It is staged, not assigned to the production domain. Database `unverified` is not proof that Supabase is unreachable; the preview has not established readiness and reports a missing supervised worker.

### 3. Current database schema does not cover current source

The database catalog lacks these tables:

| Missing tables | Repository migration | Referencing code |
| --- | --- | --- |
| `token_usage_records` | `0014_token_metering.sql` | `server.ts` token recording and telemetry queries. |
| `decision_traces` | `0016_decision_traces.sql` | `decisionRoutes.ts`, `vantaRoutes.ts`, trace inspector. |
| `brain_entities`, `brain_relationships` | `0021_brain_knowledge_graph.sql` | `src/lib/brainGraph.ts`. |

All 47 public tables returned by the table listing have RLS enabled. An anonymous, zero-row read of `workspaces` was denied, as expected for this restricted table. Supabase Auth settings responded successfully using the configured public key, with Google and email sign-in enabled. A real user login and authorized Client Enclave read were not performed.

A separate connection attempt using the local `DATABASE_URL` failed with DNS error `ENOTFOUND` before any SQL ran. The direct PostgreSQL hostname is therefore unavailable from this machine even though Supabase HTTPS and management access work. This does not establish a database outage; a working pooler endpoint or suitable direct-host network access needs verification.

Migration history contains ten entries, including `growth_os_durable_artifacts_learning_consent_0023_0026` dated 18 Nov. Several unrecorded individual migrations have corresponding tables, so do not blindly replay every migration absent from the history. Inspect actual objects and `backend/database/migrations/verify.sql` before preparing a schema change.

### 4. Local work, GitHub, and deployment source differ

At audit start:

- Local `main`: `42935b3`, four commits ahead of live GitHub `main` (`af69830`), verified with `git ls-remote`.
- The unpublished commits add three dashboard routes and the AIExplorer border correction.
- Production: older `18ef63c` metadata plus a dirty tree.
- Preview: separate uncommitted source digest based on `af69830`.
- The Vercel Git link was updated on **19 Nov 2026, 13:20 Asia/Dubai** and is currently correct. The older personal-owner deployment metadata does not establish a current wrong-repository link.
- No combined commit statuses were returned for GitHub `af69830`; this alone does not prove an Actions or webhook failure.

The local `.vercel/project.json` link file is missing. CLI commands in this checkout should specify the known project/team until a local link is deliberately established. Existing `.vercel` build assets do not substitute for that file.

### 5. Provider connector readiness remains incomplete

- The Vercel GitHub connector has stored tokens and is assigned to development, preview, and production. Token presence does not prove delivery of its configured `pull_request` trigger at `/triggers/github`.
- Two Supabase integration configurations exist: the older external installation is assigned to this Vercel project; the newer Marketplace installation has no projects assigned. The older installation supplies production-only integration environment variables. Existing manually configured Supabase server variables cover production and preview. A second installation alone is not evidence of a second app database.
- The frontend imports `supabase-config.json` directly; changing `NEXT_PUBLIC_SUPABASE_*` variables does not change that Vite client configuration. Both deployed clients currently match the intended project.
- Current Vercel environment names do not include `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, or durable worker configuration. GSC can also use encrypted per-enclave OAuth clients, which were not read or tested.
- Local Google Ads developer token and several related setup fields are empty. Individual Google Ads/GSC/Meta/Stripe grants cannot be certified from infrastructure credentials or environment-variable presence.
- Local `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `CONNECTOR_CREDENTIALS_KEY` exactly match `.env.example` placeholders. Stripe and connector encryption are therefore not production-configured locally. No credentials were rotated; changing an encryption key requires a migration plan for any existing encrypted connector records.

## Certification correction

The earlier `MASTER_CONTEXT.md` header claimed production certification and synchronization with GitHub. Live probes contradict those claims. `src/server/productionActivation.test.ts` inspects source text, local test objects, and hardcoded pass booleans; it does not perform deployed login, API, or persisted production readback checks. The existing remediation log `evidence/remediation-2026-11-18/certification-check.log` explicitly reports `NOT_CERTIFIED` and `productionActive: false`.

Supabase security advisories also flag public-schema extensions, callable security-definer functions, and disabled leaked-password protection. These require review rather than automatic permission changes. See the official [database linter guidance](https://supabase.com/docs/guides/database/database-linter) and [password protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Repair order

1. Reconcile the four unpublished commits and the preview's separately packaged backend into a reviewable source branch.
2. Make API deployment reproducible from that branch; require JSON health and error responses before treating a deployment as operational.
3. Reconcile missing database objects and worker/provider configuration; validate an authenticated Client Enclave and real provider reads without bypassing RLS.
4. Run the repository verify gate and exact-candidate live acceptance checks, then separately approve production activation. Recheck both production domains after activation.

This audit changed only documentation on `audit/connection-health-2026-11-21` and preserved the pre-existing `.mcp.json` edit. No application fixes or remote releases were performed.

Audit handling note: an early diagnostic accidentally printed the local database connection string, including its credential. It is excluded from these documents. Rotate the affected password through a coordinated secret update; no rotation was performed during this audit.
