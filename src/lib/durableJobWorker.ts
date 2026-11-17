import crypto from 'crypto';

export type JobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'dead_letter'
  | 'reconciling';

export type MissedRunPolicy = 'skip' | 'run_once' | 'catch_up';

export interface DurableCronSchedule {
  id: string;
  workspaceId: string;
  name: string;
  cronExpression: string;
  timezone: string;
  targetAction: string;
  payload: Record<string, unknown>;
  status: 'active' | 'paused' | 'cancelled';
  nextRunAt?: string;
  lastRunAt?: string;
  lastRunStatus?: string;
  missedRunPolicy: MissedRunPolicy;
  createdAt: string;
  updatedAt: string;
}

export interface DurableJobReceipt {
  receiptId: string;
  jobId: string;
  workspaceId: string;
  actionType: string;
  idempotencyKey: string;
  status: 'succeeded' | 'failed' | 'cancelled' | 'reconciled';
  sha256: string;
  executedAt: string;
  durationMs: number;
  workerId: string;
  reconciledFromUnknown?: boolean;
}

export interface DurableJobRun {
  id: string;
  workspaceId: string;
  scheduleId?: string;
  actionType: string;
  idempotencyKey: string;
  status: JobStatus;
  priority: number;
  maxRetries: number;
  retryCount: number;
  timeoutSeconds: number;
  startedAt?: string;
  completedAt?: string;
  lockedUntil?: string;
  lockedBy?: string;
  payload: Record<string, unknown>;
  resultPayload?: Record<string, unknown>;
  errorMessage?: string;
  receipt?: DurableJobReceipt;
  createdAt: string;
  updatedAt: string;
}

export interface InboundWebhookEvent {
  id: string;
  workspaceId: string;
  source: string;
  eventId: string;
  signature: string;
  status:
    | 'received'
    | 'verified'
    | 'dispatched'
    | 'rejected_signature'
    | 'rejected_replay'
    | 'duplicate'
    | 'malformed';
  payload: Record<string, unknown>;
  auditEvidence?: Record<string, unknown>;
  createdAt: string;
}

export class UnknownProviderOutcomeError extends Error {
  public readonly isUnknownOutcome = true;
  constructor(message: string) {
    super(message);
    this.name = 'UnknownProviderOutcomeError';
  }
}

// ---------------------------------------------------------------------------
// 1. Cron Scheduling & Timezone Engine
// ---------------------------------------------------------------------------

export interface ParsedCronField {
  type: 'all' | 'exact' | 'step' | 'range' | 'list';
  values: Set<number>;
}

export interface ParsedCron {
  minute: Set<number>;
  hour: Set<number>;
  dayOfMonth: Set<number>;
  month: Set<number>;
  dayOfWeek: Set<number>;
}

function parseCronPart(part: string, min: number, max: number): Set<number> {
  const result = new Set<number>();
  if (part === '*') {
    for (let i = min; i <= max; i++) result.add(i);
    return result;
  }
  if (part.startsWith('*/')) {
    const step = parseInt(part.slice(2), 10);
    if (isNaN(step) || step <= 0) throw new Error(`Invalid step in cron part: ${part}`);
    for (let i = min; i <= max; i += step) result.add(i);
    return result;
  }
  const items = part.split(',');
  for (const item of items) {
    if (item.includes('-')) {
      const [startStr, endStr] = item.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end) || start > end || start < min || end > max) {
        throw new Error(`Invalid range in cron part: ${item}`);
      }
      for (let i = start; i <= end; i++) result.add(i);
    } else {
      const val = parseInt(item, 10);
      if (isNaN(val) || val < min || val > max) {
        throw new Error(`Invalid value in cron part: ${item}`);
      }
      result.add(val);
    }
  }
  return result;
}

