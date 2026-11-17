import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  DurableJobQueue,
  UnknownProviderOutcomeError,
  parseCronExpression,
  matchesCron,
  computeNextOccurrence,
  evaluateMissedRuns,
  verifyWebhookHmac,
  verifyWebhookTimestamp,
  validateInboundWebhook,
  generateJobReceipt,
  type DurableCronSchedule,
} from './durableJobWorker';
import crypto from 'crypto';

describe('Task S12: Durable Worker, Cron, and Hooks', () => {
  describe('S12-A1: Durable job execution and crash recovery', () => {
    let queue: DurableJobQueue;

    beforeEach(() => {
      queue = new DurableJobQueue();
    });

    it('executes a job in background and persists cryptographic receipt', async () => {
      const job = queue.enqueueJob({
        workspaceId: 'ws-alpha',
        actionType: 'run_growth_audit',
        idempotencyKey: 'job-101',
        payload: { depth: 'full' },
        priority: 1,
        maxRetries: 3,
        timeoutSeconds: 60,
      });

      expect(job.status).toBe('queued');

      const claimed = queue.claimNextJob('worker-node-1', 30);
      expect(claimed?.id).toBe(job.id);
      expect(claimed?.status).toBe('running');
      expect(claimed?.lockedBy).toBe('worker-node-1');

      const executed = await queue.processJob({
        jobId: job.id,
        workerId: 'worker-node-1',
        handler: async (j) => ({
          result: { score: 92, executedFor: j.workspaceId },
        }),
      });

      expect(executed.status).toBe('succeeded');
      expect(executed.resultPayload).toEqual({ score: 92, executedFor: 'ws-alpha' });
      expect(executed.receipt).toBeDefined();
      expect(executed.receipt?.status).toBe('succeeded');
      expect(executed.receipt?.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(executed.receipt?.workerId).toBe('worker-node-1');
    });

    it('recovers crashed worker jobs via expired lease and enters reconciliation', () => {
      const job = queue.enqueueJob({
        workspaceId: 'ws-alpha',
        actionType: 'external_mutation',
        idempotencyKey: 'job-crash-1',
        payload: { target: 'campaign-123' },
        priority: 2,
        maxRetries: 3,
        timeoutSeconds: 30,
      });

      // Worker 1 claims job with 30s lease
      const now = Date.now();
      const claimed = queue.claimNextJob('worker-crashed', 30, now);
      expect(claimed?.status).toBe('running');

      // 40 seconds later, worker 1 has crashed without completing
      const futureNow = now + 40_000;
      const recovered = queue.claimNextJob('worker-survivor', 30, futureNow);

      expect(recovered?.id).toBe(job.id);
      // Crashed job was moved to reconciling, then claimed by survivor
      expect(recovered?.status).toBe('running');
      expect(recovered?.lockedBy).toBe('worker-survivor');
    });
  });

  describe('S12-A2: Authentication, signature, replay, deduplication, timezone, missed-run, and cancellation', () => {
    it('verifies valid HMAC-SHA256 webhook signatures and rejects forged ones', () => {
      const secret = 'webhook_secret_key_123';
      const body = JSON.stringify({ id: 'evt-101', type: 'charge.succeeded', amount: 5000 });
      const validSig = crypto.createHmac('sha256', secret).update(body).digest('hex');

      expect(verifyWebhookHmac(body, validSig, secret)).toBe(true);
      expect(verifyWebhookHmac(body, `sha256=${validSig}`, secret)).toBe(true);
      expect(verifyWebhookHmac(body, 'forged_signature_hex_value_here', secret)).toBe(false);
      expect(verifyWebhookHmac(body, validSig, 'wrong_secret')).toBe(false);
    });

    it('enforces webhook timestamp replay window', () => {
      const now = Date.now();

      // Current timestamp (within 5 minutes) passes
      expect(verifyWebhookTimestamp(now, 300, now).valid).toBe(true);
      expect(verifyWebhookTimestamp(now - 120_000, 300, now).valid).toBe(true);

      // Replay: expired timestamp (> 300 seconds) fails
      const expired = verifyWebhookTimestamp(now - 350_000, 300, now);
      expect(expired.valid).toBe(false);
      expect(expired.reason).toContain('expired');

      // Future timestamp (> 60 seconds) fails
      const future = verifyWebhookTimestamp(now + 90_000, 300, now);
      expect(future.valid).toBe(false);
      expect(future.reason).toContain('future');
    });

    it('validates inbound webhook and prevents duplicate processing', () => {
      const secret = 'test_secret';
      const payload = { id: 'evt-dedup-101', event: 'customer.created', email: 'test@example.com' };
      const rawBody = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      const existingEvents = new Set<string>();

      // First delivery: verified
      const first = validateInboundWebhook({
        rawBody,
        parsedBody: payload,
        signatureHeader: signature,
        timestampHeader: Date.now(),
        secret,
        workspaceId: 'ws-alpha',
        source: 'crm',
        existingEventIds: existingEvents,
      });
      expect(first.valid).toBe(true);
      expect(first.status).toBe('verified');

      existingEvents.add('ws-alpha:crm:evt-dedup-101');

      // Duplicate delivery: recognized as duplicate without error
      const second = validateInboundWebhook({
        rawBody,
        parsedBody: payload,
        signatureHeader: signature,
        timestampHeader: Date.now(),
        secret,
        workspaceId: 'ws-alpha',
        source: 'crm',
        existingEventIds: existingEvents,
      });
      expect(second.valid).toBe(false);
      expect(second.status).toBe('duplicate');
      expect(second.statusCode).toBe(200);
    });

    it('evaluates cron schedules with explicit timezone handling', () => {
      // 06:00 daily
      const parsed = parseCronExpression('0 6 * * *');

      // 02:00 UTC is 06:00 Asia/Dubai (UTC+4)
      const dubaiMorning = new Date('2026-11-20T02:00:00Z');
      expect(matchesCron(parsed, dubaiMorning, 'Asia/Dubai')).toBe(true);

      // 06:00 UTC is NOT 06:00 in Dubai (it is 10:00 Dubai)
      const dubaiLate = new Date('2026-11-20T06:00:00Z');
      expect(matchesCron(parsed, dubaiLate, 'Asia/Dubai')).toBe(false);

      // Next occurrence from 01:00 UTC in Asia/Dubai
      const nextDubai = computeNextOccurrence('0 6 * * *', 'Asia/Dubai', new Date('2026-11-20T01:00:00Z'));
      expect(nextDubai.toISOString()).toBe('2026-11-20T02:00:00.000Z');
    });

    it('demonstrates missed-run policy enforcement after outage', () => {
      const schedule: DurableCronSchedule = {
        id: 'sched-101',
        workspaceId: 'ws-alpha',
        name: 'Hourly Diagnostic',
        cronExpression: '0 * * * *',
        timezone: 'UTC',
        targetAction: 'diagnostics',
        payload: {},
        status: 'active',
        lastRunAt: '2026-11-20T02:00:00.000Z',
        missedRunPolicy: 'run_once',
        createdAt: '2026-11-20T00:00:00.000Z',
        updatedAt: '2026-11-20T00:00:00.000Z',
      };

      // Worker was down from 02:00 to 05:30 (missed 03:00, 04:00, 05:00)
      const currentTime = new Date('2026-11-20T05:30:00.000Z');

      // 'run_once' policy queues exactly 1 catch-up run
      const runOnceResult = evaluateMissedRuns({
        schedule: { ...schedule, missedRunPolicy: 'run_once' },
        currentTime,
      });
      expect(runOnceResult.missedRuns).toHaveLength(1);
      expect(runOnceResult.missedRuns[0].scheduledTime).toBe('2026-11-20T05:00:00.000Z');
      expect(runOnceResult.nextRunAt).toBe('2026-11-20T06:00:00.000Z');

      // 'skip' policy ignores missed runs and advances to next scheduled
      const skipResult = evaluateMissedRuns({
        schedule: { ...schedule, missedRunPolicy: 'skip' },
        currentTime,
      });
      expect(skipResult.missedRuns).toHaveLength(0);
      expect(skipResult.nextRunAt).toBe('2026-11-20T06:00:00.000Z');

      // 'catch_up' policy queues missed runs up to ceiling
      const catchUpResult = evaluateMissedRuns({
        schedule: { ...schedule, missedRunPolicy: 'catch_up' },
        currentTime,
      });
      expect(catchUpResult.missedRuns).toHaveLength(3);
    });

    it('cancels queued jobs and prevents execution', () => {
      const queue = new DurableJobQueue();
      const job = queue.enqueueJob({
        workspaceId: 'ws-alpha',
        actionType: 'batch_report',
        idempotencyKey: 'cancel-test-1',
        payload: {},
        priority: 0,
        maxRetries: 3,
        timeoutSeconds: 60,
      });

      expect(queue.cancelJob(job.id)).toBe(true);
      expect(queue.getJob(job.id)?.status).toBe('cancelled');

      // Claiming next job skips cancelled jobs
      expect(queue.claimNextJob('worker-1')).toBeNull();
    });

    it('transitions to dead_letter state when max retries are exhausted', async () => {
      const queue = new DurableJobQueue();
      const job = queue.enqueueJob({
        workspaceId: 'ws-alpha',
        actionType: 'flaky_action',
        idempotencyKey: 'retry-test-1',
        payload: {},
        priority: 0,
        maxRetries: 2,
        timeoutSeconds: 60,
      });

      // Attempt 1 fails
      queue.claimNextJob('worker-1');
      await queue.processJob({
        jobId: job.id,
        workerId: 'worker-1',
        handler: async () => { throw new Error('First transient failure'); },
      });
      expect(job.status).toBe('queued');
      expect(job.retryCount).toBe(1);

      // Attempt 2 fails -> exhausts retries -> dead_letter
      queue.claimNextJob('worker-1');
      await queue.processJob({
        jobId: job.id,
        workerId: 'worker-1',
        handler: async () => { throw new Error('Second permanent failure'); },
      });
      expect(job.status).toBe('dead_letter');
      expect(job.retryCount).toBe(2);
      expect(job.receipt).toBeDefined();
      expect(job.receipt?.status).toBe('failed');
    });
  });

  describe('S12-A3: Unknown provider outcome reconciliation and receipt persistence', () => {
    it('enters reconciliation state on unknown provider outcome without duplicate send', async () => {
      const queue = new DurableJobQueue();
      const job = queue.enqueueJob({
        workspaceId: 'ws-alpha',
        actionType: 'budget_mutation',
        idempotencyKey: 'mutation-idemp-101',
        payload: { budget: 1500 },
        priority: 3,
        maxRetries: 3,
        timeoutSeconds: 60,
      });

      // Claim and execute
      queue.claimNextJob('worker-1');

      // Handler encounters HTTP 504 Gateway Timeout on external mutation
      const result = await queue.processJob({
        jobId: job.id,
        workerId: 'worker-1',
        handler: async () => {
          throw new UnknownProviderOutcomeError('Upstream gateway timed out (HTTP 504)');
        },
      });

      // Must enter 'reconciling' instead of immediately re-dispatching
      expect(result.status).toBe('reconciling');
      expect(result.retryCount).toBe(0); // Not counted as blind retry

      // Reconciliation query discovers external system actually processed it!
      const reconciler = vi.fn().mockResolvedValue({
        disposition: 'confirmed_success' as const,
        result: { remoteId: 'rem-999', appliedBudget: 1500 },
      });

      // Next processing cycle runs reconciliation
      const reconciled = await queue.processJob({
        jobId: job.id,
        workerId: 'worker-1',
        handler: async () => { throw new Error('Should not be called if reconciled!'); },
        reconciler,
      });

      expect(reconciled.status).toBe('succeeded');
      expect(reconciled.resultPayload).toEqual({ remoteId: 'rem-999', appliedBudget: 1500 });
      expect(reconciled.receipt?.status).toBe('reconciled');
      expect(reconciled.receipt?.reconciledFromUnknown).toBe(true);
      expect(reconciler).toHaveBeenCalledWith(expect.objectContaining({ id: job.id }));
    });

    it('safely queues for retry if reconciliation confirms provider did not receive action', async () => {
      const queue = new DurableJobQueue();
      const job = queue.enqueueJob({
        workspaceId: 'ws-alpha',
        actionType: 'notification_send',
        idempotencyKey: 'notif-idemp-202',
        payload: { message: 'Hello' },
        priority: 1,
        maxRetries: 3,
        timeoutSeconds: 60,
      });

      queue.claimNextJob('worker-1');
      await queue.processJob({
        jobId: job.id,
        workerId: 'worker-1',
        handler: async () => {
          throw new UnknownProviderOutcomeError('Connection reset by peer');
        },
      });
      expect(job.status).toBe('reconciling');

      // Reconciler verifies the remote provider never recorded the transaction
      const reconciler = vi.fn().mockResolvedValue({
        disposition: 'confirmed_absent' as const,
      });

      const retryCycle = await queue.processJob({
        jobId: job.id,
        workerId: 'worker-1',
        handler: async () => ({ result: { delivered: true } }),
        reconciler,
      });

      // Reconciler safely reset to queued, and handler was able to execute
      expect(retryCycle.status).toBe('succeeded');
      expect(retryCycle.resultPayload).toEqual({ delivered: true });
    });
  });
});
