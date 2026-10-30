# What You Can Do, and What I Recommend

> **Plain-language companion** to `SYSTEM_ARCHITECTURE.md`, `AGENT_ARCHITECTURE.md`
> and `LAYA_DECISION_ENGINE.md`.
> **Authored**: 2026-10-03
> **Status**: decisions taken this session are marked ✅ DONE; the rest is the plan.

---

## 1. The One-Paragraph Version

You have a strong foundation and a governance story that is *mostly* real. The
code already contains the hard parts — an append-only execution ledger, a
real DAG engine, per-vault row-level security, and a working local decision
model. What is missing is not more code; it is the **layer that connects them**,
so that a request reliably becomes owned, decomposed, approval-gated, executed
and explainable work. That is the work worth doing next.

---

## 2. What Is Already Working (Do Not Rebuild)

| Asset | Why it matters |
| --- | --- |
| Execution ledger (`0017`, applied to prod) | One write path. Success is recorded, not asserted |
| `BoundedWorkflowGraph` | Real DAG with timeouts, budgets, checkpoints, artifact hashing — **built but idle** |
| Vault RLS + `agentPolicies.ts` | Least-privilege already encoded per agent |
| Laya decision engine | Local, free, ~200 ms warm. Already wired into the routes |
| `decision_traces` | Records every decision for later calibration |

The single most useful fact: **the hardest infrastructure already exists and
nothing is using it.** This is wiring, not construction.

---

## 3. Decisions Taken This Session

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | ✅ **Removed the experimental decision tool** | It was already orphaned; `decisionEngine.ts` is the single live Laya path |
| 2 | ✅ **One decision engine only** | Two engines meant two confidence semantics and a migration nobody finished |
| 3 | ✅ **Laya informs, never authorizes** | Upstream's own docs say a confident answer is not permission |
| 4 | ✅ **One agent registry** | Generated docs + tests make drift a build failure, not a surprise |
| 5 | ✅ **40 sub-agents, 7 agents, 1 master** | Small enough to govern, complete enough to cover every category |

---

## 4. What You Can Do Now

1. **Ask VANTA anything.** It classifies the intent, picks the owning agent, and
   explains what it would do.
2. **Run diagnostics** with real evidence, provenance, and no invented metrics.
3. **Get drafts** of campaigns, creative, content, and outreach — all reviewed
   by a human before anything leaves the system.
4. **See every decision** in `decision_traces`, including which ones the policy
   overrode.
5. **Regenerate all agent docs** with `npm run agents:docs`.

---

## 5. What I Recommend Next, In Order

### P0 — Finish what is already started (highest value per hour)

| # | Work | Why first |
| --- | --- | --- |
| 1 | Verify migration `0018_mission_execution_hierarchy.sql` in each deployed environment | The configured database is verified; other environments must prove the same columns and indexes |
| 2 | Add browser-level VANTA dispatch acceptance coverage | The transcript now calls the governed handoff; authenticated approval and ledger evidence still need browser proof |
| 3 | Run a clean `npm run check` on a fresh checkout | The six P0 launch blockers remain independent of this local slice |

### P1 — Make the hierarchy real

| # | Work | Outcome |
| --- | --- | --- |
| 4 | Expand selected task types into multiple registered graph nodes | The first slice executes the registered entry sub-agent; complex missions need explicit fan-out plans |
| 5 | Add parent/child mission views to the cockpit | The ledger now contains the lineage needed for reconstruction |
| 6 | Approval gate at the write-plane node | Keep write-plane approval structural, never Laya-authorized |

### P2 — Earn the right to automate

| # | Work | Outcome |
| --- | --- | --- |
| 7 | Collect labels; measure accuracy and coverage | Shadow data is only useful once someone grades it |
| 8 | Calibrate, then promote Laya for read-plane decisions | Evidence-based, not hopeful |
| 9 | Live connector plane behind health checks | Turns the ~28 fixture connectors into real capability |

---

## 6. What I Would *Not* Do

- **Do not promote Laya to active yet.** The shipped checkpoint emits a warning
  that its confidence values are uncalibrated. Promote on measured evidence.
- **Do not add more agents.** The 150 personas in `backend/agent-skills/` are a
  prompt library, not runtime actors. Ten concurrent agents with overlapping
  vault grants is how a governance claim stops being falsifiable.
- **Do not build a free-form swarm.** Router, pipeline and fan-out cover the real
  workload and stay debuggable.
- **Do not wire VANTA to execute.** It would make the approval gate decorative.

---

## 7. The Honest Risk List

| Risk | Status |
| --- | --- |
| RBAC not enforced at dispatch | **Open** — P0 item 1 |
| MCP connectors are demo fixtures, not live | **Open** — must not be shown as connected capability |
| No parent/child run linkage yet | **Open** — P1 item 5 |
| Laya confidence uncalibrated | **Open** — by design, stays in shadow |
| Secrets in the vault are owner-only | **Working as intended** |

---

## 8. Verify Everything

```bash
npm run lint        # tsc --noEmit
npm run test        # vitest
npm run agents:docs # regenerate agent files from the registry
npm run laya:serve  # start the decision runtime (separate shell)
```

**Current status:** `tsc` clean · **384 tests passing** · 48 agent files generated ·
One provider-neutral decision engine remains in source.
