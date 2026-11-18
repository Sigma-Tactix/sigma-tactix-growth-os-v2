import { describe, it, expect, beforeEach } from 'vitest';
import {
  correlatedLogger,
  sanitizeSecrets,
  createWorkspaceBackup,
  restoreWorkspaceBackup,
  ReleaseRollbackManager,
  runStagingSoakRehearsal,
  RUNTIME_LIMITS,
  OPERATIONS_SUPPORT_OWNER,
  assessSystemReadiness,
  type TraceContext,
} from './operationsRunbook.js';
import { DurableJobQueue } from './durableJobWorker.js';

describe('Task S19: Operate Recover and Rollback', () => {
  beforeEach(() => {
    correlatedLogger.clear();
  });

  describe('S19-A1: Correlated Logs & Zero-Secret Sanitization', () => {
    it('correlates requests, actions, jobs, and receipts through trace context', () => {
      const trace: TraceContext = {
        traceId: 'tr-req-dubai-001',
        requestId: 'req-8842',
        actionId: 'act-realloc-01',
        jobId: 'job-durable-99',
        receiptHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        workspaceId: 'ws-client-alpha',
      };

      correlatedLogger.log('info', 'Incoming dispatch request received', trace, {
        endpoint: '/api/workspace/actions/submit',
      });

      correlatedLogger.log('info', 'Operator approved action queue item', trace, {
        approver: 'Nazim (Principal Lead)',
      });

      correlatedLogger.log('info', 'Durable job claimed by worker', trace, {
        workerId: 'worker-uae-core-01',
      });

      correlatedLogger.log('info', 'Execution receipt minted and recorded', trace, {
        durationMs: 240,
      });

      const correlated = correlatedLogger.getCorrelatedTrace('tr-req-dubai-001');
      expect(correlated.length).toBe(4);
      expect(correlated[0].message).toContain('Incoming dispatch request');
      expect(correlated[3].message).toContain('Execution receipt minted');

      // Verify correlation by actionId and jobId
      expect(correlatedLogger.getRecordsByAction('act-realloc-01').length).toBe(4);
      expect(correlatedLogger.getRecordsByJob('job-durable-99').length).toBe(4);
    });

    it('sanitizes API keys, Bearer tokens, DB credentials, and sensitive payload keys', () => {
      const sensitivePayload = {
        title: 'Update Google Ads API & Secret Config',
        apiKey: 'sk-proj-1234567890abcdef1234567890abcdef',
        oauthHeader: 'Bearer ya29.a0AZYkNsE4jJxxxxxxxxxxxxxxxxxxxx',
        dbConnectionString: 'postgresql://postgres:SuperSecretP@ssword@db.sovereign.local:5432/sigma',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----',
        nestedConfig: {
          clientSecret: 'secret_live_999988887777',
          safeParam: 'gcc_uae_region',
        },
      };

      const sanitized = sanitizeSecrets(sensitivePayload) as Record<string, any>;

      // Check key-based redaction
      expect(sanitized.apiKey).toBe('[REDACTED:SensitiveKey]');
      expect(sanitized.nestedConfig.clientSecret).toBe('[REDACTED:SensitiveKey]');
      expect(sanitized.nestedConfig.safeParam).toBe('gcc_uae_region');

      // Check value-based redaction
      const sanitizedOAuth = sanitizeSecrets('Bearer ya29.a0AZYkNsE4jJxxxxxxxxxxxxxxxxxxxx') as string;
      expect(sanitizedOAuth).toContain('[REDACTED:BearerToken]');
      expect(sanitizedOAuth).not.toContain('ya29.a0AZYkNsE4jJ');

      const standaloneOAuth = sanitizeSecrets('ya29.a0AZYkNsE4jJxxxxxxxxxxxxxxxxxxxx') as string;
      expect(standaloneOAuth).toBe('[REDACTED:OAuthToken]');

      const sanitizedDb = sanitizeSecrets('postgresql://postgres:password123@db.prod:5432/sigma') as string;
      expect(sanitizedDb).toContain('postgres://[REDACTED_CREDENTIALS]@[HOST]');
      expect(sanitizedDb).not.toContain('password123');

      const sanitizedKey = sanitizeSecrets('-----BEGIN PRIVATE KEY-----\nKEYDATA\n-----END PRIVATE KEY-----') as string;
      expect(sanitizedKey).toBe('[REDACTED:PrivateKey]');
    });

    it('logs sanitized metadata without exposing sensitive credentials in records', () => {
      const trace: TraceContext = { traceId: 'tr-sec-check' };
      const record = correlatedLogger.log('warn', 'Third-party API authentication failed', trace, {
        bearerToken: 'Bearer ya29.a0AZYkNsE4jJxxxxxxxxxxxxxxxxxxxx',
        databaseUrl: 'postgresql://postgres:adminpass@127.0.0.1:5432/core',
      });

      expect(record.metadata?.bearerToken).toBe('[REDACTED:SensitiveKey]');
      expect(record.metadata?.databaseUrl).toBe('postgres://[REDACTED_CREDENTIALS]@[HOST]');
    });
  });

  describe('S19-A2: Backup Restore, Worker Recovery, Rollback & Staging Soak', () => {
    it('creates and restores workspace backups with cryptographic checksum verification', () => {
      const backup = createWorkspaceBackup({
        workspaceId: 'ws-client-alpha',
        settings: { name: 'Apex Logistics UAE', currency: 'AED', region: 'Asia/Dubai' },
        actions: [{ id: 'act-01', status: 'COMPLETED' }],
        learnings: [{ id: 'lrn-01', title: 'GSC domain prefix reconciliation' }],
        documents: [{ id: 'doc-01', title: 'Q4 Logistics SLA' }],
      });

      expect(backup.backupId).toBeDefined();
      expect(backup.checksum).toBeDefined();
      expect(backup.checksum.length).toBe(64);

      // Successful restoration
      const restoreResult = restoreWorkspaceBackup(backup);
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.restoredRecords).toBe(6); // 3 settings keys + 1 action + 1 learning + 1 doc

      // Corrupted backup rejection
      const corruptedBackup = {
        ...backup,
        checksum: 'bad-tampered-checksum-' + '0'.repeat(42),
      };
      const corruptResult = restoreWorkspaceBackup(corruptedBackup);
      expect(corruptResult.success).toBe(false);
      expect(corruptResult.error).toContain('Checksum mismatch');
    });

    it('recovers crashed worker jobs via reconciling state without duplicating operations', async () => {
      const queue = new DurableJobQueue();

      // Enqueue job with idempotency key
      const job = queue.enqueueJob({
        workspaceId: 'ws-client-alpha',
        actionType: 'reports.snapshot.render',
        idempotencyKey: 'idem-crash-recovery-01',
        payload: { period: 'Q4' },
        priority: 5,
        maxRetries: 3,
        timeoutSeconds: 10,
      });

      // Claim job with timestamp T0
      const claimed = queue.claimNextJob('worker-crashed-node', 5, 1000);
      expect(claimed?.status).toBe('running');

      // Worker crashes. Next claim at T = 1000 + 6000ms (lease expired)
      const recovered = queue.claimNextJob('worker-recovery-node', 30, 7000);
      expect(recovered).not.toBeNull();
      expect(recovered?.id).toBe(job.id);
      expect(recovered?.status).toBe('running');

      // Complete job with reconciliation handler
      await queue.processJob({
        jobId: recovered!.id,
        workerId: 'worker-recovery-node',
        handler: async () => ({ success: true, result: { restored: true } }),
      });

      const finalJob = queue.getJob(job.id);
      expect(finalJob?.status).toBe('succeeded');
    });

    it('demonstrates deployment rollback to previous release candidate on regression', () => {
      const rollbackManager = new ReleaseRollbackManager('commit-sha-v1', 'v2.0.0-rc1');

      // Deploy new release candidate
      rollbackManager.registerCandidate('commit-sha-v2-canary', 'v2.0.0-rc2', 'integrator-1');
      expect(rollbackManager.getActiveRelease()).toBe('commit-sha-v2-canary');

      // Regression detected in canary -> trigger emergency rollback
      const rollback = rollbackManager.executeRollback(
        'commit-sha-v1',
        'Canary telemetry identified rate limit degradation in external connector pipeline'
      );

      expect(rollback.success).toBe(true);
      expect(rollback.previousSha).toBe('commit-sha-v2-canary');
      expect(rollback.currentSha).toBe('commit-sha-v1');
      expect(rollback.rollbackAudit.authorizedBy).toBe('Nazim (Principal Lead)');
      expect(rollbackManager.getActiveRelease()).toBe('commit-sha-v1');
    });

    it('executes 10-job staging soak rehearsal (REL-01) with zero duplicate side effects', async () => {
      const soak = await runStagingSoakRehearsal(10);

      expect(soak.totalJobs).toBe(10);
      expect(soak.succeeded).toBe(10);
      expect(soak.failed).toBe(0);
      expect(soak.duplicates).toBe(0);
      expect(soak.results.length).toBe(10);

      // Confirm heartbeats retained across all scheduled jobs
      for (const res of soak.results) {
        expect(res.heartbeatCount).toBeGreaterThanOrEqual(1);
        expect(res.status).toBe('succeeded');
      }
    });
  });

  describe('S19-A3: Monitored Readiness, Runtime Limits & On-Call Owner', () => {
    it('enforces platform runtime limits and SLA parameters', () => {
      expect(RUNTIME_LIMITS.WORKER_DEFAULT_TIMEOUT_SEC).toBe(300);
      expect(RUNTIME_LIMITS.WORKER_MAX_TIMEOUT_SEC).toBe(1800);
      expect(RUNTIME_LIMITS.MAX_REQUEST_BODY_BYTES).toBe(10 * 1024 * 1024);
      expect(RUNTIME_LIMITS.MAX_PROCESS_MEMORY_MB).toBe(2048);

      expect(OPERATIONS_SUPPORT_OWNER.name).toBe('Nazim (Principal Lead)');
      expect(OPERATIONS_SUPPORT_OWNER.timezone).toBe('Asia/Dubai');
      expect(OPERATIONS_SUPPORT_OWNER.escalationSlaMinutes).toBe(15);
    });

    it('correctly assesses system readiness under healthy, degraded, and unhealthy states', () => {
      // 1. Healthy State
      const healthy = assessSystemReadiness({
        heapUsedMb: 450,
        dbResponseMs: 15,
        workerHeartbeatSecAgo: 3,
        vaultViolations: 0,
      });
      expect(healthy.status).toBe('ready');
      expect(healthy.checks.memory.status).toBe('pass');
      expect(healthy.checks.database.status).toBe('pass');

      // 2. Degraded State (e.g. Memory pressure or delayed worker heartbeat)
      const degraded = assessSystemReadiness({
        heapUsedMb: 2200, // exceeds 2048 MB limit
        dbResponseMs: 25,
        workerHeartbeatSecAgo: 2,
        vaultViolations: 0,
      });
      expect(degraded.status).toBe('degraded');
      expect(degraded.checks.memory.status).toBe('fail');

      // 3. Unhealthy State (Database failure or vault boundary violation)
      const unhealthy = assessSystemReadiness({
        heapUsedMb: 300,
        dbResponseMs: 1500, // DB timeout
        workerHeartbeatSecAgo: 2,
        vaultViolations: 0,
      });
      expect(unhealthy.status).toBe('unhealthy');
      expect(unhealthy.checks.database.status).toBe('fail');
    });
  });
});
