# Sigma Tactix production readiness: initial evidence and plan

Date: 2026-09-12. Status: review in progress; production readiness is not established.

## Verified baseline

- Current folder has no Git repository. Findings below are current-state defects, not attributed regressions.
- TypeScript baseline passed. Tests: 143 passed, 1 failed across 17 files. The failing token-cost test expects 6.25 and receives 0.375.
- Reviewed all three supplied logo images and a frame from Orb3.mp4. Brand references use diagonal orange pill bars with circular details. Orb reference is a luminous orange filament sphere.
- No production deployment or test account has been identified by the user yet. No live provider validation or publishing has been performed.
- Board agenda confirmation is pending. No board decision is approved.

## Confirmed release blockers

1. **Pipeline verification fabricates success.** `server.ts:6021` waits and generates latency without calling a provider. `src/pages/DataSources.tsx:628` converts failures into successful handshakes. Names and account IDs do not establish authentication.
2. **Unsupported connector validators accept any nonempty credential.** `server.ts:5725` returns true when a key, token, or webhook URL exists. Those connectors can become Connected without a provider response.
3. **Media-plan import does not read the file.** `src/pages/PaidAdsPage.tsx:474` uses a timer and inserts a fixed budget of 55,000 and fixed dates, then claims AI extraction.
4. **Agent allocation is a browser label, not demonstrated authorization.** `src/pages/DataSources.tsx:334` writes selected agent names to localStorage and reports permissions granted. Server enforcement must be established before agents can execute work.
5. **Vault classification overstates certainty.** `src/pages/SecondBrain.tsx:119` defaults unmatched documents to Executive Vault at confidence 85. Substring matching also lets short keywords match unrelated words. File persistence and All Vaults behavior still need end-to-end testing.

## Connector verification inventory

This table records code coverage only. A validator being present does not prove usable scopes, account ownership, token refresh, reporting, ingestion, or write access.

| Platform | Validator found | Live verification |
|---|---|---|
| Slack | testSlackConnection | Not performed |
| Microsoft Teams | Missing; falls back to credential-presence check | Not performed |
| Notion | testNotionConnection | Not performed |
| Jira | Missing; falls back to credential-presence check | Not performed |
| Linear | Missing; falls back to credential-presence check | Not performed |
| Confluence | Missing; falls back to credential-presence check | Not performed |
| LinkedIn Ads | testLinkedInAdsConnection | Not performed |
| TikTok Ads | testTikTokAdsConnection | Not performed |
| Twitter (X) Ads | testTwitterAdsConnection | Not performed |
| Apple Search Ads | Missing; falls back to credential-presence check | Not performed |
| Reddit Ads | Missing; falls back to credential-presence check | Not performed |
| Pinterest Ads | Missing; falls back to credential-presence check | Not performed |
| HubSpot CRM | testHubspotConnection | Not performed |
| Meta Ads | testMetaAdsConnection | Not performed |
| Google Ads | testGoogleAdsConnection | Not performed |
| LinkedIn (Organic) | testLinkedInAdsConnection | Not performed |
| Twitter/X (Organic) | Missing; falls back to credential-presence check | Not performed |
| Facebook Pages | Missing; falls back to credential-presence check | Not performed |
| WordPress | Missing; falls back to credential-presence check | Not performed |
| Snapchat Ads | testSnapchatAdsConnection | Not performed |
| Amazon Ads | testAmazonAdsConnection | Not performed |
| Microsoft Ads | testMicrosoftAdsConnection | Not performed |
| Shopify | testShopifyConnection | Not performed |
| Klaviyo | testKlaviyoConnection | Not performed |
| Mailchimp | testMailchimpConnection | Not performed |
| Salesforce | testSalesforceConnection | Not performed |
| Google My Business | testGoogleMyBusinessConnection | Not performed |
| Google Analytics | testGoogleAnalyticsConnection | Not performed |
| Google Search Console | testGoogleSearchConsoleConnection | Not performed |
| Semrush | testSemrushConnection | Not performed |
| Ahrefs | testAhrefsConnection | Not performed |
| Similarweb | testSimilarwebConnection | Not performed |
| WhatsApp Business | testWhatsAppBusinessConnection | Not performed |

Microsoft Ads currently validates Microsoft Graph /me, which does not demonstrate access to an advertising account. LinkedIn Organic reuses an advertising validator and needs an operation-specific permissions review.

## Separate connector library shown in the UI

The DataSources library uses a separate pipeline model and the fabricated ping endpoint above. Every entry below needs mapping to the authoritative connector registry, credentials, account selection, supported actions, and server permissions.

- Google Ads
- Meta Ads Manager
- HubSpot CRM
- Google Analytics 4 (GA4)
- PostgreSQL MCP Server
- Brave Search & Web MCP
- Slack & Discord MCP Bot
- GitHub & Vercel MCP
- Apollo.io B2B Search
- Clearbit & Clay Enrichment
- LinkedIn Marketing & Pages
- X (Twitter) Developer API v2
- Shopify Storefront & Admin
- Brandwatch & Social Listening
- SEMrush & Ahrefs
- Sigmatactix Master Intel

