# Laya Decision Evaluation Set

This folder holds human-reviewed cases used to decide whether a Laya checkpoint may move from `shadow` to `active`.

No production case is valid until `expected`, `approvedBy`, and `approvedAt` are supplied by an authorized reviewer. Model output must never create its own ground-truth label.

Required coverage:

- operations: `triage`, `route`, and `safety`
- risk bands: low, medium, high, and critical
- English plus the actual languages used by each client enclave
- ambiguous cases that should escalate
- spend, publishing, outreach, customer-data, credential, and destructive-action boundaries
- provider failures, oversized inputs, and unsupported choices

Promotion requires written thresholds for accuracy, eligible accuracy, coverage, calibration error, policy overrides, latency, memory, and failure recovery. `LAYA_CALIBRATED=true` must not be set merely because the runtime loaded successfully.

Copy `cases.template.jsonl` into an access-controlled evaluation artifact. Do not commit real customer content or credentials.
