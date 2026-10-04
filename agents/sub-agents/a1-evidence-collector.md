<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: evidence-collector
name: evidence-collector
tier: 2
owner: A1
owner_name: Audit Diagnostic Agent
plane: read
requires_approval: false
timeout_ms: 30000
tools: [vault-read]
---

# evidence-collector

**Owned by** — A1 Audit Diagnostic Agent

## Mission

Fetch and parse a bounded list of target URLs into evidence contracts

| Contract | Value |
| --- | --- |
| Input | URLs[] (SSRF-checked) |
| Output | evidenceContract[] with provenance |
| Plane | `read` |
| Approval | Not required |
| Timeout | 30000 ms |
| Vault scope | Inherited from A1, minus Executive and Credentials |
## Rules

1. Do exactly the mission above. No adjacent work.
2. Never widen the inherited vault scope.
3. Emit a `node_attempt` on the parent run; never open a run of your own.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. This is read-plane: it may read inherited vaults but holds no delivery or connector write capability.
