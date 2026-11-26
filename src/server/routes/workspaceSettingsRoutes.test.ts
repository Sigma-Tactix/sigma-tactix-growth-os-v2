import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWorkspaceSettingsRouter } from './workspaceSettingsRoutes.js';

// The verify-domain-dns route reads TXT records through node:dns promises.
vi.mock('dns', () => ({
  promises: {
    resolveTxt: vi.fn(),
  },
}));

import { promises as dns } from 'dns';
import { DISCOVERED_AGENCY_AGENTS } from '../../data/agencyAgentsRegistry.js';

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

function makeDb() {
  return {
    settings: {
      mcps: [{ id: 'mcp-1', name: 'Search', enabled: false }],
      plugins: [{ id: 'plug-1', name: 'Theme', enabled: true }],
      skills: [],
      agentTeams: {},
    },
    secondBrain: {
      websiteVault: { siteUrl: '', dnsVerificationToken: '', domainVerificationStatus: 'unverified' },
      operationsVault: { sops: ['sop-1'] },
      aiWorkflowVault: { workflows: ['wf-1'] },
      customerVault: {},
      brandVault: {},
    },
  } as any;
}

function makeRes(db = makeDb()) {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: { sb: {}, wsId: 'ws-1', userId: 'user-1' },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.jsonData = data;
      return res;
    },
  };
  return { res, db, getDB: vi.fn(async () => db), saveDB: vi.fn(async () => {}) };
}

