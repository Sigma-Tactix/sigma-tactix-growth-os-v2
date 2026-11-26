# Optimization Audit — Sigma Tactix Growth OS

> Methodology: REA analysis-optimization (find a concrete source of unnecessary
> work → fix at its owner → verify equivalent results against a correctness
> oracle → measure before/after). No code changes in this doc; it is the
> ranked, evidence-backed target list.
>
> Date: 2026-11-26 · Basis: clean tree, `chore/clean-root-and-isolate-app`.

## Oracle (correctness baseline, already captured)

| Check | Result |
|---|---|
| `npm run test` (Vitest) | **120 files passed, 1 skipped · 868 passed, 3 skipped** |
| `npm run lint` (`tsc --noEmit`) | clean (part of `verify`) |
| `npm run build` | green, ~27 s |
| `npm run verify` | build + typecheck + test (the single merge gate) |

Any optimization below is "done" only when this gate still passes and the
before/after metric moves. A passing gate with a flat metric is a valid "leave
it alone" outcome too.

## What's actually big (measured, not estimated)

| Artifact | Size | Note |
|---|---|---|
| `dist/assets/index-*.js` (client shell) | **3,939 kB raw / 1,166 kB gzip** | Vite's own `>500 kB` warning fires on this chunk |
| `dist/server.js` + `build/server.mjs` | 1.13 MB each (×2) | esbuild-bundled server, shipped twice |
| `server.ts` (source) | **455 KB / 10,189 lines** | 202 inline `app.*` handlers |
| `src/pages/Dashboard.tsx` | 54 KB | the one major page **not** lazy-loaded |
| `src/components/Layout.tsx` | 46 KB | in the shell |

The client shell's excess is precisely attributable:
- `recharts` (Bar/Area/Line charts) reaches the shell **only** via the eager
  `Dashboard.tsx` → `IntakeMetricsChart`. The other recharts users
  (`AgentCockpit`, `Reports`) are already lazy.
- `html2canvas-pro` reaches the shell via the eager
  `Dashboard.tsx` → `exportService` — but is **only invoked on an explicit
  export click** (`toPDF`/`toPPTX` at `exportService.ts:72`).
- The three dashboard variants
  (`DashboardBriefing/CommandCenter/ProgressBoard`) are eagerly imported at
  `App.tsx:10-12` even though each owns its own route.
- `three` / `@react-three` and `d3` are **not** in the shell (d3 is behind the
  already-lazy `AgentCockpit`), so those are not the problem.

---

## Findings, ranked by (impact ÷ effort ÷ risk)

### P0 — Split the client shell (DONE 2026-11-26, `perf/split-client-shell`)

**Result:** shell `index` chunk **3,939 → 2,079 kB raw (1,166 → 593 kB gzip)**;
the three variants + `Dashboard` are now standalone chunks (7–10 kB each,
Dashboard 95 kB), and `html2canvas-pro` is its own lazy chunk (252 kB, loaded
only on export). `npm run verify` green: tsc clean, 868 tests pass. The
remaining `>500 kB` Vite warning now points at the extracted Dashboard chunk,
not the shell.

---

## (Original P0 plan, kept for reference)

**Unnecessary work:** the initial page load shipped `recharts` + `html2canvas-pro`
and three full dashboard variant trees to every visitor, including the ones who
only use one lazy page.

**Owner & correction:**
1. Lazy-load the three dashboard variants in `App.tsx` (lines 10–12, 111–113)
   exactly like the other 28 pages: `lazy(() => import('...'))`.
2. Lazy-load the default `Dashboard` (`App.tsx:9`) and render it under the
   existing `Suspense` fallback.
3. In `exportService.ts`, move the `html2canvas-pro` import *into* the
   `toPDF`/`toPPTX` functions (dynamic `await import('html2canvas-pro')`) so the
   export-only library leaves the shell entirely.

**Why safe:** every change mirrors the pattern 28 other pages already use;
no behavior changes on the page, only *when* the bytes arrive. The `Suspense`
fallback already exists and is used by the lazy routes.

