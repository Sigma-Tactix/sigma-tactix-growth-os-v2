# Technical Requirements: Sigma Tactix Growth OS
## Tailored, AI-Native Growth Infrastructure & Secure Second Brain

This document establishes the technical foundation, architectural design, and functional mappings for **Sigma Tactix Growth OS**. The system integrates a secure, client-owned relational "Second Brain" knowledge hub with autonomous AI execution modules, governed by strict access control layers and Human-in-the-Loop (HITL) safeguards.

---

## 1. System Architecture Overview

Sigma Tactix Growth OS is architected as a secure full-stack platform consisting of:
- **Core Database Layer**: PostgreSQL + `pgvector` representing the partitioned 10 vaults of the Second Brain.
- **Backend Application Engine**: FastAPI (Python) or NestJS (TypeScript) for robust, type-safe API routing, background processing, and SDK management.
- **Admin & Management Interface**: Directus for internal schema exploration, content configuration, and dashboard management.
- **Async Workflow Queue**: BullMQ/Celery for handling long-running agent operations.
- **Agent Enforcement Middleware**: A specialized Role-Based Access Control (RBAC) layer that strictly sandboxes agent execution.

```
                    +---------------------------------------+
                    |        Growth OS Admin Cockpit        |
                    |           (React + Directus)          |
                    +-------------------+-------------------+
                                        |
                                        v
                    +-------------------+-------------------+
                    |         FastAPI / NestJS API          |
                    |  (Intake, Audits, Scoped Agent Queue) |
                    +-------------------+-------------------+
                                        |
       +--------------------------------+--------------------------------+
       |                                |                                |
       v                                v                                v
+------+--------------+       +----------+------------+       +----------+------------+
|  RBAC & Consent     |       |  Asynchronous Queue   |       | Second Brain Database |
|  Enforcement Engine |       |   (BullMQ / Celery)   |       |  (PostgreSQL + Vector)|
+------+--------------+       +----------+------------+       +----------+------------+
       |                                 |                               |
       |                                 v                               |
       |                      +----------+------------+                  |
       +--------------------->|  Guarded AI Agents    |<-----------------+
                              | (Marketing, SDR, etc.)|
                              +-----------------------+
```

---

## 2. Relational Second Brain Schema Design (10 Vaults)

The database schema is partitioned into 10 distinct vaults, each serving as a specialized repository. Access to these tables is restricted programmatically using DB-level views, column masking, and application-level RBAC rules.

### I. Executive Vault
- **Purpose**: Stores top-level client strategy, IP records, board reports, and financial targets.
- **Attributes**: `id`, `company_name`, `financials_overview`, `strategic_plans`, `intellectual_property`, `c_level_notes`, `created_at`, `updated_at`.
- **Security Constraints**: Strictly C-level read-write only. No AI Agent has read access.

### II. Credentials Vault
- **Purpose**: Manages API keys, social channel oauth tokens, and ad account identifiers.
- **Attributes**: `id`, `platform_name`, `api_key_hash`, `oauth_access_token`, `oauth_refresh_token`, `scopes`, `status` (Connected, Disconnected, Re-auth), `last_sync_at`.
- **Security Constraints**: AI Agents can only read masked tokens through cryptographic proxies; direct token values are never exposed to LLM contexts.

### III. Brand Vault
- **Purpose**: Houses brand identity parameters, writing voice, tone constraints, and product offerings.
- **Attributes**: `id`, `voice_and_tone_rules`, `core_positioning`, `offers_and_pricing_json`, `brand_slogan`, `voice_embedding` (`vector`), `key_messages_array`.
- **Security Constraints**: Read-only for content-generating agents.

### IV. Customer Vault
- **Purpose**: Captures ideal customer profiles (ICPs), target personas, buyer journeys, and logs of historic user feedback.
- **Attributes**: `id`, `icp_definition`, `target_segments_array`, `customer_objections_array`, `testimonials_json`, `buyer_persona_embedding` (`vector`).
- **Security Constraints**: Accessible by marketing and sales outreach agents.

