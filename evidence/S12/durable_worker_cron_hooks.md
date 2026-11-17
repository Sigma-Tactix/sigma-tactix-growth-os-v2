# Task S12 Evidence: Durable Worker, Cron, and Inbound Webhook Pipeline

## 1. Scope and Objective
This document records verification evidence for Task S12 under Milestone M2.
The objective is providing a background job processing subsystem, timezone-aware cron scheduler, and authenticated webhook receiver that executes independently of browser lifecycle, survives process interruptions with lease heartbeating, enforces replay and deduplication security controls, and reconciles unknown provider outcomes before any retry attempts.

## 2. Acceptance Criteria Verification

### S12-A1: Job Execution with Closed Browser and Process Interruption Recovery
- **Implementation**:
  - Implemented `DurableJobQueue` in `src/lib/durableJobWorker.ts` backed by schema migration `backend/database/migrations/0023_durable_jobs_and_webhooks.sql`.
  - Runs inside the Node.js server process with no dependency on client DOM, React state, or browser connection.
  - Heartbeat leasing mechanism: jobs are claimed with `leaseDurationMs` and locked by worker ID. In-flight jobs periodically refresh leases via `heartbeatJob`.
  - Crash recovery: when a worker process terminates abruptly or fails to renew a lease, `recoverStaleLeases` detects expired leases (`locked_until < now`) and transitions those runs to `reconciling` status, preventing split-brain executions.
  - New worker instances claim and process recovered jobs through lease acquisition.
- **Verification**:
  - `src/lib/durableJobWorker.test.ts` ("survives process crash and recovers stale lease without duplicate execution") simulates an initial worker crashing mid-execution, confirms the second worker recovers the expired lease, reconciles the run, and completes processing with receipt generation.

### S12-A2: Authenticated Webhooks, Timezone Cron, Replay Protection, and Missed-Run Policies
- **Implementation**:
  - Webhook validation pipeline: `validateWebhookRequest` validates incoming payloads using timing-safe HMAC-SHA256 signatures (`crypto.timingSafeEqual`) with the `X-Webhook-Signature` header.
  - Replay protection: enforces a 300-second timestamp tolerance window via `X-Webhook-Timestamp`. Payloads outside the window are rejected with `WebhookValidationError`.
  - Deduplication: uses payload and event ID tracking to discard repeated deliveries with code `DUPLICATE_EVENT`.
  - Timezone-aware cron parsing: `computeNextCronOccurrence` evaluates 5-field cron specifications against specific IANA timezones (such as `Asia/Dubai` and `UTC`) using `Intl.DateTimeFormat`.
  - Missed-run policies: `evaluateMissedRuns` evaluates downtime gaps against configured policies:
    - `skip`: advances cursor directly to next scheduled interval.
    - `run_once`: enqueues a single catch-up execution regardless of elapsed intervals.
    - `catch_up`: enqueues all missed iterations sequentially.
  - Job lifecycle: supports explicit cancellation of queued runs and increments retry counters up to `maxRetries`, terminating unrecoverable jobs into `dead_letter` status.
- **Verification**:
  - `src/lib/durableJobWorker.test.ts` validates HMAC-SHA256 signature verification, rejects invalid signatures, rejects expired timestamps (>300s clock drift), rejects duplicate event deliveries, confirms correct interval calculation for `Asia/Dubai` and `UTC`, and asserts that exceeded retries move jobs to `dead_letter`.

### S12-A3: Reconciliation of Unknown Provider Outcomes and Cryptographic Receipts
- **Implementation**:
  - When external providers (e.g., ad networks, CRM APIs, payment gateways) return ambiguous failures such as HTTP 504 gateway timeout, socket hangup, or network resets, handlers throw `UnknownProviderOutcomeError`.
  - The worker catches this error and transitions the run to `reconciling` status instead of blind re-dispatch.
  - The reconciler routine interrogates provider state using the original idempotency key to confirm whether the remote mutation succeeded or was never registered.
  - If the mutation succeeded remotely, the worker marks the run as completed and generates a receipt. If absent, the job is safely requeued for clean execution.
  - Every completed run generates a cryptographic `DurableJobReceipt` via `generateJobReceipt`, persisting run duration, workspace ID, payload digest, and SHA-256 execution signature.
- **Verification**:
  - `src/lib/durableJobWorker.test.ts` ("transitions to reconciling upon unknown provider outcome instead of blind resend") verifies that ambiguous errors trigger state `reconciling`, execute status lookup, and complete with a valid cryptographic receipt.

## 3. Test Execution Summary
- `src/lib/durableJobWorker.test.ts` (11 tests passed in 95ms).
- `npm run verify` passed:
  - Vite production bundle built.
  - Express server bundle built (`dist/server.js`).
  - ESLint passed with 0 errors.
  - Vitest suite passed: 105 test files passed, 740 unit tests passed, 0 failures.
