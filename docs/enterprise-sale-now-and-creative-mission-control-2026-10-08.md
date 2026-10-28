# Enterprise Sale Now + Creative Mission Control

**Date:** 2026-10-08  
**Decision:** Sell a managed, evidence-backed growth outcome now. Do not sell the current application as autonomous omnichannel publishing software.

## Executive answer

Sigma has built a governed execution core, not yet a complete autonomous growth workforce.

The current product can queue agent work behind owner/admin approval, run bounded model-tool loops, use scoped workspace context, create image and short-video artifacts through configured providers, record task results, and make real text-only posts through a limited set of connected channels. It cannot yet give every sub-agent an interactive browser, execute a sub-agent DAG in parallel, continuously schedule work through a persistent worker, or create and publish media to every major social channel from one control surface.

That distinction changes the sales motion:

- **Sell now:** a founder-led Managed Growth Intelligence Sprint delivered through the Growth OS.
- **Do not claim now:** autonomous cross-channel operation, always-on scheduling, or universal social publishing.
- **Build next:** one Campaign Mission Control that joins evidence, creative production, approval, scheduling, provider delivery, receipts, and outcomes.

## What is real in the repository

| Capability | Current state | Evidence | Commercial meaning |
| --- | --- | --- | --- |
| Approval-gated agent run | Implemented locally | `server.ts` queues `Pending Approval`; owner/admin approval triggers execution | Safe demonstration of governed execution |
| Model tool use | Implemented locally | `src/lib/agentTools.ts` exposes site fetch, Second Brain search, connector status, shell, file read/write, and HTTP | Agents are more than chat prompts, but they do not have an interactive browser |
| Multi-turn agent loop | Implemented locally | `src/lib/aiProvider.ts` runs a bounded ReAct loop for Gemini and OpenAI-compatible providers | Can research, inspect, create files, and return a logged deliverable |
| Sub-agent plan | Implemented as a sequential chain | `src/lib/missionExecution.ts` makes each node depend on the previous node | Shared upstream results exist; parallel execution does not |
| Swarm selection | Queueing implemented | `/api/workspace/run-swarm` creates separate approval tasks | It is a governed bundle, not automatic parallel teamwork |
| Image creation | Provider-gated implementation | Creative gateway supports configured Gemini, Hugging Face, Cloudflare, or ComfyUI adapters | Demo only when the selected provider is verified live |
| Short video | Provider-gated or deterministic render | Hugging Face video adapter and approved HyperFrames MP4 render path | Useful for supervised production; not an always-on video factory |
| Public publishing | Limited server implementation | Text publishing adapters exist for LinkedIn, X, and Facebook; Notion and WordPress are also supported | Requires verified client credentials and explicit approval |
| Unified publish UI | Not implemented | Content Engine approval button currently emits a success toast but does not call the approval or publish route | Must not be shown as completed execution |
| Instagram, TikTok, YouTube media publishing | Not implemented | No matching publish adapters in the active publisher map | Managed/manual delivery only until official adapters pass verification |
| Continuous scheduling | Not implemented | Scheduler is local React state; UI states that no worker daemon is provisioned | No “always on” claim |

Focused local verification on 2026-10-08: 25 tests passed across agent tools, mission execution, campaign publishing, and creative-provider routing. No authenticated social-provider round trip was performed.

### Execution gaps that need correction before an enterprise autonomy claim

- Mission nodes declare `permittedTools: []`, while the model execution path receives the entire generic tool catalogue. The workflow policy and actual tool grant are not yet the same control.
- The approved mission graph calls `executeAgentTask` without its database/workspace execution context. It still receives a scoped snapshot of the Second Brain, but live vector retrieval and the `search_second_brain` tool cannot use workspace database context in that path.
- `get_connector_status` returns a hard-coded list of Google Ads, Meta Ads, and GA4 when `currentChannels` is absent. Missing evidence must return `Not checked` or an empty verified set, never an optimistic connected list.
- Prior sub-agent results are shared by serializing them into the next node's goal. Separately queued swarm tasks do not have a shared working memory or an automatic merge step.
- Model-requested tool calls and channel publishing both execute through sequential loops. This is bounded execution, not parallel execution.

## The offer to sell today

### Name

**14-Day Governed Growth Command Sprint**

### Buyer

A founder, CMO, or growth leader at one warm, reachable B2B company that already spends on marketing and has a visible growth problem: unclear positioning, slow campaign production, fragmented reporting, weak content velocity, or unreliable agency execution.

