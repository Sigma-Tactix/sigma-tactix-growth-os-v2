<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: audit-score-composer
name: audit-score-composer
tier: 2
owner: A1
owner_name: Audit Diagnostic Agent
plane: write
requires_approval: true
timeout_ms: 30000
tools: [vault-read]
---

# audit-score-composer

**Owned by** — A1 Audit Diagnostic Agent

## Mission

Fuse subscores into one auditable overall score

| Contract | Value |
| --- | --- |
| Input | subscore records |
| Output | audit_vault draft (HITL) |
| Plane | `write` |
| Approval | **Required** — parks until a human approves |
| Timeout | 30000 ms |
| Vault scope | Inherited from A1, minus Executive and Credentials |
## SOP — Standard Operating Procedure

1. **Receive** — the owning agent's dispatch DAG hands this node its input contract (subscore records) plus any upstream node results from earlier in the run.
2. **Read** — grounded only in inherited vault scope and the tools granted below (`search_second_brain`, `write_workspace_file`). Nothing else.
3. **Produce** — emit the output contract (audit_vault draft (HITL)) within 30000 ms. On timeout or failure, the node's `node_attempt` records the error and the run aborts; no partial result is published.
4. **Park** — write-plane output is a draft: it parks in `execution_approvals` and only takes effect after a human approves.

## AOP — Autonomy Policy

| Property | Value |
| --- | --- |
| Plane | `write` — draft-only, human approval required |
| Granted tools | `search_second_brain` `write_workspace_file` |
| Vault scope | Inherited from A1 Audit Diagnostic Agent, minus Executive and Credentials |
| Timeout | 30000 ms |
| Delivery / connector writes | None — any external effect is out-of-band and human-performed |
## Rules

1. Do exactly the mission above. No adjacent work.
2. Never widen the inherited vault scope.
3. Emit a `node_attempt` on the parent run; never open a run of your own.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. This is a write-plane sub-agent: it produces drafts and internal artifacts only, and parks until a human approves.
