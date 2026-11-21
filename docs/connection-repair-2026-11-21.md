# Connection repair — 21 November 2026

Follow-up to [the connection audit](connection-audit-2026-11-21.md). Work is on `audit/connection-health-2026-11-21`, based on the four previously unpublished dashboard/UI commits. The existing `.mcp.json` edit is excluded from this repair.

## Applied to Supabase

Migration `20261121002753_reconcile_connection_schema` was applied to `rqktjogegbdlsdvpusie`. Its source is `backend/database/migrations/0024_reconcile_connection_schema.sql`.

- Added `token_usage_records`, `decision_traces`, `brain_entities`, and `brain_relationships` with RLS and explicit grants.
- Revoked anonymous access and kept telemetry/decision logs append-only for authenticated callers.
- Added constraints enforcing the same Client Enclave for graph sources, targets, and evidence documents; graph entities exclude Secret Vault IDs.
- Scoped RPCs execute as the caller rather than bypassing RLS.
- Post-migration catalog checks: four tables present, zero anonymous grants, zero append-only grant violations, four graph constraints, zero public-table RLS failures. A role with no membership sees zero rows in all four new tables. Health advisor returned no findings.
- No existing application rows were changed. Rollback means stopping the new writers and reverting application code while retaining the additive tables and their data; no destructive down migration is automatic.

## Implemented in source

- Added `api/gateway.mjs`, importing a bundled Express API from `build/server.mjs`. Bundling internal imports avoids stock Node ESM failures on extensionless TypeScript imports. The standalone server keeps its listener and lifecycle handlers; Vercel imports do not bind a port or start retention timers.
- Routed `/api`, `/api/*`, `/healthz`, and `/readyz` to the API ahead of the SPA fallback. Vercel builds the client separately, keeping the server bundle/source map out of the public output.
- Restored upload of `vercel.json`; excluded environment files and local tool/evidence directories from Vercel uploads. Linked the local checkout to the existing intended project without changing its Git connection.
- Readiness now probes the database without reading Client Enclave rows or using a service key. Connectivity alone does not establish authenticated acceptance or durable execution readiness.
- On Vercel, in-memory job, schedule, and webhook mutations fail with 503. Removed the default inbound webhook signing secret. A persistent adapter and supervised worker remain required.
- Example Stripe credentials no longer count as configured. Example encryption keys are rejected; production cannot silently use the development fallback. Existing encrypted records and keys were not rotated.
- Added HTTP tests against the actual exported app and targeted connector/readiness/queue regression tests. Bounded Vitest cold-import concurrency after the initial full run timed out in a dashboard import.
- Removed the hardcoded all-true certification assertion and labeled the remaining S20 tests as local acceptance fixtures. They do not establish live production certification.
- Added `npm run smoke:deployment -- --url=https://HOST --commit=SHA`. Add `--require-ready` for the release gate. Its routing verdict is separate from readiness and authenticated acceptance.

## Verification and deployment

Final `npm run verify` passed after the cloud/CI fixes: production build, TypeScript, 120 test files passed, 867 tests passed, and 3 tests skipped (one skipped file), followed by four HTTP checks of the built API under stock Node. The additional queue checks are included. Secret scans of both repair batches found no configured secrets. `git diff --check` passed for the repair files.

The new smoke command was run against the existing production domain and exited 1, reproducing its HTML-on-API failure. No existing preview was promoted.

Published the repair branch and opened draft [PR #50](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/pull/50). The GitHub connector refused PR creation with 403 despite read access; the existing local Git authentication succeeded as a fallback. That connector still needs PR write permission.

Vercel automatically built the exact pushed commit, confirming the repository deployment trigger. The first cloud startup exposed an ESM resolution failure hidden by Vite's resolver. CI also exposed two dependencies on the ignored local sprint database and a missing build step. The follow-up bundles internal API imports, checks the artifact under stock Node, validates committed historical evidence instead of local file existence, and builds fixtures in CI. Fresh validation and deployment results follow below.

The second commit passed all four GitHub CI jobs. Live startup then exposed PptxGenJS's ambiguous ESM package entry. Running the artifact with `--no-experimental-detect-module` reproduced the module failure locally. The server-side renderer now explicitly loads the package's CommonJS export, and local/CI verification use that stricter Node mode.

## Remaining work

1. Persistent job storage adapter, supervised worker lifecycle, and verified dispatch/reconciliation. A serverless function or an environment flag is not a substitute.
2. Real Stripe credentials and Google Ads prerequisites; authenticated Google/Meta/Stripe provider grant checks for the intended Client Enclave. Do not infer success from key presence.
3. Coordinated connector-encryption key migration for any records encrypted with the example key. The local example key has not been replaced blindly.
4. Rotate the database password exposed in an earlier audit diagnostic and obtain a supported pooler endpoint if direct PostgreSQL access is required; direct-host DNS failed from this machine. The application uses Supabase HTTPS.
5. Authenticated two-enclave acceptance and exact-candidate readiness before a certified production activation. The production domain must be rechecked after any release.
