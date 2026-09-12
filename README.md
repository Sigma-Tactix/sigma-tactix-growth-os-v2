# SigmaTactix Growth OS

> **The AI-Native Marketing Operating System & Autonomous Growth Infrastructure**  
> *Version: `v0.1.0` | Status: Production Pre-Release | Security Classification: Confidential*

---

## 🚀 Overview

**SigmaTactix Growth OS** is an enterprise-grade, multi-tenant marketing operating system. It orchestrates autonomous AI agents, multi-channel growth funnels, client onboarding diagnostics, and a cryptographic 10-vault **Second Brain** knowledge infrastructure.

Built from the ground up for modern growth agencies, founders, and performance marketers, it bridges high-level C-suite strategy with granular execution across search, paid advertising, content syndication, and outbound pipelines.

---

## 🌟 Core Pillars & Capabilities

### 1. Executive Cockpit & Living System

- **Real-time KPI Telemetry**: ROAS, CAC, MRR, Pipeline Velocity, and Intake Funnel tracking.
- **Living System Visualizer**: Dynamic 3D and 2D node graphs visualizing real-time agent activity and throughput.
- **Topline Reports & Exports**: Automated C-level PDF, PowerPoint (PPTX), and Excel reporting with automated chart rendering.

### 2. Autonomous Agent Cockpit & RBAC

- **Multi-Agent Roster**: Dedicated agents for Marketing, Sales (AI SDR), Authority/SEO, Customer Success, Operations, and Creative Direction.
- **Human-in-the-Loop (HITL)**: Deterministic task governance (`PENDING_APPROVAL` → `APPROVED` → `EXECUTING` → `RESOLVED`).
- **Cryptographic RBAC**: Strict vault boundary enforcement ensuring agents can never touch Executive or Credentials vaults.

### 3. The Second Brain (10 Knowledge Vaults)

Structured multi-tenant data partitioning powered by Supabase and pgvector:

1. **Executive Vault**: C-level strategy, valuation, proprietary financials.
2. **Credentials Vault**: AES-256-GCM encrypted API keys & OAuth connector tokens.
3. **Brand Vault**: Brand voice, positioning, core narratives, tone governance.
4. **Customer Vault**: Ideal Customer Profiles (ICPs), objections, customer segments.
5. **Marketing Vault**: Historical campaign telemetry, channel performance, assets.
6. **Website Vault**: Site blueprints, CMS configurations, technical analytics.
7. **Authority Vault**: SEO keyword clusters, backlink graph, AEO readiness.
8. **Operations Vault**: Standard Operating Procedures (SOPs), org structure.
9. **AI Workflow Vault**: System instructions, model router heuristics, agent DAGs.
10. **Audit Vault**: Diagnostic benchmarks, maturity scores, 90-day roadmap blueprints.

### 4. Growth Engines & Studios

- **SEO & AEO Engine**: Generative Engine Optimization (GEO/AEO) readiness scoring and topical authority clustering.
- **Paid Ads Manager**: Cross-platform ad spend manager, ROAS attribution, and predictive budget allocation.
- **Content & Studio Suite**: High-impact editorial builder, LinkedIn/Instagram carousel generator, Gemini-driven Image Studio, and Video Studio.
- **Intake & Audit Diagnostic Pipeline**: Automated client onboarding audit evaluating 8 critical growth vectors with prescriptive action items.
- **AI Outbound SDR**: Lead enrichment, objection anticipation, and personalized sequence builder.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, React Router DOM 7, TailwindCSS v4, Recharts, Three.js, React Three Fiber, Drei, GSAP, Framer Motion, Lucide Icons |
| **Backend** | Express 4, Node.js (≥20), TypeScript (~5.8), Zod Schema Validation |
| **AI Intelligence** | Google Gemini (`@google/genai` 2.4+), Multi-model support (OpenAI, Anthropic, xAI, Qwen, DeepSeek) |
| **Data & Storage** | Supabase (PostgreSQL 15+, pgvector, Row-Level Security, Storage Buckets) |
| **Payments** | Stripe API & Webhook Infrastructure |
| **Security** | Helmet HTTP hardening, 2-tier Rate Limiting, AES-256-GCM Credential Encryption |
| **Tooling & Build** | Vite 6, esbuild, tsx, Vitest |

---

## 🏁 Quickstart

### Prerequisites

- Node.js ≥ 20.0.0
- npm ≥ 10.0.0
- Supabase Project & Google Gemini API Key

### 1. Clone & Install

```bash
git clone git@github.com:sigmatactix/sigma-tactix-growth-os-v2.git
cd sigma-tactix-growth-os-v2
npm install
```

### 2. Environment Configuration

Copy the configuration template:

```bash
cp .env.example .env
```

Populate `.env` with your API credentials:

```env
GEMINI_API_KEY="your-gemini-api-key"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
CONNECTOR_CREDENTIALS_KEY="your-32-byte-hex-key"
APP_URL="http://localhost:3000"
```

### 3. Running the System

```bash
# Start full stack development server (Express backend + Vite client HMR)
npm run dev

# Or run client only
npm run dev:client
```

The application will be accessible at `http://localhost:3000`.

---

## 🧪 Testing & Verification

```bash
# Run TypeScript compilation check
npm run lint

# Run Vitest test suite
npm run test

# Production build check
npm run build
```

---

## 🔒 Security & Compliance

- **No Secrets in VCS**: Rigorous `.gitignore` policies safeguarding all `.env*`, `.pem`, and certificate keys.
- **AES-256-GCM Vault**: Credentials stored at rest are encrypted via authenticated symmetric cryptography (`src/lib/credentialCrypto.ts`).
- **Least Privilege Agent Access**: Agents are restricted to their declared domain vaults.
- **Audited Service Role Access**: Backend services strictly bound by Row Level Security (RLS) policies.

For detailed architecture, schema mapping, and session development logs, refer to [MASTER_CONTEXT.md](./MASTER_CONTEXT.md).

---

## 📄 License & Ownership

Copyright © 2026 SigmaTactix. All rights reserved. Private and confidential proprietary software.
