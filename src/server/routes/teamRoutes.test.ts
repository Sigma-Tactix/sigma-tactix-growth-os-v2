import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTeamRouter } from './teamRoutes.js';

// sendEmail is a direct import inside the team router (invite emails).
vi.mock('../../lib/email.js', () => ({
  sendEmail: vi.fn(async () => ({ sent: true })),
}));

import { sendEmail } from '../../lib/email.js';

// The team routes run through res.locals.sb (RPCs + table builders). The
// Supabase QueryBuilder is thenable, so the fake `from`/`rpc` chains below
// resolve via .then() just like the real client.
function chain(result: { data?: any; error?: any }) {
  const b: any = {};
  for (const m of ['select', 'eq', 'order', 'upsert', 'delete', 'single', 'in', 'insert', 'update']) {
    b[m] = () => b;
  }
  b.then = (onF: any, onR: any) => Promise.resolve(result).then(onF, onR);
  b.catch = (fn: any) => Promise.resolve(result).catch(fn);
  return b;
}

function makeSb(cfg: {
  teamData?: any;
  teamError?: any;
  invitesData?: any;
  rpc?: (fn: string, args: any) => { data?: any; error?: any };
}) {
  const from = vi.fn(() =>
    chain(
      cfg.invitesData !== undefined
        ? { data: cfg.invitesData, error: null }
        : { data: undefined, error: null },
    ),
  );
  // route-specific rpc results:
  const rpcFn = vi.fn(async (fnName: string, _args: any) => {
    if (fnName === 'get_workspace_team') return { data: cfg.teamData ?? [], error: cfg.teamError ?? null };
    return cfg.rpc ? cfg.rpc(fnName, _args) : { data: true, error: null };
  });
  return { sb: { from, rpc: rpcFn }, from, rpc: rpcFn };
}

async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find(
    (s: any) => s.route?.path === path && s.route?.methods?.[method.toLowerCase()],
  );
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  await layer.route.stack[0].handle(req, res, () => {});
}

