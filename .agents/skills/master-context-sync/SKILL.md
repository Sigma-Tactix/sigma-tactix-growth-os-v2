---
name: master-context-sync
description: Analyzes all sessions, git commits, unstaged diffs, docs, and architectural changes across agents, sub-agents, and providers to verify and synchronize MASTER_CONTEXT.md (or project context) so zero context is lost.
---

# Master Context Synchronizer (`master-context-sync`)

Synchronizes the repository's canonical context document (`MASTER_CONTEXT.md` or `CONTEXT.md`) with the actual code, session history, git commits, and architectural decisions.

## When to Use

- At the start of a session if `MASTER_CONTEXT.md` has fallen behind recent commits or sessions.
- After completing a multi-turn feature, architectural refactor, or cross-functional alignment.
- When handing work off between different agents, subagents, or providers (Claude, Gemini, OpenAI, etc.).
- Whenever uncommitted or recently committed changes introduce new routes, schemas, pricing, or strategic direction.

---

## 5-Step Synchronization Procedure

### Step 1: Inspect Target Context
1. Locate `MASTER_CONTEXT.md` (or `CONTEXT.md`) in the workspace root.
2. Read the header and identify:
   - `Last updated` date.
   - Current recorded `Version` and `Status`.
   - The most recent entry in the Development Session History table.

### Step 2: Discover Delta (Git, Diffs, Docs)
1. **Recent Commits**: Run `git log --since="<last_updated_date>" --oneline` (or `git log -n 20 --oneline`) to inspect all commits since the last recorded update.
2. **Unstaged & Staged Changes**: Run `git status` and `git diff --stat` to identify modified routes, components, migrations, or server logic.
3. **Recent Documentation**: Scan for newly created meeting briefs, research docs, or ADRs (e.g. `git status` untracked markdown files, `docs/`, `research/`).

### Step 3: Extract the 10 Core Context Dimensions
Review the discovered delta across these specific dimensions:
1. **Strategic Direction**: Pivots, core promises, target MRR/milestones, launch spine vs. deferred scope.
2. **Governance & RACI**: Accountable leaders, review gates, escalation rules.
3. **Facts & Metrics**: Benchmark data, verified migrations, database schemas, confirmed pricing tiers.
4. **Engineering Changes**: New routes, components, services, 3D/canvas additions, state engines, or library upgrades.
5. **P0 Blockers & Risks**: Failing quality gates, unverified tenant isolation, security/auth gaps, credential dependencies.
6. **Learnings & Decisions**: Proven technical patterns, architectural tradeoffs, deprecations.
7. **Repetitive Tasks**: Manual friction points, recurring context drift, repeated debug cycles.
8. **Misses & Discrepancies**: Conflicting docs (e.g. pricing discrepancies), orphaned components.
9. **Opportunities**: High-leverage follow-ups, upcoming sprint priorities.
10. **Operational Guidelines**: New npm scripts, dev server flags, environment variables.

### Step 4: Update Canonical Context File
Perform surgically targeted updates using file replacement tools:
- **Header Metadata**: Bump `Last updated` to today's date, update `Version` and `Status` to reflect active focus.
- **Top-Level Work Orders / Strategic Direction**: Add or update executive summary blocks for recent milestone meetings or architectural decisions.
- **Module Map / Route Inventory**: Add newly introduced routes, components, or services to the appropriate tables.
- **Session History Table**: Append one row per major session or milestone:
  `| Date | Commit / Session ID | Concise Work & Deliverables |`
- **Known Issues & Guidelines**: Add newly uncovered caveats, blockers, or rules.

### Step 5: Verify & Report
1. Verify the markdown table formatting and heading hierarchy.
2. Provide a compact summary report to the user detailing:
   - What dimensions were updated.
   - Any remaining P0 blockers or discrepancies identified.
