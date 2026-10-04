<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: expansion-signal-finder
name: expansion-signal-finder
tier: 2
owner: A6
owner_name: Customer Success Agent
plane: read
requires_approval: false
timeout_ms: 30000
tools: [vault-read]
---

# expansion-signal-finder

**Owned by** — A6 Customer Success Agent

## Mission

Identify upsell and upgrade triggers

| Contract | Value |
| --- | --- |
| Input | usage + plan data |
| Output | opportunity list |
| Plane | `read` |
| Approval | Not required |
| Timeout | 30000 ms |
| Vault scope | Inherited from A6, minus Executive and Credentials |
## Rules

1. Do exactly the mission above. No adjacent work.
2. Never widen the inherited vault scope.
3. Emit a `node_attempt` on the parent run; never open a run of your own.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. This is read-plane: it may read inherited vaults but holds no delivery or connector write capability.
