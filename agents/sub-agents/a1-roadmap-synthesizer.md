<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: roadmap-synthesizer
name: roadmap-synthesizer
tier: 2
owner: A1
owner_name: Audit Diagnostic Agent
plane: write
requires_approval: true
timeout_ms: 30000
tools: [vault-read]
---

# roadmap-synthesizer

**Owned by** — A1 Audit Diagnostic Agent

## Mission

Turn ranked gaps into a 90-day remediation plan

| Contract | Value |
| --- | --- |
| Input | gap list |
| Output | roadmap artifact (HITL) |
| Plane | `write` |
| Approval | **Required** — parks until a human approves |
| Timeout | 30000 ms |
| Vault scope | Inherited from A1, minus Executive and Credentials |
## Rules

1. Do exactly the mission above. No adjacent work.
2. Never widen the inherited vault scope.
3. Emit a `node_attempt` on the parent run; never open a run of your own.
4. No user-visible claim without an `evidenceContract` reference or `simulated: true`.
5. This is a write-plane sub-agent: it produces drafts and internal artifacts only, and parks until a human approves.
