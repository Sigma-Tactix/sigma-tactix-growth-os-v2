<![CDATA[<div align="center">

# 🧠 SigmaTactix Growth OS

### The AI-Native Marketing Operating System & Autonomous Growth Infrastructure

[![Version](https://img.shields.io/badge/version-0.1.0-blue?style=for-the-badge)](./CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=for-the-badge)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-30_suites_•_169+-passing-brightgreen?style=for-the-badge)](./src/lib)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

<br />

**Enterprise-grade, multi-tenant marketing operating system** that orchestrates autonomous AI agent swarms, multi-channel growth funnels, cryptographic knowledge vaults, and real-time executive telemetry — all from a single unified cockpit.

[Getting Started](#-getting-started) · [Architecture](#-architecture) · [Modules](#-module-map) · [Dos & Don'ts](#-dos-and-donts) · [Contributing](#-contributing) · [Security](#-security)

<br />

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#1-clone--install)
  - [Environment Setup](#2-environment-configuration)
  - [Running Locally](#3-running-the-system)
- [Project Structure](#-project-structure)
- [Module Map](#-module-map)
- [Scripts Reference](#-scripts-reference)
- [Testing](#-testing)
- [Dos and Don'ts](#-dos-and-donts)
- [Environment Variables Guide](#-environment-variables-guide)
- [Database & Migrations](#-database--migrations)
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Changelog](#-changelog)
- [License](#-license)

---

## 🔭 Overview

**SigmaTactix Growth OS** is built for modern growth agencies, fractional CMOs, founders, and performance marketers who need a single cockpit to orchestrate their entire growth stack — from C-suite strategy down to individual ad spend attribution.

### What Makes It Different

| Traditional Tools | SigmaTactix Growth OS |
|---|---|
| Scattered SaaS subscriptions | Unified operating system |
| Manual campaign management | Autonomous AI agent swarms |
| Flat file storage | 10-vault cryptographic Second Brain |
| Basic dashboards | 3D holographic telemetry & VANTA neural core |
| No AI integration | Native Gemini + multi-model AI hub |
| Single-tenant | Multi-tenant with Row-Level Security |

---

## ✨ Key Features

### 🎛️ Executive Cockpit & Living System
- **Real-time KPI telemetry** — ROAS, CAC, MRR, Pipeline Velocity, Intake Funnel
- **Living System Visualizer** — Dynamic 3D/2D node-edge topology rendering agent activity
- **Automated C-level reporting** — PDF, PowerPoint (PPTX), and Excel (XLSX) with live chart serialization

### 🤖 Autonomous Agent Swarm
- **8-agent roster** — Marketing, AI SDR, Authority/SEO, Customer Success, Operations, Creative, Audit, Orchestrator
- **Human-in-the-Loop (HITL)** — Deterministic task state machine: `PENDING_APPROVAL` → `APPROVED` → `EXECUTING` → `RESOLVED`
- **Cryptographic RBAC** — Agents can _never_ access Executive or Credentials vaults

### 🧬 Second Brain (10 Knowledge Vaults)
Structured multi-tenant data partitioning powered by Supabase + pgvector:

| # | Vault | Purpose | Access |
|:---:|---|---|---|
| I | **Executive** | C-level strategy, valuations, financials | 🔒 Owner Only |
| II | **Credentials** | AES-256-GCM encrypted API keys & tokens | 🔒 System Only |
| III | **Brand** | Voice, tone, positioning, narratives | ✅ Creative / Marketing |
| IV | **Customer** | ICPs, personas, objections, segments | ✅ Sales / SDR / Marketing |
| V | **Marketing** | Campaign history, channel performance | ✅ Media Buyers / Agents |
| VI | **Website** | DNS, CMS, analytics, site blueprints | ✅ SEO / Audit Agents |
| VII | **Authority** | Keywords, backlinks, topical graphs | ✅ SEO / AEO Agents |
| VIII | **Operations** | SOPs, org structure, workflows | ✅ Ops / Admin |
| IX | **AI Workflow** | Prompts, model routers, agent DAGs | ✅ Orchestrator |
| X | **Audit** | Diagnostic scores, roadmaps, benchmarks | ✅ Audit / Executive |

### 🚀 Growth Engines & Studios
- **SEO & AEO Engine** — Generative Engine Optimization, topical authority clustering, ChatGPT/Perplexity citation readiness
- **Paid Ads Manager** — Cross-network spend optimizer, ROAS attribution, predictive budget allocation
- **Content & Studio Suite** — Editorial builder, LinkedIn/Instagram carousel generator, Image Studio, Video Studio
- **Intake & Audit Pipeline** — 8-vector growth diagnostic with prescriptive 90-day roadmaps
- **AI Outbound SDR** — Lead enrichment, objection anticipation, personalized sequence builder
- **Agent Reach (15 platforms)** — Real-time intelligence extraction across social, developer, video, B2B, and finance networks

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19 · React Router DOM 7 · TailwindCSS v4 · Recharts · Three.js · React Three Fiber · Drei · GSAP · Framer Motion · Lucide Icons |
| **Backend** | Express 4 · Node.js (≥20) · TypeScript ~5.8 · Zod schema validation |
| **AI / LLM** | Google Gemini (`@google/genai` 2.4+) · Multi-model support (OpenAI, Anthropic, xAI, Qwen, DeepSeek) |
| **Database** | Supabase (PostgreSQL 15+ · pgvector · Row-Level Security · Storage Buckets) |
| **Payments** | Stripe API & HMAC-verified webhook infrastructure |
| **Security** | Helmet HTTP hardening · 2-tier rate limiting · AES-256-GCM credential encryption |
| **Build & Test** | Vite 6 · esbuild · tsx · Vitest (30 test suites · 169+ passing tests) |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    React 19 SPA  (Vite 6 + Code Splitting)                  │
│                                                                             │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐   │
│   │  Dashboard   │  │ Second Brain │  │ Agent Cockpit│  │ Agent Reach   │   │
│   │  & KPI Panel │  │ (10 Vaults)  │  │ & Telemetry  │  │ (15 Channels) │   │
│   └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘   │
│          └─────────────────┼─────────────────┼──────────────────┘           │
│                            │                 │                              │
│          React Router v7 (28+ Routes) · AppearanceProvider · AuthGate       │
└────────────────────────────┼─────────────────┼──────────────────────────────┘
                             │  HTTP / JSON (CSRF & Helmet Protected)
┌────────────────────────────┼─────────────────┼──────────────────────────────┐
│                    Express API Gateway  (server.ts)                          │
│                                                                             │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│   │ Helmet & CORS│  │ 2-Tier Rate  │  │ Zod Request  │  │ Agent Reach   │  │
│   │ Headers      │  │ Limiters     │  │ Boundaries   │  │ Service (CLI) │  │
│   ├──────────────┤  ├──────────────┤  ├──────────────┤  ├───────────────┤  │
│   │ VANTA Neural │  │ Token Cost   │  │ RAG Search   │  │ AES-256-GCM   │  │
│   │ Server Logic │  │ Engine       │  │ (Supabase)   │  │ Crypto Vault  │  │
│   └──────────────┘  └──────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────────┼─────────────────┼──────────────────────────────┘
                             │  Row-Level Security (JWT Scoped)
┌────────────────────────────┼─────────────────┼──────────────────────────────┐
│           Supabase Cloud  (PostgreSQL 15 + pgvector + Auth)                 │
│                                                                             │
│   App Tables: workspaces, documents, intake_tokens, signals, etc.           │
│   Migrations: 0001–0016 + init.sql + verify.sql                            │
│   Security: 100% RLS Enforcement (Audited via verify.sql)                   │
│   Secret Vaults: executive_vault, credentials_vault (Strict Deny)           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏁 Getting Started

### Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| **Node.js** | ≥ 20.0.0 | Latest LTS (22.x) |
| **npm** | ≥ 10.0.0 | Latest |
| **Supabase** | Project with pgvector enabled | — |
| **Gemini API Key** | [Get one free](https://aistudio.google.com/) | — |
| **Stripe** (optional) | Test keys for billing features | — |
| **Git** | ≥ 2.30 | Latest |

### 1. Clone & Install

```bash
# Clone the repository
git clone git@github.com:sigmatactix/sigma-tactix-growth-os-v2.git

# Navigate into the project
cd sigma-tactix-growth-os-v2

# Install dependencies
npm install
```

> **💡 Tip:** The project also supports `bun install` as an alternative package manager.

### 2. Environment Configuration

```bash
# Copy the environment template
cp .env.example .env
```

Open `.env` and fill in your credentials:

```env
# ─── Required ────────────────────────────────────────────
GEMINI_API_KEY="your-gemini-api-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
CONNECTOR_CREDENTIALS_KEY="your-32-byte-hex-encryption-key"
APP_URL="http://localhost:3000"

# ─── Optional (enable as needed) ─────────────────────────
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
GOOGLE_API_KEY="your-google-api-key"
VITE_VANTA_ENABLED="false"
```

> **⚠️ Important:** Never commit your `.env` file. It is already in `.gitignore`, but always double-check before pushing.

### 3. Running the System

```bash
# Start full-stack development server (Express + Vite HMR)
npm run dev
```

The application will be accessible at **http://localhost:3000**.

#### Alternative Run Modes

```bash
# Client-only mode (Vite dev server without backend)
npm run dev:client

# Production build
npm run build

# Run production server
npm start
```

---

## 📁 Project Structure

```
sigmatactix-growth-os/
├── server.ts                    # Express API gateway (7,000+ lines)
├── index.html                   # SPA entry point
├── vite.config.ts               # Vite 6 build configuration
├── tsconfig.json                # TypeScript configuration (ES2022, strict)
├── package.json                 # Dependencies & scripts
├── .env.example                 # Environment template (never commit .env)
│
├── src/                         # Frontend source (220 files, ~79,000 lines)
│   ├── App.tsx                  # Root component, route definitions
│   ├── main.tsx                 # React 19 entry point
│   ├── index.css                # Global styles (TailwindCSS v4 + sigma tokens)
│   ├── types.ts                 # Shared TypeScript interfaces
│   ├── initialData.ts           # Default workspace seed data
│   │
│   ├── pages/                   # 27 page-level route components
│   │   ├── Dashboard.tsx        # Executive KPI cockpit
│   │   ├── SecondBrain.tsx       # 10-vault knowledge manager
│   │   ├── AgentCockpit.tsx      # 8-agent swarm control center
│   │   ├── PaidAdsPage.tsx       # Ad spend optimizer
│   │   ├── SeoAeoPage.tsx        # SEO & AEO engine
│   │   ├── GrowthDiagnostics.tsx # 8-vector growth audit
│   │   └── ...                   # 21 more modules
│   │
│   ├── components/              # 37 shared components + 11 subdirectories
│   │   ├── AuthGate.tsx         # Session authentication gate
│   │   ├── Layout.tsx           # App shell, sidebar, navigation
│   │   ├── LivingSystemCanvas   # 3D WebGL neural visualization
│   │   ├── vanta/               # VANTA neural core components
│   │   ├── hologram/            # 3D holographic dashboard
│   │   ├── ui/                  # Design system primitives
│   │   └── ...
│   │
│   ├── lib/                     # 73 library modules (30 test suites)
│   │   ├── agentPolicies.ts     # Agent RBAC vault enforcement
│   │   ├── credentialCrypto.ts  # AES-256-GCM encryption
│   │   ├── tokenCostEngine.ts   # LLM cost tracking & metering
│   │   ├── decisionEngine.ts    # AI decision pipeline
│   │   ├── hologramGraph.ts     # 3D graph rendering engine
│   │   ├── workspaceStore.ts    # Multi-tenant state management
│   │   └── ...
│   │
│   ├── contexts/                # React context providers
│   ├── services/                # API service abstraction layer
│   └── data/                    # Static data & seed files
│
├── backend/
│   └── database/
│       └── migrations/          # 18 SQL migration files
│           ├── init.sql         # Base schema (26,000+ lines)
│           ├── 0002–0016_*.sql  # Incremental migrations
│           └── verify.sql       # RLS & security verification suite
│
├── docs/                        # Documentation
│   ├── adr/                     # Architecture Decision Records
│   ├── plans/                   # Feature planning documents
│   ├── reviews/                 # Code & architecture reviews
│   └── tools/                   # Tool documentation
│
├── MASTER_CONTEXT.md            # Complete architecture reference
├── CONTEXT.md                   # Domain glossary
├── CHANGELOG.md                 # Release history
└── .gitignore                   # Comprehensive secret protection
```

---

## 🗺 Module Map

### Growth OS Core

| Module | Route | Description |
|---|---|---|
| Executive Dashboard | `/` | Dynamic KPIs, revenue velocity, real-time activity feed |
| Growth Diagnostics | `/diagnostics` | 8-category AI growth audit with 90-day roadmap |
| Second Brain | `/vaults` | 10 knowledge vaults, 22-extension auto-routing, RAG embeddings |

### Digital Marketing Suite

| Module | Route | Description |
|---|---|---|
| SEO & AEO Engine | `/seo-aeo` | Keyword clusters, topical authority, citation readiness |
| Paid Ads Manager | `/paid-ads` | Cross-network ROAS optimizer, creative performance matrix |
| Editorial Content | `/content` | Trend-to-Article engine, long-form executive briefs |
| Social Carousels | `/social-carousels` | LinkedIn carousel generator (4:5 portrait) + X thread studio |
| Image Studio | `/image-studio` | Gemini-powered visual asset creation |
| Video Studio | `/video-studio` | AI video storyboard & multi-shot generator |
| Email Marketing | `/email-marketing` | Lifecycle campaign creator, HTML template previews |
| CRO Studio | `/cro-studio` | Conversion rate optimization, copy challenger |
| Intake Engine | `/intake` | Client onboarding wizard, intake token generator |
| Outreach & Leads | `/outreach` | AI SDR pipeline, lead enrichment, deal documents |
| Social Listening | `/social-listening` | Sentiment analysis, brand mention triage |
| Attribution & ROI | `/attribution` | Multi-touch attribution, payback period forecasting |
| Competitor Research | `/competitors` | Automated scraping, 30-sec SDR battlecards |

### Autonomous Intelligence

| Module | Route | Description |
|---|---|---|
| Agent Cockpit | `/agents` | 8-agent swarm manager, DAG visualizer, telemetry heatmap |
| Agent Reach | `/agent-reach` | 15-platform live intelligence extraction |
| VANTA Living System | `/living-system` | 3D neural core, 12-phase voice/multimodal state machine |
| Scheduler | `/scheduler` | Autonomous cron jobs, report delivery scheduling |
| Reports | `/reports` | PDF, PowerPoint, Excel export engine |

### Platform & Infrastructure

| Module | Route | Description |
|---|---|---|
| Architecture Viewer | `/architecture` | Interactive system topology inspector |
| Tenants & Admin | `/tenants` | Multi-tenant workspace switcher |
| AI Config Hub | `/models` | Multi-model API key management |
| Data Connectors | `/connectors` | 35+ platform connectors with encrypted credentials |
| AI Explorer | `/explorer` | Interactive prompt testbed & token usage inspector |

---

## 📜 Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Start full-stack dev server (Express backend + Vite HMR on `:3000`) |
| `npm run dev:client` | Start Vite client only (no backend) |
| `npm run build` | Production build — Vite client bundle + esbuild server compilation |
| `npm start` | Run production server from `dist/server.js` |
| `npm run lint` | TypeScript type check (`tsc --noEmit`) |
| `npm run test` | Run Vitest test suite |
| `npm run check` | Combined lint + test gate (`tsc --noEmit && vitest run`) |
| `npm run clean` | Remove `dist/` and built artifacts |

---

## 🧪 Testing

The project uses **Vitest** with **30 test suites** covering critical business logic:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npx vitest

# Run a specific test file
npx vitest src/lib/agentPolicies.test.ts

# Run with coverage
npx vitest --coverage

# Full verification gate (lint + tests)
npm run check
```

### Test Coverage Areas

| Domain | Test Files | What's Covered |
|---|---|---|
| Agent System | 5 suites | RBAC policies, resolution, telemetry, pipelines, mailbox |
| Decision Engine | 4 suites | Decision logic, calibration, traces, JEV engine |
| VANTA Neural Core | 4 suites | State machine, API, server logic, feature flags |
| Hologram Engine | 3 suites | Graph rendering, planets, telemetry |
| Workspace | 3 suites | Store, context, empty workspace handling |
| Crypto & Security | 2 suites | AES-256-GCM encryption, credential lifecycle |
| Growth Engine | 2 suites | Diagnostics scoring, evidence validation |
| Connectors & Data | 4 suites | Connector lifecycle, lead pipeline, data pipelines, media parser |
| Token Economics | 1 suite | Cost engine, model matching, metering |
| Misc | 2 suites | Onboarding chat, pipeline verification |

---

## ✅ Dos and Don'ts

### ✅ DO

| Practice | Why |
|---|---|
| **Use `.env.example` as your template** | It documents every variable with context and safe defaults |
| **Run `npm run check` before pushing** | Catches type errors and test failures before they reach CI |
| **Use `sigma-*` utility classes for theming** | Ensures components respect the dynamic Light/Dark/System theme engine |
| **Add Zod schemas for all new API endpoints** | Every request boundary must be validated at runtime |
| **Write tests alongside new `src/lib/` modules** | The `*.test.ts` convention keeps tests co-located and discoverable |
| **Keep secrets in the Credentials Vault** | Use the AES-256-GCM encryption in `credentialCrypto.ts`, never store raw keys |
| **Use workspace-scoped queries** | Always filter by `workspace_id` — Supabase RLS enforces this, but defense-in-depth matters |
| **Reference `MASTER_CONTEXT.md` for architecture** | It's the canonical source of truth for module inventory, schemas, and session history |
| **Use `React.lazy()` for new page routes** | Code splitting is critical — the bundle was reduced 84% with lazy loading |
| **Follow the domain glossary in `CONTEXT.md`** | Use the correct terminology (e.g., "Knowledge Vault" not "folder", "Swarm" not "bot") |

### ❌ DON'T

| Anti-Pattern | Why Not |
|---|---|
| **Don't commit `.env`, `.pem`, or credential files** | Immediate security incident — `.gitignore` covers this, but stay vigilant |
| **Don't expose `SUPABASE_SERVICE_ROLE_KEY` to the client** | This key bypasses RLS — it must _only_ live in `server.ts` |
| **Don't let agents access Executive or Credentials vaults** | These are cryptographically blocked; `agentPolicies.ts` enforces strict deny |
| **Don't use inline colors or hardcoded hex values** | Always use `sigma-*` theme tokens for Light/Dark mode compatibility |
| **Don't skip Zod validation on new routes** | Unvalidated input is the #1 source of injection and crash bugs |
| **Don't add model names to `tokenCostEngine.ts` carelessly** | Model name matching sorts descending by length; prefix collisions (e.g., `o1` matching `o1-mini`) will cause billing errors |
| **Don't disable RLS on any Supabase table** | Every table uses Row-Level Security — run `verify.sql` to audit compliance |
| **Don't bypass `AuthGate` for protected routes** | All routes behind `AuthGate.tsx` require a valid browser session |
| **Don't import server-only modules in client code** | `server.ts`, `vantaServer.ts`, and `supabaseAdmin.ts` use the service role key |
| **Don't run headless scrapers without oEmbed/Jina fallback** | YouTube BotGuard and Cloudflare will block bare Playwright; always use the fallback chain |

---

## 🔐 Environment Variables Guide

### Required Variables

| Variable | Description | Example |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for AI operations | `AIza...` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous (client-safe) key | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (**server-only!**) | `eyJhbG...` |
| `CONNECTOR_CREDENTIALS_KEY` | 32-byte hex key for AES-256-GCM vault encryption | `a1b2c3...` |
| `APP_URL` | Public application URL | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Default |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe API key for billing | — |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | — |
| `GOOGLE_API_KEY` | Google APIs (Search Console, YouTube) | — |
| `GEMINI_EMBEDDING_MODEL` | Embedding model for RAG | `gemini-embedding-2` |
| `VITE_VANTA_ENABLED` | Enable VANTA Living System neural core | `false` |
| `LAYA_BASE_URL` | Laya decision runtime endpoint | `http://127.0.0.1:8000` |
| `LAYA_MODE` | Laya execution mode (`shadow` / `active`) | `shadow` |
| `TINYFISH_API_KEY` | TinyFish web intelligence key | — |
| `MIROFISH_BASE_URL` | MiroFish private gateway URL | — |
| `MASTRA_SPIKE_WORKSPACE_ID` | Default workspace UUID | `default-workspace-uuid` |

---

## 🗄 Database & Migrations

### Supabase Setup

1. Create a [Supabase project](https://supabase.com/) with pgvector extension enabled
2. Run the base schema:
   ```bash
   # Apply the initialization schema
   psql $DATABASE_URL < backend/database/migrations/init.sql
   ```
3. Apply incremental migrations in order:
   ```bash
   # Migrations 0002 through 0016
   for f in backend/database/migrations/0*.sql; do
     psql $DATABASE_URL < "$f"
   done
   ```
4. Verify security compliance:
   ```bash
   psql $DATABASE_URL < backend/database/migrations/verify.sql
   ```

### Migration Inventory

| Migration | Purpose |
|---|---|
| `init.sql` | Base schema — workspaces, documents, vaults, core tables |
| `0002` | Workspace state management |
| `0003` | Platform expansion & connector tables |
| `0004` | `match_documents` RPC for vector search |
| `0005` | Intake token system |
| `0006` | Team management & invitations |
| `0007` | Billing tables |
| `0008` | Security fixes & hardening |
| `0009` | Subscription tiers |
| `0010` | Tier defaults |
| `0011` | Grants hardening |
| `0012` | Workspace state versioning |
| `0013` | Scoped document matching |
| `0014` | Token metering |
| `0015` | VANTA conversation history |
| `0016` | Decision traces |
| `verify.sql` | RLS audit, secret vault verification, trigger checks |

---

## 🔒 Security

### Security Controls

| Control | Implementation |
|---|---|
| **App-Level Auth** | `AuthGate.tsx` prevents unauthenticated access; requires browser session |
| **SSRF Protection** | `assertPublicHost` blocks loopback, link-local, and RFC1918 IPs |
| **Security Headers** | Helmet with HSTS, X-Content-Type-Options, Referrer-Policy |
| **Rate Limiting** | 2-tier: General API + expensive routes (LLM calls, scrapers) |
| **Input Validation** | Strict Zod parsing on all body and query parameters |
| **Credential Encryption** | AES-256-GCM via `CONNECTOR_CREDENTIALS_KEY` |
| **Agent Sandboxing** | Vault-level RBAC; Executive & Credentials vaults strictly denied |
| **Stripe Webhooks** | HMAC-SHA256 signature verification, service-role isolation |
| **Database** | 100% RLS enforcement, audited via `verify.sql` |
| **Secrets in VCS** | `.gitignore` blocks `.env*`, `.pem`, `.key`, `credentials.json` |

### Reporting Security Issues

If you discover a security vulnerability, **do not open a public issue**. Email [security@sigmatactix.com](mailto:security@sigmatactix.com) with details.

---

## 🔧 Troubleshooting

<details>
<summary><strong>Port 3000 already in use</strong></summary>

```bash
# Find and kill the process on port 3000
lsof -ti :3000 | xargs kill -9

# Then restart
npm run dev
```
</details>

<details>
<summary><strong>Supabase connection fails</strong></summary>

1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
2. Ensure your Supabase project is active (not paused)
3. Check that pgvector extension is enabled in your Supabase dashboard
4. Verify network access (Supabase may have IP restrictions)
</details>

<details>
<summary><strong>Gemini API errors</strong></summary>

1. Verify `GEMINI_API_KEY` is valid at [Google AI Studio](https://aistudio.google.com/)
2. Check rate limits — the app uses 2-tier rate limiting to stay within quotas
3. Ensure your API key has the correct permissions for the models you're using
</details>

<details>
<summary><strong>Vite HMR not working</strong></summary>

- HMR is intentionally disabled when `DISABLE_HMR=true` (used in AI Studio environments)
- For normal development, ensure `DISABLE_HMR` is not set in your `.env`
</details>

<details>
<summary><strong>CSP violations in development</strong></summary>

Content Security Policy is relaxed in development mode for Vite HMR compatibility. This is expected behavior. CSP is fully enforced in production builds.
</details>

<details>
<summary><strong>Tests fail with missing environment variables</strong></summary>

Tests should run without any environment variables. If they fail, check that you haven't accidentally introduced a hard dependency on `.env` in a test file. All test suites mock external services.
</details>

---

## 🤝 Contributing

### Branch Strategy

```
main              ← Production-ready, tagged releases
├── feat/*        ← New features
├── fix/*         ← Bug fixes
├── refactor/*    ← Code improvements
└── docs/*        ← Documentation updates
```

### Workflow

1. **Branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Develop** with tests:
   ```bash
   # Write test first, then implement
   npm run test -- --watch
   ```

3. **Verify** before pushing:
   ```bash
   npm run check    # Lint + Test gate
   ```

4. **Commit** with clear messages:
   ```
   feat(agents): add DAG cycle detection to agent orchestrator
   fix(vault): prevent RLS bypass on credentials vault reads
   docs(readme): update environment variable guide
   ```

5. **Push** and open a Pull Request against `main`

### Code Standards

- **TypeScript strict mode** — no `any` types without justification
- **Zod schemas** on all API boundaries
- **Co-located tests** — `module.ts` paired with `module.test.ts`
- **`sigma-*` design tokens** — no hardcoded colors
- **Domain language** — use terms from `CONTEXT.md`

---

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a full history of releases following [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

---

## 📄 License

Copyright © 2026 **SigmaTactix**. All rights reserved.

This is proprietary, confidential software. Unauthorized copying, distribution, or modification is strictly prohibited. See the [LICENSE](./LICENSE) file for details.

---

<div align="center">

**Built with 🧠 by the SigmaTactix Team**

[Website](https://sigmatactix.com) · [Documentation](./MASTER_CONTEXT.md) · [Report Bug](mailto:security@sigmatactix.com)

</div>
]]>
