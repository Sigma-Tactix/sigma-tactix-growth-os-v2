# Product usefulness, honesty and control acceptance

Revision: 17 November 2026. Required before declaring the 20 November goal complete. These are work orders and observed findings, not repairs already shipped.

## Live observations from this review

Observed on the selected production tab, repository HEAD `18ef63cb7d0412e49d31a603fb7770e292b4da1d`:

- Dashboard color controls do change the Performance Velocity SVG curve: Amber `#F59E0B`, Emerald `#10B981`, Indigo `#38BDF8`. The other observed chart series retain amber/cyan. Thus a completely inert switch was not reproduced; scope inconsistency and Indigo rendering cyan are concrete issues. Original selected profile Indigo was restored. No persistence, export-color or fresh-session verification was performed.
- The dashboard shows benchmark values, a sample intake chart, missing-source zero cards, VANTA offline and no recorded activity. Samples are labelled, but that does not make them useful on a real client home page. Replace missing metrics with unavailable/setup states; place reference benchmarks separately.
- Agent Cockpit reports ledger unavailable and zero verified runs, while its fleet shows ACTIVE states and accuracy values such as 99.8%. The displayed accuracy and activity claims are unsupported by the demonstrated page evidence. Remove them unless a documented measurement and live state justify them.
- The same cockpit displays Executive Vault under allowed reads, conflicting with the canonical rule excluding both Executive and Credentials Secret Vaults from autonomous agents. This is a UI/policy contradiction requiring a real authorization test, not proof that a live database leak occurred.
- Creative Studio groups three modules but presents an empty generator, generic executive-language presets, an Anti-Slop toggle and a footer describing internal route consolidation. This grouping is not evidence of a shared brief, persisted handoff or completed client workflow. Remove internal implementation explanations from client flows.

The cockpit's instruction to apply migration 0017 is an on-screen diagnostic, not proof of the root cause. Inspect actual deployed schema, grants, errors and cutover configuration before applying a migration.

## Every surface must earn its place

For every route, section, badge, metric and interactive control, record one row in `CONTROL_INVENTORY.csv`. Add all controls from the actual running build; this seeded file is not an exhaustive audit.

Required fields: user job, commercial deliverable, prerequisite, observed effect, authoritative data/state source, expected result, permission, failure behavior, evidence, disposition and owner task. Dispositions: `keep`, `merge`, `repair`, `operator_only`, `retire`.

A legitimate navigation, view/filter or appearance control need not create a job. It must produce its stated visible effect, work with keyboard access and preserve state for the advertised scope. A production action needs a validated request, truthful durable state and a result/receipt. A toast alone is not evidence of performed work.

No client-facing controls that silently no-op, fabricate success, launch an unsupported action or merely decorate the screen. Remove, repair or expose a clear unavailable prerequisite. No client-facing demo fixtures, simulated activity, invented accuracy, fake health percentages, synthetic growth trends or context-free OPTIMAL/SCALING badges.

The operator may retain isolated test/simulation tools. They must be separate from real client work, labelled, excluded from live reporting and unable to trigger client effects.

## Dashboard color acceptance work order

1. Define it visibly as report colors or application appearance; these are distinct settings. Remove a redundant selector if it contributes no client value.
2. If retained, Amber/Indigo/Emerald must match their names and consistently style all declared report surfaces, including chart curves/fills, benchmark bars where retained, and generated report charts.
3. Verify the chosen scope: switching Client Enclave must not leak another client's settings; reload and a new authorized session behave according to documented persistence.
4. Test actual rendered DOM/computed styles and resulting export bytes. A state variable, screenshot of a selected button or source-code change alone is insufficient.
5. Check readable contrast, keyboard operation and light/dark behavior. Record exact build, preset, observed colors and export evidence.

## Client-facing structure

Primary navigation should reflect work: Overview, Client Work, Approvals, Deliverables and Knowledge, with Connections/Settings available when needed. Plan can be a first-class destination if actual user testing supports it. Existing suites become task-relevant capabilities inside Client Work, rather than forcing the client to understand a catalogue of tools.

Each job follows a confirmed brief and carries shared IDs for client, goal, evidence snapshot, action, approval, run and artifact. Generated assets must not reset context when moving to another module. VANTA shows what it knows, what it will do and the resulting evidence at each step.

Plain-language copy explains actions and outcomes. Replace unexplained DAG, harness, entity-density, sovereignty and model/provider labels in ordinary client flows. Keep project domain identifiers in internal contracts; explain retained terms briefly to users. An Anti-Slop switch is not a quality check; quality criteria apply to all client outputs.

## Done means useful and demonstrably usable

- The user can identify the next relevant action and intended deliverable without a tour of infrastructure.
- Every displayed figure or claim has a definition, scope, source and observed time, or is omitted/unavailable.
- Each required control passes happy path, failed request, missing prerequisite and permission tests as applicable.
- A client job produces the agreed persisted output, can be reopened in another session and passes its client acceptance checks.
- No required action depends on a pretend agent run, a local timer, an undisclosed manual step or a fixture labelled as live.
- Record failures as failures, with a useful next action. Do not convert a blocked workflow into a success badge.

## Learning that can be demonstrated

Development loop: observed failure -> cause hypothesis -> focused fix -> independent acceptance -> regression case -> versioned lesson -> next task. Successful compilation alone is not learning.

Client loop: agreed success measure -> executed action -> measured or explicitly unavailable outcome -> review -> approved lesson -> permitted Knowledge Vault entry -> retrieval in a later job. Store source, period, action/run/artifact IDs, reviewer, version and limitations. A correlated outcome is not automatically causal uplift.

Promotion of a new prompt, policy or tool strategy requires versioned evaluation on retained examples and a rollback path. Agents may propose improvements; they cannot grant themselves privileges, rewrite approvals or ingest Secret Vault content as learning. Incorrect/outdated lessons can be superseded or revoked.
