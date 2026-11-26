import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSocialMentionsRouter } from './socialMentionsRoutes.js';

// Fake Supabase table builder (same shape the competitors tests use).
function makeSb(cfg: Record<string, { data?: any; error?: any }> = {}) {
  const ops: Array<{ m: string; args: any[] }> = [];
  const make = (result: { data?: any; error?: any }) => {
    const b: any = {};
    for (const m of ['select', 'order', 'eq', 'insert', 'delete', 'single', 'limit']) {
      b[m] = (...args: any[]) => {
        ops.push({ m, args });
        return b;
      };
    }
    b.then = (onF: any, onR: any) => Promise.resolve(result).then(onF, onR);
    return b;
  };
  const from = vi.fn((table: string) => {
    ops.push({ m: 'from', args: [table] });
    return make(cfg[table] ?? { data: undefined, error: null });
  });
  return { sb: { from }, ops, from };
}

function makeRequireModule(enabled: string[] = ['social']) {
  return (mod: string) => (_req: any, res: any, next: any) => {
    if (!enabled.includes(mod)) {
      res.status(403).json({ error: `Your current plan does not include the "${mod}" module.`, moduleKey: mod });
      return;
    }
    next();
  };
}

function makeDeps(overrides: any = {}) {
  const genCalls: any[] = [];
  return {
    ...{
      requireModule: makeRequireModule() as any,
      getGeminiClient: vi.fn(() => ({
        models: {
          generateContent: async (req: any) => {
            genCalls.push(req);
            return { text: JSON.stringify({ sentiment: 'Positive' }) };
          },
        },
      })),
      resolveEffectiveGeminiKey: vi.fn(async () => 'workspace-key'),
      resolveEffectiveGeminiModel: vi.fn(async () => 'test-model'),
    },
    ...overrides,
    _genCalls: genCalls,
  };
}

function makeRes(sb: any, wsId = 'ws-1') {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: { sb, wsId, userId: 'user-1' },
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

// Routes carry the injected requireModule gate as their first layer, so walk
// the route stack manually and await any async layer's promise.
async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find(
    (s: any) => s.route?.path === path && s.route?.methods?.[method.toLowerCase()],
  );
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  const stack = layer.route.stack;
  for (let i = 0; i < stack.length; i++) {
    let nextCalled = false;
    const maybeP = stack[i].handle(req, res, () => {
      nextCalled = true;
    });
    if (maybeP && typeof maybeP.then === 'function') await maybeP;
    if (!nextCalled) return;
  }
}

