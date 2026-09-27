# SigmaTactix Growth OS — Master Context

> **Last updated**: 2026-09-27  
> **Version**: v0.2.0-rc (Governed Integration Hardening Completed)  
> **Status**: Pre-release (Governed Integration Hardening Completed); local implementation verified with 39 passing test suites (231 tests) and successful production build; external production certification requires user-supplied provider credentials (Google Ads developer token, service account key) and deployment rollout.

### Integration Work Order — 2026-09-27 (COMPLETED)

All four areas from the saved-repository integration assessment have been implemented and verified:

1. **MCP & Channel Capability States** (`ProductionSkillsMCPTab.tsx`): Catalogue entries default to honest `CATALOGUED` status; "Check Runtime Evidence" performs genuine transport handshakes rather than falsifying runtime availability.
2. **Hardened Agent Reach Integration** (`agentReachService.ts`, `AgentReachPage.tsx`): Removed optimistic fallback channels; UI and server reflect genuine CLI health checks (`agent-reach doctor`) with zero false-ready states.
3. **Read-Only Google Ads MCP Integration** (`googleAdsMcpService.ts`, `googleAdsMcpRoutes.ts`, `GoogleAdsMcpControl.tsx`, `integrations/google-ads-mcp/`): Official read-only Google Ads MCP server support behind connector seam with exact-account verification, strict read-only tool allowlist (`tools_config.yaml`), and customer discovery.
4. **Governed Agent-Trace Inspection** (`AgentTraceInspector.tsx`, `AgentCockpit.tsx`, `agentTraceGovernance.test.ts`): Integrated privacy-preserving decision trace inspection into Agent Cockpit. Raw prompts, credentials, and client PII are SHA-256 hashed and never sent to the browser; only bounded (<1000 char) structured outputs and telemetry are surfaced.

Deferred until demonstrated product need: wholesale skill-pack imports, HyperFrames rendering infrastructure, Mautic, n8n, OpenBot/Rakazo execution planes, and unvetted agent frameworks.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Product Name** | SigmaTactix Growth OS |
| **Tagline** | AI-Native Growth Infrastructure & Secure Second Brain |
| **Type** | Multi-tenant SaaS — Autonomous Marketing Operating System |
| **Origin** | Google AI Studio (App ID: `54d15c37-4548-4f52-9b37-a720510970e0`) |
| **Organization** | SigmaTactix |
| **GitHub** | `sigmatactix/sigma-tactix-growth-os-v2` (Private, Active `main`) |

---

## 2. Technology Stack

| Layer | Technology | Version / Spec |
|---|---|---|
| **Runtime** | Node.js (V8) + Bun compatible | ≥20.x |
| **Language** | TypeScript (Strict mode) | ~5.8.2 |
| **Frontend Framework** | React 19 (Concurrent Mode + React 19 Compiler ready) | 19.x |
| **Routing** | React Router DOM (28+ active routes + code splitting) | 7.x |
| **Styling & Tokens** | TailwindCSS (v4) + Sigma Appearance Tokens (Light/Dark/System) | 4.x |
| **Charts** | Recharts (Responsive, Themed) | 3.x |
| **3D/WebGL** | Three.js + React Three Fiber + Drei (Neural Core & Vault Orbs) | 0.185.x |
| **Animation** | GSAP 3 + Motion (Framer Motion 12) + Scroll-driven motion | 3.x / 12.x |
| **Icons** | Lucide React | 0.546.x |
| **Backend Gateway** | Express 4 (`server.ts` — API gateway, RAG, Webhooks, RLS bridge) | 4.x |
| **AI/LLM Engine** | Google Gemini (`@google/genai` 2.4.x) + Multi-Model AI Hub | 2.5 Flash / Pro |
| **External Intelligence** | Agent Reach CLI router (`v1.5.0`) + Jina Web Reader + YouTube oEmbed | 1.5.x |
| **Database & Vector** | Supabase (PostgreSQL 15+ with `pgvector`, RLS, moddatetime) | 2.110.x |
| **Payments & Billing** | Stripe (HMAC-verified webhooks, customer portal) | 22.x |
| **Scraping & Web Audit** | Cheerio + Playwright + SSRF validation | Various |
| **Schema Validation** | Zod (Runtime input validation at all API boundaries) | 4.x |
| **Build & Test** | Vite 6 + esbuild + Vitest 4 (21+ test suites, 169+ passing tests) | 6.x / 4.x |
| **Agent Governance** | Harness SDD (`agentic.json`, 4 subagents, 25 skills, feature roadmap) | v0.8.x |

