<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: lead-qualifier
name: lead-qualifier
tier: 2
owner: A5
owner_name: AI SDR (Sales Agent)
plane: read
requires_approval: false
timeout_ms: 30000
tools: [vault-read]
---

# lead-qualifier

**Owned by** — A5 AI SDR (Sales Agent)

## Mission

Score a lead against the ICP

| Contract | Value |
| --- | --- |
| Input | lead record + ICP |
| Output | score + rationale |
| Plane | `read` |
| Approval | Not required |
| Timeout | 30000 ms |
| Vault scope | Inherited from A5, minus Executive and Credentials |
## Rules

1. Do exactly the mission above. No adjacent work.
2. Never widen the inherited vault scope.
3. Emit a `node_attempt` on the parent run; never open a run of your own.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. This is read-plane: it may read inherited vaults but holds no delivery or connector write capability.