describe('Workspace Settings Routes', () => {
  beforeEach(() => {
    vi.mocked(dns.resolveTxt).mockReset();
  });

  it('POST /settings/mcps/:id/toggle flips the enabled flag (200)', async () => {
    const { res, db, getDB, saveDB } = makeRes();
    const router = createWorkspaceSettingsRouter({ getDB, saveDB } as any);
    const req: any = { method: 'POST', url: '/settings/mcps/mcp-1/toggle', params: { id: 'mcp-1' }, query: {} };
    await invoke(router, 'POST', '/settings/mcps/:id/toggle', req, res);
    expect(res.statusCode).toBe(200);
    expect(db.settings.mcps[0].enabled).toBe(true);
    expect(saveDB).toHaveBeenCalledTimes(1);
  });

  it('POST /settings/mcps/:id/toggle returns 404 for an unknown mcp', async () => {
    const { res, getDB, saveDB } = makeRes();
    const router = createWorkspaceSettingsRouter({ getDB, saveDB } as any);
    const req: any = { method: 'POST', url: '/settings/mcps/nope/toggle', params: { id: 'nope' }, query: {} };
    await invoke(router, 'POST', '/settings/mcps/:id/toggle', req, res);
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.error).toBe('MCP not found');
  });

  it('POST /settings/skills creates a skill (200) and 400 on missing fields', async () => {
    const { res, getDB, saveDB } = makeRes();
    const router = createWorkspaceSettingsRouter({ getDB, saveDB } as any);

    await invoke(
      router, 'POST', '/settings/skills',
      { method: 'POST', url: '/settings/skills', params: {}, body: {} }, res,
    );
    expect(res.statusCode).toBe(400);

    res.jsonData = null;
    res.statusCode = 200;
    await invoke(
      router, 'POST', '/settings/skills',
      { method: 'POST', url: '/settings/skills', params: {}, body: { name: '  ', moduleKey: 'agents' } }, res,
    );
    expect(res.statusCode).toBe(400);

    res.jsonData = null;
    res.statusCode = 200;
    await invoke(
      router, 'POST', '/settings/skills',
      { method: 'POST', url: '/settings/skills', params: {}, body: { name: 'Lead brief', moduleKey: 'agents' } }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.skill.name).toBe('Lead brief');
    expect(res.jsonData.skill.enabled).toBe(true);
  });

  it('POST /settings/agent-teams/:moduleKey adds/removes agents; 404 for unknown agent', async () => {
    const agentId = DISCOVERED_AGENCY_AGENTS[0]?.id;
    expect(agentId, 'registry must expose at least one agent').toBeTruthy();
    const { res, db, getDB, saveDB } = makeRes();
    const router = createWorkspaceSettingsRouter({ getDB, saveDB } as any);

    await invoke(
      router, 'POST', '/settings/agent-teams/:moduleKey',
      { method: 'POST', url: '/settings/agent-teams/growth', params: { moduleKey: 'growth' }, body: { agentId, action: 'add' } }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(db.settings.agentTeams.growth).toContain(agentId);

    // duplicate add is a no-op (Set dedupe)
    await invoke(
      router, 'POST', '/settings/agent-teams/:moduleKey',
      { method: 'POST', url: '/settings/agent-teams/growth', params: { moduleKey: 'growth' }, body: { agentId, action: 'add' } }, res,
    );
    expect(db.settings.agentTeams.growth.filter((id: string) => id === agentId)).toHaveLength(1);

    await invoke(
      router, 'POST', '/settings/agent-teams/:moduleKey',
      { method: 'POST', url: '/settings/agent-teams/growth', params: { moduleKey: 'growth' }, body: { agentId, action: 'remove' } }, res,
    );
    expect(db.settings.agentTeams.growth).not.toContain(agentId);

    res.statusCode = 200;
    res.jsonData = null;
    await invoke(
      router, 'POST', '/settings/agent-teams/:moduleKey',
      { method: 'POST', url: '/settings/agent-teams/growth', params: { moduleKey: 'growth' }, body: { agentId: 'not-a-real-agent', action: 'add' } }, res,
    );
    expect(res.statusCode).toBe(404);
    expect(res.jsonData.error).toBe('Unknown agent');
  });

  it('POST /settings/plugins/:id/toggle + /settings/skills/:id/toggle flip flags; 404 when missing', async () => {
    const { res, db, getDB, saveDB } = makeRes();
    db.settings.skills = [{ id: 'skill-1', name: 's', moduleKey: 'm', enabled: false }];
    const router = createWorkspaceSettingsRouter({ getDB, saveDB } as any);

    await invoke(
      router, 'POST', '/settings/plugins/:id/toggle',
      { method: 'POST', url: '/settings/plugins/plug-1/toggle', params: { id: 'plug-1' }, body: {} }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(db.settings.plugins[0].enabled).toBe(false);

    res.jsonData = null;
    res.statusCode = 200;
    await invoke(
      router, 'POST', '/settings/skills/:id/toggle',
      { method: 'POST', url: '/settings/skills/skill-1/toggle', params: { id: 'skill-1' }, body: {} }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(db.settings.skills[0].enabled).toBe(true);

    res.jsonData = null;
    res.statusCode = 200;
    await invoke(
      router, 'POST', '/settings/plugins/:id/toggle',
      { method: 'POST', url: '/settings/plugins/nope/toggle', params: { id: 'nope' }, body: {} }, res,
    );
    expect(res.statusCode).toBe(404);
  });

  it('DELETE /settings/skills/:id removes the skill (200)', async () => {
    const { res, db, getDB, saveDB } = makeRes();
    db.settings.skills = [{ id: 'skill-1' }, { id: 'skill-2' }];
    const router = createWorkspaceSettingsRouter({ getDB, saveDB } as any);
    await invoke(
      router, 'DELETE', '/settings/skills/:id',
      { method: 'DELETE', url: '/settings/skills/skill-1', params: { id: 'skill-1' }, body: {} }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(db.settings.skills.map((s: any) => s.id)).toEqual(['skill-2']);
  });

  it('POST /second-brain replaces the secondBrain blob and persists it', async () => {
    const { res, db, getDB, saveDB } = makeRes();
    const router = createWorkspaceSettingsRouter({ getDB, saveDB } as any);
    const body = { brandVault: { corePositioning: 'Growth partner' } };
    await invoke(
      router, 'POST', '/second-brain',
      { method: 'POST', url: '/second-brain', params: {}, body }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(db.secondBrain).toEqual(body);
    expect(saveDB).toHaveBeenCalledTimes(1);
  });

  it('POST /verify-domain-dns: 400 without a site URL', async () => {
    const { res, getDB, saveDB } = makeRes();
    const router = createWorkspaceSettingsRouter({ getDB, saveDB } as any);
    await invoke(
      router, 'POST', '/verify-domain-dns',
      { method: 'POST', url: '/verify-domain-dns', params: {}, body: {} }, res,
    );
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('No site URL');
  });

  it('POST /verify-domain-dns: verified when the TXT record contains the token', async () => {
    const db = makeDb();
    db.secondBrain.websiteVault.siteUrl = 'https://acme.example';
    db.secondBrain.websiteVault.dnsVerificationToken = 'st-verify-abc123';
    const { res, getDB, saveDB } = makeRes(db);
    vi.mocked(dns.resolveTxt).mockResolvedValue([['st-verify-abc123', 'other']]);

    const router = createWorkspaceSettingsRouter({ getDB, saveDB } as any);
    await invoke(
      router, 'POST', '/verify-domain-dns',
      { method: 'POST', url: '/verify-domain-dns', params: {}, body: {} }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.verified).toBe(true);
    expect(res.jsonData.status).toBe('verified');
    expect(db.secondBrain.websiteVault.domainVerificationStatus).toBe('verified');
  });

  it('POST /verify-domain-dns: unverified + lookup-failure paths', async () => {
    const db = makeDb();
    db.secondBrain.websiteVault.siteUrl = 'https://acme.example';
    db.secondBrain.websiteVault.dnsVerificationToken = 'st-verify-abc123';
    const { res, getDB, saveDB } = makeRes(db);

    const router = createWorkspaceSettingsRouter({ getDB, saveDB } as any);
    vi.mocked(dns.resolveTxt).mockResolvedValue([['unrelated-token']]);
    await invoke(
      router, 'POST', '/verify-domain-dns',
      { method: 'POST', url: '/verify-domain-dns', params: {}, body: {} }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.verified).toBe(false);
    expect(res.jsonData.status).toBe('unverified');

    res.jsonData = null;
    vi.mocked(dns.resolveTxt).mockRejectedValue(new Error('ENOTFOUND'));
    await invoke(
      router, 'POST', '/verify-domain-dns',
      { method: 'POST', url: '/verify-domain-dns', params: {}, body: {} }, res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.message).toContain('ENOTFOUND');
    expect(db.secondBrain.websiteVault.domainVerificationStatus).toBe('unverified');
  });

  it('POST /clone-template: empty-template structure with the two carried-over vaults', async () => {
    const db = makeDb();
    const { res, getDB, saveDB } = makeRes(db);
    const router = createWorkspaceSettingsRouter({ getDB, saveDB } as any);
    await invoke(
      router, 'POST', '/clone-template',
      { method: 'POST', url: '/clone-template', params: {}, body: { targetWorkspaceName: 'Acme Clone' } }, res,
    );
    expect(res.statusCode).toBe(200);
    const cloned = res.jsonData.clonedTemplate;
    expect(cloned.secondBrain.operationsVault).toEqual(db.secondBrain.operationsVault);
    expect(cloned.secondBrain.aiWorkflowVault).toEqual(db.secondBrain.aiWorkflowVault);
    expect(cloned.secondBrain.brandVault.brandSlogan).toBe('Acme Clone');
    expect(res.jsonData.message).toContain('Acme Clone');
    // default name when the body omits it
    res.jsonData = null;
    await invoke(
      router, 'POST', '/clone-template',
      { method: 'POST', url: '/clone-template', params: {}, body: {} }, res,
    );
    expect(res.jsonData.message).toContain('Cloned Client Workspace');
  });
});

describe('router factory shape', () => {
  it('createWorkspaceSettingsRouter returns a Router with 9 scoped route layers', () => {
    const router: any = createWorkspaceSettingsRouter({ getDB: async () => undefined as any, saveDB: async () => {} });
    const routeLayers = router.stack.filter((l: any) => l.route);
    expect(routeLayers).toHaveLength(9);
    // every route path is scoped; nothing leaks above the mount
    for (const l of routeLayers) {
      expect(l.route.path).toMatch(/^\/(settings|second-brain|verify-domain-dns|clone-template)/);
    }
  });
});