**Measure before/after:**
`npm run build`, then record the `index-*.js` raw+gzip size from the Vite
summary (today 3,939 kB / 1,166 kB) and confirm the `>500 kB` warning clears or
drops. Re-run `npm run test` for the dashboard SSR tests.

**Expected:** recharts (~the biggest single dep in the chunk) and
html2canvas-pro move into the Dashboard chunk, not the shell.

---

### P1 — Deduplicate the server build output (low impact · low effort · low risk)

**Unnecessary work:** `build:` writes the *same* esbuild bundle to two paths —
`dist/server.js` (used by `start`) and `build/server.mjs` (used by the
Vercel/`build:vercel` path) — 1.13 MB × 2, built by two esbuild invocations.

**Owner & correction:** confirm which path each runtime actually consumes
(`node dist/server.js` vs the Vercel `build/server.mjs`), then emit the second
from the first with a single esbuild `outdir`/alias rather than two identical
bundles. Keep both files for now until consumption is proven — this is a
"leave it alone unless confirmed" item.

**Measure:** byte-size of the two files after the change; both still pass
`scripts/checkBuiltApi.mjs`.

---

### P2 — Extract the largest inline server route groups into routers
(medium impact · medium effort · **medium–high risk → do in gated increments**)

**Unnecessary work / cost:** `server.ts` mixes 202 inline `app.*` handlers
(96 post / 47 get / 13 delete) with an **already-established** modular pattern
(`src/server/routes/*`, mounted via `app.use(... create*Router(...))`). The
monolith is re-bundled twice and is the single hardest file to review; the
route groups with the clearest ownership (workspace CRO artifacts, leads,
agent-mailboxes, outreach, creative) are contiguous blocks that map cleanly to
`createRouter` modules like the existing ones.

**Owner & correction:** one new router module per contiguous route group,
wired through `app.use()` exactly as `vantaRouter`/`capabilityRouter` are
(`server.ts:2388, 2421`), keeping `requireAuth` / `requireModule(...)` /
`expensiveLimiter` ordering identical. Land one group per commit; each is
gated behind the existing suite.

**Why gated, not one-shot:** the inline handlers rely on closure state and
registration order ("registered before `app.use('/api/workspace',
requireAuth)'`" is load-bearing at `server.ts:332, 358`). A bulk move risks
reordering that. Incremental, one group at a time, with `npm run verify` after
each, is the safe shape.

**Measure:** `server.ts` line count before/after per increment; `npm run test`
+ `runtime.integration.test.ts` stay green; no change to API behavior
(spot-check the moved routes' status codes).

---

### Checked, not a bug — document and move on

- **`workspaceStore.loadWorkspace`** re-runs `migrateLegacyWorkspaceData` on
  every read, *but* it is idempotent and the write-back only fires when
  `migrated === true` (i.e. once per workspace). The CAS versioning
  (compare-and-set on `version`) is correct and intentionally non-retrying.
  **No change warranted.** This was the prime suspect for a
  "repeated scan of validated facts" hot path; it isn't one.
- The REA "full-report / repeated-scan" table (`tokenCostEngine`,
  `decisionEngine`, `capabilityRegistry`) was surveyed as source; none shows a
  clear correctness-affecting hot path without a targeted perf concern, so per
  the REA skill I'm **not** adding synthetic benchmarks or an index/cache just
  to have one. If a specific slow endpoint is observed in production, that's
  the trigger to open a focused reuse audit on that one path.

---

## Suggested order of execution

1. **P0** (client shell split) — highest user-perceived payoff, lowest risk.
2. **P1** (server build dedup) — cheap cleanup once consumption is confirmed.
3. **P2** (route extraction) — as a bounded, commit-by-commit program.

Each ends at `npm run verify`. Nothing here needs the monolith to be solved
first; P0 is independent and immediately verifiable.

*No files changed by this audit.*
