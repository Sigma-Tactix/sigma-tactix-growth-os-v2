import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createIntakeRouter } from './intakeRoutes.js';

vi.mock('../../lib/email.js', () => ({
  sendEmail: vi.fn(),
}));
import { sendEmail } from '../../lib/email.js';

function makeDb(overrides: any = {}) {
  return {
    secondBrain: {
      brandVault: { brandSlogan: 'old', corePositioning: 'old' },
      customerVault: { idealCustomerProfile: 'old-icp' },
      websiteVault: { siteUrl: 'old-site', cmsType: 'wordpress' },
      marketingVault: { campaignHistory: 'old-history' },
      executiveVault: { financialsOverview: '' },
      auditVault: { findings: {} },
    },
    ...overrides,
  } as any;
}

function makeDeps(db: any, overrides: any = {}) {
  return {
    getDB: vi.fn(async () => db),
    saveDB: vi.fn(async () => {}),
    ...overrides,
  };
}

// A fake supabase client whose from('intake_tokens').insert() outcome is
// controllable per test.
function makeSb(overrides: any = {}) {
  const insert = vi.fn(async () => ({ error: null }));
  const sb: any = {
    _insert: insert,
    from: vi.fn((table: string) => {
      if (table === 'intake_tokens') return { insert };
      const b: any = {};
      for (const m of ['select', 'eq', 'order', 'maybeSingle', 'delete', 'limit', 'insert', 'update']) b[m] = () => b;
      b.then = (onF: any) => Promise.resolve(overrides[`from:${table}`] ?? { data: undefined, error: null }).then(onF);
      return b;
    }),
  };
  return sb;
}

function makeRes(sb: any) {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    locals: { sb, wsId: 'ws-1', userId: 'user-1' },
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
  };
  return res;
}

function makeReq(overrides: any = {}) {
  return { method: 'POST', url: '/', params: {}, query: {}, body: {}, ...overrides };
}

// Both routes are plain handlers (no middleware layers on this router).
async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find((s: any) => s.route?.path === path && s.route?.methods?.[method.toLowerCase()]);
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  const stack = layer.route.stack;
  for (let i = 0; i < stack.length; i++) {
    let nextCalled = false;
    const maybeP = stack[i].handle(req, res, () => { nextCalled = true; });
    if (maybeP && typeof maybeP.then === 'function') await maybeP;
    if (!nextCalled) return;
  }
}

const savedAppUrl = process.env.APP_URL;
const savedMyKey = process.env.MY_GEMINI_API_KEY;

