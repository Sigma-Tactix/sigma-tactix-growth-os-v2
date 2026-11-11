<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: health-scorer
name: health-scorer
tier: 2
owner: A6
owner_name: Customer Success Agent
plane: read
requires_approval: false
timeout_ms: 30000
tools: [vault-read]
---

# health-scorer

**Owned by** — A6 Customer Success Agent

## Mission

Derive an account health score from usage and support signals

| Contract | Value |
| --- | --- |
| Input | usage + support data |
| Output | health score |
| Plane | `read` |
| Approval | Not required |
| Timeout | 30000 ms |
| Vault scope | Inherited from A6, minus Executive and Credentials |
## SOP — Standard Operating Procedure

1. **Receive** — the owning agent's dispatch DAG hands this node its input contract (usage + support data) plus any upstream node results from earlier in the run.
2. **Read** — grounded only in inherited vault scope and the tools granted below (`search_second_brain`, `get_connector_status`). Nothing else.
3. **Produce** — emit the output contract (health score) within 30000 ms. On timeout or failure, the node's `node_attempt` records the error and the run aborts; no partial result is published.
4. **Return** — read-plane output is evidence and recommendations only; it never triggers a write or delivery.

## AOP — Autonomy Policy

| Property | Value |
| --- | --- |
| Plane | `read` — autonomous within grants |
| Granted tools | `search_second_brain` `get_connector_status` |
| Vault scope | Inherited from A6 Customer Success Agent, minus Executive and Credentials |
| Timeout | 30000 ms |
| Delivery / connector writes | None — any external effect is out-of-band and human-performed |
## Rules

1. Do exactly the mission above. No adjacent work.
2. Never widen the inherited vault scope.
3. Emit a `node_attempt` on the parent run; never open a run of your own.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. This is read-plane: it may read inherited vaults but holds no delivery or connector write capability.