function makeRes(sb: any, wsId = 'ws-1') {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: { sb, wsId, userId: 'user-1', userEmail: 'me@acme.test' },
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

function makeRouter(ownerOrAdmin: boolean, getDbReturn?: any) {
  const getDB = vi.fn(async () => getDbReturn ?? { secondBrain: { brandVault: { brandSlogan: 'Acme' } } } as any);
  const callerIsOwnerOrAdmin = vi.fn(async () => ownerOrAdmin);
  return { router: createTeamRouter({ getDB, callerIsOwnerOrAdmin } as any), getDB, callerIsOwnerOrAdmin };
}

beforeEach(() => {
  vi.mocked(sendEmail).mockClear();
});

describe('Team Routes', () => {
  it('GET / lists members and pending invitations (200)', async () => {
    const members = [{ user_id: 'u1', role: 'owner' }];
    const { sb } = makeSb({ teamData: members, invitesData: [{ id: 'inv-1', email: 'a@b.c' }] });
    const { router } = makeRouter(true);
    const res = makeRes(sb);
    await invoke(router, 'GET', '/', { method: 'GET', url: '/team', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.members).toEqual(members);
    expect(res.jsonData.pendingInvitations).toHaveLength(1);
  });

  it('GET / returns 500 when the team RPC fails', async () => {
    const { sb } = makeSb({ teamError: new Error('rpc down') });
    const { router } = makeRouter(true);
    const res = makeRes(sb);
    await invoke(router, 'GET', '/', { method: 'GET', url: '/team', params: {}, query: {} }, res);
    expect(res.statusCode).toBe(500);
  });

  it('POST /invite returns 403 for a non-owner/admin caller', async () => {
    const { sb } = makeSb({});
    const { router, callerIsOwnerOrAdmin } = makeRouter(false);
    const res = makeRes(sb);
    await invoke(router, 'POST', '/invite', { method: 'POST', url: '/team/invite', params: {}, body: { email: 'a@b.c', role: 'member' } }, res);
    expect(res.statusCode).toBe(403);
    expect(callerIsOwnerOrAdmin).toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('POST /invite validates email + role before persisting (400)', async () => {
    const { sb } = makeSb({});
    const { router } = makeRouter(true);
    let res = makeRes(sb);
    await invoke(router, 'POST', '/invite', { method: 'POST', url: '/team/invite', params: {}, body: { email: 'not-an-email', role: 'member' } }, res);
    expect(res.statusCode).toBe(400);
    res = makeRes(sb);
    await invoke(router, 'POST', '/invite', { method: 'POST', url: '/team/invite', params: {}, body: { email: 'a@b.c', role: 'owner' } }, res);
    expect(res.statusCode).toBe(400); // 'owner' not allowed through this endpoint
  });

  it('POST /invite creates the invitation and sends the email (200)', async () => {
    const { sb } = makeSb({});
    const { router, getDB } = makeRouter(true, { secondBrain: { brandVault: { brandSlogan: 'Acme' } } });
    const res = makeRes(sb);
    await invoke(router, 'POST', '/invite', { method: 'POST', url: '/team/invite', params: {}, body: { email: ' Jane@Corp.COM ', role: 'ADMIN' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(getDB).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const emailArg = vi.mocked(sendEmail).mock.calls[0][0];
    expect(emailArg.to).toBe('jane@corp.com'); // trimmed + lowercased
    expect(emailArg.subject).toContain('Acme');
    expect(emailArg.html).toContain('as a <strong>admin</strong>'); // role normalized
    expect(res.jsonData.emailSent).toBe(true);
  });

  it('DELETE /invite/:id revokes an invitation (200) and 403 for non-owner', async () => {
    const { sb } = makeSb({});
    const { router } = makeRouter(true);
    let res = makeRes(sb);
    await invoke(router, 'DELETE', '/invite/:id', { method: 'DELETE', url: '/team/invite/inv-9', params: { id: 'inv-9' }, body: {} }, res);
    expect(res.statusCode).toBe(200);
    res = makeRes(sb);
    const { router: r2 } = makeRouter(false);
    await invoke(r2, 'DELETE', '/invite/:id', { method: 'DELETE', url: '/team/invite/inv-9', params: { id: 'inv-9' }, body: {} }, res);
    expect(res.statusCode).toBe(403);
  });

  it('POST /accept requires a token and rejects an invalid one (400)', async () => {
    const { sb } = makeSb({});
    const { router } = makeRouter(true);
    let res = makeRes(sb);
    await invoke(router, 'POST', '/accept', { method: 'POST', url: '/team/accept', params: {}, body: {} }, res);
    expect(res.statusCode).toBe(400);

    const { sb: sbBad } = makeSb({ rpc: (fn) => (fn === 'accept_workspace_invitation' ? { data: null, error: null } : { data: true, error: null }) });
    res = makeRes(sbBad);
    await invoke(router, 'POST', '/accept', { method: 'POST', url: '/team/accept', params: {}, body: { token: 'bad-token' } }, res);
    expect(res.statusCode).toBe(400);
  });

  it('POST /accept succeeds when the RPC accepts the token (200)', async () => {
    const { sb } = makeSb({ rpc: (fn) => (fn === 'accept_workspace_invitation' ? { data: { ok: true }, error: null } : { data: true, error: null }) });
    const { router } = makeRouter(true);
    const res = makeRes(sb);
    await invoke(router, 'POST', '/accept', { method: 'POST', url: '/team/accept', params: {}, body: { token: 'good' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  it('POST /role validates input and gates on the RPC result', async () => {
    const { router } = makeRouter(true);
    const { sb } = makeSb({});
    let res = makeRes(sb);
    await invoke(router, 'POST', '/role', { method: 'POST', url: '/team/role', params: {}, body: { userId: '', role: 'member' } }, res);
    expect(res.statusCode).toBe(400);

    // RPC returns falsy (owner cannot be re-roled / not owner) → 403
    const { sb: sbNo } = makeSb({ rpc: (fn) => (fn === 'update_member_role' ? { data: null, error: null } : { data: true, error: null }) });
    res = makeRes(sbNo);
    await invoke(router, 'POST', '/role', { method: 'POST', url: '/team/role', params: {}, body: { userId: 'u2', role: 'admin' } }, res);
    expect(res.statusCode).toBe(403);

    const { sb: sbOk } = makeSb({ rpc: (fn) => (fn === 'update_member_role' ? { data: true, error: null } : { data: true, error: null }) });
    res = makeRes(sbOk);
    await invoke(router, 'POST', '/role', { method: 'POST', url: '/team/role', params: {}, body: { userId: 'u2', role: 'admin' } }, res);
    expect(res.statusCode).toBe(200);
  });

  it('DELETE /member/:userId removes a member (200) and 403 when the RPC denies it', async () => {
    const { sb } = makeSb({ rpc: (fn) => (fn === 'remove_workspace_member' ? { data: true, error: null } : { data: true, error: null }) });
    const { router } = makeRouter(true);
    let res = makeRes(sb);
    await invoke(router, 'DELETE', '/member/:userId', { method: 'DELETE', url: '/team/member/u2', params: { userId: 'u2' }, body: {} }, res);
    expect(res.statusCode).toBe(200);

    const { sb: sbNo } = makeSb({ rpc: (fn) => (fn === 'remove_workspace_member' ? { data: null, error: null } : { data: true, error: null }) });
    res = makeRes(sbNo);
    await invoke(router, 'DELETE', '/member/:userId', { method: 'DELETE', url: '/team/member/owner', params: { userId: 'owner' }, body: {} }, res);
    expect(res.statusCode).toBe(403);
  });

  it('factory shape: 7 scoped route layers under the team mount', () => {
    const { router } = makeRouter(true);
    const routeLayers = (router as any).stack.filter((l: any) => l.route);
    expect(routeLayers).toHaveLength(7);
    const paths = routeLayers.map((l: any) => l.route.path);
    for (const p of paths) {
      expect(p).toMatch(/^\/($|invite|invite\/:id|accept|pending-invitations|role|member\/:userId)$/);
    }
  });
});
