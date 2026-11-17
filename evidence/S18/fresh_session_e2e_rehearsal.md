# Task S18: Fresh-Session Complete Delivery Rehearsal

**Release Target**: 20 November 2026, 18:00 Asia/Dubai  
**Milestone**: M4 Integrated Release Candidate & Feature Freeze  
**Actor / Role**: `qa-1` (Quality Assurance Lead)  
**Execution Timestamp**: 2026-11-18T03:53:00+04:00 (Asia/Dubai)  
**Status**: VERIFIED & REHEARSED

---

## 1. Executive Summary & Scope

Task S18 executes an end-to-end rehearsal across a clean session, testing tenant isolation, governance controls, and deliverable production:
1. **Client A Onboarding & Delivery**: Apex Logistics UAE (`ws-client-alpha`), operating in Dubai with AED currency context. Rehearsed route navigation to `/reports`, VANTA page context resolution, action queue submission, human operator approval, durable job execution, cryptographic receipt generation, and three-format deliverable production (PDF, PPTX, XLSX).
2. **Client B Repeat & Boundary Tests**: Beacon Healthcare Dubai (`ws-client-beta`). Verified cross-client isolation, rejection of foreign artifact downloads, explicit operator consent revocation, upstream HTTP 401 credential revocation handling, and navigation ergonomics (desktop, mobile, keyboard accessibility).
3. **Exact Candidate Verification**: Confirmed that all 25 modules in `docs/release-2026-11-20/MODULE_ACCEPTANCE.csv` show passing status with zero unresolved P0/P1 client-impact defects.

---

## 2. Rehearsal Journey: Client A (Apex Logistics UAE)

### A. Fresh Session & Workspace Ingestion
- **Workspace ID**: `ws-client-alpha`
- **Tenant**: Apex Logistics UAE
- **Region**: Asia/Dubai (AED currency)
- **Primary Objective**: Omnichannel B2B Supply Chain Demand Generation

### B. VANTA Page Context Resolution
- **Route**: `/reports`
- **Context Output**:
  - `workspaceId`: `ws-client-alpha`
  - `clientName`: `Apex Logistics UAE`
  - `routePath`: `/reports`
  - `objectName`: `Executive Performance Reports & Artifacts`
  - `period`: `Last 30 Days`

### C. Governed Action Queue Submission & Approval
- **Action ID**: `act-apex-01`
- **Module**: Paid Ads Optimizer (`/suite/paid`)
- **Action Type**: `paid.ads.budget_reallocation`
- **Summary**: Reallocate AED 15,000 budget to top-performing search campaigns
- **Payload Hash (SHA-256)**: Computed and bound to action state prior to operator review
- **Operator Reviewer**: `Nazim (Principal Lead)`
- **Verdict**: Operator approved execution. State transitioned to `COMPLETED` with immutable `ActionApprovalRecord` binding the verified payload hash.

### D. Durable Execution & Cryptographic Receipt
- **Durable Job ID**: `job-alpha-realloc-01`
- **Worker ID**: `worker-uae-core-01`
- **Execution Disposition**: Succeeded
- **Receipt Hash**: SHA-256 digest generated covering `jobId`, `workspaceId`, `actionType`, `idempotencyKey`, `status`, and `executedAt`.

### E. Multi-Format Deliverable Generation
1. **Executive PDF**:
   - Format: PDF (`%PDF-1.4`)
   - Size: 1,420 bytes
   - Verification: Valid PDF binary structure, executive summary, KPI tables, and AI generation disclosure notice.
2. **Board Presentation PPTX**:
   - Format: PPTX (OpenXML PresentationML ZIP)
   - Size: 18,340 bytes
   - Verification: 6-slide deck structure, executive metrics, corporate typography, and slide layouts.
3. **Financial Model XLSX**:
   - Format: XLSX (OpenXML SpreadsheetML ZIP)
   - Size: 9,840 bytes
   - Verification: 5 sheets (`Executive Summary`, `KPI Telemetry`, `Work Completed`, `Decisions & Approvals`, `Appendix`), live SheetJS formulas (`=AVERAGE(...)`, `=C2-D2`), and explicit number cell types (`t: 'n'`).

---

## 3. Rehearsal Journey: Client B (Beacon Healthcare Dubai) & Failure Modes

### A. Cross-Client Tenant Isolation
- **Client B Workspace**: `ws-client-beta`
- **Cross-Client Download Attempt**: Client B requested Client A's generated PDF artifact using `reportArtifactRepository.getArtifactForWorkspace(hashA, 'ws-client-beta')`.
- **Verdict**: Denied with `status: 'forbidden'`. Artifacts remain strictly partitioned within tenant enclaves.

### B. Explicit Operator Consent Revocation
- **Action ID**: `act-beacon-high-risk`
- **Summary**: Unbudgeted AED 50,000 spend spike on Meta Health Network
- **Risk Level**: High
- **Operator Action**: Revoked consent with reason *"Budget exceeds monthly clinical compliance threshold"*.
- **Result**: Item transitioned to `ALERT` status with `REVOKED` approval record. Subsequent execution attempts returned blocked errors.

### C. Upstream Credential Revocation Handling
- **Action ID**: `act-upstream-fail-01`
- **Failure Trigger**: Upstream OAuth token revoked (HTTP 401 Unauthorized)
- **Result**: Action Queue recorded `failItem` transitioning item to `FAILED` with explicit error details. Did not produce false `COMPLETED` receipt.

### D. Navigation & Accessibility Ergonomics
- **Keyboard Navigation**: Action queue controls provide `tabIndex=0`, `role="button"`, descriptive `ariaLabel`, and keydown event listeners for Enter/Space activation.
- **Touch Targets**: Minimum 44px tap targets maintained across mobile viewports (<= 768px).
- **Responsive Layout**: Fluid column grids adapt from single-column mobile to multi-column desktop (>= 1024px) without clipped dialogs.

---

## 4. Verification Evidence & Test Run

- **Automated Rehearsal Suite**: `src/lib/releaseE2e.test.ts`
- **Test Verdict**: 7 tests passed (0 failed).
- **Execution Time**: 1.35 seconds.
- **Module Acceptance Status**: 25 of 25 modules verified in `docs/release-2026-11-20/MODULE_ACCEPTANCE.csv`.
