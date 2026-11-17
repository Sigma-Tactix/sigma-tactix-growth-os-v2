# Shared contracts: freeze in S02

These are proposed interface requirements. Reconcile with existing types and migrations; reuse before adding parallel tables. Integrator owns canonical naming, types and migrations. No production migration is applied by this pack.

## Page context

```json
{
  "schemaVersion": "1.0",
  "workspaceId": "server-issued-uuid",
  "route": "/reports",
  "entityRefs": [{"type":"report_snapshot","id":"snapshot-id","version":1}],
  "selectionRefs": [],
  "filters": {"periodStart":"2026-11-01","periodEnd":"2026-11-17","currency":"AED"},
  "attachmentIds": [],
  "contextVersion": 1
}
```

The envelope is untrusted input. Server membership/object permissions and current versions determine accepted references. Return a context receipt with accepted/omitted references, reasons and snapshot time. Limit payload sizes; redact secrets; do not treat page instructions as authorization. Switching Client Enclave clears ephemeral context and ignores prior responses. Persist only authorized attachments and explicitly approved memory.

## Tools and action consent

Tool declaration: stable ID/version, input/output schema, effect class, role/resource scope, credential binding, destination allowlist, timeout/step/cost cap, retry/idempotency rules and required success evidence.

Action: goal, Client Enclave, actor, destination, exact versioned payload, arguments hash, success measure and limits. Approval: authorized approver, action hash/version, expiry and limits. Worker rechecks permission/grant at execution; changing the action invalidates consent. Read/draft and external effect policies are separate.

Run receipt: action/approval/run IDs, actor/workspace, tool version, arguments hash, attempts, timestamps, status, artifact IDs, provider receipt or redacted error. No secret material in receipts. External acceptance, delivery and measured marketing impact are separate outcomes.

## Durable jobs, hooks and cron

States: requested/pending_approval/approved/queued/running/succeeded/failed/blocked/cancelled/reconciling. Reuse existing ledger vocabulary and legal transitions.

Job: idempotency key, owner/workspace, versioned task template, next attempt, lease/heartbeat, attempts/max, cancellation flag and output refs. Schedule: IANA timezone, recurrence, next trigger, missed-run behavior and enabled state. Event: authenticated source, persistent source-event ID, schema version and receipt time. Signed events verify payload before enqueue; duplicates never repeat side effects.

Use atomic claim and outbox/transaction boundaries. If provider acceptance is unknown, reconcile before retrying. A terminally failed job exposes its reason and retry controls. Cancellation stops future steps; it cannot promise reversal of an already completed external action.

## Artifact and metrics

Artifact: owner/workspace, report/source snapshot IDs, type/MIME, bytes/hash, version, renderer version, storage reference, permissions, creation time, preview and QA receipt. Use original bytes; check MIME/content. Signed links expire and are not reusable across Client Enclaves.

Metric: definition, numeric/null value, unit, currency, reporting period/timezone, attribution model, source/property/account, captured time and data state. Never use zero for missing data. Distinguish verified/stale/manual/benchmark/simulated/unavailable. Do not sum duplicate attributed revenue or mix currencies/periods without an explicit valid model.

## Capability proof

Capability is operation-specific: provider/tool + operation + workspace/account + environment + version + status + checkedAt + success/error evidence + limitation. Supported/configured is not verified. A catalogue entry, mock success or a stored key is not live proof.

Required release evidence levels: implemented -> unit_verified -> integration_verified -> staging_verified -> production_verified. Preserve prior receipts and record their environment and build SHA. Reverify material interface/configuration changes.
