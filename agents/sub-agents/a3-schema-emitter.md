<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: schema-emitter
name: schema-emitter
tier: 2
owner: A3
owner_name: SEO & Authority Agent
plane: write
requires_approval: true
timeout_ms: 30000
tools: [vault-read]
---

# schema-emitter

**Owned by** — A3 SEO & Authority Agent

## Mission

Emit JSON-LD structured data for target pages

| Contract | Value |
| --- | --- |
| Input | page inventory |
| Output | schema artifacts (HITL) |
| Plane | `write` |
| Approval | **Required** — parks until a human approves |
| Timeout | 30000 ms |
| Vault scope | Inherited from A3, minus Executive and Credentials |
## Rules

1. Do exactly the mission above. No adjacent work.
2. Never widen the inherited vault scope.
3. Emit a `node_attempt` on the parent run; never open a run of your own.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. This is a write-plane sub-agent: it produces drafts and internal artifacts only, and parks until a human approves.
