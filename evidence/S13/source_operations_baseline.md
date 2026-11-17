# Task S13 Evidence: Source Operations and Baseline Verification

## 1. Scope and Objective
This document records verification evidence for Task S13 under Milestone M3.
The objective is verifying that required exact provider accounts and properties (GA4, Google Ads, Meta Ads, LinkedIn Ads, Twitter/X Ads, TikTok Ads, Reddit Ads, and Google Search Console) read and normalize reconciled values, report honest outcomes across refresh, revocation, permission denial, empty payloads, and stale thresholds, and record required developer app approvals and scopes per operation while strictly maintaining separation between live and fixture execution evidence.

## 2. Acceptance Criteria Verification

### S13-A1: Account Normalization and Normalized Value Reconciliation
- **Implementation**:
  - Implemented `normalizeAccountIdentifier` in `src/lib/sourceOperations.ts` enforcing strict provider formatting:
    - Google Analytics 4: strips `properties/` and `accounts/` prefixes, validates numeric ID.
    - Google Ads: strips whitespace/hyphens, enforces 10 digits, formats into canonical `XXX-XXX-XXXX`.
    - Meta Ads: enforces `act_<digits>` format; rejects Facebook Page IDs.
    - LinkedIn Ads: strips `urn:li:sponsoredAccount:`, validates numeric campaign manager ID.
    - Twitter/X Ads: validates Ads API alphanumeric account identifier.
    - TikTok Ads: normalizes numeric advertiser identifier.
    - Google Search Console: validates and normalizes http/https URLs and `sc-domain:` domain syntax.
  - Implemented `normalizeSourceMetrics` in `src/lib/sourceOperations.ts` reading raw metric payloads into canonical schemas:
    - Standardized fields: `spend`, `revenue`, `conversions`, `roas`, `impressions`, `clicks`, `ctr`, `cpc`, `sessions`, `activeUsers`, `currency`, `observedAt`, `freshness`.
    - Automatically calculates `roas = spend > 0 ? revenue / spend : 0`, `ctr = impressions > 0 ? (clicks / impressions) * 100 : 0`, and `cpc = clicks > 0 ? spend / clicks : 0`.
    - Evaluates data freshness (marks `fresh` if observed within 24 hours; `stale` if older).
  - Integrated into server reporting endpoint `GET /api/workspace/reporting/metrics` (`server.ts`), guaranteeing all returned provider metrics conform to normalized standards.
- **Verification**: `src/lib/sourceOperations.test.ts` ("S13-A1: Account Normalization and Metric Reconciliation") asserts exact formatting across all 7 platform formats, verifies derived metric calculations, and validates freshness calculations.

### S13-A2: Honest Refresh, Revoke, Permission, Empty, and Stale State Reporting
- **Implementation**:
  - Implemented `classifyProviderError` in `src/lib/sourceOperations.ts` providing explicit outcome classifications:
    - HTTP 401: classified as `revoked` with `requiresReauth: true`.
    - HTTP 403: classified as `permission_denied` with `requiresReauth: true`.
    - HTTP 404: classified as `not_found`.
    - HTTP 429: classified as `rate_limited`.
    - HTTP 500..504: classified as `provider_failure`.
    - Empty payload: classified as `empty` when spend, revenue, conversions, impressions, and clicks are all zero.
    - Exceeded window (>24h): classified as `stale`.
  - Implemented `executeConnectorReconciliation` in `src/lib/sourceOperations.ts` and wired into `POST /api/workspace/run-reconciliation` (`server.ts`):
    - Probes live provider endpoints (Meta Graph API, Google Analytics Admin, LinkedIn adAccounts, Slack auth.test, HubSpot CRM).
    - On 401 or 403, transitions the connector's stored state to `status: 'Disconnected'`, sets `verificationState: 'failed'`, and records the exact error message.
    - Prevents masking failed authentications as successful synchronizations; returns honest statuses (`Synced`, `Revoked`, `PermissionDenied`, `Mismatch`, `Disconnected`).
- **Verification**: `src/lib/sourceOperations.test.ts` ("S13-A2: Honest Refresh, Revoke, Permission, Empty, and Stale State") tests 401 revocation, 403 scope denial, empty payload detection, >24h stale detection, and asserts that reconciliation updates connector state to `failed` and `Disconnected`.

### S13-A3: Operation App Approvals Register and Live vs Fixture Distinction
- **Implementation**:
  - Implemented `OPERATION_APPROVAL_REGISTER` in `src/lib/sourceOperations.ts` documenting exact required developer portal approvals, permissions, and OAuth scopes for operations:
    - Meta Ads: Meta App Review with `ads_read` / `ads_management` and Business Verification.
    - Google Search Console: OAuth Consent with `webmasters.readonly` grant.
    - Google Analytics 4: Google Cloud IAM `roles/analytics.viewer` assigned to service account.
    - Google Ads: Google Ads API Developer Token (Basic/Standard Access).
    - LinkedIn: Community Management API approval with `w_member_social` and `r_organization_social`.
    - Twitter/X: Developer Portal Basic/Pro Tier API access.
    - TinyFish Intelligence: API gateway provisioning.
  - Implemented `assessOperationReadiness` in `src/lib/sourceOperations.ts` and exposed `GET /api/workspace/operations/readiness` (`server.ts`):
    - Evaluates workspace credentials against registered operations.
    - Records missing credentials and missing required developer approvals.
    - Categorizes readiness into `ready_live`, `ready_fixture`, `blocked_credentials`, `blocked_approval`.
    - Strict boundary: fixture executions are stamped with `isFixture: true`, `source: 'fixture'`, and capped at `verificationLevel: 'unit_verified'`. Fixtures cannot generate production receipts or mark `productionVerified: true`.
- **Verification**: `src/lib/sourceOperations.test.ts` ("S13-A3: Operation Approvals Register and Live vs Fixture Distinction") verifies all operations specify approvals and scopes, asserts that missing keys block operations, confirms test fixtures cannot be promoted to production verification, and validates `GET /api/workspace/operations/readiness`.

## 3. Test Execution Summary
- `src/lib/sourceOperations.test.ts` (16 tests passed).
- `src/lib/connectorLifecycle.test.ts` (10 tests passed).
- `src/lib/dataPipelines.test.ts` (4 tests passed).
- `src/lib/metaAdsVerification.test.ts` (3 tests passed).
- Full suite verification (`npm run verify`):
  - Vite production build succeeded.
  - Server bundle build succeeded (`dist/server.js`).
  - ESLint and TypeScript compiler (`tsc --noEmit`) passed with 0 errors.
  - Vitest test run: 106 test files passed, 756 tests passed, 0 failures.
