## vexp - Context-Aware AI Coding <!-- vexp v3.3.0 -->

### Context strategy: call run_pipeline ONCE at task start
If the task already names the files/symbols to touch, SKIP vexp. Otherwise one
`run_pipeline({ "task": "..." })` returns ranked pivot files with line ranges and
blast radius. Do NOT open files one by one to find your way around - every extra
tool call costs a turn. Call it again ONLY when the task moves to a new area.
`get_skeleton` for files to understand, not edit. `verify_done` before calling a
multi-file task complete, then RUN the tests it names.

### Query shape (do this)
Anchor the task on real identifiers (ClassName, functionName) or file paths:
`run_pipeline({ "task": "fix JWT expiry in AuthService.validateToken" })`

vexp runs entirely on this machine, index in `.vexp/`;
`run_pipeline` transmits nothing to any external service.
On `status: "degraded"` or 0 pivots the index is still building - use your own tools.
For literal string sweeps use your native search - do NOT route text sweeps through vexp.
Repo SOURCE only: logs, dist/, node_modules/ and files outside the repo are NOT indexed.
<!-- /vexp -->

## Context Drift Sentinel & Session Startup Trigger

### Master Context Synchronization

At session startup or before beginning any multi-step task:

1. **Currency Check**: Verify whether [`MASTER_CONTEXT.md`](./MASTER_CONTEXT.md) is up to date relative to recent git commits, unstaged diffs, and newly created meeting briefs or architectural documents.
2. **Auto-Sync via Skill**: If new commits, routes, database migrations, pricing schemas, or strategic decisions occurred since the `Last updated` date in `MASTER_CONTEXT.md`, invoke the `master-context-sync` skill (`.agents/skills/master-context-sync/SKILL.md`) to reconcile the delta so zero context is lost.
3. **10 Core Dimensions**: Ensure updates capture:
   - Strategic Direction & Launch Spine
   - Governance & Accountability Matrix
   - Facts, Metrics & Schema Truth (e.g. verified pricing & migrations)
   - Engineering & Architecture Changes (routes, components, services)
   - P0 Blockers & Security Gates
   - Learnings & Architectural Tradeoffs
   - Repetitive Tasks & Automations
   - Misses & Documentation Discrepancies
   - Near-term Opportunities
   - Operational Guidelines & Scripts