Do not begin with cold mass outreach. Start with the ten people most likely to take a call today: past clients, active prospects, former colleagues, agency owners, fractional CMOs, founders in Nazim's network, and partners who already trust Sigma's delivery ability.

### Promise

> In 14 days, Sigma will turn your existing website, campaign evidence, and leadership context into one governed growth command loop: cited diagnosis, executive decision brief, approved multi-channel campaign kit, assisted distribution, and a prioritized 30-day experiment plan. Every AI-assisted action is reviewable before anything leaves your business.

This is a deliverable promise, not an ROI guarantee.

### Deliverables

1. One evidence-backed growth and positioning diagnosis.
2. One prioritized revenue-leak map with source references and explicit unknowns.
3. One executive decision brief: what to do, why, owner, duration, dependency, and measurement method.
4. One campaign concept adapted into:
   - LinkedIn post or carousel draft
   - X thread draft
   - Instagram carousel/reel brief
   - one brand image
   - one 5-15 second short-video concept or approved render, subject to a verified provider
5. One governed task and approval record showing what the system created and what a human approved.
6. One 30-day experiment backlog with success measures and connector requirements.

The first cited diagnosis and executive decision preview are delivered within 48 hours after complete intake. The remaining sprint configures context, develops creative, obtains approval, assists distribution, and closes with an execution record.

### Commercial terms

Use a fixed, enterprise-sized pilot instead of discounting the work into a low-value software trial:

- **AED 27,500 fixed fee**
- **50% paid to reserve the sprint**
- Full sprint fee credited toward a 90-day Managed Growth Intelligence Loop when signed within seven days of the final review
- Follow-on anchor: **AED 24,000/month** managed or **AED 44,000/month** strategic multi-team engagement

These are offer prices aligned to the internal lighthouse model, not proven willingness-to-pay data. If procurement prevents the sprint reservation, sell a paid discovery with a named budget owner and dated pilot decision; do not give away the diagnosis as a free audit.

### Same-day close condition

Ask for one decision, not a broad software commitment:

> “Will you authorize the 50% sprint reservation today so we can deliver the first cited executive decision preview within 48 hours?”

## Today's deal sequence

### Hour 1: choose one account

Pick a single organization where all three are true:

- Nazim can reach the decision-maker directly today.
- The company has an active marketing motion and a visible costly bottleneck.
- The buyer can supply a domain, current offer, two campaign examples, and a 30-minute interview.

Do not spend today building a large prospect list.

### Hour 2: create the account-specific proof

Run a bounded public-web diagnosis of that company's domain. Capture only verifiable findings. Produce a one-page preview containing:

- three observed growth leaks;
- one opportunity hypothesis;
- the evidence URLs;
- what cannot be known without account access;
- a mock campaign direction clearly labelled as a draft.

### Hour 3: send the founder message

**Direct message**

> Hi [Name] — I reviewed [Company]'s public growth journey today and found three specific issues worth your attention: [fact 1], [fact 2], and [fact 3]. I put the evidence into a one-page operator brief. Sigma can turn this into an approved 30-day growth plan and a ready-to-publish campaign kit within 48 hours. This is a managed sprint run through our governed Growth OS, so nothing is published or changed without your approval. Can I show you the brief in 20 minutes today?

Do not use placeholders or unsupported findings in the sent version.

### Hour 4: run a 20-minute decision call

1. **3 minutes:** confirm the costly bottleneck in the buyer's words.
2. **5 minutes:** show the three sourced findings.
3. **5 minutes:** show one governed flow: evidence -> proposed action -> approval -> artifact/log.
4. **4 minutes:** describe the 48-hour deliverables and required access.
5. **3 minutes:** ask for the paid sprint authorization.

Do not tour the entire application. Demonstrate one complete path with an artifact and an approval record.

### Hour 5: send a one-page order form

The order form should state:

- exact deliverables;
- 48-hour clock starts after intake is complete;
- buyer responsibilities and required access;
- no media-spend change or public publication without approval;
- paid sprint fee and credit terms;
- acceptance criteria;
- exclusions: live connector work, unsupported channels, custom integrations, and performance guarantees unless separately scoped.

### Hour 6: close and onboard

Collect payment, named approver, domain, current offer, target audience, brand files, campaign examples, success measure, and permission boundaries. Record anything supplied by the buyer as client-provided evidence, not verified platform truth.

## Objection handling

**“Is this just another AI content tool?”**  
No. The sellable difference is the governed operating loop: client context, cited evidence, scoped agent work, human approval, deliverables, and execution records. Content generation is one output.

