# 0001. Modular Route Decomposition for Express Gateway

## Context & Decision
`server.ts` has grown to 6,511 lines, hosting authentication, Supabase RAG, Agent Reach intelligence routing, VANTA neural contracts, Stripe billing, and AI generation pipelines in a single file. While convenient during early prototyping, the monolith slows IDE analysis, risks high merge contention, and obscures domain boundaries.

We decided to decompose `server.ts` into modular, domain-isolated route controllers (`src/server/routes/*`) and shared middleware (`src/server/middleware/*`), preserving `server.ts` strictly as the root Express lifecycle orchestrator.

## Consequences
- Every domain boundary (Agent Reach, VANTA, Workspaces, Billing, AI) has an isolated testable router.
- Zero breaking API changes: all mounted HTTP paths and Zod schemas remain identical.
- All 186 existing Vitest test suites and RLS security contracts continue to pass without regression.
