# AI Lead Intelligence Agent — v0.1 (Lean MVP)

Product #1 from the AI product roadmap (Phase 1). Solves slow lead response and poor qualification. Built 2026-07-07.

## What it does

```
Website form (CF7) ─┐
                    ├─► n8n ─► Claude (score 0-100, hot/warm/cold) ─► Supabase (CRM)
WhatsApp inbound  ──┘             │
                                  ├─► Hot lead → instant WhatsApp alert to founders
                                  ├─► AI WhatsApp conversation → qualify → push to booked call
                                  └─► 3-step follow-up drip (approved templates, stops on reply)
```

| File | Purpose |
|---|---|
| `supabase/schema.sql` | Leads, messages, appointments tables + pipeline view |
| `n8n/01-lead-intake-qualify.json` | Form intake → AI scoring → CRM → founder alert |
| `n8n/02-whatsapp-conversation.json` | Two-way WhatsApp agent with handoff rules |
| `n8n/03-followup-scheduler.json` | Timed follow-up sequence, template-compliant |
| `prompts/qualification-prompt.md` | Scoring rubric, conversation prompt, vertical variants, template copy |
| `SETUP-RUNBOOK.md` | 60–90 min wiring guide |

## Deployment 1: Sigma Tactix internal (do this first)

Point sigmatactix.com's forms at it. Every inbound lead gets scored and answered in minutes instead of whenever a founder sees the email — direct mitigation of the two-founder capacity ceiling. Internal use generates the usage numbers (response time, leads handled, meetings booked) that become the **first sourced case study** — the #1 blocker in the strategy docs. Log baseline metrics from day one.

## Deployment 2: Client demo skin (after 2+ weeks of internal data)

Same three workflows, new variables: swap the prompt-pack vertical variant (real estate first — GCC demand, high lead values), client's Supabase project, client's WhatsApp sender. Per the roadmap sheet: setup $2K–7.5K, retainer $300–2K+/mo. Sell as an AI Operating Systems engagement (cross-sell at month 3+ per service architecture, or standalone entry for lead-heavy verticals).

**Proof-gap rule applies:** demo materials describe capability, never invented client results. Until the internal pilot produces real numbers, the pitch is "watch it qualify your own test lead live" — a demo that needs no case study.

## Component reuse for the next builds

- Claude-call + JSON-parse pattern → AI Proposal Generator, UX Audit Agent
- Supabase lead store + pipeline view → Executive Dashboard AI reads it directly
- WhatsApp send/alert nodes → Reputation OS review alerts, Customer Success AI win-backs

## v0.2 backlog

Calendar auto-booking (Cal.com API), HubSpot sync node, Arabic-first template variants, per-client config table (multi-tenant), simple HTML pipeline dashboard on `v_lead_pipeline`.