**“Does it post everywhere automatically?”**  
Not yet. LinkedIn, X, and Facebook text adapters exist, but every account still requires verified credentials and approval. Instagram, TikTok, YouTube media publishing, and durable scheduling are current implementation gaps. For the sprint, Sigma prepares the complete channel kit and manages approved delivery.

**“Can the agents browse and work together?”**  
They can fetch websites, call HTTP endpoints, use files, run bounded commands, search authorized context when the execution path supplies database context, and hand results from one sub-agent node to the next. They do not yet control an interactive browser, and the mission graph currently runs sequentially rather than in parallel.

**“Why pay for a pre-release platform?”**  
The buyer is paying for a defined managed outcome and the implementation of a governed operating loop inside their workspace, not for unsupported autonomy. The founding price exchanges a reduced rate for structured feedback and permissioned proof development.

## Creative Mission Control: the product to build

### One-screen job

Turn one approved campaign brief into channel-specific copy, images, and short videos; collect one approval packet; dispatch eligible channels; and show a receipt for every outcome.

### Small external interface

```ts
createCampaign(brief)
generateVariants(campaignId)
submitForApproval(campaignId)
scheduleApprovedCampaign(campaignId, schedule)
publishApprovedCampaign(campaignId)
getCampaignReceipts(campaignId)
```

Provider differences, upload protocols, polling, retries, rate limits, token refresh, and asset transformations remain inside channel and creative adapters.

### Required workflow

```text
Evidence + Brand Vault
        |
        v
Campaign brief -> channel variants -> image/video artifacts
        |                    |
        +------ content hash-+
                    |
                    v
             Owner/admin approval
                    |
                    v
       Durable scheduled job + worker
                    |
                    v
       Parallel provider dispatch fan-out
                    |
                    v
      Per-channel receipts / failures / URLs
                    |
                    v
          Performance ingestion and review
```

### Truthful state model

`DRAFT -> GENERATING -> READY_FOR_REVIEW -> PENDING_APPROVAL -> APPROVED -> SCHEDULED -> PUBLISHING -> PUBLISHED | PARTIAL | FAILED`

Editing approved copy or media must invalidate the approval hash and return the campaign to `PENDING_APPROVAL`.

### Channel adapter contract

Each channel adapter should expose:

```ts
interface SocialPublishAdapter {
  verifyIdentity(): Promise<VerifiedIdentity>;
  validateVariant(variant: ChannelVariant): Promise<ValidationResult>;
  uploadAssets(assets: CampaignAsset[]): Promise<UploadedAsset[]>;
  publish(variant: ChannelVariant, assets: UploadedAsset[]): Promise<PublishReceipt>;
  readPerformance(receipt: PublishReceipt): Promise<PerformanceSnapshot>;
}
```

An adapter is `LIVE` only after identity verification and a successful provider round trip. Catalogue presence, saved credentials, or a successful transport handshake is not enough.

### P0 implementation order

1. Replace the Content Engine's success-toast approval button with a real saved campaign/asset and HITL task.
2. Wire the existing approved content publish route into the UI and display per-channel receipts.
3. Move publisher implementations out of `server.ts` behind the `SocialPublishAdapter` seam.
4. Add image/media upload support for LinkedIn, Facebook, and Instagram before adding more networks.
5. Persist campaigns, versions, approvals, jobs, attempts, receipts, and artifacts in the database.
6. Replace local Scheduler state and the in-memory scheduler with a persistent queue and worker.
7. Fan out independent channel publishes with bounded concurrency and `Promise.allSettled`; retain isolated failures.
8. Add official adapters in this order: Instagram professional accounts, YouTube, TikTok, then other requested channels based on buyer demand and platform approval.
9. Add browser automation only as a governed tool for research/QA or a documented fallback where permitted; do not use it to bypass official publishing APIs or platform terms.
10. Connect published receipts and performance snapshots back into the execution ledger and weekly brief.

## Demo rules for today's sale

- Use a demo workspace only when visibly labelled `DEMO`.
- Show provider status before generating or publishing.
- Show the actual task ID, approver, timestamps, artifact, and execution steps.
- If a provider is not authenticated, demonstrate the draft and approval flow and say delivery is managed/manual.
- Never show sample leads, sample performance, or template copy as customer results.
- Never claim parallel execution from a sequential DAG.
- Never claim a scheduled campaign will run until a persistent worker completes a recorded job.

## Success measure for today

The target is not “go viral” or “finish every connector.” The target is one of these verified commercial events:

1. paid sprint authorized and payment received;
2. procurement or order form accepted with a named budget owner and dated next step; or
3. a decision call completed with the buyer's problem, economic impact, approver, and close date recorded.

Only the first event is a sale.
