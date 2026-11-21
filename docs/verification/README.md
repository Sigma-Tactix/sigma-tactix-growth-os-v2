# Growth OS verification — 21 November 2026

**Not certified.** Production still serves `896eafb`; the module fixes are a separate branch candidate on `audit/module-workflows-2026-11-21`. A passing navigation check or a configured key does not establish a working provider workflow.

Candidate gate: `npm run verify` passed build, typecheck, 905 tests (3 skipped), client route isolation and seven built-API HTTP checks. Eight Atomic Tool tests also passed. Independent review remains incomplete because the agent usage limit interrupted the reviewers.

## Evidence and limits

| Area | Observed result | Remaining acceptance |
| --- | --- | --- |
| Analytics installation/build | Clean `npm ci`, full verify: 868 passed, 3 skipped; commit `2378cec`; Vercel preview READY | PR #51 has not been merged or promoted |
| Public production + Analytics preview HTTP | 16 probes: 12 passed, 4 readiness probes blocked by missing worker | Durable execution and supervised runtime |
| Authentication and Client Enclave isolation | Disposable-user sign-in/refresh, own reads, foreign API denial and RLS denial passed | Google provider revocation and every operation boundary |
| Report/task persistence | Fixture report created, reread, foreign reads/writes denied, deleted; task persisted and rejection reread | Actual approved task execution, provider receipt and report generation |
| Invalid JSON | Production returned 500; candidate fixes 400 and body-limit 413 | Exact deployed candidate response |
| Module navigation/layout | 116 built-candidate rendering views passed: 14 module targets + 15 secondary surfaces, two widths, light/dark. Rapid navigation triggered API rate limits; rendering passes do not establish backend connectivity | Every control, keyboard journey, real output and persistence |
| TinyFish / MiroFish | Correct distinct query routes in authenticated browser; reported switch not reproduced | Continue testing browser history and repeated transitions |
| Google | Signed-in session reports Google provider; safe APIs returned 200 | GSC grant missing despite production connected flag; candidate corrects flag |
| Social | Production has no configured publishing provider but lists four mock connections | Candidate removes mocks/false receipts and implements the documented Postiz public API, media upload and per-channel receipts; live connections/approved-post acceptance remain required |
| Images | Candidate repairs Cloudflare JSON/base64 handling, validates Cloudflare/Gemini/Hugging Face image framing/dimensions, removes unsupported reference upload and synthetic token counts, and uses free-first defaults | Live Cloudflare/Gemini generation and durable output/reload checks |
| Attribution | Candidate reads real reporting metrics and excludes fixture results | Provider data reconciliation; no cross-platform deduplication claim |
| Agent work | Candidate queues real tasks and removes timed fake execution messages | Actual execution, isolated browser stream/action log, cancellation and teardown |
| Scheduling | Vercel correctly rejects volatile mutations with 503 | Persistent scheduler/worker and restart/retry/deduplication acceptance |
| Preview protection | **Failed**: anonymous preview access; production/preview database bindings shared | Candidate build now blocks previews without matched, dedicated staging bindings and rejects preview service-role injection; protection and real staging remain required |
| Public agent discoverability | Is Agentic score 46; public-site scan only | Public metadata/trust-page work; never expose private modules to improve score |
| Architecture scan | Source-only exclusions confirmed; baseline and partial semantic fragments prepared | Full Understand Anything graph interrupted by agent usage limit; no complete graph claimed |

Machine-readable evidence: [authenticated workflow](authenticated-workflow-production-2026-11-21.json), [public HTTP](public-http-2026-11-21.json), [module UI](module-ui-2026-11-21.json), [static API inventory](functionality-inventory.json), [public discoverability](is-agentic-2026-11-21.json). The inventory is discovery, **not runtime verification**. Secrets and client exports are excluded.

## Module acceptance backlog

