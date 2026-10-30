# Laya runtime options for Growth OS

**Date:** 2026-10-28  
**Scope:** API-key origin, upstream Laya versus 1Panel Laya Server, Mac resource impact, lighter local alternatives, and the current Growth OS integration.

## Recommendation

Do not install `1Panel-dev/laya-server` on this MacBook. It is a Docker-first
administration layer around upstream Laya, not a lighter model. Keep the existing
deterministic policy authoritative and Laya disabled unless a measured shadow-mode
trial justifies its standing RAM and CPU cost.

If a learned local classifier is still wanted, test one of these in order:

1. Transformers.js zero-shot classification with MobileBERT, embedded in the Node
   process, because it needs no Python service or Docker and returns ranked labels
   plus scores.
2. `laya-mps --memory minimal` as an experimental Mac-specific Laya runtime if
   preserving Laya's typed choice/score/yes-no behavior matters. It is a small
   third-party project and is not wire-compatible with the current endpoint, so it
   needs an adapter and M1-specific measurement before adoption.
3. fastText only after Sigma has enough approved labelled examples. It can be very
   small, but it is supervised rather than general zero-shot decision-making.

For the current M1 MacBook Air with 16 GB RAM, running no learned decision model
continuously is the lowest-risk choice. The existing deterministic policy already
provides instant routing and safety fallback.

## Where `LAYA_API_KEY` comes from

