import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWorkspaceManageRouter } from './workspaceManageRoutes.js';
import { CallerNotOwnerOrAdminError } from '../../lib/workspaceManage.js';

vi.mock('../../lib/workspaceManage.js', () => ({
  listMemberWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  assertOwnerOrAdminOfDefault: vi.fn(),
  CallerNotOwnerOrAdminError: class extends Error {
    constructor() {
      super('Caller is not an owner or admin of the default workspace.');
      this.name = 'CallerNotOwnerOrAdminError';
    }
  },
}));
vi.mock('../../lib/workspaceStore.js', () => ({
  saveWorkspace: vi.fn(),
}));

import {
  listMemberWorkspaces,
  createWorkspace,
  assertOwnerOrAdminOfDefault,
} from '../../lib/workspaceManage.js';
import { saveWorkspace } from '../../lib/workspaceStore.js';

// Call the specific route layer directly (same convention as the other
// router tests): router().stack exposes the route layers; Route.handle
// resolves after the full async handler chain settles.
async function invoke(route: any, req: any, res: any) {
  const layer = route.stack.find(
    (s: any) => s.route?.path === '/' && s.route?.methods?.[req.method.toLowerCase()],
  );
  expect(layer, 'route layer for ' + req.method + ' /').toBeDefined();
  await layer.route.stack[0].handle(req, res, () => {});
}

function createMockRes(sb: unknown = {}, userId = 'user-1') {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: { sb, userId },
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

function createMockReq(body: unknown = {}, method = 'GET') {
  return { method, url: '/', body, query: {} } as any;
}

describe('Workspace Manage Routes', () => {
  beforeEach(() => {
    vi.mocked(listMemberWorkspaces).mockReset();
    vi.mocked(createWorkspace).mockReset();
    vi.mocked(assertOwnerOrAdminOfDefault).mockReset();
    vi.mocked(saveWorkspace).mockReset();
  });

  it('GET / lists member workspaces with the empty-template seed policy', async () => {
    vi.mocked(listMemberWorkspaces).mockResolvedValue({
      workspaces: [{ id: 'ws-1', name: 'Acme' }],
      defaultWorkspaceId: 'ws-1',
    } as any);

    const router = createWorkspaceManageRouter();
    const res = createMockRes();
    await invoke(router, createMockReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      workspaces: [{ id: 'ws-1', name: 'Acme' }],
      defaultWorkspaceId: 'ws-1',
      seedPolicy: 'empty-template',
    });
  });

  it('GET / returns 500 when the workspace list fails', async () => {
    vi.mocked(listMemberWorkspaces).mockRejectedValue(new Error('boom'));
    const router = createWorkspaceManageRouter();
    const res = createMockRes();
    await invoke(router, createMockReq(), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.error).toContain('boom');
  });

  it('POST / rejects a missing workspace name with 400', async () => {
    const router = createWorkspaceManageRouter();
    const res = createMockRes();
    await invoke(router, createMockReq({ name: '   ' }, 'POST'), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('name is required');
  });

  it('POST / returns 403 for a caller who is not owner/admin of the default workspace', async () => {
    vi.mocked(assertOwnerOrAdminOfDefault).mockRejectedValue(new CallerNotOwnerOrAdminError());
    const router = createWorkspaceManageRouter();
    const res = createMockRes();
    await invoke(router, createMockReq({ name: 'Acme' }, 'POST'), res);
    expect(res.statusCode).toBe(403);
    expect(res.jsonData.error).toBe('Owner or admin required.');
  });

  it('POST / creates the enclave (201) and seeds a provided onboarding profile', async () => {
    vi.mocked(assertOwnerOrAdminOfDefault).mockResolvedValue(undefined as any);
    vi.mocked(createWorkspace).mockResolvedValue({
      id: 'ws-2',
      name: 'Acme',
      owner_id: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
    } as any);
    vi.mocked(saveWorkspace).mockResolvedValue(undefined as any);

    const router = createWorkspaceManageRouter();
    const res = createMockRes();
    await invoke(router, createMockReq({ name: 'Acme', profile: { icp: 'Dental clinics' } }, 'POST'), res);

    expect(res.statusCode).toBe(201);
    expect(res.jsonData).toMatchObject({ id: 'ws-2', empty: false, role: 'owner' });
    expect(saveWorkspace).toHaveBeenCalledTimes(1);
  });

  it('POST / reports empty=true when no profile is supplied', async () => {
    vi.mocked(assertOwnerOrAdminOfDefault).mockResolvedValue(undefined as any);
    vi.mocked(createWorkspace).mockResolvedValue({
      id: 'ws-3',
      name: 'Bolt',
      owner_id: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
    } as any);

    const router = createWorkspaceManageRouter();
    const res = createMockRes();
    await invoke(router, createMockReq({ name: 'Bolt' }, 'POST'), res);

    expect(res.statusCode).toBe(201);
    expect(res.jsonData.empty).toBe(true);
    expect(saveWorkspace).not.toHaveBeenCalled();
  });

  it('POST / returns 500 when workspace creation fails', async () => {
    vi.mocked(assertOwnerOrAdminOfDefault).mockResolvedValue(undefined as any);
    vi.mocked(createWorkspace).mockRejectedValue(new Error('db down'));
    const router = createWorkspaceManageRouter();
    const res = createMockRes();
    await invoke(router, createMockReq({ name: 'Acme' }, 'POST'), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.error).toContain('db down');
  });
});