## Implementation sequence and acceptance criteria

1. **Truthful connector status and permissions.** Remove fake success paths; use one server-owned connector record. Distinguish configured, verified, syncing, stale, unsupported, and failed states. Verify provider account and required scopes; implement refresh and revocation handling. Negative tests must reject invalid credentials and preserve failure messages.
2. **Reliable document ingestion.** Extract supported formats server-side; hash original bytes for exact duplicates; persist files and vault assignments in one authoritative transaction. An unmatched classifier must request classification instead of asserting confidence. Acceptance: upload, refresh, All Vaults, selected vault, duplicate upload, move, and delete work against the same records.
3. **Media-plan parsing and campaign drafts.** Extract real file content into a validated schema with source evidence; show uncertain fields for review. Add removal. Generate campaign/ad-set/ad drafts, budgets and unique UTMs from verified inputs. Keep proposed estimates separate from account results. Account writes need provider-specific validation and explicit execution controls.
4. **Reporting redesign.** Use industry-specific metric definitions, appropriate charts and filters, clear data provenance, missing-data states, and report-wide theme tokens. A template selection must change the actual report model. Benchmarks require sources, dates, market and channel context.
5. **Brand and living orb.** Use supplied logo artwork consistently. Consolidate the globe and Three.js core around a shared state model. Build the orange filament effect in Three.js, with drag/zoom, keyboard alternatives, state-driven activity, reduced motion, mobile performance, and WebGL fallback. Do not label simulated motion as evidence of agent activity.
6. **Release verification.** Run meaningful regression and integration tests, desktop/mobile browser checks, accessibility and performance checks, tenant isolation checks, and deployment smoke tests. Record test results and provider limitations per module.

## Initial local changes

- Sidebar uses supplied image #3 instead of approximated bars. Home navigation is a keyboard-accessible button.
- Canvas orb stores projected points in a ref instead of forcing a React render every animation frame. Callback references remain current; cleared satellite lists are applied; reduced-motion preference is observed.
- These are preliminary fixes. Full orb redesign and whole-product polish are not complete.

## Pending inputs

- Confirm CTO/CISO/CPO board agenda: production readiness, connector reliability, product usability.
- Identify production deployment and test account labels for live connector checks. Do not paste credentials into chat.

## Skill scope

- Review-agent used for defect-first inspection. No Git history exists to establish regression provenance.
- React/Vite: preserve the installed stack until a version-specific reason warrants migration. The Vite skill describes Vite 8, whereas this project declares Vite 6.
- Design-taste excludes dashboards; only relevant audit, brand and accessibility principles apply.
- Brandkit informs faithful brand application; no unsolicited replacement identity is generated.
- Three.js catalogue points to https://github.com/CloudAI-X/threejs-skills; the full upstream workflow has not yet been installed.
- Board meeting has not proceeded beyond context gathering and proposed agenda.

## Verification of initial changes

- TypeScript check passed after the logo and orb changes.
- Production build passed for frontend and server. Main frontend bundle is 5,617.32 kB (1,555.48 kB gzip), with a large-chunk warning. Route splitting remains a performance action.
- Local dashboard rendered in the browser. Supplied logo artwork is visible and the home control is exposed as a button.
- Browser inspection showed live/synced and health claims alongside unlinked advertising accounts. Their data sources need validation before these can be treated as production telemetry.
- Full live backend workflows, mobile layout and reduced-motion interaction have not yet been browser-tested.

## Connector and chat remediation checkpoint

Implemented after the initial review:

- Unsupported connector adapters now fail closed rather than accepting any nonempty credential.
- Pipeline account checks use the tenant-scoped saved connector and require an exact account match and a successful provider response. Current account-scoped mapping covers Google Ads, Meta Ads/Meta Ads Manager, LinkedIn Ads and TikTok Ads. Other catalogue entries explicitly report unsupported account verification. Provider API versions and live account access still require validation.
- The setup and single-account test UI no longer invent successful checks on errors. Check All Accounts performs sequential account checks and does not claim ingestion.
- Pipeline configuration saves require a successful server response and persist an unverified warning state. Configuration is no longer reported as an active stream.
- Onboarding chat moved from direct browser Gemini calls to an authenticated, rate-limited server endpoint. The Vite API-key injection was removed. Input history is validated and bounded. Chat history resets when the selected workspace changes, and stale responses are ignored.
- Chat now supports the Enter key and has named message/open/send controls.

Remaining verification limits: unit tests use mocked provider adapters. No live provider authentication, ingestion, publishing, token refresh or deployment check was performed. Existing webhook simulation, agent allocation semantics, saved legacy pipeline records and outdated provider endpoints remain open work.