describe('Social Mentions Routes', () => {
  const savedKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
  });
  afterEach(() => {
    if (savedKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = savedKey;
  });

  it('fail-closed tier gate: 403 when the social module is not entitled', async () => {
    const { sb } = makeSb();
    const router = createSocialMentionsRouter(makeDeps({ requireModule: makeRequireModule([]) }));
    const res = makeRes(sb);
    await invoke(router, 'GET', '/', { method: 'GET', url: '/social-mentions', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(403);
  });

  it('GET / lists mentions, capped at 200 (200) and 500 on table error', async () => {
    const sbx = makeSb({ social_mentions: { data: [{ id: 'm1' }, { id: 'm2' }], error: null } });
    const router = createSocialMentionsRouter(makeDeps());
    const res = makeRes(sbx.sb);
    await invoke(router, 'GET', '/', { method: 'GET', url: '/social-mentions', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.mentions).toHaveLength(2);
    // the limit(200) call is part of the read contract:
    expect(sbx.ops.some((o: any) => o.m === 'limit' && o.args[0] === 200)).toBe(true);

    const bad = makeSb({ social_mentions: { data: null, error: new Error('db down') } });
    const router2 = createSocialMentionsRouter(makeDeps());
    const res2 = makeRes(bad.sb);
    await invoke(router2, 'GET', '/', { method: 'GET', url: '/social-mentions', params: {}, query: {} }, res2);
    expect(res2.statusCode).toBe(500);
  });

  it('POST / requires platform + text (400)', async () => {
    const { sb } = makeSb();
    const router = createSocialMentionsRouter(makeDeps());
    let res = makeRes(sb);
    await invoke(router, 'POST', '/', { method: 'POST', url: '/social-mentions', params: {}, body: { platform: 'x' } }, res);
    expect(res.statusCode).toBe(400);
    res = makeRes(sb);
    await invoke(router, 'POST', '/', { method: 'POST', url: '/social-mentions', params: {}, body: { platform: 'x', mentionText: '   ' } }, res);
    expect(res.statusCode).toBe(400);
  });

  it('POST / classifies sentiment via Gemini and stores the mention', async () => {
    const sbx = makeSb({ social_mentions: { data: { id: 'm9' }, error: null } });
    const deps = makeDeps();
    const router = createSocialMentionsRouter(deps);
    const res = makeRes(sbx.sb);
    await invoke(
      router, 'POST', '/',
      { method: 'POST', url: '/social-mentions', params: {}, body: { platform: 'LinkedIn', mentionText: '  Great tool!  ', sourceUrl: 'https://x/1', author: 'J' } }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.mention).toEqual({ id: 'm9' });
    const insertOp = sbx.ops.find((o: any) => o.m === 'insert');
    expect(insertOp.args[0]).toMatchObject({
      workspace_id: 'ws-1',
      platform: 'LinkedIn',
      mention_text: 'Great tool!',
      source_url: 'https://x/1',
      author: 'J',
      sentiment: 'Positive', // Gemini classified it
    });
    // and the model used was the resolved workspace model:
    expect(deps._genCalls[0].model).toBe('test-model');
  });

  it('POST / falls back to Neutral when the key is absent (no Gemini call, still 200)', async () => {
    delete process.env.GEMINI_API_KEY;
    const sbx = makeSb({ social_mentions: { data: { id: 'm10' }, error: null } });
    const deps = makeDeps();
    const router = createSocialMentionsRouter(deps);
    const res = makeRes(sbx.sb);
    await invoke(
      router, 'POST', '/',
      { method: 'POST', url: '/social-mentions', params: {}, body: { platform: 'X', mentionText: 'meh' } }, res,
    );
    expect(res.statusCode).toBe(200);
    const insertOp = sbx.ops.find((o: any) => o.m === 'insert');
    expect(insertOp.args[0].sentiment).toBe('Neutral');
    expect(deps._genCalls).toHaveLength(0); // no model call at all
    expect(insertOp.args[0].source_url).toBeNull(); // optional fields default to null
  });

  it('POST / degrades to Neutral (non-fatal) when Gemini classification throws', async () => {
    const sbx = makeSb({ social_mentions: { data: { id: 'm11' }, error: null } });
    const deps = makeDeps({
      getGeminiClient: () => ({ models: { generateContent: async () => { throw new Error('model down'); } } }),
    });
    const router = createSocialMentionsRouter(deps);
    const res = makeRes(sbx.sb);
    await invoke(
      router, 'POST', '/',
      { method: 'POST', url: '/social-mentions', params: {}, body: { platform: 'X', mentionText: 'still saved' } }, res,
    );
    expect(res.statusCode).toBe(200);
    const insertOp = sbx.ops.find((o: any) => o.m === 'insert');
    expect(insertOp.args[0].sentiment).toBe('Neutral');
  });

  it('POST / returns 500 when the insert itself fails', async () => {
    const sbx = makeSb({ social_mentions: { data: null, error: new Error('rls deny') } });
    const router = createSocialMentionsRouter(makeDeps());
    const res = makeRes(sbx.sb);
    await invoke(
      router, 'POST', '/',
      { method: 'POST', url: '/social-mentions', params: {}, body: { platform: 'X', mentionText: 't' } }, res,
    );
    expect(res.statusCode).toBe(500);
  });

  it('DELETE /:id (200) and 500 on error', async () => {
    const ok = makeSb({ social_mentions: { data: true, error: null } });
    let router = createSocialMentionsRouter(makeDeps());
    let res = makeRes(ok.sb);
    await invoke(router, 'DELETE', '/:id', { method: 'DELETE', url: '/social-mentions/m1', params: { id: 'm1' }, body: {} }, res);
    expect(res.statusCode).toBe(200);

    const bad = makeSb({ social_mentions: { data: null, error: new Error('locked') } });
    router = createSocialMentionsRouter(makeDeps());
    res = makeRes(bad.sb);
    await invoke(router, 'DELETE', '/:id', { method: 'DELETE', url: '/social-mentions/m1', params: { id: 'm1' }, body: {} }, res);
    expect(res.statusCode).toBe(500);
  });

  it('factory shape: 3 scoped route layers, each fronted by the injected gate', () => {
    const router: any = createSocialMentionsRouter(makeDeps());
    const routeLayers = router.stack.filter((l: any) => l.route);
    expect(routeLayers).toHaveLength(3);
    for (const l of routeLayers) {
      expect(typeof l.route.stack[0].handle).toBe('function');
      expect(l.route.path).toMatch(/^\/($|:id)$/);
    }
  });
});