### V. Marketing Vault
- **Purpose**: Holds metadata on historical marketing campaigns, content calendar queues, and performance metrics.
- **Attributes**: `id`, `campaign_history_summary`, `current_channels_array`, `campaign_analytics_json`, `content_calendar_schedule`, `historical_performance_logs`.
- **Security Constraints**: Readable and writable by Marketing and Campaign Planning agents.

### VI. Website Vault
- **Purpose**: Chronicles structural UX configurations, sitemaps, page histories, and technical layout audits.
- **Attributes**: `id`, `site_url`, `cms_type`, `analytics_tracking_id`, `site_structure_json`, `page_history_json`, `technical_audit_score`.
- **Security Constraints**: Accessed by UI/UX Audit systems.

### VII. Authority Vault
- **Purpose**: Records topical keyword maps, SEO gaps, competitor rankings, and backlink targets.
- **Attributes**: `id`, `topical_map_json`, `keyword_clusters_json`, `backlink_targets_list`, `ai_visibility_score`, `organic_keywords_tracked`.
- **Security Constraints**: Accessible by Authority Builder and Content agents.

### VIII. Operations Vault
- **Purpose**: Curates standard operating procedures (SOPs), team structures, and task matrices.
- **Attributes**: `id`, `org_hierarchy_json`, `sops_list_json`, `role_to_permissions_matrix`, `workflow_rules_json`.
- **Security Constraints**: Operates as a configuration dictionary.

### IX. AI Workflow Vault
- **Purpose**: Configures system prompts, model routers, LLM temperature thresholds, and detailed model output parameters.
- **Attributes**: `id`, `agent_type` (enum), `system_prompt`, `model_router_endpoint`, `temperature`, `max_tokens`, `agent_constraints_array`, `workflow_logs_json`.
- **Security Constraints**: Restricts prompt injection vulnerabilities by centralizing LLM guidance on-server.

### X. Audit Vault
- **Purpose**: Manages growth diagnostic records, UI/UX checklists, historic scoreboards, and the active 90-day prioritized roadmaps.
- **Attributes**: `id`, `overall_readiness_score`, `growth_diagnostics_json`, `uiux_checklists_json`, `roadmap_90day_json`, `completed_roadmap_milestones`, `last_audited_at`.
- **Security Constraints**: Directly linked to intake pipeline for real-time audit updates.

---

## 3. Core Functional Pipelines

### A. Dynamic Intake & Config Engine
The onboarding pipeline automatically routes user questionnaires to relevant vaults:
```
[Client Intake Form Submission]
              |
              v
[Intake Controller & Decoupler]
              |
      +-------+-------+-------+-------+
      |               |               |
      v               v               v
 [Brand Vault] [Customer Vault] [Credentials Vault]
```
- **Automated Audit-to-Configuration Pipeline**: Upon ingestion of a new Audit Vault score (e.g., scoring SEO at <40%), the engine flags an action variable. This event triggers the automated activation of corresponding execution modules (e.g., launching keyword clustering algorithms inside the Authority Builder or overriding Brand Vault positioning guidelines to re-inject focus vectors).

### B. Scoped Agent Enforcement Rules (RBAC & HITL)
- **Role-Based Access Control (RBAC)**: All agents operate within defined parameters. Database views isolate each agent's execution context.
  - **Content Agent**: Permitted to read Brand, Customer, Authority, and AI Workflow Vaults. Strictly blocked from Executive and Credentials Vaults.
  - **SDR Agent**: Permitted to read Customer, Brand, and AI Workflow Vaults.
- **Human-in-the-Loop (HITL) State Machine**: Every external or destructive action (e.g., publishing content, calling social/ad API webhooks) must transition through an approval state-machine:
```
 [Agent Task Created] -> Status: PENDING_APPROVAL
                               |
                   +-----------+-----------+
                   |                       |
                   v                       v
               [Approve]                [Reject]
                   |                       |
                   v                       v
             Status: APPROVED        Status: ARCHIVED
          (Dispatched to Queue)      (Logs written)
```

---

## 4. Hardware & Integration Requirements
- **PostgreSQL Extension**: Must support `pgvector` to run semantic search over customer personas and content vectors.
- **Directus Connector**: Integrates directly as a headless schema controller for editing vaults on-the-fly.
- **Third-Party API Wrappers**: Structured HTTP clients utilizing OAuth authentication configurations stored inside the Credentials Vault.
