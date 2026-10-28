import { describe, expect, it } from 'vitest';
import { createSocialDistributionRouter } from './socialDistributionRoutes.js';
import { SocialSchedulerAdapter } from '../providers/socialDistribution/socialSchedulerAdapter.js';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.jsonData = data;
      return res;
    },
    setHeader(key: string, val: string) {
      res.headers[key] = val;
      return res;
    },
  };
  return res;
}

describe('Social Distribution router', () => {
  it('exposes status endpoint in offline mode', async () => {
    const provider = new SocialSchedulerAdapter({ apiKey: '' });
    const router = createSocialDistributionRouter({ provider });

    const req: any = { method: 'GET', url: '/status', body: {} };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/status');
    expect(layer).toBeDefined();

    await layer.route.stack[0].handle(req, res, () => {});
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      status: {
        mode: 'mock_offline',
        configured: false,
      },
    });
  });

  it('exposes channels endpoint returning default mock channels', async () => {
    const provider = new SocialSchedulerAdapter({ apiKey: '' });
    const router = createSocialDistributionRouter({ provider });

    const req: any = { method: 'GET', url: '/channels', body: {} };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/channels');
    expect(layer).toBeDefined();

    await layer.route.stack[0].handle(req, res, () => {});
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(Array.isArray(res.jsonData.channels)).toBe(true);
    expect(res.jsonData.channels.length).toBeGreaterThan(0);
  });

  it('rejects scheduling without scheduledFor timestamp with 400', async () => {
    const provider = new SocialSchedulerAdapter({ apiKey: '' });
    const router = createSocialDistributionRouter({ provider });

    const req: any = {
      method: 'POST',
      url: '/schedule',
      body: { content: 'Missing timestamp' },
    };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/schedule');
    await layer.route.stack[layer.route.stack.length - 1].handle(req, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.error).toContain('scheduledFor');
  });

  it('rejects post with empty content with 400', async () => {
    const provider = new SocialSchedulerAdapter({ apiKey: '' });
    const router = createSocialDistributionRouter({ provider });

    const req: any = {
      method: 'POST',
      url: '/draft',
      body: { content: '   ' },
    };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/draft');
    await layer.route.stack[layer.route.stack.length - 1].handle(req, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.success).toBe(false);
  });

  it('successfully schedules a post when payload is valid', async () => {
    const provider = new SocialSchedulerAdapter({ apiKey: '' });
    const router = createSocialDistributionRouter({ provider });

    const req: any = {
      method: 'POST',
      url: '/schedule',
      body: {
        content: 'Valid scheduled launch announcement',
        scheduledFor: '2026-10-20T12:00:00Z',
        channels: ['chan-li-01'],
      },
    };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/schedule');
    await layer.route.stack[layer.route.stack.length - 1].handle(req, res, () => {});

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.result.status).toBe('scheduled');
  });
});
