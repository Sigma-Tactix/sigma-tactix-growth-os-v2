import { Router, Request, Response } from 'express';

export interface BillingRouterDeps {
  isStripeConfigured: () => boolean;
  getStripeClient: () => any;
  getEntitlements: (res: Response) => Promise<any>;
}

export function createBillingRouter(deps: BillingRouterDeps): Router {
  const router = Router();
  const { isStripeConfigured, getStripeClient, getEntitlements } = deps;

  // GET /status
  router.get('/status', async (req: Request, res: Response) => {
    if (!isStripeConfigured()) {
      res.json({ success: true, configured: false });
      return;
    }
    const { data: wsRow, error: wsErr } = await res.locals.sb
      .from('workspaces')
      .select('stripe_customer_id, billing_status, billing_plan, billing_current_period_end')
      .eq('id', res.locals.wsId)
      .single();
    if (wsErr) {
      res.status(500).json({ error: wsErr.message });
      return;
    }
    if (!wsRow?.stripe_customer_id) {
      res.json({ success: true, configured: true, hasCustomer: false });
      return;
    }

    try {
      const stripe = getStripeClient();
      const customerId = wsRow.stripe_customer_id as string;
      const [subscriptions, invoices] = await Promise.all([
        stripe.subscriptions.list({ customer: customerId, limit: 1, expand: ['data.default_payment_method', 'data.items.data.price'] }),
        stripe.invoices.list({ customer: customerId, limit: 10 }),
      ]);
      const sub = subscriptions.data[0];
      const pm = sub?.default_payment_method && typeof sub.default_payment_method !== 'string' ? sub.default_payment_method : null;
      res.json({
        success: true,
        configured: true,
        hasCustomer: true,
        subscription: sub ? {
          status: sub.status,
          plan: sub.items.data[0]?.price?.nickname || sub.items.data[0]?.price?.id || wsRow.billing_plan || null,
          currentPeriodEnd: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : wsRow.billing_current_period_end,
        } : (wsRow.billing_status ? { status: wsRow.billing_status, plan: wsRow.billing_plan, currentPeriodEnd: wsRow.billing_current_period_end } : null),
        paymentMethod: pm?.card ? { brand: pm.card.brand, last4: pm.card.last4 } : null,
        invoices: invoices.data.map((inv: any) => ({
          id: inv.id,
          date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
          amount: (inv.amount_paid ?? inv.amount_due ?? 0) / 100,
          currency: inv.currency,
          status: inv.status,
          hostedInvoiceUrl: inv.hosted_invoice_url,
          invoicePdf: inv.invoice_pdf,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load billing data from Stripe: ' + (err.message || String(err)) });
    }
  });

  // POST /portal-session
  router.post('/portal-session', async (req: Request, res: Response) => {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'Stripe billing is not configured on this server. Set STRIPE_SECRET_KEY to enable it.' });
      return;
    }
    try {
      const stripe = getStripeClient();
      const { data: wsRow, error: wsErr } = await res.locals.sb
        .from('workspaces')
        .select('stripe_customer_id, name, owner_id')
        .eq('id', res.locals.wsId)
        .single();
      if (wsErr) {
        res.status(500).json({ error: wsErr.message });
        return;
      }

      let customerId = wsRow?.stripe_customer_id as string | undefined;
      if (!customerId) {
        if (wsRow?.owner_id !== res.locals.userId) {
          res.status(403).json({ error: 'Only the workspace owner can set up billing.' });
          return;
        }
        const customer = await stripe.customers.create({
          email: res.locals.userEmail,
          name: wsRow?.name || undefined,
          metadata: { workspace_id: res.locals.wsId },
        });
        customerId = customer.id;
        const { error: updateErr } = await res.locals.sb.from('workspaces').update({ stripe_customer_id: customerId }).eq('id', res.locals.wsId).select().single();
        if (updateErr) {
          res.status(403).json({ error: 'Only the workspace owner can set up billing. (' + updateErr.message + ')' });
          return;
        }
      }

      const appUrl = (process.env.APP_URL && !process.env.APP_URL.startsWith('MY_')) ? process.env.APP_URL : 'http://localhost:3000';
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: appUrl.replace(/\/$/, ''),
      });
      res.json({ success: true, url: portalSession.url });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to open Stripe billing portal: ' + (err.message || String(err)) });
    }
  });

  // GET /tiers
  router.get('/tiers', async (req: Request, res: Response) => {
    const { data, error } = await res.locals.sb.from('tier_definitions').select('*').order('sort_order');
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true, tiers: data || [] });
  });

  // GET /tier
  router.get('/tier', async (req: Request, res: Response) => {
    const ent = await getEntitlements(res);
    res.json({ success: true, entitlements: ent });
  });

  // POST /set-tier
  router.post('/set-tier', async (req: Request, res: Response) => {
    const { tierKey } = req.body as { tierKey?: string };
    if (!tierKey) {
      res.status(400).json({ error: 'tierKey is required' });
      return;
    }
    const { data, error } = await res.locals.sb.rpc('admin_set_workspace_tier', {
      p_workspace_id: res.locals.wsId,
      p_tier_key: tierKey,
    });
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(403).json({ error: 'Only the workspace owner or admin can apply a pricing plan.' });
      return;
    }
    const ent = await getEntitlements(res);
    res.json({ success: true, entitlements: ent });
  });

  return router;
}
