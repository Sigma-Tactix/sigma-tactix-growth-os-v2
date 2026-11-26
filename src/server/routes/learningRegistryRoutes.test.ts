import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLearningRegistryRouter } from './learningRegistryRoutes.js';

vi.mock('../../lib/learningRegistry.js', () => ({
  globalLearningRegistry: {
    queryScopedLearnings: vi.fn(),
    recordClientLearning: vi.fn(),
    approveLearning: vi.fn(),
    supersedeLearning: vi.fn(),
    revokeLearning: vi.fn(),
  },
  DEVELOPMENT_LESSON_REGISTRY: [{ id: 'lesson-1', title: 'A development lesson' }],
}));
import { globalLearningRegistry, DEVELOPMENT_LESSON_REGISTRY } from '../../lib/learningRegistry.js';

function makeRes(overrides: any = {}) {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: { wsId: 'ws-1', userEmail: 'reviewer@acme.com' },
    ...overrides,
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
  };
  return res;
}

function makeReq(overrides: any = {}) {
  return { method: 'GET', url: '/', params: {}, query: {}, body: {}, ...overrides };
}

// All 6 routes are single-layer handlers (no middleware).
async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find((s: any) => s.route?.path === path && s.route?.methods?.[method.toLowerCase()]);
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  for (const h of layer.route.stack) {
    let nextCalled = false;
    const maybeP = h.handle(req, res, () => { nextCalled = true; });
    if (maybeP && typeof maybeP.then === 'function') await maybeP;
    if (!nextCalled) return;
  }
}

const reg = vi.mocked(globalLearningRegistry as any);

