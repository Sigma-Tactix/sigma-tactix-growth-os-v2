# Existing AI Provider Settings repair — 2026-10-30

## Decision and scope

Repair the existing provider flow before evaluating another gateway. No LiteLLM,
new dependency, schema migration, deployment or live provider request is included.

- Google is the canonical saved provider identifier; legacy `gemini` entries remain readable.
- Saving Google credentials/model now reaches existing Gemini consumers, including VANTA.
- `POST /api/workspace/admin/ai/selection` persists one Client Enclave agent provider/model.
- Approved agent runs and agent pipelines resolve that selection once and use its saved
  credentials and endpoint. Existing tool grants, scoped context, HITL and user-JWT
  database helpers remain in place. No service-role query was added.
- No selection retains Gemini defaults and explicitly configured keyless local fallback.
  An explicitly selected remote provider with no key fails rather than using another provider.
- Selection does NOT switch VANTA, voice, diagnostic studios or creative adapters away
  from their existing feature-specific configuration. The UI states this boundary.
- OpenAI-compatible adapters cover OpenAI, xAI, DeepSeek, Qwen, GLM, OpenRouter,
  Omniroute, OpenCode, OpusMax, Ollama and LM Studio. Anthropic uses Messages API
  with native tool schemas and grouped parallel tool results. OpusMax's existing
  Anthropic-format host is translated as well. Compatibility is tested with fixtures,
  not a claim that every catalog model or external service is available.
- Account OAuth was never implemented by opening ChatGPT in another tab. The UI now
  says so, and that provider is not selectable for agent execution. Use OpenAI API keys.

## Settings behavior

1. Save the provider credential, exact supported model ID and optional endpoint.
2. Test inference using the saved credential (unsaved credential input is not tested).
3. Select the model for agent runs. Selection is distinct from a saved provider default.
4. Future approved runs/pipelines use the persisted selection; changing the setting
   does not mutate an already-running graph's provider identity.

Saved does not mean verified. A matching successful text inference records model,
endpoint and timestamp; verification expires after seven days and is invalidated
by credential replacement, configuration mismatch or a failed re-test. Verification
does not attest tool support. API responses never include decrypted credentials.

Local endpoint configuration is keyless and restricted to API-server loopback.
Hosted custom URLs are validated through `assertPublicHost`, require HTTPS and
reject URL credentials/query/fragment. Redirects are rejected during completion
requests. Custom Gemini endpoints are rejected rather than silently ignored.
The existing global public-host validator is reused; this is not a claim of
DNS-pinning or a completed infrastructure-level network isolation review.

## Verification and limits

Final local checks: `npm run lint` passed; full suite passed **593 tests across
85 files** with the Laya subprocess environment reset below; `npm run build`
passed with the existing client large-chunk warning. No dependencies added.

Regression coverage includes canonical aliases, provider-specific resolution,
credential masking, verification lifecycle, real local HTTP save/select/test/delete
handlers, admin enforcement, invalid settings, private targets, local settings,
OpenAI-compatible adapters and parallel Anthropic tool results.

HTTP handler tests extract actual route declarations from `server.ts` without
starting its application lifecycle. Database/auth/provider dependencies are stubbed;
the HTTP requests and route logic execute, but deployed Supabase RLS and real
provider credentials are not verified by these tests.

Run `npm run lint`, `npm run build`, and the full suite with ambient Laya configuration
removed from the subprocess (an existing test assumes it is unconfigured):

```sh
env -u LAYA_BASE_URL -u LAYA_API_KEY -u LAYA_MODEL -u LAYA_MODE -u LAYA_CALIBRATED -u LAYA_TIMEOUT_MS npm test
```

Live authenticated browser checks and low-token inference/tool checks with each
provider's real credentials remain follow-up acceptance checks. No independent
reviewer was available; automated verification and self-review are not independent
security approval. Existing encryption still requires a production
`CONNECTOR_CREDENTIALS_KEY`; this task does not change its dev-key fallback policy.

Concurrent unrelated Visual Proposal Studio / MASTER_CONTEXT edits were preserved.
This task-specific note captures the delta without taking ownership of that work.