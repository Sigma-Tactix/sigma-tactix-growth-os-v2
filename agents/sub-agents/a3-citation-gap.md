<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: citation-gap
name: citation-gap
tier: 2
owner: A3
owner_name: SEO & Authority Agent
plane: read
requires_approval: false
timeout_ms: 30000
tools: [vault-read]
---

# citation-gap

**Owned by** — A3 SEO & Authority Agent

## Mission

Find answer-engine citation opportunities

| Contract | Value |
| --- | --- |
| Input | AEO/SERP snapshot |
| Output | ranked citation gaps |
| Plane | `read` |
| Approval | Not required |
| Timeout | 30000 ms |
| Vault scope | Inherited from A3, minus Executive and Credentials |
## SOP — Standard Operating Procedure

1. **Receive** — the owning agent's dispatch DAG hands this node its input contract (AEO/SERP snapshot) plus any upstream node results from earlier in the run.
2. **Read** — grounded only in inherited vault scope and the tools granted below (`fetch_site_content`, `search_second_brain`). Nothing else.
3. **Produce** — emit the output contract (ranked citation gaps) within 30000 ms. On timeout or failure, the node's `node_attempt` records the error and the run aborts; no partial result is published.
4. **Return** — read-plane output is evidence and recommendations only; it never triggers a write or delivery.

## AOP — Autonomy Policy

| Property | Value |
| --- | --- |
| Plane | `read` — autonomous within grants |
| Granted tools | `fetch_site_content` `search_second_brain` |
| Vault scope | Inherited from A3 SEO & Authority Agent, minus Executive and Credentials |
| Timeout | 30000 ms |
| Delivery / connector writes | None — any external effect is out-of-band and human-performed |
## Rules

1. Do exactly the mission above. No adjacent work.
2. Never widen the inherited vault scope.
3. Emit a `node_attempt` on the parent run; never open a run of your own.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. This is read-plane: it may read inherited vaults but holds no delivery or connector write capability.
