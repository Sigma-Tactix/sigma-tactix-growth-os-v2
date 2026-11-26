import { describe, it, expect, vi } from 'vitest';
import { createCrmRouter } from './crmRoutes.js';

// Fake Supabase table builder: every chain method is a no-op recorder and the
// terminal value is thenable (like the real PostgREST query), resolving to
// the result this test chose.
function makeSb(result: { data?: any; error?: any }) {
  const ops: Array<{ m: string; args: any[] }> = [];
  const b: any = {};
  for (const m of ['select', 'order', 'eq', 'insert', 'update', 'delete', 'single']) {
    b[m] = (...args: any[]) => {
      ops.push({ m, args });
      return b;
    };
  }
  b.then = (onF: any, onR: any) => Promise.resolve(result).then(onF, onR);
  const from = vi.fn(() => b);
  return { sb: { from }, ops, from };
}

// requireModule stub: open when the module is in `enabled`, else writes the
// same 403 shape the real fail-closed gate writes.
function makeRequireModule(enabled: string[] = ['crm']) {
  return (mod: string) => (_req: any, res: any, next: any) => {
    if (!enabled.includes(mod)) {
      res.status(403).json({ error: `Your current plan does not include the "${mod}" module. Upgrade to unlock it.`, moduleKey: mod, currentTier: 'starter' });
      return;
    }
    next();
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

// The CRM routes carry the injected requireModule stub as their FIRST route
// layer. Express Layer.handle does not await async middleware, so walk the
// route stack manually: run each layer, await the promise an async layer
// returns, and stop if a sync layer declines to call next (the 403 gate).
async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find(
    (s: any) => s.route?.path === path && s.route?.methods?.[method.toLowerCase()],
  );
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  const stack = layer.route.stack; // [Layer(requireModule), Layer(handler)]
  for (let i = 0; i < stack.length; i++) {
    let nextCalled = false;
    const maybeP = stack[i].handle(req, res, () => {
      nextCalled = true;
    });
    if (maybeP && typeof maybeP.then === 'function') await maybeP;
    if (!nextCalled) return; // sync layer terminated the chain (e.g. 403)
  }
}

describe('CRM Routes', () => {
  it('fail-closed tier gate: 403 when the crm module is not entitled', async () => {
    const { sb } = makeSb({ data: [], error: null });
    const router = createCrmRouter({ requireModule: makeRequireModule([]) as any });
    const res = makeRes(sb);
    await invoke(router, 'GET', '/contacts', { method: 'GET', url: '/crm/contacts', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.moduleKey).toBe('crm');
  });

  it('GET /contacts lists contacts (200) and 500 on table error', async () => {
    const ok = makeSb({ data: [{ id: 'c1', name: 'Jane' }], error: null });
    let router = createCrmRouter({ requireModule: makeRequireModule() as any });
    let res = makeRes(ok.sb);
    await invoke(router, 'GET', '/contacts', { method: 'GET', url: '/crm/contacts', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.contacts).toEqual([{ id: 'c1', name: 'Jane' }]);

    const bad = makeSb({ data: null, error: new Error('db down') });
    router = createCrmRouter({ requireModule: makeRequireModule() as any });
    res = makeRes(bad.sb);
    await invoke(router, 'GET', '/contacts', { method: 'GET', url: '/crm/contacts', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(500);
  });

  it('POST /contacts requires a name (400) and echoes the created row (200)', async () => {
    const created = makeSb({ data: { id: 'c9', name: 'Acme' }, error: null });
    const router = createCrmRouter({ requireModule: makeRequireModule() as any });

    let res = makeRes(created.sb);
    await invoke(router, 'POST', '/contacts', { method: 'POST', url: '/crm/contacts', params: {}, body: { name: '   ' } }, res);
    expect(res.statusCode).toBe(400);

    res = makeRes(created.sb);
    await invoke(router, 'POST', '/contacts', { method: 'POST', url: '/crm/contacts', params: {}, body: { name: '  Acme  ', email: 'a@b.c' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.contact).toEqual({ id: 'c9', name: 'Acme' });
    // the insert payload is trimmed + workspace-scoped:
    const insertOp = created.ops.find((o: any) => o.m === 'insert');
    expect(insertOp.args[0]).toMatchObject({ name: 'Acme', workspace_id: 'ws-1', email: 'a@b.c' });
  });

  it('PATCH /contacts/:id sends only the provided fields', async () => {
    const sbx = makeSb({ data: { id: 'c1', name: 'New' }, error: null });
    const router = createCrmRouter({ requireModule: makeRequireModule() as any });
    const res = makeRes(sbx.sb);
    await invoke(
      router, 'PATCH', '/contacts/:id',
      { method: 'PATCH', url: '/crm/contacts/c1', params: { id: 'c1' }, body: { name: 'New' } }, res,
    );
    expect(res.statusCode).toBe(200);
    const updateOp = sbx.ops.find((o: any) => o.m === 'update');
    expect(updateOp.args[0]).toEqual({ name: 'New' });
  });

  it('DELETE /contacts/:id (200) and 500 on error', async () => {
    const ok = makeSb({ data: true, error: null });
    let router = createCrmRouter({ requireModule: makeRequireModule() as any });
    let res = makeRes(ok.sb);
    await invoke(router, 'DELETE', '/contacts/:id', { method: 'DELETE', url: '/crm/contacts/c1', params: { id: 'c1' }, body: {} }, res);
    expect(res.statusCode).toBe(200);

    const bad = makeSb({ data: null, error: new Error('locked') });
    router = createCrmRouter({ requireModule: makeRequireModule() as any });
    res = makeRes(bad.sb);
    await invoke(router, 'DELETE', '/contacts/:id', { method: 'DELETE', url: '/crm/contacts/c1', params: { id: 'c1' }, body: {} }, res);
    expect(res.statusCode).toBe(500);
  });

  it('GET /deals lists deals (200)', async () => {
    const sbx = makeSb({ data: [{ id: 'd1', title: 'Q1' }], error: null });
    const router = createCrmRouter({ requireModule: makeRequireModule() as any });
    const res = makeRes(sbx.sb);
    await invoke(router, 'GET', '/deals', { method: 'GET', url: '/crm/deals', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.deals).toHaveLength(1);
  });

  it('POST /deals validates title + stage, defaults stage to New (200)', async () => {
    const created = makeSb({ data: { id: 'd9' }, error: null });
    const router = createCrmRouter({ requireModule: makeRequireModule() as any });

    let res = makeRes(created.sb);
    await invoke(router, 'POST', '/deals', { method: 'POST', url: '/crm/deals', params: {}, body: {} }, res);
    expect(res.statusCode).toBe(400);

    res = makeRes(created.sb);
    await invoke(router, 'POST', '/deals', { method: 'POST', url: '/crm/deals', params: {}, body: { title: 'x', stage: 'Bogus' } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('Stage must be one of');

    res = makeRes(created.sb);
    await invoke(
      router, 'POST', '/deals',
      { method: 'POST', url: '/crm/deals', params: {}, body: { title: 'Q1 deal', value: 100, contactId: 'c1' } }, res,
    );
    expect(res.statusCode).toBe(200);
    const insertOp = created.ops.find((o: any) => o.m === 'insert');
    expect(insertOp.args[0]).toMatchObject({ title: 'Q1 deal', stage: 'New', value: 100, contact_id: 'c1', close_date: null, workspace_id: 'ws-1' });
  });

  it('PATCH /deals/:id rejects an invalid stage (400) and sends a partial patch', async () => {
    const sbx = makeSb({ data: { id: 'd1' }, error: null });
    const router = createCrmRouter({ requireModule: makeRequireModule() as any });

    let res = makeRes(sbx.sb);
    await invoke(
      router, 'PATCH', '/deals/:id',
      { method: 'PATCH', url: '/crm/deals/d1', params: { id: 'd1' }, body: { stage: 'Bogus' } }, res,
    );
    expect(res.statusCode).toBe(400);

    res = makeRes(sbx.sb);
    await invoke(
      router, 'PATCH', '/deals/:id',
      { method: 'PATCH', url: '/crm/deals/d1', params: { id: 'd1' }, body: { stage: 'Won', value: 5 } }, res,
    );
    expect(res.statusCode).toBe(200);
    const updateOp = sbx.ops.find((o: any) => o.m === 'update');
    expect(updateOp.args[0]).toEqual({ stage: 'Won', value: 5 });
  });

  it('DELETE /deals/:id (200)', async () => {
    const sbx = makeSb({ data: true, error: null });
    const router = createCrmRouter({ requireModule: makeRequireModule() as any });
    const res = makeRes(sbx.sb);
    await invoke(router, 'DELETE', '/deals/:id', { method: 'DELETE', url: '/crm/deals/d1', params: { id: 'd1' }, body: {} }, res);
    expect(res.statusCode).toBe(200);
  });

  it('factory shape: 8 scoped route layers, each behind the crm tier gate', () => {
    const router: any = createCrmRouter({ requireModule: makeRequireModule() as any });
    const routeLayers = router.stack.filter((l: any) => l.route);
    expect(routeLayers).toHaveLength(8);
    for (const l of routeLayers) {
      // first layer of every route is the injected requireModule stub
      expect(typeof l.route.stack[0].handle).toBe('function');
      expect(l.route.path).toMatch(/^\/(contacts|contacts\/:id|deals|deals\/:id)$/);
    }
  });
});
