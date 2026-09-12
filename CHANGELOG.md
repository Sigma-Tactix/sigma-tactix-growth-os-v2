# Changelog

All notable changes to the **SigmaTactix Growth OS** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-09-13

### Added

- **Second Brain Knowledge Vault**:
  - Implemented 10 distinct knowledge vaults with granular role-based isolation.
  - Added AES-256-GCM encryption for stored API tokens and connector credentials (`credentialCrypto.ts`).
  - Integrated Supabase pgvector embedding pipelines for high-accuracy semantic retrieval.
- **Autonomous Multi-Agent Architecture**:
  - Agent roster: Marketing, AI SDR, Authority, Customer Success, Operations, and Audit agents.
  - Human-in-the-Loop (HITL) task validation engine with visual DAG simulation.
  - Agent RBAC policy enforcer (`agentPolicies.ts`) ensuring strict data sandboxing.
- **Executive Growth & Diagnostic Cockpit**:
  - Living System visualizer with 3D/2D node-edge topology rendering.
  - 8-vector growth diagnostic intake engine generating actionable 90-day roadmaps.
  - Multi-format executive reporting (PDF, PPTX, XLSX) with dynamic chart serialization.
- **Growth Engine Suites**:
  - Generative Engine Optimization (GEO/AEO) topical authority graph.
  - Cross-channel paid advertising manager with ROAS predictive distribution.
  - Content Engine, LinkedIn/IG Social Carousel generator, and AI Studio (Image + Video).
  - Outbound AI SDR pipeline with intelligent lead scoring.
- **Security & Hardening**:
  - Helmet HTTP security headers configuration and 2-tiered route rate limiting.
  - Comprehensive `.gitignore` hardening against key files, credentials, and env leaks.
  - Multi-tenant workspace data segregation via Supabase Row-Level Security.
- **Production Master Context**:
  - Complete `MASTER_CONTEXT.md` consolidating 37 sessions of architectural evolution, module inventories, schema mappings, and development history.
