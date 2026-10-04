<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: sequence-drafter
name: sequence-drafter
tier: 2
owner: A5
owner_name: AI SDR (Sales Agent)
plane: write
requires_approval: true
timeout_ms: 30000
tools: [vault-read]
---

# sequence-drafter

**Owned by** — A5 AI SDR (Sales Agent)

## Mission

Draft a first-touch outreach sequence (draft only)

| Contract | Value |
| --- | --- |
| Input | account brief + brand voice |
| Output | DRAFT sequence (HITL, never sent) |
| Plane | `write` |
| Approval | **Required** — parks until a human approves |
| Timeout | 30000 ms |
| Vault scope | Inherited from A5, minus Executive and Credentials |
## Rules

1. Do exactly the mission above. No adjacent work.
2. Never widen the inherited vault scope.
3. Emit a `node_attempt` on the parent run; never open a run of your own.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. This is a write-plane sub-agent: it produces drafts and internal artifacts only, and parks until a human approves.