Upstream `laya-serve` does not issue or sell an API key. `LAYA_API_KEY` is an
operator-chosen bearer secret. When it is set, the server requires
`Authorization: Bearer <key>`; when it is absent, upstream serves without
authentication. Upstream recommends binding to `127.0.0.1` for local-only use and
setting a key outside isolated environments. See the upstream
[HTTP configuration](https://github.com/NandhaKishorM/laya/blob/main/docs/http-api.md#configuration)
and [security policy](https://github.com/NandhaKishorM/laya/security).

Generate a random value locally, for example with `openssl rand -hex 32`, and store
it only in the ignored `.env` file. The Growth OS launcher deliberately requires a
key even on loopback. There is no external account, subscription, or provider key
to obtain.

The 1Panel wrapper works differently: an administrator signs into its web console
and creates a key on the API Keys page. That key is stored and revoked through its
SQLite-backed administration layer. This is useful for a shared server, but it is
additional infrastructure for a single-user Mac. See the
[1Panel Laya Server README](https://github.com/1Panel-dev/laya-server#quick-start).

## Upstream Laya without Docker

Docker is optional. Upstream documents a native installation:

```bash
pip install "laya[serve]"
LAYA_HOST=127.0.0.1 LAYA_API_KEY="..." laya-serve
```

The project already has `laya-serve` 0.3.20 installed in an isolated `uv` tool
environment. No Docker setup is required. Upstream's HTTP API uses
`POST /v1/systemone` and `GET /health`; configuration is entirely through
environment variables. [Upstream HTTP API](https://github.com/NandhaKishorM/laya/blob/main/docs/http-api.md)

The model cost remains whether it is inside Docker or not. Upstream's Docker guide
asks users to allow 8 GB RAM and 10 GB disk for the CPU quickstart. Its local setup
records about 2.3 GB of weights for all three checkpoints. The published CPU
benchmark measured hundreds of milliseconds per question and 9.3 GiB peak RSS for
a script that loaded up to five checkpoints, not a single-checkpoint service.
Sources: [Docker guide](https://github.com/NandhaKishorM/laya/blob/main/docs/docker.md),
[local setup](https://github.com/NandhaKishorM/laya/blob/main/LOCAL_SETUP.md), and
[benchmarks](https://github.com/NandhaKishorM/laya/blob/main/BENCHMARKS.md).

Ways to lower standing resource use include loading only one checkpoint,
`LAYA_MAX_LOADED=1`, limiting `LAYA_THREADS`, or using
`LAYA_IDLE_UNLOAD_SECONDS`. Idle unloading trades lower resident memory for a cold
load on the next request; upstream also warns that allocator-retained pages mean
RSS may not immediately fall. [HTTP configuration](https://github.com/NandhaKishorM/laya/blob/main/docs/http-api.md#configuration)

## What Laya is and returns

Laya is a non-autoregressive classifier, not a chat model. It receives a JSON
`state` plus named typed questions and produces all decisions in a forward pass.
It supports:

- `choice`: one allowlisted label plus per-label probabilities;
- `score`: a probability-weighted position on supplied levels plus a legend;
- `noul`: the probability that a statement is true.

Responses contain named `answers`, usage counts and optional routing metadata. A
choice answer includes `choice`, `probabilities`, `confidence`, and
`answer_confidence`. The upstream documentation warns that `confidence` is
distribution concentration, while `answer_confidence` is the probability of the
reported answer; thresholds must be validated on held-out workload data.
[Upstream README and examples](https://github.com/NandhaKishorM/laya#single-model-mode-direct-sdk)

Example shape:

```json
{
  "answers": {
    "risk_level": {
      "type": "choice",
      "choice": "HIGH",
      "probabilities": { "LOW": 0.04, "MEDIUM": 0.18, "HIGH": 0.78 },
      "answer_confidence": 0.78
    }
  },
  "usage": { "input_tokens": 42, "output_tokens": 4 }
}
```

This is a representative contract, not a measured response from the current Mac.

## Exact Growth OS flow

The current implementation is in `src/lib/decisionEngine.ts` and is exposed by
`src/server/routes/decisionRoutes.ts`. All `/api/workspace/*` routes are protected
by `requireAuth`; the request-scoped workspace and Supabase client are stored in
`res.locals` before the decision router runs.

| Use | Endpoint/function | Output | Visible location |
| --- | --- | --- | --- |
| Runtime truth | `GET /api/workspace/decision/status` | configured, reachable, state, mode, model, execution eligibility | Action Queue System 1 status pill; Living System provider state |
| Risk triage | `POST /api/workspace/decision/triage` -> `classifyActionRisk()` | LOW/MEDIUM/HIGH/CRITICAL, confidence, probabilities, HITL requirement | Dashboard Action Queue, per-card System 1 Score/Re-Score and result pill |
| Issue routing | `POST /api/workspace/decision/route` -> `routeIssueToModule()` | owning module, suggested action, priority, confidence | Action Queue's Fast Signal & Issue Router modal |
| Agent safety | `POST /api/workspace/decision/safety` -> `evaluateAgentSwarmSafety()` | safe/risk classification and rationale | Authenticated backend endpoint; no current tenant UI caller was found |
| Tier routing | `classifyCategory()` | one of 17 allowlisted categories and its fixed owner agent | Tested library capability; not currently wired into the live server dispatch path |
| Sub-agent gate | `authorizeSubAgentExecution()` | permitted/HITL plus rationale | Tested library capability; not currently wired into the live execution path; write/high-risk work is structurally blocked before any model call |
| Antigravity advisory | `npm run laya:decide` -> `recommendBoundedChoice()` | one caller-supplied option, probability distribution, advisory/HITL flags | Terminal JSON for the development agent |

Every triage, route, or safety request that reaches its authenticated backend
endpoint is converted into a redacted decision trace and inserted into the
workspace-scoped `decision_traces` table. The trace
stores hashes of input/question sets, selected values, probabilities, duration,
policy overrides, and shadow decisions rather than raw tenant input.

In the default `shadow` mode, deterministic policy remains authoritative. Laya's
answer is retained as `shadowDecision` for comparison. Write-plane, HIGH-risk, and
CRITICAL actions remain structurally approval-gated and do not ask Laya for
permission.

## How a tenant user uses it

1. Open the Dashboard and select the Action Queue.
2. Read the System 1 status pill. `unconfigured`, `degraded`, or
   `ready_unvalidated` means Laya is not controlling decisions.
3. On an action card, choose **System 1 Score** or **Re-Score** to classify risk and
   see the engine, confidence, HITL requirement, and rationale.
4. Use **Fast Signal & Issue Router** to paste an issue or choose a quick scenario.
   The result recommends a module and next action.
5. Review and approve write actions through the normal approval flow. A Laya score
   never grants approval.

If the runtime is offline, server deterministic policy remains available; the
current Action Queue also contains a client heuristic fallback. The UI must report
which engine supplied the result.

## Alternatives

### Transformers.js MobileBERT zero-shot classification

Hugging Face's official Transformers.js pipeline runs locally in Node and supports
runtime candidate labels. The documented MobileBERT example returns ranked labels
and scores, which matches the Growth OS routing/risk seams reasonably well without
a separate Python server. It would still need allowlists, calibration, trace
mapping, and failure tests. [Transformers.js pipeline API](https://huggingface.co/docs/transformers.js/api/pipelines#module_pipelines.ZeroShotClassificationPipeline)

### MiniLM embeddings

`all-MiniLM-L6-v2` is a 22.7M-parameter sentence encoder intended for retrieval,
clustering and similarity. It could score an input against approved option
descriptions with cosine similarity, but those similarities are not calibrated
decision probabilities. It is suitable for shortlist/routing assistance, not
authorization. [Official model card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)

### fastText

fastText learns efficient supervised classifiers from labelled examples and can
return labels with probabilities. Its official examples include compressed models
around 1.6-1.7 MB for fixed public datasets. It is attractive after Sigma has a
stable, human-approved training set, but it cannot accept arbitrary new choices at
runtime. The official repository is archived, so maintenance risk must be counted.
[Official tutorial](https://github.com/facebookresearch/fastText/blob/main/docs/supervised-tutorial.md)
and [published model sizes](https://github.com/facebookresearch/fastText/blob/main/docs/supervised-models.md).

### Laya MPS

The community `laya-mps` project targets Apple Silicon without Docker. Its M5 Pro
benchmark reports about 0.74 GiB peak process RAM and 171 ms median latency in
`minimal` mode, or about 2.11 GiB and 32 ms in `reduced` mode. Those numbers are not
M1 measurements. It exposes `/v1/decisions`, not the current `/v1/systemone`
contract, and explicitly says it is not a drop-in endpoint. It is therefore a
candidate spike, not a current dependency.
[Laya MPS repository](https://github.com/afshinm/laya-mps).

### Small Ollama generation model

Ollama publishes Gemma 3 variants as small as 270M (about 292 MB) and 1B (about
806 MB). They can produce JSON with prompting and validation, but they are
generative models rather than typed decision heads. They add parsing, latency and
hallucination risk, so they are a weaker fit for safety/routing than deterministic
policy or a classifier. [Ollama Gemma 3 tags](https://ollama.com/library/gemma3/tags).

## Uncertainty and validation boundaries

- No live Laya forward pass was run for this report.
- Published resource numbers come from different machines and workloads; none is a
  verified M1 MacBook Air measurement for Sigma's request shapes.
- Laya's probabilities are not proof of correctness. Promotion out of shadow mode
  still requires human-approved labels, held-out evaluation, measured latency and
  a rollback test.
- The currently installed upstream runtime is version 0.3.20. Do not upgrade or
  replace it without rerunning the contract and calibration suites.
