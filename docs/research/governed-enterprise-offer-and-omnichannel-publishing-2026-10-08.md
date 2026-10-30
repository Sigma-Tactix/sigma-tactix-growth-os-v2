# Governed Enterprise Offer and Omnichannel Publishing Reality

**Research date:** 2026-10-08  
**Decision:** Sell a paid, operator-led enterprise pilot now; do not sell the current app as a verified autonomous omnichannel publisher.

## Executive conclusion

Sigma has built a credible **governed AI growth control plane**, not yet a fully autonomous growth workforce. The code contains a multi-turn agent loop, seven declared tools, scoped workspace context, approval-gated missions, execution records, and a multi-select publishing route. Those are valuable enterprise controls. The missing layer is equally important: there is no browser-control tool in the agent runtime, the generic workflow graph executes nodes sequentially, and public publishing is currently limited to text adapters for LinkedIn, X, and Facebook. Instagram, YouTube, TikTok, media upload, durable production scheduling, and provider-approved end-to-end delivery are not complete.

The fastest credible sale is a **Governed Growth Command Sprint**: a paid 14-day managed pilot in which Sigma operates the system, creates evidence-backed campaign assets, routes them through client approval, and completes distribution with provider-native/manual operations wherever direct API delivery is not verified. The client buys a controlled outcome and an audit trail now; the pilot also funds the remaining productization.

No research can guarantee an enterprise sale today. A same-day paid discovery or pilot deposit from a warm buyer is credible; promising an immediate full enterprise platform contract is not.

## What exists now

