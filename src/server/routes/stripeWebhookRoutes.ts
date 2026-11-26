import express, { Router, type Request, type Response } from 'express';
import { isStripeConfigured, isStripeWebhookConfigured, getStripeClient } from '../../lib/stripe.js';
import { getServiceRoleClient } from '../../lib/supabaseAdmin.js';

// ---------------------------------------------------------------------------
// Stripe billing webhook. A single POST route that verifies the Stripe
// signature against the RAW request body, then applies the subscription event
// through the service-role client.
//
// Extracted from server.ts (P2 increment 18 of the router-extraction
// program, see docs/OPTIMIZATION_AUDIT.md). The handler body is
// byte-preserved; the stripe + supabaseAdmin lib imports come in directly.
// The load-bearing detail is MOUNT POSITION, not this module: the
// server.ts mount must stay STRICTLY BEFORE the global express.json()
// parser, because the raw-body HMAC check (constructEvent) needs the exact
// bytes before express.json() parses and re-serializes them. That ordering
// is enforced by the mount site + a static test, not by this file.
// ---------------------------------------------------------------------------

export function createStripeWebhookRouter(): Router {
  const router = Router();

// Stripe webhook — registered BEFORE the global express.json() parser
// (the mount in server.ts sits above it). Stripe's signature verification
// (constructEvent) needs the exact raw body bytes:
// exact raw request body bytes; once express.json() has parsed and
// re-serialized it, the signature no longer matches. This is the only route
// in the app that reads a raw body instead of JSON.
router.post('/api/webhooks/stripe', express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  if (!isStripeConfigured() || !isStripeWebhookConfigured()) {
    res.status(503).json({ error: "Stripe billing is not configured on this server." });
    return;
  }
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = getStripeClient().webhooks.constructEvent(req.body, signature as string, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    return;
  }

  const obj: any = event.data.object;
  const customerId: string | undefined = typeof obj.customer === "string" ? obj.customer : obj.customer?.id;
  if (customerId && event.type.startsWith("customer.subscription.")) {
    const status = event.type === "customer.subscription.deleted" ? "canceled" : obj.status;
    const tierKey = obj.metadata?.tier_key;
    const plan = obj.items?.data?.[0]?.price?.nickname || obj.items?.data?.[0]?.price?.id || tierKey || null;
    const periodEnd = obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null;
    // Service-role client, deliberately — see the comment on getServiceRoleClient()
    // in supabaseAdmin.ts. apply_stripe_webhook_update is no longer anon-granted
    // (migration 0008), so this is the only client that can call it; the Stripe
    // HMAC check above is what actually authorizes reaching this line.
    try {
      const { error } = await getServiceRoleClient().rpc("apply_stripe_webhook_update", {
        p_stripe_customer_id: customerId,
        p_stripe_subscription_id: obj.id,
        p_status: status,
        p_plan: plan,
        p_current_period_end: periodEnd,
      });
      if (error) console.error("Failed to apply Stripe webhook update:", error.message);

      // Update actual workspace tier if tier_key was passed in the subscription metadata
      if (tierKey && (status === 'active' || status === 'trialing')) {
        const { data: wsRow } = await getServiceRoleClient()
          .from('workspaces')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
        if (wsRow) {
          await getServiceRoleClient()
            .from('workspaces')
            .update({ tier: tierKey })
            .eq('id', wsRow.id);
        }
      }
    } catch (err: any) {
      console.error("Failed to apply Stripe webhook update:", err.message);
    }
  }
  res.json({ received: true });
});

  return router;
}
