import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLeadsMailboxesRouter } from './leadsMailboxesRoutes.js';

function makeRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
  };
  return res;
}

function makeReq(overrides: any = {}) {
  return { method: 'POST', url: '/', params: {}, query: {}, body: {}, ...overrides };
}

// All 8 routes are single-layer handlers (no middleware); 7 of them are
// registered on a PATH PAIR (public twin + /api/workspace twin), which
// express 4.22 keeps as ONE layer whose route.path is an ARRAY.
async function invoke(router: any, method: string, path: string, req: any, res: any) {
  const layer = router.stack.find((s: any) => {
    const p = s.route?.path;
    const paths = Array.isArray(p) ? p : [p];
    return paths.includes(path) && s.route?.methods?.[method.toLowerCase()];
  });
  expect(layer, `route layer for ${method} ${path}`).toBeDefined();
  for (const h of layer.route.stack) {
    let nextCalled = false;
    const maybeP = h.handle(req, res, () => { nextCalled = true; });
    if (maybeP && typeof maybeP.then === 'function') await maybeP;
    if (!nextCalled) return;
  }
}

describe('Leads / Agent Mailboxes / Outreach Routes', () => {
  const savedSeed = process.env.SEED_DEMO_WORKSPACE;
  beforeEach(() => { delete process.env.SEED_DEMO_WORKSPACE; });
  afterEach(() => {
    if (savedSeed === undefined) delete process.env.SEED_DEMO_WORKSPACE;
    else process.env.SEED_DEMO_WORKSPACE = savedSeed;
  });

  it('route shape: 8 registrations, each a single [handler] layer with no middleware; 7 are path-pairs (array route.path)', () => {
    const router: any = createLeadsMailboxesRouter();
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(8);
    const allPaths = layers.flatMap((l: any) => (Array.isArray(l.route.path) ? l.route.path : [l.route.path]));
    for (const p of [
      '/api/public/capture-lead',
      '/api/leads', '/api/workspace/leads',
      '/api/leads/create', '/api/workspace/leads/create',
      '/api/leads/update-stage', '/api/workspace/leads/update-stage',
      '/api/admin/agent-mailboxes', '/api/workspace/agent-mailboxes',
      '/api/admin/agent-mailboxes/save', '/api/workspace/agent-mailboxes/save',
      '/api/admin/agent-mailboxes/test-send', '/api/workspace/agent-mailboxes/test-send',
      '/api/outreach/send-email', '/api/workspace/outreach/send-email',
    ]) {
      expect(allPaths).toContain(p);
    }
    expect(allPaths).toHaveLength(15); // 1 single + 7 pairs × 2
    for (const l of layers) {
      expect(l.route.stack).toHaveLength(1); // no middleware — no tier gate, no limiter
      const p = Array.isArray(l.route.path) ? l.route.path[0] : l.route.path;
      expect(p).toMatch(/^\/api/);
    }
  });

  it('POST /api/public/capture-lead: 400 ladders, then a captured lead with NO invented ICP/ARR', async () => {
    const router = createLeadsMailboxesRouter();
    let res = makeRes();
    await invoke(router, 'POST', '/api/public/capture-lead', makeReq({ body: { email: 'a@b.com' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('Contact name is required.');

    res = makeRes();
    await invoke(router, 'POST', '/api/public/capture-lead', makeReq({ body: { name: 'Jane', email: 'not-an-email' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('Valid work email address is required.');

    res = makeRes();
    await invoke(router, 'POST', '/api/public/capture-lead', makeReq({
      body: { name: ' Jane ', email: ' JANE@Acme.com ', company: 'Acme', sourceVector: 'Webinar' },
    }), res);
    expect(res.statusCode).toBe(200);
    const lead = res.jsonData.lead;
    expect(lead.name).toBe('Jane');
    expect(lead.email).toBe('jane@acme.com'); // trimmed + lowercased
    expect(lead.stage).toBe('NEW_INBOUND');
    expect(lead.sourceVector).toBe('Webinar');
    expect(lead.notes).toBe('Captured via public Conversion Dock widget.');
    // anti-fabrication: no enrichment ran, so no ICP score / ARR band exists
    expect(lead.icpScore).toBeUndefined();
    expect(lead.estimatedArr).toBeUndefined();
    // it landed in the pipeline list visible to /api/leads
    const list = makeRes();
    await invoke(router, 'GET', '/api/leads', makeReq({ method: 'GET', url: '/api/leads' }), list);
    expect(list.jsonData.leads[0]).toMatchObject({ email: 'jane@acme.com' });
    expect(list.jsonData.totalCount).toBe(1);
  });

  it('GET /api/leads: SEED_DEMO_WORKSPACE=false keeps the pipeline empty; true seeds exactly the 5 demo leads', async () => {
    let router = createLeadsMailboxesRouter();
    const empty = makeRes();
    await invoke(router, 'GET', '/api/leads', makeReq({ method: 'GET' }), empty);
    expect(empty.jsonData.leads).toHaveLength(0);

    process.env.SEED_DEMO_WORKSPACE = 'true';
    router = createLeadsMailboxesRouter();
    const seeded = makeRes();
    await invoke(router, 'GET', '/api/leads', makeReq({ method: 'GET' }), seeded);
    expect(seeded.jsonData.leads).toHaveLength(5);
    expect(seeded.jsonData.leads.map((l: any) => l.id)).toEqual(['lead-101', 'lead-102', 'lead-103', 'lead-104', 'lead-105']);
    expect(seeded.jsonData.leads[0].icpScore).toBe(94);
    // pipelineValue sums the parsed ARR bands
    expect(seeded.jsonData.pipelineValue).toBeCloseTo(4.2 + 8.5 + 2.8 + 12.0 + 3.5);
  });

  it('POST /api/leads/create: 400 without name+email; clamps icpScore to 0–100 and rejects non-numeric', async () => {
    const router = createLeadsMailboxesRouter();
    let res = makeRes();
    await invoke(router, 'POST', '/api/leads/create', makeReq({ body: { email: 'a@b.com' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('Name and email are mandatory.');

    res = makeRes();
    await invoke(router, 'POST', '/api/leads/create', makeReq({ body: { name: 'N', email: 'e@x.com', icpScore: 250 } }), res);
    expect(res.jsonData.lead.icpScore).toBe(100); // clamped

    res = makeRes();
    await invoke(router, 'POST', '/api/leads/create', makeReq({ body: { name: 'N', email: 'e@x.com', icpScore: 'high' } }), res);
    expect(res.jsonData.lead.icpScore).toBeUndefined(); // not a number → unscored

    res = makeRes();
    await invoke(router, 'POST', '/api/leads/create', makeReq({ body: { name: 'N', email: 'e@x.com' } }), res);
    expect(res.jsonData.lead).toMatchObject({ stage: 'NEW_INBOUND', sourceVector: 'Manual Entry', company: 'Private Entity' });
  });

  it('POST /api/leads/update-stage: 404 unknown; 200 moves the stage + honest message', async () => {
    process.env.SEED_DEMO_WORKSPACE = 'true';
    const router = createLeadsMailboxesRouter();
    let res = makeRes();
    await invoke(router, 'POST', '/api/leads/update-stage', makeReq({ body: { id: 'ghost', stage: 'CLOSED_WON' } }), res);
    expect(res.statusCode).toBe(404);

    res = makeRes();
    await invoke(router, 'POST', '/api/leads/update-stage', makeReq({ body: { id: 'lead-101', stage: 'CALL_BOOKED' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.lead.stage).toBe('CALL_BOOKED');
    expect(res.jsonData.message).toBe('Lead lead-101 moved to stage CALL_BOOKED.');
    // persisted in the shared in-memory pipeline
    const list = makeRes();
    await invoke(router, 'GET', '/api/leads', makeReq({ method: 'GET' }), list);
    expect(list.jsonData.leads.find((l: any) => l.id === 'lead-101').stage).toBe('CALL_BOOKED');
  });

  it('GET /api/admin/agent-mailboxes: the seeded mailboxes + default brand theme', async () => {
    const router = createLeadsMailboxesRouter();
    const res = makeRes();
    await invoke(router, 'GET', '/api/admin/agent-mailboxes', makeReq({ method: 'GET' }), res);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.mailboxes.map((m: any) => m.agentId)).toEqual(['agent-outreach', 'agent-orchestrator']);
    expect(res.jsonData.theme.primaryAccentColor).toBe('#F59E0B');
  });

  it('POST /api/admin/agent-mailboxes/save: replaces the mailboxes list but MERGES the theme', async () => {
    const router = createLeadsMailboxesRouter();
    let res = makeRes();
    await invoke(router, 'POST', '/api/admin/agent-mailboxes/save', makeReq({
      body: { mailboxes: [{ agentId: 'agent-x', assignedEmail: 'x@y.com' }] },
    }), res);
    expect(res.jsonData.success).toBe(true);

    res = makeRes();
    await invoke(router, 'GET', '/api/admin/agent-mailboxes', makeReq({ method: 'GET' }), res);
    expect(res.jsonData.mailboxes).toHaveLength(1);
    expect(res.jsonData.mailboxes[0].agentId).toBe('agent-x');
    // theme untouched by the first save
    expect(res.jsonData.theme.primaryAccentColor).toBe('#F59E0B');

    // a partial theme merge preserves the other keys
    await invoke(router, 'POST', '/api/admin/agent-mailboxes/save',
      makeReq({ body: { theme: { supportEmail: 'ops@sigmatactix.com' } } }), makeRes());
    const after = makeRes();
    await invoke(router, 'GET', '/api/admin/agent-mailboxes', makeReq({ method: 'GET' }), after);
    expect(after.jsonData.theme.supportEmail).toBe('ops@sigmatactix.com');
    expect(after.jsonData.theme.primaryAccentColor).toBe('#F59E0B');
  });

  it('POST /api/admin/agent-mailboxes/test-send: 400 without a valid recipient; 200 simulated SMTP handshake', async () => {
    const router = createLeadsMailboxesRouter();
    let res = makeRes();
    await invoke(router, 'POST', '/api/admin/agent-mailboxes/test-send', makeReq({ body: { recipient: 'nope' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('Valid recipient email is required.');

    res = makeRes();
    await invoke(router, 'POST', '/api/admin/agent-mailboxes/test-send',
      makeReq({ body: { recipient: 'ops@acme.com', assignedEmail: 'sdr@sigmatactix.com', senderDisplayName: 'SDR', transportType: 'SMTP' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.message).toContain('SMTP 250 OK');
  });

  it('POST /api/outreach/send-email: 400 missing leadEmail; 200 records the DISPATCH note + promotes NEW_INBOUND', async () => {
    const router = createLeadsMailboxesRouter();
    let res = makeRes();
    await invoke(router, 'POST', '/api/outreach/send-email', makeReq({ body: { leadEmail: '' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('Recipient email is required.');

    // capture a lead first, then dispatch to it
    const captured = makeRes();
    await invoke(router, 'POST', '/api/public/capture-lead',
      makeReq({ body: { name: 'Sam', email: 'Sam@Acme.com' } }), captured);
    const leadId = captured.jsonData.leadId;

    res = makeRes();
    await invoke(router, 'POST', '/api/outreach/send-email', makeReq({
      body: { leadId, leadEmail: 'sam@acme.com', assignedEmail: 'sdr@sigmatactix.com', senderDisplayName: 'SDR', subject: 'Q3 teardown' },
    }), res);
    expect(res.statusCode).toBe(200);
    const touched = res.jsonData.lead;
    expect(touched.notes).toContain('[DISPATCH]: Sent "Q3 teardown" via sdr@sigmatactix.com (SDR).');
    // NEW_INBOUND is promoted to OUTREACH_QUEUED (the byte-preserved stage rule)
    expect(touched.stage).toBe('OUTREACH_QUEUED');
  });

  it('POST /api/outreach/send-email: an unknown leadId still dispatches (lead: undefined), an ENRICHED lead also promotes', async () => {
    const router = createLeadsMailboxesRouter();
    const res = makeRes();
    await invoke(router, 'POST', '/api/outreach/send-email',
      makeReq({ body: { leadId: 'ghost', leadEmail: 'x@y.com', assignedEmail: 'a@b.com' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.lead).toBeUndefined();

    process.env.SEED_DEMO_WORKSPACE = 'true';
    const router2 = createLeadsMailboxesRouter();
    const res2 = makeRes();
    await invoke(router2, 'POST', '/api/outreach/send-email',
      makeReq({ body: { leadId: 'lead-105', leadEmail: 'jordan@finscale.co', assignedEmail: 'sdr@sigmatactix.com' } }), res2);
    expect(res2.jsonData.lead.stage).toBe('OUTREACH_QUEUED'); // was ENRICHED
  });
});
