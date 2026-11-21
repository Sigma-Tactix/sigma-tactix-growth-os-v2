import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { DurableJobQueue } from '../../lib/durableJobWorker.js';
import { createDurableWorkerRouter } from './durableWorkerRoutes.js';

describe('durable routes on ephemeral hosts', () => {
  let server: Server;
  let origin: string;
  const queue = new DurableJobQueue();
  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use('/api', createDurableWorkerRouter({ queue }));
    app.get('/api/other', (_req, res) => res.json({ ok: true }));
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(['/workspace/jobs', '/workspace/jobs/job-1/cancel', '/workspace/cron-schedules', '/workspace/cron-schedules/cron-1/trigger', '/webhooks/inbound'])(
    'rejects a volatile mutation at %s on Vercel', async path => {
      vi.stubEnv('VERCEL', '1');
      const response = await fetch(`${origin}/api${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: expect.stringContaining('persistent queue') });
      expect(queue.listJobs('ws-primary')).toHaveLength(0);
    },
  );
  it('does not intercept other API routes', async () => {
    vi.stubEnv('VERCEL', '1');
    const response = await fetch(`${origin}/api/other`);
    expect(response.status).toBe(200);
  });
  it('rejects inbound webhooks when no signing secret is configured', async () => {
    vi.stubEnv('VERCEL', '');
    vi.stubEnv('INBOUND_WEBHOOK_SECRET', '');
    const response = await fetch(`${origin}/api/webhooks/inbound`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: expect.stringContaining('secret not configured') });
  });
});
