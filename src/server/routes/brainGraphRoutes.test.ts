import { describe, it, expect, beforeEach } from 'vitest';
import { createBrainGraphRouter } from './brainGraphRoutes.js';
import { clearLocalBrainGraph } from '../../lib/brainGraph.js';

function createMockRes(wsId?: string) {
  const res: any = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    locals: wsId ? { wsId, sb: null } : {},
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.jsonData = data;
      return res;
    },
  };
  return res;
}

describe('Brain Graph REST Routes', () => {
  beforeEach(() => {
    clearLocalBrainGraph();
  });

  it('denies requests when workspace context is missing', async () => {
    const router = createBrainGraphRouter();
    const req: any = { method: 'GET', url: '/graph', query: {} };
    const res = createMockRes(undefined);

    const authMiddleware = (router as any).stack[0];
    let nextCalled = false;
    await authMiddleware.handle(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.jsonData).toEqual({ error: 'Workspace context required.' });
  });

  it('compounds an agent learning and returns the updated graph', async () => {
    const wsId = 'ws-test-enclave-route';
    const router = createBrainGraphRouter();

    // 1. POST /compound
    const reqCompound: any = {
      method: 'POST',
      url: '/compound',
      body: {
        vaultId: 'marketing',
        sourceModule: 'performance_ads',
        learningText: 'High converting B2B ad angle for CFO personas',
        entityName: 'CFO Profitability Angle',
        entityType: 'Hook',
        relatedEntityName: 'Finance Leader Persona',
        relatedEntityType: 'Persona',
        relationshipType: 'TARGETS_PERSONA',
      },
    };
    const resCompound = createMockRes(wsId);

    const compoundLayer = (router as any).stack.find((s: any) => s.route?.path === '/compound');
    expect(compoundLayer).toBeDefined();

    await compoundLayer.route.stack[0].handle(reqCompound, resCompound, () => {});
    expect(resCompound.statusCode).toBe(200);
    expect(resCompound.jsonData).toBeDefined();
    expect(resCompound.jsonData.success).toBe(true);
    expect(resCompound.jsonData.primaryEntity.name).toBe('CFO Profitability Angle');
    expect(resCompound.jsonData.relationship.relationType).toBe('TARGETS_PERSONA');

    // 2. GET /graph
    const reqGraph: any = { method: 'GET', url: '/graph', query: {} };
    const resGraph = createMockRes(wsId);

    const graphLayer = (router as any).stack.find((s: any) => s.route?.path === '/graph');
    expect(graphLayer).toBeDefined();

    await graphLayer.route.stack[0].handle(reqGraph, resGraph, () => {});
    expect(resGraph.statusCode).toBe(200);
    expect(resGraph.jsonData.success).toBe(true);
    expect(resGraph.jsonData.entities).toHaveLength(2);
    expect(resGraph.jsonData.relationships).toHaveLength(1);
  });
});
