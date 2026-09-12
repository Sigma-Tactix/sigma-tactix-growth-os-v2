# SigmaTactix Growth OS — Master Context

> **Last updated**: 2026-09-13  
> **Version**: v0.1.0  
> **Status**: Pre-release (Production-ready)

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Product Name** | SigmaTactix Growth OS |
| **Tagline** | AI-Native Growth Infrastructure & Secure Second Brain |
| **Type** | Multi-tenant SaaS — Marketing Operating System |
| **Origin** | Google AI Studio (App ID: `54d15c37-4548-4f52-9b37-a720510970e0`) |
| **Organization** | SigmaTactix |
| **GitHub** | `sigmatactix/sigma-tactix-growth-os-v2` (Private) |

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Runtime** | Node.js | ≥20 |
| **Language** | TypeScript | ~5.8.2 |
| **Frontend Framework** | React | 19.x |
| **Routing** | React Router DOM | 7.x |
| **Styling** | TailwindCSS (v4) via Vite plugin | 4.x |
| **Charts** | Recharts | 3.x |
| **3D/WebGL** | Three.js + React Three Fiber + Drei | 0.185.x |
| **Animation** | GSAP + Motion (Framer) | 3.x / 12.x |
| **Icons** | Lucide React | 0.546.x |
| **Backend** | Express 4 (single `server.ts` — 6,511 lines) | 4.x |
| **AI/LLM** | Google Gemini (`@google/genai`) | 2.4.x |
| **Database** | Supabase (PostgreSQL + pgvector) | 2.110.x |
| **Payments** | Stripe | 22.x |
| **File Uploads** | Multer | 2.x |
| **PDF/Exports** | jsPDF + PptxGenJS + xlsx | Various |
| **Scraping** | Cheerio + Playwright | Various |
| **Validation** | Zod | 4.x |
| **Build** | Vite 6 + esbuild | 6.x |
| **Test** | Vitest | 4.x |
| **Security** | Helmet + express-rate-limit | 8.x / 8.x |

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    React SPA (Vite)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │Dashboard │ │  Vaults  │ │  Agents  │ │  Content   │  │
│  │  + KPIs  │ │(10 Vault)│ │ Cockpit  │ │  Engine    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       │             │            │              │         │
│  ┌────┴─────────────┴────────────┴──────────────┴──────┐ │
│  │              React Router v7 (26 Routes)            │ │
│  └────────────────────────┬────────────────────────────┘ │
└───────────────────────────┼──────────────────────────────┘
                            │ HTTP/JSON
┌───────────────────────────┼──────────────────────────────┐
│                    Express API Server                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Helmet  │ │Rate Limit│ │  RBAC    │ │  Gemini    │  │
│  │ Headers  │ │ (2-tier) │ │ Policies │ │  AI Calls  │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Workspace│ │Credential│ │   RAG    │ │Token Cost  │  │
│  │  Store   │ │ Crypto   │ │ Search   │ │  Engine    │  │
│  └────┬─────┘ └──────────┘ └──────────┘ └────────────┘  │
└───────┼──────────────────────────────────────────────────┘
        │ Row-Level Security (JWT)
┌───────┼──────────────────────────────────────────────────┐
│       ▼      Supabase (PostgreSQL + pgvector)            │
│  ┌──────────────────────────────────────────────────┐    │
│  │   workspaces │ documents │ intake_tokens │ etc.  │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │             Supabase Auth (Google SSO)            │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │           Supabase Storage (File Uploads)        │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Module Map (26 Routes)

### Growth OS Overview
| Module | Route | Page Component | Description |
|---|---|---|---|
| Executive Dashboard | `/` | `Dashboard.tsx` | Topline KPIs, live metrics, intake pipeline status |
| Growth Diagnostics | `/diagnostics` | `GrowthDiagnostics.tsx` | 8-category AI growth audit with scoring |
| Second Brain (Vaults) | `/vaults` | `SecondBrain.tsx` | 10 knowledge vaults, file uploads, connectors, RAG |