export function parseCronExpression(expression: string): ParsedCron {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Standard 5-part cron expression required; received ${parts.length} parts: "${expression}"`);
  }
  const minute = parseCronPart(parts[0], 0, 59);
  const hour = parseCronPart(parts[1], 0, 23);
  const dayOfMonth = parseCronPart(parts[2], 1, 31);
  const month = parseCronPart(parts[3], 1, 12);
  const dayOfWeek = parseCronPart(parts[4], 0, 7);
  // Map 7 (Sunday) to 0
  if (dayOfWeek.has(7)) {
    dayOfWeek.add(0);
    dayOfWeek.delete(7);
  }
  return { minute, hour, dayOfMonth, month, dayOfWeek };
}

export function getTimezoneComponents(date: Date, timezone: string): {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
  year: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'short',
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const hour = parseInt(map.hour, 10) % 24;
  const minute = parseInt(map.minute, 10);
  const dayOfMonth = parseInt(map.day, 10);
  const month = parseInt(map.month, 10);
  const year = parseInt(map.year, 10);
  const dayOfWeek = weekdayMap[map.weekday] ?? 0;

  return { minute, hour, dayOfMonth, month, dayOfWeek, year };
}

export function matchesCron(parsed: ParsedCron, date: Date, timezone: string): boolean {
  const c = getTimezoneComponents(date, timezone);
  return (
    parsed.minute.has(c.minute) &&
    parsed.hour.has(c.hour) &&
    parsed.dayOfMonth.has(c.dayOfMonth) &&
    parsed.month.has(c.month) &&
    parsed.dayOfWeek.has(c.dayOfWeek)
  );
}

export function computeNextOccurrence(
  expression: string,
  timezone: string,
  fromDate: Date
): Date {
  const parsed = parseCronExpression(expression);
  // Start searching from next minute, rounded to boundary
  const current = new Date(fromDate.getTime());
  current.setUTCSeconds(0, 0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  // Search forward up to 366 days in 1-minute steps
  const maxIterations = 366 * 24 * 60;
  for (let i = 0; i < maxIterations; i++) {
    if (matchesCron(parsed, current, timezone)) {
      return new Date(current.getTime());
    }
    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }
  throw new Error(`No matching occurrence found within 366 days for cron: ${expression}`);
}

export function evaluateMissedRuns(params: {
  schedule: DurableCronSchedule;
  currentTime: Date;
  referenceTime?: Date;
  maxCatchUpRuns?: number;
}): {
  missedRuns: Array<{ scheduledTime: string; idempotencyKey: string }>;
  nextRunAt: string;
} {
  const { schedule, currentTime, referenceTime, maxCatchUpRuns = 5 } = params;
  const parsed = parseCronExpression(schedule.cronExpression);
  const startFrom = referenceTime || (schedule.lastRunAt ? new Date(schedule.lastRunAt) : undefined);

  if (!startFrom) {
    const next = computeNextOccurrence(schedule.cronExpression, schedule.timezone, currentTime);
    return { missedRuns: [], nextRunAt: next.toISOString() };
  }

  // Iterate forward from startFrom up to currentTime
  const candidate = new Date(startFrom.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  const missed: Array<{ scheduledTime: string; idempotencyKey: string }> = [];

  while (candidate.getTime() <= currentTime.getTime()) {
    if (matchesCron(parsed, candidate, schedule.timezone)) {
      const scheduledIso = candidate.toISOString();
      missed.push({
        scheduledTime: scheduledIso,
        idempotencyKey: `cron:${schedule.id}:${scheduledIso}`,
      });
    }
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  const next = computeNextOccurrence(schedule.cronExpression, schedule.timezone, currentTime);

  if (schedule.missedRunPolicy === 'skip') {
    return { missedRuns: [], nextRunAt: next.toISOString() };
  }

  if (schedule.missedRunPolicy === 'run_once') {
    const lastMissed = missed.length > 0 ? [missed[missed.length - 1]] : [];
    return { missedRuns: lastMissed, nextRunAt: next.toISOString() };
  }

  // 'catch_up'
  return {
    missedRuns: missed.slice(-maxCatchUpRuns),
    nextRunAt: next.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 2. Webhook Signature, Replay & Deduplication
// ---------------------------------------------------------------------------

export function verifyWebhookHmac(
  rawBody: string | Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;
  const rawSignature = signatureHeader.replace(/^sha256=/i, '').trim();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const expectedSignature = hmac.digest('hex');

  if (rawSignature.length !== expectedSignature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(rawSignature, 'utf-8'),
    Buffer.from(expectedSignature, 'utf-8')
  );
}

export function verifyWebhookTimestamp(
  timestampHeader: string | number | undefined,
  toleranceSeconds = 300,
  referenceNow = Date.now()
): { valid: boolean; skewSeconds: number; reason?: string } {
  if (timestampHeader === undefined || timestampHeader === '') {
    return { valid: false, skewSeconds: 0, reason: 'Missing timestamp header' };
  }
  const parsedTs =
    typeof timestampHeader === 'number'
      ? timestampHeader
      : !isNaN(Number(timestampHeader))
      ? Number(timestampHeader) * (String(timestampHeader).length <= 10 ? 1000 : 1)
      : Date.parse(timestampHeader);

  if (isNaN(parsedTs)) {
    return { valid: false, skewSeconds: 0, reason: 'Malformed timestamp format' };
  }

  const skewSeconds = Math.round((referenceNow - parsedTs) / 1000);
  if (skewSeconds > toleranceSeconds) {
    return { valid: false, skewSeconds, reason: `Timestamp expired (skew ${skewSeconds}s > ${toleranceSeconds}s)` };
  }
  if (skewSeconds < -60) {
    return { valid: false, skewSeconds, reason: `Timestamp in future (skew ${skewSeconds}s)` };
  }
  return { valid: true, skewSeconds };
}

export interface WebhookValidationResult {
  valid: boolean;
  statusCode: number;
  status:
    | 'verified'
    | 'rejected_signature'
    | 'rejected_replay'
    | 'duplicate'
    | 'malformed';
  error?: string;
  auditEvidence?: Record<string, unknown>;
}

export function validateInboundWebhook(params: {
  rawBody: string | Buffer;
  parsedBody: any;
  signatureHeader?: string;
  timestampHeader?: string | number;
  secret: string;
  workspaceId: string;
  source: string;
  existingEventIds: Set<string>;
  toleranceSeconds?: number;
}): WebhookValidationResult {
  const {
    rawBody,
    parsedBody,
    signatureHeader = '',
    timestampHeader,
    secret,
    workspaceId,
    source,
    existingEventIds,
    toleranceSeconds = 300,
  } = params;

  // 1. Signature check
  const signatureValid = verifyWebhookHmac(rawBody, signatureHeader, secret);
  if (!signatureValid) {
    return {
      valid: false,
      statusCode: 401,
      status: 'rejected_signature',
      error: 'Invalid webhook HMAC signature.',
      auditEvidence: { workspaceId, source, reason: 'signature_mismatch' },
    };
  }

  // 2. Replay window check
  const tsCheck = verifyWebhookTimestamp(timestampHeader, toleranceSeconds);
  if (!tsCheck.valid) {
    return {
      valid: false,
      statusCode: 400,
      status: 'rejected_replay',
      error: `Webhook replay check failed: ${tsCheck.reason}`,
      auditEvidence: { workspaceId, source, skewSeconds: tsCheck.skewSeconds, reason: tsCheck.reason },
    };
  }

  // 3. Payload integrity check
  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return {
      valid: false,
      statusCode: 400,
      status: 'malformed',
      error: 'Malformed webhook JSON payload.',
      auditEvidence: { workspaceId, source, reason: 'non_object_payload' },
    };
  }

  const eventId = String(parsedBody.id || parsedBody.event_id || parsedBody.eventId || '').trim();
  if (!eventId) {
    return {
      valid: false,
      statusCode: 400,
      status: 'malformed',
      error: 'Webhook payload missing required event identifier (id / event_id).',
      auditEvidence: { workspaceId, source, reason: 'missing_event_id' },
    };
  }

  // 4. Deduplication check
  const dedupKey = `${workspaceId}:${source}:${eventId}`;
  if (existingEventIds.has(dedupKey)) {
    return {
      valid: false,
      statusCode: 200,
      status: 'duplicate',
      error: 'Duplicate event already processed.',
      auditEvidence: { workspaceId, source, eventId, duplicate: true },
    };
  }

  return {
    valid: true,
    statusCode: 200,
    status: 'verified',
    auditEvidence: { workspaceId, source, eventId, skewSeconds: tsCheck.skewSeconds },
  };
}

// ---------------------------------------------------------------------------
// 3. Durable Worker & Unknown Outcome Reconciliation Engine
// ---------------------------------------------------------------------------

export type JobExecutionHandler = (job: DurableJobRun) => Promise<{
  result: Record<string, unknown>;
}>;

export type ProviderReconciliationHandler = (job: DurableJobRun) => Promise<{
  disposition: 'confirmed_success' | 'confirmed_absent' | 'still_unknown';
  result?: Record<string, unknown>;
  error?: string;
}>;

export function generateJobReceipt(job: DurableJobRun, durationMs: number, workerId: string, reconciled = false): DurableJobReceipt {
  const executedAt = new Date().toISOString();
  const digest = crypto
    .createHash('sha256')
    .update(`${job.id}:${job.workspaceId}:${job.actionType}:${job.idempotencyKey}:${job.status}:${executedAt}`)
    .digest('hex');

  return {
    receiptId: crypto.randomUUID(),
    jobId: job.id,
    workspaceId: job.workspaceId,
    actionType: job.actionType,
    idempotencyKey: job.idempotencyKey,
    status: reconciled ? 'reconciled' : job.status === 'succeeded' ? 'succeeded' : 'failed',
    sha256: digest,
    executedAt,
    durationMs,
    workerId,
    reconciledFromUnknown: reconciled,
  };
}

export class DurableJobQueue {
  private jobs: Map<string, DurableJobRun> = new Map();

  public enqueueJob(job: Omit<DurableJobRun, 'id' | 'status' | 'retryCount' | 'createdAt' | 'updatedAt'>): DurableJobRun {
    const existing = Array.from(this.jobs.values()).find(
      j => j.workspaceId === job.workspaceId && j.idempotencyKey === job.idempotencyKey
    );
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const newJob: DurableJobRun = {
      ...job,
      id: crypto.randomUUID(),
      status: 'queued',
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(newJob.id, newJob);
    return newJob;
  }

  public getJob(id: string): DurableJobRun | undefined {
    return this.jobs.get(id);
  }

  public listJobs(workspaceId?: string): DurableJobRun[] {
    const all = Array.from(this.jobs.values());
    if (!workspaceId) return all;
    return all.filter(j => j.workspaceId === workspaceId);
  }

  public cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    if (['succeeded', 'failed', 'dead_letter'].includes(job.status)) {
      return false; // cannot cancel completed job
    }
    job.status = 'cancelled';
    job.updatedAt = new Date().toISOString();
    return true;
  }

  public claimNextJob(workerId: string, leaseSeconds = 30, now = Date.now()): DurableJobRun | null {
    const nowIso = new Date(now).toISOString();

    // 1. Crash recovery: Check if any 'running' job has expired lease
    for (const job of this.jobs.values()) {
      if (job.status === 'running' && job.lockedUntil && Date.parse(job.lockedUntil) <= now) {
        // Worker crashed mid-execution. Move to 'reconciling' before blind retry.
        job.status = 'reconciling';
        job.lockedBy = undefined;
        job.lockedUntil = undefined;
        job.updatedAt = nowIso;
      }
    }

    // 2. Find candidate: reconciling first, then queued by priority
    const candidates = Array.from(this.jobs.values())
      .filter(j => j.status === 'queued' || j.status === 'reconciling')
      .sort((a, b) => {
        if (a.status === 'reconciling' && b.status !== 'reconciling') return -1;
        if (b.status === 'reconciling' && a.status !== 'reconciling') return 1;
        return b.priority - a.priority;
      });

    if (candidates.length === 0) return null;
    const target = candidates[0];

    target.status = 'running';
    target.lockedBy = workerId;
    target.lockedUntil = new Date(now + leaseSeconds * 1000).toISOString();
    target.startedAt = target.startedAt || nowIso;
    target.updatedAt = nowIso;

    return target;
  }

  public async processJob(params: {
    jobId: string;
    workerId: string;
    handler: JobExecutionHandler;
    reconciler?: ProviderReconciliationHandler;
    now?: number;
  }): Promise<DurableJobRun> {
    const { jobId, workerId, handler, reconciler, now = Date.now() } = params;
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);

    // If cancelled before start
    if (job.status === 'cancelled') {
      return job;
    }

    const startTime = Date.now();

    // If job was picked up in reconciling status
    if (job.status === 'reconciling' && reconciler) {
      const recon = await reconciler(job);
      if (recon.disposition === 'confirmed_success') {
        job.status = 'succeeded';
        job.resultPayload = recon.result;
        job.completedAt = new Date().toISOString();
        job.receipt = generateJobReceipt(job, Date.now() - startTime, workerId, true);
        job.updatedAt = new Date().toISOString();
        return job;
      }
      if (recon.disposition === 'confirmed_absent') {
        // Safe to retry
        job.status = 'queued';
        job.updatedAt = new Date().toISOString();
      } else {
        // Still unknown: hold in reconciling
        job.status = 'reconciling';
        job.updatedAt = new Date().toISOString();
        return job;
      }
    }

    try {
      const { result } = await handler(job);
      job.status = 'succeeded';
      job.resultPayload = result;
      job.completedAt = new Date().toISOString();
      job.receipt = generateJobReceipt(job, Date.now() - startTime, workerId, false);
      job.updatedAt = new Date().toISOString();
      return job;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      if (err?.isUnknownOutcome) {
        // Unknown provider outcome: enter reconciliation state
        job.status = 'reconciling';
        job.errorMessage = err.message || 'Unknown provider outcome encountered';
        job.updatedAt = new Date().toISOString();
        return job;
      }

      // Hard failure: increment retry count
      job.retryCount += 1;
      job.errorMessage = err?.message || 'Job execution failure';

      if (job.retryCount >= job.maxRetries) {
        job.status = 'dead_letter';
        job.completedAt = new Date().toISOString();
        job.receipt = generateJobReceipt(job, durationMs, workerId, false);
      } else {
        job.status = 'queued';
      }
      job.updatedAt = new Date().toISOString();
      return job;
    }
  }
}
