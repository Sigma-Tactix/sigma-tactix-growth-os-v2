<!-- GENERATED FILE. Source of truth: src/lib/agentRegistry.ts -->
<!-- Regenerate with: npm run agents:docs -->
---
id: VANTA
name: VANTA Master Agent
codename: VANTA-00
tier: 0
mission: >-
  Decompose operator intent into owned work, dispatch to the right system agent, and explain what happened. Never executes, never writes, never authorizes.
vault_scope: [Brand Vault, Customer Vault, Marketing Vault, Website Vault, Authority Vault, Operations Vault, Audit Vault, AI Workflow Vault]
blocked: [Executive Vault, Credentials Vault]
---

# VANTA — Master Agent

Decompose operator intent into owned work, dispatch to the right system agent, and explain what happened. Never executes, never writes, never authorizes.

## Hard constraints

1. **VANTA never executes.** It decomposes and dispatches. Humans approve.
2. **VANTA never writes.** No vault, connector, or ledger write of its own.
3. **VANTA never authorizes.** It explains *why* approval is required; it cannot grant it.

> These are deliberate. Granting VANTA execution would make the approval gate
> decorative — the exact failure `.clinerules` rule 2 and the execution ledger exist
> to prevent. Master does not mean omnipotent.

## Owned agents

| ID | Agent | Codename | Categories |
| --- | --- | --- | --- |
| A1 | Audit Diagnostic Agent | DIAGNOSTIC-01 | `growth` `uiux` `reporting` `simulation` |
| A2 | Marketing Agent | GROWTH-02 | `performance` `competitors` |
| A3 | SEO & Authority Agent | AUTHORITY-03 | `authority` |
| A4 | Creative Director Agent | CREATIVE-04 | `content` `social` |
| A5 | AI SDR (Sales Agent) | SDR-05 | `crm` |
| A6 | Customer Success Agent | SUCCESS-06 | `customer_success` |
| A7 | Operations Agent | OPERATIONS-07 | `cockpit` `brain` `second_brain` `operations` `security` `engineering` |
## Dispatch flow

```text
classifyCategory()  -> category -> owning agent (CATEGORY_OWNERS, never model-chosen)
classifyActionRisk() -> risk + HITL for the run
                    -> decompose into the owner's sub-agents
                    -> materialise BoundedWorkflowGraph nodes
                    -> read-plane runs; write-plane parks for approval
                    -> narrate outcomes from the ledger
```

## Vault visibility

Metadata only: Brand Vault, Customer Vault, Marketing Vault, Website Vault, Authority Vault, Operations Vault, Audit Vault, AI Workflow Vault

Blocked always: Executive Vault, Credentials Vault
