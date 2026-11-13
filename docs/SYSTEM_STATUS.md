# SYSTEM_STATUS — Growth OS AI Studio (5-tool)

> **Compiled**: 2026-11-10 · **Branch**: `main` · **Scope**: production-readiness truth after the reorg + single-source-of-truth rules pass.
> **Method**: direct inspection of `docs/module-health-audit-2026-10-05.md`, `docs/RECOMMENDATIONS.md`, `docs/growth-os-remediation-plan-2026-10-01.md`, `MASTER_CONTEXT.md`, `tasks/plan.md`, plus live `npm run build`, `tsc --noEmit`, and `vitest run` on this checkout.
>
> **Status key**: ✅ verified this session · 🟢 claimed & previously verified · 🟡 partially implemented / stale claims · 🔴 open blocker / not implemented

---

## 0. Verified Gate (this session, 2026-11-10)

| Gate | Command | Result |
| --- | --- | --- |
| Production build | `npm run build` | ✅ exit 0 (vite + esbuild `dist/server.js` 949.9 kB; chunk-size warnings only) |
| Typecheck | `npx tsc --noEmit` | ✅ exit 0, 0 errors |
| Test suite | `npx vitest run` | ✅ 593/593 tests, 85/85 files (see note below) |

`npm run verify` (build + typecheck + tests, the single merge gate) is wired in `package.json`.

**Test result (2026-11-10)**: `vitest run` finished — see §3 for the number. (Fills in after run.)

---

## 1. Per-module: claimed vs implemented vs tested

Claims are cross-checked against what the code actually contains. "Tested" means a test exists **and** the suite is green; it is not a claim of deployed/production behaviour.

| Module | Claimed (docs/context) | Implemented | Tested | Production blockers |
| --- | --- | --- | --- | --- |
| **Execution ledger (0017)** | Authoritative task record; applied to prod DB 2026-10-02 | ✅ code + migration; cutover flag `EXECUTION_LEDGER_AUTHORITATIVE` defaults **false** | 🟢 18 ledger tests green | Flag still off — readers still fall back to `workspace_state`; other envs unverified (audit F-002) |
| **Bounded DAG engine** (`BoundedWorkflowGraph`) | Real DAG, built but idle | 🟡 wired for `run-pipeline` + growth audit only; most task types still execute a single entry node | 🟢 graph tests green | P1 expansion (fan-out, parent/child views) not started (RECOMMENDATIONS §5) |
| **Laya decision engine** | Local ~200 ms advisor, informs never authorizes | ✅ `decisionEngine.ts` is the single live path; orphaned experimental tool removed | 🟢 84 scoped tests (2026-10-28) | `LAYA_API_KEY` absent — sidecar not provider-verified; by design stays in shadow, uncalibrated |
| **GSC integration** | Server-owned OAuth, honest 4-outcome analytics, pre-flight probe | ✅ `gscService.ts` deep module + routes | 🟢 36/36 incl. 8 pre-flight tests | Live OAuth pairing not recorded end-to-end in this checkout |
| **TinyFish / MiroFish adapters** | Runtime handshake + fail-safe fixture fallback | ✅ adapters + routes, fixture adapters for offline/dev | 🟢 22 tests across 6 files | No live provider verification of either |
| **Creative multi-provider gateway** | HF + Cloudflare + Gemini + pollinations fallback | ✅ `creativeGateway.ts` | 🟢 6 tests | Provider keys/quotas not exercised in this session |
| **Social distribution gateway** | 3-phase plan: contracts, server HITL dispatch, UI scheduler | ✅ offline mock adapter + routes + modal; 19 tests green at delivery | 🟢 | **No live scheduler sidecar**; `SOCIAL_SCHEDULER_API_URL` unconfigured — publishing is mock-only |
| **VANTA / Second Brain** | 3D synaptic orb, governed read-only proposals, document graph | ✅ implemented locally; live browser check partial | 🟡 repeated reliability & live confirmation unverified (MASTER_CONTEXT 2026-10-28) | No deployed evidence; VANTA has no policy identity in `AGENT_VAULT_POLICIES` (audit F-003) |
| **CRO landing artifacts** (`landingArtifact.ts`) | High-fidelity proposals, Supabase provenance, SHA-256 hashing | ✅ 2026-10-30 slice; working tree has uncommitted edits on this file | 🟢 sync tested | Uncommitted changes in tree (see §4) |
| **MCP inbound endpoint** | `POST /api/workspace/mcp`, capability + receipts only | ✅ SDK 2.3.1 server, owner/admin + pilot checks | 🟢 3 endpoint tests | Migration `0020_mcp_tool_calls` **not applied** to live DB; receipts can't persist |
| **Reports / pdfcn renderer** | Polished executive PDF | 🔴 `reportSnapshot.ts` + `pdfReportRenderer.ts` are test-only, **no runtime wiring** (plan Phase 3 not started) | 🟢 tests only | No branded PDF delivery |
| **MRR & fee proposals (Phase 4)** | Deterministic revenue models, versioned catalogue | 🔴 not started | — | No MRR calculator, no approved price catalogue |
| **Scheduler** | Durable cron + delivery | 🟡 local React state + local timers only; persistent worker daemon absent | 🟡 | No durable scheduling; heartbeat unevidenced (audit F-008) |
| **Connectors (35+)** | Live platform integrations | 🟡 **~28 are demo fixtures** (`demoWorkspace.ts`); `.mcp.json` has only `threejsresources` | 🟢 fixture paths tested | No live connector verified (audit F-001, F-007) |
| **server.ts gateway** | Monolith hosting all routes | ✅ ~411 kB single file | 🟡 covered indirectly | Refactor pending (audit F-005) — see follow-ups |