### Digital Marketing Suite
| Module | Route | Page Component | Description |
|---|---|---|---|
| SEO & AEO | `/seo-aeo` | `SeoAeoPage.tsx` | Keyword clusters, topical authority, AEO readiness |
| Paid Ads Manager | `/paid-ads` | `PaidAdsPage.tsx` | Multi-platform ad management, budget optimizer |
| Editorial Content | `/content` | `EditorialContentPage.tsx` | AI editorial content generation |
| Social Carousels | `/social-carousels` | `SocialCarouselsPage.tsx` | LinkedIn/IG carousel creator |
| Image Studio | `/image-studio` | `ImageStudioPage.tsx` | Gemini-powered image generation |
| Video Studio | `/video-studio` | `VideoStudioPage.tsx` | AI video creation |
| Email Marketing | `/email-marketing` | `EmailMarketingPage.tsx` | Campaign builder, template engine |
| CRO Studio | `/cro-studio` | `CroStudioPage.tsx` | Conversion rate optimization |
| Intake Engine | `/intake` | `IntakeEngine.tsx` | Client onboarding wizard + audit pipeline |
| Outreach & Leads | `/outreach` | `OutreachLeadsPage.tsx` | AI SDR, lead pipeline, deal documents |
| Social Listening | `/social-listening` | `SocialListeningPage.tsx` | Brand mentions, sentiment analysis |
| Attribution & ROI | `/attribution` | `AttributionRoiPage.tsx` | Multi-touch attribution, ROAS tracking |
| Competitor Research | `/competitors` | `CompetitorResearchPage.tsx` | Competitive intelligence |

### Autonomous Swarm Execution
| Module | Route | Page Component | Description |
|---|---|---|---|
| Agent Cockpit | `/agents` | `AgentCockpit.tsx` | Agent management, DAG visualization, simulation mode |
| Scheduler | `/scheduler` | `Scheduler.tsx` | Report scheduling |
| Reports | `/reports` | `Reports.tsx` | Executive report generation (PDF, PPTX, XLSX) |

### Platform & Infrastructure
| Module | Route | Page Component | Description |
|---|---|---|---|
| Architecture Viewer | `/architecture` | `ArchitectureViewer.tsx` | System architecture diagrams |
| Tenants / Admin | `/tenants` | `Tenants.tsx` | Multi-tenant workspace management, AI model config |
| AI Explorer | `/explorer` | `AIExplorer.tsx` | AI model explorer, chatbot |
| Data Sources | `/connectors` | `DataSources.tsx` | 35+ platform connectors |
| Marketing Learnings | `/learnings` | `MarketingTeamLearningsPage.tsx` | Knowledge base, team insights |
| Living System | `/living-system` | `LivingSystemPage.tsx` | Real-time system canvas, health monitoring |

---

## 5. Second Brain — 10-Vault Schema

The Second Brain is a structured knowledge repository partitioned into 10 specialized vaults. Each vault has strict RBAC policies enforced by `agentPolicies.ts`.

### Vault → TypeScript → Supabase Mapping

| # | Vault | TypeScript Interface | Short Key | Purpose |
|---|---|---|---|---|
| I | Executive Vault | `SecondBrain.executiveVault` | `executive` | C-level strategy, IP, financials |
| II | Credentials Vault | `SecondBrain.credentialsVault` | `credentials` | API keys, OAuth tokens (AES-256-GCM encrypted) |
| III | Brand Vault | `SecondBrain.brandVault` | `brand` | Voice/tone, positioning, offers, slogan |
| IV | Customer Vault | `SecondBrain.customerVault` | `customer` | ICP, segments, objections, testimonials |
| V | Marketing Vault | `SecondBrain.marketingVault` | `marketing` | Campaign history, channels, performance |
| VI | Website Vault | `SecondBrain.websiteVault` | `website` | Site URL, CMS, analytics ID, DNS verification |
| VII | Authority Vault | `SecondBrain.authorityVault` | `authority` | Keywords, backlinks, SEO focus areas |
| VIII | Operations Vault | `SecondBrain.operationsVault` | `operations` | SOPs, org hierarchy |
| IX | AI Workflow Vault | `SecondBrain.aiWorkflowVault` | `ai_workflow` | Agent configs, system prompts, model routers |
| X | Audit Vault | `SecondBrain.auditVault` | `audit` | Readiness scores, diagnostics, 90-day roadmaps |