describe('Learning Registry Routes', () => {
  beforeEach(() => {
    reg.queryScopedLearnings.mockClear();
    reg.recordClientLearning.mockClear();
    reg.approveLearning.mockClear();
    reg.supersedeLearning.mockClear();
    reg.revokeLearning.mockClear();
  });

  it('route shape: 6 registrations, each a single [handler] layer', () => {
    const router: any = createLearningRegistryRouter();
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(6);
    for (const l of layers) {
      expect(l.route.path.startsWith('/api/workspace/learnings')).toBe(true);
      expect(l.route.stack).toHaveLength(1);
    }
  });

  it('GET /api/workspace/learnings: forwards the scoped query; vaultScope is comma-split, category/q optional', async () => {
    reg.queryScopedLearnings.mockReturnValue([]);
    const router = createLearningRegistryRouter();

    // all three params
    let res = makeRes();
    await invoke(router, 'GET', '/api/workspace/learnings',
      makeReq({ url: '/api/workspace/learnings', query: { category: 'positioning', q: 'roi', vaultScope: 'Brand Vault,Customer Vault' } }), res);
    expect(res.jsonData).toEqual({ success: true, learnings: [] });
    expect(reg.queryScopedLearnings).toHaveBeenCalledWith('ws-1', {
      category: 'positioning', query: 'roi', vaultScope: ['Brand Vault', 'Customer Vault'],
    });

    // minimal: no vaultScope → undefined, not an empty array
    reg.queryScopedLearnings.mockReturnValue([]);
    res = makeRes();
    await invoke(router, 'GET', '/api/workspace/learnings', makeReq({ url: '/api/workspace/learnings', query: {} }), res);
    expect(reg.queryScopedLearnings).toHaveBeenCalledWith('ws-1', { category: undefined, query: undefined, vaultScope: undefined });
  });

  it('POST /api/workspace/learnings: applies the defaults (manual- jobRunId, positioning, Brand Vault, the requester as author)', async () => {
    reg.recordClientLearning.mockReturnValue({ id: 'learn-1' });
    const router = createLearningRegistryRouter();
    const res = makeRes();
    await invoke(router, 'POST', '/api/workspace/learnings', makeReq({ method: 'POST', body: {} }), res);
    expect(res.jsonData).toEqual({ success: true, learning: { id: 'learn-1' } });
    const payload = reg.recordClientLearning.mock.calls[0][0];
    expect(payload.workspaceId).toBe('ws-1');
    expect(payload.jobRunId).toMatch(/^manual-\d+$/);
    expect(payload.taskTitle).toBe('Operator Learning');
    expect(payload.category).toBe('positioning');
    expect(payload.targetVault).toBe('Brand Vault');
    expect(payload.author).toBe('reviewer@acme.com'); // res.locals.userEmail, not the hardcoded fallback

    // a thrown lib error is an honest 400 with the message
    reg.recordClientLearning.mockImplementation(() => { throw new Error('duplicate learning id'); });
    const res2 = makeRes();
    await invoke(router, 'POST', '/api/workspace/learnings', makeReq({ method: 'POST', body: {} }), res2);
    expect(res2.statusCode).toBe(400);
    expect(res2.jsonData.error).toBe('duplicate learning id');
  });

  it('POST /api/workspace/learnings/:id/approve: the reviewer falls back to body.reviewer, then the hardcoded Lead Reviewer', async () => {
    reg.approveLearning.mockReturnValue({ id: 'l', approved: true });
    const router = createLearningRegistryRouter();

    let res = makeRes({ locals: { wsId: 'ws-1', userEmail: 'owner@acme.com' } });
    await invoke(router, 'POST', '/api/workspace/learnings/:id/approve', makeReq({ method: 'POST', params: { id: 'l' }, body: {} }), res);
    expect(reg.approveLearning).toHaveBeenCalledWith('l', 'owner@acme.com');

    // no res.locals.userEmail → body.reviewer
    res = makeRes({ locals: { wsId: 'ws-1' } });
    await invoke(router, 'POST', '/api/workspace/learnings/:id/approve', makeReq({ method: 'POST', params: { id: 'l' }, body: { reviewer: 'second@acme.com' } }), res);
    expect(reg.approveLearning).toHaveBeenCalledWith('l', 'second@acme.com');

    // no email, no body → the hardcoded fallback
    res = makeRes({ locals: { wsId: 'ws-1' } });
    await invoke(router, 'POST', '/api/workspace/learnings/:id/approve', makeReq({ method: 'POST', params: { id: 'l' }, body: {} }), res);
    expect(reg.approveLearning).toHaveBeenCalledWith('l', 'Lead Reviewer');

    reg.approveLearning.mockImplementation(() => { throw new Error('learning not found'); });
    const res400 = makeRes();
    await invoke(router, 'POST', '/api/workspace/learnings/:id/approve', makeReq({ method: 'POST', params: { id: 'ghost' }, body: {} }), res400);
    expect(res400.statusCode).toBe(400);
    expect(res400.jsonData.error).toBe('learning not found');
  });

  it('POST /api/workspace/learnings/:id/supersede: the WHOLE body is forwarded to the lib; res.locals.userEmail wins over body.reviewer for the reviewer arg', async () => {
    reg.supersedeLearning.mockReturnValue({ id: 'l', supersededBy: 'n' });
    const router = createLearningRegistryRouter();

    // reviewer arg: res.locals.userEmail is preferred over body.reviewer
    let res = makeRes(); // locals.userEmail = 'reviewer@acme.com'
    const body = { supersedeWith: 'n', reviewer: 'ops@acme.com' };
    await invoke(router, 'POST', '/api/workspace/learnings/:id/supersede', makeReq({ method: 'POST', params: { id: 'l' }, body }), res);
    expect(res.jsonData).toEqual({ success: true, learning: { id: 'l', supersededBy: 'n' } });
    expect(reg.supersedeLearning).toHaveBeenCalledWith('l', body, 'reviewer@acme.com');

    // no res.locals.userEmail → body.reviewer is the reviewer arg
    res = makeRes({ locals: { wsId: 'ws-1' } });
    await invoke(router, 'POST', '/api/workspace/learnings/:id/supersede', makeReq({ method: 'POST', params: { id: 'l' }, body }), res);
    expect(reg.supersedeLearning).toHaveBeenCalledWith('l', body, 'ops@acme.com');
  });

  it('POST /api/workspace/learnings/:id/revoke: the reason default is the operator-supersession message', async () => {
    reg.revokeLearning.mockReturnValue({ id: 'l', revoked: true });
    const router = createLearningRegistryRouter();

    let res = makeRes();
    await invoke(router, 'POST', '/api/workspace/learnings/:id/revoke', makeReq({ method: 'POST', params: { id: 'l' }, body: {} }), res);
    expect(reg.revokeLearning).toHaveBeenCalledWith('l', 'reviewer@acme.com', 'Superseded or invalidated by operator');

    res = makeRes();
    await invoke(router, 'POST', '/api/workspace/learnings/:id/revoke', makeReq({ method: 'POST', params: { id: 'l' }, body: { reason: 'outdated' } }), res);
    expect(reg.revokeLearning).toHaveBeenLastCalledWith('l', 'reviewer@acme.com', 'outdated');
  });

  it('GET /api/workspace/learnings/development: returns the development lesson registry verbatim', async () => {
    const router = createLearningRegistryRouter();
    const res = makeRes();
    await invoke(router, 'GET', '/api/workspace/learnings/development', makeReq({ url: '/api/workspace/learnings/development' }), res);
    expect(res.jsonData).toEqual({ success: true, lessons: DEVELOPMENT_LESSON_REGISTRY });
    expect(res.jsonData.lessons).toHaveLength(1);
  });
});
