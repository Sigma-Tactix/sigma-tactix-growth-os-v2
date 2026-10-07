# Growth OS Module Health Audit - 2026-10-05

Method: direct code inspection (lint + 421/421 tests green), gap docs (SYSTEM_ARCHITECTURE, AGENT_ARCHITECTURE, ARCHITECTURE_GAP_ANALYSIS, production-readiness review), migration inventory 0001-0018. Skill routers returned process docs only, so findings below are first-hand with file:line evidence.

## 1. What WORKS end-to-end today

| # | Seam | Evidence |
|---|------|----------|
| W1 | Typecheck + unit suite: lint clean, 62 files / 421 tests pass | npm run lint, npm run test |
| W2 | RBAC dispatch enforcement: run-agent resolves scope server-side, rejects out-of-scope vaults (F4 CLOSED) | src/lib/agentPolicies.ts:139, server.ts run-agent |
| W3 | Category ownership total, 17-key map tested (F5 CLOSED) | src/lib/agentResolution.ts:62 |
| W4 | Registry persona to system-agent resolution, no silent default-deny | src/lib/agentResolution.ts:1-44 |
| W5 | Mission execution: DispatchPlan, mission/plan/sub-agent identity, bounded multi-node for explicit dispatches (F2/F3/F7 low-closed) | src/lib/missionExecution.ts, 0018 migration |
| W6 | VANTA read-only proposals + explicit missions/dispatch handoff (Pending Approval only) | vantaServer.ts, server.ts missions/dispatch |
| W7 | Claim contract: simulated:true isolation, SIM labels, fresh-tenant zero-invention | agentTelemetry.ts:115, demoSeed.ts |
| W8 | Media-plan import parses real files to DRAFT (fixed 55K timer bug) | PaidAdsPage, production-readiness review |
| W9 | Vault classification no longer defaults to Executive; explicit destination required | SecondBrain.tsx |
| W10 | Agent allocation server-owned, owner/admin only (was localStorage label) | DataSources.tsx, server agents route |
| W11 | Reporting contract: spend/ROAS from /api/workspace/reporting/metrics, normalized, benchmark split | server.ts reporting routes |
| W12 | Connector validation fail-closed, server-owned verification state | connectorLifecycle.ts, DataSources.tsx |
| W13 | Onboarding chat via authenticated server endpoint (no browser key) | lib/onboardingChat, server route |
| W14 | Security base: Helmet, Zod, 2-tier limits, Stripe HMAC raw-body-first, AES-256-GCM, SSRF assertPublicHost, Secret Vault deny, RLS + verify.sql | server.ts, credentialCrypto.ts, agentReachService.ts |
| W15 | 39 T2 sub-agent specs catalogued (agents/sub-agents/*.md, plane/timeout/tools) | agents/sub-agents/ |

## 2. Needs FIX before start-to-end is real (ordered)

| ID | Module / gap | Severity | Requirement |
|----|--------------|----------|-------------|
| P0-1 | Clean `npm run check` from fresh checkout + browser acceptance | P0 | R-001: recorded clean-checkout log + acceptance run; nothing is production-ready until then |
| P0-2 | Adversarial 2-workspace tenant isolation proof (tables, RPCs, storage, routes) | P0 | R-002: failing-on-violation test set; run per env |
| P0-3 | Server auth/membership/role/ownership inventory + tests on sensitive routes | P0 | R-003: route x check matrix, all sensitive routes covered |
| P0-4 | Stripe threat tests (replay, forged signature, tier-downgrade, webhook outage) | P0 | R-004: adversarial billing suite green; entitlement enforced server-side per route |
| P0-5 | Secret scan of tree + env hygiene | P0 | R-005: scan report clean, rotation done for any hit |
| P0-6 | Licensing verification (Ajman activity codes vs sold services) | P0 | R-006: adviser sign-off filed before first paid contract |
| F-001 | Connector honesty: ~28 MCP servers are demo fixtures (demoWorkspace.ts:519-556); .mcp.json has only threejsresources (F8) | HIGH | R-007: fixture badge in UI; Foundation MCP tier live (Filesystem, Memory, Fetch, Supabase, Postgres); per-platform live-verification ledger |
| F-002 | Ledger cutover OFF: EXECUTION_LEDGER_AUTHORITATIVE=false default; 0018 verified on configured DB only, other envs open (F6) | HIGH | R-008: per-env migration verify + flip flag + cutover rehearsal; backfill stays OFF by decision (12 legacy tasks throwaway) |
| F-003 | VANTA has no policy identity in AGENT_VAULT_POLICIES (F9); no client dispatch affordance (F1 rest) | MED | R-009: VANTA read-only cross-vault-metadata row + UI plan-to-agent-to-subagents view |
| F-004 | Report audit-download correction + full data-assembly/evidence wiring queued | MED | R-010: every exported number traces to ledger/vault cell or is labelled estimate |
| F-005 | server.ts monolith (~336k chars) | MED | R-011: domain-router split per docs/adr/0001; L1 seams enforceable |
| F-006 | Vault record move/delete still local; All-Vaults e2e untested | MED | R-012: server-backed vault record ops + e2e |
| F-007 | No live provider auth/ingestion/publish validation (tests mock adapters) | MED | R-013: one live pilot connector per launch-spine source with recorded proof |
| F-008 | No prod deploy, uptime monitors, error tracking; scheduler heartbeat unevidenced | MED | R-014: staging/prod split, health probes, alerts, rollback rehearsal |

## 3. Missing links (start-to-end chain)

1. Client Enclave proof: signup -> enclave -> RLS proof (blocked by P0-2).
2. Money link: checkout -> webhook -> entitlement -> route gate (blocked by P0-4).
3. Truth link: agent run -> ledger row -> report cell (blocked by F-002, F-004).
4. Intel link: live connector -> vault -> battlecard (blocked by F-001, F-007).
5. Voice link: VANTA plan -> approval -> sub-agent graph -> outcome (blocked by F-003).

## 4. Security inspection (today)

WORKS: SSRF block on scrape paths; service-role confined to webhooks/admin paths; workspace_id scoping + is_member RLS; AES-256-GCM credentials; HMAC webhooks; AuthGate session; CSP enforced in prod (off in dev for HMR - known). OPEN: P0-2/3/4/5 above; no bug-bounty/pen-test; n8n sidecar license review before resale; VARA recheck only if virtual-asset activity added.

## 5. Do NOT sell yet

Broad self-serve SaaS, autonomous publishing, Simulation Center scale, app-wide Arabic/RTL, marketplace connectors - all beta/planned until R-001..R-014 clear per phase gates.