### Supabase Tables

| Table | Purpose | RLS |
|---|---|---|
| `workspaces` | Primary workspace data (JSONB column holding `WorkspaceData`) | Per-user JWT |
| `documents` | RAG document store with vector embeddings | Scoped by `vault_id` |
| `intake_tokens` | Single-use onboarding tokens | SECURITY DEFINER RPCs |
| Auth tables | Supabase Auth (Google SSO, email/password) | Supabase managed |
| Storage buckets | File uploads | Supabase storage policies |

---

## 6. Agent RBAC Matrix

All agents are sandboxed. Executive and Credentials vaults are **always blocked** for every agent.

| Agent | Allowed Vaults | Blocked Vaults |
|---|---|---|
| Marketing Agent | Brand, Customer, Marketing, Authority, AI Workflow | Executive, Credentials, Operations |
| AI SDR (Sales Agent) | Brand, Customer, AI Workflow | Executive, Credentials, Marketing, Website, Authority, Operations |
| Authority Agent | Brand, Authority, AI Workflow | Executive, Credentials, Customer, Marketing, Website |
| Customer Success Agent | Brand, Customer, Marketing, AI Workflow | Executive, Credentials, Operations |
| Operations Agent | Operations, AI Workflow | Executive, Credentials, Marketing, Customer |
| Audit Diagnostic Agent | Website, Marketing, Authority, Audit, AI Workflow | Executive, Credentials, Customer, Operations |
| Creative Director Agent | Brand, Customer, AI Workflow | Executive, Credentials, Operations, Authority |
| SEO & Authority Agent | Brand, Authority, AI Workflow | Executive, Credentials, Customer, Marketing, Website |

### Human-in-the-Loop (HITL) State Machine

```
[Agent Task Created] → Status: PENDING_APPROVAL
                              │
                  ┌───────────┴───────────┐
                  │                       │
                  ▼                       ▼
             [Approve]               [Reject]
                  │                       │
                  ▼                       ▼
          Status: RUNNING          Status: REJECTED
                  │
          ┌───────┴───────┐
          ▼               ▼
     Status: SUCCESS  Status: FAILED
```

---

## 7. Security Posture

| Control | Implementation | File |
|---|---|---|
| Security Headers | Helmet (HSTS, X-Content-Type-Options, Referrer-Policy, X-Frame-Options) | `server.ts` |
| Rate Limiting | 2-tier: general API + expensive routes (Gemini, Playwright) | `server.ts` |
| Input Validation | Zod schemas at route boundaries | `server.ts` |
| Credential Encryption | AES-256-GCM via `CONNECTOR_CREDENTIALS_KEY` | `credentialCrypto.ts` |
| Agent Sandboxing | Vault-level RBAC, always-blocked secret vaults | `agentPolicies.ts` |
| Auth | Supabase Auth (JWT verification), per-request RLS client | `supabaseAdmin.ts` |
| Trust Proxy | Opt-in via `TRUST_PROXY` env var | `server.ts` |
| Async Error Handling | `express-async-errors` prevents unhandled rejections | `server.ts` |
| Stripe Webhooks | HMAC signature verification, service-role-only RPC | `server.ts`, `supabaseAdmin.ts` |

---

## 8. AI/LLM Integration

| Feature | Model | Usage |
|---|---|---|
| Growth Audits | Gemini (via `@google/genai`) | 8-category diagnostic analysis |
| Content Generation | Multi-model (Gemini default) | Editorial, social, email content |
| Image Generation | Gemini | Image Studio |
| Agent Tool Calling | Gemini with function declarations | Autonomous agent execution |
| RAG Search | Supabase pgvector | Document retrieval with embeddings |
| Token Metering | Custom engine | Per-model cost tracking, profitability analysis |

### Multi-Model Support

Providers: Gemini, Google, OpenAI, Anthropic, xAI (Grok), Qwen, DeepSeek, GLM

Configuration managed per-workspace via `AIKeyConfig` type in admin panel.

---

## 9. Data Connectors (35+ Platforms)

**Ads**: LinkedIn Ads, TikTok Ads, Twitter/X Ads, Apple Search Ads, Reddit Ads, Pinterest Ads, Meta Ads, Google Ads, Snapchat Ads, Amazon Ads, Microsoft Ads

