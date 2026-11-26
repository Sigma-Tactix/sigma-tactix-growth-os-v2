import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createStripeWebhookRouter } from './stripeWebhookRoutes.js';

vi.mock('../../lib/stripe.js', () => ({
  isStripeConfigured: vi.fn(),
  isStripeWebhookConfigured: vi.fn(),
  getStripeClient: vi.fn(),
}));
vi.mock('../../lib/supabaseAdmin.js', () => ({
  getServiceRoleClient: vi.fn(),
}));
import { isStripeConfigured, isStripeWebhookConfigured, getStripeClient } from '../../lib/stripe.js';
import { getServiceRoleClient } from '../../lib/supabaseAdmin.js';

function makeRes() {
  const res: any = {
    statusCode: 200,
    jsonData: null,
    status(code: number) { res.statusCode = code; return res; },
    json(data: any) { res.jsonData = data; return res; },
  };
  return res;
}

// The express.raw layer is a real parser; to unit-test the handler itself we
// invoke the route's SECOND layer directly with an already-"parsed" raw body.
async function getHandler(router: any, req: any, res: any) {
  const layer = router.stack.find((s: any) => s.route?.path === '/api/webhooks/stripe');
  expect(layer, 'stripe route layer').toBeDefined();
  const handler = layer.route.stack[1].handle;
  await handler(req, res, () => {});
}

function makeStripeReq(body: string, overrides: any = {}) {
  return {
    method: 'POST',
    url: '/api/webhooks/stripe',
    headers: { 'stripe-signature': 't=1,v1=abc', 'content-type': 'application/json' },
    body: Buffer.from(body),
    ...overrides,
  };
}

function serviceRoleChain() {
  const rpc = vi.fn(async () => ({ error: null }));
  const updatePayload: { captured: any } = { captured: null };
  const selectQuery = {
    eq: () => selectQuery,
    single: vi.fn(async () => ({ data: { id: 'ws-1' }, error: null })),
  };
  const updateQuery = {
    eq: vi.fn(async () => ({ error: null })),
  };
  const from = vi.fn(() => ({
    select: () => selectQuery,
    update: (payload: any) => { updatePayload.captured = payload; return updateQuery; },
  }));
  // getServiceRoleClient() returns this client object (not a function)
  const client = { rpc, from };
  return { client, rpc, from, updatePayload };
}