describe('Intake Routes', () => {
  beforeEach(() => {
    vi.mocked(sendEmail).mockClear();
    delete process.env.APP_URL;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (savedAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = savedAppUrl;
  });

  it('POST /launch-intake: 400 when clientEmail or brandName is missing', async () => {
    const db = makeDb();
    const router = createIntakeRouter(makeDeps(db));
    let res = makeRes(makeSb());
    await invoke(router, 'POST', '/launch-intake', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('Client email and brand name are required');

    res = makeRes(makeSb());
    await invoke(router, 'POST', '/launch-intake', makeReq({ body: { clientEmail: 'a@b.com' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('POST /launch-intake: 500 when the intake_tokens insert fails', async () => {
    const db = makeDb();
    const sb = makeSb();
    sb._insert.mockResolvedValueOnce({ error: { message: 'RLS denied' } });
    const deps = makeDeps(db);
    const router = createIntakeRouter(deps);
    const res = makeRes(sb);
    await invoke(router, 'POST', '/launch-intake', makeReq({ body: { clientEmail: 'a@b.com', brandName: 'Acme' } }), res);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData.error).toContain('RLS denied');
    // the vault writes happened before the failure — assert they were made on db:
    expect(db.secondBrain.brandVault.corePositioning).toContain('Acme');
  });

  it('POST /launch-intake: 200 happy path writes vaults, mints the token row, sends the email, and persists the pipeline task', async () => {
    vi.mocked(sendEmail).mockResolvedValueOnce({ sent: true, provider: 'resend' } as any);
    const db = makeDb();
    const sb = makeSb();
    const deps = makeDeps(db);
    const router = createIntakeRouter(deps);
    const res = makeRes(sb);
    await invoke(
      router, 'POST', '/launch-intake',
      makeReq({ body: { clientEmail: 'a@b.com', brandName: 'Acme', slogan: 'grow', audience: 'B2B SaaS', cmsType: 'webflow', channel: 'paid-social' } }),
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.emailSent).toBe(true);
    expect(res.jsonData.steps.length).toBe(3);
    // vaults written server-side:
    expect(db.secondBrain.brandVault.corePositioning).toBe('AI-native growth infrastructure built for Acme.');
    expect(db.secondBrain.customerVault.idealCustomerProfile).toBe('B2B SaaS');
    expect(db.secondBrain.websiteVault.cmsType).toBe('webflow');
    expect(db.secondBrain.marketingVault.campaignHistory).toBe('Marketing channel: paid-social');
    // the token row was inserted with the 4 requested fields:
    const insert = sb._insert.mock.calls[0][0];
    expect(insert.token).toHaveLength(48);
    expect(insert.workspace_id).toBe('ws-1');
    expect(insert.client_email).toBe('a@b.com');
    expect(insert.requested_fields).toEqual(expect.arrayContaining(['Business address', 'Logo upload']));
    // the onboarding email carries a completion link (default APP_URL when unset):
    expect(res.jsonData.intakeTask.status).toBe('Email Sent');
    const mail = vi.mocked(sendEmail).mock.calls[0][0];
    expect(mail.html).toContain('http://localhost:3000/intake/' + insert.token);
    expect(mail.html).toContain('Business address');
    // pipeline task prepended + two saveDB calls (post-email + post-task):
    expect(db.intakePipelineTasks[0].clientEmail).toBe('a@b.com');
    expect(deps.saveDB).toHaveBeenCalledTimes(2);
  });

  it('POST /launch-intake: APP_URL override is used for the completion link; a non-RESEND email reports the honest step', async () => {
    process.env.APP_URL = 'https://growth.example.com/';
    vi.mocked(sendEmail).mockResolvedValueOnce({ sent: false, provider: 'mock' } as any);
    const db = makeDb();
    const sb = makeSb();
    const router = createIntakeRouter(makeDeps(db));
    const res = makeRes(sb);
    await invoke(router, 'POST', '/launch-intake', makeReq({ body: { clientEmail: 'a@b.com', brandName: 'Acme' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.emailSent).toBe(false);
    expect(res.jsonData.steps[2]).toContain('RESEND_API_KEY not set');
    const insert = sb._insert.mock.calls[0][0];
    const mail = vi.mocked(sendEmail).mock.calls[0][0];
    expect(mail.html).toContain('https://growth.example.com/intake/' + insert.token);
  });

  it('POST /intake/questionnaire: 400 for missing required fields and for a non-http(s) URL', async () => {
    const db = makeDb();
    const router = createIntakeRouter(makeDeps(db));

    let res = makeRes(makeSb());
    await invoke(router, 'POST', '/intake/questionnaire', makeReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('Company name and target ICP are required');

    res = makeRes(makeSb());
    await invoke(router, 'POST', '/intake/questionnaire', makeReq({ body: { companyName: 'Acme', primaryICP: 'B2B', websiteUrl: 'ftp://acme.com' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('valid http(s) URL');
  });

  it('POST /intake/questionnaire: 200 writes only non-empty answers field-by-field and reports the written/unanswered split', async () => {
    const db = makeDb();
    const deps = makeDeps(db);
    const router = createIntakeRouter(deps);
    const res = makeRes(makeSb());
    await invoke(
      router, 'POST', '/intake/questionnaire',
      makeReq({
        body: {
          companyName: 'Acme',
          primaryICP: 'B2B SaaS ICP',
          websiteUrl: 'https://acme.com',
          monthlyRevenue: '$500k',
          primaryChannel: 'paid-social',
          brandVoiceTone: 'confident',
          competitorDifferentiator: 'faster CRO loop',
        },
      }),
      res,
    );
    expect(res.statusCode).toBe(200);
    const written = res.jsonData.written.map((w: any) => w.field);
    for (const f of ['siteUrl', 'voiceAndTone', 'corePositioning', 'idealCustomerProfile', 'currentChannels', 'financialsOverview']) {
      expect(written).toContain(f);
    }
    // nothing written to the audit vault (no bottleneck reported):
    expect(written).not.toContain('funnelQuality (reported bottleneck)');
    // unanswered lists exactly the three free-text fields that were omitted:
    expect(res.jsonData.unanswered).toEqual(expect.arrayContaining(['monthlyAdSpend', 'primaryBottleneck']));
    // the vaults reflect only the answered fields:
    expect(db.secondBrain.websiteVault.siteUrl).toBe('https://acme.com');
    expect(db.secondBrain.brandVault.corePositioning).toBe('faster CRO loop');
    expect(db.secondBrain.customerVault.idealCustomerProfile).toBe('B2B SaaS ICP');
    expect(db.secondBrain.marketingVault.currentChannels).toEqual(['paid-social']);
    expect(db.secondBrain.executiveVault.financialsOverview).toContain('revenue band $500k');
    expect(db.secondBrain.auditVault.findings.funnelQuality).toBeUndefined();
    expect(deps.saveDB).toHaveBeenCalledTimes(1);
  });

  it('POST /intake/questionnaire: a reported bottleneck lands in the audit vault; deduped channel union', async () => {
    const db = makeDb();
    db.secondBrain.marketingVault.currentChannels = ['email'];
    const deps = makeDeps(db);
    const router = createIntakeRouter(deps);
    const res = makeRes(makeSb());
    await invoke(
      router, 'POST', '/intake/questionnaire',
      makeReq({
        body: {
          companyName: 'Acme',
          primaryICP: 'B2B',
          primaryChannel: 'email',
          primaryBottleneck: 'slow pipeline',
          monthlyAdSpend: '$10k',
        },
      }),
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(db.secondBrain.auditVault.findings.funnelQuality).toBe('slow pipeline');
    // dedup: "email" already present → no duplicate entry
    expect(db.secondBrain.marketingVault.currentChannels).toEqual(['email']);
    expect(res.jsonData.unanswered).toEqual(expect.arrayContaining(['monthlyRevenue']));
  });

  it('factory shape: 2 scoped route layers, no middleware layers', () => {
    const router: any = createIntakeRouter(makeDeps(makeDb()));
    const routeLayers = router.stack.filter((l: any) => l.route);
    expect(routeLayers).toHaveLength(2);
    expect(routeLayers.map((l: any) => l.route.path).sort()).toEqual(['/intake/questionnaire', '/launch-intake']);
    for (const l of routeLayers) expect(l.route.stack).toHaveLength(1);
  });
});
