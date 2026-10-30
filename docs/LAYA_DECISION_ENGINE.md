# Laya Decision Engine — Agent & Sub-Agent Integration

> **Status**: Implemented (`src/lib/decisionEngine.ts`) + validated against a live runtime.
> **Authored**: 2026-10-03
> **Extends**: `docs/AGENT_ARCHITECTURE.md` (the Vanta-rooted hierarchy)
> **Upstream**: [NandhaKishorM/laya](https://github.com/NandhaKishorM/laya) — Apache-2.0

---

## 1. What Laya Is

A multilingual, **non-autoregressive System 1 decision model** (Apache-2.0, open
weights) that answers *typed* questions in a single forward pass. It is not a
chat model and not an agent framework:

| Question type | Shape | Real observed answer |
| --- | --- | --- |
| `choice` | finite labelled set | `{"type":"choice","choice":"code","confidence":0.1218,"answer_confidence":0.3871,"probabilities":{…}}` |
| `score` | ordered rubric | `{"type":"score","score":1.2854,"legend":{…},"confidence":0.1457,"answer_confidence":0.4955}` |
| `noul` | probability of *yes* | `{"type":"noul","noul":0.9055,"confidence":0.9055,"answer_confidence":0.9055}` |

It is a **classifier**, not a reasoner. That is exactly why it fits Tier 2/3 of
the hierarchy: it makes the bounded, repeatable decisions fast and cheap,
without an LLM in the loop.

### Two confidence numbers — the most important detail

```text
confidence        = 1 − normalised entropy   (how peaked the distribution is)
answer_confidence = probability of the reported answer
```

They are **not interchangeable**, and a threshold from another model does **not**
transfer. The adapter gates on `answer_confidence`.

### Upstream's own calibration warning

Running the local checkpoint emitted:

> `RuntimeWarning: laya: this checkpoint ships invalid temperatures or values
> outside [0.5, 5] … Treat confidence from the affected entries as uncalibrated.`

This is decisive for the rollout posture below: the shipped checkpoint is
**self-declared uncalibrated** for some entries. Anything the engine does with
confidence must be measured against held-out client data before it is trusted.

---

## 2. Where It Sits in the Hierarchy

Laya is **not** a tier. It is a *decision service* the tiers call.

```text
VANTA (T0)          classifyCategory()           -> which owning agent
   |
Agent (T1)          classifyActionRisk()         -> risk + HITL for the run
   |
Sub-agent (T2)      authorizeSubAgentExecution() -> may I run right now?
   |
Node (T3)           (no model - pure execution)
```

| Tier | Call | Question type |
| --- | --- | --- |
| T0 | `classifyCategory()` | `choice` over the 17 category keys |
| T1 | `classifyActionRisk()` | `choice` over LOW/MEDIUM/HIGH/CRITICAL |
| T2 | `authorizeSubAgentExecution()` | `noul` — safe to run without review? |

---

## 3. The Four Invariants

Enforced in code and covered by tests.

**1. Laya never authorizes.** `authorizeSubAgentExecution()` computes a
*structural block* first — write-plane, HIGH, or CRITICAL — and returns before
any network call. The model is never asked to rule on a write. In the live
check, a write-plane sub-agent was blocked with **zero** Laya calls.

**2. Shadow is the default.** `LAYA_MODE=shadow` means deterministic policy
governs and Laya's answer is recorded in `shadowDecision`. `.env` already ships
this default
---

## 4. Live Validation (2026-10-03)

Real runtime: `laya-serve` on `127.0.0.1:8000`, `LAYA_MODELS=english`.

| Call | Policy (authoritative) | Laya (shadow) | Outcome |
| --- | --- | --- | --- |
| `classifyActionRisk("Re-allocate $4,500 ad spend")` | `HIGH` / HITL | `HIGH` @ `0.5714` | policy held; Laya agreed but **under threshold** |
| `classifyCategory("ROAS dropped, check bid strategy")` | `performance` → Marketing | `operations` @ `0.5821` | policy held; Laya **disagreed**, under threshold |
| `authorizeSubAgentExecution(plane: "write")` | blocked, HITL | *not called* | structural block, 0 LLM calls |
| `authorizeSubAgentExecution(plane: "read")` | permitted | `noul 0.8679` | permitted; shadow recorded |

Two things this proves, both favourable:

- The governance model held under real adversarial conditions. Laya confidently
  suggested `operations` for a performance question; shadow mode discarded it.
- Observed latency: **158–243 ms** warm, **5.4 s** on first call (checkpoint
  load). Any latency claim must state which.

---

## 5. Configuration

Already present in `.env`; no new secrets required.

| Variable | Default | Meaning |
| --- | --- | --- |
| `LAYA_BASE_URL` | `http://127.0.0.1:8000` | Sidecar endpoint (server-owned) |
| `LAYA_API_KEY` | `""` | Bearer auth when the server requires it |
| `LAYA_MODEL` | `auto` | `english` / `multilingual` / `typed-decisions` |
| `LAYA_MODE` | `shadow` | `shadow` (policy authoritative) or `active` |
| `LAYA_CALIBRATED` | `false` | Operator claim, only honoured after a probe |
| `LAYA_TIMEOUT_MS` | `750` | Fast per-request deadline; override only from measured runtime evidence |

Start the runtime:

```bash
npm run setup:laya      # pip install "laya[serve]"
npm run laya:serve      # loads .env and preloads the checkpoint for fast warm decisions
npm run laya:decide -- --question "Choose a path" --option "a=Repair" --option "b=Rebuild"
```

**SSRF note.** `LAYA_BASE_URL` deliberately bypasses `assertPublicHost()`.
That guard exists to stop *user-supplied* URLs reaching internal networks; this
URL is server-owned configuration read from the environment. Letting a request
body set it would be a genuine SSRF hole.

---

## 6. Rollout Posture

Laya ships in **shadow** and must earn promotion:

| Stage | Gate |
| --- | --- |
| **Shadow** (current) | Record every decision; `policy_override` measured from `decision_traces` |
| **Review** | Human-approved labels via `decisionCalibration.ts`; measure accuracy + coverage at real option counts |
| **Active** | Only for read-plane, non-authorizing decisions. `MIN_AUTOMATION_CONFIDENCE` still applies |
| **Never** | Any authorization, write, or vault-content decision — at any confidence |

`decisionTrace.ts` already maps `engine === 'laya'`, so shadow runs populate
`policy_override` and `shadow_decision` with no schema change. That column is
the promotion evidence.

---

## 7. Known Limitations

- **The shipped checkpoint is self-declared uncalibrated** for some entries.
- First call loads the checkpoint (**~5 s**); `LAYA_PRELOAD=1` trades startup
  time for warm latency.
- `laya-serve` runs **one forward pass at a time** (single-worker executor),
  capped by `LAYA_MAX_CONCURRENT` (default 16); excess returns **503**.
- **Option budget is 192 tokens.** Past ~20 options labels get trimmed, and
  beyond fit the request is rejected with **422**. Use `predict_shortlist` to
  narrow large candidate sets — `CATEGORY_OWNERS` has 17 keys and fits.
- Multilingual checkpoint reads to 8,192 tokens, but accuracy degrades past
  ~4,000 tokens of context.

---

## 8. Cross-References

| Concern | Source |
| --- | --- |
| Agent hierarchy, tiers, sub-agents | `docs/AGENT_ARCHITECTURE.md` |
| Trace + calibration | `src/lib/decisionTrace.ts`, `decisionCalibration.ts` |
| Runtime config | `.env`, `.env.example`, `package.json` |
| Original integration plan | `docs/plans/tinyfish-mirofish-integration-plan.md` |

**Verify:** `npm run lint && npm run test`

**3. Runtime state is probed, never asserted.** `deriveRuntimeState()` refuses
to report `calibrated` unless a health probe actually succeeded.
`LAYA_CALIBRATED=true` alone is a claim, not a measurement.

**4. Latency is measured, never asserted.** `durationMs` comes from the
runtime's own `latency_ms` or a local timer. No `70ms`/`sub-100ms` UI claims.
