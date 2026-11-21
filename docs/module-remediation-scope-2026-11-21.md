# Growth OS module remediation scope — 21 November 2026

This is the user-confirmed implementation scope based on the user's instructions and authenticated production observations. It is not a certification that modules work. The original connection and Analytics audit continues independently.

## Decisions confirmed by the user

- Remove demo content, ungrounded metrics, fabricated execution evidence and successful-looking states that have no corresponding operation.
- Shorten interface text and simplify workflows while keeping the production modules useful.
- Creative Studio: reliable copy and images first; start with free quotas or local providers. A configured credential is not proof of generation.
- Social Hub: LinkedIn and Instagram first. Publish on the user's Publish action or an approved schedule. Drafting alone must never publish.
- Agent observability: an in-app live browser view and action log, with a separate session for each Client Enclave. A headless process needs a stream to be visible; simulated timelines do not satisfy this requirement.
- Investigate the reported TinyFish/MiroFish navigation issue and test all sibling tabs and deep links.
- Use the installed grill-me/grilling and Understand Anything skills to refine scope and inspect architecture before broad implementation.

## Confirmed boundaries

- Keep the existing production module set during the first cleanup. Remove obvious filler, synthetic timelines and false readiness; determine module deletion from verified usage and explicit product decisions.
- Preserve genuine client records and existing work. Identify any stored demo records before proposing deletion. Do not read Secret Vault contents.
- Use isolated acceptance identities and Client Enclaves for writes. Do not publish external test posts without approval of the exact content and destination.
- Do not provision paid services or assume free quotas are unlimited. Continuous scheduling and live browser streaming need a host decision and implementation.
- Verify each capability by its actual result: generated output bytes, provider receipts, durable records, reload/restart behavior, and enforced Client Enclave boundaries. Empty or unavailable is preferable to fabricated success.

## Confirmed findings

| Finding | Evidence | Consequence |
| --- | --- | --- |
| Social provider is unconfigured but returns four connected mock channels | Production GET /api/social/status and /api/social/channels, with the signed-in user | Connection claims are false |
| Unconfigured social dispatch returns published/scheduled success and fake URLs | src/server/providers/socialDistribution/socialSchedulerAdapter.ts | Remove false-success branch before real posting acceptance |
| Search Console says connected while no grant exists | Production GET /api/gsc/status: connected=true, hasGrant=false | A saved setting is being confused with usable authorization |
| Agent Cockpit contains timed queue/model/tool/review messages | src/pages/AgentCockpit.tsx | Replace with real execution events |
| Agent browser research uses HTTP fetch, not a browser session | src/lib/computerRuntime.ts | Live Chrome needs implementation |
| Scheduler state and Run Now history live in React state | src/pages/Scheduler.tsx | Reload loses schedules; UI does not dispatch execution |
| Module Ready/Configured badges come from static configuration | src/data/suiteHubConfig.ts, ModuleOperationalCard.tsx | Status must be measured |
| Attribution does not fetch existing reporting metrics | src/pages/AttributionRoiPage.tsx | Connect the available backend and label missing inputs |
| Email drafts are local timed operations | src/pages/EmailMarketingPage.tsx | Generation/send must not be implied |
| Browser Supabase target is committed JSON | src/lib/supabaseClient.ts | Preview isolation cannot be fixed with server variables alone |

Static TinyFish/MiroFish route mappings are correct. The reported wrong-tab behavior still needs browser reproduction; do not rewrite routing based only on the report.

## Implementation order

1. Remove false-success backend paths and synthetic progress/status in production.
2. Verify module navigation and deep links; simplify repeated UI framing and unsupported claims.
3. Finish copy/image generation using verified provider capabilities and persist actual artifacts.
4. Add Client Enclave-scoped LinkedIn/Instagram connections, explicit publishing and provider receipts.
5. Implement persistent scheduling and supervised execution with restart/retry/deduplication checks.
6. Add isolated browser sessions, in-app streaming, real action events, cancellation and teardown.
7. Run module-by-module acceptance on approved client inputs and disposable write records.

## Skills and analysis gate

The official Understand Anything package is installed at C:/Users/khwaj/.codex/understand-anything; its core runtime builds successfully. Its Codex skills are linked under C:/Users/khwaj/.agents/skills. grill-me and its grilling dependency are installed under C:/Users/khwaj/.codex/skills.

The user-confirmed scan exclusions are in ../.ua/.understandignore. They exclude credentials, environment files, runtime data, browser traces and generated outputs. The user approved this exclusion file before analysis. No complete knowledge graph has been generated yet. Auto-update hooks are not enabled.
