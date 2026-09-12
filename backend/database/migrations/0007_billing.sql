-- ============================================================================
-- Admin Panel real billing (#17). The Billing & Subscription modal was 100%
-- hardcoded ($15,000/mo, fake "Jul 15, 2026" invoices, "•••• 4242") with two
-- "Simulate Webhook" buttons that only ever flipped local React state. Stripe
-- is the source of truth for plan/subscription/invoices — this migration
-- adds just enough workspace-side state to remember WHICH Stripe customer a
-- workspace maps to, plus a cache of the last-known status so the UI has
-- something to show without round-tripping Stripe on every dashboard paint.
--
-- Same anon-RPC pattern as intake_tokens/workspace_invitations: normal reads
-- and the owner-only "link my Stripe customer" write go through the regular
-- JWT-forwarding client (RLS already covers this — ws_update is owner-only,
-- exactly the gate billing changes need). The one write that can't carry a
-- user JWT is the Stripe webhook itself (Stripe calls our server directly,
-- no Supabase session) — same shape as complete_intake_token: a narrow
-- SECURITY DEFINER RPC granted to anon that can only touch the single row
-- matching an exact stripe_customer_id, and is only ever reachable after
-- server.ts has verified the Stripe HMAC signature. No service_role key
-- introduced.
-- ============================================================================

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS billing_status text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS billing_plan text;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS billing_current_period_end timestamptz;

CREATE OR REPLACE FUNCTION public.apply_stripe_webhook_update(
    p_stripe_customer_id text,
    p_stripe_subscription_id text,
    p_status text,
    p_plan text,
    p_current_period_end timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE workspaces
    SET stripe_subscription_id = p_stripe_subscription_id,
        billing_status = p_status,
        billing_plan = COALESCE(p_plan, billing_plan),
        billing_current_period_end = p_current_period_end
    WHERE stripe_customer_id = p_stripe_customer_id;
    RETURN FOUND;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.apply_stripe_webhook_update(text, text, text, text, timestamptz) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_stripe_webhook_update(text, text, text, text, timestamptz) TO anon;
