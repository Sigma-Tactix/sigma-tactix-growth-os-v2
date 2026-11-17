# Exact-SHA checkpoint notes

Repository main checked on 17 November 2026: `18ef63cb7d0412e49d31a603fb7770e292b4da1d`, unchanged from the execution goal baseline. This source identity does not identify the deployed bundle.

- [Exact-SHA CI run](https://github.com/Sigma-Tactix/sigma-tactix-growth-os-v2/actions/runs/43985948242): build and typecheck passed. Vitest log shows **642 passed, 3 skipped; 95 files passed, one skipped**. Do not repeat 645/645 as a complete CI pass.
- Skips are in `src/lib/lectureDeck.test.ts` because generator/check/theme dependencies are unavailable. Logs also report missing submodule configuration for `tools/lecture-deck-skill`. Repair packaging and run the tests; inspect actual deliverables independently.
- `src/server/deploymentSmoke.test.ts` checks source strings without calling the deployed API. `src/lib/workspaceIsolation.test.ts` simulates database clients. These do not prove live HTTP or RLS/storage isolation.
- `.github/workflows/ci.yml` allows secret-scan failure and suppresses dependency-audit exit status. Installation logs report 29 vulnerabilities, including 18 high. Triage actual production reachability/impact; the count alone is not a demonstrated exploit.
- PR #42 (core knowledge graph/deployment) and #33 (suite consolidation) are merged. Their bodies contain claims; they do not establish current production acceptance. Recent open PRs reviewed were dependency updates, not proof the release work orders are running.
- `vercel.json` rewrites all paths to `index.html`, consistent with the earlier live SPA-at-API observation. The precise deployed topology/configuration remains to be established.
- `docs/release-2026-11-20` was absent from the reviewed main tree. The pack still needs to be integrated into the actual checkout by its coordinator.
- No observable current Codex/Claude/Antigravity worker sessions or active board were established by this checkpoint. Historical co-author text is not current run evidence.

Read `certification/LIVE_AUDIT.md` for the 17 November observation boundaries. This handoff does not rerun the live audit or mark any scenario passed. All module register entries inherit applicable shared blockers plus success, failure, authorization, persistence, context and recovery acceptance.
