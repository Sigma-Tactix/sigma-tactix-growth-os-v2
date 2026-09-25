---
name: codebase-standards
description: Core architectural standards, deep-module design, quality constraints, and operational invariants.
applies_to:
  - "*"
---

# Codebase Standards & Architecture Guidelines

## 1. Deep Modules & Clear Boundaries
Modules must expose small, intuitive surfaces while hiding complex implementation details. Avoid shallow wrappers and leaky abstractions.

## 2. Test-Driven Verification (TDD)
Critical paths, data transformations, and API contracts must be safeguarded with automated tests (`npm test`). Do not ship untested business logic.

## 3. DRY & KISS Principles
Keep implementation simple and anti-overengineered. Consolidate duplicated logic across services, and maintain explicit error handling.

## 4. Progressive Disclosure in Agent Documentation
Documentation and skill instructions should be concise and focused on *when* and *how* to apply the knowledge, using reference files for extensive guides.

---

## 5. Operational Invariants & AI Rules

### 1. Zero-Auth API First for Web Scraping
When building ingestion pipelines or tools that consume external platforms (YouTube, Twitter, Reddit):
- Do not rely solely on raw headless browsers or generic web scrapers for platforms known to deploy BotGuard, Cloudflare turnstiles, or anti-bot defenses.
- Always check for zero-auth public endpoints (e.g., `https://www.youtube.com/oembed?url=...&format=json`) as the primary fast-path.
- Always validate external target hosts with `assertPublicHost()` to prevent SSRF against loopback, private RFC1918 subnets, or cloud metadata services (`169.254.169.254`).

### 2. Strict Token & Pricing Key Specificity
When matching dynamic strings against lookup tables (such as LLM models in `tokenCostEngine.ts`):
- Never use simple unordered `find()` or bidirectional `key.includes(target)`.
- Always sort lookup keys in descending order of length (`b.length - a.length`) to ensure longer, more specific identifiers match before shorter parent substrings.

### 3. Application Session Isolation
- Never rely on browser cookie leakage or administrative dashboard sessions.
- All workspace client enclaves must verify user credentials via `AuthGate` and generate user-scoped JWTs for Supabase RLS.

### 4. Semantic Appearance Token Enforcement
- Never hardcode fixed dark background (`bg-[#09090B]`) or white text (`text-white`) on reusable cards, tables, or modals.
- Use `sigma-card`, `sigma-control`, `sigma-input`, `sigma-text`, and `sigma-muted` to guarantee harmonious rendering across `light`, `dark`, and `system` themes.
