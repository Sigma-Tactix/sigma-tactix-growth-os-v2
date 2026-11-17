# Growth OS application certification method

Prepared 17 November 2026. **No application scenario has been executed or passed by creating this catalogue.** Every scenario starts `NOT_RUN`.

`SCENARIOS.json` contains **153 scenario templates**: five tests for each of the 25 modules in `MODULE_ACCEPTANCE.csv`, plus 27 platform/client-workflow scenarios and one unattended-reliability soak scenario. Module tests cover happy path, failure, permission, durable reopening and page-specific VANTA context. Platform tests cover identity/isolation, Secret Vaults, VANTA tools and injection resistance, browser/files/network boundaries, jobs/hooks/restarts, connectors, all three artifact formats, recovery, deployment identity, mobile/keyboard and the three client delivery contracts.

## Before execution

1. Freeze the candidate source and record frontend/backend/worker SHAs, deployment ID, database migration manifest, capability manifest and nonsecret configuration fingerprint. Build success alone is not certification.
2. Discover actual routes, controls, tool operations, connector operations, cron jobs, hooks and automations. CAP-01/CAP-02 require every enabled claim to be bound to a test case. Suite hubs, aliases and newly added operations cannot be skipped because the starting CSV omitted them.
3. Create dedicated A/B test identities and Client Enclaves. Use synthetic business documents and secret canaries. Keep real customer data and credentials out of test logs and artifacts.
4. Inspect scenario flags before running. Missing legitimate access means `BLOCKED`. External effects, spending and destructive work require the relevant authorization. Never publish/send to unrelated targets or run destructive recovery against production.
5. Prepare disposable production-equivalent staging for failure injection, prompt-injection/network cases, policy tests and restore drills. Record actual differences from production.

## Run and observe

Use the real deployed application path: UI -> authenticated API -> database/tool/worker -> durable result. Verify the output independently through server/storage/provider readback. A toast, generated narrative, status animation or job ID cannot establish delivery.

For each parameter binding, record one observation following the embedded JSON Schema. Include exact environment, SHAs/config fingerprint, fixture/input hashes, identity aliases, actions, actual result, durable record IDs, redacted evidence references and hashes, defects and limitations. A different reviewer must inspect claimed passes. The schema requires a reviewer for PASS; actual reviewer independence must also be checked by the coordinator.

`LIVE_RUNTIME` permits synthetic fixture inputs against the real runtime. It does not permit replacing the database or successful provider operation with a mock. `CONTROLLED_FAILURE` deliberately injects a documented failure through the real gateway; it proves error handling, not provider availability. A source read does not certify write, publish, refresh or revoke operations. Instantiate each enabled operation explicitly.

Store logs, receipts, screenshots, rendered PDF pages/slides and resulting files in the protected evidence directory. Every reported external completion needs its actual receipt or independently checked target state. An unknown provider outcome stays unresolved until reconciled; do not retry blindly.

## Artifact checks

- PDF: render and inspect every page, search/extract text, check clipping/charts and reconcile source values.
- PPTX: independently open/render every slide and verify editability where promised; image-only slides cannot satisfy an editable deck claim.
- XLSX: open and recalculate in Excel/LibreOffice, check numeric/date types, formulas, totals, source/definition sheets and imported formula injection.

The client package must contain the same immutable snapshot and approved version across formats. Verify authorized persistence across reload/second session and deny foreign/expired artifact access.

## Pass and no-go

Full certification requires all required scenarios and discovered parameter cases to pass on the exact candidate, the three complete client workflows to pass, zero open P0/P1 client-impact defects in claimed scope, production routing/configuration smoke evidence, and staging isolation/recovery evidence. Required `NOT_RUN`, `BLOCKED`, `FAIL` or `WAIVED` cases prevent a full certificate.

Any cross-client/Secret Vault disclosure, unauthorized action, duplicate delivery, false completion, missing required receipt or mismatched build/environment is a no-go. A missing provider grant cannot be resolved by marking an integration unavailable and still claiming the full requested scope passed.

Source, deployment, policy, schema, adapter or relevant configuration changes invalidate affected observations. Record impact, rerun those cases and refresh production smoke on the final candidate. A material shared-contract/security change can invalidate a wider group; the integrator determines and documents that group rather than relying on old green results.

If the founder explicitly changes scope, version the new scope and label any narrower certificate by its actual capabilities. Keep original failed/blocked results. A scope waiver is never a test pass.

Suggested certificate fields: candidate/environment fingerprints, tested scope/operation inventory hash, scenario totals by status, evidence index hash, unresolved defects/limitations, independent reviewers, timestamp and release decision. Until all gates hold, status is **NOT_CERTIFIED**.

## Catalogue validation performed

Only structural validation was performed while creating the file: JSON parses, IDs are unique, all initial statuses are `NOT_RUN`, every source CSV module has five scenario types, and required input/action/output/failure/permission/proof/flag fields exist. These checks do not test Growth OS itself.

## Initial audit and release ordering

Read LIVE_AUDIT.md and SOURCE_FINDINGS.md before running writes. No application E2E pass is recorded. LIVE_OBSERVATIONS.json captures UI inspection, not catalogue execution. SCENARIOS.json statuses remain NOT_RUN until an actual bound case is observed. REL-01 requires a minimum 12-hour staging soak and ten jobs; this is not an uptime guarantee.

S22 assembles independent candidate acceptance before S20. Production certification becomes effective only after S20 verifies the exact production build/configuration and authenticated smoke. A staged candidate pass is not production certification.

## Explicit predeploy and production phases

S22 requires every candidate/staging-required case to PASS. It may issue candidate acceptance only, with the three explicitly named production bindings pending deployment: `OPS-02@production` (exact runtime identity/routing/readiness), `AUTH-01@production` (fresh authorized test login/scope/resume and denied foreign scope), and `ART-04@production` (authorized persisted test-artifact read and foreign denial). Their definitions are in SCENARIOS.json release_phases. This phase marker never changes a result to PASS and never permits production certification.

S20-A1 checks completed candidate evidence. S20-A2 deploys under applicable authorization and runs all three production bindings. Only after all pass may S20-A3 activate production certification. Failure means NO-GO and rollback/recovery. No other mandatory case can be deferred by this rule.

Soak scheduling: S19 starts REL-01 on the frozen candidate by **19 November 22:00 Dubai**, finishing by **20 November 10:00**, before M5/S22. S22 reviews completed evidence; it does not wait until its own start to launch twelve hours of work. Run the durable soak asynchronously under one owner, with coordinator heartbeats/checkpoints. Changes invalidating evidence require a rerun; missing the deadline remains a failed gate.