---

## 3. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                   React 19 SPA (Vite 6 + Code Splitting)               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │ Dashboard    │ │ Second Brain │ │ Agent Cockpit│ │ Agent Reach   │ │
│  │ & Topline KPI│ │ (10 Vaults)  │ │ & Telemetry  │ │ (15 Channels) │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └───────┬───────┘ │
│         │                │                │                 │         │
│  ┌──────┴────────────────┴────────────────┴─────────────────┴───────┐ │
│  │                 React Router v7 (28+ Active Routes)              │ │
│  │             AppearanceProvider (Light/Dark/System Tokens)        │ │
│  │             AuthGate (Enforced Application Session)              │ │
│  └────────────────────────────────┬─────────────────────────────────┘ │
└───────────────────────────────────┼───────────────────────────────────┘
                                    │ HTTP / JSON (CSRF & Helmet Protected)
┌───────────────────────────────────┼───────────────────────────────────┐
│                      Express API Gateway (server.ts)                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │ Helmet & CORS│ │ 2-Tier Rate  │ │ Zod Request  │ │ Agent Reach   │ │
│  │ Headers      │ │ Limiters     │ │ Boundaries   │ │ Service (CLI) │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └───────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │ VANTA Neural │ │ Token Cost   │ │ RAG Search   │ │ AES-256-GCM   │ │
│  │ Server Logic │ │ Engine (Spec)│ │ (Supabase)   │ │ Crypto Vault  │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └───────────────┘ │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │ Row-Level Security (JWT Scoped)
┌───────────────────────────────────┼───────────────────────────────────┐
│         Supabase Cloud (PostgreSQL 15 + pgvector + Auth)              │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ App Tables: workspaces, documents, intake_tokens, signals, etc. │  │
│  │ Migrations: 0001–0015 (0015_vanta_conversations.sql)            │  │
│  │ Security: 100% RLS Enforcement (Audited via verify.sql)         │  │
│  │ Secret Vaults: executive_vault, credentials_vault (Strict Deny) │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 4. Module Map (28+ Active Routes)

### Growth OS Overview
| Module | Route | Component | Description |
|---|---|---|---|
| Executive Dashboard | `/` | `Dashboard.tsx` | Dynamic industry KPIs, color profiles, revenue velocity, real-time activity feed |
| Growth Diagnostics | `/diagnostics` | `GrowthDiagnostics.tsx` | 8-category AI growth diagnostic with empirical scoring and 90-day roadmap |
| Second Brain (Vaults) | `/vaults` | `SecondBrain.tsx` | 10 specialized knowledge vaults, 22-extension auto-routing, RAG embeddings |

### Digital Marketing Suite
| Module | Route | Component | Description |
|---|---|---|---|
| SEO & AEO Engine | `/seo-aeo` | `SeoAeoPage.tsx` | Keyword clusters, topical authority graphs, ChatGPT/Perplexity citation readiness |
| Paid Ads Manager | `/paid-ads` | `PaidAdsPage.tsx` | Cross-network ad spend optimizer, ROAS analyzer, creative performance matrix |
| Editorial Content | `/content` | `EditorialContentPage.tsx` | Trend-to-Article engine, long-form executive briefs, grounded citation banners |
| Social Carousels | `/social-carousels` | `SocialCarouselsPage.tsx` | Multi-slide LinkedIn carousel generator (4:5 portrait) + X viral thread studio |
| Image Studio | `/image-studio` | `ImageStudioPage.tsx` | Gemini-powered promotional asset creation and visual canvas |
| Video Studio | `/video-studio` | `VideoStudioPage.tsx` | AI video storyboard creator and multi-shot generator |
| Email Marketing | `/email-marketing` | `EmailMarketingPage.tsx` | High-conversion lifecycle campaign creator, HTML template previews |
| CRO Studio | `/cro-studio` | `CroStudioPage.tsx` | Conversion rate optimization, copy challenger, page friction auditor |
| Intake Engine | `/intake` | `IntakeEngine.tsx` | Client onboarding wizard, single-use intake token generator |
| Outreach & Leads | `/outreach` | `OutreachLeadsPage.tsx` | AI SDR pipeline, lead enrichment, deal document generator |
| Social Listening | `/social-listening` | `SocialListeningPage.tsx` | Multi-channel social sentinel radar, sentiment analysis, brand mention triage |
| Attribution & ROI | `/attribution` | `AttributionRoiPage.tsx` | Multi-touch attribution modeling, payback period forecasting, blended CAC |
| Competitor Research | `/competitors` | `CompetitorResearchPage.tsx` | Automated competitor scraping, counter-positioning, SDR 30-sec battlecards |

