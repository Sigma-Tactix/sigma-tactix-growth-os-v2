# Start the 20 November release goal

This pack is a goal, task/evidence board and execution instructions. It does not contain a finished production app, credentials or running external model sessions.

1. Open the existing `Sigma-Tactix/sigma-tactix-growth-os-v2` Git checkout in Antigravity. Preserve local work; do not replace it with the older uploaded ZIP.
2. Place this folder at `docs/release-2026-11-20/` in that checkout. Read the repo's canonical `AGENTS.md`; this pack adds work orders and does not replace project rules.
3. Give Antigravity `prompts/COORDINATOR.md` as the goal prompt. If its installed version supports `/goal`, use that facility. Otherwise use its supported persistent goal workflow. Let it discover adapters before launching Codex/Claude sessions.
4. It starts S00, S01 and S03, freezes S02 contracts, then claims dependency-ready tasks. Continue until release evidence passes or a concrete blocker requires a decision.

Short starting message:

```text
Run the autonomous release goal in docs/release-2026-11-20/prompts/COORDINATOR.md.
Deadline: 20 November 2026. Target 18:00 Asia/Dubai.
Read GOAL.md and tasks.json. Start the initializer, research and baseline now,
then dispatch available Codex/Claude/Antigravity workers through isolated worktrees.
Use the shared board, bounded loops and exact-SHA acceptance evidence.
Keep independent ready work moving when another lane is blocked.
```

The coordinator must inspect `tools/sprint_board.py --help` for actual command syntax. Runtime state belongs outside tracked source, such as a central git-ignored `.release-run/` directory. Use one absolute SQLite database path shared by sessions on the same machine. Do not place that database on cloud-sync/network filesystems; distributed workers need a server-owned task store instead.

Files: `GOAL.md` (human plan), `tasks.json` (machine work orders), `CONTRACTS.md`, `MODULE_ACCEPTANCE.csv`, `VANTA_ACCEPTANCE.md`, `RESEARCH.md`, `RELEASE_RUNBOOK.md`, role prompts, and the tested board utility. Initial tasks are pending; the initializer must reconcile actual completed work before claiming it. The 25 module rows are a seeded workflow inventory: expand them from the current route/action registry, including aliases and operator routes, before marking coverage complete.

Certification addition: read certification/LIVE_AUDIT.md first. Current verdict is NOT CERTIFIED. Run certification/METHOD.md and bind SCENARIOS.json against the complete runtime inventory. S22 now blocks S20; a staged candidate report is not a production certificate. Begin the 12-hour soak early enough to finish before the deadline.

This is task revision 3. If a prior task board is already initialized, preserve its database and leases, pause dispatch and reconcile task/dependency changes in a controlled migration. The utility refuses reinitialization and does not provide an automatic task-schema migration. Never overwrite an active board or run two coordinators to import this revision.
