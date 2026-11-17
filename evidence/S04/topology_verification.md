# Task S04: Prove Deployed Frontend and API Topology

- **Task ID**: S04
- **Role**: platform
- **Status**: Complete / Submitted
- **Milestone**: M1
- **Target Release**: 20 November 2026

---

## 1. Routing and Content-Type Topology (Acceptance S04-A1 & S04-A2)

### A. Separation of API JSON vs. SPA HTML Fallback
* **Problem Addressed**: Previously, any unmatched `/api/*` route fell through to the catch-all `app.get("*")` or Vite middleware, returning `index.html` (text/html). When frontend callers or external services expected JSON, this triggered `SyntaxError: Unexpected token '<'` (HTML-as-JSON defect).
* **Fix Applied**: Added an explicit `app.all("/api/*")` middleware before the SPA static serving layer in `server.ts`:
  ```typescript
  app.all("/api/*", (req: Request, res: Response) => {
    res.status(404).json({
      error: "API endpoint not found",
      path: req.originalUrl,
      method: req.method,
    });
  });
  ```
* **Verification Proof**:
  * Deep links (e.g., `/reports/quarterly`) return `200 text/html` with `<!DOCTYPE html>`.
  * Unknown API requests (e.g., `GET /api/nonexistent`) return `404 application/json` with `{ error: "API endpoint not found" }`.

### B. Session Authorization & P0 Guardrail Resolution (C-01 Fix)
* **Problem Addressed**: Source finding C-01 confirmed that `/api/social` was mounted outside `/api/workspace` without authentication.
* **Fix Applied**: Enforced `requireAuth` on the `/api/social` mount in `server.ts`:
  ```typescript
  app.use("/api/social", requireAuth, createSocialDistributionRouter({ provider: socialScheduler, expensiveLimiter }));
  ```
* **Verification Proof**:
  * Unauthenticated requests to `/api/social/publish` return `401 Unauthorized`.
  * Unauthenticated requests to `/api/workspace/*` return `401 Unauthorized`.
  * Authenticated requests with valid Bearer tokens resolve workspace session context and return `200 OK`.

---

## 2. Health & Readiness Probes Exposing Runtime SHA (Acceptance S04-A3)

### Liveness Probe (`GET /healthz`, `GET /api/health`)
* Dependency-free probe answering process health for process supervisors and container orchestrators:
  ```json
  {
    "ok": true,
    "uptimeSeconds": 12,
    "commit": "be85432d0b5033878b438cf38b97587ef03b9c73",
    "status": "alive"
  }
  ```

### Readiness Probe (`GET /readyz`, `GET /api/ready`)
* Evaluates runtime environment, database configuration status, and exposes runtime Git commit SHA:
  ```json
  {
    "ready": true,
    "status": "ready",
    "commit": "be85432d0b5033878b438cf38b97587ef03b9c73",
    "environment": "development",
    "database": "configured",
    "ledgerAuthoritative": false,
    "uptimeSeconds": 12
  }
  ```

---

## 3. Automated Test Evidence
* Automated static smoke tests: [`src/server/deploymentSmoke.test.ts`](file:///C:/Dev%20Projects/sigma-tactix-growth-os-v2/src/server/deploymentSmoke.test.ts) (7 passed).
* Automated HTTP runtime tests: [`src/server/topologyRoutes.test.ts`](file:///C:/Dev%20Projects/sigma-tactix-growth-os-v2/src/server/topologyRoutes.test.ts) (6 passed).
