---
name: sales-lead-intelligence-agent
description: Production AI lead intake, WhatsApp qualification, and 3-step follow-up drip scheduler with Claude scoring rubric and Supabase CRM integration.
---

# AI Lead Intelligence & WhatsApp Qualification Agent (v0.1 Lean MVP)

## Overview
Autonomous lead intake, qualification scoring (0-100 rubric), two-way WhatsApp conversation management, and timed template-compliant follow-up drip execution.

## Architecture
```
Website Form (CF7 / Typeform) ──┐
                                ├──► n8n Workflow 01 ──► Claude (Rubric 0-100, hot/warm/cold) ──► Supabase CRM
WhatsApp Inbound Message      ──┘         │
                                          ├──► Hot Lead (70+) ──► Instant WhatsApp Alert to Founders
                                          ├──► WhatsApp Agent (Workflow 02) ──► Two-Way Chat ──► Push to Booked Call
                                          └──► Follow-up Scheduler (Workflow 03) ──► 3-Step Drip (Stops on Reply)
```

## Rubric Scoring Engine (0-100)
- **NEED (0-30)**: Explicit problem matching agency/business services = 25-30. Vague interest = 5-15.
- **BUDGET (0-25)**: Mentions figures at/above entry price ($2,500-$4,500) = 20-25. No signal = 8-12. Below = 0-5.
- **AUTHORITY (0-20)**: Owner/founder/director/C-suite = 15-20. Manager = 8-14. Researcher/student = 0-3.
- **TIMELINE (0-25)**: "Now" / "This month" = 20-25. "This quarter" = 12-18. "Exploring" = 3-8.

**Tiers**:
- `HOT`: Score >= 70
- `WARM`: Score 40-69
- `COLD`: Score < 40

## WhatsApp Two-Way Conversation Rules
1. Max 3 sentences per message. Direct, warm, conversational tone. No hype words.
2. Only verified facts from `{{FACTS_BLOCK}}`. Never invent prices, availability, or case studies.
3. Push to booking link once tier is warm or hot.
4. Auto-handoff to human founder when: custom pricing requested, frustration detected, legal/contract queries, enterprise lead, or after 6 exchanges without booking.
5. Arabic language auto-detection and response matching.

## 3-Step WhatsApp Follow-Up Sequence (Twilio Content Templates)
- **Step 1 (+1 day)**: Friendly follow-up with calendar link.
- **Step 2 (+3 days)**: Check if timing is off and offer to pause.
- **Step 3 (+7 days)**: Polite final closure with permanent link.
- **Circuit breaker**: Sequence immediately terminates upon any inbound lead reply.