describe('Stripe Webhook Route', () => {
  const savedSecret = process.env.STRIPE_WEBHOOK_SECRET;
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    vi.mocked(isStripeConfigured).mockClear();
    vi.mocked(isStripeWebhookConfigured).mockClear();
    vi.mocked(getStripeClient).mockClear();
    vi.mocked(getServiceRoleClient).mockClear();
  });
  afterEach(() => {
    if (savedSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = savedSecret;
  });

  it('route shape: 1 route, [express.raw (untyped, raw body), async handler]', () => {
    const router: any = createStripeWebhookRouter();
    const layers = router.stack.filter((l: any) => l.route);
    expect(layers).toHaveLength(1);
    expect(layers[0].route.methods.post).toBe(true);
    const stack = layers[0].route.stack;
    expect(stack).toHaveLength(2);
    // the first layer is express.raw's body parser (body-parser names it "rawParser")
    expect(stack[0].handle.name).toBe('rawParser');
    // the second is an async handler
    expect(stack[1].handle.constructor.name).toBe('AsyncFunction');
  });

  it('503 when the stripe client or webhook secret is not configured', async () => {
    vi.mocked(isStripeConfigured).mockReturnValue(false);
    const router = createStripeWebhookRouter();
    const res = makeRes();
    await getHandler(router, makeStripeReq('{}'), res);
    expect(res.statusCode).toBe(503);
    expect(res.jsonData).toEqual({ error: 'Stripe billing is not configured on this server.' });

    vi.mocked(isStripeConfigured).mockReturnValue(true);
    vi.mocked(isStripeWebhookConfigured).mockReturnValue(false);
    const res2 = makeRes();
    await getHandler(router, makeStripeReq('{}'), res2);
    expect(res2.statusCode).toBe(503);
    // no signature verification was attempted
    expect(getStripeClient).not.toHaveBeenCalled();
  });

  it('400 when the signature does not verify (constructEvent throws)', async () => {
    vi.mocked(isStripeConfigured).mockReturnValue(true);
    vi.mocked(isStripeWebhookConfigured).mockReturnValue(true);
    vi.mocked(getStripeClient).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => { throw new Error('invalid signature'); }),
      },
    } as any);
    const router = createStripeWebhookRouter();
    const res = makeRes();
    await getHandler(router, makeStripeReq('raw-bytes'), res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toContain('signature verification failed');
    // constructEvent got the RAW body buffer + the header signature + the secret
    const construct = vi.mocked(getStripeClient).mock.results[0].value.webhooks.constructEvent;
    expect(construct.mock.calls[0][0]).toBeInstanceOf(Buffer);
    expect(construct.mock.calls[0][1]).toBe('t=1,v1=abc');
    expect(construct.mock.calls[0][2]).toBe('whsec_test');
  });

  it('200 without side effects for non-subscription events', async () => {
    vi.mocked(isStripeConfigured).mockReturnValue(true);
    vi.mocked(isStripeWebhookConfigured).mockReturnValue(true);
    vi.mocked(getStripeClient).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => ({ type: 'invoice.paid', data: { object: { customer: 'cus_1', id: 'in_1' } } })),
      },
    } as any);
    const { client } = serviceRoleChain();
    vi.mocked(getServiceRoleClient).mockReturnValue(client as any);
    const router = createStripeWebhookRouter();
    const res = makeRes();
    await getHandler(router, makeStripeReq('{}'), res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({ received: true });
    // no DB work at all — the customer.subscription. gate did not fire
    expect(getServiceRoleClient).not.toHaveBeenCalled();
  });

  it('applies a subscription event via the service-role RPC and syncs the workspace tier', async () => {
    vi.mocked(isStripeConfigured).mockReturnValue(true);
    vi.mocked(isStripeWebhookConfigured).mockReturnValue(true);
    vi.mocked(getStripeClient).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => ({
          type: 'customer.subscription.updated',
          data: { object: { customer: 'cus_42', status: 'active', id: 'sub_9', metadata: { tier_key: 'growth' } } },
        })),
      },
    } as any);
    const { client, rpc, updatePayload } = serviceRoleChain();
    vi.mocked(getServiceRoleClient).mockReturnValue(client as any);

    const router = createStripeWebhookRouter();
    const res = makeRes();
    await getHandler(router, makeStripeReq('{}'), res);
    expect(res.statusCode).toBe(200);
    // the HMAC-verified event drove the service-role RPC with the mapped args
    expect(rpc).toHaveBeenCalledWith('apply_stripe_webhook_update', {
      p_stripe_customer_id: 'cus_42',
      p_stripe_subscription_id: 'sub_9',
      p_status: 'active',
      p_plan: 'growth', // metadata.tier_key
      p_current_period_end: null,
    });
    // and the active status + tier_key synced the workspace tier
    expect(updatePayload.captured).toEqual({ tier: 'growth' });
    // the service-role client is what reaches the RPC + the workspaces table
    expect(getServiceRoleClient).toHaveBeenCalledTimes(3); // rpc + select + update
  });

  it('a deleted subscription maps to status "canceled" and skips the tier sync', async () => {
    vi.mocked(isStripeConfigured).mockReturnValue(true);
    vi.mocked(isStripeWebhookConfigured).mockReturnValue(true);
    vi.mocked(getStripeClient).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => ({
          type: 'customer.subscription.deleted',
          data: { object: { customer: { id: 'cus_obj' }, status: 'canceled', id: 'sub_2' } },
        })),
      },
    } as any);
    const { client, rpc } = serviceRoleChain();
    vi.mocked(getServiceRoleClient).mockReturnValue(client as any);

    const router = createStripeWebhookRouter();
    const res = makeRes();
    await getHandler(router, makeStripeReq('{}'), res);
    expect(res.statusCode).toBe(200);
    // customer given as an OBJECT (not a string) is unwrapped to .id
    expect(rpc).toHaveBeenCalledWith('apply_stripe_webhook_update', expect.objectContaining({
      p_stripe_customer_id: 'cus_obj',
      p_status: 'canceled', // not obj.status — deleted means canceled
    }));
  });

  it('mount-order invariant: the router is mounted in server.ts strictly BEFORE the global express.json() parser', () => {
    // The load-bearing ordering of this whole increment — if the mount ever
    // slips past the JSON parser, constructEvent sees a re-serialized body and
    // every signature check fails. Pin it against the server.ts source.
    const root = process.cwd();
    const source = fs.readFileSync(path.join(root, 'server.ts'), 'utf8');
    const lines = source.split('\n');
    const mountLine = lines.findIndex((l) => l.startsWith('app.use(createStripeWebhookRouter());'));
    // find the express.json({ app.use block explicitly
    let jsonUseLine = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === 'app.use(' && lines[i + 1] && lines[i + 1].includes('express.json({')) { jsonUseLine = i; break; }
    }
    expect(mountLine).toBeGreaterThan(-1);
    expect(jsonUseLine).toBeGreaterThan(-1);
    expect(mountLine).toBeLessThan(jsonUseLine);
  });
});