**CRM**: HubSpot CRM, Salesforce

**Analytics**: Google Analytics, Google Search Console, Semrush, Ahrefs, Similarweb

**Social (Organic)**: LinkedIn, Twitter/X, Facebook Pages

**Communication**: Slack, Microsoft Teams, WhatsApp Business

**Collaboration**: Notion, Jira, Linear, Confluence

**E-commerce**: Shopify

**Email**: Klaviyo, Mailchimp

**Content**: WordPress

**Maps**: Google My Business

---

## 10. Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API calls | ✅ |
| `GOOGLE_API_KEY` | Google APIs (Search Console, etc.) | Optional |
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (public) | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (Stripe webhooks only) | ✅ for billing |
| `STRIPE_SECRET_KEY` | Stripe payments | Optional |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification | Optional |
| `CONNECTOR_CREDENTIALS_KEY` | AES-256-GCM key for credential encryption | ✅ for production |
| `APP_URL` | Application URL (self-referential links) | ✅ |
| `MASTRA_SPIKE_WORKSPACE_ID` | Mastra integration workspace | Optional |
| `TRUST_PROXY` | Trust proxy hops (for rate limiting behind reverse proxy) | Optional |
| `SEED_DEMO_WORKSPACE` | Seed demo data (sales demos only, never production) | Optional |

---

## 11. File Structure

```
sigmatactix-new-growth-os-ai-studio/
├── server.ts                    # Express API server (6,511 lines)
├── index.html                   # SPA entry point
├── vite.config.ts               # Vite + TailwindCSS + React config
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies & scripts
├── .env.example                 # Environment template
├── .gitignore                   # Git exclusions
├── src/
│   ├── App.tsx                  # React Router (26 routes)
│   ├── main.tsx                 # React entry
│   ├── types.ts                 # TypeScript interfaces (478 lines)
│   ├── initialData.ts           # Empty workspace template
│   ├── index.css                # Global styles
│   ├── pages/                   # 26 page components
│   ├── components/              # 32 reusable components
│   │   ├── Layout.tsx           # App shell + navigation
│   │   ├── Orb/                 # 3D interactive orb (Second Brain)
│   │   ├── hologram/            # Holographic visualizations
│   │   ├── outreach/            # CRM & deal document components
│   │   ├── reports/             # Report generation components
│   │   ├── shell/               # App shell components
│   │   ├── admin/               # Admin panel components
│   │   └── tutorial/            # Guided tour overlay
│   ├── contexts/                # React contexts
│   │   ├── UserContext.tsx       # Auth state
│   │   ├── WorkspaceContext.tsx  # Workspace data
│   │   ├── ToastContext.tsx      # Notifications
│   │   └── TutorialContext.tsx   # Guided tour state
│   ├── lib/                     # Shared utilities (51 files)
│   │   ├── agentPolicies.ts     # RBAC vault access matrix
│   │   ├── agentResolution.ts   # Agent dispatch routing
│   │   ├── credentialCrypto.ts  # AES-256-GCM encryption
│   │   ├── workspaceStore.ts    # Supabase workspace CRUD
│   │   ├── supabaseAdmin.ts     # Supabase client factory
│   │   ├── tokenCostEngine.ts   # AI cost tracking & profitability
│   │   ├── rag.ts               # RAG document search
│   │   ├── hologramGraph.ts     # 3D graph layout engine
│   │   ├── hologramPlanets.ts   # Planet visualization engine
│   │   ├── hologramTelemetry.ts # System health telemetry
│   │   ├── siteFetch.ts         # Website content scraping
│   │   ├── screenshot.ts        # Playwright-based screenshots
│   │   ├── growthAuditAgents.ts # Growth audit AI agents
│   │   ├── api.ts               # Frontend API client
│   │   ├── auth.ts              # Auth utilities
│   │   └── *.test.ts            # Unit tests (14 test files)
│   ├── data/                    # Static data & configurations
│   │   ├── agencyAgentsRegistry.ts  # 109KB agent registry
│   │   ├── architectureDiagrams.ts  # System diagrams
│   │   ├── demoWorkspace.ts         # Demo workspace seed data
│   │   └── tutorialSteps.ts         # Tutorial step definitions
│   └── services/                # Business logic services
│       ├── agentFilesService.ts     # Agent file management
│       ├── agentMarkdownService.ts  # Markdown processing
│       └── exportService.ts         # PDF/PPTX/XLSX export
├── backend/
│   ├── TECHNICAL_REQUIREMENTS.md    # Schema & architecture spec
│   ├── database/                    # Migration files
│   └── agent-skills/               # Agent skill definitions
└── public/                          # Static assets
```