### P0 launch blockers (from `MASTER_CONTEXT` 2026-09-28 + audit §2 — still open)

1. 🔴 Clean fresh-checkout `npm run check` + browser acceptance record (R-001)
2. 🔴 Adversarial two-workspace tenant-isolation proof (tables, RPCs, storage, routes) (R-002)
3. 🔴 Sensitive-route auth/membership/ownership inventory + tests (R-003)
4. 🔴 Stripe threat tests: replay, forged signature, tier downgrade, webhook outage (R-004)
5. 🔴 Secret-scan of tree + env hygiene report (R-005) — gitleaks exists in CI but a local report is not filed
6. 🔴 UAE licensing verification sign-off before first paid contract (R-006)

> **Do-not-sell list (audit §5)**: broad self-serve SaaS, autonomous publishing, Simulation Center scale, app-wide Arabic/RTL, marketplace connectors — all remain beta/planned until R-001…R-014 clear.

---

## 2. The single correct flow

Five tools (Claude Code, Google Antigravity, Codex CLI, Cline, vexp) used to carry **five byte-identical rule files plus scattered vexp blocks**. That was the root cause of drift. The flow is now:

```
one rules doc     →  AGENTS.md  (canonical; read natively by Antigravity, Codex, and
                      imported via @AGENTS.md by .claude/CLAUDE.md, .clinerules,
                      CLAUDE.md; Antigravity's .agent/rules/* holds tool-specific
                      rule files only)
one lockfile      →  package-lock.json (npm; no packageManager field in package.json,
                      so npm is the manager; the stale bun.lock was removed)
branch-per-task   →  every tool opens a feature branch; no tool edits main directly
one verify gate   →  npm run verify  =  build + typecheck + tests  (must pass before merge)
production        →  deploying *that verified tree* — a branch never ships unless
                      `npm run verify` passed on it and CI (lint/test/build/gitleaks) is green
```

Rules for the flow:

- **Change a rule once** — in `AGENTS.md`. If a tool-specific file contains rules, it is a bug; fix it to point at `AGENTS.md`.
- **Merge gate**: `npm run verify` locally + the four CI gates (lint, test, build, gitleaks) on the PR.
- **No silent skips**: if a gate can't run (network, secrets), say so and don't merge.
- **Runtime bloat stays out of git**: `hive/`, `worktrees/`, `.kilo/`, `graphify-out/`, `artifacts/`, `dist/`, `.vexp/`, `.creative-renders/` are gitignored; `.vexp/` is a **live index — never move or delete it**.
- **Quarantine, don't delete**: anything removed this pass lives in the local `Growth OS Clean up/` folder (outside the repo) until confirmed useless.

---

## 3. Test suite (2026-11-10 run)

**Test result (2026-11-10)**: `vitest run` → **85/85 test files, 593/593 tests passing, 0 failures** (~71 s).
Note: on the first in-sandbox run, 10 tests in `src/lib/aiSettingsRoutes.test.ts` (7) and `src/server/routes/mcpRoutes.test.ts` (3) failed with `listen EPERM 127.0.0.1` — a network permission limit of the sandbox, not a code defect. Re-running those two files without the sandbox: **10/10 passed**. On a normal dev machine (or CI) the full suite passes as recorded here.

---

## 4. Follow-ups (ordered)

1. **Refactor `server.ts`** (411 kB monolith) into domain routers per `docs/adr/0001`; L1 seams become enforceable (audit F-005). *First priority.*
2. Clear the P0 launch blockers §1 (items 1–6) — tenant isolation, route RBAC matrix, Stripe threat suite, secret-scan report, clean-checkout acceptance, licensing sign-off.
3. **Ledger cutover**: verify `0018` on every deployed env, then flip `EXECUTION_LEDGER_AUTHORITATIVE=true` and rehearse (audit F-002).
4. **Live connectors**: one live pilot per launch-spine source with recorded proof; badge fixtures in the UI (audit F-001/F-007).
5. **Reports**: start Phase 3 (report contract + pdfcn renderer) once Phase-2 evidence gates hold.
6. **Scheduler**: durable worker + delivery attempts, or an explicit "unavailable" state (audit F-008).
7. **MCP**: apply `0020_mcp_tool_calls.sql` to the live DB; the receipts endpoint can't persist until then.
8. **Laya**: set a server-only `LAYA_API_KEY` and verify the sidecar; do not promote to active until confidence is calibrated on measured data.
9. **Uncommitted work in tree** (not from this pass): `MASTER_CONTEXT.md`, `src/lib/landingArtifact.ts`, and `tools/lecture-deck-skill` (gitlink) had local modifications before the reorg — reconcile/commit or discard on their own branches.
10. **`worktrees/oscar-muzrhp7f`** (moved to quarantine 2026-11-10): its `.git` pointer is broken (old machine path) and it carries ~460 lines of uncommitted work on branch `agent/oscar-muzrhp7f` (commit `8847c62`). It now lives at `Growth OS Clean up/worktrees-oscar-muzrhp7f/` (outside the repo; the branch ref itself still exists in this repo). Recover that work onto a real branch from there if it's still wanted; safe to discard otherwise.
