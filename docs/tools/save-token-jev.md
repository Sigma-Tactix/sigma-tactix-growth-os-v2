# TypeSafe Jev System 1 & `save-token-jev` Integration Guide

This guide documents the dual integration of **TypeSafe AI's Jev System 1 model** and the **`save-token-jev` context compaction engine** into SigmaTactix Growth OS.

---

## 1. Executive Overview

Modern autonomous growth agent swarms and coding agents face two critical challenges:
1. **Decision Latency & Hallucinations**: Generative autoregressive LLMs (e.g., GPT-4o, Claude 3.5 Sonnet) take 1.5s–6s to respond with conversational tokens. When used for routing, risk classification, or safety gates, they introduce latency, non-deterministic phrasing, and schema hallucinations.
2. **Context Window Degradation & Token Waste**: When coding agents accumulate long tool execution logs (file reads, shell outputs, grep results), standard compaction asks an LLM to generate a lossy conversational summary. This destroys exact symbols, line numbers, and file context.

### What is TypeSafe Jev?
Announced in [TypeSafe's introducing System One models and Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev), **Jev** is a sub-100ms System 1 intelligence model. Jev foregoes freeform markdown output in favor of **parallel, strictly-typed probabilistic evaluations**:
- **Execution Speed**: 70ms – 200ms latency.
- **Cost**: ~$0.042 / MTok input (10x–50x cheaper than frontier models), zero output generation cost.
- **Guaranteed Type Safety**: Probability distributions over schemas; cannot hallucinate invalid keys or markdown blocks.
- **Non-Hallucinatory Calibration**: Output probabilities represent true confidence scores.

---

## 2. Architecture in SigmaTactix Growth OS

SigmaTactix Growth OS utilizes Jev in two complementary planes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SigmaTactix Growth OS Architecture                    │
├──────────────────────────────────────┬──────────────────────────────────────┤
│  Runtime Plane: Jev Decision Engine  │  Developer Plane: save-token-jev     │
│  (src/lib/jevDecisionEngine.ts)      │  (tools/save-token-jev/)             │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ • Sovereign Action Queue Triage      │ • Codex CLI / App Plugin Hook        │
│ • Sub-100ms Fast Issue/Signal Router │ • OpenCode V2 Compaction Plugin      │
│ • Swarm Safety Guardrail Filter      │ • Claude Code Function-Hook Plugin   │
│ • Graceful Gemini 2.5 Flash Fallback │ • Antigravity / Agent CLI Compaction │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 3. Runtime Engine: `src/lib/jevDecisionEngine.ts`

The runtime decision engine exports four core functions:

### A. `callJevSystemOne<T>(questions, state, options)`
Dispatches parallel probabilistic queries to `https://api.typesafe.ai/v1/systemone` with Bearer auth (`TYPESAFE_API_KEY`).
When the API key is not configured, it throws a catchable error so the calling function can invoke the high-fidelity fallback.

### B. `classifyActionRisk(action)`
Evaluates proposed swarm actions before execution:
- **Questions**: `risk_level` (`LOW` | `MEDIUM` | `HIGH` | `CRITICAL`), `requires_hitl` (`boolean`), `is_safe` (`boolean`).
- **Use Case**: Automatically gate budget shifts, connector credential updates, or production campaign publishes.
- **Fallback**: Uses Gemini 2.5 Flash when configured, or a calibrated deterministic word-boundary heuristic.

### C. `routeIssueToModule(issue)`
Routes incoming market signals, webhook alerts, competitor notices, or ad spikes to the appropriate autonomous module:
- Modules: `paid_ads`, `outreach`, `seo_aeo`, `agent_reach`, `content_engine`, `diagnostics`, `connectors`, `intake_leads`.
- Evaluates `priority` (`URGENT` | `HIGH` | `NORMAL`) and recommends immediate next actions.

### D. `evaluateAgentSwarmSafety(intent)`
Validates that autonomous multi-agent swarms do not perform destructive actions (dropping databases, unauthenticated external calls, exfiltrating credentials).

---

## 4. API Endpoints (`server.ts`)

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/api/workspace/decision/status` | Reports Jev configuration status, active engine (`jev` or `gemini_flash_fallback`), and latency grade. |
| `POST` | `/api/workspace/decision/triage` | Classifies risk and human-in-the-loop requirements for a pending action. |
| `POST` | `/api/workspace/decision/route` | Routes an inbound operational issue or market signal to a target module in ~70ms. |
| `POST` | `/api/workspace/decision/safety` | Evaluates safety guardrails for an autonomous swarm action. |

---

## 5. UI Integration: `ActionQueueTab.tsx`

Located on the **Action Queue** tab in the main Growth OS Dashboard:
- **Status Indicator**: Header pill displays `System 1 Router: Jev Active (70ms Latency)` when `TYPESAFE_API_KEY` is configured, or `System 1 Router: Gemini 2.5 Flash Fallback`.
- **Jev Auto-Triage**: Re-scores all pending queue items across calibrated risk levels and HITL requirements in parallel.
- **Individual Action Scoring**: Click `Jev Score` / `Re-Score` on any action card to retrieve instant calibrated confidence and explanation.
- **Interactive Signal Router**: Open **Route Inbound Signal** to paste any customer ticket, ad alert, or competitor leak and see immediate module dispatch with probability breakdowns.

---

## 6. Developer Plane: `save-token-jev` Tool

The full clean implementation of `save-token-jev` is vendored under `tools/save-token-jev/`.

### How it Compresses Context Without Lossy Summarization
Instead of asking an LLM to write a summary of old conversation turns:
1. **User and Assistant Text**: Kept 100% verbatim.
2. **Tool Calls & Results**: Evaluated with Jev to identify which calls are still relevant to the current task.
   - Irrelevant tool calls and outputs are cleanly excised.
   - Long outputs for still-relevant calls can be bounded.
   - Pinned recent messages are never deleted.

### Commands
```bash
# Check environment readiness
node tools/save-token-jev/dist/cli.js doctor

# Run local savings analytics dashboard (runs on loopback port 43127)
node tools/save-token-jev/dist/cli.js dashboard --port 43127

# Compact a raw JSON transcript
node tools/save-token-jev/dist/cli.js compact \
  --format codex-jsonl \
  --input rollout.jsonl \
  --output compacted.jsonl
```

### Supported Coding Agent Hooks
- **Codex**: Hooks in `tools/save-token-jev/hooks/hooks.json` bind to `PreCompact` and `SessionStart`.
- **OpenCode V2**: Plugin located in `tools/save-token-jev/dist/integrations/opencode.js`.
- **Claude Code**: Plugin located in `tools/save-token-jev/plugins/claude-save-token-jev/`.
- **Antigravity / Custom Agents**: Use library import `import { compactMessages } from './tools/save-token-jev/dist/index.js'`.

---

## 7. Environment Variables

Add to your `.env` file:

```bash
# TypeSafe AI API Key for Jev System 1
TYPESAFE_API_KEY="ts_live_your_key_here"

# (Optional) Override Jev model or endpoint
JEV_MODEL="jev-latest"
JEV_BASE_URL="https://api.typesafe.ai/v1/systemone"

# (Optional) save-token-jev thresholds
SAVE_TOKEN_JEV_KEEP_THRESHOLD=0.5
SAVE_TOKEN_JEV_PRESERVE_RECENT=6
SAVE_TOKEN_JEV_MIN_REDUCTION=0.15
```

If `TYPESAFE_API_KEY` is not provided, the entire system operates normally using Google Gemini 2.5 Flash and deterministic heuristic routing without downtime or errors.