---

## 12. Development Session History (Last 2 Months)

| Date | Session ID | Key Work |
|---|---|---|
| Jul 14 | `7bf5842a` | Initial project analysis, production readiness planning |
| Jul 14 | `81df798c` | Context study, OpenAI→Gemini migration, multi-model UI |
| Jul 18 | `345fd7fc` | AI Studio integration, local server setup |
| Jul 24 | `a1c6262f` | Claude context synchronization |
| Jul 27 | `3b5de70d` | Open-source competitor research |
| Jul 28 | `8178bd11` | Master context problem resolution |
| Jul 29 | `50045446` | Stitch MCP prompt generation |
| Jul 29 | `c24c3a8f` | UI/UX polish, design division |
| Jul 29 | `c25b2af2` | Harness SDD template installation |
| Jul 30 | `80ea7233` | Agency Agents app integration |
| Jul 30 | `c4e81103` | GitHub push attempts (v1 repo) |
| Jul 31 | `61e2d295` | Agentic OS pending items action |
| Aug 18 | `fe616f65` | Context engineering, GSD audit |
| Aug 18 | `5152dc17` | Supabase Google auth login fix |
| Aug 18 | `84d3047a` | Master context sync from sessions |
| Aug 21 | `f2129fb4` | Workspace resolution failure debugging |
| Aug 22 | `819e74d0` | Course archival pipeline |
| Aug 24 | `cfee53c3` | Open-source Agentic OS research |
| Aug 24 | `003ea7a2` | Context file consolidation |
| Aug 26 | `5cc45c01` | Master context update, PRD/blueprint revision |
| Aug 27 | `9c10e28a` | 3D holographic dashboard, Growth Matrix |
| Aug 28 | `df979e35` | Architecture explosion, AI stack visualization |
| Aug 28 | `b3c42b97` | Orb component for Second Brain module |
| Aug 29 | `a841abcc` | Archify architecture diagrams |
| Sep 1 | `94a45c26` | Gallery artifact verification |
| Sep 2 | `304767eb` | System improvements |
| Sep 2 | `c3ea7d61` | Additional system work |
| Sep 4 | `32d89277` | Clean-slate review, real vs mock data audit |
| Sep 6 | `c5eab993` | Scroll-driven cinematic animations |
| Sep 9 | `d55e3510` | Further enhancements |
| Sep 10 | `4112b672` | System refinements |
| Sep 11 | `e972de1e` | Module improvements |
| Sep 11 | `714b4e1e` | Pre-production fixes |
| Sep 12 | `8c3c8573` | Final hardening |
| Sep 12 | `3ff9ff2e` | Last-mile fixes |
| Sep 12 | `b4b41b92` | Growth OS system optimizations, AI slop removal |

---

## 13. Known Issues & Technical Debt

1. **Monolithic server**: `server.ts` is 6,511 lines — should be decomposed into route modules
2. **CSP disabled**: Content Security Policy is off due to Vite dev/inline script compatibility
3. **Dev fallback key**: `credentialCrypto.ts` has a hardcoded dev-only fallback key for `CONNECTOR_CREDENTIALS_KEY`
4. **Service role usage**: Single exception for Stripe webhook handler (documented, audited)
5. **Cross-origin embedder policy**: Disabled for Supabase Storage screenshot rendering

---

## 14. Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start development server (tsx + Vite HMR) |
| `npm run dev:client` | Start Vite client only (port 3000) |
| `npm run build` | Production build (Vite + esbuild) |
| `npm start` | Run production server (`dist/server.js`) |
| `npm run lint` | TypeScript type check (`tsc --noEmit`) |
| `npm run test` | Run Vitest tests |
| `npm run clean` | Remove build artifacts |