### Autonomous Swarm Execution & Intelligence
| Module | Route | Component | Description |
|---|---|---|---|
| Agent Cockpit | `/agents` | `AgentCockpit.tsx` | 8-agent swarm manager, DAG visualizer, live telemetry heatmap |
| Agent Reach Router | `/agent-reach` | `AgentReachPage.tsx` | 15-platform live intelligence extraction, CLI doctor diagnostics, social bridge |
| Living System (VANTA) | `/living-system` | `LivingSystemPage.tsx` | VANTA 3D neural core, 12-phase voice/multimodal state machine, audio amplitude |
| Scheduler | `/scheduler` | `Scheduler.tsx` | Autonomous cron jobs, report delivery scheduling |
| Reports | `/reports` | `Reports.tsx` | Executive report export engine (PDF, PowerPoint PPTX, Excel XLSX) |

### Platform & Infrastructure
| Module | Route | Component | Description |
|---|---|---|---|
| System Architecture | `/architecture` | `ArchitectureViewer.tsx` | Interactive system topology, component dependency inspector |
| Harness SDD View | `/harness` | `Tenants.tsx` (`HARNESS_VIEW`) | 5-layer exploded harness view, 6 core feature lifecycles, subagent links |
| Tenants & Admin | `/tenants` | `Tenants.tsx` | Multi-tenant workspace switcher, tenant provisioning, system settings |
| AI Config Hub | `/models` | `Tenants.tsx` (`AI_CONFIG`) | Multi-model API keys (Gemini, OpenAI, Anthropic, Qwen, DeepSeek, xAI) |
| System Prompts | `/prompts` | `Tenants.tsx` (`SYSTEM_PROMPTS`)| Core agent persona prompts, system guardrails, customization |
| Skills & MCP Catalog| `/skills` | `Tenants.tsx` (`SKILLS_MCP`) | Production skills registry (`agent-reach`, MCP servers, tool definitions) |
| Cron Operations | `/cron` | `Tenants.tsx` (`CRON_JOBS`) | Background execution schedules, heartbeat monitors |
| Data Connectors | `/connectors` | `DataSources.tsx` | 35+ platform connectors with AES-256-GCM credential encryption |
| Marketing Learnings | `/learnings` | `MarketingTeamLearningsPage.tsx`| Team insights repository, retrospective log |
| AI Model Explorer | `/explorer` | `AIExplorer.tsx` | Interactive prompt testbed, token usage inspector |

---

## 5. Second Brain — 10-Vault Schema & Supabase Architecture

The Second Brain partitions client intelligence into 10 isolated vaults. Each vault is strictly isolated via PostgreSQL Row-Level Security (RLS) policies and TypeScript interfaces.

### Vault → TypeScript → Supabase Mapping

| # | Vault | TypeScript Property | Vault Key | Purpose | Access Rule |
|---|---|---|---|---|---|
| I | Executive Vault | `SecondBrain.executiveVault` | `executive` | C-level strategy, IP, financials, cap table | **STRICT BLOCK** (Owner only) |
| II | Credentials Vault | `SecondBrain.credentialsVault` | `credentials` | API keys, OAuth tokens (AES-256-GCM) | **STRICT BLOCK** (System only) |
| III | Brand Vault | `SecondBrain.brandVault` | `brand` | Voice, tone, logos, positioning, messaging | Read/Write (Creative/Marketing) |
| IV | Customer Vault | `SecondBrain.customerVault` | `customer` | ICPs, personas, objections, win-loss data | Read/Write (Sales/SDR/Marketing) |
| V | Marketing Vault | `SecondBrain.marketingVault` | `marketing` | Ad campaigns, creative assets, spend history | Read/Write (Media buyers/Agents) |
| VI | Website Vault | `SecondBrain.websiteVault` | `website` | Domain DNS, CMS tokens, analytics tracking | Read/Write (SEO/Audit Agents) |
| VII | Authority Vault | `SecondBrain.authorityVault` | `authority` | Keywords, backlinks, topical graph, citations | Read/Write (SEO/AEO Agents) |
| VIII | Operations Vault | `SecondBrain.operationsVault` | `operations` | Agency SOPs, workflow templates, org chart | Read/Write (Ops/Admin) |
| IX | AI Workflow Vault | `SecondBrain.aiWorkflowVault` | `ai_workflow` | Prompt templates, model routers, agent DAGs | Read/Write (Orchestrator) |
| X | Audit Vault | `SecondBrain.auditVault` | `audit` | Diagnostic scores, audit logs, roadmaps | Read/Write (Audit/Executive) |

