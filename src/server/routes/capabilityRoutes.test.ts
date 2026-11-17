import { describe, expect, it } from 'vitest';
import { createCapabilityRouter } from './capabilityRoutes.js';
import { buildCapabilityRegistry } from '../../lib/capabilityRegistry.js';
import type { WorkspaceData } from '../../types.js';

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

function mockWorkspace(): WorkspaceData {
  return ({
    id: 'ws-cap-test',
    secondBrain: { connectors: [] },
    settings: { technical: { customDomain: '', sslStatus: 'Inactive' }, integrations: [], mcps: [], skills: [] },
  } as unknown) as WorkspaceData;
}
/*
  return {
    id: 'ws-cap-test',
    secondBrain: { connectors: [] },
    settings: { technical: { customDomain: '', sslStatus: 'Inactive' }, integrations: [], mcps: [], skills: [] },
  }
*/

describe('Capability Router (S08)', () => {
  const deps = {
    getWorkspace: async () => mockWorkspace(),
    getDecisionRuntimeStatus: async () => ({
      provider: 'laya' as const,
      configured: true,
      reachable: true,
      state: 'calibrated' as const,
      mode: 'active' as const,
      model: 'auto',
      calibrated: true,
      executionEligible: true,
      checkedAt: new Date().toISOString(),
      detail: 'Laya calibrated and execution-eligible.',
    }),
    getExternalProviderCapabilities: async () => [
      {
        provider: 'tinyfish',
        configured: true,
        verified: true,
        isFixture: true,
        environment: 'test' as const,
        toolVersion: 'tinyfish:0.4.1-fixture',
        detail: 'Fixture adapter active for deterministic testing.',
      },
    ],
    buildCapabilityRegistry,
  };

  it('exposes full registry at GET /', async () => {
    const router = createCapabilityRouter(deps);
    const layer = (router as any).stack.find((s: any) => s.route?.path === '/' && s.route?.methods?.get);
    expect(layer).toBeDefined();

    const req: any = { method: 'GET', url: '/', query: {} };
    const res = createMockRes();

    await layer.route.stack[0].handle(req, res, () => {});
    expect(res.jsonData).toBeDefined();
    expect(Array.isArray(res.jsonData.capabilities)).toBe(true);
    expect(Array.isArray(res.jsonData.operations)).toBe(true);
    expect(res.jsonData.operationsSummary).toBeDefined();
    expect(res.jsonData.operationsSummary.total).toBe(res.jsonData.operations.length);
  });

  it('exposes operation-level capabilities at GET /operations with filtering', async () => {
    const router = createCapabilityRouter(deps);
    const layer = (router as any).stack.find((s: any) => s.route?.path === '/operations' && s.route?.methods?.get);
    expect(layer).toBeDefined();

    const reqAll: any = { method: 'GET', url: '/operations', query: {} };
    const resAll = createMockRes();
    await layer.route.stack[0].handle(reqAll, resAll, () => {});

    expect(resAll.jsonData.total).toBeGreaterThan(0);
    expect(Array.isArray(resAll.jsonData.operations)).toBe(true);

    // Filter by moduleKey
    const reqFiltered: any = { method: 'GET', url: '/operations', query: { moduleKey: 'creative-video' } };
    const resFiltered = createMockRes();
    await layer.route.stack[0].handle(reqFiltered, resFiltered, () => {});

    expect(resFiltered.jsonData.total).toBe(1);
    expect(resFiltered.jsonData.operations[0].id).toBe('creative.video.render');
  });

  it('exposes verification receipts at GET /receipts', async () => {
    const router = createCapabilityRouter(deps);
    const layer = (router as any).stack.find((s: any) => s.route?.path === '/receipts' && s.route?.methods?.get);
    expect(layer).toBeDefined();

    const req: any = { method: 'GET', url: '/receipts', query: {} };
    const res = createMockRes();
    await layer.route.stack[0].handle(req, res, () => {});

    expect(Array.isArray(res.jsonData.receipts)).toBe(true);
    expect(res.jsonData.receipts.length).toBeGreaterThan(0);

    const videoReceipt = res.jsonData.receipts.find((r: any) => r.toolVersion === 'hyperframes:0.8.139');
    expect(videoReceipt).toBeDefined();
    expect(videoReceipt.workspaceId).toBe('ws-cap-test');
    expect(videoReceipt.receiptId).toMatch(/^rcpt-creative-video-render-/);
  });
});
