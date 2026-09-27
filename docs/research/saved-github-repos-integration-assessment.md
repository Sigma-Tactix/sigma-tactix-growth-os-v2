# Saved GitHub Repositories - Sigma Tactix Integration Assessment

**Assessment date:** 2026-09-27  
**Source workbook:** [Chrome Knowledge Archive](https://docs.google.com/spreadsheets/d/1TyOzQz80xqYqraupx1MU2uHxsUXLXGOhGT0xjvyBTRE/edit?gid=504765105#gid=504765105)  
**Decision scope:** Which saved solutions can strengthen Sigma Tactix Growth OS as modules, channel connectors, MCP servers, workflow services, or implementation references.

## Executive decision

Eight saved projects are credible near-term additions or extensions:

1. **Google Ads MCP** - use as the first official, read-only, provider-backed MCP connector.
2. **Agent Reach** - extend the integration already present in the repo, but only as a research-intelligence capability layer.
3. **AgentPrism** - pilot as the React trace viewer for governed agent observability.
4. **idea-reality-mcp** - add as a narrowly scoped MCP for pre-build market and repository checks.
5. **Digital Marketing Pro** - selectively adapt its MIT-licensed skills, validation patterns, and approval gates; do not import the entire operating system wholesale.
6. **Google DESIGN.md** - use its Apache-licensed format as the canonical Brand Vault interchange contract.
7. **HyperFrames** - use as an isolated deterministic renderer for Creative/Video Studio output.
8. **Firecrawl** - strengthen the existing Firecrawl adapter/MCP seam through the hosted API or a separately governed service.

Three are good external-system integrations, not code to merge into Growth OS:

- **n8n** for workflow orchestration.
- **Mautic** for email, lead, campaign, and nurture operations.
- **OpenBot** for a future sandboxed agent-worker plane with policy and audit controls.

EveryInc Marketing-OS and Open Agent Builder are useful references but should not be copied until their repositories contain an unambiguous license file. Khoj is a capable self-hosted second-brain product, but its AGPL license and heavy overlap with the existing Sigma Second Brain make it a low-priority integration.

## Scope and method

The workbook export contained four sheets: August-2026, September-2026, Recent History Review, and Recent Bookmarks Review. The linked `September-2026` tab was filtered to 153 of 2,812 records and contained 147 GitHub URL rows, normalized to about 90 distinct repository candidates. Many URLs were duplicate README, release, issue, image, commit, topic, or profile links. This report deliberately evaluates the build-relevant subset rather than treating every saved repository as a product dependency.

Evidence came from first-party repository metadata, READMEs, package manifests, license files, official documentation, and the current Growth OS source. GitHub activity and popularity figures are point-in-time signals from 2026-09-27, not quality guarantees.

### Decision rules

- **Embed** only when the license permits it, the stack fits, and the component has a bounded responsibility.
- **Integrate by API, webhook, MCP, or separate service** when licensing, runtime, or operational isolation makes embedding unsafe.
- **Reference only** when licensing is absent or the project is mainly an architecture or UX example.
- A repository being saved, popular, recently pushed, or locally configured is not evidence that it is production-ready or connected to a real provider account.

## Ranked shortlist

| Rank | Project | Classification | Decision | Why it fits | License and activity evidence | Main risks |
|---:|---|---|---|---|---|---|
| 1 | [googleads/google-ads-mcp](https://github.com/googleads/google-ads-mcp) | Official Google Ads MCP connector | **Pilot first** | Google documents the current release as strictly read-only. It exposes accessible-account discovery, GAQL search, resource metadata, OAuth 2.0/service-account auth, and stdio or HTTP/SSE transport. This directly fits Sigma's verified reporting path without granting campaign-write authority. | Apache-2.0, Python, pushed 2026-09-25; [official integration guide](https://developers.google.com/google-ads/api/docs/developer-toolkit/mcp-server), [license](https://github.com/googleads/google-ads-mcp/blob/main/LICENSE), [API metadata](https://api.github.com/repos/googleads/google-ads-mcp). | The MCP exposes account data to its connected agent. Require per-tenant OAuth isolation, exact customer-ID matching, server-side normalized output, encrypted token storage, query limits, and trace redaction. Keep write operations on a separate approval-gated SDK path. |
| 2 | [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | Channel capability layer | **Extend now** | Covers web, YouTube, RSS, GitHub, X, Reddit, Facebook, Instagram, LinkedIn, and other research channels through ordered backends plus a `doctor` capability check. Growth OS already contains an adapter in `src/server/agentReachService.ts`. | MIT, Python 3.10+, pushed 2026-09-15; [license](https://github.com/Panniantong/Agent-Reach/blob/main/LICENSE), [README](https://github.com/Panniantong/Agent-Reach/blob/main/README.md), [API metadata](https://api.github.com/repos/Panniantong/Agent-Reach). | Several channels depend on browser sessions, cookies, unofficial CLIs, or changing anti-bot behavior. It is suitable for research intake, not authoritative ad metrics, publishing, or provider verification. |
| 3 | [evilmartians/agent-prism](https://github.com/evilmartians/agent-prism) | Embeddable React module | **Pilot now** | React 19 components can visualize LLM calls, tool executions, costs, retries, and workflows from OpenTelemetry or Langfuse-shaped traces. This fits the Agent Cockpit and the existing audit-first product direction. | MIT, TypeScript, pushed 2026-09-25; [README](https://github.com/evilmartians/agent-prism/blob/main/readme.md), [license](https://github.com/evilmartians/agent-prism/blob/main/LICENSE), [package manifest](https://github.com/evilmartians/agent-prism/blob/main/package.json). | The project describes the component set as alpha, targets a different styling setup, and requires Node 24 for its own development. Validate the published packages or adapt the UI to Sigma's Tailwind 4 tokens. Redact prompts, credentials, client data, and tool payloads before traces reach the browser. |
| 4 | [mnemox-ai/idea-reality-mcp](https://github.com/mnemox-ai/idea-reality-mcp) | MCP server | **Add as an internal pilot** | Provides an `idea_check` workflow across GitHub, Hacker News, npm, PyPI, and Stack Overflow. It can support opportunity screening and prevent duplicate internal builds. | MIT, Python, pushed 2026-09-18; [README](https://github.com/mnemox-ai/idea-reality-mcp/blob/main/README.md), [license](https://github.com/mnemox-ai/idea-reality-mcp/blob/main/LICENSE), [API metadata](https://api.github.com/repos/mnemox-ai/idea-reality-mcp). | The maintainer declares the project in maintenance mode. Its score is a modeled heuristic, not market demand proof. Store the raw source evidence and label the score as an estimate. |
| 5 | [indranilbanerjee/digital-marketing-pro](https://github.com/indranilbanerjee/digital-marketing-pro) | Agent skills and marketing workflow reference | **Selectively adapt** | Contains structured marketing skills, evidence/provenance checks, human approval gates, and connector readiness patterns. Its Agent Skills packaging fits the repo's existing skill registry better than a runtime fork. | MIT, primarily Python and Markdown skills, pushed 2026-09-07; [README](https://github.com/indranilbanerjee/digital-marketing-pro/blob/main/README.md), [license](https://github.com/indranilbanerjee/digital-marketing-pro/blob/main/LICENSE), [API metadata](https://api.github.com/repos/indranilbanerjee/digital-marketing-pro). | Large overlap with Sigma's own agents and methods. Importing all skills would create duplicate routing, conflicting terminology, stale benchmarks, and unclear product ownership. Adopt individual skills only after gap mapping and tests. |
| 6 | [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl) | Web-data API, SDK, and MCP ecosystem | **Extend existing adapter** | Search, scrape, crawl, map, and structured extraction are directly useful for competitor audits, lead enrichment, SEO/AEO research, and source capture. It provides a TypeScript SDK and MCP server. | AGPL-3.0, TypeScript, active on 2026-09-27; [README](https://github.com/firecrawl/firecrawl/blob/main/README.md), [license](https://github.com/firecrawl/firecrawl/blob/main/LICENSE), [official API docs](https://docs.firecrawl.dev/api-reference/introduction), [MCP server](https://github.com/firecrawl/firecrawl-mcp-server). | AGPL obligations matter if code is modified or network-served. The safest initial seam is the hosted API with a server-held key, quotas, source timestamps, and crawl evidence. The current catalog entry is configuration, not proof of a working account. |
| 7 | [n8n-io/n8n](https://github.com/n8n-io/n8n) | External workflow orchestrator | **Integrate as a sidecar** | Useful for long-running automations, webhook fan-out, scheduled jobs, human approvals, and third-party application connectors. Keep Growth OS as the system of record and call n8n through signed webhooks or its API. | TypeScript, active on 2026-09-27; [README](https://github.com/n8n-io/n8n/blob/master/README.md), [Sustainable Use License](https://github.com/n8n-io/n8n/blob/master/LICENSE.md), [official license guidance](https://docs.n8n.io/sustainable-use-license/). | This is not a standard open-source license: use is limited to internal business or non-commercial purposes unless separate terms apply. Do not bundle or resell it as a Sigma hosted feature without legal and commercial review. |
| 8 | [mautic/mautic](https://github.com/mautic/mautic) | External CRM and marketing-automation platform | **Build a REST connector** | Adds mature lead management, scoring, campaigns, email, forms, and nurture journeys. It is better treated as a provider that Growth OS can activate and read than as code to merge. | GPL-3.0-or-later, PHP, active on 2026-09-25; [repository](https://github.com/mautic/mautic), [license](https://github.com/mautic/mautic/blob/7.x/LICENSE.txt), [official API library](https://developer.mautic.org/?php#rest-api). | Separate runtime and operational burden. A connector needs OAuth/API validation, tenant mapping, rate-limit handling, webhook verification, consent/unsubscribe governance, and normalized campaign metrics. |
| 9 | [CopilotKit/OpenBot](https://github.com/CopilotKit/OpenBot) | Sandboxed agent-worker platform | **Architecture pilot, separate deployment** | Its AG-UI boundary, per-agent computer, fail-closed policy, audit records, encrypted credentials, and governed MCP gateway align with Sigma's agent governance goals. | MIT, TypeScript/Bun/Docker/PostgreSQL, active on 2026-09-27; [README](https://github.com/CopilotKit/OpenBot/blob/main/README.md), [architecture](https://github.com/CopilotKit/OpenBot/blob/main/docs/architecture.md), [license](https://github.com/CopilotKit/OpenBot/blob/main/LICENSE). | Heavy infrastructure and overlapping UI/auth/data responsibilities. It also depends on CopilotKit Intelligence. Reuse the protocol and policy ideas first; do not merge the whole product into the Express server. |
| 10 | [agentscope-ai/agentscope](https://github.com/agentscope-ai/agentscope) | Python agent framework and evaluation platform | **Evaluate as a service, not a module** | Strong tools, MCP/skill hub, context management, memory backends, and deployment/observability features. Useful if Sigma later needs a dedicated Python agent execution plane. | Apache-2.0, Python 3.11+, active on 2026-09-24; [README](https://github.com/agentscope-ai/agentscope/blob/main/README.md), [license](https://github.com/agentscope-ai/agentscope/blob/main/LICENSE), [docs](https://docs.agentscope.io/). | Adding a second agent runtime now would duplicate the current Node orchestration, skill registry, memory, and permission layers. Require a concrete workload and benchmark before adoption. |
| 11 | [microsoft/agent-framework](https://github.com/microsoft/agent-framework) | Python/.NET agent framework | **Watch or use behind a service boundary** | Credible option for typed multi-agent workflows and enterprise integrations if a future client environment is Python or .NET centered. | MIT, Python and .NET, active on 2026-09-27; [README](https://github.com/microsoft/agent-framework/blob/main/README.md), [license](https://github.com/microsoft/agent-framework/blob/main/LICENSE), [API metadata](https://api.github.com/repos/microsoft/agent-framework). | Poor direct fit for the current TypeScript/Express runtime. It should not become a second orchestration core without a measured advantage over the existing stack. |

## Additional bounded modules worth using

| Project | Product fit | Recommended boundary |
|---|---|---|
| [google-labs-code/design.md](https://github.com/google-labs-code/design.md) | Brand Vault and design-system context | Adopt its Apache-2.0 format as a canonical, versioned design-context contract. Treat website-to-design extractors as draft producers that require review, not as the source of truth. |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Creative and Video Studio | Run its Apache-2.0 deterministic HTML/CSS-to-video pipeline in an isolated FFmpeg/headless-Chrome worker. Persist render inputs, version, output, and failure evidence. |
| [magomed-esendirov/true-jarvis](https://github.com/magomed-esendirov/true-jarvis) | VANTA architecture reference | Reuse the MIT-licensed separation between realtime voice, thinking/orchestration, and text-ledger/subagent layers. It is a blueprint, not a production-ready voice provider. |
| [saaj376/AdPilot](https://github.com/saaj376/AdPilot) | Google Ads workflow reference | Reuse the read-MCP/write-SDK split, campaign context, and event ideas. Prefer Google's official MCP and add Sigma's human-approval gates; do not deploy its autonomous mutation flow unchanged. |

## Reference-only or defer

| Project | Classification | Decision | Reason |
|---|---|---|---|
| [EveryInc/Marketing-OS](https://github.com/EveryInc/Marketing-OS) | Marketing operating-system reference | **Reference only** | Valuable patterns for compound marketing, reusable brand context, proof standards, and memory loops. The root currently has no license file and GitHub reports no detected license, so code or content should not be copied. [README](https://github.com/EveryInc/Marketing-OS/blob/main/README.md), [architecture](https://github.com/EveryInc/Marketing-OS/blob/main/ARCHITECTURE.md), [API metadata](https://api.github.com/repos/EveryInc/Marketing-OS). |
| [firecrawl/open-agent-builder](https://github.com/firecrawl/open-agent-builder) | Visual agent workflow builder | **Reference only until licensing is clarified** | Its README describes a useful Start/Agent/MCP/Transform/If/While/Human Approval/End node model, but the repository has no root LICENSE file and GitHub reports no detected license even though the README says MIT. It also depends on Next.js, Convex, E2B, and Firecrawl, which does not fit the current Vite/Express architecture directly. |
| [khoj-ai/khoj](https://github.com/khoj-ai/khoj) | Self-hosted second brain and research agent | **Defer** | Strong document/web RAG and scheduled automation, but it overlaps the existing Second Brain and agent layers. AGPL-3.0 and a Python service increase licensing and operational scope. [README](https://github.com/khoj-ai/khoj/blob/master/README.md), [license](https://github.com/khoj-ai/khoj/blob/master/LICENSE). |
| [rishabhpoddar/agentgraph](https://github.com/rishabhpoddar/agentgraph) | Agent trace visualizer | **Do not prioritize** | MIT and conceptually useful, but the latest repository push found in the snapshot was 2025-07-01 and adoption is minimal. AgentPrism is a better React 19 fit with OpenTelemetry/Langfuse adapters. |
| [saaj376/AdPilot](https://github.com/saaj376/AdPilot) | Ads-agent prototype | **Reference only** | MIT and marketing-specific, but very low adoption and no evidence in the repository metadata that its Google Ads lifecycle is production-certified. Do not treat it as a ready Google Ads connector. |
| [Anil-matcha/Free-AI-Social-Media-Scheduler](https://github.com/Anil-matcha/Free-AI-Social-Media-Scheduler) | Multi-channel publishing UX/schema reference | **Reference only** | MIT and useful for composer, calendar, and post/account schema ideas, but publishing is brokered through MuAPI rather than native provider adapters. Its current immediate-publish route can mark a post `completed` and create a sample platform URL when no provider request ID exists. Do not reuse that status logic. [Publishing route](https://github.com/Anil-matcha/Free-AI-Social-Media-Scheduler/blob/main/src/app/api/posts/route.js). |
| [modelscope/ultron](https://github.com/modelscope/ultron) | Shared memory/skills/harness system | **Reference only** | Apache-2.0 and relevant to shared agent memory, but adopting it would duplicate the existing vault, memory, skill, and harness model. Mine only bounded ideas after a design gap is identified. |
| Desktop assistants, companions, leaked-prompt collections, and avatar/orb projects | UI inspiration or experiments | **Exclude from the build path** | They do not solve the priority requirements of verified marketing data, governed execution, tenant isolation, or auditable connectors. Prompt-leak repositories also create provenance and security concerns. |

## Current Growth OS seams

The shortlist maps cleanly to existing boundaries:

| Existing seam | Relevant candidate | Recommended use |
|---|---|---|
| Google Ads connector adapter and reporting normalization in `server.ts` | Google Ads MCP | Use the official MCP for read-only account discovery and GAQL reporting. Keep its response server-side until account matching, schema normalization, freshness, and source evidence succeed. |
| `src/server/agentReachService.ts` | Agent Reach | Keep as the research-channel adapter. Replace hard-coded success fallbacks with explicit unavailable/unknown states and record the actual detected CLI version and backend. |
| `src/initialData.ts` MCP catalog and `/api/workspace/mcps/:id` routes | idea-reality-mcp, Firecrawl MCP | Register installations as configured only. Add separate dependency-present, authenticated, health-checked, and last-successful-call evidence. |
| `src/pages/AgentCockpit.tsx` and agent execution records | AgentPrism | Normalize server-side traces to OpenTelemetry-shaped spans, redact them, then render the trace viewer in the cockpit. |
| Connector verification and reporting routes in `server.ts` | Mautic, n8n | Use provider-specific adapters with server-held secrets, exact tenant/account IDs, signed webhook ingestion, and normalized payloads. |
| Existing skills and agent registries | Digital Marketing Pro | Gap-map individual skills against Sigma's registry, import only the missing capability, preserve attribution, and add truth/approval tests. |
| Future isolated worker plane | OpenBot, AgentScope, Microsoft Agent Framework | Evaluate only when a workload needs a separate sandbox or runtime. Keep it behind authenticated service contracts rather than mixing it into the main server. |

### Important current-state correction

The local Agent Reach service currently returns a fallback catalog that marks several channels `ok` when `agent-reach doctor --json` fails. That is not verified runtime behavior. It should return an explicit state such as `dependency_unavailable`, `configured_unverified`, or `health_check_failed`; the UI can still explain the fallback option without presenting it as active.

Similarly, `src/initialData.ts` currently contains MCP catalog entries with `enabled: true`. An enabled catalog record is configuration, not evidence that an MCP process exists, authentication succeeded, or a tool call returned usable data.

## Capability and connector truth model

Every adopted module should expose these states independently:

1. **Catalogued** - the capability exists in product metadata.
2. **Dependency present** - package, binary, or remote endpoint was detected.
3. **Configured** - required non-secret configuration is complete.
4. **Authenticated** - credentials were accepted for the exact provider account.
5. **Health checked** - the dependency or MCP server answered its health/tool-list request.
6. **Data verified** - a real provider request returned a schema-valid payload tied to the expected account.
7. **Fresh** - the payload is within its source-specific freshness window.
8. **Failed, unsupported, or revoked** - explicit terminal or recoverable failure with evidence.

Research-channel access must remain separate from activation and measurement:

- Reading a public LinkedIn page does not verify a LinkedIn Ads account.
- Reusing a browser session to inspect X or Instagram does not authorize automated publishing or server-side ingestion.
- A successful Firecrawl scrape does not make the extracted claims true; retain source URL, retrieval time, and confidence.
- An n8n workflow completing does not prove a downstream provider accepted or persisted the action; store the provider response and idempotency key.

## Recommended adoption sequence

### Tranche 1 - Low-coupling improvements

- Pilot the official Google Ads MCP against a test or explicitly authorized account, using read-only tools and exact customer-ID verification.
- Correct Agent Reach capability states and run its real doctor output through the existing UI.
- Add a feature-flagged AgentPrism proof of concept using redacted synthetic traces first.
- Register idea-reality-mcp as an internal planning MCP with raw-evidence retention and an `estimated` score label.
- Gap-map Digital Marketing Pro against Sigma's existing skills; select no more than a few missing workflows for the first import.

### Tranche 2 - Data and workflow services

- Implement a server-owned Firecrawl adapter with source provenance, quotas, timeouts, and tenant isolation.
- Pilot n8n as a separate internal orchestrator using signed webhooks and least-privilege credentials; complete license review before exposing it as a client-facing feature.
- Define a Mautic connector contract for account verification, contacts, campaigns, events, consent state, and normalized metrics before writing UI.

### Tranche 3 - Governed autonomous execution

- Prototype OpenBot's AG-UI and policy/audit concepts in an isolated environment.
- Compare OpenBot, AgentScope, and Microsoft Agent Framework against the same Sigma workload: completion rate, human interventions, trace quality, cost, latency, credential isolation, and failure recovery.
- Adopt a separate worker plane only if the benchmark demonstrates a material advantage over the current TypeScript orchestration.

## Acceptance gates before any candidate is called production-ready

- License and attribution review completed for the exact version used.
- Dependency pinned by release or commit, with an update and rollback procedure.
- Secrets remain server-side and are excluded from browser payloads, traces, logs, and error messages.
- Tenant isolation and authorization tested at the API and storage layers.
- Real provider account and exact account ID verified where a connector is claimed.
- Freshness, provenance, and confidence shown for every metric or research artifact.
- Human approval enforced before publishing, spending, deleting, or changing external systems.
- Failure, revocation, rate limiting, expired sessions, and partial-data paths tested.
- Local tests are reported as local tests only; they do not substitute for provider, deployment, or end-to-end verification.

## Effort bands

These are comparative implementation bands, not calendar commitments:

- **Small:** one bounded adapter or UI component, local tests, no new persistent service - AgentPrism proof of concept, idea-reality-mcp registry entry.
- **Medium:** server adapter, persistence, auth/health state, UI, and integration tests - Agent Reach hardening, hosted Firecrawl integration, selective skill imports.
- **Large:** separate deployment, credentials, webhooks, queues, tenancy, monitoring, legal review, and end-to-end provider certification - n8n, Mautic, OpenBot, or an additional agent framework.

The recommended next implementation item is **Agent Reach truth-state hardening**, followed by the **AgentPrism trace-viewer pilot**. Both use seams that already exist and improve the credibility of the system before adding more external capability.