| Capability | Evidence in the current repo | Honest commercial status |
|---|---|---|
| Agent tool use | The OpenAI-compatible agent schema declares `fetch_site_content`, Second Brain search, connector status, sandboxed command, workspace read/write, and HTTP request tools. The ReAct loop passes these tools to the model and executes requested calls. [`agentTools.ts`](../../src/lib/agentTools.ts#L105), [`aiProvider.ts`](../../src/lib/aiProvider.ts#L70) | **Locally implemented.** Live value still depends on a configured model, credentials, deployment, and successful runtime checks. |
| Browser operation | The declared tools include HTTP fetch/scraping and shell commands, but no browser-navigation, page-interaction, screenshot, or authenticated browser-session tool. [`agentTools.ts`](../../src/lib/agentTools.ts#L105) | **Unavailable as a first-class agent capability.** Do not sell “agents use a browser like an employee.” |
| Parallel sub-agents | The bounded graph has dependency checks, retries, checkpoints, and token caps, but its main `run()` loop processes the topological order one node at a time. [`boundedWorkflowGraph.ts`](../../src/lib/boundedWorkflowGraph.ts#L117) A specialist audit has an internal `Promise.allSettled` fan-out, so some parallel work exists in a specific flow. [`server.ts`](../../server.ts#L4091) | **Partial and flow-specific.** It is not a general collaborative multi-agent workspace. |
| Shared context | Each run receives server-scoped context; agents can query Second Brain and read/write workspace files. Mission tasks carry mission, plan, entry-agent, and execution-agent IDs. [`aiProvider.ts`](../../src/lib/aiProvider.ts#L147), [`server.ts`](../../server.ts#L5014) | **Implemented seams, not yet a live shared-memory collaboration claim.** |
| Governance | Mission dispatch creates `Pending Approval`; owner/admin approval is the execution gate, with separation of duties when a second approver exists. [`server.ts`](../../server.ts#L4972), [`server.ts`](../../server.ts#L5040) | **Strongest sellable differentiator.** Sell controlled execution, permissions, and evidence—not unbounded autonomy. |
| Creative production | Static-image provider paths exist. A governed HyperFrames path has locally produced a real 1080x1920 H.264 MP4, but it is deterministic composition, not AI-generated source footage; deployment dependencies remain. [`image-studio-runtime-research-2026-10-07.md`](../image-studio-runtime-research-2026-10-07.md), [`video-studio-black-screen-research-2026-10-07.md`](../video-studio-black-screen-research-2026-10-07.md) | **Sell as managed creative production subject to provider/runtime readiness.** Do not sell unlimited generative video. |
| Social publishing | The guarded route requires owner/admin access and an approved asset. It iterates chosen channels and records per-channel outcomes. [`server.ts`](../../server.ts#L5529) Only LinkedIn, X, Facebook, Notion, and WordPress have adapters; the three social adapters send text, not image/video. [`server.ts`](../../server.ts#L7510) | **Partial.** No verified “publish every format to every social channel in one click” claim. |
| Scheduling and receipts | A campaign-bundle module models approval hashes, partial outcomes, retries, leases, and scheduled jobs, but the scheduler is an in-memory `Map`; it is not durable infrastructure. [`campaignBundlePublisher.ts`](../../src/lib/campaignBundlePublisher.ts#L216) | **Design/locally tested seam.** Production delivery still needs persistent jobs, workers, idempotency, and provider receipts. |

One additional risk must be fixed before LinkedIn is called production-ready: the current adapter uses the legacy `/v2/ugcPosts` endpoint without the required `Linkedin-Version` header, while LinkedIn says the Posts API replaces `ugcPosts` and requires version headers. The Facebook adapter is pinned to Graph API `v19.0`, so its supported-version status also needs current verification before use.

## The offer to sell immediately

### Governed Growth Command Sprint — 14 days

**Best buyer:** one warm UAE/GCC relationship with an established brand, multiple stakeholders, an active campaign or content backlog, and a real approval/compliance problem. The buyer should be the CMO, Head of Growth, Marketing Director, or business owner—not procurement as the first contact.

**Commercial proposal:** AED 27,500 fixed fee, 50% payable to reserve the sprint, with the full fee credited against a 90-day **Managed Growth Intelligence Loop** if signed within seven days of the final review. Follow-on anchor: AED 24,000/month for managed delivery or AED 44,000/month for a strategic multi-team engagement. These follow-on anchors are close to the existing internal `$6.5k/month` and `$12k/month` lighthouse model; they remain offer prices, not proven willingness to pay.

**Pilot deliverables:**

1. One evidence-backed growth diagnostic and executive decision brief.
2. One configured brand/customer context pack, with client-confirmed facts.
3. One campaign mission containing channel-specific copy for LinkedIn, X, Facebook, Instagram, YouTube Shorts, and TikTok.
4. Three approved static creative masters and two short vertical motion assets, subject to verified renderer/provider readiness.
5. A named human approval gate before any public action.
6. Assisted distribution: direct API delivery only on a connector proven live for that client; otherwise client-approved native scheduling/manual posting.
7. A completion record showing what was proposed, approved, created, posted, failed, and delivered, with links or platform receipts where available.

**What the contract must not say:** “fully autonomous,” “all channels live,” “continuous posting without review,” “browser-operating agents,” “guaranteed growth,” or “verified enterprise SaaS.”

**Close-today motion:** approach 5–10 warm decision-makers, offer one category-exclusive sprint slot, show a 15-minute approval-to-artifact demo, and ask for the paid reservation—not a long transformation contract. The demo should show the approval gate, task lineage, generated artifact, and truthful channel-result ledger. If the buyer requires security/procurement review, close a paid discovery or signed pilot order today and schedule enterprise onboarding after review.

## Official publishing constraints

“Publish everywhere in one go” can be one user action, but it cannot be one atomic transaction. Each network has separate OAuth, permissions, media-upload flows, review/audit rules, asynchronous processing, limits, and failure states. The product must report `succeeded`, `failed`, or `pending` per destination and never mark the whole campaign published because one channel succeeded.

| Destination | Official platform requirements | Current Sigma gap |
|---|---|---|
| LinkedIn Page | LinkedIn's current Posts API supports text, images, video, documents, and multi-image organic posts. Organization publishing needs `w_organization_social` and an authorized Page role. Community Management is a vetted product with development/standard tiers; standard access requires an access request and use-case screencast. [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api), [Community Management overview](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview) | Migrate from legacy `ugcPosts` to `/rest/posts`, add version headers and media initialization/upload, verify approved app access and organization role, then capture the returned post URN. |
| Facebook Page | Page publishing uses a Page access token and `pages_manage_posts`, which depends on `pages_read_engagement` and `pages_show_list`; photo/video publishing uses different Graph edges and upload flows from a text `/feed` post. Customer-account access can require App Review, Advanced Access, and Business Verification. [Meta permission reference](https://developers.facebook.com/docs/permissions/reference/pages_manage_posts/), [Page photos](https://developers.facebook.com/docs/graph-api/reference/page/photos/) | Current adapter sends text to a pinned old Graph version only. Confirm current Graph version, token scopes/access level, Page task, media flows, and app-review state. |
| Instagram | Meta limits publishing to professional accounts. With Facebook Login it requires a linked Page plus `instagram_basic`, `instagram_content_publish`, and `pages_read_engagement`; Reels use container creation, processing, then `media_publish`. Meta currently states a limit of 100 API-published posts per account in a rolling 24 hours. [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/), [Meta Instagram API collection](https://www.postman.com/meta/workspace/instagram/documentation/23987686-9386f468-7714-490f-9bfc-9442db5c8f00) | No publish adapter. Add professional-account discovery, media hosting/upload, container polling, `media_publish`, permission/access-level verification, and receipt capture. |
| YouTube / Shorts | Uploads use `videos.insert` with user OAuth and the `youtube.upload` scope. Uploads from unverified API projects created after 28 July 2020 are restricted to private viewing until the project passes audit. Processing is asynchronous and resumable upload is recommended. YouTube currently categorizes qualifying square or vertical videos up to three minutes as Shorts; there is no separate Shorts upload endpoint. [Upload guide](https://developers.google.com/youtube/v3/guides/uploading_a_video), [`videos.insert`](https://developers.google.com/youtube/v3/docs/videos/insert), [server-side OAuth](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps), [Shorts classification](https://support.google.com/youtube/answer/15424877) | No upload adapter or YouTube OAuth lifecycle for publishing. Add resumable uploads, privacy/audit-state handling, processing checks, channel identity, and final video receipt. |
| TikTok | Direct Post requires a registered app, approved `video.publish` scope, user authorization, current creator-info UI, explicit user consent, and async status tracking. TikTok requires the export UI to show creator identity and preview, keep preset copy editable, offer current privacy options with no default, and leave interaction choices off unless the user selects them. Unaudited clients are private-only; URL pulls require verified domain ownership. [Direct Post setup](https://developers.tiktok.com/doc/content-posting-api-get-started), [Content Sharing Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines), [Direct Post reference](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post), [status](https://developers.tiktok.com/doc/content-posting-api-reference-get-video-status) | No adapter. Add audit readiness, compliant consent/export UX, creator-info query, video/photo upload, commercial/AIGC disclosures, domain verification, polling/webhooks, caps, and receipt capture. |
| X | X's v2 API creates posts with `POST /2/tweets` using an approved developer project/app and a user-context OAuth token; media is uploaded first and referenced by media ID. X currently advertises credit-based pay-per-use API access. [Official X docs repository](https://github.com/xdevplatform/docs/blob/main/x-api/posts/manage-tweets/introduction.mdx), [X Developer Platform](https://developer.twitter.com/) | Current adapter can send text only. Verify developer billing/access and token scopes, then add v2 media upload/finalize/status, threads, refresh, rate/cost controls, and receipts. |

## Required product shape for a real Creative Mission Control

A production version should use one approved campaign bundle and fan it out into platform-specific child jobs:

`evidence + brand context -> channel variants -> image/video artifacts -> approval hash -> per-channel jobs -> provider polling/webhooks -> receipt ledger -> retry or human recovery`

The minimum release gate is:

- verified OAuth handshake and exact business identity for every enabled channel;
- server-side secrets and refresh-token lifecycle;
- media validation and platform-specific upload adapters;
- persistent queue, worker leases, idempotency keys, retries, and dead-letter recovery;
- best-effort parallel fan-out after approval, never an atomic “all succeeded” assumption;
- immutable approval hash so edits invalidate approval;
- per-channel status and provider post ID/URL;
- public-post verification and deletion/revocation handling;
- explicit AIGC/disclosure controls and brand/legal review;
- no “live,” “connected,” or “published” label until the provider confirms it.

## Sales position

The enterprise story is not “replace the marketing team with autonomous agents.” It is:

> Sigma gives growth teams one governed command layer where AI prepares evidence-backed work, accountable humans approve it, operators and verified integrations execute it, and leadership can see exactly what happened.

That is sellable before full omnichannel automation because enterprise buyers already have tools for posting; their harder problem is fragmented context, uncontrolled AI output, slow approvals, weak accountability, and no defensible execution record. The service-led pilot proves that value while the missing delivery adapters and provider approvals are completed.