### Supabase Migrations & Verification
- `backend/database/migrations/`: Sequential migration files (0001 through `0015_vanta_conversations.sql`).
- `verify.sql`: Comprehensive verification suite testing RLS enablement, secret vault revocation, moddatetime triggers, and `is_member()` helper execution rights.

---

## 6. Harness SDD Subagent Architecture

The system operates an orchestrated subagent hierarchy defined in [`.agents/agentic.json`](file:///Users/mac/Downloads/sigmatactix-new-growth-os-ai-studio/.agents/agentic.json):

```
                     sigmatactix-orchestrator
                               │
       ┌───────────────┬───────┴───────┬───────────────┐
       ▼               ▼               ▼               ▼
code-architect  quality-engineer agent-trainer  delivery-lead
   (6 skills)      (5 skills)     (9 skills)      (5 skills)
```

1. **`code-architect`**: Owns domain modeling, architecture review, deep-module seams, and persistence schemas.
2. **`quality-engineer`**: Owns TDD, unit/integration testing, bug diagnosis, merge conflict resolution, and code review.
3. **`agent-trainer`**: Owns agent prompt alignment, teaching, grilling sessions, and wizard workflows.
4. **`delivery-lead`**: Owns ticket translation, spec breakdown, implementation slicing, and release handoff.

---

## 7. Security Posture

| Control | Implementation | File |
|---|---|---|
| **App-Level Auth Gate** | Prevents unauthenticated access; requires browser session | `src/components/AuthGate.tsx` |
| **SSRF Protection** | `assertPublicHost` blocks loopback, link-local, and RFC1918 IPs | `src/server/agentReachService.ts` |
| **Security Headers** | Helmet with HSTS, X-Content-Type-Options, Referrer-Policy | `server.ts` |
| **Rate Limiting** | 2-tier: General API + expensive routes (LLM calls, scrapers) | `server.ts` |
| **Input Validation** | Strict Zod parsing on all body and query parameters | `server.ts`, `vantaServer.ts` |
| **Credential Encryption** | AES-256-GCM via `CONNECTOR_CREDENTIALS_KEY` | `src/lib/credentialCrypto.ts` |
| **Agent Sandboxing** | Vault-level RBAC; Executive & Credentials vaults strictly denied | `src/lib/agentPolicies.ts` |
| **Stripe Webhooks** | HMAC-SHA256 signature verification, service-role isolation | `server.ts` |

---

## 8. Agent Reach 15-Platform Intelligence Matrix

Agent Reach (`v1.5.0`) provides multi-backend real-time data ingestion:

| Category | Platforms | Engine / Backend |
|---|---|---|
| **Social** | Twitter/X, Reddit, Threads, Bluesky | OpenCLI / Native API / Scraper |
| **Developer** | GitHub, V2EX, HackerNews | GitHub REST API, V2EX API, Algolia HN |
| **Video & Media** | YouTube, Bilibili | YouTube oEmbed + Transcript, Bilibili Web |
| **Career & B2B** | LinkedIn, Upwork | Headless Scraper / Profile Extractor |
| **Finance** | Yahoo Finance, SEC EDGAR | Yahoo Finance API, EDGAR Search |
| **Open Web** | Generic Web, RSS Feeds | Jina Reader (`r.jina.ai`), RSS Parser |

---

## 9. Comprehensive Development Session History

| Date | Session ID | Key Work & Deliverables |
|---|---|---|
| Apr 18 | `7524fa3b` | Sigma Tactix Web2Agent WordPress audit, CSS icon sizing fix, 10 E-E-A-T marketing authority blog posts. |
| May 12 | `ab75a1bc` | Smart Analytics Phase 2 audit, React.lazy code splitting (84% bundle reduction), ErrorBoundary, Supabase wiring. |
| Jul 14 | `7bf5842a` | Initial project analysis, production readiness planning. |
| Jul 14 | `81df798c` | Context study, OpenAI→Gemini migration, multi-model UI. |
| Jul 18 | `345fd7fc` | AI Studio integration, local server setup. |
| Jul 24 | `a1c6262f` | Claude context synchronization. |
| Jul 27 | `3b5de70d` | Open-source competitor research. |
| Jul 28 | `8178bd11` | Master context problem resolution. |
| Jul 29 | `50045446` | Stitch MCP prompt generation. |
| Jul 29 | `c24c3a8f` | UI/UX polish, design division. |
| Jul 29 | `c25b2af2` | Harness SDD template installation. |
| Jul 30 | `80ea7233` | Agency Agents app integration. |
| Jul 30 | `c4e81103` | GitHub push attempts (v1 repo). |
| Jul 31 | `61e2d295` | Agentic OS pending items action. |
| Aug 18 | `fe616f65` | Context engineering, GSD audit. |
| Aug 18 | `5152dc17` | Supabase Google auth login fix. |
| Aug 18 | `84d3047a` | Master context sync from sessions. |
| Aug 21 | `f2129fb4` | Workspace resolution failure debugging. |
| Aug 22 | `819e74d0` | Course archival pipeline. |
| Aug 24 | `cfee53c3` | Open-source Agentic OS research. |
| Aug 24 | `003ea7a2` | Context file consolidation. |
| Aug 26 | `5cc45c01` | Master context update, PRD/blueprint revision. |
| Aug 27 | `9c10e28a` | 3D holographic dashboard, Growth Matrix. |
| Aug 28 | `df979e35` | Architecture explosion, AI stack visualization. |
| Aug 28 | `b3c42b97` | Orb component for Second Brain module. |
| Aug 29 | `a841abcc` | Archify architecture diagrams. |
| Sep 1 | `94a45c26` | Gallery artifact verification. |
| Sep 2 | `304767eb` | System improvements. |
| Sep 2 | `c3ea7d61` | Additional system work. |
| Sep 4 | `32d89277` | Clean-slate review, real vs mock data audit. |
| Sep 6 | `c5eab993` | Scroll-driven cinematic animations. |
| Sep 9 | `d55e3510` | Further enhancements. |
| Sep 10 | `4112b672` | System refinements. |
| Sep 11 | `e972de1e` | Module improvements. |
| Sep 11 | `714b4e1e` | Pre-production fixes. |
| Sep 12 | `8c3c8573` | Final hardening. |
| Sep 12 | `3ff9ff2e` | Last-mile fixes. |
| Sep 12 | `b4b41b92` | Growth OS system optimizations, AI slop removal. |
| Sep 13 | `be3262f6` | Production Git launch, release `v0.1.0` tag, comprehensive `MASTER_CONTEXT.md`, `README.md`, `CHANGELOG.md`. |
| Sep 15 | `21655f01` | Harness SDD integration: `.agents/agentic.json`, 4 subagents, 25 skills mapped, `feature_list.json`, `steering/`. |
| Sep 16 | `6a3a6184` | Growth OS full-system logic review (5 critical fixes across routing, token cost engine, margin math, telemetry). |
| Sep 16–17 | VANTA Core | VANTA Sigma Intelligence neural core, migration `0015_vanta_conversations.sql`, 12-phase state engine. |
| Sep 17–18 | `534c702c` | Agent Reach 15-platform integration, `/agent-reach`, competitor battlecards, content repurposing pipelines. |
| Sep 18 | `833dbe5d` | Light/Dark Theme tokens, `AuthGate.tsx` session gate, master context compilation, `/learn` proposal, grilling round. |
| Sep 27 | `790ab5b` | Governed Integration Hardening: Areas 1-4 completed (MCP capability honesty, hardened Agent Reach, read-only Google Ads MCP connector, governed agent-trace inspector in Cockpit). |

---

## 10. Known Issues & Operational Guidelines

1. **Monolithic Server**: `server.ts` handles multiple responsibilities; route decomposition planned for v0.3.0.
2. **CSP Disabled in Dev**: Content Security Policy disabled in development for Vite HMR compatibility.
3. **Scraper Anti-Bot Guard**: Headless scrapers can be challenged by YouTube BotGuard or Cloudflare; always use oEmbed or Jina Reader fallback.
4. **Token Cost Specificity**: Model name matching must sort descending by length to avoid prefix collisions (e.g. `o1` matching `o1-mini`).
5. **Theme Token Standard**: Always use `sigma-*` utility classes for components to respect the dynamic light/dark theme system.

---

## 11. Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server (Node.js + Vite HMR on port 3000) |
| `npm run dev:client` | Start Vite client only |
| `npm run build` | Full production build (Vite client bundle + esbuild server) |
| `npm start` | Run production server (`dist/server.js`) |
| `npm run lint` | TypeScript type check (`tsc --noEmit`) |
| `npm run test` | Run Vitest test suite |
| `npm run clean` | Clean dist and cache directories |
