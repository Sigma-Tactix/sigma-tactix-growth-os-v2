# Worker execution loop

OBJECTIVE: Complete the single claimed task in tasks.json against the current shared contracts.
OUTPUT: Focused commit, acceptance evidence, verification result and clean handoff.
TOOLS: Authorized repo/runtime/browser tools and actual selected model session.
BOUNDARIES: Canonical AGENTS.md; task-owned write paths; no other worker's checkout; no secrets in output; no unapproved external effects.

1. Confirm task lease, owner, branch/worktree/base SHA and dependencies. Read only relevant code/contracts. Use vexp and Laya as project rules direct when available; record unavailability and continue with source evidence.
2. Reproduce the gap and identify decisive acceptance. Implement one slice, reuse services, preserve public contracts and deep links.
3. Heartbeat every minute; record progress per 30-minute cycle. Do not overwrite a shared seam without the integrator's exclusive lease.
4. Test changed failure paths. Run npm run verify before submitting for merge. Preserve failing evidence; do not remove acceptance or substitute mocks for provider proof.
5. Submit exact commit plus redacted evidence paths, commands/exits, scenarios, limitations, rollback and config/migration needs. Enter review; do not self approve.
6. If repair requested, fix the specific finding. After two failed repair attempts against the same check, block with reproduction. If lease expires, stop writing until reconciled.
7. Claim the next ready task only after prior ownership is released by the coordinator.

A useful status message: task ID; changed behavior; latest evidence; blocker; next step. Never report token volume or generated lines as delivered value.
