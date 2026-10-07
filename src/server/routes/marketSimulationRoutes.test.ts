import { describe, expect, it } from 'vitest';
import { createMarketSimulationRouter } from './marketSimulationRoutes';
import { FixtureMarketSimulationAdapter } from '../providers/marketSimulation/fixtureAdapter';

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

describe('Market Simulation router', () => {
  it('exposes capabilities endpoint with fixture adapter', async () => {
    const provider = new FixtureMarketSimulationAdapter();
    const router = createMarketSimulationRouter({ provider });

    const req: any = { method: 'GET', url: '/capabilities', body: {} };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/capabilities');
    expect(layer).toBeDefined();

    await layer.route.stack[0].handle(req, res, () => {});
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      capabilities: {
        provider: 'mirofish',
        configured: true,
        verified: true,
      },
    });
  });

  it('rejects simulation creation if title or question is missing', async () => {
    const provider = new FixtureMarketSimulationAdapter();
    const router = createMarketSimulationRouter({ provider });

    const req: any = { method: 'POST', url: '/simulations', body: { title: 'Pricing Scenario' } };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/simulations');
    await layer.route.stack[layer.route.stack.length - 1].handle(req, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('required');
  });

  it('creates simulation and generates report via fixture adapter', async () => {
    const provider = new FixtureMarketSimulationAdapter();
    const router = createMarketSimulationRouter({ provider });

    const req: any = {
      method: 'POST',
      url: '/simulations',
      body: {
        title: 'Competitor 20% Price Drop Response',
        question: 'How will enterprise and mid-market buyers react to rival price cut?',
        evidenceSnapshotIds: ['snap-123'],
        assumptions: ['Stable macroeconomic conditions'],
        excludedDataClasses: ['crm_pii'],
      },
    };
    const res = createMockRes();

    const layer = (router as any).stack.find((s: any) => s.route?.path === '/simulations');
    await layer.route.stack[layer.route.stack.length - 1].handle(req, res, () => {});

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.ref.provider).toBe('mirofish');
    expect(res.jsonData.report).toBeDefined();
    expect(res.jsonData.report.simulatedPersonas.length).toBeGreaterThan(0);
    expect(res.jsonData.report.suggestedExperiments.length).toBeGreaterThan(0);
  });
});
