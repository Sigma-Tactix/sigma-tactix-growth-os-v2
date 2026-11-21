import { Router, Request, Response } from 'express';
import {
  DurableJobQueue,
  validateInboundWebhook,
  type DurableCronSchedule,
  evaluateMissedRuns,
  computeNextOccurrence,
} from '../../lib/durableJobWorker.js';

export interface DurableWorkerRouterDeps {
  queue: DurableJobQueue;
  getWebhookSecret?: (workspaceId: string, source: string) => Promise<string | null> | string | null;
}

export function createDurableWorkerRouter(deps: DurableWorkerRouterDeps): Router {
  const router = Router();
  const existingWebhookEvents = new Set<string>();
  const cronSchedules = new Map<string, DurableCronSchedule>();

  // These collections disappear when a Vercel function is recycled. Reject
  // mutations until this router is backed by persistent queue storage.
  router.use(['/webhooks/inbound', '/workspace/jobs', '/workspace/cron-schedules'], (req, res, next) => {
    if (process.env.VERCEL && req.method !== 'GET') {
      res.status(503).json({ error: 'Durable execution is unavailable: persistent queue storage and a supervised worker are required.' });
      return;
    }
    next();
  });

  // Inbound webhook verification, replay protection, and deduplication
  router.post('/webhooks/inbound', async (req: Request, res: Response) => {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body || {});
    const signature = (req.headers['x-webhook-signature'] || req.headers['x-signature'] || '') as string;
    const timestamp = (req.headers['x-webhook-timestamp'] || req.headers['x-timestamp'] || '') as string;
    const workspaceId = ((req.headers['x-workspace-id'] || req.query.workspaceId || 'ws-primary') as string).trim();
    const source = ((req.headers['x-webhook-source'] || req.query.source || 'default') as string).trim();

    const secret = deps.getWebhookSecret
      ? await deps.getWebhookSecret(workspaceId, source)
      : process.env.INBOUND_WEBHOOK_SECRET || null;

    if (!secret) {
      res.status(503).json({ error: 'Inbound webhook secret not configured for workspace.' });
      return;
    }

    const validation = validateInboundWebhook({
      rawBody,
      parsedBody: req.body,
      signatureHeader: signature,
      timestampHeader: timestamp,
      secret,
      workspaceId,
      source,
      existingEventIds: existingWebhookEvents,
    });

    if (!validation.valid) {
      res.status(validation.statusCode).json({
        error: validation.error,
        status: validation.status,
        auditEvidence: validation.auditEvidence,
      });
      return;
    }

    const eventId = String(req.body.id || req.body.event_id || req.body.eventId);
    existingWebhookEvents.add(`${workspaceId}:${source}:${eventId}`);

    // Dispatch durable job run from verified event
    const job = deps.queue.enqueueJob({
      workspaceId,
      actionType: `webhook:${source}`,
      idempotencyKey: `webhook:${source}:${eventId}`,
      priority: 1,
      maxRetries: 3,
      timeoutSeconds: 300,
      payload: req.body,
    });

    res.status(202).json({
      success: true,
      status: 'verified',
      jobId: job.id,
      auditEvidence: validation.auditEvidence,
    });
  });

  // Workspace-scoped durable jobs
  router.get('/workspace/jobs', async (req: Request, res: Response) => {
    const wsId = res.locals.wsId || (req.query.workspaceId as string) || 'ws-primary';
    const jobs = deps.queue.listJobs(wsId);
    res.json({ jobs });
  });

  router.post('/workspace/jobs', async (req: Request, res: Response) => {
    const wsId = res.locals.wsId || (req.query.workspaceId as string) || 'ws-primary';
    const { actionType, idempotencyKey, payload, priority, maxRetries, timeoutSeconds } = req.body || {};
    if (!actionType || !idempotencyKey) {
      res.status(400).json({ error: 'Missing actionType or idempotencyKey.' });
      return;
    }

    const job = deps.queue.enqueueJob({
      workspaceId: wsId,
      actionType,
      idempotencyKey,
      payload: payload || {},
      priority: priority ?? 0,
      maxRetries: maxRetries ?? 3,
      timeoutSeconds: timeoutSeconds ?? 300,
    });

    res.status(201).json({ job });
  });

  router.post('/workspace/jobs/:id/cancel', async (req: Request, res: Response) => {
    const ok = deps.queue.cancelJob(req.params.id);
    if (!ok) {
      res.status(400).json({ error: 'Job cannot be cancelled (completed or not found).' });
      return;
    }
    res.json({ success: true, jobId: req.params.id, status: 'cancelled' });
  });

  // Workspace-scoped cron schedules
  router.get('/workspace/cron-schedules', async (req: Request, res: Response) => {
    const wsId = res.locals.wsId || (req.query.workspaceId as string) || 'ws-primary';
    const schedules = Array.from(cronSchedules.values()).filter(s => s.workspaceId === wsId);
    res.json({ schedules });
  });

  router.post('/workspace/cron-schedules', async (req: Request, res: Response) => {
    const wsId = res.locals.wsId || (req.query.workspaceId as string) || 'ws-primary';
    const { name, cronExpression, timezone = 'UTC', targetAction, payload = {}, missedRunPolicy = 'run_once' } = req.body || {};
    if (!name || !cronExpression || !targetAction) {
      res.status(400).json({ error: 'Missing name, cronExpression, or targetAction.' });
      return;
    }

    try {
      const nextRun = computeNextOccurrence(cronExpression, timezone, new Date());
      const schedule: DurableCronSchedule = {
        id: crypto.randomUUID(),
        workspaceId: wsId,
        name,
        cronExpression,
        timezone,
        targetAction,
        payload,
        status: 'active',
        nextRunAt: nextRun.toISOString(),
        missedRunPolicy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      cronSchedules.set(schedule.id, schedule);
      res.status(201).json({ schedule });
    } catch (err: any) {
      res.status(400).json({ error: `Invalid cron schedule parameters: ${err?.message || err}` });
    }
  });

  router.post('/workspace/cron-schedules/:id/trigger', async (req: Request, res: Response) => {
    const schedule = cronSchedules.get(req.params.id);
    if (!schedule) {
      res.status(404).json({ error: 'Cron schedule not found.' });
      return;
    }

    const scheduledTime = req.body?.scheduledTime || new Date().toISOString();
    const idempotencyKey = `cron:${schedule.id}:${scheduledTime}`;

    const job = deps.queue.enqueueJob({
      workspaceId: schedule.workspaceId,
      scheduleId: schedule.id,
      actionType: schedule.targetAction,
      idempotencyKey,
      payload: { ...schedule.payload, scheduledTime },
      priority: 2,
      maxRetries: 3,
      timeoutSeconds: 300,
    });

    schedule.lastRunAt = new Date().toISOString();
    schedule.lastRunStatus = 'running';

    res.status(201).json({ job, schedule });
  });

  return router;
}
