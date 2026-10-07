import { describe, expect, it, vi } from 'vitest';
import { createWebIntelligenceRouter } from './webIntelligenceRoutes';
import { FixtureWebIntelligenceAdapter } from '../providers/webIntelligence/fixtureAdapter';

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

describe('Web Intelligence router', () => {
  it('exposes capabilities endpoint with fixture adapter', async () => {
    const provider = new FixtureWebIntelligenceAdapter();
    const router = createWebIntelligenceRouter({ provider });

    const req: any = { method: 'GET', url: '/capabilities', body: {} };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/capabilities');
    expect(layer).toBeDefined();

    await layer.route.stack[0].handle(req, res, () => {});
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      capabilities: {
        provider: 'tinyfish',
        configured: true,
        verified: true,
        operations: ['search', 'fetch'],
      },
    });
  });

  it('rejects empty search queries with 400', async () => {
    const provider = new FixtureWebIntelligenceAdapter();
    const router = createWebIntelligenceRouter({ provider });

    const req: any = { method: 'POST', url: '/search', body: { query: '   ' } };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/search');
    await layer.route.stack[layer.route.stack.length - 1].handle(req, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('Search query is required');
  });

  it('executes search queries and returns evidence', async () => {
    const provider = new FixtureWebIntelligenceAdapter();
    const router = createWebIntelligenceRouter({ provider });

    const req: any = { method: 'POST', url: '/search', body: { query: 'competitor pricing' } };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/search');
    await layer.route.stack[layer.route.stack.length - 1].handle(req, res, () => {});

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.results.length).toBeGreaterThan(0);
    expect(res.jsonData.results[0].provider).toBe('tinyfish');
  });

  it('executes fetch requests and returns structured markdown content', async () => {
    const provider = new FixtureWebIntelligenceAdapter();
    const router = createWebIntelligenceRouter({ provider });

    const req: any = { method: 'POST', url: '/fetch', body: { urls: ['https://competitor.example/pricing'] } };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/fetch');
    await layer.route.stack[layer.route.stack.length - 1].handle(req, res, () => {});

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.results[0].content).toContain('Competitor Intelligence Snapshot');
  });
});
