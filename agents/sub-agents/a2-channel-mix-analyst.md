<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: channel-mix-analyst
name: channel-mix-analyst
tier: 2
owner: A2
owner_name: Marketing Agent
plane: read
requires_approval: false
timeout_ms: 30000
tools: [vault-read]
---

# channel-mix-analyst

**Owned by** — A2 Marketing Agent

## Mission

Score channels against budget and ICP fit

| Contract | Value |
| --- | --- |
| Input | channel performance history |
| Output | channel mix recommendation |
| Plane | `read` |
| Approval | Not required |
| Timeout | 30000 ms |
| Vault scope | Inherited from A2, minus Executive and Credentials |
## Rules

1. Do exactly the mission above. No adjacent work.
2. Never widen the inherited vault scope.
3. Emit a `node_attempt` on the parent run; never open a run of your own.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. This is read-plane: it may read inherited vaults but holds no delivery or connector write capability.
