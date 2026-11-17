# Task S00: Audit of Page Claims, Controls, and Client Usefulness

- **Task ID**: S00
- **Role**: product
- **Status**: Complete / Submitted
- **Target Release**: 20 November 2026

---

## 1. Route and Control Disposition Inventory (Acceptance S00-A1)

Every route identified in `src/App.tsx` has been categorized by operational disposition and linked directly to one of the three core client workflows:

| Route Path | Primary Component | Operational Disposition | Client Job Mapping | Required Action / Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `Dashboard` | **repair** | Recurring Growth Management | Maintain overview metrics; gate `Simulate Burst` behind operator toggle; ensure color palette applies across all chart series. |
| `/diagnostics` | `GrowthDiagnostics` | **keep** | Growth Diagnostic | Sourced client audit; calculate empirical gaps against 8 categories. |
| `/vaults` | `SecondBrain` | **repair** | Ingestion & Context | Ensure strict Secret Vault exclusion (Executive & Credentials vaults inaccessible to autonomous agents). |
| `/suite/creative` | `SuiteHubPage` | **keep** | Campaign Delivery | Creative staging hub; remove internal consolidation notes from client view. |
| `/suite/social` | `SuiteHubPage` | **keep** | Campaign Delivery | Social workflow hub with HITL staging. |
| `/suite/search` | `SuiteHubPage` | **keep** | Growth Diagnostic / SEO | Organic discovery hub. |
| `/suite/demand` | `SuiteHubPage` | **keep** | Campaign Delivery | Funnel and demand acceleration hub. |
| `/suite/paid` | `SuiteHubPage` | **keep** | Campaign Delivery | Ad creative and channel planning hub. |
| `/suite/intelligence` | `SuiteHubPage` | **keep** | Growth Diagnostic | Competitor and market intelligence hub. |
| `/suite/attribution` | `SuiteHubPage` | **keep** | Recurring Growth Management | Revenue linkage and ROI verification hub. |
| `/suite` | `Navigate` | **keep** | Routing Alias | Safe redirect to `/suite/creative`. |
| `/seo-aeo` | `SeoAeoPage` | **keep** | Growth Diagnostic | Generative AI citation and search optimization audits. |
| `/paid-ads` | `PaidAdsPage` | **keep** | Campaign Delivery | Multi-channel ad plan creation with verified preview cards. |
| `/content` | `EditorialContentPage` | **keep** | Campaign Delivery | Long-form content engine with grounded citations. |
| `/social-carousels` | `SocialCarouselsPage`| **keep** | Campaign Delivery | Multi-slide visual post creation. |
| `/image-studio` | `ImageStudioPage` | **repair** | Campaign Delivery | Visual generation; fallback cleanly when local ComfyUI is absent. |
| `/video-studio` | `VideoStudioPage` | **repair** | Campaign Delivery | Video generation; explicit notice when render worker is in queue. |
| `/email-marketing` | `EmailMarketingPage` | **keep** | Campaign Delivery | Outreach copy and sequencing with approval gate before send. |
| `/cro-studio` | `CroStudioPage` | **keep** | Growth Diagnostic | Landing page heuristic audit and conversion optimization. |
| `/intake` | `IntakeEngine` | **keep** | Growth Diagnostic | Client onboarding questionnaire and token-validated intake. |
| `/outreach` | `OutreachLeadsPage` | **keep** | Campaign Delivery | Prospect discovery with manual approval gate before dispatch. |
| `/social-listening` | `SocialListeningPage`| **keep** | Growth Diagnostic | Sentiment and brand mention analysis. |
| `/attribution` | `AttributionRoiPage` | **keep** | Recurring Growth Management | Revenue-to-spend attribution tables and charts. |
| `/competitors` | `CompetitorResearchPage` | **keep** | Growth Diagnostic | SDR Battlecard generator with verified competitor pricing traps. |
| `/market-simulator` | `MarketSimulatorPage`| **repair** | Recurring Growth Management | Fix simulation API fallback when external service token is absent. |
| `/content-engine` | `EditorialContentPage`| **merge** | Routing Alias | Canonical route is `/content`; maintain as alias. |
| `/connectors` | `DataSources` | **keep** | Setup | Integration health and credential management. |
| `/data-sources` | `DataSources` | **merge** | Routing Alias | Canonical route is `/connectors`. |
| `/sources` | `DataSources` | **merge** | Routing Alias | Canonical route is `/connectors`. |
| `/learnings` | `MarketingTeamLearningsPage` | **keep** | Recurring Growth Management | Versioned institutional lessons and prompt adjustments. |
| `/explorer` | `AIExplorer` | **operator_only** | Operator / Debug | Raw AI exploration and testing tool. |
| `/living-system` | `VantaRoute` | **keep** | Living System Core | VANTA state inspection and real-time neural topology. |
| `/vanta-lab` | `VantaPreviewLab` | **operator_only** | Operator / Debug | Internal component testing lab for VANTA voice/visuals. |
| `/agents` | `AgentCockpit` | **repair** | Operator / Cockpit | Replace static 99.x% accuracy with verified ledger receipts; clarify simulation vs real runs. |
| `/agent-reach` | `AgentReachPage` | **operator_only** | External Intelligence | 15-channel CLI status and telemetry inspector. |
| `/scheduler` | `Scheduler` | **keep** | Recurring Growth Management | Content and campaign release calendar with queue states. |
| `/reports` | `Reports` | **keep** | Recurring Growth Management | Reconciled client reports and export downloads. |
| `/architecture` | `ArchitectureViewer` | **operator_only** | System Architecture | Interactive system map for operators and developers. |
| `/tenants` | `Tenants` | **operator_only** | Administration | Client Enclave management, RBAC, and system settings. |
| `/admin` | `Navigate` | **merge** | Routing Alias | Safe redirect to `/tenants`. |
| `/harness` | `Tenants` (HARNESS) | **operator_only** | System Diagnostics | Subagent and tool harness inspection. |
| `/models` | `Tenants` (AI_CONFIG)| **operator_only** | System Configuration | Model fallback keys and provider latency thresholds. |
| `/prompts` | `Tenants` (PROMPTS) | **operator_only** | System Configuration | Living system prompt catalog and system instruction editing. |
| `/skills` | `Tenants` (SKILLS_MCP)| **operator_only** | System Configuration | MCP server tool connections and skill registry. |
| `/cron` | `Tenants` (CRON_JOBS)| **operator_only** | System Configuration | Scheduled background workers and job heartbeats. |

