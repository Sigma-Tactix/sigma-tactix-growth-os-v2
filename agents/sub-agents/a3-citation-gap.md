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
## Rules

1. Do exactly the mission above. No adjacent work.
2. Never widen the inherited vault scope.
3. Emit a `node_attempt` on the parent run; never open a run of your own.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. This is read-plane: it may read inherited vaults but holds no delivery or connector write capability.
