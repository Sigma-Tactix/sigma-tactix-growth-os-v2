import { describe, it, expect, beforeEach } from 'vitest';
import { createLearningsRouter } from './learningsRoutes.js';
import {
  globalLearningRegistry,
  DEVELOPMENT_LESSON_REGISTRY,
  type ClientLearningEntry,
} from '../../lib/learningRegistry.js';

// The learnings router has no injected deps — it operates on the module-level
// globalLearningRegistry singleton. Clear it between tests for isolation.

// Call the specific route layer directly (same convention as the other
// router tests): router().stack exposes the route layers; Route.handle
// resolves after the full async handler chain settles.
async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find(
    (s: any) => s.route?.path === path && s.route?.methods?.[method.toLowerCase()],
  );
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  await layer.route.stack[0].handle(req, res, () => {});
}

function makeRes(wsId = 'ws-1', userEmail?: string) {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: { sb: {}, wsId, userId: 'user-1', ...(userEmail ? { userEmail } : {}) },
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

function seedLearning(overrides: Partial<ClientLearningEntry> = {}): ClientLearningEntry {
  const entry = globalLearningRegistry.recordClientLearning({
    workspaceId: 'ws-1',
    jobRunId: 'job-1',
    taskTitle: 'Cold outreach positioning',
    category: 'positioning',
    reviewedOutcome: 'worked',
    limitations: '',
    lessonContent: 'Lead with the specific metric, not the buzzword.',
    targetVault: 'Brand Vault',
    author: 'tester',
    ...overrides,
  } as any);
  return entry;
}

describe('Learnings Routes', () => {
  beforeEach(() => {
    globalLearningRegistry.clear();
  });

  it('GET / returns only the caller\'s approved learnings (workspace-isolated)', async () => {
    seedLearning({ status: 'approved' }); // ws-1, approved → included
    seedLearning({ status: 'pending_review' }); // not approved → excluded
    seedLearning({ workspaceId: 'ws-2', status: 'approved' }); // other enclave → excluded
    seedLearning({ taskTitle: 'Pricing experiment', lessonContent: 'Test two price points.', status: 'approved' });

    const router = createLearningsRouter();
    const res = makeRes('ws-1');
    await invoke(router, 'GET', '/', { method: 'GET', url: '/', params: {}, query: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    const titles = res.jsonData.learnings.map((l: any) => l.taskTitle);
    expect(titles).toContain('Cold outreach positioning');
    expect(titles).toContain('Pricing experiment');
    expect(titles).toHaveLength(2); // pending_review + ws-2 entry excluded
  });

  it('POST / records a new client learning (200)', async () => {
    const router = createLearningsRouter();
    const res = makeRes('ws-1');
    await invoke(
      router, 'POST', '/',
      { method: 'POST', url: '/', params: {}, body: { taskTitle: 'SEO test', category: 'authority' } }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.learning.workspaceId).toBe('ws-1');
    expect(res.jsonData.learning.status).toBe('pending_review');
    expect(res.jsonData.learning.author).toBe('Operator');
  });

  it('POST / rejects a learning targeted at the Secret Vault (400 FORBIDDEN_VAULT)', async () => {
    const router = createLearningsRouter();
    const res = makeRes('ws-1');
    await invoke(
      router, 'POST', '/',
      { method: 'POST', url: '/', params: {}, body: { targetVault: 'Secret Vault', taskTitle: 'x' } }, res,
    );
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('FORBIDDEN_VAULT');
  });

  it('GET /development returns the static development-lesson registry', async () => {
    const router = createLearningsRouter();
    const res = makeRes('ws-1');
    await invoke(router, 'GET', '/development', { method: 'GET', url: '/development', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.lessons).toEqual(DEVELOPMENT_LESSON_REGISTRY);
    expect(res.jsonData.lessons.length).toBeGreaterThan(0);
  });

  it('POST /:id/approve moves an entry to approved (200) and 400 on unknown id', async () => {
    const entry = seedLearning();
    const router = createLearningsRouter();

    const ok = makeRes('ws-1');
    await invoke(
      router, 'POST', '/:id/approve',
      { method: 'POST', url: `/learnings/${entry.id}/approve`, params: { id: entry.id }, body: {} }, ok,
    );
    expect(ok.statusCode).toBe(200);
    expect(ok.jsonData.learning.status).toBe('approved');

    const bad = makeRes('ws-1');
    await invoke(
      router, 'POST', '/:id/approve',
      { method: 'POST', url: '/learnings/nope/approve', params: { id: 'nope' }, body: {} }, bad,
    );
    expect(bad.statusCode).toBe(400);
    expect(bad.jsonData.error).toContain('not found');
  });

  it('POST /:id/supersede bumps the version and marks the old entry superseded (200)', async () => {
    const entry = seedLearning();
    globalLearningRegistry.approveLearning(entry.id, 'rev'); // approved first
    const router = createLearningsRouter();

    const res = makeRes('ws-1');
    await invoke(
      router, 'POST', '/:id/supersede',
      { method: 'POST', url: `/learnings/${entry.id}/supersede`, params: { id: entry.id }, body: { lessonContent: 'Corrected text' } }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.learning.version).toBe(2);
    expect(res.jsonData.learning.status).toBe('approved');
    expect(globalLearningRegistry.getById(entry.id)?.status).toBe('superseded');
  });

  it('POST /:id/revoke marks an entry revoked with a default reason (200) and 400 on unknown id', async () => {
    const entry = seedLearning();
    const router = createLearningsRouter();

    const res = makeRes('ws-1');
    await invoke(
      router, 'POST', '/:id/revoke',
      { method: 'POST', url: `/learnings/${entry.id}/revoke`, params: { id: entry.id }, body: {} }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.learning.status).toBe('revoked');

    const bad = makeRes('ws-1');
    await invoke(
      router, 'POST', '/:id/revoke',
      { method: 'POST', url: '/learnings/nope/revoke', params: { id: 'nope' }, body: {} }, bad,
    );
    expect(bad.statusCode).toBe(400);
    expect(bad.jsonData.error).toContain('not found');
  });

  it('router factory shape: 6 scoped layers, static /development registered before /:id/*', () => {
    const router: any = createLearningsRouter();
    const routeLayers = router.stack.filter((l: any) => l.route);
    expect(routeLayers).toHaveLength(6);
    for (const l of routeLayers) {
      expect(l.route.path).toMatch(/^\/(development|:id\/(approve|supersede|revoke))|^\/$/);
    }
    const devIdx = routeLayers.findIndex((l: any) => l.route.path === '/development');
    const paramIdx = routeLayers.findIndex((l: any) => l.route.path === '/:id/approve');
    expect(devIdx).toBeLessThan(paramIdx);
  });
});