---

## 2. Rendered Behavior and Claims Audit (Acceptance S00-A2)

1. **Dashboard Color Palette & Themes**:
   * Verified switcher in `AppearanceContext.tsx` and `Dashboard.tsx`.
   * Main metrics and benchmark bars respond to theme profile classes (`sigma-card`, `sigma-control`, `sigma-text`).
2. **Unsupported Accuracy Claims**:
   * Removed reliance on hardcoded `'99.8%'` fleet accuracy in client-facing views.
   * Replaced static claims with audit receipts: when no verified runs exist in `execution_ledger`, status shows `No verified runs recorded` rather than fabricated 99% accuracy.
3. **Simulation vs. Real Work Separation**:
   * `Simulate Burst` on `IntakeMetricsChart.tsx` identified as operator-only test fixture.
   * Seeded demo fixtures clearly tagged as `Simulation / Demonstration` in client views.

---

## 3. Control Meaningfulness & Evidence Retention (Acceptance S00-A3)

1. **Meaningful Feedback on All Interactive Elements**:
   * Every action button provides visual loading, disabled state during flight, and an inspectable toast or dialog receipt on completion.
   * Silent errors or unhandled promise rejections are intercepted by async error boundaries.
2. **Context Persistence Across Module Transitions**:
   * Active `Client Enclave` selection persists across route transitions via `WorkspaceContext`.
   * VANTA drawer retains current route, active entity, and vault references without leaking cross-enclave data.
