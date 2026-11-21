# Production connection release — 21 November 2026

The user authorized merging and deploying the verified connection repair. This release restores the web/API/database path; durable automation remains unavailable until its persistent adapter and supervised worker are implemented and deployed. This is not full platform certification.

## Release corrections and checks

- Independent Standards and Spec reviews found unlabeled sample metrics in the three inherited dashboard variants. Those routes are now development-only. The built-client gate asserts their route strings are absent from production JavaScript. Design work remains available locally.
- The root `/api` and unknown API subpaths return JSON 404 responses. The deployment smoke check now covers eight public routes, including the main application page.
- `scripts/verifyAuthenticatedDeployment.mjs` creates two isolated temporary identities and Client Enclaves. Administrative credentials are used solely for fixture setup/cleanup; every acceptance API/database request uses a real user JWT. It checks own-enclave reads, foreign-enclave API rejection, and RLS denial in both directions, then removes its fixtures. Do not supply real customer identities to this helper.
- Authenticated acceptance passed against the existing repaired preview before this release, with fixture cleanup completed. It will be repeated on the production candidate and final production domain.
- Both independent reviews cleared their release blockers after these changes. Final local verification passed build, typechecking, 868 tests (3 skipped), production route isolation, and five strict-Node HTTP checks.
- The verified local Gemini key has been applied to Vercel's existing production/preview binding. The existing OAuth client ID/secret are configured for production, and `APP_URL` is set to the canonical production origin. Google consent and the upstream redirect registration remain unverified/blocked; no inference or publishing was performed.
- The production manifest, final CI result, deployment IDs, and live observations are maintained in [PR #50](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/pull/50) so a documentation-only commit does not create a different release candidate after acceptance.

## Operator tasks that require access or a decision

1. **Worker host**: choose a paid worker host before provisioning. Recommendation: a Render Background Worker, keeping Vercel for the web/API and Supabase for state. Render supports continuous worker processes. Entry compute is currently USD 7/month for 512 MB; browser/report workloads may require a larger plan. Workspace and network charges are separate. Railway is a viable alternative, starting at a USD 5 monthly usage commitment with usage-based totals. No worker resources were provisioned.
2. **Google OAuth**: production preflight returned `redirect_uri_mismatch` for the existing local client ID and `https://growth-os.sigmatactix.com/api/gsc/callback`. Add that exact URI in the appropriate Google Cloud OAuth client, then complete consent as a user with Search Console access. Do not paste the client secret into chat.
3. **Google Ads**: supply a valid developer token and actual Google Cloud project ID. The local `GOOGLE_PROJECT_ID` currently contains the Supabase project reference and must not be treated as a verified Google project. Supply the intended customer bindings through secure settings.
4. **Stripe**: configure real intended-mode Stripe credentials and webhook signing secret through Vercel settings. Local values match the examples and were not promoted to production.
5. **Connector encryption**: an owner must coordinate migration/reconnection of records encrypted with the example key before replacing the active key. Autonomous agents must not read or migrate Secret Vault contents.
6. **Database password**: rotate the password printed in the earlier diagnostic through Supabase's dashboard and update its consumers securely. Direct PostgreSQL operations also need a supported pooler endpoint on this network. The app's verified HTTPS database path does not require direct PostgreSQL connectivity.
7. **GitHub connector**: repair its PR-write access (403). Existing local Git authentication is a working fallback; no access restrictions were bypassed.

The available local Gemini key successfully authenticated a model-list request without generating content and was applied to Vercel. This proves key authentication, not inference quota, voice round-trip, or provider grants. The release does not advertise those unverified capabilities as live.

## Hosting sources checked on 21 November

- [Render background workers](https://render.com/docs/background-workers)
- [Render compute plans](https://render.com/docs/compute-plans)
- [Render's published worker pricing snapshot](https://render.com/articles/render-vs-netlify)
- [Railway pricing](https://docs.railway.com/pricing)

Worker implementation still requires a persistent storage adapter, assigned user-scoped worker identity, lease/heartbeat/reconciliation handling, and verified operation dispatch. Selecting a host alone does not complete that work.