| Module / surface | Current verified extent | Work still required |
| --- | --- | --- |
| Editorial copy | Loads | Live generation, source grounding, review, save and reload |
| Image Studio | Loads; adapter regression checks | Live output, saved artifact and reload; unsupported reference-image upload removed |
| Video Studio | Loads | Deferred behind copy/images; remove unsupported controls/claims |
| Social publishing/carousels | Loads; fail-closed adapter checks | Live Enclave connections, uploaded-media acceptance, Publish and approved-schedule receipts |
| Social listening | Loads | Actual mentions, source links, refresh, reply approval/persistence |
| SEO / AEO | Loads; GSC status read | OAuth grant, property selection, real query data, export and expiry |
| CRO / landing pages | Loads | Real generation, intake validation, preview/download and saved output |
| Inbound / WhatsApp | Loads | Verified webhook signature, actual lead routing and persistence |
| Outreach / ABM | Loads | Real research, grounded drafts, approval and delivery receipts |
| Paid media | Loads | Actual credentials/access, read-only metrics, approved mutation and revocation |
| Email / lifecycle | Loads | Remove local timer/template performance claims; generation, save, approved delivery |
| Competitive intelligence / TinyFish | Loads; navigation correct | Source-linked research and real artifact persistence |
| Market simulation / MiroFish | Loads; navigation correct | Run actual simulation; distinguish model assumptions from observed results |
| Attribution | Loads; candidate backend hookup | Verify real provider inputs and currency/window semantics |
| Agent Cockpit / Action Queue | Task persistence/rejection fixture checks | Full approval-to-execution journey and real-time events |
| Scheduler | Unavailable durable mutation confirmed | Persistent adapter, execution runtime, delivery and restart checks |
| AI Explorer | Source review found fixed 2023 metrics and synthetic query response | Replace sample data and timer with grounded queries/results |
| Team learnings / VANTA | Source review found local-only learnings and illustrative telemetry | Real user-scoped persistence, approved learning lifecycle and measured status |
| Settings / billing / connectors | Safe status APIs inspected | Every save/reload, encryption migration, actual billing and credential revocation |

Do not treat inherited certification documents or source-string tests as live acceptance. No real-client records were edited, no external test posts sent, and no paid resources provisioned.

## Owner actions

1. **Protect preview and isolate data:** Vercel Project → Settings → Deployment Protection; enable protection for previews. Create a dedicated staging Supabase project/branch and bind its URL/public key to preview. The candidate supports `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`; both must match the API staging bindings. Preview builds reject production fallback, mismatched bindings and a service-role key. Existing deployments are unaffected until changed.
2. **Google Search Console:** Google Cloud → Google Auth Platform → Clients → intended web client → add `https://growth-os.sigmatactix.com/api/gsc/callback`. Keep the separate Supabase sign-in callback. Complete GSC consent from the intended Client Enclave, choose a property and verify data. Keep only scopes actually needed; submit verification only for the retained scopes requiring it.
3. **Free-first images:** create/use a Cloudflare account, enable Workers AI, and add the narrowly scoped API token/account ID in secure server settings. Do not paste tokens in chat. Free-plan quotas must be checked before use; enabling a paid plan changes billing behavior.
4. **LinkedIn / Instagram:** identify the intended LinkedIn destination and eligible Instagram professional profile; complete the provider connection/consent. Then approve one exact test post and destination. Current provider-free UI cannot publish.
5. **Runtime:** choose an existing always-on computer for a zero-hosting-bill pilot, or an available free VM allowance with its capacity/idle constraints. A worker executes approved tasks when the browser is closed; live browser viewing additionally needs an isolated browser process and stream. Hosting selection alone does not implement the persistent adapter. No host is provisioned.
6. **Secrets:** rotate the Supabase database password exposed by an earlier diagnostic and update direct-connection consumers securely. Coordinate Secret Vault record migration/reconnection before replacing the connector encryption key; autonomous agents cannot read those vaults.
7. **Google Ads:** developer-token guidance in the historical release document is outdated. Follow the current Google Ads API Cloud access process and supply the actual Google Cloud project/customer bindings securely. The local project ID is not verified.
8. **Tooling (recommended):** install Vercel CLI with `npm i -g vercel`, then authenticate, to enable `vercel env pull`, deployments and logs. GitHub connector PR writes also need its installation permissions repaired; existing local Git authentication works.

Official references: [Postiz create-post contract](https://docs.postiz.com/public-api/posts/create), [Postiz uploads](https://docs.postiz.com/public-api/uploads/upload-file), [Cloudflare pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [FLUX response contract](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/), [Google Ads access](https://developers.google.com/google-ads/api/docs/api-policy/developer-token), [Is Agentic report](https://is-agentic.com/scan/growth-os.sigmatactix.com).
