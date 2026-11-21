import { describe, expect, it, vi } from 'vitest';
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
  it('rejects a configured provider bound to another Client Enclave', async () => {
    const provider = new SocialSchedulerAdapter({ apiKey: 'test-key' });
    const router = createSocialDistributionRouter({ provider, requireWorkspaceBinding: true, workspaceId: 'enclave-a' });
    const res = createMockRes(); res.locals = { wsId: 'enclave-b' };
    const next = vi.fn();
    await (router as any).stack[0].handle({}, res, next);
    expect(res.statusCode).toBe(403); expect(next).not.toHaveBeenCalled();
  });
  it('rejects configured connections without an explicit Client Enclave binding', async () => {
    const provider = new SocialSchedulerAdapter({ apiKey: 'test-key' });
    const router = createSocialDistributionRouter({ provider, requireWorkspaceBinding: true });
    const res = createMockRes(); res.locals = { wsId: 'enclave-a' };
    const next = vi.fn();
    await (router as any).stack[0].handle({}, res, next);
    expect(res.statusCode).toBe(503); expect(next).not.toHaveBeenCalled();
  });

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
        mode: 'unavailable',
        configured: false,
      },
    });
  });

  it('returns no channels without a provider', async () => {
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
    expect(res.jsonData.channels).toEqual([]);
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

  it.each([
    { content: 42, channels: ['channel'] },
    { content: 'Hello', channels: 'channel' },
    { content: 'Hello', channels: [] },
    { content: 'Hello', channels: ['channel'], scheduledFor: 'tomorrow' },
    { content: 'Hello', channels: ['channel'], media: [{ url: 'http://127.0.0.1/private', type: 'image' }] },
    { content: 'Hello', channels: ['channel'], unexpected: 'field' },
    { content: 'Hello', channels: ['channel'], media: [{ url: 'https://127.0.0.1/private', type: 'image' }] },
  ])('rejects invalid publish input without reaching the provider: %j', async body => {
    const provider = new SocialSchedulerAdapter({ apiKey: 'test-key' });
    const publish = vi.spyOn(provider, 'publishNow');
    const router = createSocialDistributionRouter({ provider });
    const layer = (router as any).stack.find((s: any) => s.route?.path === '/publish');
    const res = createMockRes();
    await layer.route.stack.at(-1).handle({ body }, res, () => {});
    expect(res.statusCode).toBe(400); expect(publish).not.toHaveBeenCalled();
  });

  it('rejects a schedule in the past before dispatch', async () => {
    const provider = new SocialSchedulerAdapter({ apiKey: 'test-key' });
    const schedule = vi.spyOn(provider, 'schedulePost');
    const router = createSocialDistributionRouter({ provider });
    const layer = (router as any).stack.find((s: any) => s.route?.path === '/schedule');
    const res = createMockRes();
    await layer.route.stack.at(-1).handle({ body: { content: 'Hello', channels: ['channel'], scheduledFor: '2020-01-01T00:00:00Z' } }, res, () => {});
    expect(res.statusCode).toBe(400); expect(schedule).not.toHaveBeenCalled();
  });

  it('rejects scheduling without a provider even when the payload is valid', async () => {
    const provider = new SocialSchedulerAdapter({ apiKey: '' });
    const router = createSocialDistributionRouter({ provider });

    const req: any = {
      method: 'POST',
      url: '/schedule',
      body: {
        content: 'Valid scheduled launch announcement',
        scheduledFor: '2099-10-20T12:00:00Z',
        channels: ['chan-li-01'],
      },
    };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/schedule');
    await layer.route.stack[layer.route.stack.length - 1].handle(req, res, () => {});

    expect(res.statusCode).toBe(422);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.error).toMatch(/Connect a social publishing provider/);
  });
});
